const fs = require('fs');
const path = require('path');

// 创建ZIP文件的简单实现（不依赖外部库）
function createProjectZip() {
    console.log('🚀 天宫空间站 - 开始创建项目包...');
    
    // 检查是否安装了archiver
    try {
        const archiver = require('archiver');
        createWithArchiver(archiver);
    } catch (err) {
        console.log('📦 archiver未安装，使用备选方案...');
        createWithSystemCommand();
    }
}

function createWithArchiver(archiver) {
    const output = fs.createWriteStream('space-station-coordinates.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function() {
        console.log('✨ ZIP文件创建成功！');
        console.log(`📦 文件大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        console.log('📁 文件位置: ./space-station-coordinates.zip');
        printUsageInstructions();
    });

    archive.on('error', function(err) {
        console.error('❌ 创建ZIP文件时出错:', err);
    });

    archive.pipe(output);

    // 要包含的文件列表
    const filesToInclude = [
        'App.tsx',
        'index.html', 
        'package.json',
        'tsconfig.json',
        'vite.config.ts',
        'tailwind.config.js',
        'postcss.config.js',
        'eslint.config.js',
        '.gitignore',
        'README.md',
        'DEPLOYMENT.md',
        'Attributions.md'
    ];

    // 添加根文件
    filesToInclude.forEach(file => {
        if (fs.existsSync(file)) {
            archive.file(file, { name: file });
        }
    });

    // 添加目录
    const dirsToInclude = ['LICENSE', 'src', 'styles', 'components'];
    dirsToInclude.forEach(dir => {
        if (fs.existsSync(dir)) {
            archive.directory(dir, dir);
        }
    });

    console.log('📂 添加所有项目文件...');
    archive.finalize();
}

function createWithSystemCommand() {
    const { exec } = require('child_process');
    
    // 尝试使用系统的zip命令
    exec('zip --help', (error) => {
        if (error) {
            console.log('💡 请手动创建ZIP文件或安装archiver:');
            console.log('   npm install archiver');
            console.log('   然后重新运行此脚本');
            return;
        }

        // 创建ZIP文件
        const zipCommand = 'zip -r space-station-coordinates.zip App.tsx index.html package.json tsconfig.json vite.config.ts tailwind.config.js postcss.config.js eslint.config.js .gitignore README.md DEPLOYMENT.md Attributions.md LICENSE/ src/ styles/ components/ -x "node_modules/*" "dist/*" ".git/*" "*.DS_Store"';
        
        exec(zipCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ 创建ZIP失败:', error);
                console.log('💡 请尝试安装archiver: npm install archiver');
                return;
            }
            
            console.log('✨ ZIP文件创建成功！');
            console.log('📁 文件位置: ./space-station-coordinates.zip');
            printUsageInstructions();
        });
    });
}

function printUsageInstructions() {
    console.log('');
    console.log('🎯 使用说明:');
    console.log('  1. 解压ZIP文件到目标目录');
    console.log('  2. 进入项目目录');
    console.log('  3. 运行 npm install 安装依赖');
    console.log('  4. 运行 npm run dev 启动开发服务器');
    console.log('  5. 访问 http://localhost:3000');
    console.log('');
    console.log('🌌 享受您的太空坐标系统！');
    console.log('');
    console.log('@天宫科技 Made By 麻蛇');
}

// 运行打包函数
createProjectZip();