/**
 * RandomToolkit.ts — 随机/蓝噪/泊松/混沌
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *   Provide RNG + samplers. Deterministic seeds. Use across modules.
 *
 * [FOR HUMANS / 给人看]
 *   用它来生成“抽卡时间点/微抖动/参数游走”。
 */

export type RNG = ()=>number;
export function makeXor(seed=123456789): RNG{ let x=(seed|0)||1; return ()=>{ x^=x<<13; x^=x>>>17; x^=x<<5; return (x>>>0)/0xFFFFFFFF; }; }
export function makePCG(seed=0x853c49e6748fea9b): RNG{ let state=BigInt(seed)||1n,inc=0xda3e39cb94b95bdbn; return ()=>{ state=state*6364136223846793005n+(inc|1n); let xs=Number(((state>>18n)^state)>>27n)>>>0; let rot=Number(state>>59n)&31; return ((xs>>>rot)|(xs<<((-rot)&31)))/0xFFFFFFFF; }; }
export function poisson1D(minGap:number, max:number, rnd:RNG){ const pts:number[]=[]; let t=0; while(t<max){ const gap=minGap + (-Math.log(1-rnd())*minGap); t+=gap; if(t<max) pts.push(t); } return pts; }
export class MarkovChooser<T>{ private w:Map<T,number>=new Map(); private last:T|null=null; private rnd:RNG; constructor(pairs:[T,number][],rnd:RNG){ pairs.forEach(([k,v])=>this.w.set(k,Math.max(1e-6,v))); this.rnd=rnd; } next():T{ const arr=[...this.w.entries()].map(([k,v])=>({k,w:(this.last===k? v*0.35:v)})); const sum=arr.reduce((a,b)=>a+b.w,0); let r=this.rnd()*sum; for(const it of arr){ r-=it.w; if(r<=0){ this.last=it.k; return it.k; } } return arr[arr.length-1].k; } }
export const blueJitter=(base:number,strength:number,rnd:RNG)=> Math.max(0,Math.min(1, base + (rnd()-rnd())*strength ));
export const logisticStep=(x:number,r=3.73)=> Math.max(0,Math.min(1, r*x*(1-x) ));
export function ikedaStep(x:number,y:number,u=0.918,a=0.4){ const t=0.4-6.0/(1+x*x+y*y); const nx=1+u*(x*Math.cos(t)-y*Math.sin(t)); const ny=u*(x*Math.sin(t)+y*Math.cos(t)); return {x:nx*a,y:ny*a}; }
