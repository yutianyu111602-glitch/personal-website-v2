import { TransitionPlan } from '../types.js';
export function toTXT(plan: TransitionPlan){ const lines:string[]=[]; lines.push(`# AutoMix Playlist ${new Date().toISOString()}`);
  lines.push(`# totalSec=${Math.round(plan.totalSec)} avgScore=${plan.avgScore.toFixed(3)}`); lines.push('');
  plan.items.forEach((it,idx)=>{ lines.push(`${idx+1}. ${it.track.title ?? it.track.id} | ${it.track.artist ?? ''} | bpm=${it.track.bpm} | key=${it.track.keyCamelot}`); });
  return lines.join('\n'); }