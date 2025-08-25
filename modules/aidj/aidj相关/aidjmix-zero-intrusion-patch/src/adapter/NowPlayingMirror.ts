import type { NowPlaying } from '../types/contracts';

/**
 * NowPlayingMirror —— 可选：定时从后端拉取 nowplaying，将 bpm/key/payload 广播到总线
 * 作用：当 AutoMixManager 与其它模块各自拉接口时，统一来源避免抖动。
 */
export interface MirrorConfig {
  NOWPLAYING_URL: string;  // e.g. '/api/nowplaying'
  INTERVAL_MS?: number;    // default 5000
  EventBus: any;           // UnifiedEventBus instance
}

export class NowPlayingMirror {
  private id: number | null = null;
  private lastKey = '';
  private interval = 5000;
  constructor(private cfg: MirrorConfig){
    this.interval = cfg.INTERVAL_MS ?? 5000;
  }

  attach(){
    if (this.id != null) return;
    const bus = this.cfg.EventBus;
    if (!bus) return;
    this.id = window.setInterval(()=> this.tick().catch(()=>{}), this.interval);
    this.tick().catch(()=>{});
    console.log('[mirror] attached');
  }

  detach(){
    if (this.id != null) { clearInterval(this.id); this.id = null; }
  }

  private async tick(){
    try{
      const res = await fetch(this.cfg.NOWPLAYING_URL, { cache:'no-store' });
      if (!res.ok) return;
      const np: NowPlaying = await res.json();
      const key = `${np.artist||''} - ${np.title||''} @${np.bpm||''}`;
      if (key && key !== this.lastKey){
        this.lastKey = key;
        this.cfg.EventBus.emit({ namespace:'automix', type:'transition', timestamp: Date.now(), data: { action:'next', toTrack: key, segment: np.segment||'steady' } });
      }
      if (typeof np.bpm === 'number') this.cfg.EventBus.emitBpm(np.bpm);
    }catch{}
  }
}
