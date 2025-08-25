/**
 * engine.ts — DeepPack 引擎（带 Generators / Bloom / Temporal / Flow 位移）
 */
import type { BlendPipeline, Extras } from './UnifiedTechnoMoodCore';

type Prog = { prog: WebGLProgram };
type FBO = { fbo: WebGLFramebuffer, tex: WebGLTexture, w:number, h:number };

async function fetchText(url:string){ const r = await fetch(url); return await r.text(); }

function createGL(canvas: HTMLCanvasElement){
  const gl = canvas.getContext('webgl', { antialias:false, alpha:false, premultipliedAlpha:false });
  if(!gl) throw new Error('WebGL not available');
  gl.getExtension('OES_standard_derivatives');
  return gl;
}
function compile(gl: WebGLRenderingContext, vsSrc:string, fsSrc:string): Prog {
  const vs = gl.createShader(gl.VERTEX_SHADER)!; gl.shaderSource(vs, vsSrc); gl.compileShader(vs);
  if(!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(vs)||'vs error');
  const fs = gl.createShader(gl.FRAGMENT_SHADER)!; gl.shaderSource(fs, fsSrc); gl.compileShader(fs);
  if(!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(fs)||'fs error');
  const p = gl.createProgram()!; gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)||'link error');
  return { prog: p };
}
function quad(gl: WebGLRenderingContext){
  const buf = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  const q = new Float32Array([ -1,-1, 3,-1, -1,3 ]);
  gl.bufferData(gl.ARRAY_BUFFER, q, gl.STATIC_DRAW); return buf;
}
function makeFBO(gl: WebGLRenderingContext, w:number, h:number):FBO{
  const tex = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const fbo = gl.createFramebuffer()!; gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { fbo, tex, w, h };
}

export class EngineGL {
  gl: WebGLRenderingContext;
  w=1; h=1;
  buf!: WebGLBuffer;
  last=performance.now();
  avgFrameMs=16;

  // programs
  progBlend!: Prog;
  progBloomThresh!: Prog;
  progKawaseDown!: Prog;
  progKawaseUp!: Prog;
  progComposite!: Prog;
  progCurl!: Prog;
  progDomain!: Prog;
  progWorley!: Prog;
  progLIC!: Prog;
  progRD!: Prog;

  // FBOs
  read!: FBO; write!: FBO; prev!: FBO;
  bloomA!: FBO; bloomB!: FBO; bloomC!: FBO;
  auxA!: FBO; auxB!: FBO; auxC!: FBO;

  static async create(canvas: HTMLCanvasElement){
    const gl = createGL(canvas); const eng = new EngineGL(gl);
    eng.resize(canvas.width, canvas.height); await eng.initPrograms();
    return eng;
  }
  constructor(gl: WebGLRenderingContext){ this.gl = gl; this.buf = quad(gl); }

  async initPrograms(){
    const vs = await fetchText('/src/vis/glsl/fullscreen.vert');
    const fsBlend = await fetchText('/src/vis/glsl/blend.frag');
    const fsThresh = await fetchText('/src/vis/glsl/bloom_threshold.frag');
    const fsKDown = await fetchText('/src/vis/glsl/kawase_down.frag');
    const fsKUp = await fetchText('/src/vis/glsl/kawase_up.frag');
    const fsComp = await fetchText('/src/vis/glsl/composite.frag');
    const fsCurl = await fetchText('/src/vis/glsl/generators/curl_flow.frag');
    const fsDomain = await fetchText('/src/vis/glsl/generators/domain_warp.frag');
    const fsWorley = await fetchText('/src/vis/glsl/generators/worley_mask.frag');
    const fsLIC = await fetchText('/src/vis/glsl/generators/lic.frag');
    const fsRD = await fetchText('/src/vis/glsl/generators/rd_gray_scott_fake.frag');

    this.progBlend      = compile(this.gl, vs, fsBlend);
    this.progBloomThresh= compile(this.gl, vs, fsThresh);
    this.progKawaseDown = compile(this.gl, vs, fsKDown);
    this.progKawaseUp   = compile(this.gl, vs, fsKUp);
    this.progComposite  = compile(this.gl, vs, fsComp);
    this.progCurl       = compile(this.gl, vs, fsCurl);
    this.progDomain     = compile(this.gl, vs, fsDomain);
    this.progWorley     = compile(this.gl, vs, fsWorley);
    this.progLIC        = compile(this.gl, vs, fsLIC);
    this.progRD         = compile(this.gl, vs, fsRD);
  }

  resize(w:number, h:number){
    const gl=this.gl; this.w=w; this.h=h;
    this.read = makeFBO(gl,w,h); this.write = makeFBO(gl,w,h); this.prev = makeFBO(gl,w,h);
    this.bloomA = makeFBO(gl, Math.max(1,w>>1), Math.max(1,h>>1));
    this.bloomB = makeFBO(gl, Math.max(1,w>>2), Math.max(1,h>>2));
    this.bloomC = makeFBO(gl, Math.max(1,w>>3), Math.max(1,h>>3));
    this.auxA = makeFBO(gl,w,h); this.auxB=makeFBO(gl,w,h); this.auxC=makeFBO(gl,w,h);
  }

  samplePerf(){
    const now = performance.now(); const dt = now-this.last; this.last = now;
    this.avgFrameMs = this.avgFrameMs*0.9 + dt*0.1;
    return { avgFrameMs: this.avgFrameMs } as any;
  }

  drawTo(fbo:FBO|null){ const gl=this.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, fbo?fbo.fbo:null); gl.viewport(0,0, fbo?fbo.w:this.w, fbo?fbo.h:this.h); }
  bindQuad(prog:Prog){ const gl=this.gl; const loc=gl.getAttribLocation(prog.prog,'aPos'); gl.bindBuffer(gl.ARRAY_BUFFER, this.buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0); }
  setTex(unit:number, tex:WebGLTexture, locName:string, prog:Prog){ const gl=this.gl; const loc=gl.getUniformLocation(prog.prog, locName); gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D, tex); if(loc) gl.uniform1i(loc, unit); }

  render(pipeline: BlendPipeline){
    const gl=this.gl;
    // 0) 清屏 -> read
    this.drawTo(this.read); gl.clearColor(0.70,0.72,0.74,1); gl.clear(gl.COLOR_BUFFER_BIT);

    // 1) 生成 extras（flow/texture/pattern）
    this.runExtras(pipeline.extras);

    // 2) 节点执行
    let bloomWeight=0;
    for(const n of pipeline.nodes){
      if(n.id==='BloomHL'){ bloomWeight = Math.max(bloomWeight, n.weight); continue; }
      this.drawBlend(n.id, n.weight, n.uniforms||{});
      const tmp=this.read; this.read=this.write; this.write=tmp;
    }

    // 3) Bloom
    if (bloomWeight>0.001){
      this.bloom(bloomWeight);
      this.drawComposite(this.read, this.bloomA, bloomWeight);
    }

    // 4) Temporal 保存
    this.blit(this.read, this.prev);

    // 5) 输出
    this.drawComposite(null as any, this.read, 1.0);
  }

  runExtras(ex?: Extras){
    const gl=this.gl;
    if (!ex) return;
    // flow
    if (ex.flow?.id==='CurlNoise'){
      this.drawTo(this.auxA); gl.useProgram(this.progCurl.prog); this.bindQuad(this.progCurl);
      gl.uniform2f(gl.getUniformLocation(this.progCurl.prog,'uRes'), this.auxA.w, this.auxA.h);
      gl.uniform1f(gl.getUniformLocation(this.progCurl.prog,'uTime'), performance.now()/1000);
      gl.drawArrays(gl.TRIANGLES,0,3);
    } else if (ex.flow?.id==='DomainWarp'){
      this.drawTo(this.auxA); gl.useProgram(this.progDomain.prog); this.bindQuad(this.progDomain);
      gl.uniform2f(gl.getUniformLocation(this.progDomain.prog,'uRes'), this.auxA.w, this.auxA.h);
      gl.uniform1f(gl.getUniformLocation(this.progDomain.prog,'uTime'), performance.now()/1000);
      gl.drawArrays(gl.TRIANGLES,0,3);
    } else if (ex.flow?.id==='LIC'){
      this.drawTo(this.auxA); gl.useProgram(this.progLIC.prog); this.bindQuad(this.progLIC);
      gl.uniform2f(gl.getUniformLocation(this.progLIC.prog,'uRes'), this.auxA.w, this.auxA.h);
      gl.uniform1f(gl.getUniformLocation(this.progLIC.prog,'uTime'), performance.now()/1000);
      gl.drawArrays(gl.TRIANGLES,0,3);
    } else if (ex.flow?.id==='StableFluid'){
      // 简化：用Curl替代一帧效果（真实流体请引入多pass模拟）
      this.drawTo(this.auxA); gl.useProgram(this.progCurl.prog); this.bindQuad(this.progCurl);
      gl.uniform2f(gl.getUniformLocation(this.progCurl.prog,'uRes'), this.auxA.w, this.auxA.h);
      gl.uniform1f(gl.getUniformLocation(this.progCurl.prog,'uTime'), performance.now()/1000);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    // texture
    if (ex.texture?.id==='Worley'){
      this.drawTo(this.auxB); gl.useProgram(this.progWorley.prog); this.bindQuad(this.progWorley);
      gl.uniform2f(gl.getUniformLocation(this.progWorley.prog,'uRes'), this.auxB.w, this.auxB.h);
      gl.uniform1f(gl.getUniformLocation(this.progWorley.prog,'uTime'), performance.now()/1000);
      gl.drawArrays(gl.TRIANGLES,0,3);
    } else {
      // 退化：domain warp纹理
      this.drawTo(this.auxB); gl.useProgram(this.progDomain.prog); this.bindQuad(this.progDomain);
      gl.uniform2f(gl.getUniformLocation(this.progDomain.prog,'uRes'), this.auxB.w, this.auxB.h);
      gl.uniform1f(gl.getUniformLocation(this.progDomain.prog,'uTime'), performance.now()/1000);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    // pattern
    if (ex.pattern?.id==='ReactionDiffusion' || ex.pattern?.id==='Lenia' || ex.pattern?.id==='WFC'){
      this.drawTo(this.auxC); gl.useProgram(this.progRD.prog); this.bindQuad(this.progRD);
      gl.uniform2f(gl.getUniformLocation(this.progRD.prog,'uRes'), this.auxC.w, this.auxC.h);
      gl.uniform1f(gl.getUniformLocation(this.progRD.prog,'uTime'), performance.now()/1000);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
  }

  drawBlend(mode:string, weight:number, uniforms:Record<string,number>){
    const gl=this.gl; const p=this.progBlend; gl.useProgram(p.prog); this.bindQuad(p);
    this.drawTo(this.write);
    this.setTex(0, this.read.tex, 'uSrc', p);
    this.setTex(1, this.prev.tex, 'uPrev', p);
    this.setTex(2, this.auxA.tex, 'uFlow', p);
    this.setTex(3, this.auxB.tex, 'uTexA', p);
    this.setTex(4, this.auxC.tex, 'uTexB', p);
    gl.uniform2f(gl.getUniformLocation(p.prog,'uRes'), this.w, this.h);
    gl.uniform1f(gl.getUniformLocation(p.prog,'uTime'), performance.now()/1000);
    gl.uniform1f(gl.getUniformLocation(p.prog,'uWeight'), weight);

    const enumMap: Record<string, number> = {
      LumaSoftOverlay:0, SMix:1, OkLabLightness:2,
      BoundedDodge:3, SoftBurn:4, StructureMix:5,
      DualCurve:6, SpecularGrad:7, GrainMerge:8,
      EdgeTint:9, TemporalTrail:10
    };
    gl.uniform1i(gl.getUniformLocation(p.prog,'uMode'), enumMap[mode] ?? 0);

    // Extra tunables
    for (const [k,v] of Object.entries(uniforms)) {
      const locU = gl.getUniformLocation(p.prog, 'u_'+k);
      if (locU) gl.uniform1f(locU, v as number);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  bloom(strength:number){
    const gl=this.gl;
    // threshold
    this.drawTo(this.bloomA);
    gl.useProgram(this.progBloomThresh.prog); this.bindQuad(this.progBloomThresh);
    this.setTex(0, this.read.tex, 'uSrc', this.progBloomThresh);
    gl.uniform2f(gl.getUniformLocation(this.progBloomThresh.prog,'uRes'), this.bloomA.w, this.bloomA.h);
    gl.uniform1f(gl.getUniformLocation(this.progBloomThresh.prog,'uThresh'), 0.75);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // down
    this.kawase(this.bloomA, this.bloomB, self, this.progKawaseDown, 1.0);
    this.kawase(this.bloomB, this.bloomC, self, this.progKawaseDown, 1.0);
    // up
    this.kawase(this.bloomC, this.bloomB, self, this.progKawaseUp, 1.0);
    this.kawase(this.bloomB, this.bloomA, self, this.progKawaseUp, 1.0);
  }
  kawase(src:FBO, dst:FBO, _self:any, prog:Prog, offset:number){
    const gl=this.gl; this.drawTo(dst); gl.useProgram(prog.prog); this.bindQuad(prog);
    this.setTex(0, src.tex, 'uTex', prog);
    gl.uniform2f(gl.getUniformLocation(prog.prog,'uRes'), dst.w, dst.h);
    gl.uniform1f(gl.getUniformLocation(prog.prog,'uOffset'), offset);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  drawComposite(target:FBO|null, src:FBO, gain:number){
    const gl=this.gl; this.drawTo(target); gl.useProgram(this.progComposite.prog); this.bindQuad(this.progComposite);
    this.setTex(0, src.tex, 'uSrc', this.progComposite);
    gl.uniform1f(gl.getUniformLocation(this.progComposite.prog,'uGain'), gain);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  blit(src:FBO, dst:FBO){ this.drawComposite(dst, src, 1.0); }
}
