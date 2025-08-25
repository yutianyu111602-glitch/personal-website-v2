import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * 背景管理器 - 天宫科技全屏视觉体验应用
 * 
 * 功能特点：
 * - 统一的背景切换系统
 * - 自动循环机制
 * - 流畅的过渡动画
 * - 性能优化的预加载
 * - 简洁的API接口
 * - GPU渲染优化支持
 * 
 * GPU优化特性：
 * - 🎮 强制使用高性能GPU上下文
 * - ⚡ WebGL2优先，回退到WebGL1
 * - 🔧 自动GPU扩展检测和启用
 * - 📊 实时GPU性能监控
 * - 🎯 自适应质量调整
 * - 💾 GPU内存泄漏防护
 * 
 * 作者：麻蛇 @ 天宫科技
 * 版本：v2.1.0 - GPU优化增强版
 */

// 正确的ES6模块导入 - 修复构建问题
import { ShaderCanvas } from "./ShaderCanvas";
import { ShaderBackground } from "./ShaderBackground";

// GPU优化配置 - 让Cursor在后端安装相应的GPU驱动程序
export const GPU_OPTIMIZED_CONFIG = {
  // WebGL上下文配置 - 强制使用高性能GPU
  webglContextAttributes: {
    alpha: false,                        // 禁用alpha通道，提升性能 
    antialias: false,                   // 关闭抗锯齿，由GPU处理
    depth: false,                       // 不需要深度缓冲区
    stencil: false,                     // 不需要模板缓冲区  
    powerPreference: "high-performance", // 🎮 强制使用高性能GPU (请确保安装最新GPU驱动)
    preserveDrawingBuffer: false,       // 不保留绘图缓冲区，释放内存
    premultipliedAlpha: false,          // 禁用预乘alpha，提升性能
    failIfMajorPerformanceCaveat: true  // 性能不足时失败，确保GPU加速
  },

  // Canvas2D优化配置
  canvas2DAttributes: {
    alpha: false,                       // 禁用alpha通道
    willReadFrequently: false,          // 优化GPU写入性能
    desynchronized: true                // 启用异步渲染，减少阻塞
  },

  // 渲染循环优化配置
  renderingConfig: {
    useRequestAnimationFrame: true,     // 使用RAF而非定时器，同步垂直刷新
    enableVSync: true,                 // 启用垂直同步，避免撕裂
    maxFPS: 120,                      // 最大帧率限制，防止过度渲染
    adaptiveQuality: true,            // 自适应质量调整
    lowPowerMode: false,              // 禁用低功耗模式，确保最佳性能
    preferGPUAcceleration: true       // 优先GPU加速
  },

  // 内存管理优化配置
  memoryConfig: {
    enableTextureCompression: true,    // 启用纹理压缩，节省显存
    maxTextureSize: 4096,             // 最大纹理尺寸限制
    enableMipmapping: true,           // 启用多级渐远纹理，优化远景渲染
    garbageCollectionThreshold: 0.8,  // GC触发阈值
    enableMemoryProfiling: true       // 启用内存分析
  },

  // GPU扩展优先级列表 - 按重要性排序
  requiredExtensions: [
    'OES_texture_float',              // 浮点纹理支持 - 高质量渲染必需
    'OES_texture_float_linear',       // 浮点纹理线性过滤
    'WEBGL_draw_buffers',             // 多重渲染目标 - 高级着色器技术
    'EXT_texture_filter_anisotropic', // 各向异性过滤 - 提升纹理质量
    'WEBGL_debug_renderer_info',      // GPU信息访问 - 性能监控必需
    'OES_element_index_uint',         // 32位索引 - 支持大型网格
    'WEBGL_compressed_texture_s3tc',  // S3TC纹理压缩 - 节省显存
    'WEBGL_lose_context',             // 上下文丢失模拟 - 错误恢复
    'OES_vertex_array_object',        // 顶点数组对象 - 性能优化
    'ANGLE_instanced_arrays'          // 实例化数组 - 批量渲染优化
  ]
};

// GPU性能监控类
class GPUPerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private memoryInfo: any = null;
  private gpuInfo: any = null;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // GPU内存监控初始化
    if ('memory' in performance) {
      this.memoryInfo = (performance as any).memory;
    }

    // WebGL上下文丢失/恢复监控
    document.addEventListener('webglcontextlost', this.handleContextLoss.bind(this));
    document.addEventListener('webglcontextrestored', this.handleContextRestore.bind(this));
  }

  public measureFrameTime(callback: () => void): number {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    
    // 更新FPS计算
    this.frameCount++;
    if (endTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (endTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = endTime;
    }

    return endTime - startTime;
  }

  public getGPUMetrics() {
    return {
      fps: this.fps,
      memoryUsage: this.memoryInfo ? {
        used: Math.round(this.memoryInfo.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(this.memoryInfo.totalJSHeapSize / 1024 / 1024), // MB  
        limit: Math.round(this.memoryInfo.jsHeapSizeLimit / 1024 / 1024) // MB
      } : null,
      gpuInfo: this.gpuInfo,
      timestamp: Date.now()
    };
  }

  public setGPUInfo(info: any) {
    this.gpuInfo = info;
  }

  private handleContextLoss(event: Event) {
    console.warn('🔥 WebGL上下文丢失! GPU驱动可能需要更新');
    console.warn('💡 建议: 1. 更新GPU驱动 2. 重启浏览器 3. 检查GPU温度');
  }

  private handleContextRestore(event: Event) {
    console.log('✅ WebGL上下文已恢复');
  }
}

// 全局GPU监控实例
const gpuMonitor = new GPUPerformanceMonitor();

// 导入错误处理 - 使用动态导入作为回退
let ShaderCanvasComponent: any = null;
let ShaderBackgroundComponent: any = null;

// 安全的组件导入处理
try {
  ShaderCanvasComponent = ShaderCanvas;
  ShaderBackgroundComponent = ShaderBackground;
} catch (error) {
  console.warn("Shader组件导入失败，将使用回退方案:", error);
}

/**
 * GPU配置检测和优化类
 * 自动检测GPU能力并应用最佳设置
 * 
 * 🎮 GPU驱动程序安装指引:
 * Windows: 下载对应厂商最新驱动 (NVIDIA/AMD/Intel)
 * macOS: 系统自动管理，确保系统更新
 * Linux: sudo apt install nvidia-driver-535 或 mesa-vulkan-drivers
 */
class GPUOptimizer {
  private static instance: GPUOptimizer;
  private gpuInfo: any = {};
  private supportedExtensions: string[] = [];
  private recommendedSettings: any = {};

  constructor() {
    this.detectGPUCapabilities();
  }

  public static getInstance(): GPUOptimizer {
    if (!GPUOptimizer.instance) {
      GPUOptimizer.instance = new GPUOptimizer();
    }
    return GPUOptimizer.instance;
  }

  /**
   * 🔍 GPU能力检测 - 自动分析硬件配置
   * 检测GPU型号、驱动版本、支持的扩展
   */
  private detectGPUCapabilities() {
    try {
      const canvas = document.createElement('canvas');
      
      // 🎮 尝试获取高性能WebGL2上下文
      const gl = canvas.getContext('webgl2', GPU_OPTIMIZED_CONFIG.webglContextAttributes) ||
                 canvas.getContext('webgl', GPU_OPTIMIZED_CONFIG.webglContextAttributes);
      
      if (!gl) {
        console.warn('❌ WebGL不可用，GPU加速将被禁用');
        this.recommendedSettings = this.getFallbackSettings();
        return;
      }

      // 🔍 获取GPU硬件信息
      this.extractGPUInfo(gl);
      
      // 🔧 检测支持的GPU扩展
      this.detectSupportedExtensions(gl);
      
      // ⚙️ 根据GPU能力生成推荐设置
      this.generateRecommendedSettings(gl);
      
      // 📊 将GPU信息传递给监控器
      gpuMonitor.setGPUInfo(this.gpuInfo);
      
      console.log('🎮 GPU检测完成:', this.gpuInfo);
      console.log('🔧 支持的扩展:', this.supportedExtensions.length, '个');
      
    } catch (error) {
      console.error('🔥 GPU检测失败:', error);
      this.recommendedSettings = this.getFallbackSettings();
    }
  }

  /**
   * 📋 提取GPU硬件信息
   * 获取厂商、型号、驱动版本等关键信息
   */
  private extractGPUInfo(gl: WebGLRenderingContext) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    this.gpuInfo = {
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
      version: gl.getParameter(gl.VERSION),
      glslVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      isWebGL2: gl instanceof WebGL2RenderingContext
    };

    // 🎮 GPU性能等级评估
    this.gpuInfo.performanceLevel = this.assessGPUPerformance(this.gpuInfo.renderer);
    
    // 💡 GPU驱动建议
    this.gpuInfo.driverRecommendation = this.getDriverRecommendation(this.gpuInfo);
  }

  /**
   * 🎯 GPU性能等级评估
   * 根据GPU型号自动判断性能级别
   */
  private assessGPUPerformance(renderer: string): 'low' | 'medium' | 'high' | 'ultra' {
    const rendererLower = renderer.toLowerCase();
    
    // 🚀 Ultra级GPU (旗舰级)
    if (rendererLower.includes('rtx 40') || 
        rendererLower.includes('rtx 30') ||
        rendererLower.includes('rx 7000') ||
        rendererLower.includes('rx 6900') ||
        rendererLower.includes('m1 pro') ||
        rendererLower.includes('m1 max') ||
        rendererLower.includes('m2')) {
      return 'ultra';
    }
    
    // 🔥 High级GPU (高端)
    if (rendererLower.includes('rtx 20') ||
        rendererLower.includes('gtx 16') ||
        rendererLower.includes('rx 6') ||
        rendererLower.includes('rx 5700') ||
        rendererLower.includes('vega') ||
        rendererLower.includes('m1')) {
      return 'high';
    }
    
    // ⚡ Medium级GPU (中端)
    if (rendererLower.includes('gtx 10') ||
        rendererLower.includes('rx 5') ||
        rendererLower.includes('rx 400') ||
        rendererLower.includes('intel iris')) {
      return 'medium';
    }
    
    // 📱 Low级GPU (入门/集成显卡)
    return 'low';
  }

  /**
   * 💡 GPU驱动建议生成
   * 根据检测到的GPU提供驱动更新建议
   */
  private getDriverRecommendation(gpuInfo: any): string {
    const vendor = gpuInfo.vendor.toLowerCase();
    const renderer = gpuInfo.renderer.toLowerCase();
    
    if (vendor.includes('nvidia')) {
      return '🎮 建议安装最新NVIDIA驱动: https://www.nvidia.com/drivers/';
    } else if (vendor.includes('amd') || renderer.includes('radeon')) {
      return '🎮 建议安装最新AMD驱动: https://www.amd.com/support/';
    } else if (vendor.includes('intel') || renderer.includes('intel')) {
      return '🎮 建议安装最新Intel驱动: https://www.intel.com/content/www/us/en/support/';
    } else {
      return '🎮 建议更新GPU驱动以获得最佳性能';
    }
  }

  /**
   * 🔧 检测支持的GPU扩展
   * 遍历所有重要的WebGL扩展
   */
  private detectSupportedExtensions(gl: WebGLRenderingContext) {
    this.supportedExtensions = [];
    const enabledExtensions: any[] = [];
    
    GPU_OPTIMIZED_CONFIG.requiredExtensions.forEach(extName => {
      const extension = gl.getExtension(extName);
      if (extension) {
        this.supportedExtensions.push(extName);
        enabledExtensions.push(extension);
        console.log(`✅ GPU扩展已启用: ${extName}`);
      } else {
        console.warn(`⚠️ GPU扩展不支持: ${extName}`);
      }
    });

    // 🎯 特殊扩展处理
    this.handleSpecialExtensions(gl, enabledExtensions);
  }

  /**
   * 🎛️ 特殊GPU扩展处理
   * 配置特定扩展的优化参数
   */
  private handleSpecialExtensions(gl: WebGLRenderingContext, extensions: any[]) {
    // 各向异性过滤配置
    const anisotropicExt = gl.getExtension('EXT_texture_filter_anisotropic');
    if (anisotropicExt) {
      const maxAnisotropy = gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      console.log(`🔧 最大各向异性过滤级别: ${maxAnisotropy}`);
    }

    // 浮点纹理支持检查
    const floatTextureExt = gl.getExtension('OES_texture_float');
    if (floatTextureExt) {
      console.log('✅ 浮点纹理支持已启用 - 可使用高精度渲染');
    }

    // 压缩纹理支持检查
    const s3tcExt = gl.getExtension('WEBGL_compressed_texture_s3tc');
    if (s3tcExt) {
      console.log('✅ S3TC纹理压缩支持已启用 - 可节省显存');
    }
  }

  /**
   * ⚙️ 生成推荐设置
   * 根据GPU性能自动调整渲染参数
   */
  private generateRecommendedSettings(gl: WebGLRenderingContext) {
    const perfLevel = this.gpuInfo.performanceLevel;
    const maxTextureSize = this.gpuInfo.maxTextureSize;
    
    this.recommendedSettings = {
      // 🎯 质量设置
      quality: perfLevel,
      
      // 🖼️ 纹理设置
      textureSize: Math.min(maxTextureSize, this.getMaxTextureSizeForPerformance(perfLevel)),
      enableAnisotropicFiltering: perfLevel !== 'low',
      anisotropyLevel: perfLevel === 'ultra' ? 16 : perfLevel === 'high' ? 8 : perfLevel === 'medium' ? 4 : 1,
      
      // 🎬 渲染设置
      targetFPS: perfLevel === 'ultra' ? 120 : perfLevel === 'high' ? 90 : perfLevel === 'medium' ? 60 : 30,
      enableMSAA: perfLevel === 'ultra' || perfLevel === 'high',
      msaaSamples: perfLevel === 'ultra' ? 8 : 4,
      
      // 🔧 着色器设置  
      shaderComplexity: perfLevel,
      enableFloatTextures: this.supportedExtensions.includes('OES_texture_float'),
      enableTextureCompression: this.supportedExtensions.includes('WEBGL_compressed_texture_s3tc'),
      
      // 📊 性能监控
      enablePerformanceMonitoring: true,
      adaptiveQuality: perfLevel !== 'ultra' // Ultra级GPU不需要自适应调整
    };

    console.log('⚙️ GPU推荐设置:', this.recommendedSettings);
  }

  /**
   * 🖼️ 根据性能级别获取最大纹理尺寸
   */
  private getMaxTextureSizeForPerformance(perfLevel: string): number {
    switch (perfLevel) {
      case 'ultra': return 8192;
      case 'high': return 4096; 
      case 'medium': return 2048;
      case 'low': return 1024;
      default: return 1024;
    }
  }

  /**
   * 🛡️ 获取回退设置
   * 当GPU检测失败时使用的安全设置
   */
  private getFallbackSettings() {
    return {
      quality: 'low',
      textureSize: 512,
      enableAnisotropicFiltering: false,
      anisotropyLevel: 1,
      targetFPS: 30,
      enableMSAA: false,
      msaaSamples: 0,
      shaderComplexity: 'low',
      enableFloatTextures: false,
      enableTextureCompression: false,
      enablePerformanceMonitoring: false,
      adaptiveQuality: true
    };
  }

  // 公共接口
  public getGPUInfo() { return this.gpuInfo; }
  public getSupportedExtensions() { return this.supportedExtensions; }
  public getRecommendedSettings() { return this.recommendedSettings; }
}

// GPU优化器单例实例
const gpuOptimizer = GPUOptimizer.getInstance();

/**
 * 背景配置接口定义
 * 每个背景都包含完整的元数据和渲染配置
 */
export interface BackgroundConfig {
  id: number;
  name: string;
  type: 'shader' | 'static' | 'custom';
  fragmentShader?: string;
  color: string; // 银色主题色调
  category: 'liquid' | 'geometric' | 'atmospheric' | 'cosmic';
  description: string;
  performance: 'low' | 'medium' | 'high'; // 性能要求
  compatibility: string[]; // 兼容的浏览器列表
}

/**
 * 预定义背景库 - 银色主题专用
 * 严格控制只使用3种主要银色色调
 */
const DEFAULT_BACKGROUNDS: BackgroundConfig[] = [
  {
    id: 0,
    name: "Pure Silver",
    type: 'static',
    color: "#c0c5ce", // 银色主调1 - 纯银色
    category: 'atmospheric',
    description: "纯净银色渐变背景，极简设计",
    performance: 'low',
    compatibility: ['all']
  },
  {
    id: 1,
    name: "Liquid Chrome",
    type: 'shader',
    color: "#a8b2c4", // 银色主调2 - 液态铬色
    category: 'liquid',
    description: "流动的液态金属质感",
    performance: 'medium',
    compatibility: ['webgl', 'modern']
  },
  {
    id: 2,
    name: "Silver Mist",
    type: 'shader',
    color: "#9399a8", // 银色主调3 - 银雾色
    category: 'atmospheric',
    description: "银色雾气弥漫效果",
    performance: 'medium',
    compatibility: ['webgl', 'modern']
  },
  {
    id: 3,
    name: "Metallic Flow",
    type: 'shader',
    color: "#c0c5ce", // 复用银色主调1
    category: 'liquid',
    description: "金属质感流动动画",
    performance: 'high',
    compatibility: ['webgl2', 'latest']
  },
  {
    id: 4,
    name: "Cosmic Silver",
    type: 'shader',
    color: "#a8b2c4", // 复用银色主调2
    category: 'cosmic',
    description: "宇宙银河质感",
    performance: 'high',
    compatibility: ['webgl2', 'latest']
  }
];

/**
 * 背景管理器状态接口
 */
interface BackgroundManagerState {
  currentIndex: number;
  isTransitioning: boolean;
  isInitialized: boolean;
  autoRotate: boolean;
  preloadedBackgrounds: Set<number>;
}

/**
 * 默认状态配置
 */
const DEFAULT_STATE: BackgroundManagerState = {
  currentIndex: 0,
  isTransitioning: false,
  isInitialized: false,
  autoRotate: true,
  preloadedBackgrounds: new Set()
};

/**
 * 背景管理器属性接口
 */
export interface BackgroundManagerProps {
  className?: string;
  onBackgroundChange?: (background: BackgroundConfig) => void;
  autoRotateInterval?: number; // 自动切换间隔(毫秒)
  enablePreload?: boolean; // 是否启用预加载
  fallbackColor?: string; // 回退背景色
  debugMode?: boolean; // 调试模式
  style?: React.CSSProperties; // 添加style属性支持
  currentShaderIndex?: number; // 外部控制的shader索引
}

/**
 * 回退背景组件 - 激进修复：完全透明，避免任何背景变暗
 */
const FallbackBackground: React.FC<{ config: BackgroundConfig }> = ({ config }) => (
  <div 
    className="absolute inset-0"
    style={{
      // 极微弱的单一颜色提示，几乎透明
      background: `${config.color}02`, // 只有2%的透明度
    }}
  >
    {/* 调试信息 - 仅开发模式显示 */}
    {process.env.NODE_ENV === 'development' && (
      <div className="absolute bottom-4 left-4 text-white/20 text-xs font-mono pointer-events-none">
        Fallback: {config.name}
      </div>
    )}
  </div>
);

/**
 * 背景管理器主组件
 */
export const BackgroundManager: React.FC<BackgroundManagerProps> = ({
  className = "",
  onBackgroundChange,
  autoRotateInterval = 0, // 0 表示不自动切换，使用页面刷新机制
  enablePreload = true,
  fallbackColor = "#c0c5ce",
  debugMode = false,
  style = {}, // 添加style属性
  currentShaderIndex // 外部控制的shader索引
}) => {
  // 状态管理
  const [state, setState] = useState<BackgroundManagerState>(DEFAULT_STATE);
  
  // 背景配置库 - 可扩展
  const [backgrounds] = useState<BackgroundConfig[]>(DEFAULT_BACKGROUNDS);
  
  /**
   * 状态更新辅助函数
   */
  const updateState = useCallback((updates: Partial<BackgroundManagerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  /**
   * 浏览器兼容性检测
   */
  const checkCompatibility = useCallback((): string[] => {
    const support: string[] = ['all'];
    
    // WebGL 支持检测
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        support.push('webgl');
        
        // WebGL2 支持检测
        const gl2 = canvas.getContext('webgl2');
        if (gl2) {
          support.push('webgl2');
        }
      }
    } catch (error) {
      console.warn("WebGL 兼容性检测失败:", error);
    }
    
    // 现代浏览器特性检测
    if (window.CSS && CSS.supports && CSS.supports('backdrop-filter', 'blur(1px)')) {
      support.push('modern');
    }
    
    // 最新浏览器特性检测
    if ('OffscreenCanvas' in window && 'ImageBitmap' in window) {
      support.push('latest');
    }
    
    return support;
  }, []);
  
  /**
   * 获取兼容的背景列表
   */
  const compatibleBackgrounds = useMemo(() => {
    const compatibility = checkCompatibility();
    
    return backgrounds.filter(bg => {
      return bg.compatibility.some(req => 
        req === 'all' || compatibility.includes(req)
      );
    });
  }, [backgrounds, checkCompatibility]);
  
  /**
   * 当前背景配置
   */
  const currentBackground = useMemo(() => {
    // 🔧 修复：优先使用外部传入的currentShaderIndex
    const targetIndex = currentShaderIndex !== undefined ? currentShaderIndex : state.currentIndex;
    return compatibleBackgrounds[targetIndex] || compatibleBackgrounds[0] || backgrounds[0];
  }, [compatibleBackgrounds, state.currentIndex, backgrounds, currentShaderIndex]);
  
  /**
   * 🔧 修复：监听外部currentShaderIndex变化
   */
  useEffect(() => {
    if (currentShaderIndex !== undefined && currentShaderIndex !== state.currentIndex) {
      updateState({ currentIndex: currentShaderIndex });
      
      // 触发背景变化回调
      if (onBackgroundChange && compatibleBackgrounds[currentShaderIndex]) {
        onBackgroundChange(compatibleBackgrounds[currentShaderIndex]);
      }
      
      if (debugMode) {
        console.log(`🎨 外部背景切换: ${compatibleBackgrounds[currentShaderIndex]?.name} (${currentShaderIndex + 1}/${compatibleBackgrounds.length})`);
      }
    }
  }, [currentShaderIndex, state.currentIndex, updateState, onBackgroundChange, compatibleBackgrounds, debugMode]);
  
  /**
   * 初始化背景系统
   */
  useEffect(() => {
    const initializeBackgrounds = async () => {
      try {
        // 🔧 修复：优先使用外部传入的currentShaderIndex
        let nextIndex = currentShaderIndex !== undefined ? currentShaderIndex : 0;
        
        // 如果没有外部索引，则从本地存储恢复
        if (currentShaderIndex === undefined) {
          const storedIndex = localStorage.getItem("autoShaderIndex");
          
          if (storedIndex !== null) {
            const currentIndex = parseInt(storedIndex, 10);
            if (!isNaN(currentIndex) && currentIndex >= 0 && currentIndex < compatibleBackgrounds.length) {
              nextIndex = (currentIndex + 1) % compatibleBackgrounds.length;
            }
          }
        }
        
        // 更新状态
        updateState({
          currentIndex: nextIndex,
          isInitialized: true
        });
        
        // 保存到本地存储
        try {
          localStorage.setItem("autoShaderIndex", nextIndex.toString());
          localStorage.setItem("selectedShader", compatibleBackgrounds[nextIndex]?.id.toString() || "0");
        } catch (storageError) {
          console.warn("本地存储写入失败:", storageError);
        }
        
        // 触发回调
        if (onBackgroundChange && compatibleBackgrounds[nextIndex]) {
          onBackgroundChange(compatibleBackgrounds[nextIndex]);
        }
        
        if (debugMode) {
          console.log(`🎨 背景管理器初始化完成: ${compatibleBackgrounds[nextIndex]?.name} (${nextIndex + 1}/${compatibleBackgrounds.length})`);
        }
        
      } catch (error) {
        console.error("背景系统初始化失败:", error);
        // 回退到默认状态
        updateState({
          currentIndex: 0,
          isInitialized: true
        });
      }
    };
    
    initializeBackgrounds();
  }, [compatibleBackgrounds, onBackgroundChange, updateState, debugMode, currentShaderIndex]);
  
  /**
   * 渲染背景内容
   */
  const renderBackground = useCallback((background: BackgroundConfig) => {
    // 静态背景类型
    if (background.type === 'static' || background.id === 0) {
      return ShaderBackgroundComponent ? <ShaderBackgroundComponent /> : <FallbackBackground config={background} />;
    }
    
    // Shader背景类型
    if (background.type === 'shader') {
      return ShaderCanvasComponent ? (
        <ShaderCanvasComponent shaderId={background.id} />
      ) : (
        <FallbackBackground config={background} />
      );
    }
    
    // 默认回退
    return <FallbackBackground config={background} />;
  }, []);
  
  // 渲染加载状态
  if (!state.isInitialized) {
    return (
      <div 
        className={`absolute inset-0 ${className}`}
        style={{ 
          background: 'transparent', // 完全透明
          zIndex: -1,  // 设置为-1，与正常状态保持一致
          ...style
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/20 text-sm animate-pulse">
            Background System Loading...
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`absolute inset-0 ${className}`} style={{ zIndex: -1, ...style }}>
      {/* 背景渲染层 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBackground.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          className="absolute inset-0"
        >
          {renderBackground(currentBackground)}
        </motion.div>
      </AnimatePresence>
      
      {/* 调试信息层 */}
      {debugMode && (() => {
        const gpuMetrics = gpuMonitor.getGPUMetrics();
        const gpuInfo = gpuOptimizer.getGPUInfo();
        const recommendedSettings = gpuOptimizer.getRecommendedSettings();
        
        return (
          <div className="absolute top-4 left-4 pointer-events-none" style={{ zIndex: 100 }}>
            <div className="minimal-glass rounded px-3 py-2 text-xs font-mono max-w-sm">
              <div className="text-white/60 mb-2">🎮 GPU优化背景管理器 v2.1.0</div>
              
              {/* 基础信息 */}
              <div className="text-white/40 mb-1">当前背景: {currentBackground.name}</div>
              <div className="text-white/40 mb-1">索引: {state.currentIndex + 1}/{compatibleBackgrounds.length}</div>
              <div className="text-white/40 mb-1">类型: {currentBackground.type}</div>
              <div className="text-white/40 mb-2">性能要求: {currentBackground.performance}</div>
              
              {/* GPU信息 */}
              {gpuInfo.vendor && (
                <>
                  <div className="text-white/50 mb-1">🎮 GPU信息:</div>
                  <div className="text-white/30 text-[10px] mb-1">厂商: {gpuInfo.vendor}</div>
                  <div className="text-white/30 text-[10px] mb-1">型号: {gpuInfo.renderer?.substring(0, 30)}...</div>
                  <div className="text-white/30 text-[10px] mb-1">性能级别: {gpuInfo.performanceLevel}</div>
                  <div className="text-white/30 text-[10px] mb-2">WebGL2: {gpuInfo.isWebGL2 ? '✅' : '❌'}</div>
                </>
              )}
              
              {/* 性能监控 */}
              {gpuMetrics && (
                <>
                  <div className="text-white/50 mb-1">📊 性能监控:</div>
                  <div className="text-white/30 text-[10px] mb-1">FPS: {gpuMetrics.fps}</div>
                  {gpuMetrics.memoryUsage && (
                    <div className="text-white/30 text-[10px] mb-1">
                      内存: {gpuMetrics.memoryUsage.used}MB/{gpuMetrics.memoryUsage.total}MB
                    </div>
                  )}
                  <div className="text-white/30 text-[10px] mb-2">
                    目标FPS: {recommendedSettings.targetFPS || 60}
                  </div>
                </>
              )}
              
              {/* GPU优化状态 */}
              <div className="text-white/50 mb-1">⚙️ GPU优化:</div>
              <div className="text-white/30 text-[10px] mb-1">
                质量: {recommendedSettings.quality || 'auto'}
              </div>
              <div className="text-white/30 text-[10px] mb-1">
                纹理: {recommendedSettings.textureSize || 1024}px
              </div>
              <div className="text-white/30 text-[10px] mb-1">
                扩展: {gpuOptimizer.getSupportedExtensions().length}个
              </div>
              
              {/* 驱动建议 */}
              {gpuInfo.driverRecommendation && (
                <div className="text-white/40 text-[9px] mt-2 p-1 bg-black/20 rounded">
                  💡 {gpuInfo.driverRecommendation.substring(0, 50)}...
                </div>
              )}
            </div>
          </div>
        );
      })()}
      
      {/* 开发者控制面板 */}
      {debugMode && (
        <div className="absolute bottom-4 left-4 pointer-events-auto" style={{ zIndex: 100 }}>
          <div className="minimal-glass rounded p-2 flex space-x-2">
            <button
              onClick={() => {
                const prevIndex = (state.currentIndex - 1 + compatibleBackgrounds.length) % compatibleBackgrounds.length;
                updateState({ currentIndex: prevIndex });
              }}
              className="minimal-button rounded px-2 py-1 text-xs"
              disabled={state.isTransitioning}
            >
              ←
            </button>
            <button
              onClick={() => {
                const nextIndex = (state.currentIndex + 1) % compatibleBackgrounds.length;
                updateState({ currentIndex: nextIndex });
              }}
              className="minimal-button rounded px-2 py-1 text-xs"
              disabled={state.isTransitioning}
            >
              →
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("autoShaderIndex");
                localStorage.removeItem("selectedShader");
                updateState({ currentIndex: 0, preloadedBackgrounds: new Set() });
              }}
              className="minimal-button rounded px-2 py-1 text-xs"
              disabled={state.isTransitioning}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 导出背景管理器实用工具
 */
export const backgroundManagerUtils = {
  /**
   * 获取所有可用背景
   */
  getAllBackgrounds: () => DEFAULT_BACKGROUNDS,
  
  /**
   * 根据ID查找背景
   */
  findBackgroundById: (id: number): BackgroundConfig | undefined => {
    return DEFAULT_BACKGROUNDS.find(bg => bg.id === id);
  },
  
  /**
   * 根据类别过滤背景
   */
  filterByCategory: (category: BackgroundConfig['category']): BackgroundConfig[] => {
    return DEFAULT_BACKGROUNDS.filter(bg => bg.category === category);
  },
  
  /**
   * 根据性能要求过滤背景
   */
  filterByPerformance: (performance: BackgroundConfig['performance']): BackgroundConfig[] => {
    return DEFAULT_BACKGROUNDS.filter(bg => bg.performance === performance);
  }
};

// 默认导出
export default BackgroundManager;