/**
 * Full-Body Realistic 3D Human Avatars — lightweight SVG standing figures for Leaflet markers.
 * Transparent background only; neon ground ring; male/female silhouettes; zoom-scaled markers.
 * No three.js: SVG/CSS only so dozens of markers stay cheap.
 *
 * Pose: static by default; walk / social motions via CSS classes from the map motion shop.
 */

import type { CosmeticDef } from './cosmetics'
import { USE_GLB_MAP_AVATARS, buildGlbMapAvatarHtml } from './glb/mapGlbAvatarSystem'

/** Set false to restore previous avatars (bust 3D / classic via useRealistic3DAvatar). */
export const USE_FULL_BODY_3D_AVATAR = true

/** Same flag — flip to false to instantly restore the previous avatar design. */
export const useFullBody3DAvatar = USE_FULL_BODY_3D_AVATAR

export type FullBodyAvatarGender = 'male' | 'female'

/** Idle / walk / scripted social motion class suffix (kd-fb3d--*). */
export type FullBodyMotion =
  | 'idle'
  | 'walk'
  | 'gentle'
  | 'static'
  | 'stand_breathe'
  | 'nervous'
  | 'kneel'
  | 'ring_pocket'
  | 'offer_ring'
  | 'shock'
  | 'kiss'
  | 'kiss_l'
  | 'kiss_r'
  | 'hug'
  | 'slap'
  | 'punch'
  | 'kick'
  | 'wave'
  | 'bow'
  | 'dance'
  | 'highfive'
  | 'laugh'
  | 'shy'
  | 'hug_recv'
  | 'recoil'
  | 'fall'
  | 'hold_leg'
  | 'propose'
  | 'dizzy'

/** Studio / persisted 3D look — also mirrored on public location presence. */
export type Avatar3DHairStyle = 'buzz' | 'short' | 'layered' | 'long'
export type Avatar3DViewMode = 'full' | 'head'

export interface Avatar3DCustomization {
  skinTone: number
  hairStyle: Avatar3DHairStyle
  hairColor: number
  eyeColor: string
  /** Hex primary outfit tint; empty = cosmetic / gender default. */
  outfitColor: string
}

export const DEFAULT_AVATAR_3D: Avatar3DCustomization = {
  skinTone: 1,
  hairStyle: 'short',
  hairColor: 0,
  eyeColor: '#1e293b',
  outfitColor: '',
}

export const AVATAR_3D_HAIR_STYLES: Avatar3DHairStyle[] = ['buzz', 'short', 'layered', 'long']

export const AVATAR_3D_EYE_COLORS: string[] = [
  '#1e293b',
  '#3b82f6',
  '#16a34a',
  '#92400e',
  '#0f766e',
  '#6b7280',
]

export const AVATAR_3D_OUTFIT_COLORS: string[] = [
  '#1e3a5f',
  '#9f1239',
  '#14532d',
  '#4c1d95',
  '#b45309',
  '#0f172a',
  '#0369a1',
  '#be123c',
]

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

export function avatar3dSignature(c?: Avatar3DCustomization | null): string {
  if (!c) return ''
  return `${c.skinTone}|${c.hairStyle}|${c.hairColor}|${c.eyeColor}|${c.outfitColor}`
}

function shadeHex(hex: string, factor: number): string {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map(ch => ch + ch).join('') : m.slice(0, 6)
  if (full.length !== 6) return hex
  const n = parseInt(full, 16)
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * factor)))
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * factor)))
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * factor)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Base marker layout at reference zoom — feet sit on the geographic ground point.
 * Taller than bust markers so full body + clothing read clearly.
 */
export const FULL_BODY_MARKER_WIDTH = 48
export const FULL_BODY_MARKER_HEIGHT = 92
/** iconAnchor Y so soles rest on LatLng (level badge sits just under feet). */
export const FULL_BODY_ICON_ANCHOR_Y = 86

/** Reference map zoom where scale = 1.0 */
export const FULL_BODY_ZOOM_REF = 14

/**
 * Zoom → scale factor.
 *   zoom 12 → ~0.72, 14 → 1.00, 16 → 1.16, 18 → 1.32
 * Clamped so zoom-out stays readable and zoom-in stays stylish without clutter.
 */
export function fullBodyScaleForZoom(zoom: number): number {
  const z = Number.isFinite(zoom) ? zoom : FULL_BODY_ZOOM_REF
  return Math.min(1.35, Math.max(0.65, 0.72 + (z - 12) * 0.08))
}

export function fullBodyMarkerMetrics(zoom: number): {
  scale: number
  width: number
  height: number
  iconAnchorY: number
} {
  const scale = fullBodyScaleForZoom(zoom)
  return {
    scale,
    width: Math.round(FULL_BODY_MARKER_WIDTH * scale),
    height: Math.round(FULL_BODY_MARKER_HEIGHT * scale),
    iconAnchorY: Math.round(FULL_BODY_ICON_ANCHOR_Y * scale),
  }
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
    primary: '#1e3a5f',
    secondary: '#0f172a',
    accent: '#38bdf8',
    trim: '#64748b',
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

export const SKIN_PALETTE: SkinTone[] = [
  { base: '#c68642', light: '#e0ac69', shadow: '#8d5524', blush: '#d4a574' },
  { base: '#d4a574', light: '#f1c27d', shadow: '#a67c52', blush: '#e8b989' },
  { base: '#8d5524', light: '#c68642', shadow: '#5c3317', blush: '#a67c52' },
  { base: '#e0ac69', light: '#f5d0a9', shadow: '#c68642', blush: '#e8b989' },
  { base: '#b97a57', light: '#d4a574', shadow: '#7a4a2e', blush: '#c9956e' },
]

export const HAIR_PALETTE: HairTone[] = [
  { base: '#1c1917', highlight: '#44403c', shadow: '#0c0a09' },
  { base: '#292524', highlight: '#57534e', shadow: '#0c0a09' },
  { base: '#44403c', highlight: '#78716c', shadow: '#1c1917' },
  { base: '#78350f', highlight: '#a16207', shadow: '#451a03' },
  { base: '#0f172a', highlight: '#334155', shadow: '#020617' },
]

export function normalizeAvatar3d(raw: unknown): Avatar3DCustomization {
  const d = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const hairStyle = AVATAR_3D_HAIR_STYLES.includes(d.hairStyle as Avatar3DHairStyle)
    ? (d.hairStyle as Avatar3DHairStyle)
    : DEFAULT_AVATAR_3D.hairStyle
  const eyeRaw = typeof d.eyeColor === 'string' ? d.eyeColor.trim() : ''
  const eyeColor = /^#[0-9a-fA-F]{3,8}$/.test(eyeRaw) ? eyeRaw : DEFAULT_AVATAR_3D.eyeColor
  const outfitRaw = typeof d.outfitColor === 'string' ? d.outfitColor.trim() : ''
  const outfitColor = /^#[0-9a-fA-F]{3,8}$/.test(outfitRaw) ? outfitRaw : ''
  const skinToneNum = Math.floor(Number(d.skinTone))
  const hairColorNum = Math.floor(Number(d.hairColor))
  const skinTone = Number.isFinite(skinToneNum)
    ? Math.max(0, Math.min(SKIN_PALETTE.length - 1, skinToneNum))
    : DEFAULT_AVATAR_3D.skinTone
  const hairColor = Number.isFinite(hairColorNum)
    ? Math.max(0, Math.min(HAIR_PALETTE.length - 1, hairColorNum))
    : DEFAULT_AVATAR_3D.hairColor
  return { skinTone, hairStyle, hairColor, eyeColor, outfitColor }
}

let fbSeq = 0
function nextFbId(prefix: string): string {
  fbSeq += 1
  return `kd-fb3d-${prefix}-${fbSeq}`
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
  gender?: FullBodyAvatarGender | null
  skin?: CosmeticDef | null
}): FullBodyAvatarGender {
  if (opts.gender === 'female' || opts.gender === 'male') return opts.gender
  if (opts.skin?.wearGender === 'female') return 'female'
  if (opts.skin?.wearGender === 'male') return 'male'
  return 'male'
}

function resolveOutfit(skin?: CosmeticDef | null, gender: FullBodyAvatarGender = 'male'): OutfitPalette {
  if (skin?.skinClass && OUTFIT_BY_SKIN_CLASS[skin.skinClass]) {
    return OUTFIT_BY_SKIN_CLASS[skin.skinClass]
  }
  if (skin?.skinGradient) {
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

function maleHairSvg(
  style: Avatar3DHairStyle,
  ids: { hairG: string },
  hair: HairTone,
): { back: string; front: string } {
  if (style === 'buzz') {
    return {
      back: `<path fill="url(#${ids.hairG})" d="M38 30 C36.5 20, 42 12, 50 11.5 C58 12, 63.5 20, 62 30
        C59 24, 55 21, 50 21 C45 21, 41 24, 38 30 Z"/>`,
      front: `<path fill="${hair.base}" d="M39 26 C44 16, 48 14, 50 14 C52 14, 56 16, 61 26
        C57 21, 53.5 19, 50 19 C46.5 19, 43 21, 39 26 Z"/>
        <ellipse cx="50" cy="16.5" rx="8" ry="3.2" fill="${hair.highlight}" opacity="0.28"/>`,
    }
  }
  if (style === 'long') {
    return {
      back: `<path fill="url(#${ids.hairG})" d="M35 33 C31 19, 40 7, 50 6 C60 7, 69 19, 65 33
        C68 52, 67 74, 63 86 C58 72, 58 50, 56 38 C54 25, 52 19, 50 19 C48 19, 46 25, 44 38
        C42 50, 42 72, 37 86 C33 74, 32 52, 35 33 Z"/>`,
      front: `<path fill="${hair.base}" d="M37 26 C43 13, 48 11, 50 11 C52 11, 57 13, 63 26
        C59 20, 54 16, 50 16 C46 16, 41 20, 37 26 Z"/>
        <path fill="${hair.highlight}" opacity="0.4" d="M41 18 C46 15, 50 14.5, 55 17 C50 18.5, 45 19, 41 18 Z"/>`,
    }
  }
  if (style === 'layered') {
    return {
      back: `<path fill="url(#${ids.hairG})" d="M36 33 C33.5 18, 42 7, 50 6 C58 7, 66.5 18, 64 33
        C61.5 25, 56 19.5, 50 19.5 C44 19.5, 38.5 25, 36 33 Z"/>
        <path fill="${hair.shadow}" opacity="0.4" d="M37 30 C36 21, 42 14, 50 13 C48 18, 42 24, 38 30 Z"/>`,
      front: `<path fill="${hair.base}" d="M37 28 C42.5 15, 47.5 12, 50 12 C52.5 12, 57.5 15, 63 28
        C58.5 21, 54.5 17.5, 50 17.5 C45.5 17.5, 41.5 21, 37 28 Z"/>
        <path fill="${hair.highlight}" opacity="0.45" d="M41 19 C46 16, 50 15.2, 55 18.5 C50 20, 45 20.5, 41 19 Z"/>
        <path fill="${hair.shadow}" opacity="0.3" d="M39 24 C42 19, 46 17, 48 17.5 C45 20, 42 23, 39 24 Z"/>`,
    }
  }
  // short (default)
  return {
    back: `<path fill="url(#${ids.hairG})" d="M36.5 33 C34 18.5, 42 7.5, 50 6.5 C58 7.5, 66 18.5, 63.5 33
      C61.5 26, 56.5 20.5, 50 20.5 C43.5 20.5, 38.5 26, 36.5 33 Z"/>
      <path fill="${hair.shadow}" opacity="0.45" d="M37 30 C36 22, 42 14, 50 13 C48 18, 42 24, 38 30 Z"/>`,
    front: `<path fill="${hair.base}" d="M37.5 27.5 C42.5 15.5, 47.5 12.5, 50 12.5 C52.5 12.5, 57.5 15.5, 62.5 27.5
      C58.5 21, 54.5 18.2, 50 18.2 C45.5 18.2, 41.5 21, 37.5 27.5 Z"/>
      <path fill="${hair.highlight}" opacity="0.42" d="M41.5 19.5 C46 16.5, 50 15.8, 54.5 18.8 C50 20, 45.5 20.5, 41.5 19.5 Z"/>
      <path fill="${hair.shadow}" opacity="0.35" d="M39 24 C42 19, 46 17, 48 17.5 C45 20, 42 23, 39 24 Z"/>
      <ellipse cx="43.5" cy="18.5" rx="5.2" ry="3.6" fill="#ffffff" opacity="0.1"/>`,
  }
}

function femaleHairSvg(
  style: Avatar3DHairStyle,
  ids: { hairG: string },
  hair: HairTone,
): { back: string; front: string } {
  if (style === 'buzz' || style === 'short') {
    return {
      back: `<path fill="url(#${ids.hairG})" d="M36.5 32 C34 19, 42 8, 50 7 C58 8, 66 19, 63.5 32
        C61 25, 56 20, 50 20 C44 20, 39 25, 36.5 32 Z"/>`,
      front: `<path fill="${hair.base}" d="M37.5 25.5 C43 13.5, 48 11.5, 50 11.5 C52 11.5, 57 13.5, 62.5 25.5
        C58.5 19.5, 54 16, 50 16 C46 16, 41.5 19.5, 37.5 25.5 Z"/>
        <path fill="${hair.highlight}" opacity="0.4" d="M41 18 C46 15, 50 14.5, 55 17 C50 18.5, 45 19, 41 18 Z"/>`,
    }
  }
  if (style === 'layered') {
    return {
      back: `<path fill="url(#${ids.hairG})" d="M34.5 33 C30.5 19, 40 7, 50 6 C60 7, 69.5 19, 65.5 33
        C68 48, 67 62, 63 72 C58.5 60, 58 46, 56 36 C54 24, 52 19, 50 19 C48 19, 46 24, 44 36
        C42 46, 41.5 60, 37 72 C33 62, 32 48, 34.5 33 Z"/>`,
      front: `<path fill="${hair.base}" d="M36.5 25.5 C42.5 12.5, 47.5 10.5, 50 10.5 C52.5 10.5, 57.5 12.5, 63.5 25.5
        C59.5 19, 54.5 15.5, 50 15.5 C45.5 15.5, 40.5 19, 36.5 25.5 Z"/>
        <path fill="${hair.highlight}" opacity="0.42" d="M40.5 18 C46 14.5, 50 13.5, 55.5 17 C50 18.5, 45 19.2, 40.5 18 Z"/>`,
    }
  }
  // long (default female)
  return {
    back: `<path fill="url(#${ids.hairG})" d="M34.5 33 C30 18.5, 39.5 6.5, 50 5.5 C60.5 6.5, 70 18.5, 65.5 33
      C69 54, 68 76, 63.5 88 C58.5 73, 58 51, 56 38.5
      C54 24.5, 52 18.5, 50 18.5 C48 18.5, 46 24.5, 44 38.5
      C42 51, 41.5 73, 36.5 88 C32 76, 31 54, 34.5 33 Z"/>
      <path fill="${hair.shadow}" opacity="0.35" d="M35.5 40 C34 55, 35 72, 38 86 C36 72, 35 55, 36.5 40 Z"/>
      <path fill="${hair.highlight}" opacity="0.22" d="M58 36 C60 52, 61 70, 59 84 C62 70, 62 52, 60 36 Z"/>`,
    front: `<path fill="${hair.base}" d="M36.5 25.5 C42.5 12.5, 47.5 10.5, 50 10.5 C52.5 10.5, 57.5 12.5, 63.5 25.5
      C59.5 19, 54.5 15.5, 50 15.5 C45.5 15.5, 40.5 19, 36.5 25.5 Z"/>
      <path fill="${hair.highlight}" opacity="0.42" d="M40.5 18 C46 14.5, 50 13.5, 55.5 17 C50 18.5, 45 19.2, 40.5 18 Z"/>
      <path fill="${hair.shadow}" opacity="0.3" d="M38 23 C41 17.5, 45 15, 47.5 15.5 C44.5 18.5, 41 22, 38 23 Z"/>
      <path fill="none" stroke="${hair.highlight}" stroke-width="0.7" opacity="0.45"
        d="M42 16.5 Q46 15 49 16.8"/>
      <ellipse cx="43.5" cy="17.5" rx="4.8" ry="3.2" fill="#ffffff" opacity="0.1"/>`,
  }
}

/**
 * Male: broad shoulders, structured jacket + trousers, short layered hair.
 * Natural contrapposto standing pose — static (no limb swing / bob).
 */
function buildMaleFigure(
  ids: {
    skinG: string
    hairG: string
    clothG: string
    pantG: string
    shoeG: string
    bodyShade: string
  },
  outfit: OutfitPalette,
  skin: SkinTone,
  hair: HairTone,
  eyeColor: string,
  hairStyle: Avatar3DHairStyle,
): string {
  const hairParts = maleHairSvg(hairStyle, ids, hair)
  return `
    <!-- soft body contact shadow (feet only — not a plate) -->
    <ellipse cx="50" cy="148" rx="18" ry="3.2" fill="#000000" opacity="0.22"/>

    <!-- left arm — relaxed at side, slight forward bend -->
    <g class="kd-fb3d-arm-l">
      <path fill="url(#${ids.skinG})" d="M35.5 54 C27 62, 22.5 78, 21.5 96 C20.8 100.5, 25.5 103, 28.5 100.5
        C31.5 86, 34 70, 39.5 58 Z"/>
      <ellipse cx="25" cy="100.5" rx="4.2" ry="3.4" fill="${skin.base}"/>
      <ellipse cx="24.2" cy="99.8" rx="1.4" ry="1.1" fill="${skin.light}" opacity="0.35"/>
    </g>
    <!-- right arm — slight outward rest -->
    <g class="kd-fb3d-arm-r">
      <path fill="url(#${ids.skinG})" d="M64.5 54 C73 62, 77.5 78, 78.5 96 C79.2 100.5, 74.5 103, 71.5 100.5
        C68.5 86, 66 70, 60.5 58 Z"/>
      <ellipse cx="75" cy="100.5" rx="4.2" ry="3.4" fill="${skin.base}"/>
      <ellipse cx="74.2" cy="99.8" rx="1.4" ry="1.1" fill="${skin.light}" opacity="0.35"/>
    </g>

    <!-- legs — weight on right, left soft bend -->
    <g class="kd-fb3d-leg-l">
      <path fill="url(#${ids.pantG})" d="M38.5 79 L32.5 132 L45.5 133 L48.5 79 Z"/>
      <path fill="${outfit.secondary}" opacity="0.28" d="M40 82 L35 130 L38.5 130.5 L46 82 Z"/>
      <path fill="url(#${ids.shoeG})" d="M29.5 132.5 L47 133.5 L48.5 144 L28.5 143.5 Z"/>
      <path fill="#0f172a" opacity="0.45" d="M30 140 L47.5 141 L48 144 L29 143.5 Z"/>
    </g>
    <g class="kd-fb3d-leg-r">
      <path fill="url(#${ids.pantG})" d="M51.5 79 L54 133 L67 132.5 L62 79 Z"/>
      <path fill="${outfit.secondary}" opacity="0.22" d="M54 82 L56.5 130 L60 129.5 L59 82 Z"/>
      <path fill="url(#${ids.shoeG})" d="M52.5 133 L70.5 132.5 L71.5 143.5 L51.5 144 Z"/>
      <path fill="#0f172a" opacity="0.45" d="M53 140.5 L70.5 140 L71 143.5 L52 144 Z"/>
    </g>

    <!-- hips / belt -->
    <ellipse cx="50" cy="81" rx="14.5" ry="5.8" fill="${outfit.secondary}"/>
    <rect x="36" y="78.5" width="28" height="3.2" rx="1" fill="${outfit.trim}" opacity="0.85"/>
    <rect x="47.5" y="78" width="5" height="4.2" rx="0.8" fill="${outfit.accent}" opacity="0.9"/>

    <!-- jacket torso — broad shoulders, fold seams -->
    <path fill="url(#${ids.clothG})" d="M32.5 50 C39 41.5, 61 41.5, 67.5 50 L69.5 79.5 C63 86.5, 37 86.5, 30.5 79.5 Z"/>
    <path fill="${outfit.trim}" opacity="0.8" d="M34.5 50.5 L65.5 50.5 L63.5 56 L36.5 56 Z"/>
    <path fill="none" stroke="${outfit.secondary}" stroke-width="1.1" opacity="0.55"
      d="M40 56 C42 68, 42 76, 41 80"/>
    <path fill="none" stroke="${outfit.secondary}" stroke-width="1.1" opacity="0.55"
      d="M60 56 C58 68, 58 76, 59 80"/>
    <rect x="47" y="54" width="6" height="22" rx="1.2" fill="${outfit.accent}" opacity="0.92"/>
    <path fill="${outfit.secondary}" opacity="0.38" d="M32.5 50 L39.5 79 L30.5 79.5 Z"/>
    <path fill="${outfit.secondary}" opacity="0.32" d="M67.5 50 L60.5 79 L69.5 79.5 Z"/>
    <!-- lapel folds -->
    <path fill="${outfit.accent}" opacity="0.18" d="M44 54 L48 76 L46 76 L42 56 Z"/>
    <path fill="#ffffff" opacity="0.08" d="M38 52 C44 48, 52 48, 58 51 L56 58 C50 55, 44 55, 40 58 Z"/>

    <!-- neck -->
    <path fill="url(#${ids.skinG})" d="M44.5 40.5 C46.5 36.8, 53.5 36.8, 55.5 40.5 L54.2 53.5 C52 56.5, 48 56.5, 45.8 53.5 Z"/>
    <ellipse cx="50" cy="48" rx="3.2" ry="2" fill="${skin.shadow}" opacity="0.18"/>

    <g class="kd-fb3d-head" style="transform-origin:50px 40px;transform-box:view-box;">
    <!-- hair back / sides -->
    ${hairParts.back}

    <!-- head — stronger jaw, cheek planes -->
    <ellipse cx="50" cy="27.5" rx="12.4" ry="13.6" fill="url(#${ids.skinG})"/>
    <ellipse cx="37.6" cy="29.5" rx="2.35" ry="3.4" fill="${skin.base}"/>
    <ellipse cx="62.4" cy="29.5" rx="2.35" ry="3.4" fill="${skin.base}"/>
    <ellipse cx="37.6" cy="29.8" rx="1.1" ry="1.8" fill="${skin.shadow}" opacity="0.35"/>
    <ellipse cx="62.4" cy="29.8" rx="1.1" ry="1.8" fill="${skin.shadow}" opacity="0.35"/>
    <!-- cheek / temple shading -->
    <ellipse cx="50" cy="33" rx="8.2" ry="6.8" fill="${skin.blush}" opacity="0.16"/>
    <path fill="${skin.shadow}" opacity="0.12" d="M40 34 C42 40, 45 42, 50 42 C55 42, 58 40, 60 34
      C58 38, 54 40, 50 40 C46 40, 42 38, 40 34 Z"/>
    <!-- brow ridge -->
    <path d="M41.5 22.8 Q46.5 20.6 49.4 22.4" fill="none" stroke="${hair.shadow}" stroke-width="1.35" stroke-linecap="round" opacity="0.85"/>
    <path d="M50.6 22.4 Q53.5 20.6 58.5 22.8" fill="none" stroke="${hair.shadow}" stroke-width="1.35" stroke-linecap="round" opacity="0.85"/>
    <!-- eyes -->
    <ellipse cx="45" cy="27.6" rx="2.35" ry="1.75" fill="#f8fafc"/>
    <ellipse cx="55" cy="27.6" rx="2.35" ry="1.75" fill="#f8fafc"/>
    <ellipse cx="45.35" cy="27.85" rx="1.15" ry="1.2" fill="${eyeColor}"/>
    <ellipse cx="55.35" cy="27.85" rx="1.15" ry="1.2" fill="${eyeColor}"/>
    <circle cx="44.7" cy="27.15" r="0.4" fill="#ffffff" opacity="0.95"/>
    <circle cx="54.7" cy="27.15" r="0.4" fill="#ffffff" opacity="0.95"/>
    <path d="M42.8 25.6 Q45 25.1 47.2 25.7" fill="none" stroke="${hair.base}" stroke-width="0.7" opacity="0.35"/>
    <path d="M52.8 25.7 Q55 25.1 57.2 25.6" fill="none" stroke="${hair.base}" stroke-width="0.7" opacity="0.35"/>
    <!-- nose -->
    <path d="M50 28.6 L48.4 33.8 Q50 35.4 51.6 33.8 Z" fill="${skin.shadow}" opacity="0.38"/>
    <path d="M49.2 33.4 Q50 34.4 50.8 33.4" fill="none" stroke="${skin.shadow}" stroke-width="0.65" opacity="0.4"/>
    <!-- mouth / jaw -->
    <path d="M45.6 36.8 Q50 39 54.4 36.8" fill="none" stroke="#7c4a32" stroke-width="1.1" stroke-linecap="round" opacity="0.88"/>
    <path fill="${skin.shadow}" opacity="0.1" d="M42 38 C46 42, 54 42, 58 38 C55 41, 45 41, 42 38 Z"/>

    <!-- hair front / crown -->
    ${hairParts.front}
    </g>

    <!-- soft figure shade (body only) -->
    <ellipse cx="58" cy="90" rx="10" ry="28" fill="url(#${ids.bodyShade})" opacity="0.35"/>
  `
}

/**
 * Female: narrower shoulders, fitted silhouette / dress option, longer layered hair.
 * Natural standing pose — static (no limb swing / bob).
 */
function buildFemaleFigure(
  ids: {
    skinG: string
    hairG: string
    clothG: string
    pantG: string
    shoeG: string
    bodyShade: string
  },
  outfit: OutfitPalette,
  skin: SkinTone,
  hair: HairTone,
  dressSkin: boolean,
  eyeColor: string,
  hairStyle: Avatar3DHairStyle,
): string {
  const hairParts = femaleHairSvg(hairStyle, ids, hair)
  const lowerBody = dressSkin
    ? `<path fill="url(#${ids.clothG})" d="M38.5 72.5 C42 70, 58 70, 61.5 72.5 L68 121 C61.5 130, 38.5 130, 32 121 Z"/>
       <path fill="${outfit.accent}" opacity="0.2" d="M36.5 94 L63.5 94 L66 121 C60.5 127, 39.5 127, 34 121 Z"/>
       <path fill="none" stroke="${outfit.secondary}" stroke-width="0.9" opacity="0.4"
         d="M42 78 C44 96, 43 112, 41 120"/>
       <path fill="none" stroke="${outfit.secondary}" stroke-width="0.9" opacity="0.35"
         d="M58 78 C56 96, 57 112, 59 120"/>
       <path fill="#ffffff" opacity="0.07" d="M44 74 C50 72, 56 73, 60 76 L58 90 C54 86, 48 86, 44 90 Z"/>`
    : `<!-- fitted pants -->
       <g class="kd-fb3d-leg-l">
         <path fill="url(#${ids.pantG})" d="M40.5 77 L36 131 L45.5 131.5 L48.5 77 Z"/>
         <path fill="${outfit.secondary}" opacity="0.25" d="M42 80 L38 128 L40.5 128.5 L46.5 80 Z"/>
         <path fill="url(#${ids.shoeG})" d="M33.5 131.5 L47.5 132 L48.5 142 L32.5 141.5 Z"/>
       </g>
       <g class="kd-fb3d-leg-r">
         <path fill="url(#${ids.pantG})" d="M51.5 77 L54.5 131.5 L63.5 131 L59.5 77 Z"/>
         <path fill="${outfit.secondary}" opacity="0.2" d="M54 80 L56.5 128 L59 127.5 L57.5 80 Z"/>
         <path fill="url(#${ids.shoeG})" d="M52.5 131.5 L66.5 131 L67.5 141.5 L51.5 142 Z"/>
       </g>
       <ellipse cx="50" cy="79.5" rx="11.8" ry="5.2" fill="${outfit.secondary}"/>
       <path fill="${outfit.trim}" opacity="0.7" d="M39 77.5 L61 77.5 L60 80.5 L40 80.5 Z"/>`

  const dressLegs = dressSkin
    ? `<!-- ankles under dress -->
       <g class="kd-fb3d-leg-l">
         <path fill="url(#${ids.skinG})" d="M41.5 117 L39.5 133.5 L46 134 L47 117 Z"/>
         <path fill="url(#${ids.shoeG})" d="M36.5 133.5 L48 134 L49 142 L35.5 141.5 Z"/>
       </g>
       <g class="kd-fb3d-leg-r">
         <path fill="url(#${ids.skinG})" d="M53 117 L54.5 134 L60.5 133.5 L58 117 Z"/>
         <path fill="url(#${ids.shoeG})" d="M52 134 L63.5 133.5 L64.5 141.5 L51 142 Z"/>
       </g>`
    : ''

  return `
    <!-- soft body contact shadow (feet only — not a plate) -->
    <ellipse cx="50" cy="147.5" rx="16" ry="2.9" fill="#000000" opacity="0.2"/>

    <!-- left arm — slimmer, graceful rest -->
    <g class="kd-fb3d-arm-l">
      <path fill="url(#${ids.skinG})" d="M37.5 52 C30.5 61, 26.5 78, 25.5 95 C24.8 98.5, 29 100.5, 31.5 98
        C34.5 84, 36.5 67, 40.5 56 Z"/>
      <ellipse cx="28" cy="97.5" rx="3.5" ry="2.9" fill="${skin.base}"/>
      <ellipse cx="27.3" cy="96.8" rx="1.1" ry="0.9" fill="${skin.light}" opacity="0.4"/>
    </g>
    <!-- right arm -->
    <g class="kd-fb3d-arm-r">
      <path fill="url(#${ids.skinG})" d="M62.5 52 C69.5 61, 73.5 78, 74.5 95 C75.2 98.5, 71 100.5, 68.5 98
        C65.5 84, 63.5 67, 59.5 56 Z"/>
      <ellipse cx="72" cy="97.5" rx="3.5" ry="2.9" fill="${skin.base}"/>
      <ellipse cx="71.3" cy="96.8" rx="1.1" ry="0.9" fill="${skin.light}" opacity="0.4"/>
    </g>

    ${dressLegs}
    ${lowerBody}

    <!-- fitted top / blouse — hourglass waist, soft shoulders -->
    <path fill="url(#${ids.clothG})" d="M37.5 48.5 C42.5 42, 57.5 42, 62.5 48.5 L63.8 75.5 C59.5 82.5, 40.5 82.5, 36.2 75.5 Z"/>
    <path fill="${outfit.trim}" opacity="0.88" d="M39.5 48.8 C45.5 44.2, 54.5 44.2, 60.5 48.8 L58.5 54.5 C54 51.2, 46 51.2, 41.5 54.5 Z"/>
    <ellipse cx="50" cy="63" rx="7.2" ry="4.2" fill="${outfit.accent}" opacity="0.28"/>
    <path fill="#ffffff" opacity="0.1" d="M42 50 C48 46.5, 54 46.5, 58 50 L56 58 C52 55, 48 55, 44 58 Z"/>
    <path fill="${outfit.secondary}" opacity="0.28" d="M37.5 48.5 L41 75 L36.2 75.5 Z"/>
    <path fill="${outfit.secondary}" opacity="0.24" d="M62.5 48.5 L59 75 L63.8 75.5 Z"/>

    <!-- neck -->
    <path fill="url(#${ids.skinG})" d="M45.5 38.5 C47 35.5, 53 35.5, 54.5 38.5 L53.5 51.5 C51.8 54.2, 48.2 54.2, 46.5 51.5 Z"/>
    <ellipse cx="50" cy="46" rx="2.6" ry="1.6" fill="${skin.shadow}" opacity="0.14"/>

    <g class="kd-fb3d-head" style="transform-origin:50px 38px;transform-box:view-box;">
    <!-- hair back -->
    ${hairParts.back}

    <!-- head — softer oval, refined features -->
    <ellipse cx="50" cy="26.5" rx="11.2" ry="14.1" fill="url(#${ids.skinG})"/>
    <ellipse cx="38.8" cy="28.5" rx="2" ry="3" fill="${skin.base}"/>
    <ellipse cx="61.2" cy="28.5" rx="2" ry="3" fill="${skin.base}"/>
    <ellipse cx="38.8" cy="28.8" rx="0.95" ry="1.6" fill="${skin.shadow}" opacity="0.3"/>
    <ellipse cx="61.2" cy="28.8" rx="0.95" ry="1.6" fill="${skin.shadow}" opacity="0.3"/>
    <ellipse cx="50" cy="31.5" rx="7.6" ry="6.8" fill="${skin.blush}" opacity="0.22"/>
    <ellipse cx="43.5" cy="32" rx="2.8" ry="2.2" fill="${skin.blush}" opacity="0.18"/>
    <ellipse cx="56.5" cy="32" rx="2.8" ry="2.2" fill="${skin.blush}" opacity="0.18"/>
    <!-- brows -->
    <path d="M42.5 22.2 Q47 20.2 49.4 21.8" fill="none" stroke="${hair.shadow}" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
    <path d="M50.6 21.8 Q53 20.2 57.5 22.2" fill="none" stroke="${hair.shadow}" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
    <!-- eyes -->
    <ellipse cx="45.1" cy="26.8" rx="2.2" ry="1.7" fill="#f8fafc"/>
    <ellipse cx="54.9" cy="26.8" rx="2.2" ry="1.7" fill="#f8fafc"/>
    <ellipse cx="45.4" cy="27.05" rx="1.05" ry="1.15" fill="${eyeColor}"/>
    <ellipse cx="55.2" cy="27.05" rx="1.05" ry="1.15" fill="${eyeColor}"/>
    <circle cx="44.85" cy="26.25" r="0.38" fill="#ffffff" opacity="0.95"/>
    <circle cx="54.65" cy="26.25" r="0.38" fill="#ffffff" opacity="0.95"/>
    <path d="M43 25 Q45.1 24.4 47.2 25.1" fill="none" stroke="${hair.base}" stroke-width="0.65" opacity="0.3"/>
    <path d="M52.8 25.1 Q54.9 24.4 57 25" fill="none" stroke="${hair.base}" stroke-width="0.65" opacity="0.3"/>
    <!-- nose -->
    <path d="M50 27.8 L48.8 32.6 Q50 34 51.2 32.6 Z" fill="${skin.shadow}" opacity="0.32"/>
    <path d="M49.3 32.2 Q50 33.1 50.7 32.2" fill="none" stroke="${skin.shadow}" stroke-width="0.55" opacity="0.35"/>
    <!-- lips -->
    <path d="M46.2 35.5 Q50 38.2 53.8 35.5" fill="none" stroke="#b45309" stroke-width="1.2" stroke-linecap="round" opacity="0.88"/>
    <path d="M46.8 35.35 Q50 37.4 53.2 35.35" fill="#e11d48" opacity="0.32"/>
    <path d="M47.5 35.6 Q50 36.8 52.5 35.6" fill="#fda4af" opacity="0.35"/>

    <!-- hair front / bangs -->
    ${hairParts.front}
    </g>

    <!-- soft figure shade (body only) -->
    <ellipse cx="57" cy="88" rx="9" ry="26" fill="url(#${ids.bodyShade})" opacity="0.32"/>
  `
}

function resolveLook(opts: {
  avatarUrl?: string
  skin?: CosmeticDef | null
  gender?: FullBodyAvatarGender | null
  seed?: string
  avatar3d?: Avatar3DCustomization | null
}): {
  gender: FullBodyAvatarGender
  outfit: OutfitPalette
  skin: SkinTone
  hair: HairTone
  eyeColor: string
  hairStyle: Avatar3DHairStyle
} {
  const gender = resolveGender(opts)
  const custom = normalizeAvatar3d(opts.avatar3d ?? DEFAULT_AVATAR_3D)
  let outfit = resolveOutfit(opts.skin, gender)
  if (custom.outfitColor) {
    outfit = {
      primary: custom.outfitColor,
      secondary: shadeHex(custom.outfitColor, 0.45),
      accent: shadeHex(custom.outfitColor, 1.25),
      trim: shadeHex(custom.outfitColor, 0.75),
    }
  }
  const seed = opts.seed || opts.avatarUrl || `${gender}-${opts.skin?.id ?? 'default'}`
  const h = hashSeed(seed)
  const skin =
    opts.avatar3d != null
      ? SKIN_PALETTE[custom.skinTone] ?? SKIN_PALETTE[DEFAULT_AVATAR_3D.skinTone]
      : SKIN_PALETTE[h % SKIN_PALETTE.length]
  const hair =
    opts.avatar3d != null
      ? HAIR_PALETTE[custom.hairColor] ?? HAIR_PALETTE[DEFAULT_AVATAR_3D.hairColor]
      : HAIR_PALETTE[(h >>> 8) % HAIR_PALETTE.length]
  const hairStyle =
    opts.avatar3d != null
      ? custom.hairStyle
      : gender === 'female'
        ? 'long'
        : 'short'
  const eyeColor = opts.avatar3d != null ? custom.eyeColor : DEFAULT_AVATAR_3D.eyeColor
  return { gender, outfit, skin, hair, eyeColor, hairStyle }
}

function renderFullBodySvgCore(opts: {
  avatarUrl?: string
  skin?: CosmeticDef | null
  border?: CosmeticDef | null
  gender?: FullBodyAvatarGender | null
  seed?: string
  avatar3d?: Avatar3DCustomization | null
  viewMode?: Avatar3DViewMode
  showRing?: boolean
}): { svgInner: string; gender: FullBodyAvatarGender } {
  const look = resolveLook(opts)
  const viewMode: Avatar3DViewMode = opts.viewMode === 'head' ? 'head' : 'full'
  void opts.showRing
  void opts.border

  const gid = nextFbId('g')
  const skinG = `${gid}-skin`
  const hairG = `${gid}-hair`
  const clothG = `${gid}-cloth`
  const pantG = `${gid}-pant`
  const shoeG = `${gid}-shoe`
  const bodyShade = `${gid}-shade`

  const isFemale = look.gender === 'female'
  const dressSkin =
    opts.skin?.skinClass === 'kd-skin-silk-dress' ||
    opts.skin?.skinClass === 'kd-skin-medes-robe'

  const ids = { skinG, hairG, clothG, pantG, shoeG, bodyShade }
  const figure = isFemale
    ? buildFemaleFigure(ids, look.outfit, look.skin, look.hair, dressSkin, look.eyeColor, look.hairStyle)
    : buildMaleFigure(ids, look.outfit, look.skin, look.hair, look.eyeColor, look.hairStyle)

  // head close-up frames face; full view shows standing figure (no ground neon ring)
  const viewBox = viewMode === 'head' ? '28 2 44 48' : '0 0 100 160'
  const preserve = viewMode === 'head' ? 'xMidYMid meet' : 'xMidYMax meet'

  const svgInner = `<svg class="kd-fb3d-svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="${preserve}" aria-hidden="true" style="background:transparent;overflow:visible;">
    <defs>
      <radialGradient id="${skinG}" cx="36%" cy="28%" r="68%">
        <stop offset="0%" stop-color="${look.skin.light}"/>
        <stop offset="48%" stop-color="${look.skin.base}"/>
        <stop offset="100%" stop-color="${look.skin.shadow}"/>
      </radialGradient>
      <linearGradient id="${hairG}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${look.hair.highlight}"/>
        <stop offset="40%" stop-color="${look.hair.base}"/>
        <stop offset="100%" stop-color="${look.hair.shadow}"/>
      </linearGradient>
      <linearGradient id="${clothG}" x1="0.18" y1="0" x2="0.82" y2="1">
        <stop offset="0%" stop-color="${look.outfit.accent}" stop-opacity="0.5"/>
        <stop offset="32%" stop-color="${look.outfit.primary}"/>
        <stop offset="100%" stop-color="${look.outfit.secondary}"/>
      </linearGradient>
      <linearGradient id="${pantG}" x1="0.28" y1="0" x2="0.72" y2="1">
        <stop offset="0%" stop-color="${look.outfit.primary}"/>
        <stop offset="55%" stop-color="${look.outfit.secondary}"/>
        <stop offset="100%" stop-color="${look.outfit.secondary}"/>
      </linearGradient>
      <linearGradient id="${shoeG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#475569"/>
        <stop offset="55%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <radialGradient id="${bodyShade}" cx="30%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="70%" stop-color="#000000" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.28"/>
      </radialGradient>
    </defs>

    <g class="kd-fb3d-figure" style="transform-origin:50px 150px;transform-box:view-box;">
      ${figure}
    </g>
  </svg>`

  return { svgInner, gender: look.gender }
}

function resolveFullBodyMotionClass(opts: {
  isMoving?: boolean | null
  motion?: FullBodyMotion | string | null
}): string {
  const raw = typeof opts.motion === 'string' ? opts.motion.trim() : ''
  if (raw && raw !== 'static' && raw !== 'idle' && raw !== 'gentle') {
    return `kd-fb3d--${raw}`
  }
  if (opts.isMoving) return 'kd-fb3d--walk'
  // مرۆڤئاسا: هەمیشە هەناسە لە idle (نەک static وەک پەیکەر)
  if (raw === 'gentle') return 'kd-fb3d--gentle'
  if (raw === 'static') return 'kd-fb3d--stand_breathe'
  return 'kd-fb3d--stand_breathe'
}

/**
 * Full-body standing figure (head→feet). Transparent SVG — no ground neon ring.
 * Supports walk + social motion CSS classes from the map motion shop.
 */
export function buildFullBody3DHumanHtml(opts: {
  avatarUrl?: string
  skin?: CosmeticDef | null
  border?: CosmeticDef | null
  sizePx?: number
  gender?: FullBodyAvatarGender | null
  seed?: string
  isMoving?: boolean | null
  /** Explicit pose: walk / kiss / punch / … */
  motion?: FullBodyMotion | string | null
  avatar3d?: Avatar3DCustomization | null
  /** Studio smart-camera: head close-up vs full body (CSS/SVG framing). */
  viewMode?: Avatar3DViewMode
}): string {
  // Map markers: Mixamo GLB/GLTF characters (male/female)
  if (USE_GLB_MAP_AVATARS && opts.viewMode !== 'head') {
    return buildGlbMapAvatarHtml({
      sizePx: opts.sizePx,
      gender: opts.gender,
      isMoving: opts.isMoving,
      motion: opts.motion,
    })
  }

  const width = opts.sizePx ?? FULL_BODY_MARKER_WIDTH
  const height = Math.round(width * (FULL_BODY_MARKER_HEIGHT / FULL_BODY_MARKER_WIDTH))
  const viewMode: Avatar3DViewMode = opts.viewMode === 'head' ? 'head' : 'full'
  const boxH = viewMode === 'head' ? width : height
  const { svgInner, gender } = renderFullBodySvgCore({
    ...opts,
    viewMode,
    showRing: false,
  })
  const motionClass = resolveFullBodyMotionClass(opts)

  return `<div class="kd-fb3d-avatar ${motionClass} kd-fb3d--${gender} kd-fb3d--view-${viewMode}" style="width:${width}px;height:${boxH}px;position:relative;overflow:visible;pointer-events:auto;background:transparent;transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);">
  ${svgInner}
</div>`
}

/**
 * Circular head-shot crop for header / chat chrome — never full-body.
 */
export function buildHeadShotAvatarHtml(opts: {
  avatarUrl?: string
  skin?: CosmeticDef | null
  border?: CosmeticDef | null
  sizePx?: number
  gender?: FullBodyAvatarGender | null
  seed?: string
  avatar3d?: Avatar3DCustomization | null
}): string {
  const size = opts.sizePx ?? 40
  const { svgInner, gender } = renderFullBodySvgCore({
    ...opts,
    viewMode: 'head',
    showRing: false,
  })
  return `<div class="kd-fb3d-headshot kd-fb3d--${gender}" style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;position:relative;flex-shrink:0;pointer-events:none;background:radial-gradient(circle at 35% 30%,#1e293b,#0b1220);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.08);">
  <div style="width:100%;height:100%;transform:scale(1.08);transform-origin:50% 42%;">
    ${svgInner}
  </div>
</div>`
}
