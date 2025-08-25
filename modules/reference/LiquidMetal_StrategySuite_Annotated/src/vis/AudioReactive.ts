/**
 * AudioReactive.ts — 音频微策略层
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *   Expose `computeAudioFeatures`, `pickMicroMods`, `applyMicroMods`. Worklet computes FFT; this module is pure.
 *
 * [FOR HUMANS / 给人看]
 *   12 监测点 + 18+ 微策略；这里不关联任何 UI。
 */

export type AudioFeatures = { sub:number; bass:number; lowMid:number; mid:number; highMid:number; presence:number; brilliance:number; air:number; centroid:number; flux:number; crest:number; beat:number; rms:number; silence:boolean; };

export function computeAudioFeatures(fft:Float32Array, sampleRate:number, beatConf=0): AudioFeatures {
  const binHz = sampleRate/(fft.length*2);
  const band=(f0:number,f1:number)=>{ const i0=Math.max(0,Math.floor(f0/binHz)), i1=Math.min(fft.length-1,Math.ceil(f1/binHz)); let s=0; for(let i=i0;i<=i1;i++) s+=fft[i]; return Math.min(1, s/Math.max(1,i1-i0+1)); };
  const sub=band(20,60), bass=band(60,150), lowMid=band(150,400), mid=band(400,1000), highMid=band(1000,2500), presence=band(2500,6000), brilliance=band(6000,12000), air=band(12000,18000);
  let num=0,den=0; for(let i=0;i<fft.length;i++){ const f=fft[i]; num+=f*(i*binHz); den+=f; }
  const centroidHz=den>1e-6? num/den : 0; const centroid=Math.min(1, centroidHz/(sampleRate/2));
  const rms=Math.min(1,(sub*0.5+bass*0.8+mid*0.7+presence*0.6)/2.6);
  const peak=Math.max(sub,bass,mid,highMid,presence,brilliance,air);
  const crest=Math.min(1, Math.max(0, peak-rms));
  const flux=Math.min(1,(presence+brilliance+air)/3);
  const silence=rms<0.06; const beat=beatConf;
  return { sub,bass,lowMid,mid,highMid,presence,brilliance,air,centroid,flux,crest,beat,rms,silence };
}

export type MicroMod = { id:string; ttlMs:number; apply:(ctx:{ mutateWeight:(id:string,delta:number)=>void; setUniform:(id:string,key:string,value:number)=>void; hasNode:(id:string)=>boolean; fpsOk:boolean }, af:AudioFeatures)=>void; };

let _cool:Record<string,number>={}; const can=(now:number,id:string,cd=600)=>((_cool[id]||0)<=now?(_cool[id]=now+cd,true):false);

export function pickMicroMods(now:number, af:AudioFeatures, fpsOk:boolean): MicroMod[] {
  const mods:MicroMod[]=[];
  if(af.sub>0.35&&can(now,'subRipple',500)) mods.push({id:'subRipple',ttlMs:300,apply({setUniform}){setUniform('StructureMix','flowRadius',0.6+af.sub*0.6);}});
  if(af.bass>0.4&&af.beat>0.5&&can(now,'bassDodge',350)) mods.push({id:'bassDodge',ttlMs:240,apply({mutateWeight,hasNode}){if(hasNode('BoundedDodge')) mutateWeight('BoundedDodge', +0.03+af.bass*0.03);}});
  if(af.lowMid>0.5&&can(now,'lowMidBurn',1200)) mods.push({id:'lowMidBurn',ttlMs:800,apply({setUniform}){setUniform('SoftBurn','maskGain',0.4+af.lowMid*0.4);}});
  if(af.mid>0.45&&can(now,'midLIC',900)) mods.push({id:'midLIC',ttlMs:1000,apply({setUniform}){setUniform('StructureMix','licStrength',0.3+af.mid*0.5);}});
  if(af.highMid>0.5&&af.crest>0.35&&can(now,'attackEdge',500)) mods.push({id:'attackEdge',ttlMs:300,apply({mutateWeight,hasNode}){if(hasNode('EdgeTint')) mutateWeight('EdgeTint', +0.02);}});
  if(af.presence>0.45&&can(now,'presenceSpec',1200)) mods.push({id:'presenceSpec',ttlMs:1200,apply({setUniform}){setUniform('SpecularGrad','lightPhase', Math.random());}});
  if(af.brilliance>0.5&&fpsOk&&can(now,'brillBloom',700)) mods.push({id:'brillBloom',ttlMs:160,apply({mutateWeight,hasNode}){if(hasNode('BloomHL')) mutateWeight('BloomHL', +0.02);}});
  if(af.centroid>0.72&&can(now,'centroidBrake',1500)) mods.push({id:'centroidBrake',ttlMs:1400,apply({setUniform}){setUniform('Global','brightCap',0.85);}});
  if(af.flux>0.55&&fpsOk&&can(now,'fluxJitter',400)) mods.push({id:'fluxJitter',ttlMs:400,apply({setUniform}){setUniform('Decor','wJitter',0.01+af.flux*0.02);}});
  if(af.crest>0.5&&can(now,'crestArc',600)) mods.push({id:'crestArc',ttlMs:220,apply({setUniform}){setUniform('DualCurve','vividGate',1.0);}});
  if(af.beat>0.6&&can(now,'beatSwap',350)) mods.push({id:'beatSwap',ttlMs:250,apply({setUniform}){setUniform('Accent','refresh',1.0);}});
  if(af.silence&&can(now,'silenceHold',2000)) mods.push({id:'silenceHold',ttlMs:1800,apply({setUniform}){setUniform('Global','calm',1.0);}});
  if(af.air>0.5&&can(now,'airColder',900)) mods.push({id:'airColder',ttlMs:600,apply({setUniform}){setUniform('EdgeTint','tintHueShift', -0.05);}});
  if(af.bass>0.55&&can(now,'bassSwirl',700)) mods.push({id:'bassSwirl',ttlMs:700,apply({setUniform}){setUniform('Flow','flowAmp',0.03+af.bass*0.03); setUniform('Flow','flowScale',0.8+af.bass*1.0);}});
  if(af.brilliance>0.6&&can(now,'cellCrack',1100)) mods.push({id:'cellCrack',ttlMs:1000,apply({setUniform}){setUniform('Texture','cellSharp',0.7+af.brilliance*0.3);}});
  if(af.rms<0.2&&can(now,'texEase',1600)) mods.push({id:'texEase',ttlMs:1500,apply({setUniform}){setUniform('Texture','texGain',0.5);}});
  if(af.mid>0.6&&can(now,'LBoost',800)) mods.push({id:'LBoost',ttlMs:600,apply({setUniform}){setUniform('OkLabLightness','LBoost',0.05+af.mid*0.05);}});
  if(af.crest>0.55&&can(now,'structKick',900)) mods.push({id:'structKick',ttlMs:400,apply({setUniform}){setUniform('StructureMix','edgeGain',0.15+af.crest*0.25);}});
  return mods;
}

export function applyMicroMods(mods:MicroMod[], pipeline:{nodes:{id:string,weight:number,uniforms?:Record<string,number>}[]}, fpsOk:boolean, af:AudioFeatures){
  const map=new Map(pipeline.nodes.map(n=>[n.id,n] as const));
  const mutateWeight=(id:string,delta:number)=>{ const n=map.get(id); if(!n) return; n.weight=Math.max(0,Math.min(0.22,n.weight+delta)); };
  const setUniform=(id:string,key:string,value:number)=>{
    if(id==='Global'){ pipeline.nodes.forEach(n=>{ n.uniforms=n.uniforms||{}; n.uniforms[key]=value; }); return; }
    if(id==='Decor'||id==='Accent'){
      pipeline.nodes.forEach(n=>{
        const isDecor=['GrainMerge','EdgeTint','TemporalTrail','BloomHL'].includes(n.id);
        const isAccent=['BoundedDodge','SoftBurn','StructureMix','DualCurve','SpecularGrad'].includes(n.id);
        const hit=(id==='Decor'&&isDecor)||(id==='Accent'&&isAccent);
        if(hit){ n.uniforms=n.uniforms||{}; n.uniforms[key]=value; }
      }); return;
    }
    const n=map.get(id); if(!n) return; n.uniforms=n.uniforms||{}; n.uniforms[key]=value;
  };
  const hasNode=(id:string)=>map.has(id);
  mods.forEach(m=>m.apply({mutateWeight,setUniform,hasNode,fpsOk},af));
}
