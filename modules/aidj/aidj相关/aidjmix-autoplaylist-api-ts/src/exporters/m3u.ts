import { TransitionPlan } from '../types.js';
export function toM3U(plan: TransitionPlan){ const lines=['#EXTM3U']; for(const it of plan.items){ const dur=Math.round((it.endAt??it.track.durationSec)-(it.startAt??0));
  const title=`${it.track.artist ?? ''} - ${it.track.title ?? it.track.id}`.trim(); lines.push(`#EXTINF:${dur},${title}`); lines.push(it.track.path); } return lines.join('\n'); }