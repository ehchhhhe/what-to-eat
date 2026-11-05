import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { aiProxyPlugin } from './server/viteAiProxyPlugin'

export default defineConfig({
    plugins: [vue(), aiProxyPlugin()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: false, // 禁用压缩以避免terser问题
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    }
})
