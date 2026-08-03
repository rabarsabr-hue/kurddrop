import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  increment,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { COSMETIC_ITEMS } from '../cosmetics'
import type { Currency, InventoryItem } from './userService'
import { computeTotalWealth } from './userService'
import {
  computeHunterLevel,
  hunterRankForLevel,
  incrementDropsOpened,
  parseDropsOpenedByType,
  type DropsOpenedByType,
} from '../hunterLevel'

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** نزیکترین شاری فڕۆکە بۆ پێگەی یاریزان */
export function nearestFlightCity(lat: number, lng: number): FlightCity {
  let best = FLIGHT_CITIES[0]!
  let bestD = Infinity
  for (const c of FLIGHT_CITIES) {
    const d = haversineKm(lat, lng, c.lat, c.lng)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best
}

function resolveAirdropCityKey(airdropId: string, data: Record<string, unknown>): string {
  if (typeof data.cityKey === 'string' && data.cityKey.trim()) return data.cityKey.trim()
  const m = /^drop_c\d+_t\d+_(.+)$/.exec(airdropId)
  return m?.[1] ?? ''
}

/** دانانی شاری خۆ یەکجار لەسەر پێگەی GPS */
export async function ensureHomeCityKey(uid: string, lat: number, lng: number): Promise<string> {
  if (!uid || !Number.isFinite(lat) || !Number.isFinite(lng)) return ''
  const userRef = doc(db, 'users', uid)
  try {
    const snap = await getDoc(userRef)
    const existing = snap.exists() && typeof snap.data().homeCityKey === 'string'
      ? String(snap.data().homeCityKey).trim()
      : ''
    if (existing) return existing
    const key = nearestFlightCity(lat, lng).key
    await setDoc(userRef, { homeCityKey: key, updatedAt: serverTimestamp() }, { merge: true })
    return key
  } catch (err) {
    console.error('ensureHomeCityKey failed:', err)
    return ''
  }
}

export interface Airdrop {
  id: string
  chestId: number
  dropType: number // 0 = فلاری تایبەتی کەسی، 1-5 = جۆرەکانی خشتەی گشتی
  lat: number
  lng: number
  gold: number
  diamond: number
  /** کەرەستەی فرۆشگا کە لەگەڵ کردنەوە دەبەخشرێت */
  rewardItemIds: number[]
  opened: boolean
  createdBy: string
  createdAtMs: number
  unlockAtMs: number
  despawnAtMs: number
}

export interface DropClaimResult {
  /** باڵانسی نوێی یاریزان */
  gold: number
  diamond: number
  /** بڕی خەڵاتی ئەم درۆپە */
  rewardGold: number
  rewardDiamond: number
  grantedItems: InventoryItem[]
  skippedItemIds: number[]
  /** ژمارەی کردنەوەکان و ئاستی ڕاوکەر دوای ئەم کردنەوەیە */
  dropsOpenedByType: DropsOpenedByType
  hunterLevel: number
  /** ٢× چونکە لە دەرەوەی شاری خۆ کراوەتەوە */
  awayCityBonus: boolean
}

/** کاتی کەوتنەخوارەوەی پەرەشوت — ڕێک ١ خولەک بۆ هەموو جۆرەکان */
export const AIRDROP_FALL_MS = 60_000
const PERSONAL_FLARE_LOCK_MS = 60_000
const PERSONAL_FLARE_DESPAWN_MS = 900_000 // ١٥ خولەک بۆ سندوقی تایبەتی (فلار)

function parseCreatedMs(createdAt: Timestamp | undefined): number {
  return createdAt?.toMillis?.() ?? Date.now()
}

// ══════════════════════════════════════════════════════════════════════════
// ✈️ فڕۆکەی هاوبەشی گشتی — خولی ٢ کاتژمێری جێگیر (UTC+3)
//
// خولەکان: 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, ...
// لە خولەکی ٠ تا ٣٠: فڕۆکە دێت، ٦ درۆپ فڕێدەدات، دەچێتە ڕووسیا.
// لە ٣٠ تا ١٢٠: فڕۆکە ونە تا خولی دواتر.
// ڕێڕەو: ئەمریکا → هەولێر → سلێمانی → هەڵەبجە → کەرکووک → دهۆک → زاخۆ → ڕووسیا
// (بەبێ وێستان و سووڕانەوە — تێپەڕبوونی خێرا + ١ درۆپ لە هەر شار)
// ══════════════════════════════════════════════════════════════════════════

export interface FlightCity {
  key: string
  name: string
  lat: number
  lng: number
}

export const FLIGHT_CITIES: FlightCity[] = [
  { key: 'erbil',        name: 'هەولێر',  lat: 36.1911, lng: 44.0092 },
  { key: 'sulaymaniyah', name: 'سلێمانی', lat: 35.5647, lng: 45.4164 },
  { key: 'halabja',      name: 'هەڵەبجە', lat: 35.1783, lng: 45.9861 },
  { key: 'kirkuk',       name: 'کەرکووک', lat: 35.4681, lng: 44.3922 },
  { key: 'duhok',        name: 'دهۆک',    lat: 36.8642, lng: 42.9903 },
  { key: 'zakho',        name: 'زاخۆ',    lat: 37.1436, lng: 42.6866 },
]

const N = FLIGHT_CITIES.length

/** خولی سەرەکی — هەموو ٢ کاتژمێر */
export const CYCLE_MS = 2 * 3_600_000
/** تەواوی پرۆسەی هاتن + فڕێدان + دەرچوون */
export const ACTIVE_FLIGHT_MS = 30 * 60_000
/** UTC+3 (هەولێر / بەغدا) */
export const SCHEDULE_TZ_OFFSET_MS = 3 * 3_600_000
/**
 * سەرەتای خشتە: ٢٠٢٤-٠١-٠١ کاتژمێر ٠٨:٠٠ی بەیانی بە کاتی ناوخۆیی (UTC+3)
 * = ٢٠٢٤-٠١-٠١ ٠٥:٠٠ UTC
 */
export const SCHEDULE_EPOCH_MS = Date.UTC(2024, 0, 1, 5, 0, 0)

export const USA_APPROACH_MS = 4 * 60_000
export const RUSSIA_EXIT_MS = 4 * 60_000
/** گەشتی نێوان دوو شار — ٥ گەشت بۆ پڕکردنەوەی ٣٠ خولەک */
export const CITY_LEG_MS = (ACTIVE_FLIGHT_MS - USA_APPROACH_MS - RUSSIA_EXIT_MS) / (N - 1)

/** بۆ گونجاندنی UIی کۆن — دۆڕان/سووڕانەوە نییە؛ تەنها تێپەڕبوون */
export const GOVERNORATE_DWELL_MS = 0
export const GOVERNORATE_TRANSIT_MS = CITY_LEG_MS

const AMERICA_BEARING_DEG = 300
const RUSSIA_BEARING_DEG = 350
const APPROACH_DISTANCE_M = 220_000
const EXIT_DISTANCE_M = 220_000
const DROP_SCATTER_RADIUS_M = 1_800

function mulberry32(seed: number) {
  let a = seed | 0
  return function random() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function metersPerDeg(lat: number) {
  return { mLat: 111320, mLng: 111320 * Math.cos((lat * Math.PI) / 180) }
}

function moveByBearing(lat: number, lng: number, bearingDeg: number, distanceM: number) {
  const { mLat, mLng } = metersPerDeg(lat)
  const rad = (bearingDeg * Math.PI) / 180
  return {
    lat: lat + (distanceM * Math.cos(rad)) / mLat,
    lng: lng + (distanceM * Math.sin(rad)) / mLng,
  }
}

function bearingBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export function getCycleIndex(nowMs: number): number {
  return Math.floor((nowMs - SCHEDULE_EPOCH_MS) / CYCLE_MS)
}

export function getCycleStartMs(nowMs: number): number {
  const idx = getCycleIndex(nowMs)
  return SCHEDULE_EPOCH_MS + idx * CYCLE_MS
}

/** جۆری درۆپ بۆ خول: ١→٢→٣→٤→٥→١→… */
export function getDropTypeForCycle(cycleIndex: number): number {
  const safe = ((cycleIndex % 5) + 5) % 5
  return safe + 1
}

/** کاتی فڕێدان لەناو خول: کاتێک فڕۆکە دەگاتە هەر شار */
export const RELEASE_OFFSETS_MS: number[] = FLIGHT_CITIES.map(
  (_, i) => USA_APPROACH_MS + i * CITY_LEG_MS,
)

export interface PlaneState {
  lat: number
  lng: number
  headingDeg: number
  phase: 'fadeIn' | 'transit' | 'fadeOut'
  cityKey: string
  cityName: string
  /** ئایا فڕۆکە لەم خولەدا چالاکە (٠–٣٠ خولەک) */
  active: true
  cycleIndex: number
  dropType: number
}

/**
 * پۆزیشنی فڕۆکە — کارلێکی خاو لە کاتی دیوارەوە.
 * null = فڕۆکە ونە (نێوان خولەکی ٣٠ تا ١٢٠).
 * genesisMs بۆ گونجاندنی پێشوو وەردەگیرێت بەڵام پشتگوێ دەخرێت.
 */
export function computeGlobalPlaneState(_genesisMs: number | null | undefined, nowMs: number): PlaneState | null {
  const cycleIndex = getCycleIndex(nowMs)
  const cycleStart = SCHEDULE_EPOCH_MS + cycleIndex * CYCLE_MS
  const t = nowMs - cycleStart
  if (t < 0 || t >= ACTIVE_FLIGHT_MS) return null

  const dropType = getDropTypeForCycle(cycleIndex)
  const route = FLIGHT_CITIES

  // ١) هاتن لە ئەمریکاوە → هەولێر
  if (t < USA_APPROACH_MS) {
    const first = route[0]
    const p = t / USA_APPROACH_MS
    const start = moveByBearing(first.lat, first.lng, (AMERICA_BEARING_DEG + 180) % 360, APPROACH_DISTANCE_M)
    return {
      lat: start.lat + (first.lat - start.lat) * p,
      lng: start.lng + (first.lng - start.lng) * p,
      headingDeg: AMERICA_BEARING_DEG,
      phase: 'fadeIn',
      cityKey: first.key,
      cityName: first.name,
      active: true,
      cycleIndex,
      dropType,
    }
  }

  let u = t - USA_APPROACH_MS

  // ٢) تێپەڕبوون بەسەر شارەکاندا (بەبێ وێستان)
  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i]
    const to = route[i + 1]
    if (u < CITY_LEG_MS) {
      const p = u / CITY_LEG_MS
      return {
        lat: from.lat + (to.lat - from.lat) * p,
        lng: from.lng + (to.lng - from.lng) * p,
        headingDeg: bearingBetween(from.lat, from.lng, to.lat, to.lng),
        phase: 'transit',
        cityKey: to.key,
        cityName: `${from.name} → ${to.name}`,
        active: true,
        cycleIndex,
        dropType,
      }
    }
    u -= CITY_LEG_MS
  }

  // ٣) دوورکەوتنەوە زاخۆ → ڕووسیا
  const last = route[route.length - 1]
  const p = Math.min(1, u / RUSSIA_EXIT_MS)
  const exit = moveByBearing(last.lat, last.lng, RUSSIA_BEARING_DEG, EXIT_DISTANCE_M * p)
  return {
    lat: exit.lat,
    lng: exit.lng,
    headingDeg: RUSSIA_BEARING_DEG,
    phase: 'fadeOut',
    cityKey: last.key,
    cityName: last.name,
    active: true,
    cycleIndex,
    dropType,
  }
}

function randomCityDropPos(city: FlightCity, seed: number): { lat: number; lng: number } {
  const rand = mulberry32(seed)
  const bearing = rand() * 360
  const distance = 250 + rand() * DROP_SCATTER_RADIUS_M
  return moveByBearing(city.lat, city.lng, bearing, distance)
}

function seededInt(rand: () => number, min: number, max: number): number {
  return Math.floor(min + rand() * (max - min + 1))
}

function pickFromPool(pool: number[], rand: () => number, exclude: Set<number> = new Set()): number | null {
  const available = pool.filter(id => !exclude.has(id))
  if (available.length === 0) return null
  return available[Math.floor(rand() * available.length)] ?? null
}

const GOLD_SHOP_ITEM_IDS = COSMETIC_ITEMS.filter(c => c.curr === 'gold').map(c => c.id)
const DIAMOND_SHOP_ITEM_IDS = COSMETIC_ITEMS.filter(c => c.curr === 'diamond').map(c => c.id)
const CURRENCY_SHOP_ITEM_IDS = [...GOLD_SHOP_ITEM_IDS, ...DIAMOND_SHOP_ITEM_IDS]

export interface DropRewardBundle {
  gold: number
  diamond: number
  rewardItemIds: number[]
}

/** گونجاندن لەگەڵ کۆدی کۆن — خشتەکە ئێستا بە کاتی دیوار (UTC+3) جێگیرە */
export async function ensurePlaneGenesis(): Promise<number> {
  return getCycleStartMs(Date.now())
}

// ══════════════════════════════════════════════════════════════════════════
// 📦 جۆرەکانی درۆپ — زنجیرەیی بەپێی خول (نەک intervalی جیاواز)
// جۆر ١: ٥ق + ١٥و | جۆر ٢: ١٠ق + ٢٠و | … | جۆر ٥: ٢٥ق + ٣٥و
// chestId ↔ erbilChests: 1👑 2💎 3🟣 4🟡 5⚪
// ══════════════════════════════════════════════════════════════════════════

export interface DropTypeDef {
  type: number
  chestId: number
  /** بۆ UI — هەموو جۆرەکان لەسەر هەمان خولی ٢ کاتژمێرین */
  intervalMs: number
  lockMs: number
  despawnMs: number
  /** بڕی زیادەی ئەڵماس بۆ ئەم جۆرە درۆپە */
  bonusDiamondMin: number
  bonusDiamondMax: number
  goldMin: number
  goldMax: number
  diamondMin: number
  diamondMax: number
  label: string
  icon: string
}

export const DROP_TYPE_COOLDOWN_MS = 24 * 3_600_000

export const DROP_TYPES: DropTypeDef[] = [
  { type: 1, chestId: 5, intervalMs: CYCLE_MS, lockMs: 5 * 60_000,  despawnMs: 15 * 60_000, bonusDiamondMin: 50,  bonusDiamondMax: 70,  goldMin: 40,  goldMax: 80,  diamondMin: 3,  diamondMax: 8,   label: 'ئاسایی',   icon: '⚪' },
  { type: 2, chestId: 4, intervalMs: CYCLE_MS, lockMs: 10 * 60_000, despawnMs: 20 * 60_000, bonusDiamondMin: 70,  bonusDiamondMax: 150, goldMin: 80,  goldMax: 150, diamondMin: 8,  diamondMax: 15,  label: 'ناوەند',   icon: '🔵' },
  { type: 3, chestId: 3, intervalMs: CYCLE_MS, lockMs: 15 * 60_000, despawnMs: 25 * 60_000, bonusDiamondMin: 150, bonusDiamondMax: 200, goldMin: 150, goldMax: 280, diamondMin: 15, diamondMax: 30,  label: 'ئاست بەرز', icon: '🟣' },
  { type: 4, chestId: 2, intervalMs: CYCLE_MS, lockMs: 20 * 60_000, despawnMs: 30 * 60_000, bonusDiamondMin: 200, bonusDiamondMax: 300, goldMin: 280, goldMax: 450, diamondMin: 30, diamondMax: 55,  label: 'دەگمەن',   icon: '🟠' },
  { type: 5, chestId: 1, intervalMs: CYCLE_MS, lockMs: 25 * 60_000, despawnMs: 35 * 60_000, bonusDiamondMin: 300, bonusDiamondMax: 500, goldMin: 450, goldMax: 800, diamondMin: 55, diamondMax: 100, label: 'ئەفسانەیی', icon: '🟡' },
]

export function getDropTypeDef(type: number): DropTypeDef | undefined {
  return DROP_TYPES.find(d => d.type === type)
}

/** دروستکردنی خەڵاتی درۆپ بەپێی جۆر — زێڕ/ئەڵماس + کەرەستەی فرۆشگا */
export function generateDropRewardBundle(dropTypeNum: number, seed: number): DropRewardBundle {
  const rand = mulberry32(seed)
  const def = dropTypeNum >= 1 ? getDropTypeDef(dropTypeNum) : undefined

  if (!def) {
    const bonusDiamond = seededInt(rand, 5, 40)
    const gold = seededInt(rand, 20, 60)
    const diamond = seededInt(rand, 2, 6) + bonusDiamond
    const shopItem = pickFromPool(CURRENCY_SHOP_ITEM_IDS, rand)
    return {
      gold,
      diamond,
      rewardItemIds: shopItem != null ? [shopItem] : [],
    }
  }

  const bonusDiamond = seededInt(rand, def.bonusDiamondMin, def.bonusDiamondMax)
  const gold = seededInt(rand, def.goldMin, def.goldMax)
  const diamond = seededInt(rand, def.diamondMin, def.diamondMax) + bonusDiamond
  const rewardItemIds: number[] = []
  const shopItem = pickFromPool(CURRENCY_SHOP_ITEM_IDS, rand)
  if (shopItem != null) rewardItemIds.push(shopItem)

  // ئەفسانەیی: + یەک کەرەستەی دەگمەنی زیادە بە ئەڵماس
  if (def.type === 5) {
    const rareItem = pickFromPool(DIAMOND_SHOP_ITEM_IDS, rand, new Set(rewardItemIds))
    if (rareItem != null) rewardItemIds.push(rareItem)
  }

  return { gold, diamond, rewardItemIds }
}

async function ensureCycleDrops(cycleIndex: number, createdBy: string, now: number): Promise<void> {
  if (cycleIndex < 0) return

  const dropTypeNum = getDropTypeForCycle(cycleIndex)
  const dropType = getDropTypeDef(dropTypeNum)
  if (!dropType) return

  const cycleStart = SCHEDULE_EPOCH_MS + cycleIndex * CYCLE_MS

  await Promise.all(FLIGHT_CITIES.map(async (city, cityIndex) => {
    const releaseMs = cycleStart + RELEASE_OFFSETS_MS[cityIndex]
    if (now < releaseMs) return

    const unlockAtMs = releaseMs + AIRDROP_FALL_MS + dropType.lockMs
    const despawnAtMs = unlockAtMs + dropType.despawnMs
    if (now >= despawnAtMs) return

    const id = `drop_c${cycleIndex}_t${dropType.type}_${city.key}`
    const ref = doc(db, 'airdrops', id)
    const existing = await getDoc(ref)

    const seed = cycleIndex * 1_000_003 + dropType.type * 97_733 + cityIndex * 1_319 + 17
    const rewards = generateDropRewardBundle(dropType.type, seed ^ 0x9e3779b9)

    if (existing.exists()) {
      const data = existing.data()
      const needsRewardBackfill =
        (Number(data.gold) || 0) === 0
        && (Number(data.diamond) || 0) === 0
        && (!Array.isArray(data.rewardItemIds) || data.rewardItemIds.length === 0)
      const needsMetaRepair =
        data.chestId !== dropType.chestId
        || data.dropType !== dropType.type
        || data.unlockAtMs !== unlockAtMs
        || data.despawnAtMs !== despawnAtMs
      if (needsMetaRepair || needsRewardBackfill) {
        try {
          const patch: Record<string, unknown> = {}
          if (needsMetaRepair) {
            patch.chestId = dropType.chestId
            patch.dropType = dropType.type
            patch.unlockAtMs = unlockAtMs
            patch.despawnAtMs = despawnAtMs
          }
          if (needsRewardBackfill) {
            patch.gold = rewards.gold
            patch.diamond = rewards.diamond
            patch.rewardItemIds = rewards.rewardItemIds
          }
          await setDoc(ref, patch, { merge: true })
        } catch (err) {
          console.error(`Failed to repair scheduled drop ${id}:`, err)
        }
      }
      return
    }

    const pos = randomCityDropPos(city, seed)

    try {
      await setDoc(ref, {
        chestId: dropType.chestId,
        dropType: dropType.type,
        lat: pos.lat,
        lng: pos.lng,
        cityKey: city.key,
        cityName: city.name,
        cycleIndex,
        gold: rewards.gold,
        diamond: rewards.diamond,
        rewardItemIds: rewards.rewardItemIds,
        opened: false,
        openedBy: null,
        createdBy,
        createdAt: serverTimestamp(),
        createdAtMs: releaseMs,
        unlockAtMs,
        despawnAtMs,
      }, { merge: true })
    } catch (err) {
      console.error(`Failed to ensure scheduled drop ${id}:`, err)
    }
  }))
}

/**
 * دروستکردنی درۆپەکانی خولی ئێستا (+ پێشوو ئەگەر هێشتا لەسەر نەخشە ماون).
 * genesisMs بۆ گونجاندن وەردەگیرێت بەڵام پشتگوێ دەخرێت.
 */
export async function ensureAllScheduledDrops(_genesisMs: number | undefined, createdBy: string): Promise<void> {
  const now = Date.now()
  const cycleIndex = getCycleIndex(now)
  const cycles = [cycleIndex, cycleIndex - 1].filter(i => i >= 0)
  await Promise.all(cycles.map(i => ensureCycleDrops(i, createdBy, now)))
}

// ══════════════════════════════════════════════════════════════════════════
// 🔫 فلاری کەسی
// ══════════════════════════════════════════════════════════════════════════

export async function createPersonalAirdrop(uid: string, lat: number, lng: number): Promise<string> {
  const pool = [
    { chestId: 5, dropType: 0 },
    { chestId: 4, dropType: 0 },
  ]
  const picked = pool[Math.floor(Math.random() * pool.length)]
  const seed = (Date.now() ^ Math.floor(lat * 1e6) ^ Math.floor(lng * 1e6)) >>> 0
  const rewards = generateDropRewardBundle(0, seed)
  const ref = doc(collection(db, 'airdrops'))
  const createdAtMs = Date.now()
  await setDoc(ref, {
    chestId: picked.chestId,
    dropType: picked.dropType,
    lat,
    lng,
    gold: rewards.gold,
    diamond: rewards.diamond,
    rewardItemIds: rewards.rewardItemIds,
    opened: false,
    openedBy: null,
    createdBy: uid,
    createdAt: serverTimestamp(),
    createdAtMs,
    unlockAtMs: createdAtMs + AIRDROP_FALL_MS + PERSONAL_FLARE_LOCK_MS,
    despawnAtMs: createdAtMs + AIRDROP_FALL_MS + PERSONAL_FLARE_LOCK_MS + PERSONAL_FLARE_DESPAWN_MS,
  })
  return ref.id
}

// ══════════════════════════════════════════════════════════════════════════
// 🎁 وەرگرتن و بینینی درۆپەکان
// ══════════════════════════════════════════════════════════════════════════

function parseClaimInventory(raw: unknown): InventoryItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
    .map(x => ({
      id: Number(x.id) || 0,
      name: String(x.name ?? ''),
      icon: String(x.icon ?? '◈'),
      desc: String(x.desc ?? ''),
      price: Number(x.price) || 0,
      curr: (x.curr === 'gold' || x.curr === 'diamond' ? x.curr : 'gold') as Currency,
      active: Boolean(x.active),
    }))
    .filter(x => x.id > 0)
}

export async function claimAirdrop(
  uid: string,
  airdropId: string,
): Promise<DropClaimResult> {
  const airdropRef = doc(db, 'airdrops', airdropId)
  const userRef = doc(db, 'users', uid)

  return runTransaction(db, async (transaction) => {
    const airdropSnap = await transaction.get(airdropRef)
    const userSnap = await transaction.get(userRef)

    if (!airdropSnap.exists()) throw new Error('درۆپەکە نەدۆزرایەوە')
    const airdrop = airdropSnap.data()
    if (airdrop.opened) throw new Error('ئەم درۆپە پێشتر کراوەتەوە')

    const createdMs = typeof airdrop.createdAtMs === 'number' ? airdrop.createdAtMs : parseCreatedMs(airdrop.createdAt as Timestamp | undefined)
    const unlockAtMs = typeof airdrop.unlockAtMs === 'number'
      ? airdrop.unlockAtMs
      : createdMs + AIRDROP_FALL_MS + 60_000
    const despawnAtMs = typeof airdrop.despawnAtMs === 'number'
      ? airdrop.despawnAtMs
      : unlockAtMs + 900_000
    if (Date.now() > despawnAtMs) throw new Error('کاتی ئەم درۆپە تەواو بووە')
    if (Date.now() < unlockAtMs) {
      const secsLeft = Math.ceil((unlockAtMs - Date.now()) / 1000)
      const mm = Math.floor(secsLeft / 60).toString().padStart(2, '0')
      const ss = (secsLeft % 60).toString().padStart(2, '0')
      throw new Error(`🔒 ئەم درۆپە هێشتا قوفڵ کراوە! چاوەڕوان بە ${mm}:${ss}`)
    }

    const dropType = typeof airdrop.dropType === 'number' ? airdrop.dropType : 0
    const expectedChestId = resolveChestId(airdrop.chestId, dropType)
    const user = userSnap.exists() ? userSnap.data() : {}

    const cooldowns = { ...((user.dropTypeCooldowns ?? {}) as Record<string, number>) }
    if (dropType >= 1) {
      const lastOpened = cooldowns[String(dropType)]
      if (typeof lastOpened === 'number') {
        const remain = DROP_TYPE_COOLDOWN_MS - (Date.now() - lastOpened)
        if (remain > 0) {
          throw new Error(formatDropCooldownMessage(dropType, remain))
        }
      }
    }

    // ئەگەر درۆپی کۆن بێت (بێ زێڕ/ئەڵماس/کەرەستە)، خەڵات لەسەر id دروست بکە
    let rewardGold = Number(airdrop.gold) || 0
    let rewardDiamond = Number(airdrop.diamond) || 0
    let rewardItemIds: number[] = Array.isArray(airdrop.rewardItemIds)
      ? airdrop.rewardItemIds.map((n: unknown) => Number(n)).filter((n: number) => n > 0)
      : []
    if (rewardGold === 0 && rewardDiamond === 0 && rewardItemIds.length === 0) {
      const fallbackSeed = (airdropId.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) * 2654435761) >>> 0
      const bundle = generateDropRewardBundle(dropType, fallbackSeed)
      rewardGold = bundle.gold
      rewardDiamond = bundle.diamond
      rewardItemIds = bundle.rewardItemIds
    }

    const gold = (Number(user.gold) || 0) + rewardGold
    const diamond = (Number(user.diamond) || 0) + rewardDiamond

    let inventory = parseClaimInventory(user.inventory)
    const capacity = 5
    const grantedItems: InventoryItem[] = []
    const skippedItemIds: number[] = []

    for (const itemId of rewardItemIds) {
      const def = COSMETIC_ITEMS.find(c => c.id === itemId)
      if (!def) {
        skippedItemIds.push(itemId)
        continue
      }
      if (inventory.some(i => i.id === itemId)) {
        skippedItemIds.push(itemId)
        continue
      }
      if (inventory.length >= capacity) {
        skippedItemIds.push(itemId)
        continue
      }
      const granted: InventoryItem = {
        id: def.id,
        name: def.name,
        icon: def.icon,
        desc: def.desc,
        price: def.price,
        curr: def.curr,
        active: false,
      }
      inventory = [...inventory, granted]
      grantedItems.push(granted)
    }

    transaction.update(airdropRef, {
      opened: true,
      openedBy: uid,
      openedAt: serverTimestamp(),
      chestId: expectedChestId,
      dropType,
      gold: rewardGold,
      diamond: rewardDiamond,
      rewardItemIds,
    })

    const prevDrops = parseDropsOpenedByType(user.dropsOpenedByType)
    const dropCityKey = resolveAirdropCityKey(airdropId, airdrop as Record<string, unknown>)
    let homeCityKey = typeof user.homeCityKey === 'string' ? user.homeCityKey.trim() : ''
    let awayCityBonus = false
    let openWeight = 1
    if (dropType >= 1 && dropType <= 5 && dropCityKey) {
      if (!homeCityKey) {
        homeCityKey = dropCityKey
      } else if (homeCityKey !== dropCityKey) {
        awayCityBonus = true
        openWeight = 2
      }
    }
    const dropsOpenedByType = dropType >= 1 && dropType <= 5
      ? incrementDropsOpened(prevDrops, dropType, openWeight)
      : prevDrops
    const hunterLevel = computeHunterLevel(dropsOpenedByType)
    const hunterRankName = hunterRankForLevel(hunterLevel).name

    const userUpdate: Record<string, unknown> = {
      gold,
      diamond,
      inventory,
      dropsOpenedByType,
      hunterLevel,
      hunterRankName,
      totalWealth: increment(computeTotalWealth(rewardGold, rewardDiamond)),
      updatedAt: serverTimestamp(),
    }
    if (homeCityKey && homeCityKey !== (typeof user.homeCityKey === 'string' ? user.homeCityKey : '')) {
      userUpdate.homeCityKey = homeCityKey
    }
    if (dropType >= 1) {
      cooldowns[String(dropType)] = Date.now()
      userUpdate.dropTypeCooldowns = cooldowns
    }
    transaction.set(userRef, userUpdate, { merge: true })

    return {
      gold,
      diamond,
      rewardGold,
      rewardDiamond,
      grantedItems,
      skippedItemIds,
      dropsOpenedByType,
      hunterLevel,
      awayCityBonus,
    }
  })
}

export function formatDropCooldownMessage(dropType: number, remainMs: number): string {
  const h = Math.floor(remainMs / 3_600_000)
  const m = Math.max(1, Math.ceil((remainMs % 3_600_000) / 60_000))
  const typeName = ({
    1: '⚪ ئاسایی',
    2: '🔵 ناوەند',
    3: '🟣 ئاست بەرز',
    4: '🟠 دەگمەن',
    5: '🟡 ئەفسانەیی',
  } as Record<number, string>)[dropType] ?? `جۆری ${dropType}`
  return h > 0
    ? `⏳ تۆ پێشتر درۆپی ${typeName}ت کردووەتەوە! دەبێت ${h} کاتژمێر و ${m} خولەک چاوەڕێ بکەیت.`
    : `⏳ تۆ پێشتر درۆپی ${typeName}ت کردووەتەوە! دەبێت ${m} خولەک چاوەڕێ بکەیت.`
}

export function getDropTypeCooldownRemaining(cooldowns: Record<string, number> | undefined, dropType: number, nowMs = Date.now()): number {
  if (dropType < 1 || !cooldowns) return 0
  const lastOpened = cooldowns[String(dropType)]
  if (typeof lastOpened !== 'number') return 0
  return Math.max(0, DROP_TYPE_COOLDOWN_MS - (nowMs - lastOpened))
}

export function resolveChestId(chestId: unknown, dropType: unknown): number {
  if (typeof dropType === 'number' && dropType >= 1) {
    const def = getDropTypeDef(dropType)
    if (def) return def.chestId
  }
  if (typeof chestId === 'number' && chestId >= 1 && chestId <= 5) return chestId
  return 5
}

export function subscribeToAirdrops(onUpdate: (airdrops: Airdrop[]) => void): () => void {
  return onSnapshot(collection(db, 'airdrops'), (snap) => {
    const airdrops: Airdrop[] = []
    snap.forEach(docSnap => {
      const data = docSnap.data()
      if (data.opened) return

      const createdAtMs = typeof data.createdAtMs === 'number'
        ? data.createdAtMs
        : parseCreatedMs(data.createdAt as Timestamp | undefined)
      const dropType = typeof data.dropType === 'number' ? data.dropType : 0
      const typeDef = dropType >= 1 ? getDropTypeDef(dropType) : undefined
      const unlockAtMs = typeof data.unlockAtMs === 'number'
        ? data.unlockAtMs
        : createdAtMs + AIRDROP_FALL_MS + (typeDef?.lockMs ?? 60_000)
      const despawnAtMs = typeof data.despawnAtMs === 'number'
        ? data.despawnAtMs
        : unlockAtMs + (typeDef?.despawnMs ?? 900_000)

      if (Date.now() > despawnAtMs) {
        deleteDoc(docSnap.ref).catch(() => {})
        return
      }

      const rewardItemIds = Array.isArray(data.rewardItemIds)
        ? data.rewardItemIds.map((n: unknown) => Number(n)).filter((n: number) => n > 0)
        : []

      airdrops.push({
        id: docSnap.id,
        chestId: resolveChestId(data.chestId, dropType),
        dropType,
        lat: data.lat,
        lng: data.lng,
        gold: data.gold ?? 0,
        diamond: data.diamond ?? 0,
        rewardItemIds,
        opened: false,
        createdBy: data.createdBy ?? '',
        createdAtMs,
        unlockAtMs,
        despawnAtMs,
      })
    })
    onUpdate(airdrops)
  }, err => console.error('Airdrops listener failed:', err))
}
