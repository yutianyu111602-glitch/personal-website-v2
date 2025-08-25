import { create } from 'zustand';
import type { PresetName, TechniqueName, EmotionState, RadioParams, NowPlaying, AutoPlanMeta } from '../types/shared';
type PanelState = 'hidden'|'peeking'|'open';
interface ConsoleState {
  panel:PanelState;
  preset:PresetName;
  technique:TechniqueName;
  simpleHeadTail:boolean;
  emotion:EmotionState;
  radio:RadioParams;
  now:NowPlaying;
  plan:AutoPlanMeta;
  set:(p:Partial<ConsoleState>)=>void;
  toggle:()=>void;
}
export const useConsoleStore = create<ConsoleState>((set,get)=>({
  panel:'hidden',
  preset:'classic',
  technique:'bass_swap',
  simpleHeadTail:false,
  emotion:{ energy:0.6, valence:0, arousal:0.5, preset:'classic' },
  radio:{ stationName:'', uptimeSec:0, listeners:0, dropoutRate:0, avgBpm:128 },
  now:{ title:'', artist:'', bpm:128, keyCamelot:'8A', startedAt:Date.now(), segment:'steady' },
  plan:{ count:0, minutes:60, preset:'classic', technique:'bass_swap' },
  set:(p)=>set(p),
  toggle:()=> set({ panel: get().panel==='open' ? 'hidden' : 'open' }),
}));
