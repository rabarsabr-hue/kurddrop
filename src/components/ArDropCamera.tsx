/** ڕوکاری کامێرای AR بۆ کردنەوەی درۆپ لەسەر زەوی */
import { useEffect, useRef, useState } from 'react'

export type ArDropChestVisual = {
  name: string
  rarity: string
  tarpColor: string
  p1: string
  p2?: string
  boxColor: string
}

type ArDropCameraProps = {
  chest: ArDropChestVisual
  distM: number
  claiming: boolean
  claimBurst: boolean
  onClose: () => void
  onClaim: () => void
}

export function ArDropCamera({
  chest,
  distM,
  claiming,
  claimBurst,
  onClose,
  onClaim,
}: ArDropCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [camError, setCamError] = useState<string | null>(null)
  const [camReady, setCamReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError('ئامێرەکەت کامێرا پاڵپشتی ناکات')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
        }
        setCamReady(true)
      } catch {
        setCamError('نەتوانرا کامێرای دواوە بکرێتەوە — مۆڵەتی کامێرا بدە')
      }
    }
    void start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  return (
    <div className="kd-ar-drop-root" role="dialog" aria-modal="true" aria-label="کامێرای درۆپ">
      <video
        ref={videoRef}
        className="kd-ar-drop-video"
        playsInline
        muted
        autoPlay
      />
      {!camReady && !camError && (
        <div className="kd-ar-drop-loading">کردنەوەی کامێرا...</div>
      )}
      {camError && (
        <div className="kd-ar-drop-error">
          <p>{camError}</p>
          <p className="kd-ar-drop-error-sub">هێشتا دەتوانیت درۆپەکە بکەیتەوە</p>
        </div>
      )}

      <div className="kd-ar-drop-hud" dir="rtl">
        <button type="button" className="btn-interactive kd-ar-drop-close" onClick={onClose} aria-label="داخستن">
          <i className="material-icons">close</i>
        </button>
        <div className="kd-ar-drop-dist">
          {Math.round(distM)} م · {chest.name}
        </div>
      </div>

      <button
        type="button"
        className={`kd-ar-drop-target${claimBurst ? ' is-burst' : ''}${claiming ? ' is-claiming' : ''}`}
        onClick={() => { if (!claiming) onClaim() }}
        disabled={claiming}
        aria-label="کردنەوەی درۆپ"
        style={{
          ['--kd-drop-neon' as string]: chest.tarpColor,
          ['--kd-drop-neon-soft' as string]: chest.p1,
        }}
      >
        <div className="kd-ar-drop-aura" aria-hidden="true" />
        <div className="kd-ar-drop-particles" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={`kd-ar-drop-particle p${i + 1}`} />
          ))}
        </div>
        <div className="kd-ar-drop-crate">
          <div
            className="kd-ar-drop-crate-lid"
            style={{ background: `linear-gradient(180deg, ${chest.p1}, ${chest.tarpColor})` }}
          />
          <div
            className="kd-ar-drop-crate-body"
            style={{
              background: `linear-gradient(165deg, rgba(255,255,255,0.22), ${chest.boxColor})`,
              borderColor: chest.tarpColor,
            }}
          />
          <div className="kd-ar-drop-crate-sheen" />
        </div>
        <span className="kd-ar-drop-tap-hint">
          {claiming ? 'کردنەوە...' : 'کلیک بکە بۆ کردنەوە'}
        </span>
      </button>
    </div>
  )
}
