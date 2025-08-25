import { TrackFeature } from './types.js'; import { WEIGHTS, LIMITS } from './config.js';
function keyScoreCamelot(a: string, b: string): number {
  const m=(k:string)=>{const r=/^(\d+)([ABab])$/.exec(k||''); return r?{n:Number(r[1]),m:r[2].toUpperCase()}:null;};
  const A=m(a),B=m(b); if(!A||!B) return 0.5;
  if(A.n===B.n&&A.m===B.m) return 1.0;
  const neigh=[((A.n+10)%12)+1,(A.n%12)+1]; const swap=A.m!==B.m;
  if(A.n===B.n&&swap) return 0.85; if(neigh.includes(B.n)&&A.m===B.m) return 0.8;
  if(neigh.includes(B.n)&&swap) return 0.6; return 0.4+(B.m==='A'?0.05:0);
}
function tempoScore(a:number,b:number){ const max=LIMITS.maxStretchPct/100; let ratio=(b||1)/(a||1);
  if(ratio<0.5) ratio*=2; else if(ratio>2) ratio/=2; const diff=Math.abs(1-ratio);
  let base= diff<=max? 1-(diff/max): Math.max(0.05,1-(diff/(max*4)));
  if(b<LIMITS.bpmSoftLo||b>LIMITS.bpmSoftHi) base*=0.6; else if(Math.abs(b-LIMITS.bpmIdeal)<=LIMITS.bpmTol) base=Math.min(1, base+0.1);
  return base; }
function energyScore(a:TrackFeature,b:TrackFeature){ const head=(arr?:number[],f=0.25)=>!arr?.length?-1:arr.slice(0,Math.max(1,Math.floor(arr.length*f))).reduce((s,x)=>s+x,0)/Math.max(1,Math.floor(arr.length*f));
  const tail=(arr?:number[],f=0.25)=>!arr?.length?-1:arr.slice(-Math.max(1,Math.floor(arr.length*f))).reduce((s,x)=>s+x,0)/Math.max(1,Math.floor(arr.length*f));
  const t=tail(a.energyCurve,0.25),h=head(b.energyCurve,0.25); if(t<0||h<0) return 0.6; const d=Math.abs(t-h); return Math.max(0,1-Math.min(1,d*1.2)); }
function phraseAlignScore(a:TrackFeature,b:TrackFeature){ return (a.downbeats?.length||0)>1&&(b.downbeats?.length||0)>1?0.7:0.5; }
function vocalPenalty(b:TrackFeature){ const v=b.vocality; if(typeof v!=='number') return 0; return -Math.min(0.2, v*0.2); }
export function compatScore(a:TrackFeature,b:TrackFeature){ const sKey=keyScoreCamelot(a.keyCamelot,b.keyCamelot);
  const sTmp=tempoScore(a.bpm,b.bpm); const sEng=energyScore(a,b); const sPhr=phraseAlignScore(a,b); const pen=vocalPenalty(b);
  const score = WEIGHTS.key*sKey + WEIGHTS.tempo*sTmp + WEIGHTS.energy*sEng + WEIGHTS.phrase*sPhr + WEIGHTS.vocal*(1+pen);
  return Math.max(0, Math.min(1, score)); }
