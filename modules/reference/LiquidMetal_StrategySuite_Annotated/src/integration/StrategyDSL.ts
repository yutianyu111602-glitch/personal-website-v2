/**
 * StrategyDSL.ts — 策略规则与总量约束
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *   Allow runtime rule packs. Hot-reload friendly. No rendering logic here.
 *
 * [FOR HUMANS / 给人看]
 *   按时段/性能限制节点与总量；策略可热更。
 */

export type Rule={ id:string; when?:{hour?:[number,number];fpsMin?:number;fpsMax?:number}; allow?:string[]; forbid?:string[]; Wmax?:number; TTL?:[number,number] };
export function activeRules(rules:Rule[], nowMs:number, fps:number){
  const h=new Date(nowMs).getHours();
  return rules.filter(r=> (r.when?.hour ? (h>=r.when.hour[0]&&h<r.when.hour[1]) : true) && (r.when?.fpsMin?fps>=r.when.fpsMin:true) && (r.when?.fpsMax?fps<=r.when.fpsMax:true) );
}
export function applyRulesToWeights(weights:{id:string,weight:number}[], rules:Rule[]){
  const forbid=new Set<string>(); let Wmax=0.35;
  rules.forEach(r=>{ r.forbid?.forEach(x=>forbid.add(x)); if(typeof r.Wmax==='number') Wmax=Math.min(Wmax,r.Wmax); });
  const kept=weights.filter(w=>!forbid.has(w.id)); const sum=kept.reduce((a,b)=>a+b.weight,0); const k=sum>Wmax?Wmax/sum:1; kept.forEach(w=>w.weight*=k); return kept;
}
