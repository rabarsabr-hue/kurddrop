import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfxTone } from '../appHelpers'

type Props = {
  victimName: string
  mode: 'online' | 'offline'
  expiresAtMs: number
  onSuccess: () => void
  onCancel: () => void
  onExpired: () => void
}

const HOLD_MS = 1400
const ALIGN_THRESHOLD = 0.78

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function playVaultLockSfx() {
  try {
    playSfxTone({ freqs: [180, 320, 520, 780], type: 'triangle', duration: 0.12, volume: 0.09, stagger: 0.06 })
    window.setTimeout(() => {
      playSfxTone({ freqs: [920, 640], type: 'square', duration: 0.07, volume: 0.06, stagger: 0.03 })
    }, 180)
  } catch { /* ignore */ }
}

/** مینی-گەیمی ژیۆسکۆپ — مۆبایل ڕابگرە بەرەو خەزێنە تا گڵۆپ سەوز ببێت */
export default function GyroscopeHeistGame({
  victimName,
  mode,
  expiresAtMs,
  onSuccess,
  onCancel,
  onExpired,
}: Props) {
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const [align, setAlign] = useState(0)
  const [lockedGreen, setLockedGreen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)))
  const [hint, setHint] = useState('مۆبایلەکە ڕابگرە بەرەو خەزێنەکە')
  const [done, setDone] = useState(false)
  const [manualFallback, setManualFallback] = useState(false)

  const holdStartRef = useRef<number | null>(null)
  const successFiredRef = useRef(false)
  const orientSeenRef = useRef(false)
  const targetBetaRef = useRef(28 + Math.random() * 18)
  const targetGammaRef = useRef((Math.random() - 0.5) * 16)

  const requestPermission = useCallback(async () => {
    try {
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>
      }
      if (typeof DOE.requestPermission === 'function') {
        const res = await DOE.requestPermission()
        setPermission(res === 'granted' ? 'granted' : 'denied')
        return
      }
      setPermission('granted')
    } catch {
      setPermission('denied')
    }
  }, [])

  useEffect(() => {
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (typeof DOE.requestPermission !== 'function') {
      setPermission('granted')
    }
  }, [])

  useEffect(() => {
    const t = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left <= 0 && !successFiredRef.current) {
        successFiredRef.current = true
        onExpired()
      }
    }, 250)
    return () => window.clearInterval(t)
  }, [expiresAtMs, onExpired])

  useEffect(() => {
    if (permission !== 'granted') return
    const t = window.setTimeout(() => {
      if (!orientSeenRef.current) setManualFallback(true)
    }, 2500)
    return () => window.clearTimeout(t)
  }, [permission])

  useEffect(() => {
    if (permission !== 'granted' || done) return

    const onOrient = (e: DeviceOrientationEvent) => {
      if (successFiredRef.current) return
      orientSeenRef.current = true
      setManualFallback(false)
      const beta = typeof e.beta === 'number' ? e.beta : 0
      const gamma = typeof e.gamma === 'number' ? e.gamma : 0
      const dBeta = Math.abs(beta - targetBetaRef.current)
      const dGamma = Math.abs(gamma - targetGammaRef.current)
      const score = clamp01(1 - (dBeta / 55 + dGamma / 40) / 2)
      setAlign(score)

      if (score >= ALIGN_THRESHOLD) {
        setHint('گڵۆپ سەوزە — قوفڵ دەکرێتەوە...')
        setLockedGreen(true)
        if (holdStartRef.current == null) holdStartRef.current = Date.now()
        else if (Date.now() - holdStartRef.current >= HOLD_MS) {
          successFiredRef.current = true
          setDone(true)
          playVaultLockSfx()
          onSuccess()
        }
      } else {
        holdStartRef.current = null
        setLockedGreen(false)
        if (gamma < targetGammaRef.current - 8) setHint('مۆبایلەکە کەمێک بۆ ڕاست بجوڵێنە')
        else if (gamma > targetGammaRef.current + 8) setHint('مۆبایلەکە کەمێک بۆ چەپ بجوڵێنە')
        else if (beta < targetBetaRef.current - 10) setHint('سەری مۆبایلەکە هەڵبە')
        else if (beta > targetBetaRef.current + 10) setHint('سەری مۆبایلەکە دابەزێنە')
        else setHint('نزیکە — وردتر ڕایبگرە')
      }
    }

    window.addEventListener('deviceorientation', onOrient, true)
    return () => window.removeEventListener('deviceorientation', onOrient, true)
  }, [permission, done, onSuccess])

  const finishManual = () => {
    if (successFiredRef.current) return
    successFiredRef.current = true
    setDone(true)
    setLockedGreen(true)
    setAlign(1)
    playVaultLockSfx()
    onSuccess()
  }

  const lampColor = lockedGreen
    ? '#22c55e'
    : align > 0.55
      ? '#eab308'
      : '#ef4444'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 230,
        background: 'radial-gradient(ellipse at 50% 20%, rgba(88,28,135,0.45), rgba(2,6,18,0.96) 55%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '16px 16px calc(22px + env(safe-area-inset-bottom, 0px))',
        direction: 'rtl',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#f5d0fe' }}>🥷 دزی · خەزێنەی {victimName}</div>
          <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
            {mode === 'online' ? 'ئۆنلاین · %٧ زێڕ + %٥ ئەڵماس' : 'ئۆفلاین · %٥ زێڕ + %٣ ئەڵماس'}
            {' · '}
            <span style={{ direction: 'ltr', display: 'inline-block' }}>{secondsLeft}s</span>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            height: 220,
            borderRadius: 20,
            background: 'linear-gradient(180deg, rgba(15,23,42,0.9), rgba(8,10,24,0.95))',
            border: `1px solid ${lockedGreen ? 'rgba(34,197,94,0.55)' : 'rgba(192,132,252,0.35)'}`,
            boxShadow: lockedGreen ? '0 0 28px rgba(34,197,94,0.35)' : '0 0 22px rgba(168,85,247,0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: lampColor,
              boxShadow: `0 0 28px ${lampColor}`,
              transition: 'background 120ms linear, box-shadow 120ms linear',
            }}
          />
          <div style={{ fontSize: 42, filter: lockedGreen ? 'none' : 'grayscale(0.4)' }}>🔐</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#e2e8f0', textAlign: 'center', padding: '0 16px' }}>
            {hint}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 6,
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round(align * 100)}%`,
                background: lockedGreen
                  ? 'linear-gradient(90deg, #22c55e, #86efac)'
                  : 'linear-gradient(90deg, #a855f7, #f472b6)',
                transition: 'width 80ms linear',
              }}
            />
          </div>
        </div>

        {permission !== 'granted' ? (
          <button
            type="button"
            onClick={() => { void requestPermission() }}
            className="btn-interactive"
            style={{
              background: 'linear-gradient(135deg, rgba(192,132,252,0.4), rgba(88,28,135,0.45))',
              border: '1px solid rgba(192,132,252,0.55)',
              borderRadius: 14,
              padding: '14px 12px',
              color: '#f5d0fe',
              fontWeight: 900,
              fontSize: 12,
              fontFamily: 'var(--kd-font)',
            }}
          >
            {permission === 'denied'
              ? 'مۆڵەتی ژیۆسکۆپ ڕەتکرا — دوبارە هەوڵبدەرەوە'
              : 'چالاککردنی سێنسەری ژیۆسکۆپ'}
          </button>
        ) : manualFallback ? (
          <button
            type="button"
            onClick={finishManual}
            className="btn-interactive"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.35), rgba(21,128,61,0.4))',
              border: '1px solid rgba(34,197,94,0.55)',
              borderRadius: 14,
              padding: '14px 12px',
              color: '#bbf7d0',
              fontWeight: 900,
              fontSize: 12,
              fontFamily: 'var(--kd-font)',
            }}
          >
            کردنەوەی قوفڵ (دەستی) 🔓
          </button>
        ) : (
          <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center', lineHeight: 1.5 }}>
            مۆبایلەکە لە هەوادا ڕابگرە تا گڵۆپەکە سەوز ببێت و دەنگی قوفڵ لێبدات.
          </div>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="btn-interactive"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 12,
            padding: '12px 8px',
            color: '#94a3b8',
            fontWeight: 900,
            fontSize: 11,
            fontFamily: 'var(--kd-font)',
          }}
        >
          هەڵوەشاندنەوەی دزی
        </button>
      </div>
    </div>
  )
}
