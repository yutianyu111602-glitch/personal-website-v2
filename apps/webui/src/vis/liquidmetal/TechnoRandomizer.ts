/**
 * TechnoRandomizer.ts — Techno 规则驱动层（移植版）
 * 来源：@LiquidMetalSuite_PRO/
 */

export type TechnoState = {
  bar:number; step:number; steps:number;
  phraseBars:number; phaseInPhrase:number;
  swing:number; isBuild:boolean; isDrop:boolean; isFill:boolean;
};

export type SeqStep = { on:boolean; prob?:number; plock?:Record<string,number> };
export type Pattern = SeqStep[];
export type TechnoConfig = { steps?:number; phraseBars?:number; swing?:number; basePattern?:Pattern; hatPattern?:Pattern; accentPattern?:Pattern; };
export type TechnoHooks = { onKick:()=>void; onHat:()=>void; onAccent:()=>void; onBuildTick:(p:number)=>void; onDrop:()=>void; onFillTick:(t:number)=>void; pLock:(targetId:string,key:string,val:number)=>void; mutateWeight:(id:string,delta:number)=>void; };

export function euclid(steps:number,hits:number,rot=0):Pattern{
  const p:Pattern = Array.from({length:steps},()=>({on:false}));
  for(let i=0;i<steps;i++){
    const idx=(i+rot)%steps;
    if (Math.round((i*hits)/steps)!==Math.round(((i-1)*hits)/steps)) p[idx].on=true;
  }
  return p;
}
export const swingDelay = (step:number,steps:number,swing:number)=> (steps%16===0 && (step%2)===1) ? swing : 0;

export function makeDefaultTechnoConfig():TechnoConfig{
  const steps=16;
  return {
    steps, phraseBars:16, swing:0.08,
    basePattern:euclid(steps,4,0),   // 1/4
    hatPattern: euclid(steps,6,1),   // off hats
    accentPattern:euclid(steps,2,0)  // 2 & 4
  };
}

export class TechnoRandomizer {
  cfg:TechnoConfig; st:TechnoState; hooks:TechnoHooks;
  constructor(cfg:Partial<TechnoConfig>, hooks:TechnoHooks){
    const base=makeDefaultTechnoConfig();
    this.cfg={...base,...cfg};
    this.st={bar:0,step:0,steps:this.cfg.steps!,phraseBars:this.cfg.phraseBars!,phaseInPhrase:0,swing:this.cfg.swing!,isBuild:false,isDrop:false,isFill:false};
    this.hooks=hooks;
  }

  /** 每个 16 分音调用一次 */
  tick(nowMs:number){
    const {steps,phraseBars}=this.cfg;
    const {step,bar}=this.st;
    const phrasePos = bar % phraseBars!;

    this.st.phaseInPhrase = phrasePos;
    this.st.isDrop = (phrasePos===0 && step===0);
    this.st.isBuild= (phrasePos >= phraseBars!-2);
    this.st.isFill = (phrasePos === phraseBars!-1);

    const kickOn = this.cfg.basePattern![step]?.on && Math.random()< (this.cfg.basePattern![step].prob ?? 1);
    const hatOn  = this.cfg.hatPattern![step]?.on  && Math.random()< (this.cfg.hatPattern![step].prob ?? 0.9);
    const accOn  = this.cfg.accentPattern![step]?.on&& Math.random()< (this.cfg.accentPattern![step].prob ?? 0.95);

    if(kickOn) this.hooks.onKick();
    if(hatOn ) this.hooks.onHat();
    if(accOn ) this.hooks.onAccent();

    if(this.st.isBuild){
      const prog=((phraseBars!-1-(phrasePos))+step!/steps!) / 2;
      this.hooks.onBuildTick(1-Math.min(1,prog));
    }
    if(this.st.isDrop) this.hooks.onDrop();
    if(this.st.isFill){
      const t01= step!/(steps!-1);
      this.hooks.onFillTick(t01);
    }

    if(accOn){ this.hooks.pLock('DualCurve','vividGate',1.0); }

    this.st.step=(step!+1)%steps!;
    if(this.st.step===0) this.st.bar++;
  }
}


