/**
 * One-shot: set wallet for in-game playerId
 * Usage: node scripts/set-wallet.mjs 55753921
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore'

const PLAYER_ID = String(process.argv[2] || '55753921').trim()
const GOLD = 999_000
const DIAMOND = 999_000

const firebaseConfig = {
  apiKey: 'AIzaSyCuwXqP2KKz_6Y7yaVmWCr1-qGhaVqC7AM',
  authDomain: 'kurd-drop.firebaseapp.com',
  projectId: 'kurd-drop',
  storageBucket: 'kurd-drop.firebasestorage.app',
  messagingSenderId: '503802495788',
  appId: '1:503802495788:web:05ffbeaa3355558f2d6289',
}

const totalWealth = GOLD + DIAMOND * 50

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function main() {
  await signInAnonymously(auth)

  let uid = ''
  const playerRef = doc(db, 'players', PLAYER_ID)
  const playerSnap = await getDoc(playerRef)

  if (playerSnap.exists()) {
    uid = String(playerSnap.data()?.uid || '')
    console.log('Found players/' + PLAYER_ID, 'uid=', uid || '(none)')
  } else {
    console.log('players/' + PLAYER_ID + ' missing — searching users by playerId…')
    const q = query(collection(db, 'users'), where('playerId', '==', PLAYER_ID), limit(1))
    const qs = await getDocs(q)
    if (qs.empty) {
      // fallback: playerIds mapping collection
      const idSnap = await getDoc(doc(db, 'playerIds', PLAYER_ID))
      if (idSnap.exists()) {
        uid = String(idSnap.data()?.uid || '')
        console.log('Found playerIds/' + PLAYER_ID, 'uid=', uid || '(none)')
      }
    } else {
      uid = qs.docs[0].id
      console.log('Found users/' + uid)
    }
  }

  if (!uid && !playerSnap.exists()) {
    throw new Error('Player ID ' + PLAYER_ID + ' not found in Firestore')
  }

  const patch = {
    playerId: PLAYER_ID,
    gold: GOLD,
    diamond: DIAMOND,
    totalWealth,
    updatedAt: new Date(),
  }
  if (uid) patch.uid = uid

  await setDoc(playerRef, patch, { merge: true })
  console.log('Updated players/' + PLAYER_ID, patch)

  if (uid) {
    await setDoc(doc(db, 'users', uid), patch, { merge: true })
    console.log('Updated users/' + uid, patch)
  }

  const verify = await getDoc(playerRef)
  console.log('VERIFY players/' + PLAYER_ID + ':', {
    gold: verify.data()?.gold,
    diamond: verify.data()?.diamond,
    totalWealth: verify.data()?.totalWealth,
    uid: verify.data()?.uid,
  })
}

main().catch((err) => {
  console.error('FAILED:', err)
  process.exit(1)
})
