/**
 * Run Vite using deps from %USERPROFILE%/kurd-drop-deps (local NTFS).
 * Avoids hard-coded usernames like C:/Users/pc vs C:/Users/lenovo.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const homedir = os.homedir()
const depsRoot = path.join(homedir, 'kurd-drop-deps')
const viteConfig = path.join(depsRoot, 'vite.config.ts')
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectPkg = path.join(projectRoot, 'package.json')

const mode = process.argv[2] || 'dev' // dev | build | preview
const extraArgs = process.argv.slice(3)

if (!fs.existsSync(path.join(depsRoot, 'node_modules', 'vite'))) {
  console.error(`
[kurd-drop] Missing local deps at:
  ${depsRoot}

Run once:
  npm run deps:setup
`)
  process.exit(1)
}

// Keep deps package.json + vite config in sync with the project
try {
  fs.copyFileSync(projectPkg, path.join(depsRoot, 'package.json'))
} catch {
  /* ignore */
}
const projectViteLocal = path.join(projectRoot, 'vite.local.config.ts')
if (fs.existsSync(projectViteLocal)) {
  try {
    fs.copyFileSync(projectViteLocal, viteConfig)
  } catch {
    /* ignore */
  }
}

const npmArgs =
  mode === 'build'
    ? ['exec', '--', 'vite', 'build', '--config', viteConfig, ...extraArgs]
    : mode === 'preview'
      ? ['exec', '--', 'vite', 'preview', '--config', viteConfig, ...extraArgs]
      : ['exec', '--', 'vite', '--config', viteConfig, ...extraArgs]

const child = spawn('npm', ['--prefix', depsRoot, ...npmArgs], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    KD_PROJECT_ROOT: projectRoot,
    KD_DEPS_ROOT: depsRoot,
  },
})

child.on('exit', (code) => process.exit(code ?? 1))
