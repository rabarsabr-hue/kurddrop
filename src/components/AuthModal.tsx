import { useCallback, useEffect, useMemo, useState } from 'react'
import { auth } from '../firebase'
import {
  AUTH_EMAIL_HINT_KEY,
  confirmResetPassword,
  loginWithIdentifier,
  mapFirebaseAuthError,
  passwordStrengthScore,
  registerAccount,
  sendResetEmail,
} from '../services/authService'
import { validatePhoneNumber, validateUsername, normalizeUsername, lockRegistrationIntent, type Gender } from '../services/userService'
import gameLogo from '../imports/logo.png'
import {
  TERMS_FOOTER,
  TERMS_INTRO,
  TERMS_SECTIONS,
  TERMS_UPDATED_AT,
} from '../data/termsOfService'

type AuthScreen = 'login' | 'register' | 'forgot' | 'forgot-code' | 'forgot-done' | 'terms'

const AUTH_CSS = `
  .kd-auth-root {
    position: fixed;
    inset: 0;
    z-index: 10000;
    overflow: hidden;
    font-family: var(--kd-font);
    direction: rtl;
    color: #f8fafc;
    background: #040812;
    animation: kdAuthFadeIn 0.4s ease;
  }
  @keyframes kdAuthFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes kdAuthPlaneFly {
    0% { transform: translate(-12%, 10%) rotate(-8deg); }
    50% { transform: translate(18%, -6%) rotate(3deg); }
    100% { transform: translate(52%, 8%) rotate(-5deg); }
  }
  @keyframes kdAuthDropFall {
    0% { transform: translateY(-8%) scale(0.9); opacity: 0; }
    15% { opacity: 1; }
    100% { transform: translateY(130%) scale(1); opacity: 0.1; }
  }
  @keyframes kdAuthGlowPulse {
    0%, 100% { opacity: 0.35; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.08); }
  }
  @keyframes kdAuthMapDrift {
    0% { background-position: 0% 35%; }
    100% { background-position: 100% 55%; }
  }
  @keyframes kdAuthFormIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .kd-auth-stage {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 18%, rgba(0, 240, 255, 0.2), transparent 52%),
      radial-gradient(ellipse at 85% 75%, rgba(251, 191, 36, 0.14), transparent 48%),
      linear-gradient(180deg, #06101c 0%, #081420 40%, #040812 100%);
  }
  .kd-auth-map {
    position: absolute;
    inset: -12% -18%;
    opacity: 0.22;
    background-image:
      linear-gradient(rgba(0,240,255,0.14) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,240,255,0.14) 1px, transparent 1px);
    background-size: 44px 44px;
    animation: kdAuthMapDrift 26s linear infinite alternate;
    mask-image: radial-gradient(ellipse at 50% 40%, #000 30%, transparent 78%);
  }
  .kd-auth-glow {
    position: absolute;
    width: 220px;
    height: 220px;
    left: 50%;
    top: 28%;
    margin: -110px 0 0 -110px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0,240,255,0.32), transparent 68%);
    animation: kdAuthGlowPulse 3.8s ease-in-out infinite;
    pointer-events: none;
  }
  .kd-auth-sky {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .kd-auth-plane {
    position: absolute;
    top: 14%;
    left: 0;
    font-size: 40px;
    line-height: 1;
    filter: drop-shadow(0 10px 18px rgba(0,0,0,0.5));
    animation: kdAuthPlaneFly 10s ease-in-out infinite alternate;
  }
  .kd-auth-drop {
    position: absolute;
    top: 12%;
    left: 56%;
    width: 34px;
    animation: kdAuthDropFall 5.8s ease-in infinite;
  }
  .kd-auth-drop:nth-child(2) { left: 30%; animation-delay: 1.7s; animation-duration: 6.4s; }
  .kd-auth-drop:nth-child(3) { left: 74%; animation-delay: 3.1s; animation-duration: 5.6s; }
  .kd-auth-chute {
    width: 26px;
    height: 14px;
    margin: 0 auto;
    border-radius: 50% 50% 40% 40%;
    background: linear-gradient(180deg, rgba(0,240,255,0.9), rgba(56,189,248,0.3));
    box-shadow: 0 0 12px rgba(0,240,255,0.35);
  }
  .kd-auth-crate {
    width: 20px;
    height: 16px;
    margin: 10px auto 0;
    border-radius: 3px;
    background: linear-gradient(145deg, #fbbf24, #b45309);
    box-shadow: 0 0 10px rgba(251,191,36,0.5);
    position: relative;
  }
  .kd-auth-crate::before {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 100%;
    width: 1.5px;
    height: 10px;
    background: rgba(226,232,240,0.65);
    transform: translateX(-50%);
  }

  .kd-auth-ui {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding:
      max(20px, env(safe-area-inset-top))
      20px
      max(24px, env(safe-area-inset-bottom));
    box-sizing: border-box;
  }
  .kd-auth-brand {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 0;
    padding-bottom: 4px;
    pointer-events: none;
  }
  @keyframes kdAuthLogoFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .kd-auth-logo {
    width: min(72vw, 280px);
    height: auto;
    max-height: 42dvh;
    object-fit: contain;
    filter: drop-shadow(0 12px 32px rgba(0,0,0,0.55));
    mix-blend-mode: lighten;
    animation: kdAuthLogoFloat 4.2s ease-in-out infinite;
  }
  .kd-auth-brand h1 {
    margin: 8px 0 0;
    font-size: clamp(22px, 5.5vw, 28px);
    font-weight: 900;
    letter-spacing: 0.4px;
    color: #fff;
    text-shadow: 0 0 22px rgba(0,240,255,0.35), 0 3px 14px rgba(0,0,0,0.55);
  }

  .kd-auth-body {
    width: min(100%, 360px);
    margin: 0 auto;
    animation: kdAuthFormIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .kd-auth-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .kd-auth-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .kd-auth-input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 14px;
    background: rgba(4, 10, 20, 0.42);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #f8fafc;
    padding: 14px 14px;
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    outline: none;
  }
  .kd-auth-input::placeholder { color: rgba(148,163,184,0.75); font-weight: 700; }
  .kd-auth-input:focus {
    border-color: rgba(0,240,255,0.55);
    box-shadow: 0 0 0 2px rgba(0,240,255,0.12);
  }
  .kd-auth-input.has-toggle { padding-left: 46px; }
  .kd-auth-eye {
    position: absolute;
    left: 8px;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #67e8f9;
    cursor: pointer;
    display: grid;
    place-items: center;
  }
  .kd-auth-eye .material-icons { font-size: 18px; }

  .kd-auth-gender {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .kd-auth-gender-btn {
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 14px;
    background: rgba(4, 10, 20, 0.42);
    color: #cbd5e1;
    padding: 12px 10px;
    font-size: 13px;
    font-weight: 900;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: border-color 0.15s, background 0.15s, color 0.15s;
  }
  .kd-auth-gender-btn.is-active {
    border-color: rgba(0,240,255,0.65);
    background: rgba(0,240,255,0.12);
    color: #e0f2fe;
    box-shadow: 0 0 0 2px rgba(0,240,255,0.12);
  }
  .kd-auth-gender-label {
    font-size: 11px;
    font-weight: 800;
    color: rgba(148,163,184,0.9);
    margin: 2px 2px 0;
  }

  .kd-auth-submit {
    width: 100%;
    border: none;
    border-radius: 14px;
    padding: 14px;
    margin-top: 2px;
    font-size: 15px;
    font-weight: 900;
    font-family: inherit;
    color: #04101c;
    cursor: pointer;
    background: linear-gradient(135deg, #00f0ff, #38bdf8 55%, #fbbf24);
    box-shadow: 0 8px 28px rgba(0,240,255,0.22);
  }
  .kd-auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }
  .kd-auth-submit:not(:disabled):active { transform: scale(0.98); }

  .kd-auth-links {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 4px;
  }
  .kd-auth-link {
    border: none;
    background: none;
    padding: 6px 0;
    font-size: 12px;
    font-weight: 800;
    font-family: inherit;
    color: rgba(125,211,252,0.9);
    cursor: pointer;
  }
  .kd-auth-back {
    position: absolute;
    top: max(14px, env(safe-area-inset-top));
    right: 14px;
    z-index: 3;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    background: rgba(4,10,20,0.35);
    backdrop-filter: blur(8px);
    color: #e2e8f0;
    cursor: pointer;
    display: grid;
    place-items: center;
  }
  .kd-auth-back .material-icons { font-size: 20px; }

  .kd-auth-msg {
    font-size: 11px;
    font-weight: 800;
    text-align: center;
    line-height: 1.45;
    margin: 0 0 8px;
    padding: 8px 10px;
    border-radius: 10px;
  }
  .kd-auth-msg.is-error {
    color: #fecaca;
    background: rgba(239,68,68,0.16);
  }
  .kd-auth-msg.is-success {
    color: #bbf7d0;
    background: rgba(34,197,94,0.14);
  }
  .kd-auth-strength {
    height: 3px;
    border-radius: 99px;
    background: rgba(255,255,255,0.1);
    overflow: hidden;
    margin-top: -4px;
  }
  .kd-auth-strength > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    transition: width 0.25s ease, background 0.25s ease;
  }
  .kd-auth-check {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    cursor: pointer;
  }
  .kd-auth-check input {
    width: 15px;
    height: 15px;
    accent-color: #00f0ff;
  }
  .kd-auth-terms-row {
    display: flex;
    align-items: center;
    gap: 8px;
    direction: rtl;
  }
  .kd-auth-terms-open {
    border: none;
    background: none;
    padding: 0;
    font-size: 12px;
    font-weight: 900;
    font-family: inherit;
    color: #7dd3fc;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .kd-auth-terms-page {
    position: absolute;
    inset: 0;
    z-index: 6;
    display: flex;
    flex-direction: column;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.12), transparent 45%),
      linear-gradient(180deg, #07111f 0%, #040812 100%);
    animation: kdAuthFormIn 0.35s ease;
  }
  .kd-auth-terms-top {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: max(14px, env(safe-area-inset-top)) 14px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .kd-auth-terms-top h2 {
    margin: 0;
    flex: 1;
    font-size: 15px;
    font-weight: 900;
    color: #f8fafc;
    text-align: right;
  }
  .kd-auth-terms-scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 16px 16px 12px;
    -webkit-overflow-scrolling: touch;
  }
  .kd-auth-terms-intro {
    margin: 0 0 16px;
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    line-height: 1.7;
    text-align: right;
  }
  .kd-auth-terms-section {
    margin-bottom: 16px;
    padding: 12px 12px 10px;
    border-radius: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .kd-auth-terms-section h3 {
    margin: 0 0 8px;
    font-size: 12.5px;
    font-weight: 900;
    color: #e0f2fe;
    text-align: right;
    line-height: 1.45;
  }
  .kd-auth-terms-section ul {
    margin: 0;
    padding: 0 14px 0 0;
    list-style: disc;
  }
  .kd-auth-terms-section li {
    font-size: 11.5px;
    font-weight: 700;
    color: #cbd5e1;
    line-height: 1.65;
    margin-bottom: 8px;
    text-align: right;
  }
  .kd-auth-terms-section li:last-child { margin-bottom: 0; }
  .kd-auth-terms-meta {
    margin: 8px 0 0;
    font-size: 10.5px;
    font-weight: 700;
    color: #64748b;
    text-align: center;
    line-height: 1.6;
  }
  .kd-auth-terms-foot {
    flex-shrink: 0;
    padding: 12px 16px max(18px, env(safe-area-inset-bottom));
    border-top: 1px solid rgba(255,255,255,0.08);
    background: rgba(4,8,18,0.85);
    backdrop-filter: blur(10px);
  }
`

function loadRememberedIdentifier(): string {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(AUTH_EMAIL_HINT_KEY) ?? ''
}

function strengthColor(score: number): string {
  if (score <= 1) return '#f87171'
  if (score === 2) return '#fbbf24'
  if (score === 3) return '#34d399'
  return '#00f0ff'
}

export default function AuthModal() {
  const rememberedId = useMemo(() => loadRememberedIdentifier(), [])
  const [screen, setScreen] = useState<AuthScreen>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [loginId, setLoginId] = useState(rememberedId)
  const [loginPw, setLoginPw] = useState('')
  const [showLoginPw, setShowLoginPw] = useState(false)

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPw, setRegPw] = useState('')
  const [regPw2, setRegPw2] = useState('')
  const [showRegPw, setShowRegPw] = useState(false)
  const [regGender, setRegGender] = useState<Gender | null>(null)
  const [termsOk, setTermsOk] = useState(false)

  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [resetPw, setResetPw] = useState('')
  const [resetPw2, setResetPw2] = useState('')
  const [showResetPw, setShowResetPw] = useState(false)

  const regScore = passwordStrengthScore(regPw)

  const clearMsgs = useCallback(() => setError(null), [])

  const go = useCallback((next: AuthScreen) => {
    clearMsgs()
    setScreen(next)
  }, [clearMsgs])

  useEffect(() => { clearMsgs() }, [screen, clearMsgs])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMsgs()
    if (!loginId.trim() || !loginPw) {
      setError('خانەکان پڕ بکەرەوە.')
      return
    }
    setBusy(true)
    try {
      await loginWithIdentifier({ identifier: loginId, password: loginPw })
    } catch (err) {
      setError(mapFirebaseAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMsgs()
    if (!fullName.trim() || !username.trim() || !regEmail.trim() || !regPhone.trim() || !regPw || !regPw2) {
      setError('خانەکان پڕ بکەرەوە.')
      return
    }
    if (regGender !== 'male' && regGender !== 'female') {
      setError('ڕەگەز دیاری بکە (نێر یان مێ).')
      return
    }
    const userErr = validateUsername(username)
    if (userErr) { setError(userErr); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setError('ئیمەیڵ نادروستە.')
      return
    }
    const phoneErr = validatePhoneNumber(regPhone)
    if (phoneErr) { setError(phoneErr); return }
    if (regPw.length < 8) {
      setError('وشەی نهێنی لانیکەم ٨ پیت.')
      return
    }
    if (regPw !== regPw2) {
      setError('وشەی نهێنی یەک ناگرنەوە.')
      return
    }
    if (!termsOk) {
      setError('مەرجەکان پەسەند بکە.')
      return
    }
    setBusy(true)
    try {
      // پێش Auth — ناسنامە قوفڵ بکە بۆ UI
      lockRegistrationIntent({
        fullName,
        username,
        email: regEmail,
        phone: regPhone,
        gender: regGender,
      })
      await registerAccount({
        fullName,
        username,
        email: regEmail,
        phone: regPhone,
        password: regPw,
        gender: regGender,
      })
      // دڵنیایی زیادە — ئەگەر App هێشتا «یاریزان» پیشان بدات
      try {
        window.dispatchEvent(new CustomEvent('kd-reg-profile-ready', {
          detail: {
            uid: auth.currentUser?.uid,
            name: fullName.trim(),
            username: normalizeUsername(username),
            email: regEmail.trim().toLowerCase(),
            phone: regPhone.trim().replace(/[\s\-()]/g, ''),
            gender: regGender,
            gold: 500,
            diamond: 25,
            isPremium: false,
            playerLevel: 1,
            playerXp: 0,
            hunterLevel: 0,
            createdAtMs: Date.now(),
          },
        }))
      } catch { /* ignore */ }
    } catch (err) {
      setError(mapFirebaseAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMsgs()
    if (!resetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setError('ئیمەیڵ نادروستە.')
      return
    }
    setBusy(true)
    try {
      await sendResetEmail(resetEmail)
      setScreen('forgot-code')
    } catch (err) {
      setError(mapFirebaseAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMsgs()
    if (!resetCode.trim()) {
      setError('کۆد بنووسە.')
      return
    }
    if (resetPw.length < 8) {
      setError('وشەی نهێنی لانیکەم ٨ پیت.')
      return
    }
    if (resetPw !== resetPw2) {
      setError('وشەی نهێنی یەک ناگرنەوە.')
      return
    }
    setBusy(true)
    try {
      await confirmResetPassword(resetCode, resetPw)
      setScreen('forgot-done')
    } catch (err) {
      setError(mapFirebaseAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const ariaLabel =
    screen === 'login' ? 'چوونەژوورەوە'
      : screen === 'register' ? 'دروستکردنی هەژمار'
        : screen === 'terms' ? 'مەرجەکان و یاساکان'
          : 'گەڕاندنەوەی وشەی نهێنی'

  return (
    <>
      <style>{AUTH_CSS}</style>
      <div className="kd-auth-root" role="dialog" aria-modal="true" aria-label={ariaLabel}>
        <div className="kd-auth-stage" aria-hidden="true">
          <div className="kd-auth-map" />
          <div className="kd-auth-glow" />
        </div>

        {screen !== 'login' && screen !== 'terms' && (
          <button
            type="button"
            className="kd-auth-back"
            aria-label="گەڕانەوە"
            onClick={() => go(screen === 'forgot-code' ? 'forgot' : 'login')}
          >
            <i className="material-icons">arrow_forward</i>
          </button>
        )}

        {screen === 'terms' && (
          <div className="kd-auth-terms-page" role="document" aria-label="مەرجەکان و یاساکان">
            <div className="kd-auth-terms-top">
              <button
                type="button"
                className="kd-auth-back"
                style={{ position: 'relative', top: 'auto', right: 'auto' }}
                aria-label="گەڕانەوە"
                onClick={() => go('register')}
              >
                <i className="material-icons">arrow_forward</i>
              </button>
              <h2>مەرجەکان و یاساکان</h2>
            </div>
            <div className="kd-auth-terms-scroll">
              <p className="kd-auth-terms-intro">{TERMS_INTRO}</p>
              {TERMS_SECTIONS.map(section => (
                <section key={section.title} className="kd-auth-terms-section">
                  <h3>{section.title}</h3>
                  <ul>
                    {section.bullets.map((b, i) => (
                      <li key={`${section.title}-${i}`}>{b}</li>
                    ))}
                  </ul>
                </section>
              ))}
              <p className="kd-auth-terms-meta">
                کۆتا نوێکردنەوە: {TERMS_UPDATED_AT}
                <br />
                {TERMS_FOOTER}
              </p>
            </div>
            <div className="kd-auth-terms-foot">
              <button
                type="button"
                className="kd-auth-submit"
                onClick={() => {
                  setTermsOk(true)
                  go('register')
                }}
              >
                ڕازیم — گەڕانەوە
              </button>
            </div>
          </div>
        )}

        <div className="kd-auth-ui" style={screen === 'terms' ? { visibility: 'hidden', pointerEvents: 'none' } : undefined}>
          <div className="kd-auth-brand">
            <img className="kd-auth-logo" src={gameLogo} alt="Kurd Drop" draggable={false} />
            <h1>Kurd Drop</h1>
          </div>

          <div className="kd-auth-body" key={screen === 'terms' ? 'register' : screen}>
            {error && <div className="kd-auth-msg is-error" role="alert">{error}</div>}

            {screen === 'login' && (
              <form className="kd-auth-form" onSubmit={handleLogin}>
                <input
                  className="kd-auth-input"
                  type="text"
                  autoComplete="username"
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  placeholder="ئیمەیڵ / مۆبایل / ئایدی / یوزەرنەیم"
                  aria-label="ناسنامە"
                />
                <div className="kd-auth-input-wrap">
                  <input
                    className="kd-auth-input has-toggle"
                    type={showLoginPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginPw}
                    onChange={e => setLoginPw(e.target.value)}
                    placeholder="وشەی نهێنی"
                    aria-label="وشەی نهێنی"
                  />
                  <button
                    type="button"
                    className="kd-auth-eye"
                    aria-label={showLoginPw ? 'شاردنەوە' : 'پیشاندان'}
                    onClick={() => setShowLoginPw(v => !v)}
                  >
                    <i className="material-icons">{showLoginPw ? 'visibility_off' : 'visibility'}</i>
                  </button>
                </div>
                <button type="submit" className="kd-auth-submit" disabled={busy}>
                  {busy ? '...' : 'چوونەژوورەوە'}
                </button>
                <div className="kd-auth-links">
                  <button type="button" className="kd-auth-link" onClick={() => go('forgot')}>
                    وشەی نهێنی؟
                  </button>
                  <button type="button" className="kd-auth-link" onClick={() => go('register')}>
                    هەژماری نوێ
                  </button>
                </div>
              </form>
            )}

            {screen === 'register' && (
              <form className="kd-auth-form" onSubmit={handleRegister}>
                <input
                  className="kd-auth-input"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="ناوی تەواو"
                  autoComplete="name"
                  aria-label="ناوی تەواو"
                />
                <input
                  className="kd-auth-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="یوزەرنەیم"
                  autoComplete="username"
                  aria-label="یوزەرنەیم"
                />
                <input
                  className="kd-auth-input"
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="ئیمەیڵ"
                  autoComplete="email"
                  aria-label="ئیمەیڵ"
                />
                <input
                  className="kd-auth-input"
                  type="tel"
                  inputMode="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="ژمارەی مۆبایل"
                  autoComplete="tel"
                  aria-label="ژمارەی مۆبایل"
                />
                <div className="kd-auth-gender-label">ڕەگەز دیاری بکە</div>
                <div className="kd-auth-gender" role="group" aria-label="ڕەگەز">
                  <button
                    type="button"
                    className={`kd-auth-gender-btn${regGender === 'male' ? ' is-active' : ''}`}
                    aria-pressed={regGender === 'male'}
                    onClick={() => setRegGender('male')}
                  >
                    <span aria-hidden="true">♂</span>
                    نێر
                  </button>
                  <button
                    type="button"
                    className={`kd-auth-gender-btn${regGender === 'female' ? ' is-active' : ''}`}
                    aria-pressed={regGender === 'female'}
                    onClick={() => setRegGender('female')}
                  >
                    <span aria-hidden="true">♀</span>
                    مێ
                  </button>
                </div>
                <div className="kd-auth-input-wrap">
                  <input
                    className="kd-auth-input has-toggle"
                    type={showRegPw ? 'text' : 'password'}
                    value={regPw}
                    onChange={e => setRegPw(e.target.value)}
                    autoComplete="new-password"
                    placeholder="وشەی نهێنی"
                    aria-label="وشەی نهێنی"
                  />
                  <button
                    type="button"
                    className="kd-auth-eye"
                    aria-label={showRegPw ? 'شاردنەوە' : 'پیشاندان'}
                    onClick={() => setShowRegPw(v => !v)}
                  >
                    <i className="material-icons">{showRegPw ? 'visibility_off' : 'visibility'}</i>
                  </button>
                </div>
                {regPw.length > 0 && (
                  <div className="kd-auth-strength" aria-hidden="true">
                    <span style={{ width: `${Math.max(15, regScore * 25)}%`, background: strengthColor(regScore) }} />
                  </div>
                )}
                <input
                  className="kd-auth-input"
                  type="password"
                  value={regPw2}
                  onChange={e => setRegPw2(e.target.value)}
                  autoComplete="new-password"
                  placeholder="دووبارەکردنەوە"
                  aria-label="دووبارەکردنەوەی وشەی نهێنی"
                />
                <div className="kd-auth-terms-row">
                  <label className="kd-auth-check">
                    <input type="checkbox" checked={termsOk} onChange={e => setTermsOk(e.target.checked)} />
                    ڕازیم بە
                  </label>
                  <button type="button" className="kd-auth-terms-open" onClick={() => go('terms')}>
                    مەرجەکان و یاساکان
                  </button>
                </div>
                <button type="submit" className="kd-auth-submit" disabled={busy}>
                  {busy ? '...' : 'دروستکردن'}
                </button>
              </form>
            )}

            {screen === 'forgot' && (
              <form className="kd-auth-form" onSubmit={handleSendReset}>
                <input
                  className="kd-auth-input"
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="ئیمەیڵ"
                  autoComplete="email"
                  aria-label="ئیمەیڵ"
                />
                <button type="submit" className="kd-auth-submit" disabled={busy}>
                  {busy ? '...' : 'ناردن'}
                </button>
              </form>
            )}

            {screen === 'forgot-code' && (
              <form className="kd-auth-form" onSubmit={handleConfirmReset}>
                <input
                  className="kd-auth-input"
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  placeholder="کۆد"
                  dir="ltr"
                  aria-label="کۆد"
                />
                <div className="kd-auth-input-wrap">
                  <input
                    className="kd-auth-input has-toggle"
                    type={showResetPw ? 'text' : 'password'}
                    value={resetPw}
                    onChange={e => setResetPw(e.target.value)}
                    autoComplete="new-password"
                    placeholder="وشەی نهێنی نوێ"
                    aria-label="وشەی نهێنی نوێ"
                  />
                  <button type="button" className="kd-auth-eye" onClick={() => setShowResetPw(v => !v)}>
                    <i className="material-icons">{showResetPw ? 'visibility_off' : 'visibility'}</i>
                  </button>
                </div>
                <input
                  className="kd-auth-input"
                  type="password"
                  value={resetPw2}
                  onChange={e => setResetPw2(e.target.value)}
                  autoComplete="new-password"
                  placeholder="دووبارەکردنەوە"
                  aria-label="دووبارەکردنەوە"
                />
                <button type="submit" className="kd-auth-submit" disabled={busy}>
                  {busy ? '...' : 'گۆڕین'}
                </button>
              </form>
            )}

            {screen === 'forgot-done' && (
              <form className="kd-auth-form" onSubmit={e => { e.preventDefault(); go('login') }}>
                <button type="submit" className="kd-auth-submit">چوونەژوورەوە</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
