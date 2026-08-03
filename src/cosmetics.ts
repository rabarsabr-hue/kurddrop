import type { InventoryItem } from './services/userService'

/** جۆری کەرەستەی جوانکاری — تەنها یەک دانە لە هەر سلۆتێک دەتوانرێت چالاک بێت */
export type CosmeticSlot = 'avatar' | 'border' | 'title' | 'trail' | 'headwear' | 'accessory' | 'mapAura' | 'emote' | 'companion'

export interface MapAuraFx {
  auraClass: string
  color: string
  glowColor: string
}

export interface CompanionFx {
  companionClass: string
  emoji: string
}

export type TrailFxKind = 'ember' | 'spark' | 'glyph' | 'petal' | 'wave' | 'snow'

export type HeadwearKind =
  | 'jamadani-red'
  | 'jamadani-bw'
  | 'silk-shawl'
  | 'folk-hat'
  | 'medes-crown'
  | 'stealth-veil'

export type AccessoryKind =
  | 'khanjar-belt'
  | 'regal-cape'
  | 'bandolier'

export interface TrailFx {
  kind: TrailFxKind
  color: string
  fillColor: string
  emoji?: string
  radius?: number
}

/** جێندەری جلوبەرگ بۆ فرۆشگای پیاوان / ئافرەتان */
export type WearGender = 'male' | 'female' | 'unisex'

export interface CosmeticDef {
  id: number
  slot: CosmeticSlot
  name: string
  desc: string
  /** ئایکۆنی کورت بۆ لیست — باشترە تێکستچەر/کلاسی CSS بەکاربهێنرێت */
  icon: string
  price: number
  curr: 'gold' | 'diamond'
  /** بۆ فرۆشگای پیاوان/ئافرەتان — تەنها جلوبەرگ/سەرپۆش/ئیکسسوار */
  wearGender?: WearGender
  skinEmoji?: string
  skinGradient?: string
  /** دیسکی تێکستچەری ڕاستەقینە (قوماش/فلز/چەرم) — لەبری ئیمۆجی کارتۆنی */
  skinClass?: string
  /** کلاسی تەمبنای فرۆشگا */
  thumbClass?: string
  titleText?: string
  titleColor?: string
  titleGlow?: string
  borderClass?: string
  trailFx?: TrailFx
  mapAuraFx?: MapAuraFx
  emoteClass?: string
  companionFx?: CompanionFx
  headwearKind?: HeadwearKind
  accessoryKind?: AccessoryKind
}

/** تابە کۆنەکان — بۆ گونجاندنی کۆد/مێژوو؛ فرۆشگای یەکگرتوو UNIFIED_SHOP_CATEGORIES بەکاردەهێنێت */
export type ShopCosmeticTab = 'outfits' | 'headwear' | 'border' | 'title' | 'trail'

/** ٤ بەشی فرۆشگای یەکگرتوو (کۆن — فرۆشگای قەڵا جێی گرتووەتەوە) */
export type UnifiedShopCategory = 'outfits' | 'headwear' | 'border' | 'effects'
export type ShopGender = 'male' | 'female'
export type ShopCurrencyFilter = 'all' | 'diamond' | 'gold'

/** تابەکانی فرۆشگای ناوەندی قەڵا — تەنها ٤ بەش */
export type CitadelShopTab = 'weapons' | 'radar' | 'protection' | 'companions'

export const CITADEL_SHOP_TABS: { id: CitadelShopTab; label: string; icon: string }[] = [
  { id: 'weapons',     label: 'چەک',          icon: '⚔️' },
  { id: 'radar',       label: 'ڕادار',        icon: '📡' },
  { id: 'protection',  label: 'پاراستن',      icon: '🛡️' },
  { id: 'companions',  label: 'ئاژەڵی هاوەڵ', icon: '🐾' },
]

export const UNIFIED_SHOP_CATEGORIES: {
  id: UnifiedShopCategory
  label: string
  icon: string
  slots: CosmeticSlot[]
}[] = [
  { id: 'outfits',  label: 'پۆشاک',              icon: '◈', slots: ['avatar', 'accessory'] },
  { id: 'headwear', label: 'سەرپۆش و جەمەدانی', icon: '◉', slots: ['headwear'] },
  { id: 'border',   label: 'لێوارەکان',          icon: '◎', slots: ['border'] },
  { id: 'effects',  label: 'کاریگەرییەکان',      icon: '✧', slots: ['trail', 'title'] },
]

export const COSMETIC_TABS: { id: ShopCosmeticTab; label: string; icon: string; slots: CosmeticSlot[] }[] = [
  { id: 'outfits',   label: 'پۆشاک',              icon: '◈', slots: ['avatar', 'accessory'] },
  { id: 'headwear',  label: 'سەرپۆش و جەمەدانی', icon: '◉', slots: ['headwear'] },
  { id: 'border',    label: 'لێوارەکان',          icon: '◎', slots: ['border'] },
  { id: 'title',     label: 'نازناو و تاگ',       icon: '▣', slots: ['title'] },
  { id: 'trail',     label: 'کاریگەرییەکان',      icon: '✧', slots: ['trail'] },
]

/** تابەکانی فرۆشگای جلوبەرگ (پیاوان/ئافرەتان) — کۆن */
export const CLOTHING_SHOP_TABS: { id: ShopCosmeticTab; label: string; icon: string; slots: CosmeticSlot[] }[] = [
  { id: 'outfits',  label: 'پۆشاک',              icon: '◈', slots: ['avatar', 'accessory'] },
  { id: 'headwear', label: 'سەرپۆش و جەمەدانی', icon: '◉', slots: ['headwear'] },
]

export type CurrencyShopKey = 'gold' | 'diamond'
export type ClothingShopKey = 'men' | 'women'
export type UniformShopKey = CurrencyShopKey | ClothingShopKey

export function cosmeticsForShopTab(tabId: ShopCosmeticTab): CosmeticDef[] {
  const tab = COSMETIC_TABS.find(t => t.id === tabId)
  if (!tab) return []
  return COSMETIC_ITEMS.filter(c => tab.slots.includes(c.slot))
}

export function cosmeticsForCurrency(curr: CurrencyShopKey): CosmeticDef[] {
  return COSMETIC_ITEMS.filter(c => c.curr === curr)
}

export function cosmeticsForWearGender(gender: 'male' | 'female'): CosmeticDef[] {
  return COSMETIC_ITEMS.filter(c => {
    if (!c.wearGender) return false
    if (c.wearGender === 'unisex') return true
    return c.wearGender === gender
  })
}

/** ئایا ئەم کەرەستەیە لە فرۆشگای ئەم جێندەرەدا پیشان دەدرێت؟ */
export function cosmeticMatchesShopGender(c: CosmeticDef, gender: ShopGender): boolean {
  if (!c.wearGender || c.wearGender === 'unisex') return true
  return c.wearGender === gender
}

/** کاتالۆگی فرۆشگای یەکگرتوو — جێندەر + دراو + پۆل */
export function cosmeticsForUnifiedShop(opts: {
  gender: ShopGender
  currency: ShopCurrencyFilter
  category: UnifiedShopCategory
}): CosmeticDef[] {
  const cat = UNIFIED_SHOP_CATEGORIES.find(c => c.id === opts.category)
  if (!cat) return []
  return COSMETIC_ITEMS.filter(c => {
    if (!cat.slots.includes(c.slot)) return false
    if (opts.currency !== 'all' && c.curr !== opts.currency) return false
    return cosmeticMatchesShopGender(c, opts.gender)
  })
}

export function cosmeticsForUniformShop(
  shopKey: UniformShopKey,
  tabId?: ShopCosmeticTab,
): CosmeticDef[] {
  let pool: CosmeticDef[]
  if (shopKey === 'men') pool = cosmeticsForWearGender('male')
  else if (shopKey === 'women') pool = cosmeticsForWearGender('female')
  else pool = cosmeticsForCurrency(shopKey)

  if (!tabId) return pool
  const tabs = shopKey === 'men' || shopKey === 'women' ? CLOTHING_SHOP_TABS : COSMETIC_TABS
  const tab = tabs.find(t => t.id === tabId)
  if (!tab) return pool
  return pool.filter(c => tab.slots.includes(c.slot))
}

export const COSMETIC_ITEMS: CosmeticDef[] = [
  // ── جلوبەرگ — تێکستچەری قوماش/فلز ────────────────────────────────
  {
    id: 101,
    slot: 'avatar',
    name: 'چووخە و ڕانکی شاهانە',
    desc: 'قوماشی چاخی ئەستووری نەقشین، کەمەرپشتی دروومراو و داوی ئاڵتوونی.',
    icon: '◈',
    price: 120,
    curr: 'diamond',
    wearGender: 'male',
    skinClass: 'kd-skin-chokha',
    thumbClass: 'kd-thumb-chokha',
    skinGradient: 'linear-gradient(145deg, #5c4033 0%, #2a1810 55%, #c9a227 100%)',
  },
  {
    id: 102,
    slot: 'avatar',
    name: 'ئاڤاتاری شێری بابل',
    desc: 'تێکستچەری برۆنز و زێڕی دێرین — هێمای شێری بابل.',
    icon: '◈',
    price: 350,
    curr: 'diamond',
    wearGender: 'male',
    skinClass: 'kd-skin-babylon',
    thumbClass: 'kd-thumb-bronze',
    skinGradient: 'linear-gradient(145deg, #d4a017 0%, #8b5a00 50%, #3d2314 100%)',
  },
  {
    id: 103,
    slot: 'avatar',
    name: 'ڕاوکەری زاگرۆس',
    desc: 'چەرم و قوماشی شاخاوی سەوز تاریک بە بریقەی کانزا.',
    icon: '◈',
    price: 125,
    curr: 'diamond',
    wearGender: 'male',
    skinClass: 'kd-skin-hunter',
    thumbClass: 'kd-thumb-leather',
    skinGradient: 'linear-gradient(145deg, #3f6212 0%, #1a2e05 55%, #713f12 100%)',
  },
  {
    id: 109,
    slot: 'avatar',
    name: 'خەرقەی میران',
    desc: 'قوماشی مۆری قورس بە نیشانەی میرانی میدیا و بریقەی زیو.',
    icon: '◈',
    price: 140,
    curr: 'diamond',
    wearGender: 'male',
    skinClass: 'kd-skin-mir',
    thumbClass: 'kd-thumb-velvet',
    skinGradient: 'linear-gradient(145deg, #4c1d95 0%, #1e1b4b 55%, #c4b5fd 100%)',
  },
  {
    id: 110,
    slot: 'avatar',
    name: 'کراسی زێڕین و سەلتە',
    desc: 'حەریری خاوێن و سەلتەی ناسک بە بریقەی زێڕی عەیار ٢٤.',
    icon: '◈',
    price: 90,
    curr: 'diamond',
    wearGender: 'female',
    skinClass: 'kd-skin-silk-dress',
    thumbClass: 'kd-thumb-silk',
    skinGradient: 'linear-gradient(145deg, #9f1239 0%, #4c0519 50%, #fbbf24 100%)',
  },
  {
    id: 111,
    slot: 'avatar',
    name: 'جلی کاوەی ئاسنگەر',
    desc: 'ئاسنی سێبەردار و پریشکی گەرم — تێکستچەری کانزای کاوە.',
    icon: '◈',
    price: 320,
    curr: 'diamond',
    wearGender: 'male',
    skinClass: 'kd-skin-kawe',
    thumbClass: 'kd-thumb-iron',
    skinGradient: 'linear-gradient(145deg, #ea580c 0%, #431407 50%, #fbbf24 100%)',
  },
  {
    id: 112,
    slot: 'avatar',
    name: 'زرێی جەنگاوەران / ئاشووری',
    desc: 'زرێی ئاسن و بڕۆنزی ئاشووری بە ئاساری چەکوش و سێبەری فلزی.',
    icon: '◈',
    price: 225,
    curr: 'diamond',
    wearGender: 'male',
    skinClass: 'kd-skin-assyrian',
    thumbClass: 'kd-thumb-armor',
    skinGradient: 'linear-gradient(145deg, #94a3b8 0%, #334155 45%, #0f172a 100%)',
  },
  {
    id: 113,
    slot: 'avatar',
    name: 'روب و جلی شازادەی میدیا',
    desc: 'قوماشی شاهانە و تۆڕی نهێنی بە هایلایتی سارد — دیزاینی کەشخەی ئافرەتان.',
    icon: '◈',
    price: 380,
    curr: 'diamond',
    wearGender: 'female',
    skinClass: 'kd-skin-medes-robe',
    thumbClass: 'kd-thumb-velvet',
    skinGradient: 'linear-gradient(145deg, #6d28d9 0%, #1e1b4b 55%, #a78bfa 100%)',
  },

  // ── سەرپۆش و جەمەدانی ─────────────────────────────────────────────
  {
    id: 124,
    slot: 'headwear',
    name: 'جەمەدانیی سووری بارزانی / گۆران',
    desc: 'پێچی ڕەسەنی سوور بە نەخشی فۆلکلۆری، لۆچ و چین و کلکی شۆڕبووەوە.',
    icon: '◉',
    price: 85,
    curr: 'diamond',
    wearGender: 'male',
    headwearKind: 'jamadani-red',
    thumbClass: 'kd-thumb-jam-red',
  },
  {
    id: 125,
    slot: 'headwear',
    name: 'جەمەدانیی پێچراوی مەشکی',
    desc: 'پێچی مەشکی/سپی بە مشکی ورد، لۆچ لەسەر نێوچەوان و کلکی هەڵواسراو.',
    icon: '◉',
    price: 110,
    curr: 'diamond',
    wearGender: 'male',
    headwearKind: 'jamadani-bw',
    thumbClass: 'kd-thumb-jam-bw',
  },
  {
    id: 126,
    slot: 'headwear',
    name: 'کۆڵوانە و سەلتەی حەریر',
    desc: 'حەریری ناسک لەسەر شان — بریقە و نەرمی ڕاستەقینە.',
    icon: '◉',
    price: 280,
    curr: 'diamond',
    wearGender: 'female',
    headwearKind: 'silk-shawl',
    thumbClass: 'kd-thumb-silk',
  },
  {
    id: 127,
    slot: 'headwear',
    name: 'کڵاوی فۆلکلۆری بە فیندی',
    desc: 'کڵاوی کلتوری بە پۆپشمی شۆڕبووەوە و تێکستچەری خوری.',
    icon: '◉',
    price: 160,
    curr: 'diamond',
    wearGender: 'male',
    headwearKind: 'folk-hat',
    thumbClass: 'kd-thumb-wool',
  },
  {
    id: 128,
    slot: 'headwear',
    name: 'تاجی شاهانەی میدیا',
    desc: 'زێڕی عەیار ٢٤ بە هایلایت و سێبەری فلزی قووڵ.',
    icon: '◉',
    price: 420,
    curr: 'diamond',
    wearGender: 'female',
    headwearKind: 'medes-crown',
    thumbClass: 'kd-thumb-gold',
  },
  {
    id: 132,
    slot: 'headwear',
    name: 'پەردەی شاراوە',
    desc: 'ڕووپۆشی خوارەوەی دەموچاو بە لێواری فسفۆرێسنت نەرم.',
    icon: '◉',
    price: 260,
    curr: 'diamond',
    wearGender: 'female',
    headwearKind: 'stealth-veil',
    thumbClass: 'kd-thumb-veil',
  },

  // ── ئیکسسوارات ────────────────────────────────────────────────────
  {
    id: 129,
    slot: 'accessory',
    name: 'کەمەرپشتی خەنجەری ڕەسەن',
    desc: 'چەرم و زێڕ — خەنجەر لەسەر کەمەر بە سێبەری 3D.',
    icon: '◇',
    price: 95,
    curr: 'diamond',
    wearGender: 'male',
    accessoryKind: 'khanjar-belt',
    thumbClass: 'kd-thumb-leather-gold',
  },
  {
    id: 130,
    slot: 'accessory',
    name: 'کەپەنەکی شاهانە',
    desc: 'موو و قوماشی قورس لەسەر شان بە قووڵایی سێبەر.',
    icon: '◇',
    price: 180,
    curr: 'diamond',
    wearGender: 'unisex',
    accessoryKind: 'regal-cape',
    thumbClass: 'kd-thumb-fur',
  },
  {
    id: 131,
    slot: 'accessory',
    name: 'فیشەکدانی جەنگاوەر',
    desc: 'چەرمی ڕاستەقینە بە دووکەڵ و سێبەری قووڵ لەسەر سنگ.',
    icon: '◇',
    price: 300,
    curr: 'diamond',
    wearGender: 'male',
    accessoryKind: 'bandolier',
    thumbClass: 'kd-thumb-leather',
  },

  // ── لێوار — فلزی / بڵێسەدار ───────────────────────────────────────
  {
    id: 104,
    slot: 'border',
    name: 'لێواری درەختی ژیان',
    desc: 'چوارچێوەی زێڕ و زەمەڕەد بە قووڵایی و هایلایتی فلزی.',
    icon: '◎',
    price: 80,
    curr: 'diamond',
    borderClass: 'kd-border-zagros',
    thumbClass: 'kd-thumb-border-zagros',
  },
  {
    id: 105,
    slot: 'border',
    name: 'لێواری ئاگری نەورۆز',
    desc: 'هێڵی ئاگاری بڵێسەدار بە سێبەر و گەرمی ڕاستەقینە.',
    icon: '◎',
    price: 280,
    curr: 'diamond',
    borderClass: 'kd-border-newroz',
    thumbClass: 'kd-thumb-border-flame',
  },
  {
    id: 114,
    slot: 'border',
    name: 'لێواری خەنجەری ڕەسەن',
    desc: 'زیوی بریقەدار و سووری خوێنی کەمەرپشت.',
    icon: '◎',
    price: 75,
    curr: 'diamond',
    borderClass: 'kd-border-khanjar',
    thumbClass: 'kd-thumb-border-steel',
  },
  {
    id: 115,
    slot: 'border',
    name: 'لێواری دەروازەی عەشتار',
    desc: 'شین و زێڕی بابلی بە قووڵایی 3D.',
    icon: '◎',
    price: 420,
    curr: 'diamond',
    borderClass: 'kd-border-ishtar',
    thumbClass: 'kd-thumb-border-ishtar',
  },
  {
    id: 116,
    slot: 'border',
    name: 'لێواری مشکی و جەمەدانی',
    desc: 'مشکی ڕەش/سپی بە لێواری نیۆنی نەرم و قووڵ.',
    icon: '◎',
    price: 90,
    curr: 'diamond',
    borderClass: 'kd-border-jamadani',
    thumbClass: 'kd-thumb-jam-bw',
  },

  // ── 🏷️ نازناو و تاگ ──────────────────────────────────────────────
  {
    id: 106,
    slot: 'title',
    name: "نازناوی 'پاشای قەڵات' 🏰",
    desc: 'نووسینێکی ڕەنگ زێڕین لەژێر ناوی یاریزان لەسەر پرۆفایل و ڕیزبەندی.',
    icon: '🏰',
    price: 150,
    curr: 'diamond',
    titleText: 'پاشای قەڵات',
    titleColor: '#fbbf24',
    titleGlow: 'rgba(251,191,36,0.75)',
  },
  {
    id: 107,
    slot: 'title',
    name: "نازناوی 'ئاگرپەروەر' ⚡",
    desc: 'نازناوێکی شین بە بریقەی بروسکەوە لەژێر ناوی یاریزان.',
    icon: '⚡',
    price: 220,
    curr: 'diamond',
    titleText: 'ئاگرپەروەر',
    titleColor: '#38bdf8',
    titleGlow: 'rgba(56,189,248,0.85)',
  },
  {
    id: 117,
    slot: 'title',
    name: "نازناوی 'سەرداری میدیا' 🛡️",
    desc: 'نازناوی سەرداری میدیا بە ڕەنگی زیو و شین.',
    icon: '🛡️',
    price: 160,
    curr: 'diamond',
    titleText: 'سەرداری میدیا',
    titleColor: '#94a3b8',
    titleGlow: 'rgba(148,163,184,0.8)',
  },
  {
    id: 118,
    slot: 'title',
    name: "نازناوی 'شێری بابل' 👑",
    desc: 'نازناوی شێری بابل بە بریقەی زێڕین.',
    icon: '👑',
    price: 260,
    curr: 'diamond',
    titleText: 'شێری بابل',
    titleColor: '#f59e0b',
    titleGlow: 'rgba(245,158,11,0.85)',
  },
  {
    id: 119,
    slot: 'title',
    name: "نازناوی 'پاسەوانی مێژوو' 📜",
    desc: 'نازناوی پاسەوانی مێژوو بە ڕەنگی پەڕە و مۆر.',
    icon: '📜',
    price: 110,
    curr: 'diamond',
    titleText: 'پاسەوانی مێژوو',
    titleColor: '#d8b4fe',
    titleGlow: 'rgba(216,180,254,0.8)',
  },

  // ── ✨ شوێنپێ و کاریگەریی جووڵە ──────────────────────────────────
  {
    id: 108,
    slot: 'trail',
    name: 'شوێنپێی پریشکی ئاسنگەر 🎆',
    desc: 'کاتێک دەجووڵێیت، پریشکی ئاوری کاوە لە پشتت جێدەمێنێت.',
    icon: '🎆',
    price: 90,
    curr: 'diamond',
    trailFx: { kind: 'spark', color: '#fb923c', fillColor: '#ef4444', emoji: '✨', radius: 5 },
  },
  {
    id: 120,
    slot: 'trail',
    name: 'شوێنپێی پیتی بزماری 📜',
    desc: 'پیتی بزماری کۆن لە شوێنپێی جووڵەکەتدا دەردەکەوێت.',
    icon: '📜',
    price: 240,
    curr: 'diamond',
    trailFx: { kind: 'glyph', color: '#c4b5fd', fillColor: '#7c3aed', emoji: '𒀭', radius: 6 },
  },
  {
    id: 121,
    slot: 'trail',
    name: 'شوێنپێی نێرگز 🌼',
    desc: 'گوڵی نێرگزی کوردستان لەسەر ڕێگاکەت دەڕوێت.',
    icon: '🌼',
    price: 65,
    curr: 'diamond',
    trailFx: { kind: 'petal', color: '#fde68a', fillColor: '#fbbf24', emoji: '🌼', radius: 6 },
  },
  {
    id: 122,
    slot: 'trail',
    name: 'شەپۆلی سیروان 🌊',
    desc: 'شەپۆلی ئاوەکانی سیروان لە پشت جووڵەکەتدا.',
    icon: '🌊',
    price: 105,
    curr: 'diamond',
    trailFx: { kind: 'wave', color: '#38bdf8', fillColor: '#0ea5e9', emoji: '💧', radius: 6 },
  },
  {
    id: 123,
    slot: 'trail',
    name: 'شوێنپێی بەفری هەڵگورد ❄️',
    desc: 'بەفری سپی هەڵگورد لەسەر شوێنپێی گەشتەکەت.',
    icon: '❄️',
    price: 200,
    curr: 'diamond',
    trailFx: { kind: 'snow', color: '#e0f2fe', fillColor: '#bae6fd', emoji: '❄️', radius: 5 },
  },

  // ── 🗺️ جوانکاری نەخشە — Aura & Map Effects (٢٠ دەگمەن) ─────────────
  { id: 301, slot: 'mapAura', name: 'هەورەبروسکەی شین', desc: 'برقێکی شینی دەوروبەرت — لەسەر نەخشە دەدرەوشێت.', icon: '⚡', price: 280, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-lightning-blue', color: '#38bdf8', glowColor: 'rgba(56,189,248,0.75)' } },
  { id: 302, slot: 'mapAura', name: 'تاجی زێڕین', desc: 'تاجێکی شاهانە لەسەر سەرت — هەموو کەس دەبینێت.', icon: '👑', price: 1500, curr: 'gold', mapAuraFx: { auraClass: 'kd-aura-golden-crown', color: '#fbbf24', glowColor: 'rgba(251,191,36,0.85)' } },
  { id: 303, slot: 'mapAura', name: 'دووکەڵی نیۆنی پەمەیی', desc: 'دووکەڵێکی نیۆنی پەمەیی دەوروبەرت دەسوڕێت.', icon: '💗', price: 320, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-neon-pink-smoke', color: '#f472b6', glowColor: 'rgba(244,114,182,0.7)' } },
  { id: 304, slot: 'mapAura', name: 'بازنەی ئاگری پێکان', desc: 'بازنەیەکی ئاگرین لە نێوان پێکانت.', icon: '🔥', price: 1200, curr: 'gold', mapAuraFx: { auraClass: 'kd-aura-fire-ring', color: '#f97316', glowColor: 'rgba(249,115,22,0.8)' } },
  { id: 305, slot: 'mapAura', name: 'هۆڵۆگرامی فڕیو', desc: 'هۆڵۆگرامێکی فڕیو لە دەوروبەرت.', icon: '👻', price: 380, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-hologram', color: '#67e8f9', glowColor: 'rgba(103,232,249,0.65)' } },
  { id: 306, slot: 'mapAura', name: 'بڕیسکەی ئاڵتونی', desc: 'بڕiskeی ئاڵتوون لە دەوروبەرت دەپەڕێت.', icon: '✨', price: 180, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-gold-sparkle', color: '#fde68a', glowColor: 'rgba(253,230,138,0.9)' } },
  { id: 307, slot: 'mapAura', name: 'چوارچێوەی ئەڵماسی', desc: 'چوارچێوەیەکی ئەڵماسی دەوروبەرت دەگرێت.', icon: '💠', price: 450, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-diamond-frame', color: '#22d3ee', glowColor: 'rgba(34,211,238,0.75)' } },
  { id: 308, slot: 'mapAura', name: 'گەردەلولی کەهرەبایی', desc: 'گەردەلولێکی کەهرەبایی دەسوڕێت.', icon: '⚡', price: 220, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-electric-orb', color: '#a78bfa', glowColor: 'rgba(167,139,250,0.8)' } },
  { id: 309, slot: 'mapAura', name: 'شەپۆلی ئاوی', desc: 'شەپۆلی ئاو لە ژێر پێکانت.', icon: '🌊', price: 900, curr: 'gold', mapAuraFx: { auraClass: 'kd-aura-water-ripple', color: '#0ea5e9', glowColor: 'rgba(14,165,233,0.7)' } },
  { id: 310, slot: 'mapAura', name: 'تەنۆلەی ئەستێرە', desc: 'تەنۆلەیەکی ئەستێرەیی لەسەر سەرت.', icon: '⭐', price: 350, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-star-halo', color: '#fef08a', glowColor: 'rgba(254,240,138,0.85)' } },
  { id: 311, slot: 'mapAura', name: 'پەلسی سەوزی نێۆن', desc: 'پەلسی نێۆنی سەوز لە دەوروبەرت.', icon: '💚', price: 260, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-neon-green', color: '#4ade80', glowColor: 'rgba(74,222,128,0.75)' } },
  { id: 312, slot: 'mapAura', name: 'دووکەڵی ڕەش', desc: 'دووکەڵێکی تاریک و نهێنی دەوروبەرت.', icon: '🖤', price: 1100, curr: 'gold', mapAuraFx: { auraClass: 'kd-aura-dark-smoke', color: '#64748b', glowColor: 'rgba(15,23,42,0.85)' } },
  { id: 313, slot: 'mapAura', name: 'پەروەی نوری', desc: 'پەروەیەکی نوری لە پشتت.', icon: '🪽', price: 400, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-angel-wings', color: '#e0f2fe', glowColor: 'rgba(224,242,254,0.9)' } },
  { id: 314, slot: 'mapAura', name: 'بازنەی سەردەمی', desc: 'بازنەیەکی سەردەم و بەفر لە پێکانت.', icon: '❄️', price: 290, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-frost-ring', color: '#bae6fd', glowColor: 'rgba(186,230,253,0.85)' } },
  { id: 315, slot: 'mapAura', name: 'تیشکی سێبەر', desc: 'تیشکێکی تاریک لە ژێر پێکانت.', icon: '🌑', price: 1300, curr: 'gold', mapAuraFx: { auraClass: 'kd-aura-shadow-beam', color: '#312e81', glowColor: 'rgba(49,46,129,0.75)' } },
  { id: 316, slot: 'mapAura', name: 'گلۆبی ڕۆژ', desc: 'گلۆبێکی گەرم و درەوشاو لە دەوروبەرت.', icon: '☀️', price: 420, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-sun-globe', color: '#fb923c', glowColor: 'rgba(251,146,60,0.85)' } },
  { id: 317, slot: 'mapAura', name: 'کەمەری کەمەندەر', desc: 'کەمەرێکی کەمەندەر لە دەوروبەرت.', icon: '🏹', price: 240, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-archer-bow', color: '#fcd34d', glowColor: 'rgba(252,211,77,0.8)' } },
  { id: 318, slot: 'mapAura', name: 'گڕی گڕمە', desc: 'گڕمەی ئاگرین لە دەوروبەرت دەسوڕێت.', icon: '🍂', price: 850, curr: 'gold', mapAuraFx: { auraClass: 'kd-aura-ember-swirl', color: '#ef4444', glowColor: 'rgba(239,68,68,0.75)' } },
  { id: 319, slot: 'mapAura', name: 'پrizمی کristali', desc: 'پrizmێکی کristali ڕەنگاوڕەنگ.', icon: '🔮', price: 360, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-crystal-prism', color: '#c084fc', glowColor: 'rgba(192,132,252,0.8)' } },
  { id: 320, slot: 'mapAura', name: 'تۆڕی ماتریکس', desc: 'تۆڕێکی دیجیتاڵی سەوز لە دەوروبەرت.', icon: '🟩', price: 480, curr: 'diamond', mapAuraFx: { auraClass: 'kd-aura-matrix-grid', color: '#22c55e', glowColor: 'rgba(34,197,94,0.7)' } },

  // ── 💃 جووڵە و دانس (Emotes) ─────────────────────────────────────
  { id: 401, slot: 'emote', name: 'دانسی ئاهەنگ', desc: 'دانس', icon: '💃', price: 350, curr: 'diamond', emoteClass: 'kd-emote-dance' },
  { id: 402, slot: 'emote', name: 'پاڵکەوتن', desc: 'پاڵکەوتن', icon: '🧘', price: 280, curr: 'diamond', emoteClass: 'kd-emote-sit' },
  { id: 403, slot: 'emote', name: 'سڵاوکردن', desc: 'سڵاو', icon: '👋', price: 150, curr: 'gold', emoteClass: 'kd-emote-wave' },
  { id: 404, slot: 'emote', name: 'جووڵەی سەرکەوتن', desc: 'سەرکەوتن', icon: '🏆', price: 420, curr: 'diamond', emoteClass: 'kd-emote-victory' },
  { id: 405, slot: 'emote', name: 'سڵامی سەربازی', desc: 'سڵام', icon: '🫡', price: 200, curr: 'gold', emoteClass: 'kd-emote-salute' },
  { id: 406, slot: 'emote', name: 'خەوتن', desc: 'خەوتن', icon: '😴', price: 180, curr: 'gold', emoteClass: 'kd-emote-lie' },

  // ── 🐾 ئاژەڵی هاوەڵ (Companions) ─────────────────────────────────
  { id: 501, slot: 'companion', name: 'سەگی وفادار', desc: 'سەگ', icon: '🐕', price: 600, curr: 'diamond', companionFx: { companionClass: 'kd-companion-dog', emoji: '🐕' } },
  { id: 502, slot: 'companion', name: 'پشیلەی سیحراوی', desc: 'پشیلە', icon: '🐈', price: 450, curr: 'diamond', companionFx: { companionClass: 'kd-companion-cat', emoji: '🐈' } },
  { id: 503, slot: 'companion', name: 'شێری زاگرۆs', desc: 'شێر', icon: '🦁', price: 1200, curr: 'gold', companionFx: { companionClass: 'kd-companion-lion', emoji: '🦁' } },
  { id: 504, slot: 'companion', name: 'پلینگی ئەسپەڕ', desc: 'پلینگ', icon: '🐉', price: 800, curr: 'diamond', companionFx: { companionClass: 'kd-companion-dragon', emoji: '🐉' } },
  { id: 505, slot: 'companion', name: 'هەڵۆی باڵا', desc: 'هەڵۆ', icon: '🦅', price: 550, curr: 'diamond', companionFx: { companionClass: 'kd-companion-eagle', emoji: '🦅' } },
]

export const COSMETIC_BY_ID: Record<number, CosmeticDef> = Object.fromEntries(
  COSMETIC_ITEMS.map(c => [c.id, c]),
)

export function cosmeticsBySlot(slot: CosmeticSlot): CosmeticDef[] {
  return COSMETIC_ITEMS.filter(c => c.slot === slot)
}

export function getActiveCosmetic(items: InventoryItem[], slot: CosmeticSlot): CosmeticDef | null {
  for (const item of items) {
    if (!item.active) continue
    const def = COSMETIC_BY_ID[item.id]
    if (def?.slot === slot) return def
  }
  return null
}

export function getActiveCosmetics(items: InventoryItem[]) {
  return {
    avatar: getActiveCosmetic(items, 'avatar'),
    border: getActiveCosmetic(items, 'border'),
    title: getActiveCosmetic(items, 'title'),
    trail: getActiveCosmetic(items, 'trail'),
    headwear: getActiveCosmetic(items, 'headwear'),
    accessory: getActiveCosmetic(items, 'accessory'),
    mapAura: getActiveCosmetic(items, 'mapAura'),
    emote: getActiveCosmetic(items, 'emote'),
    companion: getActiveCosmetic(items, 'companion'),
  }
}

/** چالاککردن بە یاسای یەک-بۆ-هەر-سلۆت */
export function toggleCosmeticInInventory(items: InventoryItem[], itemId: number): InventoryItem[] {
  const def = COSMETIC_BY_ID[itemId]
  const target = items.find(i => i.id === itemId)
  if (!target) return items
  const turningOn = !target.active

  return items.map(x => {
    if (x.id === itemId) return { ...x, active: turningOn }
    if (turningOn && def && COSMETIC_BY_ID[x.id]?.slot === def.slot) {
      return { ...x, active: false }
    }
    return x
  })
}

export interface PublicCosmetics {
  skinId: number | null
  borderId: number | null
  titleId: number | null
  headwearId: number | null
  accessoryId: number | null
  mapAuraId: number | null
  companionId: number | null
}

export function cosmeticsToPublic(items: InventoryItem[]): PublicCosmetics {
  const a = getActiveCosmetics(items)
  return {
    skinId: a.avatar?.id ?? null,
    borderId: a.border?.id ?? null,
    titleId: a.title?.id ?? null,
    headwearId: a.headwear?.id ?? null,
    accessoryId: a.accessory?.id ?? null,
    mapAuraId: a.mapAura?.id ?? null,
    companionId: a.companion?.id ?? null,
  }
}

/** ئۆڤەرلەی جوانکاری نەخشە — لەسەر مارکەری یاریزان */
export function buildMapAuraOverlayHtml(aura?: CosmeticDef | null): string {
  if (!aura?.mapAuraFx) return ''
  const fx = aura.mapAuraFx
  return `<div class="kd-map-aura ${fx.auraClass}" style="--aura-color:${fx.color};--aura-glow:${fx.glowColor};" aria-hidden="true"></div>`
}

/** ئاژەڵی هاوەڵ — لە تەنیشت مارکەر */
export function buildCompanionOverlayHtml(companion?: CosmeticDef | null): string {
  if (!companion?.companionFx) return ''
  const fx = companion.companionFx
  return `<div class="kd-companion ${fx.companionClass}" aria-hidden="true"><span class="kd-companion-emoji">${fx.emoji}</span></div>`
}

export function buildAvatarInnerHtml(opts: {
  avatarUrl: string
  skin?: CosmeticDef | null
  sizePx?: number
}): string {
  const size = opts.sizePx ?? 38
  if (opts.skin?.skinClass) {
    return `<div class="kd-skin-disc ${opts.skin.skinClass}" style="width:${size}px;height:${size}px;border-radius:50%;"></div>`
  }
  if (opts.skin?.skinEmoji) {
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${opts.skin.skinGradient ?? '#1e293b'};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.55)}px;line-height:1;box-shadow:inset 0 -4px 10px rgba(0,0,0,0.35),inset 0 2px 6px rgba(255,255,255,0.12);">${opts.skin.skinEmoji}</div>`
  }
  return `<img src="${opts.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
}

/** تەمبنای فرۆشگا — تێکستچەر لەبری ئیمۆجی */
export function cosmeticThumbClass(item: CosmeticDef): string {
  if (item.thumbClass) return item.thumbClass
  if (item.skinClass) return item.skinClass
  if (item.borderClass) return item.borderClass
  if (item.headwearKind === 'jamadani-red') return 'kd-thumb-jam-red'
  if (item.headwearKind === 'jamadani-bw') return 'kd-thumb-jam-bw'
  if (item.slot === 'title') return 'kd-thumb-title'
  if (item.slot === 'trail') return 'kd-thumb-trail'
  return 'kd-thumb-default'
}

/** IDـی یەکتا بۆ پاتێرنی SVG (چەند مارکەر لەسەر نەخشە) */
let jamadaniPatternSeq = 0
function nextJamadaniPatternId(prefix: string): string {
  jamadaniPatternSeq += 1
  return `kd-${prefix}-${jamadaniPatternSeq}`
}

/** جەمەدانیی پێچراوی مەشکی — لۆچ و چین + مشکی ورد + کلک */
function buildJamadaniBwSvg(): string {
  const pid = nextJamadaniPatternId('jam-bw')
  const gid = nextJamadaniPatternId('jam-bw-g')
  const sid = nextJamadaniPatternId('jam-bw-s')
  return `<svg class="kd-hw-svg" viewBox="0 0 100 118" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <defs>
    <pattern id="${pid}" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
      <rect width="3.2" height="3.2" fill="#f4f4f5"/>
      <rect width="1.6" height="1.6" fill="#111827"/>
      <rect x="1.6" y="1.6" width="1.6" height="1.6" fill="#111827"/>
    </pattern>
    <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.42"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.38"/>
    </linearGradient>
    <filter id="${sid}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <!-- سێبەری ژێر پێچ -->
  <ellipse class="kd-hw-cast" cx="50" cy="38" rx="36" ry="10" fill="rgba(0,0,0,0.28)"/>
  <!-- قەبارەی سەرەوە / پشتەوەی پێچ -->
  <path class="kd-hw-crown" filter="url(#${sid})" fill="url(#${pid})"
    d="M18 34 C20 14, 36 6, 50 6 C64 6, 80 14, 82 34 C78 28, 66 22, 50 22 C34 22, 22 28, 18 34 Z"/>
  <!-- چینە سەرەکییەکانی نێوچەوان -->
  <path class="kd-hw-band kd-hw-band-a" filter="url(#${sid})" fill="url(#${pid})"
    d="M14 36 C22 24, 78 24, 86 36 C84 44, 72 48, 50 48 C28 48, 16 44, 14 36 Z"/>
  <path class="kd-hw-band kd-hw-band-b" fill="url(#${pid})"
    d="M16 40 C26 32, 74 32, 84 40 C82 46, 68 50, 50 50 C32 50, 18 46, 16 40 Z"/>
  <path class="kd-hw-band kd-hw-band-c" fill="url(#${pid})"
    d="M20 44 C30 38, 70 38, 80 44 C78 50, 66 54, 50 54 C34 54, 22 50, 20 44 Z"/>
  <!-- لۆچی لای سەر -->
  <path class="kd-hw-loop" filter="url(#${sid})" fill="url(#${pid})"
    d="M78 30 C92 34, 96 48, 88 58 C80 66, 72 60, 74 50 C76 42, 76 34, 78 30 Z"/>
  <path class="kd-hw-loop-inner" fill="url(#${gid})"
    d="M80 36 C88 40, 90 50, 84 56 C78 60, 76 52, 78 44 C79 40, 79 37, 80 36 Z"/>
  <!-- کلکی هەڵواسراو لەسەر شان -->
  <g class="kd-hw-tail-g">
    <path class="kd-hw-tail-cloth" filter="url(#${sid})" fill="url(#${pid})"
      d="M14 42 C6 48, 2 62, 6 78 C10 96, 18 112, 28 114 C32 102, 30 84, 26 68 C22 54, 18 46, 14 42 Z"/>
    <path class="kd-hw-tail-fold" fill="url(#${gid})"
      d="M16 46 C10 56, 10 72, 14 90 C18 84, 20 68, 18 54 C18 50, 17 47, 16 46 Z"/>
  </g>
  <!-- هایلایتی چینەکان -->
  <path class="kd-hw-ridge" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.1"
    d="M22 38 C36 32, 64 32, 78 38"/>
  <path class="kd-hw-ridge" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="0.9"
    d="M24 44 C38 40, 62 40, 76 44"/>
  <path class="kd-hw-crease" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.85"
    d="M22 48 C36 52, 64 52, 78 48"/>
  <ellipse class="kd-hw-top-shine" cx="46" cy="18" rx="14" ry="5" fill="rgba(255,255,255,0.28)"/>
</svg>`
}

/** جەمەدانیی سووری بارزانی/گۆران — نەخشی کولتووری + بەندی پێچ */
function buildJamadaniRedSvg(): string {
  const pid = nextJamadaniPatternId('jam-rd')
  const gid = nextJamadaniPatternId('jam-rd-g')
  const bid = nextJamadaniPatternId('jam-rd-b')
  const sid = nextJamadaniPatternId('jam-rd-s')
  return `<svg class="kd-hw-svg" viewBox="0 0 100 118" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <defs>
    <pattern id="${pid}" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#9f1239"/>
      <path d="M4 0 L6.2 2.2 L4 4.4 L1.8 2.2 Z" fill="#fecdd3" fill-opacity="0.55"/>
      <path d="M0 4 L2 6 L0 8 L-2 6 Z" fill="#7f1d1d" fill-opacity="0.9"/>
      <path d="M8 4 L10 6 L8 8 L6 6 Z" fill="#7f1d1d" fill-opacity="0.9"/>
      <circle cx="4" cy="4" r="0.7" fill="#fde68a" fill-opacity="0.75"/>
      <path d="M0 0 L1.4 0 L0 1.4 Z" fill="#450a0a" fill-opacity="0.55"/>
      <path d="M8 8 L6.6 8 L8 6.6 Z" fill="#450a0a" fill-opacity="0.55"/>
    </pattern>
    <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fecaca" stop-opacity="0.5"/>
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#450a0a" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="${bid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="55%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <filter id="${sid}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.2" stdDeviation="1.15" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <ellipse class="kd-hw-cast" cx="50" cy="38" rx="36" ry="10" fill="rgba(0,0,0,0.32)"/>
  <path class="kd-hw-crown" filter="url(#${sid})" fill="url(#${pid})"
    d="M18 34 C20 14, 36 6, 50 6 C64 6, 80 14, 82 34 C78 28, 66 22, 50 22 C34 22, 22 28, 18 34 Z"/>
  <path class="kd-hw-band kd-hw-band-a" filter="url(#${sid})" fill="url(#${pid})"
    d="M14 36 C22 24, 78 24, 86 36 C84 44, 72 48, 50 48 C28 48, 16 44, 14 36 Z"/>
  <path class="kd-hw-band kd-hw-band-b" fill="url(#${pid})"
    d="M16 40 C26 32, 74 32, 84 40 C82 46, 68 50, 50 50 C32 50, 18 46, 16 40 Z"/>
  <path class="kd-hw-band kd-hw-band-c" fill="url(#${pid})"
    d="M20 44 C30 38, 70 38, 80 44 C78 50, 66 54, 50 54 C34 54, 22 50, 20 44 Z"/>
  <!-- بەندی پێچ (زێڕین/قاوەیی) -->
  <path class="kd-hw-bind" fill="url(#${bid})"
    d="M18 41 C30 35, 70 35, 82 41 C81 44, 68 46, 50 46 C32 46, 19 44, 18 41 Z"/>
  <path class="kd-hw-bind-shine" fill="none" stroke="rgba(254,243,199,0.7)" stroke-width="0.7"
    d="M22 42 C36 38, 64 38, 78 42"/>
  <!-- لۆچی لای ڕاست -->
  <path class="kd-hw-loop" filter="url(#${sid})" fill="url(#${pid})"
    d="M76 28 C94 32, 98 50, 86 62 C76 70, 70 60, 72 48 C74 38, 74 30, 76 28 Z"/>
  <path class="kd-hw-loop-inner" fill="url(#${gid})"
    d="M80 36 C90 40, 92 52, 84 58 C78 62, 76 52, 78 44 C79 39, 79 37, 80 36 Z"/>
  <!-- کلک -->
  <g class="kd-hw-tail-g kd-hw-tail-g-right">
    <path class="kd-hw-tail-cloth" filter="url(#${sid})" fill="url(#${pid})"
      d="M86 42 C94 48, 98 62, 94 78 C90 96, 82 112, 72 114 C68 102, 70 84, 74 68 C78 54, 82 46, 86 42 Z"/>
    <path class="kd-hw-tail-fold" fill="url(#${gid})"
      d="M84 46 C90 56, 90 72, 86 90 C82 84, 80 68, 82 54 C82 50, 83 47, 84 46 Z"/>
  </g>
  <path class="kd-hw-ridge" fill="none" stroke="rgba(254,226,226,0.55)" stroke-width="1.05"
    d="M22 37 C36 31, 64 31, 78 37"/>
  <path class="kd-hw-ridge" fill="none" stroke="rgba(253,224,71,0.35)" stroke-width="0.8"
    d="M24 46 C40 50, 60 50, 76 46"/>
  <path class="kd-hw-crease" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="0.9"
    d="M22 50 C36 54, 64 54, 78 50"/>
  <ellipse class="kd-hw-top-shine" cx="46" cy="18" rx="14" ry="5" fill="rgba(254,226,226,0.35)"/>
  <ellipse class="kd-hw-sheen-spot" cx="58" cy="28" rx="8" ry="3.5" fill="rgba(253,224,71,0.28)"/>
</svg>`
}

/** چینەی سەرپۆش — HTML/CSS (لە دەرەوەی overflow:hidden بۆ کلک) */
export function buildHeadwearOverlayHtml(headwear?: CosmeticDef | null): string {
  if (!headwear?.headwearKind) return ''
  const kind = headwear.headwearKind
  if (kind === 'jamadani-red') {
    return `<div class="kd-wear kd-hw-jamadani kd-hw-jamadani-red" aria-hidden="true">${buildJamadaniRedSvg()}</div>`
  }
  if (kind === 'jamadani-bw') {
    return `<div class="kd-wear kd-hw-jamadani kd-hw-jamadani-bw" aria-hidden="true">${buildJamadaniBwSvg()}</div>`
  }
  if (kind === 'silk-shawl') {
    return `<div class="kd-wear kd-hw-silk" aria-hidden="true">
      <div class="kd-hw-silk-left"></div>
      <div class="kd-hw-silk-right"></div>
      <div class="kd-hw-silk-collar"></div>
      <div class="kd-hw-silk-sheen"></div>
    </div>`
  }
  if (kind === 'folk-hat') {
    return `<div class="kd-wear kd-hw-folk-hat" aria-hidden="true">
      <div class="kd-hw-hat-crown"></div>
      <div class="kd-hw-hat-band"></div>
      <div class="kd-hw-hat-findi"></div>
    </div>`
  }
  if (kind === 'medes-crown') {
    return `<div class="kd-wear kd-hw-crown" aria-hidden="true">
      <div class="kd-hw-crown-base"></div>
      <div class="kd-hw-crown-spike kd-hw-crown-s1"></div>
      <div class="kd-hw-crown-spike kd-hw-crown-s2"></div>
      <div class="kd-hw-crown-spike kd-hw-crown-s3"></div>
      <div class="kd-hw-crown-spike kd-hw-crown-s4"></div>
      <div class="kd-hw-crown-spike kd-hw-crown-s5"></div>
      <div class="kd-hw-crown-gem"></div>
    </div>`
  }
  if (kind === 'stealth-veil') {
    return `<div class="kd-wear kd-hw-veil" aria-hidden="true">
      <div class="kd-hw-veil-cloth"></div>
      <div class="kd-hw-veil-edge"></div>
    </div>`
  }
  return ''
}

/** چینەی ئیکسسوارات — کەمەر / کەپەنک / فیشەکدان */
export function buildAccessoryOverlayHtml(accessory?: CosmeticDef | null): string {
  if (!accessory?.accessoryKind) return ''
  const kind = accessory.accessoryKind
  if (kind === 'khanjar-belt') {
    return `<div class="kd-wear kd-acc-belt" aria-hidden="true">
      <div class="kd-acc-belt-band"></div>
      <div class="kd-acc-belt-buckle"></div>
      <div class="kd-acc-khanjar"></div>
    </div>`
  }
  if (kind === 'regal-cape') {
    return `<div class="kd-wear kd-acc-cape" aria-hidden="true">
      <div class="kd-acc-cape-left"></div>
      <div class="kd-acc-cape-right"></div>
      <div class="kd-acc-cape-collar"></div>
      <div class="kd-acc-cape-fur"></div>
    </div>`
  }
  if (kind === 'bandolier') {
    return `<div class="kd-wear kd-acc-bandolier" aria-hidden="true">
      <div class="kd-acc-band-strap"></div>
      <div class="kd-acc-band-pouch kd-acc-p1"></div>
      <div class="kd-acc-band-pouch kd-acc-p2"></div>
      <div class="kd-acc-band-pouch kd-acc-p3"></div>
    </div>`
  }
  return ''
}

export function buildWearableOverlaysHtml(
  headwear?: CosmeticDef | null,
  accessory?: CosmeticDef | null,
): string {
  return `${buildAccessoryOverlayHtml(accessory)}${buildHeadwearOverlayHtml(headwear)}`
}

export function buildAvatarFrameHtml(
  inner: string,
  border?: CosmeticDef | null,
  sizePx = 38,
  headwear?: CosmeticDef | null,
  accessory?: CosmeticDef | null,
): string {
  const pad = border ? 3 : 0
  const outer = sizePx + pad * 2
  const borderClass = border?.borderClass ?? ''
  const overlays = buildWearableOverlaysHtml(headwear, accessory)
  return `<div class="kd-avatar-frame ${borderClass}" style="width:${outer}px;height:${outer}px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;overflow:visible;">
    <div style="width:${sizePx}px;height:${sizePx}px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#2a3142;position:relative;">${inner}</div>
    ${overlays}
  </div>`
}

export function titleBadgeHtml(title?: CosmeticDef | null): string {
  if (!title?.titleText) return ''
  return `<div style="margin-top:2px;font-size:7.5px;font-weight:900;color:${title.titleColor};text-shadow:0 0 8px ${title.titleGlow};white-space:nowrap;background:rgba(0,0,0,0.55);padding:1px 6px;border-radius:6px;border:1px solid ${title.titleColor}66;letter-spacing:0.2px;">${title.titleText}</div>`
}

/** ناوی سلۆت بۆ جانتای یاریزان */
export function cosmeticSlotLabel(slot: CosmeticSlot): string {
  switch (slot) {
    case 'avatar': return 'جلوبەرگ'
    case 'headwear': return 'سەرپۆش'
    case 'accessory': return 'ئیکسسوار'
    case 'border': return 'لێوار'
    case 'title': return 'نازناو'
    case 'trail': return 'شوێنپێ'
    case 'mapAura': return 'جوانکاری نەخشە'
    case 'emote': return 'جووڵە'
    case 'companion': return 'هاوەڵ'
  }
}
