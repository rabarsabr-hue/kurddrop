/**
 * هەژمارە پارێزراوەکان — ناتوانرێت بلۆک/دیاری/کلیک بکرێن.
 * زێڕ/ئەڵماس جێگیرن و بە خەرجکردن کەم نابن.
 * شوێن بە GPS ـی ڕاستەقینەی خاوەن هەژمار دیاری دەکرێت.
 */

/** قەڵای هەولێر — ناوەند (بۆ ئاماژەی نەخشە / کارگە — نا بۆ قفڵکردنی GPS) */
export const CITADEL_ANCHOR = {
  lat: 36.1911,
  lng: 44.0092,
} as const

/** باڵانسی جێگیری هەژماری پارێزراو — هەرگیز کەم نابێتەوە */
export const PROTECTED_LOCKED_GOLD = 99999
export const PROTECTED_LOCKED_DIAMOND = 99999

/** ئایدی ژمارەیی پارێزراو */
export const PROTECTED_PLAYER_IDS = new Set<string>(['00000001'])

/** Firebase uid ـی ناسراو (بۆ کاتێک playerId لە location نەبێت) */
export const PROTECTED_UIDS = new Set<string>([
  'nHYVSaneG0NXymErkylh69o3twl1',
])

export function isProtectedPlayerId(playerId: string | null | undefined): boolean {
  if (typeof playerId !== 'string') return false
  const id = playerId.trim()
  return id.length > 0 && PROTECTED_PLAYER_IDS.has(id)
}

export function isProtectedUid(uid: string | null | undefined): boolean {
  if (typeof uid !== 'string') return false
  const id = uid.trim()
  return id.length > 0 && PROTECTED_UIDS.has(id)
}

export function isProtectedAccount(opts: {
  uid?: string | null
  playerId?: string | null
}): boolean {
  return isProtectedUid(opts.uid) || isProtectedPlayerId(opts.playerId)
}

export function citadelCoords(): { lat: number; lng: number } {
  return { lat: CITADEL_ANCHOR.lat, lng: CITADEL_ANCHOR.lng }
}

/** زێڕ/ئەڵماس بۆ هەژماری پارێزراو هەمیشە جێگیر دەکاتەوە */
export function lockProtectedWallet<T extends { gold: number; diamond: number }>(
  wallet: T,
  opts?: { uid?: string | null; playerId?: string | null },
): T {
  if (opts && !isProtectedAccount(opts)) return wallet
  if (
    wallet.gold === PROTECTED_LOCKED_GOLD
    && wallet.diamond === PROTECTED_LOCKED_DIAMOND
  ) {
    return wallet
  }
  return {
    ...wallet,
    gold: PROTECTED_LOCKED_GOLD,
    diamond: PROTECTED_LOCKED_DIAMOND,
  }
}
