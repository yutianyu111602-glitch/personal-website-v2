// 逻辑-only 预设轮换（无端口）：时间段 + Telemetry 影响 simpleHeadTail
export type PresetName = 'deep_minimal' | 'classic' | 'peak_warehouse' | 'hard_techno' | 'hypnotic';
export interface RotationSlot { startHour:number; endHour:number; preset:PresetName; simpleHeadTail?:boolean; notes?:string; }
export interface Telemetry { listeners?:number; dropoutRate?:number; recentErrors?:number; avgBpm?:number; }
export interface Selection { preset:PresetName; simpleHeadTail:boolean; reason:string[]; }
export const DEFAULT_ROTATION: RotationSlot[] = [
  { startHour:0, endHour:6, preset:'deep_minimal', simpleHeadTail:true, notes:'late night low-key' },
  { startHour:6, endHour:12, preset:'classic', notes:'daytime baseline' },
  { startHour:12, endHour:18, preset:'peak_warehouse', notes:'afternoon energy' },
  { startHour:18, endHour:22, preset:'peak_warehouse', notes:'prime time' },
  { startHour:22, endHour:24, preset:'hypnotic', simpleHeadTail:true, notes:'late evening layers' },
];
const inRange=(h:number,s:RotationSlot)=> s.startHour < s.endHour ? (h>=s.startHour && h<s.endHour) : (h>=s.startHour || h<s.endHour);
export function selectPreset(localDate:Date, rotation:RotationSlot[]=DEFAULT_ROTATION, telemetry?:Telemetry):Selection{
  const h = localDate.getHours();
  const slot = rotation.find(s=>inRange(h,s)) ?? rotation[0];
  const reason = [`time:${h}:00 in [${slot.startHour},${slot.endHour}) → ${slot.preset}`];
  let simple = !!slot.simpleHeadTail;
  if (telemetry?.recentErrors && telemetry.recentErrors>0){ simple=true; reason.push('recentErrors>0 → simpleHeadTail'); }
  if (typeof telemetry?.dropoutRate==='number' && telemetry.dropoutRate>0.05){ simple=true; reason.push('dropout>5% → simple'); }
  if (typeof telemetry?.avgBpm==='number'){ if (telemetry.avgBpm>=132 && ['deep_minimal','classic','hypnotic'].includes(slot.preset)) return { preset:'peak_warehouse', simpleHeadTail:simple, reason:[...reason, `avgBpm=${telemetry.avgBpm} ↑`] }; if (telemetry.avgBpm<=126 && ['peak_warehouse','hard_techno'].includes(slot.preset)) return { preset:'classic', simpleHeadTail:simple, reason:[...reason, `avgBpm=${telemetry.avgBpm} ↓`] }; }
  return { preset:slot.preset, simpleHeadTail:simple, reason };
}
export function minutesUntilNextChange(localDate:Date, rotation:RotationSlot[]=DEFAULT_ROTATION){ const h=localDate.getHours(), m=localDate.getMinutes(); const cur=rotation.find(s=>inRange(h,s)) ?? rotation[0]; const endH=cur.endHour%24; const diff=((endH-h+24)%24)*60-m; return diff<=0?60:diff; }
