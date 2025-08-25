
/**
 * RandomToolkit.ts — 随机与调度增强包（纯 TS，无依赖）
 * - Xorshift32 / PCG32（可复现）
 * - 1D 泊松采样（Poisson-disc）用于事件间隔
 * - MarkovChooser（避免硬复读）
 * - BlueNoiseJitter（抗条带抖动）
 * - LogisticMap/IkedaMap（可控混沌，用于参数游走）
 */

export type RNG = () => number;

// -------- Xorshift32 --------
export function makeXor(seed=123456789): RNG {
  let x = (seed|0) || 1;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x >>> 0) / 0xFFFFFFFF);
  };
}

// -------- PCG32（简版） --------
export function makePCG(seed=0x853c49e6748fea9b): RNG {
  let state = BigInt(seed) || 1n, inc = 0xda3e39cb94b95bdbn;
  return () => {
    state = state * 6364136223846793005n + (inc|1n);
    let xorshifted = Number(((state >> 18n) ^ state) >> 27n) >>> 0;
    let rot = Number(state >> 59n) & 31;
    return ((xorshifted >>> rot) | (xorshifted << ((-rot) & 31))) / 0xFFFFFFFF;
  };
}

// -------- 1D Poisson-disc --------
export function poisson1D(minGap:number, max:number, rnd:RNG): number[] {
  const pts:number[] = []; let t = 0;
  while (t < max) {
    const gap = minGap + (-Math.log(1 - rnd()) * minGap); // 指数分布偏移
    t += gap; if (t < max) pts.push(t);
  }
  return pts;
}

// -------- MarkovChooser --------
export class MarkovChooser<T> {
  private weights: Map<T, number> = new Map();
  private last: T | null = null;
  private rnd: RNG;
  constructor(pairs: [T, number][], rnd:RNG){
    pairs.forEach(([k,w])=>this.weights.set(k, Math.max(1e-6, w)));
    this.rnd = rnd;
  }
  next(): T {
    const items = [...this.weights.entries()].map(([k,w])=>({k,w:(this.last===k? w*0.35 : w)}));
    const sum = items.reduce((a,b)=>a+b.w,0);
    let r = this.rnd()*sum;
    for (const it of items){ r -= it.w; if (r <= 0){ this.last = it.k; return it.k; } }
    return items[items.length-1].k;
  }
}

// -------- BlueNoiseJitter --------
export function blueJitter(base:number, strength:number, rnd:RNG){
  // 近似蓝噪：双层不同频率的减法噪声
  const n1 = rnd(); const n2 = rnd(); const j = (n1 - n2) * strength;
  return Math.max(0, Math.min(1, base + j));
}

// -------- 混沌映射（可控） --------
export function logisticStep(x:number, r=3.73){ return Math.max(0, Math.min(1, r*x*(1-x))); }

export function ikedaStep(xy:{x:number,y:number}, u=0.918, a=0.4){
  // 简化 Ikeda：产生平滑游走（用于相位/角度）
  const {x,y} = xy;
  const t = 0.4 - 6.0/(1 + x*x + y*y);
  const nx = 1 + u*(x*Math.cos(t) - y*Math.sin(t));
  const ny = u*(x*Math.sin(t) + y*Math.cos(t));
  return { x:nx*a, y:ny*a };
}
