# 天宫科技全屏视觉体验应用 - Cursor部署指南

> **版本:** v4.1 - 修复背景变暗问题，增强部署兼容性  
> **作者:** 麻蛇 @ 天宫科技  
> **最后更新:** 2025年1月  
> **目标:** 确保在Cursor环境中100%成功部署  

## 📋 目录

1. [🎯 项目概述](#项目概述)
2. [🏗️ 系统架构](#系统架构)
3. [⚡ 快速部署](#快速部署)
4. [🔧 详细配置](#详细配置)
5. [🚨 常见问题及解决方案](#常见问题及解决方案)
6. [🛠️ 故障排除](#故障排除)
7. [📊 性能优化](#性能优化)
8. [🔒 安全配置](#安全配置)
9. [📝 开发调试](#开发调试)
10. [🚀 生产部署](#生产部署)

---

## 🎯 项目概述

### 核心功能
- **银色主题Shadertoy动画背景系统** - 5种循环切换的视觉效果
- **智能时钟控制台** - 欢迎模式和控制台模式无缝切换
- **高级音乐播放器** - 基于Termusic后端 + wavesurfer.js波形显示
- **音乐管理工具** - Spotify导出 + 网易云歌单整理
- **智能布局系统** - 防碰撞的组件定位和状态管理

### 技术栈
```json
{
  "前端框架": "React 18 + TypeScript",
  "动画库": "Motion (Framer Motion)",
  "样式系统": "Tailwind CSS v4.0",
  "音频处理": "wavesurfer.js v7 + 原生Audio API",
  "后端通信": "Termusic Rust后端 + gRPC/HTTP",
  "状态管理": "React Hooks + 智能布局系统",
  "错误处理": "完整的ErrorBoundary系统",
  "构建工具": "Vite + TypeScript"
}
```

---

## 🏗️ 系统架构

### 组件层级结构
```
App.tsx (根组件 + ErrorBoundary)
├── BackgroundManager (背景管理器)
│   ├── ShaderCanvas (WebGL Shader背景)
│   ├── ShaderBackground (静态渐变背景)
│   └── FallbackBackground (兼容性回退)
├── TimeDisplay/FallbackTimeDisplay (时钟显示)
├── AdvancedMusicPlayer (高级音乐播放器)
│   ├── WaveformPlayer (波形可视化)
│   ├── TermusicConnector (后端连接器)
│   └── UnifiedVolumeSlider (音量控制)
├── MusicOrganizer/FallbackMusicOrganizer (音乐整理)
├── 智能布局系统
│   ├── useSmartLayout (全局布局管理)
│   ├── useSmartPositioning (组件定位)
│   ├── useMouseTracker (鼠标追踪)
│   └── useCollisionDetection (碰撞检测)
└── DevTools (开发者工具)
```

### 数据流架构
```
LocalStorage (状态持久化)
    ↓
AppState (应用全局状态)
    ↓
BackgroundManager (背景循环系统)
    ↓
智能布局系统 (组件定位管理)
    ↓
TermusicConnector (音乐后端通信)
    ↓
ErrorBoundary (错误捕获和恢复)
```

---

## ⚡ 快速部署

### 1. 环境要求

```bash
# 必须的环境版本
Node.js: >= 18.0.0
npm: >= 9.0.0
TypeScript: >= 5.0.0

# 推荐的环境版本
Node.js: 20.x LTS
npm: 10.x
TypeScript: 5.3.x
```

### 2. 一键部署脚本

```bash
#!/bin/bash
# deploy.sh - Cursor环境部署脚本

echo "🚀 开始部署天宫科技全屏视觉体验应用..."

# 检查环境
echo "📋 检查运行环境..."
node --version || (echo "❌ Node.js 未安装" && exit 1)
npm --version || (echo "❌ npm 未安装" && exit 1)

# 清理缓存
echo "🧹 清理缓存..."
npm cache clean --force
rm -rf node_modules package-lock.json

# 安装依赖
echo "📦 安装依赖..."
npm install

# 类型检查
echo "🔍 TypeScript类型检查..."
npx tsc --noEmit

# 构建项目
echo "🏗️ 构建项目..."
npm run build

# 启动开发服务器
echo "🌟 启动开发服务器..."
npm run dev

echo "✅ 部署完成！应用运行在 http://localhost:5173"
```

### 3. Cursor专用配置

创建 `.cursor/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "css.validate": false,
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 🔧 详细配置

### package.json 关键依赖

```json
{
  "name": "tiangong-visual-experience",
  "version": "4.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5173",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "motion": "^11.0.0",
    "tailwindcss": "^4.0.0",
    "lucide-react": "^0.400.0",
    "sonner": "^2.0.3",
    "react-hook-form": "^7.55.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}
```

### vite.config.ts 配置

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './', // 相对路径，增强部署兼容性
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 保留console.log用于调试
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'motion': ['motion'],
          'audio': ['react-hook-form']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './components'),
      '@styles': path.resolve(__dirname, './styles')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'motion',
      'lucide-react'
    ]
  }
})
```

### tailwind.config.js 配置

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Consolas', 'Ubuntu Mono', 'monospace'],
        'heading': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'body': ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      colors: {
        silver: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          primary: '#c0c5ce',
          secondary: '#a8b2c4',
          tertiary: '#9399a8'
        }
      },
      animation: {
        'tech-glow': 'tech-glow 2s ease-in-out infinite',
        'sync-yellow-glow': 'sync-yellow-glow 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite'
      },
      keyframes: {
        'tech-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(192, 197, 206, 0.5)' 
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(192, 197, 206, 0.8)' 
          }
        },
        'sync-yellow-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(251, 191, 36, 0.5)' 
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.9)' 
          }
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        'slide-up': {
          'from': { 
            opacity: '0',
            transform: 'translateY(10px)' 
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)' 
          }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' }
        }
      }
    }
  },
  plugins: []
}
```

---

## 🚨 常见问题及解决方案

### 问题1: 背景变得越来越暗

**原因分析:**
- 欢迎模式遮罩层透明度累积 (`bg-black/5` 叠加)
- BackgroundManager的FallbackBackground多层opacity叠加
- CSS变量计算错误导致透明度累积

**解决方案:**
```typescript
// ✅ 修复后的欢迎遮罩层
<motion.div
  style={{ 
    background: 'rgba(0, 0, 0, 0.02)', // 固定2%透明度
    // 或完全透明: background: 'transparent'
  }}
/>

// ✅ 修复后的FallbackBackground
const FallbackBackground = ({ config }) => (
  <div style={{
    background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}08 50%, ${config.color}15 100%)`,
    // 移除可变的opacity设置
  }}>
    {/* 简化装饰层，减少叠加 */}
  </div>
);
```

### 问题2: 弹窗导致部署失败

**原因分析:**
- AnimatePresence的exit动画在快速切换时出现状态不一致
- 模态框的z-index层级冲突
- 错误边界未正确捕获动画组件的异常

**解决方案:**
```typescript
// ✅ 增强的AnimatePresence错误处理
<ErrorBoundary fallback={<div />}>
  <AnimatePresence mode="wait">
    {condition && (
      <motion.div
        key="unique-key" // 确保唯一key
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    )}
  </AnimatePresence>
</ErrorBoundary>
```

### 问题3: 组件导入失败

**原因分析:**
- 动态import在不同环境下路径解析不一致
- TypeScript类型检查在构建时失败
- 模块循环依赖导致的导入错误

**解决方案:**
```typescript
// ✅ 安全的组件导入模式
let ShaderCanvas: any;

try {
  const ShaderCanvasModule = require("./components/ShaderCanvas");
  ShaderCanvas = ShaderCanvasModule.ShaderCanvas;
} catch (error) {
  console.warn("ShaderCanvas 组件导入失败，使用回退方案:", error);
  ShaderCanvas = null;
}

// ✅ 渲染时的安全回退
const renderShaderBackground = () => {
  return ShaderCanvas ? (
    <ShaderCanvas shaderId={selectedShader} />
  ) : (
    <FallbackShaderCanvas shaderId={selectedShader} />
  );
};
```

### 问题4: 内存泄漏和性能问题

**原因分析:**
- useEffect cleanup函数未正确清理定时器
- Motion动画的大量重复渲染
- 音频组件的WebAudio上下文未释放

**解决方案:**
```typescript
// ✅ 完整的cleanup模式
useEffect(() => {
  let timer: NodeJS.Timeout | null = null;
  let animationFrame: number | null = null;
  
  try {
    timer = setTimeout(() => {
      // 异步操作
    }, 1000);
    
    animationFrame = requestAnimationFrame(() => {
      // 动画操作
    });
  } catch (error) {
    console.error('初始化失败:', error);
  }
  
  return () => {
    if (timer) clearTimeout(timer);
    if (animationFrame) cancelAnimationFrame(animationFrame);
  };
}, [dependencies]);
```

---

## 🛠️ 故障排除

### 调试工具配置

1. **开发者工具面板**
```typescript
// 在 DevTools 组件中启用
<DevTools
  selectedShader={selectedShader}
  onShaderChange={setSelectedShader}
  isWelcomeMode={appState.isWelcomeMode}
  showFunctionPanel={true}
  debugMode={process.env.NODE_ENV === 'development'}
/>
```

2. **错误日志监控**
```typescript
// 使用 useErrorHandler Hook
const { getErrorLogs, clearErrorLogs } = useErrorHandler();

// 查看错误日志
console.log('错误日志:', getErrorLogs());
```

3. **性能监控**
```typescript
// 在组件中添加性能监控
const performanceRef = useRef<number>(0);

useEffect(() => {
  const start = performance.now();
  
  return () => {
    const end = performance.now();
    if (end - start > 100) {
      console.warn(`组件渲染时间过长: ${end - start}ms`);
    }
  };
});
```

### 常见错误码及解决方案

| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| `SHADER_LOAD_FAILED` | Shader加载失败 | 检查WebGL支持，使用回退背景 |
| `AUDIO_CONTEXT_ERROR` | 音频上下文错误 | 用户手势后初始化AudioContext |
| `LAYOUT_COLLISION` | 布局碰撞检测 | 调整组件优先级和避让距离 |
| `STORAGE_QUOTA_EXCEEDED` | 存储空间不足 | 清理localStorage旧数据 |
| `MOTION_ANIMATION_FAILED` | 动画执行失败 | 降级到CSS transitions |

### 实时监控脚本

```bash
#!/bin/bash
# monitor.sh - 实时监控应用状态

watch -n 2 "
echo '=== 天宫科技应用监控 ==='
echo '当前时间:' $(date)
echo '内存使用:' $(ps aux | grep node | awk '{sum+=\$6} END {print sum/1024 \"MB\"}')
echo '端口状态:' $(netstat -an | grep :5173)
echo '错误日志:' $(tail -n 3 logs/error.log 2>/dev/null || echo '无错误日志')
echo '最新提交:' $(git log --oneline -1 2>/dev/null || echo '无Git历史')
"
```

---

## 📊 性能优化

### 1. 代码分割策略

```typescript
// vite.config.ts 中的代码分割配置
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架包
          'vendor-react': ['react', 'react-dom'],
          // 动画相关
          'vendor-motion': ['motion'],
          // 音频相关
          'vendor-audio': ['react-hook-form'],
          // 工具函数
          'utils': [
            './components/util/useMouseTracker',
            './components/util/useSmartLayout',
            './components/util/useSmartPositioning'
          ],
          // 音乐功能模块
          'music-player': [
            './components/AdvancedMusicPlayer',
            './components/WaveformPlayer',
            './components/util/termusicConnector'
          ]
        }
      }
    }
  }
});
```

### 2. 渲染优化

```typescript
// 使用 React.memo 优化重渲染
const OptimizedComponent = React.memo(({ data, onUpdate }) => {
  return (
    <div>{data.content}</div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较逻辑
  return prevProps.data.id === nextProps.data.id;
});

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data.key]);

// 使用 useCallback 缓存函数引用
const handleClick = useCallback((event) => {
  onUpdate(event.target.value);
}, [onUpdate]);
```

### 3. 资源优化

```typescript
// 图片懒加载
const LazyImage = ({ src, alt, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (imgRef.current && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setLoaded(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      
      observer.observe(imgRef.current);
      return () => observer.disconnect();
    }
  }, []);
  
  return (
    <img
      ref={imgRef}
      src={loaded ? src : undefined}
      alt={alt}
      {...props}
    />
  );
};
```

---

## 🔒 安全配置

### 1. CSP (Content Security Policy)

在 `index.html` 中添加:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self' ws: wss:;
  worker-src 'self' blob:;
">
```

### 2. 环境变量管理

创建 `.env.local`:
```env
# 开发环境配置
VITE_APP_NAME=天宫科技全屏视觉体验应用
VITE_APP_VERSION=4.1.0
VITE_APP_ENV=development

# API配置
VITE_TERMUSIC_BASE_URL=http://localhost:7533
VITE_TERMUSIC_WS_URL=ws://localhost:7533/ws

# 功能开关
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_TERMUSIC_BACKEND=true
VITE_ENABLE_WAVEFORM=true
```

### 3. 输入验证

```typescript
// 安全的输入验证
const validateInput = (input: string): boolean => {
  // 防止XSS攻击
  const xssPattern = /<script|javascript:|on\w+=/i;
  if (xssPattern.test(input)) {
    return false;
  }
  
  // 长度限制
  if (input.length > 1000) {
    return false;
  }
  
  return true;
};

// 安全的本地存储
const secureStorage = {
  set: (key: string, value: any) => {
    try {
      const sanitizedValue = JSON.stringify(value);
      localStorage.setItem(`tiangong_${key}`, sanitizedValue);
    } catch (error) {
      console.error('存储失败:', error);
    }
  },
  
  get: (key: string) => {
    try {
      const value = localStorage.getItem(`tiangong_${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('读取失败:', error);
      return null;
    }
  }
};
```

---

## 📝 开发调试

### 1. 调试配置

创建 `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug App in Chrome",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vite",
      "args": ["--mode", "development"],
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### 2. 日志系统

```typescript
// 统一的日志系统
const logger = {
  info: (message: string, data?: any) => {
    console.log(`ℹ️ [${new Date().toISOString()}] ${message}`, data || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ [${new Date().toISOString()}] ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ [${new Date().toISOString()}] ${message}`, error || '');
    
    // 生产环境下发送错误报告
    if (process.env.NODE_ENV === 'production') {
      // sendErrorReport(message, error);
    }
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🐛 [${new Date().toISOString()}] ${message}`, data || '');
    }
  }
};
```

### 3. 测试工具

```typescript
// 简单的组件测试工具
const testComponent = (Component: React.FC, props: any = {}) => {
  try {
    const div = document.createElement('div');
    const root = createRoot(div);
    
    root.render(<Component {...props} />);
    
    return {
      success: true,
      element: div
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// 性能测试工具
const measurePerformance = (fn: Function, name: string) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  logger.debug(`性能测试 ${name}: ${end - start}ms`);
  return result;
};
```

---

## 🚀 生产部署

### 1. 构建优化

```bash
#!/bin/bash
# build-production.sh

echo "🚀 开始生产环境构建..."

# 环境变量设置
export NODE_ENV=production
export VITE_APP_ENV=production

# 清理
rm -rf dist
npm cache clean --force

# 安装生产依赖
npm ci --only=production

# 类型检查
npm run type-check

# 构建
npm run build

# 压缩资源
echo "📦 压缩构建资源..."
gzip -9 -c dist/index.html > dist/index.html.gz
find dist -name "*.js" -exec gzip -9 -c {} \; > {}.gz
find dist -name "*.css" -exec gzip -9 -c {} \; > {}.gz

echo "✅ 生产构建完成！"
echo "📊 构建统计："
du -sh dist/
ls -la dist/assets/
```

### 2. Docker部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    server {
        listen 80;
        server_name localhost;
        
        root /usr/share/nginx/html;
        index index.html;
        
        # SPA路由支持
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # 静态资源缓存
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # 安全头
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
    }
}
```

### 3. 监控和分析

```typescript
// 生产环境监控
const analytics = {
  // 性能监控
  trackPerformance: () => {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        logger.info('页面性能指标', {
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime
        });
      });
    }
  },
  
  // 错误监控
  trackErrors: () => {
    window.addEventListener('error', (event) => {
      logger.error('JavaScript错误', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('未处理的Promise拒绝', {
        reason: event.reason
      });
    });
  },
  
  // 用户行为监控
  trackUserActions: () => {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.hasAttribute('data-track')) {
        logger.debug('用户点击', {
          element: target.tagName,
          action: target.getAttribute('data-track'),
          timestamp: Date.now()
        });
      }
    });
  }
};

// 在生产环境启用监控
if (process.env.NODE_ENV === 'production') {
  analytics.trackPerformance();
  analytics.trackErrors();
  analytics.trackUserActions();
}
```

---

## 📋 部署检查清单

### 部署前检查

- [ ] **环境要求**: Node.js >= 18.0.0, npm >= 9.0.0
- [ ] **依赖安装**: `npm install` 无错误
- [ ] **类型检查**: `npm run type-check` 通过
- [ ] **构建测试**: `npm run build` 成功
- [ ] **错误边界**: 所有组件都有ErrorBoundary包装
- [ ] **回退组件**: 所有动态组件都有Fallback版本
- [ ] **环境变量**: 所有必需的环境变量已配置
- [ ] **安全配置**: CSP头已设置
- [ ] **性能优化**: 代码分割和资源压缩已配置

### 部署后验证

- [ ] **页面加载**: 首屏在3秒内完成加载
- [ ] **背景系统**: 自动循环切换正常
- [ ] **时钟显示**: 欢迎模式和控制台模式切换正常
- [ ] **音乐播放器**: 波形显示和控制功能正常
- [ ] **错误处理**: 故意触发错误，错误边界正常工作
- [ ] **移动端兼容**: 在不同尺寸屏幕上显示正常
- [ ] **浏览器兼容**: 在Chrome, Firefox, Safari中正常运行
- [ ] **性能指标**: Lighthouse分数 > 90
- [ ] **内存使用**: 长时间使用无明显内存泄漏
- [ ] **错误日志**: 无重复或严重错误信息

---

## 🆘 紧急故障处理

### 应用完全无法启动

```bash
# 快速恢复脚本
#!/bin/bash

echo "🚨 执行紧急恢复..."

# 1. 重置到已知工作状态
git stash
git checkout HEAD~1

# 2. 清理环境
rm -rf node_modules package-lock.json
npm cache clean --force

# 3. 重新安装
npm install

# 4. 启动
npm run dev

echo "✅ 紧急恢复完成"
```

### 内存溢出处理

```typescript
// 紧急内存清理
const emergencyCleanup = () => {
  try {
    // 清理localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('tiangong_') && !key.includes('essential')) {
        localStorage.removeItem(key);
      }
    });
    
    // 强制垃圾回收（如果可用）
    if (window.gc) {
      window.gc();
    }
    
    // 重启应用
    window.location.reload();
  } catch (error) {
    console.error('紧急清理失败:', error);
  }
};
```

---

## 📞 技术支持

**项目作者**: 麻蛇 @ 天宫科技  
**邮箱**: tiangong.tech@example.com  
**文档版本**: v4.1  
**最后更新**: 2025年1月  

**常用命令速查**:
```bash
# 开发环境
npm run dev              # 启动开发服务器
npm run type-check       # TypeScript类型检查
npm run build            # 构建生产版本
npm run preview          # 预览构建结果

# 调试工具
npm run dev -- --debug   # 启用调试模式
npm run dev -- --host    # 允许局域网访问
```

**关键文件位置**:
- 主应用: `/App.tsx`
- 错误边界: `/components/ErrorBoundary.tsx`
- 背景管理: `/components/BackgroundManager.tsx`
- 音乐播放: `/components/AdvancedMusicPlayer.tsx`
- 样式系统: `/styles/globals.css`
- 配置文件: `/vite.config.ts`, `/tailwind.config.js`

---

*本部署指南确保天宫科技全屏视觉体验应用在Cursor环境中稳定运行。如遇到文档未覆盖的问题，请查看错误日志并参考故障排除章节。*