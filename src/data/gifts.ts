/**
 * VIP / donate gift static config.
 * GIF paths are public URLs under `/gifts/*` (served from `public/gifts/`) —
 * never import GIF binaries into the JS bundle.
 */

export type DonateItemId =
  | 'tomato' | 'egg' | 'tea' | 'coffee' | 'flower'
  | 'fire' | 'football' | 'heart' | 'thunder' | 'crown'
  | 'lion' | 'sport_car' | 'galaxy' | 'private_jet' | 'castle'
  | 'diamond_ocean' | 'dragon' | 'yacht' | 'golden_angel' | 'coin_shower'

export type DonateItemTier = 'basic' | 'mid' | 'vip'

export type DonateItemDef = {
  id: DonateItemId
  label: string
  emoji: string
  goldPrice: number
  diamondPrice: number
  tier: DonateItemTier
}

export type GiftPathStyle = 'comic' | 'wealth' | 'neon' | 'soft'

export const DONATE_HOLD_MS = 5_000

/** ١٠ چرکە — گەورەکردنی کارەکتەری بەخشیار */
export const PREMIUM_GIFT_SENDER_BOOST_MS = 10_000
export const PREMIUM_GIFT_SENDER_SCALE = 1.85
export const PREMIUM_GIFT_SENDER_Z_OFFSET = 99998
export const PREMIUM_GIFT_GROW_MS = 15_000
/** ٪٣٠ ی نرخی هەموو دیارییەک — دەچێت بۆ وەرگر */
export const GIFT_RECIPIENT_CUT_PCT = 0.3
export const MAP_AMBIENT_GIFT_MS = 10_000

export const DONATE_ITEM_STAY_MS = DONATE_HOLD_MS
export const DONATE_THUNDER_MS = DONATE_HOLD_MS
export const DONATE_BURST_MS = DONATE_HOLD_MS
export const DONATE_VIP_STAY_MS = DONATE_HOLD_MS

export const DONATE_FLIGHT_MIN_MS = 3_000
export const DONATE_FLIGHT_MAX_MS = 5_000
export const DONATE_FLIGHT_HARD_MAX_MS = 10_000
export const DONATE_FLIGHT_SPEED_MPS = 500

export const GIFT_FLY_ICON_PX = 27
export const GIFT_OVERLAY_Z = 9_999_999
export const GIFT_PATH_FADE_MS = 450

/**
 * زنجیرەی نرخ: دەستپێک × ٪٢٠، پاشان ٪٢٥، ٪٣٠، ٪٣٥، ٪٤٠ …
 * هەر هەنگاوێک لەسەر نرخی پێشوو حساب دەکرێت.
 */
export function buildDonatePriceLadder(start: number, count: number): number[] {
  const out: number[] = []
  let price = Math.max(1, Math.round(start))
  for (let i = 0; i < count; i++) {
    out.push(price)
    const pct = 20 + i * 5 // 20, 25, 30, 35, 40, …
    price = Math.max(price + 1, Math.round(price * (1 + pct / 100)))
  }
  return out
}

const GOLD_DONATE_PRICES = buildDonatePriceLadder(50, 10)
const DIAMOND_DONATE_PRICES = buildDonatePriceLadder(100, 10)

/**
 * Realistic VIP showcase GIFs — public folder paths only.
 * Vite serves these from `public/gifts/` without bundling or watching binary assets in node_modules.
 */
export const VIP_GIFT_GIF: Record<DonateItemId, string | undefined> = {
  tomato: undefined,
  egg: undefined,
  tea: undefined,
  coffee: undefined,
  flower: undefined,
  fire: undefined,
  football: undefined,
  heart: undefined,
  thunder: undefined,
  crown: undefined,
  coin_shower: '/gifts/coin-rain.gif',
  golden_angel: '/gifts/golden-angel.gif',
  lion: '/gifts/lion.gif',
  dragon: '/gifts/dragon.gif',
  diamond_ocean: '/gifts/diamond-ocean.gif',
  sport_car: '/gifts/sport-car.gif',
  yacht: '/gifts/yacht.gif',
  private_jet: '/gifts/private-jet.gif',
  castle: '/gifts/castle.gif',
  galaxy: '/gifts/galaxy.gif',
}

export const DONATE_ITEMS: DonateItemDef[] = [
  // زێڕ — لە ٥٠ دەست پێدەکات، هەر دانەیەک ٪٢٠ / ٪٢٥ / ٪٣٠ / … زیاد
  { id: 'egg', label: 'هێلکە', emoji: '🥚', goldPrice: GOLD_DONATE_PRICES[0], diamondPrice: 0, tier: 'basic' },
  { id: 'tomato', label: 'تەماتە', emoji: '🍅', goldPrice: GOLD_DONATE_PRICES[1], diamondPrice: 0, tier: 'basic' },
  { id: 'tea', label: 'چا', emoji: '🍵', goldPrice: GOLD_DONATE_PRICES[2], diamondPrice: 0, tier: 'basic' },
  { id: 'coffee', label: 'قاوە', emoji: '☕', goldPrice: GOLD_DONATE_PRICES[3], diamondPrice: 0, tier: 'basic' },
  { id: 'flower', label: 'گوڵ', emoji: '🌹', goldPrice: GOLD_DONATE_PRICES[4], diamondPrice: 0, tier: 'basic' },
  { id: 'fire', label: 'ئاگر', emoji: '🔥', goldPrice: GOLD_DONATE_PRICES[5], diamondPrice: 0, tier: 'basic' },
  { id: 'football', label: 'شووتی', emoji: '⚽', goldPrice: GOLD_DONATE_PRICES[6], diamondPrice: 0, tier: 'mid' },
  { id: 'heart', label: 'تەقینەوەی دڵ', emoji: '💖', goldPrice: GOLD_DONATE_PRICES[7], diamondPrice: 0, tier: 'mid' },
  { id: 'thunder', label: 'هەوری بروسکە', emoji: '⛈️', goldPrice: GOLD_DONATE_PRICES[8], diamondPrice: 0, tier: 'mid' },
  { id: 'crown', label: 'تاج', emoji: '👑', goldPrice: GOLD_DONATE_PRICES[9], diamondPrice: 0, tier: 'mid' },
  // ئەڵماس — هەمان لۆژیک، لە ١٠٠ دەست پێدەکات
  { id: 'coin_shower', label: 'بارانی زێڕ', emoji: '💰', goldPrice: 0, diamondPrice: DIAMOND_DONATE_PRICES[0], tier: 'vip' },
  { id: 'golden_angel', label: 'فریشتەی زێڕین', emoji: '🧚‍♀️', goldPrice: 0, diamondPrice: DIAMOND_DONATE_PRICES[1], tier: 'vip' },
  { id: 'lion', label: 'شێر', emoji: '🦁', goldPrice: 0, diamondPrice: DIAMOND_DONATE_PRICES[2], tier: 'vip' },
  { id: 'dragon', label: 'ئەژدیها', emoji: '🐉', goldPrice: 0, diamondPrice: DIAMOND_DONATE_PRICES[3], tier: 'vip' },
  { id: 'diamond_ocean', label: 'دەریای ئەڵماس', emoji: '💎', goldPrice: 0, diamondPrice: DIAMOND_DONATE_PRICES[4], tier: 'vip' },
  { id: 'sport_car', label: 'ئۆتۆمبێلی وەرزشی', emoji: '🏎️', goldPrice: 0, diamondPrice: DIAMOND_DONATE_PRICES[5], tier: 'vip' },
  { id: 'yacht', label: 'یەختی شاهانە', emoji: '🛥️', goldPrice: 0, diamondPrice: DIAMOND_DONATE_PRICES[6], tier: 'vip' },
  { id: 'private_jet', label: 'فڕۆکەی تایبەت', emoji: '✈️', goldPrice: 0, diamondPrice: DIAMOND_DONATE_PRICES[7], tier: 'vip' },
  { id: 'castle', label: 'کۆشکی شاهانە', emoji: '🏰', goldPrice: 0, diamondPrice: DIAMOND_DONATE_PRICES[8], tier: 'vip' },
  { id: 'galaxy', label: 'ئاسمان / گەلەستێرە', emoji: '🌌', goldPrice: 0, diamondPrice: DIAMOND_DONATE_PRICES[9], tier: 'vip' },
]

export const DONATE_BY_ID: Record<DonateItemId, DonateItemDef> = DONATE_ITEMS.reduce((acc, item) => {
  acc[item.id] = item
  return acc
}, {} as Record<DonateItemId, DonateItemDef>)

export function isAmbientMapGift(itemId: DonateItemId): boolean {
  return DONATE_BY_ID[itemId]?.tier === 'vip'
}

export function isPremiumGiftItem(itemId: DonateItemId): boolean {
  return DONATE_BY_ID[itemId]?.tier === 'vip'
}

export function giftPathStyleForItem(itemId: DonateItemId): GiftPathStyle {
  const tier = DONATE_BY_ID[itemId]?.tier ?? 'basic'
  if (tier === 'vip') return 'wealth'
  if (tier === 'mid') return 'neon'
  if (itemId === 'tomato' || itemId === 'egg' || itemId === 'fire') return 'comic'
  return 'soft'
}
