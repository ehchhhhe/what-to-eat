const { execSync } = require('child_process');

try {
    console.log('Starting Netlify build...');

    // 安装依赖
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // 构建项目（不进行类型检查），并在构建后检查产物里是否泄露了密钥
    console.log('Building project...');
    execSync('npm run build:netlify', { stdio: 'inherit' });

    console.log('Build completed successfully!');
} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}