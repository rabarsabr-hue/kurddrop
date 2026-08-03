/** سەردەم ١ / پاداشتی پاشایەتی — ٥٠ پلەی میرایەتی، ڕێڕەوی گشتی + ڕێڕەوی میران */

export const SEASON_ID = 's1'
export const SEASON_NAME = 'سەردەمی ١: شێرەکانی قەڵات'
export const SEASON_MAX_LEVEL = 50
/** خاڵی پێویست بۆ هەر پلەی میرایەتی */
export const RP_XP_PER_LEVEL = 1000
/** نرخی ڕێڕەوی میران بە ئەڵماس */
export const ELITE_PASS_DIAMOND_COST = 450

export type PassRewardKind =
  | 'gold'
  | 'diamond'
  | 'chest'
  | 'cosmetic'
  | 'title'
  | 'vip_tag'

export interface PassReward {
  kind: PassRewardKind
  amount?: number
  /** بۆ chest: 5=ئاسایی، 4=ناوەند… */
  chestId?: number
  /** idی کەرەستەی جوانکاری یان ناوی تاگ */
  cosmeticId?: number
  titleText?: string
  label: string
  thumbClass?: string
}

export interface SeasonLevelDef {
  level: number
  free: PassReward | null
  elite: PassReward | null
}

export type MissionPeriod = 'daily' | 'weekly'

export interface RpMissionDef {
  id: string
  period: MissionPeriod
  title: string
  desc: string
  target: number
  xpReward: number
  /** کلیلی پێشکەوتن لە App (بۆ نیشانەکردن) */
  metric: 'login' | 'claimDrop' | 'travelM' | 'buyItem' | 'equipCosmetic' | 'openShop'
}

export interface MissionProgress {
  progress: number
  claimed: boolean
  /** YYYY-MM-DD بۆ daily / YYYY-Www بۆ weekly */
  periodKey: string
}

export interface SeasonPassState {
  seasonId: string
  xp: number
  eliteOwned: boolean
  claimedFree: number[]
  claimedElite: number[]
  missions: Record<string, MissionProgress>
}

export function emptySeasonPassState(): SeasonPassState {
  return {
    seasonId: SEASON_ID,
    xp: 0,
    eliteOwned: false,
    claimedFree: [],
    claimedElite: [],
    missions: {},
  }
}

export function rpLevelFromXp(xp: number): number {
  return Math.min(SEASON_MAX_LEVEL, Math.floor(Math.max(0, xp) / RP_XP_PER_LEVEL) + 1)
}

export function xpIntoCurrentLevel(xp: number): number {
  if (xp >= SEASON_MAX_LEVEL * RP_XP_PER_LEVEL) return RP_XP_PER_LEVEL
  return xp % RP_XP_PER_LEVEL
}

export function xpToNextLevel(xp: number): number {
  if (rpLevelFromXp(xp) >= SEASON_MAX_LEVEL) return 0
  return RP_XP_PER_LEVEL - xpIntoCurrentLevel(xp)
}

function freeReward(level: number): PassReward | null {
  if (level % 5 === 0) {
    return { kind: 'chest', chestId: 5, label: 'سندوقی ئاسایی', thumbClass: 'kd-thumb-trail' }
  }
  if (level % 3 === 0) {
    return { kind: 'gold', amount: 80 + level * 8, label: `${80 + level * 8} زێڕ`, thumbClass: 'kd-thumb-gold' }
  }
  const diamondAmount = Math.max(1, Math.round((500 + level * 120) / 100))
  return { kind: 'diamond', amount: diamondAmount, label: `${diamondAmount} ئەڵماس`, thumbClass: 'kd-thumb-default' }
}

function eliteReward(level: number): PassReward {
  // خەڵاتە دەگمەنەکان لە ئاستە تایبەتەکان
  if (level === 10) {
    return { kind: 'cosmetic', cosmeticId: 125, label: 'جەمەدانیی پێچراوی مەشکی', thumbClass: 'kd-thumb-jam-bw' }
  }
  if (level === 20) {
    return { kind: 'title', titleText: 'میری میدیا', label: "نازناوی 'میری میدیا'", thumbClass: 'kd-thumb-title' }
  }
  if (level === 30) {
    return { kind: 'cosmetic', cosmeticId: 124, label: 'جەمەدانیی سووری زێڕین', thumbClass: 'kd-thumb-jam-red' }
  }
  if (level === 40) {
    return { kind: 'cosmetic', cosmeticId: 101, label: 'چووخە و ڕانکی ئیمپراتۆری', thumbClass: 'kd-thumb-chokha' }
  }
  if (level === 50) {
    return { kind: 'vip_tag', titleText: 'شێری سەردەم', label: "نازناوی 'شێری سەردەم'", thumbClass: 'kd-thumb-gold' }
  }
  if (level % 10 === 5) {
    return { kind: 'diamond', amount: 15 + Math.floor(level / 2), label: `${15 + Math.floor(level / 2)} ئەڵماس`, thumbClass: 'kd-thumb-border-ishtar' }
  }
  if (level % 4 === 0) {
    return { kind: 'chest', chestId: 3, label: 'سندوقی ئاست بەرز', thumbClass: 'kd-thumb-velvet' }
  }
  return { kind: 'gold', amount: 200 + level * 25, label: `${200 + level * 25} زێڕ`, thumbClass: 'kd-thumb-gold' }
}

/** ٥٠ پلەی میرایەتی — ڕێڕەوی گشتی + ڕێڕەوی میران */
export const SEASON_LEVELS: SeasonLevelDef[] = Array.from({ length: SEASON_MAX_LEVEL }, (_, i) => {
  const level = i + 1
  return {
    level,
    free: freeReward(level),
    elite: eliteReward(level),
  }
})

export const RP_MISSIONS: RpMissionDef[] = [
  { id: 'd_login', period: 'daily', title: 'چوونەژوورەوەی ڕۆژانە', desc: 'ئەمڕۆ بچۆ ژوورەوەی یاری.', target: 1, xpReward: 200, metric: 'login' },
  { id: 'd_drop', period: 'daily', title: 'کردنەوەی درۆپ', desc: '١ درۆپ بکەرەوە.', target: 1, xpReward: 350, metric: 'claimDrop' },
  { id: 'd_travel', period: 'daily', title: 'گەشتی نەخشە', desc: '٥٠٠ مەتر بڕۆ.', target: 500, xpReward: 300, metric: 'travelM' },
  { id: 'd_shop', period: 'daily', title: 'سەردانی فرۆشگا', desc: 'فرۆشگای جلوبەرگ بکەرەوە.', target: 1, xpReward: 150, metric: 'openShop' },
  { id: 'd_equip', period: 'daily', title: 'پۆشینی کەرەستە', desc: '١ کەرەستەی جوانکاری چالاک بکە.', target: 1, xpReward: 250, metric: 'equipCosmetic' },
  { id: 'w_drops', period: 'weekly', title: 'ڕاوکەری هەفتە', desc: '٥ درۆپ بکەرەوە.', target: 5, xpReward: 1200, metric: 'claimDrop' },
  { id: 'w_travel', period: 'weekly', title: 'گەڕانی هەفتە', desc: '٥ کم بڕۆ.', target: 5000, xpReward: 1000, metric: 'travelM' },
  { id: 'w_buy', period: 'weekly', title: 'بازاڕی هەفتە', desc: '٣ شت لە فرۆشگا بکڕە.', target: 3, xpReward: 900, metric: 'buyItem' },
]

export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function weekKey(d = new Date()): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function periodKeyFor(period: MissionPeriod, d = new Date()): string {
  return period === 'daily' ? dayKey(d) : weekKey(d)
}

function storageKey(uid: string) {
  return `kd_season_pass_${uid}_${SEASON_ID}`
}

export function loadSeasonPass(uid: string | null): SeasonPassState {
  if (!uid) return emptySeasonPassState()
  try {
    const raw = localStorage.getItem(storageKey(uid))
    if (!raw) return emptySeasonPassState()
    const parsed = JSON.parse(raw) as SeasonPassState
    if (parsed.seasonId !== SEASON_ID) return emptySeasonPassState()
    return {
      ...emptySeasonPassState(),
      ...parsed,
      claimedFree: Array.isArray(parsed.claimedFree) ? parsed.claimedFree : [],
      claimedElite: Array.isArray(parsed.claimedElite) ? parsed.claimedElite : [],
      missions: parsed.missions ?? {},
    }
  } catch {
    return emptySeasonPassState()
  }
}

export function saveSeasonPass(uid: string | null, state: SeasonPassState) {
  if (!uid) return
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(state))
  } catch {}
}

/** دڵنیابوون لە resetـی ئەرکەکان بەپێی ڕۆژ/هەفتە */
export function normalizeMissions(state: SeasonPassState, now = new Date()): SeasonPassState {
  const missions = { ...state.missions }
  for (const m of RP_MISSIONS) {
    const key = periodKeyFor(m.period, now)
    const cur = missions[m.id]
    if (!cur || cur.periodKey !== key) {
      missions[m.id] = { progress: 0, claimed: false, periodKey: key }
    }
  }
  return { ...state, missions }
}

export function addRpXp(state: SeasonPassState, amount: number): SeasonPassState {
  const cap = SEASON_MAX_LEVEL * RP_XP_PER_LEVEL
  return { ...state, xp: Math.min(cap, state.xp + Math.max(0, amount)) }
}

export function bumpMission(
  state: SeasonPassState,
  metric: RpMissionDef['metric'],
  amount = 1,
  now = new Date(),
): SeasonPassState {
  let next = normalizeMissions(state, now)
  for (const m of RP_MISSIONS) {
    if (m.metric !== metric) continue
    const cur = next.missions[m.id]
    if (!cur || cur.claimed) continue
    next = {
      ...next,
      missions: {
        ...next.missions,
        [m.id]: { ...cur, progress: Math.min(m.target, cur.progress + amount) },
      },
    }
  }
  return next
}

export function claimMissionXp(state: SeasonPassState, missionId: string, now = new Date()): SeasonPassState | null {
  const normalized = normalizeMissions(state, now)
  const def = RP_MISSIONS.find(m => m.id === missionId)
  const cur = normalized.missions[missionId]
  if (!def || !cur || cur.claimed || cur.progress < def.target) return null
  const withClaim = {
    ...normalized,
    missions: {
      ...normalized.missions,
      [missionId]: { ...cur, claimed: true },
    },
  }
  return addRpXp(withClaim, def.xpReward)
}

export function canClaimLevel(
  state: SeasonPassState,
  level: number,
  track: 'free' | 'elite',
): boolean {
  const lvl = rpLevelFromXp(state.xp)
  if (level > lvl) return false
  if (track === 'free') {
    const def = SEASON_LEVELS[level - 1]?.free
    if (!def) return false
    return !state.claimedFree.includes(level)
  }
  if (!state.eliteOwned) return false
  return !state.claimedElite.includes(level)
}

export function markLevelClaimed(state: SeasonPassState, level: number, track: 'free' | 'elite'): SeasonPassState {
  if (track === 'free') {
    if (state.claimedFree.includes(level)) return state
    return { ...state, claimedFree: [...state.claimedFree, level] }
  }
  if (state.claimedElite.includes(level)) return state
  return { ...state, claimedElite: [...state.claimedElite, level] }
}
