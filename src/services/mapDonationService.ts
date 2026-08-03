import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export interface MapDonationEvent {
  id: string
  fromUid: string
  toUid: string
  itemId: string
  emoji: string
  goldCost: number
  diamondCost: number
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  startMs: number
}

function parseMapDonationDoc(id: string, data: Record<string, unknown>): MapDonationEvent | null {
  const fromLat = Number(data.fromLat)
  const fromLng = Number(data.fromLng)
  const toLat = Number(data.toLat)
  const toLng = Number(data.toLng)
  const startMs = Number(data.startMs)
  if (!Number.isFinite(fromLat) || !Number.isFinite(fromLng) || !Number.isFinite(toLat) || !Number.isFinite(toLng)) {
    return null
  }
  if (!Number.isFinite(startMs)) return null
  const fromUid = typeof data.fromUid === 'string' ? data.fromUid : ''
  const toUid = typeof data.toUid === 'string' ? data.toUid : ''
  if (!fromUid || !toUid) return null
  return {
    id,
    fromUid,
    toUid,
    itemId: typeof data.itemId === 'string' ? data.itemId : 'gift',
    emoji: typeof data.emoji === 'string' ? data.emoji : '🎁',
    goldCost: Math.max(0, Math.floor(Number(data.goldCost) || 0)),
    diamondCost: Math.max(0, Math.floor(Number(data.diamondCost) || 0)),
    fromLat,
    fromLng,
    toLat,
    toLng,
    startMs,
  }
}

/** بڵاوکردنەوەی بەخشین بۆ هەموو بینەرانی نەخشە */
export async function publishMapDonation(
  event: Omit<MapDonationEvent, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'mapDonations'), {
    fromUid: event.fromUid,
    toUid: event.toUid,
    itemId: event.itemId,
    emoji: event.emoji,
    goldCost: event.goldCost,
    diamondCost: event.diamondCost ?? 0,
    fromLat: event.fromLat,
    fromLng: event.fromLng,
    toLat: event.toLat,
    toLng: event.toLng,
    startMs: event.startMs,
    createdAt: serverTimestamp(),
    createdAtMs: event.startMs,
  })
  return ref.id
}

/** گوێگرتن لە بەخشینە نوێیەکانی نەخشە (globalEvents) */
export function subscribeToMapDonations(
  sessionStartMs: number,
  onEvent: (event: MapDonationEvent) => void,
): () => void {
  const seen = new Set<string>()
  return onSnapshot(
    collection(db, 'mapDonations'),
    snap => {
      snap.docChanges().forEach(change => {
        if (change.type !== 'added') return
        const ev = parseMapDonationDoc(change.doc.id, change.doc.data() as Record<string, unknown>)
        if (!ev) return
        if (ev.startMs < sessionStartMs - 5000) return
        if (seen.has(ev.id)) return
        seen.add(ev.id)
        onEvent(ev)
      })
    },
    err => console.error('Map donations listener failed:', err),
  )
}
