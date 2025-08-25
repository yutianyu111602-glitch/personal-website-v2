/**
 * LiquidMetalAdapter
 * 适配器：将项目中的音频/情绪数据桥接到 LiquidMetal 调度器与微策略，输出 uniforms 与管线
 */

import { scheduler, debugPipeline, Mood, Preset, BlendPipeline } from './LiquidMetalConductor';
import { computeAudioFeatures, pickMicroMods, applyMicroMods, AudioFeatures } from './AudioReactive';

export type AdapterInputs = {
  getMood: () => Mood;
  getFFT: () => Float32Array; // 归一化幅度 0..1，长度 N/2
  sampleRate: number;
  presets: Preset[];
};

export type AdapterOutputs = {
  pipeline: BlendPipeline;
  uniforms: Record<string, number>;
  debug: string;
};

export class LiquidMetalAdapter {
  private last = Date.now();
  private avgMs = 16;

  constructor(private inputs: AdapterInputs) {}

  /** 单步更新，返回当前管线与建议 uniforms（可直接写入 Shader） */
  step(): AdapterOutputs {
    const now = Date.now();
    const dt = now - this.last; this.last = now; this.avgMs = this.avgMs*0.9 + dt*0.1;

    const fft = this.inputs.getFFT();
    const af: AudioFeatures = computeAudioFeatures(fft, this.inputs.sampleRate, 0);
    const mood = this.inputs.getMood(); mood.beat = af.beat>0.6;

    let pipeline = scheduler(mood, now, this.avgMs, this.inputs.presets);
    const mods = pickMicroMods(now, af, this.avgMs<18);
    applyMicroMods(mods, pipeline, this.avgMs<18, af);

    // 从 pipeline 汇总导出常用 uniforms（开发者可扩展）
    const uniforms: Record<string, number> = {};
    pipeline.nodes.forEach(n => {
      if (!n.uniforms) return;
      Object.entries(n.uniforms).forEach(([k,v])=>{ uniforms[`u_${n.id}_${k}`] = v; });
    });
    // 全局建议（亮度上限/jitter 等可从 Global 写入）
    if (!('uBrightCap' in uniforms)) uniforms.uBrightCap = 0.95;
    if (!('uJitter' in uniforms)) uniforms.uJitter = 0.015;

    return { pipeline, uniforms, debug: debugPipeline(pipeline) };
  }
}


