# 部署指南 🚀

## 📋 快速部署清单

### 环境准备
- [x] Node.js >= 18.0.0
- [x] npm/yarn/pnpm 包管理器
- [x] 现代浏览器（支持WebGL）

### 本地开发
```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 访问应用
打开 http://localhost:3000
```

### 生产构建
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🌐 部署平台

### Vercel 部署（推荐）
1. 将代码推送到GitHub仓库
2. 访问 [vercel.com](https://vercel.com)
3. 导入GitHub仓库
4. 自动部署完成

### Netlify 部署
1. 将代码推送到GitHub仓库
2. 访问 [netlify.com](https://netlify.com)
3. 连接GitHub仓库
4. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`

### GitHub Pages 部署
```bash
# 安装gh-pages
npm install --save-dev gh-pages

# 添加部署脚本到package.json
"scripts": {
  "deploy": "gh-pages -d dist"
}

# 构建并部署
npm run build
npm run deploy
```

### Docker 部署
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

```bash
# 构建镜像
docker build -t space-station-app .

# 运行容器
docker run -p 3000:3000 space-station-app
```

## ⚙️ 环境变量配置

创建 `.env` 文件（可选）：
```env
# 应用配置
VITE_APP_TITLE=天宫空间站坐标系统
VITE_APP_VERSION=1.0.0

# 地理位置API配置（如需使用其他服务）
VITE_GEO_API_URL=https://api.bigdatacloud.net/data/reverse-geocode-client

# 性能配置
VITE_TARGET_FPS=45
VITE_PIXEL_RATIO_LIMIT=2
```

## 🔧 性能优化配置

### 生产环境优化
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['motion'],
          utils: ['clsx', 'tailwind-merge']
        }
      }
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

### CDN资源优化
在 `index.html` 中添加预加载：
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="dns-prefetch" href="https://api.bigdatacloud.net">
```

## 🛡️ 安全配置

### Content Security Policy (CSP)
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.bigdatacloud.net;
  img-src 'self' data: https:;
">
```

### HTTPS 重定向
在 `public/_redirects`（Netlify）或 `vercel.json`（Vercel）中配置：
```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "https://your-domain.com/$1",
      "permanent": true
    }
  ]
}
```

## 📊 监控和分析

### 性能监控
```typescript
// 添加到 main.tsx
if ('performance' in window) {
  window.addEventListener('load', () => {
    const timing = performance.getEntriesByType('navigation')[0];
    console.log('页面加载时间:', timing.loadEventEnd - timing.loadEventStart);
  });
}
```

### 错误追踪
```typescript
// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
  // 发送到错误追踪服务
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});
```

## 🔍 故障排查

### 常见部署问题

#### 1. 路由404错误
```javascript
// vite.config.ts - 添加history fallback
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
```

#### 2. 静态资源加载失败
```typescript
// 检查base路径设置
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/'
})
```

#### 3. WebGL不工作
```typescript
// 添加WebGL检测
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
if (!gl) {
  console.error('WebGL not supported');
  // 显示降级UI
}
```

#### 4. 字体加载失败
```css
/* 添加字体fallback */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### 性能检查清单

- [ ] 启用Gzip/Brotli压缩
- [ ] 优化图片格式和大小
- [ ] 启用浏览器缓存
- [ ] 使用CDN加速
- [ ] 代码分割和懒加载
- [ ] 移除console.log
- [ ] 压缩CSS和JS
- [ ] 优化WebGL着色器

### 移动端适配

```css
/* 添加到globals.css */
@media (max-width: 768px) {
  .shader-canvas {
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
}
```

## 📈 升级指南

### 依赖更新
```bash
# 检查过时的包
npm outdated

# 更新所有依赖
npm update

# 更新主要版本
npm install package@latest
```

### 版本发布
```bash
# 更新版本号
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 创建Git标签
git push --tags
```

## 🆘 技术支持

### 日志收集
```bash
# 构建日志
npm run build > build.log 2>&1

# 运行时日志
npm run dev > dev.log 2>&1
```

### 问题报告模板
请提供以下信息：
- 操作系统和版本
- 浏览器和版本
- Node.js版本
- 错误截图
- 控制台错误信息
- 复现步骤

---

**部署成功后，享受您的太空之旅！** 🌌✨