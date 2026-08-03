/**
 * سیستەمی ڕێڕەوی کوردستان — یەک جۆر (پێشتر: میرانی گەورە)
 * ناوەکە هەر ٢ مانگ جارێک بە ناوی چیاکانی کوردستان دەگۆڕدرێت.
 * کڕین تەنها بە ئەڵماس. پاشەکەوت: localStorage + Firestore.
 */

import { dayKey, weekKey, periodKeyFor, type MissionPeriod, type SeasonPassState, RP_MISSIONS } from '../seasonPass'

export type PassKind = 'tiktok' | 'facebook' | 'master'
export type PassStatus = 'inactive' | 'active' | 'completed' | 'failed' | 'rewardClaimed'

/** تەنها یەک جۆر لە UI پیشان دەدرێت */
export const ACTIVE_PASS_KINDS: PassKind[] = ['master']

/** چیاکانی کوردستان — ناوی وەرز (هەر ٢ مانگ) */
export const KURDISTAN_MOUNTAINS = [
  'هەڵگورد',
  'قەندیل',
  'پیرەمەگرون',
  'سەفین',
  'کۆڕەک',
  'هەورامان',
  'کارۆخ',
  'گارا',
  'مەتین',
  'شنگال',
  'بامۆ',
  'ئەزمەڕ',
] as const

export type KurdistanSeasonInfo = {
  brand: string
  mountain: string
  nextMountain: string
  title: string
  shortTitle: string
  periodStartMs: number
  nextStartsAtMs: number
}

/** ئیندێکسی ماوەی ٢ مانگە (٠=یان–شوبات، ١=ئازار–نیسان، …) */
export function kurdistanBiMonthIndex(d = new Date()): number {
  return d.getFullYear() * 6 + Math.floor(d.getMonth() / 2)
}

export function getKurdistanSeasonInfo(now = new Date()): KurdistanSeasonInfo {
  const bi = kurdistanBiMonthIndex(now)
  const n = KURDISTAN_MOUNTAINS.length
  const currentIdx = ((bi % n) + n) % n
  const nextIdx = (currentIdx + 1) % n
  const periodStartMonth = Math.floor(now.getMonth() / 2) * 2
  const periodStart = new Date(now.getFullYear(), periodStartMonth, 1)
  const nextStart = new Date(now.getFullYear(), periodStartMonth + 2, 1)
  const mountain = KURDISTAN_MOUNTAINS[currentIdx]
  const nextMountain = KURDISTAN_MOUNTAINS[nextIdx]
  return {
    brand: 'ڕێڕەوی کوردستان',
    mountain,
    nextMountain,
    title: `ڕێڕەوی کوردستان · ${mountain}`,
    shortTitle: mountain,
    periodStartMs: periodStart.getTime(),
    nextStartsAtMs: nextStart.getTime(),
  }
}

export function formatKurdistanNextDate(ms: number): string {
  const d = new Date(ms)
  const months = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠', '١١', '١٢']
  return `${String(d.getDate()).padStart(2, '0')}/${months[d.getMonth()]}/${d.getFullYear()}`
}

export const PASS_DURATION_DAYS = 60
export const SOCIAL_FINAL_DIAMOND = 300
export const MASTER_FINAL_DIAMOND = 2_000
export const MASTER_FAIL_REFUND_DIAMONDS = 499
export const MASTER_PERFECT_DAYS_REQUIRED = 30
export const DUPLICATE_ATTEMPTS_BEFORE_RESET = 3
export const SOCIAL_COOLDOWN_MS = 24 * 60 * 60 * 1000

export const PASS_DEFS: Record<PassKind, {
  id: PassKind
  title: string
  shortTitle: string
  diamondCost: number
  finalDiamond: number
  durationDays: number
  accent: string
  icon: string
  desc: string
  /** کارتەکانی ڕوونکردنەوە پێش کڕین */
  benefits: string[]
  rules: string[]
  durationLabel: string
  priceLabel: string
  rewardLabel: string
}> = {
  tiktok: {
    id: 'tiktok',
    title: 'ڕێڕەوی تیک تۆک',
    shortTitle: 'تیک تۆک',
    diamondCost: 199,
    finalDiamond: SOCIAL_FINAL_DIAMOND,
    durationDays: PASS_DURATION_DAYS,
    accent: '#67e8f9',
    icon: 'music_note',
    desc: '٦٠ ڕۆژ پۆستی تیک‌تۆک · خەڵاتی کۆتایی ٣٠٠ ئەڵماس',
    benefits: [
      'هەر ڕۆژێک پۆستێک لەسەر یارییەکە لە تیک‌تۆک',
      'دوای ٦٠ ڕۆژی تەواو: ٣٠٠ ئەڵماس وەردەگریت',
      'دەتوانیت لەگەڵ ڕێڕەوەکانی تر پێکەوە چالاک بێت',
    ],
    rules: [
      'لینکی هەر پۆستێک دەبێت نوێ بێت (دووبارە قەدەغەیە)',
      'دوای ٣ هەوڵی لینکی دووبارە، پێشکەوتن دەگەڕێتەوە بۆ ٠',
      'نێوان دوو ناردن لانیکەم ٢٤ کاتژمێر',
    ],
    durationLabel: '٦٠ ڕۆژ',
    priceLabel: '١٩٩ ئەڵماس',
    rewardLabel: '٣٠٠ ئەڵماس',
  },
  facebook: {
    id: 'facebook',
    title: 'ڕێڕەوی فەیسبووک',
    shortTitle: 'فەیسبووک',
    diamondCost: 499,
    finalDiamond: SOCIAL_FINAL_DIAMOND,
    durationDays: PASS_DURATION_DAYS,
    accent: '#93c5fd',
    icon: 'thumb_up',
    desc: '٦٠ ڕۆژ پۆستی فەیسبووک · خەڵاتی کۆتایی ٣٠٠ ئەڵماس',
    benefits: [
      'هەر ڕۆژێک پۆستێک لەسەر یارییەکە لە فەیسبووک',
      'دوای ٦٠ ڕۆژی تەواو: ٣٠٠ ئەڵماس وەردەگریت',
      'گونجاو بۆ ئەوانەی زیاتر لە فەیسبووک چالاکن',
    ],
    rules: [
      'لینکی پۆست دەبێت جیاواز بێت لە پێشوو',
      'دوای ٣ هەوڵی دووبارە، ڕۆژەکان دەگەڕێنەوە بۆ ٠',
      'نێوان دوو ناردن لانیکەم ٢٤ کاتژمێر',
    ],
    durationLabel: '٦٠ ڕۆژ',
    priceLabel: '٤٩٩ ئەڵماس',
    rewardLabel: '٣٠٠ ئەڵماس',
  },
  master: {
    id: 'master',
    title: 'ڕێڕەوی کوردستان',
    shortTitle: 'کوردستان',
    diamondCost: 999,
    finalDiamond: MASTER_FINAL_DIAMOND,
    durationDays: PASS_DURATION_DAYS,
    accent: '#fde047',
    icon: 'terrain',
    desc: '٦٠ ڕۆژ · ٣٠ ڕۆژی تەواو · خەڵاتی ٢,٠٠٠ ئەڵماس',
    benefits: [
      'خەڵاتی ڕۆژانە (زێڕ / ئەڵماس) لە ماوەی ٦٠ ڕۆژ',
      '٣ ئەرکی ڕۆژانە + ٣ ئەرکی هەفتەیی',
      `سەرکەوتن: ${MASTER_FINAL_DIAMOND.toLocaleString()} ئەڵماس — سەرنەکەوتن: گەڕاندنەوەی ${MASTER_FAIL_REFUND_DIAMONDS} ئەڵماس`,
    ],
    rules: [
      `پێویستە لانیکەم ${MASTER_PERFECT_DAYS_REQUIRED} ڕۆژی تەواو تۆمار بکەیت`,
      'ڕۆژی تەواو = هەر ٣ ئەرکی ڕۆژانە جێبەجێ کرابن',
      'کڕین تەنها بە ئەڵماس — ناتوانرێت هەڵوەشێنرێتەوە',
      'ناوی وەرز هەر ٢ مانگ جارێک بە ناوی چیاکانی کوردستان دەگۆڕدرێت',
    ],
    durationLabel: '٦٠ ڕۆژ',
    priceLabel: '٩٩٩ ئەڵماس',
    rewardLabel: '٢,٠٠٠ ئەڵماس',
  },
}

/** ٣ ئەرکی ڕۆژانە + ٣ هەفتەیی — لە ئەرکەکانی سەردەم دووبارە دەکرێنەوە */
export const MASTER_DAILY_MISSION_IDS = ['d_login', 'd_drop', 'd_travel'] as const
export const MASTER_WEEKLY_MISSION_IDS = ['w_drops', 'w_travel', 'w_buy'] as const

export interface SocialPassState {
  owned: boolean
  status: PassStatus
  purchasedAtMs: number | null
  endsAtMs: number | null
  completedDays: number
  lastSubmitAtMs: number | null
  usedLinks: string[]
  usedPostIds: string[]
  duplicateAttempts: number
  finalRewardClaimed: boolean
}

export interface MasterPassState {
  owned: boolean
  status: PassStatus
  purchasedAtMs: number | null
  endsAtMs: number | null
  perfectDayKeys: string[]
  lastDailyClaimDay: number
  lastDailyClaimAtMs: number | null
  finalSettled: boolean
  finalRewardClaimed: boolean
  refundGranted: boolean
}

export interface VipPassesState {
  version: 1
  tiktok: SocialPassState
  facebook: SocialPassState
  master: MasterPassState
}

export type PassAlertTone = 'warn' | 'error' | 'ok'

export interface PassAlert {
  tone: PassAlertTone
  message: string
}

export type SocialSubmitResult =
  | { ok: true; state: SocialPassState; message: string }
  | { ok: false; state: SocialPassState; alert: PassAlert }

export type MasterClaimResult =
  | { ok: true; state: MasterPassState; reward: { kind: 'gold' | 'diamond'; amount: number }; message: string }
  | { ok: false; state: MasterPassState; alert: PassAlert }

export type MasterSettleResult =
  | { ok: true; state: MasterPassState; outcome: 'success'; diamond: number; message: string }
  | { ok: true; state: MasterPassState; outcome: 'failed'; refundDiamonds: number; message: string }
  | { ok: false; state: MasterPassState; alert: PassAlert }

function emptySocial(): SocialPassState {
  return {
    owned: false,
    status: 'inactive',
    purchasedAtMs: null,
    endsAtMs: null,
    completedDays: 0,
    lastSubmitAtMs: null,
    usedLinks: [],
    usedPostIds: [],
    duplicateAttempts: 0,
    finalRewardClaimed: false,
  }
}

function emptyMaster(): MasterPassState {
  return {
    owned: false,
    status: 'inactive',
    purchasedAtMs: null,
    endsAtMs: null,
    perfectDayKeys: [],
    lastDailyClaimDay: 0,
    lastDailyClaimAtMs: null,
    finalSettled: false,
    finalRewardClaimed: false,
    refundGranted: false,
  }
}

export function emptyVipPassesState(): VipPassesState {
  return {
    version: 1,
    tiktok: emptySocial(),
    facebook: emptySocial(),
    master: emptyMaster(),
  }
}

function storageKey(uid: string) {
  return `kd_vip_passes_${uid}`
}

export function loadVipPasses(uid: string | null): VipPassesState {
  if (!uid) return emptyVipPassesState()
  try {
    const raw = localStorage.getItem(storageKey(uid))
    if (!raw) return emptyVipPassesState()
    return normalizeVipPasses(JSON.parse(raw))
  } catch {
    return emptyVipPassesState()
  }
}

export function saveVipPasses(uid: string | null, state: VipPassesState) {
  if (!uid) return
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(state))
  } catch {}
}

function asSocial(raw: unknown): SocialPassState {
  const d = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    owned: Boolean(d.owned),
    status: (['inactive', 'active', 'completed', 'failed', 'rewardClaimed'].includes(String(d.status))
      ? d.status
      : d.owned ? 'active' : 'inactive') as PassStatus,
    purchasedAtMs: typeof d.purchasedAtMs === 'number' ? d.purchasedAtMs : null,
    endsAtMs: typeof d.endsAtMs === 'number' ? d.endsAtMs : null,
    completedDays: Math.max(0, Number(d.completedDays) || 0),
    lastSubmitAtMs: typeof d.lastSubmitAtMs === 'number' ? d.lastSubmitAtMs : null,
    usedLinks: Array.isArray(d.usedLinks) ? d.usedLinks.map(String) : [],
    usedPostIds: Array.isArray(d.usedPostIds) ? d.usedPostIds.map(String) : [],
    duplicateAttempts: Math.max(0, Number(d.duplicateAttempts) || 0),
    finalRewardClaimed: Boolean(d.finalRewardClaimed),
  }
}

function asMaster(raw: unknown): MasterPassState {
  const d = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    owned: Boolean(d.owned),
    status: (['inactive', 'active', 'completed', 'failed', 'rewardClaimed'].includes(String(d.status))
      ? d.status
      : d.owned ? 'active' : 'inactive') as PassStatus,
    purchasedAtMs: typeof d.purchasedAtMs === 'number' ? d.purchasedAtMs : null,
    endsAtMs: typeof d.endsAtMs === 'number' ? d.endsAtMs : null,
    perfectDayKeys: Array.isArray(d.perfectDayKeys) ? d.perfectDayKeys.map(String) : [],
    lastDailyClaimDay: Math.max(0, Number(d.lastDailyClaimDay) || 0),
    lastDailyClaimAtMs: typeof d.lastDailyClaimAtMs === 'number' ? d.lastDailyClaimAtMs : null,
    finalSettled: Boolean(d.finalSettled),
    finalRewardClaimed: Boolean(d.finalRewardClaimed),
    refundGranted: Boolean(d.refundGranted),
  }
}

export function normalizeVipPasses(raw: unknown): VipPassesState {
  const d = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    version: 1,
    tiktok: asSocial(d.tiktok),
    facebook: asSocial(d.facebook),
    master: asMaster(d.master),
  }
}

export function anyPassOwned(state: VipPassesState): boolean {
  return state.tiktok.owned || state.facebook.owned || state.master.owned
}

export function passDayNumber(purchasedAtMs: number | null, now = Date.now()): number {
  if (!purchasedAtMs) return 0
  const elapsed = Math.max(0, now - purchasedAtMs)
  return Math.min(PASS_DURATION_DAYS, Math.floor(elapsed / (24 * 60 * 60 * 1000)) + 1)
}

export function msUntilSocialSubmit(pass: SocialPassState, now = Date.now()): number {
  if (!pass.lastSubmitAtMs) return 0
  return Math.max(0, pass.lastSubmitAtMs + SOCIAL_COOLDOWN_MS - now)
}

export function formatCountdownKu(ms: number): string {
  if (ms <= 0) return '٠٠:٠٠:٠٠'
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** نرمالکردنی لینک + دەرکێشانی ناسنامەی پۆست */
export function normalizeSocialUrl(raw: string): { normalized: string; postId: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  let urlStr = trimmed
  if (!/^https?:\/\//i.test(urlStr)) urlStr = `https://${urlStr}`
  let u: URL
  try {
    u = new URL(urlStr)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./i, '').toLowerCase()
  const path = u.pathname.replace(/\/+$/, '')
  const search = u.searchParams

  let postId = ''

  // TikTok: /video/123, /t/CODE, vm.tiktok.com/CODE
  if (host.includes('tiktok.com')) {
    const video = path.match(/\/video\/(\d+)/)
    const short = path.match(/\/(?:t|v)\/([A-Za-z0-9_-]+)/)
    if (video) postId = video[1]
    else if (short) postId = short[1]
    else if (host.startsWith('vm.') || host.startsWith('vt.')) {
      const code = path.replace(/^\//, '').split('/')[0]
      if (code) postId = code
    }
  }

  // Facebook: /posts/ID, /permalink.php?story_fbid=, /share/p/..., /reel/...
  if (host.includes('facebook.com') || host.includes('fb.watch') || host.includes('fb.com')) {
    const posts = path.match(/\/posts\/([A-Za-z0-9._-]+)/)
    const reel = path.match(/\/reel(?:s)?\/([A-Za-z0-9._-]+)/)
    const share = path.match(/\/share\/[pv]\/([A-Za-z0-9._-]+)/)
    const story = search.get('story_fbid') || search.get('fbid')
    if (posts) postId = posts[1]
    else if (reel) postId = reel[1]
    else if (share) postId = share[1]
    else if (story) postId = story
    else if (host.includes('fb.watch')) {
      const code = path.replace(/^\//, '').split('/')[0]
      if (code) postId = code
    }
  }

  if (!postId) {
    // فۆڵباک: کۆدی دوایین بەشی ڕێگا
    const parts = path.split('/').filter(Boolean)
    postId = parts[parts.length - 1] || host + path
  }

  const normalized = `${host}${path}`.toLowerCase()
  const cleanPostId = postId.toLowerCase().replace(/[^a-z0-9._-]/g, '')
  if (!cleanPostId || cleanPostId.length < 3) return null
  return { normalized, postId: cleanPostId }
}

export function purchasePass(
  state: VipPassesState,
  kind: PassKind,
  now = Date.now(),
): { ok: true; state: VipPassesState } | { ok: false; alert: PassAlert } {
  const def = PASS_DEFS[kind]
  if (kind === 'tiktok' || kind === 'facebook') {
    const cur = state[kind]
    if (cur.owned && (cur.status === 'active' || cur.status === 'completed')) {
      return { ok: false, alert: { tone: 'warn', message: `⚠️ تۆ پێشتر ${def.title}ت هەیە!` } }
    }
    const nextSocial: SocialPassState = {
      ...emptySocial(),
      owned: true,
      status: 'active',
      purchasedAtMs: now,
      endsAtMs: now + PASS_DURATION_DAYS * 24 * 60 * 60 * 1000,
    }
    return { ok: true, state: { ...state, [kind]: nextSocial } }
  }

  const cur = state.master
  if (cur.owned && (cur.status === 'active' || cur.status === 'completed')) {
    return { ok: false, alert: { tone: 'warn', message: `⚠️ تۆ پێشتر ${def.title}ت هەیە!` } }
  }
  const nextMaster: MasterPassState = {
    ...emptyMaster(),
    owned: true,
    status: 'active',
    purchasedAtMs: now,
    endsAtMs: now + PASS_DURATION_DAYS * 24 * 60 * 60 * 1000,
  }
  return { ok: true, state: { ...state, master: nextMaster } }
}

export function submitSocialPassLink(
  pass: SocialPassState,
  kind: 'tiktok' | 'facebook',
  rawLink: string,
  now = Date.now(),
): SocialSubmitResult {
  if (!pass.owned || pass.status === 'inactive') {
    return { ok: false, state: pass, alert: { tone: 'error', message: '❌ ئەم ڕێڕەوە چالاک نییە' } }
  }
  if (pass.status === 'rewardClaimed' || pass.finalRewardClaimed) {
    return { ok: false, state: pass, alert: { tone: 'warn', message: '⚠️ خەڵاتی کۆتایی پێشتر وەرگیراوە' } }
  }
  if (pass.endsAtMs && now > pass.endsAtMs && pass.completedDays < PASS_DURATION_DAYS) {
    return {
      ok: false,
      state: { ...pass, status: 'failed' },
      alert: { tone: 'error', message: '❌ کاتی ڕێڕەوەکە تەواو بوو — ٦٠ ڕۆژ تەواو نەکرا' },
    }
  }

  const parsed = normalizeSocialUrl(rawLink)
  if (!parsed) {
    return { ok: false, state: pass, alert: { tone: 'error', message: '❌ لینکەکە دروست نییە — لینکی پۆست دابنێ' } }
  }

  const hostOk =
    kind === 'tiktok'
      ? parsed.normalized.includes('tiktok.com') || parsed.normalized.startsWith('vm.tiktok') || parsed.normalized.startsWith('vt.tiktok')
      : parsed.normalized.includes('facebook.com') || parsed.normalized.includes('fb.watch') || parsed.normalized.includes('fb.com')

  if (!hostOk) {
    const expect = kind === 'tiktok' ? 'تیک‌تۆک' : 'فەیسبووک'
    return { ok: false, state: pass, alert: { tone: 'error', message: `❌ لینکی ${expect} پێویستە` } }
  }

  const isDup =
    pass.usedLinks.includes(parsed.normalized) ||
    pass.usedPostIds.includes(parsed.postId)

  if (isDup) {
    const attempts = pass.duplicateAttempts + 1
    let next: SocialPassState = { ...pass, duplicateAttempts: attempts }
    if (attempts >= DUPLICATE_ATTEMPTS_BEFORE_RESET) {
      next = {
        ...next,
        completedDays: 0,
        duplicateAttempts: 0,
      }
      return {
        ok: false,
        state: next,
        alert: {
          tone: 'error',
          message: '🔴 لینکی دووبارە! دوای ٣ هەوڵ، ڕۆژە تەواوکراوەکان گەڕانەوە بۆ ٠',
        },
      }
    }
    return {
      ok: false,
      state: next,
      alert: {
        tone: 'warn',
        message: `🟡 ئەم لینکە پێشتر نێردراوە (${attempts}/${DUPLICATE_ATTEMPTS_BEFORE_RESET}) — دووبارە مەیکەوە`,
      },
    }
  }

  const cool = msUntilSocialSubmit(pass, now)
  if (cool > 0) {
    return {
      ok: false,
      state: pass,
      alert: {
        tone: 'warn',
        message: `🟡 چاوەڕێ بکە ${formatCountdownKu(cool)} — ٢٤ کاتژمێر نێوان ناردنەکان`,
      },
    }
  }

  const completedDays = Math.min(PASS_DURATION_DAYS, pass.completedDays + 1)
  const next: SocialPassState = {
    ...pass,
    completedDays,
    lastSubmitAtMs: now,
    usedLinks: [...pass.usedLinks, parsed.normalized],
    usedPostIds: [...pass.usedPostIds, parsed.postId],
    duplicateAttempts: 0,
    status: completedDays >= PASS_DURATION_DAYS ? 'completed' : 'active',
  }

  return {
    ok: true,
    state: next,
    message: completedDays >= PASS_DURATION_DAYS
      ? 'دەستخۆشی! ٦٠ ڕۆژ تەواو بوو — خەڵاتی کۆتایی وەربگرە'
      : `دەستخۆشی! ڕۆژی ${completedDays}/${PASS_DURATION_DAYS} تۆمار کرا`,
  }
}

export function claimSocialFinalReward(
  pass: SocialPassState,
): { ok: true; state: SocialPassState; diamond: number } | { ok: false; state: SocialPassState; alert: PassAlert } {
  if (!pass.owned) {
    return { ok: false, state: pass, alert: { tone: 'error', message: '❌ ڕێڕەو چالاک نییە' } }
  }
  if (pass.finalRewardClaimed || pass.status === 'rewardClaimed') {
    return { ok: false, state: pass, alert: { tone: 'warn', message: '⚠️ خەڵات پێشتر وەرگیراوە' } }
  }
  if (pass.completedDays < PASS_DURATION_DAYS) {
    return {
      ok: false,
      state: pass,
      alert: { tone: 'error', message: `❌ پێویستە ${PASS_DURATION_DAYS} ڕۆژ تەواو بکەیت (${pass.completedDays}/${PASS_DURATION_DAYS})` },
    }
  }
  return {
    ok: true,
    state: { ...pass, finalRewardClaimed: true, status: 'rewardClaimed' },
    diamond: SOCIAL_FINAL_DIAMOND,
  }
}

export function getMasterDailyClaimReward(passDay: number): { kind: 'gold' | 'diamond'; amount: number } | null {
  if (passDay < 1 || passDay > PASS_DURATION_DAYS) return null
  if (passDay <= 5) return { kind: 'gold', amount: 50 }
  if (passDay <= 10) return { kind: 'gold', amount: 100 }
  if (passDay <= 15) return { kind: 'gold', amount: 150 }
  if (passDay <= 20) return { kind: 'gold', amount: 200 }
  if (passDay <= 25) return { kind: 'diamond', amount: 10 + Math.floor(Math.random() * 16) } // 10–25
  if (passDay <= 30) return { kind: 'diamond', amount: 20 + Math.floor(Math.random() * 16) } // 20–35
  return { kind: 'diamond', amount: 25 }
}

export function canClaimMasterDaily(pass: MasterPassState, now = Date.now()): boolean {
  if (!pass.owned || pass.status !== 'active') return false
  const day = passDayNumber(pass.purchasedAtMs, now)
  if (day < 1 || day > PASS_DURATION_DAYS) return false
  if (pass.lastDailyClaimDay >= day) return false
  if (pass.lastDailyClaimAtMs != null && dayKey(new Date(pass.lastDailyClaimAtMs)) === dayKey(new Date(now))) {
    return false
  }
  return true
}

export function claimMasterDailyReward(pass: MasterPassState, now = Date.now()): MasterClaimResult {
  if (!pass.owned || pass.status !== 'active') {
    return { ok: false, state: pass, alert: { tone: 'error', message: '❌ ڕێڕەوی کوردستان چالاک نییە' } }
  }
  if (pass.endsAtMs && now > pass.endsAtMs) {
    return { ok: false, state: pass, alert: { tone: 'warn', message: '🟡 کاتی ڕێڕەوەکە تەواو بوو — یەکلایی بکەرەوە' } }
  }
  const day = passDayNumber(pass.purchasedAtMs, now)
  if (!canClaimMasterDaily(pass, now)) {
    return { ok: false, state: pass, alert: { tone: 'warn', message: '🟡 خەڵاتی ئەمڕۆ وەرگیراوە یان هێشتا ئامادە نییە' } }
  }
  const reward = getMasterDailyClaimReward(day)
  if (!reward) {
    return { ok: false, state: pass, alert: { tone: 'error', message: '❌ ناتوانرێت خەڵات دیاری بکرێت' } }
  }
  return {
    ok: true,
    state: {
      ...pass,
      lastDailyClaimDay: day,
      lastDailyClaimAtMs: now,
    },
    reward,
    message: reward.kind === 'gold'
      ? `✅ ${reward.amount} زێڕ وەرگیرا (ڕۆژی ${day})`
      : `✅ ${reward.amount} ئەڵماس وەرگیرا (ڕۆژی ${day})`,
  }
}

function missionDone(sp: SeasonPassState, missionId: string, now = new Date()): boolean {
  const def = RP_MISSIONS.find(m => m.id === missionId)
  if (!def) return false
  const key = periodKeyFor(def.period as MissionPeriod, now)
  const cur = sp.missions[missionId]
  if (!cur || cur.periodKey !== key) return false
  return cur.progress >= def.target
}

export function isMasterPerfectDay(sp: SeasonPassState, now = new Date()): boolean {
  const dailyOk = MASTER_DAILY_MISSION_IDS.every(id => missionDone(sp, id, now))
  const weeklyOk = MASTER_WEEKLY_MISSION_IDS.every(id => missionDone(sp, id, now))
  return dailyOk && weeklyOk
}

/** تۆمارکردنی ڕۆژی تەواو ئەگەر هەموو ئەرکەکان تەواو بن */
export function maybeRecordMasterPerfectDay(
  master: MasterPassState,
  sp: SeasonPassState,
  now = new Date(),
): MasterPassState {
  if (!master.owned || master.status !== 'active') return master
  if (!isMasterPerfectDay(sp, now)) return master
  const key = dayKey(now)
  if (master.perfectDayKeys.includes(key)) return master
  // تەنها لە ناو ماوەی ٦٠ ڕۆژدا
  if (master.endsAtMs && now.getTime() > master.endsAtMs) return master
  if (master.purchasedAtMs && now.getTime() < master.purchasedAtMs) return master
  return {
    ...master,
    perfectDayKeys: [...master.perfectDayKeys, key],
  }
}

export function settleMasterPass(pass: MasterPassState, now = Date.now()): MasterSettleResult {
  if (!pass.owned) {
    return { ok: false, state: pass, alert: { tone: 'error', message: '❌ ڕێڕەو چالاک نییە' } }
  }
  if (pass.finalSettled) {
    if (pass.status === 'completed' && !pass.finalRewardClaimed) {
      return {
        ok: true,
        state: pass,
        outcome: 'success',
        diamond: MASTER_FINAL_DIAMOND,
        message: 'خەڵاتی کۆتایی ئامادەیە',
      }
    }
    if (pass.status === 'failed' && !pass.refundGranted) {
      return {
        ok: true,
        state: pass,
        outcome: 'failed',
        refundDiamonds: MASTER_FAIL_REFUND_DIAMONDS,
        message: 'گەڕاندنەوەی ٤٩٩ ئەڵماس ئامادەیە',
      }
    }
    return { ok: false, state: pass, alert: { tone: 'warn', message: '⚠️ یەکلایی کردنەوە پێشتر کراوە' } }
  }

  const ended = pass.endsAtMs != null && now >= pass.endsAtMs
  const day = passDayNumber(pass.purchasedAtMs, now)
  if (!ended && day < PASS_DURATION_DAYS) {
    return {
      ok: false,
      state: pass,
      alert: { tone: 'warn', message: `🟡 هێشتا کاتی ڕێڕەوەکە ماوە (ڕۆژی ${day}/${PASS_DURATION_DAYS})` },
    }
  }

  const perfect = pass.perfectDayKeys.length
  if (perfect >= MASTER_PERFECT_DAYS_REQUIRED) {
    return {
      ok: true,
      state: {
        ...pass,
        status: 'completed',
        finalSettled: true,
      },
      outcome: 'success',
      diamond: MASTER_FINAL_DIAMOND,
      message: `پیرۆزە! ${perfect} ڕۆژی تەواو — ${MASTER_FINAL_DIAMOND.toLocaleString()} ئەڵماس وەربگرە`,
    }
  }

  return {
    ok: true,
    state: {
      ...pass,
      status: 'failed',
      finalSettled: true,
    },
    outcome: 'failed',
    refundDiamonds: MASTER_FAIL_REFUND_DIAMONDS,
    message: `سەرنەکەوت: تەنها ${perfect}/${MASTER_PERFECT_DAYS_REQUIRED} ڕۆژی تەواو — ٤٩٩ ئەڵماس دەگەڕێتەوە`,
  }
}

export function markMasterFinalClaimed(pass: MasterPassState): MasterPassState {
  return { ...pass, finalRewardClaimed: true, status: 'rewardClaimed' }
}

export function markMasterRefundGranted(pass: MasterPassState): MasterPassState {
  return { ...pass, refundGranted: true }
}

export function masterMissionsForUi(): {
  daily: typeof RP_MISSIONS
  weekly: typeof RP_MISSIONS
} {
  return {
    daily: RP_MISSIONS.filter(m => (MASTER_DAILY_MISSION_IDS as readonly string[]).includes(m.id)),
    weekly: RP_MISSIONS.filter(m => (MASTER_WEEKLY_MISSION_IDS as readonly string[]).includes(m.id)),
  }
}

export { dayKey, weekKey }
