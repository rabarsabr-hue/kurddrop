/** Procedural Web Audio SFX — no external assets. */

export type SoundEffectType =
  | 'spin'
  | 'spinTick'
  | 'win'
  | 'splat'
  | 'roar'
  | 'vroom'
  | 'coin'
  | 'rain'
  | 'goldRain'
  | 'angel'
  | 'crystal'
  | 'waves'
  | 'fanfare'
  | 'galaxy'
  | 'chat'
  | 'levelUp'

let audioCtx: AudioContext | null = null
let sfxMuted = false
let sfxVolume = 1
let spinTickTimers: number[] = []

/** Mute / volume control for playSoundEffect */
export function configureSfx(opts: { muted?: boolean; volume?: number }): void {
  if (typeof opts.muted === 'boolean') sfxMuted = opts.muted
  if (typeof opts.volume === 'number' && Number.isFinite(opts.volume)) {
    sfxVolume = Math.min(1, Math.max(0, opts.volume))
  }
}

export function getSfxConfig(): { muted: boolean; volume: number } {
  return { muted: sfxMuted, volume: sfxVolume }
}

/** جیاکاری دەنگ بەپێی جۆر — بۆکس/دیاری/گشتی، هەریەکە مافی خۆی بۆ mute/volume هەیە */
export type SfxCategory = 'general' | 'gift'

const categoryMuted: Record<SfxCategory, boolean> = { general: false, gift: false }
const categoryVolume: Record<SfxCategory, number> = { general: 1, gift: 1 }
let activeCategory: SfxCategory = 'general'

export function configureSfxCategory(category: SfxCategory, opts: { muted?: boolean; volume?: number }): void {
  if (typeof opts.muted === 'boolean') categoryMuted[category] = opts.muted
  if (typeof opts.volume === 'number' && Number.isFinite(opts.volume)) {
    categoryVolume[category] = Math.min(1, Math.max(0, opts.volume))
  }
}

function gainScale(): number {
  if (sfxMuted || sfxVolume <= 0.001) return 0
  if (categoryMuted[activeCategory] || categoryVolume[activeCategory] <= 0.001) return 0
  return sfxVolume * categoryVolume[activeCategory]
}

function getAudioContext(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!audioCtx) audioCtx = new AC()
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

function tone(
  ctx: AudioContext,
  opts: {
    freq: number
    freqEnd?: number
    type?: OscillatorType
    start?: number
    dur?: number
    gain?: number
    gainEnd?: number
  },
) {
  const scale = gainScale()
  if (scale <= 0) return
  const start = opts.start ?? 0
  const dur = opts.dur ?? 0.18
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(opts.freq, ctx.currentTime + start)
  if (opts.freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), ctx.currentTime + start + dur)
  }
  const peak = (opts.gain ?? 0.12) * scale
  const end = opts.gainEnd ?? 0.0001
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), ctx.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(end, ctx.currentTime + start + dur)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + dur + 0.02)
}

function noiseBurst(ctx: AudioContext, start: number, dur: number, gain = 0.08, freq = 900, q = 0.8) {
  const scale = gainScale()
  if (scale <= 0) return
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const g = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = q
  g.gain.setValueAtTime(gain * scale, ctx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)
  src.connect(filter)
  filter.connect(g)
  g.connect(ctx.destination)
  src.start(ctx.currentTime + start)
  src.stop(ctx.currentTime + start + dur + 0.02)
}

/** چەقە چەقی میکانیکی — لێواری خانەی چەرخ */
function playMechanicalTick(ctx: AudioContext, intensity = 1): void {
  const g = 0.1 * Math.max(0.35, Math.min(1.15, intensity))
  // کلیکی توند و خاوێن (پلاستیک/مێتاڵ)
  tone(ctx, { freq: 2100, freqEnd: 780, type: 'square', dur: 0.022, gain: g * 0.62 })
  tone(ctx, { freq: 540, freqEnd: 210, type: 'triangle', dur: 0.038, gain: g * 0.48 })
  noiseBurst(ctx, 0, 0.028, g * 0.55, 2400, 1.4)
}

/** وەستاندنی هەموو چەقەکانی سووڕان */
export function stopSpinWheelTicks(): void {
  for (const id of spinTickTimers) window.clearTimeout(id)
  spinTickTimers = []
}

/**
 * چەقە چەقی ڕاستەقینە لە ماوەی سووڕان — خێرا دەستپێدەکات و وەک چەرخەکە هێواش دەبێتەوە.
 * durationMs پێویستە لەگەڵ CSS transition ی چەرخەکە بگونجێت.
 */
export function startSpinWheelTicks(durationMs = 4800): void {
  stopSpinWheelTicks()
  if (gainScale() <= 0) return
  const ctx = getAudioContext()
  if (!ctx) return

  const times: number[] = []
  let t = 0
  // ناوەندەکان لە ~36ms دەستپێدەکەن و تا ~300ms زیاد دەبن (ease-out)
  while (t < durationMs - 60) {
    const p = Math.min(1, t / durationMs)
    const interval = 36 + Math.pow(p, 1.55) * 270
    times.push(t)
    t += interval
  }

  for (const ms of times) {
    const id = window.setTimeout(() => {
      try {
        const c = getAudioContext()
        if (!c || gainScale() <= 0) return
        // کاتێک هێواش دەبێتەوە، دەنگ کەمێک نەرمتر دەبێت
        const progress = Math.min(1, ms / durationMs)
        playMechanicalTick(c, 1.05 - progress * 0.35)
      } catch {
        // ignore
      }
    }, ms)
    spinTickTimers.push(id)
  }
}

/** دەنگی کاریگەرییەکان — Web Audio API */
export function playSoundEffect(type: SoundEffectType, category: SfxCategory = 'general'): void {
  activeCategory = category
  if (gainScale() <= 0) { activeCategory = 'general'; return }
  const ctx = getAudioContext()
  if (!ctx) { activeCategory = 'general'; return }
  try {
    switch (type) {
      case 'spin':
        // گەڕانەوە بۆ زنجیرەی چەقەکان (بۆ بانگەکانی کۆن)
        startSpinWheelTicks(4800)
        break
      case 'spinTick':
        playMechanicalTick(ctx, 1)
        break
      case 'win':
        // Jackpot / Win — دەنگی سەرکەوتنی درەوشاوە
        tone(ctx, { freq: 523.25, type: 'triangle', dur: 0.12, gain: 0.1 })
        tone(ctx, { freq: 659.25, type: 'triangle', start: 0.1, dur: 0.12, gain: 0.11 })
        tone(ctx, { freq: 783.99, type: 'triangle', start: 0.2, dur: 0.14, gain: 0.12 })
        tone(ctx, { freq: 1046.5, type: 'sine', start: 0.34, dur: 0.28, gain: 0.13 })
        tone(ctx, { freq: 1318.5, type: 'sine', start: 0.48, dur: 0.35, gain: 0.1 })
        tone(ctx, { freq: 1568, type: 'triangle', start: 0.55, dur: 0.4, gain: 0.07 })
        // درەوشانەوەی کۆین
        tone(ctx, { freq: 1760, type: 'sine', start: 0.42, dur: 0.1, gain: 0.06 })
        tone(ctx, { freq: 2093, type: 'sine', start: 0.62, dur: 0.18, gain: 0.05 })
        noiseBurst(ctx, 0.35, 0.12, 0.04, 3200, 0.6)
        break
      case 'splat':
        noiseBurst(ctx, 0, 0.18, 0.14)
        tone(ctx, { freq: 180, freqEnd: 60, type: 'sine', dur: 0.22, gain: 0.1 })
        tone(ctx, { freq: 90, freqEnd: 40, type: 'triangle', start: 0.04, dur: 0.2, gain: 0.06 })
        break
      case 'roar':
        // شێری ڕاستەقینە — زڕەی قووڵ و درێژ
        tone(ctx, { freq: 95, freqEnd: 55, type: 'sawtooth', dur: 0.85, gain: 0.13 })
        tone(ctx, { freq: 70, freqEnd: 42, type: 'square', start: 0.04, dur: 0.8, gain: 0.07 })
        tone(ctx, { freq: 140, freqEnd: 90, type: 'triangle', start: 0.12, dur: 0.55, gain: 0.05 })
        noiseBurst(ctx, 0.06, 0.55, 0.1, 420, 0.7)
        noiseBurst(ctx, 0.35, 0.4, 0.07, 280, 0.55)
        break
      case 'vroom':
        // ئۆتۆمبیل / فڕۆکە — مۆتۆری ڕاستەقینەتر
        tone(ctx, { freq: 70, freqEnd: 320, type: 'sawtooth', dur: 0.7, gain: 0.11 })
        tone(ctx, { freq: 110, freqEnd: 480, type: 'square', start: 0.05, dur: 0.65, gain: 0.05 })
        tone(ctx, { freq: 55, freqEnd: 180, type: 'triangle', start: 0.1, dur: 0.8, gain: 0.06 })
        noiseBurst(ctx, 0.08, 0.55, 0.07, 900, 0.6)
        noiseBurst(ctx, 0.4, 0.35, 0.05, 1400, 0.5)
        break
      case 'coin':
        tone(ctx, { freq: 980, type: 'sine', dur: 0.1, gain: 0.1 })
        tone(ctx, { freq: 1310, type: 'sine', start: 0.08, dur: 0.12, gain: 0.09 })
        tone(ctx, { freq: 1760, type: 'triangle', start: 0.16, dur: 0.18, gain: 0.07 })
        break
      case 'rain': {
        // بارانی نەرم — noise + قطرە
        for (let i = 0; i < 14; i++) {
          noiseBurst(ctx, i * 0.07, 0.12 + Math.random() * 0.08, 0.035 + Math.random() * 0.025, 700 + Math.random() * 1800, 0.55)
        }
        tone(ctx, { freq: 180, freqEnd: 90, type: 'sine', dur: 0.9, gain: 0.04 })
        break
      }
      case 'goldRain': {
        // باران + خشاندنی زێڕ / لیرە بۆ ~١٠ چرکە
        for (let i = 0; i < 18; i++) {
          noiseBurst(ctx, i * 0.09, 0.14, 0.04, 600 + (i % 5) * 220, 0.5)
        }
        for (let i = 0; i < 22; i++) {
          const t = 0.15 + i * 0.42
          tone(ctx, { freq: 880 + (i % 4) * 160, type: 'sine', start: t, dur: 0.09, gain: 0.07 })
          tone(ctx, { freq: 1240 + (i % 3) * 180, type: 'triangle', start: t + 0.05, dur: 0.11, gain: 0.055 })
          tone(ctx, { freq: 1680, type: 'sine', start: t + 0.1, dur: 0.08, gain: 0.035 })
        }
        // دووبارە باران لە ناوەڕاست
        for (let i = 0; i < 12; i++) {
          noiseBurst(ctx, 4.2 + i * 0.1, 0.12, 0.032, 900 + Math.random() * 1200, 0.55)
        }
        break
      }
      case 'angel': {
        // فریشتەی ئافرەت — زەنگ و درەوشانەوەی نەرم
        tone(ctx, { freq: 784, type: 'sine', dur: 0.35, gain: 0.08 })
        tone(ctx, { freq: 988, type: 'sine', start: 0.12, dur: 0.4, gain: 0.07 })
        tone(ctx, { freq: 1175, type: 'triangle', start: 0.28, dur: 0.55, gain: 0.06 })
        tone(ctx, { freq: 1568, type: 'sine', start: 0.45, dur: 0.7, gain: 0.05 })
        tone(ctx, { freq: 2093, type: 'sine', start: 0.7, dur: 0.5, gain: 0.035 })
        for (let i = 0; i < 8; i++) {
          tone(ctx, { freq: 1320 + i * 90, type: 'sine', start: 0.2 + i * 0.18, dur: 0.12, gain: 0.03 })
        }
        break
      }
      case 'crystal': {
        for (let i = 0; i < 10; i++) {
          const t = i * 0.12
          tone(ctx, { freq: 1400 + (i % 4) * 220, type: 'sine', start: t, dur: 0.14, gain: 0.07 })
          tone(ctx, { freq: 2100 + (i % 3) * 180, type: 'triangle', start: t + 0.04, dur: 0.16, gain: 0.045 })
        }
        noiseBurst(ctx, 0.1, 0.35, 0.035, 3200, 0.8)
        break
      }
      case 'waves': {
        for (let i = 0; i < 6; i++) {
          noiseBurst(ctx, i * 0.35, 0.55, 0.045, 280 + i * 40, 0.4)
          tone(ctx, { freq: 90 - i * 4, freqEnd: 55, type: 'sine', start: i * 0.35, dur: 0.7, gain: 0.045 })
        }
        break
      }
      case 'fanfare': {
        tone(ctx, { freq: 392, type: 'triangle', dur: 0.18, gain: 0.1 })
        tone(ctx, { freq: 523, type: 'triangle', start: 0.14, dur: 0.18, gain: 0.1 })
        tone(ctx, { freq: 659, type: 'triangle', start: 0.28, dur: 0.2, gain: 0.11 })
        tone(ctx, { freq: 784, type: 'sine', start: 0.45, dur: 0.45, gain: 0.12 })
        tone(ctx, { freq: 1047, type: 'sine', start: 0.7, dur: 0.55, gain: 0.08 })
        break
      }
      case 'galaxy': {
        tone(ctx, { freq: 120, freqEnd: 60, type: 'sine', dur: 1.2, gain: 0.07 })
        tone(ctx, { freq: 220, freqEnd: 110, type: 'triangle', start: 0.15, dur: 1.0, gain: 0.05 })
        for (let i = 0; i < 16; i++) {
          tone(ctx, { freq: 700 + (i % 5) * 160, type: 'sine', start: 0.2 + i * 0.35, dur: 0.12, gain: 0.045 })
        }
        noiseBurst(ctx, 0.2, 0.8, 0.04, 1600, 0.35)
        break
      }
      case 'chat':
        tone(ctx, { freq: 640, type: 'sine', dur: 0.08, gain: 0.08 })
        tone(ctx, { freq: 860, type: 'sine', start: 0.07, dur: 0.1, gain: 0.07 })
        break
      case 'levelUp':
        tone(ctx, { freq: 392, type: 'triangle', dur: 0.12, gain: 0.1 })
        tone(ctx, { freq: 523, type: 'triangle', start: 0.1, dur: 0.12, gain: 0.1 })
        tone(ctx, { freq: 659, type: 'triangle', start: 0.2, dur: 0.12, gain: 0.11 })
        tone(ctx, { freq: 784, type: 'sine', start: 0.32, dur: 0.28, gain: 0.12 })
        tone(ctx, { freq: 1174, type: 'sine', start: 0.48, dur: 0.35, gain: 0.08 })
        break
      default:
        break
    }
  } catch {
    // ignore audio failures (autoplay policies, etc.)
  } finally {
    activeCategory = 'general'
  }
}

/* ── Background music — soft synthesized ambient pad loop (no external assets) ── */

let musicMuted = false
let musicVolume = 0.5
let musicNodes: {
  osc1: OscillatorNode
  osc2: OscillatorNode
  osc3: OscillatorNode
  lfo: OscillatorNode
  lfoGain: GainNode
  master: GainNode
} | null = null

export function configureMusic(opts: { muted?: boolean; volume?: number }): void {
  if (typeof opts.muted === 'boolean') musicMuted = opts.muted
  if (typeof opts.volume === 'number' && Number.isFinite(opts.volume)) {
    musicVolume = Math.min(1, Math.max(0, opts.volume))
  }
  applyMusicGain()
}

function applyMusicGain(): void {
  if (!musicNodes) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const target = musicMuted ? 0 : musicVolume * 0.05
    musicNodes.master.gain.setTargetAtTime(target, ctx.currentTime, 0.6)
  } catch { /* ignore */ }
}

/** دەستپێکردنی مۆسیقای باکگراوند — پادێکی نەرمی هەمیشەیی، بێ فایلی دەنگی */
export function startBackgroundMusic(): void {
  if (musicNodes) { applyMusicGain(); return }
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const master = ctx.createGain()
    master.gain.value = 0
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900

    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.value = 110 // A2
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = 164.81 // E3 — perfect fifth, soft pad
    const osc3 = ctx.createOscillator()
    osc3.type = 'triangle'
    osc3.frequency.value = 220 // A3

    // Slow LFO breathing — modulates filter cutoff for a living ambient feel
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.07
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 260
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    osc1.connect(filter)
    osc2.connect(filter)
    osc3.connect(filter)
    filter.connect(master)
    master.connect(ctx.destination)

    osc1.start()
    osc2.start()
    osc3.start()
    lfo.start()

    musicNodes = { osc1, osc2, osc3, lfo, lfoGain, master }
    applyMusicGain()
  } catch { /* ignore autoplay / audio failures */ }
}

export function stopBackgroundMusic(): void {
  if (!musicNodes) return
  const nodes = musicNodes
  musicNodes = null
  try {
    const ctx = getAudioContext()
    const now = ctx ? ctx.currentTime : 0
    nodes.master.gain.cancelScheduledValues(now)
    nodes.master.gain.setValueAtTime(nodes.master.gain.value, now)
    nodes.master.gain.linearRampToValueAtTime(0, now + 0.5)
    window.setTimeout(() => {
      try {
        nodes.osc1.stop(); nodes.osc2.stop(); nodes.osc3.stop(); nodes.lfo.stop()
      } catch { /* ignore */ }
    }, 550)
  } catch { /* ignore */ }
}
