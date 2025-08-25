const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

const createCompletePackage = async () => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
  const packageName = `space-station-console-complete-${timestamp}`;
  const packagePath = path.join(process.cwd(), `${packageName}.zip`);
  
  console.log('🚀 开始创建完整项目包...');
  
  const output = fs.createWriteStream(packagePath);
  const archive = archiver('zip', { 
    zlib: { level: 9 },
    comment: '空间站控制台完整项目包 - 版权@天宫科技 Made By 麻蛇'
  });
  
  output.on('close', () => {
    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log('📦 项目打包完成!');
    console.log(`📄 文件名: ${packageName}.zip`);
    console.log(`📊 文件大小: ${sizeInMB} MB`);
    console.log(`🗂️  包含文件数: ${archive.pointer() > 0 ? '✅' : '❌'}`);
    console.log('');
    console.log('📋 包含内容:');
    console.log('  ✅ 完整源代码 (React + TypeScript)');
    console.log('  ✅ 配置文件 (package.json, vite.config.ts, tailwind.config.js)');
    console.log('  ✅ 样式文件 (全局CSS + 组件样式)');
    console.log('  ✅ UI组件库 (ShadCN/UI 完整组件)');
    console.log('  ✅ Shader着色器 (5种深空背景效果)');
    console.log('  ✅ 工具脚本 (打包、部署自动化)');
    console.log('  ✅ 文档资料 (接入指南、项目档案、README)');
    console.log('  ✅ 许可证和署名信息');
    console.log('');
    console.log('🎯 部署说明:');
    console.log('  1. 解压缩文件');
    console.log('  2. npm install');
    console.log('  3. npm run dev');
    console.log('');
    console.log('📖 更多信息请查看 CURSOR_INTEGRATION_GUIDE.md');
    console.log('');
    console.log('🎨 版权@天宫科技 Made By 麻蛇');
  });
  
  output.on('error', (err) => {
    console.error('❌ 打包过程中出现错误:', err);
  });
  
  archive.on('error', (err) => {
    console.error('❌ 压缩过程中出现错误:', err);
    throw err;
  });
  
  archive.pipe(output);
  
  // 核心应用文件
  const coreFiles = [
    'App.tsx',
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'tailwind.config.js',
    'tsconfig.json',
    'postcss.config.js',
    'eslint.config.js',
    'index.html'
  ];
  
  console.log('📄 添加核心配置文件...');
  coreFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file });
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ⚠️  ${file} (文件不存在，跳过)`);
    }
  });
  
  // 源码目录
  const directories = [
    'src',
    'components',
    'styles',
    'public'
  ];
  
  console.log('📂 添加源码目录...');
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      archive.directory(dirPath, dir);
      console.log(`  ✅ ${dir}/`);
    } else {
      console.log(`  ⚠️  ${dir}/ (目录不存在，跳过)`);
    }
  });
  
  // 文档文件
  const documentFiles = [
    'README.md',
    'CURSOR_INTEGRATION_GUIDE.md',
    'PROJECT_ARCHIVE.md',
    'DEPLOYMENT.md',
    'PACKAGING.md',
    'Guidelines.md',
    'Attributions.md',
    'LICENSE'
  ];
  
  console.log('📚 添加文档文件...');
  documentFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file });
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ⚠️  ${file} (文件不存在，跳过)`);
    }
  });
  
  // 工具脚本
  const scriptFiles = [
    'create-package.js',
    'create-zip.js',
    'create-complete-package.js',
    'package-project.sh',
    'package-project.bat'
  ];
  
  console.log('🔧 添加工具脚本...');
  scriptFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file });
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ⚠️  ${file} (文件不存在，跳过)`);
    }
  });
  
  // 添加项目信息文件
  const projectInfo = {
    name: "空间站控制台",
    version: "1.0.0",
    description: "基于React的全屏视觉体验应用，集成深空背景、空间站时钟和音乐整理功能",
    author: "麻蛇 @天宫科技",
    license: "MIT",
    created: new Date().toISOString(),
    tech_stack: [
      "React 18",
      "TypeScript",
      "Vite",
      "Tailwind CSS v4",
      "Motion (Framer Motion)",
      "Radix UI",
      "ShadCN/UI"
    ],
    features: [
      "5种WebGL Shader深空背景",
      "空间站轨道模拟器",
      "实时数字时钟显示",
      "音乐整理控制台",
      "2025 Apple毛玻璃风格",
      "优化动画性能",
      "响应式设计"
    ],
    deployment: {
      dev: "npm install && npm run dev",
      build: "npm run build",
      preview: "npm run preview"
    }
  };
  
  archive.append(JSON.stringify(projectInfo, null, 2), { name: 'PROJECT_INFO.json' });
  console.log('  ✅ PROJECT_INFO.json');
  
  // 添加快速开始指南
  const quickStart = `# 🚀 快速开始

## 环境要求
- Node.js 18+
- npm 或 yarn

## 安装步骤
\`\`\`bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 浏览器访问 http://localhost:5173
\`\`\`

## 生产构建
\`\`\`bash
npm run build
npm run preview
\`\`\`

## 主要功能
- 🌌 深空背景: 5种WebGL着色器动画
- 🛰️ 空间站时钟: 实时轨道坐标显示
- 🎵 音乐整理: Spotify + 网易云音乐
- 💎 毛玻璃界面: 2025 Apple设计风格

## 操作说明
1. 应用启动后显示欢迎界面
2. 点击任意位置进入控制台模式
3. 点击左上角时钟返回欢迎界面
4. 点击设置按钮打开音乐整理功能

## 更多信息
请查看 CURSOR_INTEGRATION_GUIDE.md 获取详细的开发文档。

---
版权@天宫科技 Made By 麻蛇
`;
  
  archive.append(quickStart, { name: 'QUICK_START.md' });
  console.log('  ✅ QUICK_START.md');
  
  await archive.finalize();
};

// 检查必要依赖
const checkDependencies = () => {
  try {
    require('archiver');
    require('fs-extra');
    return true;
  } catch (error) {
    console.error('❌ 缺少必要依赖，请先安装:');
    console.error('npm install archiver fs-extra');
    return false;
  }
};

if (checkDependencies()) {
  createCompletePackage().catch(console.error);
} else {
  process.exit(1);
}