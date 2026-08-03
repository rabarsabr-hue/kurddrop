import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // گوێ بگرە لە هەموو ناونیشانەکان — پێویستە بۆ کردنەوە بە IP لە مۆبایل
    host: '0.0.0.0',
    port: 5174,
    strictPort: false,
    // ڕێگەبدە بە Hostـی IP / ناوی ئامێر
    allowedHosts: true,
    cors: true,
    // Google Drive can stamp many files at once — avoid HMR storms that blank the page
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/*.tmp',
        '**/*~',
      ],
    },
    // HMR host لە location.hostname وەردەگیرێت — کار دەکات بۆ localhost و IP
    hmr: {
      overlay: true,
    },
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
