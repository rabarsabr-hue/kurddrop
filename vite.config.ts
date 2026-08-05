import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

/**
 * Fallback config if someone runs vite from the Drive project folder.
 * Prefer: npm run dev (uses C:/Users/pc/kurd-drop-deps).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: false,
    allowedHosts: true,
    cors: true,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/*.tmp',
        '**/*~',
      ],
    },
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
