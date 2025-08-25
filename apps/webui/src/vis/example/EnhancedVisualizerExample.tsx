/**
 * EnhancedVisualizerExample.tsx - 增强版可视化器使用示例
 * 展示如何使用集成了TGR精华算法的增强版系统
 */

import React, { useEffect, useRef, useState } from 'react';
import { EnhancedLiquidMetalConductor } from '../EnhancedLiquidMetalConductor';
import { computeAudioFeatures } from '../AudioReactive';
import { pipelineToRenderInstructions, TelemetryCollector } from '../EnhancedEngineBridge';
import type { Mood, Preset } from '../LiquidMetalConductor';
import type { NowPlaying } from '../UnifiedDrive';
import type { PerformanceMetrics } from '../PerformanceAdaptive';
import { StrategyLoader } from '../strategy/StrategyLoader';

// 示例预设（可以扩展为60+预设）
const EXAMPLE_PRESETS: Preset[] = [
  {
    id: 'liquid-silver',
    tags: {
      metalScore: 0.95,
      energyBias: 0.3,
      valenceBias: 0.2,
      arousalBias: 0.5,
      hueShiftRisk: 0.05,
      specularBoost: 0.8,
      rippleAffinity: 0.7,
      cost: 2,
      flowAffinity: 0.8,
      organicAffinity: 0.4,
      fractureAffinity: 0.3
    }
  },
  {
    id: 'chrome-polish',
    tags: {
      metalScore: 0.9,
      energyBias: 0.5,
      valenceBias: 0.0,
      arousalBias: 0.7,
      hueShiftRisk: 0.1,
      specularBoost: 0.9,
      rippleAffinity: 0.5,
      cost: 3,
      flowAffinity: 0.6,
      organicAffinity: 0.2,
      fractureAffinity: 0.6
    }
  },
  {
    id: 'mercury-flow',
    tags: {
      metalScore: 0.85,
      energyBias: -0.2,
      valenceBias: 0.3,
      arousalBias: 0.3,
      hueShiftRisk: 0.15,
      specularBoost: 0.6,
      rippleAffinity: 0.9,
      cost: 2,
      flowAffinity: 0.95,
      organicAffinity: 0.7,
      fractureAffinity: 0.1
    }
  }
];

export const EnhancedVisualizerExample: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const conductorRef = useRef<EnhancedLiquidMetalConductor>();
  const telemetryRef = useRef<TelemetryCollector>();
  const animationFrameRef = useRef<number>();
  
  const [mood, setMood] = useState<Mood>({
    energy: 0.5,
    valence: 0.0,
    arousal: 0.5
  });
  
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({
    title: 'Example Track',
    artist: 'Demo Artist',
    bpm: 128,
    segment: 'steady',
    trackId: 'demo-001'
  });
  
  const [performanceInfo, setPerformanceInfo] = useState<{
    fps: number;
    tier: string;
    recommendations: string[];
  }>({ fps: 60, tier: 'high', recommendations: [] });
  
  useEffect(() => {
    // 初始化
    conductorRef.current = new EnhancedLiquidMetalConductor({
      enableMarkov: true,
      enablePerformanceAdaptation: true,
      enableSegmentAwareness: true,
      enableDynamicTTL: true
    });
    
    telemetryRef.current = new TelemetryCollector();

    // 加载策略并接入
    const loader = new StrategyLoader();
    loader.loadStatic('/src/vis/strategy/combos.json','/src/vis/strategy/strategy.rules.json')
      .then(() => loader.attachTo(conductorRef.current!))
      .catch(console.error);
    
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsUpdateTime = lastTime;
    
    // 渲染循环
    const render = () => {
      const now = performance.now();
      const deltaMs = now - lastTime;
      lastTime = now;
      
      frameCount++;
      
      // 更新FPS（每秒一次）
      if (now - fpsUpdateTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / (now - fpsUpdateTime));
        frameCount = 0;
        fpsUpdateTime = now;
        
        // 记录遥测数据
        telemetryRef.current?.record({
          type: 'fps',
          data: { fps }
        });
      }
      
      // 模拟音频特征（实际应该从WebAudio获取）
      const fakeFFT = new Float32Array(512);
      for (let i = 0; i < fakeFFT.length; i++) {
        fakeFFT[i] = Math.random() * 0.5 * mood.energy;
      }
      
      const audioFeatures = computeAudioFeatures(fakeFFT, 48000, Math.random() > 0.9 ? 1 : 0);
      
      // 性能指标
      const performanceMetrics: PerformanceMetrics = {
        avgFrameMs: deltaMs,
        fps: 1000 / deltaMs
      };
      
      // 调度
      const pipeline = conductorRef.current!.schedule(
        mood,
        audioFeatures,
        nowPlaying,
        performanceMetrics,
        EXAMPLE_PRESETS,
        now
      );
      
      // 转换为渲染指令
      const driveVector = { E: mood.energy, A: mood.arousal, V: mood.valence };
      const instructions = pipelineToRenderInstructions(
        pipeline,
        driveVector,
        performanceMetrics
      );
      
      // 记录pipeline变化
      telemetryRef.current?.record({
        type: 'pipeline_change',
        data: {
          nodeCount: pipeline.nodes.length,
          totalWeight: instructions.metadata.totalWeight,
          tier: instructions.metadata.performanceTier
        }
      });
      
      // 渲染到canvas（这里只是示例，实际应该调用WebGL）
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 清除画布
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 可视化pipeline
          let y = 20;
          ctx.fillStyle = '#fff';
          ctx.font = '14px monospace';
          
          ctx.fillText(`FPS: ${Math.round(performanceMetrics.fps)} | Tier: ${instructions.metadata.performanceTier}`, 10, y);
          y += 25;
          
          ctx.fillText(`Nodes: ${pipeline.nodes.length} | Weight: ${instructions.metadata.totalWeight.toFixed(3)}`, 10, y);
          y += 25;
          
          // 显示当前节点
          pipeline.nodes.forEach(node => {
            const hue = node.category === 'Base' ? 200 : node.category === 'Accent' ? 120 : 300;
            ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
            ctx.fillText(`${node.category}: ${node.id} (${node.weight.toFixed(3)})`, 10, y);
            y += 20;
          });
          
          // 显示驱动向量
          y += 10;
          ctx.fillStyle = '#888';
          ctx.fillText(`Drive: E=${driveVector.E.toFixed(2)} A=${driveVector.A.toFixed(2)} V=${driveVector.V.toFixed(2)}`, 10, y);
          
          // 显示段落
          y += 20;
          ctx.fillText(`Segment: ${nowPlaying.segment}`, 10, y);
        }
      }
      
      // 更新性能信息
      const stats = telemetryRef.current!.getStats();
      setPerformanceInfo({
        fps: stats.avgFps || 60,
        tier: instructions.metadata.performanceTier,
        recommendations: []
      });
      
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mood, nowPlaying]);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>增强版液态金属可视化器示例</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          style={{
            border: '1px solid #333',
            borderRadius: '8px',
            backgroundColor: '#1a1a1a'
          }}
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* 情绪控制 */}
        <div style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>情绪控制</h3>
          
          <label>
            能量 Energy: {mood.energy.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={mood.energy}
              onChange={e => setMood({ ...mood, energy: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </label>
          
          <label>
            唤醒度 Arousal: {mood.arousal.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={mood.arousal}
              onChange={e => setMood({ ...mood, arousal: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </label>
          
          <label>
            情感效价 Valence: {mood.valence.toFixed(2)}
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={mood.valence}
              onChange={e => setMood({ ...mood, valence: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </label>
        </div>
        
        {/* 音乐控制 */}
        <div style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>音乐控制</h3>
          
          <label>
            BPM: {nowPlaying.bpm}
            <input
              type="range"
              min="60"
              max="200"
              step="1"
              value={nowPlaying.bpm}
              onChange={e => setNowPlaying({ ...nowPlaying, bpm: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
          </label>
          
          <label>
            段落 Segment:
            <select
              value={nowPlaying.segment}
              onChange={e => setNowPlaying({ ...nowPlaying, segment: e.target.value as any })}
              style={{ width: '100%', marginTop: '5px' }}
            >
              <option value="steady">Steady</option>
              <option value="build">Build</option>
              <option value="drop">Drop</option>
              <option value="fill">Fill</option>
              <option value="break">Break</option>
            </select>
          </label>
        </div>
        
        {/* 性能信息 */}
        <div style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>性能信息</h3>
          <p>FPS: {performanceInfo.fps}</p>
          <p>层级: {performanceInfo.tier}</p>
          <p>遥测事件: {telemetryRef.current?.getEvents().length || 0}</p>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#333', borderRadius: '8px' }}>
        <h4 style={{ marginTop: 0 }}>算法特性展示</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>✅ 统一驱动算法：将情绪、音频、BPM统一为三维向量</li>
          <li>✅ 马尔可夫链增强：节点切换更加平滑自然</li>
          <li>✅ 性能自适应：根据FPS自动调整渲染质量</li>
          <li>✅ 音乐段落感知：不同段落使用不同的视觉风格</li>
          <li>✅ 动态TTL：高能量时快速切换，低能量时保持稳定</li>
        </ul>
      </div>
    </div>
  );
};
