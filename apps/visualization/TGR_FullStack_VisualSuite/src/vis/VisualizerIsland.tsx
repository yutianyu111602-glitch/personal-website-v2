import React, { useEffect, useRef } from 'react';
import { UnifiedCore, Preset, Mood, NowPlaying, AudioFeatures, Perf } from './UnifiedTechnoMoodCore';
import { EngineGL } from './engine';

type Props = {
  presets: Preset[];
  getMood: ()=>Mood;
  getAudioFeatures: ()=>AudioFeatures;
  getNowPlaying: ()=>NowPlaying|undefined;
  onPerf?: (p:Perf)=>void;
  width?:number;
  height?:number;
};

export default function VisualizerIsland(props: Props){
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const coreRef = useRef<UnifiedCore|null>(null);
  const glRef = useRef<EngineGL|null>(null);

  useEffect(()=>{
    let rafId = 0;
    const canvas = canvasRef.current!;
    const gl = new EngineGL(canvas);
    glRef.current = gl;
    coreRef.current = new UnifiedCore({ technoSteps:16, seedSalt:20250824 });

    function tick(){
      const mood = props.getMood();
      const af = props.getAudioFeatures();
      const np = props.getNowPlaying();
      const perf = gl.samplePerf();
      const pipeline = coreRef.current!.stepOnce(performance.now(), mood, af, np, perf, props.presets);

      gl.render(pipeline); // 写 uniforms + 跑 pass
      props.onPerf?.(gl.samplePerf());
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return ()=> cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} width={props.width||1280} height={props.height||720} />;
}
