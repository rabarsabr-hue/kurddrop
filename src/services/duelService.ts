import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  FIGHT_CHALLENGE_BAN_MS,
  FIGHT_LOSER_BAN_MS,
  FIGHT_MAX_CONSECUTIVE,
  FIGHT_SMOKE_MS,
} from './userService'
import {
  makeNotificationId,
  parseInboxNotifications,
  type InboxNotification,
} from './notificationService'

export const FIGHT_CHALLENGE_TIMEOUT_MS = 15_000
export const FIGHT_DURATION_MS = 4 * 60 * 1000
export const FIGHT_MAX_HP = 100
export const FIGHT_MAX_AMMO = 6
export const FIGHT_RELOAD_MS = 2_000
export const FIGHT_MEDKIT_HEAL = 35
export const FIGHT_MEDKIT_COOLDOWN_MS = 12_000
export const FIGHT_SHOT_DAMAGE = 24
export const FIGHT_SHOT_RANGE = 14
export const ARENA_W = 36
export const ARENA_H = 28

export type DuelStatus = 'pending' | 'active' | 'finished' | 'declined' | 'expired'
export type DuelOutcome = 'challenger_win' | 'defender_win' | 'draw'

export interface FighterState {
  uid: string
  name: string
  x: number
  y: number
  angle: number
  hp: number
  ammo: number
  reloadingUntilMs: number
  medkitUntilMs: number
  inCover: boolean
  lastShotAtMs: number
}

export interface DuelInput {
  moveX: number
  moveY: number
  angle: number
  shoot: boolean
  medkit: boolean
  seq: number
  atMs: number
}

export interface DuelReaction {
  id: string
  emoji: string
  fromUid: string
  atMs: number
}

export interface DuelRoom {
  id: string
  status: DuelStatus
  challengerUid: string
  challengerName: string
  defenderUid: string
  defenderName: string
  hostUid: string
  createdAtMs: number
  expiresAtMs: number
  startsAtMs: number
  endsAtMs: number
  durationMs: number
  challenger: FighterState
  defender: FighterState
  inputChallenger: DuelInput | null
  inputDefender: DuelInput | null
  outcome: DuelOutcome | null
  winnerUid: string | null
  loserUid: string | null
  settled: boolean
  goldAmount: number
  reactions: DuelReaction[]
  lastTickMs: number
}

export interface CoverBox {
  x: number
  y: number
  w: number
  h: number
}

/** ژینگەی شەقام / کڤەر */
export const ARENA_COVER: CoverBox[] = [
  { x: 8, y: 6, w: 3.2, h: 2.4 },
  { x: 24, y: 6, w: 3.2, h: 2.4 },
  { x: 16, y: 12, w: 4.5, h: 2.2 },
  { x: 6, y: 18, w: 2.8, h: 3.5 },
  { x: 27, y: 17, w: 2.8, h: 3.5 },
  { x: 12, y: 20, w: 3, h: 2 },
  { x: 21, y: 20, w: 3, h: 2 },
  { x: 17.5, y: 4, w: 1.4, h: 5 },
]

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

function defaultInput(): DuelInput {
  return { moveX: 0, moveY: 0, angle: 0, shoot: false, medkit: false, seq: 0, atMs: 0 }
}

function spawnFighter(uid: string, name: string, side: 'challenger' | 'defender'): FighterState {
  const isA = side === 'challenger'
  return {
    uid,
    name,
    x: isA ? 5 : ARENA_W - 5,
    y: ARENA_H / 2,
    angle: isA ? 0 : Math.PI,
    hp: FIGHT_MAX_HP,
    ammo: FIGHT_MAX_AMMO,
    reloadingUntilMs: 0,
    medkitUntilMs: 0,
    inCover: false,
    lastShotAtMs: 0,
  }
}

function circleHitsCover(x: number, y: number, r: number, cover: CoverBox): boolean {
  const nearestX = Math.max(cover.x, Math.min(x, cover.x + cover.w))
  const nearestY = Math.max(cover.y, Math.min(y, cover.y + cover.h))
  const dx = x - nearestX
  const dy = y - nearestY
  return dx * dx + dy * dy < r * r
}

export function isInCover(x: number, y: number): boolean {
  return ARENA_COVER.some(c => circleHitsCover(x, y, 0.55, c))
}

function resolveChallengeEntry(
  log: Record<string, { count: number; banUntilMs: number }>,
  targetUid: string,
  now: number,
): { count: number; banUntilMs: number } {
  let entry = log[targetUid] ?? { count: 0, banUntilMs: 0 }
  if (entry.banUntilMs > 0 && entry.banUntilMs <= now) {
    entry = { count: 0, banUntilMs: 0 }
  }
  return entry
}

export async function sendFightChallenge(
  challengerUid: string,
  challengerName: string,
  defenderUid: string,
  defenderName: string,
): Promise<{ duelId: string; expiresAtMs: number; remainingRequests: number }> {
  if (challengerUid === defenderUid) throw new Error('ناتوانیت لە دژی خۆت شەڕ بکەیت')
  const now = Date.now()
  const duelId = `duel_${now}_${Math.random().toString(36).slice(2, 9)}`
  const expiresAtMs = now + FIGHT_CHALLENGE_TIMEOUT_MS
  const challengerRef = doc(db, 'users', challengerUid)
  const defenderRef = doc(db, 'users', defenderUid)
  const duelRef = doc(db, 'duels', duelId)

  await runTransaction(db, async tx => {
    const [challengerSnap, defenderSnap] = await Promise.all([tx.get(challengerRef), tx.get(defenderRef)])
    if (!challengerSnap.exists() || !defenderSnap.exists()) throw new Error('هەژمار نەدۆزرایەوە')

    const challengerData = challengerSnap.data()
    const defenderData = defenderSnap.data()
    const challengerBan = Number(challengerData.fightBanUntilMs) || 0
    const defenderBan = Number(defenderData.fightBanUntilMs) || 0
    if (challengerBan > now) throw new Error('تۆ قەدەغەی شەڕت هەیە بۆ ٢٤ کاتژمێر (دوای دۆڕان)')
    if (defenderBan > now) throw new Error('ئەم یاریزانە ناتوانێت شەڕ بکات (قەدەغەی ٢٤ کاتژمێر)')

    const incoming = defenderData.incomingFight as { duelId?: string; expiresAtMs?: number } | null | undefined
    if (incoming?.duelId && Number(incoming.expiresAtMs) > now) {
      throw new Error('ئەم یاریزانە پێشتر داواکاری شەڕی چاوەڕوانکراوی هەیە')
    }

    const challengeLog = parseFightChallengeLog(challengerData.fightChallengeLog)
    let targetLog = resolveChallengeEntry(challengeLog, defenderUid, now)
    if (targetLog.banUntilMs > now) {
      throw new Error('بۆ ٢٤ کاتژمێر ناتوانیت داواکاری شەڕ بۆ ئەم کەسە بنێریت')
    }
    if (targetLog.count >= FIGHT_MAX_CONSECUTIVE) {
      targetLog = { count: FIGHT_MAX_CONSECUTIVE, banUntilMs: now + FIGHT_CHALLENGE_BAN_MS }
      challengeLog[defenderUid] = targetLog
      tx.update(challengerRef, { fightChallengeLog: challengeLog, updatedAt: serverTimestamp() })
      throw new Error('٣ داواکاری شەڕت نارد — بۆ ٢٤ کاتژمێر بۆ ئەم کەسە قەدەغەیت')
    }

    targetLog = { count: targetLog.count + 1, banUntilMs: 0 }
    if (targetLog.count >= FIGHT_MAX_CONSECUTIVE) {
      targetLog.banUntilMs = now + FIGHT_CHALLENGE_BAN_MS
    }
    challengeLog[defenderUid] = targetLog

    const room: DuelRoom = {
      id: duelId,
      status: 'pending',
      challengerUid,
      challengerName,
      defenderUid,
      defenderName,
      hostUid: challengerUid,
      createdAtMs: now,
      expiresAtMs,
      startsAtMs: 0,
      endsAtMs: 0,
      durationMs: FIGHT_DURATION_MS,
      challenger: spawnFighter(challengerUid, challengerName, 'challenger'),
      defender: spawnFighter(defenderUid, defenderName, 'defender'),
      inputChallenger: null,
      inputDefender: null,
      outcome: null,
      winnerUid: null,
      loserUid: null,
      settled: false,
      goldAmount: 0,
      reactions: [],
      lastTickMs: now,
    }

    tx.set(duelRef, { ...room, updatedAt: serverTimestamp() })
    tx.update(challengerRef, {
      fightChallengeLog: challengeLog,
      updatedAt: serverTimestamp(),
    })
    tx.update(defenderRef, {
      incomingFight: {
        duelId,
        fromUid: challengerUid,
        fromName: challengerName,
        expiresAtMs,
      },
      updatedAt: serverTimestamp(),
    })
  })

  const challengerSnap = await getDoc(challengerRef)
  const log = parseFightChallengeLog(challengerSnap.data()?.fightChallengeLog)
  const count = log[defenderUid]?.count ?? 0
  return {
    duelId,
    expiresAtMs,
    remainingRequests: Math.max(0, FIGHT_MAX_CONSECUTIVE - count),
  }
}

async function applyChallengeCooldown(
  challengerUid: string,
  defenderUid: string,
  reason: 'declined' | 'exhausted',
): Promise<void> {
  const challengerRef = doc(db, 'users', challengerUid)
  const now = Date.now()
  await runTransaction(db, async tx => {
    const snap = await tx.get(challengerRef)
    if (!snap.exists()) return
    const challengeLog = parseFightChallengeLog(snap.data().fightChallengeLog)
    challengeLog[defenderUid] = {
      count: FIGHT_MAX_CONSECUTIVE,
      banUntilMs: now + FIGHT_CHALLENGE_BAN_MS,
    }
    tx.update(challengerRef, {
      fightChallengeLog: challengeLog,
      updatedAt: serverTimestamp(),
    })
  })
  void reason
}

export async function respondFightChallenge(
  duelId: string,
  myUid: string,
  accept: boolean,
): Promise<{ status: DuelStatus }> {
  const duelRef = doc(db, 'duels', duelId)
  const now = Date.now()

  const result = await runTransaction(db, async tx => {
    // All reads first — Firestore forbids get() after any write in the same transaction.
    const duelSnap = await tx.get(duelRef)
    if (!duelSnap.exists()) throw new Error('داواکاری شەڕ نەدۆزرایەوە')
    const data = duelSnap.data() as DuelRoom
    if (data.defenderUid !== myUid) throw new Error('ئەم داواکارییە بۆ تۆ نییە')
    if (data.status !== 'pending') throw new Error('ئەم داواکارییە چیتر چاوەڕوان نییە')

    const defenderRef = doc(db, 'users', data.defenderUid)
    const challengerRef = doc(db, 'users', data.challengerUid)
    const challengerSnap = await tx.get(challengerRef)

    const decliningOrExpired = !accept || data.expiresAtMs <= now
    if (decliningOrExpired) {
      const status: DuelStatus = accept ? 'expired' : 'declined'
      tx.update(duelRef, { status, updatedAt: serverTimestamp() })
      tx.update(defenderRef, { incomingFight: null, updatedAt: serverTimestamp() })
      return { status, challengerUid: data.challengerUid, defenderUid: data.defenderUid, needBan: true }
    }

    const startsAtMs = now
    const endsAtMs = now + FIGHT_DURATION_MS
    tx.update(duelRef, {
      status: 'active',
      startsAtMs,
      endsAtMs,
      lastTickMs: now,
      updatedAt: serverTimestamp(),
    })
    tx.update(defenderRef, { incomingFight: null, updatedAt: serverTimestamp() })
    // قبوڵکردن — ژمێریاری داواکاری بۆ ئەم کەسە سفر دەکاتەوە
    if (challengerSnap.exists()) {
      const challengeLog = parseFightChallengeLog(challengerSnap.data().fightChallengeLog)
      challengeLog[data.defenderUid] = { count: 0, banUntilMs: 0 }
      tx.update(challengerRef, { fightChallengeLog: challengeLog, updatedAt: serverTimestamp() })
    }
    return { status: 'active' as DuelStatus, challengerUid: data.challengerUid, defenderUid: data.defenderUid, needBan: false }
  })

  if (result.needBan) {
    await applyChallengeCooldown(result.challengerUid, result.defenderUid, result.status === 'declined' ? 'declined' : 'exhausted')
  }

  if (result.status === 'active') {
    await Promise.all([
      setDoc(doc(db, 'locations', result.challengerUid), { activeDuelId: duelId, duelFxUntilMs: now + FIGHT_DURATION_MS + 30_000, updatedAt: serverTimestamp() }, { merge: true }),
      setDoc(doc(db, 'locations', result.defenderUid), { activeDuelId: duelId, duelFxUntilMs: now + FIGHT_DURATION_MS + 30_000, updatedAt: serverTimestamp() }, { merge: true }),
    ]).catch(() => {})
  }

  return { status: result.status }
}

export async function expirePendingChallenge(duelId: string): Promise<void> {
  const duelRef = doc(db, 'duels', duelId)
  const snap = await getDoc(duelRef)
  if (!snap.exists()) return
  const data = snap.data() as DuelRoom
  if (data.status !== 'pending') return
  if (data.expiresAtMs > Date.now()) return

  await updateDoc(duelRef, { status: 'expired', updatedAt: serverTimestamp() })
  await updateDoc(doc(db, 'users', data.defenderUid), { incomingFight: null, updatedAt: serverTimestamp() }).catch(() => {})

  const challengerSnap = await getDoc(doc(db, 'users', data.challengerUid))
  const log = parseFightChallengeLog(challengerSnap.data()?.fightChallengeLog)
  const entry = log[data.defenderUid]
  if (entry && entry.count >= FIGHT_MAX_CONSECUTIVE) {
    await applyChallengeCooldown(data.challengerUid, data.defenderUid, 'exhausted')
  }
}

export async function pushDuelInput(duelId: string, role: 'challenger' | 'defender', input: DuelInput): Promise<void> {
  const field = role === 'challenger' ? 'inputChallenger' : 'inputDefender'
  await updateDoc(doc(db, 'duels', duelId), {
    [field]: input,
    updatedAt: serverTimestamp(),
  })
}

export async function pushHostDuelState(
  duelId: string,
  patch: Partial<Pick<DuelRoom, 'challenger' | 'defender' | 'status' | 'outcome' | 'winnerUid' | 'loserUid' | 'endsAtMs' | 'lastTickMs'>>,
): Promise<void> {
  await updateDoc(doc(db, 'duels', duelId), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}

export async function addDuelReaction(duelId: string, fromUid: string, emoji: string): Promise<void> {
  const duelRef = doc(db, 'duels', duelId)
  const snap = await getDoc(duelRef)
  if (!snap.exists()) return
  const data = snap.data() as DuelRoom
  const reactions = [...(data.reactions ?? [])]
  reactions.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    emoji,
    fromUid,
    atMs: Date.now(),
  })
  // تەنها کۆتا ٢٠ کاردانەوە بپارێزە
  const trimmed = reactions.slice(-20)
  await updateDoc(duelRef, { reactions: trimmed, updatedAt: serverTimestamp() })
}

export function subscribeToDuel(duelId: string, onUpdate: (room: DuelRoom | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'duels', duelId), snap => {
    if (!snap.exists()) {
      onUpdate(null)
      return
    }
    onUpdate(parseDuelRoom(snap.id, snap.data()))
  }, err => {
    console.error('Duel listener failed:', err)
    onUpdate(null)
  })
}

export function subscribeToOutgoingPendingDuel(
  challengerUid: string,
  duelId: string,
  onUpdate: (room: DuelRoom | null) => void,
): Unsubscribe {
  void challengerUid
  return subscribeToDuel(duelId, onUpdate)
}

function parseFighter(raw: unknown, fallback: FighterState): FighterState {
  if (raw == null || typeof raw !== 'object') return fallback
  const d = raw as Record<string, unknown>
  return {
    uid: String(d.uid ?? fallback.uid),
    name: String(d.name ?? fallback.name),
    x: Number(d.x) || fallback.x,
    y: Number(d.y) || fallback.y,
    angle: Number(d.angle) || 0,
    hp: Math.max(0, Math.min(FIGHT_MAX_HP, Number(d.hp) || 0)),
    ammo: Math.max(0, Number(d.ammo) || 0),
    reloadingUntilMs: Number(d.reloadingUntilMs) || 0,
    medkitUntilMs: Number(d.medkitUntilMs) || 0,
    inCover: d.inCover === true,
    lastShotAtMs: Number(d.lastShotAtMs) || 0,
  }
}

function parseInput(raw: unknown): DuelInput | null {
  if (raw == null || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  return {
    moveX: Math.max(-1, Math.min(1, Number(d.moveX) || 0)),
    moveY: Math.max(-1, Math.min(1, Number(d.moveY) || 0)),
    angle: Number(d.angle) || 0,
    shoot: d.shoot === true,
    medkit: d.medkit === true,
    seq: Number(d.seq) || 0,
    atMs: Number(d.atMs) || 0,
  }
}

export function parseDuelRoom(id: string, data: Record<string, unknown>): DuelRoom {
  const challengerUid = String(data.challengerUid ?? '')
  const defenderUid = String(data.defenderUid ?? '')
  const challengerName = String(data.challengerName ?? 'یاریزان')
  const defenderName = String(data.defenderName ?? 'یاریزان')
  return {
    id,
    status: (['pending', 'active', 'finished', 'declined', 'expired'].includes(String(data.status))
      ? String(data.status)
      : 'pending') as DuelStatus,
    challengerUid,
    challengerName,
    defenderUid,
    defenderName,
    hostUid: String(data.hostUid ?? challengerUid),
    createdAtMs: Number(data.createdAtMs) || 0,
    expiresAtMs: Number(data.expiresAtMs) || 0,
    startsAtMs: Number(data.startsAtMs) || 0,
    endsAtMs: Number(data.endsAtMs) || 0,
    durationMs: Number(data.durationMs) || FIGHT_DURATION_MS,
    challenger: parseFighter(data.challenger, spawnFighter(challengerUid, challengerName, 'challenger')),
    defender: parseFighter(data.defender, spawnFighter(defenderUid, defenderName, 'defender')),
    inputChallenger: parseInput(data.inputChallenger),
    inputDefender: parseInput(data.inputDefender),
    outcome: (data.outcome as DuelOutcome | null) ?? null,
    winnerUid: typeof data.winnerUid === 'string' ? data.winnerUid : null,
    loserUid: typeof data.loserUid === 'string' ? data.loserUid : null,
    settled: data.settled === true,
    goldAmount: Number(data.goldAmount) || 0,
    reactions: Array.isArray(data.reactions)
      ? data.reactions
          .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
          .map(r => ({
            id: String(r.id ?? ''),
            emoji: String(r.emoji ?? '🔥'),
            fromUid: String(r.fromUid ?? ''),
            atMs: Number(r.atMs) || 0,
          }))
          .filter(r => r.id)
      : [],
    lastTickMs: Number(data.lastTickMs) || 0,
  }
}

function clampToArena(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(1.2, Math.min(ARENA_W - 1.2, x)),
    y: Math.max(1.2, Math.min(ARENA_H - 1.2, y)),
  }
}

function collidesSolid(x: number, y: number): boolean {
  return ARENA_COVER.some(c => {
    // تەنها ناوەڕاستی کڤەر وەک دیوار — لێواری دەرەوە بۆ خۆشاردن
    const inset = 0.35
    return x > c.x + inset && x < c.x + c.w - inset && y > c.y + inset && y < c.y + c.h - inset
  })
}

function tryMove(f: FighterState, dx: number, dy: number): FighterState {
  const speed = 5.2
  let nx = f.x + dx * speed
  let ny = f.y + dy * speed
  const clamped = clampToArena(nx, ny)
  nx = clamped.x
  ny = clamped.y
  if (collidesSolid(nx, f.y)) nx = f.x
  if (collidesSolid(f.x, ny)) ny = f.y
  if (collidesSolid(nx, ny)) {
    nx = f.x
    ny = f.y
  }
  return { ...f, x: nx, y: ny, inCover: isInCover(nx, ny) }
}

function rayHitsFighter(
  ox: number,
  oy: number,
  angle: number,
  target: FighterState,
  coverBlocks: boolean,
): boolean {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  for (let t = 0.4; t <= FIGHT_SHOT_RANGE; t += 0.35) {
    const px = ox + dx * t
    const py = oy + dy * t
    if (coverBlocks) {
      for (const c of ARENA_COVER) {
        if (px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h) {
          // تەقە لە کڤەر دەوەستێت — ئەگەر ئامانج لە کڤەردا بێت پارێزراوە
          const distToTarget = Math.hypot(target.x - ox, target.y - oy)
          if (t < distToTarget - 0.6) return false
        }
      }
    }
    if (Math.hypot(px - target.x, py - target.y) < 0.75) return true
  }
  return false
}

function stepFighter(f: FighterState, input: DuelInput | null, now: number, dt: number): { fighter: FighterState; didShoot: boolean } {
  const inp = input ?? defaultInput()
  let next = { ...f }
  const len = Math.hypot(inp.moveX, inp.moveY)
  if (len > 0.08) {
    next = tryMove(next, (inp.moveX / len) * dt, (inp.moveY / len) * dt)
  } else {
    next.inCover = isInCover(next.x, next.y)
  }
  next.angle = inp.angle

  if (next.reloadingUntilMs > 0 && now >= next.reloadingUntilMs) {
    next.ammo = FIGHT_MAX_AMMO
    next.reloadingUntilMs = 0
  }

  if (inp.medkit && next.inCover && now >= next.medkitUntilMs && next.hp > 0 && next.hp < FIGHT_MAX_HP) {
    next.hp = Math.min(FIGHT_MAX_HP, next.hp + FIGHT_MEDKIT_HEAL)
    next.medkitUntilMs = now + FIGHT_MEDKIT_COOLDOWN_MS
  }

  let didShoot = false
  if (inp.shoot && next.hp > 0 && now - next.lastShotAtMs > 420) {
    if (next.ammo <= 0) {
      if (next.reloadingUntilMs === 0) next.reloadingUntilMs = now + FIGHT_RELOAD_MS
    } else if (next.reloadingUntilMs === 0 || now >= next.reloadingUntilMs) {
      next.ammo -= 1
      next.lastShotAtMs = now
      didShoot = true
      if (next.ammo <= 0) next.reloadingUntilMs = now + FIGHT_RELOAD_MS
    }
  }

  return { fighter: next, didShoot }
}

/** هۆست — یەک تیک یاری لەسەر بنەمای ئینپوتەکان */
export function hostSimulateTick(room: DuelRoom, now: number): DuelRoom {
  if (room.status !== 'active') return room
  const dt = Math.min(0.25, Math.max(0.05, (now - (room.lastTickMs || now)) / 1000))

  let challenger = room.challenger
  let defender = room.defender

  const stepA = stepFighter(challenger, room.inputChallenger, now, dt)
  const stepB = stepFighter(defender, room.inputDefender, now, dt)
  challenger = stepA.fighter
  defender = stepB.fighter

  if (stepA.didShoot && rayHitsFighter(challenger.x, challenger.y, challenger.angle, defender, true)) {
    const dmg = defender.inCover ? Math.round(FIGHT_SHOT_DAMAGE * 0.35) : FIGHT_SHOT_DAMAGE
    defender = { ...defender, hp: Math.max(0, defender.hp - dmg) }
  }
  if (stepB.didShoot && rayHitsFighter(defender.x, defender.y, defender.angle, challenger, true)) {
    const dmg = challenger.inCover ? Math.round(FIGHT_SHOT_DAMAGE * 0.35) : FIGHT_SHOT_DAMAGE
    challenger = { ...challenger, hp: Math.max(0, challenger.hp - dmg) }
  }

  let status: DuelStatus = 'active'
  let outcome: DuelOutcome | null = null
  let winnerUid: string | null = null
  let loserUid: string | null = null

  if (challenger.hp <= 0 || defender.hp <= 0) {
    status = 'finished'
    if (challenger.hp <= 0 && defender.hp <= 0) {
      outcome = 'draw'
    } else if (defender.hp <= 0) {
      outcome = 'challenger_win'
      winnerUid = room.challengerUid
      loserUid = room.defenderUid
    } else {
      outcome = 'defender_win'
      winnerUid = room.defenderUid
      loserUid = room.challengerUid
    }
  } else if (now >= room.endsAtMs) {
    status = 'finished'
    if (challenger.hp === defender.hp) {
      outcome = 'draw'
    } else if (challenger.hp > defender.hp) {
      outcome = 'challenger_win'
      winnerUid = room.challengerUid
      loserUid = room.defenderUid
    } else {
      outcome = 'defender_win'
      winnerUid = room.defenderUid
      loserUid = room.challengerUid
    }
  }

  return {
    ...room,
    challenger,
    defender,
    status,
    outcome,
    winnerUid,
    loserUid,
    lastTickMs: now,
    // پاککردنەوەی ئاڵای تەقە دوای بەکارهێنان
    inputChallenger: room.inputChallenger
      ? { ...room.inputChallenger, shoot: false, medkit: false }
      : null,
    inputDefender: room.inputDefender
      ? { ...room.inputDefender, shoot: false, medkit: false }
      : null,
  }
}

export interface SettleDuelResult {
  outcome: DuelOutcome
  goldAmount: number
  winnerUid: string | null
  loserUid: string | null
  smokeUntilMs: number
  loserBanUntilMs: number
}

/** کۆتایی شەڕ — زێڕ / دوکەڵ / قەدەغە */
export async function settleDuel(duelId: string, settlerUid: string): Promise<SettleDuelResult | null> {
  const duelRef = doc(db, 'duels', duelId)
  const now = Date.now()

  const settled = await runTransaction(db, async tx => {
    const duelSnap = await tx.get(duelRef)
    if (!duelSnap.exists()) return null
    const room = parseDuelRoom(duelSnap.id, duelSnap.data() as Record<string, unknown>)
    if (room.status !== 'finished') return null
    if (room.settled) {
      return {
        outcome: room.outcome ?? 'draw',
        goldAmount: room.goldAmount,
        winnerUid: room.winnerUid,
        loserUid: room.loserUid,
        smokeUntilMs: now + FIGHT_SMOKE_MS,
        loserBanUntilMs: now + FIGHT_LOSER_BAN_MS,
        already: true as const,
      }
    }
    if (settlerUid !== room.hostUid && settlerUid !== room.challengerUid && settlerUid !== room.defenderUid) {
      throw new Error('دەسەڵاتی کۆتاییکردن نییە')
    }

    const outcome = room.outcome ?? 'draw'
    const challengerRef = doc(db, 'users', room.challengerUid)
    const defenderRef = doc(db, 'users', room.defenderUid)
    const [cSnap, dSnap] = await Promise.all([tx.get(challengerRef), tx.get(defenderRef)])
    if (!cSnap.exists() || !dSnap.exists()) throw new Error('هەژمار نەدۆزرایەوە')

    const cData = cSnap.data()
    const dData = dSnap.data()
    const cGold = Number(cData.gold) || 0
    const dGold = Number(dData.gold) || 0

    let goldAmount = 0
    let winnerUid: string | null = room.winnerUid
    let loserUid: string | null = room.loserUid
    const smokeUntilMs = now + FIGHT_SMOKE_MS
    const loserBanUntilMs = now + FIGHT_LOSER_BAN_MS

    const cUpdate: Record<string, unknown> = { updatedAt: serverTimestamp() }
    const dUpdate: Record<string, unknown> = { updatedAt: serverTimestamp() }

    if (outcome !== 'draw' && winnerUid && loserUid) {
      const pool = loserUid === room.challengerUid ? cGold : dGold
      goldAmount = Math.min(pool, Math.round(80 + Math.random() * 180))
      if (goldAmount > 0) {
        if (winnerUid === room.challengerUid) {
          cUpdate.gold = cGold + goldAmount
          dUpdate.gold = Math.max(0, dGold - goldAmount)
        } else {
          dUpdate.gold = dGold + goldAmount
          cUpdate.gold = Math.max(0, cGold - goldAmount)
        }
      }
      if (loserUid === room.challengerUid) cUpdate.fightBanUntilMs = loserBanUntilMs
      else dUpdate.fightBanUntilMs = loserBanUntilMs

      const winnerName = winnerUid === room.challengerUid ? room.challengerName : room.defenderName
      const loserNotif: InboxNotification = {
        id: makeNotificationId('fight'),
        kind: 'fight',
        icon: '⚔️',
        title: 'شەڕی ١v١ — دۆڕان',
        body: `${winnerName} لە ئارێنای شەڕدا بردتەوە${goldAmount ? ` و ${goldAmount.toLocaleString()} زێڕی لێت داگرت` : ''}. قەدەغەی ٢٤ کاتژمێر + دوکەڵ ٥ خولەک.`,
        atMs: now,
        fromUid: winnerUid,
        fromName: winnerName,
        amount: goldAmount,
        currency: 'gold',
      }
      const loserInboxKey = loserUid === room.challengerUid ? 'c' : 'd'
      if (loserInboxKey === 'c') {
        cUpdate.inboxNotifications = [loserNotif, ...parseInboxNotifications(cData.inboxNotifications)].slice(0, 80)
      } else {
        dUpdate.inboxNotifications = [loserNotif, ...parseInboxNotifications(dData.inboxNotifications)].slice(0, 80)
      }
    } else {
      winnerUid = null
      loserUid = null
      const drawNotif = (name: string): InboxNotification => ({
        id: makeNotificationId('fight'),
        kind: 'fight',
        icon: '🤝',
        title: 'شەڕی ١v١ — یەکسان',
        body: `شەڕ لەگەڵ ${name} بە یەکسان کۆتایی هات — هیچ قەدەغەیەک نییە.`,
        atMs: now,
      })
      cUpdate.inboxNotifications = [drawNotif(room.defenderName), ...parseInboxNotifications(cData.inboxNotifications)].slice(0, 80)
      dUpdate.inboxNotifications = [drawNotif(room.challengerName), ...parseInboxNotifications(dData.inboxNotifications)].slice(0, 80)
    }

    tx.update(challengerRef, cUpdate as Record<string, import('firebase/firestore').FieldValue | Partial<unknown>>)
    tx.update(defenderRef, dUpdate as Record<string, import('firebase/firestore').FieldValue | Partial<unknown>>)
    tx.update(duelRef, {
      settled: true,
      goldAmount,
      winnerUid,
      loserUid,
      outcome,
      updatedAt: serverTimestamp(),
    })

    return {
      outcome,
      goldAmount,
      winnerUid,
      loserUid,
      smokeUntilMs,
      loserBanUntilMs,
      already: false as const,
    }
  })

  if (!settled) return null

  // نەخشە — دوکەڵ + پاککردنەوەی LIVE
  const clearLive = async (uid: string, smoke?: number) => {
    const payload: Record<string, unknown> = {
      activeDuelId: null,
      updatedAt: serverTimestamp(),
    }
    if (typeof smoke === 'number') payload.smokeUntilMs = smoke
    await setDoc(doc(db, 'locations', uid), payload, { merge: true })
  }

  const duelSnap = await getDoc(duelRef)
  const room = duelSnap.exists() ? parseDuelRoom(duelSnap.id, duelSnap.data() as Record<string, unknown>) : null
  if (room) {
    if (settled.outcome === 'draw') {
      await Promise.all([clearLive(room.challengerUid), clearLive(room.defenderUid)])
    } else if (settled.loserUid && settled.winnerUid) {
      await Promise.all([
        clearLive(settled.loserUid, settled.smokeUntilMs),
        clearLive(settled.winnerUid),
      ])
    }
  }

  return {
    outcome: settled.outcome,
    goldAmount: settled.goldAmount,
    winnerUid: settled.winnerUid,
    loserUid: settled.loserUid,
    smokeUntilMs: settled.smokeUntilMs,
    loserBanUntilMs: settled.loserBanUntilMs,
  }
}

export type IncomingFightChallenge = {
  duelId: string
  fromUid: string
  fromName: string
  expiresAtMs: number
}

export function parseIncomingFight(raw: unknown): IncomingFightChallenge | null {
  if (raw == null || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  const duelId = String(d.duelId ?? '')
  const fromUid = String(d.fromUid ?? '')
  const fromName = String(d.fromName ?? 'یاریزان')
  const expiresAtMs = Number(d.expiresAtMs) || 0
  if (!duelId || !fromUid || expiresAtMs <= Date.now()) return null
  return { duelId, fromUid, fromName, expiresAtMs }
}

/** بۆ پشکنینی قەدەغەی داواکاری لە کڵایەنت */
export function getChallengeBlockUntil(
  fightChallengeLog: unknown,
  targetUid: string,
  now = Date.now(),
): number {
  const log = parseFightChallengeLog(fightChallengeLog)
  const entry = resolveChallengeEntry(log, targetUid, now)
  return entry.banUntilMs > now ? entry.banUntilMs : 0
}

export function getChallengeRemaining(
  fightChallengeLog: unknown,
  targetUid: string,
  now = Date.now(),
): number {
  const log = parseFightChallengeLog(fightChallengeLog)
  const entry = resolveChallengeEntry(log, targetUid, now)
  if (entry.banUntilMs > now) return 0
  return Math.max(0, FIGHT_MAX_CONSECUTIVE - entry.count)
}
