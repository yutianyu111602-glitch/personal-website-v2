/**
 * UnifiedWebGLEngine.tsx - 统一WebGL渲染引擎
 * 
 * 整合功能：
 * - ShaderCanvas: 基础WebGL渲染器
 * - UniverseEntropyVisualizer: 可视化引擎
 * - LiquidMetalRenderer: 液态金属渲染器
 * - 统一的WebGL上下文管理
 * - 着色器编译和程序管理
 * - 缓冲区管理
 * - 渲染管线抽象
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

// WebGL上下文类型
export type WebGLContextType = 'webgl' | 'webgl2';

// 着色器类型
export interface ShaderSource {
  vertex: string;
  fragment: string;
  uniforms?: Record<string, { type: 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'bool'; value: any }>;
}

// 缓冲区数据
export interface BufferData {
  positions: Float32Array;
  textureCoords: Float32Array;
  indices: Uint16Array;
}

// 渲染配置
export interface RenderConfig {
  antialias: boolean;
  alpha: boolean;
  depth: boolean;
  stencil: boolean;
  powerPreference: 'default' | 'low-power' | 'high-performance';
  preserveDrawingBuffer: boolean;
}

// 默认渲染配置
export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  antialias: true,
  alpha: false,
  depth: true,
  stencil: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false
};

// 性能配置
export interface PerformanceConfig {
  targetFPS: number;
  adaptiveQuality: boolean;
  maxDrawCalls: number;
  enableVSync: boolean;
}

// 默认性能配置
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  targetFPS: 60,
  adaptiveQuality: true,
  maxDrawCalls: 1000,
  enableVSync: true
};

// 渲染状态
export interface RenderState {
  isInitialized: boolean;
  isRendering: boolean;
  currentFPS: number;
  drawCalls: number;
  lastFrameTime: number;
  quality: 'low' | 'medium' | 'high';
}

// 渲染管线接口
export interface RenderPipeline {
  id: string;
  name: string;
  shaderSource: ShaderSource;
  bufferData: BufferData;
  uniforms: Record<string, any>;
  enabled: boolean;
  order: number;
}

// WebGL引擎配置
export interface WebGLEngineConfig {
  render: RenderConfig;
  performance: PerformanceConfig;
  enableDebug: boolean;
  maxPipelines: number;
}

// 默认引擎配置
export const DEFAULT_ENGINE_CONFIG: WebGLEngineConfig = {
  render: DEFAULT_RENDER_CONFIG,
  performance: DEFAULT_PERFORMANCE_CONFIG,
  enableDebug: true,
  maxPipelines: 10
};

// 引擎事件
export interface EngineEvents {
  onContextCreated?: (gl: WebGLRenderingContext | WebGL2RenderingContext) => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  onPipelineCompiled?: (pipeline: RenderPipeline) => void;
  onRenderError?: (error: Error) => void;
  onPerformanceChange?: (state: RenderState) => void;
}

export interface UnifiedWebGLEngineProps {
  width?: number;
  height?: number;
  config?: Partial<WebGLEngineConfig>;
  events?: EngineEvents;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const UnifiedWebGLEngine: React.FC<UnifiedWebGLEngineProps> = ({
  width = 640,
  height = 360,
  config = {},
  events = {},
  children,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const engineConfig = useRef<WebGLEngineConfig>({ ...DEFAULT_ENGINE_CONFIG, ...config });
  
  const [renderState, setRenderState] = useState<RenderState>({
    isInitialized: false,
    isRendering: false,
    currentFPS: 0,
    drawCalls: 0,
    lastFrameTime: 0,
    quality: 'medium'
  });
  
  const [pipelines, setPipelines] = useState<Map<string, RenderPipeline>>(new Map());
  const [activePipelines, setActivePipelines] = useState<string[]>([]);
  
  const rafRef = useRef<number | null>(null);
  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(performance.now());
  
  // 创建WebGL上下文
  const createWebGLContext = useCallback((): WebGLRenderingContext | WebGL2RenderingContext | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const { render } = engineConfig.current;
    
    // 尝试创建WebGL2上下文
    let gl = canvas.getContext('webgl2', {
      antialias: render.antialias,
      alpha: render.alpha,
      depth: render.depth,
      stencil: render.stencil,
      powerPreference: render.powerPreference,
      preserveDrawingBuffer: render.preserveDrawingBuffer
    });
    
    // 如果WebGL2不可用，回退到WebGL1
    if (!gl) {
      gl = canvas.getContext('webgl', {
        antialias: render.antialias,
        alpha: render.alpha,
        depth: render.depth,
        stencil: render.stencil,
        powerPreference: render.powerPreference,
        preserveDrawingBuffer: render.preserveDrawingBuffer
      });
    }
    
    if (!gl) {
      console.error('WebGL不可用');
      return null;
    }
    
    // 设置画布尺寸
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // 启用必要的功能
    if (render.depth) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    }
    
    if (render.alpha) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    
    return gl;
  }, [width, height]);
  
  // 编译着色器
  const compileShader = useCallback((
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    type: number,
    source: string
  ): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      console.error('着色器编译失败:', error);
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);
  
  // 创建着色器程序
  const createProgram = useCallback((
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string
  ): WebGLProgram | null => {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      console.error('着色器程序链接失败:', error);
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }, [compileShader]);
  
  // 创建缓冲区
  const createBuffers = useCallback((
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    bufferData: BufferData
  ) => {
    const buffers = {
      position: gl.createBuffer(),
      textureCoord: gl.createBuffer(),
      indices: gl.createBuffer()
    };
    
    if (!buffers.position || !buffers.textureCoord || !buffers.indices) {
      console.error('缓冲区创建失败');
      return null;
    }
    
    // 位置缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData.positions, gl.STATIC_DRAW);
    
    // 纹理坐标缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData.textureCoords, gl.STATIC_DRAW);
    
    // 索引缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bufferData.indices, gl.STATIC_DRAW);
    
    return buffers;
  }, []);
  
  // 设置uniforms
  const setUniforms = useCallback((
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram,
    uniforms: Record<string, any>
  ) => {
    Object.entries(uniforms).forEach(([name, value]) => {
      const location = gl.getUniformLocation(program, name);
      if (location !== null) {
        if (typeof value === 'number') {
          gl.uniform1f(location, value);
        } else if (Array.isArray(value)) {
          if (value.length === 2) {
            gl.uniform2f(location, value[0], value[1]);
          } else if (value.length === 3) {
            gl.uniform3f(location, value[0], value[1], value[2]);
          } else if (value.length === 4) {
            gl.uniform4f(location, value[0], value[1], value[2], value[3]);
          }
        } else if (typeof value === 'boolean') {
          gl.uniform1i(location, value ? 1 : 0);
        }
      }
    });
  }, []);
  
  // 渲染管线
  const renderPipeline = useCallback((
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    pipeline: RenderPipeline
  ) => {
    if (!pipeline.enabled) return;
    
    try {
      // 使用着色器程序
      gl.useProgram(pipeline.program as any);
      
      // 设置uniforms
      setUniforms(gl, pipeline.program as any, pipeline.uniforms);
      
      // 设置顶点属性
      const positionLocation = gl.getAttribLocation(pipeline.program as any, 'aVertexPosition');
      const texCoordLocation = gl.getAttribLocation(pipeline.program as any, 'aTextureCoord');
      
      if (positionLocation !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, pipeline.buffers?.position as any);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      }
      
      if (texCoordLocation !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, pipeline.buffers?.textureCoord as any);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
      }
      
      // 绘制
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pipeline.buffers?.indices as any);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      
      // 更新统计
      setRenderState(prev => ({ ...prev, drawCalls: prev.drawCalls + 1 }));
      
    } catch (error) {
      console.error(`渲染管线执行失败 [${pipeline.id}]:`, error);
      events.onRenderError?.(error as Error);
    }
  }, [setUniforms, events]);
  
  // 主渲染循环
  const renderLoop = useCallback(() => {
    if (!glRef.current || !renderState.isInitialized) return;
    
    const gl = glRef.current;
    const now = performance.now();
    
    // 清除画布
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    if (engineConfig.current.render.depth) {
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else {
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    // 渲染所有活跃的管线
    const sortedPipelines = Array.from(pipelines.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.order - b.order);
    
    sortedPipelines.forEach(pipeline => {
      renderPipeline(gl, pipeline);
    });
    
    // 更新性能指标
    frameCount.current++;
    if (now - lastTime.current >= 1000) {
      const fps = frameCount.current;
      setRenderState(prev => ({
        ...prev,
        currentFPS: fps,
        drawCalls: 0,
        lastFrameTime: now
      }));
      
      frameCount.current = 0;
      lastTime.current = now;
      
      // 性能事件
      events.onPerformanceChange?.(renderState);
    }
    
    // 继续渲染循环
    rafRef.current = requestAnimationFrame(renderLoop);
  }, [renderState.isInitialized, pipelines, renderPipeline, renderState, events]);
  
  // 初始化WebGL
  useEffect(() => {
    const gl = createWebGLContext();
    if (!gl) return;
    
    glRef.current = gl;
    setRenderState(prev => ({ ...prev, isInitialized: true }));
    
    // 事件通知
    events.onContextCreated?.(gl);
    
    // 启动渲染循环
    setRenderState(prev => ({ ...prev, isRendering: true }));
    rafRef.current = requestAnimationFrame(renderLoop);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [createWebGLContext, renderLoop, events]);
  
  // 清理资源
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // 清理WebGL资源
      if (glRef.current) {
        const gl = glRef.current;
        pipelines.forEach(pipeline => {
          if (pipeline.program) {
            gl.deleteProgram(pipeline.program as any);
          }
          if (pipeline.buffers) {
            gl.deleteBuffer(pipeline.buffers.position as any);
            gl.deleteBuffer(pipeline.buffers.textureCoord as any);
            gl.deleteBuffer(pipeline.buffers.indices as any);
          }
        });
      }
    };
  }, [pipelines]);
  
  // 添加渲染管线
  const addPipeline = useCallback(async (pipeline: Omit<RenderPipeline, 'program' | 'buffers'>) => {
    if (!glRef.current) return false;
    
    const gl = glRef.current;
    
    try {
      // 编译着色器程序
      const program = createProgram(gl, pipeline.shaderSource.vertex, pipeline.shaderSource.fragment);
      if (!program) return false;
      
      // 创建缓冲区
      const buffers = createBuffers(gl, pipeline.bufferData);
      if (!buffers) return false;
      
      // 创建完整的管线
      const completePipeline: RenderPipeline = {
        ...pipeline,
        program: program as any,
        buffers
      };
      
      setPipelines(prev => {
        const newPipelines = new Map(prev);
        newPipelines.set(pipeline.id, completePipeline);
        return newPipelines;
      });
      
      // 事件通知
      events.onPipelineCompiled?.(completePipeline);
      
      return true;
    } catch (error) {
      console.error(`管线创建失败 [${pipeline.id}]:`, error);
      return false;
    }
  }, [createProgram, createBuffers, events]);
  
  // 移除渲染管线
  const removePipeline = useCallback((id: string) => {
    setPipelines(prev => {
      const newPipelines = new Map(prev);
      const pipeline = newPipelines.get(id);
      
      if (pipeline) {
        // 清理WebGL资源
        if (glRef.current && pipeline.program) {
          const gl = glRef.current;
          gl.deleteProgram(pipeline.program as any);
          if (pipeline.buffers) {
            gl.deleteBuffer(pipeline.buffers.position as any);
            gl.deleteBuffer(pipeline.buffers.textureCoord as any);
            gl.deleteBuffer(pipeline.buffers.indices as any);
          }
        }
        
        newPipelines.delete(id);
      }
      
      return newPipelines;
    });
  }, []);
  
  // 启用/禁用管线
  const setPipelineEnabled = useCallback((id: string, enabled: boolean) => {
    setPipelines(prev => {
      const newPipelines = new Map(prev);
      const pipeline = newPipelines.get(id);
      
      if (pipeline) {
        newPipelines.set(id, { ...pipeline, enabled });
      }
      
      return newPipelines;
    });
  }, []);
  
  // 更新管线uniforms
  const updatePipelineUniforms = useCallback((id: string, uniforms: Record<string, any>) => {
    setPipelines(prev => {
      const newPipelines = new Map(prev);
      const pipeline = newPipelines.get(id);
      
      if (pipeline) {
        newPipelines.set(id, { ...pipeline, uniforms: { ...pipeline.uniforms, ...uniforms } });
      }
      
      return newPipelines;
    });
  }, []);
  
  // 暴露引擎方法给子组件
  const engineContext = useMemo(() => ({
    addPipeline,
    removePipeline,
    setPipelineEnabled,
    updatePipelineUniforms,
    getRenderState: () => renderState,
    getConfig: () => engineConfig.current,
    updateConfig: (newConfig: Partial<WebGLEngineConfig>) => {
      engineConfig.current = { ...engineConfig.current, ...newConfig };
    }
  }), [addPipeline, removePipeline, setPipelineEnabled, updatePipelineUniforms, renderState]);
  
  return (
    <div className={`unified-webgl-engine ${className}`} style={style}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width,
          height,
          display: 'block'
        }}
      />
      
      {/* 调试信息 */}
      {engineConfig.current.enableDebug && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div>FPS: {renderState.currentFPS}</div>
          <div>Draw Calls: {renderState.drawCalls}</div>
          <div>Pipelines: {pipelines.size}</div>
          <div>Quality: {renderState.quality}</div>
        </div>
      )}
      
      {/* 子组件 */}
      {children && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { engine: engineContext });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

export default UnifiedWebGLEngine;
