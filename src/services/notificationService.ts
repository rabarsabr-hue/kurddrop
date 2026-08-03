/** ناوەندی ئاگادارییەکان — لیستی یەکگرتوو + دۆخی خوێندنەوە (local) */

export type NotificationKind =
  | 'steal'
  | 'heist'
  | 'message'
  | 'block'
  | 'unblock'
  | 'friend_request'
  | 'gift'
  | 'fight'
  | 'other'

export interface InboxNotification {
  id: string
  kind: NotificationKind
  /** ئیمۆجی پیشاندان */
  icon: string
  title: string
  body: string
  atMs: number
  fromUid?: string
  fromName?: string
  amount?: number
  currency?: 'gold' | 'diamond'
  /** دزی — بڕی زێڕ / ئەڵماس (بۆ تۆڵەی 2x) */
  goldAmount?: number
  diamondAmount?: number
  /** تۆڵەسەندنەوە جارێک بەکارهاتووە */
  revengeClaimed?: boolean
  /** ئاگاداری دزی لە کاتی ڕوودان — قبوڵ/ڕەت */
  heistId?: string
  heistMode?: 'online' | 'offline'
  heistResolved?: boolean
  /** بۆ نامە — ناسنامەی چات */
  threadPartnerUid?: string
  /** بۆ داواکاری هاوڕێیەتی */
  friendRequestId?: string
}

const MAX_INBOX = 80
const READ_KEY = (uid: string) => `kd_notif_read_${uid}`

const ALLOWED_KINDS: NotificationKind[] = [
  'steal', 'heist', 'message', 'block', 'unblock', 'friend_request', 'gift', 'fight', 'other',
]

export function parseInboxNotifications(raw: unknown): InboxNotification[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
    .map(x => {
      const kind = String(x.kind ?? 'other') as NotificationKind
      return {
        id: String(x.id ?? ''),
        kind: ALLOWED_KINDS.includes(kind) ? kind : 'other',
        icon: String(x.icon ?? '🔔'),
        title: String(x.title ?? 'ئاگاداری'),
        body: String(x.body ?? ''),
        atMs: Number(x.atMs) || 0,
        fromUid: typeof x.fromUid === 'string' ? x.fromUid : undefined,
        fromName: typeof x.fromName === 'string' ? x.fromName : undefined,
        amount: typeof x.amount === 'number' ? x.amount : undefined,
        currency: x.currency === 'gold' || x.currency === 'diamond' ? x.currency : undefined,
        goldAmount: typeof x.goldAmount === 'number' ? x.goldAmount : undefined,
        diamondAmount: typeof x.diamondAmount === 'number' ? x.diamondAmount : undefined,
        revengeClaimed: x.revengeClaimed === true,
        heistId: typeof x.heistId === 'string' ? x.heistId : undefined,
        heistMode: x.heistMode === 'online' || x.heistMode === 'offline' ? x.heistMode : undefined,
        heistResolved: x.heistResolved === true,
        threadPartnerUid: typeof x.threadPartnerUid === 'string' ? x.threadPartnerUid : undefined,
        friendRequestId: typeof x.friendRequestId === 'string' ? x.friendRequestId : undefined,
      } satisfies InboxNotification
    })
    .filter(n => n.id)
    .sort((a, b) => b.atMs - a.atMs)
    .slice(0, MAX_INBOX)
}

export function makeNotificationId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function loadReadNotificationIds(uid: string | null): Set<string> {
  if (!uid) return new Set()
  try {
    const raw = localStorage.getItem(READ_KEY(uid))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed.map(String) : [])
  } catch {
    return new Set()
  }
}

export function saveReadNotificationIds(uid: string | null, ids: Set<string>) {
  if (!uid) return
  try {
    const list = [...ids].slice(-400)
    localStorage.setItem(READ_KEY(uid), JSON.stringify(list))
  } catch {}
}

export function markNotificationRead(uid: string | null, id: string, prev: Set<string>): Set<string> {
  if (!uid || !id) return prev
  const next = new Set(prev)
  next.add(id)
  saveReadNotificationIds(uid, next)
  return next
}

export function markAllNotificationsRead(uid: string | null, allIds: string[], prev: Set<string>): Set<string> {
  if (!uid) return prev
  const next = new Set(prev)
  for (const id of allIds) next.add(id)
  saveReadNotificationIds(uid, next)
  return next
}

export function formatNotifTime(ms: number): string {
  if (!ms) return ''
  const d = new Date(ms)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${mo} ${h}:${m}`
}
