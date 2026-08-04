import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase'
import {
  createRegisteredUserProfile,
  resolveEmailFromLoginIdentifier,
  deleteUserProfileData,
  setRegistrationInflight,
  stashPendingRegisteredProfile,
  lockRegistrationIntent,
  bindRegistrationIdentityToUid,
  clearRegistrationIntent,
  type Gender,
} from './userService'

export type AuthTab = 'login' | 'register' | 'reset'
export type ResetStep = 'email' | 'code' | 'done'

export const AUTH_REMEMBER_KEY = 'kd_auth_remember'
export const AUTH_EMAIL_HINT_KEY = 'kd_auth_email'
/** دواین UID بۆ کردنەوەی خێرای یاری پێش onAuthStateChanged */
export const AUTH_LAST_UID_KEY = 'kd_auth_last_uid'
/** کاشی ناسنامە → ئیمەیڵ بۆ چوونەژوورەوەی خێرا */
export const AUTH_ID_EMAIL_CACHE_KEY = 'kd_auth_id_email_map'

function rememberAuthSession(uid: string, identifierHint: string, email: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(AUTH_REMEMBER_KEY, '1')
    localStorage.setItem(AUTH_EMAIL_HINT_KEY, identifierHint)
    localStorage.setItem(AUTH_LAST_UID_KEY, uid)
    const key = identifierHint.trim().toLowerCase()
    if (key && email) {
      const raw = localStorage.getItem(AUTH_ID_EMAIL_CACHE_KEY)
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
      map[key] = email
      if (key.includes('@') === false) map[email] = email
      localStorage.setItem(AUTH_ID_EMAIL_CACHE_KEY, JSON.stringify(map))
    }
  } catch { /* ignore */ }
}

function cachedEmailForIdentifier(identifier: string): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const key = identifier.trim().toLowerCase()
    if (!key) return null
    if (key.includes('@')) return key
    const raw = localStorage.getItem(AUTH_ID_EMAIL_CACHE_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as Record<string, string>
    const email = map[key]
    return typeof email === 'string' && email.includes('@') ? email : null
  } catch {
    return null
  }
}

export function clearAuthSessionHints(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(AUTH_LAST_UID_KEY)
  } catch { /* ignore */ }
}

export function mapFirebaseAuthError(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err
    ? String((err as { code?: string }).code)
    : ''
  const map: Record<string, string> = {
    'auth/invalid-email': 'ئیمەیڵەکە نادروستە.',
    'auth/user-disabled': 'ئەم هەژمارە ناچالاک کراوە.',
    'auth/user-not-found': 'هەژمار نەدۆزرایەوە.',
    'auth/wrong-password': 'وشەی تێپەڕ هەڵەیە.',
    'auth/invalid-credential': 'ئیمەیڵ/ناوی بەکارهێنەر یان وشەی تێپەڕ هەڵەیە.',
    'auth/email-already-in-use': 'ئەم ئیمەیڵە پێشتر تۆمار کراوە.',
    'auth/weak-password': 'وشەی تێپەڕ زۆر لاوازە — لانیکەم ٨ پیت.',
    'auth/too-many-requests': 'زۆر هەوڵ — تکایە کەمێک چاوەڕوان بە.',
    'auth/network-request-failed': 'هەڵەی تۆڕ — پەیوەندی ئینتەرنێت بپشکنە.',
    'auth/unauthorized-domain': 'ئەم ناونیشانە (IP) لە Firebase ڕێگەپێنەدراوە — بۆ مۆبایل localhost یان دۆمەینی ڕێگەپێدراو بەکاربهێنە.',
    'auth/invalid-action-code': 'کۆدی پشتڕاستکردنەوە نادروستە یان بەسەرچووە.',
    'auth/expired-action-code': 'کۆدی پشتڕاستکردنەوە بەسەرچووە — دووبارە داوابکە.',
    'auth/requires-recent-login': 'پێویستە دووبارە بچیتە ژوورەوە پێش ئەم کردارە — چوونەدەرەوە و دووبارە هەوڵبدەرەوە.',
  }
  if (code && map[code]) return map[code]
  if (err instanceof Error && err.message) return err.message
  return 'هەڵەیەک ڕوویدا — دووبارە هەوڵ بدەرەوە.'
}

export function passwordStrengthScore(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z\u0600-\u06FF]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9\u0600-\u06FF]/.test(password)) score++
  return Math.min(4, score)
}

export function passwordStrengthLabel(score: number): { label: string; color: string; pct: number } {
  if (score <= 0) return { label: 'لاواز', color: '#f87171', pct: 15 }
  if (score === 1) return { label: 'مامناوەند', color: '#fb923c', pct: 35 }
  if (score === 2) return { label: 'باش', color: '#fbbf24', pct: 55 }
  if (score === 3) return { label: 'بەهێز', color: '#34d399', pct: 78 }
  return { label: 'زۆر بەهێز', color: '#00f0ff', pct: 100 }
}

export async function loginWithIdentifier(opts: {
  identifier: string
  password: string
  rememberMe?: boolean
}): Promise<User> {
  // Persistence لە firebase.ts دانراوە — مەچاوەڕوانە لەسەر هەر چوونەژوورەوەیەک
  const hint = opts.identifier.trim()
  const cached = cachedEmailForIdentifier(hint)
  let email = cached ?? await resolveEmailFromLoginIdentifier(opts.identifier)
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, opts.password)
    rememberAuthSession(user.uid, hint, email)
    return user
  } catch (err) {
    // کاشی کۆن — دووبارە لە Firestore بگەڕێ
    if (cached) {
      email = await resolveEmailFromLoginIdentifier(opts.identifier)
      if (email !== cached) {
        const { user } = await signInWithEmailAndPassword(auth, email, opts.password)
        rememberAuthSession(user.uid, hint, email)
        return user
      }
    }
    throw err
  }
}

export async function registerAccount(opts: {
  fullName: string
  username: string
  email: string
  phone: string
  password: string
  gender: Gender
}): Promise<User> {
  if (opts.gender !== 'male' && opts.gender !== 'female') {
    throw new Error('ڕەگەز دیاری بکە (نێر یان مێ).')
  }
  const email = opts.email.trim().toLowerCase()
  // گرنگ: پێش Auth — ناسنامە قوفڵ بکە تا onAuthStateChanged «یاریزان» دروست نەکات
  const intent = lockRegistrationIntent({
    fullName: opts.fullName,
    username: opts.username,
    email,
    phone: opts.phone,
    gender: opts.gender,
  })
  setRegistrationInflight(true)
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, opts.password)
    bindRegistrationIdentityToUid(user.uid, intent)
    void updateProfile(user, { displayName: opts.username.trim() || opts.fullName.trim() }).catch(() => {})
    const profile = await createRegisteredUserProfile(user.uid, {
      fullName: opts.fullName,
      username: opts.username,
      email,
      phone: opts.phone,
      gender: opts.gender,
    })
    rememberAuthSession(user.uid, email, email)
    // دووبارە دڵنیابە — UI هەمان داتای تۆمارکردن وەردەگرێت
    stashPendingRegisteredProfile(user.uid, profile)
    bindRegistrationIdentityToUid(user.uid, {
      name: profile.name,
      username: profile.username,
      email: profile.email,
      phone: profile.phone,
      gender: profile.gender,
      playerId: profile.playerId,
      createdAtMs: profile.createdAtMs ?? Date.now(),
    })
    // intent گشتی بسڕەوە — قوفڵی uid دەمێنێتەوە
    clearRegistrationIntent()
    return user
  } catch (err) {
    clearRegistrationIntent()
    throw err
  } finally {
    setRegistrationInflight(false)
  }
}

export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase())
}

export async function confirmResetPassword(oobCode: string, newPassword: string): Promise<void> {
  await verifyPasswordResetCode(auth, oobCode.trim())
  await confirmPasswordReset(auth, oobCode.trim(), newPassword)
}

/**
 * سڕینەوەی هەمیشەیی هەژمار — پێویستی بە دووبارە پشتڕاستکردنەوەی وشەی تێپەڕە (re-auth)
 * هەیە، دواتر داتای Firestore و هەژماری Firebase Auth بە تەواوی دەسڕدرێتەوە. ناگەڕێتەوە.
 */
export async function deleteOwnAccount(password: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) {
    throw new Error('هیچ هەژمارێکی چالاک نییە بۆ سڕینەوە.')
  }
  const credential = EmailAuthProvider.credential(user.email, password)
  await reauthenticateWithCredential(user, credential)
  await deleteUserProfileData(user.uid)
  await deleteUser(user)
}

/** گۆڕینی وشەی نهێنی — پێویستی بە وشەی کۆن هەیە */
export async function changeAccountPassword(oldPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) {
    throw new Error('هیچ هەژمارێکی چالاک نییە.')
  }
  if (newPassword.length < 8) {
    throw new Error('وشەی نهێنی نوێ لانیکەم ٨ پیت بێت.')
  }
  if (oldPassword === newPassword) {
    throw new Error('وشەی نهێنی نوێ نابێت هەمان وشەی کۆن بێت.')
  }
  const credential = EmailAuthProvider.credential(user.email, oldPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

/** گۆڕینی ئیمەیڵی Auth دوای پشتڕاستکردنەوەی وشەی نهێنی */
export async function changeAuthEmail(password: string, newEmail: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) {
    throw new Error('هیچ هەژمارێکی چالاک نییە.')
  }
  const next = newEmail.trim().toLowerCase()
  const credential = EmailAuthProvider.credential(user.email, password)
  await reauthenticateWithCredential(user, credential)
  await updateEmail(user, next)
}
