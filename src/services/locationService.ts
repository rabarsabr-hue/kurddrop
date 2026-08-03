import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  DEFAULT_PLAYER_STATS,
  DEFAULT_USER_SETTINGS,
  getDefaultStartingWallet,
  computeTotalWealth,
  type Gender,
} from './userService'
import {
  normalizeAvatar3d,
  DEFAULT_AVATAR_3D,
  type Avatar3DCustomization,
} from '../fullBody3dAvatar'
import {
  dropsOpenedForLevel,
  hunterRankForLevel,
} from '../hunterLevel'
import {
  BOT_UID_PREFIX,
  BOT_SEED_VERSION,
  BOT_SEED_STORAGE_KEY,
  BOTS_PER_CITY,
  BOT_TOTAL,
  BOT_MIN_SEPARATION_M,
  BOT_NPC_HUB_OFFSET_M,
  BOT_CITY_CENTERS,
  ERBIL_NPC_HUB_COORDS,
  BOT_NAME_POOL,
} from '../data/bots'

export {
  BOT_UID_PREFIX,
  BOT_SEED_VERSION,
  BOT_SEED_STORAGE_KEY,
  BOTS_PER_CITY,
  BOT_TOTAL,
  BOT_MIN_SEPARATION_M,
}

export interface PlayerLocation {
  uid: string
  name: string
  gender: Gender
  lat: number
  lng: number
  /** ئایا یاریزان لەم ساتەدا ئۆنلاینە؟ */
  isOnline: boolean
  /** ئەگەر false بێت، ئاڤاتارەکەی لەسەر نەخشە پیشان نادرێت (هەڵبژاردنی خۆی) */
  showMyAvatarOnMap: boolean
  avatarUrl: string | null
  /** 3D look — so others see customized character on the map */
  avatar3d: Avatar3DCustomization | null
  /** کەرەستەی جوانکاری چالاک — بۆ پیشاندان لەسەر نەخشە بۆ کەسانی تر */
  skinId: number | null
  borderId: number | null
  titleId: number | null
  headwearId: number | null
  accessoryId: number | null
  mapAuraId: number | null
  /** ئاژەڵی هاوەڵی چالاک */
  companionId: number | null
  /** دوکەڵی دۆڕانی شەڕ — تا ئەم کاتە (ms) */
  smokeUntilMs: number
  /** ئایکۆنی سکوپ / کەوانی ئاگرین لە کاتی/دوای دوێڵ */
  duelFxUntilMs: number
  /** ناسنامەی دوێڵی چالاک — بۆ بادجی LIVE */
  activeDuelId: string | null
  /** ئاستی ڕاوکەر (بۆ بادجی نەخشە) */
  hunterLevel: number
  /** Persistent in-game Player ID (matches profile UI) */
  playerId: string
  /** یاریزانی ساختە / بۆت */
  isBot: boolean
  /** کاتی دوایین نوێکردنەوە — بۆ «پێش X خولەک لەسەر هێڵ بوو» */
  lastSeenMs: number | null
}

function parseUpdatedAtMs(data: Record<string, unknown>): number | null {
  const raw = data.updatedAt
  if (raw == null) return null
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'object' && raw !== null && 'toMillis' in raw) {
    const ms = (raw as { toMillis: () => number }).toMillis()
    return Number.isFinite(ms) ? ms : null
  }
  if (typeof raw === 'object' && raw !== null && 'seconds' in raw) {
    const sec = Number((raw as { seconds: number }).seconds)
    return Number.isFinite(sec) ? sec * 1000 : null
  }
  return null
}

export async function updatePlayerLocation(
  uid: string,
  data: Omit<PlayerLocation, 'uid' | 'isOnline' | 'smokeUntilMs' | 'duelFxUntilMs' | 'activeDuelId' | 'isBot'> & {
    isOnline?: boolean
    smokeUntilMs?: number
    duelFxUntilMs?: number
    activeDuelId?: string | null
    hunterLevel?: number
    playerId?: string
    isBot?: boolean
  },
) {
  const lat = data.lat
  const lng = data.lng
  const payload: Record<string, unknown> = {
    uid,
    name: data.name,
    gender: data.gender,
    lat,
    lng,
    isOnline: data.isOnline !== false,
    showMyAvatarOnMap: data.showMyAvatarOnMap !== false,
    avatarUrl: data.avatarUrl ?? null,
    avatar3d: data.avatar3d ? normalizeAvatar3d(data.avatar3d) : null,
    skinId: data.skinId ?? null,
    borderId: data.borderId ?? null,
    titleId: data.titleId ?? null,
    headwearId: data.headwearId ?? null,
    accessoryId: data.accessoryId ?? null,
    mapAuraId: data.mapAuraId ?? null,
    companionId: data.companionId ?? null,
    hunterLevel: Math.max(0, Math.floor(Number(data.hunterLevel) || 0)),
    playerId: typeof data.playerId === 'string' ? data.playerId.trim() : '',
    updatedAt: serverTimestamp(),
  }
  if (typeof data.smokeUntilMs === 'number') payload.smokeUntilMs = data.smokeUntilMs
  if (typeof data.duelFxUntilMs === 'number') payload.duelFxUntilMs = data.duelFxUntilMs
  if (data.activeDuelId !== undefined) payload.activeDuelId = data.activeDuelId
  if (typeof data.isBot === 'boolean') payload.isBot = data.isBot

  await setDoc(doc(db, 'locations', uid), payload, { merge: true })
}

/** نوێکردنەوەی ئێفێکتی نەخشە (دوکەڵ / سکوپ / LIVE) بەبێ گۆڕینی شوێن */
export async function updatePlayerMapFx(
  uid: string,
  fx: { smokeUntilMs?: number; duelFxUntilMs?: number; activeDuelId?: string | null },
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }
  if (typeof fx.smokeUntilMs === 'number') payload.smokeUntilMs = fx.smokeUntilMs
  if (typeof fx.duelFxUntilMs === 'number') payload.duelFxUntilMs = fx.duelFxUntilMs
  if (fx.activeDuelId !== undefined) payload.activeDuelId = fx.activeDuelId
  await setDoc(doc(db, 'locations', uid), payload, { merge: true })
}

/** کۆتایی سێشن — شوێنی دوایین دەمێنێتەوە، تەنها isOnline=false دەبێت */
export async function setPlayerOffline(uid: string) {
  await setDoc(
    doc(db, 'locations', uid),
    {
      isOnline: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

/** @deprecated شوێن هەرگیز ناسڕدرێتەوە — setPlayerOffline بەکاربهێنە */
export async function removePlayerLocation(uid: string) {
  await setPlayerOffline(uid)
}

export function isBotPlayerUid(uid: string | null | undefined): boolean {
  // تەنها بۆتەکانی Firestore (kd_bot_) — یاریزانە سیموولەکراوەکانی نەخشە وەک یاریزانی ڕاستەقینە دەردەکەون
  return typeof uid === 'string' && uid.startsWith(BOT_UID_PREFIX)
}

function parseLocationDoc(docSnapId: string, data: Record<string, unknown>): PlayerLocation | null {
  let lat = Number(data.lat)
  let lng = Number(data.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (data.showMyAvatarOnMap === false) return null
  // Prefer Firestore doc id — bots use kd_bot_XX; keep same shape as real players
  const uid =
    typeof data.uid === 'string' && data.uid && data.uid === docSnapId
      ? data.uid
      : docSnapId
  const playerId = typeof data.playerId === 'string' ? data.playerId.trim() : ''
  const isBot = data.isBot === true || isBotPlayerUid(uid) || isBotPlayerUid(docSnapId)
  // Null-safe avatar3d — bots always get a complete DEFAULT so modal never crashes
  let avatar3d: Avatar3DCustomization | null = null
  try {
    if (isBot) {
      avatar3d = normalizeAvatar3d(data.avatar3d ?? DEFAULT_AVATAR_3D)
    } else if (data.avatar3d != null) {
      avatar3d = normalizeAvatar3d(data.avatar3d)
    }
  } catch {
    avatar3d = isBot ? { ...DEFAULT_AVATAR_3D } : null
  }
  return {
    uid,
    name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : (isBot ? 'یاریزانی نەخشە' : 'یاریزان'),
    gender: data.gender === 'female' ? 'female' : 'male',
    lat,
    lng,
    isOnline: data.isOnline === true || (isBot && data.isOnline !== false),
    showMyAvatarOnMap: data.showMyAvatarOnMap !== false,
    avatarUrl: typeof data.avatarUrl === 'string' && data.avatarUrl ? data.avatarUrl : null,
    avatar3d,
    skinId: typeof data.skinId === 'number' ? data.skinId : null,
    borderId: typeof data.borderId === 'number' ? data.borderId : null,
    titleId: typeof data.titleId === 'number' ? data.titleId : null,
    headwearId: typeof data.headwearId === 'number' ? data.headwearId : null,
    accessoryId: typeof data.accessoryId === 'number' ? data.accessoryId : null,
    mapAuraId: typeof data.mapAuraId === 'number' ? data.mapAuraId : null,
    companionId: typeof data.companionId === 'number' ? data.companionId : null,
    smokeUntilMs: typeof data.smokeUntilMs === 'number' ? data.smokeUntilMs : 0,
    duelFxUntilMs: typeof data.duelFxUntilMs === 'number' ? data.duelFxUntilMs : 0,
    activeDuelId: typeof data.activeDuelId === 'string' && data.activeDuelId ? data.activeDuelId : null,
    hunterLevel: Math.max(0, Math.floor(Number(data.hunterLevel) || 0)),
    playerId,
    isBot,
    lastSeenMs: parseUpdatedAtMs(data),
  }
}

export function subscribeToOtherPlayers(
  currentUid: string,
  onUpdate: (players: PlayerLocation[]) => void,
): () => void {
  return onSnapshot(collection(db, 'locations'), (snap) => {
    const players: PlayerLocation[] = []
    snap.forEach(docSnap => {
      if (docSnap.id === currentUid) return
      const parsed = parseLocationDoc(docSnap.id, docSnap.data() as Record<string, unknown>)
      if (parsed) players.push(parsed)
    })
    onUpdate(players)
  }, err => console.error('Locations listener failed:', err))
}

// ── بۆتەکانی نەخشە (تەنها هەولێر × ٢٠، مەودای ≥٣کم؛ لە نەخشە دەشاردرێن کاتێک NPC چالاکە) ─────────────────────────

const ERBIL_BOT_ANCHORS: Array<{ key: string; lat: number; lng: number }> = ERBIL_NPC_HUB_COORDS.map(
  (hub, i) => {
    // Deterministic radial offset (~1.6km) so bots never sit on NPC hubs
    const angle = (i / ERBIL_NPC_HUB_COORDS.length) * Math.PI * 2 + Math.PI / 5
    const eastKm = (Math.cos(angle) * BOT_NPC_HUB_OFFSET_M) / 1000
    const northKm = (Math.sin(angle) * BOT_NPC_HUB_OFFSET_M) / 1000
    const dLat = northKm / 111.32
    const dLng = eastKm / (111.32 * Math.cos((hub.lat * Math.PI) / 180))
    return { key: `${hub.key}_bot`, lat: hub.lat + dLat, lng: hub.lng + dLng }
  },
)

/** ~١١١.٣٢ کم لە هەر پلەی پانی؛ درێژی پێویستی cos(lat) */
function offsetKm(lat: number, lng: number, eastKm: number, northKm: number) {
  const dLat = northKm / 111.32
  const dLng = eastKm / (111.32 * Math.cos((lat * Math.PI) / 180))
  return { lat: lat + dLat, lng: lng + dLng }
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Deterministic 0..1 from string (stable scatter across reloads of same seed version) */
function hashUnit(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

/** دانانی بۆت لە دەوری خاڵی هەولێر — مەودای ≥٣کم لە بۆتەکانی تر، ≥١.٥کم لە NPC hubs */
function placeErbilBot(
  index: number,
  placed: Array<{ lat: number; lng: number }>,
): { lat: number; lng: number; eastKm: number; northKm: number } {
  const anchor = ERBIL_BOT_ANCHORS[index % ERBIL_BOT_ANCHORS.length]!
  const avoid = [...placed, ...ERBIL_NPC_HUB_COORDS]
  const minVsPlaced = BOT_MIN_SEPARATION_M
  const minVsNpcHub = 1500

  const tryPos = (eastKm: number, northKm: number) => {
    const pos = offsetKm(anchor.lat, anchor.lng, eastKm, northKm)
    for (const p of placed) {
      if (haversineMeters(p, pos) < minVsPlaced) return null
    }
    for (const h of ERBIL_NPC_HUB_COORDS) {
      if (haversineMeters(h, pos) < minVsNpcHub) return null
    }
    return {
      ...pos,
      eastKm: Math.round(eastKm * 1000) / 1000,
      northKm: Math.round(northKm * 1000) / 1000,
    }
  }

  // Prefer exact offset-anchor (already displaced from NPC hubs)
  const exact = tryPos(0, 0)
  if (exact) return exact

  for (let attempt = 0; attempt < 64; attempt++) {
    const u1 = hashUnit(`erb-bot:${index}:r:${attempt}:v${BOT_SEED_VERSION}`)
    const u2 = hashUnit(`erb-bot:${index}:a:${attempt}:v${BOT_SEED_VERSION}`)
    // Spiral-ish: grow ring so we never collapse onto another bot/NPC
    const distM = 80 + attempt * 160 + u1 * 140
    const angle = u2 * Math.PI * 2 + attempt * 0.7
    const eastKm = (Math.cos(angle) * distM) / 1000
    const northKm = (Math.sin(angle) * distM) / 1000
    const hit = tryPos(eastKm, northKm)
    if (hit) return hit
  }

  // Last resort: farthest candidate — never reuse an occupied lat/lng
  let best = { lat: anchor.lat, lng: anchor.lng, eastKm: 0, northKm: 0 }
  let bestMin = -1
  for (let k = 0; k < 36; k++) {
    const distM = 500 + k * 220
    const angle = (k / 36) * Math.PI * 2
    const eastKm = (Math.cos(angle) * distM) / 1000
    const northKm = (Math.sin(angle) * distM) / 1000
    const pos = offsetKm(anchor.lat, anchor.lng, eastKm, northKm)
    const sameAsPlaced = avoid.some(
      (p) => Math.abs(p.lat - pos.lat) < 1e-7 && Math.abs(p.lng - pos.lng) < 1e-7,
    )
    if (sameAsPlaced) continue
    let nearest = Infinity
    for (const p of avoid) nearest = Math.min(nearest, haversineMeters(p, pos))
    if (avoid.length === 0 || nearest > bestMin) {
      bestMin = avoid.length === 0 ? Infinity : nearest
      best = {
        ...pos,
        eastKm: Math.round(eastKm * 1000) / 1000,
        northKm: Math.round(northKm * 1000) / 1000,
      }
    }
  }
  return best
}

type BotDef = {
  id: string
  cityKey: string
  name: string
  gender: Gender
  lat: number
  lng: number
  hunterLevel: number
  skinTone: number
  hairStyle: Avatar3DCustomization['hairStyle']
  hairColor: number
  eyeColor: string
  outfitColor: string
}

/** ٢٠ بۆت تەنها لە هەولێر — مەودای ≥٣کم، ١.٥کم+ دوور لە NPC hubs */
const BOT_DEFS: BotDef[] = (() => {
  const eyes = ['#1e293b', '#3b82f6', '#16a34a', '#92400e', '#0f766e', '#6b7280']
  const outfits = ['#1e3a5f', '#9f1239', '#14532d', '#4c1d95', '#b45309', '#0f172a', '#0369a1', '#be123c']
  const hairs: Avatar3DCustomization['hairStyle'][] = ['short', 'long', 'buzz', 'layered']
  const defs: BotDef[] = []
  const placed: Array<{ lat: number; lng: number }> = []
  const city = BOT_CITY_CENTERS[0]!
  for (let i = 0; i < BOT_TOTAL; i++) {
    const n = BOT_NAME_POOL[i % BOT_NAME_POOL.length]!
    const scatter = placeErbilBot(i, placed)
    placed.push({ lat: scatter.lat, lng: scatter.lng })
    const id = String(i + 1).padStart(2, '0')
    defs.push({
      id,
      cityKey: city.key,
      name: n.name,
      gender: n.gender,
      lat: scatter.lat,
      lng: scatter.lng,
      hunterLevel: (i * 3 + 1) % 10,
      skinTone: i % 4,
      hairStyle: n.gender === 'female' ? (i % 2 === 0 ? 'long' : 'layered') : hairs[i % hairs.length]!,
      hairColor: i % 3,
      eyeColor: eyes[i % eyes.length]!,
      outfitColor: outfits[i % outfits.length]!,
    })
  }
  return defs
})()

export interface SeedBotsResult {
  removedOtherLocations: number
  removedBotUsers: number
  seededBots: number
}

/**
 * یەکجار: سڕینەوەی هەموو شوێنەکانی نەخشە جگە لە یاریزانی ئێستا،
 * سڕینەوەی بۆتە کۆنەکان، و دانانی ٢٠ بۆت تەنها لەناو هەولێر (≥٣کم مەودا، دوور لە NPC).
 * هەژماری ڕاستەقینەی users ناگۆڕدرێت (تەنها stubsی kd_bot_*).
 * تێبینی: App.tsx بۆتەکان لە نەخشە دەشارێت کاتێک client NPCs چالاکن.
 */
export async function resetMapPresenceAndSeedBots(preserveUid: string): Promise<SeedBotsResult> {
  const locSnap = await getDocs(collection(db, 'locations'))
  let removedOtherLocations = 0
  const deleteOps: Array<Promise<unknown>> = []

  locSnap.forEach(d => {
    if (d.id === preserveUid) return
    deleteOps.push(deleteDoc(doc(db, 'locations', d.id)))
    removedOtherLocations += 1
  })

  // سڕینەوەی stubsی بۆتی کۆن لە users
  let removedBotUsers = 0
  const userSnap = await getDocs(collection(db, 'users'))
  userSnap.forEach(d => {
    const data = d.data()
    if (d.id.startsWith(BOT_UID_PREFIX) || data.isBot === true) {
      deleteOps.push(deleteDoc(doc(db, 'users', d.id)))
      removedBotUsers += 1
    }
  })

  await Promise.all(deleteOps)

  // نووسینەوە بە batch — locations + users + players (rich list)
  const batch = writeBatch(db)
  BOT_DEFS.forEach((bot, i) => {
    const uid = `${BOT_UID_PREFIX}${bot.id}`
    const avatar3d = normalizeAvatar3d({
      ...DEFAULT_AVATAR_3D,
      skinTone: bot.skinTone,
      hairStyle: bot.gender === 'female' && bot.hairStyle === 'buzz' ? 'long' : bot.hairStyle,
      hairColor: bot.hairColor,
      eyeColor: bot.eyeColor,
      outfitColor: bot.outfitColor,
    })
    const hunterLevel = 0
    const rank = hunterRankForLevel(hunterLevel)
    const dropsOpenedByType = dropsOpenedForLevel(hunterLevel)
    const playerId = `9${bot.id.padStart(7, '0')}`

    batch.set(doc(db, 'locations', uid), {
      id: uid,
      uid,
      name: bot.name,
      gender: bot.gender,
      lat: bot.lat,
      lng: bot.lng,
      isOnline: true,
      showMyAvatarOnMap: true,
      avatarUrl: null,
      avatar3d,
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
      hunterLevel,
      hunterRankName: rank.name,
      dropsOpenedByType,
      playerId,
      isBot: true,
      cityKey: bot.cityKey,
      seedVersion: BOT_SEED_VERSION,
      updatedAt: serverTimestamp(),
    })

    const startingWallet = getDefaultStartingWallet()
    const wallet = { gold: startingWallet.gold, diamond: startingWallet.diamond }
    batch.set(doc(db, 'users', uid), {
      id: uid,
      uid,
      name: bot.name,
      gender: bot.gender,
      ...wallet,
      isPremium: false,
      title: rank.name,
      avatarUrl: null,
      avatar3d,
      playerId,
      hunterLevel,
      hunterRankName: rank.name,
      dropsOpenedByType,
      welcomeBonusGranted: true,
      isBot: true,
      cityKey: bot.cityKey,
      seedVersion: BOT_SEED_VERSION,
      inventory: [],
      friends: [],
      blockedUsers: [],
      giftsLog: [],
      inboxNotifications: [],
      mutedChatUids: [],
      dropTypeCooldowns: {},
      stealShieldUntilMs: 0,
      stealCooldownUntilMs: 0,
      fightBanUntilMs: 0,
      fightChallengeLog: {},
      incomingFight: null,
      dailyBonusDay: 1,
      dailyBonusLastClaimMs: null,
      settings: { ...DEFAULT_USER_SETTINGS },
      stats: { ...DEFAULT_PLAYER_STATS },
      playerLevel: 1 + (i % 8),
      playerXp: 0,
      totalWealth: computeTotalWealth(wallet.gold, wallet.diamond),
      giftsSentScore: 10 + (i * 7) % 80,
      leaderboardEpoch: 3,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true })

    // Rich list — bots also live under players/{playerId}
    batch.set(doc(db, 'players', playerId), {
      uid,
      playerId,
      name: bot.name,
      gender: bot.gender,
      ...wallet,
      avatarUrl: null,
      avatar3d,
      playerLevel: 1 + (i % 8),
      playerXp: 0,
      totalWealth: computeTotalWealth(wallet.gold, wallet.diamond),
      giftsSentScore: 10 + (i * 7) % 80,
      leaderboardEpoch: 3,
      isBot: true,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  })
  await batch.commit()

  return {
    removedOtherLocations,
    removedBotUsers,
    seededBots: BOT_DEFS.length,
  }
}
