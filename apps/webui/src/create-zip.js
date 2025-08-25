const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 创建输出流
const output = fs.createWriteStream('space-station-coordinates.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // 设置压缩级别
});

// 监听输出流事件
output.on('close', function() {
  console.log('🎉 ZIP文件创建成功！');
  console.log(`📦 文件大小: ${archive.pointer()} bytes`);
  console.log('📁 文件位置: ./space-station-coordinates.zip');
});

archive.on('error', function(err) {
  throw err;
});

// 管道流到输出文件
archive.pipe(output);

// 添加文件到压缩包
console.log('🚀 开始创建ZIP包...');

// 项目根文件
archive.file('App.tsx', { name: 'App.tsx' });
archive.file('index.html', { name: 'index.html' });
archive.file('package.json', { name: 'package.json' });
archive.file('tsconfig.json', { name: 'tsconfig.json' });
archive.file('vite.config.ts', { name: 'vite.config.ts' });
archive.file('tailwind.config.js', { name: 'tailwind.config.js' });
archive.file('postcss.config.js', { name: 'postcss.config.js' });
archive.file('eslint.config.js', { name: 'eslint.config.js' });
archive.file('.gitignore', { name: '.gitignore' });
archive.file('README.md', { name: 'README.md' });
archive.file('DEPLOYMENT.md', { name: 'DEPLOYMENT.md' });
archive.file('Attributions.md', { name: 'Attributions.md' });

// LICENSE目录
archive.file('LICENSE/Code-component-1035-428.tsx', { name: 'LICENSE/Code-component-1035-428.tsx' });
archive.file('LICENSE/Code-component-1035-436.tsx', { name: 'LICENSE/Code-component-1035-436.tsx' });

// src目录
archive.file('src/main.tsx', { name: 'src/main.tsx' });

// styles目录
archive.file('styles/globals.css', { name: 'styles/globals.css' });
archive.file('styles/fonts.css', { name: 'styles/fonts.css' });
archive.file('styles/input-fixes.css', { name: 'styles/input-fixes.css' });
archive.file('styles/sonner-fixes.css', { name: 'styles/sonner-fixes.css' });

// components目录 - 递归添加所有文件
archive.directory('components/', 'components');

console.log('📂 添加所有项目文件到ZIP包...');

// 完成打包
archive.finalize();