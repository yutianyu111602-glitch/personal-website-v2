export type ComboClass = 'stable'|'build'|'drop'|'fill'|'ambient'|'experimental';
export type ComboNode = { id:string; w:number; u?:Record<string,number> };
export type ComboExtras = { flow?:{id:string,uniforms?:Record<string,number>}, texture?:{id:string,uniforms?:Record<string,number>}, pattern?:{id:string,uniforms?:Record<string,number>} };
export type Combo = { id:string; class:ComboClass; nodes:ComboNode[]; extras?:ComboExtras; notes?:string };
export type StrategyRules = { version: string; tod: { hour:[number,number]; weights: Partial<Record<ComboClass, number>> }[]; };

import { StrategyRuntime } from './StrategyPack';

export class StrategyLoader {
  private runtime: StrategyRuntime | null = null;
  private combos: Combo[] = [];
  private rules: StrategyRules | null = null;

  async loadStatic(combosUrl:string, rulesUrl:string){
    const [c, r] = await Promise.all([
      fetch(combosUrl).then(res=>res.json()),
      fetch(rulesUrl).then(res=>res.json())
    ]);
    this.combos = c; this.rules = r; this.runtime = new StrategyRuntime();
    this.runtime.load(this.combos as any, this.rules as any);
    return this.runtime;
  }

  attachTo(conductor: { attachStrategy: (rt:StrategyRuntime)=>void }){
    if (!this.runtime) throw new Error('Strategy not loaded');
    conductor.attachStrategy(this.runtime);
  }

  getRuntime(){ return this.runtime; }
}
