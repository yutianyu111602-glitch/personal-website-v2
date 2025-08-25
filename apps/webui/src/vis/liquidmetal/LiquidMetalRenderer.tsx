import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LiquidMetalAdapter, AdapterInputs } from './LiquidMetalAdapter';
import { BlendPipeline, scheduler, Mood, Preset } from '../LiquidMetalConductor';
import { computeAudioFeatures, pickMicroMods, applyMicroMods } from '../AudioReactive';
import { TechnoRandomizer } from '../TechnoRandomizer';

/**
 * LiquidMetalRenderer - 基于统一架构的渲染器
 * 使用 LiquidMetalSuite_PRO 套件和原生 WebGL 进行渲染
 */

export type LiquidMetalRendererProps = {
  inputs: AdapterInputs;
  width?: number;
  height?: number;
  visible?: boolean;
  quality?: 'low' | 'medium' | 'high';
};

export const LiquidMetalRenderer = ({ 
  inputs, 
  width=640, 
  height=360, 
  visible=true,
  quality='medium'
}: LiquidMetalRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [debug, setDebug] = useState('');
  const [isWebGLAvailable, setIsWebGLAvailable] = useState(false);
  const [renderQuality, setRenderQuality] = useState(quality);
  const [currentPipeline, setCurrentPipeline] = useState<BlendPipeline | null>(null);

  // WebGL 相关引用
  const glRef = useRef(null);
  const programRef = useRef(null);
  const buffersRef = useRef({ position: null, textureCoord: null, indices: null });

  // 预设配置（可以扩展为60+预设）
  const presets: Preset[] = [
    { 
      id: 'preset-polish', 
      tags: { 
        metalScore: 0.9, 
        energyBias: 0.3, 
        valenceBias: 0.2, 
        arousalBias: 0.5, 
        hueShiftRisk: 0.1, 
        specularBoost: 0.7, 
        rippleAffinity: 0.6, 
        cost: 2 
      } 
    },
    { 
      id: 'preset-carve', 
      tags: { 
        metalScore: 0.85, 
        energyBias: -0.2, 
        valenceBias: -0.1, 
        arousalBias: 0.4, 
        hueShiftRisk: 0.1, 
        specularBoost: 0.4, 
        rippleAffinity: 0.5, 
        cost: 2 
      } 
    }
  ];

  // Techno 随机器配置
  const technoHooks = {
    onKick: () => {
      // 低频冲击效果
    },
    onHat: () => {
      // 高频打击效果
    },
    onAccent: () => {
      // 重音效果
    },
    onBuildTick: (progress: number) => {
      // 构建段落进度
    },
    onDrop: () => {
      // 下降段落
    },
    onFillTick: (time: number) => {
      // 填充段落
    },
    pLock: (targetId: string, key: string, val: number) => {
      // 参数锁定
    },
    mutateWeight: (id: string, delta: number) => {
      // 权重调整
    }
  };

  const technoRandomizer = new TechnoRandomizer({}, technoHooks);

  // 编译着色器
  const compileShader = useCallback((gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('着色器编译错误:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  // 创建着色器程序
  const createProgram = useCallback((gl: WebGLRenderingContext | WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null => {
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('程序链接错误:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }, []);

  // 创建缓冲区
  const createBuffers = useCallback((gl: WebGLRenderingContext | WebGL2RenderingContext) => {
    // 顶点位置
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0,
      -1.0,  1.0
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // 纹理坐标
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    const textureCoords = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);

    // 索引
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    buffersRef.current = {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer
    };
  }, []);

  // 渲染管线
  const renderPipeline = useCallback((pipeline: BlendPipeline) => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    // 清除画布
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 使用着色器程序
    gl.useProgram(program);

    // 设置顶点属性
    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.position);
    const positionLocation = gl.getAttribLocation(program, 'aVertexPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.textureCoord);
    const textureCoordLocation = gl.getAttribLocation(program, 'aTextureCoord');
    gl.enableVertexAttribArray(textureCoordLocation);
    gl.vertexAttribPointer(textureCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // 设置 uniforms
    const timeLocation = gl.getUniformLocation(program, 'uTime');
    if (timeLocation) gl.uniform1f(timeLocation, Date.now() * 0.001);

    const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
    if (resolutionLocation) gl.uniform2f(resolutionLocation, width, height);

    // 绘制
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffersRef.current.indices);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    console.log('渲染 LiquidMetal 管线:', pipeline);

  }, [width, height]);

  // 初始化 WebGL 上下文
  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL不可用');
      setIsWebGLAvailable(false);
      return;
    }

    glRef.current = gl;

    // 基础着色器源码
    const vertexShaderSource = `
      attribute vec2 aVertexPosition;
      attribute vec2 aTextureCoord;
      varying vec2 vTextureCoord;
      
      void main() {
        gl_Position = vec4(aVertexPosition, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 vTextureCoord;
      uniform float uTime;
      uniform vec2 uResolution;
      
      void main() {
        vec2 uv = vTextureCoord;
        vec3 color = vec3(0.8, 0.8, 0.9); // 液态金属银色调
        
        // 添加时间动画
        float t = uTime * 0.5;
        color += 0.1 * sin(uv.x * 10.0 + t) * sin(uv.y * 8.0 + t * 0.7);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    try {
      const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
      
      if (!vertexShader || !fragmentShader) {
        throw new Error('着色器编译失败');
      }

      const program = createProgram(gl, vertexShader, fragmentShader);
      if (!program) {
        throw new Error('程序创建失败');
      }

      programRef.current = program;
      createBuffers(gl);
      
      setIsWebGLAvailable(true);
      console.log('✅ LiquidMetal WebGL 渲染器初始化成功');
    } catch (error) {
      console.error('❌ LiquidMetal WebGL 初始化失败:', error);
      setIsWebGLAvailable(false);
    }

    return () => {
      // 清理资源
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
      }
      if (gl && buffersRef.current.position) {
        gl.deleteBuffer(buffersRef.current.position);
      }
      if (gl && buffersRef.current.textureCoord) {
        gl.deleteBuffer(buffersRef.current.textureCoord);
      }
      if (gl && buffersRef.current.indices) {
        gl.deleteBuffer(buffersRef.current.indices);
      }
      glRef.current = null;
      programRef.current = null;
    };
  }, [visible, width, height, compileShader, createProgram, createBuffers]);

  // 渲染循环
  useEffect(() => {
    if (!visible || !isWebGLAvailable) return;

    const adapter = new LiquidMetalAdapter(inputs);
    const adapterOutput = adapter.step();

    // 获取当前情绪状态
    const mood: Mood = {
      energy: adapterOutput.pipeline.nodes.length > 0 ? 0.5 : 0.5,
      valence: 0.0,
      arousal: 0.5,
      beat: false
    };

    // 使用 LiquidMetalConductor 调度器
    const pipeline = scheduler(mood, Date.now(), 16, presets);
    setCurrentPipeline(pipeline);

    // 模拟音频特征（实际项目中应该从 WebAudio 获取）
    const fakeFFT = new Float32Array(512);
    for (let i = 0; i < fakeFFT.length; i++) {
      fakeFFT[i] = Math.random() * 0.5;
    }
    const audioFeatures = computeAudioFeatures(fakeFFT, 48000, mood.beat ? 1 : 0);

    // 应用微策略
    const microMods = pickMicroMods(Date.now(), audioFeatures, true);
    applyMicroMods(microMods, pipeline, true, audioFeatures);

    // Techno 随机器推进
    technoRandomizer.tick(Date.now());

    // 渲染管线
    renderPipeline(pipeline);

    // 更新调试信息
    setDebug(`情绪: E${mood.energy.toFixed(2)} V${mood.valence.toFixed(2)} A${mood.arousal.toFixed(2)} | 管线: ${pipeline.nodes.length}节点`);

  }, [visible, isWebGLAvailable, inputs, renderPipeline]);

  if (!visible) return null;

  return (
    <div className="liquid-metal-renderer">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #333',
          borderRadius: '8px',
          backgroundColor: '#1a1a1a'
        }}
      />
      {debug && (
        <div className="debug-info" style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {debug}
        </div>
      )}
    </div>
  );
};

export default LiquidMetalRenderer;


