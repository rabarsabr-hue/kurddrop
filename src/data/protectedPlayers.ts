/**
 * هەژماری تایبەت — تەنها باڵانسی زێڕ/ئەڵماس جێگیرە.
 * لەسەر نەخشە و کارلێک وەک یاریزانی ئاسایی دەردەکەوێت؛ شوێن بە GPS ـی خاوەن هەژمار.
 */

/** باڵانسی جێگیری هەژماری تایبەت — هەرگیز کەم نابێتەوە */
export const PROTECTED_LOCKED_GOLD = 999999
export const PROTECTED_LOCKED_DIAMOND = 99999

/** ئایدی ژمارەیی تایبەت */
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

/** زێڕ/ئەڵماس بۆ هەژماری تایبەت هەمیشە جێگیر دەکاتەوە */
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
