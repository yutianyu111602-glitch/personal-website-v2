import { TrackFeature, TransitionPlan, PlaylistItem } from './types.js'; import { TRANSITION } from './config.js';
export function planTransitions(seq:TrackFeature[], techno=true):TransitionPlan{
  const items:PlaylistItem[]=[]; for(let i=0;i<seq.length;i++){ const cur=seq[i], nxt=seq[i+1];
    const cross=nxt? (techno? TRANSITION.technoCrossfadeBeats: TRANSITION.defaultCrossfadeBeats): 0;
    const it:PlaylistItem={ track:cur, startAt: cur.cueInSec ?? 0, endAt: cur.cueOutSec ?? cur.durationSec, crossfadeBeats: cross,
      automation: nxt? [{type:'filter',mode:'hipass_ramp',from_hz:80,to_hz:260,duration_beats:cross}]: [] };
    items.push(it); }
  const total=items.reduce((s,it)=>s+((it.endAt??it.track.durationSec)-(it.startAt??0)),0); return { items, totalSec: total, avgScore: 0 }; }
