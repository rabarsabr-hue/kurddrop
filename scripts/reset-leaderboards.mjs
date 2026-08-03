/**
 * Reset all leaderboard rankings (wealth / level / gifters) on players + users.
 * Usage: node scripts/reset-leaderboards.mjs
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCuwXqP2KKz_6Y7yaVmWCr1-qGhaVqC7AM',
  authDomain: 'kurd-drop.firebaseapp.com',
  projectId: 'kurd-drop',
  storageBucket: 'kurd-drop.firebasestorage.app',
  messagingSenderId: '503802495788',
  appId: '1:503802495788:web:05ffbeaa3355558f2d6289',
}

const LEADERBOARD_EPOCH = 3
const WELCOME_GOLD = 500
const WELCOME_DIAMOND = 35

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function flushBatches(refs, buildPatch) {
  let n = 0
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db)
    const slice = refs.slice(i, i + 400)
    for (const { ref, data } of slice) {
      batch.set(ref, buildPatch(data), { merge: true })
      n += 1
    }
    await batch.commit()
    console.log('committed', n)
  }
  return n
}

async function main() {
  await signInAnonymously(auth)
  console.log('auth ok')

  const playersSnap = await getDocs(collection(db, 'players'))
  const playerRows = playersSnap.docs.map((d) => ({ ref: d.ref, data: d.data() }))
  console.log('players docs', playerRows.length)

  await flushBatches(playerRows, (data) => {
    const isNpc = Boolean(data.isNpc)
    const gold = isNpc ? Math.max(0, Math.floor(Number(data.gold) || WELCOME_GOLD)) : WELCOME_GOLD
    const diamond = isNpc ? Math.max(0, Math.floor(Number(data.diamond) || WELCOME_DIAMOND)) : WELCOME_DIAMOND
    // For full ranking wipe: everyone starts equal on boards
    return {
      gold: isNpc ? gold : (Number.isFinite(Number(data.gold)) ? Number(data.gold) : WELCOME_GOLD),
      diamond: isNpc ? diamond : (Number.isFinite(Number(data.diamond)) ? Number(data.diamond) : WELCOME_DIAMOND),
      // Rankings:
      totalWealth: 0,
      giftsSentScore: 0,
      playerLevel: 1,
      playerXp: 0,
      hunterLevel: 0,
      leaderboardEpoch: LEADERBOARD_EPOCH,
      iqd: deleteField(),
      gems: deleteField(),
      updatedAt: serverTimestamp(),
    }
  })

  const usersSnap = await getDocs(collection(db, 'users'))
  const userRows = usersSnap.docs.map((d) => ({ ref: d.ref, data: d.data() }))
  console.log('users docs', userRows.length)

  await flushBatches(userRows, (data) => ({
    totalWealth: 0,
    giftsSentScore: 0,
    playerLevel: 1,
    playerXp: 0,
    hunterLevel: 0,
    leaderboardEpoch: LEADERBOARD_EPOCH,
    iqd: deleteField(),
    gems: deleteField(),
    updatedAt: serverTimestamp(),
  }))

  console.log('DONE — wealth / level / gifter boards cleared')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
