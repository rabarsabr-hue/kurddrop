import type { User } from 'firebase/auth'
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { initAnonymousAuth, db, storage } from '../firebase'
import {
  normalizeVipPasses,
  emptyVipPassesState,
  type VipPassesState,
  type PassKind,
} from './passService'
import {
  makeNotificationId,
  parseInboxNotifications,
  type InboxNotification,
} from './notificationService'
import {
  DEFAULT_AVATAR_3D,
  normalizeAvatar3d,
  type Avatar3DCustomization,
} from '../fullBody3dAvatar'
import { isProtectedAccount, lockProtectedWallet } from '../data/protectedPlayers'
import {
  computeHunterLevel,
  parseDropsOpenedByType,
  EMPTY_DROPS_OPENED,
  type DropsOpenedByType,
} from '../hunterLevel'

export type { DropsOpenedByType }

export type { Avatar3DCustomization }

export type { InboxNotification }

export type Gender = 'male' | 'female'
export type Currency = 'gold' | 'diamond'
export type AppLanguage = 'ku' | 'ar' | 'en'

export interface UserSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  notificationsEnabled: boolean
  radarAlertsEnabled: boolean
  /** ئاگادارکردنەوەی داوای هاوڕێیەتی */
  friendRequestNotifsEnabled: boolean
  showOtherPlayers: boolean
  showMyAvatarOnMap: boolean
  batterySaver: boolean
  highGraphics: boolean
  mirrorMap: boolean
  language: AppLanguage
  /** Ghost / Incognito — شوێن لەسەر نەخشەی کەسانی تر ون دەبێت */
  hideLocation: boolean
  /** ٠–١ قەبارەی دەنگی SFX */
  sfxVolume: number
  /** پیشاندانی ناوی یاریزان لەسەر نەخشە */
  showPlayerNames: boolean
  /** ڕێگری لە وەرگرتنی دیاریی هاتوو */
  blockIncomingGifts: boolean
  /** ٠–١ قەبارەی دەنگی مۆسیقای باکگراوند */
  musicVolume: number
  /** دەنگی فڕینی تەیارە */
  planeSoundEnabled: boolean
  planeVolume: number
  /** دەنگی بەخشین/دیاری */
  giftSoundEnabled: boolean
  giftVolume: number
  /** دەنگی کردنەوەی سندوق/درۆپ */
  chestSoundEnabled: boolean
  chestVolume: number
  /** دۆخی تارمایی — کاتێک لاپەڕە دەچێتە باکگراوند، خێرا ئۆفلاین دیار بکە */
  hideWhenOffline: boolean
  /** بلۆککراوەکان لە نەخشە/لیستی نزیک شاردنەوە */
  hideBlockedUsers: boolean
  /** شاردنەوەی نامەکانی خۆم لە چاتی گشتی بۆ ئەوانی تر */
  hideGlobalChat: boolean
  /** ڕێگەدان بە کەسانی ناهاوڕێ بۆ ناردنی نامەی تایبەت */
  allowDmWithoutFriendship: boolean
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  soundEnabled: true,
  musicEnabled: true,
  notificationsEnabled: true,
  radarAlertsEnabled: true,
  friendRequestNotifsEnabled: true,
  showOtherPlayers: true,
  showMyAvatarOnMap: true,
  batterySaver: false,
  highGraphics: true,
  mirrorMap: false,
  language: 'ku',
  hideLocation: false,
  sfxVolume: 1,
  showPlayerNames: true,
  blockIncomingGifts: false,
  musicVolume: 0.5,
  planeSoundEnabled: true,
  planeVolume: 1,
  giftSoundEnabled: true,
  giftVolume: 1,
  chestSoundEnabled: true,
  chestVolume: 1,
  hideWhenOffline: true,
  hideBlockedUsers: false,
  hideGlobalChat: false,
  /** false = تەنها هاوڕێ نامە بنێرێت؛ default true = هەموو کەس (تۆگڵەکە ناچاڵاک) */
  allowDmWithoutFriendship: true,
}

export interface PlayerStats {
  chestsOpened: number
  dailyBonusClaims: number
  distanceTraveledM: number
  playTimeMs: number
  itemsPurchased: number
  giftsReceived: number
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  chestsOpened: 0,
  dailyBonusClaims: 0,
  distanceTraveledM: 0,
  playTimeMs: 0,
  itemsPurchased: 0,
  giftsReceived: 0,
}

export interface BlockedUser { uid: string; name: string }
export interface FriendEntry { uid: string; name: string; playerId: string }
export interface GiftLogEntry { from: string; fromName: string; amount: number; atMs: number }

export interface UserProfile {
  name: string
  /** ناوی بەکارهێنەری تایبەت (@username) */
  username: string
  /** ئیمەیڵی هەژمار */
  email: string
  /** ژمارەی مۆبایل */
  phone: string
  /** یەکجار گۆڕینی یوزەرنەیم بەکارهاتووە */
  usernameEditUsed: boolean
  /** یەکجار گۆڕینی ئیمەیڵ بەکارهاتووە */
  emailEditUsed: boolean
  /** یەکجار گۆڕینی مۆبایل بەکارهاتووە */
  phoneEditUsed: boolean
  gender: Gender
  gold: number
  diamond: number
  isPremium: boolean
  title: string
  avatarUrl: string | null
  /** 3D character look — skin / hair / eyes / outfit (map + UI). */
  avatar3d: Avatar3DCustomization
  playerId: string
  settings: UserSettings
  stats: PlayerStats
  /** ژمارەی کردنەوەی درۆپ بەپێی جۆر (١–٥) — بنەمای ئاستی ڕاوکەر */
  dropsOpenedByType: DropsOpenedByType
  /** ئاستی ڕاوکەر (لەسەر درۆپ) */
  hunterLevel: number
  /** ئاستی گشتیی یاریزان (سیستەمی XP) */
  playerLevel: number
  /** XPی ناو ئاستی ئێستا (بەرەو ئاستی دواتر) */
  playerXp: number
  /** خەڵاتی بەخێرهاتن جارێک دراوە */
  welcomeBonusGranted: boolean
}

export const MAX_FRIENDS = 100

export interface InventoryItem {
  id: number
  name: string
  icon: string
  desc: string
  price: number
  curr: Currency
  active: boolean
  /** کاتی بەسەرچوونی قەڵغان/بەرگری (ms) — بۆ id=4 */
  expiresAtMs?: number
}

export interface FullUserData extends UserProfile {
  inventory: InventoryItem[]
  dailyBonusDay: number
  dailyBonusLastClaimMs: number | null
  /** کاتی دوایین سووڕانی بێبەرامبەری چەرخی بەخت (ms) — ٢٤ کاتژمێر */
  spinLastFreeAtMs: number | null
  /** ژمارەی سووڕان لەم پەنجەرەی ٢٤ کاتژمێرەدا (دوای بێبەرامبەر) */
  spinSpinsInWindow: number
  /** ئاگادارییەکانی خوێندراو — لە Firestore دەپارێزرێت */
  readNotificationIds: string[]
  blockedUsers: BlockedUser[]
  friends: FriendEntry[]
  giftsLog: GiftLogEntry[]
  /** ئاگادارییەکانی هاتوو (دزی، بلۆک، …) لە Firestore */
  inboxNotifications: InboxNotification[]
  /** کاتی دوایین کردنەوەی هەر جۆرێکی درۆپ (ms) — بۆ ڕاگرتنی ٢٤ کاتژمێری */
  dropTypeCooldowns: Record<string, number>
  /** قەڵغانی خۆکار دوای دزین — تا ئەم کاتە (ms) */
  stealShieldUntilMs: number
  /** Cooldownی دزەکە دوای دزی سەرکەوتوو — تا ئەم کاتە (ms) */
  stealCooldownUntilMs: number
  /** قەدەغەی شەڕ دوای دۆڕان — تا ئەم کاتە (ms) */
  fightBanUntilMs: number
  /** ژمێریاری داواکاری شەڕ بۆ هەر یاریزانێک */
  fightChallengeLog: Record<string, { count: number; banUntilMs: number }>
  /** داواکاری شەڕی هاتوو (١٥ چرکە) */
  incomingFight: {
    duelId: string
    fromUid: string
    fromName: string
    expiresAtMs: number
  } | null
  /** دزی هاتوو — قبوڵ/ڕەت لە کاتی ئۆنلاین */
  incomingHeist: IncomingHeistSummary | null
  /** شاری خۆی (کلیلی فڕۆکە) — درۆپی شارەکانی تر ٢× */
  homeCityKey: string
  /** یاریزانانی چاتەکەیان سڕکراوە (Mute) */
  mutedChatUids: string[]
}

export type HeistMode = 'online' | 'offline'
export type HeistStatus = 'active' | 'rejected' | 'cancelled' | 'completed' | 'expired'

export interface IncomingHeistSummary {
  heistId: string
  thiefUid: string
  thiefName: string
  mode: HeistMode
  startedAtMs: number
  expiresAtMs: number
  notifId: string
}

export interface HeistSession {
  id: string
  thiefUid: string
  thiefName: string
  victimUid: string
  victimName: string
  mode: HeistMode
  status: HeistStatus
  startedAtMs: number
  expiresAtMs: number
  notifId: string
  /** قوربانی ڕازی بووە — ئیتر ناتوانێت ڕەت بکاتەوە */
  victimAccepted: boolean
}

export const STEAL_HACK_MS = 90_000
export const STEAL_HEIST_TIMEOUT_MS = 90_000
export const STEAL_SHIELD_MS = 24 * 60 * 60 * 1000
export const STEAL_ATTACKER_COOLDOWN_MS = 6 * 60 * 60 * 1000
export const STEAL_ONLINE_GOLD_PCT = 0.07
export const STEAL_ONLINE_DIAMOND_PCT = 0.05
export const STEAL_OFFLINE_GOLD_PCT = 0.05
export const STEAL_OFFLINE_DIAMOND_PCT = 0.03
export const STEAL_MAX_PER_VICTIM_PER_DAY = 3
export const FIGHT_MAX_CONSECUTIVE = 3
export const FIGHT_CHALLENGE_BAN_MS = 24 * 60 * 60 * 1000
export const FIGHT_LOSER_BAN_MS = 24 * 60 * 60 * 1000
export const FIGHT_SMOKE_MS = 5 * 60 * 1000
export const FIGHT_DUEL_FX_MS = 90_000
/** بێبەرامبەری چەرخی بەخت — یەک جار هەر ٢٤ کاتژمێر */
export const SPIN_FREE_COOLDOWN_MS = 24 * 60 * 60 * 1000

/**
 * Firestore کاتەکان وەک number یان Timestamp دەگەڕێنێتەوە —
 * ئەگەر تەنها `typeof === 'number'` بپشکنین، cooldown دەسڕێتەوە.
 */
export function parseEpochMs(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return Math.floor(raw)
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) return Math.floor(n)
  }
  if (raw != null && typeof raw === 'object') {
    const t = raw as { toMillis?: () => number; seconds?: number }
    if (typeof t.toMillis === 'function') {
      try {
        const ms = t.toMillis()
        if (Number.isFinite(ms) && ms > 0) return Math.floor(ms)
      } catch { /* ignore */ }
    }
    if (typeof t.seconds === 'number' && Number.isFinite(t.seconds) && t.seconds > 0) {
      return Math.floor(t.seconds * 1000)
    }
  }
  return null
}

/** دۆخی چەرخی بەخت لەسەر Firestore — بێبەرامبەر هەر ٢٤ کاتژمێر جارێک */
export function getSpinWindowState(
  data: { spinLastFreeAtMs?: number | null; spinSpinsInWindow?: number },
  now = Date.now(),
): { spinsToday: number; freeReady: boolean } {
  const lastFree = parseEpochMs(data.spinLastFreeAtMs) ?? (typeof data.spinLastFreeAtMs === 'number' ? data.spinLastFreeAtMs : null)
  const freeReady = lastFree == null || lastFree <= 0 || (now - lastFree) >= SPIN_FREE_COOLDOWN_MS
  if (freeReady) return { spinsToday: 0, freeReady: true }
  const inWindow = Math.max(1, Math.floor(Number(data.spinSpinsInWindow) || 1))
  return { spinsToday: inWindow, freeReady: false }
}

function parseReadNotificationIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.map((x) => String(x ?? '')).filter(Boolean))].slice(-400)
}

export const MUTE_SYSTEM_MESSAGE =
  '⚠️ ئەم بەکارھێنەرە چاتی تۆی سڕ (Mute) کردووە و ئاگاداریی هاتنی نامەکەت پێناگات.'

function utcDayKey(ms = Date.now()): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function parseStringUidList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.map(x => String(x ?? '')).filter(Boolean))]
}

function parseStealDailyLog(raw: unknown): Record<string, { day: string; count: number }> {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, { day: string; count: number }> = {}
  for (const [uid, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!uid || v == null || typeof v !== 'object') continue
    const row = v as Record<string, unknown>
    const day = typeof row.day === 'string' ? row.day : ''
    const count = Number(row.count) || 0
    if (day) out[uid] = { day, count }
  }
  return out
}

function parseFightChallengeLog(raw: unknown): Record<string, { count: number; banUntilMs: number }> {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, { count: number; banUntilMs: number }> = {}
  for (const [uid, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!uid || v == null || typeof v !== 'object') continue
    const row = v as Record<string, unknown>
    out[uid] = {
      count: Math.max(0, Number(row.count) || 0),
      banUntilMs: Number(row.banUntilMs) || 0,
    }
  }
  return out
}

export const DAILY_BONUS_TOTAL_DAYS = 30
export const DAILY_BONUS_MIN_GAP_MS = 24 * 60 * 60 * 1000 // ٢٤ کاتژمێر نێوان هەردوو دیاریی ڕۆژانە
/** ئەگەر ٢٤ کاتژمێر دوای کاتی بەردەستبوونی دیاری داخڵ نەبیتەوە → ڕۆژی ١ */
export const DAILY_BONUS_STREAK_BREAK_MS = 2 * DAILY_BONUS_MIN_GAP_MS
/** کۆی زێڕ / ئەڵماسی مانگێکی تەواو (٣٠ ڕۆژ) */
export const DAILY_BONUS_MONTHLY_GOLD = 1500
export const DAILY_BONUS_MONTHLY_DIAMOND = 1000
export const DAILY_BONUS_DAY1_GOLD = 15
export const DAILY_BONUS_DAY1_DIAMOND = 3

export interface DailyBonusPreviewLine {
  icon: string
  text: string
}

export interface DailyBonusGrantItem {
  id: number
  name: string
  icon: string
  desc: string
  price: number
  curr: Currency
}

export interface DailyBonusRewardDef {
  day: number
  title: string
  cardIcon: string
  kind: 'currency' | 'chest' | 'bundle'
  preview: DailyBonusPreviewLine[]
  gold?: number
  diamond?: number
  item?: DailyBonusGrantItem
}

/** دابەشکردنی کۆی مانگانە — ڕۆژی ١ جێگیر، پاشان زیادبوونی یەکسان، کۆی گشتی Exact */
function distributeMonthlyAmounts(total: number, day1: number, days: number): number[] {
  const n = Math.max(1, days)
  if (n === 1) return [Math.max(0, total)]
  const a = Math.max(0, Math.min(day1, total))
  // زنجیرەی ژمێرەیی: a, a+d, a+2d, …  →  sum = n*a + d*n*(n-1)/2
  const denom = n * (n - 1)
  const d = denom > 0 ? (2 * (total - n * a)) / denom : 0
  const out: number[] = []
  let used = 0
  for (let i = 0; i < n - 1; i++) {
    const v = Math.max(0, Math.round(a + d * i))
    out.push(v)
    used += v
  }
  out.push(Math.max(0, total - used))
  return out
}

function buildDailyBonusRewards(): DailyBonusRewardDef[] {
  const golds = distributeMonthlyAmounts(
    DAILY_BONUS_MONTHLY_GOLD,
    DAILY_BONUS_DAY1_GOLD,
    DAILY_BONUS_TOTAL_DAYS,
  )
  const diamonds = distributeMonthlyAmounts(
    DAILY_BONUS_MONTHLY_DIAMOND,
    DAILY_BONUS_DAY1_DIAMOND,
    DAILY_BONUS_TOTAL_DAYS,
  )
  const rewards: DailyBonusRewardDef[] = []
  for (let day = 1; day <= DAILY_BONUS_TOTAL_DAYS; day++) {
    const gold = golds[day - 1] ?? 0
    const diamond = diamonds[day - 1] ?? 0
    const isFinale = day === DAILY_BONUS_TOTAL_DAYS
    rewards.push({
      day,
      title: isFinale ? 'خەڵاتی کۆتایی' : `ڕۆژی ${day}`,
      cardIcon: day % 2 === 0 ? '💎' : '🪙',
      kind: 'currency',
      preview: [
        { icon: '🪙', text: `${gold.toLocaleString('en-US')} زێڕ` },
        { icon: '💎', text: `${diamond.toLocaleString('en-US')} ئەڵماس` },
      ],
      gold,
      diamond,
    })
  }
  return rewards
}

export const DAILY_BONUS_REWARDS: DailyBonusRewardDef[] = buildDailyBonusRewards()

/** ئەگەر زیاتر لە ٢٤ کاتژمێر دوای کاتی وەرگرتن نەهاتەوە → ڕۆژی ١ */
export function isDailyBonusStreakBroken(lastClaimMs: number | null, nowMs = Date.now()): boolean {
  if (lastClaimMs == null) return false
  return nowMs - lastClaimMs > DAILY_BONUS_STREAK_BREAK_MS
}

export function resolveDailyBonusStreakDay(
  storedDay: number,
  lastClaimMs: number | null,
  nowMs = Date.now(),
): number {
  if (isDailyBonusStreakBroken(lastClaimMs, nowMs)) return 1
  return Math.min(Math.max(1, Math.floor(Number(storedDay) || 1)), DAILY_BONUS_TOTAL_DAYS)
}

/** ئەگەر ستریک شکابێت، ڕۆژ بگەڕێنەرەوە بۆ ١ لە سێرڤەر */
export async function persistDailyBonusStreakReset(uid: string, playerId?: string): Promise<void> {
  if (!uid) return
  const pid = (playerId || '').trim() || await resolvePlayerId(uid)
  await dualWritePlayerProgress(uid, pid, { dailyBonusDay: 1 })
  try {
    const cached = loadUserDataLocal(pid) ?? loadUserDataLocal(uid)
    saveUserDataLocal(uid, {
      playerId: pid,
      gold: cached?.gold ?? 0,
      diamond: cached?.diamond ?? 0,
      dailyBonusDay: 1,
      dailyBonusLastClaimMs: cached?.dailyBonusLastClaimMs ?? null,
    })
  } catch { /* ignore */ }
}

export function getDailyBonusRewardDef(day: number): DailyBonusRewardDef {
  const clamped = Math.min(Math.max(1, day), DAILY_BONUS_TOTAL_DAYS)
  return DAILY_BONUS_REWARDS[clamped - 1] ?? DAILY_BONUS_REWARDS[0]
}

/** @deprecated — بۆ پاشەکەوتکردنی ناوە؛ بەکاربهێنە getDailyBonusRewardDef */
export function getDailyBonusReward(day: number): number {
  return getDailyBonusRewardDef(day).diamond ?? 0
}

export function formatDailyBonusSummary(reward: DailyBonusRewardDef): string {
  return reward.preview.map(p => `${p.icon} ${p.text}`).join(' · ')
}

export interface MarketPurchaseItem {
  id: number
  name: string
  icon: string
  desc: string
  price: number
  curr: Currency
}

const maleNames = ['ئاریان', 'کاروان', 'ڕێبوار', 'شێرزاد', 'دانا', 'هەردی']
const femaleNames = ['ژینۆ', 'لانی', 'سۆنیا', 'نیان', 'تارا', 'دیلان']

const DEFAULT_TITLE = 'ڕاوکەر'

/** خەڵاتی بەخێرهاتن — باڵانسی دەستپێکی ستاندارد بۆ هەموو کەسایەتییە نوێیەکان */
export const WELCOME_BONUS_GOLD = 500
export const WELCOME_BONUS_DIAMOND = 35
/** دەبێت لەگەڵ LEADERBOARD_EPOCH بگونجێت (leaderboardService) */
export const GAMEPLAY_LEADERBOARD_EPOCH = 3

/** Standard starting wallet (diamond = gems, gold) */
export function getDefaultStartingWallet(): Pick<UserProfile, 'gold' | 'diamond'> {
  return {
    gold: WELCOME_BONUS_GOLD,
    diamond: WELCOME_BONUS_DIAMOND,
  }
}

/**
 * Soft sanitization only — earned balances must persist across login/refresh.
 * (Previously these caps equaled the welcome bonus and wiped progress on every sync.)
 */
export const WALLET_CAP_GOLD = Number.MAX_SAFE_INTEGER
export const WALLET_CAP_DIAMOND = Number.MAX_SAFE_INTEGER

/** Normalize wallet to non-negative integers. Does not cap earned progress. */
export function clampWalletToCap<T extends { gold: number; diamond: number }>(wallet: T): T {
  const gold = Math.max(0, Math.round(Number(wallet.gold) || 0))
  const diamond = Math.max(0, Math.round(Number(wallet.diamond) || 0))
  if (gold === wallet.gold && diamond === wallet.diamond) return wallet
  return { ...wallet, gold, diamond }
}

/** localStorage key — prefer in-game playerId, fall back to Firebase uid */
export function userDataLocalKey(id: string): string {
  return `user_data_${id}`
}

export type UserDataLocalCache = {
  playerId: string
  uid?: string
  gold: number
  diamond: number
  isPremium: boolean
  playerLevel: number
  playerXp: number
  hunterLevel: number
  name: string
  username: string
  gender: Gender
  title: string
  avatarUrl: string | null
  avatar3d: Avatar3DCustomization
  inventory: InventoryItem[]
  dropsOpenedByType: DropsOpenedByType
  welcomeBonusGranted: boolean
  dailyBonusDay?: number
  dailyBonusLastClaimMs?: number | null
  spinLastFreeAtMs?: number | null
  spinSpinsInWindow?: number
  readNotificationIds?: string[]
  cachedAtMs: number
}

const playerIdByUidCache = new Map<string, string>()

export function rememberPlayerId(uid: string, playerId: string): void {
  if (uid && playerId) playerIdByUidCache.set(uid, playerId)
}

export function getCachedPlayerId(uid: string): string | null {
  return playerIdByUidCache.get(uid) ?? null
}

/** Display form of the persistent in-game Player ID (matches profile UI). */
export function formatPlayerIdDisplay(playerId: string | null | undefined): string {
  const id = typeof playerId === 'string' ? playerId.trim() : ''
  return id
}

export function saveUserDataLocal(
  uid: string,
  data: {
    gold: number
    diamond: number
    playerId?: string
    isPremium?: boolean
    playerLevel?: number
    playerXp?: number
    hunterLevel?: number
    name?: string
    username?: string
    gender?: Gender
    title?: string
    avatarUrl?: string | null
    avatar3d?: Avatar3DCustomization
    inventory?: InventoryItem[]
    dropsOpenedByType?: DropsOpenedByType
    welcomeBonusGranted?: boolean
    dailyBonusDay?: number
    dailyBonusLastClaimMs?: number | null
    spinLastFreeAtMs?: number | null
    spinSpinsInWindow?: number
    readNotificationIds?: string[]
  },
): void {
  if (typeof localStorage === 'undefined') return
  const playerId = (data.playerId || getCachedPlayerId(uid) || '').trim()
  if (!uid && !playerId) return
  try {
    const prev = (playerId ? loadUserDataLocal(playerId) : null) ?? (uid ? loadUserDataLocal(uid) : null)
    const wallet = clampWalletToCap({
      gold: data.gold,
      diamond: data.diamond,
    })
    const payload: UserDataLocalCache = {
      playerId: playerId || prev?.playerId || '',
      uid: uid || prev?.uid,
      gold: wallet.gold,
      diamond: wallet.diamond,
      isPremium: data.isPremium ?? prev?.isPremium ?? false,
      playerLevel: Math.max(1, Math.floor(data.playerLevel ?? prev?.playerLevel ?? 1)),
      playerXp: Math.max(0, Math.floor(data.playerXp ?? prev?.playerXp ?? 0)),
      hunterLevel: Math.max(0, Math.floor(data.hunterLevel ?? prev?.hunterLevel ?? 0)),
      name: data.name ?? prev?.name ?? 'یاریزان',
      username: data.username ?? prev?.username ?? '',
      gender: data.gender === 'female' || data.gender === 'male' ? data.gender : (prev?.gender ?? 'male'),
      title: data.title ?? prev?.title ?? DEFAULT_TITLE,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : (prev?.avatarUrl ?? null),
      avatar3d: normalizeAvatar3d(data.avatar3d ?? prev?.avatar3d ?? DEFAULT_AVATAR_3D),
      inventory: Array.isArray(data.inventory) ? data.inventory : (prev?.inventory ?? []),
      dropsOpenedByType: data.dropsOpenedByType
        ? parseDropsOpenedByType(data.dropsOpenedByType)
        : (prev?.dropsOpenedByType ?? { ...EMPTY_DROPS_OPENED }),
      welcomeBonusGranted: data.welcomeBonusGranted ?? prev?.welcomeBonusGranted ?? true,
      dailyBonusDay: Math.max(1, Math.floor(data.dailyBonusDay ?? prev?.dailyBonusDay ?? 1)),
      dailyBonusLastClaimMs: data.dailyBonusLastClaimMs !== undefined
        ? data.dailyBonusLastClaimMs
        : (prev?.dailyBonusLastClaimMs ?? null),
      spinLastFreeAtMs: data.spinLastFreeAtMs !== undefined
        ? data.spinLastFreeAtMs
        : (prev?.spinLastFreeAtMs ?? null),
      spinSpinsInWindow: Math.max(0, Math.floor(data.spinSpinsInWindow ?? prev?.spinSpinsInWindow ?? 0)),
      readNotificationIds: Array.isArray(data.readNotificationIds)
        ? data.readNotificationIds.slice(-400)
        : (prev?.readNotificationIds ?? []),
      cachedAtMs: Date.now(),
    }
    const json = JSON.stringify(payload)
    // Canonical key is playerId when available; also mirror under uid for auth bootstrap
    if (payload.playerId) localStorage.setItem(userDataLocalKey(payload.playerId), json)
    if (uid) localStorage.setItem(userDataLocalKey(uid), json)
    if (uid && payload.playerId) rememberPlayerId(uid, payload.playerId)
  } catch (err) {
    console.error('saveUserDataLocal failed:', err)
  }
}

export function loadUserDataLocal(id: string): UserDataLocalCache | null {
  if (!id || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(userDataLocalKey(id))
    if (!raw) return null
    const data = JSON.parse(raw) as Record<string, unknown>
    // Legacy caches may still carry a dinar (iqd) balance — fold it into diamond once, then drop it.
    const legacyIqd = Number(data.iqd) || 0
    const wallet = clampWalletToCap({
      gold: Number(data.gold) || 0,
      diamond: (Number(data.diamond) || 0) + Math.floor(legacyIqd / 100),
    })
    const playerId = typeof data.playerId === 'string' ? data.playerId : (/^\d{8}$/.test(id) ? id : '')
    const uid = typeof data.uid === 'string' ? data.uid : undefined
    if (uid && playerId) rememberPlayerId(uid, playerId)
    return {
      playerId,
      uid,
      ...wallet,
      isPremium: Boolean(data.isPremium),
      playerLevel: Math.max(1, Math.floor(Number(data.playerLevel) || 1)),
      playerXp: Math.max(0, Math.floor(Number(data.playerXp) || 0)),
      hunterLevel: Math.max(0, Math.floor(Number(data.hunterLevel) || 0)),
      name: typeof data.name === 'string' && data.name.trim() ? data.name : 'یاریزان',
      username: typeof data.username === 'string' ? data.username : '',
      gender: data.gender === 'female' ? 'female' : 'male',
      title: typeof data.title === 'string' && data.title.trim() ? data.title : DEFAULT_TITLE,
      avatarUrl: typeof data.avatarUrl === 'string' && data.avatarUrl ? data.avatarUrl : null,
      avatar3d: normalizeAvatar3d(data.avatar3d),
      inventory: parseInventory(data.inventory),
      dropsOpenedByType: parseDropsOpenedByType(data.dropsOpenedByType),
      welcomeBonusGranted: data.welcomeBonusGranted !== false,
      dailyBonusDay: Math.max(1, Math.floor(Number(data.dailyBonusDay) || 1)),
      dailyBonusLastClaimMs: parseEpochMs(data.dailyBonusLastClaimMs),
      spinLastFreeAtMs: parseEpochMs(data.spinLastFreeAtMs),
      spinSpinsInWindow: Math.max(0, Math.floor(Number(data.spinSpinsInWindow) || 0)),
      readNotificationIds: parseReadNotificationIds(data.readNotificationIds),
      cachedAtMs: Number(data.cachedAtMs) || 0,
    }
  } catch (err) {
    console.error('loadUserDataLocal failed:', err)
    try { localStorage.removeItem(userDataLocalKey(id)) } catch { /* ignore */ }
    return null
  }
}

function createDefaultProfile(): UserProfile {
  const gender: Gender = Math.random() < 0.5 ? 'male' : 'female'
  const names = gender === 'male' ? maleNames : femaleNames
  const name = names[Math.floor(Math.random() * names.length)]
  return {
    name,
    username: '',
    email: '',
    phone: '',
    usernameEditUsed: false,
    emailEditUsed: false,
    phoneEditUsed: false,
    gender,
    ...getDefaultStartingWallet(),
    isPremium: false,
    title: DEFAULT_TITLE,
    avatarUrl: null,
    avatar3d: {
      ...DEFAULT_AVATAR_3D,
      hairStyle: gender === 'female' ? 'long' : 'short',
    },
    playerId: '',
    settings: { ...DEFAULT_USER_SETTINGS },
    stats: { ...DEFAULT_PLAYER_STATS },
    dropsOpenedByType: { ...EMPTY_DROPS_OPENED },
    hunterLevel: 0,
    playerLevel: 1,
    playerXp: 0,
    welcomeBonusGranted: true,
  }
}

// ID تایبەتی یاریزان: ٨ ژمارەی تێکەڵاو (١٠٠٠٠٠٠٠ - ٩٩٩٩٩٩٩٩)
function generatePlayerId(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000))
}

// جێگیرکردنی IDـێکی جیاواز لە کۆلێکشنی playerIds — هەوڵدانەوە ئەگەر دووبارە بوو
async function reserveUniquePlayerId(uid: string): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = generatePlayerId()
    const idRef = doc(db, 'playerIds', candidate)
    try {
      const reserved = await runTransaction(db, async transaction => {
        const idSnap = await transaction.get(idRef)
        if (idSnap.exists()) return false
        transaction.set(idRef, { uid, createdAt: serverTimestamp() })
        return true
      })
      if (reserved) {
        rememberPlayerId(uid, candidate)
        return candidate
      }
    } catch {
      // هەوڵدانەوە بە IDـێکی نوێ
    }
  }
  // فۆڵباک — زۆر دەگمەنە پێی بگات
  const fallback = String(Date.now()).slice(-8)
  rememberPlayerId(uid, fallback)
  return fallback
}

/** Resolve the persistent in-game Player ID for a Firebase Auth uid. */
export async function resolvePlayerId(uid: string): Promise<string> {
  if (!uid) return ''
  const cached = getCachedPlayerId(uid)
  if (cached) return cached
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  const existing = typeof snap.data()?.playerId === 'string' ? String(snap.data()!.playerId).trim() : ''
  if (existing) {
    rememberPlayerId(uid, existing)
    return existing
  }
  const reserved = await reserveUniquePlayerId(uid)
  if (snap.exists()) {
    await updateDoc(userRef, { playerId: reserved, updatedAt: serverTimestamp() })
  } else {
    await setDoc(userRef, { playerId: reserved, updatedAt: serverTimestamp() }, { merge: true })
  }
  return reserved
}

type PlayerProgressSeed = {
  gold?: number
  diamond?: number
  isPremium?: boolean
  playerLevel?: number
  playerXp?: number
  hunterLevel?: number
  name?: string
  username?: string
  gender?: Gender
  title?: string
  avatarUrl?: string | null
  avatar3d?: Avatar3DCustomization
  inventory?: InventoryItem[]
  dropsOpenedByType?: DropsOpenedByType
  welcomeBonusGranted?: boolean
  totalWealth?: number
  giftsSentScore?: number
  leaderboardEpoch?: number
}

function buildPlayerProgressPayload(
  playerId: string,
  uid: string,
  seed?: PlayerProgressSeed,
): Record<string, unknown> {
  const wallet = clampWalletToCap({
    gold: seed?.gold ?? WELCOME_BONUS_GOLD,
    diamond: seed?.diamond ?? WELCOME_BONUS_DIAMOND,
  })
  return {
    uid,
    playerId,
    ...wallet,
    isPremium: seed?.isPremium ?? false,
    name: seed?.name ?? 'یاریزان',
    username: seed?.username ?? '',
    gender: seed?.gender === 'female' ? 'female' : 'male',
    title: seed?.title ?? DEFAULT_TITLE,
    avatarUrl: seed?.avatarUrl ?? null,
    avatar3d: normalizeAvatar3d(seed?.avatar3d ?? DEFAULT_AVATAR_3D),
    inventory: Array.isArray(seed?.inventory) ? seed!.inventory : [],
    dropsOpenedByType: seed?.dropsOpenedByType
      ? parseDropsOpenedByType(seed.dropsOpenedByType)
      : { ...EMPTY_DROPS_OPENED },
    hunterLevel: Math.max(0, Math.floor(seed?.hunterLevel ?? 0)),
    playerLevel: Math.max(1, Math.floor(seed?.playerLevel ?? 1)),
    playerXp: Math.max(0, Math.floor(seed?.playerXp ?? 0)),
    welcomeBonusGranted: seed?.welcomeBonusGranted !== false,
    totalWealth: Math.max(0, Math.floor(seed?.totalWealth ?? 0)),
    giftsSentScore: Math.max(0, Math.floor(seed?.giftsSentScore ?? 0)),
    leaderboardEpoch: Math.max(0, Math.floor(seed?.leaderboardEpoch ?? GAMEPLAY_LEADERBOARD_EPOCH)),
    updatedAt: serverTimestamp(),
  }
}

/**
 * Canonical game-progress doc: players/{playerId}.
 * Creates with starting balances on first registration; migrates from users/{uid} when missing.
 */
export async function ensurePlayerProgressDoc(
  playerId: string,
  uid: string,
  seed?: PlayerProgressSeed,
): Promise<Record<string, unknown>> {
  const ref = doc(db, 'players', playerId)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const data = { ...(snap.data() as Record<string, unknown>) }
    const patch: Record<string, unknown> = {}
    if (data.uid !== uid) patch.uid = uid
    if (data.playerId !== playerId) patch.playerId = playerId
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = serverTimestamp()
      await updateDoc(ref, patch as Record<string, import('firebase/firestore').FieldValue | Partial<unknown>>)
      Object.assign(data, patch)
    }
    rememberPlayerId(uid, playerId)
    return data
  }
  const payload = buildPlayerProgressPayload(playerId, uid, seed)
  payload.createdAt = serverTimestamp()
  await setDoc(ref, payload)
  rememberPlayerId(uid, playerId)
  return payload
}

/** Apply players/{playerId} economy fields onto a FullUserData snapshot (players wins). */
function mergePlayerProgressIntoUser(
  base: FullUserData,
  playerData: Record<string, unknown> | null | undefined,
): FullUserData {
  if (!playerData) return base
  // Legacy `iqd` must NOT inflate diamond — starting/wipe balances use diamond only.
  const wallet = clampWalletToCap({
    gold: Number(playerData.gold ?? base.gold) || 0,
    diamond: Number(playerData.diamond ?? base.diamond) || 0,
  })
  return {
    ...base,
    ...wallet,
    isPremium: playerData.isPremium != null ? Boolean(playerData.isPremium) : base.isPremium,
    playerId: typeof playerData.playerId === 'string' && playerData.playerId
      ? playerData.playerId
      : base.playerId,
    name: typeof playerData.name === 'string' && playerData.name.trim()
      ? playerData.name
      : base.name,
    inventory: playerData.inventory != null ? parseInventory(playerData.inventory) : base.inventory,
    dropsOpenedByType: playerData.dropsOpenedByType != null
      ? parseDropsOpenedByType(playerData.dropsOpenedByType)
      : base.dropsOpenedByType,
    hunterLevel: playerData.hunterLevel != null
      ? Math.max(0, Math.floor(Number(playerData.hunterLevel) || 0))
      : base.hunterLevel,
    playerLevel: playerData.playerLevel != null
      ? Math.max(1, Math.floor(Number(playerData.playerLevel) || 1))
      : base.playerLevel,
    playerXp: playerData.playerXp != null
      ? Math.max(0, Math.floor(Number(playerData.playerXp) || 0))
      : base.playerXp,
    welcomeBonusGranted: playerData.welcomeBonusGranted != null
      ? Boolean(playerData.welcomeBonusGranted)
      : base.welcomeBonusGranted,
    avatarUrl: typeof playerData.avatarUrl === 'string'
      ? (playerData.avatarUrl || null)
      : base.avatarUrl,
    avatar3d: playerData.avatar3d != null
      ? normalizeAvatar3d(playerData.avatar3d)
      : base.avatar3d,
    dailyBonusDay: playerData.dailyBonusDay != null
      ? Math.max(1, Math.floor(Number(playerData.dailyBonusDay) || 1))
      : base.dailyBonusDay,
    dailyBonusLastClaimMs: playerData.dailyBonusLastClaimMs != null
      ? parseEpochMs(playerData.dailyBonusLastClaimMs)
      : base.dailyBonusLastClaimMs,
    spinLastFreeAtMs: playerData.spinLastFreeAtMs != null
      ? parseEpochMs(playerData.spinLastFreeAtMs)
      : base.spinLastFreeAtMs,
    spinSpinsInWindow: playerData.spinSpinsInWindow != null
      ? Math.max(0, Math.floor(Number(playerData.spinSpinsInWindow) || 0))
      : base.spinSpinsInWindow,
    readNotificationIds: playerData.readNotificationIds != null
      ? parseReadNotificationIds(playerData.readNotificationIds)
      : base.readNotificationIds,
  }
}

async function dualWritePlayerProgress(
  uid: string,
  playerId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const payload = { ...patch, uid, playerId, updatedAt: serverTimestamp() }
  await Promise.all([
    setDoc(doc(db, 'players', playerId), payload, { merge: true }),
    // Mirror for existing social/auth listeners that still read users/{uid}
    updateDoc(doc(db, 'users', uid), payload).catch(async () => {
      await setDoc(doc(db, 'users', uid), payload, { merge: true })
    }),
  ])
}

function cacheFromFullUser(uid: string, data: FullUserData): void {
  saveUserDataLocal(uid, {
    playerId: data.playerId,
    gold: data.gold,
    diamond: data.diamond,
    isPremium: data.isPremium,
    playerLevel: data.playerLevel,
    playerXp: data.playerXp,
    hunterLevel: data.hunterLevel,
    name: data.name,
    username: data.username,
    gender: data.gender,
    title: data.title,
    avatarUrl: data.avatarUrl,
    avatar3d: data.avatar3d,
    inventory: data.inventory,
    dropsOpenedByType: data.dropsOpenedByType,
    welcomeBonusGranted: data.welcomeBonusGranted,
    dailyBonusDay: data.dailyBonusDay,
    dailyBonusLastClaimMs: data.dailyBonusLastClaimMs,
    spinLastFreeAtMs: data.spinLastFreeAtMs,
    spinSpinsInWindow: data.spinSpinsInWindow,
    readNotificationIds: data.readNotificationIds,
  })
}

function parseSettings(raw: unknown): UserSettings {
  const data = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const lang = data.language
  const b = (key: keyof UserSettings) => typeof data[key] === 'boolean' ? data[key] as boolean : DEFAULT_USER_SETTINGS[key] as boolean
  const vol = (key: keyof UserSettings) => {
    const raw = Number(data[key])
    return Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : (DEFAULT_USER_SETTINGS[key] as number)
  }
  return {
    soundEnabled: b('soundEnabled'),
    musicEnabled: b('musicEnabled'),
    notificationsEnabled: b('notificationsEnabled'),
    radarAlertsEnabled: b('radarAlertsEnabled'),
    friendRequestNotifsEnabled: b('friendRequestNotifsEnabled'),
    showOtherPlayers: b('showOtherPlayers'),
    showMyAvatarOnMap: b('showMyAvatarOnMap'),
    batterySaver: b('batterySaver'),
    highGraphics: b('highGraphics'),
    mirrorMap: b('mirrorMap'),
    language: lang === 'ku' || lang === 'ar' || lang === 'en' ? lang : DEFAULT_USER_SETTINGS.language,
    hideLocation: b('hideLocation'),
    sfxVolume: vol('sfxVolume'),
    showPlayerNames: b('showPlayerNames'),
    blockIncomingGifts: b('blockIncomingGifts'),
    musicVolume: vol('musicVolume'),
    planeSoundEnabled: b('planeSoundEnabled'),
    planeVolume: vol('planeVolume'),
    giftSoundEnabled: b('giftSoundEnabled'),
    giftVolume: vol('giftVolume'),
    chestSoundEnabled: b('chestSoundEnabled'),
    chestVolume: vol('chestVolume'),
    hideWhenOffline: b('hideWhenOffline'),
    hideBlockedUsers: b('hideBlockedUsers'),
    hideGlobalChat: b('hideGlobalChat'),
    allowDmWithoutFriendship: b('allowDmWithoutFriendship'),
  }
}

function parseStats(raw: unknown): PlayerStats {
  const data = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    chestsOpened: Number(data.chestsOpened) || 0,
    dailyBonusClaims: Number(data.dailyBonusClaims) || 0,
    distanceTraveledM: Number(data.distanceTraveledM) || 0,
    playTimeMs: Number(data.playTimeMs) || 0,
    itemsPurchased: Number(data.itemsPurchased) || 0,
    giftsReceived: Number(data.giftsReceived) || 0,
  }
}

function parseBlockedUsers(raw: unknown): BlockedUser[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
    .map(x => ({ uid: String(x.uid ?? ''), name: String(x.name ?? 'یاریزان') }))
    .filter(x => x.uid)
}

function parseFriends(raw: unknown): FriendEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
    .map(x => ({ uid: String(x.uid ?? ''), name: String(x.name ?? 'یاریزان'), playerId: typeof x.playerId === 'string' ? x.playerId : '' }))
    .filter(x => x.uid)
}

/** نوێکردنەوە یان زیادکردنی هاوڕێ بەبێ دووبارەبوونەوە (بەپێی uid) */
function upsertFriendEntry(list: FriendEntry[], entry: FriendEntry): FriendEntry[] {
  const idx = list.findIndex(f => f.uid === entry.uid)
  if (idx < 0) return [...list, entry]
  const next = list.slice()
  next[idx] = {
    uid: entry.uid,
    name: entry.name || next[idx].name,
    playerId: entry.playerId || next[idx].playerId,
  }
  return next
}

function parseGiftsLog(raw: unknown): GiftLogEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
    .map(x => ({
      from: String(x.from ?? ''),
      fromName: String(x.fromName ?? 'یاریزان'),
      amount: Number(x.amount) || 0,
      atMs: Number(x.atMs) || 0,
    }))
    .sort((a, b) => b.atMs - a.atMs)
}

function parseDropTypeCooldowns(raw: unknown): Record<string, number> {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (/^[1-5]$/.test(k) && typeof v === 'number' && Number.isFinite(v)) out[k] = v
  }
  return out
}

function parseInventory(raw: unknown): InventoryItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map(item => {
      const expiresAtMs = Number(item.expiresAtMs)
      return {
        id: Number(item.id) || 0,
        name: String(item.name ?? ''),
        icon: String(item.icon ?? '📦'),
        desc: String(item.desc ?? ''),
        price: Number(item.price) || 0,
        curr: (item.curr === 'gold' || item.curr === 'diamond' ? item.curr : 'gold') as Currency,
        active: item.active !== false,
        ...(Number.isFinite(expiresAtMs) && expiresAtMs > 0 ? { expiresAtMs } : {}),
      }
    })
    .filter(item => item.id > 0 && item.name)
}

/** قەڵغانی دزی چالاکە؟ (stealShieldUntilMs یان کەرەستەی #4 بە expiresAt) */
export function hasActiveStealShield(
  data: { stealShieldUntilMs?: unknown; inventory?: unknown },
  now = Date.now(),
): boolean {
  const until = Number(data.stealShieldUntilMs) || 0
  if (until > now) return true
  return parseInventory(data.inventory).some(i => {
    if (i.id !== 4 || !i.active) return false
    // بێ expiresAt = قەڵغانی کۆن/هەمیشەیی نەهێڵدرێت
    return typeof i.expiresAtMs === 'number' && i.expiresAtMs > now
  })
}

function parseFullUserData(data: Record<string, unknown>): FullUserData {
  const dropsOpenedByType = parseDropsOpenedByType(data.dropsOpenedByType)
  const storedLevel = Number(data.hunterLevel)
  const hunterLevel = Number.isFinite(storedLevel) && storedLevel >= 0
    ? Math.floor(storedLevel)
    : computeHunterLevel(dropsOpenedByType)
  return {
    name: String(data.name ?? 'یاریزان'),
    username: typeof data.username === 'string' ? data.username : '',
    email: typeof data.email === 'string' ? data.email.trim().toLowerCase() : '',
    phone: typeof data.phone === 'string' ? data.phone.trim() : '',
    usernameEditUsed: data.usernameEditUsed === true,
    emailEditUsed: data.emailEditUsed === true,
    phoneEditUsed: data.phoneEditUsed === true,
    gender: data.gender === 'female' ? 'female' : 'male',
    gold: Number(data.gold) || 0,
    // Legacy accounts may still have a dinar (iqd) balance saved — migrate it into diamond.
    diamond: (Number(data.diamond) || 0) + Math.floor((Number(data.iqd) || 0) / 100),
    isPremium: Boolean(data.isPremium),
    title: typeof data.title === 'string' && data.title.trim() ? data.title : DEFAULT_TITLE,
    avatarUrl: typeof data.avatarUrl === 'string' && data.avatarUrl ? data.avatarUrl : null,
    avatar3d: (() => {
      const a = normalizeAvatar3d(data.avatar3d)
      if (data.avatar3d == null) {
        return { ...a, hairStyle: data.gender === 'female' ? 'long' : 'short' }
      }
      return a
    })(),
    playerId: typeof data.playerId === 'string' ? data.playerId : '',
    settings: parseSettings(data.settings),
    stats: parseStats(data.stats),
    dropsOpenedByType,
    hunterLevel,
    playerLevel: Math.max(1, Math.floor(Number(data.playerLevel) || 1)),
    playerXp: Math.max(0, Math.floor(Number(data.playerXp) || 0)),
    welcomeBonusGranted: Boolean(data.welcomeBonusGranted),
    inventory: parseInventory(data.inventory),
    dailyBonusDay: Math.max(1, Math.floor(Number(data.dailyBonusDay) || 1)),
    dailyBonusLastClaimMs: parseEpochMs(data.dailyBonusLastClaimMs),
    spinLastFreeAtMs: parseEpochMs(data.spinLastFreeAtMs),
    spinSpinsInWindow: Math.max(0, Math.floor(Number(data.spinSpinsInWindow) || 0)),
    readNotificationIds: parseReadNotificationIds(data.readNotificationIds),
    blockedUsers: parseBlockedUsers(data.blockedUsers),
    friends: parseFriends(data.friends),
    giftsLog: parseGiftsLog(data.giftsLog),
    inboxNotifications: parseInboxNotifications(data.inboxNotifications),
    dropTypeCooldowns: parseDropTypeCooldowns(data.dropTypeCooldowns),
    stealShieldUntilMs: Number(data.stealShieldUntilMs) || 0,
    stealCooldownUntilMs: Number(data.stealCooldownUntilMs) || 0,
    fightBanUntilMs: Number(data.fightBanUntilMs) || 0,
    fightChallengeLog: parseFightChallengeLog(data.fightChallengeLog),
    incomingFight: parseIncomingFightField(data.incomingFight),
    incomingHeist: parseIncomingHeistField(data.incomingHeist),
    homeCityKey: typeof data.homeCityKey === 'string' ? data.homeCityKey.trim() : '',
    mutedChatUids: parseStringUidList(data.mutedChatUids),
  }
}

function parseIncomingFightField(raw: unknown): FullUserData['incomingFight'] {
  if (raw == null || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  const duelId = String(d.duelId ?? '')
  const fromUid = String(d.fromUid ?? '')
  const fromName = String(d.fromName ?? 'یاریزان')
  const expiresAtMs = Number(d.expiresAtMs) || 0
  if (!duelId || !fromUid || expiresAtMs <= 0) return null
  return { duelId, fromUid, fromName, expiresAtMs }
}

function parseIncomingHeistField(raw: unknown): IncomingHeistSummary | null {
  if (raw == null || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  const heistId = String(d.heistId ?? '')
  const thiefUid = String(d.thiefUid ?? '')
  const thiefName = String(d.thiefName ?? 'یاریزان')
  const mode = d.mode === 'online' ? 'online' : d.mode === 'offline' ? 'offline' : null
  const startedAtMs = Number(d.startedAtMs) || 0
  const expiresAtMs = Number(d.expiresAtMs) || 0
  const notifId = String(d.notifId ?? '')
  if (!heistId || !thiefUid || !mode || expiresAtMs <= 0) return null
  return { heistId, thiefUid, thiefName, mode, startedAtMs, expiresAtMs, notifId }
}

/** زیادکردنی ئاگاداری بۆ یاریزانێک (دزی / بلۆک / …) */
export async function pushInboxNotification(uid: string, entry: InboxNotification): Promise<void> {
  if (!uid || !entry.id) return
  const ref = doc(db, 'users', uid)
  try {
    await updateDoc(ref, {
      inboxNotifications: arrayUnion(entry),
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.error('pushInboxNotification failed:', err)
  }
}

/**
 * خاڵی دەوڵەمەندی: زێڕ + ئەڵماس×٥٠
 */
export function computeTotalWealth(gold: number, diamond = 0): number {
  return Math.max(0, Math.floor(Number(gold) || 0) + Math.floor(Number(diamond) || 0) * 50)
}

export function getDefaultProfile(): UserProfile {
  return createDefaultProfile()
}

export async function ensureAnonymousAuth(): Promise<User> {
  return initAnonymousAuth()
}

const USERNAME_RE = /^[a-zA-Z0-9_\u0600-\u06FF]{3,20}$/

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, '')
}

export function validateUsername(username: string): string | null {
  const key = normalizeUsername(username)
  if (key.length < 3) return 'ناوی بەکارهێنەر لانیکەم ٣ پیت بێت.'
  if (key.length > 20) return 'ناوی بەکارهێنەر زۆر درێژە.'
  if (!USERNAME_RE.test(key)) return 'تەنها پیت، ژمارە و _ ڕێگەپێدراون.'
  return null
}

export function validatePhoneNumber(phone: string): string | null {
  const cleaned = phone.trim().replace(/[\s\-()]/g, '')
  if (!cleaned) return 'ژمارەی مۆبایل بنووسە.'
  if (!/^\+?[0-9]{10,15}$/.test(cleaned)) return 'ژمارەی مۆبایل نادروستە (١٠–١٥ ژمارە).'
  return null
}

export function normalizePhoneKey(phone: string): string {
  return phone.trim().replace(/[\s\-()]/g, '').replace(/^\+/, '')
}

async function upsertPhoneIndex(uid: string, phone: string, email: string): Promise<void> {
  const key = normalizePhoneKey(phone)
  if (!key) return
  await setDoc(doc(db, 'phones', key), {
    uid,
    email: email.trim().toLowerCase(),
    phone: key,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

async function removePhoneIndex(phone: string): Promise<void> {
  const key = normalizePhoneKey(phone)
  if (!key) return
  try { await deleteDoc(doc(db, 'phones', key)) } catch { /* ignore */ }
}

/** تۆمارکردنی مۆبایل بە شێوەی تایبەت (بۆ چوونەژوورەوە + دووبارەنەبوونەوە) */
async function reserveUniquePhone(uid: string, phone: string, email: string): Promise<string> {
  const err = validatePhoneNumber(phone)
  if (err) throw new Error(err)
  const key = normalizePhoneKey(phone)
  const ref = doc(db, 'phones', key)
  await runTransaction(db, async transaction => {
    const snap = await transaction.get(ref)
    if (snap.exists()) {
      const owner = String(snap.data()?.uid ?? '')
      if (owner && owner !== uid) throw new Error('ئەم ژمارەی مۆبایلە پێشتر تۆمار کراوە.')
    }
    transaction.set(ref, {
      uid,
      email: email.trim().toLowerCase(),
      phone: key,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    })
  })
  return key
}

export async function resolveEmailFromLoginIdentifier(identifier: string): Promise<string> {
  const trimmed = identifier.trim()
  if (!trimmed) throw new Error('ئیمەیڵ، مۆبایل، ئایدی یان یوزەرنەیم بنووسە.')

  // ئیمەیڵ
  if (trimmed.includes('@')) return trimmed.toLowerCase()

  // ئایدی یاریزان (٨ ژمارە)
  if (/^\d{8}$/.test(trimmed)) {
    const found = await findUserByPlayerId(trimmed)
    if (!found?.uid) throw new Error('ئایدی یاریزان نەدۆزرایەوە.')
    const snap = await getDoc(doc(db, 'users', found.uid))
    const email = String(snap.data()?.email ?? '').trim().toLowerCase()
    if (!email) throw new Error('ئیمەیڵی ئەم ئایدییە نەدۆزرایەوە.')
    return email
  }

  // ژمارەی مۆبایل
  const phoneKey = normalizePhoneKey(trimmed)
  if (/^[0-9]{10,15}$/.test(phoneKey)) {
    const phoneSnap = await getDoc(doc(db, 'phones', phoneKey))
    if (phoneSnap.exists()) {
      const email = String(phoneSnap.data()?.email ?? '').trim().toLowerCase()
      if (email) return email
      const uid = String(phoneSnap.data()?.uid ?? '').trim()
      if (uid) {
        const userSnap = await getDoc(doc(db, 'users', uid))
        const email2 = String(userSnap.data()?.email ?? '').trim().toLowerCase()
        if (email2) return email2
      }
    }
    throw new Error('ژمارەی مۆبایل نەدۆزرایەوە — دڵنیا بە لە تۆمارکردنی مۆبایل لە پرۆفایل.')
  }

  // یوزەرنەیم
  const key = normalizeUsername(trimmed)
  const err = validateUsername(key)
  if (err) throw new Error('ئیمەیڵ، مۆبایل، ئایدی یان یوزەرنەیم نادروستە.')
  const snap = await getDoc(doc(db, 'usernames', key))
  if (!snap.exists()) throw new Error('ناوی بەکارهێنەر یان ئیمەیڵ نادروستە.')
  const email = String(snap.data()?.email ?? '').trim().toLowerCase()
  if (!email) throw new Error('ناوی بەکارهێنەر یان ئیمەیڵ نادروستە.')
  return email
}

export function validateEmailAddress(email: string): string | null {
  const e = email.trim().toLowerCase()
  if (!e) return 'ئیمەیڵ بنووسە.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'ئیمەیڵێکی دروست بنووسە.'
  return null
}

/** گۆڕینی یوزەرنەیم — تەنها یەک جار */
export async function changeUsernameOnce(uid: string, newUsername: string): Promise<FullUserData> {
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  if (!snap.exists()) throw new Error('هەژمار نەدۆزرایەوە')
  const data = snap.data() as Record<string, unknown>
  if (data.usernameEditUsed === true) {
    throw new Error('تۆ پێشتر یەک جار یوزەرنەیمەکەت گۆڕیوە — ناتوانیت دووبارە بگۆڕیت.')
  }
  const err = validateUsername(newUsername)
  if (err) throw new Error(err)
  const next = normalizeUsername(newUsername)
  const prev = typeof data.username === 'string' ? normalizeUsername(data.username) : ''
  if (next === prev) throw new Error('هەمان یوزەرنەیمە — شتێکی نوێ بنووسە.')

  const email = typeof data.email === 'string' ? data.email : ''
  await reserveUniqueUsername(uid, next, email || `${uid}@kurd.drop`)
  if (prev && prev !== next) {
    try { await deleteDoc(doc(db, 'usernames', prev)) } catch { /* ignore */ }
  }
  await setDoc(userRef, {
    username: next,
    usernameEditUsed: true,
    updatedAt: serverTimestamp(),
  }, { merge: true })
  const playerId = typeof data.playerId === 'string' ? data.playerId : await resolvePlayerId(uid)
  if (playerId) {
    await setDoc(doc(db, 'players', playerId), { username: next, updatedAt: serverTimestamp() }, { merge: true })
  }
  const fresh = await getDoc(userRef)
  const parsed = parseFullUserData(fresh.data() as Record<string, unknown>)
  cacheFromFullUser(uid, parsed)
  return parsed
}

/** گۆڕینی ئیمەیڵ — تەنها یەک جار (Firestore؛ Auth لەلایەن پەیوەندیکەرەوە نوێ دەکرێتەوە) */
export async function changeEmailOnce(uid: string, newEmail: string): Promise<FullUserData> {
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  if (!snap.exists()) throw new Error('هەژمار نەدۆزرایەوە')
  const data = snap.data() as Record<string, unknown>
  if (data.emailEditUsed === true) {
    throw new Error('تۆ پێشتر یەک جار ئیمەیڵەکەت گۆڕیوە — ناتوانیت دووبارە بگۆڕیت.')
  }
  const err = validateEmailAddress(newEmail)
  if (err) throw new Error(err)
  const next = newEmail.trim().toLowerCase()
  const prev = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  if (next === prev) throw new Error('هەمان ئیمەیڵە — شتێکی نوێ بنووسە.')

  await setDoc(userRef, {
    email: next,
    emailEditUsed: true,
    updatedAt: serverTimestamp(),
  }, { merge: true })
  const username = typeof data.username === 'string' ? normalizeUsername(data.username) : ''
  if (username) {
    await setDoc(doc(db, 'usernames', username), { uid, email: next, updatedAt: serverTimestamp() }, { merge: true })
  }
  const phone = typeof data.phone === 'string' ? data.phone : ''
  if (phone) {
    await upsertPhoneIndex(uid, phone, next)
  }
  const playerId = typeof data.playerId === 'string' ? data.playerId : await resolvePlayerId(uid)
  if (playerId) {
    await setDoc(doc(db, 'players', playerId), { email: next, updatedAt: serverTimestamp() }, { merge: true })
  }
  const fresh = await getDoc(userRef)
  const parsed = parseFullUserData(fresh.data() as Record<string, unknown>)
  cacheFromFullUser(uid, parsed)
  return parsed
}

/** گۆڕینی ژمارەی مۆبایل — تەنها یەک جار */
export async function changePhoneOnce(uid: string, newPhone: string): Promise<FullUserData> {
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  if (!snap.exists()) throw new Error('هەژمار نەدۆزرایەوە')
  const data = snap.data() as Record<string, unknown>
  if (data.phoneEditUsed === true) {
    throw new Error('تۆ پێشتر یەک جار ژمارەی مۆبایلەکەت گۆڕیوە — ناتوانیت دووبارە بگۆڕیت.')
  }
  const err = validatePhoneNumber(newPhone)
  if (err) throw new Error(err)
  const next = newPhone.trim().replace(/[\s\-()]/g, '')
  const prev = typeof data.phone === 'string' ? data.phone.trim().replace(/[\s\-()]/g, '') : ''
  if (next === prev) throw new Error('هەمان ژمارەیە — شتێکی نوێ بنووسە.')

  const email = typeof data.email === 'string' ? data.email : ''
  const reserved = await reserveUniquePhone(uid, next, email)
  if (prev && normalizePhoneKey(prev) !== normalizePhoneKey(reserved)) {
    await removePhoneIndex(prev)
  }
  await setDoc(userRef, {
    phone: reserved,
    phoneEditUsed: true,
    updatedAt: serverTimestamp(),
  }, { merge: true })
  const playerId = typeof data.playerId === 'string' ? data.playerId : await resolvePlayerId(uid)
  if (playerId) {
    await setDoc(doc(db, 'players', playerId), { phone: reserved, updatedAt: serverTimestamp() }, { merge: true })
  }
  const fresh = await getDoc(userRef)
  const parsed = parseFullUserData(fresh.data() as Record<string, unknown>)
  cacheFromFullUser(uid, parsed)
  return parsed
}

async function reserveUniqueUsername(uid: string, username: string, email: string): Promise<void> {
  const key = normalizeUsername(username)
  const err = validateUsername(key)
  if (err) throw new Error(err)
  const ref = doc(db, 'usernames', key)
  await runTransaction(db, async transaction => {
    const snap = await transaction.get(ref)
    if (snap.exists()) throw new Error('ئەم ناوەی بەکارهێنەرە پێشتر گیراوە.')
    transaction.set(ref, { uid, email: email.toLowerCase(), createdAt: serverTimestamp() })
  })
}

/** دروستکردنی پرۆفایلی یاریزانی تۆمارکراو بە باڵانسی ستاندارد */
export async function createRegisteredUserProfile(
  uid: string,
  opts: { fullName: string; username: string; email: string; phone: string },
): Promise<FullUserData> {
  const ref = doc(db, 'users', uid)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    let parsed = parseFullUserData(existing.data() as Record<string, unknown>)
    if (!parsed.playerId) {
      parsed.playerId = await reserveUniquePlayerId(uid)
      await updateDoc(ref, { playerId: parsed.playerId, updatedAt: serverTimestamp() })
    }
    rememberPlayerId(uid, parsed.playerId)
    const playerDoc = await ensurePlayerProgressDoc(parsed.playerId, uid, parsed)
    parsed = mergePlayerProgressIntoUser(parsed, playerDoc)
    cacheFromFullUser(uid, parsed)
    return parsed
  }

  const fullName = opts.fullName.trim()
  if (fullName.length < 2) throw new Error('ناوی تەواو بنووسە.')
  const phone = await reserveUniquePhone(uid, opts.phone, opts.email)
  await reserveUniqueUsername(uid, opts.username, opts.email)
  const playerId = await reserveUniquePlayerId(uid)
  const gender: Gender = Math.random() < 0.5 ? 'male' : 'female'
  const wallet = getDefaultStartingWallet()
  const avatar3d = {
    ...DEFAULT_AVATAR_3D,
    hairStyle: gender === 'female' ? 'long' as const : 'short' as const,
  }
  const payload = {
    name: fullName,
    username: normalizeUsername(opts.username),
    email: opts.email.trim().toLowerCase(),
    phone,
    usernameEditUsed: false,
    emailEditUsed: false,
    phoneEditUsed: false,
    gender,
    ...wallet,
    isPremium: false,
    title: DEFAULT_TITLE,
    avatarUrl: null,
    avatar3d,
    playerId,
    settings: { ...DEFAULT_USER_SETTINGS },
    stats: { ...DEFAULT_PLAYER_STATS },
    dropsOpenedByType: { ...EMPTY_DROPS_OPENED },
    hunterLevel: 0,
    playerLevel: 1,
    playerXp: 0,
    welcomeBonusGranted: true,
    inventory: [],
    dailyBonusDay: 1,
    dailyBonusLastClaimMs: null,
    spinLastFreeAtMs: null,
    spinSpinsInWindow: 0,
    readNotificationIds: [],
    blockedUsers: [],
    friends: [],
    giftsLog: [],
    totalWealth: 0,
    giftsSentScore: 0,
    leaderboardEpoch: GAMEPLAY_LEADERBOARD_EPOCH,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload)
  // Canonical progress under players/{playerId} with starting balances
  await ensurePlayerProgressDoc(playerId, uid, {
    ...wallet,
    name: fullName,
    username: normalizeUsername(opts.username),
    gender,
    avatar3d,
    playerLevel: 1,
    playerXp: 0,
    hunterLevel: 0,
    inventory: [],
    dropsOpenedByType: { ...EMPTY_DROPS_OPENED },
    welcomeBonusGranted: true,
    totalWealth: 0,
    giftsSentScore: 0,
    leaderboardEpoch: GAMEPLAY_LEADERBOARD_EPOCH,
  })
  await setDoc(doc(db, 'players', playerId), { phone, email: opts.email.trim().toLowerCase() }, { merge: true })
  const created = parseFullUserData(payload as unknown as Record<string, unknown>)
  cacheFromFullUser(uid, created)
  return created
}

/**
 * Absolute factory reset for all user character documents (registered + guest + bots).
 * Keeps identity keys (uid, playerId, username/email if present) but resets gameplay state.
 * Also resets canonical players/{playerId} docs so levels/wallets cannot revive from merge.
 */
export async function factoryResetAllCharacters(): Promise<{ resetUsers: number; resetPlayers: number }> {
  const wallet = getDefaultStartingWallet()
  const emptyVip = emptyVipPassesState()
  let resetUsers = 0
  let resetPlayers = 0

  const usersSnap = await getDocs(collection(db, 'users'))
  const userDocs = usersSnap.docs

  for (let i = 0; i < userDocs.length; i += 400) {
    const batch = writeBatch(db)
    const slice = userDocs.slice(i, i + 400)
    for (const userDoc of slice) {
      const data = userDoc.data() as Record<string, unknown>
      const uid = userDoc.id
      const gender: Gender = data.gender === 'female' ? 'female' : 'male'
      const avatar3d = normalizeAvatar3d({
        ...DEFAULT_AVATAR_3D,
        hairStyle: gender === 'female' ? 'long' : 'short',
      })
      const playerId = typeof data.playerId === 'string' ? data.playerId : ''
      const username = typeof data.username === 'string' ? data.username : ''
      const email = typeof data.email === 'string' ? data.email : ''

      batch.set(doc(db, 'users', uid), {
        uid,
        name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'یاریزان',
        username,
        email,
        gender,
        ...wallet,
        isPremium: false,
        title: DEFAULT_TITLE,
        avatarUrl: null,
        avatar3d,
        playerId,
        settings: { ...DEFAULT_USER_SETTINGS },
        stats: { ...DEFAULT_PLAYER_STATS },
        dropsOpenedByType: { ...EMPTY_DROPS_OPENED },
        hunterLevel: 0,
        playerLevel: 1,
        playerXp: 0,
        welcomeBonusGranted: true,
        inventory: [],
        dailyBonusDay: 1,
        dailyBonusLastClaimMs: null,
        spinLastFreeAtMs: null,
        spinSpinsInWindow: 0,
        readNotificationIds: [],
        blockedUsers: [],
        friends: [],
        giftsLog: [],
        inboxNotifications: [],
        mutedChatUids: [],
        dropTypeCooldowns: {},
        stealShieldUntilMs: 0,
        stealCooldownUntilMs: 0,
        fightBanUntilMs: 0,
        fightChallengeLog: {},
        incomingFight: null,
        incomingHeist: null,
        homeCityKey: '',
        totalWealth: 0,
        giftsSentScore: 0,
        leaderboardEpoch: GAMEPLAY_LEADERBOARD_EPOCH,
        factoryDayKey: '',
        factoryGoldTakenToday: 0,
        factoryDiamondTakenToday: 0,
        vipPasses: emptyVip,
        activePasses: [],
        gameplayResetVersion: ACCOUNT_GAMEPLAY_RESET_VERSION,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      if (playerId) {
        batch.set(doc(db, 'players', playerId), {
          uid,
          playerId,
          name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'یاریزان',
          username,
          gender,
          ...wallet,
          isPremium: false,
          title: DEFAULT_TITLE,
          avatarUrl: null,
          avatar3d,
          inventory: [],
          dropsOpenedByType: { ...EMPTY_DROPS_OPENED },
          hunterLevel: 0,
          playerLevel: 1,
          playerXp: 0,
          welcomeBonusGranted: true,
          dailyBonusDay: 1,
          dailyBonusLastClaimMs: null,
          spinLastFreeAtMs: null,
          spinSpinsInWindow: 0,
          totalWealth: 0,
          giftsSentScore: 0,
          leaderboardEpoch: GAMEPLAY_LEADERBOARD_EPOCH,
          gameplayResetVersion: ACCOUNT_GAMEPLAY_RESET_VERSION,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        resetPlayers += 1
      }

      resetUsers += 1
    }
    await batch.commit()
  }

  // Reset any leftover players docs (bots / orphans) not covered above
  const playersSnap = await getDocs(collection(db, 'players'))
  for (let i = 0; i < playersSnap.docs.length; i += 400) {
    const batch = writeBatch(db)
    const slice = playersSnap.docs.slice(i, i + 400)
    let touched = false
    for (const playerDoc of slice) {
      const data = playerDoc.data() as Record<string, unknown>
      const playerId = playerDoc.id
      const uid = typeof data.uid === 'string' ? data.uid : ''
      const gender: Gender = data.gender === 'female' ? 'female' : 'male'
      batch.set(doc(db, 'players', playerId), {
        uid,
        playerId,
        name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'یاریزان',
        username: typeof data.username === 'string' ? data.username : '',
        gender,
        ...wallet,
        isPremium: false,
        title: DEFAULT_TITLE,
        avatarUrl: null,
        avatar3d: normalizeAvatar3d({
          ...DEFAULT_AVATAR_3D,
          hairStyle: gender === 'female' ? 'long' : 'short',
        }),
        inventory: [],
        dropsOpenedByType: { ...EMPTY_DROPS_OPENED },
        hunterLevel: 0,
        playerLevel: 1,
        playerXp: 0,
        welcomeBonusGranted: true,
        dailyBonusDay: 1,
        dailyBonusLastClaimMs: null,
        spinLastFreeAtMs: null,
        spinSpinsInWindow: 0,
        totalWealth: 0,
        giftsSentScore: 0,
        leaderboardEpoch: GAMEPLAY_LEADERBOARD_EPOCH,
        gameplayResetVersion: ACCOUNT_GAMEPLAY_RESET_VERSION,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      touched = true
      resetPlayers += 1
    }
    if (touched) await batch.commit()
  }

  return { resetUsers, resetPlayers }
}

/** وەشانی گشتی سفرکردنەوە — تەنها جارێک لە هەموو کڕیارەکاندا دەڕوات */
export const GLOBAL_GAMEPLAY_RESET_VERSION = 4
export const ACCOUNT_GAMEPLAY_RESET_VERSION = GLOBAL_GAMEPLAY_RESET_VERSION

function buildFreshGameplayFields(wallet: Pick<UserProfile, 'gold' | 'diamond'>) {
  return {
    ...wallet,
    isPremium: false,
    title: DEFAULT_TITLE,
    settings: { ...DEFAULT_USER_SETTINGS },
    stats: { ...DEFAULT_PLAYER_STATS },
    dropsOpenedByType: { ...EMPTY_DROPS_OPENED },
    hunterLevel: 0,
    playerLevel: 1,
    playerXp: 0,
    welcomeBonusGranted: true,
    inventory: [] as InventoryItem[],
    dailyBonusDay: 1,
    dailyBonusLastClaimMs: null as number | null,
    spinLastFreeAtMs: null as number | null,
    spinSpinsInWindow: 0,
    readNotificationIds: [] as string[],
    blockedUsers: [] as BlockedUser[],
    friends: [] as FriendEntry[],
    giftsLog: [] as GiftLogEntry[],
    inboxNotifications: [] as InboxNotification[],
    mutedChatUids: [] as string[],
    dropTypeCooldowns: {} as Record<string, number>,
    stealShieldUntilMs: 0,
    stealCooldownUntilMs: 0,
    fightBanUntilMs: 0,
    fightChallengeLog: {} as Record<string, { count: number; banUntilMs: number }>,
    incomingFight: null,
    incomingHeist: null,
    homeCityKey: '',
    totalWealth: 0,
    giftsSentScore: 0,
    leaderboardEpoch: GAMEPLAY_LEADERBOARD_EPOCH,
    factoryDayKey: '',
    factoryGoldTakenToday: 0,
    factoryDiamondTakenToday: 0,
    vipPasses: emptyVipPassesState(),
    activePasses: [] as string[],
    gameplayResetVersion: ACCOUNT_GAMEPLAY_RESET_VERSION,
  }
}

/** سفرکردنەوەی یەک هەژمار — ڕۆڵ/لێڤڵ/دراو/پاس/ئامار */
export async function wipeAccountGameplayProgress(uid: string, parsed: FullUserData): Promise<FullUserData> {
  const wallet = getDefaultStartingWallet()
  const fresh = buildFreshGameplayFields(wallet)
  const gender: Gender = parsed.gender === 'female' ? 'female' : 'male'
  const avatar3d = normalizeAvatar3d({
    ...DEFAULT_AVATAR_3D,
    hairStyle: gender === 'female' ? 'long' : 'short',
  })
  const playerId = parsed.playerId || ''

  await setDoc(doc(db, 'users', uid), {
    uid,
    name: parsed.name?.trim() || 'یاریزان',
    username: parsed.username || '',
    email: typeof (parsed as { email?: string }).email === 'string' ? (parsed as { email?: string }).email : '',
    gender,
    avatarUrl: null,
    avatar3d,
    playerId,
    ...fresh,
    iqd: deleteField(),
    gems: deleteField(),
    updatedAt: serverTimestamp(),
  }, { merge: true })

  if (playerId) {
    await setDoc(doc(db, 'players', playerId), {
      uid,
      playerId,
      name: parsed.name?.trim() || 'یاریزان',
      username: parsed.username || '',
      gender,
      avatarUrl: null,
      avatar3d,
      gold: fresh.gold,
      diamond: fresh.diamond,
      isPremium: false,
      title: fresh.title,
      inventory: [],
      dropsOpenedByType: fresh.dropsOpenedByType,
      hunterLevel: 0,
      playerLevel: 1,
      playerXp: 0,
      welcomeBonusGranted: true,
      dailyBonusDay: 1,
      dailyBonusLastClaimMs: null,
      spinLastFreeAtMs: null,
      spinSpinsInWindow: 0,
      totalWealth: 0,
      giftsSentScore: 0,
      leaderboardEpoch: GAMEPLAY_LEADERBOARD_EPOCH,
      gameplayResetVersion: ACCOUNT_GAMEPLAY_RESET_VERSION,
      iqd: deleteField(),
      gems: deleteField(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  const next: FullUserData = {
    ...parsed,
    ...fresh,
    gender,
    avatarUrl: null,
    avatar3d,
    playerId,
  }
  cacheFromFullUser(uid, next)
  return next
}

/**
 * ئەگەر وەشانی گشتی نوێ بێت، هەموو کارەکتەرەکان سفر دەکاتەوە (ڕۆڵ/لێڤڵ/دراو/پاس…).
 * بە Firestore meta قفڵ دەکرێت تا دووجار نەڕوات.
 */
export async function runGlobalGameplayResetIfNeeded(): Promise<{ ran: boolean; resetUsers: number; resetPlayers: number }> {
  const metaRef = doc(db, 'meta', 'gameplayReset')
  let shouldRun = false
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(metaRef)
      const current = Number(snap.exists() ? snap.data()?.version : 0) || 0
      if (current >= GLOBAL_GAMEPLAY_RESET_VERSION) {
        shouldRun = false
        return
      }
      tx.set(metaRef, {
        version: GLOBAL_GAMEPLAY_RESET_VERSION,
        atMs: Date.now(),
        updatedAt: serverTimestamp(),
      }, { merge: true })
      shouldRun = true
    })
  } catch (err) {
    console.error('global gameplay reset lock failed:', err)
    return { ran: false, resetUsers: 0, resetPlayers: 0 }
  }

  if (!shouldRun) return { ran: false, resetUsers: 0, resetPlayers: 0 }

  try {
    const result = await factoryResetAllCharacters()
    return { ran: true, resetUsers: result.resetUsers, resetPlayers: result.resetPlayers }
  } catch (err) {
    console.error('factoryResetAllCharacters failed:', err)
    // ڕێگە بدە دووبارە هەوڵ بدات ئەگەر شکستیهێنا
    try {
      await setDoc(metaRef, { version: GLOBAL_GAMEPLAY_RESET_VERSION - 1, failedAtMs: Date.now() }, { merge: true })
    } catch { /* ignore */ }
    return { ran: false, resetUsers: 0, resetPlayers: 0 }
  }
}

export async function getOrCreateUser(uid: string): Promise<FullUserData> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const raw = snap.data() as Record<string, unknown>
    let parsed = parseFullUserData(raw)
    // بەکارهێنەرانی کۆن کە پێش زیادکردنی سیستەمی ID دروستکراون، ئێستا IDـیان بۆ دادەنرێت
    if (!parsed.playerId) {
      const playerId = await reserveUniquePlayerId(uid)
      await updateDoc(ref, { playerId, updatedAt: serverTimestamp() })
      parsed.playerId = playerId
    }
    rememberPlayerId(uid, parsed.playerId)

    if (parsed.phone && parsed.email) {
      void upsertPhoneIndex(uid, parsed.phone, parsed.email)
    }

    const accountResetVer = Math.floor(Number(raw.gameplayResetVersion) || 0)
    if (accountResetVer < ACCOUNT_GAMEPLAY_RESET_VERSION) {
      parsed = await wipeAccountGameplayProgress(uid, parsed)
    }

    // players/{playerId} is source of truth for balances / level / inventory
    const playerDoc = await ensurePlayerProgressDoc(parsed.playerId, uid, parsed)
    parsed = mergePlayerProgressIntoUser(
      { ...parsed, ...clampWalletToCap(parsed) },
      playerDoc,
    )
    cacheFromFullUser(uid, parsed)
    return parsed
  }

  const profile = createDefaultProfile()
  const playerId = await reserveUniquePlayerId(uid)
  profile.playerId = playerId
  const seeded = clampWalletToCap(profile)
  await setDoc(ref, {
    ...seeded,
    inventory: [],
    dailyBonusDay: 1,
    dailyBonusLastClaimMs: null,
    spinLastFreeAtMs: null,
    spinSpinsInWindow: 0,
    readNotificationIds: [],
    blockedUsers: [],
    friends: [],
    giftsLog: [],
    totalWealth: 0,
    giftsSentScore: 0,
    leaderboardEpoch: GAMEPLAY_LEADERBOARD_EPOCH,
    welcomeBonusGranted: true,
    gameplayResetVersion: ACCOUNT_GAMEPLAY_RESET_VERSION,
    vipPasses: emptyVipPassesState(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await ensurePlayerProgressDoc(playerId, uid, {
    ...seeded,
    inventory: [],
    dropsOpenedByType: seeded.dropsOpenedByType,
    welcomeBonusGranted: true,
    totalWealth: 0,
    giftsSentScore: 0,
    leaderboardEpoch: GAMEPLAY_LEADERBOARD_EPOCH,
  })
  // mark player reset version
  await setDoc(doc(db, 'players', playerId), { gameplayResetVersion: ACCOUNT_GAMEPLAY_RESET_VERSION }, { merge: true })
  const created: FullUserData = {
    ...seeded,
    inventory: [],
    dailyBonusDay: 1,
    dailyBonusLastClaimMs: null,
    spinLastFreeAtMs: null,
    spinSpinsInWindow: 0,
    readNotificationIds: [],
    blockedUsers: [],
    friends: [],
    giftsLog: [],
    inboxNotifications: [],
    dropTypeCooldowns: {},
    stealShieldUntilMs: 0,
    stealCooldownUntilMs: 0,
    fightBanUntilMs: 0,
    fightChallengeLog: {},
    incomingFight: null,
    incomingHeist: null,
    homeCityKey: '',
    mutedChatUids: [],
  }
  cacheFromFullUser(uid, created)
  return created
}

export interface FoundPlayer {
  uid: string
  name: string
  gender: Gender
  playerId: string
  title: string
  isPremium: boolean
  avatarUrl: string | null
  avatar3d: Avatar3DCustomization
}

// دۆزینەوەی یاریزان بەپێی IDی تایبەتی ٨ ژمارەیی
export async function findUserByPlayerId(playerId: string): Promise<FoundPlayer | null> {
  const trimmed = playerId.trim()
  if (!/^\d{8}$/.test(trimmed)) throw new Error('تکایە IDیەکی ٨ ژمارەیی ڕاست بنووسە')

  // Prefer canonical players/{playerId} document
  const playerSnap = await getDoc(doc(db, 'players', trimmed))
  if (playerSnap.exists()) {
    const data = playerSnap.data() as Record<string, unknown>
    const uid = String(data.uid ?? '')
    if (uid) rememberPlayerId(uid, trimmed)
    return {
      uid,
      name: typeof data.name === 'string' ? data.name : 'یاریزان',
      gender: data.gender === 'female' ? 'female' : 'male',
      playerId: trimmed,
      title: typeof data.title === 'string' && data.title.trim() ? data.title : DEFAULT_TITLE,
      isPremium: Boolean(data.isPremium),
      avatarUrl: typeof data.avatarUrl === 'string' && data.avatarUrl ? data.avatarUrl : null,
      avatar3d: normalizeAvatar3d(data.avatar3d),
    }
  }

  const idSnap = await getDoc(doc(db, 'playerIds', trimmed))
  if (!idSnap.exists()) return null
  const uid = String(idSnap.data().uid ?? '')
  if (!uid) return null

  const userSnap = await getDoc(doc(db, 'users', uid))
  if (!userSnap.exists()) return null
  const data = userSnap.data()
  rememberPlayerId(uid, trimmed)
  return {
    uid,
    name: typeof data.name === 'string' ? data.name : 'یاریزان',
    gender: data.gender === 'female' ? 'female' : 'male',
    playerId: trimmed,
    title: typeof data.title === 'string' && data.title.trim() ? data.title : DEFAULT_TITLE,
    isPremium: Boolean(data.isPremium),
    avatarUrl: typeof data.avatarUrl === 'string' && data.avatarUrl ? data.avatarUrl : null,
    avatar3d: normalizeAvatar3d(data.avatar3d),
  }
}

/** سفرکردنەوەی تەواوی یاریزانێک بە ئایدی ٨ ژمارەیی */
export async function wipeGameplayByPlayerId(playerId: string): Promise<{
  ok: true
  uid: string
  playerId: string
  name: string
}> {
  const found = await findUserByPlayerId(playerId)
  if (!found?.uid) throw new Error(`یاریزان بە ئایدی ${playerId} نەدۆزرایەوە`)

  const userSnap = await getDoc(doc(db, 'users', found.uid))
  let parsed: FullUserData
  if (userSnap.exists()) {
    parsed = parseFullUserData(userSnap.data() as Record<string, unknown>)
    parsed = { ...parsed, playerId: found.playerId || parsed.playerId }
  } else {
    const base = createDefaultProfile()
    parsed = {
      ...base,
      name: found.name,
      gender: found.gender,
      playerId: found.playerId,
      title: found.title,
      isPremium: false,
      avatarUrl: found.avatarUrl,
      avatar3d: found.avatar3d,
      inventory: [],
      dailyBonusDay: 1,
      dailyBonusLastClaimMs: null,
      spinLastFreeAtMs: null,
      spinSpinsInWindow: 0,
      readNotificationIds: [],
      blockedUsers: [],
      friends: [],
      giftsLog: [],
      inboxNotifications: [],
      dropTypeCooldowns: {},
      stealShieldUntilMs: 0,
      stealCooldownUntilMs: 0,
      fightBanUntilMs: 0,
      fightChallengeLog: {},
      incomingFight: null,
      incomingHeist: null,
      homeCityKey: '',
      mutedChatUids: [],
    }
  }

  await wipeAccountGameplayProgress(found.uid, parsed)
  return {
    ok: true,
    uid: found.uid,
    playerId: found.playerId,
    name: found.name,
  }
}

export function userSettingsLocalKey(uid: string): string {
  return `kd_settings_${uid}`
}

/** خوێندنەوەی ڕێکخستنەکان لە localStorage — بۆ گەڕاندنەوەی خێرا پێش Firestore */
export function loadUserSettingsLocal(uid: string): UserSettings | null {
  if (!uid || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(userSettingsLocalKey(uid))
    if (!raw) return null
    return parseSettings(JSON.parse(raw))
  } catch {
    return null
  }
}

/** پاشکەوتکردنی ڕێکخستنەکان لە localStorage (merge لەگەڵ کۆن) */
export function saveUserSettingsLocal(uid: string, partial: Partial<UserSettings>): UserSettings {
  const prev = loadUserSettingsLocal(uid) ?? { ...DEFAULT_USER_SETTINGS }
  const next: UserSettings = { ...prev, ...partial }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(userSettingsLocalKey(uid), JSON.stringify(next))
    }
  } catch { /* ignore quota */ }
  return next
}

export async function syncUserSettings(uid: string, partial: Partial<UserSettings>) {
  saveUserSettingsLocal(uid, partial)
  const ref = doc(db, 'users', uid)
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }
  for (const [key, value] of Object.entries(partial)) {
    payload[`settings.${key}`] = value
  }
  await updateDoc(ref, payload as Record<string, import('firebase/firestore').FieldValue | Partial<unknown>>)
}

/** سڕینەوەی هەمیشەیی داتای هەژمار لە Firestore — پێش سڕینەوەی هەژماری Firebase Auth بانگ بکرێت */
export async function deleteUserProfileData(uid: string): Promise<void> {
  if (!uid) return
  try { await deleteDoc(doc(db, 'users', uid)) } catch { /* ignore — proceed to auth delete regardless */ }
}

export async function incrementPlayerStats(uid: string, partial: Partial<Record<keyof PlayerStats, number>>) {
  const ref = doc(db, 'users', uid)
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }
  for (const [key, value] of Object.entries(partial)) {
    if (!value) continue
    payload[`stats.${key}`] = increment(value)
  }
  if (Object.keys(payload).length <= 1) return
  await updateDoc(ref, payload as Record<string, import('firebase/firestore').FieldValue | Partial<unknown>>)
}

/**
 * Additive revenue-share credit to the recipient's own wallet (e.g. 30% cut of a
 * gift's price). Works for real players, NPCs (kd_npc_*), and bots (kd_bot_*).
 * Uses setDoc+merge so missing NPC docs are created instead of failing updateDoc.
 */
export async function creditGiftRevenueShare(
  uid: string,
  cut: { gold?: number; diamond?: number },
): Promise<void> {
  if (!uid) return
  const gold = Math.max(0, Math.floor(Number(cut.gold) || 0))
  const diamond = Math.max(0, Math.floor(Number(cut.diamond) || 0))
  if (!gold && !diamond) return

  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }
  if (gold) payload.gold = increment(gold)
  if (diamond) payload.diamond = increment(diamond)

  // merge — NPC/bot docs may not exist yet
  await setDoc(doc(db, 'users', uid), { uid, ...payload }, { merge: true })

  try {
    let playerId = getCachedPlayerId(uid)
    if (!playerId) {
      const npc = /^kd_npc_(\d+)$/.exec(uid)
      if (npc) {
        playerId = `8${String(Number(npc[1])).padStart(7, '0')}`
      } else if (uid.startsWith('kd_bot_')) {
        const botId = uid.slice('kd_bot_'.length)
        playerId = `9${botId.padStart(7, '0')}`
      } else {
        playerId = await resolvePlayerId(uid)
      }
    }
    if (playerId) {
      rememberPlayerId(uid, playerId)
      await setDoc(doc(db, 'players', playerId), {
        uid,
        playerId,
        ...payload,
      }, { merge: true })
    }
  } catch (err) {
    console.error('Player gift revenue sync failed:', err)
  }
}

export function subscribeToUser(
  uid: string,
  onUpdate: (data: FullUserData) => void,
): () => void {
  const userRef = doc(db, 'users', uid)
  let unsubPlayer: (() => void) | null = null
  let latestUser: FullUserData | null = null
  let latestPlayer: Record<string, unknown> | null = null
  let activePlayerId = ''

  const emit = () => {
    if (!latestUser) return
    const merged = mergePlayerProgressIntoUser(latestUser, latestPlayer)
    cacheFromFullUser(uid, merged)
    onUpdate(merged)
  }

  const attachPlayerListener = (playerId: string) => {
    if (!playerId || playerId === activePlayerId) return
    unsubPlayer?.()
    unsubPlayer = null
    activePlayerId = playerId
    rememberPlayerId(uid, playerId)
    unsubPlayer = onSnapshot(doc(db, 'players', playerId), pSnap => {
      latestPlayer = pSnap.exists() ? (pSnap.data() as Record<string, unknown>) : null
      emit()
    }, err => console.error('Player progress listener failed:', err))
  }

  const unsubUser = onSnapshot(userRef, snap => {
    if (!snap.exists()) return
    latestUser = parseFullUserData(snap.data())
    if (latestUser.playerId) attachPlayerListener(latestUser.playerId)
    emit()
  }, err => console.error('User listener failed:', err))

  return () => {
    unsubUser()
    unsubPlayer?.()
  }
}

export async function syncUserBalances(
  uid: string,
  balances: Pick<UserProfile, 'gold' | 'diamond' | 'isPremium'>,
) {
  const playerId = await resolvePlayerId(uid)
  let capped = clampWalletToCap(balances)
  if (isProtectedAccount({ uid, playerId })) {
    capped = lockProtectedWallet(capped)
  }
  await dualWritePlayerProgress(uid, playerId, { ...capped })
  saveUserDataLocal(uid, {
    playerId,
    gold: capped.gold,
    diamond: capped.diamond,
    isPremium: capped.isPremium,
  })
}

export async function syncUserWalletAndInventory(
  uid: string,
  wallet: Pick<UserProfile, 'gold' | 'diamond' | 'isPremium'>,
  inventory: InventoryItem[],
) {
  const playerId = await resolvePlayerId(uid)
  let capped = clampWalletToCap(wallet)
  if (isProtectedAccount({ uid, playerId })) {
    capped = lockProtectedWallet(capped)
  }
  await dualWritePlayerProgress(uid, playerId, { ...capped, inventory })
  saveUserDataLocal(uid, {
    playerId,
    gold: capped.gold,
    diamond: capped.diamond,
    isPremium: capped.isPremium,
    inventory,
  })
}

export async function syncUserProfile(uid: string, updates: Partial<UserProfile>) {
  const playerId = await resolvePlayerId(uid)
  const payload: Record<string, unknown> = {
    ...updates,
    playerId,
  }
  if (updates.gold != null || updates.diamond != null) {
    const prev = loadUserDataLocal(playerId) ?? loadUserDataLocal(uid)
    const walletPatch = clampWalletToCap({
      gold: updates.gold != null ? Number(updates.gold) || 0 : (prev?.gold ?? 0),
      diamond: updates.diamond != null ? Number(updates.diamond) || 0 : (prev?.diamond ?? 0),
    })
    if (updates.gold != null) payload.gold = walletPatch.gold
    if (updates.diamond != null) payload.diamond = walletPatch.diamond
  }
  await dualWritePlayerProgress(uid, playerId, payload)
  const cached = loadUserDataLocal(playerId) ?? loadUserDataLocal(uid)
  saveUserDataLocal(uid, {
    playerId,
    gold: updates.gold != null ? Number(payload.gold) || 0 : (cached?.gold ?? 0),
    diamond: updates.diamond != null ? Number(payload.diamond) || 0 : (cached?.diamond ?? 0),
    isPremium: updates.isPremium,
    playerLevel: updates.playerLevel,
    playerXp: updates.playerXp,
    hunterLevel: updates.hunterLevel,
    name: updates.name,
    username: updates.username,
    gender: updates.gender,
    title: updates.title,
    avatarUrl: updates.avatarUrl,
    avatar3d: updates.avatar3d,
    dropsOpenedByType: updates.dropsOpenedByType,
    welcomeBonusGranted: updates.welcomeBonusGranted,
  })
}

export async function purchaseMarketItem(
  uid: string,
  item: MarketPurchaseItem,
): Promise<FullUserData> {
  const ref = doc(db, 'users', uid)

  const result = await runTransaction(db, async transaction => {
    const snap = await transaction.get(ref)
    if (!snap.exists()) throw new Error('هەژمار نەدۆزرایەوە')

    const data = snap.data()
    let gold = Number(data.gold) || 0
    let diamond = Number(data.diamond) || 0
    const inventory = parseInventory(data.inventory)
    const isPremium = Boolean(data.isPremium)

    const balance = item.curr === 'gold' ? gold : diamond
    if (balance < item.price) throw new Error('باڵانسەکەت بەش ناکات بۆ کڕین!')

    const capacity = 5
    const isFlare = item.id === 1
    const alreadyOwned = inventory.some(i => i.id === item.id)

    // پاراستنی دروستیی بازاڕ: کاڵای تاکە (نەک فلار) کە پێشتر هەیە نەکڕدرێتەوە
    // (بۆ خۆ نەبێت پارە کەم بێتەوە بەبێ ئەوەی هیچ کاڵایەکی نوێ بۆ جانتا زیاد بێت)
    if (!isFlare && alreadyOwned) {
      throw new Error('ئەم کەرەستەیە پێشتر لە جانتاکەتدایە! پێویست ناکات دووبارە بیکڕیتەوە.')
    }

    if (!isFlare && inventory.length >= capacity) {
      throw new Error(`❌ جانتاکەت پڕە! تەنها جێگەی ${capacity} کەرەستەی تێدا دەبێتەوە.`)
    }

    if (item.curr === 'gold') gold -= item.price
    else diamond -= item.price

    let nextInventory = inventory
    if (!isFlare) {
      nextInventory = [
        ...inventory,
        { ...item, active: true },
      ]
    }

    transaction.update(ref, {
      gold,
      diamond,
      isPremium,
      inventory: nextInventory,
      'stats.itemsPurchased': increment(1),
      updatedAt: serverTimestamp(),
    })

    const dropsOpenedByType = parseDropsOpenedByType(data.dropsOpenedByType)
    const storedLevel = Number(data.hunterLevel)
    const hunterLevel = Number.isFinite(storedLevel) && storedLevel >= 0
      ? Math.floor(storedLevel)
      : computeHunterLevel(dropsOpenedByType)

    return {
      name: String(data.name ?? 'یاریزان'),
      username: typeof data.username === 'string' ? data.username : '',
      gender: (data.gender === 'female' ? 'female' : 'male') as Gender,
      gold,
      diamond,
      isPremium,
      title: typeof data.title === 'string' && data.title.trim() ? data.title : DEFAULT_TITLE,
      avatarUrl: typeof data.avatarUrl === 'string' && data.avatarUrl ? data.avatarUrl : null,
      avatar3d: normalizeAvatar3d(data.avatar3d),
      playerId: typeof data.playerId === 'string' ? data.playerId : '',
      settings: parseSettings(data.settings),
      stats: { ...parseStats(data.stats), itemsPurchased: (parseStats(data.stats).itemsPurchased || 0) + 1 },
      dropsOpenedByType,
      hunterLevel,
      playerLevel: Math.max(1, Math.floor(Number(data.playerLevel) || 1)),
      playerXp: Math.max(0, Math.floor(Number(data.playerXp) || 0)),
      welcomeBonusGranted: Boolean(data.welcomeBonusGranted),
      dailyBonusDay: Math.max(1, Math.floor(Number(data.dailyBonusDay) || 1)),
      dailyBonusLastClaimMs: parseEpochMs(data.dailyBonusLastClaimMs),
      spinLastFreeAtMs: parseEpochMs(data.spinLastFreeAtMs),
      spinSpinsInWindow: Math.max(0, Math.floor(Number(data.spinSpinsInWindow) || 0)),
      readNotificationIds: parseReadNotificationIds(data.readNotificationIds),
      inventory: nextInventory,
      blockedUsers: parseBlockedUsers(data.blockedUsers),
      friends: parseFriends(data.friends),
      giftsLog: parseGiftsLog(data.giftsLog),
      inboxNotifications: parseInboxNotifications(data.inboxNotifications),
      dropTypeCooldowns: parseDropTypeCooldowns(data.dropTypeCooldowns),
      stealShieldUntilMs: Number(data.stealShieldUntilMs) || 0,
      stealCooldownUntilMs: Number(data.stealCooldownUntilMs) || 0,
      fightBanUntilMs: Number(data.fightBanUntilMs) || 0,
      fightChallengeLog: parseFightChallengeLog(data.fightChallengeLog),
      incomingFight: parseIncomingFightField(data.incomingFight),
      incomingHeist: parseIncomingHeistField(data.incomingHeist),
      homeCityKey: typeof data.homeCityKey === 'string' ? data.homeCityKey.trim() : '',
      mutedChatUids: parseStringUidList(data.mutedChatUids),
    }
  })

  const playerId = result.playerId || await resolvePlayerId(uid)
  if (playerId) {
    await dualWritePlayerProgress(uid, playerId, {
      gold: result.gold,
      diamond: result.diamond,
      isPremium: result.isPremium,
      inventory: result.inventory,
      playerLevel: result.playerLevel,
      playerXp: result.playerXp,
      hunterLevel: result.hunterLevel,
      name: result.name,
    }).catch(err => console.error('Player purchase sync failed:', err))
  }
  const withId = { ...result, playerId }
  cacheFromFullUser(uid, withId)
  return withId
}

export interface DailyBonusClaimResult {
  claimedDay: number
  reward: DailyBonusRewardDef
  grantedGold: number
  grantedDiamond: number
  grantedItem: InventoryItem | null
  itemNote?: string
  nextDay: number
  nextClaimMs: number
}

export async function claimDailyBonus(uid: string): Promise<DailyBonusClaimResult> {
  const ref = doc(db, 'users', uid)

  const result = await runTransaction(db, async transaction => {
    const snap = await transaction.get(ref)
    if (!snap.exists()) throw new Error('هەژمار نەدۆزرایەوە')

    const data = snap.data()
    let gold = Number(data.gold) || 0
    let diamond = Number(data.diamond) || 0
    const lastClaimMs = parseEpochMs(data.dailyBonusLastClaimMs)
    const now = Date.now()
    const day = resolveDailyBonusStreakDay(Number(data.dailyBonusDay) || 1, lastClaimMs, now)
    const inventory = parseInventory(data.inventory)
    const capacity = 5

    if (lastClaimMs !== null && now - lastClaimMs < DAILY_BONUS_MIN_GAP_MS) {
      throw new Error('پێشتر دیاریی ئەمڕۆت وەرگرتووە! دوای ٢٤ کاتژمێر بگەرێوە.')
    }

    const reward = getDailyBonusRewardDef(day)
    const grantGold = reward.gold ?? 0
    const grantDiamond = reward.diamond ?? 0
    gold += grantGold
    diamond += grantDiamond

    let grantedItem: InventoryItem | null = null
    let itemNote: string | undefined
    let bonusGold = 0
    let nextInventory = inventory
    const nextDay = day >= DAILY_BONUS_TOTAL_DAYS ? 1 : day + 1
    let stealShieldUntilMs: number | undefined

    if (reward.item) {
      const alreadyOwned = inventory.some(i => i.id === reward.item!.id)
      if (alreadyOwned) {
        bonusGold = 50
        gold += bonusGold
        itemNote = 'کەرەستەکە پێشتر هەبوو — ٥٠ زێڕی جێگرتەوە'
      } else if (inventory.length >= capacity) {
        bonusGold = 100
        gold += bonusGold
        itemNote = 'جانتاکەت پڕ بوو — ١٠٠ زێڕی جێگرتەوە'
      } else {
        const shieldUntil = reward.item.id === 4 ? now + STEAL_SHIELD_MS : undefined
        grantedItem = {
          ...reward.item,
          active: true,
          ...(shieldUntil != null ? { expiresAtMs: shieldUntil } : {}),
        }
        nextInventory = [...inventory, grantedItem]
        if (shieldUntil != null) stealShieldUntilMs = shieldUntil
      }
    }

    transaction.update(ref, {
      gold,
      diamond,
      inventory: nextInventory,
      dailyBonusDay: nextDay,
      dailyBonusLastClaimMs: now,
      ...(stealShieldUntilMs != null ? { stealShieldUntilMs } : {}),
      totalWealth: increment(computeTotalWealth(grantGold + bonusGold, grantDiamond)),
      'stats.dailyBonusClaims': increment(1),
      updatedAt: serverTimestamp(),
    })

    return {
      claimedDay: day,
      reward,
      grantedGold: grantGold + bonusGold,
      grantedDiamond: grantDiamond,
      grantedItem,
      itemNote,
      nextDay,
      nextClaimMs: now,
      gold,
      diamond,
      inventory: nextInventory,
      playerId: typeof data.playerId === 'string' ? data.playerId : '',
    }
  })

  // Dual-write cooldown + wallet so re-login never loses claim state
  try {
    const playerId = result.playerId || await resolvePlayerId(uid)
    await dualWritePlayerProgress(uid, playerId, {
      gold: result.gold,
      diamond: result.diamond,
      inventory: result.inventory,
      dailyBonusDay: result.nextDay,
      dailyBonusLastClaimMs: result.nextClaimMs,
    })
    saveUserDataLocal(uid, {
      playerId,
      gold: result.gold,
      diamond: result.diamond,
      inventory: result.inventory,
      dailyBonusDay: result.nextDay,
      dailyBonusLastClaimMs: result.nextClaimMs,
    })
  } catch (err) {
    console.error('Daily bonus player sync failed:', err)
  }

  return {
    claimedDay: result.claimedDay,
    reward: result.reward,
    grantedGold: result.grantedGold,
    grantedDiamond: result.grantedDiamond,
    grantedItem: result.grantedItem,
    itemNote: result.itemNote,
    nextDay: result.nextDay,
    nextClaimMs: result.nextClaimMs,
  }
}

/** تۆمارکردنی سووڕانی چەرخی بەخت — بێبەرامبەر هەر ٢٤ کاتژمێر جارێک */
export async function recordDailySpin(
  uid: string,
  opts: { wasFree: boolean; spinsInWindow: number; lastFreeAtMs?: number },
): Promise<void> {
  if (!uid) return
  const spinsInWindow = Math.max(0, Math.floor(opts.spinsInWindow))
  const patch: Record<string, unknown> = {
    spinSpinsInWindow: spinsInWindow,
  }
  if (opts.wasFree) {
    patch.spinLastFreeAtMs = opts.lastFreeAtMs ?? Date.now()
  }
  try {
    const playerId = await resolvePlayerId(uid)
    await dualWritePlayerProgress(uid, playerId, patch)
    saveUserDataLocal(uid, {
      playerId,
      gold: loadUserDataLocal(playerId)?.gold ?? loadUserDataLocal(uid)?.gold ?? 0,
      diamond: loadUserDataLocal(playerId)?.diamond ?? loadUserDataLocal(uid)?.diamond ?? 0,
      spinLastFreeAtMs: opts.wasFree ? (opts.lastFreeAtMs ?? Date.now()) : undefined,
      spinSpinsInWindow: spinsInWindow,
    })
  } catch (err) {
    console.error('recordDailySpin failed:', err)
  }
}

/** پاراستنی ئاگادارییەکانی خوێندراو لە Firestore */
export async function syncReadNotificationIds(uid: string, ids: string[]): Promise<void> {
  if (!uid) return
  const cleaned = [...new Set(ids.map(String).filter(Boolean))].slice(-400)
  try {
    const playerId = await resolvePlayerId(uid)
    await dualWritePlayerProgress(uid, playerId, { readNotificationIds: cleaned })
    const cached = loadUserDataLocal(playerId) ?? loadUserDataLocal(uid)
    saveUserDataLocal(uid, {
      playerId,
      gold: cached?.gold ?? 0,
      diamond: cached?.diamond ?? 0,
      readNotificationIds: cleaned,
    })
  } catch (err) {
    console.error('syncReadNotificationIds failed:', err)
  }
}

export async function getUserPublicProfile(uid: string): Promise<(Pick<UserProfile, 'name' | 'gender' | 'gold' | 'diamond' | 'title' | 'isPremium' | 'avatarUrl' | 'avatar3d' | 'hunterLevel' | 'dropsOpenedByType' | 'stats'> & { isBot?: boolean; hunterRankName?: string; allowDmWithoutFriendship?: boolean; blockIncomingGifts?: boolean }) | null> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  // Avatar click / public sheet: read cached fields only — never run drop-level math here
  const dropsOpenedByType = parseDropsOpenedByType(data.dropsOpenedByType)
  const storedLevel = Number(data.hunterLevel)
  const hunterLevel = Number.isFinite(storedLevel) && storedLevel >= 0
    ? Math.floor(storedLevel)
    : 0
  const name =
    typeof data.name === 'string' && data.name.trim()
      ? data.name.trim()
      : 'یاریزان'
  const settingsRaw = data.settings != null && typeof data.settings === 'object'
    ? (data.settings as Record<string, unknown>)
    : null
  const allowDmWithoutFriendship = settingsRaw && typeof settingsRaw.allowDmWithoutFriendship === 'boolean'
    ? settingsRaw.allowDmWithoutFriendship
    : DEFAULT_USER_SETTINGS.allowDmWithoutFriendship
  const blockIncomingGifts = settingsRaw && typeof settingsRaw.blockIncomingGifts === 'boolean'
    ? settingsRaw.blockIncomingGifts
    : DEFAULT_USER_SETTINGS.blockIncomingGifts
  return {
    name,
    gender: data.gender === 'female' ? 'female' : 'male',
    gold: Number(data.gold) || 0,
    diamond: Number(data.diamond) || 0,
    title: typeof data.title === 'string' && data.title.trim() ? data.title : DEFAULT_TITLE,
    isPremium: Boolean(data.isPremium),
    avatarUrl: typeof data.avatarUrl === 'string' && data.avatarUrl ? data.avatarUrl : null,
    avatar3d: normalizeAvatar3d(data.avatar3d ?? DEFAULT_AVATAR_3D),
    hunterLevel,
    dropsOpenedByType,
    stats: parseStats(data.stats),
    isBot: data.isBot === true || (typeof uid === 'string' && uid.startsWith('kd_bot_')),
    hunterRankName: typeof data.hunterRankName === 'string' ? data.hunterRankName : undefined,
    allowDmWithoutFriendship,
    blockIncomingGifts,
  }
}

// ── کارلێکی نێوان یاریزانان (نامە/بلۆک/هاوڕێیەتی/دیاری/دزی/شەڕ) ──────────────

export async function sendFriendRequest(fromUid: string, fromName: string, toUid: string): Promise<void> {
  if (fromUid === toUid) throw new Error('نەتوانیت داواکاری هاوڕێیەتی بۆ خۆت بنێریت')

  const fromRef = doc(db, 'users', fromUid)
  const toRef = doc(db, 'users', toUid)
  const [fromSnap, toSnap] = await Promise.all([getDoc(fromRef), getDoc(toRef)])
  if (!toSnap.exists()) throw new Error('هەژمار نەدۆزرایەوە')

  const fromFriends = fromSnap.exists() ? parseFriends(fromSnap.data().friends) : []
  const toFriends = parseFriends(toSnap.data().friends)
  if (fromFriends.some(f => f.uid === toUid) || toFriends.some(f => f.uid === fromUid)) {
    throw new Error('پێشتر هاوڕێیت!')
  }
  if (fromFriends.length >= MAX_FRIENDS) throw new Error(`تۆ گەیشتویتە سنووری ١٠٠ هاوڕێ!`)
  if (toFriends.length >= MAX_FRIENDS) throw new Error('ئەم یاریزانە گەیشتووەتە سنووری ١٠٠ هاوڕێ!')

  // ئەگەر لایەنی بەرامبەر پێشتر داواکاری ناردبێت — ڕاستەوخۆ قبوڵی بکە
  const reverseId = `${toUid}_${fromUid}`
  const reverseRef = doc(db, 'friendRequests', reverseId)
  const reverseSnap = await getDoc(reverseRef)
  if (reverseSnap.exists() && reverseSnap.data().status === 'pending') {
    const reverseName = typeof reverseSnap.data().fromName === 'string' ? reverseSnap.data().fromName : 'یاریزان'
    await acceptFriendRequest(reverseId, fromUid, fromName, toUid, reverseName)
    return
  }

  const reqId = `${fromUid}_${toUid}`
  const reqRef = doc(db, 'friendRequests', reqId)
  const existing = await getDoc(reqRef)
  if (existing.exists() && existing.data().status === 'pending') {
    throw new Error('داواکارییەکەت پێشتر نێردراوە!')
  }

  await setDoc(reqRef, {
    from: fromUid,
    fromName,
    to: toUid,
    status: 'pending',
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  })
}

export interface IncomingFriendRequest { id: string; from: string; fromName: string; createdAtMs: number }

// نۆتە: وەک هەموو سێرڤیسەکانی تری پڕۆژەکە، هەموو داکیومێنتەکان دەهێنرێنە خوارەوە و
// بە لایەنی کلایەنتەوە پاڵاوتن دەکرێن، بۆ ئەوەی پێویستی بە ئیندێکسی هاوکات (composite index) نەبێت.
export function subscribeToIncomingFriendRequests(uid: string, onUpdate: (list: IncomingFriendRequest[]) => void): () => void {
  return onSnapshot(collection(db, 'friendRequests'), snap => {
    const list: IncomingFriendRequest[] = []
    snap.forEach(d => {
      const data = d.data()
      if (data.to === uid && data.status === 'pending') {
        list.push({
          id: d.id,
          from: String(data.from ?? ''),
          fromName: typeof data.fromName === 'string' ? data.fromName : 'یاریزان',
          createdAtMs: Number(data.createdAtMs) || 0,
        })
      }
    })
    list.sort((a, b) => (b.createdAtMs - a.createdAtMs) || a.fromName.localeCompare(b.fromName, 'ku'))
    onUpdate(list)
  }, err => console.error('Friend requests listener failed:', err))
}

/** داواکارییە نێردراوەکانی خۆت (Outgoing) */
export function subscribeToOutgoingFriendRequests(uid: string, onUpdate: (targetUids: string[]) => void): () => void {
  return onSnapshot(collection(db, 'friendRequests'), snap => {
    const uids: string[] = []
    snap.forEach(d => {
      const data = d.data()
      if (data.from === uid && data.status === 'pending') {
        const to = String(data.to ?? '')
        if (to) uids.push(to)
      }
    })
    onUpdate(uids)
  }, err => console.error('Outgoing friend requests listener failed:', err))
}

export async function acceptFriendRequest(requestId: string, myUid: string, myName: string, otherUid: string, otherName: string): Promise<void> {
  const reqRef = doc(db, 'friendRequests', requestId)
  const reverseRef = doc(db, 'friendRequests', `${otherUid}_${myUid}`)
  const myRef = doc(db, 'users', myUid)
  const otherRef = doc(db, 'users', otherUid)
  await runTransaction(db, async transaction => {
    const reqSnap = await transaction.get(reqRef)
    const reverseSnap = await transaction.get(reverseRef)
    const mySnap = await transaction.get(myRef)
    const otherSnap = await transaction.get(otherRef)

    if (!reqSnap.exists()) throw new Error('داواکارییەکە نەماوە')
    const reqData = reqSnap.data()
    if (reqData.status !== 'pending') throw new Error('ئەم داواکارییە چیتر بەردەست نییە')
    if (String(reqData.to ?? '') !== myUid || String(reqData.from ?? '') !== otherUid) {
      throw new Error('داواکارییەکە نادروستە')
    }
    if (!mySnap.exists() || !otherSnap.exists()) throw new Error('هەژمار نەدۆزرایەوە')

    const myFriends = parseFriends(mySnap.data()!.friends)
    const otherFriends = parseFriends(otherSnap.data()!.friends)
    const alreadyFriends = myFriends.some(f => f.uid === otherUid) || otherFriends.some(f => f.uid === myUid)
    if (!alreadyFriends) {
      if (myFriends.length >= MAX_FRIENDS) throw new Error('تۆ گەیشتویتە سنووری ١٠٠ هاوڕێ!')
      if (otherFriends.length >= MAX_FRIENDS) throw new Error('ئەم یاریزانە گەیشتووەتە سنووری ١٠٠ هاوڕێ!')
    }

    const myPlayerId = typeof mySnap.data()?.playerId === 'string' ? mySnap.data()!.playerId as string : ''
    const otherPlayerId = typeof otherSnap.data()?.playerId === 'string' ? otherSnap.data()!.playerId as string : ''
    const resolvedOtherName = otherName || (typeof reqData.fromName === 'string' ? reqData.fromName : 'یاریزان')

    const nextMyFriends = upsertFriendEntry(myFriends, { uid: otherUid, name: resolvedOtherName, playerId: otherPlayerId })
    const nextOtherFriends = upsertFriendEntry(otherFriends, { uid: myUid, name: myName, playerId: myPlayerId })

    // نووسینی لیستی تەواو — دووبارەبوونەوەی arrayUnion ناهێڵێت و خێراتر دەنوێتەوە
    transaction.set(myRef, { friends: nextMyFriends, updatedAt: serverTimestamp() }, { merge: true })
    transaction.set(otherRef, { friends: nextOtherFriends, updatedAt: serverTimestamp() }, { merge: true })
    transaction.delete(reqRef)
    if (reverseSnap.exists()) transaction.delete(reverseRef)
  })
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendRequests', requestId))
}

// سڕینەوەی هاوڕێیەتی — لادانی هەردوو لایەن لە یەکتری بە شێوەیەکی هاوسەنگ
export async function removeFriend(myUid: string, otherUid: string): Promise<void> {
  const myRef = doc(db, 'users', myUid)
  const otherRef = doc(db, 'users', otherUid)
  await runTransaction(db, async transaction => {
    const mySnap = await transaction.get(myRef)
    const otherSnap = await transaction.get(otherRef)
    const myFriends = mySnap.exists() ? parseFriends(mySnap.data().friends) : []
    transaction.update(myRef, { friends: myFriends.filter(f => f.uid !== otherUid), updatedAt: serverTimestamp() })
    if (otherSnap.exists()) {
      const otherFriends = parseFriends(otherSnap.data().friends)
      transaction.update(otherRef, { friends: otherFriends.filter(f => f.uid !== myUid), updatedAt: serverTimestamp() })
    }
  })
}

export async function blockUserPersist(
  uid: string,
  target: BlockedUser,
  blockerName?: string,
  reason?: string,
): Promise<void> {
  if (isProtectedAccount({ uid: target.uid })) {
    throw new Error('ناتوانیت ئەم هەژمارە بلۆک بکەیت')
  }
  try {
    const targetSnap = await getDoc(doc(db, 'users', target.uid))
    const pid = typeof targetSnap.data()?.playerId === 'string' ? String(targetSnap.data()!.playerId) : ''
    if (isProtectedAccount({ uid: target.uid, playerId: pid })) {
      throw new Error('ناتوانیت ئەم هەژمارە بلۆک بکەیت')
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('بلۆک')) throw err
  }
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { blockedUsers: arrayUnion(target), updatedAt: serverTimestamp() })
  const name = blockerName?.trim() || 'یاریزان'
  const reasonText = (reason ?? '').trim().slice(0, 280)
  const notif: InboxNotification = {
    id: makeNotificationId('block'),
    kind: 'block',
    icon: '🚫',
    title: 'بلۆککردن',
    body: reasonText
      ? `${name} تۆی بلۆک کرد — نامەی تایبەت ڕاگیرا.\nهۆکار: ${reasonText}`
      : `${name} تۆی بلۆک کرد — نامەی تایبەت ڕاگیرا.`,
    atMs: Date.now(),
    fromUid: uid,
    fromName: name,
  }
  await pushInboxNotification(target.uid, notif)
}

export async function unblockUserPersist(uid: string, target: BlockedUser, blockerName?: string): Promise<void> {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { blockedUsers: arrayRemove(target), updatedAt: serverTimestamp() })
  const name = blockerName?.trim() || 'یاریزان'
  const notif: InboxNotification = {
    id: makeNotificationId('unblock'),
    kind: 'unblock',
    icon: '🚫',
    title: 'لابردنی بلۆک',
    body: `${name} بلۆکەکەی لابرد — دەتوانن دوبارە نامە بنێرن.`,
    atMs: Date.now(),
    fromUid: uid,
    fromName: name,
  }
  await pushInboxNotification(target.uid, notif)
}

/** دیاری ناردن — `amount` بڕی ئەڵماسە (diamond) کە لە ناردەر بۆ وەرگر دەگوازرێتەوە */
export async function sendGift(fromUid: string, fromName: string, toUid: string, amount: number): Promise<void> {
  if (fromUid === toUid) throw new Error('نەتوانیت دیاری بۆ خۆت بنێریت')
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('بڕی هەڵەیە')
  if (isProtectedAccount({ uid: toUid })) {
    throw new Error('ناتوانیت دیاری بۆ ئەم هەژمارە بنێریت')
  }
  const fromRef = doc(db, 'users', fromUid)
  const toRef = doc(db, 'users', toUid)
  await runTransaction(db, async transaction => {
    const fromSnap = await transaction.get(fromRef)
    const toSnap = await transaction.get(toRef)
    if (!fromSnap.exists() || !toSnap.exists()) throw new Error('هەژمار نەدۆزرایەوە')
    const toPid = typeof toSnap.data().playerId === 'string' ? String(toSnap.data().playerId) : ''
    if (isProtectedAccount({ uid: toUid, playerId: toPid })) {
      throw new Error('ناتوانیت دیاری بۆ ئەم هەژمارە بنێریت')
    }
    const toSettings = toSnap.data().settings
    if (toSettings != null && typeof toSettings === 'object' && (toSettings as Record<string, unknown>).blockIncomingGifts === true) {
      throw new Error('ئەم یاریزانە وەرگرتنی دیاری داخستووە')
    }
    const fromDiamond = Number(fromSnap.data().diamond) || 0
    const toDiamond = Number(toSnap.data().diamond) || 0
    if (fromDiamond < amount) throw new Error('باڵانسی ئەڵماسی تۆ بەش ناکات')
    const entry: GiftLogEntry = { from: fromUid, fromName, amount, atMs: Date.now() }
    transaction.update(fromRef, { diamond: fromDiamond - amount, updatedAt: serverTimestamp() })
    transaction.update(toRef, {
      diamond: toDiamond + amount,
      totalWealth: increment(computeTotalWealth(0, amount)),
      'stats.giftsReceived': increment(1),
      giftsLog: arrayUnion(entry),
      updatedAt: serverTimestamp(),
    })
  })
}

export interface StealResult {
  success: boolean
  goldStolen: number
  diamondStolen: number
  /** بۆ گونجاندنی کۆدی کۆن */
  amount: number
  reason?: string
  mode?: HeistMode
  cooldownUntilMs?: number
}

export interface StartHeistResult {
  heistId: string
  mode: HeistMode
  expiresAtMs: number
  notifId: string
}

function heistDocRef(heistId: string) {
  return doc(db, 'heists', heistId)
}

function parseHeistSession(id: string, data: Record<string, unknown>): HeistSession | null {
  const thiefUid = String(data.thiefUid ?? '')
  const victimUid = String(data.victimUid ?? '')
  const mode = data.mode === 'online' ? 'online' : data.mode === 'offline' ? 'offline' : null
  const statusRaw = String(data.status ?? '')
  const status: HeistStatus | null =
    statusRaw === 'active' || statusRaw === 'rejected' || statusRaw === 'cancelled'
      || statusRaw === 'completed' || statusRaw === 'expired'
      ? statusRaw
      : null
  if (!thiefUid || !victimUid || !mode || !status) return null
  return {
    id,
    thiefUid,
    thiefName: String(data.thiefName ?? 'یاریزان'),
    victimUid,
    victimName: String(data.victimName ?? 'یاریزان'),
    mode,
    status,
    startedAtMs: Number(data.startedAtMs) || 0,
    expiresAtMs: Number(data.expiresAtMs) || 0,
    notifId: String(data.notifId ?? ''),
    victimAccepted: data.victimAccepted === true,
  }
}

export function subscribeToHeistSession(
  heistId: string,
  onUpdate: (session: HeistSession | null) => void,
): () => void {
  if (!heistId) {
    onUpdate(null)
    return () => {}
  }
  return onSnapshot(
    heistDocRef(heistId),
    snap => {
      if (!snap.exists()) {
        onUpdate(null)
        return
      }
      onUpdate(parseHeistSession(snap.id, snap.data() as Record<string, unknown>))
    },
    () => onUpdate(null),
  )
}

/** دەستپێکردنی دزی — ئۆنلاین/ئۆفلاین + ئاگاداری */
export async function startHeist(
  thiefUid: string,
  victimUid: string,
  victimName: string,
  mode: HeistMode,
): Promise<StartHeistResult> {
  if (thiefUid === victimUid) throw new Error('نەتوانیت لە خۆت بدزیت')
  const thiefRef = doc(db, 'users', thiefUid)
  const victimRef = doc(db, 'users', victimUid)
  const now = Date.now()
  const today = utcDayKey(now)
  const heistId = `heist_${now}_${Math.random().toString(36).slice(2, 9)}`
  const expiresAtMs = now + STEAL_HEIST_TIMEOUT_MS
  const notifId = makeNotificationId('heist')

  await runTransaction(db, async transaction => {
    const thiefSnap = await transaction.get(thiefRef)
    const victimSnap = await transaction.get(victimRef)
    if (!thiefSnap.exists() || !victimSnap.exists()) throw new Error('هەژمار نەدۆزرایەوە')

    const thiefData = thiefSnap.data()
    const victimData = victimSnap.data()
    const thiefName = String(thiefData.name ?? 'یاریزان')

    const cooldownUntil = Number(thiefData.stealCooldownUntilMs) || 0
    if (cooldownUntil > now) {
      const leftMin = Math.ceil((cooldownUntil - now) / 60_000)
      throw new Error(`دوای دزی سەرکەوتوو ناتوانیت تا ${leftMin} خولەک بدزیتەوە (٦ کاتژمێر)`)
    }

    if (hasActiveStealShield(victimData, now)) {
      throw new Error('قەڵغانی پاراستن چالاکە — ناتوانیت بدزیت')
    }

    const existing = parseIncomingHeistField(victimData.incomingHeist)
    if (existing && existing.expiresAtMs > now) {
      throw new Error('ئێستا دزییەکی تر لەسەر ئەم خەزێنەیە بەردەوامە')
    }

    const dailyLog = parseStealDailyLog(thiefData.stealDailyLog)
    const entry = dailyLog[victimUid]
    const countToday = entry && entry.day === today ? entry.count : 0
    if (countToday >= STEAL_MAX_PER_VICTIM_PER_DAY) {
      throw new Error(`لەم ڕۆژەدا ٣ جار لەم کەسەت دزیوە — سبەی هەوڵ بدەرەوە`)
    }

    const victimGold = Number(victimData.gold) || 0
    const victimDiamond = Number(victimData.diamond) || 0
    if (victimGold <= 0 && victimDiamond <= 0) {
      throw new Error('هیچ زێڕ یان ئەڵماسی لای نییە')
    }

    const heistPayload: IncomingHeistSummary = {
      heistId,
      thiefUid,
      thiefName,
      mode,
      startedAtMs: now,
      expiresAtMs,
      notifId,
    }

    const heistAlert: InboxNotification = {
      id: notifId,
      kind: 'heist',
      icon: '🚨',
      title: mode === 'online' ? 'دزی لە خەزێنەکەت!' : 'ئاگاداری دزی',
      body: mode === 'online'
        ? `${thiefName} خەریکی دزیکردنە لە خەزێنەکەت! ئایا ڕازیت یان ڕەتیدەکەیتەوە؟`
        : `${thiefName} خەریکی دزیکردنە لە خەزێنەکەت!`,
      atMs: now,
      fromUid: thiefUid,
      fromName: thiefName,
      heistId,
      heistMode: mode,
      heistResolved: false,
    }
    const prevInbox = parseInboxNotifications(victimData.inboxNotifications)
    const nextInbox = [heistAlert, ...prevInbox.filter(n => n.id !== notifId)].slice(0, 80)

    transaction.set(heistDocRef(heistId), {
      thiefUid,
      thiefName,
      victimUid,
      victimName: victimName || String(victimData.name ?? 'یاریزان'),
      mode,
      status: 'active',
      startedAtMs: now,
      expiresAtMs,
      notifId,
      updatedAt: serverTimestamp(),
    })
    transaction.update(victimRef, {
      incomingHeist: heistPayload,
      inboxNotifications: nextInbox,
      updatedAt: serverTimestamp(),
    })
  })

  return { heistId, mode, expiresAtMs, notifId }
}

/** قوربانی ڕەتی دەکاتەوە → دزی هەڵدەوەشێتەوە + قەڵغانی ٢٤ کاتژمێر */
export async function rejectHeist(victimUid: string, heistId: string): Promise<void> {
  const victimRef = doc(db, 'users', victimUid)
  const heistRef = heistDocRef(heistId)
  const now = Date.now()

  await runTransaction(db, async transaction => {
    const victimSnap = await transaction.get(victimRef)
    const heistSnap = await transaction.get(heistRef)
    if (!victimSnap.exists()) throw new Error('هەژمار نەدۆزرایەوە')
    if (!heistSnap.exists()) throw new Error('دزییەکە نەدۆزرایەوە')

    const heist = parseHeistSession(heistSnap.id, heistSnap.data() as Record<string, unknown>)
    if (!heist || heist.victimUid !== victimUid) throw new Error('دزییەکە نادروستە')
    if (heist.status !== 'active') throw new Error('ئەم دزییە چیتر چالاک نییە')
    if (heist.victimAccepted) throw new Error('پێشتر ڕازی بوویت — ناتوانیت ڕەت بکەیتەوە')

    const victimData = victimSnap.data()
    const inbox = parseInboxNotifications(victimData.inboxNotifications).map(n =>
      n.id === heist.notifId || n.heistId === heistId
        ? { ...n, heistResolved: true, body: `${heist.thiefName} — دزییەکەت ڕەتکردەوە و قەڵغانی ٢٤ کاتژمێرت وەرگرت.` }
        : n,
    )

    transaction.update(heistRef, { status: 'rejected', updatedAt: serverTimestamp() })
    transaction.update(victimRef, {
      incomingHeist: null,
      stealShieldUntilMs: now + STEAL_SHIELD_MS,
      inboxNotifications: inbox.slice(0, 80),
      updatedAt: serverTimestamp(),
    })
  })
}

/** قوربانی ڕازی دەبێت — دزی بەردەوام دەبێت (بێ قەڵغان) */
export async function acceptHeist(victimUid: string, heistId: string): Promise<void> {
  const victimRef = doc(db, 'users', victimUid)
  const heistRef = heistDocRef(heistId)

  await runTransaction(db, async transaction => {
    const victimSnap = await transaction.get(victimRef)
    const heistSnap = await transaction.get(heistRef)
    if (!victimSnap.exists() || !heistSnap.exists()) throw new Error('دزییەکە نەدۆزرایەوە')
    const heist = parseHeistSession(heistSnap.id, heistSnap.data() as Record<string, unknown>)
    if (!heist || heist.victimUid !== victimUid || heist.status !== 'active') {
      throw new Error('ئەم دزییە چیتر چالاک نییە')
    }
    const victimData = victimSnap.data()
    const inbox = parseInboxNotifications(victimData.inboxNotifications).map(n =>
      n.id === heist.notifId || n.heistId === heistId
        ? { ...n, heistResolved: true, body: `${heist.thiefName} خەریکی دزیکردنە — تۆ ڕازی بوویت.` }
        : n,
    )
    // مۆداڵ نەگەڕێتەوە + ڕەتکردنەوە دوای ڕازیبون قەدەغە
    transaction.update(heistRef, { victimAccepted: true, updatedAt: serverTimestamp() })
    transaction.update(victimRef, {
      incomingHeist: null,
      inboxNotifications: inbox.slice(0, 80),
      updatedAt: serverTimestamp(),
    })
  })
}

/** هەڵوەشاندنەوە (ئۆفلاین هاتە سەر هێڵ / تایمەوت / پاشگەز) */
export async function cancelHeist(
  actorUid: string,
  heistId: string,
  reason: 'online' | 'timeout' | 'abort' = 'abort',
): Promise<void> {
  const heistRef = heistDocRef(heistId)
  const heistSnap = await getDoc(heistRef)
  if (!heistSnap.exists()) return
  const heist = parseHeistSession(heistSnap.id, heistSnap.data() as Record<string, unknown>)
  if (!heist || heist.status !== 'active') return
  if (actorUid !== heist.thiefUid && actorUid !== heist.victimUid) {
    throw new Error('مۆڵەتی هەڵوەشاندن نییە')
  }

  const victimRef = doc(db, 'users', heist.victimUid)
  const victimSnap = await getDoc(victimRef)
  const nextStatus = reason === 'timeout' ? 'expired' : 'cancelled'
  await updateDoc(heistRef, {
    status: nextStatus,
    cancelReason: reason,
    updatedAt: serverTimestamp(),
  })

  if (victimSnap.exists()) {
    const data = victimSnap.data()
    const incoming = parseIncomingHeistField(data.incomingHeist)
    const inbox = parseInboxNotifications(data.inboxNotifications).map(n =>
      n.heistId === heistId || n.id === heist.notifId
        ? {
            ...n,
            heistResolved: true,
            body: reason === 'online'
              ? `دزییەکەی ${heist.thiefName} هەڵوەشایەوە چونکە هاتیتە سەر هێڵ.`
              : `دزییەکەی ${heist.thiefName} هەڵوەشایەوە.`,
          }
        : n,
    )
    await updateDoc(victimRef, {
      ...(incoming?.heistId === heistId ? { incomingHeist: null } : {}),
      inboxNotifications: inbox.slice(0, 80),
      updatedAt: serverTimestamp(),
    })
  }
}

/** تەواوکردنی دزی دوای سەرکەوتنی ژیۆسکۆپ — ٪ بەپێی ئۆنلاین/ئۆفلاین */
export async function completeSteal(
  thiefUid: string,
  victimUid: string,
  opts?: { heistId?: string; mode?: HeistMode },
): Promise<StealResult> {
  if (thiefUid === victimUid) throw new Error('نەتوانیت لە خۆت بدزیت')
  const thiefRef = doc(db, 'users', thiefUid)
  const victimRef = doc(db, 'users', victimUid)
  const now = Date.now()
  const today = utcDayKey(now)
  const heistId = opts?.heistId
  const modeHint = opts?.mode

  const result = await runTransaction(db, async transaction => {
    const thiefSnap = await transaction.get(thiefRef)
    const victimSnap = await transaction.get(victimRef)
    if (!thiefSnap.exists() || !victimSnap.exists()) throw new Error('هەژمار نەدۆزرایەوە')

    let heist: HeistSession | null = null
    if (heistId) {
      const heistSnap = await transaction.get(heistDocRef(heistId))
      if (!heistSnap.exists()) throw new Error('دزییەکە نەدۆزرایەوە')
      heist = parseHeistSession(heistSnap.id, heistSnap.data() as Record<string, unknown>)
      if (!heist || heist.thiefUid !== thiefUid || heist.victimUid !== victimUid) {
        throw new Error('دزییەکە نادروستە')
      }
      if (heist.status !== 'active') {
        transaction.update(victimRef, {
          incomingHeist: null,
          updatedAt: serverTimestamp(),
        })
        return {
          success: false as const,
          goldStolen: 0,
          diamondStolen: 0,
          amount: 0,
          reason: heist.status === 'rejected'
            ? 'قوربانی دزییەکەی ڕەتکردەوە'
            : heist.status === 'cancelled'
              ? 'دزییەکە هەڵوەشایەوە'
              : 'دزییەکە چیتر چالاک نییە',
        }
      }
      if (heist.expiresAtMs > 0 && heist.expiresAtMs < now) {
        transaction.update(heistDocRef(heistId), { status: 'expired', updatedAt: serverTimestamp() })
        transaction.update(victimRef, {
          incomingHeist: null,
          updatedAt: serverTimestamp(),
        })
        return {
          success: false as const,
          goldStolen: 0,
          diamondStolen: 0,
          amount: 0,
          reason: 'کاتی دزی تەواو بوو',
        }
      }
    }

    const mode: HeistMode = heist?.mode ?? modeHint ?? 'offline'
    const victimData = victimSnap.data()
    const thiefData = thiefSnap.data()
    const thiefName = String(thiefData.name ?? 'یاریزان')

    const cooldownUntil = Number(thiefData.stealCooldownUntilMs) || 0
    if (cooldownUntil > now) {
      throw new Error('هێشتا لە Cooldownی ٦ کاتژمێریت — ناتوانیت بدزیت')
    }

    if (hasActiveStealShield(victimData, now)) {
      return {
        success: false as const,
        goldStolen: 0,
        diamondStolen: 0,
        amount: 0,
        reason: 'قەڵغانی پاراستن چالاکە — ناتوانیت بدزیت',
      }
    }

    const dailyLog = parseStealDailyLog(thiefData.stealDailyLog)
    const entry = dailyLog[victimUid]
    const countToday = entry && entry.day === today ? entry.count : 0
    if (countToday >= STEAL_MAX_PER_VICTIM_PER_DAY) {
      throw new Error(`لەم ڕۆژەدا ٣ جار لەم کەسەت دزیوە — سبەی هەوڵ بدەرەوە`)
    }

    const victimGold = Number(victimData.gold) || 0
    const victimDiamond = Number(victimData.diamond) || 0
    if (victimGold <= 0 && victimDiamond <= 0) {
      return {
        success: false as const,
        goldStolen: 0,
        diamondStolen: 0,
        amount: 0,
        reason: 'هیچ زێڕ یان ئەڵماسی لای نییە',
      }
    }

    const goldPct = mode === 'online' ? STEAL_ONLINE_GOLD_PCT : STEAL_OFFLINE_GOLD_PCT
    const diamondPct = mode === 'online' ? STEAL_ONLINE_DIAMOND_PCT : STEAL_OFFLINE_DIAMOND_PCT
    const goldStolen = victimGold > 0 ? Math.min(victimGold, Math.max(1, Math.floor(victimGold * goldPct))) : 0
    const diamondStolen = victimDiamond > 0
      ? Math.min(victimDiamond, Math.max(1, Math.floor(victimDiamond * diamondPct)))
      : 0
    if (goldStolen <= 0 && diamondStolen <= 0) {
      return { success: false as const, goldStolen: 0, diamondStolen: 0, amount: 0, reason: 'دزی سەرنەکەوت' }
    }

    const thiefGold = Number(thiefData.gold) || 0
    const thiefDiamond = Number(thiefData.diamond) || 0
    const parts: string[] = []
    if (goldStolen > 0) parts.push(`🪙 ${goldStolen.toLocaleString()} زێڕ`)
    if (diamondStolen > 0) parts.push(`💎 ${diamondStolen.toLocaleString()} ئەڵماس`)

    const stealBody = mode === 'online'
      ? `دزیکردنەکە سەرکەوتوو بوو! بڕی ${goldStolen.toLocaleString()} زێڕ و ${diamondStolen.toLocaleString()} ئەڵماست لێ دزرا. دەتەوێت تۆڵە بکەیتەوە و 2 ئەوەندەی لێ ببەیتەوە؟`
      : `لە کاتی ئۆفلاینبووندا بڕی ${goldStolen.toLocaleString()} زێڕ و ${diamondStolen.toLocaleString()} ئەڵماست لێ دزرا! دەتەوێت تۆڵە بکەیتەوە و 2 ئەوەندەی لێ ببەیتەوە؟`

    const stealNotif: InboxNotification = {
      id: makeNotificationId('steal'),
      kind: 'steal',
      icon: '🥷',
      title: 'دزیکردن',
      body: stealBody,
      atMs: now,
      fromUid: thiefUid,
      fromName: thiefName,
      goldAmount: goldStolen,
      diamondAmount: diamondStolen,
      amount: goldStolen,
      currency: 'gold',
      revengeClaimed: false,
    }

    const prevInbox = parseInboxNotifications(victimData.inboxNotifications)
      .map(n => (heist && (n.id === heist.notifId || n.heistId === heist.id)
        ? { ...n, heistResolved: true }
        : n))
    const nextInbox = [stealNotif, ...prevInbox].slice(0, 80)
    dailyLog[victimUid] = { day: today, count: countToday + 1 }
    const nextCooldown = now + STEAL_ATTACKER_COOLDOWN_MS

    if (heistId) {
      transaction.update(heistDocRef(heistId), {
        status: 'completed',
        goldStolen,
        diamondStolen,
        updatedAt: serverTimestamp(),
      })
    }

    transaction.update(victimRef, {
      gold: victimGold - goldStolen,
      diamond: victimDiamond - diamondStolen,
      incomingHeist: null,
      inboxNotifications: nextInbox,
      updatedAt: serverTimestamp(),
    })
    transaction.update(thiefRef, {
      gold: thiefGold + goldStolen,
      diamond: thiefDiamond + diamondStolen,
      totalWealth: increment(computeTotalWealth(goldStolen, diamondStolen)),
      stealDailyLog: dailyLog,
      stealCooldownUntilMs: nextCooldown,
      updatedAt: serverTimestamp(),
    })
    return {
      success: true as const,
      goldStolen,
      diamondStolen,
      amount: goldStolen,
      mode,
      cooldownUntilMs: nextCooldown,
    }
  })

  return result
}

/** @deprecated — بەکارهێنانی completeSteal */
export async function attemptStealMoney(thiefUid: string, victimUid: string): Promise<StealResult> {
  return completeSteal(thiefUid, victimUid, { mode: 'offline' })
}

/** تۆڵەی ٢x زێڕ + ئەڵماس — تا ٢٤ کاتژمێر دوای دزی */
export async function claimRevengeSteal(
  victimUid: string,
  thiefUid: string,
  notifId: string,
  goldBase: number,
  diamondBase: number,
): Promise<StealResult> {
  if (victimUid === thiefUid) throw new Error('نەتوانیت لە خۆت تۆڵە بکەیتەوە')
  const goldTake = Math.max(0, Math.round(goldBase) * 2)
  const diamondTake = Math.max(0, Math.round(diamondBase) * 2)
  if (goldTake <= 0 && diamondTake <= 0) throw new Error('بڕی تۆڵە نادروستە')

  const victimRef = doc(db, 'users', victimUid)
  const thiefRef = doc(db, 'users', thiefUid)

  return runTransaction(db, async transaction => {
    const victimSnap = await transaction.get(victimRef)
    const thiefSnap = await transaction.get(thiefRef)
    if (!victimSnap.exists() || !thiefSnap.exists()) throw new Error('هەژمار نەدۆزرایەوە')

    const victimData = victimSnap.data()
    const thiefData = thiefSnap.data()
    const inbox = parseInboxNotifications(victimData.inboxNotifications)
    const notif = inbox.find(n => n.id === notifId)
    if (!notif || notif.kind !== 'steal' || notif.fromUid !== thiefUid) {
      throw new Error('ئاگاداریی دزی نەدۆزرایەوە')
    }
    if (notif.revengeClaimed) throw new Error('پێشتر تۆڵەت سەندۆتەوە')

    // تۆڵە تەنها لە ماوەی ٢٤ کاتژمێری دوای دزی
    if (Date.now() - notif.atMs > STEAL_SHIELD_MS) {
      throw new Error('کاتی تۆڵەسەندنەوە تەواو بوو (٢٤ کاتژمێر)')
    }

    const thiefGold = Number(thiefData.gold) || 0
    const thiefDiamond = Number(thiefData.diamond) || 0
    const takeGold = Math.min(thiefGold, goldTake)
    const takeDiamond = Math.min(thiefDiamond, diamondTake)
    if (takeGold <= 0 && takeDiamond <= 0) {
      throw new Error('دزەکە هیچ زێڕ/ئەڵماسی نییە بۆ تۆڵە')
    }

    const victimGold = Number(victimData.gold) || 0
    const victimDiamond = Number(victimData.diamond) || 0
    const victimName = String(victimData.name ?? 'یاریزان')
    const nextInbox = inbox.map(n => (n.id === notifId ? { ...n, revengeClaimed: true } : n)).slice(0, 80)

    const revengeNotif: InboxNotification = {
      id: makeNotificationId('revenge'),
      kind: 'steal',
      icon: '⚡',
      title: 'تۆڵەسەندنەوە',
      body: `${victimName} تۆڵەی ٢xی لێت سەندەوە: 🪙 ${takeGold.toLocaleString()} زێڕ و 💎 ${takeDiamond.toLocaleString()} ئەڵماس.`,
      atMs: Date.now(),
      fromUid: victimUid,
      fromName: victimName,
      goldAmount: takeGold,
      diamondAmount: takeDiamond,
      revengeClaimed: true,
    }
    const thiefInbox = [revengeNotif, ...parseInboxNotifications(thiefData.inboxNotifications)].slice(0, 80)

    transaction.update(thiefRef, {
      gold: thiefGold - takeGold,
      diamond: thiefDiamond - takeDiamond,
      inboxNotifications: thiefInbox,
      updatedAt: serverTimestamp(),
    })
    transaction.update(victimRef, {
      gold: victimGold + takeGold,
      diamond: victimDiamond + takeDiamond,
      totalWealth: increment(computeTotalWealth(takeGold, takeDiamond)),
      inboxNotifications: nextInbox,
      updatedAt: serverTimestamp(),
    })
    return {
      success: true as const,
      goldStolen: takeGold,
      diamondStolen: takeDiamond,
      amount: takeGold,
    }
  })
}

/** @deprecated کۆن — ئێستا شەڕ لە duelService (ئارێنای TPS) دایە */
export interface FightResult {
  won: boolean
  amount: number
  loserUid: string
  smokeUntilMs: number
  loserBanUntilMs: number
  duelFxUntilMs: number
}

/** @deprecated بە sendFightChallenge / settleDuel لە duelService بەکاربهێنە */
export async function fightPlayer(
  _attackerUid: string,
  _defenderUid: string,
  _opts?: { attackerWon?: boolean },
): Promise<FightResult> {
  throw new Error('شەڕی کۆن ناچالاکە — داواکاری شەڕی ئارێنای ١v١ بنێرە')
}

export async function setChatMuted(myUid: string, otherUid: string, muted: boolean): Promise<void> {
  if (!myUid || !otherUid || myUid === otherUid) return
  const ref = doc(db, 'users', myUid)
  if (muted) {
    await updateDoc(ref, { mutedChatUids: arrayUnion(otherUid), updatedAt: serverTimestamp() })
  } else {
    await updateDoc(ref, { mutedChatUids: arrayRemove(otherUid), updatedAt: serverTimestamp() })
  }
}

// ── نامەی تایبەت (Private Messages / DM) ───────────────────────────────────

export type DmMessageKind = 'text' | 'image' | 'audio' | 'video' | 'system'
export type DmDeliveryStatus = 'sent' | 'delivered' | 'seen'

export interface DmMessage {
  id: string
  from: string
  text: string
  kind: DmMessageKind
  mediaUrl: string | null
  createdAtMs: number
  status: DmDeliveryStatus
  deliveredAt: number | null
  seenAt: number | null
  /** UI-only hide flags — نامە لە داتابەیس دەمێنێتەوە، تەنها بۆ یوزەرەکان دەشاردرێتەوە */
  hiddenFor: string[]
  /** ناسنامەی کاتی optimistic لە کڵایەنت — بۆ mergeی دروست */
  clientTempId?: string | null
}

export interface DmThreadSummary {
  id: string
  otherUid: string
  otherName: string
  lastMessage: string
  updatedAtMs: number
  unreadCount: number
  pinned: boolean
  muted: boolean
}

function dmThreadId(a: string, b: string): string {
  return [a, b].sort().join('_')
}

function parseDmKind(raw: unknown): DmMessageKind {
  return raw === 'image' || raw === 'audio' || raw === 'video' || raw === 'system' ? raw : 'text'
}

function parseDmStatus(raw: unknown): DmDeliveryStatus {
  return raw === 'delivered' || raw === 'seen' ? raw : 'sent'
}

function previewForDm(kind: DmMessageKind, text: string): string {
  if (kind === 'image') return '📷 وێنە'
  if (kind === 'audio') return '🎤 نامەی دەنگی'
  if (kind === 'video') return '🎬 ڤیدیۆ'
  if (kind === 'system') return text.slice(0, 200) || '⚠️ سیستەم'
  return text.slice(0, 200)
}

function parseBlockedUidSet(raw: unknown): Set<string> {
  const set = new Set<string>()
  if (!Array.isArray(raw)) return set
  for (const item of raw) {
    if (item && typeof item === 'object' && typeof (item as { uid?: unknown }).uid === 'string') {
      set.add((item as { uid: string }).uid)
    }
  }
  return set
}

/** بلۆک تەنها نامەی تایبەت دەگرێت — بۆ هەردوو لایەن */
export async function isDmBlockedBetween(aUid: string, bUid: string): Promise<boolean> {
  const [aSnap, bSnap] = await Promise.all([
    getDoc(doc(db, 'users', aUid)),
    getDoc(doc(db, 'users', bUid)),
  ])
  if (aSnap.exists() && parseBlockedUidSet(aSnap.data().blockedUsers).has(bUid)) return true
  if (bSnap.exists() && parseBlockedUidSet(bSnap.data().blockedUsers).has(aUid)) return true
  return false
}

/** بارکردنی وێنە/دەنگ بۆ Storage — ئەگەر سەرنەکەوێت، null دەگەڕێتەوە */
export async function uploadDmMedia(threadId: string, fileName: string, blob: Blob, contentType: string): Promise<string | null> {
  try {
    if (!blob || blob.size <= 0) return null
    const safeName = fileName.replace(/[^\w.\-]+/g, '_') || 'media.bin'
    const path = `dm/${threadId}/${Date.now()}_${safeName}`
    const r = storageRef(storage, path)
    await uploadBytes(r, blob, { contentType: contentType || blob.type || 'application/octet-stream' })
    return await getDownloadURL(r)
  } catch (err) {
    console.error('DM media upload failed:', err)
    return null
  }
}

const DM_UPLOAD_TIMEOUT_MS = 22_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(label)), ms)
    promise.then(
      v => { window.clearTimeout(t); resolve(v) },
      e => { window.clearTimeout(t); reject(e) },
    )
  })
}

/** بارکردن لەگەڵ progress (٠–١٠٠) — وێنەی بچووک: uploadBytes خێراترە لە resumable */
export async function uploadDmMediaWithProgress(
  threadId: string,
  fileName: string,
  blob: Blob,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<string | null> {
  try {
    if (!blob || blob.size <= 0) return null

    // فایلی بچووک (وەک وێنەی DM): یەک-جار uploadBytes — خێراتر و کەمتر «ستەک»
    if (blob.size <= 280_000) {
      onProgress?.(8)
      let pulse = 8
      const iv = window.setInterval(() => {
        pulse = Math.min(86, pulse + 10)
        onProgress?.(pulse)
      }, 160)
      try {
        const url = await withTimeout(
          uploadDmMedia(threadId, fileName, blob, contentType),
          DM_UPLOAD_TIMEOUT_MS,
          'upload-timeout',
        )
        onProgress?.(100)
        return url
      } catch (err) {
        console.error('DM media fast upload failed:', err)
        return null
      } finally {
        window.clearInterval(iv)
      }
    }

    const safeName = fileName.replace(/[^\w.\-]+/g, '_') || 'media.bin'
    const path = `dm/${threadId}/${Date.now()}_${safeName}`
    const r = storageRef(storage, path)
    const task = uploadBytesResumable(r, blob, {
      contentType: contentType || blob.type || 'application/octet-stream',
    })
    return await new Promise<string | null>((resolve) => {
      let settled = false
      const failTimer = window.setTimeout(() => {
        if (settled) return
        settled = true
        try { task.cancel() } catch { /* ignore */ }
        console.error('DM media upload timed out')
        resolve(null)
      }, DM_UPLOAD_TIMEOUT_MS)

      task.on(
        'state_changed',
        snap => {
          const total = snap.totalBytes || blob.size || 1
          const pct = Math.max(0, Math.min(100, Math.round((snap.bytesTransferred / total) * 100)))
          onProgress?.(pct)
        },
        err => {
          if (settled) return
          settled = true
          window.clearTimeout(failTimer)
          console.error('DM media upload failed:', err)
          resolve(null)
        },
        async () => {
          if (settled) return
          settled = true
          window.clearTimeout(failTimer)
          try {
            onProgress?.(100)
            resolve(await getDownloadURL(task.snapshot.ref))
          } catch (e) {
            console.error('DM media URL failed:', e)
            resolve(null)
          }
        },
      )
    })
  } catch (err) {
    console.error('DM media upload failed:', err)
    return null
  }
}

export async function sendPrivateMessage(
  fromUid: string,
  fromName: string,
  toUid: string,
  toName: string,
  text: string,
  opts?: {
    kind?: DmMessageKind
    mediaUrl?: string | null
    recipientOnline?: boolean
    clientTempId?: string | null
  },
): Promise<void> {
  if (fromUid === toUid) throw new Error('نەتوانیت نامە بۆ خۆت بنێریت')
  const kind: DmMessageKind = opts?.kind ?? 'text'
  const mediaUrl = opts?.mediaUrl ?? null
  const clientTempId = typeof opts?.clientTempId === 'string' && opts.clientTempId ? opts.clientTempId : null
  const trimmed = text.trim()
  if ((kind === 'text' || kind === 'system') && !trimmed) return
  if ((kind === 'image' || kind === 'audio' || kind === 'video') && !mediaUrl) throw new Error('میدیا بەردەست نییە')

  const threadId = dmThreadId(fromUid, toUid)
  const threadRef = doc(db, 'dmThreads', threadId)
  const msgRef = doc(collection(db, 'dmThreads', threadId, 'messages'))
  const now = Date.now()
  const preview = previewForDm(kind, trimmed)
  const recipientOnline = opts?.recipientOnline === true
  const status: DmDeliveryStatus = recipientOnline ? 'delivered' : 'sent'

  const [blocked, toSnap, threadSnap] = await Promise.all([
    isDmBlockedBetween(fromUid, toUid),
    getDoc(doc(db, 'users', toUid)),
    getDoc(threadRef),
  ])
  if (blocked) {
    throw new Error('🚫 نامە ناردن ڕێگەپێنەدراوە — یەکێکتان بلۆک کراوە')
  }

  // ئایا وەرگر چاتی نێرەری سڕ کردووە؟
  const mutedByRecipient =
    kind !== 'system' &&
    toSnap.exists() &&
    parseStringUidList(toSnap.data().mutedChatUids).includes(fromUid)

  const prevUnread = (threadSnap.exists() && threadSnap.data().unread && typeof threadSnap.data().unread === 'object')
    ? { ...(threadSnap.data().unread as Record<string, number>) }
    : {}
  const prevHidden = Array.isArray(threadSnap.data()?.threadHiddenFor)
    ? [...(threadSnap.data()!.threadHiddenFor as string[])]
    : []
  // گفتوگۆی شارکراوە بۆ وەرگر دەگەڕێتەوە کاتێک نامەی نوێ دێت (تەنها ئەگەر mute نەبێت)
  const threadHiddenFor = mutedByRecipient
    ? prevHidden
    : prevHidden.filter(uid => uid !== toUid)

  const nextUnread = { ...prevUnread }
  if (!mutedByRecipient && kind !== 'system') {
    nextUnread[toUid] = (Number(prevUnread[toUid]) || 0) + 1
  }

  await Promise.all([
    setDoc(threadRef, {
      participants: [fromUid, toUid],
      names: { [fromUid]: fromName, [toUid]: toName },
      lastMessage: mutedByRecipient ? (typeof threadSnap.data()?.lastMessage === 'string' ? threadSnap.data()!.lastMessage : preview) : preview,
      updatedAtMs: now,
      updatedAt: serverTimestamp(),
      unread: nextUnread,
      threadHiddenFor,
    }, { merge: true }),
    setDoc(msgRef, {
      from: fromUid,
      text: trimmed.slice(0, 500),
      kind,
      mediaUrl,
      hiddenFor: [],
      status,
      deliveredAt: recipientOnline ? now : null,
      seenAt: null,
      createdAtMs: now,
      createdAt: serverTimestamp(),
      ...(clientTempId ? { clientTempId } : {}),
    }),
  ])

  // نامەی سیستەم تەنها بۆ نێرەر — وەرگری Mute نابینێت
  if (mutedByRecipient) {
    const sysRef = doc(collection(db, 'dmThreads', threadId, 'messages'))
    const sysNow = Date.now() + 1
    await setDoc(sysRef, {
      from: 'system',
      text: MUTE_SYSTEM_MESSAGE,
      kind: 'system',
      mediaUrl: null,
      hiddenFor: [toUid],
      status: 'delivered',
      deliveredAt: sysNow,
      seenAt: null,
      createdAtMs: sysNow,
      createdAt: serverTimestamp(),
    })
    // lastMessage بۆ نێرەر نوێ دەبێتەوە؛ unreadی وەرگر ناگۆڕدرێت
    const senderPreviewUnread = { ...nextUnread }
    await setDoc(threadRef, {
      lastMessage: MUTE_SYSTEM_MESSAGE.slice(0, 200),
      updatedAtMs: sysNow,
      updatedAt: serverTimestamp(),
      unread: senderPreviewUnread,
    }, { merge: true })
  }
}

/** شارکردنەوەی نامە لە UI — هەرگیز لە داتابەیس ناسڕدرێتەوە */
export async function hideDmMessage(
  myUid: string,
  otherUid: string,
  messageId: string,
  forBoth: boolean,
): Promise<void> {
  await hideDmMessages(myUid, otherUid, [messageId], forBoth)
}

export async function hideDmMessages(
  myUid: string,
  otherUid: string,
  messageIds: string[],
  forBoth: boolean,
): Promise<void> {
  const threadId = dmThreadId(myUid, otherUid)
  const ids = [...new Set(messageIds.filter(Boolean))]
  await Promise.all(ids.map(async messageId => {
    const msgRef = doc(db, 'dmThreads', threadId, 'messages', messageId)
    const snap = await getDoc(msgRef)
    if (!snap.exists()) return
    const data = snap.data()
    const hiddenFor = Array.isArray(data.hiddenFor) ? [...(data.hiddenFor as string[])] : []
    if (!hiddenFor.includes(myUid)) hiddenFor.push(myUid)
    if (forBoth && !hiddenFor.includes(otherUid)) hiddenFor.push(otherUid)
    await updateDoc(msgRef, { hiddenFor })
  }))
}

/** کردنەوەی چات — unread دەسڕێتەوە و نامەکان دەکات بە بینرا */
export async function markDmThreadRead(myUid: string, otherUid: string): Promise<void> {
  const threadId = dmThreadId(myUid, otherUid)
  const threadRef = doc(db, 'dmThreads', threadId)
  const now = Date.now()
  try {
    const threadSnap = await getDoc(threadRef)
    if (threadSnap.exists()) {
      const prevUnread = (threadSnap.data().unread && typeof threadSnap.data().unread === 'object')
        ? { ...(threadSnap.data().unread as Record<string, number>) }
        : {}
      prevUnread[myUid] = 0
      await setDoc(threadRef, { unread: prevUnread }, { merge: true })
    }
  } catch (err) {
    console.error('Clear DM unread failed:', err)
  }

  try {
    const msgsSnap = await getDocs(collection(db, 'dmThreads', threadId, 'messages'))
    const updates: Promise<void>[] = []
    msgsSnap.forEach(d => {
      const data = d.data()
      if (String(data.from ?? '') === myUid) return
      const status = parseDmStatus(data.status)
      if (status === 'seen') return
      updates.push(updateDoc(d.ref, { status: 'seen', seenAt: now, deliveredAt: data.deliveredAt ?? now }))
    })
    await Promise.all(updates)
  } catch (err) {
    console.error('Mark DM seen failed:', err)
  }
}

/** کاتێک وەرگر ئۆنلاینە و نامەکەی پێگەیشت — دۆخی گەیاندن */
export async function markIncomingDmDelivered(myUid: string, otherUid: string, messageIds: string[]): Promise<void> {
  if (!messageIds.length) return
  const threadId = dmThreadId(myUid, otherUid)
  const now = Date.now()
  await Promise.all(messageIds.map(async id => {
    try {
      const msgRef = doc(db, 'dmThreads', threadId, 'messages', id)
      const snap = await getDoc(msgRef)
      if (!snap.exists()) return
      const data = snap.data()
      if (String(data.from ?? '') === myUid) return
      const status = parseDmStatus(data.status)
      if (status !== 'sent') return
      await updateDoc(msgRef, { status: 'delivered', deliveredAt: now })
    } catch {}
  }))
}

export async function setDmThreadPinned(myUid: string, otherUid: string, pinned: boolean): Promise<void> {
  const threadId = dmThreadId(myUid, otherUid)
  const threadRef = doc(db, 'dmThreads', threadId)
  const snap = await getDoc(threadRef)
  const prev = Array.isArray(snap.data()?.pinnedFor) ? [...(snap.data()!.pinnedFor as string[])] : []
  const pinnedFor = pinned
    ? (prev.includes(myUid) ? prev : [...prev, myUid])
    : prev.filter(uid => uid !== myUid)
  await setDoc(threadRef, { pinnedFor }, { merge: true })
}

/** سڕینەوەی گفتوگۆ لە لیست — تەنها بۆ خۆت؛ نامەکان دەمێننەوە */
export async function hideDmThreadForUser(myUid: string, otherUid: string): Promise<void> {
  const threadId = dmThreadId(myUid, otherUid)
  const threadRef = doc(db, 'dmThreads', threadId)
  const snap = await getDoc(threadRef)
  const prev = Array.isArray(snap.data()?.threadHiddenFor) ? [...(snap.data()!.threadHiddenFor as string[])] : []
  if (!prev.includes(myUid)) prev.push(myUid)
  const prevUnread = (snap.exists() && snap.data().unread && typeof snap.data().unread === 'object')
    ? { ...(snap.data().unread as Record<string, number>) }
    : {}
  prevUnread[myUid] = 0
  await setDoc(threadRef, { threadHiddenFor: prev, unread: prevUnread }, { merge: true })
}

export function subscribeToMyDmThreads(myUid: string, onUpdate: (threads: DmThreadSummary[]) => void): () => void {
  return onSnapshot(collection(db, 'dmThreads'), snap => {
    const list: DmThreadSummary[] = []
    snap.forEach(d => {
      const data = d.data()
      const participants = Array.isArray(data.participants) ? data.participants as string[] : []
      if (!participants.includes(myUid)) return
      const hidden = Array.isArray(data.threadHiddenFor) ? data.threadHiddenFor as string[] : []
      if (hidden.includes(myUid)) return
      const otherUid = participants.find(p => p !== myUid) ?? ''
      const names = (data.names ?? {}) as Record<string, string>
      const unreadMap = (data.unread && typeof data.unread === 'object') ? data.unread as Record<string, number> : {}
      const pinnedFor = Array.isArray(data.pinnedFor) ? data.pinnedFor as string[] : []
      list.push({
        id: d.id,
        otherUid,
        otherName: names[otherUid] ?? 'یاریزان',
        lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : '',
        updatedAtMs: typeof data.updatedAtMs === 'number' ? data.updatedAtMs : 0,
        unreadCount: Math.max(0, Number(unreadMap[myUid]) || 0),
        pinned: pinnedFor.includes(myUid),
        muted: false,
      })
    })
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAtMs - a.updatedAtMs
    })
    onUpdate(list)
  }, err => console.error('DM threads listener failed:', err))
}

export function subscribeToDmThread(myUid: string, otherUid: string, onUpdate: (messages: DmMessage[]) => void): () => void {
  const threadId = dmThreadId(myUid, otherUid)
  return onSnapshot(collection(db, 'dmThreads', threadId, 'messages'), snap => {
    const list: DmMessage[] = []
    snap.forEach(d => {
      const data = d.data()
      const hiddenFor = Array.isArray(data.hiddenFor) ? data.hiddenFor as string[] : []
      if (hiddenFor.includes(myUid)) return
      list.push({
        id: d.id,
        from: String(data.from ?? ''),
        text: String(data.text ?? ''),
        kind: parseDmKind(data.kind),
        mediaUrl: typeof data.mediaUrl === 'string' && data.mediaUrl ? data.mediaUrl : null,
        createdAtMs: Number(data.createdAtMs) || 0,
        status: parseDmStatus(data.status),
        deliveredAt: typeof data.deliveredAt === 'number' ? data.deliveredAt : null,
        seenAt: typeof data.seenAt === 'number' ? data.seenAt : null,
        hiddenFor,
        clientTempId: typeof data.clientTempId === 'string' && data.clientTempId ? data.clientTempId : null,
      })
    })
    list.sort((a, b) => a.createdAtMs - b.createdAtMs)
    onUpdate(list.slice(-100))
  }, err => console.error('DM thread listener failed:', err))
}

export function getChestRewards(chestId: number): Partial<Pick<UserProfile, 'gold' | 'diamond'>> {
  const map: Record<number, Partial<Pick<UserProfile, 'gold' | 'diamond'>>> = {
    1: { diamond: 600, gold: 1000 },
    2: { diamond: 300 },
    3: { gold: 500, diamond: 100 },
    4: { gold: 100, diamond: 50 },
    5: { diamond: 10 },
  }
  return map[chestId] ?? {}
}

// ── VIP / ڕێڕەوی کوردستان — Firestore segmentation ─────────────────────────────

/** پاشەکەوتی دۆخی هەر سێ ڕێڕەوەکە لەسەر بەڵگەی بەکارهێنەر */
export async function syncVipPasses(uid: string, vipPasses: VipPassesState) {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, {
    vipPasses,
    updatedAt: serverTimestamp(),
  })
}

export async function loadVipPassesFromFirestore(uid: string): Promise<VipPassesState | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  if (data.vipPasses == null) return null
  return normalizeVipPasses(data.vipPasses)
}

export interface SocialPassSubmissionInput {
  uid: string
  playerId?: string
  playerName?: string
  kind: 'tiktok' | 'facebook'
  link: string
  postId: string
  completedDays: number
  duplicateAttempt?: boolean
}

/** کۆلێکشنی جیاواز بۆ پێداچوونەوەی ئەدمین */
export async function recordSocialPassSubmission(input: SocialPassSubmissionInput): Promise<string> {
  const colName = input.kind === 'tiktok' ? 'tiktokPassSubmissions' : 'facebookPassSubmissions'
  const ref = doc(collection(db, colName))
  const now = Date.now()
  await setDoc(ref, {
    uid: input.uid,
    playerId: input.playerId ?? '',
    playerName: input.playerName ?? '',
    kind: input.kind,
    link: input.link,
    postId: input.postId,
    completedDays: input.completedDays,
    duplicateAttempt: Boolean(input.duplicateAttempt),
    createdAtMs: now,
    createdAt: serverTimestamp(),
    reviewStatus: 'pending',
  })
  // ئیندێکسی خێرا لەسەر بەکارهێنەر بۆ ئەدمین
  await setDoc(doc(db, 'passes', input.uid, input.kind, ref.id), {
    submissionId: ref.id,
    link: input.link,
    postId: input.postId,
    completedDays: input.completedDays,
    createdAtMs: now,
    createdAt: serverTimestamp(),
  }, { merge: true })
  return ref.id
}

export async function syncPassOwnershipFlags(
  uid: string,
  flags: { isPremium: boolean; activePasses?: PassKind[] },
) {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, {
    isPremium: flags.isPremium,
    activePasses: flags.activePasses ?? [],
    updatedAt: serverTimestamp(),
  })
}
