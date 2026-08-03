/** پاکێجەکانی کڕینی زێڕ و ئەڵماس — هەردووکیان بە USD */

import goldPack1 from './imports/gold_pack_1.webp'
import goldPack2 from './imports/gold_pack_2.webp'
import goldPack3 from './imports/gold_pack_3.webp'
import goldPack4 from './imports/gold_pack_4.webp'
import goldPack5 from './imports/gold_pack_5.webp'
import goldPack6 from './imports/gold_pack_6.webp'
import gemPack1 from './imports/gems_pack_1.webp'
import gemPack2 from './imports/gems_pack_2.webp'
import gemPack3 from './imports/gems_pack_3.webp'
import gemPack4 from './imports/gems_pack_4.webp'
import gemPack5 from './imports/gems_pack_5.webp'
import gemPack6 from './imports/gems_pack_6.webp'

export type GoldPackDef = {
  id: string
  tier: 1 | 2 | 3 | 4 | 5 | 6
  gold: number
  /** نرخ بە دۆلاری ئەمریکی */
  usd: number
  image: string
  badge?: string
}

export type GemPackDef = {
  id: string
  tier: 1 | 2 | 3 | 4 | 5 | 6
  gems: number
  /** نرخ بە دۆلاری ئەمریکی */
  usd: number
  image: string
  badge?: string
}

/** ٦ پاکێجی زێڕ — لە کەمەوە بۆ زۆر، نرخ بە USD */
export const GOLD_STORE_PACKS: GoldPackDef[] = [
  { id: 'gold_1', tier: 1, gold: 500, usd: 4.99, image: goldPack1 },
  { id: 'gold_2', tier: 2, gold: 1_500, usd: 9.99, image: goldPack2 },
  { id: 'gold_3', tier: 3, gold: 5_000, usd: 19.99, image: goldPack3, badge: 'باشترین' },
  { id: 'gold_4', tier: 4, gold: 12_000, usd: 49.99, image: goldPack4 },
  { id: 'gold_5', tier: 5, gold: 35_000, usd: 99.99, image: goldPack5, badge: 'بەهادار' },
  { id: 'gold_6', tier: 6, gold: 100_000, usd: 199.99, image: goldPack6, badge: 'شاهانە' },
]

/** ٦ پاکێجی ئەڵماس — لە کەمەوە بۆ زۆر، نرخ بە USD */
export const GEM_STORE_PACKS: GemPackDef[] = [
  { id: 'gem_1', tier: 1, gems: 100, usd: 4.99, image: gemPack1 },
  { id: 'gem_2', tier: 2, gems: 550, usd: 9.99, image: gemPack2 },
  { id: 'gem_3', tier: 3, gems: 1_200, usd: 19.99, image: gemPack3, badge: 'باشترین' },
  { id: 'gem_4', tier: 4, gems: 2_800, usd: 49.99, image: gemPack4 },
  { id: 'gem_5', tier: 5, gems: 7_500, usd: 99.99, image: gemPack5, badge: 'بەهادار' },
  { id: 'gem_6', tier: 6, gems: 18_000, usd: 199.99, image: gemPack6, badge: 'شاهانە' },
]

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/** ئایکۆنی سەرەکی هێدەر — هەمان وێنەی پاکێجی یەکەم */
export const GOLD_HEADER_ICON = GOLD_STORE_PACKS[0].image
export const GEM_HEADER_ICON = GEM_STORE_PACKS[0].image

/** ئایکۆنی پاکێجی ٦ (شاهانە) — بۆ کارگە نیشتمانییەکان لەسەر نەخشە */
export const GOLD_PACK_6_ICON = GOLD_STORE_PACKS[5].image
export const GEM_PACK_6_ICON = GEM_STORE_PACKS[5].image

/** هەموو وێنەکانی پاکێجەکانی زێڕ/ئەڵماس — بۆ preload */
export const ALL_CURRENCY_PACK_IMAGES: string[] = [
  ...GOLD_STORE_PACKS.map(p => p.image),
  ...GEM_STORE_PACKS.map(p => p.image),
]

/** پێشبارکردنی خێرا — decode sync بۆ یەکەم وێنەکان */
export function preloadCurrencyPackImages(): void {
  if (typeof window === 'undefined') return
  ALL_CURRENCY_PACK_IMAGES.forEach((src, i) => {
    const img = new Image()
    img.decoding = i < 4 ? 'sync' : 'async'
    if (i < 4) {
      try { (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high' } catch { /* ignore */ }
    }
    img.src = src
  })
}
