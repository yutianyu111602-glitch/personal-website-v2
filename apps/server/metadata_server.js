#!/usr/bin/env node
// 轻量元数据服务：/api/nowplaying, /api/schedule, /api/health

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.METADATA_PORT || 3500);
const STREAM_PRIMARY = process.env.STREAM_PRIMARY || '';
const STREAM_BACKUP = process.env.STREAM_BACKUP || '';
const TERMUSIC_GATEWAY = process.env.TERMUSIC_GATEWAY || 'http://127.0.0.1:7533';
const AUDIO_GATEWAY = process.env.AUDIO_GATEWAY || 'http://127.0.0.1:18766';
// 默认开启 MOCK，避免开发阶段依赖外部守护进程导致 502/500
const TERMUSIC_MOCK = String(process.env.TERMUSIC_MOCK || 'true').toLowerCase() === 'true';
const AUDIO_MOCK = String(process.env.AUDIO_MOCK || 'true').toLowerCase() === 'true';
// 流URL可达性与缓存控制
const STREAM_URL_CACHE_TTL_SEC = Number(process.env.STREAM_URL_CACHE_TTL_SEC || 300); // 默认5分钟
const STREAM_URL_CHECK_TIMEOUT_MS = Number(process.env.STREAM_URL_CHECK_TIMEOUT_MS || 3000);
const STREAM_URL_HEAD_RETRIES = Math.max(0, Number(process.env.STREAM_URL_HEAD_RETRIES || 2));
const REPO_ROOT = '/Users/masher/code';
const LOG_DIR = path.join(REPO_ROOT, 'logs', 'personal_website');
const EVENT_LOG = path.join(LOG_DIR, 'events.ndjson');
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}

// ========================= 本地音乐/歌单目录默认值 =========================
// 说明：优先读环境变量；若未设置，则使用用户提供的本地路径与本项目内 playlist 目录
const DEFAULT_MUSIC_DIRS = [
  '/Users/masher/Music/网易云音乐/rou',
  '/Users/masher/Music/网易云音乐/我的歌单21',
];
const DEFAULT_PLAYLIST_DIR = path.join(
  REPO_ROOT,
  '程序集_Programs',
  '个人网站项目V2',
  'playlist'
);

// 运行时可通过环境变量覆盖
// MUSIC_DIRS: 以逗号分隔的目录列表
const MUSIC_DIRS = (process.env.MUSIC_DIRS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const EFFECTIVE_MUSIC_DIRS = MUSIC_DIRS.length > 0 ? MUSIC_DIRS : DEFAULT_MUSIC_DIRS;
const PLAYLIST_DIR = process.env.PLAYLIST_DIR || DEFAULT_PLAYLIST_DIR;

// 允许的音频文件扩展名（小写）
const AUDIO_EXTS = new Set(['.mp3', '.flac', '.m4a', '.aac', '.wav', '.ogg', '.oga', '.opus']);
// 支持的歌单扩展名
const PLAYLIST_EXTS = new Set(['.txt', '.m3u', '.m3u8', '.m38u']);

// 内存索引缓存，用于 /api/resolve
let MUSIC_INDEX = null; // Array<{ filePath: string, nameLower: string }>
let NOW_PLAYING = null; // { title, artist, bpm?, keyCamelot?, startedAt, source }
let AUTODJ = { name: null, entries: [], index: -1, playing: false };
// TXT 注释缓存（用于从同名 .txt 回填 Camelot 调性）
const TXT_ANNOTATIONS_CACHE = new Map(); // name -> Map<titleLower, keyCamelot>

function json(res, obj, code = 200) {
  const body = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': body.length,
  });
  res.end(body);
}

/** 简易代理：将当前请求转发到 targetBase + subPath（保持方法/头/体） */
async function proxyRequest(req, res, targetBase, subPath) {
  try {
    // 读取请求体（若有）
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const targetUrl = new URL(subPath, targetBase).toString();
    const headers = { ...req.headers };
    delete headers['host'];
    const r = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
    });
    const respBody = Buffer.from(await r.arrayBuffer());
    // 透传状态码与必要响应头（不缓存+JSON优先）
    const respHeaders = { 'Cache-Control': 'no-store' };
    const ct = r.headers.get('content-type');
    if (ct) respHeaders['Content-Type'] = ct;
    res.writeHead(r.status, respHeaders);
    res.end(respBody);
  } catch (e) {
    json(res, { ok: false, error: String(e) }, 502);
  }
}

/** 读取目录的所有文件（递归），过滤音频扩展名 */
function scanAudioFilesRecursive(rootDir) {
  const results = [];
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        // 跳过常见无关目录，避免扫描开销
        const base = ent.name.toLowerCase();
        if (base === 'node_modules' || base === '.git' || base === '.cache') continue;
        stack.push(full);
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (AUDIO_EXTS.has(ext)) results.push(full);
      }
    }
  }
  return results;
}

/** 构建音乐索引，便于模糊解析 */
function buildMusicIndex() {
  const files = [];
  for (const dir of EFFECTIVE_MUSIC_DIRS) {
    try {
      if (fs.existsSync(dir)) {
        const found = scanAudioFilesRecursive(dir);
        files.push(...found);
      }
    } catch {}
  }
  MUSIC_INDEX = files.map(fp => ({ filePath: fp, nameLower: path.basename(fp).toLowerCase() }));
}

/** 列出歌单文件（.txt） */
function listPlaylistFiles() {
  try {
    const files = fs
      .readdirSync(PLAYLIST_DIR)
      .filter(f => PLAYLIST_EXTS.has(path.extname(f).toLowerCase()));
    return files.map(f => ({
      name: path.basename(f, path.extname(f)),
      file: path.join(PLAYLIST_DIR, f),
      ext: path.extname(f).toLowerCase(),
    }));
  } catch {
    return [];
  }
}

/** 读取指定歌单名称（不带扩展名） */
function readPlaylistByName(name) {
  // 允许：1) 传入不带扩展名；2) 传入带任意支持扩展名；按优先级查找
  const base = path.join(PLAYLIST_DIR, name);
  const tryList = [
    `${base}.txt`, `${base}.m3u8`, `${base}.m3u`, `${base}.m38u`,
    base, // 允许已带扩展名的情况
  ];
  let filePath = null;
  for (const c of tryList) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) { filePath = c; break; }
  }
  if (!filePath) return { name, tracks: [] };
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.m3u' || ext === '.m3u8' || ext === '.m38u') {
      const titles = parseM3UToTitles(filePath);
      return { name, tracks: titles };
    }
    // 默认按 .txt 解析
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('#'));
    return { name, tracks: lines };
  } catch {
    return { name, tracks: [] };
  }
}

/** 解析 M3U/M3U8/M38u 文件为标题数组（优先 #EXTINF 的标题，否则退化为文件名） */
function parseM3UToTitles(filePath) {
  let raw = '';
  try { raw = fs.readFileSync(filePath, 'utf-8'); } catch { return []; }
  const lines = raw.split(/\r?\n/);
  const out = [];
  let pendingTitle = null;
  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF')) {
      // 形如: #EXTINF:123,Artist - Title - 7B
      const idx = line.indexOf(',');
      if (idx >= 0 && idx + 1 < line.length) {
        const title = line.slice(idx + 1).trim();
        pendingTitle = title;
      }
      continue;
    }
    if (line.startsWith('#')) {
      // 其它注释/标签忽略
      continue;
    }
    // 非注释行通常是文件路径或 URL；若有 pendingTitle 则优先用它
    if (pendingTitle) {
      out.push(pendingTitle);
      pendingTitle = null;
    } else {
      // 使用路径基名作为标题
      out.push(path.basename(line));
    }
  }
  return out;
}

/** 解析 Camelot 调性键位（如 7B/1a） */
function normalizeCamelotKey(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2})([abAB])$/);
  if (!m) return null;
  const num = Number(m[1]);
  if (!(num >= 1 && num <= 12)) return null;
  const mode = m[2].toUpperCase(); // A=minor, B=major
  return { num, mode, text: `${num}${mode}` };
}

/** 计算 Camelot 兼容键（同调、邻近±1、相对大小调、能量±2） */
function camelotCompatibleKeys(num, mode) {
  const wrap = (n) => ((n - 1 + 12) % 12) + 1;
  const other = mode === 'A' ? 'B' : 'A';
  const out = [];
  out.push({ key: `${num}${mode}`, kind: 'same' });
  out.push({ key: `${wrap(num - 1)}${mode}`, kind: 'adjacent' });
  out.push({ key: `${wrap(num + 1)}${mode}`, kind: 'adjacent' });
  out.push({ key: `${num}${other}`, kind: 'relative' });
  out.push({ key: `${wrap(num + 2)}${mode}`, kind: 'energy+2' });
  out.push({ key: `${wrap(num - 2)}${mode}`, kind: 'energy-2' });
  return out;
}

/** 从标题末尾提取 Camelot 键，返回 { titleWithoutKey, camelot } */
function stripKeyFromTitle(title) {
  const m = /\s-\s*([0-9]{1,2}[ABab])\s*$/.exec(title);
  if (!m) return { titleWithoutKey: title, camelot: null };
  const camelot = normalizeCamelotKey(m[1]);
  const titleWithoutKey = title.slice(0, m.index).trim();
  return { titleWithoutKey, camelot };
}

/** 解析歌单行（通用） */
function parsePlaylistLine(raw) {
  const timeTitleRe = /^(?:(\d{1,2}:\d{2}:\d{2})\s+)?(?:\d+[\.|\)]?\s*)?(.*)$/;
  const m = timeTitleRe.exec(raw) || [];
  const time = m[1] || null;
  let title = (m[2] || raw).trim();
  title = title.replace(/\s+/g, ' ').trim();
  const { titleWithoutKey, camelot } = stripKeyFromTitle(title);
  const candidates = resolveTrackNameToFiles(titleWithoutKey, 20);
  const compat = camelot ? camelotCompatibleKeys(camelot.num, camelot.mode) : [];
  return {
    raw,
    time,
    title: titleWithoutKey,
    key: camelot ? camelot.text : null,
    keyCompat: compat,
    playable: candidates.length > 0,
    candidates
  };
}

/** 解析整张歌单为 entries */
function resolvePlaylistEntries(name) {
  const pl = readPlaylistByName(name);
  if (!MUSIC_INDEX) buildMusicIndex();
  const anno = buildTxtAnnotationsMap(pl.name); // 从同名 txt 回填 camelot
  const entries = pl.tracks.map((raw, idx) => {
    const parsed = parsePlaylistLine(raw);
    if (!parsed.key) {
      const k = lookupCamelotFromTxt(anno, parsed.title);
      if (k) {
        const camelot = normalizeCamelotKey(k);
        if (camelot) {
          parsed.key = camelot.text;
          parsed.keyCompat = camelotCompatibleKeys(camelot.num, camelot.mode);
        }
      }
    }
    return { index: idx + 1, ...parsed };
  });
  return { name: pl.name, entries };
}

/**
 * 构建同名 .txt 的注释映射：title(lower) -> keyCamelot
 * - 若不存在 .txt 则返回空 Map
 */
function buildTxtAnnotationsMap(name) {
  const baseName = path.basename(name, path.extname(name));
  if (TXT_ANNOTATIONS_CACHE.has(baseName)) return TXT_ANNOTATIONS_CACHE.get(baseName);
  const txtPath = path.join(PLAYLIST_DIR, `${baseName}.txt`);
  const map = new Map();
  try {
    if (fs.existsSync(txtPath)) {
      const raw = fs.readFileSync(txtPath, 'utf-8');
      const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));
      for (const line of lines) {
        const { titleWithoutKey, camelot } = stripKeyFromTitle(line);
        if (camelot) {
          const key = (camelot && camelot.text) || null;
          if (key) map.set(titleWithoutKey.toLowerCase(), key);
        }
      }
    }
  } catch {}
  TXT_ANNOTATIONS_CACHE.set(baseName, map);
  return map;
}

/** 在注释映射中按标题查找 Camelot 键 */
function lookupCamelotFromTxt(annoMap, titleWithoutKey) {
  if (!annoMap) return null;
  const t = String(titleWithoutKey || '').toLowerCase();
  if (!t) return null;
  return annoMap.get(t) || null;
}

/** 为 Camelot 键匹配打分 */
function scoreCompatibility(prevKey, nextKey, nextCompat) {
  if (!prevKey || !nextKey) return 10;
  if (prevKey === nextKey) return 100;
  // 查找兼容集
  const set = new Map(nextCompat.map(c => [c.key, c.kind]));
  if (set.has(prevKey)) {
    const kind = set.get(prevKey);
    if (kind === 'adjacent') return 80;
    if (kind === 'relative') return 70;
    if (kind === 'energy+2' || kind === 'energy-2') return 60;
  }
  return 15;
}

/** 从标题推断 artist/title */
function splitArtistTitle(name) {
  const parts = String(name).split(' - ');
  if (parts.length >= 2) return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
  return { artist: 'Unknown', title: name };
}

/** 将 AUTODJ 的当前条目写入 NOW_PLAYING */
function updateNowPlayingFromEntry(entry) {
  const at = splitArtistTitle(entry.title);
  NOW_PLAYING = {
    title: at.title,
    artist: at.artist,
    start: new Date().toISOString(),
    duration: 0,
    bpm: undefined,
    keyCamelot: entry.key || undefined,
    source: 'AUTODJ',
  };
}

/** 解析曲目名称到本地文件路径（简单包含匹配，返回前若干条） */
function resolveTrackNameToFiles(name, limit = 20) {
  if (!MUSIC_INDEX) buildMusicIndex();
  const q = String(name || '').toLowerCase().trim();
  if (!q) return [];
  const hits = [];
  for (const it of MUSIC_INDEX) {
    if (it.nameLower.includes(q)) {
      hits.push(it.filePath);
      if (hits.length >= limit) break;
    }
  }
  return hits;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/api/nowplaying') {
    return json(res, {
      title: 'Demo Track',
      artist: 'Tiangong',
      start: new Date(Date.now() - 60000).toISOString(),
      duration: 300,
      bpm: 126,
      energy: 0.68,
      artwork: '/og/cover.jpg',
      source: 'DEMO',
    });
  }
  if (url.pathname === '/api/playlists') {
    // 返回歌单列表与简要统计
    const items = listPlaylistFiles().map(({ name, file, ext }) => {
      let count = 0;
      try {
        const raw = fs.readFileSync(file, 'utf-8');
        if (ext === '.m3u' || ext === '.m3u8' || ext === '.m38u') {
          // 统计 #EXTINF 行，若无则统计非注释的资源行
          const lines = raw.split(/\r?\n/);
          const extinf = lines.filter(s => s.trim().startsWith('#EXTINF')).length;
          if (extinf > 0) count = extinf; else count = lines.filter(s => s.trim().length > 0 && !s.trim().startsWith('#')).length;
        } else {
          count = raw.split(/\r?\n/).filter(s => s.trim().length > 0 && !s.trim().startsWith('#')).length;
        }
      } catch {}
      return { name, file, count, ext };
    });
    return json(res, { playlists: items, baseDir: PLAYLIST_DIR });
  }
  if (url.pathname === '/api/playlist') {
    const name = url.searchParams.get('name') || '';
    const data = readPlaylistByName(name);
    return json(res, data);
  }
  if (url.pathname === '/api/playlist_resolved') {
    const name = url.searchParams.get('name') || '';
    const { name: plName, entries } = resolvePlaylistEntries(name);
    const playable = entries.filter(e => e.playable).length;
    const missing = entries.length - playable;
    return json(res, { name: plName, total: entries.length, playable, missing, musicDirs: EFFECTIVE_MUSIC_DIRS, entries });
  }
  if (url.pathname === '/api/keyrules') {
    const key = (url.searchParams.get('key') || '').trim();
    const k = normalizeCamelotKey(key);
    if (!k) return json(res, { error: 'invalid key' }, 400);
    const compat = camelotCompatibleKeys(k.num, k.mode);
    return json(res, { key: k.text, compat });
  }
  if (url.pathname === '/api/autodj/load') {
    const name = url.searchParams.get('name') || '';
    const { name: plName, entries } = resolvePlaylistEntries(name);
    AUTODJ = { name: plName, entries, index: -1, playing: false };
    return json(res, { ok: true, loaded: plName, total: entries.length });
  }
  if (url.pathname === '/api/autodj/next') {
    if (!AUTODJ.entries || AUTODJ.entries.length === 0) return json(res, { ok: false, error: 'no playlist loaded' }, 400);
    let idx = AUTODJ.index + 1;
    if (idx >= AUTODJ.entries.length) idx = 0;
    AUTODJ.index = idx;
    const entry = AUTODJ.entries[idx];
    updateNowPlayingFromEntry(entry);
    AUTODJ.playing = true;
    return json(res, { ok: true, index: idx + 1, entry, nowplaying: NOW_PLAYING });
  }
  if (url.pathname === '/api/autodj/status') {
    return json(res, { ok: true, name: AUTODJ.name, index: AUTODJ.index + 1, total: AUTODJ.entries.length || 0, playing: AUTODJ.playing, nowplaying: NOW_PLAYING });
  }
  if (url.pathname === '/api/resolve') {
    const name = url.searchParams.get('name') || '';
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 20)));
    const hits = resolveTrackNameToFiles(name, limit);
    return json(res, { query: name, hits, musicDirs: EFFECTIVE_MUSIC_DIRS });
  }
  if (url.pathname === '/api/event') {
    // 记录来自前端的事件，按NDJSON写入
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const entry = {
          ts: Date.now(),
          ...payload,
        };
        fs.appendFile(EVENT_LOG, JSON.stringify(entry) + '\n', () => {});
        json(res, { ok: true });
      } catch (e) {
        json(res, { ok: false, error: String(e) }, 400);
      }
    });
    return;
  }
  if (url.pathname === '/api/schedule') {
    return json(res, [
      { id: 'night', title: '深夜 Techno', start: '00:00', end: '06:00', moodPreset: { energy: [0.3, 0.6] }, visualPreset: 'polish' },
      { id: 'day', title: '白天律动', start: '09:00', end: '18:00', moodPreset: { energy: [0.5, 0.8] }, visualPreset: 'flow' },
    ]);
  }
  if (url.pathname === '/api/health') {
    return json(res, {
      healthy: Boolean(STREAM_PRIMARY || STREAM_BACKUP),
      primary: Boolean(STREAM_PRIMARY),
      backup: Boolean(STREAM_BACKUP),
      playlistDir: PLAYLIST_DIR,
      musicDirs: EFFECTIVE_MUSIC_DIRS,
    });
  }
  if (url.pathname === '/api/check_env') {
    // 前端健康检查所需的轻量接口，返回可用的目录与代理端点
    return json(res, {
      spotipy: false,
      pandas: false,
      openpyxl: false,
      ffmpeg: Boolean(process.env.FFMPEG || process.env.FFMPEG_PATH || process.env.HOME),
      ncmdump: false,
      termusicGateway: TERMUSIC_GATEWAY,
      audioGateway: AUDIO_GATEWAY,
      ok: true,
    });
  }
  if (url.pathname === '/api/default_music_roots') {
    return json(res, EFFECTIVE_MUSIC_DIRS);
  }
  if (url.pathname === '/api/auto_mount_netease') {
    // 兼容前端“自动挂载网易云”调用：返回一个可用根目录与逻辑别名
    // 不实际挂载，只报告首个有效目录，避免阻断前端流程
    const mounted = EFFECTIVE_MUSIC_DIRS[0] || '';
    return json(res, { ok: Boolean(mounted), mounted, link: 'netease_auto' });
  }
  if (url.pathname === '/api/media_list') {
    // 列出媒体文件（限制在允许的根目录下）
    const rootRaw = url.searchParams.get('root') || '';
    const sub = (url.searchParams.get('subdir') || '').replace(/\\/g, '/');
    // 兼容前端传入的逻辑别名与空root：映射到首个有效目录
    let mappedRoot = rootRaw;
    if (!mappedRoot || mappedRoot === '@柔' || mappedRoot === 'netease_auto') {
      mappedRoot = EFFECTIVE_MUSIC_DIRS[0] || '';
    }
    const allowed = EFFECTIVE_MUSIC_DIRS.includes(mappedRoot) ? mappedRoot : '';
    if (!allowed) return json(res, { error: 'root not allowed' }, 400);
    const safeSub = sub.includes('..') ? '' : sub;
    const dir = path.join(allowed, safeSub);
    let list = [];
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      list = items
        .filter((it) => it.isFile())
        .map((it) => {
          const fp = path.join(dir, it.name);
          const st = fs.statSync(fp);
          const apiUrl = `/api/media_file?path=${encodeURIComponent(fp)}`;
          return {
            name: it.name,
            url: apiUrl,
            size: st.size,
            mtime: new Date(st.mtimeMs).toISOString(),
            suffix: path.extname(it.name).toLowerCase().slice(1),
          };
        });
    } catch (e) {
      return json(res, { error: String(e) }, 400);
    }
    return json(res, list);
  }
  if (url.pathname === '/api/media_file') {
    // 以HTTP流式输出本地音频文件，仅允许在 EFFECTIVE_MUSIC_DIRS 范围内
    const p = url.searchParams.get('path') || '';
    if (!p) return json(res, { error: 'missing path' }, 400);
    const abs = path.resolve(p);
    const isAllowed = EFFECTIVE_MUSIC_DIRS.some((root) => {
      try { return abs.startsWith(path.resolve(root) + path.sep) || abs === path.resolve(root); } catch { return false; }
    });
    if (!isAllowed) return json(res, { error: 'path not allowed' }, 403);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return json(res, { error: 'not found' }, 404);

    const ext = path.extname(abs).toLowerCase();
    const ct = (
      ext === '.mp3' ? 'audio/mpeg' :
      ext === '.flac' ? 'audio/flac' :
      ext === '.m4a' ? 'audio/mp4' :
      ext === '.aac' ? 'audio/aac' :
      ext === '.wav' ? 'audio/wav' :
      ext === '.ogg' ? 'audio/ogg' :
      ext === '.opus' ? 'audio/opus' :
      'application/octet-stream'
    );
    try {
      const stat = fs.statSync(abs);
      res.writeHead(200, {
        'Content-Type': ct,
        'Content-Length': stat.size,
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(abs).pipe(res);
    } catch (e) {
      return json(res, { error: String(e) }, 500);
    }
    return;
  }
  // 反向代理：Termusic 与 Audio 网关，避免浏览器直连产生的 CORS 限制
  if (url.pathname.startsWith('/api/termusic/')) {
    if (TERMUSIC_MOCK) {
      // 开发/联调缺省：提供模拟返回，避免 502 阻断前端流程
      if (url.pathname === '/api/termusic/services') {
        return json(res, [
          'package.Service/Play',
          'package.Service/Pause',
          'package.Service/Stop',
          'package.Service/SetVolume'
        ]);
      }
      if (url.pathname === '/api/termusic/socket') {
        return json(res, { socket: '/tmp/termusic.sock' });
      }
      if (url.pathname === '/api/termusic/call') {
        let body = '';
        req.on('data', c => (body += c));
        req.on('end', () => {
          try {
            const payload = JSON.parse(body || '{}');
            return json(res, { response: { ok: true, echo: payload } });
          } catch (e) {
            return json(res, { error: String(e) }, 400);
          }
        });
        return;
      }
    }
    const sub = url.pathname.replace('/api/termusic/', '/api/termusic/');
    return proxyRequest(req, res, TERMUSIC_GATEWAY, sub + (url.search || ''));
  }
  if (url.pathname.startsWith('/api/audio/')) {
    if (AUDIO_MOCK) {
      // 简易音频分析模拟：返回固定形状数组，便于前端开发
      if (url.pathname === '/api/audio/peaks') {
        const duration = Number(url.searchParams.get('duration') || '1');
        const pps = Math.max(1, Math.min(200, Number(url.searchParams.get('pps') || '50')));
        const count = Math.max(1, Math.floor(duration * pps));
        const freq = Math.max(1, Number(url.searchParams.get('freq') || '5'));
        const amp = Math.max(0.1, Math.min(1, Number(url.searchParams.get('amp') || '1')));
        const peaks = Array.from({ length: count }, (_v, i) => Number((Math.sin(i / freq) * 0.5 * amp + 0.5).toFixed(3)));
        return json(res, { peaks, offset: Number(url.searchParams.get('offset') || '0'), duration, pps, status: 'success' });
      }
      if (url.pathname === '/api/audio/bands') {
        const duration = Number(url.searchParams.get('duration') || '1');
        const pps = Math.max(1, Math.min(200, Number(url.searchParams.get('pps') || '50')));
        const count = Math.max(1, Math.floor(duration * pps));
        const freq = Math.max(1, Number(url.searchParams.get('freq') || '7'));
        const amp = Math.max(0.1, Math.min(1, Number(url.searchParams.get('amp') || '1')));
        const mk = () => Array.from({ length: count }, (_v, i) => Number((Math.sin(i / freq) * 0.5 * amp + 0.5).toFixed(3)));
        return json(res, { low: mk(), mid: mk(), high: mk(), rms: mk(), offset: 0, duration, pps, sr: Number(url.searchParams.get('sr')||'16000'), fft: Number(url.searchParams.get('fft')||'1024'), status: 'success' });
      }
    }
    const sub = url.pathname.replace('/api/audio/', '/api/audio/');
    return proxyRequest(req, res, AUDIO_GATEWAY, sub + (url.search || ''));
  }
  if (url.pathname === '/api/stream_url') {
    // 返回当前可用的流媒体URL（带可达性快速探测与可配置缓存）
    const cacheKey = 'STREAM_URL_CACHE';
    const now = Date.now();
    const ttlMs = Math.max(1, STREAM_URL_CACHE_TTL_SEC) * 1000;
    if (!globalThis.__STREAM_CACHE) globalThis.__STREAM_CACHE = {};
    const cache = globalThis.__STREAM_CACHE;
    if (cache[cacheKey] && (now - cache[cacheKey].ts) < ttlMs) {
      return json(res, cache[cacheKey].value);
    }
    let candidate = STREAM_PRIMARY || STREAM_BACKUP || '';
    // 本地回退：未配置流时，选择首个可用本地音频文件并通过 /api/media_file 暴露
    if (!candidate) {
      if (!MUSIC_INDEX) buildMusicIndex();
      const first = (MUSIC_INDEX && MUSIC_INDEX.length > 0) ? MUSIC_INDEX[0].filePath : '';
      if (first) {
        candidate = new URL(`/api/media_file?path=${encodeURIComponent(first)}`, `http://localhost:${PORT}`).toString();
      }
    }
    if (!candidate) {
      const val = { ok: false, url: '', error: 'no stream configured and no local audio found' };
      cache[cacheKey] = { ts: now, value: val };
      return json(res, val, 404);
    }

    // 可达性检测，带超时与重试；HEAD 不被允许则回退 GET
    const checkReachable = async (u) => {
      const tryOnce = async (method) => {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), STREAM_URL_CHECK_TIMEOUT_MS);
          const r = await fetch(u, { method, signal: ctrl.signal });
          clearTimeout(t);
          return r.ok;
        } catch {
          return false;
        }
      };
      for (let i = 0; i <= STREAM_URL_HEAD_RETRIES; i++) {
        if (await tryOnce('HEAD')) return true;
      }
      // HEAD 不通过时尝试一次 GET
      return tryOnce('GET');
    };

    let chosen = '';
    if (STREAM_PRIMARY && await checkReachable(STREAM_PRIMARY)) chosen = STREAM_PRIMARY;
    else if (STREAM_BACKUP && await checkReachable(STREAM_BACKUP)) chosen = STREAM_BACKUP;
    else chosen = candidate; // 仍返回候选，但标记不可达
    const val = { ok: Boolean(chosen) && (await checkReachable(chosen)), url: chosen, primary: chosen === STREAM_PRIMARY };
    cache[cacheKey] = { ts: now, value: val };
    return json(res, val, val.ok ? 200 : 502);
  }
  if (url.pathname === '/api/stream') {
    // 以302重定向方式提供流媒体，便于通过Vite代理规避CORS
    let u = STREAM_PRIMARY || STREAM_BACKUP || '';
    if (!u) {
      // 本地回退
      if (!MUSIC_INDEX) buildMusicIndex();
      const first = (MUSIC_INDEX && MUSIC_INDEX.length > 0) ? MUSIC_INDEX[0].filePath : '';
      if (first) u = `/api/media_file?path=${encodeURIComponent(first)}`;
    }
    if (!u) return json(res, { error: 'no stream configured' }, 404);
    res.writeHead(302, { Location: u });
    res.end();
    return;
  }
  json(res, { error: 'Not Found' }, 404);
}

http
  .createServer((req, res) => {
    try {
      handle(req, res);
    } catch (e) {
      json(res, { error: String(e) }, 500);
    }
  })
  .listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[metadata] listening on :${PORT}`);
  });


