# GPU渲染优化和后端程序安装指南

## 🎮 GPU渲染优化配置

### 浏览器GPU加速设置

#### Chrome/Chromium内核浏览器
```bash
# 启动参数优化 - 在浏览器快捷方式中添加以下参数
--enable-gpu-rasterization           # 启用GPU光栅化
--enable-zero-copy                   # 启用零拷贝
--enable-gpu-memory-buffer-compositor-resources  # GPU内存缓冲区
--enable-accelerated-2d-canvas       # 加速2D画布
--enable-experimental-web-platform-features  # 实验性Web平台功能
--disable-background-timer-throttling  # 禁用后台定时器限制
--disable-features=TranslateUI       # 禁用翻译UI减少资源占用
--max_old_space_size=8192            # 增加V8内存限制到8GB

# 完整启动命令示例 (Windows)
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --enable-gpu-rasterization ^
  --enable-zero-copy ^
  --enable-gpu-memory-buffer-compositor-resources ^
  --enable-accelerated-2d-canvas ^
  --enable-experimental-web-platform-features ^
  --disable-background-timer-throttling ^
  --max_old_space_size=8192

# 完整启动命令示例 (macOS)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --enable-gpu-memory-buffer-compositor-resources \
  --enable-accelerated-2d-canvas \
  --enable-experimental-web-platform-features \
  --disable-background-timer-throttling \
  --max_old_space_size=8192

# 完整启动命令示例 (Linux)
google-chrome \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --enable-gpu-memory-buffer-compositor-resources \
  --enable-accelerated-2d-canvas \
  --enable-experimental-web-platform-features \
  --disable-background-timer-throttling \
  --max_old_space_size=8192
```

#### Firefox浏览器
```javascript
// 在about:config中设置以下参数
gfx.webrender.all = true                    // 启用WebRender
layers.acceleration.force-enabled = true     // 强制启用图层加速
gfx.canvas.azure.accelerated = true         // 启用Canvas加速
dom.webgpu.enabled = true                   // 启用WebGPU（实验性）
gfx.webrender.compositor.force-enabled = true // 强制启用合成器
```

#### Edge浏览器
```bash
# Edge启动参数（与Chrome类似）
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" ^
  --enable-gpu-rasterization ^
  --enable-features=VaapiVideoDecoder ^
  --enable-accelerated-video-decode ^
  --ignore-gpu-blacklist
```

### 应用内GPU优化配置

#### WebGL和Canvas优化设置
```typescript
// BackgroundManager.tsx GPU优化配置
export const GPU_OPTIMIZED_CONFIG = {
  // WebGL上下文配置
  webglContextAttributes: {
    alpha: false,              // 禁用alpha通道，提升性能
    antialias: false,         // 关闭抗锯齿，由GPU处理
    depth: false,             // 不需要深度缓冲区
    stencil: false,           // 不需要模板缓冲区
    powerPreference: "high-performance", // 强制使用高性能GPU
    preserveDrawingBuffer: false,        // 不保留绘图缓冲区
    premultipliedAlpha: false,          // 禁用预乘alpha
    failIfMajorPerformanceCaveat: true  // 性能不足时失败
  },

  // Canvas2D优化配置
  canvas2DAttributes: {
    alpha: false,                        // 禁用alpha通道
    willReadFrequently: false,          // 优化GPU写入
    desynchronized: true                // 启用异步渲染
  },

  // 渲染循环优化
  renderingConfig: {
    useRequestAnimationFrame: true,     // 使用RAF而非定时器
    enableVSync: true,                 // 启用垂直同步
    maxFPS: 120,                      // 最大帧率限制
    adaptiveQuality: true,            // 自适应质量调整
    lowPowerMode: false               // 禁用低功耗模式
  },

  // 内存管理优化
  memoryConfig: {
    enableTextureCompression: true,    // 启用纹理压缩
    maxTextureSize: 4096,             // 最大纹理尺寸
    enableMipmapping: true,           // 启用多级渐远纹理
    garbageCollectionThreshold: 0.8   // GC触发阈值
  }
};

// 在BackgroundManager中应用GPU优化
class OptimizedBackgroundManager {
  private initializeGPUContext() {
    // 🎮 强制使用高性能GPU上下文
    const canvas = this.canvasRef.current;
    if (!canvas) return null;

    // WebGL2优先，回退到WebGL1
    const gl = canvas.getContext('webgl2', GPU_OPTIMIZED_CONFIG.webglContextAttributes) ||
               canvas.getContext('webgl', GPU_OPTIMIZED_CONFIG.webglContextAttributes);
    
    if (!gl) {
      console.error('❌ GPU上下文创建失败，回退到Canvas2D');
      return canvas.getContext('2d', GPU_OPTIMIZED_CONFIG.canvas2DAttributes);
    }

    // 🚀 GPU信息检测和日志
    this.logGPUInfo(gl);
    
    // 🔧 GPU扩展启用
    this.enableGPUExtensions(gl);
    
    return gl;
  }

  private logGPUInfo(gl: WebGLRenderingContext) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      console.log('🎮 GPU信息:');
      console.log('  厂商:', vendor);
      console.log('  渲染器:', renderer);
      console.log('  WebGL版本:', gl.getParameter(gl.VERSION));
      console.log('  GLSL版本:', gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
    }
  }

  private enableGPUExtensions(gl: WebGLRenderingContext) {
    // 启用性能关键扩展
    const extensions = [
      'OES_texture_float',           // 浮点纹理支持
      'OES_texture_float_linear',    // 浮点纹理线性过滤
      'WEBGL_draw_buffers',          // 多重渲染目标
      'EXT_texture_filter_anisotropic', // 各向异性过滤
      'WEBGL_debug_renderer_info',   // GPU信息访问
      'OES_element_index_uint',      // 32位索引
      'WEBGL_compressed_texture_s3tc' // S3TC纹理压缩
    ];

    extensions.forEach(ext => {
      const extension = gl.getExtension(ext);
      if (extension) {
        console.log(`✅ GPU扩展已启用: ${ext}`);
      } else {
        console.warn(`⚠️ GPU扩展不支持: ${ext}`);
      }
    });
  }

  // 🎯 自适应质量调整
  private adaptiveQualityControl() {
    const fps = this.getCurrentFPS();
    const memoryUsage = this.getMemoryUsage();
    
    if (fps < 30 || memoryUsage > 0.8) {
      // 降低质量设置
      this.reduceShaderComplexity();
      this.decreaseRenderResolution();
      console.log('📉 GPU负载过高，自动降低质量');
    } else if (fps > 55 && memoryUsage < 0.6) {
      // 提升质量设置
      this.increaseShaderComplexity();
      this.increaseRenderResolution();
      console.log('📈 GPU性能良好，自动提升质量');
    }
  }
}
```

#### Shader优化代码注释
```glsl
/*
 * GPU优化着色器配置
 * 这些注释指导Cursor在后端安装相应的GPU驱动和优化程序
 */

// 片段着色器GPU优化版本
#version 300 es
precision highp float;

// GPU_OPTIMIZATION: 启用高精度浮点计算，充分利用现代GPU
precision highp float;

// GPU_OPTIMIZATION: 使用uniform缓冲对象减少CPU-GPU数据传输
layout(std140) uniform ShaderUniforms {
    float u_time;           // 时间uniform
    vec2 u_resolution;      // 分辨率uniform  
    vec2 u_mouse;          // 鼠标位置uniform
    float u_intensity;      // 强度控制uniform
};

// GPU_OPTIMIZATION: 使用纹理采样器优化内存访问模式
uniform sampler2D u_noise_texture;    // 噪声纹理
uniform sampler2D u_previous_frame;   // 前一帧缓冲

in vec2 v_texCoord;    // 顶点着色器传入的纹理坐标
out vec4 fragColor;    // 输出颜色

// GPU_OPTIMIZATION: 内联函数减少函数调用开销
#define INLINE inline

// GPU_OPTIMIZATION: 使用向量化运算提升并行度
INLINE vec3 optimizedSilverEffect(vec2 coord) {
    // 使用SIMD友好的向量运算
    vec4 noise = texture(u_noise_texture, coord * 0.1 + u_time * 0.02);
    vec3 base_color = vec3(0.753, 0.773, 0.808); // 银色基调
    
    // GPU优化：使用mad指令 (multiply-add)
    return base_color + noise.rgb * 0.2;
}

void main() {
    // GPU_OPTIMIZATION: 归一化坐标计算，利用GPU并行处理
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // GPU_OPTIMIZATION: 分支预测优化，避免动态分支
    vec3 color = optimizedSilverEffect(uv);
    
    // GPU_OPTIMIZATION: 输出颜色，启用early-z测试
    fragColor = vec4(color, 1.0);
}
```

## 🖥️ Cursor后端GPU程序安装指南

### Windows系统安装步骤

#### 1. NVIDIA GPU驱动和CUDA工具链
```batch
@echo off
echo 🎮 安装NVIDIA GPU优化工具链...

REM 检查NVIDIA GPU
nvidia-smi >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到NVIDIA GPU或驱动未安装
    pause
    exit /b 1
)

echo ✅ 检测到NVIDIA GPU

REM 下载并安装CUDA Toolkit
echo 📦 下载CUDA Toolkit 12.3...
curl -L "https://developer.download.nvidia.com/compute/cuda/12.3.0/local_installers/cuda_12.3.0_546.01_windows.exe" -o cuda_installer.exe

echo 🔧 安装CUDA Toolkit...
cuda_installer.exe -s

REM 设置环境变量
setx CUDA_PATH "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.3"
setx PATH "%PATH%;%CUDA_PATH%\bin;%CUDA_PATH%\libnvvp"

echo ✅ CUDA Toolkit安装完成

REM 安装cuDNN
echo 📦 下载cuDNN...
REM 注意：cuDNN需要NVIDIA开发者账户下载
echo ⚠️ 请手动下载cuDNN并解压到CUDA目录

echo 🎮 GPU工具链安装完成！
pause
```

#### 2. AMD GPU驱动和ROCm工具链
```batch
@echo off
echo 🎮 安装AMD GPU优化工具链...

REM 检查AMD GPU
wmic path win32_VideoController get name | findstr "AMD" >nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到AMD GPU
    pause
    exit /b 1
)

echo ✅ 检测到AMD GPU

REM 下载AMD驱动
echo 📦 下载AMD驱动...
curl -L "https://drivers.amd.com/drivers/installer/22.40/whql/amd-software-adrenalin-edition-22.11.2-win10-win11-nov23.exe" -o amd_driver.exe

echo 🔧 安装AMD驱动...
amd_driver.exe /S

REM 安装ROCm（如果支持）
echo 📦 安装ROCm...
winget install AMD.ROCm

echo 🎮 AMD GPU工具链安装完成！
pause
```

#### 3. Intel集成显卡驱动
```batch
@echo off
echo 🎮 安装Intel GPU优化工具链...

REM 检查Intel GPU
wmic path win32_VideoController get name | findstr "Intel" >nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到Intel GPU
    pause
    exit /b 1
)

echo ✅ 检测到Intel GPU

REM 下载Intel驱动
echo 📦 下载Intel GPU驱动...
curl -L "https://downloadmirror.intel.com/785597/igfx_win_101.4255.exe" -o intel_gpu_driver.exe

echo 🔧 安装Intel GPU驱动...
intel_gpu_driver.exe /S

echo 🎮 Intel GPU工具链安装完成！
pause
```

### macOS系统安装步骤

#### 通用GPU优化脚本
```bash
#!/bin/bash
echo "🎮 安装macOS GPU优化工具链..."

# 检查系统版本
if [[ $(uname) != "Darwin" ]]; then
    echo "❌ 此脚本仅适用于macOS"
    exit 1
fi

echo "✅ macOS系统检测通过"

# 安装Homebrew（如果未安装）
if ! command -v brew &> /dev/null; then
    echo "📦 安装Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# 安装Metal Performance Shaders开发工具
echo "🔧 安装Xcode Command Line Tools..."
xcode-select --install

# 安装GPU监控工具
echo "📊 安装GPU监控工具..."
brew install --cask gpu-benchmark
brew install htop
brew install glances

# 对于Apple Silicon Mac，安装Metal工具
if [[ $(uname -m) == "arm64" ]]; then
    echo "🍎 检测到Apple Silicon，安装Metal工具..."
    # Metal工具已集成在Xcode中，确保开发者工具可用
    sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
    
    # 安装Metal Performance Shaders
    echo "⚡ 配置Metal Performance Shaders..."
    # 这些在系统中已可用，无需额外安装
fi

# 对于Intel Mac，安装额外驱动支持
if [[ $(uname -m) == "x86_64" ]]; then
    echo "💻 检测到Intel Mac，安装额外GPU支持..."
    # Intel Mac GPU驱动由系统管理，检查可用性
    system_profiler SPDisplaysDataType
fi

echo "✅ macOS GPU工具链安装完成！"
```

### Linux系统安装步骤

#### NVIDIA GPU (Ubuntu/Debian)
```bash
#!/bin/bash
echo "🎮 安装Linux NVIDIA GPU工具链..."

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要依赖
sudo apt install -y curl wget gnupg2 software-properties-common

# 检测NVIDIA GPU
if ! lspci | grep -i nvidia > /dev/null; then
    echo "❌ 未检测到NVIDIA GPU"
    exit 1
fi

echo "✅ 检测到NVIDIA GPU"

# 安装NVIDIA驱动
echo "📦 安装NVIDIA驱动..."
sudo apt install -y nvidia-driver-535 nvidia-utils-535

# 安装CUDA
echo "📦 安装CUDA..."
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
sudo dpkg -i cuda-keyring_1.0-1_all.deb
sudo apt update
sudo apt install -y cuda-toolkit-12-3

# 配置环境变量
echo 'export PATH=/usr/local/cuda-12.3/bin${PATH:+:${PATH}}' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda-12.3/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}' >> ~/.bashrc

# 重新加载环境变量
source ~/.bashrc

# 验证安装
nvidia-smi
nvcc --version

echo "✅ NVIDIA GPU工具链安装完成！"
```

#### AMD GPU (Ubuntu/Debian)
```bash
#!/bin/bash
echo "🎮 安装Linux AMD GPU工具链..."

# 更新系统
sudo apt update && sudo apt upgrade -y

# 检测AMD GPU
if ! lspci | grep -i amd > /dev/null; then
    echo "❌ 未检测到AMD GPU"
    exit 1
fi

echo "✅ 检测到AMD GPU"

# 安装AMD驱动
echo "📦 安装AMD驱动..."
sudo apt install -y mesa-vulkan-drivers libvulkan1 vulkan-utils

# 安装ROCm（用于计算）
echo "📦 安装ROCm..."
wget -q -O - https://repo.radeon.com/rocm/rocm.gpg.key | sudo apt-key add -
echo 'deb [arch=amd64] https://repo.radeon.com/rocm/apt/5.7/ ubuntu main' | sudo tee /etc/apt/sources.list.d/rocm.list
sudo apt update
sudo apt install -y rocm-dev rocm-libs

# 配置用户组
sudo usermod -a -G render,video $USER

# 配置环境变量
echo 'export PATH=/opt/rocm/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/opt/rocm/lib:$LD_LIBRARY_PATH' >> ~/.bashrc

source ~/.bashrc

echo "✅ AMD GPU工具链安装完成！"
```

## 🔧 Cursor IDE GPU开发配置

### VS Code/Cursor扩展安装脚本
```bash
#!/bin/bash
echo "🛠️ 安装Cursor GPU开发扩展..."

# GPU开发相关扩展
cursor --install-extension ms-vscode.cpptools        # C++支持
cursor --install-extension nvidia.nsight-vscode     # NVIDIA Nsight
cursor --install-extension webgl-glsl-editor.glsl   # GLSL语法高亮
cursor --install-extension raczzalan.webgl-glsl-editor # WebGL GLSL编辑器
cursor --install-extension dtoplak.vscode-glsllint  # GLSL语法检查

# 性能监控扩展
cursor --install-extension ms-vscode.vscode-gpu-profiler # GPU性能分析器
cursor --install-extension ms-vscode.hexdump        # 内存查看器

# 前端开发优化扩展
cursor --install-extension bradlc.vscode-tailwindcss    # Tailwind CSS
cursor --install-extension ms-vscode.vscode-typescript-next # TypeScript
cursor --install-extension esbenp.prettier-vscode     # 代码格式化

echo "✅ Cursor扩展安装完成！"
```

### Cursor项目配置文件
```json
// .vscode/settings.json
{
  "glsllint.glslangValidatorPath": "/usr/bin/glslangValidator",
  "glsllint.supportedLangs": ["glsl", "vert", "frag"],
  
  "webgl-glsl-editor.format": true,
  "webgl-glsl-editor.suggestVariableType": true,
  
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.inlayHints.parameterNames.enabled": "all",
  
  "files.associations": {
    "*.vert": "glsl",
    "*.frag": "glsl",
    "*.compute": "glsl"
  },
  
  "editor.semanticHighlighting.enabled": true,
  "editor.inlineSuggest.enabled": true,
  
  // GPU性能监控配置
  "performance.marks": true,
  "performance.measure": true
}
```

## 📊 GPU性能监控和调试

### 性能监控代码集成
```typescript
// utils/gpu-monitor.ts
export class GPUPerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private memoryInfo: any = null;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // GPU内存监控
    if ('memory' in performance) {
      this.memoryInfo = (performance as any).memory;
    }

    // WebGL上下文丢失监控
    document.addEventListener('webglcontextlost', (event) => {
      console.error('🔥 WebGL上下文丢失:', event);
      this.handleContextLoss();
    });

    // WebGL上下文恢复监控
    document.addEventListener('webglcontextrestored', (event) => {
      console.log('✅ WebGL上下文已恢复:', event);
      this.handleContextRestore();
    });
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

  public getGPUInfo(): GPUInfo {
    return {
      fps: this.fps,
      memoryUsage: this.memoryInfo ? {
        used: this.memoryInfo.usedJSHeapSize,
        total: this.memoryInfo.totalJSHeapSize,
        limit: this.memoryInfo.jsHeapSizeLimit
      } : null,
      contextStatus: this.getWebGLContextStatus(),
      timestamp: Date.now()
    };
  }

  private getWebGLContextStatus(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    
    if (!gl) return 'unavailable';
    
    const status = gl.getParameter(gl.CONTEXT_STATUS);
    return status === gl.NO_ERROR ? 'healthy' : 'error';
  }

  private handleContextLoss() {
    // GPU上下文丢失处理
    console.warn('⚠️ GPU上下文丢失，尝试恢复...');
    // 实现恢复逻辑
  }

  private handleContextRestore() {
    // GPU上下文恢复处理
    console.log('🔄 GPU上下文已恢复，重新初始化...');
    // 实现重新初始化逻辑
  }
}

interface GPUInfo {
  fps: number;
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  } | null;
  contextStatus: string;
  timestamp: number;
}

// 全局GPU监控实例
export const gpuMonitor = new GPUPerformanceMonitor();
```

### 自动GPU配置检测
```typescript
// utils/gpu-config-detector.ts
export class GPUConfigDetector {
  public static async detectOptimalSettings(): Promise<GPUSettings> {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return this.getFallbackSettings();
    }

    const settings: GPUSettings = {
      renderer: this.getRendererInfo(gl),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      supportedExtensions: this.getSupportedExtensions(gl),
      recommendedSettings: this.getRecommendedSettings(gl)
    };

    console.log('🎮 GPU配置检测结果:', settings);
    return settings;
  }

  private static getRendererInfo(gl: WebGLRenderingContext): RendererInfo {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    return {
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
      version: gl.getParameter(gl.VERSION),
      glslVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
    };
  }

  private static getSupportedExtensions(gl: WebGLRenderingContext): string[] {
    return gl.getSupportedExtensions() || [];
  }

  private static getRecommendedSettings(gl: WebGLRenderingContext): RecommendedSettings {
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const rendererInfo = this.getRendererInfo(gl);
    
    // 基于GPU性能推荐设置
    let quality = 'medium';
    if (rendererInfo.renderer.includes('RTX') || rendererInfo.renderer.includes('RX 6')) {
      quality = 'high';
    } else if (rendererInfo.renderer.includes('GTX 1060') || rendererInfo.renderer.includes('RX 580')) {
      quality = 'medium';
    } else {
      quality = 'low';
    }

    return {
      quality,
      targetFPS: quality === 'high' ? 120 : quality === 'medium' ? 60 : 30,
      textureSize: Math.min(maxTextureSize, quality === 'high' ? 4096 : quality === 'medium' ? 2048 : 1024),
      enableAnisotropicFiltering: quality !== 'low',
      enableMSAA: quality === 'high'
    };
  }

  private static getFallbackSettings(): GPUSettings {
    return {
      renderer: {
        vendor: 'Software',
        renderer: 'Software Renderer',
        version: 'WebGL 1.0',
        glslVersion: 'WebGL GLSL ES 1.0'
      },
      maxTextureSize: 1024,
      maxVertexAttribs: 16,
      maxFragmentUniforms: 16,
      supportedExtensions: [],
      recommendedSettings: {
        quality: 'low',
        targetFPS: 30,
        textureSize: 512,
        enableAnisotropicFiltering: false,
        enableMSAA: false
      }
    };
  }
}

interface GPUSettings {
  renderer: RendererInfo;
  maxTextureSize: number;
  maxVertexAttribs: number;
  maxFragmentUniforms: number;
  supportedExtensions: string[];
  recommendedSettings: RecommendedSettings;
}

interface RendererInfo {
  vendor: string;
  renderer: string;
  version: string;
  glslVersion: string;
}

interface RecommendedSettings {
  quality: 'low' | 'medium' | 'high';
  targetFPS: number;
  textureSize: number;
  enableAnisotropicFiltering: boolean;
  enableMSAA: boolean;
}
```

## 🚀 自动化安装脚本

### 全平台一键安装脚本
```bash
#!/bin/bash
# universal-gpu-setup.sh - 全平台GPU优化安装脚本

echo "🎮 天宫科技GPU优化工具链安装器"
echo "================================"

# 检测操作系统
OS="unknown"
case "$(uname -s)" in
    Darwin*)  OS="macOS" ;;
    Linux*)   OS="Linux" ;;
    CYGWIN*)  OS="Windows" ;;
    MINGW*)   OS="Windows" ;;
    MSYS*)    OS="Windows" ;;
    *)        OS="unknown" ;;
esac

echo "📱 检测到操作系统: $OS"

# 检测GPU类型
GPU_TYPE="unknown"
if command -v nvidia-smi &> /dev/null; then
    GPU_TYPE="NVIDIA"
elif lspci 2>/dev/null | grep -i amd > /dev/null; then
    GPU_TYPE="AMD"
elif lspci 2>/dev/null | grep -i intel > /dev/null; then
    GPU_TYPE="Intel"
fi

echo "🎮 检测到GPU类型: $GPU_TYPE"

# 根据系统和GPU类型选择安装脚本
case "$OS-$GPU_TYPE" in
    "Linux-NVIDIA")
        echo "🔧 执行Linux NVIDIA安装..."
        ./install-scripts/linux-nvidia.sh
        ;;
    "Linux-AMD")
        echo "🔧 执行Linux AMD安装..."
        ./install-scripts/linux-amd.sh
        ;;
    "macOS-"*)
        echo "🔧 执行macOS通用安装..."
        ./install-scripts/macos-universal.sh
        ;;
    "Windows-NVIDIA")
        echo "🔧 执行Windows NVIDIA安装..."
        ./install-scripts/windows-nvidia.bat
        ;;
    "Windows-AMD")
        echo "🔧 执行Windows AMD安装..."
        ./install-scripts/windows-amd.bat
        ;;
    *)
        echo "⚠️ 未知的系统/GPU组合，使用通用安装"
        ./install-scripts/universal-fallback.sh
        ;;
esac

echo "✅ GPU优化工具链安装完成！"
echo "🚀 请重启应用以应用GPU优化设置"
```

## 📋 安装后验证清单

### GPU配置验证脚本
```bash
#!/bin/bash
echo "🔍 GPU配置验证..."

# 1. 检查GPU驱动
echo "1️⃣ 检查GPU驱动状态..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv
fi

# 2. 检查WebGL支持
echo "2️⃣ 检查WebGL支持..."
node -e "
const { createCanvas, getContext } = require('canvas');
const canvas = createCanvas(1, 1);
const ctx = canvas.getContext('webgl');
console.log('WebGL支持:', ctx ? '✅' : '❌');
"

# 3. 检查CUDA（如果适用）
echo "3️⃣ 检查CUDA支持..."
if command -v nvcc &> /dev/null; then
    nvcc --version | head -n 4
else
    echo "CUDA未安装或不可用"
fi

# 4. 检查浏览器GPU加速
echo "4️⃣ 启动浏览器验证GPU加速..."
echo "请在浏览器中访问 chrome://gpu/ 或 about:support 检查GPU状态"

echo "✅ GPU配置验证完成！"
```

---

## 📚 相关资源链接

- [NVIDIA CUDA Toolkit](https://developer.nvidia.com/cuda-toolkit)
- [AMD ROCm Platform](https://rocmdocs.amd.com/)
- [WebGL规范](https://www.khronos.org/webgl/)
- [Chrome GPU加速指南](https://developer.chrome.com/docs/devtools/rendering/performance/)
- [Firefox GPU设置](https://wiki.mozilla.org/Platform/GFX/WebRender)

---

*GPU优化配置指南版本: v2.1.0*  
*最后更新: 2025-01-25*  
*作者: 天宫科技 - 麻蛇*