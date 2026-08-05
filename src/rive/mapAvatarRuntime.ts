/**
 * Map avatar runtime — SVG skeletal poses (Rive-ready API).
 * Pose names match motionTimelines / FullBodyMotion CSS classes (kd-fb3d--*).
 *
 * True Rive (.riv) loading is optional: drop assets in public/rive/ and
 * set USE_RIVE_MAP_AVATAR + install @rive-app/canvas when ready.
 * Currently SVG-only so the app never hard-depends on a broken node_module.
 */

export const USE_RIVE_MAP_AVATAR = false

export const RIVE_ASSET_MALE = '/rive/map-avatar-male.riv'
export const RIVE_ASSET_FEMALE = '/rive/map-avatar-female.riv'
export const RIVE_STATE_MACHINE = 'AvatarSM'
export const RIVE_POSE_INPUT = 'pose'

export type AvatarPoseName = string

const GENDER_VIEW_KEEP = /kd-fb3d--(male|female|view-\w+)/

export function findAvatarRoot(markerEl: HTMLElement | null | undefined): HTMLElement | null {
  if (!markerEl) return null
  return markerEl.querySelector('.kd-fb3d-avatar') as HTMLElement | null
}

/** گۆڕینی پۆز بەبێ ڕیبڵدی تەواوی ئاڤاتار (بۆ تایملاین) */
export function patchAvatarPoseClass(
  markerEl: HTMLElement | null | undefined,
  pose: AvatarPoseName,
): boolean {
  const root =
    findAvatarRoot(markerEl) ||
    (markerEl?.classList?.contains('kd-fb3d-avatar') ? markerEl : null)
  if (!root) return false

  // GLB map avatar — update pose attribute + remount animation
  if (root.classList.contains('kd-glb-avatar')) {
    root.dataset.pose = String(pose)
    root.setAttribute('data-glb-pose', String(pose))
    const gender = root.getAttribute('data-glb-gender') === 'female' ? 'female' : 'male'
    void import('../glb/mapGlbAvatarSystem').then((m) => {
      void m.mountMapGlbAvatar(root, gender, String(pose))
    })
    return true
  }

  const kept: string[] = ['kd-fb3d-avatar']
  for (const c of root.classList) {
    if (GENDER_VIEW_KEEP.test(c) && !kept.includes(c)) kept.push(c)
  }
  kept.push(`kd-fb3d--${pose}`)
  root.className = kept.join(' ')
  root.dataset.pose = String(pose)
  const withRing = pose === 'ring_pocket' || pose === 'offer_ring'
  root.classList.toggle('kd-fb3d-has-prop-ring', withRing)
  return true
}

export function patchMarkerAvatarPose(
  marker: { getElement?: () => HTMLElement | null } | null | undefined,
  pose: AvatarPoseName,
): boolean {
  if (!marker?.getElement) return false
  try {
    return patchAvatarPoseClass(marker.getElement(), pose)
  } catch {
    return false
  }
}

export type MapRiveHandle = {
  setPose: (pose: string) => void
  destroy: () => void
  mode: 'rive' | 'svg'
}

/** SVG pose host — Rive canvas can be wired later without breaking the map. */
export async function mountMapRiveAvatar(opts: {
  container: HTMLElement
  gender: 'male' | 'female'
  width: number
  height: number
}): Promise<MapRiveHandle> {
  void opts.gender
  void opts.width
  void opts.height
  return {
    mode: 'svg',
    setPose: (pose) => {
      patchAvatarPoseClass(opts.container, pose)
    },
    destroy: () => {},
  }
}

export async function probeRiveAssets(): Promise<boolean> {
  return false
}

export function areRiveAssetsAvailableSync(): boolean {
  return false
}
