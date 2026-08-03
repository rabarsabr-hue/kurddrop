/** کارگە نیشتمانییەکان — یەک زێڕ + یەک ئەڵماس بۆ هەر شار، لە دەرەوەی سنوور */
import { FLIGHT_CITIES, type FlightCity } from '../services/airdropService'

/** سنووری شار (مەتر) — لێرە جێگیر کراوە بۆ دووربوون لە importـی خولاوەی appHelpers */
const CITY_AIRSPACE_RADIUS_M: Record<string, number> = {
  erbil: 14_000,
  sulaymaniyah: 12_000,
  halabja: 8_000,
  kirkuk: 12_000,
  duhok: 10_000,
  zakho: 8_000,
}

export type FactoryKind = 'gold' | 'diamond'
export type FactoryCityKey =
  | 'erbil'
  | 'sulaymaniyah'
  | 'kirkuk'
  | 'duhok'
  | 'halabja'
  | 'zakho'

export interface NationalFactory {
  id: string
  cityKey: FactoryCityKey
  cityName: string
  kind: FactoryKind
  lat: number
  lng: number
  /** ژمارەی ناو شار (١…n) */
  indexInCity: number
}

/** زێڕ: ١ لە خولەکێک · ئەڵماس: ١ لە ٥ خولەک */
export const FACTORY_GOLD_INTERVAL_MS = 60_000
export const FACTORY_DIAMOND_INTERVAL_MS = 5 * 60_000

/** سنووری ٢٤ کاتژمێر — بڕی وەرگیراو (کۆکردنەوە) */
export const FACTORY_GOLD_DAILY_CAP = 50
export const FACTORY_DIAMOND_DAILY_CAP = 15

/** ناوی کۆن بۆ گونجاندن لەگەڵ UIـی پێشوو */
export const FACTORY_GOLD_DAILY_COLLECTS = FACTORY_GOLD_DAILY_CAP
export const FACTORY_DIAMOND_DAILY_COLLECTS = FACTORY_DIAMOND_DAILY_CAP

/** بەرهەمهێنان بێ سنوورە — ئەم نرخانە تەنها بۆ گونجاندنی کۆدە کۆنەکانن */
export const FACTORY_GOLD_MAX_PENDING = Number.POSITIVE_INFINITY
export const FACTORY_DIAMOND_MAX_PENDING = Number.POSITIVE_INFINITY

type CityPlan = { cityKey: FactoryCityKey; gold: number; diamond: number }

/** هەموو شارەکان: ١ کارگەی زێڕ + ١ کارگەی ئەڵماس */
const CITY_PLANS: CityPlan[] = [
  { cityKey: 'erbil', gold: 1, diamond: 1 },
  { cityKey: 'sulaymaniyah', gold: 1, diamond: 1 },
  { cityKey: 'kirkuk', gold: 1, diamond: 1 },
  { cityKey: 'duhok', gold: 1, diamond: 1 },
  { cityKey: 'halabja', gold: 1, diamond: 1 },
  { cityKey: 'zakho', gold: 1, diamond: 1 },
]

const EXPECTED_FACTORY_COUNT = CITY_PLANS.reduce((n, p) => n + p.gold + p.diamond, 0)

function cityByKey(key: FactoryCityKey): FlightCity {
  const c = FLIGHT_CITIES.find(x => x.key === key)
  if (!c) throw new Error(`City missing: ${key}`)
  return c
}

function mulberry32(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function offsetLatLng(lat: number, lng: number, northM: number, eastM: number) {
  const mLat = 111_320
  const mLng = 111_320 * Math.cos((lat * Math.PI) / 180)
  return {
    lat: lat + northM / mLat,
    lng: lng + eastM / Math.max(1e-6, mLng),
  }
}

/** دەرەوەی سنووری شار — بە خڕی و هەڕەمەکی کەم */
function placeOutsideCity(
  city: FlightCity,
  cityKey: FactoryCityKey,
  slot: number,
  totalInCity: number,
  kind: FactoryKind,
) {
  const rng = mulberry32(
    (cityKey.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0) * 131)
    + slot * 97
    + (kind === 'gold' ? 11 : 29),
  )
  const cityR = CITY_AIRSPACE_RADIUS_M[cityKey] ?? 10_000
  // دوورتر لە سنووری شار: +٥–١٠ کم
  const distM = cityR + 5_000 + rng() * 5_000
  const baseAngle = (slot / Math.max(1, totalInCity)) * Math.PI * 2
  const jitter = (rng() - 0.5) * (Math.PI * 2) / Math.max(6, totalInCity * 1.8)
  const angle = baseAngle + jitter
  const north = Math.cos(angle) * distM
  const east = Math.sin(angle) * distM
  return offsetLatLng(city.lat, city.lng, north, east)
}

function buildFactories(): NationalFactory[] {
  const out: NationalFactory[] = []
  for (const plan of CITY_PLANS) {
    const city = cityByKey(plan.cityKey)
    const totalInCity = plan.gold + plan.diamond
    let slot = 0
    const push = (kind: FactoryKind, count: number) => {
      for (let i = 0; i < count; i++) {
        const pos = placeOutsideCity(city, plan.cityKey, slot, totalInCity, kind)
        slot += 1
        out.push({
          id: `nf_${plan.cityKey}_${kind}_${i + 1}`,
          cityKey: plan.cityKey,
          cityName: city.name,
          kind,
          lat: pos.lat,
          lng: pos.lng,
          indexInCity: i + 1,
        })
      }
    }
    push('gold', plan.gold)
    push('diamond', plan.diamond)
  }
  if (out.length !== EXPECTED_FACTORY_COUNT) {
    console.warn(`[factories] expected ${EXPECTED_FACTORY_COUNT}, got ${out.length}`)
  }
  return out
}

export const NATIONAL_FACTORIES: NationalFactory[] = buildFactories()

export const NATIONAL_FACTORY_BY_ID: Record<string, NationalFactory> = NATIONAL_FACTORIES.reduce(
  (acc, f) => {
    acc[f.id] = f
    return acc
  },
  {} as Record<string, NationalFactory>,
)

export function factoryLabel(f: NationalFactory): string {
  return f.kind === 'gold'
    ? `کارگەی زێڕی ${f.cityName}`
    : `کارگەی ئەڵماسی ${f.cityName}`
}

export function factoryCityName(cityKey: string): string {
  return FLIGHT_CITIES.find(c => c.key === cityKey)?.name ?? cityKey
}

/** لە زووم‌ئاوت وون نابن — تەنها بچووک دەبنەوە */
export const FACTORY_MIN_ZOOM = 2

/** قەبارەی بینراو بەپێی زووم — لە زووم‌ئاوت بچووک دەبێتەوە (ناگەورە بێت، وون نەبێت) */
export function factoryVisualScaleForZoom(zoom: number): number {
  const z = Number(zoom) || 0
  if (z >= 14) return 1
  if (z <= 6) return 0.32
  // ٦ → ٠٫٣٢ · ١٤ → ١
  return 0.32 + ((z - 6) / (14 - 6)) * 0.68
}
