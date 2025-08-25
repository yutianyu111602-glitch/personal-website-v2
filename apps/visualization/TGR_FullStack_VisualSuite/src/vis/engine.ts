/**
 * engine.ts — WebGL 引擎最小实现（内置液态金属着色器）
 * - WebGL1 以避免 #version 差异，直接可跑
 * - 根据 pipeline 节点累积一份“视觉权重向量”，喂给 shader 做组合
 */
import type { BlendPipeline } from './UnifiedTechnoMoodCore';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){
  vUv = aPos*0.5+0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2  uRes;
uniform vec4  uWeightsBase;   // x: LumaSoftOverlay, y: SMix, z: OkLabLightness, w: reserved
uniform vec4  uWeightsAccent; // x: BoundedDodge, y: SoftBurn, z: StructureMix, w: DualCurve
uniform vec4  uWeightsDecor;  // x: GrainMerge, y: EdgeTint, z: TemporalTrail, w: BloomHL
// 简易噪声
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(a,b,u.x)+ (c-a)*u.y*(1.0-u.x)+ (d-b)*u.x*u.y;
}
vec3 toLin(vec3 c){ return pow(max(c,0.0), vec3(2.2)); }
vec3 toSRGB(vec3 c){ return pow(max(c,0.0), vec3(1.0/2.2)); }
float luma(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }
// 金属高光近似
vec3 metalSpec(vec2 uv, vec3 base){
  vec2 p = uv*uRes/ min(uRes.x,uRes.y);
  float n1 = noise(p*1.7 + uTime*0.12);
  float n2 = noise(p*2.9 - uTime*0.07);
  float h = smoothstep(0.4, 0.8, n1*0.7 + n2*0.5);
  vec3 N = normalize(vec3(dFdx(h), dFdy(h), 1.0));
  vec3 V = normalize(vec3(0.0,0.0,1.0));
  vec3 L = normalize(vec3(0.4,0.3,0.8));
  vec3 H = normalize(V+L);
  float NoL = max(dot(N,L), 0.0);
  float NoH = max(dot(N,H), 0.0);
  float spec = pow(NoH, 64.0);
  return clamp(base + spec*NoL, 0.0, 1.0);
}
void main(){
  vec2 uv = vUv;
  // 背景：冷中性色；用噪声扰动亮度模拟银底
  float n = noise(uv*4.0 + uTime*0.05);
  vec3 bg = vec3(0.70,0.72,0.74) * (0.85 + n*0.15);

  // Base 组合（柔和对比增强）
  float wLuma = uWeightsBase.x;
  float wSMix = uWeightsBase.y;
  float wOkL  = uWeightsBase.z;
  vec3 baseMix = mix(bg, mix(bg*1.05, bg + (0.5 - vec3(luma(bg))), 0.5), wSMix*0.5);
  baseMix = mix(baseMix, mix(baseMix, vec3(luma(baseMix)), wOkL*0.3), wOkL*0.6);
  baseMix = mix(baseMix, baseMix*(0.95 + wLuma*0.1), wLuma);

  // Accent（提亮、对比、结构感）
  float wDodge = uWeightsAccent.x;
  float wBurn  = uWeightsAccent.y;
  float wStruct= uWeightsAccent.z;
  float wDual  = uWeightsAccent.w;
  vec3 acc = baseMix;
  acc = mix(acc, clamp(acc/(1.0-0.15*wDodge),0.0,1.0), wDodge);
  acc = mix(acc, acc*(0.9 - 0.2*wBurn), wBurn*0.6);
  float edge = smoothstep(0.1,0.6, abs(dFdx(luma(acc))) + abs(dFdy(luma(acc))) );
  acc = mix(acc, mix(acc, vec3(edge), 0.25), wStruct*0.6);
  acc = mix(acc, mix(acc, pow(acc, vec3(1.0/(1.0+0.5*wDual))), wDual), wDual);

  // Decor（边缘冷色、拖影、Bloom假）
  float wGrain = uWeightsDecor.x;
  float wEdge  = uWeightsDecor.y;
  float wTrail = uWeightsDecor.z;
  float wBloom = uWeightsDecor.w;
  vec3 col = acc;
  col += (hash(uv*vec2(197.0,113.0)+uTime)-0.5)*0.05*wGrain;
  col = mix(col, vec3(col.r*0.95, col.g*0.98, min(1.0,col.b*1.02)), wEdge*0.6);
  col = mix(col, metalSpec(uv, col), 0.35 + 0.35*(wBloom));

  // ToneMap/Gamma
  col = toSRGB(col);
  gl_FragColor = vec4(col, 1.0);
}`;

export class EngineGL {
  gl: WebGLRenderingContext;
  w=1; h=1;
  prog: WebGLProgram|null = null;
  buf: WebGLBuffer|null = null;
  last=performance.now();
  avgFrameMs=16;

  constructor(canvas: HTMLCanvasElement){
    const gl = canvas.getContext('webgl', { antialias:false, alpha:false, premultipliedAlpha:false })!;
    if(!gl) throw new Error('WebGL not available');
    this.gl = gl;
    this.w = canvas.width; this.h = canvas.height;
    this.init();
  }

  init(){
    const gl=this.gl;
    const v = gl.createShader(gl.VERTEX_SHADER)!; gl.shaderSource(v, VERT); gl.compileShader(v);
    const f = gl.createShader(gl.FRAGMENT_SHADER)!; gl.shaderSource(f, FRAG); gl.compileShader(f);
    const p = gl.createProgram()!; gl.attachShader(p,v); gl.attachShader(p,f); gl.linkProgram(p);
    this.prog = p;
    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    const quad = new Float32Array([ -1,-1,  3,-1,  -1,3 ]);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  }

  samplePerf(){
    const now = performance.now(); const dt = now-this.last; this.last = now;
    this.avgFrameMs = this.avgFrameMs*0.9 + dt*0.1;
    return { avgFrameMs: this.avgFrameMs } as any;
  }

  render(pipeline: BlendPipeline){
    const gl=this.gl;
    const p=this.prog!;
    gl.viewport(0,0,this.w,this.h);
    gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    const loc=gl.getAttribLocation(p,'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

    // pack weights
    let base=[0,0,0,0], acc=[0,0,0,0], dec=[0,0,0,0];
    const wById = (id:string, w:number)=>{
      if(id==='LumaSoftOverlay') base[0]+=w;
      else if(id==='SMix') base[1]+=w;
      else if(id==='OkLabLightness') base[2]+=w;
      else if(id==='BoundedDodge') acc[0]+=w;
      else if(id==='SoftBurn') acc[1]+=w;
      else if(id==='StructureMix') acc[2]+=w;
      else if(id==='DualCurve') acc[3]+=w;
      else if(id==='GrainMerge') dec[0]+=w;
      else if(id==='EdgeTint') dec[1]+=w;
      else if(id==='TemporalTrail') dec[2]+=w;
      else if(id==='BloomHL') dec[3]+=w;
      else if(id==='SpecularGrad') acc[3]+=w*0.5; // 混到 DualCurve 略影响
    };
    pipeline.nodes.forEach(n=>wById(n.id, n.weight));

    gl.uniform1f(gl.getUniformLocation(p,'uTime'), performance.now()/1000);
    gl.uniform2f(gl.getUniformLocation(p,'uRes'), this.w, this.h);
    gl.uniform4f(gl.getUniformLocation(p,'uWeightsBase'), base[0],base[1],base[2],base[3]);
    gl.uniform4f(gl.getUniformLocation(p,'uWeightsAccent'), acc[0],acc[1],acc[2],acc[3]);
    gl.uniform4f(gl.getUniformLocation(p,'uWeightsDecor'), dec[0],dec[1],dec[2],dec[3]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
