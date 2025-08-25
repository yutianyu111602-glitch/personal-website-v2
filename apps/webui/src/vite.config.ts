import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@/components": path.resolve(__dirname, "./components"),
      "@/utils": path.resolve(__dirname, "./components/util"),
      "@/ui": path.resolve(__dirname, "./components/ui"),
      "@/styles": path.resolve(__dirname, "./styles")
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.VITE_BUILD_SOURCEMAP === 'true',
    minify: process.env.VITE_BUILD_MINIFY !== 'false' ? 'terser' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['motion/react'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
          audio: ['wavesurfer.js']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: process.env.VITE_BUILD_DROP_CONSOLE === 'true',
        drop_debugger: true,
      }
    }
  },
  server: {
    host: true,
    port: 3000,
    cors: true,
    // 🔧 开发代理配置，支持Termusic后端
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.VITE_TERMUSIC_PORT || 7533}`,
        changeOrigin: true,
        secure: false,
        ws: true, // 支持WebSocket代理
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🚧 代理错误 (Termusic后端可能未启动):', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔗 代理请求:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ 代理响应:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/ws': {
        target: `ws://localhost:${process.env.VITE_TERMUSIC_PORT || 7533}`,
        ws: true,
        changeOrigin: true,
      }
    }
  },
  define: {
    // 环境变量注入
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    '__APP_VERSION__': JSON.stringify(process.env.VITE_APP_VERSION || '2.0.0'),
    '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
  },
  // 🔧 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'motion/react',
      'lucide-react'
    ],
    exclude: [
      'wavesurfer.js' // 在运行时动态加载
    ]
  }
})