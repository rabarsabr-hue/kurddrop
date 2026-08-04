/**
 * ئاستی ڕاوکەر — تەنها لەسەر کردنەوەی درۆپ (جۆر ١–٥).
 *
 * خاڵی ئاست:
 *  - جۆری ١: هەر ٧ درۆپ = ١ ئاست
 *  - جۆری ٢: هەر ٥ درۆپ = ١ ئاست
 *  - جۆری ٣: هەر ٣ درۆپ = ١ ئاست
 *  - جۆری ٤: هەر ٢ درۆپ = ١ ئاست
 *  - جۆری ٥: هەر ١ درۆپ = ١ ئاست
 *
 * دەرەوەی شاری خۆ: هەر کردنەوە بە ٢× حیساب دەکرێت (دەبڵ).
 * UI: ١٢ ناونیشانی کلاسیک — hunterLevel ناوخۆیی (٠=ڕاوکەر … ٨=پادشا …).
 */

export type DropTypeKey = 1 | 2 | 3 | 4 | 5

export type DropsOpenedByType = Record<DropTypeKey, number>

export const EMPTY_DROPS_OPENED: DropsOpenedByType = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

/** درۆپی پێویست بۆ ١ ئاست بەپێی جۆر */
export const DROP_LEVEL_COSTS: Record<DropTypeKey, number> = {
  1: 7,
  2: 5,
  3: 3,
  4: 2,
  5: 1,
}

/** ئاستی ناوخۆیی = پادشا */
export const PADSHA_HUNTER_LEVEL = 8

/** ١٢ پلەی ناونیشان — کلاسیکەکان + نێوانەکان؛ بێ پیشاندانی ژمارە */
export const HUNTER_RANKS = [
  { name: 'ڕاوکەر', icon: '🏹', glow: '#64d8ff' },
  { name: 'گەڕۆک', icon: '🧭', glow: '#22d3ee' },
  { name: 'جەنگاوەر', icon: '⚔️', glow: '#00ff66' },
  { name: 'پارێزەر', icon: '🔰', glow: '#4ade80' },
  { name: 'سەردار', icon: '🛡️', glow: '#38bdf8' },
  { name: 'قارەمان', icon: '💪', glow: '#818cf8' },
  { name: 'میر', icon: '⚜️', glow: '#a855f7' },
  { name: 'والی', icon: '🏛️', glow: '#c084fc' },
  { name: 'پادشا', icon: '👑', glow: '#38bdf8' },
  { name: 'سوڵتان', icon: '🕌', glow: '#f43f5e' },
  { name: 'ئیمپراتۆر', icon: '🌍', glow: '#ff3300' },
  { name: 'ئەفسانە', icon: '🌟', glow: '#f0abfc' },
] as const

export type HunterRank = (typeof HUNTER_RANKS)[number]

export const HUNTER_RANK_COUNT = HUNTER_RANKS.length

/** @deprecated use current rank from hunterLevelInfo */
export const HUNTER_ROLE_NAME = HUNTER_RANKS[0].name
export const HUNTER_ROLE_ICON = HUNTER_RANKS[0].icon
export const HUNTER_ROLE_GLOW = HUNTER_RANKS[0].glow

/** @deprecated — جۆری ١ ئێستا هەر ٧ = ١ ئاست */
export function type1CostForLevel(_n: number): number {
  return DROP_LEVEL_COSTS[1]
}

/** @deprecated */
export function type1CumulativeForLevel(L: number): number {
  if (L <= 0) return 0
  return DROP_LEVEL_COSTS[1] * L
}

/** @deprecated */
export function levelsFromType1(count: number): number {
  return Math.max(0, count) / DROP_LEVEL_COSTS[1]
}

export function parseDropsOpenedByType(raw: unknown): DropsOpenedByType {
  const out: DropsOpenedByType = { ...EMPTY_DROPS_OPENED }
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return out
  const data = raw as Record<string, unknown>
  for (const k of [1, 2, 3, 4, 5] as DropTypeKey[]) {
    const v = Number(data[String(k)] ?? data[k as unknown as string])
    out[k] = Number.isFinite(v) && v > 0 ? Math.floor(v) : 0
  }
  return out
}

/** کۆی ئاستی کەسیی تێکەڵ لە هەموو جۆرەکان */
export function hunterLevelProgress(counts: DropsOpenedByType): number {
  let total = 0
  for (const k of [1, 2, 3, 4, 5] as DropTypeKey[]) {
    total += (counts[k] ?? 0) / DROP_LEVEL_COSTS[k]
  }
  return total
}

export function computeHunterLevel(counts: DropsOpenedByType): number {
  return Math.floor(hunterLevelProgress(counts))
}

/** ئاستی ڕاوکەر = max(پاشەکەوتی هەڵگیراو، حیساب لە درۆپ) — بۆ UI و پرۆفایلی گشتی */
export function resolveHunterLevel(
  storedLevel: unknown,
  dropsOpenedByType?: DropsOpenedByType | null,
): number {
  const computed = dropsOpenedByType ? computeHunterLevel(dropsOpenedByType) : 0
  const stored = Number(storedLevel)
  const storedSafe = Number.isFinite(stored) && stored >= 0 ? Math.floor(stored) : 0
  return Math.max(0, storedSafe, computed)
}

/**
 * Drop counts that yield at least `level` (type-5: ١ درۆپ = ١ ئاست).
 * Used for bot seeding / floor after Kurdistan pass.
 */
export function dropsOpenedForLevel(level: number): DropsOpenedByType {
  const L = Math.max(0, Math.floor(Number(level) || 0))
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: L }
}

/** زیادکردنی ژمێرەری درۆپ (weight=٢ بۆ دەرەوەی شار) */
export function incrementDropsOpened(
  prev: DropsOpenedByType,
  dropType: number,
  weight = 1,
): DropsOpenedByType {
  const next = { ...prev }
  if (dropType >= 1 && dropType <= 5) {
    const k = dropType as DropTypeKey
    const w = Math.max(1, Math.floor(weight) || 1)
    next[k] = (next[k] ?? 0) + w
  }
  return next
}

/** مسۆگەرکردنی لانیکەم ئەم ئاستە لەسەر counts (بۆ پادشا دوای ڕێڕەو) */
export function ensureDropsForMinLevel(prev: DropsOpenedByType, minLevel: number): DropsOpenedByType {
  const target = Math.max(0, Math.floor(minLevel))
  if (computeHunterLevel(prev) >= target) return prev
  const next = { ...prev }
  let guard = 0
  while (computeHunterLevel(next) < target && guard++ < 20_000) {
    next[5] = (next[5] ?? 0) + 1
  }
  return next
}

/** ناوخۆیی hunterLevel → ئیندێکسی ١٢ پلە (٠…١١) */
export function hunterRankIndex(level: number): number {
  const safe = Math.max(0, Math.floor(level))
  return Math.min(HUNTER_RANK_COUNT - 1, safe)
}

export function hunterRankForLevel(level: number): HunterRank {
  return HUNTER_RANKS[hunterRankIndex(level)]
}

export interface HunterLevelInfo {
  /** ناوخۆیی — بۆ لۆژیک؛ لە UI پیشان مەدە */
  level: number
  name: string
  icon: string
  glow: string
  rankIndex: number
  /** پێشکەوتن بەرەو پلەی داهاتوو ٠–١ */
  progressToNext: number
  /** تەنها ناوی پلە — بێ ژمارە */
  label: string
}

export function hunterLevelInfo(level: number, counts?: DropsOpenedByType): HunterLevelInfo {
  const safe = Math.max(0, Math.floor(level))
  const rankIndex = hunterRankIndex(safe)
  const rank = HUNTER_RANKS[rankIndex]
  let progressToNext = 0
  if (rankIndex >= HUNTER_RANK_COUNT - 1) {
    progressToNext = 1
  } else if (counts) {
    const frac = hunterLevelProgress(counts)
    progressToNext = Math.min(1, Math.max(0, frac - safe))
  } else {
    progressToNext = 0
  }
  return {
    level: safe,
    name: rank.name,
    icon: rank.icon,
    glow: rank.glow,
    rankIndex,
    progressToNext,
    label: rank.name,
  }
}

/** دەقی کورتی بادجی نەخشە — چیتر لەسەر نەخشە بەکارناهێنرێت */
export function hunterLevelBadgeText(_level: number): string {
  return ''
}
