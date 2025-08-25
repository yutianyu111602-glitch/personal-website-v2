# 项目打包说明 📦

## 🎯 打包目标

将天宫空间站坐标系统项目打包成ZIP文件，便于分发、部署和备份。

## 🚀 快速打包（推荐）

### 方法1: 使用npm脚本（推荐）
```bash
# 安装archiver依赖并打包
npm run package:install

# 或者如果已安装archiver
npm run package
```

### 方法2: 使用Node.js脚本
```bash
# 直接运行打包脚本
node create-package.js
```

## 🛠️ 手动打包方法

### Windows用户
```batch
# 运行批处理脚本
package-project.bat
```

### macOS/Linux用户
```bash
# 给脚本执行权限
chmod +x package-project.sh

# 运行脚本
./package-project.sh
```

### 手动创建（所有平台）
1. 创建新文件夹 `space-station-coordinates`
2. 复制以下文件和目录到新文件夹：
   ```
   ├── App.tsx
   ├── index.html
   ├── package.json
   ├── tsconfig.json
   ├── vite.config.ts
   ├── tailwind.config.js
   ├── postcss.config.js
   ├── eslint.config.js
   ├── .gitignore
   ├── README.md
   ├── DEPLOYMENT.md
   ├── Attributions.md
   ├── LICENSE/
   ├── src/
   ├── styles/
   └── components/
   ```
3. 将文件夹压缩为ZIP文件

## 📋 打包内容清单

### 🔧 配置文件
- [x] `package.json` - 项目依赖和脚本
- [x] `tsconfig.json` - TypeScript配置
- [x] `vite.config.ts` - Vite构建配置
- [x] `tailwind.config.js` - Tailwind CSS配置
- [x] `postcss.config.js` - PostCSS配置
- [x] `eslint.config.js` - ESLint配置

### 📄 核心文件
- [x] `App.tsx` - 应用主组件
- [x] `index.html` - HTML模板
- [x] `src/main.tsx` - React入口文件

### 🎨 样式文件
- [x] `styles/globals.css` - 全局样式和动画
- [x] `styles/fonts.css` - 字体配置
- [x] `styles/input-fixes.css` - 输入框修复
- [x] `styles/sonner-fixes.css` - 通知组件修复

### 🧩 组件库
- [x] `components/` - 完整的React组件库
  - TimeDisplay.tsx - 时间显示和空间站坐标
  - ShaderCanvas.tsx - WebGL着色器渲染
  - ShaderBackground.tsx - 默认背景
  - util/ - 工具函数和模拟器
  - ui/ - shadcn/ui组件库

### 📚 文档文件
- [x] `README.md` - 项目说明
- [x] `DEPLOYMENT.md` - 部署指南
- [x] `Attributions.md` - 开源组件归属
- [x] `LICENSE/` - 许可证文件

### 🚫 排除内容
- `node_modules/` - 依赖包（需要npm install）
- `dist/` - 构建输出（需要npm run build）
- `.git/` - Git版本控制
- `*.DS_Store` - macOS系统文件
- 临时文件和缓存

## 🎯 接收方使用说明

### 1. 解压项目
```bash
unzip space-station-coordinates.zip
cd space-station-coordinates
```

### 2. 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 访问应用
打开浏览器访问: http://localhost:3000

### 5. 构建生产版本
```bash
npm run build
npm run preview
```

## 🔍 验证打包完整性

### 检查清单
- [ ] ZIP文件可以正常解压
- [ ] package.json存在且依赖完整
- [ ] 所有组件文件都在components目录下
- [ ] 样式文件完整（globals.css等）
- [ ] 配置文件正确（vite.config.ts等）
- [ ] 文档文件齐全（README.md等）

### 测试步骤
```bash
# 1. 解压到新目录
mkdir test-unpack
cd test-unpack
unzip ../space-station-coordinates.zip

# 2. 安装依赖
npm install

# 3. 检查是否可以启动
npm run dev

# 4. 检查构建
npm run build
```

## 🐛 常见问题

### Q: 打包脚本无法运行？
A: 确保安装了Node.js，然后运行 `npm install archiver`

### Q: ZIP文件过大？
A: 正常现象，主要是源代码和配置。接收方运行npm install后会下载依赖

### Q: 解压后无法启动？
A: 检查是否运行了 `npm install` 安装依赖

### Q: 缺少某些文件？
A: 检查打包脚本是否包含了所有必要的文件和目录

## 📊 文件大小参考

- **源代码ZIP**: ~50-100KB
- **安装依赖后**: ~200-300MB
- **构建输出**: ~5-10MB

## 🔄 版本控制

在打包前建议：
1. 更新版本号 `npm version patch/minor/major`
2. 更新README.md中的版本信息
3. 检查DEPLOYMENT.md是否为最新

## 📞 技术支持

如果在打包过程中遇到问题：
1. 检查Node.js版本（>= 18.0.0）
2. 确保所有文件都存在
3. 查看控制台错误信息
4. 参考DEPLOYMENT.md中的故障排查

---

**@天宫科技 Made By 麻蛇** 🌌✨

祝您打包顺利，分享愉快！