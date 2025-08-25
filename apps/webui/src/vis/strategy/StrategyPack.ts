/**
 * StrategyPack.ts — 组合策略运行时
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *   Load combos.json + strategy.rules.json; provide pick() + mergePipeline().
 *
 * [FOR HUMANS / 给人看]
 *   把配方当做“特效片段”；与主 scheduler 并用，或按场景覆盖。
 */

import { MarkovChooser, makePCG } from '../vis/random/RandomToolkit';

export type ComboClass = 'stable'|'build'|'drop'|'fill'|'ambient'|'experimental';
export type ComboNode = { id:string; w:number; u?:Record<string,number> };
export type ComboExtras = { flow?:{id:string,uniforms?:Record<string,number>}, texture?:{id:string,uniforms?:Record<string,number>}, pattern?:{id:string,uniforms?:Record<string,number>} };
export type Combo = { id:string; class:ComboClass; nodes:ComboNode[]; extras?:ComboExtras; notes?:string };
export type StrategyRules = { version: string; tod: { hour:[number,number]; weights: Partial<Record<ComboClass, number>> }[]; };

export class StrategyRuntime {
  private combos: Combo[] = [];
  private rules: StrategyRules | null = null;
  private chooser: MarkovChooser<Combo> | null = null;

  load(combos:Combo[], rules:StrategyRules){
    this.combos = combos; this.rules = rules;
    const pairs:[Combo,number][] = combos.map(c=>[c, 1]);
    this.chooser = new MarkovChooser(pairs, makePCG(0x5337));
  }

  private chooseByClass(cls:ComboClass): Combo {
    const pool = this.combos.filter(c=>c.class===cls);
    if (pool.length===0) throw new Error('no combos for class '+cls);
    const idx = Math.floor(Math.random()*pool.length);
    return pool[idx];
  }

  pick(nowMs:number, mood:{energy:number;valence:number;arousal:number}, stage:'idle'|'build'|'drop'|'fill', fps:number): Combo {
    if (!this.rules || !this.chooser) throw new Error('StrategyRuntime not loaded');
    if (stage==='drop') return this.chooseByClass('drop');
    if (stage==='build') return this.chooseByClass('build');
    if (stage==='fill') return this.chooseByClass('fill');

    const h = new Date(nowMs).getHours();
    const slot = this.rules.tod.find(t=> h>=t.hour[0] && h<t.hour[1]);
    const w = slot?.weights || { stable: 0.7, ambient: 0.2, experimental: 0.1 };

    const e=mood.energy, a=mood.arousal;
    const adj = { ...w };
    (adj as any).build = ((adj as any).build||0) + Math.max(0, e*0.2 + a*0.1 - 0.1);
    (adj as any).drop  = ((adj as any).drop ||0) + Math.max(0, e*0.15 - 0.05);
    (adj as any).ambient = ((adj as any).ambient||0) + Math.max(0, 0.15 - e*0.15);
    const sum = Object.values(adj).reduce((acc,v)=>acc+(v||0),0) || 1;
    Object.keys(adj).forEach(k=> (adj as any)[k] = (adj as any)[k]/sum);

    let r = Math.random(); let chosen:'stable'|'build'|'drop'|'fill'|'ambient'|'experimental'='stable';
    for (const [cls,p] of Object.entries(adj)){ r -= (p||0); if (r<=0){ chosen=cls as any; break; } }
    return this.chooseByClass(chosen);
  }

  mergePipeline(pipeline:{nodes:{id:string,weight:number,uniforms?:Record<string,number>}[]}, combo:Combo){
    const map = new Map(pipeline.nodes.map(n=>[n.id,n] as const));
    for (const cn of combo.nodes){
      const n = map.get(cn.id);
      if (n){ n.weight = Math.min(0.22, n.weight + cn.w); n.uniforms = {...(n.uniforms||{}), ...(cn.u||{})}; }
      else { pipeline.nodes.push({ id: cn.id as any, weight: Math.min(0.22, cn.w), uniforms: cn.u }); }
    }
    const sum = pipeline.nodes.reduce((a,b)=>a+b.weight,0);
    const k = sum>0.35 ? 0.35/sum : 1;
    pipeline.nodes.forEach(n=> n.weight *= k);
    return pipeline;
  }
}
