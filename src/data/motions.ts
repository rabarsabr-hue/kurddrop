/**
 * جووڵەکانی نەخشە — جێگەی بەخشینی دیارییەکان.
 * کارەکتەر دەڕوات بۆ ئامانج، جووڵەکە دەکات، دەگەڕێتەوە.
 * ئاسایی = زێڕ · ڕاقێ/جوان = ئەڵماس
 * Impact FX: stars / ring / hearts / dust / sparkle
 */

export type MotionId =
  // —— زێڕ (ئاسایی) ——
  | 'wave'
  | 'bow'
  | 'handshake'
  | 'highfive'
  | 'clap'
  | 'laugh'
  | 'salute'
  | 'jump'
  | 'slap'
  | 'punch'
  | 'kick'
  | 'push'
  // —— ئەڵماس (ڕاقێ / جوان) ——
  | 'kiss'
  | 'blow_kiss'
  | 'hug'
  | 'dance'
  | 'waltz'
  | 'heart_hands'
  | 'propose'
  | 'serenade'

export type MotionTier = 'basic' | 'mid' | 'vip'

/** کاریگەری سینەمایی لەسەر نێرەر/وەرگر */
export type MotionImpactFx =
  | 'none'
  | 'stars'
  | 'ring'
  | 'hearts'
  | 'cheek_kiss'
  | 'dust'
  | 'sparkle'
  | 'notes'
  | 'clap_burst'

export type MotionDef = {
  id: MotionId
  label: string
  emoji: string
  goldPrice: number
  diamondPrice: number
  tier: MotionTier
  actMs: number
  /** جۆری FX لە کاتی پەیکەر / جووڵە */
  impactFx: MotionImpactFx
  /** کاتی پەیکەر لە ناو act (٠–١) */
  hitAt: number
  /** نزیکبوونەوە لە ئامانج (٠–١)؛ ماچ/باوەش نزیکترن */
  approachT?: number
}

function buildPriceLadder(start: number, count: number): number[] {
  const out: number[] = []
  let price = Math.max(1, Math.round(start))
  for (let i = 0; i < count; i++) {
    out.push(price)
    const pct = 18 + i * 4
    price = Math.max(price + 1, Math.round(price * (1 + pct / 100)))
  }
  return out
}

const GOLD_PRICES = buildPriceLadder(35, 12)
const DIAMOND_PRICES = buildPriceLadder(25, 8)

export const MOTION_WALK_TO_MS = 2_200
export const MOTION_WALK_BACK_MS = 2_200
export const MOTION_APPROACH_T = 0.965
/** ماچ / باوەش — تقریباً لەسەر هەمان خاڵ */
export const MOTION_APPROACH_INTIMATE_T = 0.998

/** پۆزی CSSی نێرەر */
export type MotionVisualPose =
  | 'wave'
  | 'bow'
  | 'highfive'
  | 'laugh'
  | 'dance'
  | 'slap'
  | 'punch'
  | 'kick'
  | 'kiss'
  | 'kiss_l'
  | 'kiss_r'
  | 'hug'
  | 'propose'

/** لای لارکردنەوە بۆ ماچ (بەپێی ئاراستەی ئامانج) */
export type MotionLeanSide = 'l' | 'r'

export function resolveKissVisualPose(leanSide: MotionLeanSide): MotionVisualPose {
  return leanSide === 'l' ? 'kiss_l' : 'kiss_r'
}

export function getMotionApproachT(item: MotionDef): number {
  if (typeof item.approachT === 'number') return item.approachT
  return MOTION_APPROACH_T
}

export const MOTION_VISUAL_POSE: Record<MotionId, MotionVisualPose> = {
  wave: 'wave',
  bow: 'bow',
  handshake: 'highfive',
  highfive: 'highfive',
  clap: 'highfive',
  laugh: 'laugh',
  salute: 'wave',
  jump: 'dance',
  slap: 'slap',
  punch: 'punch',
  kick: 'kick',
  push: 'punch',
  kiss: 'kiss',
  blow_kiss: 'kiss',
  hug: 'hug',
  dance: 'dance',
  waltz: 'dance',
  heart_hands: 'highfive',
  propose: 'propose',
  serenade: 'dance',
}

export type MotionReactionId =
  | 'shy'
  | 'hug_recv'
  | 'wave'
  | 'bow'
  | 'laugh'
  | 'highfive'
  | 'recoil'
  | 'fall'
  | 'hold_leg'
  | 'dance'
  | 'dizzy'
  | 'shock'
  | 'idle'

export const MOTION_REACTION: Record<MotionId, MotionReactionId> = {
  wave: 'wave',
  bow: 'bow',
  handshake: 'highfive',
  highfive: 'highfive',
  clap: 'laugh',
  laugh: 'laugh',
  salute: 'wave',
  jump: 'dance',
  slap: 'recoil',
  punch: 'dizzy',
  kick: 'hold_leg',
  push: 'recoil',
  kiss: 'shy',
  blow_kiss: 'shy',
  hug: 'hug_recv',
  dance: 'dance',
  waltz: 'dance',
  heart_hands: 'shy',
  propose: 'shy',
  serenade: 'shy',
}

/** Reaction id for timeline targetPose fallback — shock used mid-propose */
export const MOTION_REACTION_SHOCK = 'shock' as const

export const MOTION_ITEMS: MotionDef[] = [
  // ════ ١٢ جووڵەی زێڕ (ئاسایی) ════
  { id: 'wave', label: 'سڵاو', emoji: '👋', goldPrice: GOLD_PRICES[0]!, diamondPrice: 0, tier: 'basic', actMs: 2_000, impactFx: 'sparkle', hitAt: 0.35 },
  { id: 'bow', label: 'سڵاوی سەر', emoji: '🙇', goldPrice: GOLD_PRICES[1]!, diamondPrice: 0, tier: 'basic', actMs: 2_100, impactFx: 'none', hitAt: 0.4 },
  { id: 'handshake', label: 'دەست‌گرتن', emoji: '🤝', goldPrice: GOLD_PRICES[2]!, diamondPrice: 0, tier: 'basic', actMs: 2_000, impactFx: 'sparkle', hitAt: 0.45 },
  { id: 'highfive', label: 'دەستکێشان', emoji: '🙌', goldPrice: GOLD_PRICES[3]!, diamondPrice: 0, tier: 'basic', actMs: 2_000, impactFx: 'clap_burst', hitAt: 0.45 },
  { id: 'clap', label: 'چەپڵە', emoji: '👏', goldPrice: GOLD_PRICES[4]!, diamondPrice: 0, tier: 'basic', actMs: 2_100, impactFx: 'clap_burst', hitAt: 0.3 },
  { id: 'laugh', label: 'پێکەنین', emoji: '😂', goldPrice: GOLD_PRICES[5]!, diamondPrice: 0, tier: 'basic', actMs: 2_200, impactFx: 'sparkle', hitAt: 0.25 },
  { id: 'salute', label: 'سەلامی سەربازی', emoji: '🫡', goldPrice: GOLD_PRICES[6]!, diamondPrice: 0, tier: 'basic', actMs: 2_000, impactFx: 'none', hitAt: 0.35 },
  { id: 'jump', label: 'بازدانی', emoji: '🦘', goldPrice: GOLD_PRICES[7]!, diamondPrice: 0, tier: 'mid', actMs: 2_000, impactFx: 'dust', hitAt: 0.5 },
  { id: 'slap', label: 'شەق', emoji: '✋', goldPrice: GOLD_PRICES[8]!, diamondPrice: 0, tier: 'mid', actMs: 2_000, impactFx: 'stars', hitAt: 0.4 },
  { id: 'punch', label: 'مشت', emoji: '👊', goldPrice: GOLD_PRICES[9]!, diamondPrice: 0, tier: 'mid', actMs: 2_400, impactFx: 'stars', hitAt: 0.42 },
  { id: 'kick', label: 'تەقڵە', emoji: '🦵', goldPrice: GOLD_PRICES[10]!, diamondPrice: 0, tier: 'mid', actMs: 2_300, impactFx: 'dust', hitAt: 0.45 },
  { id: 'push', label: 'پاڵنان', emoji: '🫸', goldPrice: GOLD_PRICES[11]!, diamondPrice: 0, tier: 'mid', actMs: 2_000, impactFx: 'dust', hitAt: 0.4 },

  // ════ ٨ جووڵەی ئەڵماس (ڕاقێ / جوان) ════
  { id: 'kiss', label: 'ماچ', emoji: '😘', goldPrice: 0, diamondPrice: DIAMOND_PRICES[0]!, tier: 'vip', actMs: 2_600, impactFx: 'cheek_kiss', hitAt: 0.55, approachT: MOTION_APPROACH_INTIMATE_T },
  { id: 'blow_kiss', label: 'ماچی فڕێدراو', emoji: '💋', goldPrice: 0, diamondPrice: DIAMOND_PRICES[1]!, tier: 'vip', actMs: 2_100, impactFx: 'hearts', hitAt: 0.4 },
  { id: 'hug', label: 'باوەش', emoji: '🤗', goldPrice: 0, diamondPrice: DIAMOND_PRICES[2]!, tier: 'vip', actMs: 2_500, impactFx: 'hearts', hitAt: 0.45, approachT: MOTION_APPROACH_INTIMATE_T },
  { id: 'dance', label: 'سەما', emoji: '💃', goldPrice: 0, diamondPrice: DIAMOND_PRICES[3]!, tier: 'vip', actMs: 2_700, impactFx: 'sparkle', hitAt: 0.2 },
  { id: 'waltz', label: 'واڵس', emoji: '🕺', goldPrice: 0, diamondPrice: DIAMOND_PRICES[4]!, tier: 'vip', actMs: 2_900, impactFx: 'sparkle', hitAt: 0.3, approachT: 0.99 },
  { id: 'heart_hands', label: 'دڵ بە دەست', emoji: '🫶', goldPrice: 0, diamondPrice: DIAMOND_PRICES[5]!, tier: 'vip', actMs: 2_200, impactFx: 'hearts', hitAt: 0.4 },
  { id: 'propose', label: 'داوای هاوسەرگیری', emoji: '💍', goldPrice: 0, diamondPrice: DIAMOND_PRICES[6]!, tier: 'vip', actMs: 4_800, impactFx: 'ring', hitAt: 0.7, approachT: MOTION_APPROACH_INTIMATE_T },
  { id: 'serenade', label: 'گۆرانی خۆشەویستی', emoji: '🎵', goldPrice: 0, diamondPrice: DIAMOND_PRICES[7]!, tier: 'vip', actMs: 3_000, impactFx: 'notes', hitAt: 0.25 },
]

export const MOTION_BY_ID: Record<MotionId, MotionDef> = MOTION_ITEMS.reduce((acc, item) => {
  acc[item.id] = item
  return acc
}, {} as Record<MotionId, MotionDef>)

export function isMotionId(id: string): id is MotionId {
  return id in MOTION_BY_ID
}

export function canAffordMotion(
  wallet: { gold: number; diamond: number },
  item: MotionDef,
): boolean {
  if (item.goldPrice > 0 && wallet.gold < item.goldPrice) return false
  if (item.diamondPrice > 0 && wallet.diamond < item.diamondPrice) return false
  return item.goldPrice > 0 || item.diamondPrice > 0
}

export function formatMotionCostLabel(item: MotionDef): string {
  const parts: string[] = []
  if (item.goldPrice > 0) parts.push(`${item.goldPrice} 🪙`)
  if (item.diamondPrice > 0) parts.push(`${item.diamondPrice} 💎`)
  return parts.join(' + ') || '0'
}

export function motionValueScore(item: MotionDef): number {
  return item.goldPrice + item.diamondPrice * 100
}

/** HTMLی کاریگەری سینەمایی بۆ overlayی مارکەر */
export function buildMotionImpactHtml(
  fx: MotionImpactFx,
  role: 'sender' | 'target',
  opts?: { cheekSide?: MotionLeanSide },
): string {
  if (fx === 'none') return ''
  if (fx === 'stars') {
    return `<div class="kd-motion-impact kd-motion-impact--stars kd-motion-impact--${role}" aria-hidden="true">
      <span class="kd-mi-star kd-mi-s1">💫</span>
      <span class="kd-mi-star kd-mi-s2">⭐</span>
      <span class="kd-mi-star kd-mi-s3">✨</span>
      <span class="kd-mi-star kd-mi-s4">💫</span>
      <span class="kd-mi-flash"></span>
    </div>`
  }
  if (fx === 'ring') {
    if (role === 'sender') {
      return `<div class="kd-motion-impact kd-motion-impact--ring kd-motion-impact--${role}" aria-hidden="true">
        <span class="kd-mi-ring">💍</span>
        <span class="kd-mi-spark kd-mi-sp1">✨</span>
        <span class="kd-mi-spark kd-mi-sp2">✨</span>
        <span class="kd-mi-spark kd-mi-sp3">💎</span>
      </div>`
    }
    return `<div class="kd-motion-impact kd-motion-impact--hearts kd-motion-impact--${role}" aria-hidden="true">
      <span class="kd-mi-heart kd-mi-h1">💕</span>
      <span class="kd-mi-heart kd-mi-h2">✨</span>
    </div>`
  }
  if (fx === 'cheek_kiss') {
    const side = opts?.cheekSide === 'l' ? 'l' : 'r'
    if (role === 'sender') {
      return `<div class="kd-motion-impact kd-motion-impact--cheek-kiss kd-motion-impact--cheek-${side} kd-motion-impact--${role}" aria-hidden="true">
        <span class="kd-mi-kiss-pucker">💋</span>
      </div>`
    }
    return `<div class="kd-motion-impact kd-motion-impact--cheek-kiss kd-motion-impact--cheek-${side} kd-motion-impact--${role}" aria-hidden="true">
      <span class="kd-mi-cheek-blush"></span>
      <span class="kd-mi-lipstick">💋</span>
      <span class="kd-mi-heart kd-mi-h1">💕</span>
    </div>`
  }
  if (fx === 'hearts') {
    return `<div class="kd-motion-impact kd-motion-impact--hearts kd-motion-impact--${role}" aria-hidden="true">
      <span class="kd-mi-heart kd-mi-h1">💖</span>
      <span class="kd-mi-heart kd-mi-h2">💕</span>
      <span class="kd-mi-heart kd-mi-h3">💗</span>
    </div>`
  }
  if (fx === 'dust') {
    return `<div class="kd-motion-impact kd-motion-impact--dust kd-motion-impact--${role}" aria-hidden="true">
      <span class="kd-mi-dust kd-mi-d1"></span>
      <span class="kd-mi-dust kd-mi-d2"></span>
      <span class="kd-mi-dust kd-mi-d3"></span>
      <span class="kd-mi-flash kd-mi-flash--soft"></span>
    </div>`
  }
  if (fx === 'sparkle') {
    return `<div class="kd-motion-impact kd-motion-impact--sparkle kd-motion-impact--${role}" aria-hidden="true">
      <span class="kd-mi-spark kd-mi-sp1">✨</span>
      <span class="kd-mi-spark kd-mi-sp2">✨</span>
    </div>`
  }
  if (fx === 'notes') {
    return `<div class="kd-motion-impact kd-motion-impact--notes kd-motion-impact--${role}" aria-hidden="true">
      <span class="kd-mi-note kd-mi-n1">🎵</span>
      <span class="kd-mi-note kd-mi-n2">🎶</span>
      <span class="kd-mi-note kd-mi-n3">♪</span>
    </div>`
  }
  if (fx === 'clap_burst') {
    return `<div class="kd-motion-impact kd-motion-impact--clap kd-motion-impact--${role}" aria-hidden="true">
      <span class="kd-mi-flash"></span>
      <span class="kd-mi-spark kd-mi-sp1">✨</span>
    </div>`
  }
  return ''
}

export type ScriptedMotionPhase = 'walk_to' | 'act' | 'walk_back'

export type ScriptedMotionState = {
  motionId: MotionId
  reactionId: MotionReactionId
  visualPose: MotionVisualPose
  phase: ScriptedMotionPhase
  homeLat: number
  homeLng: number
  approachLat: number
  approachLng: number
  /** بۆ contact — نزیکتر لە ئامانج */
  contactLat: number
  contactLng: number
  phaseStartedAt: number
  walkToMs: number
  actMs: number
  walkBackMs: number
  targetUid: string
  targetName: string
  targetReacting: boolean
  /** FXی پەیکەر جارێک نیشان دراوە */
  impactSpawned: boolean
  /** لای ماچ بەرەو ئامانج */
  leanSide: MotionLeanSide
  /** تایملاینی beat */
  beatIndex: number
  beatStartedAt: number
}

export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

export function lerpGeo(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  t: number,
): { lat: number; lng: number } {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  }
}
