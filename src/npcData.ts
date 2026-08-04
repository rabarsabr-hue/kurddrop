/**
 * ٢٠ کارەکتەری چالاک — هەولێر، وەک یاریزانی ڕاستەقینە:
 * ئۆنلاین/ئۆفلاین، دیاری ڕۆژانە، چەرخی بەخت، بەخشین بە نرخ، sync بۆ Firestore
 */

import type { Gender, PlayerStats } from './services/userService'
import {
  DEFAULT_PLAYER_STATS,
  WELCOME_BONUS_GOLD,
  WELCOME_BONUS_DIAMOND,
  DAILY_BONUS_MIN_GAP_MS,
  DAILY_BONUS_TOTAL_DAYS,
  SPIN_FREE_COOLDOWN_MS,
  getDailyBonusRewardDef,
  getSpinWindowState,
  resolveDailyBonusStreakDay,
} from './services/userService'
import type { Avatar3DCustomization } from './fullBody3dAvatar'
import { DEFAULT_AVATAR_3D, normalizeAvatar3d } from './fullBody3dAvatar'
import type { PlayerLocation } from './services/locationService'
import { applyXpGain, XP_REWARDS } from './playerXp'
import {
  EMPTY_DROPS_OPENED,
  HUNTER_RANK_COUNT,
  DROP_LEVEL_COSTS,
  computeHunterLevel,
  dropsOpenedForLevel,
  hunterLevelProgress,
  incrementDropsOpened,
  type DropsOpenedByType,
  type DropTypeKey,
} from './hunterLevel'
import {
  DONATE_ITEMS,
  GIFT_RECIPIENT_CUT_PCT,
  type DonateItemDef,
  type DonateItemId,
} from './data/gifts'
import {
  DIALECT_CHAT,
  DIALECT_DROP_CHAT,
  NPC_COMEDY_MESSAGES,
  PUBLIC_CHAT_ONE_LINERS,
  type NpcDialect,
} from './data/chatMessages'

export type { NpcDialect }
export { NPC_COMEDY_MESSAGES, PUBLIC_CHAT_ONE_LINERS }

export const NPC_UID_PREFIX = 'kd_npc_'
export const NPC_COUNT = 20
export const NPC_TOTAL = NPC_COUNT
/** کەمترین مەودا ٣٫٥کم — دوورتر بۆ ئەوەی تێکەڵ نەبن */
export const NPC_MIN_SEPARATION_M = 3500
/** ٥٠٪ interactive (چات/دیاری) — walker کوژاوەتەوە (جێگیر) */
export const NPC_INTERACTIVE_RATIO = 0.5
export const NPC_WALKER_RATIO = 0
export const NPC_CHAT_MAX_LEN = 100
/** چاتی گشتی — هەر ٣ تا ١٠ چرکە جارێک */
export const NPC_CHAT_STAGGER_MIN_MS = 3_000
export const NPC_CHAT_STAGGER_MAX_MS = 10_000
export const NPC_GLOBAL_CHAT_MIN_MS = 3_000
export const NPC_GLOBAL_CHAT_MAX_MS = 10_000
/** زۆرترین نامە لە لیستی چاتی گشتی */
export const GLOBAL_CHAT_FEED_MAX = 80
/** نزیکایەتی بۆ ڕاکردن بەرەو درۆپ (مەتر) — کوژاوە لە جووڵەدا */
export const NPC_DROP_DETECT_M = 4_500
/** مەودای «وەرگرتن»ی درۆپ لەلایەن NPC (مەتر) */
export const NPC_DROP_CLAIM_M = 90
/** کەمترین/زۆرترین گۆڕانی ئۆنلاین لە یەک tick (بۆ نەرمێتی) */
export const NPC_PRESENCE_FLIP_MIN = 1
export const NPC_PRESENCE_FLIP_MAX = 4
/** ماوەی fade-in کاتێک دێتە سەر خەت */
export const NPC_APPEAR_FADE_MS = 900
/** ماوەی fade-out پێش گۆڕینی شوێن */
export const NPC_FADE_OUT_MS = 900
/** لە دەستپێکدا ~٪٧٠ ئۆنلاین — وەک یاریزانی ڕاستەقینە */
export const NPC_INITIAL_ONLINE_RATIO = 0.7
/** Relocation کوژاوە — شوێن جێگیر دەمێنێتەوە */
export const NPC_RELOCATE_RATIO = 0
/** ماوەی نێوان شەپۆلەکانی گۆڕینی شوێن (ناچالاک) */
export const NPC_RELOCATE_INTERVAL_MS = 600_000
/** ماوەی syncـی گشتی بۆ Firestore */
export const NPC_FIRESTORE_SYNC_MS = 60_000

export type NpcHubKind = 'city' | 'village' | 'road'

export function isNpcPlayerUid(uid: string | null | undefined): boolean {
  return typeof uid === 'string' && uid.startsWith(NPC_UID_PREFIX)
}

export function npcUid(index: number): string {
  return `${NPC_UID_PREFIX}${String(index + 1).padStart(3, '0')}`
}

type NpcHub = {
  key: string
  name: string
  lat: number
  lng: number
  kind: NpcHubKind
  dialect: NpcDialect
  radiusKm: number
}

/**
 * ٢٠ خاڵی جێگیر لەناو هەولێر — مەودای ٢.٥–٧.٥کم لە ناوەند، ≥٢کم لەنێوانیان
 * (سێکتەرە جیاوازەکانی شار بەبێ کۆبوونەوە)
 */
const ERBIL_HUBS: NpcHub[] = [
  { key: 'qalat', name: 'قەڵای هەولێر', lat: 36.1911, lng: 44.0092, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'ankawa', name: 'عەنکاوا', lat: 36.2217, lng: 43.9678, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'west_erbil', name: 'ڕۆژئاوای هەولێر', lat: 36.1391, lng: 44.0149, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'dream_city', name: 'دریم سیتی', lat: 36.2368, lng: 44.0526, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'italian_village', name: 'گوندی ئیتاڵی', lat: 36.1803, lng: 43.9336, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'family_mall', name: 'فامیلی مۆڵ', lat: 36.1557, lng: 44.0781, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'rizgary', name: 'ڕیزگاری', lat: 36.2582, lng: 43.9869, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'bahar', name: 'بەهار', lat: 36.1266, lng: 43.9677, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'kasnazan', name: 'کەسنەزان', lat: 36.2171, lng: 44.0974, kind: 'village', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'ministries', name: 'وەزارەتەکان', lat: 36.2211, lng: 43.9192, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'street_100', name: 'شەقامی ١٠٠ مەتری', lat: 36.1175, lng: 44.0519, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'park_sami', name: 'پارکی سامی عەبدولڕەحمان', lat: 36.2711, lng: 44.0403, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'south_ring', name: 'بازنەی باشوور', lat: 36.1478, lng: 43.9167, kind: 'road', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'north_ring', name: 'بازنەی باکوور', lat: 36.1721, lng: 44.1165, kind: 'road', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'airport_road', name: 'ڕێگای فڕۆکەخانە', lat: 36.2655, lng: 43.9444, kind: 'road', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'gulan', name: 'گولان', lat: 36.0988, lng: 43.9944, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'empire', name: 'ئیمپایر وۆرڵد', lat: 36.2525, lng: 44.0994, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'kurd_museum', name: 'مۆزەخانەی کوردستان', lat: 36.1951, lng: 43.8888, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'english_village', name: 'ئینگلیش ڤیلەیج', lat: 36.1211, lng: 44.0964, kind: 'city', dialect: 'hawleri', radiusKm: 0.15 },
  { key: 'hasarok', name: 'حەسارۆک', lat: 36.2922, lng: 44.0034, kind: 'village', dialect: 'hawleri', radiusKm: 0.15 },
]

/** بێ jitter گەورە — کەمێک بڵاوکردنەوە لە hub بۆ ئەوەی تێکەڵ نەبن */
const ERBIL_JITTER_MAX_M = 180

const NPC_FIRST_NAMES: Array<{ name: string; gender: Gender }> = [
  { name: 'ئاریان', gender: 'male' }, { name: 'ژینۆ', gender: 'female' },
  { name: 'کاروان', gender: 'male' }, { name: 'لانی', gender: 'female' },
  { name: 'ڕێبوار', gender: 'male' }, { name: 'سۆنیا', gender: 'female' },
  { name: 'شێرزاد', gender: 'male' }, { name: 'نیان', gender: 'female' },
  { name: 'دانا', gender: 'male' }, { name: 'تارا', gender: 'female' },
  { name: 'هەردی', gender: 'male' }, { name: 'دیلان', gender: 'female' },
  { name: 'بەرزان', gender: 'male' }, { name: 'ڕۆژین', gender: 'female' },
  { name: 'سۆران', gender: 'male' }, { name: 'ئاڤین', gender: 'female' },
  { name: 'کۆڤان', gender: 'male' }, { name: 'ژیلان', gender: 'female' },
  { name: 'ئازاد', gender: 'male' }, { name: 'هێلین', gender: 'female' },
  { name: 'ڕێبین', gender: 'male' }, { name: 'ڤیان', gender: 'female' },
  { name: 'نەوزاد', gender: 'male' }, { name: 'شیلان', gender: 'female' },
  { name: 'ئاراس', gender: 'male' }, { name: 'گولان', gender: 'female' },
  { name: 'پێشڕەو', gender: 'male' }, { name: 'ئاڵا', gender: 'female' },
  { name: 'سەردار', gender: 'male' }, { name: 'ژین', gender: 'female' },
  { name: 'هەڤاڵ', gender: 'male' }, { name: 'ئاوات', gender: 'female' },
  { name: 'کەمال', gender: 'male' }, { name: 'پێری', gender: 'female' },
  { name: 'نەبەز', gender: 'male' }, { name: 'سڕوا', gender: 'female' },
  { name: 'چاڤدار', gender: 'male' }, { name: 'ڕووناک', gender: 'female' },
  { name: 'ئەردەلان', gender: 'male' }, { name: 'نازدار', gender: 'female' },
  { name: 'بەختیار', gender: 'male' }, { name: 'شەهلا', gender: 'female' },
  { name: 'کاوە', gender: 'male' }, { name: 'لەیلان', gender: 'female' },
  { name: 'مەریوان', gender: 'male' }, { name: 'ئێڤان', gender: 'female' },
  { name: 'سەفین', gender: 'male' }, { name: 'شیرین', gender: 'female' },
  { name: 'فەرمان', gender: 'male' }, { name: 'نەسرین', gender: 'female' },
  { name: 'ئاری', gender: 'male' }, { name: 'هانا', gender: 'female' },
  { name: 'ڕێناس', gender: 'male' }, { name: 'سارا', gender: 'female' },
  { name: 'هێمن', gender: 'male' }, { name: 'زەریا', gender: 'female' },
  { name: 'ڕۆژهات', gender: 'male' }, { name: 'کوردستان', gender: 'female' },
  { name: 'ئەمیر', gender: 'male' }, { name: 'میلان', gender: 'female' },
  { name: 'نەریمان', gender: 'male' }, { name: 'پەری', gender: 'female' },
  { name: 'شوان', gender: 'male' }, { name: 'ئاسن', gender: 'female' },
  { name: 'بەکر', gender: 'male' }, { name: 'لۆزان', gender: 'female' },
  { name: 'کەریم', gender: 'male' }, { name: 'نادیە', gender: 'female' },
  { name: 'هۆشیار', gender: 'male' }, { name: 'ڕۆژان', gender: 'female' },
  { name: 'سەلام', gender: 'male' }, { name: 'ڤێنوس', gender: 'female' },
  { name: 'نەجمەدین', gender: 'male' }, { name: 'یارا', gender: 'female' },
]


/**
 * لە پوولی ١٠٠ نامەکە یەکێک هەڵدەبژێرێت کە لە کۆمەڵەی نامە چالاکەکانی
 * excludeTexts (بۆ نموونە کارەکتەرانی نزیک لە هەمان کاتدا) نەبووبێت — بۆ
 * دڵنیابوون هیچ دوو کارەکتەرێکی نزیک هەمان نامە بە یەک کاتدا نیشان نادەن.
 */
export function pickUniquePublicChatLine(
  excludeTexts?: ReadonlySet<string>,
  seed?: string,
): string {
  const pool = PUBLIC_CHAT_ONE_LINERS
  const available = excludeTexts && excludeTexts.size > 0
    ? pool.filter((line) => !excludeTexts.has(line))
    : pool
  const source = available.length > 0 ? available : pool
  const i = Math.floor((seed ? hashUnit(seed) : Math.random()) * source.length) % source.length
  return source[i]!
}

export type LiveNpcState = {
  uid: string
  index: number
  name: string
  gender: Gender
  hubKey: string
  hubKind: NpcHubKind
  placeName: string
  dialect: NpcDialect
  homeLat: number
  homeLng: number
  lat: number
  lng: number
  hunterLevel: number
  playerLevel: number
  playerXp: number
  gold: number
  diamond: number
  /** ئاماری وەک یاریزانی ڕاستەقینە — بە تێپەڕبوونی کات زیاد دەبێت */
  stats: PlayerStats
  dropsOpenedByType: DropsOpenedByType
  interactive: boolean
  /** ٣٠٪ — پیاسەی بەردەوام کاتێک درۆپ نییە */
  walker: boolean
  avatar3d: Avatar3DCustomization
  moving: boolean
  lastMovedAt: number
  targetDropId: string | null
  lastDropChatAt: number
  claimedDropIds: string[]
  /** وەک یاریزانی ڕاستەقینە — ئۆنلاین/ئۆفلاین */
  isOnline: boolean
  /** کۆتایی سێشنی ئێستا (کاتێک ئۆنلاینە) */
  onlineUntilMs: number
  /** کاتی دوایین دەرچوون — بۆ lastSeen */
  lastSeenMs: number
  /** دەستپێکی fade-in کاتێک هاتە سەر خەت */
  appearAtMs: number
  /** دەستپێکی fade-out پێش Relocation (٠ = نییە) */
  disappearAtMs: number
  /** دیاری ڕۆژانە — وەک یاریزانی ڕاستەقینە */
  dailyBonusDay: number
  dailyBonusLastClaimMs: number | null
  /** چەرخی بەخت */
  spinLastFreeAtMs: number | null
  spinSpinsInWindow: number
}

export type NpcLiveState = LiveNpcState

export type ActiveDropInfo = {
  id: string
  lat: number
  lng: number
  dropType: number
}

function hashUnit(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

function offsetKm(lat: number, lng: number, eastKm: number, northKm: number) {
  const dLat = northKm / 111.32
  const dLng = eastKm / (111.32 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)))
  return { lat: lat + dLat, lng: lng + dLng }
}

function distMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestErbilHub(lat: number, lng: number): NpcHub {
  let best = ERBIL_HUBS[0]!
  let bestD = Infinity
  for (const h of ERBIL_HUBS) {
    const d = distMeters(lat, lng, h.lat, h.lng)
    if (d < bestD) {
      bestD = d
      best = h
    }
  }
  return best
}

function erbilHubBase(slotIndex: number): NpcHub {
  return ERBIL_HUBS[slotIndex % ERBIL_HUBS.length]!
}

function jitterErbilPos(
  lat: number,
  lng: number,
  index: number,
  salt: number,
): { lat: number; lng: number } {
  const u1 = hashUnit(`erb:j:${index}:${salt}:r`)
  const u2 = hashUnit(`erb:j:${index}:${salt}:a`)
  const distM = 25 + u1 * ERBIL_JITTER_MAX_M
  const angle = u2 * Math.PI * 2
  const eastKm = (Math.cos(angle) * distM) / 1000
  const northKm = (Math.sin(angle) * distM) / 1000
  return offsetKm(lat, lng, eastKm, northKm)
}

function isSeparatedFrom(
  lat: number,
  lng: number,
  others: ReadonlyArray<{ lat: number; lng: number }>,
  minM = NPC_MIN_SEPARATION_M,
): boolean {
  for (const p of others) {
    if (distMeters(lat, lng, p.lat, p.lng) < minM) return false
  }
  return true
}

/** پۆتانی سەرەتایی — یەک hub بۆ هەر کارەکتەر + jitter بچووک، ≥٣٫٥کم جیاکاری */
function pickErbilSpawnPosition(
  index: number,
  placed: Array<{ lat: number; lng: number }>,
): { lat: number; lng: number; hub: NpcHub } {
  const preferred = erbilHubBase(index)
  const exact = jitterErbilPos(preferred.lat, preferred.lng, index, 0)
  if (isSeparatedFrom(exact.lat, exact.lng, placed, NPC_MIN_SEPARATION_M)) {
    return { ...exact, hub: preferred }
  }
  // پاشەکشە: یەکەم hubـی بەتاڵ کە مەودا دەپارێزێت
  for (let attempt = 0; attempt < ERBIL_HUBS.length; attempt++) {
    const hub = erbilHubBase(index + attempt + 1)
    const pos = jitterErbilPos(hub.lat, hub.lng, index, attempt + 1)
    if (isSeparatedFrom(pos.lat, pos.lng, placed, NPC_MIN_SEPARATION_M)) {
      return { ...pos, hub }
    }
  }
  // دوایین: دوورترین خاڵ بە spiral — هەرگیز هەمان lat/lng دووبارە مەکەرەوە
  let bestHub = preferred
  let bestPos = exact
  let bestMin = -1
  for (let ring = 0; ring < 36; ring++) {
    const hub = erbilHubBase(index + ring)
    const distM = 280 + ring * 200
    const angle = (ring * 2.399963) // golden-angle steps
    const pos = offsetKm(
      hub.lat,
      hub.lng,
      (Math.cos(angle) * distM) / 1000,
      (Math.sin(angle) * distM) / 1000,
    )
    const sameAsPlaced = placed.some(
      (p) => Math.abs(p.lat - pos.lat) < 1e-7 && Math.abs(p.lng - pos.lng) < 1e-7,
    )
    if (sameAsPlaced) continue
    if (isSeparatedFrom(pos.lat, pos.lng, placed, NPC_MIN_SEPARATION_M)) {
      return { ...pos, hub }
    }
    let nearest = Infinity
    for (const p of placed) {
      nearest = Math.min(nearest, distMeters(pos.lat, pos.lng, p.lat, p.lng))
    }
    if (placed.length === 0 || nearest > bestMin) {
      bestMin = placed.length === 0 ? Infinity : nearest
      bestHub = hub
      bestPos = pos
    }
  }
  return { ...bestPos, hub: bestHub }
}

function scatterInHub(hub: NpcHub, index: number, salt = 0): { lat: number; lng: number } {
  const u1 = hashUnit(`npc:${index}:r:${salt}`)
  const u2 = hashUnit(`npc:${index}:a:${salt}`)
  const distKm = 0.02 + u1 * Math.min(0.06, hub.radiusKm * 0.2)
  const angle = u2 * Math.PI * 2
  return offsetKm(hub.lat, hub.lng, Math.cos(angle) * distKm, Math.sin(angle) * distKm)
}

/** ماوەی سێشنی ئۆنلاین — ١٠ خولەک / ٣٠ / ١ کاتژمێر / ناڕێک */
export function randomSessionDurationMs(seed?: string): number {
  const u = seed ? hashUnit(seed) : Math.random()
  if (u < 0.22) return 10 * 60_000
  if (u < 0.42) return 30 * 60_000
  if (u < 0.58) return 60 * 60_000
  const irr = seed ? hashUnit(`irr:${seed}`) : Math.random()
  const mins = 3 + Math.floor(irr * 87)
  return mins * 60_000
}

/** ماوەی ئۆفلاین پێش گەڕانەوە — ٥–١٢٠ خولەک */
export function randomOfflineDurationMs(seed?: string): number {
  const u = seed ? hashUnit(seed) : Math.random()
  if (u < 0.45) return (5 + Math.floor(u * 22)) * 60_000
  if (u < 0.78) return (20 + Math.floor((u - 0.45) * 90)) * 60_000
  const long = seed ? hashUnit(`offL:${seed}`) : Math.random()
  return (45 + Math.floor(long * 75)) * 60_000
}

function pickFreshRandomHub(excludeKey: string | null, salt: number): NpcHub {
  const pool = ERBIL_HUBS.filter((h) => h.key !== excludeKey)
  const list = pool.length > 0 ? pool : ERBIL_HUBS
  return list[Math.floor(hashUnit(`reloc-hub:${salt}`) * list.length) % list.length]!
}

function pickErbilRelocatePosition(
  npc: LiveNpcState,
  now: number,
  allNpcs: LiveNpcState[],
): { lat: number; lng: number; hub: NpcHub } {
  const others = allNpcs
    .filter((n) => n.uid !== npc.uid)
    .map((n) => ({ lat: n.lat, lng: n.lng }))
  const salt = Math.floor(now / 1000) ^ (npc.index * 9973)
  for (let attempt = 0; attempt < ERBIL_HUBS.length * 3; attempt++) {
    const hub = pickFreshRandomHub(npc.hubKey, salt + attempt)
    const pos = jitterErbilPos(hub.lat, hub.lng, npc.index, salt + attempt)
    if (isSeparatedFrom(pos.lat, pos.lng, others, NPC_MIN_SEPARATION_M)) {
      return { ...pos, hub }
    }
  }
  // پاشەکشە: دوورترین hub لە کارەکتەرەکانی تر (≥١کم ئەگەر گونجاو بێت)
  let bestHub = pickFreshRandomHub(npc.hubKey, salt)
  let bestPos = scatterInHub(bestHub, npc.index, salt)
  let bestMin = -1
  for (const hub of ERBIL_HUBS) {
    if (hub.key === npc.hubKey) continue
    const pos = scatterInHub(hub, npc.index, salt + 31)
    let nearest = Infinity
    for (const p of others) {
      nearest = Math.min(nearest, distMeters(pos.lat, pos.lng, p.lat, p.lng))
    }
    if (others.length === 0 || nearest > bestMin) {
      bestMin = others.length === 0 ? Infinity : nearest
      bestHub = hub
      bestPos = pos
    }
  }
  return { ...bestPos, hub: bestHub }
}

/** گۆڕینی پۆتان — تەنها لە ناوچەی هەولێر */
export function relocateNpcGeography(
  npc: LiveNpcState,
  now: number,
  allNpcs: LiveNpcState[] = [],
): LiveNpcState {
  const { lat, lng, hub } = pickErbilRelocatePosition(npc, now, allNpcs.length ? allNpcs : [npc])
  return {
    ...npc,
    hubKey: hub.key,
    hubKind: hub.kind,
    placeName: hub.name,
    dialect: 'hawleri',
    homeLat: lat,
    homeLng: lng,
    lat,
    lng,
    moving: false,
    targetDropId: null,
    disappearAtMs: 0,
    appearAtMs: npc.isOnline ? now : 0,
  }
}

function goNpcOffline(npc: LiveNpcState, now: number): LiveNpcState {
  return {
    ...npc,
    isOnline: false,
    onlineUntilMs: now + randomOfflineDurationMs(`off:${npc.uid}:${Math.floor(now / 60_000)}`),
    appearAtMs: 0,
    disappearAtMs: 0,
    moving: false,
    targetDropId: null,
    lastSeenMs: now,
  }
}

function goNpcOnline(npc: LiveNpcState, now: number, _allNpcs: LiveNpcState[]): LiveNpcState {
  return {
    ...npc,
    isOnline: true,
    lat: npc.homeLat,
    lng: npc.homeLng,
    onlineUntilMs: now + randomSessionDurationMs(`sess:${npc.uid}:${Math.floor(now / 60_000)}`),
    appearAtMs: now,
    lastSeenMs: now,
    disappearAtMs: 0,
    moving: false,
    targetDropId: null,
  }
}

export type NpcPresenceTickResult = {
  npcs: LiveNpcState[]
  wentOnline: string[]
  wentOffline: string[]
}

/**
 * Dynamic Session Controller — ئۆنلاین/ئۆفلاین وەک یاریزانی ڕاستەقینە
 */
export function tickNpcOnlinePresence(
  npcs: LiveNpcState[],
  now = Date.now(),
): NpcPresenceTickResult {
  const wentOnline: string[] = []
  const wentOffline: string[] = []
  let flipsLeft = NPC_PRESENCE_FLIP_MIN
    + Math.floor(hashUnit(`flip:${Math.floor(now / 1000)}`) * (NPC_PRESENCE_FLIP_MAX - NPC_PRESENCE_FLIP_MIN + 1))

  const next = npcs.map((npc) => {
    if (npc.isOnline) {
      let until = npc.onlineUntilMs
      if (until <= 0) {
        until = now + randomSessionDurationMs(`boot-on:${npc.uid}`)
        return { ...npc, onlineUntilMs: until }
      }
      if (flipsLeft > 0 && now >= until) {
        flipsLeft -= 1
        wentOffline.push(npc.uid)
        return goNpcOffline(npc, now)
      }
      return until !== npc.onlineUntilMs ? { ...npc, onlineUntilMs: until } : npc
    }

    let until = npc.onlineUntilMs
    if (until <= 0) {
      until = now + randomOfflineDurationMs(`boot-off:${npc.uid}`)
      return { ...npc, onlineUntilMs: until }
    }
    if (flipsLeft > 0 && now >= until) {
      flipsLeft -= 1
      wentOnline.push(npc.uid)
      return goNpcOnline(npc, now, npcs)
    }
    return until !== npc.onlineUntilMs ? { ...npc, onlineUntilMs: until } : npc
  })

  return { npcs: next, wentOnline, wentOffline }
}

export function shouldPlayNpcAppearAnim(npc: LiveNpcState, now = Date.now()): boolean {
  return npc.isOnline && npc.appearAtMs > 0 && now - npc.appearAtMs < NPC_APPEAR_FADE_MS + 350
}

export function shouldPlayNpcDisappearAnim(npc: LiveNpcState, now = Date.now()): boolean {
  return npc.isOnline && npc.disappearAtMs > 0 && now - npc.disappearAtMs < NPC_FADE_OUT_MS + 80
}

export type NpcRelocationTickResult = {
  npcs: LiveNpcState[]
  /** دەستپێکی fade-out (هێشتا لە شوێنی کۆن) */
  fadingOut: string[]
  /** تەواوبوونی Relocation + fade-in لە شوێنی نوێ */
  relocated: string[]
}

/**
 * Relocation کوژاوە — کارەکتەرەکان جێگیر دەمێننەوە
 */
export function beginNpcRelocationWave(
  npcs: LiveNpcState[],
  _now = Date.now(),
): NpcRelocationTickResult {
  return { npcs, fadingOut: [], relocated: [] }
}

/** تەواوکردنی fade-out → شوێنی نوێ + fade-in */
export function finalizeNpcRelocations(
  npcs: LiveNpcState[],
  now = Date.now(),
): NpcRelocationTickResult {
  const fadingOut: string[] = []
  const relocated: string[] = []
  const next = npcs.map((npc) => {
    if (!(npc.disappearAtMs > 0)) return npc
    if (now - npc.disappearAtMs < NPC_FADE_OUT_MS) {
      fadingOut.push(npc.uid)
      return npc
    }
    if (!npc.isOnline) {
      return { ...npc, disappearAtMs: 0 }
    }
    const moved = relocateNpcGeography(npc, now, npcs)
    relocated.push(moved.uid)
    return moved
  })
  return { npcs: next, fadingOut, relocated }
}

const EYE_COLORS = ['#1e293b', '#3b82f6', '#16a34a', '#92400e', '#0f766e', '#6b7280']
const OUTFITS = ['#1e3a5f', '#9f1239', '#14532d', '#4c1d95', '#b45309', '#0f172a', '#0369a1', '#be123c']
const HAIRS: Avatar3DCustomization['hairStyle'][] = ['short', 'long', 'buzz', 'layered']

function buildAvatar3d(index: number, gender: Gender): Avatar3DCustomization {
  return normalizeAvatar3d({
    ...DEFAULT_AVATAR_3D,
    skinTone: index % 4,
    hairStyle: gender === 'female' ? (index % 2 === 0 ? 'long' : 'layered') : HAIRS[index % HAIRS.length],
    hairColor: index % 3,
    eyeColor: EYE_COLORS[index % EYE_COLORS.length],
    outfitColor: OUTFITS[index % OUTFITS.length],
  })
}

function uniqueNpcName(index: number): { name: string; gender: Gender } {
  const base = NPC_FIRST_NAMES[index % NPC_FIRST_NAMES.length]!
  const cycle = Math.floor(index / NPC_FIRST_NAMES.length)
  if (cycle === 0) return { name: base.name, gender: base.gender }
  return { name: `${base.name} ${cycle + 1}`, gender: base.gender }
}

function withPlace(template: string, place: string): string {
  return template.replace(/\{place\}/g, place).slice(0, NPC_CHAT_MAX_LEN)
}

export function nearestPlaceName(lat: number, lng: number): string {
  return nearestErbilHub(lat, lng).name
}

/** دابەشکردنی ١٢ پلە لەسەر N کارەکتەر — هەموو ئاستێک لانیکەم جارێک */
function assignNpcHunterLevels(count: number): number[] {
  const levels: number[] = []
  for (let i = 0; i < HUNTER_RANK_COUNT; i++) levels.push(i)
  while (levels.length < count) {
    const i = levels.length
    levels.push(Math.floor(hashUnit(`hlx:${i}`) * HUNTER_RANK_COUNT) % HUNTER_RANK_COUNT)
  }
  // shuffle جێگیر بە seed
  for (let i = levels.length - 1; i > 0; i--) {
    const j = Math.floor(hashUnit(`hls:${i}`) * (i + 1)) % (i + 1)
    const tmp = levels[i]!
    levels[i] = levels[j]!
    levels[j] = tmp
  }
  return levels.slice(0, count)
}

function totalDropsOpened(counts: DropsOpenedByType): number {
  return (counts[1] ?? 0) + (counts[2] ?? 0) + (counts[3] ?? 0) + (counts[4] ?? 0) + (counts[5] ?? 0)
}

/**
 * درۆپی کردنەوە وەک یاریزانی ڕاستەقینە — ژمارەکە لەگەڵ ئاست دەگونجێت.
 * ئاست L ≈ کۆی (جۆر/تێچوون)؛ ڕاوکەر (٠) = کەمتر لە ١ ئاست پێشکەوتن.
 */
function seedNpcDropsForLevel(index: number, targetLevel: number): DropsOpenedByType {
  const u = (s: string) => hashUnit(`nd:${s}:${index}`)
  const counts: DropsOpenedByType = { ...EMPTY_DROPS_OPENED }
  const L = Math.max(0, Math.min(HUNTER_RANK_COUNT - 1, Math.floor(targetLevel)))

  if (L <= 0) {
    // ڕاوکەر — هێشتا نەگەیشتووە بە ئاستی ١ (٠–٦ جۆری١، یان کەم جۆری٢)
    const mix = u('mix')
    if (mix < 0.7) {
      counts[1] = Math.floor(u('t1') * (DROP_LEVEL_COSTS[1] - 1)) // 0..6
    } else {
      counts[1] = Math.floor(u('t1b') * 3)
      counts[2] = Math.floor(u('t2') * 2)
      if (computeHunterLevel(counts) >= 1) {
        counts[2] = 0
        counts[1] = Math.min(counts[1], DROP_LEVEL_COSTS[1] - 1)
      }
    }
    return counts
  }

  // ئامانجی پێشکەوتن: L … L+0.85 (ناو ئاستی داهاتوو، بێ گەیشتن بە L+1)
  const targetProgress = L + u('into') * 0.85
  let guard = 0
  while (hunterLevelProgress(counts) < targetProgress && guard++ < 8_000) {
    const progress = hunterLevelProgress(counts)
    const roll = hashUnit(`sess:${index}:${guard}`)
    let type: DropTypeKey = 1
    // سەرەتا زیاتر جۆری ١–٢؛ دواتر جۆری بەرزتر دەردەکەوێت
    if (progress < 2) {
      type = roll < 0.72 ? 1 : 2
    } else if (progress < 5) {
      if (roll < 0.5) type = 1
      else if (roll < 0.82) type = 2
      else type = 3
    } else if (progress < 8) {
      if (roll < 0.35) type = 1
      else if (roll < 0.62) type = 2
      else if (roll < 0.82) type = 3
      else if (roll < 0.94) type = 4
      else type = 5
    } else {
      if (roll < 0.28) type = 1
      else if (roll < 0.52) type = 2
      else if (roll < 0.72) type = 3
      else if (roll < 0.88) type = 4
      else type = 5
    }
    counts[type] += 1
  }

  // دڵنیابوون: ئاست = L (نە کەمتر، نە L+1)
  guard = 0
  while (computeHunterLevel(counts) > L && guard++ < 8_000) {
    for (const t of [5, 4, 3, 2, 1] as DropTypeKey[]) {
      if ((counts[t] ?? 0) > 0) {
        counts[t] -= 1
        break
      }
    }
  }
  while (computeHunterLevel(counts) < L && guard++ < 10_000) {
    counts[1] += 1
  }
  return counts
}

/**
 * ئامار لەسەر چالاکی ڕاستەقینە — chestsOpened = کۆی درۆپەکان.
 * ڕۆژ / کات / مەودا بەپێی ئاست و ژمارەی درۆپ.
 */
function seedNpcStatsFromActivity(
  index: number,
  hunterLevel: number,
  drops: DropsOpenedByType,
): PlayerStats {
  const u = (s: string) => hashUnit(`st:${s}:${index}`)
  const chestsOpened = totalDropsOpened(drops)
  const L = Math.max(0, hunterLevel)

  // ~١–٢ ڕۆژی چالاکی بۆ هەر ئاست + ڕۆژی سەرەتا
  const activeDays = Math.max(
    chestsOpened > 0 ? 1 : 0,
    Math.floor(L * (1.1 + u('days') * 0.7)) + (L === 0 && chestsOpened > 0 ? 1 : 0),
  )

  // ~١٥–٧٥ خولەک لە ڕۆژێکی یاری
  const playTimeMs = Math.floor(activeDays * (15 + u('play') * 60) * 60_000)
  // مەودا لە نێوان درۆپەکان — ~١٢٠–٥٠٠م بۆ هەر درۆپ
  const distanceTraveledM = Math.floor(
    chestsOpened * (120 + u('dist') * 380) + activeDays * (80 + u('walk') * 200),
  )
  // خەڵاتی ڕۆژانە — هەموو ڕۆژێک نا
  const dailyBonusClaims = activeDays === 0
    ? 0
    : Math.min(activeDays, Math.floor(activeDays * (0.25 + u('daily') * 0.45)))
  // کڕین — کەم لە ئاستی نزم
  const itemsPurchased = L <= 1
    ? (u('items') < 0.15 && chestsOpened >= 2 ? 1 : 0)
    : Math.min(chestsOpened, Math.floor(u('items') * L * 0.6))
  // دیاری — دەگمەن بۆ سەرەتا
  const giftsReceived = L <= 2
    ? (u('gift') < 0.2 ? 1 : 0)
    : Math.min(Math.floor(L * 1.5), Math.floor(u('gift') * L * 1.1))

  return {
    chestsOpened,
    dailyBonusClaims,
    distanceTraveledM,
    playTimeMs,
    itemsPurchased,
    giftsReceived,
  }
}

/** زێڕ/ئەڵماس بەپێی ئاست — ڕاوکەر کەم */
function seedNpcWallet(index: number, hunterLevel: number, chestsOpened: number): { gold: number; diamond: number } {
  const u = (s: string) => hashUnit(`w:${s}:${index}`)
  const L = Math.max(0, hunterLevel)
  const gold = Math.floor(
    20 + chestsOpened * (8 + u('g') * 14) + L * (15 + u('gl') * 25),
  )
  const diamond = Math.floor(
    (L <= 1 ? u('d') * 3 : 2 + L * (1.2 + u('d') * 2) + chestsOpened * 0.08),
  )
  return { gold, diamond: Math.max(0, diamond) }
}

export function createInitialNpcStates(count = NPC_COUNT): LiveNpcState[] {
  const n = Math.max(1, Math.min(Math.floor(count), NPC_COUNT))
  const boot = Date.now()
  const states: LiveNpcState[] = []
  const placed: Array<{ lat: number; lng: number }> = []
  for (let i = 0; i < n; i++) {
    const { lat, lng, hub } = pickErbilSpawnPosition(i, placed)
    placed.push({ lat, lng })
    const person = uniqueNpcName(i)
    const interactive = hashUnit(`interactive:${i}`) < NPC_INTERACTIVE_RATIO
    const walker = false
    const hunterLevel = Math.min(HUNTER_RANK_COUNT - 1, Math.floor(hashUnit(`hlvl:${i}`) * 9))
    const dropsOpenedByType = dropsOpenedForLevel(hunterLevel)
    const stats = { ...DEFAULT_PLAYER_STATS }
    const wallet = seedNpcWallet(i, hunterLevel, totalDropsOpened(dropsOpenedByType))
    const gold = Math.max(WELCOME_BONUS_GOLD, wallet.gold)
    const diamond = Math.max(WELCOME_BONUS_DIAMOND, wallet.diamond)
    const playerLevel = Math.max(1, 1 + Math.floor(hunterLevel * 1.5 + hashUnit(`plvl:${i}`) * 4))
    const isOnline = hashUnit(`online0:${i}`) < NPC_INITIAL_ONLINE_RATIO
    const sessionSeed = `init-sess:${i}:${boot}`
    states.push({
      uid: npcUid(i),
      index: i,
      name: person.name,
      gender: person.gender,
      hubKey: hub.key,
      hubKind: hub.kind,
      placeName: hub.name,
      dialect: 'hawleri',
      homeLat: lat,
      homeLng: lng,
      lat,
      lng,
      hunterLevel,
      playerLevel,
      playerXp: 0,
      gold,
      diamond,
      stats,
      dropsOpenedByType,
      interactive,
      walker,
      avatar3d: buildAvatar3d(i, person.gender),
      moving: false,
      lastMovedAt: 0,
      targetDropId: null,
      lastDropChatAt: 0,
      claimedDropIds: [],
      isOnline,
      onlineUntilMs: isOnline
        ? boot + randomSessionDurationMs(sessionSeed)
        : boot + randomOfflineDurationMs(`init-off:${i}`),
      lastSeenMs: boot - Math.floor(hashUnit(`seen:${i}`) * 3_600_000),
      appearAtMs: isOnline ? boot : 0,
      disappearAtMs: 0,
      dailyBonusDay: 1,
      dailyBonusLastClaimMs: null,
      spinLastFreeAtMs: null,
      spinSpinsInWindow: 0,
    })
  }
  return states
}

export function liveNpcToPlayerLocation(npc: LiveNpcState): PlayerLocation {
  return {
    uid: npc.uid,
    name: npc.name,
    gender: npc.gender,
    lat: npc.lat,
    lng: npc.lng,
    isOnline: npc.isOnline,
    showMyAvatarOnMap: true,
    avatarUrl: null,
    avatar3d: npc.avatar3d,
    skinId: null,
    borderId: null,
    titleId: null,
    headwearId: null,
    accessoryId: null,
    mapAuraId: null,
    companionId: null,
    smokeUntilMs: 0,
    duelFxUntilMs: 0,
    activeDuelId: null,
    hunterLevel: npc.hunterLevel,
    playerId: '',
    /** وەک یاریزانی ڕاستەقینە — بێ تاگی Bot/NPC */
    isBot: false,
    lastSeenMs: npc.lastSeenMs || Date.now(),
  }
}

/**
 * گەشەی ئامار — تەنها کات/مەودای سروشتی.
 * کردنەوەی سندوق تەنها لە tickNpcMovement (وەرگرتنی درۆپ) زیاد دەبێت.
 * دیاری ڕۆژانە/چەرخ لە tickNpcDailySystems.
 */
export function tickNpcStatsGrowth(
  npcs: LiveNpcState[],
  now = Date.now(),
  dtMs = 1000,
): LiveNpcState[] {
  const dt = Math.max(0, Math.min(dtMs, 10_000))
  if (dt <= 0) return npcs
  return npcs.map((npc) => {
    if (!npc.isOnline) return npc
    const chests = totalDropsOpened(npc.dropsOpenedByType)
    const stats: PlayerStats = {
      ...DEFAULT_PLAYER_STATS,
      ...npc.stats,
      chestsOpened: chests,
      playTimeMs: (npc.stats?.playTimeMs ?? 0) + dt,
    }
    const bucket = Math.floor(now / 55_000)
    const roll = hashUnit(`grow:${npc.uid}:${bucket}`)
    if (roll < 0.18) {
      stats.distanceTraveledM += Math.floor(8 + roll * 40)
    }
    if (npc.hunterLevel >= 4 && roll > 0.996) {
      stats.itemsPurchased += 1
    }
    let gold = npc.gold
    if (roll > 0.75 && roll < 0.8) gold += Math.floor(1 + roll * 4)

    return { ...npc, stats, gold }
  })
}

/** خەڵاتەکانی چەرخ — پوولی بچووک (بێ import لە appHelpers) */
const NPC_SPIN_POOL: Array<{ kind: 'gold' | 'diamond' | 'retry'; amount: number }> = [
  { kind: 'gold', amount: 25 },
  { kind: 'gold', amount: 50 },
  { kind: 'gold', amount: 100 },
  { kind: 'diamond', amount: 1 },
  { kind: 'diamond', amount: 3 },
  { kind: 'diamond', amount: 5 },
  { kind: 'diamond', amount: 10 },
  { kind: 'retry', amount: 0 },
]

/**
 * دیاری ڕۆژانە + چەرخی بەخت — تەنها کاتێک ئۆنلاینن، بە کاتی جیاواز.
 */
export function tickNpcDailySystems(
  npcs: LiveNpcState[],
  now = Date.now(),
): LiveNpcState[] {
  return npcs.map((npc) => {
    if (!npc.isOnline) return npc
    let next = npc

    const day = resolveDailyBonusStreakDay(
      next.dailyBonusDay || 1,
      next.dailyBonusLastClaimMs,
      now,
    )
    const lastClaim = next.dailyBonusLastClaimMs
    const gapOk = lastClaim == null || now - lastClaim >= DAILY_BONUS_MIN_GAP_MS
    // دوادادەنانی جیاواز بۆ هەر NPC (~٠–٦ کاتژمێر دوای ئامادەبوون)
    const staggerMs = Math.floor(hashUnit(`dailystag:${npc.uid}`) * 6 * 3600_000)
    const readySince = lastClaim == null ? now : lastClaim + DAILY_BONUS_MIN_GAP_MS
    const claimReady = gapOk && now >= readySince + staggerMs
    // لە یەک خولەکدا تەنها بە ٪٨ هەوڵ — بۆ ئەوەی هەموو بە یەک جار نەگرن
    const claimRoll = hashUnit(`dclaim:${npc.uid}:${Math.floor(now / 60_000)}`)
    if (claimReady && claimRoll < 0.08) {
      const reward = getDailyBonusRewardDef(day)
      const g = Math.max(0, Math.floor(reward.gold ?? 0))
      const d = Math.max(0, Math.floor(reward.diamond ?? 0))
      const stats: PlayerStats = {
        ...DEFAULT_PLAYER_STATS,
        ...next.stats,
        dailyBonusClaims: (next.stats?.dailyBonusClaims ?? 0) + 1,
      }
      next = {
        ...next,
        gold: next.gold + g,
        diamond: next.diamond + d,
        dailyBonusDay: day >= DAILY_BONUS_TOTAL_DAYS ? 1 : day + 1,
        dailyBonusLastClaimMs: now,
        stats,
      }
      next = grantNpcXp(next, XP_REWARDS.dailyBonus)
    }

    const spinState = getSpinWindowState({
      spinLastFreeAtMs: next.spinLastFreeAtMs,
      spinSpinsInWindow: next.spinSpinsInWindow,
    }, now)
    const spinStagger = Math.floor(hashUnit(`spinstag:${npc.uid}`) * 4 * 3600_000)
    const spinRoll = hashUnit(`spin:${npc.uid}:${Math.floor(now / 90_000)}`)
    if (spinState.freeReady && spinRoll < 0.06) {
      const lastFree = next.spinLastFreeAtMs
      const freeReadyAt = lastFree == null || lastFree <= 0
        ? now
        : lastFree + SPIN_FREE_COOLDOWN_MS
      if (now >= freeReadyAt + spinStagger) {
        const prize = NPC_SPIN_POOL[
          Math.floor(hashUnit(`spinr:${npc.uid}:${Math.floor(now / 90_000)}`) * NPC_SPIN_POOL.length)
          % NPC_SPIN_POOL.length
        ]!
        let gold = next.gold
        let diamond = next.diamond
        if (prize.kind === 'gold') gold += prize.amount
        if (prize.kind === 'diamond') diamond += prize.amount
        next = {
          ...next,
          gold,
          diamond,
          spinLastFreeAtMs: now,
          spinSpinsInWindow: 1,
        }
        if (prize.kind !== 'retry') {
          next = grantNpcXp(next, 8)
        }
      }
    }

    return next
  })
}

export function grantNpcXp(npc: LiveNpcState, amount: number): LiveNpcState {
  const r = applyXpGain(npc.playerLevel, npc.playerXp, amount)
  // hunterLevel تەنها لەسەر درۆپ دەگۆڕێت — لێرە نا
  return {
    ...npc,
    playerLevel: r.playerLevel,
    playerXp: r.playerXp,
  }
}

export function stepNpcWander(npc: LiveNpcState, _now = Date.now()): LiveNpcState {
  /** جووڵە کوژاوەتەوە — کارەکتەر جێگیر دەمێنێتەوە لە home */
  return {
    ...npc,
    lat: npc.homeLat,
    lng: npc.homeLng,
    moving: false,
    targetDropId: null,
  }
}

export function stepNpcToward(
  npc: LiveNpcState,
  targetLat: number,
  targetLng: number,
  dropId: string,
  now = Date.now(),
): LiveNpcState {
  const dist = distMeters(npc.lat, npc.lng, targetLat, targetLng)
  if (dist < 8) {
    return { ...npc, moving: true, lastMovedAt: now, targetDropId: dropId }
  }
  const stepM = Math.min(dist, 18 + hashUnit(`rush:${npc.uid}:${Math.floor(now / 4000)}`) * 35)
  const ratio = stepM / dist
  return {
    ...npc,
    lat: npc.lat + (targetLat - npc.lat) * ratio,
    lng: npc.lng + (targetLng - npc.lng) * ratio,
    moving: true,
    lastMovedAt: now,
    targetDropId: dropId,
  }
}

export function filterNpcsInViewport(
  npcs: readonly LiveNpcState[],
  bounds: { south: number; west: number; north: number; east: number },
): LiveNpcState[] {
  const { south, west, north, east } = bounds
  return npcs.filter(
    (n) =>
      n.isOnline
      && n.lat >= south
      && n.lat <= north
      && n.lng >= west
      && n.lng <= east,
  )
}

export function padLatLngBounds(
  south: number,
  west: number,
  north: number,
  east: number,
  padRatio = 0.18,
): { south: number; west: number; north: number; east: number } {
  const latPad = Math.max(0.008, (north - south) * padRatio)
  const lngPad = Math.max(0.008, (east - west) * padRatio)
  return {
    south: south - latPad,
    west: west - lngPad,
    north: north + latPad,
    east: east + lngPad,
  }
}

export function nextNpcChatDelayMs(seed?: string): number {
  const u = seed ? hashUnit(seed) : Math.random()
  return Math.floor(
    NPC_CHAT_STAGGER_MIN_MS + u * (NPC_CHAT_STAGGER_MAX_MS - NPC_CHAT_STAGGER_MIN_MS),
  )
}

/** کاتی هەڕەمەکی ٣–١٠ چرکە بۆ Global Chat Engine */
export function nextGlobalChatDelayMs(): number {
  return (
    NPC_GLOBAL_CHAT_MIN_MS
    + Math.floor(Math.random() * (NPC_GLOBAL_CHAT_MAX_MS - NPC_GLOBAL_CHAT_MIN_MS + 1))
  )
}

export type GlobalChatLine = {
  uid: string
  name: string
  text: string
  gender: Gender
  placeName: string
  dialect: NpcDialect
  hunterLevel: number
}

/**
 * نامەیەکی کۆمیدی لە یەکێک لە یاریزانە ئۆنلاینەکان — لە پوولی ١٠٠ نامەی
 * بێ دووبارەبوونەوە هەڵدەبژێردرێت. excludeTexts (نامە چالاکەکانی کارەکتەرانی
 * تر لە هەمان کاتدا) دەردەخرێت تاوەکو دوو کارەکتەری نزیک هەرگیز هەمان نامە
 * لە یەک کاتدا پیشان نەدەن.
 */
export function pickOnlineGlobalChatLine(
  npcs: LiveNpcState[],
  now = Date.now(),
  excludeTexts?: ReadonlySet<string>,
): GlobalChatLine | null {
  const online = npcs.filter((n) => n.isOnline)
  if (online.length === 0) return null
  const pick = online[Math.floor(Math.random() * online.length)]!
  return {
    uid: pick.uid,
    name: pick.name,
    text: pickUniquePublicChatLine(excludeTexts, `gchat:${now}:${pick.uid}:${Math.random()}`),
    gender: pick.gender,
    placeName: pick.placeName,
    dialect: pick.dialect,
    hunterLevel: pick.hunterLevel,
  }
}

export function pickDialectComedyMessage(npc: LiveNpcState, seed?: string): string {
  const list = DIALECT_CHAT[npc.dialect]
  const i = Math.floor((seed ? hashUnit(seed) : Math.random()) * list.length) % list.length
  return withPlace(list[i]!, npc.placeName)
}

export function pickDropChatMessage(npc: LiveNpcState, dropPlace: string, seed?: string): string {
  const list = DIALECT_DROP_CHAT[npc.dialect]
  const i = Math.floor((seed ? hashUnit(seed) : Math.random()) * list.length) % list.length
  return withPlace(list[i]!, dropPlace)
}

export function pickRandomComedyMessage(seed?: string): string {
  const i = Math.floor(
    (seed ? hashUnit(seed) : Math.random()) * NPC_COMEDY_MESSAGES.length,
  ) % NPC_COMEDY_MESSAGES.length
  return NPC_COMEDY_MESSAGES[i]!.slice(0, NPC_CHAT_MAX_LEN)
}

export type NpcGiftItemId = DonateItemId

export type NpcAutoAction =
  | { type: 'chat'; uid: string; name: string; text: string }
  | {
      type: 'gift'
      fromUid: string
      fromName: string
      toUid: string
      toName: string
      fromLat: number
      fromLng: number
      toLat: number
      toLng: number
      itemId: NpcGiftItemId
      emoji: string
      text: string
      goldCost: number
      diamondCost: number
    }
  | { type: 'drop_chat'; uid: string; name: string; text: string }

function pickAffordableDonateItem(npc: LiveNpcState, now: number): DonateItemDef | null {
  const affordable = DONATE_ITEMS.filter(
    (item) =>
      (item.goldPrice <= 0 || npc.gold >= item.goldPrice)
      && (item.diamondPrice <= 0 || npc.diamond >= item.diamondPrice)
      && (item.goldPrice > 0 || item.diamondPrice > 0),
  )
  if (affordable.length === 0) return null
  const roll = hashUnit(`gtier:${npc.uid}:${Math.floor(now / 7000)}`)
  const basic = affordable.filter((i) => i.tier === 'basic')
  const mid = affordable.filter((i) => i.tier === 'mid')
  const vip = affordable.filter((i) => i.tier === 'vip')
  let pool = basic.length > 0 ? basic : affordable
  if (roll > 0.58 && mid.length > 0) pool = mid
  if (roll > 0.9 && vip.length > 0) pool = vip
  if (pool.length === 0) pool = affordable
  return pool[Math.floor(hashUnit(`gitem:${npc.uid}:${now}`) * pool.length) % pool.length]!
}

/** یەک کار لە هەر جاردا — بۆ Humanized Chat Staggering */
export function pickOneNpcAutoAction(
  npcs: LiveNpcState[],
  now = Date.now(),
): NpcAutoAction | null {
  const pool = npcs.filter((n) => n.isOnline && n.interactive)
  if (pool.length === 0) return null
  const pick = pool[Math.floor(hashUnit(`act1:${now}`) * pool.length) % pool.length]!
  const doGift = hashUnit(`gift1:${now}:${pick.uid}`) < 0.55 && pool.length > 1
  if (doGift) {
    let other = pool[Math.floor(hashUnit(`to1:${now}:${pick.uid}`) * pool.length) % pool.length]!
    if (other.uid === pick.uid) {
      other = pool[(pool.indexOf(pick) + 1) % pool.length]!
    }
    const gift = pickAffordableDonateItem(pick, now)
    if (gift) {
      return {
        type: 'gift',
        fromUid: pick.uid,
        fromName: pick.name,
        toUid: other.uid,
        toName: other.name,
        fromLat: pick.lat,
        fromLng: pick.lng,
        toLat: other.lat,
        toLng: other.lng,
        itemId: gift.id,
        emoji: gift.emoji,
        goldCost: gift.goldPrice,
        diamondCost: gift.diamondPrice,
        text: `${gift.emoji} ${gift.label}م نارد بۆ ${other.name}!`.slice(0, NPC_CHAT_MAX_LEN),
      }
    }
  }
  return {
    type: 'chat',
    uid: pick.uid,
    name: pick.name,
    text: pickDialectComedyMessage(pick, `chat1:${now}:${pick.uid}`),
  }
}

/** @deprecated — use pickOneNpcAutoAction + stagger */
export function pickNpcAutoActions(
  npcs: LiveNpcState[],
  now = Date.now(),
  maxActions = 1,
): NpcAutoAction[] {
  const out: NpcAutoAction[] = []
  for (let i = 0; i < maxActions; i++) {
    const a = pickOneNpcAutoAction(npcs, now + i * 17)
    if (a) out.push(a)
  }
  return out
}

export type NpcWorldTickResult = {
  npcs: LiveNpcState[]
  dropChats: Array<{ uid: string; text: string }>
}

/**
 * جووڵەی جیهانی NPC — جێگیر لە home؛ تەنها ئۆنلاینەکان درۆپ وەردەگرن
 */
export function tickNpcMovement(
  npcs: LiveNpcState[],
  drops: ActiveDropInfo[],
  now = Date.now(),
): NpcWorldTickResult {
  const activeDrops = drops.filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
  const dropChats: Array<{ uid: string; text: string }> = []
  const next = npcs.map((npc) => {
    if (!npc.isOnline) {
      return {
        ...npc,
        lat: npc.homeLat,
        lng: npc.homeLng,
        moving: false,
        targetDropId: null,
      }
    }
    let updated: LiveNpcState = {
      ...npc,
      lat: npc.homeLat,
      lng: npc.homeLng,
      moving: false,
      targetDropId: null,
    }
    if (activeDrops.length === 0) return updated

    let nearest: ActiveDropInfo | null = null
    let nearestD = Infinity
    for (const d of activeDrops) {
      const dist = distMeters(updated.lat, updated.lng, d.lat, d.lng)
      if (dist < nearestD) {
        nearestD = dist
        nearest = d
      }
    }
    if (!nearest || nearestD > NPC_DROP_DETECT_M) return updated

    if (
      updated.interactive
      && now - updated.lastDropChatAt > 22_000
      && hashUnit(`dchat:${updated.uid}:${Math.floor(now / 8000)}`) < 0.12
    ) {
      const place = nearestPlaceName(nearest.lat, nearest.lng)
      dropChats.push({
        uid: updated.uid,
        text: pickDropChatMessage(updated, place, `dc:${now}:${updated.uid}`),
      })
      updated = { ...updated, lastDropChatAt: now }
    }

    if (nearestD <= NPC_DROP_CLAIM_M && !updated.claimedDropIds.includes(nearest.id)) {
      const claimed = [...updated.claimedDropIds, nearest.id].slice(-12)
      const dropType = Math.max(1, Math.min(5, Math.floor(nearest.dropType) || 1))
      const dropsOpenedByType = incrementDropsOpened(updated.dropsOpenedByType, dropType, 1)
      const hunterLevel = Math.min(HUNTER_RANK_COUNT - 1, computeHunterLevel(dropsOpenedByType))
      const leveled = grantNpcXp(updated, XP_REWARDS.dropOpen + dropType * 4)
      const chestsOpened = totalDropsOpened(dropsOpenedByType)
      const stats: PlayerStats = {
        ...DEFAULT_PLAYER_STATS,
        ...leveled.stats,
        chestsOpened,
        distanceTraveledM: (leveled.stats?.distanceTraveledM ?? 0) + Math.floor(40 + dropType * 25),
      }
      return {
        ...leveled,
        claimedDropIds: claimed,
        moving: false,
        lastMovedAt: now,
        targetDropId: null,
        lat: npc.homeLat,
        lng: npc.homeLng,
        dropsOpenedByType,
        hunterLevel,
        stats,
        gold: leveled.gold + 4 + dropType * 2,
      }
    }
    return updated
  })

  return { npcs: next, dropChats }
}

/** دوای ناردنی دیاری — کەمکردنەوەی نرخی نێرەر + ٪٣٠ بۆ وەرگر */
export function applyNpcGiftTransfer(
  npcs: LiveNpcState[],
  fromUid: string,
  toUid: string,
  goldCost: number,
  diamondCost: number,
): LiveNpcState[] {
  const gCost = Math.max(0, Math.floor(goldCost))
  const dCost = Math.max(0, Math.floor(diamondCost))
  const cutG = Math.floor(gCost * GIFT_RECIPIENT_CUT_PCT)
  const cutD = Math.floor(dCost * GIFT_RECIPIENT_CUT_PCT)
  return npcs.map((n) => {
    if (n.uid === fromUid) {
      if (n.gold < gCost || n.diamond < dCost) return n
      return {
        ...n,
        gold: n.gold - gCost,
        diamond: n.diamond - dCost,
        stats: {
          ...DEFAULT_PLAYER_STATS,
          ...n.stats,
          itemsPurchased: (n.stats?.itemsPurchased ?? 0) + 1,
        },
      }
    }
    if (n.uid === toUid) {
      return {
        ...n,
        gold: n.gold + cutG,
        diamond: n.diamond + cutD,
        stats: {
          ...DEFAULT_PLAYER_STATS,
          ...n.stats,
          giftsReceived: (n.stats?.giftsReceived ?? 0) + 1,
        },
      }
    }
    return n
  })
}

/** دوای ناردنی دیاری — XP بۆ نێرەر بەپێی ئاستی دیاری */
export function applyNpcGiftXp(
  npcs: LiveNpcState[],
  fromUid: string,
  tier: 'basic' | 'mid' | 'vip' = 'basic',
): LiveNpcState[] {
  const xp = tier === 'vip' ? XP_REWARDS.giftVip : tier === 'mid' ? XP_REWARDS.giftMid : XP_REWARDS.giftBasic
  return npcs.map((n) => (n.uid === fromUid ? grantNpcXp(n, xp) : n))
}
