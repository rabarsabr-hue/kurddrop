/**
 * سیستەمی گشتیی ئاست و ئەزموون (Global Level & XP)
 *
 * Level 1 → 2: ٢٠ XP
 * ١–١٥: +٥٪ بۆ هەر ئاست
 * ١٥–٢٥: +١٠٪
 * ٢٥–٣٥: +٢٠٪
 * ٣٥–٧٥: پلەبەپلە تا +٧٥٪
 * ٧٥+: قورسیی زۆر (فاکتۆریالی)
 */

const XP_COST_CACHE: number[] = []

/** ڕێژەی زیادبوونی پێویستی دوای تەواوبوونی `level` (بۆ گەیشتن بە level+1) */
export function xpGrowthRateAfterLevel(level: number): number {
  if (level < 1) return 0.05
  if (level < 15) return 0.05
  if (level < 25) return 0.1
  if (level < 35) return 0.2
  if (level < 75) {
    const t = (level - 35) / (75 - 35)
    return 0.2 + t * (0.75 - 0.2)
  }
  // ٧٥+: قورسیی توند — نزیک لە فاکتۆریال
  const k = level - 74
  return Math.min(18, 0.9 + k * 0.45 + (k * (k + 1)) / 40)
}

/** XP پێویست بۆ بەرزبوونەوە لە `level` بۆ `level + 1` */
export function xpRequiredForLevel(level: number): number {
  const L = Math.max(1, Math.floor(level))
  if (XP_COST_CACHE[L] != null) return XP_COST_CACHE[L]
  let xp = 20
  for (let i = 1; i < L; i++) {
    xp = Math.max(1, Math.ceil(xp * (1 + xpGrowthRateAfterLevel(i))))
  }
  XP_COST_CACHE[L] = xp
  return xp
}

export function xpProgressRatio(level: number, xpIntoLevel: number): number {
  const need = xpRequiredForLevel(level)
  if (need <= 0) return 1
  return Math.max(0, Math.min(1, xpIntoLevel / need))
}

export type ApplyXpResult = {
  playerLevel: number
  playerXp: number
  levelsGained: number
  leveledUp: boolean
  previousLevel: number
}

/** زیادکردنی XP و چارەسەری level-up (لەوانەش چەند ئاست لە یەک جار) */
export function applyXpGain(
  currentLevel: number,
  currentXp: number,
  amount: number,
): ApplyXpResult {
  const previousLevel = Math.max(1, Math.floor(currentLevel) || 1)
  let level = previousLevel
  let xp = Math.max(0, Math.floor(currentXp) || 0) + Math.max(0, Math.floor(amount))
  let levelsGained = 0
  let guard = 0
  while (guard++ < 80) {
    const need = xpRequiredForLevel(level)
    if (xp < need) break
    xp -= need
    level += 1
    levelsGained += 1
  }
  return {
    playerLevel: level,
    playerXp: xp,
    levelsGained,
    leveledUp: levelsGained > 0,
    previousLevel,
  }
}

/** بڕی XP بۆ کردارەکانی یاری */
export const XP_REWARDS = {
  buyItem: 8,
  sellItem: 5,
  giftBasic: 12,
  giftMid: 20,
  giftVip: 40,
  dropOpen: 18,
  mapChat: 3,
  dailyBonus: 25,
  dailyMega: 100,
  spinWin: 10,
  spinRetry: 2,
} as const

/** XP بەپێی ٥ جۆری درۆپ (١ ئاسایی → ٥ ئەفسانەیی) */
export const DROP_XP_BY_TYPE: Record<number, number> = {
  1: 12,  // ⚪ ئاسایی
  2: 20,  // 🔵 ناوەند
  3: 32,  // 🟣 ئاست بەرز
  4: 48,  // 🟠 دەگمەن
  5: 75,  // 🟡 ئەفسانەیی
}

export function xpForDropType(dropType: number): number {
  return DROP_XP_BY_TYPE[dropType] ?? XP_REWARDS.dropOpen
}
