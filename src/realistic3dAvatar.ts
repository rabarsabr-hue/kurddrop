/**
 * Realistic 3D Human Avatar — lightweight SVG bust for Leaflet markers.
 * No three.js: works for dozens of markers without heavy per-marker WebGL.
 *
 * Full-body static standing figures live in fullBody3dAvatar.ts; this module keeps
 * the bust path and the map-marker switcher (full-body → bust → classic).
 * Full-body pose is static; movement systems will come later from the shop.
 */
import { buildAvatarInnerHtml, type CosmeticDef } from './cosmetics'
import {
  USE_FULL_BODY_3D_AVATAR,
  useFullBody3DAvatar,
  buildFullBody3DHumanHtml,
  buildHeadShotAvatarHtml,
  type Avatar3DCustomization,
  type Avatar3DViewMode,
} from './fullBody3dAvatar'

export {
  USE_FULL_BODY_3D_AVATAR,
  useFullBody3DAvatar,
  buildFullBody3DHumanHtml,
  buildHeadShotAvatarHtml,
}

export type { Avatar3DCustomization, Avatar3DViewMode }

/** Toggle false to restore classic avatars (when full-body is also off). */
export const USE_REALISTIC_3D_AVATAR = true

/** Same flag — flip to false to instantly restore the previous avatar design. */
export const useRealistic3DAvatar = USE_REALISTIC_3D_AVATAR

export type AvatarGender = 'male' | 'female'

interface OutfitPalette {
  primary: string
  secondary: string
  accent: string
  trim: string
}

interface SkinTone {
  base: string
  light: string
  shadow: string
  blush: string
}

interface HairTone {
  base: string
  highlight: string
  shadow: string
}

const OUTFIT_BY_SKIN_CLASS: Record<string, OutfitPalette> = {
  'kd-skin-chokha': {
    primary: '#5c4033',
    secondary: '#2a1810',
    accent: '#c9a227',
    trim: '#8b6914',
  },
  'kd-skin-babylon': {
    primary: '#b45309',
    secondary: '#3d2314',
    accent: '#fde68a',
    trim: '#d4a017',
  },
  'kd-skin-hunter': {
    primary: '#3f6212',
    secondary: '#14532d',
    accent: '#a3e635',
    trim: '#713f12',
  },
  'kd-skin-mir': {
    primary: '#4c1d95',
    secondary: '#1e1b4b',
    accent: '#c4b5fd',
    trim: '#7c3aed',
  },
  'kd-skin-silk-dress': {
    primary: '#9f1239',
    secondary: '#4c0519',
    accent: '#fbbf24',
    trim: '#fb7185',
  },
  'kd-skin-kawe': {
    primary: '#ea580c',
    secondary: '#1c1917',
    accent: '#fbbf24',
    trim: '#9a3412',
  },
  'kd-skin-assyrian': {
    primary: '#64748b',
    secondary: '#0f172a',
    accent: '#e2e8f0',
    trim: '#94a3b8',
  },
  'kd-skin-medes-robe': {
    primary: '#6d28d9',
    secondary: '#1e1b4b',
    accent: '#a78bfa',
    trim: '#c4b5fd',
  },
}

const DEFAULT_MALE_OUTFIT: OutfitPalette = {
  primary: '#1e3a5f',
  secondary: '#0f172a',
  accent: '#38bdf8',
  trim: '#0284c7',
}

const DEFAULT_FEMALE_OUTFIT: OutfitPalette = {
  primary: '#9f1239',
  secondary: '#4c0519',
  accent: '#f9a8d4',
  trim: '#fb7185',
}

const SKIN_PALETTE: SkinTone[] = [
  { base: '#c68642', light: '#e0ac69', shadow: '#8d5524', blush: '#d4a574' },
  { base: '#d4a574', light: '#f1c27d', shadow: '#a67c52', blush: '#e8b989' },
  { base: '#8d5524', light: '#c68642', shadow: '#5c3317', blush: '#a67c52' },
  { base: '#e0ac69', light: '#f5d0a9', shadow: '#c68642', blush: '#e8b989' },
  { base: '#b97a57', light: '#d4a574', shadow: '#7a4a2e', blush: '#c9956e' },
]

const HAIR_PALETTE: HairTone[] = [
  { base: '#1c1917', highlight: '#44403c', shadow: '#0c0a09' },
  { base: '#292524', highlight: '#57534e', shadow: '#0c0a09' },
  { base: '#44403c', highlight: '#78716c', shadow: '#1c1917' },
  { base: '#78350f', highlight: '#a16207', shadow: '#451a03' },
  { base: '#0f172a', highlight: '#334155', shadow: '#020617' },
]

let r3dSeq = 0
function nextR3dId(prefix: string): string {
  r3dSeq += 1
  return `kd-r3d-${prefix}-${r3dSeq}`
}

function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function resolveGender(opts: {
  gender?: AvatarGender | null
  skin?: CosmeticDef | null
}): AvatarGender {
  if (opts.gender === 'female' || opts.gender === 'male') return opts.gender
  if (opts.skin?.wearGender === 'female') return 'female'
  if (opts.skin?.wearGender === 'male') return 'male'
  return 'male'
}

function resolveOutfit(skin?: CosmeticDef | null, gender: AvatarGender = 'male'): OutfitPalette {
  if (skin?.skinClass && OUTFIT_BY_SKIN_CLASS[skin.skinClass]) {
    return OUTFIT_BY_SKIN_CLASS[skin.skinClass]
  }
  if (skin?.skinGradient) {
    // Approximate from gradient string — use accent-ish mid tone
    const m = skin.skinGradient.match(/#[0-9a-fA-F]{3,8}/g)
    if (m && m.length >= 2) {
      return {
        primary: m[0],
        secondary: m[1],
        accent: m[m.length - 1] ?? m[0],
        trim: m[Math.min(1, m.length - 1)],
      }
    }
  }
  return gender === 'female' ? DEFAULT_FEMALE_OUTFIT : DEFAULT_MALE_OUTFIT
}

/** Build a stylized realistic 3D human bust (SVG) sized for the neon circle. */
export function buildRealistic3DHumanHtml(opts: {
  avatarUrl?: string
  skin?: CosmeticDef | null
  sizePx?: number
  gender?: AvatarGender | null
  seed?: string
}): string {
  const size = opts.sizePx ?? 38
  const gender = resolveGender(opts)
  const outfit = resolveOutfit(opts.skin, gender)
  const seed = opts.seed || opts.avatarUrl || `${gender}-${opts.skin?.id ?? 'default'}`
  const h = hashSeed(seed)
  const skin = SKIN_PALETTE[h % SKIN_PALETTE.length]
  const hair = HAIR_PALETTE[(h >>> 8) % HAIR_PALETTE.length]

  const gid = nextR3dId('g')
  const skinG = `${gid}-skin`
  const hairG = `${gid}-hair`
  const clothG = `${gid}-cloth`
  const neckG = `${gid}-neck`
  const shineG = `${gid}-shine`
  const clipId = `${gid}-clip`

  const isFemale = gender === 'female'

  // Hair paths — keep fully inside circle (viewBox 0–100)
  const hairBack = isFemale
    ? `<path fill="url(#${hairG})" d="M22 42 C18 28, 28 14, 50 12 C72 14, 82 28, 78 42
         C80 58, 78 72, 74 78 C70 70, 72 54, 70 46
         C68 34, 58 26, 50 26 C42 26, 32 34, 30 46
         C28 54, 30 70, 26 78 C22 72, 20 58, 22 42 Z"/>`
    : `<path fill="url(#${hairG})" d="M26 40 C24 26, 34 14, 50 13 C66 14, 76 26, 74 40
         C72 34, 64 28, 50 28 C36 28, 28 34, 26 40 Z"/>`

  const hairFront = isFemale
    ? `<path fill="${hair.base}" opacity="0.95" d="M28 34 C34 24, 44 20, 50 20 C56 20, 66 24, 72 34
         C68 30, 60 26, 50 26 C40 26, 32 30, 28 34 Z"/>
       <path fill="${hair.highlight}" opacity="0.35" d="M34 28 C40 24, 48 22, 52 24 C46 26, 38 28, 34 28 Z"/>`
    : `<path fill="${hair.base}" d="M28 36 C34 26, 44 22, 50 22 C56 22, 66 26, 72 36
         C68 30, 60 27, 50 27 C40 27, 32 30, 28 36 Z"/>
       <path fill="${hair.highlight}" opacity="0.4" d="M36 28 C42 25, 50 24, 54 26 C48 27, 40 28, 36 28 Z"/>`

  const collar = isFemale
    ? `<path fill="${outfit.trim}" opacity="0.85" d="M34 78 C40 74, 60 74, 66 78 L62 84 C56 80, 44 80, 38 84 Z"/>`
    : `<path fill="${outfit.trim}" opacity="0.9" d="M36 76 C42 72, 58 72, 64 76 L60 82 C54 78, 46 78, 40 82 Z"/>
       <rect x="47" y="74" width="6" height="8" rx="1.2" fill="${outfit.accent}" opacity="0.9"/>`

  return `<div class="kd-r3d-avatar" style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;position:relative;background:#1a2233;box-shadow:inset 0 2px 6px rgba(255,255,255,0.12),inset 0 -6px 12px rgba(0,0,0,0.45);">
  <svg class="kd-r3d-svg" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <clipPath id="${clipId}"><circle cx="50" cy="50" r="50"/></clipPath>
      <radialGradient id="${skinG}" cx="38%" cy="32%" r="65%">
        <stop offset="0%" stop-color="${skin.light}"/>
        <stop offset="55%" stop-color="${skin.base}"/>
        <stop offset="100%" stop-color="${skin.shadow}"/>
      </radialGradient>
      <linearGradient id="${hairG}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${hair.highlight}"/>
        <stop offset="45%" stop-color="${hair.base}"/>
        <stop offset="100%" stop-color="${hair.shadow}"/>
      </linearGradient>
      <linearGradient id="${clothG}" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="${outfit.accent}" stop-opacity="0.55"/>
        <stop offset="35%" stop-color="${outfit.primary}"/>
        <stop offset="100%" stop-color="${outfit.secondary}"/>
      </linearGradient>
      <linearGradient id="${neckG}" x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stop-color="${skin.light}"/>
        <stop offset="100%" stop-color="${skin.shadow}"/>
      </linearGradient>
      <linearGradient id="${shineG}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
        <stop offset="40%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.22"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#${clipId})">
      <!-- ambient back plate -->
      <circle cx="50" cy="50" r="50" fill="#152033"/>
      <ellipse cx="50" cy="78" rx="42" ry="28" fill="url(#${clothG})"/>
      <!-- shoulders depth -->
      <ellipse cx="28" cy="88" rx="18" ry="14" fill="${outfit.secondary}" opacity="0.85"/>
      <ellipse cx="72" cy="88" rx="18" ry="14" fill="${outfit.secondary}" opacity="0.85"/>
      ${collar}
      <!-- neck -->
      <path fill="url(#${neckG})" d="M42 68 C44 62, 56 62, 58 68 L56 78 C53 80, 47 80, 44 78 Z"/>
      <!-- hair back (female) -->
      ${hairBack}
      <!-- head -->
      <ellipse cx="50" cy="46" rx="${isFemale ? 19 : 20}" ry="${isFemale ? 23 : 22}" fill="url(#${skinG})"/>
      <!-- ears -->
      <ellipse cx="30" cy="48" rx="3.2" ry="5" fill="${skin.base}"/>
      <ellipse cx="70" cy="48" rx="3.2" ry="5" fill="${skin.base}"/>
      <ellipse cx="30" cy="48" rx="1.6" ry="2.8" fill="${skin.shadow}" opacity="0.35"/>
      <ellipse cx="70" cy="48" rx="1.6" ry="2.8" fill="${skin.shadow}" opacity="0.35"/>
      <!-- face shading -->
      <ellipse cx="50" cy="52" rx="14" ry="12" fill="${skin.blush}" opacity="0.18"/>
      <!-- brows -->
      <path d="M38 42 Q44 39.5 48 41.5" fill="none" stroke="${hair.shadow}" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>
      <path d="M52 41.5 Q56 39.5 62 42" fill="none" stroke="${hair.shadow}" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>
      <!-- eyes -->
      <ellipse cx="43" cy="47" rx="3.1" ry="2.4" fill="#f8fafc"/>
      <ellipse cx="57" cy="47" rx="3.1" ry="2.4" fill="#f8fafc"/>
      <ellipse cx="43.4" cy="47.2" rx="1.55" ry="1.7" fill="#1e293b"/>
      <ellipse cx="57.4" cy="47.2" rx="1.55" ry="1.7" fill="#1e293b"/>
      <circle cx="42.7" cy="46.5" r="0.55" fill="#ffffff" opacity="0.9"/>
      <circle cx="56.7" cy="46.5" r="0.55" fill="#ffffff" opacity="0.9"/>
      <!-- nose -->
      <path d="M50 48 L48.2 54 Q50 55.5 51.8 54 Z" fill="${skin.shadow}" opacity="0.35"/>
      <path d="M49.2 53.2 Q50 54.2 50.8 53.2" fill="none" stroke="${skin.shadow}" stroke-width="0.7" opacity="0.45"/>
      <!-- mouth -->
      <path d="M45.5 58.5 Q50 61.2 54.5 58.5" fill="none" stroke="${isFemale ? '#b45309' : '#7c4a32'}" stroke-width="${isFemale ? 1.35 : 1.15}" stroke-linecap="round" opacity="0.85"/>
      ${isFemale ? `<path d="M46.2 58.3 Q50 60.2 53.8 58.3" fill="#e11d48" opacity="0.35"/>` : ''}
      <!-- hair front -->
      ${hairFront}
      <!-- 3D sheen overlay -->
      <ellipse cx="42" cy="36" rx="14" ry="10" fill="#ffffff" opacity="0.12"/>
      <rect x="0" y="0" width="100" height="100" fill="url(#${shineG})" style="mix-blend-mode:soft-light"/>
    </g>
  </svg>
</div>`
}

/**
 * Map-marker avatar inner HTML switcher:
 *   useFullBody3DAvatar === true  → full-body standing figure
 *   useFullBody3DAvatar === false → previous system (bust 3D if useRealistic3DAvatar, else classic)
 */
export function buildMapAvatarInnerHtml(opts: {
  avatarUrl: string
  skin?: CosmeticDef | null
  border?: CosmeticDef | null
  sizePx?: number
  gender?: AvatarGender | null
  seed?: string
  /** Ignored for full-body (static pose). Kept for API compatibility. */
  isMoving?: boolean | null
  avatar3d?: Avatar3DCustomization | null
  viewMode?: Avatar3DViewMode
}): string {
  // Set useFullBody3DAvatar false to restore previous avatars.
  if (USE_FULL_BODY_3D_AVATAR) {
    return buildFullBody3DHumanHtml(opts)
  }
  if (!USE_REALISTIC_3D_AVATAR) {
    return buildAvatarInnerHtml({
      avatarUrl: opts.avatarUrl,
      skin: opts.skin,
      sizePx: opts.sizePx,
    })
  }
  return buildRealistic3DHumanHtml(opts)
}

/** Head-only circular crop for header / chat lists (never full-body). */
export function buildUiHeadShotInnerHtml(opts: {
  avatarUrl?: string
  skin?: CosmeticDef | null
  border?: CosmeticDef | null
  sizePx?: number
  gender?: AvatarGender | null
  seed?: string
  avatar3d?: Avatar3DCustomization | null
}): string {
  if (USE_FULL_BODY_3D_AVATAR || USE_REALISTIC_3D_AVATAR) {
    return buildHeadShotAvatarHtml(opts)
  }
  const size = opts.sizePx ?? 40
  const url = opts.avatarUrl || ''
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;background:#081326;">
    <img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
  </div>`
}
