/**
 * Admin: migrate playerId + set wallet / max hunter / player level.
 * Usage: node scripts/migrate-player-admin.mjs
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp,
} from 'firebase/firestore'

const OLD_ID = '55753921'
const NEW_ID = '00000001'
const GOLD = 999
const DIAMOND = 999
const PLAYER_LEVEL = 99
/** کۆتا پلەی ڕاوکەر (ئەفسانە = ١١) */
const HUNTER_LEVEL = 11

const firebaseConfig = {
  apiKey: 'AIzaSyCuwXqP2KKz_6Y7yaVmWCr1-qGhaVqC7AM',
  authDomain: 'kurd-drop.firebaseapp.com',
  projectId: 'kurd-drop',
  storageBucket: 'kurd-drop.firebasestorage.app',
  messagingSenderId: '503802495788',
  appId: '1:503802495788:web:05ffbeaa3355558f2d6289',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const totalWealth = GOLD + DIAMOND * 50
const dropsOpenedByType = { 1: 0, 2: 0, 3: 0, 4: 0, 5: HUNTER_LEVEL }

async function main() {
  await signInAnonymously(auth)
  console.log('auth ok')

  // ── resolve uid ──
  let uid = ''
  let existing = {}

  const oldPlayerSnap = await getDoc(doc(db, 'players', OLD_ID))
  if (oldPlayerSnap.exists()) {
    existing = { ...oldPlayerSnap.data() }
    uid = String(existing.uid || '')
    console.log('found players/' + OLD_ID, 'uid=', uid, 'name=', existing.name)
  }

  if (!uid) {
    const idSnap = await getDoc(doc(db, 'playerIds', OLD_ID))
    if (idSnap.exists()) {
      uid = String(idSnap.data()?.uid || '')
      console.log('found playerIds/' + OLD_ID, 'uid=', uid)
    }
  }

  if (!uid) {
    const qs = await getDocs(
      query(collection(db, 'users'), where('playerId', '==', OLD_ID), limit(1)),
    )
    if (!qs.empty) {
      uid = qs.docs[0].id
      existing = { ...existing, ...qs.docs[0].data() }
      console.log('found users/' + uid)
    }
  }

  if (!uid) {
    throw new Error('Could not resolve uid for playerId ' + OLD_ID)
  }

  const userSnap = await getDoc(doc(db, 'users', uid))
  if (userSnap.exists()) {
    existing = { ...existing, ...userSnap.data() }
  }

  // conflict check
  const newIdMap = await getDoc(doc(db, 'playerIds', NEW_ID))
  if (newIdMap.exists()) {
    const otherUid = String(newIdMap.data()?.uid || '')
    if (otherUid && otherUid !== uid) {
      throw new Error('playerIds/' + NEW_ID + ' already taken by uid=' + otherUid)
    }
  }
  const newPlayerSnap = await getDoc(doc(db, 'players', NEW_ID))
  if (newPlayerSnap.exists()) {
    const otherUid = String(newPlayerSnap.data()?.uid || '')
    if (otherUid && otherUid !== uid) {
      throw new Error('players/' + NEW_ID + ' already taken by uid=' + otherUid)
    }
  }

  // preserve spend / gifter / wealth extras — only overwrite requested fields
  const patch = {
    uid,
    playerId: NEW_ID,
    name: typeof existing.name === 'string' && existing.name.trim() ? existing.name.trim() : 'یاریزان',
    username: typeof existing.username === 'string' ? existing.username : '',
    gender: existing.gender === 'female' ? 'female' : 'male',
    gold: GOLD,
    diamond: DIAMOND,
    totalWealth,
    playerLevel: PLAYER_LEVEL,
    playerXp: 0,
    hunterLevel: HUNTER_LEVEL,
    dropsOpenedByType,
    // keep prior spend-related scores if present
    ...(typeof existing.giftsSentScore === 'number'
      ? { giftsSentScore: existing.giftsSentScore }
      : {}),
    ...(existing.stats && typeof existing.stats === 'object' ? { stats: existing.stats } : {}),
    ...(Array.isArray(existing.inventory) ? { inventory: existing.inventory } : {}),
    ...(existing.avatar3d ? { avatar3d: existing.avatar3d } : {}),
    ...(existing.avatarUrl !== undefined ? { avatarUrl: existing.avatarUrl } : {}),
    ...(typeof existing.title === 'string' ? { title: existing.title } : {}),
    updatedAt: serverTimestamp(),
  }

  // 1) reserve new playerId mapping
  await setDoc(doc(db, 'playerIds', NEW_ID), {
    uid,
    createdAt: serverTimestamp(),
    migratedFrom: OLD_ID,
  }, { merge: true })
  console.log('set playerIds/' + NEW_ID)

  // 2) write new players doc (merge with any existing new id for same uid)
  const baseNew = newPlayerSnap.exists() ? newPlayerSnap.data() : {}
  await setDoc(doc(db, 'players', NEW_ID), { ...baseNew, ...patch }, { merge: true })
  console.log('set players/' + NEW_ID)

  // 3) update user doc
  await setDoc(doc(db, 'users', uid), patch, { merge: true })
  console.log('set users/' + uid)

  // 4) remove old mapping + old players doc
  try {
    await deleteDoc(doc(db, 'playerIds', OLD_ID))
    console.log('deleted playerIds/' + OLD_ID)
  } catch (e) {
    console.warn('could not delete playerIds/' + OLD_ID, e?.message || e)
  }
  try {
    await deleteDoc(doc(db, 'players', OLD_ID))
    console.log('deleted players/' + OLD_ID)
  } catch (e) {
    console.warn('could not delete players/' + OLD_ID, e?.message || e)
  }

  // verify
  const vUser = await getDoc(doc(db, 'users', uid))
  const vPlayer = await getDoc(doc(db, 'players', NEW_ID))
  console.log('VERIFY users:', {
    playerId: vUser.data()?.playerId,
    gold: vUser.data()?.gold,
    diamond: vUser.data()?.diamond,
    playerLevel: vUser.data()?.playerLevel,
    hunterLevel: vUser.data()?.hunterLevel,
  })
  console.log('VERIFY players:', {
    playerId: vPlayer.data()?.playerId,
    gold: vPlayer.data()?.gold,
    diamond: vPlayer.data()?.diamond,
    playerLevel: vPlayer.data()?.playerLevel,
    hunterLevel: vPlayer.data()?.hunterLevel,
  })
  console.log('DONE', { uid, oldId: OLD_ID, newId: NEW_ID })
}

main().catch((err) => {
  console.error('FAILED:', err)
  process.exit(1)
})
