import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ARENA_COVER,
  ARENA_H,
  ARENA_W,
  FIGHT_MAX_AMMO,
  FIGHT_MAX_HP,
  addDuelReaction,
  hostSimulateTick,
  pushDuelInput,
  pushHostDuelState,
  settleDuel,
  subscribeToDuel,
  type DuelInput,
  type DuelRoom,
  type FighterState,
} from '../services/duelService'

type Mode = 'fighter' | 'spectator'

export interface TpsArenaDuelProps {
  duelId: string
  myUid: string
  mode: Mode
  soundEnabled?: boolean
  onClose: () => void
  onSettled?: (info: {
    outcome: string
    goldAmount: number
    winnerUid: string | null
    loserUid: string | null
    iAmWinner: boolean
    iAmLoser: boolean
    isDraw: boolean
    smokeUntilMs: number
    loserBanUntilMs: number
  }) => void
  playGunSfx?: () => void
  playReloadSfx?: () => void
}

const SPECTATE_EMOJIS = ['🔥', '💀', '😂', '👏', '⚡', '❤️']

function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function Joystick({
  onChange,
}: {
  onChange: (x: number, y: number) => void
}) {
  const baseRef = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const active = useRef(false)

  const update = (clientX: number, clientY: number) => {
    const el = baseRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let dx = clientX - cx
    let dy = clientY - cy
    const max = rect.width * 0.38
    const len = Math.hypot(dx, dy) || 1
    if (len > max) {
      dx = (dx / len) * max
      dy = (dy / len) * max
    }
    setKnob({ x: dx, y: dy })
    onChange(dx / max, dy / max)
  }

  const end = () => {
    active.current = false
    setKnob({ x: 0, y: 0 })
    onChange(0, 0)
  }

  return (
    <div
      ref={baseRef}
      onPointerDown={e => {
        active.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        update(e.clientX, e.clientY)
      }}
      onPointerMove={e => {
        if (!active.current) return
        update(e.clientX, e.clientY)
      }}
      onPointerUp={end}
      onPointerCancel={end}
      style={{
        width: 108,
        height: 108,
        borderRadius: '50%',
        background: 'rgba(15,23,42,0.55)',
        border: '1.5px solid rgba(148,163,184,0.45)',
        position: 'relative',
        touchAction: 'none',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 44,
          height: 44,
          marginLeft: -22 + knob.x,
          marginTop: -22 + knob.y,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, rgba(251,113,133,0.95), rgba(127,29,29,0.9))',
          border: '2px solid rgba(254,202,202,0.7)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

export default function TpsArenaDuel({
  duelId,
  myUid,
  mode,
  soundEnabled = true,
  onClose,
  onSettled,
  playGunSfx,
  playReloadSfx,
}: TpsArenaDuelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const roomRef = useRef<DuelRoom | null>(null)
  const [room, setRoom] = useState<DuelRoom | null>(null)
  const [nowMs, setNowMs] = useState(Date.now())
  const [rain, setRain] = useState<{ id: string; emoji: string; x: number }[]>([])
  const moveRef = useRef({ x: 0, y: 0 })
  const aimRef = useRef({ x: 0, y: 0 })
  const shootRef = useRef(false)
  const medkitRef = useRef(false)
  const seqRef = useRef(0)
  const lastPushRef = useRef(0)
  const lastHostTickRef = useRef(0)
  const settlingRef = useRef(false)
  const lastShotSfxRef = useRef(0)
  const lastReloadSfxRef = useRef(0)
  const seenReactionsRef = useRef<Set<string>>(new Set())
  const camAngleRef = useRef(0)
  const localPosRef = useRef({ x: 0, y: 0 })

  const isHost = room?.hostUid === myUid
  const amChallenger = room?.challengerUid === myUid
  const amFighter = mode === 'fighter' && (room?.challengerUid === myUid || room?.defenderUid === myUid)

  useEffect(() => {
    const unsub = subscribeToDuel(duelId, next => {
      roomRef.current = next
      setRoom(next)
    })
    return unsub
  }, [duelId])

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  // کاردانەوەی سێپێکتەیت — بارانی ئیمۆجی
  useEffect(() => {
    if (!room) return
    for (const r of room.reactions) {
      if (seenReactionsRef.current.has(r.id)) continue
      seenReactionsRef.current.add(r.id)
      setRain(prev => [...prev, { id: r.id, emoji: r.emoji, x: 10 + Math.random() * 80 }])
      window.setTimeout(() => {
        setRain(prev => prev.filter(x => x.id !== r.id))
      }, 2200)
    }
  }, [room?.reactions])

  const myFighter = (): FighterState | null => {
    const r = roomRef.current
    if (!r) return null
    if (r.challengerUid === myUid) return r.challenger
    if (r.defenderUid === myUid) return r.defender
    return null
  }

  // ناردنی ئینپوت + هۆست سیمولەیشن
  useEffect(() => {
    if (!amFighter || !room || room.status !== 'active') return

    const tick = () => {
      const r = roomRef.current
      if (!r || r.status !== 'active') return
      const now = Date.now()
      const me = myFighter()
      if (!me) return

      // ئامانج لە جۆیستیکی ڕاست
      let angle = me.angle
      const ax = aimRef.current.x
      const ay = aimRef.current.y
      if (Math.hypot(ax, ay) > 0.2) {
        angle = Math.atan2(ay, ax)
      }
      camAngleRef.current += (angle - camAngleRef.current) * 0.18

      const input: DuelInput = {
        moveX: moveRef.current.x,
        moveY: moveRef.current.y,
        angle,
        shoot: shootRef.current,
        medkit: medkitRef.current,
        seq: ++seqRef.current,
        atMs: now,
      }
      shootRef.current = false
      medkitRef.current = false

      if (now - lastPushRef.current > 110) {
        lastPushRef.current = now
        const role = amChallenger ? 'challenger' : 'defender'
        void pushDuelInput(duelId, role, input)
      }

      // پێشبینینی ناوخۆیی بۆ خۆی
      const len = Math.hypot(input.moveX, input.moveY)
      if (len > 0.08) {
        localPosRef.current = {
          x: me.x + (input.moveX / len) * 0.12,
          y: me.y + (input.moveY / len) * 0.12,
        }
      } else {
        localPosRef.current = { x: me.x, y: me.y }
      }

      if (isHost && now - lastHostTickRef.current > 140) {
        lastHostTickRef.current = now
        // تێکەڵکردنی ئینپوتی خۆمان پێش سیمولەیشن
        const withInput: DuelRoom = {
          ...r,
          inputChallenger: amChallenger ? input : r.inputChallenger,
          inputDefender: !amChallenger ? input : r.inputDefender,
        }
        const next = hostSimulateTick(withInput, now)
        roomRef.current = next
        setRoom(next)
        void pushHostDuelState(duelId, {
          challenger: next.challenger,
          defender: next.defender,
          status: next.status,
          outcome: next.outcome,
          winnerUid: next.winnerUid,
          loserUid: next.loserUid,
          lastTickMs: next.lastTickMs,
        })

        if (
          next.challenger.lastShotAtMs > lastShotSfxRef.current ||
          next.defender.lastShotAtMs > lastShotSfxRef.current
        ) {
          const latest = Math.max(next.challenger.lastShotAtMs, next.defender.lastShotAtMs)
          if (latest > lastShotSfxRef.current && soundEnabled) {
            lastShotSfxRef.current = latest
            playGunSfx?.()
          }
        }
        if (
          (next.challenger.reloadingUntilMs > now && next.challenger.ammo === 0) ||
          (next.defender.reloadingUntilMs > now && next.defender.ammo === 0)
        ) {
          if (now - lastReloadSfxRef.current > 1500 && soundEnabled) {
            lastReloadSfxRef.current = now
            playReloadSfx?.()
          }
        }
      }
    }

    const id = window.setInterval(tick, 50)
    return () => window.clearInterval(id)
  }, [amFighter, amChallenger, isHost, room?.status, duelId, soundEnabled, playGunSfx, playReloadSfx])

  // کۆتایی — settle
  useEffect(() => {
    if (!room || room.status !== 'finished' || settlingRef.current) return
    if (mode !== 'fighter') return
    settlingRef.current = true
    void (async () => {
      try {
        const result = await settleDuel(duelId, myUid)
        if (result && onSettled) {
          onSettled({
            outcome: result.outcome,
            goldAmount: result.goldAmount,
            winnerUid: result.winnerUid,
            loserUid: result.loserUid,
            iAmWinner: result.winnerUid === myUid,
            iAmLoser: result.loserUid === myUid,
            isDraw: result.outcome === 'draw',
            smokeUntilMs: result.smokeUntilMs,
            loserBanUntilMs: result.loserBanUntilMs,
          })
        }
      } catch (err) {
        console.error('settleDuel failed', err)
      }
    })()
  }, [room?.status, duelId, myUid, mode, onSettled])

  // وێنەکێشانی کانڤاس — TPS پشت سەرشان
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const draw = () => {
      const r = roomRef.current
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * devicePixelRatio || canvas.height !== h * devicePixelRatio) {
        canvas.width = Math.floor(w * devicePixelRatio)
        canvas.height = Math.floor(h * devicePixelRatio)
      }
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // ئاسمان / شەقام
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, '#0b1224')
      grad.addColorStop(0.45, '#1e293b')
      grad.addColorStop(1, '#334155')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      if (!r) {
        raf = requestAnimationFrame(draw)
        return
      }

      const me =
        mode === 'fighter'
          ? r.challengerUid === myUid
            ? r.challenger
            : r.defenderUid === myUid
              ? r.defender
              : r.challenger
          : r.challenger

      const isLocalFighter =
        mode === 'fighter' && (r.challengerUid === myUid || r.defenderUid === myUid)
      const camX = isLocalFighter
        ? (localPosRef.current.x || me.x)
        : (r.challenger.x + r.defender.x) / 2
      const camY = isLocalFighter
        ? (localPosRef.current.y || me.y)
        : (r.challenger.y + r.defender.y) / 2
      const camAngle = mode === 'spectator' ? nowMs / 4000 : camAngleRef.current || me.angle

      // کامێرای پشت سەرشان
      const camDist = 4.2
      const eyeX = camX - Math.cos(camAngle) * camDist
      const eyeY = camY - Math.sin(camAngle) * camDist

      const project = (wx: number, wy: number) => {
        const dx = wx - eyeX
        const dy = wy - eyeY
        const cos = Math.cos(-camAngle + Math.PI / 2)
        const sin = Math.sin(-camAngle + Math.PI / 2)
        const rx = dx * cos - dy * sin
        const ry = dx * sin + dy * cos
        const depth = ry + 6
        const scale = 220 / Math.max(2.5, depth)
        return {
          x: w * 0.5 + rx * scale * 1.15,
          y: h * 0.62 - (depth - 6) * scale * 0.35,
          scale,
          depth,
        }
      }

      // زەوی
      ctx.save()
      for (let gx = 0; gx <= ARENA_W; gx += 2) {
        for (let gy = 0; gy <= ARENA_H; gy += 2) {
          const p = project(gx, gy)
          if (p.depth < 1.5 || p.depth > 28) continue
          const shade = (gx + gy) % 4 === 0 ? '#3f4b5e' : '#2c3648'
          ctx.fillStyle = shade
          ctx.globalAlpha = Math.max(0.15, 1 - p.depth / 30)
          ctx.fillRect(p.x - p.scale * 0.55, p.y - p.scale * 0.28, p.scale * 1.1, p.scale * 0.55)
        }
      }
      ctx.restore()
      ctx.globalAlpha = 1

      // دیوارەکانی دەوروبەر
      const walls = [
        { x: 0, y: 0, w: ARENA_W, h: 0.6 },
        { x: 0, y: ARENA_H - 0.6, w: ARENA_W, h: 0.6 },
        { x: 0, y: 0, w: 0.6, h: ARENA_H },
        { x: ARENA_W - 0.6, y: 0, w: 0.6, h: ARENA_H },
      ]
      const drawBox = (bx: number, by: number, bw: number, bh: number, color: string, hMul = 1.1) => {
        const corners = [
          project(bx, by),
          project(bx + bw, by),
          project(bx + bw, by + bh),
          project(bx, by + bh),
        ]
        const avgDepth = corners.reduce((s, c) => s + c.depth, 0) / 4
        if (avgDepth < 1.2 || avgDepth > 30) return
        const avgScale = corners.reduce((s, c) => s + c.scale, 0) / 4
        const cx = corners.reduce((s, c) => s + c.x, 0) / 4
        const cy = corners.reduce((s, c) => s + c.y, 0) / 4
        ctx.fillStyle = color
        ctx.globalAlpha = Math.max(0.35, 1 - avgDepth / 32)
        ctx.beginPath()
        corners.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)))
        ctx.closePath()
        ctx.fill()
        // بەرزی
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        ctx.fillRect(cx - avgScale * 0.4, cy - avgScale * hMul, avgScale * 0.8, avgScale * hMul * 0.9)
        ctx.globalAlpha = 1
      }

      walls.forEach(wall => drawBox(wall.x, wall.y, wall.w, wall.h, '#1a2333', 1.6))
      ARENA_COVER.forEach((c, i) => {
        drawBox(c.x, c.y, c.w, c.h, i % 2 === 0 ? '#6b4f3a' : '#4b5563', 1.35)
      })

      const drawFighter = (f: FighterState, color: string, label: string, isLocal: boolean) => {
        const px = isLocal && mode === 'fighter' ? localPosRef.current.x || f.x : f.x
        const py = isLocal && mode === 'fighter' ? localPosRef.current.y || f.y : f.y
        const p = project(px, py)
        if (p.depth < 1 || p.depth > 28) return
        const s = p.scale * 0.12
        // سێبەر
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.beginPath()
        ctx.ellipse(p.x, p.y + s * 2, s * 2.2, s * 0.9, 0, 0, Math.PI * 2)
        ctx.fill()
        // جەستە
        const bodyGrad = ctx.createLinearGradient(p.x, p.y - s * 8, p.x, p.y + s * 2)
        bodyGrad.addColorStop(0, color)
        bodyGrad.addColorStop(1, '#0f172a')
        ctx.fillStyle = bodyGrad
        ctx.fillRect(p.x - s * 1.6, p.y - s * 7.5, s * 3.2, s * 8.5)
        // سەر
        ctx.fillStyle = '#fde68a'
        ctx.beginPath()
        ctx.arc(p.x, p.y - s * 8.2, s * 1.35, 0, Math.PI * 2)
        ctx.fill()
        // چەک
        const gunLen = s * 4.5
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = Math.max(2, s * 0.45)
        ctx.beginPath()
        ctx.moveTo(p.x, p.y - s * 4)
        ctx.lineTo(p.x + Math.cos(f.angle - camAngle + Math.PI / 2) * gunLen, p.y - s * 4 + Math.sin(f.angle - camAngle + Math.PI / 2) * gunLen * 0.4)
        ctx.stroke()
        // ناونیشان
        ctx.fillStyle = '#fff'
        ctx.font = `900 ${Math.max(9, s * 1.6)}px NRT, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(label, p.x, p.y - s * 11)
        if (f.inCover) {
          ctx.fillStyle = '#86efac'
          ctx.font = `800 ${Math.max(8, s * 1.2)}px NRT, sans-serif`
          ctx.fillText('کڤەر', p.x, p.y - s * 9.2)
        }
      }

      // ڕیزکردن بەپێی قووڵی
      const fighters = [
        { f: r.challenger, color: '#f43f5e', label: r.challengerName, local: r.challengerUid === myUid },
        { f: r.defender, color: '#38bdf8', label: r.defenderName, local: r.defenderUid === myUid },
      ].sort((a, b) => {
        const da = project(a.f.x, a.f.y).depth
        const db = project(b.f.x, b.f.y).depth
        return db - da
      })
      fighters.forEach(item => drawFighter(item.f, item.color, item.label, item.local))

      // مەودای ئامانج (TPS reticle)
      if (mode === 'fighter') {
        ctx.strokeStyle = 'rgba(251,113,133,0.75)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(w * 0.5, h * 0.42, 16, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(w * 0.5 - 26, h * 0.42)
        ctx.lineTo(w * 0.5 - 10, h * 0.42)
        ctx.moveTo(w * 0.5 + 10, h * 0.42)
        ctx.lineTo(w * 0.5 + 26, h * 0.42)
        ctx.moveTo(w * 0.5, h * 0.42 - 26)
        ctx.lineTo(w * 0.5, h * 0.42 - 10)
        ctx.moveTo(w * 0.5, h * 0.42 + 10)
        ctx.lineTo(w * 0.5, h * 0.42 + 26)
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [myUid, mode, nowMs])

  const sendEmoji = useCallback(async (emoji: string) => {
    try {
      await addDuelReaction(duelId, myUid, emoji)
    } catch {}
  }, [duelId, myUid])

  const challenger = room?.challenger
  const defender = room?.defender
  const me = myFighter()
  const timeLeft = room?.status === 'active'
    ? Math.max(0, (room.endsAtMs || 0) - nowMs)
    : room?.status === 'pending'
      ? Math.max(0, (room.expiresAtMs || 0) - nowMs)
      : 0

  const resultText = (() => {
    if (!room || room.status !== 'finished') return null
    if (room.outcome === 'draw') return { title: '🤝 یەکسان!', sub: 'هیچ قەدەغەیەک نییە' }
    if (room.winnerUid === myUid) return { title: '⚔️ سەرکەوتیت!', sub: `${room.goldAmount.toLocaleString()} زێڕت لێ داگرت` }
    if (room.loserUid === myUid) return { title: '💥 دۆڕایت!', sub: 'قەدەغەی ٢٤ کاتژمێر · دوکەڵ ٥ خولەک' }
    return { title: 'کۆتایی شەڕ', sub: room.outcome === 'challenger_win' ? `${room.challengerName} بردەوە` : `${room.defenderName} بردەوە` }
  })()

  return (
    <div
      className="kd-tps-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 230,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2,6,18,0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        direction: 'rtl',
        padding: 10,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          height: 'min(92vh, 760px)',
          borderRadius: 22,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.16)',
          background: 'linear-gradient(165deg, rgba(15,23,42,0.88), rgba(2,6,18,0.95))',
          boxShadow: '0 30px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* سەرپەڕە */}
        <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fecaca' }}>
              {mode === 'spectator' ? '🔴 LIVE · بینینی شەڕ' : '⚔️ ئارێنای شەڕ · ١v١'}
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 800, marginTop: 2 }}>
              {room ? `${room.challengerName} vs ${room.defenderName}` : '...'}
            </div>
          </div>
          <div style={{ textAlign: 'left', direction: 'ltr' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{formatClock(timeLeft)}</div>
            <div style={{ fontSize: 8, color: '#64748b', fontWeight: 800 }}>٤ خولەک</div>
          </div>
        </div>

        {/* HP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px 8px' }}>
          {[challenger, defender].map((f, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '6px 8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: i === 0 ? '#fda4af' : '#7dd3fc', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f?.name || '—'}
              </div>
              <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(0, Math.min(100, ((f?.hp ?? 0) / FIGHT_MAX_HP) * 100))}%`,
                  background: i === 0
                    ? 'linear-gradient(90deg, #fb7185, #ef4444)'
                    : 'linear-gradient(90deg, #38bdf8, #2563eb)',
                  transition: 'width 0.2s',
                }} />
              </div>
              <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 3, fontWeight: 800 }}>{f?.hp ?? 0}/{FIGHT_MAX_HP}</div>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

          {/* بارانی ئیمۆجی */}
          {rain.map(item => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: 8,
                left: `${item.x}%`,
                fontSize: 28,
                animation: 'kdEmojiRain 2.1s ease-out forwards',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            >
              {item.emoji}
            </div>
          ))}

          {resultText && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(2,6,18,0.72)', zIndex: 6,
            }}>
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{resultText.title}</div>
                <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8, fontWeight: 800 }}>{resultText.sub}</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-interactive"
                  style={{
                    marginTop: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 12, padding: '10px 24px', color: '#fff', fontWeight: 900, fontSize: 12, fontFamily: 'var(--kd-font)',
                  }}
                >
                  باشە
                </button>
              </div>
            </div>
          )}
        </div>

        {/* کۆنترۆڵ / سێپێکتەیت */}
        {mode === 'fighter' && room?.status === 'active' && me && (
          <div style={{ padding: '8px 12px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ fontSize: 8, color: '#64748b', fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>جوڵە</div>
              <Joystick onChange={(x, y) => { moveRef.current = { x, y } }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#e2e8f0' }}>
                فیشەک {me.ammo}/{FIGHT_MAX_AMMO}
                {me.reloadingUntilMs > nowMs ? (
                  <span style={{ color: '#fbbf24' }}> · پڕکردنەوە {Math.ceil((me.reloadingUntilMs - nowMs) / 1000)}ث</span>
                ) : null}
              </div>
              <button
                type="button"
                disabled={!me.inCover || me.medkitUntilMs > nowMs || me.hp >= FIGHT_MAX_HP}
                onClick={() => { medkitRef.current = true }}
                className="btn-interactive"
                style={{
                  background: me.inCover ? 'rgba(34,197,94,0.25)' : 'rgba(100,116,139,0.2)',
                  border: `1px solid ${me.inCover ? 'rgba(74,222,128,0.55)' : 'rgba(100,116,139,0.35)'}`,
                  borderRadius: 12, padding: '8px 12px', color: me.inCover ? '#bbf7d0' : '#64748b',
                  fontWeight: 900, fontSize: 10, fontFamily: 'var(--kd-font)',
                  opacity: !me.inCover || me.medkitUntilMs > nowMs ? 0.5 : 1,
                }}
              >
                💊 ميدکیت {me.inCover ? '(لە کڤەر)' : '(پێویستت بە کڤەرە)'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 8, color: '#64748b', fontWeight: 800 }}>ئامانج</div>
              <Joystick onChange={(x, y) => { aimRef.current = { x, y } }} />
              <button
                type="button"
                onPointerDown={() => { shootRef.current = true; if (soundEnabled) playGunSfx?.() }}
                className="btn-interactive"
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, #fda4af, #7f1d1d)',
                  border: '2px solid #fecaca', color: '#fff', fontWeight: 900, fontSize: 12,
                  fontFamily: 'var(--kd-font)', boxShadow: '0 0 20px rgba(239,68,68,0.45)',
                }}
              >
                FIRE
              </button>
            </div>
          </div>
        )}

        {mode === 'spectator' && (
          <div style={{ padding: '10px 12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#fda4af', marginBottom: 8, textAlign: 'center' }}>
              🔴 LIVE 1v1 WAR — کامێرای ئازاد · بارانی ئیمۆجی
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {SPECTATE_EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => void sendEmoji(e)}
                  className="btn-interactive"
                  style={{
                    width: 42, height: 42, borderRadius: 12, fontSize: 20,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-interactive"
              style={{
                marginTop: 10, width: '100%', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: '10px',
                color: '#94a3b8', fontWeight: 900, fontSize: 11, fontFamily: 'var(--kd-font)',
              }}
            >
              داخستن
            </button>
          </div>
        )}

        {mode === 'fighter' && room?.status === 'active' && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute', top: 10, left: 10, zIndex: 8,
              background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, color: '#94a3b8', fontSize: 10, fontWeight: 900,
              padding: '6px 10px', fontFamily: 'var(--kd-font)',
            }}
          >
            بچووککردنەوە
          </button>
        )}
      </div>

      <style>{`
        @keyframes kdEmojiRain {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 1; transform: translateY(12px) scale(1.15); }
          100% { transform: translateY(180px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
