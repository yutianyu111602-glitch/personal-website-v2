/**
 * AlgorithmCombiner.ts — 子效果组合器
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *   Composable micro-effects. Return normalized weights/uniforms.
 *
 * [FOR HUMANS / 给人看]
 *   把多个子效果拼成一组参数；ΣW 自动限制。
 */

export type SubEffect=(ctx:{ rnd:()=>number; mood:{energy:number;valence:number;arousal:number}; af:{rms:number;crest:number;flux:number;centroid:number}; phase01:number; fpsOk:boolean; })=>{ weights:Record<string,number>; uniforms:Record<string,number> };
export class AlgorithmCombiner{ private subs:SubEffect[]=[]; use(fn:SubEffect){ this.subs.push(fn); return this; } run(ctx:Parameters<SubEffect>[0]){ const weights:Record<string,number>={}, uniforms:Record<string,number>={}; for(const s of this.subs){ const out=s(ctx); for(const [k,v] of Object.entries(out.weights)) weights[k]=(weights[k]||0)+v; for(const [k,v] of Object.entries(out.uniforms)) uniforms[k]=v; } const sum=Object.values(weights).reduce((a,b)=>a+b,0); const k=sum>0.35?0.35/sum:1; for(const id in weights) weights[id]*=k; return {weights,uniforms}; } }
export const SpecPulse:SubEffect=({rnd,af,phase01})=>{ const pulse=(Math.sin(phase01*6.283+rnd()*6.283)*0.5+0.5)*(0.5+af.crest*0.5); return { weights:{SpecularGrad:0.04+pulse*0.06}, uniforms:{'SpecularGrad.uLightPhase':rnd()} }; };
export const StructRipple:SubEffect=({mood,af})=>{ const w=0.05+0.08*(mood.energy*0.6+af.rms*0.4); return { weights:{StructureMix:w}, uniforms:{'StructureMix.uFlowRadius':0.6+0.5*mood.arousal,'StructureMix.uLicStrength':0.2+0.6*af.flux} }; };
