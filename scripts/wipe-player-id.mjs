/**
 * One-off: wipe gameplay for a specific in-game playerId.
 * Usage: node scripts/wipe-player-id.mjs 55753921
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const playerId = String(process.argv[2] || '').trim()
if (!/^\d{8}$/.test(playerId)) {
  console.error('Usage: node scripts/wipe-player-id.mjs <8-digit-playerId>')
  process.exit(1)
}

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

const WELCOME_GOLD = 500
const WELCOME_DIAMOND = 35
const RESET_VERSION = 3
const DEFAULT_TITLE = 'ڕاوکەر'
const DEFAULT_AVATAR_3D = {
  bodyType: 'average',
  skinTone: 'medium',
  hairStyle: 'short',
  hairColor: 'black',
  eyeColor: 'brown',
  outfit: 'casual',
  facialHair: 'none',
  accessory: 'none',
}
const EMPTY_DROPS = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 }
const EMPTY_STATS = {
  chestsOpened: 0,
  dailyBonusClaims: 0,
  distanceTraveledM: 0,
  playTimeMs: 0,
  itemsPurchased: 0,
  giftsReceived: 0,
}
const EMPTY_VIP = {
  version: 1,
  tiktok: { owned: false, status: 'inactive', purchasedAtMs: null, endsAtMs: null, completedDays: 0, lastSubmitAtMs: null, usedLinks: [], usedPostIds: [], duplicateAttempts: 0, finalRewardClaimed: false },
  facebook: { owned: false, status: 'inactive', purchasedAtMs: null, endsAtMs: null, completedDays: 0, lastSubmitAtMs: null, usedLinks: [], usedPostIds: [], duplicateAttempts: 0, finalRewardClaimed: false },
  master: { owned: false, status: 'inactive', purchasedAtMs: null, endsAtMs: null, perfectDayKeys: [], lastDailyClaimDay: 0, lastDailyClaimAtMs: null, finalSettled: false, finalRewardClaimed: false, refundGranted: false },
}

async function main() {
  await signInAnonymously(auth)
  console.log('auth ok', auth.currentUser?.uid)

  let uid = ''
  let name = 'یاریزان'
  let gender = 'male'

  const playerSnap = await getDoc(doc(db, 'players', playerId))
  if (playerSnap.exists()) {
    const d = playerSnap.data()
    uid = String(d.uid || '')
    name = typeof d.name === 'string' && d.name.trim() ? d.name.trim() : name
    gender = d.gender === 'female' ? 'female' : 'male'
    console.log('found players/', playerId, 'uid=', uid, 'name=', name)
  } else {
    const idSnap = await getDoc(doc(db, 'playerIds', playerId))
    if (!idSnap.exists()) {
      console.error('Player not found:', playerId)
      process.exit(2)
    }
    uid = String(idSnap.data().uid || '')
    console.log('found playerIds/', playerId, 'uid=', uid)
  }

  if (!uid) {
    console.error('No uid linked to playerId', playerId)
    process.exit(3)
  }

  const userSnap = await getDoc(doc(db, 'users', uid))
  if (userSnap.exists()) {
    const d = userSnap.data()
    name = typeof d.name === 'string' && d.name.trim() ? d.name.trim() : name
    gender = d.gender === 'female' ? 'female' : 'male'
  }

  const avatar3d = {
    ...DEFAULT_AVATAR_3D,
    hairStyle: gender === 'female' ? 'long' : 'short',
  }

  const freshUser = {
    uid,
    name,
    username: userSnap.exists() && typeof userSnap.data().username === 'string' ? userSnap.data().username : '',
    email: userSnap.exists() && typeof userSnap.data().email === 'string' ? userSnap.data().email : '',
    gender,
    gold: WELCOME_GOLD,
    diamond: WELCOME_DIAMOND,
    isPremium: false,
    title: DEFAULT_TITLE,
    avatarUrl: null,
    avatar3d,
    playerId,
    settings: { music: true, sfx: true, notifications: true, showOnline: true },
    stats: { ...EMPTY_STATS },
    dropsOpenedByType: { ...EMPTY_DROPS },
    hunterLevel: 0,
    playerLevel: 1,
    playerXp: 0,
    welcomeBonusGranted: true,
    inventory: [],
    dailyBonusDay: 1,
    dailyBonusLastClaimMs: null,
    spinLastFreeAtMs: null,
    spinSpinsInWindow: 0,
    readNotificationIds: [],
    blockedUsers: [],
    friends: [],
    giftsLog: [],
    inboxNotifications: [],
    mutedChatUids: [],
    dropTypeCooldowns: {},
    stealShieldUntilMs: 0,
    stealCooldownUntilMs: 0,
    fightBanUntilMs: 0,
    fightChallengeLog: {},
    incomingFight: null,
    incomingHeist: null,
    homeCityKey: '',
    totalWealth: 0,
    giftsSentScore: 0,
    leaderboardEpoch: 2,
    factoryDayKey: '',
    factoryGoldTakenToday: 0,
    factoryDiamondTakenToday: 0,
    vipPasses: EMPTY_VIP,
    activePasses: [],
    gameplayResetVersion: RESET_VERSION,
    updatedAt: serverTimestamp(),
  }

  const freshPlayer = {
    uid,
    playerId,
    name,
    username: freshUser.username,
    gender,
    gold: WELCOME_GOLD,
    diamond: WELCOME_DIAMOND,
    isPremium: false,
    title: DEFAULT_TITLE,
    avatarUrl: null,
    avatar3d,
    inventory: [],
    dropsOpenedByType: { ...EMPTY_DROPS },
    hunterLevel: 0,
    playerLevel: 1,
    playerXp: 0,
    welcomeBonusGranted: true,
    dailyBonusDay: 1,
    dailyBonusLastClaimMs: null,
    spinLastFreeAtMs: null,
    spinSpinsInWindow: 0,
    totalWealth: 0,
    giftsSentScore: 0,
    leaderboardEpoch: 2,
    gameplayResetVersion: RESET_VERSION,
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'users', uid), freshUser, { merge: true })
  console.log('wiped users/', uid)
  await setDoc(doc(db, 'players', playerId), freshPlayer, { merge: true })
  console.log('wiped players/', playerId)
  console.log('DONE', { playerId, uid, name })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
