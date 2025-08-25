
/**
 * index.example.ts — 一键对接示例（无依赖即可编译运行）
 * 说明：这个文件演示如何在没有 WebGL 的环境下跑“编排逻辑”与“音频驱动”。
 * 你可以把 applyPipelineToShader 替换为你的实际 GL 层实现。
 */

import { scheduler, debugPipeline, Mood, Preset } from './LiquidMetalConductor';
import { computeAudioFeatures, pickMicroMods, applyMicroMods, AudioFeatures } from './AudioReactive';

// 伪造 FFT 数据（真实场景请改为 WebAudio AnalyserNode 获取）
function fakeFFT(n=1024): Float32Array {
  const a = new Float32Array(n/2);
  for (let i=0;i<a.length;i++){
    const t = (Date.now()%5000)/5000;
    // 简单三峰：sub/bass/presence
    const f = i/a.length;
    a[i] = Math.max(0, Math.sin(6.283*f*3 + t*12) * 0.2 + (f<0.1?0.6*f:0) + (f>0.4&&f<0.6?0.4:0.05));
  }
  return a;
}

// 示例预设（请替换成你的 60+ 预设）
const presets: Preset[] = [
  { id:'preset-polish', tags:{ metalScore:0.9, energyBias:0.3, valenceBias:0.2, arousalBias:0.5, hueShiftRisk:0.1, specularBoost:0.7, rippleAffinity:0.6, cost:2 } },
  { id:'preset-carve',  tags:{ metalScore:0.85, energyBias:-0.2, valenceBias:-0.1, arousalBias:0.4, hueShiftRisk:0.1, specularBoost:0.4, rippleAffinity:0.5, cost:2 } },
];

// 情绪（可接入你的情绪系统）
function getMood(): Mood {
  const t = (Date.now()%10000)/10000;
  return { energy:0.6+0.4*Math.sin(t*6.283), valence:0.1, arousal:0.5, beat:false };
}

// 平滑帧耗
let last = Date.now(), avgMs = 16;
function updateFps(){ const now=Date.now(); const dt=now-last; last=now; avgMs = avgMs*0.9 + dt*0.1; }

// 假“渲染”函数：这里只打印 pipeline 概要，实际项目请写入 Shader uniforms
function applyPipelineToShader(p: ReturnType<typeof scheduler>){
  console.log(debugPipeline(p));
}

// 主循环（每 ~33ms）
setInterval(()=>{
  updateFps();
  const fft = fakeFFT(1024);
  const af: AudioFeatures = computeAudioFeatures(fft, 48000, Math.random()>0.8 ? 1 : 0);
  const mood = getMood(); mood.beat = af.beat>0.6;

  const pipeline = scheduler(mood, Date.now(), avgMs, presets);

  const mods = pickMicroMods(Date.now(), af, avgMs<18);
  applyMicroMods(mods, pipeline, avgMs<18, af);

  applyPipelineToShader(pipeline);
}, 33);
