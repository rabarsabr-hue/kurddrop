/** کارگە نیشتمانییەکان — کۆگای هاوبەش (Firestore) + سنووری کەسی ٢٤ کاتژمێر */
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  FACTORY_DIAMOND_DAILY_CAP,
  FACTORY_DIAMOND_INTERVAL_MS,
  FACTORY_GOLD_DAILY_CAP,
  FACTORY_GOLD_INTERVAL_MS,
  NATIONAL_FACTORY_BY_ID,
  type FactoryKind,
  type NationalFactory,
} from '../data/nationalFactories'

const COLLECTION = 'nationalFactories'

/** دۆخی کۆگای هاوبەش لەسەر سێرڤەر */
export interface SharedFactoryStock {
  factoryId: string
  kind: FactoryKind
  cityKey: string
  /** کاتی دەستپێکی خولی بەرهەم — stock = floor((now-clock)/interval) */
  stockClockMs: number
  updatedAtMs: number
}

/** سنووری کەسی ڕۆژانە (لەسەر users/{uid} + کاش) */
export interface FactoryProgressState {
  dayKey: string
  goldTakenToday: number
  diamondTakenToday: number
}

function personalStorageKey(uid: string) {
  return `kd_factory_quota_${uid}`
}

export function factoryDayKey(nowMs = Date.now()): string {
  return new Date(nowMs).toISOString().slice(0, 10)
}

export function emptyFactoryProgress(nowMs = Date.now()): FactoryProgressState {
  return {
    dayKey: factoryDayKey(nowMs),
    goldTakenToday: 0,
    diamondTakenToday: 0,
  }
}

export function loadFactoryProgress(uid: string | null): FactoryProgressState {
  if (!uid) return emptyFactoryProgress()
  try {
    const raw = localStorage.getItem(personalStorageKey(uid))
    if (!raw) return emptyFactoryProgress()
    const parsed = JSON.parse(raw) as Partial<FactoryProgressState>
    const day = typeof parsed.dayKey === 'string' ? parsed.dayKey : factoryDayKey()
    const today = factoryDayKey()
    if (day !== today) return emptyFactoryProgress()
    return {
      dayKey: day,
      goldTakenToday: Math.max(0, Math.floor(Number(parsed.goldTakenToday) || 0)),
      diamondTakenToday: Math.max(0, Math.floor(Number(parsed.diamondTakenToday) || 0)),
    }
  } catch {
    return emptyFactoryProgress()
  }
}

export function saveFactoryProgress(uid: string | null, state: FactoryProgressState) {
  if (!uid) return
  try {
    localStorage.setItem(personalStorageKey(uid), JSON.stringify(state))
  } catch { /* ignore */ }
}

export function dailyCapForKind(kind: FactoryKind): number {
  return kind === 'gold' ? FACTORY_GOLD_DAILY_CAP : FACTORY_DIAMOND_DAILY_CAP
}

export function dailyLimitForKind(kind: FactoryKind): number {
  return dailyCapForKind(kind)
}

export function amountTakenToday(state: FactoryProgressState, kind: FactoryKind): number {
  const today = factoryDayKey()
  if (state.dayKey !== today) return 0
  return kind === 'gold' ? state.goldTakenToday : state.diamondTakenToday
}

export function amountRemainingToday(state: FactoryProgressState, kind: FactoryKind): number {
  return Math.max(0, dailyCapForKind(kind) - amountTakenToday(state, kind))
}

export function collectsRemainingToday(state: FactoryProgressState, kind: FactoryKind): number {
  return amountRemainingToday(state, kind)
}

export function factoryIntervalMs(kind: FactoryKind): number {
  return kind === 'gold' ? FACTORY_GOLD_INTERVAL_MS : FACTORY_DIAMOND_INTERVAL_MS
}

/** بڕی ئامادە لە کۆگای هاوبەش */
export function sharedStockAmount(stockClockMs: number, kind: FactoryKind, nowMs = Date.now()): number {
  const start = Number(stockClockMs) || 0
  if (start <= 0) return 0
  const elapsed = Math.max(0, nowMs - start)
  return Math.floor(elapsed / factoryIntervalMs(kind))
}

export function producedAmountFromStock(stock: SharedFactoryStock | null, nowMs = Date.now()): number {
  if (!stock) return 0
  return sharedStockAmount(stock.stockClockMs, stock.kind, nowMs)
}

/** بڕی ئامادە بۆ تۆ = min(کۆگای هاوبەش، سنووری کەسی) */
export function pendingAmountForFactory(
  factory: NationalFactory,
  stock: SharedFactoryStock | null,
  personal: FactoryProgressState,
  nowMs = Date.now(),
): number {
  const produced = stock && stock.factoryId === factory.id
    ? producedAmountFromStock(stock, nowMs)
    : 0
  return Math.min(produced, amountRemainingToday(personal, factory.kind))
}

export function msUntilNextFactoryUnit(
  stock: SharedFactoryStock | null,
  kind: FactoryKind,
  nowMs = Date.now(),
): number {
  const interval = factoryIntervalMs(kind)
  const start = Number(stock?.stockClockMs) || 0
  if (start <= 0) return interval
  const elapsed = Math.max(0, nowMs - start)
  const into = elapsed % interval
  if (into === 0 && elapsed > 0) return interval
  return into === 0 ? interval : interval - into
}

export function formatFactoryCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatFactoryWaitKu(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m <= 0) return `${s} چرکە`
  if (s <= 0) return `${m} خولەک`
  return `${m} خولەک و ${s} چرکە`
}

export function factoryCycleProgress(
  stock: SharedFactoryStock | null,
  kind: FactoryKind,
  nowMs = Date.now(),
): number {
  const interval = factoryIntervalMs(kind)
  const wait = msUntilNextFactoryUnit(stock, kind, nowMs)
  return Math.max(0, Math.min(1, 1 - wait / interval))
}

function parseStockSnap(
  factoryId: string,
  data: Record<string, unknown> | undefined,
  fallbackKind: FactoryKind,
  fallbackCity: string,
): SharedFactoryStock {
  const now = Date.now()
  return {
    factoryId,
    kind: data?.kind === 'diamond' || data?.kind === 'gold' ? data.kind : fallbackKind,
    cityKey: typeof data?.cityKey === 'string' ? data.cityKey : fallbackCity,
    stockClockMs: Math.max(0, Math.floor(Number(data?.stockClockMs) || now)),
    updatedAtMs: Math.max(0, Math.floor(Number(data?.updatedAtMs) || now)),
  }
}

/** دروستکردنی دۆکی هاوبەش ئەگەر نەبێت */
export async function ensureFactoryStockDoc(factoryId: string): Promise<SharedFactoryStock> {
  const factory = NATIONAL_FACTORY_BY_ID[factoryId]
  if (!factory) throw new Error('کارگەکە نەدۆزرایەوە')

  const ref = doc(db, COLLECTION, factoryId)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return parseStockSnap(factoryId, snap.data() as Record<string, unknown>, factory.kind, factory.cityKey)
  }

  const now = Date.now()
  const payload = {
    kind: factory.kind,
    cityKey: factory.cityKey,
    stockClockMs: now,
    updatedAtMs: now,
    createdAt: serverTimestamp(),
  }
  try {
    await setDoc(ref, payload, { merge: true })
  } catch (err) {
    // ڕەقەبەری دروستکردن — دووبارە بخوێنەوە
    const again = await getDoc(ref)
    if (again.exists()) {
      return parseStockSnap(factoryId, again.data() as Record<string, unknown>, factory.kind, factory.cityKey)
    }
    throw err
  }
  return {
    factoryId,
    kind: factory.kind,
    cityKey: factory.cityKey,
    stockClockMs: now,
    updatedAtMs: now,
  }
}

/** گوێگرتنی ڕاستەوخۆ لە کۆگای هاوبەش */
export function subscribeFactoryStock(
  factoryId: string,
  onData: (stock: SharedFactoryStock) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const factory = NATIONAL_FACTORY_BY_ID[factoryId]
  const ref = doc(db, COLLECTION, factoryId)
  return onSnapshot(
    ref,
    snap => {
      if (!snap.exists()) {
        if (factory) {
          onData({
            factoryId,
            kind: factory.kind,
            cityKey: factory.cityKey,
            stockClockMs: Date.now(),
            updatedAtMs: Date.now(),
          })
        }
        return
      }
      onData(parseStockSnap(
        factoryId,
        snap.data() as Record<string, unknown>,
        factory?.kind ?? 'gold',
        factory?.cityKey ?? '',
      ))
    },
    err => {
      console.error('Factory stock subscribe failed:', err)
      onError?.(err)
    },
  )
}

export type FactoryCollectResult =
  | {
      ok: true
      amount: number
      kind: FactoryKind
      gold: number
      diamond: number
      stock: SharedFactoryStock
      personal: FactoryProgressState
    }
  | {
      ok: false
      reason: 'empty' | 'limit' | 'missing' | 'error' | 'pass'
      message: string
      stock?: SharedFactoryStock
      personal?: FactoryProgressState
    }

function userOwnsKurdistanPass(user: Record<string, unknown>): boolean {
  const vip = user.vipPasses
  if (vip == null || typeof vip !== 'object' || Array.isArray(vip)) return false
  const master = (vip as Record<string, unknown>).master
  if (master == null || typeof master !== 'object' || Array.isArray(master)) return false
  return Boolean((master as Record<string, unknown>).owned)
}

/** کۆکردنەوەی گشتی — کۆگا کەم دەبێتەوە بۆ هەمووان */
export async function claimFromNationalFactory(
  uid: string,
  factoryId: string,
): Promise<FactoryCollectResult> {
  const factory = NATIONAL_FACTORY_BY_ID[factoryId]
  if (!factory) {
    return { ok: false, reason: 'missing', message: 'کارگەکە نەدۆزرایەوە' }
  }
  if (!uid) {
    return { ok: false, reason: 'error', message: 'چوونەژوورەوە پێویستە' }
  }

  const factoryRef = doc(db, COLLECTION, factoryId)
  const userRef = doc(db, 'users', uid)

  try {
    return await runTransaction(db, async (transaction) => {
      const factorySnap = await transaction.get(factoryRef)
      const userSnap = await transaction.get(userRef)
      const now = Date.now()
      const today = factoryDayKey(now)
      const interval = factoryIntervalMs(factory.kind)

      let stockClockMs: number
      if (!factorySnap.exists()) {
        stockClockMs = now
      } else {
        stockClockMs = Math.max(0, Math.floor(Number(factorySnap.data()?.stockClockMs) || now))
      }

      const stock = sharedStockAmount(stockClockMs, factory.kind, now)
      const user = userSnap.exists() ? (userSnap.data() as Record<string, unknown>) : {}

      if (!userOwnsKurdistanPass(user)) {
        return {
          ok: false as const,
          reason: 'pass' as const,
          message: 'تەنها بەشداربووانی ڕێڕەوی کوردستان دەتوانن لە کارگە پارە ببەن',
        }
      }

      const userDay = typeof user.factoryDayKey === 'string' ? user.factoryDayKey : ''
      let goldTaken = Math.max(0, Math.floor(Number(user.factoryGoldTakenToday) || 0))
      let diamondTaken = Math.max(0, Math.floor(Number(user.factoryDiamondTakenToday) || 0))
      if (userDay !== today) {
        goldTaken = 0
        diamondTaken = 0
      }

      const personal: FactoryProgressState = {
        dayKey: today,
        goldTakenToday: goldTaken,
        diamondTakenToday: diamondTaken,
      }
      const remaining = amountRemainingToday(personal, factory.kind)
      if (remaining <= 0) {
        const lim = dailyCapForKind(factory.kind)
        return {
          ok: false as const,
          reason: 'limit' as const,
          message:
            factory.kind === 'gold'
              ? `سنووری ٢٤ کاتژمێر تەواو بوو — ناتوانیت زیاتر لە ${lim} زێڕ ببەیت`
              : `سنووری ٢٤ کاتژمێر تەواو بوو — ناتوانیت زیاتر لە ${lim} ئەڵماس ببەیت`,
          stock: {
            factoryId,
            kind: factory.kind,
            cityKey: factory.cityKey,
            stockClockMs,
            updatedAtMs: now,
          },
          personal,
        }
      }

      const amount = Math.min(stock, remaining)
      if (amount <= 0) {
        return {
          ok: false as const,
          reason: 'empty' as const,
          message: 'کۆگا بەتاڵە — چاوەڕێ بکە تا بەرهەمی نوێ دێت',
          stock: {
            factoryId,
            kind: factory.kind,
            cityKey: factory.cityKey,
            stockClockMs,
            updatedAtMs: now,
          },
          personal,
        }
      }

      const leftover = Math.max(0, stock - amount)
      const nextClock = now - leftover * interval
      const nextStock: SharedFactoryStock = {
        factoryId,
        kind: factory.kind,
        cityKey: factory.cityKey,
        stockClockMs: nextClock,
        updatedAtMs: now,
      }

      transaction.set(factoryRef, {
        kind: factory.kind,
        cityKey: factory.cityKey,
        stockClockMs: nextClock,
        updatedAtMs: now,
        updatedAt: serverTimestamp(),
        lastClaimBy: uid,
        lastClaimAmount: amount,
        lastClaimAtMs: now,
      }, { merge: true })

      const nextGold = (Number(user.gold) || 0) + (factory.kind === 'gold' ? amount : 0)
      const nextDiamond = (Number(user.diamond) || 0) + (factory.kind === 'diamond' ? amount : 0)
      const nextPersonal: FactoryProgressState = {
        dayKey: today,
        goldTakenToday: goldTaken + (factory.kind === 'gold' ? amount : 0),
        diamondTakenToday: diamondTaken + (factory.kind === 'diamond' ? amount : 0),
      }

      transaction.set(userRef, {
        gold: nextGold,
        diamond: nextDiamond,
        factoryDayKey: today,
        factoryGoldTakenToday: nextPersonal.goldTakenToday,
        factoryDiamondTakenToday: nextPersonal.diamondTakenToday,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      return {
        ok: true as const,
        amount,
        kind: factory.kind,
        gold: nextGold,
        diamond: nextDiamond,
        stock: nextStock,
        personal: nextPersonal,
      }
    })
  } catch (err) {
    console.error('claimFromNationalFactory failed:', err)
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'کۆکردنەوە سەرکەوتوو نەبوو — دووبارە هەوڵبدەوە',
    }
  }
}

/** @deprecated — کۆن؛ ئێستا claimFromNationalFactory */
export function collectFromFactory(
  _uid: string | null,
  _factoryId: string,
): FactoryCollectResult {
  return { ok: false, reason: 'error', message: 'تکایە دووبارە هەوڵبدەوە' }
}

/** @deprecated */
export function ensureFactoryProductionStarted(
  uid: string | null,
  _factoryId: string,
): FactoryProgressState {
  return loadFactoryProgress(uid)
}

/** @deprecated — بە producedAmountFromStock */
export function producedAmountForFactory(
  factory: NationalFactory,
  stockOrState: SharedFactoryStock | FactoryProgressState | null,
  nowMs = Date.now(),
): number {
  if (stockOrState && 'stockClockMs' in stockOrState) {
    return producedAmountFromStock(stockOrState, nowMs)
  }
  return 0
}
