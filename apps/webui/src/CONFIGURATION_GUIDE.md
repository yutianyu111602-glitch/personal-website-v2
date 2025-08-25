# 配置管理完整指南

## 📁 配置文件结构

```
project/
├── .env                          # 环境变量配置
├── .env.example                  # 环境变量模板
├── .env.local                    # 本地开发配置
├── .env.production              # 生产环境配置
├── .env.staging                 # 测试环境配置
├── vite.config.ts               # Vite构建配置
├── tailwind.config.js           # Tailwind样式配置
├── postcss.config.js            # PostCSS配置
├── tsconfig.json                # TypeScript配置
├── eslint.config.js             # ESLint代码规范
├── package.json                 # 项目依赖配置
└── styles/
    ├── globals.css              # 全局样式配置
    ├── fonts.css                # 字体配置
    └── sonner-fixes.css         # 通知组件修复样式
```

## 🌍 环境变量系统

### 核心环境变量 (.env)
```bash
# ========================================
# 应用基础配置
# ========================================
VITE_APP_NAME="天宫科技全屏视觉体验应用"
VITE_APP_VERSION="2.1.0"
VITE_APP_AUTHOR="天宫科技 - 麻蛇"
VITE_APP_BUILD_TIME="2025-01-25T10:00:00Z"

# 运行环境
VITE_NODE_ENV="development"         # development | production | test
VITE_DEBUG_MODE="true"              # 调试模式开关
VITE_PERFORMANCE_MONITORING="true"  # 性能监控开关

# ========================================
# 音频系统配置
# ========================================
# Termusic Rust后端配置
VITE_TERMUSIC_HOST="localhost"
VITE_TERMUSIC_PORT="7533"
VITE_TERMUSIC_API_BASE="http://localhost:7533/api"
VITE_TERMUSIC_WEBSOCKET="ws://localhost:7533/ws"
VITE_TERMUSIC_TIMEOUT="10000"       # 连接超时时间(ms)
VITE_TERMUSIC_RETRY_ATTEMPTS="3"    # 重试次数
VITE_TERMUSIC_RETRY_DELAY="2000"    # 重试延迟(ms)

# Wavesurfer.js配置
VITE_WAVESURFER_WINDOW_SIZE="10"    # 10秒窗口大小
VITE_WAVESURFER_BUFFER_SIZE="1024"  # 音频缓冲区大小
VITE_WAVESURFER_SAMPLE_RATE="44100" # 采样率
VITE_WAVESURFER_PRELOAD_SECONDS="2" # 预加载秒数
VITE_WAVESURFER_CHUNK_SIZE="65536"  # HTTP Range请求块大小
VITE_WAVESURFER_MAX_CHUNKS="100"    # 最大缓存块数

# 音频格式支持
VITE_SUPPORTED_AUDIO_FORMATS="mp3,wav,ogg,flac,aac"
VITE_MAX_FILE_SIZE="100"            # 最大文件大小(MB)
VITE_AUDIO_QUALITY="high"           # low | medium | high

# ========================================
# 音乐可视化器配置
# ========================================
VITE_VISUALIZER_HOST="localhost"
VITE_VISUALIZER_PORT="8080"
VITE_VISUALIZER_URL="http://localhost:8080/visualizer"
VITE_VISUALIZER_WEBSOCKET="ws://localhost:8080/ws"
VITE_VISUALIZER_AUTO_CONNECT="true"
VITE_VISUALIZER_WINDOW_SIZE="1200,800"
VITE_VISUALIZER_WINDOW_OPTIONS="resizable=yes,scrollbars=yes"

# ========================================
# 电台系统配置
# ========================================
VITE_RADIO_DEFAULT_STATION="tiangong_fm"
VITE_RADIO_VOLUME_DEFAULT="0.7"
VITE_RADIO_CROSSFADE_DURATION="2000"
VITE_RADIO_BUFFER_SIZE="8192"
VITE_RADIO_RECONNECT_INTERVAL="5000"
VITE_RADIO_MAX_RECONNECT_ATTEMPTS="10"

# 预设电台列表
VITE_RADIO_STATIONS='[
  {
    "id": "tiangong_fm",
    "name": {"zh": "天宫电台", "en": "Tiangong FM"},
    "url": "https://stream.tiangong.tech/radio",
    "genre": "electronic",
    "bitrate": 320
  },
  {
    "id": "space_ambient",
    "name": {"zh": "太空环境音", "en": "Space Ambient"},
    "url": "https://stream.example.com/ambient",
    "genre": "ambient",
    "bitrate": 256
  }
]'

# ========================================
# 国际化配置
# ========================================
VITE_DEFAULT_LANGUAGE="zh"          # 默认语言
VITE_SUPPORTED_LANGUAGES="zh,en"    # 支持的语言列表
VITE_LOCALE_STORAGE_KEY="preferredLanguage"
VITE_LOCALE_FALLBACK="en"           # 后备语言
VITE_LOCALE_AUTO_DETECT="true"      # 自动检测系统语言
VITE_LOCALE_CACHE_TTL="86400"       # 语言包缓存时间(秒)

# ========================================
# UI动画配置
# ========================================
VITE_ANIMATION_DURATION_FAST="150"    # 快速动画(ms)
VITE_ANIMATION_DURATION_NORMAL="300"  # 正常动画(ms)
VITE_ANIMATION_DURATION_SLOW="500"    # 慢速动画(ms)
VITE_ANIMATION_EASING="cubic-bezier(0.4, 0, 0.2, 1)"
VITE_ANIMATION_REDUCED_MOTION="true"  # 尊重用户减少动画偏好

# Z-Index层次配置
VITE_Z_INDEX_BASE="0"
VITE_Z_INDEX_MODAL="9999"
VITE_Z_INDEX_TOOLTIP="10000"
VITE_Z_INDEX_MAX="10001"

# ========================================
# 背景Shader系统配置
# ========================================
VITE_SHADER_COUNT="5"               # 可用着色器数量
VITE_SHADER_AUTO_SWITCH="true"      # 自动切换着色器
VITE_SHADER_PRELOAD="true"          # 预加载着色器
VITE_BACKGROUND_STORAGE_KEY="autoShaderIndex"
VITE_SHADER_PERFORMANCE_MODE="auto"  # auto | high | medium | low
VITE_SHADER_MOBILE_OPTIMIZE="true"  # 移动端优化

# Shader特效配置
VITE_SHADER_MOUSE_INTERACTION="true"
VITE_SHADER_TIME_MULTIPLIER="1.0"
VITE_SHADER_INTENSITY="0.8"
VITE_SHADER_COLOR_SHIFT="0.5"

# ========================================
# 性能监控配置
# ========================================
VITE_MEMORY_LEAK_PREVENTION="true"
VITE_WINDOW_MONITOR_INTERVAL="1000"
VITE_CLEANUP_TIMEOUT="600000"       # 10分钟清理超时
VITE_PERFORMANCE_BUDGET_JS="512"    # JS预算(KB)
VITE_PERFORMANCE_BUDGET_CSS="128"   # CSS预算(KB)
VITE_PERFORMANCE_BUDGET_IMAGES="2048" # 图片预算(KB)

# FPS监控
VITE_TARGET_FPS="60"
VITE_FPS_WARNING_THRESHOLD="30"
VITE_FPS_CRITICAL_THRESHOLD="15"

# ========================================
# 存储配置
# ========================================
VITE_STORAGE_PREFIX="tiangong_"
VITE_STORAGE_VERSION="2.1.0"
VITE_STORAGE_QUOTA_WARNING="80"     # 存储配额警告阈值(%)
VITE_STORAGE_CLEANUP_INTERVAL="86400" # 存储清理间隔(秒)

# IndexedDB配置
VITE_IDB_NAME="tiangong_db"
VITE_IDB_VERSION="2"
VITE_IDB_OBJECT_STORES="playlists,tracks,settings,logs"

# ========================================
# 安全配置
# ========================================
VITE_CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
VITE_API_RATE_LIMIT="100"           # 每分钟API请求限制
VITE_CSP_ENABLED="true"             # 内容安全策略
VITE_SECURE_STORAGE="true"          # 安全存储模式

# ========================================
# 日志配置
# ========================================
VITE_LOG_LEVEL="info"               # debug | info | warn | error
VITE_LOG_MAX_ENTRIES="1000"         # 最大日志条目数
VITE_LOG_PERSISTENCE="true"         # 持久化日志
VITE_LOG_UPLOAD_ENDPOINT=""         # 日志上传端点(可选)
VITE_LOG_RETENTION_DAYS="7"         # 日志保留天数

# ========================================
# 开发工具配置
# ========================================
VITE_DEV_TOOLS="true"               # 开发工具开关
VITE_HOT_RELOAD="true"              # 热重载
VITE_SOURCE_MAPS="true"             # 源码映射
VITE_TYPE_CHECKING="true"           # 类型检查

# ========================================
# 部署配置
# ========================================
VITE_BUILD_TARGET="es2020"
VITE_PUBLIC_PATH="/"
VITE_ASSET_INLINE_LIMIT="4096"      # 资源内联限制(bytes)
VITE_CHUNK_SIZE_WARNING_LIMIT="1000" # 块大小警告限制(KB)

# CDN配置
VITE_CDN_URL=""                     # CDN基础URL(可选)
VITE_ASSET_CDN=""                   # 资源CDN URL(可选)
```

### 环境特定配置

#### 开发环境 (.env.local)
```bash
# 开发环境特有配置
VITE_NODE_ENV="development"
VITE_DEBUG_MODE="true"
VITE_HOT_RELOAD="true"
VITE_SOURCE_MAPS="true"

# 本地服务配置
VITE_TERMUSIC_HOST="localhost"
VITE_VISUALIZER_HOST="localhost"

# 开发工具
VITE_DEV_TOOLS="true"
VITE_PERFORMANCE_MONITORING="true"
VITE_LOG_LEVEL="debug"
```

#### 生产环境 (.env.production)
```bash
# 生产环境配置
VITE_NODE_ENV="production"
VITE_DEBUG_MODE="false"
VITE_HOT_RELOAD="false"
VITE_SOURCE_MAPS="false"

# 生产服务配置
VITE_TERMUSIC_HOST="api.tiangong.tech"
VITE_VISUALIZER_HOST="visualizer.tiangong.tech"

# 性能优化
VITE_SHADER_PERFORMANCE_MODE="medium"
VITE_LOG_LEVEL="warn"
VITE_LOG_UPLOAD_ENDPOINT="https://logs.tiangong.tech/api/upload"

# 安全配置
VITE_CSP_ENABLED="true"
VITE_SECURE_STORAGE="true"
```

## ⚙️ 构建配置

### Vite配置 (vite.config.ts)
```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // React配置
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@emotion/babel-plugin']
        }
      })
    ],

    // 开发服务器配置
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      cors: true,
      proxy: {
        // 代理Termusic API
        '/api/termusic': {
          target: `http://${env.VITE_TERMUSIC_HOST}:${env.VITE_TERMUSIC_PORT}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/termusic/, '')
        },
        // 代理音乐可视化器
        '/api/visualizer': {
          target: `http://${env.VITE_VISUALIZER_HOST}:${env.VITE_VISUALIZER_PORT}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/visualizer/, '')
        }
      }
    },

    // 构建配置
    build: {
      target: env.VITE_BUILD_TARGET || 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'terser',
      sourcemap: env.VITE_SOURCE_MAPS === 'true',
      
      // Terser配置
      terserOptions: {
        compress: {
          drop_console: env.VITE_NODE_ENV === 'production',
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug']
        },
        mangle: {
          safari10: true
        }
      },

      // Rollup配置
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        },
        output: {
          // 代码分割配置
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'motion-vendor': ['motion/react'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-popover',
              '@radix-ui/react-tooltip'
            ],
            'audio-vendor': ['wavesurfer.js'],
            'utils': [
              './src/components/util/i18n.ts',
              './src/components/util/shaders.ts'
            ]
          },
          // 资源命名
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name!.split('.');
            const extType = info[info.length - 1];
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name!)) {
              return `media/[name]-[hash].${extType}`;
            } else if (/\.(png|jpe?g|gif|svg|ico|webp)$/.test(assetInfo.name!)) {
              return `images/[name]-[hash].${extType}`;
            } else if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name!)) {
              return `fonts/[name]-[hash].${extType}`;
            }
            return `assets/[name]-[hash].${extType}`;
          }
        }
      },

      // 性能预算
      chunkSizeWarningLimit: parseInt(env.VITE_CHUNK_SIZE_WARNING_LIMIT) || 1000
    },

    // 路径解析
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@utils': path.resolve(__dirname, './src/components/util')
      }
    },

    // CSS配置
    css: {
      postcss: './postcss.config.js',
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@styles/variables.scss";`
        }
      }
    },

    // 环境变量
    envPrefix: 'VITE_',
    envDir: '.',

    // 优化配置
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'motion/react',
        'wavesurfer.js'
      ],
      exclude: [
        'fsevents'
      ]
    },

    // 实验性功能
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      }
    }
  };
});
```

### TypeScript配置 (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* 模块解析 */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* 路径映射 */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@styles/*": ["./src/styles/*"],
      "@utils/*": ["./src/components/util/*"]
    },

    /* 类型检查 */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,

    /* 高级选项 */
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    
    /* 类型定义 */
    "types": ["vite/client", "node"]
  },
  
  "include": [
    "src/**/*",
    "components/**/*",
    "styles/**/*",
    "*.ts",
    "*.tsx"
  ],
  
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.test.tsx"
  ],

  "references": [
    { "path": "./tsconfig.node.json" }
  ]
}
```

### PostCSS配置 (postcss.config.js)
```javascript
export default {
  plugins: {
    // Tailwind CSS
    tailwindcss: {},
    
    // 自动前缀
    autoprefixer: {
      overrideBrowserslist: [
        '>= 0.5%',
        'last 2 major versions',
        'not dead',
        'Chrome >= 60',
        'Firefox >= 60',
        'Safari >= 12',
        'Edge >= 79'
      ]
    },

    // CSS优化
    'postcss-preset-env': {
      stage: 1,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'custom-media-queries': true
      }
    },

    // 生产环境优化
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true
          },
          normalizeWhitespace: false
        }]
      }
    } : {})
  }
};
```

## 🎨 样式配置

### Tailwind配置 (tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  
  // Tailwind v4.0配置
  theme: {
    extend: {
      // 银色主题色彩系统
      colors: {
        // 系统色彩
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        
        // 银色调色板
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
          
          // 自定义银色
          primary: 'var(--silver-primary)',
          secondary: 'var(--silver-secondary)',
          tertiary: 'var(--silver-tertiary)'
        },

        // 状态色彩
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },

      // 字体配置
      fontFamily: {
        mono: ['var(--font-mono)', 'Monaco', 'Menlo', 'monospace'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        chinese: ['var(--font-chinese)', 'PingFang SC', 'sans-serif']
      },

      // 动画配置
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },

      // 关键帧
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px var(--silver-glow-soft)' },
          '50%': { boxShadow: '0 0 20px var(--silver-glow-strong)' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },

      // 间距系统
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem'
      },

      // 圆角系统
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px'
      },

      // 阴影系统
      boxShadow: {
        'glow-sm': '0 0 5px var(--silver-glow-soft)',
        'glow-md': '0 0 10px var(--silver-glow-medium)',
        'glow-lg': '0 0 20px var(--silver-glow-strong)',
        'inner-glow': 'inset 0 0 10px var(--silver-glow-soft)'
      },

      // 背景图案
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'silver-gradient': 'var(--gradient-silver-primary)',
        'silver-radial': 'var(--gradient-radial-silver)'
      },

      // 屏幕断点
      screens: {
        'xs': '475px',
        '3xl': '1792px'
      }
    }
  },

  // 插件配置
  plugins: [
    // 表单样式
    require('@tailwindcss/forms'),
    
    // 排版样式
    require('@tailwindcss/typography'),
    
    // 容器查询
    require('@tailwindcss/container-queries'),

    // 自定义工具类
    function({ addUtilities, theme }) {
      const newUtilities = {
        // 银色文本效果
        '.text-silver-glow': {
          color: theme('colors.silver.primary'),
          textShadow: `0 0 10px ${theme('colors.silver.primary')}`,
        },
        
        // 玻璃态效果(已禁用)
        '.glass-disabled': {
          background: 'var(--silver-primary-10)',
          border: '1px solid var(--silver-primary-15)',
        },
        
        // 动画减少支持
        '.motion-safe': {
          '@media (prefers-reduced-motion: no-preference)': {
            // 动画样式
          }
        },
        
        // 拖拽样式
        '.draggable': {
          cursor: 'grab',
          userSelect: 'none',
        },
        
        '.dragging': {
          cursor: 'grabbing',
        }
      };
      
      addUtilities(newUtilities);
    }
  ],

  // 暗色模式
  darkMode: 'class',

  // 变体配置
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['active', 'disabled'],
      textColor: ['active', 'disabled']
    }
  }
};
```

## 📦 依赖配置

### Package.json核心配置
```json
{
  "name": "tiangong-visual-experience",
  "version": "2.1.0",
  "description": "天宫科技全屏视觉体验应用",
  "author": "天宫科技 - 麻蛇",
  "license": "MIT",
  
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc && vite build",
    "build:prod": "NODE_ENV=production vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"**/*.{js,ts,tsx,json,css,md}\"",
    "clean": "rm -rf dist node_modules/.vite",
    "analyze": "npm run build && npx vite-bundle-analyzer dist/stats.html"
  },

  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "motion": "^11.0.0",
    "wavesurfer.js": "^7.0.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-tooltip": "^1.0.7",
    "lucide-react": "^0.300.0",
    "sonner": "^2.0.3"
  },

  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "typescript": "^5.2.2",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  },

  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },

  "browserslist": [
    "> 0.5%",
    "last 2 versions",
    "Firefox ESR",
    "not dead",
    "not IE 11"
  ]
}
```

## 🔧 配置工具函数

### 环境配置管理器
```typescript
// utils/config.ts
interface AppConfig {
  app: {
    name: string;
    version: string;
    author: string;
    buildTime: string;
  };
  
  audio: {
    termusic: {
      host: string;
      port: number;
      apiBase: string;
      websocket: string;
      timeout: number;
      retryAttempts: number;
      retryDelay: number;
    };
    
    wavesurfer: {
      windowSize: number;
      bufferSize: number;
      sampleRate: number;
      preloadSeconds: number;
      chunkSize: number;
      maxChunks: number;
    };
  };
  
  ui: {
    animations: {
      fast: number;
      normal: number;
      slow: number;
      easing: string;
    };
    
    zIndex: {
      base: number;
      modal: number;
      tooltip: number;
      max: number;
    };
  };
  
  development: {
    debugMode: boolean;
    performanceMonitoring: boolean;
    logLevel: string;
  };
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    return {
      app: {
        name: import.meta.env.VITE_APP_NAME || 'Tiangong App',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        author: import.meta.env.VITE_APP_AUTHOR || 'Unknown',
        buildTime: import.meta.env.VITE_APP_BUILD_TIME || new Date().toISOString()
      },
      
      audio: {
        termusic: {
          host: import.meta.env.VITE_TERMUSIC_HOST || 'localhost',
          port: parseInt(import.meta.env.VITE_TERMUSIC_PORT) || 7533,
          apiBase: import.meta.env.VITE_TERMUSIC_API_BASE || 'http://localhost:7533/api',
          websocket: import.meta.env.VITE_TERMUSIC_WEBSOCKET || 'ws://localhost:7533/ws',
          timeout: parseInt(import.meta.env.VITE_TERMUSIC_TIMEOUT) || 10000,
          retryAttempts: parseInt(import.meta.env.VITE_TERMUSIC_RETRY_ATTEMPTS) || 3,
          retryDelay: parseInt(import.meta.env.VITE_TERMUSIC_RETRY_DELAY) || 2000
        },
        
        wavesurfer: {
          windowSize: parseInt(import.meta.env.VITE_WAVESURFER_WINDOW_SIZE) || 10,
          bufferSize: parseInt(import.meta.env.VITE_WAVESURFER_BUFFER_SIZE) || 1024,
          sampleRate: parseInt(import.meta.env.VITE_WAVESURFER_SAMPLE_RATE) || 44100,
          preloadSeconds: parseInt(import.meta.env.VITE_WAVESURFER_PRELOAD_SECONDS) || 2,
          chunkSize: parseInt(import.meta.env.VITE_WAVESURFER_CHUNK_SIZE) || 65536,
          maxChunks: parseInt(import.meta.env.VITE_WAVESURFER_MAX_CHUNKS) || 100
        }
      },
      
      ui: {
        animations: {
          fast: parseInt(import.meta.env.VITE_ANIMATION_DURATION_FAST) || 150,
          normal: parseInt(import.meta.env.VITE_ANIMATION_DURATION_NORMAL) || 300,
          slow: parseInt(import.meta.env.VITE_ANIMATION_DURATION_SLOW) || 500,
          easing: import.meta.env.VITE_ANIMATION_EASING || 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        
        zIndex: {
          base: parseInt(import.meta.env.VITE_Z_INDEX_BASE) || 0,
          modal: parseInt(import.meta.env.VITE_Z_INDEX_MODAL) || 9999,
          tooltip: parseInt(import.meta.env.VITE_Z_INDEX_TOOLTIP) || 10000,
          max: parseInt(import.meta.env.VITE_Z_INDEX_MAX) || 10001
        }
      },
      
      development: {
        debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
        performanceMonitoring: import.meta.env.VITE_PERFORMANCE_MONITORING === 'true',
        logLevel: import.meta.env.VITE_LOG_LEVEL || 'info'
      }
    };
  }

  get<T extends keyof AppConfig>(section: T): AppConfig[T] {
    return this.config[section];
  }

  getValue<T extends keyof AppConfig, K extends keyof AppConfig[T]>(
    section: T, 
    key: K
  ): AppConfig[T][K] {
    return this.config[section][key];
  }

  isDevelopment(): boolean {
    return import.meta.env.DEV;
  }

  isProduction(): boolean {
    return import.meta.env.PROD;
  }

  getEnvironment(): string {
    return import.meta.env.MODE;
  }
}

export const config = new ConfigManager();
```

### 配置验证器
```typescript
// utils/config-validator.ts
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigValidator {
  static validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查必需的环境变量
    const requiredEnvVars = [
      'VITE_APP_NAME',
      'VITE_APP_VERSION',
      'VITE_TERMUSIC_HOST',
      'VITE_TERMUSIC_PORT'
    ];

    requiredEnvVars.forEach(varName => {
      if (!import.meta.env[varName]) {
        errors.push(`缺少必需的环境变量: ${varName}`);
      }
    });

    // 检查端口配置
    const termusicPort = parseInt(import.meta.env.VITE_TERMUSIC_PORT);
    if (isNaN(termusicPort) || termusicPort < 1000 || termusicPort > 65535) {
      errors.push('Termusic端口配置无效');
    }

    // 检查音频配置
    const bufferSize = parseInt(import.meta.env.VITE_WAVESURFER_BUFFER_SIZE);
    if (isNaN(bufferSize) || bufferSize < 256 || bufferSize > 8192) {
      warnings.push('Wavesurfer缓冲区大小可能不合适');
    }

    // 检查动画配置
    const animationDuration = parseInt(import.meta.env.VITE_ANIMATION_DURATION_NORMAL);
    if (isNaN(animationDuration) || animationDuration < 50 || animationDuration > 1000) {
      warnings.push('动画持续时间配置可能不合适');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateAndThrow(): void {
    const result = this.validate();
    
    if (!result.isValid) {
      console.error('配置验证失败:', result.errors);
      throw new Error(`配置验证失败: ${result.errors.join(', ')}`);
    }

    if (result.warnings.length > 0) {
      console.warn('配置警告:', result.warnings);
    }
  }
}
```

---

## 🚀 快速配置指南

### 1. 基础设置
```bash
# 复制环境变量模板
cp .env.example .env

# 根据需要修改配置
nano .env
```

### 2. 开发环境设置
```bash
# 安装依赖
npm ci

# 启动开发服务器
npm run dev
```

### 3. 生产部署设置
```bash
# 创建生产环境配置
cp .env.example .env.production

# 构建生产版本
npm run build:prod
```

### 4. 配置验证
```typescript
// 在应用启动时验证配置
import { ConfigValidator } from './utils/config-validator';

try {
  ConfigValidator.validateAndThrow();
  console.log('✅ 配置验证通过');
} catch (error) {
  console.error('❌ 配置验证失败:', error);
  process.exit(1);
}
```

---

*配置指南版本: v2.1.0*  
*最后更新: 2025-01-25*  
*维护者: 天宫科技 - 麻蛇*