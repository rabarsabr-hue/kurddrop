/**
 * Shared Three.js system for Leaflet map avatars (GLB/GLTF).
 * One WebGL renderer → blit to each marker's 2D canvas (avoids context limits).
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import {
  resolveCharacterModelUrl,
  type CharacterGender,
} from './characterAssets'

export const USE_GLB_MAP_AVATARS = true

type Template = {
  scene: THREE.Group
  animations: THREE.AnimationClip[]
}

type Instance = {
  el: HTMLElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  gender: CharacterGender
  pose: string
  root: THREE.Object3D
  mixer: THREE.AnimationMixer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  groundY: number
}

const loader = new GLTFLoader()
/** Keyed by model URL — male/female یەکجار بار دەبن */
const templatesByUrl = new Map<string, Promise<Template>>()
const instances = new Map<HTMLElement, Instance>()

let renderer: THREE.WebGLRenderer | null = null
let raf = 0
let running = false
const clock = new THREE.Clock()

function getRenderer(): THREE.WebGLRenderer {
  if (renderer) return renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  })
  renderer.setPixelRatio(1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)
  return renderer
}

function pickClip(clips: THREE.AnimationClip[], pose: string): THREE.AnimationClip | null {
  const withTracks = clips.filter((c) => c.tracks.length > 0)
  const pool = withTracks.length ? withTracks : clips
  if (!pool.length) return null
  const p = pose.toLowerCase()
  if (p === 'walk' || p === 'run') {
    return (
      pool.find((c) => /walk|run|locomotion/i.test(c.name)) ||
      pool.find((c) => /mixamo/i.test(c.name)) ||
      pool[0]!
    )
  }
  return (
    pool.find((c) => /idle/i.test(c.name)) ||
    pool.find((c) => /mixamo/i.test(c.name)) ||
    pool[0]!
  )
}

function loadTemplate(gender: CharacterGender): Promise<Template> {
  return resolveCharacterModelUrl(gender).then((url) => {
    const existing = templatesByUrl.get(url)
    if (existing) return existing
    const p = new Promise<Template>((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          resolve({ scene: gltf.scene, animations: gltf.animations || [] })
        },
        undefined,
        (err) => reject(err),
      )
    })
    templatesByUrl.set(url, p)
    return p
  })
}

/** پێشبارکردنی نێر+مێ بە هاوکات — دەرکەوتنی خێرا لەسەر نەخشە */
export function preloadCharacterTemplates(): Promise<void> {
  return Promise.all([loadTemplate('male'), loadTemplate('female')]).then(() => undefined)
}

export function areCharacterTemplatesReady(): boolean {
  return templatesByUrl.size >= 1
}

function fitCamera(camera: THREE.PerspectiveCamera, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.001)
  const fov = (camera.fov * Math.PI) / 180
  const dist = Math.max((maxDim / (2 * Math.tan(fov / 2))) * 1.4, maxDim * 1.15)
  camera.position.set(center.x, center.y + size.y * 0.02, center.z + dist)
  camera.near = Math.max(0.05, dist / 80)
  camera.far = dist * 40
  camera.lookAt(center.x, center.y * 0.95, center.z)
  camera.updateProjectionMatrix()
}

function ensureLights(scene: THREE.Scene) {
  if (scene.getObjectByName('kd-hemi')) return
  const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 1.1)
  hemi.name = 'kd-hemi'
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff1e0, 1.2)
  key.name = 'kd-key'
  key.position.set(2, 4, 3)
  scene.add(key)
}

async function createInstance(
  el: HTMLElement,
  gender: CharacterGender,
  pose: string,
): Promise<Instance | null> {
  const canvas = el.querySelector('canvas.kd-glb-canvas') as HTMLCanvasElement | null
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const tpl = await loadTemplate(gender)
  const root = cloneSkinned(tpl.scene) as THREE.Object3D
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.isMesh) {
      mesh.frustumCulled = false
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const m of mats) {
          const std = m as THREE.MeshStandardMaterial
          if (std.map) std.map.colorSpace = THREE.SRGBColorSpace
        }
      }
    }
  })

  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  const scale = 1.65 / Math.max(size.y, 0.001)
  root.scale.setScalar(scale)
  box.setFromObject(root)
  root.position.y -= box.min.y
  // روو بە شاشەی مۆبایل / کامێرا
  root.rotation.y = 0

  const scene = new THREE.Scene()
  ensureLights(scene)
  scene.add(root)

  const camera = new THREE.PerspectiveCamera(32, canvas.width / Math.max(1, canvas.height), 0.1, 100)
  fitCamera(camera, root)

  const mixer = new THREE.AnimationMixer(root)
  const clip = pickClip(tpl.animations, pose)
  if (clip) {
    const action = mixer.clipAction(clip)
    action.reset()
    action.setLoop(THREE.LoopRepeat, Infinity)
    action.play()
  }

  return {
    el,
    canvas,
    ctx,
    gender,
    pose,
    root,
    mixer,
    scene,
    camera,
    groundY: 0,
  }
}

function disposeInstance(inst: Instance) {
  inst.mixer.stopAllAction()
  inst.scene.remove(inst.root)
  inst.root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.isMesh) {
      mesh.geometry?.dispose?.()
    }
  })
}

function tick() {
  if (!running) return
  raf = requestAnimationFrame(tick)
  const dt = Math.min(0.05, clock.getDelta())
  const r = getRenderer()

  for (const inst of instances.values()) {
    if (!inst.el.isConnected) continue
    inst.mixer.update(dt)
    // روو هەمیشە بەرەو شاشە — بێ خولانەوە
    inst.root.rotation.y = 0

    const w = inst.canvas.width
    const h = inst.canvas.height
    if (w < 2 || h < 2) continue
    r.setSize(w, h, false)
    inst.camera.aspect = w / h
    inst.camera.updateProjectionMatrix()
    r.render(inst.scene, inst.camera)
    inst.ctx.clearRect(0, 0, w, h)
    inst.ctx.drawImage(r.domElement, 0, 0)
  }
}

function startLoop() {
  if (running) return
  running = true
  clock.start()
  raf = requestAnimationFrame(tick)
}

function stopLoopIfEmpty() {
  if (instances.size > 0) return
  running = false
  cancelAnimationFrame(raf)
}

export async function mountMapGlbAvatar(
  el: HTMLElement,
  gender: CharacterGender,
  pose = 'idle',
): Promise<void> {
  const g = gender === 'female' ? 'female' : 'male'
  const existing = instances.get(el)
  if (existing && existing.gender === g) {
    if (existing.pose !== pose) {
      existing.pose = pose
      existing.mixer.stopAllAction()
      const tpl = await loadTemplate(g)
      const clip = pickClip(tpl.animations, pose)
      if (clip) {
        const action = existing.mixer.clipAction(clip)
        action.reset()
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
      }
    }
    return
  }
  if (existing) {
    disposeInstance(existing)
    instances.delete(el)
  }
  try {
    const inst = await createInstance(el, g, pose)
    if (!inst || !el.isConnected) {
      if (inst) disposeInstance(inst)
      return
    }
    instances.set(el, inst)
    startLoop()
  } catch (err) {
    console.error('[mapGlbAvatar] mount failed', g, err)
  }
}

export function unmountMapGlbAvatar(el: HTMLElement) {
  const inst = instances.get(el)
  if (!inst) return
  disposeInstance(inst)
  instances.delete(el)
  stopLoopIfEmpty()
}

/** Scan DOM for .kd-glb-avatar slots and mount/update them. */
export function syncMapGlbAvatars(root: ParentNode = document): void {
  if (!USE_GLB_MAP_AVATARS) return
  const live = new Set<HTMLElement>()
  root.querySelectorAll('.kd-glb-avatar').forEach((node) => {
    const el = node as HTMLElement
    live.add(el)
    const gender = (el.getAttribute('data-glb-gender') === 'female' ? 'female' : 'male') as CharacterGender
    const pose = el.getAttribute('data-glb-pose') || 'idle'
    void mountMapGlbAvatar(el, gender, pose)
  })
  for (const el of [...instances.keys()]) {
    if (!live.has(el) || !el.isConnected) unmountMapGlbAvatar(el)
  }
}

export function buildGlbMapAvatarHtml(opts: {
  sizePx?: number
  gender?: string | null
  isMoving?: boolean | null
  motion?: string | null
}): string {
  const width = opts.sizePx ?? 48
  const height = Math.round(width * (92 / 48))
  const gender = opts.gender === 'female' ? 'female' : 'male'
  const raw = typeof opts.motion === 'string' ? opts.motion.trim() : ''
  const pose =
    opts.isMoving || raw === 'walk'
      ? 'walk'
      : raw && raw !== 'static' && raw !== 'idle' && raw !== 'gentle' && raw !== 'stand_breathe'
        ? raw
        : 'idle'
  const cw = Math.max(64, width * 2)
  const ch = Math.max(120, height * 2)
  // تەنها canvasی کارەکتەر — بێ silhouette / وێنەی تر
  return `<div class="kd-fb3d-avatar kd-glb-avatar kd-fb3d--${gender} kd-fb3d--view-full" data-glb-gender="${gender}" data-glb-pose="${pose}" data-pose="${pose}" style="width:${width}px;height:${height}px;position:relative;overflow:visible;pointer-events:auto;background:transparent;">
  <canvas class="kd-glb-canvas" width="${cw}" height="${ch}" style="position:relative;z-index:1;width:100%;height:100%;display:block;pointer-events:none;background:transparent;"></canvas>
</div>`
}
