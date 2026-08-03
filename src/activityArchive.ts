/** ئەرشیفی بەسەرهاتەکان — تۆماری هەمیشەیی جووڵەکانی یاریزان */

export type ActivityKind =
  | 'login'
  | 'logout'
  | 'travel'
  | 'claimDrop'
  | 'shopBuy'
  | 'shopOpen'
  | 'equip'
  | 'confront'
  | 'passClaim'
  | 'gift'
  | 'daily'
  | 'spin'
  | 'message'
  | 'friend'
  | 'settings'
  | 'other'

export interface ActivityEntry {
  id: string
  kind: ActivityKind
  icon: string
  text: string
  atMs: number
}

const MAX_ENTRIES = 500

function storageKey(uid: string) {
  return `kd_activity_archive_${uid}`
}

export function formatActivityAt(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  const weekdays = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە']
  const wd = weekdays[d.getDay()] ?? ''
  return `${wd} ${y}/${mo}/${day} — ${h}:${m}:${s}`
}

export function loadActivityArchive(uid: string | null): ActivityEntry[] {
  if (!uid) return []
  try {
    const raw = localStorage.getItem(storageKey(uid))
    if (!raw) return []
    const parsed = JSON.parse(raw) as ActivityEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveActivityArchive(uid: string | null, entries: ActivityEntry[]) {
  if (!uid) return
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch {}
}

export function appendActivity(
  uid: string | null,
  kind: ActivityKind,
  text: string,
  icon: string,
  atMs = Date.now(),
): ActivityEntry[] {
  if (!uid) return []
  const prev = loadActivityArchive(uid)
  const entry: ActivityEntry = {
    id: `${atMs}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    icon,
    text,
    atMs,
  }
  const next = [entry, ...prev].slice(0, MAX_ENTRIES)
  saveActivityArchive(uid, next)
  return next
}
