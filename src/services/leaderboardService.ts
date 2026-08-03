import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  increment,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  computeTotalWealth,
  type Gender,
  type PlayerStats,
} from './userService'
import type { DropsOpenedByType } from '../hunterLevel'
import {
  normalizeAvatar3d,
  type Avatar3DCustomization,
} from '../fullBody3dAvatar'
import { isProtectedAccount } from '../data/protectedPlayers'

export interface LeaderboardEntry {
  uid: string
  /** Persistent in-game Player ID shown in profile UI */
  playerId: string
  name: string
  gender: Gender
  diamond: number
  avatarUrl: string | null
  avatar3d: Avatar3DCustomization | null
  skinId: number | null
  borderId: number | null
}

export interface RoyalLeaderboardEntry {
  uid: string
  /** Persistent in-game Player ID shown in profile UI */
  playerId: string
  name: string
  gender: Gender
  gold: number
  diamond: number
  wealthScore: number
  playerLevel: number
  playerXp: number
  giftsSentScore: number
  /** هەمان ئاڤاتاری سەری نەخشە / پرۆفایل */
  avatarUrl: string | null
  avatar3d: Avatar3DCustomization | null
  skinId: number | null
  borderId: number | null
}

export type RoyalLeaderboardTab = 'wealth' | 'level' | 'gifters'

/** Bump to wipe Rich List / gifter scores and restart tracking from zero. */
export const LEADERBOARD_EPOCH = 3

const LEADERBOARD_LIMIT = 20
/** کەمێک زیاتر دەگرین تا دوای لابردنی هەژماری پارێزراو هێشتا ٢٠ دانە بمێنێتەوە */
const LEADERBOARD_FETCH = LEADERBOARD_LIMIT + 10

function isHiddenFromLeaderboard(docId: string, data: Record<string, unknown>): boolean {
  const uid = typeof data.uid === 'string' ? data.uid : (/^\d{8}$/.test(docId) ? '' : docId)
  const playerId = typeof data.playerId === 'string' && data.playerId.trim()
    ? data.playerId.trim()
    : (/^\d{8}$/.test(docId) ? docId : '')
  if (isProtectedAccount({ uid, playerId })) return true
  if (data.hideFromLeaderboards === true) return true
  return false
}

function takeVisibleRoyalEntries(
  snap: { forEach: (cb: (docSnap: { id: string; data: () => Record<string, unknown> }) => void) => void },
  sortFn?: (a: RoyalLeaderboardEntry, b: RoyalLeaderboardEntry) => number,
): RoyalLeaderboardEntry[] {
  const entries: RoyalLeaderboardEntry[] = []
  snap.forEach(docSnap => {
    const data = docSnap.data() as Record<string, unknown>
    if (isHiddenFromLeaderboard(docSnap.id, data)) return
    entries.push(parseEntry(docSnap.id, data))
  })
  if (sortFn) entries.sort(sortFn)
  return entries.slice(0, LEADERBOARD_LIMIT)
}

function parseAvatarFields(data: Record<string, unknown>): {
  avatarUrl: string | null
  avatar3d: Avatar3DCustomization | null
  skinId: number | null
  borderId: number | null
} {
  const avatarUrl = typeof data.avatarUrl === 'string' && data.avatarUrl.trim()
    ? data.avatarUrl.trim()
    : null
  const avatar3d = data.avatar3d != null ? normalizeAvatar3d(data.avatar3d) : null
  const skinId = typeof data.skinId === 'number' && Number.isFinite(data.skinId)
    ? Math.floor(data.skinId)
    : null
  const borderId = typeof data.borderId === 'number' && Number.isFinite(data.borderId)
    ? Math.floor(data.borderId)
    : null
  return { avatarUrl, avatar3d, skinId, borderId }
}

function parseEntry(uid: string, data: Record<string, unknown>): RoyalLeaderboardEntry {
  const gold = Number(data.gold) || 0
  const diamond = Number(data.diamond) || 0
  const wealthScore = Number(data.totalWealth)
  const av = parseAvatarFields(data)
  const rawPid = typeof data.playerId === 'string' ? data.playerId.trim() : ''
  const playerId = rawPid || (/^\d{8}$/.test(uid) ? uid : '')
  return {
    uid: typeof data.uid === 'string' && data.uid ? data.uid : (/^\d{8}$/.test(uid) ? '' : uid),
    playerId,
    name: String(data.name ?? 'یاریزان'),
    gender: data.gender === 'female' ? 'female' : 'male',
    gold,
    diamond,
    wealthScore: Number.isFinite(wealthScore) ? Math.max(0, wealthScore) : 0,
    playerLevel: Math.max(1, Math.floor(Number(data.playerLevel) || 1)),
    playerXp: Math.max(0, Math.floor(Number(data.playerXp) || 0)),
    giftsSentScore: Math.max(0, Math.floor(Number(data.giftsSentScore) || 0)),
    avatarUrl: av.avatarUrl,
    avatar3d: av.avatar3d,
    skinId: av.skinId,
    borderId: av.borderId,
  }
}

/** ١٠ دەوڵەمەندترین یاریزان بەپێی باڵانسی ئەڵماس — گونجاندنی کۆن */
export function subscribeToLeaderboard(
  onUpdate: (entries: LeaderboardEntry[]) => void,
): () => void {
  const q = query(
    collection(db, 'players'),
    orderBy('diamond', 'desc'),
    limit(LEADERBOARD_FETCH),
  )
  return onSnapshot(q, (snap) => {
    const entries: LeaderboardEntry[] = []
    snap.forEach(docSnap => {
      const data = docSnap.data() as Record<string, unknown>
      if (isHiddenFromLeaderboard(docSnap.id, data)) return
      const av = parseAvatarFields(data)
      const playerId = typeof data.playerId === 'string' && data.playerId.trim()
        ? data.playerId.trim()
        : docSnap.id
      entries.push({
        uid: typeof data.uid === 'string' ? data.uid : '',
        playerId,
        name: String(data.name ?? 'یاریزان'),
        gender: data.gender === 'female' ? 'female' : 'male',
        diamond: Number(data.diamond) || 0,
        avatarUrl: av.avatarUrl,
        avatar3d: av.avatar3d,
        skinId: av.skinId,
        borderId: av.borderId,
      })
    })
    onUpdate(entries.slice(0, 10))
  }, err => console.error('Leaderboard listener failed:', err))
}

export function subscribeToWealthLeaderboard(
  onUpdate: (entries: RoyalLeaderboardEntry[]) => void,
): () => void {
  const q = query(
    collection(db, 'players'),
    orderBy('totalWealth', 'desc'),
    limit(LEADERBOARD_FETCH),
  )
  return onSnapshot(q, snap => {
    onUpdate(takeVisibleRoyalEntries(snap))
  }, err => console.error('Wealth leaderboard failed:', err))
}

export function subscribeToLevelLeaderboard(
  onUpdate: (entries: RoyalLeaderboardEntry[]) => void,
): () => void {
  const q = query(
    collection(db, 'players'),
    orderBy('playerLevel', 'desc'),
    limit(LEADERBOARD_FETCH),
  )
  return onSnapshot(q, snap => {
    onUpdate(takeVisibleRoyalEntries(snap, (a, b) => {
      if (b.playerLevel !== a.playerLevel) return b.playerLevel - a.playerLevel
      return b.playerXp - a.playerXp
    }))
  }, err => console.error('Level leaderboard failed:', err))
}

export function subscribeToGifterLeaderboard(
  onUpdate: (entries: RoyalLeaderboardEntry[]) => void,
): () => void {
  const q = query(
    collection(db, 'players'),
    orderBy('giftsSentScore', 'desc'),
    limit(LEADERBOARD_FETCH),
  )
  return onSnapshot(q, snap => {
    onUpdate(takeVisibleRoyalEntries(snap))
  }, err => console.error('Gifter leaderboard failed:', err))
}

/** Reset leaderboard scores when epoch bumps — wealth + gifter counters (wallet untouched). */
export async function ensureLeaderboardEpoch(uid: string): Promise<void> {
  if (!uid) return
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  const data = snap.data() ?? {}
  const epoch = Number(data.leaderboardEpoch) || 0
  if (epoch >= LEADERBOARD_EPOCH) return
  const patch = {
    leaderboardEpoch: LEADERBOARD_EPOCH,
    totalWealth: 0,
    giftsSentScore: 0,
    updatedAt: serverTimestamp(),
  }
  await setDoc(userRef, patch, { merge: true })
  const playerId = typeof data.playerId === 'string' ? data.playerId.trim() : ''
  if (playerId) {
    await setDoc(doc(db, 'players', playerId), { uid, playerId, ...patch }, { merge: true }).catch(() => {})
  }
}

/** Reset all map NPC bot leaderboard rows to epoch baseline. */
export async function resetAllNpcLeaderboardScores(): Promise<void> {
  // No-op: wiping NPC progress on login was causing fake characters to vanish / reset
  return
}

/** Stable in-game Player ID for client NPCs (shown in rich list). */
export function npcLeaderboardPlayerId(npcUid: string, index?: number): string {
  const m = /^kd_npc_(\d+)$/.exec(npcUid)
  const n = m ? Number(m[1]) : (typeof index === 'number' ? index + 1 : 0)
  if (n > 0) return `8${String(n).padStart(7, '0')}`
  // fallback — hash-like 8 digits from uid
  let h = 0
  for (let i = 0; i < npcUid.length; i++) h = (h * 31 + npcUid.charCodeAt(i)) >>> 0
  return String(80000000 + (h % 10000000)).padStart(8, '0')
}

/**
 * Upsert fake/NPC characters into players/{playerId} so they appear on all 3 rich-list tabs.
 * Live wallet/stats overwrite (source of truth = client NPC sim). Never write isNpc.
 */
export async function upsertNpcLeaderboardPresence(
  npcs: Array<{
    uid: string
    index?: number
    name: string
    gender: Gender
    playerLevel: number
    playerXp?: number
    hunterLevel?: number
    avatarUrl?: string | null
    avatar3d?: Avatar3DCustomization | null
    gold?: number
    diamond?: number
    stats?: PlayerStats
    dropsOpenedByType?: DropsOpenedByType
    dailyBonusDay?: number
    dailyBonusLastClaimMs?: number | null
    spinLastFreeAtMs?: number | null
    spinSpinsInWindow?: number
    isOnline?: boolean
    lastSeenMs?: number
  }>,
): Promise<void> {
  await Promise.all(npcs.map(async (npc) => {
    if (!npc.uid) return
    const playerId = npcLeaderboardPlayerId(npc.uid, npc.index)
    const gold = Math.max(0, Math.floor(npc.gold ?? 0))
    const diamond = Math.max(0, Math.floor(npc.diamond ?? 0))
    const playerLevel = Math.max(1, Math.floor(npc.playerLevel || 1))
    const playerXp = Math.max(0, Math.floor(npc.playerXp ?? 0))
    const hunterLevel = Math.max(0, Math.floor(npc.hunterLevel ?? 0))
    const wealthNow = computeTotalWealth(gold, diamond)
    const playerRef = doc(db, 'players', playerId)
    const userRef = doc(db, 'users', npc.uid)
    try {
      const existing = await getDoc(playerRef)
      const prev = existing.data() ?? {}
      const prevEpoch = Number(prev.leaderboardEpoch) || 0
      const forceFresh = prevEpoch < LEADERBOARD_EPOCH
      const prevGifts = Number(prev.giftsSentScore) || 0
      const payload = {
        uid: npc.uid,
        playerId,
        name: npc.name,
        gender: npc.gender,
        avatarUrl: npc.avatarUrl ?? null,
        avatar3d: npc.avatar3d ?? null,
        gold,
        diamond,
        playerLevel,
        playerXp,
        hunterLevel,
        ...(npc.stats ? { stats: npc.stats } : {}),
        ...(npc.dropsOpenedByType ? { dropsOpenedByType: npc.dropsOpenedByType } : {}),
        ...(typeof npc.dailyBonusDay === 'number' ? { dailyBonusDay: npc.dailyBonusDay } : {}),
        ...(npc.dailyBonusLastClaimMs !== undefined
          ? { dailyBonusLastClaimMs: npc.dailyBonusLastClaimMs }
          : {}),
        ...(npc.spinLastFreeAtMs !== undefined ? { spinLastFreeAtMs: npc.spinLastFreeAtMs } : {}),
        ...(typeof npc.spinSpinsInWindow === 'number'
          ? { spinSpinsInWindow: npc.spinSpinsInWindow }
          : {}),
        ...(typeof npc.isOnline === 'boolean' ? { isOnline: npc.isOnline } : {}),
        ...(typeof npc.lastSeenMs === 'number' ? { lastSeenMs: npc.lastSeenMs } : {}),
        totalWealth: wealthNow,
        giftsSentScore: forceFresh ? 0 : prevGifts,
        leaderboardEpoch: LEADERBOARD_EPOCH,
        isNpc: deleteField(),
        isBot: false,
        updatedAt: serverTimestamp(),
      }
      await setDoc(playerRef, payload, { merge: true })
      await setDoc(userRef, payload, { merge: true })
    } catch (err) {
      console.error('NPC leaderboard upsert failed:', npc.uid, err)
    }
  }))
}

/** Additive Rich List wealth from new currency gains (not wallet snapshot). */
export async function incrementLeaderboardWealth(
  uid: string,
  delta: { gold?: number; diamond?: number },
): Promise<void> {
  const add = computeTotalWealth(delta.gold ?? 0, delta.diamond ?? 0)
  if (!uid || add <= 0) return
  if (isProtectedAccount({ uid })) return
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    totalWealth: increment(add),
    updatedAt: serverTimestamp(),
  })
  try {
    const snap = await getDoc(userRef)
    const playerId = typeof snap.data()?.playerId === 'string' ? String(snap.data()!.playerId).trim() : ''
    if (isProtectedAccount({ uid, playerId })) return
    if (playerId) {
      await setDoc(doc(db, 'players', playerId), {
        uid,
        playerId,
        totalWealth: increment(add),
        updatedAt: serverTimestamp(),
      }, { merge: true })
    }
  } catch (err) {
    console.error('Player wealth leaderboard sync failed:', err)
  }
}

/** زیادکردنی خاڵی بەخشەر بۆ ڕیزبەندی Top Gifters */
export async function incrementGiftsSentScore(uid: string, score: number): Promise<void> {
  const add = Math.max(0, Math.floor(score))
  if (!uid || add <= 0) return
  if (isProtectedAccount({ uid })) return
  await ensureLeaderboardEpoch(uid)
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    giftsSentScore: increment(add),
    updatedAt: serverTimestamp(),
  })
  try {
    const snap = await getDoc(userRef)
    const playerId = typeof snap.data()?.playerId === 'string' ? String(snap.data()!.playerId).trim() : ''
    if (isProtectedAccount({ uid, playerId })) return
    if (playerId) {
      await setDoc(doc(db, 'players', playerId), {
        uid,
        playerId,
        giftsSentScore: increment(add),
        updatedAt: serverTimestamp(),
      }, { merge: true })
    }
  } catch (err) {
    console.error('Player gifter score sync failed:', err)
  }
}

/**
 * بۆتی/کارەکتەری دەستکردی نەخشە (NPC) کاتێک دیاریەک دەنێرێت — خاڵی بەخشەر زیاد دەکات
 * بۆ Rich List؛ باڵانسی NPC لەسەر نەخشە دەمێنێتەوە.
 */
export async function recordNpcGiftScore(
  npc: {
    uid: string
    name: string
    gender: Gender
    avatarUrl?: string | null
    avatar3d?: Avatar3DCustomization | null
    index?: number
    playerLevel?: number
  },
  score: number,
): Promise<void> {
  const add = Math.max(0, Math.floor(score))
  if (!npc.uid || add <= 0) return
  const playerId = npcLeaderboardPlayerId(npc.uid, npc.index)
  const userRef = doc(db, 'users', npc.uid)
  const playerRef = doc(db, 'players', playerId)
  try {
    await Promise.all([
      setDoc(userRef, {
        uid: npc.uid,
        playerId,
        name: npc.name,
        gender: npc.gender,
        avatarUrl: npc.avatarUrl ?? null,
        avatar3d: npc.avatar3d ?? null,
        giftsSentScore: increment(add),
        playerLevel: Math.max(1, Math.floor(npc.playerLevel ?? 1)),
        leaderboardEpoch: LEADERBOARD_EPOCH,
        isNpc: deleteField(),
        isBot: false,
        updatedAt: serverTimestamp(),
      }, { merge: true }),
      setDoc(playerRef, {
        uid: npc.uid,
        playerId,
        name: npc.name,
        gender: npc.gender,
        avatarUrl: npc.avatarUrl ?? null,
        avatar3d: npc.avatar3d ?? null,
        giftsSentScore: increment(add),
        playerLevel: Math.max(1, Math.floor(npc.playerLevel ?? 1)),
        leaderboardEpoch: LEADERBOARD_EPOCH,
        isNpc: deleteField(),
        isBot: false,
        updatedAt: serverTimestamp(),
      }, { merge: true }),
    ])
  } catch (err) {
    console.error('NPC gifter score sync failed:', err)
  }
}
