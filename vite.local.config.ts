import { defineConfig, normalizePath, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'
import { builtinModules } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Project lives on Google Drive; deps stay on local NTFS. */
const HERE = path.dirname(fileURLToPath(import.meta.url))
function detectProjectRoot(): string {
  if (process.env.KD_PROJECT_ROOT) return normalizePath(process.env.KD_PROJECT_ROOT)
  if (fs.existsSync(path.join(HERE, 'src', 'main.tsx'))) return normalizePath(HERE)
  const driveFallback = 'G:/My Drive/Kurd Drop'
  if (fs.existsSync(path.join(driveFallback, 'src', 'main.tsx'))) return normalizePath(driveFallback)
  return normalizePath(HERE)
}
const PROJECT_ROOT = detectProjectRoot()
const DEPS_ROOT = process.env.KD_DEPS_ROOT
  ? normalizePath(process.env.KD_DEPS_ROOT)
  : (fs.existsSync(path.join(HERE, 'node_modules', 'vite')) ? normalizePath(HERE) : PROJECT_ROOT)
const LOCAL_NM = path.join(DEPS_ROOT, 'node_modules')
const SRC = path.join(PROJECT_ROOT, 'src')
const localRequire = createRequire(path.join(DEPS_ROOT, 'package.json'))

const builtins = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
])

function resolveFromLocalDeps(): Plugin {
  return {
    name: 'resolve-from-local-deps',
    enforce: 'pre',
    resolveId(source) {
      if (
        !source ||
        source.startsWith('\0') ||
        source.startsWith('.') ||
        source.startsWith('/') ||
        source.startsWith('@/') ||
        path.isAbsolute(source)
      ) {
        return null
      }
      if (source.startsWith('virtual:') || source.startsWith('vite/')) return null
      if (builtins.has(source)) return null
      try {
        return localRequire.resolve(source)
      } catch {
        return null
      }
    },
  }
}

export default defineConfig({
  root: PROJECT_ROOT,
  publicDir: path.join(PROJECT_ROOT, 'public'),
  plugins: [resolveFromLocalDeps(), react()],
  resolve: {
    alias: {
      '@': SRC,
      react: path.join(LOCAL_NM, 'react'),
      'react-dom': path.join(LOCAL_NM, 'react-dom'),
      'react-dom/client': path.join(LOCAL_NM, 'react-dom/client.js'),
      'react/jsx-runtime': path.join(LOCAL_NM, 'react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.join(LOCAL_NM, 'react/jsx-dev-runtime.js'),
      'socket.io-client': path.join(LOCAL_NM, 'socket.io-client'),
      leaflet: path.join(LOCAL_NM, 'leaflet'),
      'leaflet.markercluster': path.join(LOCAL_NM, 'leaflet.markercluster'),
      firebase: path.join(LOCAL_NM, 'firebase'),
      three: path.join(LOCAL_NM, 'three'),
    },
    dedupe: ['react', 'react-dom', 'three'],
  },
  cacheDir: path.join(DEPS_ROOT, '.vite'),
  optimizeDeps: {
    noDiscovery: false,
    include: [],
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    fs: {
      allow: [PROJECT_ROOT, DEPS_ROOT],
    },
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
  build: {
    outDir: path.join(PROJECT_ROOT, 'dist'),
    emptyOutDir: true,
  },
})
