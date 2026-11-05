import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { aiProxyPlugin } from './server/viteAiProxyPlugin'

export default defineConfig({
    // aiProxyPlugin：让本地 dev / preview 也走 /api/ai/* 同源代理，
    // 模型密钥只存在于 .env 的服务端变量（不带 VITE_ 前缀）
    plugins: [vue(), aiProxyPlugin()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    server: {
        host: '0.0.0.0'
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild'
    }
})
