/**
 * تایملاینی جووڵەی مرۆڤئاسا — هەر جووڵە لیستی beatـی خۆی هەیە.
 * pose → کلاس kd-fb3d--{pose} یان Rive state input.
 */
import type { MotionId, MotionImpactFx, MotionLeanSide } from './motions'
import { MOTION_APPROACH_INTIMATE_T, MOTION_APPROACH_T } from './motions'

export type MotionBeatActor = 'sender' | 'target' | 'both'

export type MotionBeat = {
  id: string
  /** ناوی پۆز / Rive state */
  pose: string
  ms: number
  actor: MotionBeatActor
  /** prop لەسەر نێرەر */
  prop?: 'ring' | 'none'
  /** نزیکبوون / overlap بۆ ماچ و باوەش */
  contact?: boolean
  /** لەم beatـەدا FXی پەیکەر دەردەکەوێت */
  spawnFx?: boolean
  /** پۆزی وەرگر کاتێک actor=target|both */
  targetPose?: string
}

export type MotionTimeline = {
  motionId: MotionId
  approachT: number
  beats: MotionBeat[]
  impactFx: MotionImpactFx
}

export function sumBeatMs(beats: MotionBeat[]): number {
  return beats.reduce((n, b) => n + Math.max(0, b.ms), 0)
}

function kissBeats(lean: MotionLeanSide): MotionBeat[] {
  const kissPose = lean === 'l' ? 'kiss_l' : 'kiss_r'
  return [
    { id: 'arrive_breathe', pose: 'stand_breathe', ms: 500, actor: 'sender', targetPose: 'idle' },
    { id: 'lean_in', pose: kissPose, ms: 700, actor: 'sender', contact: true, targetPose: 'shy' },
    { id: 'cheek_contact', pose: kissPose, ms: 900, actor: 'both', contact: true, spawnFx: true, targetPose: 'shy' },
    { id: 'pull_back', pose: 'stand_breathe', ms: 500, actor: 'sender', targetPose: 'shy' },
  ]
}

function proposeBeats(): MotionBeat[] {
  return [
    { id: 'stand_breathe', pose: 'stand_breathe', ms: 700, actor: 'sender', targetPose: 'idle' },
    { id: 'nervous', pose: 'nervous', ms: 800, actor: 'sender', targetPose: 'idle' },
    { id: 'kneel', pose: 'kneel', ms: 900, actor: 'sender', targetPose: 'shock' },
    { id: 'ring_pocket', pose: 'ring_pocket', ms: 700, actor: 'sender', prop: 'ring', targetPose: 'shock' },
    { id: 'offer_ring', pose: 'offer_ring', ms: 1100, actor: 'both', prop: 'ring', spawnFx: true, targetPose: 'shy' },
    { id: 'hold', pose: 'offer_ring', ms: 600, actor: 'both', prop: 'ring', targetPose: 'shy' },
  ]
}

function hugBeats(): MotionBeat[] {
  return [
    { id: 'stand_breathe', pose: 'stand_breathe', ms: 400, actor: 'sender', targetPose: 'idle' },
    { id: 'reach', pose: 'hug', ms: 500, actor: 'sender', contact: true, targetPose: 'shy' },
    { id: 'embrace', pose: 'hug', ms: 1200, actor: 'both', contact: true, spawnFx: true, targetPose: 'hug_recv' },
    { id: 'release', pose: 'stand_breathe', ms: 400, actor: 'sender', targetPose: 'shy' },
  ]
}

/** تایملاینی هەموو ٢٠ جووڵە */
export const MOTION_TIMELINES: Record<MotionId, Omit<MotionTimeline, 'motionId'>> = {
  wave: {
    approachT: MOTION_APPROACH_T,
    impactFx: 'sparkle',
    beats: [
      { id: 'breathe', pose: 'stand_breathe', ms: 300, actor: 'sender', targetPose: 'idle' },
      { id: 'wave', pose: 'wave', ms: 1400, actor: 'both', spawnFx: true, targetPose: 'wave' },
      { id: 'settle', pose: 'stand_breathe', ms: 300, actor: 'sender', targetPose: 'idle' },
    ],
  },
  bow: {
    approachT: MOTION_APPROACH_T,
    impactFx: 'none',
    beats: [
      { id: 'breathe', pose: 'stand_breathe', ms: 350, actor: 'sender', targetPose: 'idle' },
      { id: 'bow', pose: 'bow', ms: 1400, actor: 'both', targetPose: 'bow' },
      { id: 'up', pose: 'stand_breathe', ms: 350, actor: 'sender', targetPose: 'idle' },
    ],
  },
  handshake: {
    approachT: 0.985,
    impactFx: 'sparkle',
    beats: [
      { id: 'breathe', pose: 'stand_breathe', ms: 300, actor: 'sender', targetPose: 'idle' },
      { id: 'reach', pose: 'highfive', ms: 500, actor: 'both', contact: true, targetPose: 'highfive' },
      { id: 'shake', pose: 'highfive', ms: 900, actor: 'both', contact: true, spawnFx: true, targetPose: 'highfive' },
      { id: 'release', pose: 'stand_breathe', ms: 300, actor: 'sender', targetPose: 'idle' },
    ],
  },
  highfive: {
    approachT: 0.985,
    impactFx: 'clap_burst',
    beats: [
      { id: 'breathe', pose: 'stand_breathe', ms: 250, actor: 'sender', targetPose: 'idle' },
      { id: 'raise', pose: 'highfive', ms: 450, actor: 'both', targetPose: 'highfive' },
      { id: 'clap', pose: 'highfive', ms: 700, actor: 'both', contact: true, spawnFx: true, targetPose: 'highfive' },
      { id: 'down', pose: 'stand_breathe', ms: 300, actor: 'sender', targetPose: 'laugh' },
    ],
  },
  clap: {
    approachT: MOTION_APPROACH_T,
    impactFx: 'clap_burst',
    beats: [
      { id: 'clap', pose: 'highfive', ms: 1600, actor: 'sender', spawnFx: true, targetPose: 'laugh' },
      { id: 'settle', pose: 'stand_breathe', ms: 400, actor: 'sender', targetPose: 'laugh' },
    ],
  },
  laugh: {
    approachT: MOTION_APPROACH_T,
    impactFx: 'sparkle',
    beats: [
      { id: 'laugh', pose: 'laugh', ms: 1800, actor: 'both', spawnFx: true, targetPose: 'laugh' },
      { id: 'settle', pose: 'stand_breathe', ms: 400, actor: 'sender', targetPose: 'idle' },
    ],
  },
  salute: {
    approachT: MOTION_APPROACH_T,
    impactFx: 'none',
    beats: [
      { id: 'salute', pose: 'wave', ms: 1400, actor: 'sender', targetPose: 'wave' },
      { id: 'down', pose: 'stand_breathe', ms: 400, actor: 'sender', targetPose: 'idle' },
    ],
  },
  jump: {
    approachT: MOTION_APPROACH_T,
    impactFx: 'dust',
    beats: [
      { id: 'crouch', pose: 'stand_breathe', ms: 300, actor: 'sender', targetPose: 'idle' },
      { id: 'jump', pose: 'dance', ms: 1000, actor: 'sender', spawnFx: true, targetPose: 'dance' },
      { id: 'land', pose: 'stand_breathe', ms: 500, actor: 'sender', targetPose: 'idle' },
    ],
  },
  slap: {
    approachT: 0.99,
    impactFx: 'stars',
    beats: [
      { id: 'windup', pose: 'slap', ms: 400, actor: 'sender', targetPose: 'idle' },
      { id: 'hit', pose: 'slap', ms: 700, actor: 'both', contact: true, spawnFx: true, targetPose: 'recoil' },
      { id: 'recover', pose: 'stand_breathe', ms: 500, actor: 'sender', targetPose: 'recoil' },
    ],
  },
  punch: {
    approachT: 0.99,
    impactFx: 'stars',
    beats: [
      { id: 'guard', pose: 'punch', ms: 400, actor: 'sender', targetPose: 'idle' },
      { id: 'hit', pose: 'punch', ms: 800, actor: 'both', contact: true, spawnFx: true, targetPose: 'dizzy' },
      { id: 'recover', pose: 'stand_breathe', ms: 600, actor: 'sender', targetPose: 'dizzy' },
    ],
  },
  kick: {
    approachT: 0.99,
    impactFx: 'dust',
    beats: [
      { id: 'windup', pose: 'kick', ms: 450, actor: 'sender', targetPose: 'idle' },
      { id: 'hit', pose: 'kick', ms: 800, actor: 'both', contact: true, spawnFx: true, targetPose: 'hold_leg' },
      { id: 'recover', pose: 'stand_breathe', ms: 550, actor: 'sender', targetPose: 'hold_leg' },
    ],
  },
  push: {
    approachT: 0.992,
    impactFx: 'dust',
    beats: [
      { id: 'plant', pose: 'punch', ms: 350, actor: 'sender', targetPose: 'idle' },
      { id: 'push', pose: 'punch', ms: 700, actor: 'both', contact: true, spawnFx: true, targetPose: 'recoil' },
      { id: 'recover', pose: 'stand_breathe', ms: 450, actor: 'sender', targetPose: 'recoil' },
    ],
  },
  kiss: {
    approachT: MOTION_APPROACH_INTIMATE_T,
    impactFx: 'cheek_kiss',
    beats: kissBeats('r'),
  },
  blow_kiss: {
    approachT: MOTION_APPROACH_T,
    impactFx: 'hearts',
    beats: [
      { id: 'breathe', pose: 'stand_breathe', ms: 400, actor: 'sender', targetPose: 'idle' },
      { id: 'blow', pose: 'kiss', ms: 1200, actor: 'sender', spawnFx: true, targetPose: 'shy' },
      { id: 'smile', pose: 'stand_breathe', ms: 500, actor: 'sender', targetPose: 'shy' },
    ],
  },
  hug: {
    approachT: MOTION_APPROACH_INTIMATE_T,
    impactFx: 'hearts',
    beats: hugBeats(),
  },
  dance: {
    approachT: MOTION_APPROACH_T,
    impactFx: 'sparkle',
    beats: [
      { id: 'start', pose: 'stand_breathe', ms: 300, actor: 'sender', targetPose: 'idle' },
      { id: 'dance', pose: 'dance', ms: 2000, actor: 'both', spawnFx: true, targetPose: 'dance' },
      { id: 'end', pose: 'stand_breathe', ms: 400, actor: 'sender', targetPose: 'laugh' },
    ],
  },
  waltz: {
    approachT: 0.99,
    impactFx: 'sparkle',
    beats: [
      { id: 'invite', pose: 'stand_breathe', ms: 400, actor: 'sender', targetPose: 'shy' },
      { id: 'hold', pose: 'hug', ms: 500, actor: 'both', contact: true, targetPose: 'hug_recv' },
      { id: 'waltz', pose: 'dance', ms: 1600, actor: 'both', contact: true, spawnFx: true, targetPose: 'dance' },
      { id: 'end', pose: 'stand_breathe', ms: 400, actor: 'sender', targetPose: 'shy' },
    ],
  },
  heart_hands: {
    approachT: MOTION_APPROACH_T,
    impactFx: 'hearts',
    beats: [
      { id: 'form', pose: 'highfive', ms: 800, actor: 'sender', targetPose: 'shy' },
      { id: 'show', pose: 'highfive', ms: 1000, actor: 'sender', spawnFx: true, targetPose: 'shy' },
      { id: 'down', pose: 'stand_breathe', ms: 400, actor: 'sender', targetPose: 'shy' },
    ],
  },
  propose: {
    approachT: MOTION_APPROACH_INTIMATE_T,
    impactFx: 'ring',
    beats: proposeBeats(),
  },
  serenade: {
    approachT: MOTION_APPROACH_T,
    impactFx: 'notes',
    beats: [
      { id: 'breathe', pose: 'stand_breathe', ms: 500, actor: 'sender', targetPose: 'idle' },
      { id: 'sing', pose: 'dance', ms: 1800, actor: 'sender', spawnFx: true, targetPose: 'shy' },
      { id: 'bow', pose: 'bow', ms: 700, actor: 'sender', targetPose: 'shy' },
    ],
  },
}

/** ماچ: lean side دیاری دەکات */
export function getMotionTimeline(motionId: MotionId, leanSide: MotionLeanSide = 'r'): MotionTimeline {
  const base = MOTION_TIMELINES[motionId]
  if (motionId === 'kiss') {
    return {
      motionId,
      approachT: base.approachT,
      impactFx: base.impactFx,
      beats: kissBeats(leanSide),
    }
  }
  return {
    motionId,
    approachT: base.approachT,
    impactFx: base.impactFx,
    beats: base.beats,
  }
}
