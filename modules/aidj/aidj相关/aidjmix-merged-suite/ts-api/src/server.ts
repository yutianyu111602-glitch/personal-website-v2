import express from 'express'; import { beamSearch } from './search.js'; import { planTransitions } from './transitions.js'; import { toM3U } from './exporters/m3u.js'; import { toTXT } from './exporters/txt.js';
import { applyPreset } from './presets.js';
const app = express(); app.use(express.json({ limit: '10mb' }));
app.post('/api/aidjmix/autoplaylist', (req,res)=>{ const { tracks=[], minutes=60, beamWidth=24, preset='classic', simpleHeadTail=false } = req.body||{};
  applyPreset(preset);
  const seq = beamSearch(tracks, minutes, beamWidth); const plan = planTransitions(seq, true, !!simpleHeadTail); const m3u = toM3U(plan); const txt = toTXT(plan);
  res.json({ ok:true, plan, m3u, txt }); });
const PORT = Number(process.env.PORT||8787); app.listen(PORT, ()=>console.log(`[aidjmix-api] :${PORT}`));
