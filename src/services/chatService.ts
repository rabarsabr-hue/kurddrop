import {
  collection,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export const MAP_CHAT_MAX_LEN = 100
/** کەمترین / زۆرترین مانەوەی بڵقی نامەی سەر سەر (٧–١٠ چرکە) */
export const MAP_CHAT_BUBBLE_MS_MIN = 7_000
export const MAP_CHAT_BUBBLE_MS = 10_000

/** ماوەی هەڕەمەکی مانەوەی بڵق: ٧٬٠٠٠–١٠٬٠٠٠ms */
export function randomMapChatBubbleMs(): number {
  return MAP_CHAT_BUBBLE_MS_MIN
    + Math.floor(Math.random() * (MAP_CHAT_BUBBLE_MS - MAP_CHAT_BUBBLE_MS_MIN + 1))
}

export interface ChatMessage {
  id: string
  uid: string
  name: string
  text: string
  createdAtMs: number
}

export interface MapChatMessage {
  id: string
  uid: string
  name: string
  text: string
  isPremium: boolean
  createdAtMs: number
  expiresAtMs: number
  /** دۆخی تارمایی — چاتی گشتی: تەنها نێرەر خۆی دەیبینێت، کەسانی تر نا */
  hiddenFromOthers?: boolean
}

export async function sendChatMessage(uid: string, name: string, text: string) {
  const trimmed = text.trim()
  if (!trimmed) return

  const createdAtMs = Date.now()
  await addDoc(collection(db, 'messages'), {
    uid,
    name,
    text: trimmed.slice(0, 200),
    createdAt: serverTimestamp(),
    createdAtMs,
  })
}

export function subscribeToChat(onUpdate: (messages: ChatMessage[]) => void): () => void {
  return onSnapshot(collection(db, 'messages'), (snap) => {
    const messages: ChatMessage[] = []
    snap.forEach(docSnap => {
      const data = docSnap.data()
      messages.push({
        id: docSnap.id,
        uid: data.uid ?? '',
        name: data.name ?? 'یاریزان',
        text: data.text ?? '',
        createdAtMs: typeof data.createdAtMs === 'number'
          ? data.createdAtMs
          : data.createdAt?.toMillis?.() ?? 0,
      })
    })
    messages.sort((a, b) => a.createdAtMs - b.createdAtMs)
    onUpdate(messages.slice(-50))
  }, err => console.error('Chat listener failed:', err))
}

export async function sendMapChatMessage(input: {
  uid: string
  name: string
  text: string
  isPremium: boolean
  /** In-game Player ID shown in profile (audit / daily review) */
  playerId?: string
  /** دۆخی تارمایی — چاتی گشتی: تەنها نێرەر خۆی دەیبینێت، کەسانی تر نا */
  hiddenFromOthers?: boolean
}): Promise<MapChatMessage | null> {
  const trimmed = input.text.trim().slice(0, MAP_CHAT_MAX_LEN)
  if (!trimmed) return null

  const createdAtMs = Date.now()
  const expiresAtMs = createdAtMs + randomMapChatBubbleMs()
  const userName = input.name.trim() || 'یاریزان'
  const playerId = typeof input.playerId === 'string' ? input.playerId.trim() : ''
  const hiddenFromOthers = Boolean(input.hiddenFromOthers)
  const payload = {
    uid: input.uid,
    name: userName,
    playerId,
    text: trimmed,
    isPremium: Boolean(input.isPremium),
    createdAtMs,
    expiresAtMs,
    hiddenFromOthers,
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, 'mapChat'), payload)

  // Secure audit log for daily review — keyed by message id
  try {
    await setDoc(doc(db, 'chat_logs', ref.id), {
      playerId,
      userName,
      text: trimmed,
      timestamp: serverTimestamp(),
      uid: input.uid,
      createdAtMs,
      isPremium: Boolean(input.isPremium),
    })
  } catch (err) {
    console.error('chat_logs audit write failed:', err)
  }

  return {
    id: ref.id,
    uid: payload.uid,
    name: payload.name,
    text: payload.text,
    isPremium: payload.isPremium,
    createdAtMs,
    expiresAtMs,
    hiddenFromOthers,
  }
}

export function subscribeToMapChat(
  onUpdate: (messages: MapChatMessage[]) => void,
): () => void {
  return onSnapshot(collection(db, 'mapChat'), (snap) => {
    const now = Date.now()
    const messages: MapChatMessage[] = []
    snap.forEach(docSnap => {
      const data = docSnap.data()
      const createdAtMs = typeof data.createdAtMs === 'number'
        ? data.createdAtMs
        : data.createdAt?.toMillis?.() ?? 0
      const expiresAtMs = typeof data.expiresAtMs === 'number'
        ? data.expiresAtMs
        : createdAtMs + MAP_CHAT_BUBBLE_MS
      // تەنها نامە تازەکان (٥ چرکە + کەمێک بافەر)
      if (createdAtMs < now - MAP_CHAT_BUBBLE_MS - 3_000) return
      if (expiresAtMs <= now - 800) return
      const text = String(data.text ?? '').slice(0, MAP_CHAT_MAX_LEN)
      if (!text) return
      messages.push({
        id: docSnap.id,
        uid: String(data.uid ?? ''),
        name: String(data.name ?? 'یاریزان'),
        text,
        isPremium: Boolean(data.isPremium),
        createdAtMs,
        expiresAtMs,
        hiddenFromOthers: data.hiddenFromOthers === true,
      })
    })
    messages.sort((a, b) => a.createdAtMs - b.createdAtMs)
    onUpdate(messages.slice(-30))
  }, err => console.error('Map chat listener failed:', err))
}
