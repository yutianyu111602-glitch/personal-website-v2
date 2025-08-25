import { TrackFeature } from './types.js'; import { compatScore } from './score.js'; import { LIMITS } from './config.js';
type Path={seq:TrackFeature[]; sum:number;}; const minutes=(s:TrackFeature[])=>s.reduce((x,t)=>x+t.durationSec,0)/60; const avg=(p:Path)=>p.seq.length<=1?0:p.sum/(p.seq.length-1);
const seed=(tr:TrackFeature[],k:number)=>{ const c=tr.filter(t=>t.bpm>=LIMITS.bpmSoftLo&&t.bpm<=LIMITS.bpmSoftHi); const s=(c.length?c:tr).sort((a,b)=>Math.abs(a.bpm-LIMITS.bpmIdeal)-Math.abs(b.bpm-LIMITS.bpmIdeal)); return s.slice(0,k); };
export function beamSearch(tracks:TrackFeature[], targetMinutes:number, beamWidth:number){ if(!tracks.length) return [];
  let paths:Path[]=seed(tracks, Math.min(beamWidth, Math.max(1, Math.floor(tracks.length/4)))).map(s=>({seq:[s], sum:0})); let best=paths[0];
  while(paths.length){ const next:Path[]=[]; for(const p of paths){ if(minutes(p.seq)>=targetMinutes){ if(avg(p)>avg(best)) best=p; continue; }
      const used=new Set(p.seq.map(t=>t.id)); const cur=p.seq[p.seq.length-1];
      const cand=tracks.filter(t=>!used.has(t.id)).map(t=>({t,s: compatScore(cur,t)})).sort((a,b)=>b.s-a.s).slice(0, beamWidth);
      for(const c of cand) next.push({seq:[...p.seq, c.t], sum: p.sum + c.s}); }
    next.sort((a,b)=>avg(b)-avg(a)); paths=next.slice(0, beamWidth); for(const p of paths){ if(avg(p)>avg(best)) best=p; } if(!paths.length) break; }
  return best.seq; }
