import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

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
const storage = getStorage(app)

/** هەمیشە جلوبەرگی ناوخۆیی — تەنها چوونەدەرەوە session دەسڕێتەوە (ئەپدەیتیش دەمێنێتەوە) */
void setPersistence(auth, indexedDBLocalPersistence).catch(() => {
  void setPersistence(auth, browserLocalPersistence).catch(() => {})
})

/** ڕاستەوخۆ Anonymous Auth — بەبێ چاوەڕوانی inAuthStateChanged */
export async function initAnonymousAuth(): Promise<User> {
  if (auth.currentUser) return auth.currentUser
  const { user } = await signInAnonymously(auth)
  return user
}

/** گوێگرتن بۆ گۆڕانی دۆخی Auth (بۆ sync) */
export function onAuthReady(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

/** چوونەدەرەوە لە هەژمار — تەنها ئەمە session دەسڕێتەوە */
export async function signOutUser(): Promise<void> {
  await signOut(auth)
}

export { app, auth, db, storage }
export default app
