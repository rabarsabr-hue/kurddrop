/**
 * Install/refresh node_modules into %USERPROFILE%/kurd-drop-deps
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const homedir = os.homedir()
const depsRoot = path.join(homedir, 'kurd-drop-deps')
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectPkg = path.join(projectRoot, 'package.json')
const projectLock = path.join(projectRoot, 'package-lock.json')

fs.mkdirSync(depsRoot, { recursive: true })
fs.copyFileSync(projectPkg, path.join(depsRoot, 'package.json'))
if (fs.existsSync(projectLock)) {
  fs.copyFileSync(projectLock, path.join(depsRoot, 'package-lock.json'))
}

// Ensure vite.config exists in deps root (copy from project if missing)
const depsVite = path.join(depsRoot, 'vite.config.ts')
const projectViteLocal = path.join(projectRoot, 'vite.local.config.ts')
if (fs.existsSync(projectViteLocal)) {
  fs.copyFileSync(projectViteLocal, depsVite)
} else if (!fs.existsSync(depsVite)) {
  console.error(`[kurd-drop] Missing vite.config.ts — expected at ${depsVite} or ${projectViteLocal}`)
  process.exit(1)
}

console.log(`[kurd-drop] Installing deps into ${depsRoot} ...`)
const child = spawn('npm', ['install', '--no-audit', '--no-fund'], {
  cwd: depsRoot,
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

child.on('exit', (code) => {
  if (code === 0) console.log('[kurd-drop] deps ready.')
  process.exit(code ?? 1)
})
