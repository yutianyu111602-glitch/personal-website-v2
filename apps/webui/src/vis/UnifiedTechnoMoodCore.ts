
/* =========================================================================
 * UnifiedTechnoMoodCore.ts — 统一情绪×Techno×音频核心（完整实现）
 * ========================================================================= */
export type Mood = { energy:number; valence:number; arousal:number };
export type Segment = 'build'|'drop'|'fill'|'steady'|'break';
export type NowPlaying = {
  title?:string; artist?:string; bpm?:number; segment?:Segment; startedAt?:number; trackId?:string;
};
export type AudioFeatures = {
  sub:number; bass:number; lowMid:number; mid:number; highMid:number;
  presence:number; brilliance:number; air:number; centroid:number;
  flux:number; crest:number; beat:number; rms:number; silence:boolean;
};
export type Perf = { avgFrameMs:number; gpuTier?:'h'|'m'|'l' };

export type BlendID =
  | 'LumaSoftOverlay' | 'SMix' | 'BoundedDodge' | 'SoftBurn'
  | 'GrainMerge' | 'StructureMix' | 'BloomHL' | 'EdgeTint'
  | 'DualCurve' | 'TemporalTrail' | 'SpecularGrad' | 'OkLabLightness';

export type BlendNode = { id:BlendID; weight:number; uniforms?:Record<string, number>; category?:'Base'|'Accent'|'Decor' };
export type BlendPipeline = { nodes:BlendNode[]; ttlMs:number; presetId?:string; extras?: Extras };

export type Preset = {
  id:string; tags:{
    metalScore:number; energyBias:number; valenceBias:number; arousalBias:number;
    hueShiftRisk:number; specularBoost:number; rippleAffinity:number; cost:number;
    flowAffinity?:number; organicAffinity?:number; fractureAffinity?:number;
  }
};

export type Extras = {
  flow?: { id:'CurlNoise'|'StableFluid'|'DomainWarp'|'LIC'; uniforms?:Record<string,number> };
  texture?: { id:'Simplex'|'fBm'|'Ridged'|'Worley'|'Gabor'; uniforms?:Record<string,number> };
  pattern?: { id:'ReactionDiffusion'|'Lenia'|'WFC'; uniforms?:Record<string,number> };
};

export type Config = {
  ttlRangeMs?: [number, number];
  sigmaLimit?: number;
  nodeLimit?: number;
  coolMs?: number;
  diversity?: number;
  seedSalt?: number;
  enableMarkov?: boolean;
  technoSteps?: 16|32;
};

const DEF: Required<Config> = {
  ttlRangeMs: [15000, 90000],
  sigmaLimit: 0.35,
  nodeLimit: 3,
  coolMs: 45000,
  diversity: 0.6,
  seedSalt: 114514,
  enableMarkov: true,
  technoSteps: 16,
};

const clamp = (v:number,min:number,max:number)=> Math.min(max, Math.max(min,v));
function xorshift32(seed:number){ let x = seed|0 || 2463534242; return ()=>{ x^=x<<13; x^=x>>>17; x^=x<<5; return (x>>>0)/0xFFFFFFFF; }; }
function pickWeighted<T>(arr:{item:T, w:number}[], rnd:()=>number){ const sum=arr.reduce((a,b)=>a+b.w,0); let r=rnd()*sum; for(const x of arr){ r-=x.w; if(r<=0) return x.item; } return arr[arr.length-1].item; }
function lerp(a:number,b:number,t:number){ return a+(b-a)*t; }

function unifyDrive(m:Mood, af:AudioFeatures, np?:NowPlaying){
  const bpmN = np?.bpm ? Math.min(1, Math.max(0, np.bpm/180)) : 0.65;
  const segBoost = (np?.segment==='build')?0.10 : (np?.segment==='drop')?0.20 : (np?.segment==='fill')?0.15 : (np?.segment==='break')?-0.05 : 0.0;
  const E = Math.min(1, Math.max(0, 0.45*m.energy + 0.25*bpmN + 0.20*af.rms + 0.10*segBoost));
  const A = Math.min(1, Math.max(0, 0.50*m.arousal + 0.30*af.flux + 0.20*af.crest));
  const V = Math.max(-1, Math.min(1, m.valence + 0.2*(af.presence - af.lowMid)));
  return {E,A,V};
}

type StepState = { bar:number; step:number; steps:number; phaseInPhrase:number; phraseBars:number };
function nextStep(st:StepState){ const s=(st.step+1)%st.steps; st.step=s; if(s===0) st.bar++; st.phaseInPhrase = st.bar % st.phraseBars; }
function segmentFromStep(st:StepState): Segment {
  if (st.phaseInPhrase===0 && st.step===0) return 'drop';
  if (st.phaseInPhrase===st.phraseBars-1) return 'fill';
  if (st.phaseInPhrase>=st.phraseBars-2) return 'build';
  return 'steady';
}

function scoreByMood(id:BlendID, E:number, A:number, V:number){
  switch(id){
    case 'LumaSoftOverlay': return 0.6 + 0.4*(1-A);
    case 'SMix':            return 0.55 + 0.3*(1-Math.abs(V));
    case 'OkLabLightness':  return 0.5 + 0.4*((1+V)/2);
    case 'BoundedDodge':    return 0.2 + 0.9*E + 0.3*A;
    case 'SoftBurn':        return 0.2 + 0.8*((-V+1)/2);
    case 'StructureMix':    return 0.45 + 0.5*A;
    case 'DualCurve':       return 0.3 + 0.9*E + 0.2*A;
    case 'SpecularGrad':    return 0.35 + 0.5*A;
    case 'GrainMerge':      return 0.4 + 0.4*(1-A);
    case 'BloomHL':         return 0.2 + 0.7*E;
    case 'EdgeTint':        return 0.35 + 0.4*A + 0.2*((1+V)/2);
    case 'TemporalTrail':   return 0.4 + 0.4*(1-A) + 0.2*E;
  }
}

function paramFor(id:BlendID, E:number, A:number, V:number, perfHigh:boolean){
  const P = perfHigh ? 1.0 : 0.7;
  switch(id){
    case 'LumaSoftOverlay': return Math.min(0.16, Math.max(0.06, 0.08 + 0.06*(1-A)))*P;
    case 'SMix':            return Math.min(0.13, Math.max(0.05, 0.07 + 0.05*(1-Math.abs(V))))*P;
    case 'OkLabLightness':  return Math.min(0.14, Math.max(0.05, 0.06 + 0.06*((1+V)/2)))*P;
    case 'BoundedDodge':    return Math.min(0.16, Math.max(0.04, 0.05 + 0.10*E))*P;
    case 'SoftBurn':        return Math.min(0.14, Math.max(0.04, 0.05 + 0.08*((-V+1)/2)))*P;
    case 'StructureMix':    return Math.min(0.14, Math.max(0.04, 0.05 + 0.09*A))*P;
    case 'DualCurve':       return Math.min(0.16, Math.max(0.05, 0.05 + 0.10*E))*P;
    case 'SpecularGrad':    return Math.min(0.12, Math.max(0.03, 0.04 + 0.08*A))*P;
    case 'GrainMerge':      return Math.min(0.10, Math.max(0.03, 0.04 + 0.06*(1-A)))*P;
    case 'BloomHL':         return (perfHigh?1:0) * Math.min(0.12, Math.max(0.03, 0.04 + 0.08*E));
    case 'EdgeTint':        return Math.min(0.09, Math.max(0.02, 0.03 + 0.06*(A*0.7 + (1+V)/3)))*P;
    case 'TemporalTrail':   return (perfHigh?1:0.5) * Math.min(0.09, Math.max(0.02, 0.03 + 0.06*(1-A)+0.03*E));
  }
  return 0.08;
}

function pickExtras(E:number, A:number, V:number, rnd:()=>number) {
  const flowId = ((): 'CurlNoise'|'StableFluid'|'DomainWarp'|'LIC' => {
    const c = [{id:'CurlNoise',w:0.5+A*0.4},{id:'DomainWarp',w:0.3+E*0.2},{id:'LIC',w:0.2+(1-A)*0.3},{id:'StableFluid',w:0.15+E*0.25}];
    return pickWeighted(c as any, rnd) as any;
  })();
  const flow = flowId==='CurlNoise'? {id:flowId, uniforms:{ flowAmp:0.02+0.03*E, flowScale:0.8+1.2*A }}
              : flowId==='DomainWarp'? {id:flowId, uniforms:{ warpAmp:0.015+0.02*E, warpIter: 1 + Math.floor(2*A) }}
              : flowId==='LIC'? {id:flowId, uniforms:{ licLen: 6.0 + 10.0*A, licGain: 0.6 }}
              : {id:flowId, uniforms:{ fluidDamp:0.96, fluidForce:0.4+0.6*E }};

  const texId = ((): 'Simplex'|'fBm'|'Ridged'|'Worley'|'Gabor' => {
    const c = [{id:'Simplex',w:0.35+(1-A)*0.2},{id:'fBm',w:0.35+E*0.2},{id:'Ridged',w:0.25+Math.max(0,-V)*0.2},{id:'Worley',w:0.25+E*0.15},{id:'Gabor',w:0.2+A*0.2}];
    return pickWeighted(c as any, rnd) as any;
  })();
  const texture = texId==='Simplex'? {id:texId, uniforms:{ texScale:2.0, texGain:0.8 }}
                 : texId==='fBm'? {id:texId, uniforms:{ texScale:2.5, fbmOct:4, fbmGain:0.55 }}
                 : texId==='Ridged'? {id:texId, uniforms:{ texScale:3.0, ridgeGain:0.8 }}
                 : texId==='Worley'? {id:texId, uniforms:{ texScale:4.0, cellSharp:0.6 }}
                 : {id:texId, uniforms:{ texScale:3.0, gaborAniso:0.8 }};

  const patId = ((): 'ReactionDiffusion'|'Lenia'|'WFC' => {
    const c = [{id:'ReactionDiffusion',w:0.45+(1+A)*0.1},{id:'Lenia',w:0.35+A*0.25},{id:'WFC',w:0.25+E*0.2}];
    return pickWeighted(c as any, rnd) as any;
  })();
  const pattern = patId==='ReactionDiffusion'? {id:patId, uniforms:{ rdF: 0.037 + 0.01*E, rdK: 0.06 + 0.01*((1+V)/2) }}
                 : patId==='Lenia'? {id:patId, uniforms:{ leniaR: 0.08+0.04*A, leniaBeta: 2.0 }}
                 : {id:patId, uniforms:{ wfcSeed: ((Math.random()*1e6)|0) }};

  return { flow, texture, pattern };
}

type MicroCtx = {
  mutate:(id:BlendID, delta:number)=>void;
  uni:(scope:'Global'|'Decor'|'Accent'|BlendID, key:string, val:number)=>void;
  has:(id:BlendID)=>boolean; perfHigh:boolean;
};
type MicroMod = { id:string; ttlMs:number; apply:(ctx:MicroCtx, af:AudioFeatures)=>void };

function pickMicroMods(now:number, af:AudioFeatures, perfHigh:boolean){
  const mods: MicroMod[] = [];
  const can = (id:string, cd=600)=>{
    const anyFn = pickMicroMods as any;
    if (!anyFn._cool) anyFn._cool = {};
    const t = anyFn._cool[id] || 0;
    if (t <= now) { anyFn._cool[id] = now + cd; return true; }
    return false;
  };

  if (af.sub>0.35 && can('subRipple',500)) mods.push({ id:'subRipple', ttlMs:300, apply({uni}){ uni('StructureMix','flowRadius', 0.6+af.sub*0.6); } });
  if (af.bass>0.4 && af.beat>0.5 && can('bassDodge',350)) mods.push({ id:'bassDodge', ttlMs:240, apply({mutate,has}){ if(has('BoundedDodge')) mutate('BoundedDodge', +0.03 + af.bass*0.03); } });
  if (af.lowMid>0.5 && can('lowMidBurn',1200)) mods.push({ id:'lowMidBurn', ttlMs:800, apply({uni}){ uni('SoftBurn','maskGain', 0.4+af.lowMid*0.4); } });
  if (af.mid>0.45 && can('midLIC',900)) mods.push({ id:'midLIC', ttlMs:1000, apply({uni}){ uni('StructureMix','licStrength', 0.3+af.mid*0.5); } });
  if (af.highMid>0.5 && af.crest>0.35 && can('attackEdge',500)) mods.push({ id:'attackEdge', ttlMs:300, apply({mutate,has}){ if(has('EdgeTint')) mutate('EdgeTint', +0.02); } });
  if (af.presence>0.45 && can('presenceSpec',1200)) mods.push({ id:'presenceSpec', ttlMs:1200, apply({uni}){ uni('SpecularGrad','lightPhase', Math.random()); } });
  if (af.brilliance>0.5 && perfHigh && can('brillBloom',700)) mods.push({ id:'brillBloom', ttlMs:160, apply({mutate,has}){ if(has('BloomHL')) mutate('BloomHL', +0.02); } });
  if (af.centroid>0.72 && can('centroidBrake',1500)) mods.push({ id:'centroidBrake', ttlMs:1400, apply({uni}){ uni('Global','brightCap', 0.85); } });
  if (af.flux>0.55 && perfHigh && can('fluxJitter',400)) mods.push({ id:'fluxJitter', ttlMs:400, apply({uni}){ uni('Decor','wJitter', 0.01 + af.flux*0.02); } });
  if (af.crest>0.5 && can('crestArc',600)) mods.push({ id:'crestArc', ttlMs:220, apply({uni}){ uni('DualCurve','vividGate', 1.0); } });
  if (af.beat>0.6 && can('beatSwap',350)) mods.push({ id:'beatSwap', ttlMs:250, apply({uni}){ uni('Accent','refresh', 1.0); } });
  if (af.silence && can('silenceHold',2000)) mods.push({ id:'silenceHold', ttlMs:1800, apply({uni}){ uni('Global','calm', 1.0); } });
  if (af.air>0.5 && can('airColder',900)) mods.push({ id:'airColder', ttlMs:600, apply({uni}){ uni('EdgeTint','tintHueShift', -0.05); } });
  if (af.bass>0.55 && can('bassSwirl',700)) mods.push({ id:'bassSwirl', ttlMs:700, apply({uni}){ uni('Flow','flowAmp', 0.03 + af.bass*0.03); uni('Flow','flowScale', 0.8 + af.bass*1.0); } });
  if (af.brilliance>0.6 && can('cellCrack',1100)) mods.push({ id:'cellCrack', ttlMs:1000, apply({uni}){ uni('Texture','cellSharp', 0.7 + af.brilliance*0.3); } });
  if (af.rms<0.2 && can('texEase',1600)) mods.push({ id:'texEase', ttlMs:1500, apply({uni}){ uni('Texture','texGain', 0.5); } });
  if (af.mid>0.6 && can('LBoost',800)) mods.push({ id:'LBoost', ttlMs:600, apply({uni}){ uni('OkLabLightness','LBoost', 0.05 + af.mid*0.05); } });
  if (af.crest>0.55 && can('structKick',900)) mods.push({ id:'structKick', ttlMs:400, apply({uni}){ uni('StructureMix','edgeGain', 0.15 + af.crest*0.25); } });

  return mods;
}

type History = { id:string; t:number }[];
type MarkovRow = Partial<Record<BlendID, number>>;

export class UnifiedCore {
  cfg: Required<Config>;
  history: History = [];
  current: BlendPipeline|null = null;
  until = 0;
  step: StepState = { bar:0, step:0, steps:16, phaseInPhrase:0, phraseBars:16 };
  rng: ()=>number = Math.random;
  markov: Record<BlendID, MarkovRow> = {};

  constructor(cfg:Config={}){
    this.cfg = { ...DEF, ...cfg };
    this.step.steps = this.cfg.technoSteps;
    const near = (a:BlendID,b:BlendID,v:number)=> (this.markov[a]||(this.markov[a]={}))[b]=v;
    near('LumaSoftOverlay','SMix',0.6); near('SMix','OkLabLightness',0.5); near('OkLabLightness','LumaSoftOverlay',0.5);
  }

  reseed(np?:NowPlaying){
    const base = (np?.trackId?.length? Array.from(np.trackId).reduce((a,c)=>a+c.charCodeAt(0),0): 0) + (np?.bpm||0)*13 + this.cfg.seedSalt;
    this.rng = xorshift32(base|0);
  }

  private cooldownPenalty(id:string, now:number){
    let s=1.0;
    const last = [...this.history].reverse().find(h=>h.id===id);
    if (last && (now-last.t) < this.cfg.coolMs) s*=0.2;
    const idx = this.history.slice(-6).map(h=>h.id).lastIndexOf(id);
    if (idx>=0) s *= (1 - this.cfg.diversity * (1 - idx/6));
    return s;
  }

  private pickIDs(E:number,A:number,V:number, perfHigh:boolean, now:number, presets:Preset[]){
    const basePool:BlendID[]=['LumaSoftOverlay','SMix','OkLabLightness'];
    const accPool: BlendID[]=['BoundedDodge','SoftBurn','StructureMix','DualCurve','SpecularGrad'];
    const decPool: BlendID[]=['GrainMerge','BloomHL','EdgeTint','TemporalTrail'];

    const pickFrom=(pool:BlendID[])=>{
      const weighted = pool.map(id=>{
        let w = Math.max(1e-3, scoreByMood(id,E,A,V)!);
        if (this.cfg.enableMarkov && this.current){
          const prev = this.current.nodes[0]?.id as BlendID|undefined;
          if (prev && this.markov?.[prev]?.[id]) w *= 1.0 + this.markov[prev][id]!;
        }
        w *= this.cooldownPenalty(id, now);
        return {item:id, w};
      });
      return pickWeighted(weighted, this.rng);
    };

    const base = pickFrom(basePool);
    const acc  = pickFrom(accPool);
    const dec  = pickFrom(decPool);

    let sum=0; const nodes:BlendNode[]=[];
    const push = (id:BlendID, cat:BlendNode['category'])=>{
      let w = paramFor(id,E,A,V, perfHigh);
      if (cat==='Decor' && this.step.phaseInPhrase>=this.step.phraseBars-2) w = Math.min(w*1.2, 0.15);
      if (sum + w <= this.cfg.sigmaLimit){ nodes.push({id,weight:w,category:cat}); sum+=w; }
    };
    push(base,'Base'); push(acc,'Accent'); push(dec,'Decor');

    const scored = presets.map(p=>{
      let s = 0.6*p.tags.metalScore + 0.2*p.tags.specularBoost + 0.2*p.tags.rippleAffinity;
      s += 0.35*E*p.tags.energyBias + 0.25*A*p.tags.arousalBias + 0.15*((V+1)/2)*p.tags.valenceBias;
      s *= (1 - 0.5*p.tags.hueShiftRisk);
      if (!perfHigh && p.tags.cost>3) s *= 0.5;
      s *= this.cooldownPenalty(p.id, now);
      return {item:p.id, w:Math.max(1e-3,s)};
    });
    const presetId = scored.length ? pickWeighted(scored, this.rng) : undefined;

    return { nodes, presetId };
  }

  stepOnce(now:number, mood:Mood, af:AudioFeatures, np:NowPlaying|undefined, perf:{avgFrameMs:number}, presets:Preset[]): BlendPipeline {
    if (!this.current) this.reseed(np);
    if (af.beat>0.6 || now%120<16) nextStep(this.step);
    const seg = np?.segment ?? segmentFromStep(this.step);

    const fps = 1000/Math.max(perf.avgFrameMs,1e-3);
    const perfHigh = fps>=55;

    const {E,A,V} = unifyDrive(mood, {...af}, {...np, segment:seg});
    const sigma0 = this.cfg.sigmaLimit;
    this.cfg.sigmaLimit = (seg==='drop') ? Math.min(0.40, sigma0+0.05) : sigma0;

    const mustRebuild =
      !this.current || now>this.until ||
      (seg==='drop' && this.step.step===0) ||
      (this.current && Math.abs(E - (this as any)._lastE || 0) > 0.18) ||
      (this.current && Math.abs(A - (this as any)._lastA || 0) > 0.18);

    if (mustRebuild){
      const {nodes, presetId} = this.pickIDs(E,A,V, perfHigh, now, presets);
      const extras = pickExtras(E,A,V, this.rng);
      const short = (seg!=='steady') || (E>0.75) || (A>0.7);
      const ttlMs = short ? (15000 + (this.rng()*15000|0)) : (45000 + (this.rng()*45000|0));
      this.current = { nodes, ttlMs, presetId, extras };
      this.until = now + ttlMs;
      nodes.forEach(n=>this.history.push({id:n.id,t:now}));
      if (presetId) this.history.push({id:presetId, t:now});
    }

    if (this.current){
      const map = new Map(this.current.nodes.map(n=>[n.id,n]));
      const ctx = {
        mutate:(id:BlendID,delta:number)=>{ const n=map.get(id); if(!n) return; n.weight = Math.max(0, Math.min(0.22, n.weight + delta)); },
        uni:(scope:any,key:string,val:number)=>{
          if (scope==='Global') { this.current!.nodes.forEach(n=>{ (n.uniforms||(n.uniforms={}))[key]=val; }); return; }
          if (scope==='Decor' || scope==='Accent'){
            this.current!.nodes.forEach(n=>{
              const isDecor=['GrainMerge','EdgeTint','TemporalTrail','BloomHL'].includes(n.id);
              const isAccent=['BoundedDodge','SoftBurn','StructureMix','DualCurve','SpecularGrad'].includes(n.id);
              const hit=(scope==='Decor' && isDecor) || (scope==='Accent' && isAccent);
              if (hit){ (n.uniforms||(n.uniforms={}))[key]=val; }
            }); return;
          }
          const n=map.get(scope as BlendID); if (!n) return; (n.uniforms||(n.uniforms={}))[key]=val;
        },
        has:(id:BlendID)=> map.has(id),
        perfHigh
      };
      pickMicroMods(now, af, perfHigh).forEach(mod=>mod.apply(ctx as any, af));
    }

    (this as any)._lastE = E; (this as any)._lastA = A;

    if (fps<48 && this.current){
      this.current.nodes = this.current.nodes.slice(0,2);
      this.current.nodes.forEach(n=>{ if(n.category==='Decor') n.weight=Math.min(n.weight,0.06); });
    }

    return this.current!;
  }
}
