/**
 * Three.js character preview — loads male/female GLB/GLTF and loops idle.
 */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Gender } from '../services/userService'
import { resolveCharacterModelUrl } from '../glb/characterAssets'

export { resolveCharacterModelUrl }

type Props = {
  gender: Gender
  width?: number
  height?: number
  className?: string
}

function pickIdleClip(clips: THREE.AnimationClip[]): THREE.AnimationClip | null {
  if (!clips.length) return null
  const withTracks = clips.filter((c) => c.tracks.length > 0)
  const pool = withTracks.length ? withTracks : clips
  const idle =
    pool.find((c) => /idle/i.test(c.name)) ||
    pool.find((c) => /mixamo/i.test(c.name)) ||
    pool[0]
  return idle ?? null
}

function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  offset = 1.35,
) {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.001)
  const fov = (camera.fov * Math.PI) / 180
  let dist = (maxDim / (2 * Math.tan(fov / 2))) * offset
  dist = Math.max(dist, maxDim * 1.1)
  camera.position.set(center.x, center.y + size.y * 0.05, center.z + dist)
  camera.near = Math.max(0.01, dist / 100)
  camera.far = dist * 100
  camera.lookAt(center.x, center.y, center.z)
  camera.updateProjectionMatrix()
}

export function GlbCharacterViewer({
  gender,
  width = 220,
  height = 280,
  className,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let raf = 0
    let mixer: THREE.AnimationMixer | null = null
    let root: THREE.Group | null = null

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b1220)

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
    camera.position.set(0, 1.2, 3)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.innerHTML = ''
    host.appendChild(renderer.domElement)

    const hemi = new THREE.HemisphereLight(0xffffff, 0x334155, 1.15)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xfff4e6, 1.35)
    key.position.set(2.5, 4, 3)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xa5b4fc, 0.45)
    fill.position.set(-2, 1.5, -1)
    scene.add(fill)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 48),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.1,
        roughness: 0.85,
      }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    scene.add(ground)

    const clock = new THREE.Clock()
    const animate = () => {
      if (disposed) return
      raf = requestAnimationFrame(animate)
      const dt = clock.getDelta()
      mixer?.update(dt)
      if (root) root.rotation.y += dt * 0.25
      renderer.render(scene, camera)
    }
    animate()

    setStatus('loading')
    setErrorMsg(null)
    const loader = new GLTFLoader()

    void resolveCharacterModelUrl(gender === 'female' ? 'female' : 'male').then((url) => {
      if (disposed) return
      loader.load(
        url,
        (gltf) => {
          if (disposed) return
          root = gltf.scene
          root.traverse((obj) => {
            const mesh = obj as THREE.Mesh
            if (mesh.isMesh) {
              mesh.castShadow = false
              mesh.receiveShadow = false
              if (mesh.material) {
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                for (const m of mats) {
                  const std = m as THREE.MeshStandardMaterial
                  if (std.map) std.map.colorSpace = THREE.SRGBColorSpace
                }
              }
            }
          })

          // Place feet on ground
          const box = new THREE.Box3().setFromObject(root)
          const size = box.getSize(new THREE.Vector3())
          const scale = 1.7 / Math.max(size.y, 0.001)
          root.scale.setScalar(scale)
          box.setFromObject(root)
          root.position.y -= box.min.y
          ground.position.y = 0

          scene.add(root)
          fitCameraToObject(camera, root, 1.45)

          const clip = pickIdleClip(gltf.animations || [])
          if (clip) {
            mixer = new THREE.AnimationMixer(root)
            const action = mixer.clipAction(clip)
            action.reset()
            action.setLoop(THREE.LoopRepeat, Infinity)
            action.clampWhenFinished = false
            action.play()
          }
          setStatus('ready')
        },
        undefined,
        (err) => {
          if (disposed) return
          console.error('[GlbCharacterViewer]', err)
          setStatus('error')
          setErrorMsg('نەتوانرا مۆدێل باربکرێت')
        },
      )
    })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      mixer?.stopAllAction()
      mixer = null
      if (root) {
        scene.remove(root)
        root.traverse((obj) => {
          const mesh = obj as THREE.Mesh
          if (mesh.isMesh) {
            mesh.geometry?.dispose?.()
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            for (const m of mats) m?.dispose?.()
          }
        })
      }
      renderer.dispose()
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement)
      }
    }
  }, [gender, width, height])

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width,
        height,
        margin: '0 auto',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(251,191,36,0.35)',
        background: 'radial-gradient(circle at 50% 20%, #1e293b, #0b1220 70%)',
      }}
    >
      <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
      {status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#fbbf24',
            fontSize: 12,
            fontWeight: 800,
            background: 'rgba(8,12,22,0.45)',
            pointerEvents: 'none',
          }}
        >
          بارکردنی کارەکتەر…
        </div>
      )}
      {status === 'error' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#f87171',
            fontSize: 11,
            fontWeight: 800,
            padding: 12,
            textAlign: 'center',
            background: 'rgba(8,12,22,0.65)',
          }}
        >
          {errorMsg || 'هەڵە'}
        </div>
      )}
    </div>
  )
}
