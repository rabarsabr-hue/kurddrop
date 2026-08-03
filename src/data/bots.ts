/**
 * Map bot seed profiles — static names, hubs, and seed version keys.
 * Placement / Firestore seeding logic stays in locationService.
 */

import type { Gender } from '../services/userService'

export const BOT_UID_PREFIX = 'kd_bot_'
/** Bump when bot docs need a full rewrite with safer defaults */
export const BOT_SEED_VERSION = 12
/** localStorage key — bump alongside BOT_SEED_VERSION so clients re-seed once */
export const BOT_SEED_STORAGE_KEY = 'kd_city_bots_seed_v12'
/** تەنها ٢٠ بۆت لەناو هەولێر */
export const BOTS_PER_CITY = 20
export const BOT_TOTAL = 20
/** کەمترین مەودا لەنێوان بۆتەکان */
export const BOT_MIN_SEPARATION_M = 3000
/** Offset from NPC hubs so bots never share exact NPC coordinates */
export const BOT_NPC_HUB_OFFSET_M = 1600

/** تەنها هەولێر — هیچ شارێکی تر بۆ بۆت/کارەکتەر نییە */
export const BOT_CITY_CENTERS: Array<{ key: string; name: string; lat: number; lng: number }> = [
  { key: 'erbil', name: 'هەولێر', lat: 36.1911, lng: 44.0092 },
]

/**
 * ٢٠ خاڵی جێگیر لەناو هەولێر — هەمان تۆڕی npcData، بەڵام offset لە locationService
 */
export const ERBIL_NPC_HUB_COORDS: Array<{ key: string; lat: number; lng: number }> = [
  { key: 'qalat', lat: 36.1911, lng: 44.0092 },
  { key: 'ankawa', lat: 36.2217, lng: 43.9678 },
  { key: 'west_erbil', lat: 36.1391, lng: 44.0149 },
  { key: 'dream_city', lat: 36.2368, lng: 44.0526 },
  { key: 'italian_village', lat: 36.1803, lng: 43.9336 },
  { key: 'family_mall', lat: 36.1557, lng: 44.0781 },
  { key: 'rizgary', lat: 36.2582, lng: 43.9869 },
  { key: 'bahar', lat: 36.1266, lng: 43.9677 },
  { key: 'kasnazan', lat: 36.2171, lng: 44.0974 },
  { key: 'ministries', lat: 36.2211, lng: 43.9192 },
  { key: 'street_100', lat: 36.1175, lng: 44.0519 },
  { key: 'park_sami', lat: 36.2711, lng: 44.0403 },
  { key: 'south_ring', lat: 36.1478, lng: 43.9167 },
  { key: 'north_ring', lat: 36.1721, lng: 44.1165 },
  { key: 'airport_road', lat: 36.2655, lng: 43.9444 },
  { key: 'gulan', lat: 36.0988, lng: 43.9944 },
  { key: 'empire', lat: 36.2525, lng: 44.0994 },
  { key: 'kurd_museum', lat: 36.1951, lng: 43.8888 },
  { key: 'english_village', lat: 36.1211, lng: 44.0964 },
  { key: 'hasarok', lat: 36.2922, lng: 44.0034 },
]

export const BOT_NAME_POOL: Array<{ name: string; gender: Gender }> = [
  { name: 'ئاریان', gender: 'male' },
  { name: 'ژینۆ', gender: 'female' },
  { name: 'کاروان', gender: 'male' },
  { name: 'لانی', gender: 'female' },
  { name: 'ڕێبوار', gender: 'male' },
  { name: 'سۆنیا', gender: 'female' },
  { name: 'شێرزاد', gender: 'male' },
  { name: 'نیان', gender: 'female' },
  { name: 'دانا', gender: 'male' },
  { name: 'تارا', gender: 'female' },
  { name: 'هەردی', gender: 'male' },
  { name: 'دیلان', gender: 'female' },
  { name: 'بەرزان', gender: 'male' },
  { name: 'هێمن', gender: 'male' },
  { name: 'ڕۆژین', gender: 'female' },
  { name: 'سۆران', gender: 'male' },
  { name: 'ئاڤین', gender: 'female' },
  { name: 'کۆڤان', gender: 'male' },
  { name: 'ژیلان', gender: 'female' },
  { name: 'ئازاد', gender: 'male' },
  { name: 'هێلین', gender: 'female' },
  { name: 'ڕێبین', gender: 'male' },
  { name: 'ڤیان', gender: 'female' },
  { name: 'نەوزاد', gender: 'male' },
  { name: 'شیلان', gender: 'female' },
  { name: 'ئاراس', gender: 'male' },
  { name: 'گولان', gender: 'female' },
  { name: 'پێشڕەو', gender: 'male' },
  { name: 'ئاڵا', gender: 'female' },
  { name: 'سەردار', gender: 'male' },
  { name: 'ژین', gender: 'female' },
  { name: 'هەڤاڵ', gender: 'male' },
  { name: 'ئاوات', gender: 'female' },
  { name: 'کەمال', gender: 'male' },
  { name: 'پێری', gender: 'female' },
  { name: 'نەبەز', gender: 'male' },
  { name: 'سڕوا', gender: 'female' },
  { name: 'چاڤدار', gender: 'male' },
  { name: 'ڕووناک', gender: 'female' },
  { name: 'ئەردەلان', gender: 'male' },
  { name: 'نازدار', gender: 'female' },
  { name: 'بەختیار', gender: 'male' },
  { name: 'شەهلا', gender: 'female' },
  { name: 'کاوە', gender: 'male' },
  { name: 'لەیلان', gender: 'female' },
  { name: 'مەریوان', gender: 'male' },
  { name: 'ئێڤان', gender: 'female' },
  { name: 'سەفین', gender: 'male' },
  { name: 'کوردستان', gender: 'female' },
  { name: 'ئەمیر', gender: 'male' },
  { name: 'زەریا', gender: 'female' },
  { name: 'ڕۆژهات', gender: 'male' },
  { name: 'شیرین', gender: 'female' },
  { name: 'فەرمان', gender: 'male' },
  { name: 'نەسرین', gender: 'female' },
  { name: 'ئاری', gender: 'male' },
  { name: 'هانا', gender: 'female' },
  { name: 'دیلان', gender: 'male' },
  { name: 'سارا', gender: 'female' },
  { name: 'ڕێناس', gender: 'male' },
]
