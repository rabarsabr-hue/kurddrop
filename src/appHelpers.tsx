/** Extracted from App.tsx — static helpers / small components (Babel size) */
import { Component, useState, useEffect, useRef, useCallback, useMemo, memo, type ErrorInfo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import L from 'leaflet'


import {
  DONATE_HOLD_MS,
  PREMIUM_GIFT_SENDER_BOOST_MS,
  PREMIUM_GIFT_SENDER_SCALE,
  PREMIUM_GIFT_SENDER_Z_OFFSET,
  PREMIUM_GIFT_GROW_MS,
  GIFT_RECIPIENT_CUT_PCT,
  MAP_AMBIENT_GIFT_MS,
  DONATE_ITEM_STAY_MS,
  DONATE_THUNDER_MS,
  DONATE_BURST_MS,
  DONATE_VIP_STAY_MS,
  DONATE_FLIGHT_MIN_MS,
  DONATE_FLIGHT_MAX_MS,
  DONATE_FLIGHT_HARD_MAX_MS,
  DONATE_FLIGHT_SPEED_MPS,
  GIFT_FLY_ICON_PX,
  GIFT_OVERLAY_Z,
  GIFT_PATH_FADE_MS,
  VIP_GIFT_GIF,
  DONATE_ITEMS,
  DONATE_BY_ID,
  isAmbientMapGift,
  isPremiumGiftItem,
  giftPathStyleForItem,
  type DonateItemId,
  type DonateItemTier,
  type DonateItemDef,
  type GiftPathStyle,
} from './data/gifts'

import {
  flushBatchedMapOverlays,
  markAvatarAppearFade,
  markAvatarDisappearFade,
  markAvatarFirstEnter,
  patchMarkerChatOverlay,
  patchMarkerFxOverlay,
  syncAllMapChatFloatPositions,
  type BatchedMapOverlayUpdate,
} from './components/MapEntityLayers'

import AuthModal from './components/AuthModal'

import maleAvatar from './imports/male.png'

import femaleAvatar from './imports/female.png'

import { GOLD_HEADER_ICON, GEM_HEADER_ICON } from './currencyStore'

/** ئایکۆنی یەکگرتووی زێڕ — هەمان وێنەی هێدەر لە هەموو یارییەکەدا */

import {

  getOrCreateUser,

  getUserPublicProfile,

  getDefaultProfile,

  syncUserBalances,

  syncUserWalletAndInventory,

  syncUserProfile,

  subscribeToUser,

  purchaseMarketItem,

  syncVipPasses,

  loadVipPassesFromFirestore,

  recordSocialPassSubmission,

  syncPassOwnershipFlags,

  claimDailyBonus,

  formatDailyBonusSummary,

  resolveDailyBonusStreakDay,

  isDailyBonusStreakBroken,

  persistDailyBonusStreakReset,

  DAILY_BONUS_REWARDS,

  DAILY_BONUS_TOTAL_DAYS,

  getSpinWindowState,

  recordDailySpin,

  syncReadNotificationIds,

  parseEpochMs,

  syncUserSettings,

  incrementPlayerStats,

  sendFriendRequest,

  acceptFriendRequest,

  declineFriendRequest,

  removeFriend,

  findUserByPlayerId,

  subscribeToIncomingFriendRequests,
  subscribeToOutgoingFriendRequests,

  WELCOME_BONUS_GOLD,

  WELCOME_BONUS_DIAMOND,

  clampWalletToCap,

  loadUserDataLocal,

  saveUserDataLocal,

  blockUserPersist,

  unblockUserPersist,

  sendGift,

  completeSteal,

  claimRevengeSteal,

  startHeist,

  rejectHeist,

  acceptHeist,

  cancelHeist,

  subscribeToHeistSession,

  setChatMuted,

  sendPrivateMessage,

  hideDmMessages,

  uploadDmMedia,

  uploadDmMediaWithProgress,

  subscribeToMyDmThreads,

  subscribeToDmThread,

  markDmThreadRead,

  markIncomingDmDelivered,

  setDmThreadPinned,

  hideDmThreadForUser,

  DAILY_BONUS_MIN_GAP_MS,

  DAILY_BONUS_STREAK_BREAK_MS,

  DEFAULT_USER_SETTINGS,

  DEFAULT_PLAYER_STATS,

  MAX_FRIENDS,

  STEAL_HACK_MS,

  STEAL_HEIST_TIMEOUT_MS,

  STEAL_ATTACKER_COOLDOWN_MS,

  STEAL_ONLINE_GOLD_PCT,

  STEAL_ONLINE_DIAMOND_PCT,

  STEAL_OFFLINE_GOLD_PCT,

  STEAL_OFFLINE_DIAMOND_PCT,

  STEAL_SHIELD_MS,

  FIGHT_SMOKE_MS,

  type UserProfile,

  type Gender,

  type InventoryItem,

  type Currency,

  type PlayerStats,

  type BlockedUser,

  type FriendEntry,

  type GiftLogEntry,

  type IncomingFriendRequest,

  type DmThreadSummary,

  type DmMessage,

  type FoundPlayer,

  creditGiftRevenueShare,

  pushInboxNotification,

} from './services/userService'

import {

  updatePlayerLocation,

  updatePlayerMapFx,

  setPlayerOffline,

  subscribeToOtherPlayers,

  resetMapPresenceAndSeedBots,

  isBotPlayerUid,

  BOT_SEED_STORAGE_KEY,

  type PlayerLocation,

} from './services/locationService'
import {
  NPC_COUNT,
  NPC_APPEAR_FADE_MS,
  NPC_FADE_OUT_MS,
  NPC_RELOCATE_INTERVAL_MS,
  GLOBAL_CHAT_FEED_MAX,
  createInitialNpcStates,
  liveNpcToPlayerLocation,
  pickOneNpcAutoAction,
  pickOnlineGlobalChatLine,
  nextGlobalChatDelayMs,
  isNpcPlayerUid,
  filterNpcsInViewport,
  padLatLngBounds,
  tickNpcMovement,
  tickNpcOnlinePresence,
  beginNpcRelocationWave,
  finalizeNpcRelocations,
  shouldPlayNpcAppearAnim,
  shouldPlayNpcDisappearAnim,
  applyNpcGiftXp,
  nextNpcChatDelayMs,
  type LiveNpcState,
  type ActiveDropInfo,
} from './npcData'
import {
  subscribeToMapDonations,
  type MapDonationEvent,
} from './services/mapDonationService'

import {
  MAP_CHAT_MAX_LEN,
  MAP_CHAT_BUBBLE_MS,
  randomMapChatBubbleMs,
  subscribeToMapChat,
  type MapChatMessage,
} from './services/chatService'

import {
  applyXpGain,
  xpForDropType,
  xpProgressRatio,
  xpRequiredForLevel,
  XP_REWARDS,
} from './playerXp'

import {

  HUNTER_ROLE_NAME,

  HUNTER_RANKS,

  EMPTY_DROPS_OPENED,

  hunterLevelInfo,

  hunterRankForLevel,

  hunterRankIndex,

  parseDropsOpenedByType,

  type1CostForLevel,

  type DropsOpenedByType,

} from './hunterLevel'

import {

  createPersonalAirdrop,

  claimAirdrop,

  subscribeToAirdrops,

  ensurePlaneGenesis,

  computeGlobalPlaneState,

  ensureAllScheduledDrops,

  FLIGHT_CITIES,

  DROP_TYPES,

  resolveChestId,

  getDropTypeCooldownRemaining,

  formatDropCooldownMessage,

  getCycleIndex,

  getDropTypeForCycle,

  CYCLE_MS,

  ACTIVE_FLIGHT_MS,

  CITY_LEG_MS,

  USA_APPROACH_MS,

  RUSSIA_EXIT_MS,

  AIRDROP_FALL_MS,

  type Airdrop,

} from './services/airdropService'

import {
  subscribeToLeaderboard,
  subscribeToWealthLeaderboard,
  subscribeToLevelLeaderboard,
  subscribeToGifterLeaderboard,
  incrementGiftsSentScore,
  incrementLeaderboardWealth,
  ensureLeaderboardEpoch,
  recordNpcGiftScore,
  upsertNpcLeaderboardPresence,
  type LeaderboardEntry,
  type RoyalLeaderboardEntry,
  type RoyalLeaderboardTab,
} from './services/leaderboardService'

import { playSoundEffect, configureSfx, startSpinWheelTicks, stopSpinWheelTicks, type SoundEffectType } from './sfx'

import { realtimeSync } from './realtimeSync'

import { signOutUser, onAuthReady } from './firebase'

import {

  sendFightChallenge,

  respondFightChallenge,

  expirePendingChallenge,

  subscribeToDuel,

  getChallengeBlockUntil,

  parseIncomingFight,

  hostSimulateTick,

  pushHostDuelState,

  type DuelRoom,

} from './services/duelService'

import TpsArenaDuel from './components/TpsArenaDuel'

import {

  COSMETIC_ITEMS,

  COSMETIC_BY_ID,

  CITADEL_SHOP_TABS,

  cosmeticMatchesShopGender,

  getActiveCosmetics,

  getActiveCosmetic,

  cosmeticsToPublic,

  toggleCosmeticInInventory,

  buildAvatarFrameHtml,

  buildWearableOverlaysHtml,

  cosmeticSlotLabel,

  type CosmeticDef,

  type CitadelShopTab,

  type ShopGender,

} from './cosmetics'

import {

  buildMapAvatarInnerHtml,

  useFullBody3DAvatar,

} from './realistic3dAvatar'

import {

  fullBodyScaleForZoom,

  FULL_BODY_MARKER_WIDTH,

  FULL_BODY_MARKER_HEIGHT,

  FULL_BODY_ICON_ANCHOR_Y,

  DEFAULT_AVATAR_3D,

  normalizeAvatar3d,

  avatar3dSignature,

  SKIN_PALETTE,

  HAIR_PALETTE,

  AVATAR_3D_HAIR_STYLES,

  AVATAR_3D_EYE_COLORS,

  AVATAR_3D_OUTFIT_COLORS,

  type Avatar3DCustomization,

  type Avatar3DHairStyle,

  type Avatar3DViewMode,

} from './fullBody3dAvatar'

import { HeadShotAvatar, Realistic3DAvatarDisc } from './components/Realistic3DAvatar'

import {

  RP_MISSIONS,

  loadSeasonPass,

  saveSeasonPass,

  normalizeMissions,

  emptySeasonPassState,

  bumpMission,

  claimMissionXp,

  type SeasonPassState,

} from './seasonPass'

import {

  PASS_DEFS,

  PASS_DURATION_DAYS,

  MASTER_PERFECT_DAYS_REQUIRED,

  MASTER_FINAL_DIAMOND,

  MASTER_FAIL_REFUND_DIAMONDS,

  SOCIAL_FINAL_DIAMOND,

  emptyVipPassesState,

  loadVipPasses,

  saveVipPasses,

  purchasePass,

  submitSocialPassLink,

  claimSocialFinalReward,

  claimMasterDailyReward,

  canClaimMasterDaily,

  settleMasterPass,

  markMasterFinalClaimed,

  markMasterRefundGranted,

  maybeRecordMasterPerfectDay,

  msUntilSocialSubmit,

  formatCountdownKu,

  passDayNumber,

  anyPassOwned,

  masterMissionsForUi,

  normalizeSocialUrl,

  ACTIVE_PASS_KINDS,

  KURDISTAN_MOUNTAINS,

  getKurdistanSeasonInfo,

  formatKurdistanNextDate,

  kurdistanBiMonthIndex,

  type VipPassesState,

  type PassKind,

  type PassAlert,

  type KurdistanSeasonInfo,

} from './services/passService'

import {

  appendActivity,

  loadActivityArchive,

  formatActivityAt,

  type ActivityEntry,

  type ActivityKind,

} from './activityArchive'

import {

  loadReadNotificationIds,

  saveReadNotificationIds,

  markNotificationRead,

  markAllNotificationsRead,

  formatNotifTime,

  type InboxNotification,

} from './services/notificationService'


/** ئایکۆنی ستانداردی زێڕ — هەمیشە وێنەی پاکێجی ژمارە ١ */
export function GoldIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={GOLD_HEADER_ICON}
      alt=""
      aria-hidden="true"
      className={`kd-gold-icon${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}

/** ئایکۆنی ستانداردی ئەڵماس — هەمیشە وێنەی پاکێجی ژمارە ١ */
export function DiamondIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={GEM_HEADER_ICON}
      alt=""
      aria-hidden="true"
      className={`kd-gem-icon${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}

export type AppCrashBoundaryProps = {
  children: ReactNode
  onReset: () => void
}

export type AppCrashBoundaryState = {
  hasError: boolean
  message: string
}

export class AppCrashBoundary extends Component<AppCrashBoundaryProps, AppCrashBoundaryState> {
  state: AppCrashBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): AppCrashBoundaryState {
    const message = error instanceof Error ? error.message : 'Unknown render error'
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('AppCrashBoundary caught render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10050,
          display: 'grid',
          placeItems: 'center',
          padding: 16,
          background: 'radial-gradient(circle at 20% 15%, rgba(0,240,255,0.16), transparent 40%), rgba(2,6,18,0.9)',
          color: '#e2e8f0',
          fontFamily: 'var(--kd-font)',
          direction: 'rtl',
        }}
      >
        <div
          style={{
            width: 'min(460px, 100%)',
            borderRadius: 20,
            padding: '18px 16px',
            background: 'rgba(15,23,42,0.78)',
            border: '1px solid rgba(248,113,113,0.45)',
            boxShadow: '0 0 24px rgba(248,113,113,0.2)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>هەڵەی پیشاندان ڕوویدا</h2>
          <p style={{ margin: '8px 0 14px', fontSize: 12, lineHeight: 1.6, color: '#cbd5e1' }}>
            ئەپەکە نەتوانی دروست پیشان بدات. دەتوانیت داتای ناوخۆ پاک بکەیتەوە و دووبارە باربکەیتەوە.
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 10, color: '#94a3b8', direction: 'ltr' }}>
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={this.props.onReset}
            className="btn-interactive"
            style={{
              width: '100%',
              borderRadius: 12,
              border: '1px solid rgba(248,113,113,0.55)',
              padding: '11px 12px',
              fontWeight: 900,
              fontFamily: 'var(--kd-font)',
              color: '#fff',
              background: 'linear-gradient(135deg, rgba(248,113,113,0.85), rgba(239,68,68,0.72))',
              cursor: 'pointer',
            }}
          >
            Reset App Data
          </button>
        </div>
      </div>
    )
  }
}

export interface SelectedOnlinePlayer {

  uid: string

  name: string

  gender: Gender

  gold: number

  diamond: number

  isPremium: boolean

  isSelf: boolean

  isOnline: boolean

  isBot: boolean

  avatarUrl: string | null

  avatar3d: Avatar3DCustomization | null

  hunterLevel: number

  dropsOpenedByType: DropsOpenedByType

  skinId: number | null

  borderId: number | null

  titleId: number | null

  headwearId: number | null

  accessoryId: number | null

  lastSeenMs: number | null

  /** ئاماری گشتی — لە پرۆفایلی گشتی دێت */
  stats: PlayerStats

}

export const HAIR_STYLE_LABELS_KU: Record<Avatar3DHairStyle, string> = {

  buzz: 'توندکراو',

  short: 'کورت',

  layered: 'چینچین',

  long: 'درێژ',

}

// ── Data ─────────────────────────────────────────────────────────────────────

/** پیشاندانی پلەی ناونیشان لە ١٢ پلەکە — بێ ژمارە */

export function hunterDisplay(level: number, counts?: DropsOpenedByType) {

  return hunterLevelInfo(level, counts)

}

export const INVENTORY_CAPACITY = 5

/**

 * Fixed Leaflet icon metrics — do NOT vary iconSize/iconAnchor with zoom.

 * Visual scale only via CSS transform: scale(...) inside the icon HTML.

 * ≥٤٤×٤٤ — ناوچەی کلیکی دۆستانە بۆ پەنجە (Apple HIG / Material).

 */

export const PLAYER_MARKER_ICON_SIZE: [number, number] = [48, 48]

export const PLAYER_MARKER_ICON_ANCHOR: [number, number] = [24, 24]

/** دوای pinch/zoom/drag ـی بەکارهێنەر — ڕێگری لە کلیکی هەڵە لەسەر مارکەر */

export const MAP_MARKER_CLICK_GUARD_MS = 500

export const MAP_TOUCH_DRAG_THRESHOLD_PX = 8

/** گەورەکردنی نەرمی ئاڤاتار لەسەر نەخشە کاتێک هەڵبژێردراوە */
export const MAP_AVATAR_FOCUS_SCALE = 1.42

/** ماوەی ئەنیمەیشنی داخستنی بۆکسی کارەکتەر — خێرا و نەرم */
export const PLAYER_SHEET_ANIM_MS = 220

/** ئەنیمەیشنی iOS — کرانەوە / داخرانی بۆکس */
export const IOS_SHEET_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** نوێکردنەوەی پۆتانی NPC / layout — ١٥٠–٢٠٠ms (نەک هەر frame) */
export const NPC_MARKER_THROTTLE_MS = 175

/** سنووری FPS ـی لووپی نەخشە — خەزنکردنی گەرمی مۆبایل */
export const MAP_LOOP_MIN_GAP_DESKTOP_MS = 16   // ~60fps
export const MAP_LOOP_MIN_GAP_MOBILE_FX_MS = 33 // ~30fps کاتێک گیفت دەفڕێت
export const MAP_LOOP_MIN_GAP_MOBILE_IDLE_MS = 50 // ~20fps

/**
 * ماوەی فڕینی دیاری لەسەر نەخشە — بەپێی مەودا.
 * سنوور: ٣–٥ چرکە؛ hard fallback تا ١٠ چرکە.
 */
export function calcDonateFlightMs(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  try {
    const latOk = Number.isFinite(fromLat) && Number.isFinite(toLat)
    const lngOk = Number.isFinite(fromLng) && Number.isFinite(toLng)
    if (!latOk || !lngOk) return DONATE_FLIGHT_MIN_MS

    const distM = calcDistance(fromLat, fromLng, toLat, toLng)
    if (!Number.isFinite(distM) || distM <= 0) return DONATE_FLIGHT_MIN_MS

    const speed = Math.max(1, DONATE_FLIGHT_SPEED_MPS)
    const rawMs = (distM / speed) * 1000
    const clamped = Math.min(
      DONATE_FLIGHT_MAX_MS,
      Math.max(DONATE_FLIGHT_MIN_MS, rawMs),
    )
    return Math.min(DONATE_FLIGHT_HARD_MAX_MS, Math.round(clamped))
  } catch {
    return DONATE_FLIGHT_MIN_MS
  }
}

export function giftPathControlPoint(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  style: GiftPathStyle,
): { lat: number; lng: number } {
  const midLat = (fromLat + toLat) / 2
  const midLng = (fromLng + toLng) / 2
  const dLat = toLat - fromLat
  const dLng = toLng - fromLng
  const arc =
    style === 'comic' ? 0.32
      : style === 'soft' ? 0.14
        : style === 'neon' ? 0.2
          : 0.16
  // خاڵی کۆنترۆڵی Quadratic — ئاراستەی عمودی بۆ کەوانە
  return {
    lat: midLat + (-dLng) * arc,
    lng: midLng + dLat * arc,
  }
}

/** ڕەنگ / ئەستووری هێڵی دیاری — دیار + درەوشانە (ئایکۆن لەسەری دەجووڵێت) */
export function giftSvgStrokeStyle(style: GiftPathStyle): { stroke: string; width: number; opacity: number; glow: string } {
  // Common / Standard — Neon Cyan (باریک، هێشتا دیار)
  if (style === 'comic' || style === 'soft') {
    return { stroke: '#00F0FF', width: 1.7, opacity: 1, glow: '#00F0FF' }
  }
  // Rare / Mid — Neon Violet / Magenta
  if (style === 'neon') {
    return { stroke: '#FF2D95', width: 1.85, opacity: 1, glow: '#C084FC' }
  }
  // Epic / Legendary — Radiant Gold
  return { stroke: '#FFD700', width: 2, opacity: 1, glow: '#FBBF24' }
}

/** کەوانەی Quadratic لە پۆتانی شاشە (container px) */
export function giftQuadraticScreenControl(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: GiftPathStyle,
): { cx: number; cy: number } {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const dX = x2 - x1
  const dY = y2 - y1
  const arc =
    style === 'comic' ? 0.32
      : style === 'soft' ? 0.14
        : style === 'neon' ? 0.2
          : 0.16
  return { cx: midX + (-dY) * arc, cy: midY + dX * arc }
}

/**
 * Path `d` لە پۆتانی شاشە — هەمان ڤێکتۆر کە ئایکۆن لەسەری دەجووڵێت.
 * Quadratic کەوانە (یەک stroke) → getPointAtLength لەسەر هەمان path.
 */
export function giftQuadraticScreenPathD(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: GiftPathStyle,
): string {
  const { cx, cy } = giftQuadraticScreenControl(x1, y1, x2, y2, style)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/** خاڵ لەسەر کەوانە (fallback کاتێک getPointAtLength بەردەست نییە) */
export function giftQuadraticScreenPointAt(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: GiftPathStyle,
  t: number,
): { x: number; y: number } {
  const u = Math.max(0, Math.min(1, t))
  const { cx, cy } = giftQuadraticScreenControl(x1, y1, x2, y2, style)
  const omt = 1 - u
  return {
    x: omt * omt * x1 + 2 * omt * u * cx + u * u * x2,
    y: omt * omt * y1 + 2 * omt * u * cy + u * u * y2,
  }
}

export type GiftFxLayer = {
  root: HTMLDivElement
  svg: SVGSVGElement
}

/**
 * Absolute top-level FX layer — دەرەوەی مارکەر/کارەکتەر، بێ overflow clipping.
 * SVG بۆ هێڵ + HTML div بۆ ئایکۆن (بێ foreignObject کە دەبڕدرێت/نادیار دەبێت).
 */
export function ensureGiftFxLayer(map: L.Map): GiftFxLayer {
  const container = map.getContainer()
  // Remove legacy direct-child SVG overlay (pre-refactor) so it cannot clip/cover the new layer
  container.querySelectorAll(':scope > svg.kd-gift-traj-overlay').forEach((el) => {
    try { el.remove() } catch { /* ignore */ }
  })
  let root = container.querySelector(':scope > .kd-gift-fx-layer') as HTMLDivElement | null
  if (!root) {
    root = document.createElement('div')
    root.className = 'kd-gift-fx-layer'
    root.setAttribute('aria-hidden', 'true')
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.classList.add('kd-gift-traj-overlay')
    svg.setAttribute('aria-hidden', 'true')
    root.appendChild(svg)
  }
  // هەمیشە دوایین منداڵ — سەرووی هەموو leaflet pane ـەکان
  if (root.parentElement !== container || container.lastElementChild !== root) {
    container.appendChild(root)
  }
  root.style.cssText = [
    'position:absolute',
    'inset:0',
    'width:100%',
    'height:100%',
    `z-index:${GIFT_OVERLAY_Z}`,
    'pointer-events:none',
    'overflow:visible',
    'display:block',
    'visibility:visible',
    'opacity:1',
    'contain:none',
    'isolation:isolate',
  ].join(';')

  const svg = root.querySelector('svg.kd-gift-traj-overlay') as SVGSVGElement
  svg.style.cssText = [
    'position:absolute',
    'inset:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'overflow:visible',
    'display:block',
    'visibility:visible',
    'opacity:1',
    'contain:none',
    'z-index:1',
  ].join(';')

  // Always sync viewBox to container px — wrong viewBox hides strokes / breaks getPointAtLength mapping
  const w = Math.max(1, Math.round(container.clientWidth || container.offsetWidth || 1))
  const h = Math.max(1, Math.round(container.clientHeight || container.offsetHeight || 1))
  if (
    svg.getAttribute('width') !== String(w)
    || svg.getAttribute('height') !== String(h)
    || svg.getAttribute('viewBox') !== `0 0 ${w} ${h}`
  ) {
    svg.setAttribute('width', String(w))
    svg.setAttribute('height', String(h))
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svg.setAttribute('preserveAspectRatio', 'none')
  }
  return { root, svg }
}

export function ensureGiftTrajectoryOverlay(map: L.Map): SVGSVGElement {
  return ensureGiftFxLayer(map).svg
}

export function ensureGiftFlyOverlay(map: L.Map): HTMLDivElement {
  return ensureGiftFxLayer(map).root
}

export function isMapMobileCoolMode(): boolean {
  try {
    const root = document.documentElement
    return root.classList.contains('kd-mobile-perf')
      || root.classList.contains('kd-mobile-cool')
      || root.classList.contains('low-gfx')
  } catch {
    return false
  }
}

/**
 * ئایکۆنی فڕین — HTML لەسەر FX layer (نەک ناو مارکەر، نەک foreignObject).
 * ناونیشانی ناوەڕاست بە getPointAtLength لەسەر SVG path دەستەبەر دەکرێت.
 */
export function createGiftFlyIconEl(
  map: L.Map,
  itemId: DonateItemId,
  emoji: string,
): HTMLDivElement {
  const size = GIFT_FLY_ICON_PX
  const layer = ensureGiftFxLayer(map)
  const icon = document.createElement('div')
  icon.className = `kd-gift-fly-icon kd-gift-fly-icon--html kd-gift-fly-icon--${itemId}`
  icon.setAttribute('aria-hidden', 'true')
  icon.style.cssText = [
    'position:absolute',
    'left:0',
    'top:0',
    `width:${size}px`,
    `height:${size}px`,
    'margin:0',
    'padding:0',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'pointer-events:none',
    'opacity:1',
    'visibility:visible',
    'z-index:10',
    'will-change:transform',
    'transform:translate3d(-9999px,-9999px,0) translate(-50%,-50%)',
    'filter:drop-shadow(0 0 10px rgba(255,215,0,0.95)) drop-shadow(0 2px 5px rgba(0,0,0,0.55))',
  ].join(';')

  const core = document.createElement('div')
  core.className = `kd-donate-fly kd-donate-fly--${itemId}${
    DONATE_BY_ID[itemId]?.tier === 'vip' ? ' is-vip'
      : DONATE_BY_ID[itemId]?.tier === 'mid' ? ' is-mid' : ' is-basic'
  }`
  core.style.cssText = [
    `width:${size}px`,
    `height:${size}px`,
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'opacity:1',
    'visibility:visible',
    'transform:none',
    'animation:none',
  ].join(';')
  const span = document.createElement('span')
  span.className = 'kd-donate-fly-core'
  const label = (emoji && String(emoji).trim()) || DONATE_BY_ID[itemId]?.emoji || '🎁'
  span.textContent = label
  span.style.cssText = [
    `font-size:${Math.round(size * 0.78)}px`,
    'line-height:1',
    'opacity:1',
    'display:block',
  ].join(';')
  core.appendChild(span)
  icon.appendChild(core)
  layer.root.appendChild(icon)
  return icon
}

export function positionGiftFlyIcon(icon: HTMLElement | SVGGElement | null, x: number, y: number) {
  if (!icon) return
  if (!Number.isFinite(x) || !Number.isFinite(y)) return
  if (icon instanceof SVGGElement) {
    icon.setAttribute('transform', `translate(${x.toFixed(2)}, ${y.toFixed(2)})`)
  } else {
    // Center of icon = path point (translate -50%/-50% keeps smaller size locked on stroke axis)
    icon.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%)`
  }
  icon.style.opacity = '1'
  icon.style.visibility = 'visible'
}

/**
 * Absolute lock: icon center = exact SVG path vector at progress t.
 * Uses path.getPointAtLength so the gift rides the drawn stroke with zero float offset.
 */
export function positionGiftFlyIconOnPath(
  path: SVGPathElement | null,
  icon: HTMLElement | SVGGElement | null,
  t: number,
  fallback?: { x1: number; y1: number; x2: number; y2: number; style: GiftPathStyle },
) {
  if (!icon) return
  const progress = Math.max(0, Math.min(1, t))
  try {
    if (path) {
      const len = path.getTotalLength()
      if (Number.isFinite(len) && len > 0.5) {
        const pt = path.getPointAtLength(progress * len)
        positionGiftFlyIcon(icon, pt.x, pt.y)
        return
      }
    }
  } catch { /* fall through */ }
  if (fallback) {
    const p = giftQuadraticScreenPointAt(
      fallback.x1, fallback.y1, fallback.x2, fallback.y2, fallback.style, progress,
    )
    positionGiftFlyIcon(icon, p.x, p.y)
  }
}

export function removeGiftFlyIcon(icon: HTMLElement | SVGGElement | null) {
  if (!icon) return
  try { icon.remove() } catch { /* ignore */ }
}

export function giftFlyIconScreenPos(
  map: L.Map,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  pathStyle: GiftPathStyle,
  t: number,
): { x: number; y: number } | null {
  try {
    const p1 = map.latLngToContainerPoint([fromLat, fromLng])
    const p2 = map.latLngToContainerPoint([toLat, toLng])
    if (!Number.isFinite(p1.x) || !Number.isFinite(p1.y) || !Number.isFinite(p2.x) || !Number.isFinite(p2.y)) {
      return null
    }
    return giftQuadraticScreenPointAt(p1.x, p1.y, p2.x, p2.y, pathStyle, t)
  } catch {
    return null
  }
}

export function createGiftTrajectoryPath(map: L.Map, style: GiftPathStyle): SVGPathElement {
  const { svg } = ensureGiftFxLayer(map)
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  group.classList.add('kd-gift-traj-group')

  const stroke = giftSvgStrokeStyle(style)
  const cool = isMapMobileCoolMode()

  let outline: SVGPathElement | null = null
  let glow: SVGPathElement | null = null
  if (!cool) {
    outline = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    outline.setAttribute('class', `kd-gift-path kd-gift-path-outline kd-gift-path--${style}`)
    outline.setAttribute('fill', 'none')
    outline.setAttribute('stroke', '#021018')
    outline.setAttribute('stroke-width', String(stroke.width + 1.4))
    outline.setAttribute('stroke-opacity', '0.5')
    outline.setAttribute('stroke-linecap', 'round')
    outline.setAttribute('stroke-linejoin', 'round')
    outline.style.pointerEvents = 'none'

    glow = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    glow.setAttribute('class', `kd-gift-path kd-gift-path-glow kd-gift-path--${style}`)
    glow.setAttribute('fill', 'none')
    glow.setAttribute('stroke', stroke.glow)
    glow.setAttribute('stroke-width', String(Math.max(4, stroke.width + 2.4)))
    glow.setAttribute('stroke-opacity', '0.42')
    glow.setAttribute('stroke-linecap', 'round')
    glow.setAttribute('stroke-linejoin', 'round')
    glow.style.pointerEvents = 'none'
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('class', `kd-gift-path kd-gift-path-main kd-gift-path--${style}`)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', stroke.stroke)
  // Cool mode: keep a clearly visible solid stroke (CSS used to force 0.85px ≈ invisible)
  path.setAttribute('stroke-width', String(cool ? Math.max(1.7, stroke.width) : stroke.width))
  path.setAttribute('stroke-opacity', '1')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  path.style.pointerEvents = 'none'
  path.style.strokeDasharray = 'none'
  path.style.strokeDashoffset = '0'
  path.style.opacity = '1'
  path.style.visibility = 'visible'
  path.style.display = 'block'
  path.style.willChange = cool ? 'auto' : 'opacity'

  if (outline) group.appendChild(outline)
  if (glow) group.appendChild(glow)
  group.appendChild(path)
  svg.appendChild(group)

  const tagged = path as SVGPathElement & {
    _kdGlow?: SVGPathElement
    _kdOutline?: SVGPathElement
    _kdGroup?: SVGGElement
  }
  if (glow) tagged._kdGlow = glow
  if (outline) tagged._kdOutline = outline
  tagged._kdGroup = group
  return path
}

export function updateGiftSvgPathReveal(path: SVGPathElement | null, t: number, _style: GiftPathStyle) {
  if (!path) return
  const progress = Math.max(0, Math.min(1, t))
  const tagged = path as SVGPathElement & {
    _kdGlow?: SVGPathElement
    _kdOutline?: SVGPathElement
  }
  const glow = tagged._kdGlow
  const outline = tagged._kdOutline

  const forceSolid = (el: SVGPathElement | undefined) => {
    if (!el) return
    el.style.strokeDasharray = 'none'
    el.style.strokeDashoffset = '0'
    el.removeAttribute('stroke-dasharray')
    el.removeAttribute('stroke-dashoffset')
  }
  forceSolid(outline)
  forceSolid(glow)
  forceSolid(path)

  // هێڵ لە سەرەتاوە دیار — ئایکۆن لەسەری دەجووڵێت
  const fade = Math.min(1, 0.75 + progress * 0.25)
  if (outline) outline.style.opacity = String(fade)
  if (glow) glow.style.opacity = String(fade)
  path.style.opacity = '1'
  path.style.strokeOpacity = '1'
}

export function applyGiftTrajectoryPathD(
  path: SVGPathElement,
  d: string,
  updateGlowLayers: boolean,
) {
  path.setAttribute('d', d)
  if (!updateGlowLayers) return
  const tagged = path as SVGPathElement & {
    _kdGlow?: SVGPathElement
    _kdOutline?: SVGPathElement
  }
  tagged._kdGlow?.setAttribute('d', d)
  tagged._kdOutline?.setAttribute('d', d)
}

/**
 * Map pan/zoom sync — lat/lng → container px، هێڵ نوێ، ئایکۆن بە getPointAtLength.
 */
export function refreshGiftTrajectoryPaths(
  map: L.Map,
  entries: Array<{
    phase: string
    svgPath: SVGPathElement | null
    flyIcon: HTMLElement | SVGGElement | null
    fromLat: number
    fromLng: number
    toLat: number
    toLng: number
    ctrlLat: number
    ctrlLng: number
    pathStyle: GiftPathStyle
    startMs: number
    flightMs: number
  }>,
) {
  ensureGiftFxLayer(map)
  const cool = isMapMobileCoolMode()
  const now = Date.now()
  for (const fx of entries) {
    if (fx.phase !== 'flying' || !fx.svgPath) continue
    try {
      const p1 = map.latLngToContainerPoint([fx.fromLat, fx.fromLng])
      const p2 = map.latLngToContainerPoint([fx.toLat, fx.toLng])
      const d = giftQuadraticScreenPathD(p1.x, p1.y, p2.x, p2.y, fx.pathStyle)
      applyGiftTrajectoryPathD(fx.svgPath, d, !cool)
      if (fx.flyIcon) {
        const flightMs = fx.flightMs || DONATE_FLIGHT_MIN_MS
        const raw = Math.min(1, Math.max(0, (now - fx.startMs) / flightMs))
        const t = 1 - Math.pow(1 - raw, 3)
        positionGiftFlyIconOnPath(fx.svgPath, fx.flyIcon, t, {
          x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, style: fx.pathStyle,
        })
      }
    } catch { /* ignore */ }
  }
}

export function fadeOutGiftSvgPath(path: SVGPathElement | null) {
  if (!path) return
  const group = (path as SVGPathElement & { _kdGroup?: SVGGElement })._kdGroup
  try {
    path.classList.add('is-fade-out')
    group?.classList.add('is-fade-out')
  } catch { /* ignore */ }
  window.setTimeout(() => {
    try {
      if (group) group.remove()
      else path.remove()
    } catch { /* ignore */ }
  }, GIFT_PATH_FADE_MS)
}

export function donateItemValueScore(item: DonateItemDef): number {
  return item.goldPrice + item.diamondPrice * 12
}

export function sfxForDonateItem(itemId: DonateItemId): SoundEffectType {
  if (itemId === 'tomato' || itemId === 'egg') return 'splat'
  if (itemId === 'lion' || itemId === 'dragon') return 'roar'
  if (itemId === 'sport_car' || itemId === 'private_jet') return 'vroom'
  if (itemId === 'coin_shower') return 'goldRain'
  if (itemId === 'galaxy') return 'galaxy'
  if (itemId === 'golden_angel') return 'angel'
  if (itemId === 'diamond_ocean') return 'crystal'
  if (itemId === 'yacht') return 'waves'
  if (itemId === 'castle') return 'fanfare'
  if (itemId === 'crown') return 'coin'
  const item = DONATE_BY_ID[itemId]
  if (item && item.goldPrice > 0 && item.diamondPrice === 0) return 'coin'
  if (item?.tier === 'vip') return 'coin'
  return 'coin'
}

/**
 * گیفتی VIP لەسەر نەخشە — GIF ی ڕاستەقینە + بۆکسی بچووک
 * تەنها: «فڵان ناردی · ناوی گیفت»
 */
export function spawnMapAmbientGiftFx(
  map: L.Map,
  opts: {
    itemId: DonateItemId
    emoji: string
    label: string
    fromName: string
    toName: string
    durationMs?: number
  },
): void {
  const durationMs = opts.durationMs ?? MAP_AMBIENT_GIFT_MS
  const layer = ensureGiftFxLayer(map)
  const isGalaxy = opts.itemId === 'galaxy'
  const isGoldRain = opts.itemId === 'coin_shower'
  // بارانی زێڕ: تەنها باران + بۆکسی بچووک (بێ GIFی ناوەڕاست)
  const gifSrc = isGoldRain ? undefined : VIP_GIFT_GIF[opts.itemId]
  const wrap = document.createElement('div')
  wrap.className = [
    'kd-map-ambient-fx',
    isGalaxy ? 'kd-map-ambient-fx--galaxy' : '',
    isGoldRain ? 'kd-map-ambient-fx--gold-rain' : '',
    gifSrc ? 'kd-map-ambient-fx--has-gif' : '',
    `kd-map-ambient-fx--${opts.itemId}`,
  ].filter(Boolean).join(' ')
  wrap.setAttribute('aria-hidden', 'true')

  const glow = document.createElement('div')
  glow.className = 'kd-map-ambient-glow'
  wrap.appendChild(glow)

  if (gifSrc) {
    const media = document.createElement('div')
    media.className = 'kd-map-ambient-media'
    const img = document.createElement('img')
    img.className = 'kd-map-ambient-gif'
    img.src = gifSrc
    img.alt = ''
    img.decoding = 'async'
    img.draggable = false
    media.appendChild(img)
    wrap.appendChild(media)
  }

  // باران / ئەستێرە تەنها بۆ بارانی زێڕ و گەلەستێرە
  if (isGoldRain || isGalaxy) {
    const sparkleHost = document.createElement('div')
    sparkleHost.className = 'kd-map-ambient-sparkles'
    const count = isGalaxy ? 48 : 56
    for (let i = 0; i < count; i++) {
      const drop = document.createElement('span')
      drop.className = isGalaxy ? 'kd-map-ambient-star' : 'kd-map-ambient-coin'
      drop.textContent = isGalaxy ? (i % 3 === 0 ? '✨' : '⭐') : (i % 4 === 0 ? '🪙' : '💰')
      drop.style.left = `${Math.random() * 100}%`
      drop.style.animationDelay = `${(Math.random() * durationMs * 0.55) / 1000}s`
      drop.style.animationDuration = `${2.4 + Math.random() * 2.8}s`
      drop.style.fontSize = `${14 + Math.floor(Math.random() * 18)}px`
      sparkleHost.appendChild(drop)
    }
    wrap.appendChild(sparkleHost)
  }

  const banner = document.createElement('div')
  banner.className = 'kd-map-ambient-banner'
  banner.innerHTML = `<div class="kd-map-ambient-banner-line"><span class="kd-map-ambient-from">${escapeHtml(opts.fromName)}</span> ناردی · <span class="kd-map-ambient-gift">${escapeHtml(opts.label)}</span></div>`
  wrap.appendChild(banner)

  layer.root.appendChild(wrap)
  window.setTimeout(() => {
    try { wrap.classList.add('is-out') } catch { /* ignore */ }
    window.setTimeout(() => {
      try { wrap.remove() } catch { /* ignore */ }
    }, 420)
  }, durationMs)
}

export function royalRankMedal(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

export function donateVisualScale(itemId: DonateItemId): number {
  const item = DONATE_BY_ID[itemId]
  if (!item) return 1
  if (item.tier === 'vip') {
    return Math.min(4.6, 2.35 + item.diamondPrice / 200)
  }
  if (item.tier === 'mid') {
    return Math.min(2.05, 1.25 + donateItemValueScore(item) / 280)
  }
  return Math.min(1.35, 0.9 + item.goldPrice / 80)
}

/** قەبارەی فڕین لەسەر نەخشە — ~٪٤٥–٥٠ بچووکتر، هاوسەنگ لەگەڵ ئاڤاتار */
export function donateFlyVisualScale(itemId: DonateItemId): number {
  const item = DONATE_BY_ID[itemId]
  if (!item) return 0.55
  if (item.tier === 'vip') return 0.62
  if (item.tier === 'mid') return 0.58
  return 0.55
}

export function donateFlyIconSize(_itemId: DonateItemId): [number, number] {
  return [GIFT_FLY_ICON_PX, GIFT_FLY_ICON_PX]
}

export function donateFlyZIndex(itemId: DonateItemId): number {
  const item = DONATE_BY_ID[itemId]
  if (!item) return 6200
  return 6200 + Math.round(donateItemValueScore(item) * 3)
}

export function canAffordDonateItem(
  wallet: { gold: number; diamond: number },
  item: DonateItemDef,
): boolean {
  if (item.goldPrice > 0 && wallet.gold < item.goldPrice) return false
  if (item.diamondPrice > 0 && wallet.diamond < item.diamondPrice) return false
  return item.goldPrice > 0 || item.diamondPrice > 0
}

export function formatDonateCostLabel(item: DonateItemDef): string {
  const parts: string[] = []
  if (item.goldPrice > 0) parts.push(`${item.goldPrice} 🪙`)
  if (item.diamondPrice > 0) parts.push(`${item.diamondPrice} 💎`)
  return parts.join(' + ') || '0'
}

export type SpinRewardKind = 'gold' | 'diamond' | 'retry'

export type SpinWheelSegment = {
  id: string
  kind: SpinRewardKind
  amount: number
  label: string
  icon: string
  short: string
  /** خەڵاتی گەورە — پێویستی ٢× مەسروفات */
  tier?: 'high'
  color: string
}

/**
 * ١٦ خانەی ڕێک — ئەڵماس / زێڕ / دووبارە
 * لەسەر خانەکان تەنها ژمارە + ئایکۆن دەردەکەوێت
 */
export const SPIN_WHEEL_SEGMENTS: SpinWheelSegment[] = [
  { id: 'd1', kind: 'diamond', amount: 1, label: '1 ئەڵماس', icon: '💎', short: '1', color: '#1e3a8a' },
  { id: 'g25', kind: 'gold', amount: 25, label: '25 زێڕ', icon: '🪙', short: '25', color: '#c9a227' },
  { id: 'i1k', kind: 'diamond', amount: 10, label: '10 ئەڵماس', icon: '💎', short: '10', color: '#4c1d95' },
  { id: 'd3', kind: 'diamond', amount: 3, label: '3 ئەڵماس', icon: '💎', short: '3', color: '#1d4ed8' },
  { id: 'g50', kind: 'gold', amount: 50, label: '50 زێڕ', icon: '🪙', short: '50', color: '#daa520' },
  { id: 'i5k', kind: 'diamond', amount: 50, label: '50 ئەڵماس', icon: '💎', short: '50', color: '#6b21a8' },
  { id: 'd5', kind: 'diamond', amount: 5, label: '5 ئەڵماس', icon: '💎', short: '5', color: '#172554' },
  { id: 'g100', kind: 'gold', amount: 100, label: '100 زێڕ', icon: '🪙', short: '100', color: '#b8860b' },
  { id: 'i15k', kind: 'diamond', amount: 150, label: '150 ئەڵماس', icon: '💎', short: '150', color: '#5b21b6', tier: 'high' },
  { id: 'd10', kind: 'diamond', amount: 10, label: '10 ئەڵماس', icon: '💎', short: '10', color: '#2563eb', tier: 'high' },
  { id: 'g150', kind: 'gold', amount: 150, label: '150 زێڕ', icon: '🪙', short: '150', color: '#f0c14b', tier: 'high' },
  { id: 'i25k', kind: 'diamond', amount: 250, label: '250 ئەڵماس', icon: '💎', short: '250', color: '#7c3aed', tier: 'high' },
  { id: 'd15', kind: 'diamond', amount: 15, label: '15 ئەڵماس', icon: '💎', short: '15', color: '#0c1a4a', tier: 'high' },
  { id: 'g250', kind: 'gold', amount: 250, label: '250 زێڕ', icon: '🪙', short: '250', color: '#a16207', tier: 'high' },
  { id: 'i50k', kind: 'diamond', amount: 500, label: '500 ئەڵماس', icon: '💎', short: '500', color: '#3b0764', tier: 'high' },
  { id: 'retry', kind: 'retry', amount: 0, label: '🔄 دووبارە', icon: '🔄', short: '🔄', color: '#0a0a0c' },
]

export const SPIN_SLICE_DEG = 360 / SPIN_WHEEL_SEGMENTS.length
export const SPIN_WHEEL_SVG_R = 98
export const SPIN_WHEEL_SVG_CX = 100
export const SPIN_WHEEL_SVG_CY = 100
export const SPIN_WHEEL_HUB_R = 30
/** شوێنی خەڵات — ناوەڕاستی بەشی خانە (نێوان hub و لێواری دەرەوە) */
export const SPIN_WHEEL_LABEL_R = 76
export const SPIN_GOLD_STROKE = '#FFD700'
/** ماوەی ئەنیمەیشنی سووڕانەوەی چەرخ (ms) — لەگەڵ CSS transition */
export const SPIN_ANIM_MS = 4800
/** نرخی یەکەم سپینی پارەدار (دوای بێبەرامبەر) */
export const SPIN_PAID_BASE_DIAMOND = 5
/** ٪٣٠ زیادبوونی نرخ بۆ هەر سپینی دواتر */
export const SPIN_PRICE_SCALE = 1.3

export function spinDegToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** زاویەی دەستپێک / ناوەڕاست / کۆتایی هەر خانەیەک (٠ لە سەرەوە) */
export function spinSliceAngles(index: number, total = SPIN_WHEEL_SEGMENTS.length) {
  const slice = 360 / total
  const mid = index * slice - 90
  return {
    slice,
    mid,
    start: mid - slice / 2,
    end: mid + slice / 2,
  }
}

export function spinPolar(cx: number, cy: number, r: number, deg: number) {
  const rad = spinDegToRad(deg)
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

export function spinSegmentUnit(kind: SpinWheelSegment['kind']): string {
  if (kind === 'gold') return 'زێڕ'
  if (kind === 'diamond') return 'ئەڵماس'
  return ''
}

/** ژمارەی بڕ — تەنها ڕەقەم (بێ دەقی کوردی) */
export function formatSpinSegAmount(seg: SpinWheelSegment): string {
  if (seg.kind === 'retry') return ''
  return seg.amount.toLocaleString('en-US')
}

/**
 * سەرچاوەی وێنەی دراوی ستاندارد (پاکێجی ژمارە ١)
 * بۆ چەرخ، هێدەر، فرۆشگا — هەموو یەک شێوە
 */
export function currencyIconSrc(kind: 'gold' | 'diamond'): string {
  return kind === 'diamond' ? GEM_HEADER_ICON : GOLD_HEADER_ICON
}

/** ئایکۆنی کۆین/دیاری بۆ ناو خانەی چەرخ — وێنەی پاکێجی ١ یان 🔄 */
export function spinSliceIcon(seg: SpinWheelSegment): string {
  if (seg.kind === 'retry') return '🔄'
  return currencyIconSrc(seg.kind)
}

/** ئایا خانەکە وێنەی دراو بەکاردەهێنێت (نەک ئیمۆجی) */
export function spinSliceUsesCurrencyImage(seg: SpinWheelSegment): boolean {
  return seg.kind === 'gold' || seg.kind === 'diamond'
}
/** SVG Pure Slices — path حیسابکراو بە sin/cos */
export function spinSlicePath(index: number, total = SPIN_WHEEL_SEGMENTS.length): string {
  const { start, end } = spinSliceAngles(index, total)
  const cx = SPIN_WHEEL_SVG_CX
  const cy = SPIN_WHEEL_SVG_CY
  const r = SPIN_WHEEL_SVG_R
  const p1 = spinPolar(cx, cy, r, start)
  const p2 = spinPolar(cx, cy, r, end)
  return `M ${cx} ${cy} L ${p1.x.toFixed(4)} ${p1.y.toFixed(4)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(4)} ${p2.y.toFixed(4)} Z`
}

/** هێڵی جیاکەرەوەی ئاڵتوونی لە نێوان خانەکان */
export function spinDividerPath(index: number, total = SPIN_WHEEL_SEGMENTS.length): string {
  const { start } = spinSliceAngles(index, total)
  const cx = SPIN_WHEEL_SVG_CX
  const cy = SPIN_WHEEL_SVG_CY
  const inner = SPIN_WHEEL_HUB_R + 1
  const outer = SPIN_WHEEL_SVG_R
  const a = spinPolar(cx, cy, inner, start)
  const b = spinPolar(cx, cy, outer, start)
  return `M ${a.x.toFixed(4)} ${a.y.toFixed(4)} L ${b.x.toFixed(4)} ${b.y.toFixed(4)}`
}

/**
 * شوێنی ناوەڕۆک لە ناوەڕاستی خانە — سووڕانەوە بەرەو سەنتەر،
 * نیمەکەی خوارەوە ١٨٠° دەسووڕێت تا ژمارە/ئایکۆن سەرەوژێر نەبێت
 */
export function spinLabelTransform(index: number, total = SPIN_WHEEL_SEGMENTS.length): string {
  const { mid } = spinSliceAngles(index, total)
  const p = spinPolar(SPIN_WHEEL_SVG_CX, SPIN_WHEEL_SVG_CY, SPIN_WHEEL_LABEL_R, mid)
  let rot = mid + 90
  const flip = Math.sin(spinDegToRad(mid)) > 0.02
  if (flip) rot += 180
  return `translate(${p.x.toFixed(3)}, ${p.y.toFixed(3)}) rotate(${rot.toFixed(3)})`
}

export function getDailyCardRewardDisplay(reward: {
  cardIcon: string
  kind?: string
  title?: string
  gold?: number
  diamond?: number
  preview: Array<{ icon: string; text: string }>
}): { icon: string; amount: string; unit: string } {
  const gold = typeof reward.gold === 'number' ? reward.gold : 0
  const diamond = typeof reward.diamond === 'number' ? reward.diamond : 0
  if (gold > 0 && diamond > 0) {
    return {
      icon: reward.cardIcon === '💎' ? '💎' : '🪙',
      amount: gold.toLocaleString('en-US'),
      unit: `زێڕ · ${diamond.toLocaleString('en-US')} ئەڵماس`,
    }
  }
  if (diamond > 0) {
    return { icon: '💎', amount: diamond.toLocaleString('en-US'), unit: 'ئەڵماس' }
  }
  if (gold > 0) {
    return { icon: '🪙', amount: gold.toLocaleString('en-US'), unit: 'زێڕ' }
  }
  const line = reward.preview[0]
  return { icon: line?.icon || reward.cardIcon || '🎁', amount: '', unit: line?.text?.slice(0, 12) || '—' }
}

export const SPIN_RESULT_Z = 999999

export type PlayerSpendTotals = { gold: number; diamond: number }

export function getDailySpinDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function getSpinCostForNext(spinsToday: number): number {
  // سووڕانی یەکەم: بێبەرامبەر
  if (spinsToday <= 0) return 0
  // دوای بێبەرامبەر: ٥ ئەڵماس، پاشان ٪٣٠ زیادبوون (Math.round)
  let price = SPIN_PAID_BASE_DIAMOND
  for (let i = 1; i < spinsToday; i++) {
    price = Math.round(price * SPIN_PRICE_SCALE)
  }
  return price
}

export function playerSpendStorageKey(uid: string) {
  return `kd_player_spend_${uid}`
}

export function dailySpinStorageKey(uid: string) {
  return `kd_daily_spin_${uid}`
}

/** Legacy migration flags — no longer applied on login (progress must persist). */
export const ECONOMY_ZERO_RESET_FLAG = 'kd_economy_defaults_v2'
export const FACTORY_RESET_FLAG = 'kd_factory_reset_v1_done'

/** ٤ شێوازی نەخشە — Standard (دیفۆڵت) ➔ Light ➔ Dark ➔ Satellite */
export type MapThemeId = 'light' | 'dark' | 'satellite' | 'standard'
export const MAP_THEME_STORAGE_KEY = 'kd_map_theme'
/** نەخشەی بنەڕەتی کاتێک یارییەکە لۆد دەبێت (یەکەم جار) */
export const DEFAULT_MAP_THEME: MapThemeId = 'standard'
export const DEFAULT_MAP_CENTER: [number, number] = [36.1901, 44.0091] // Erbil
export const MAP_THEME_ORDER: MapThemeId[] = ['standard', 'light', 'dark', 'satellite']
export const MAP_THEME_LABELS: Record<MapThemeId, string> = {
  standard: 'نەخشەی ئەسڵی',
  light: 'نەخشەی سپی',
  dark: 'نەخشەی تاریک',
  satellite: 'نەخشەی سەتەلایت',
}
export const MAP_TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
export const MAP_TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
export const MAP_TILE_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
export const MAP_TILE_STANDARD = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export function isLocalNetworkHttpOrigin(): boolean {
  try {
    if (typeof window === 'undefined') return false
    const { protocol, hostname } = window.location
    if (protocol !== 'http:') return false
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  } catch {
    return false
  }
}

export function normalizeMapThemeId(v: string | null | undefined): MapThemeId | null {
  if (v === 'light' || v === 'dark' || v === 'satellite' || v === 'standard') return v
  if (v === 'classic') return 'standard'
  return null
}

export function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(key)
  } catch (err) {
    console.error(`localStorage.getItem failed for ${key}:`, err)
    return null
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(key, value)
  } catch (err) {
    console.error(`localStorage.setItem failed for ${key}:`, err)
  }
}

export function safeJsonParse<T>(raw: string | null, fallback: T, keyForCleanup?: string): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    console.error('JSON.parse failed:', err)
    if (keyForCleanup) {
      try { localStorage.removeItem(keyForCleanup) } catch { /* ignore */ }
    }
    return fallback
  }
}

export function readStoredMapTheme(): MapThemeId {
  try {
    const raw = safeLocalStorageGet(MAP_THEME_STORAGE_KEY)
    if (raw == null || raw === '') {
      persistMapTheme(DEFAULT_MAP_THEME)
      return DEFAULT_MAP_THEME
    }
    const parsed = normalizeMapThemeId(raw)
    if (parsed) return parsed
  } catch { /* ignore */ }
  return DEFAULT_MAP_THEME
}

export function persistMapTheme(theme: MapThemeId) {
  safeLocalStorageSet(MAP_THEME_STORAGE_KEY, theme)
}

export function nextMapTheme(current: MapThemeId): MapThemeId {
  const i = MAP_THEME_ORDER.indexOf(current)
  const idx = i >= 0 ? i : 0
  return MAP_THEME_ORDER[(idx + 1) % MAP_THEME_ORDER.length]!
}

export function mapThemeTileUrl(theme: MapThemeId): string {
  if (theme === 'light') return MAP_TILE_LIGHT
  if (theme === 'dark') return MAP_TILE_DARK
  if (theme === 'satellite') return MAP_TILE_SATELLITE
  return MAP_TILE_STANDARD
}

export function applyMapThemeClass(el: HTMLElement, theme: MapThemeId) {
  el.classList.remove(
    'kd-map-theme-light',
    'kd-map-theme-dark',
    'kd-map-theme-satellite',
    'kd-map-theme-standard',
    'kd-map-theme-classic',
  )
  el.classList.add(`kd-map-theme-${theme}`)
}

export function createMapThemeTileLayer(theme: MapThemeId): L.TileLayer {
  const url = mapThemeTileUrl(theme)
  if (theme === 'satellite') {
    return L.tileLayer(url, {
      maxZoom: 19,
      updateWhenIdle: true,
      keepBuffer: 2,
    })
  }
  return L.tileLayer(url, {
    maxZoom: 19,
    subdomains: theme === 'light' || theme === 'dark' ? 'abcd' : 'abc',
    updateWhenIdle: true,
    keepBuffer: 2,
  })
}

export function clearLocalPlayerEconomyData(uid?: string | null) {
  if (typeof localStorage === 'undefined') return
  try {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      const hit =
        key.startsWith('kd_')
        || key.startsWith('user_data_')
        || key.startsWith('kd_daily_spin_')
        || key.startsWith('kd_activity_archive_')
        || key.includes('season')
        || key.includes('pass_')
        || key.includes('wallet')
        || key.includes('playerXp')
        || key.includes('player_level')
        || (uid != null && (
          key === playerSpendStorageKey(uid)
          || key === dailySpinStorageKey(uid)
          || key === `user_data_${uid}`
        ))
      if (hit) toRemove.push(key)
    }
    for (const key of toRemove) {
      try { localStorage.removeItem(key) } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

export function loadPlayerSpend(uid: string): PlayerSpendTotals {
  try {
    const key = playerSpendStorageKey(uid)
    const raw = safeLocalStorageGet(key)
    if (raw) {
      const parsed = safeJsonParse<Partial<PlayerSpendTotals>>(raw, {}, key)
      return {
        gold: typeof parsed.gold === 'number' ? parsed.gold : 0,
        diamond: typeof parsed.diamond === 'number' ? parsed.diamond : 0,
      }
    }
  } catch { /* ignore */ }
  return { gold: 0, diamond: 0 }
}

export function recordPlayerSpend(uid: string, delta: Partial<PlayerSpendTotals>) {
  const cur = loadPlayerSpend(uid)
  const next: PlayerSpendTotals = {
    gold: cur.gold + (delta.gold ?? 0),
    diamond: cur.diamond + (delta.diamond ?? 0),
  }
  safeLocalStorageSet(playerSpendStorageKey(uid), JSON.stringify(next))
  return next
}

export function loadDailySpinState(uid: string): { dayKey: string; spinsToday: number } {
  const today = getDailySpinDayKey()
  try {
    const key = dailySpinStorageKey(uid)
    const raw = safeLocalStorageGet(key)
    if (raw) {
      const parsed = safeJsonParse<{ dayKey?: string; spinsToday?: number }>(raw, {}, key)
      if (parsed.dayKey === today && typeof parsed.spinsToday === 'number') {
        return { dayKey: today, spinsToday: parsed.spinsToday }
      }
    }
  } catch { /* ignore */ }
  return { dayKey: today, spinsToday: 0 }
}

export function saveDailySpinState(uid: string, state: { dayKey: string; spinsToday: number }) {
  safeLocalStorageSet(dailySpinStorageKey(uid), JSON.stringify(state))
}

/** کۆی مەسروفات بە یەکەی هاوتای زێڕ (بۆ TotalSpent) */
export function totalSpendGoldEq(spend: PlayerSpendTotals): number {
  // ١ ئەڵماس ≈ ٥٠ زێڕ
  return spend.gold + spend.diamond * 50
}

/** بەهای خەڵات بە هەمان یەکە */
export function spinRewardGoldEq(seg: SpinWheelSegment): number {
  if (seg.kind === 'retry') return 0
  if (seg.kind === 'gold') return seg.amount
  if (seg.kind === 'diamond') return seg.amount * 50
  return 0
}

/**
 * لۆژیکی ٢× مەسروفات:
 * خەڵاتە گەورەکان (بە تایبەت ١٥٠+ ئەڵماس) قەدەغەن
 * تا TotalSpent >= rewardValue * 2
 */
export function canWinSpinReward(spend: PlayerSpendTotals, seg: SpinWheelSegment): boolean {
  if (seg.kind === 'retry') return true
  // خەڵاتە گەورەکان + هەموو tier:high
  const isBig =
    seg.tier === 'high'
    || (seg.kind === 'diamond' && seg.amount >= 150)
    || (seg.kind === 'gold' && seg.amount >= 150)
  if (!isBig) return true
  const totalSpent = totalSpendGoldEq(spend)
  const rewardValue = spinRewardGoldEq(seg)
  return totalSpent >= rewardValue * 2
}

export function weightedPickSegment(
  items: SpinWheelSegment[],
  weightFn: (s: SpinWheelSegment) => number,
): SpinWheelSegment {
  const weights = items.map((s) => Math.max(0, weightFn(s)))
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) return items[Math.floor(Math.random() * items.length)]!
  let r = Math.random() * sum
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!
    if (r <= 0) return items[i]!
  }
  return items[items.length - 1]!
}

export function pickSpinReward(spinsToday: number, spend: PlayerSpendTotals): SpinWheelSegment {
  const eligible = SPIN_WHEEL_SEGMENTS.filter((s) => canWinSpinReward(spend, s))
  const pool = eligible.length > 0 ? eligible : SPIN_WHEEL_SEGMENTS.filter((s) => s.kind !== 'diamond' || s.amount < 150)

  // سپینی یەکەمی بێبەرامبەر — ئەگەری زێڕی ئاسایی زۆرتر
  if (spinsToday === 0) {
    return weightedPickSegment(pool, (s) => {
      if (s.kind === 'gold' && s.amount <= 100) return 14
      if (s.kind === 'gold') return 4
      if (s.kind === 'retry') return 3
      if (s.kind === 'diamond' && s.amount <= 50) return 2
      return 0.5
    })
  }

  // سپینی پارەدار — دابەشکردنی گونجاو بەڵام خەڵاتی گەورە کەمتر
  return weightedPickSegment(pool, (s) => {
    if (s.kind === 'retry') return 3
    if (s.tier === 'high') return 1
    if (s.kind === 'gold') return 5
    if (s.kind === 'diamond') return 4
    return 2
  })
}

export type MapAvatarOverlay =
  | { kind: 'tomato_splat'; untilMs: number }
  | { kind: 'egg_splat'; untilMs: number }
  | { kind: 'crown'; untilMs: number }
  | { kind: 'thunder'; untilMs: number }
  | { kind: 'heart_burst'; untilMs: number }
  | { kind: 'vip_spectacle'; itemId: DonateItemId; emoji: string; scale: number; untilMs: number }
  | { kind: 'donate_item'; emoji: string; itemId: DonateItemId; scale: number; untilMs: number }

export const HEAD_EXPLOSION_DONATE_ITEMS = new Set<DonateItemId>(['tomato', 'egg'])

export function donateOverlayDurationMs(itemId: DonateItemId): number {
  // بارانی زێڕ / گەلەستێرە: ١٠چ لەسەر نەخشە؛ VIPی تر: ١٥چ؛ ئاسایی: ٥چ
  if (isAmbientMapGift(itemId)) return MAP_AMBIENT_GIFT_MS
  if (DONATE_BY_ID[itemId]?.tier === 'vip') return PREMIUM_GIFT_GROW_MS
  return DONATE_HOLD_MS
}


export function buildDonateFlyHtml(itemId: DonateItemId, emoji: string): string {
  const scale = donateFlyVisualScale(itemId)
  const item = DONATE_BY_ID[itemId]
  const tierClass = item?.tier === 'vip' ? ' is-vip' : item?.tier === 'mid' ? ' is-mid' : ' is-basic'
  // تەنها ئایکۆنی بچووک — ناوەڕاستی هێڵ (iconAnchor + flex center)
  return `<div class="kd-donate-fly kd-donate-fly--${itemId}${tierClass}" style="--kd-donate-scale:${scale}" aria-hidden="true"><span class="kd-donate-fly-core">${emoji}</span></div>`
}

export function buildLiquidSplatHtml(kind: 'tomato' | 'egg'): string {
  const drops = Array.from({ length: 10 }, (_, i) => `<span class="kd-splat-drop d${i + 1}"></span>`).join('')
  const blobs = Array.from({ length: 8 }, (_, i) => `<span class="kd-splat-blob b${i + 1}"></span>`).join('')
  return `<div class="kd-vfx-wrap" aria-hidden="true"><div class="kd-body-stain kd-body-stain--${kind}"></div><div class="kd-head-fx kd-liquid-splat kd-liquid-splat--${kind}"><span class="kd-splat-shock"></span><span class="kd-splat-core"></span>${blobs}${drops}<span class="kd-splat-mist"></span><span class="kd-splat-sheet"></span></div></div>`
}

export function buildMapEffectOverlayHtml(
  uid: string,
  overlays: Map<string, MapAvatarOverlay>,
): string {
  const overlay = overlays.get(uid)
  if (!overlay || overlay.untilMs <= Date.now()) return ''
  if (overlay.kind === 'tomato_splat') {
    return buildLiquidSplatHtml('tomato')
  }
  if (overlay.kind === 'egg_splat') {
    return buildLiquidSplatHtml('egg')
  }
  if (overlay.kind === 'crown') {
    return `<div class="kd-vfx-wrap" aria-hidden="true"><div class="kd-head-fx kd-crown-vfx"><span class="kd-crown-glow"></span><span class="kd-crown-icon">👑</span><span class="kd-crown-spark a"></span><span class="kd-crown-spark b"></span></div></div>`
  }
  if (overlay.kind === 'thunder') {
    return `<div class="kd-vfx-wrap" aria-hidden="true"><div class="kd-head-fx kd-thunder-vfx"><span class="kd-thunder-cloud">☁️</span><span class="kd-thunder-bolt b1">⚡</span><span class="kd-thunder-bolt b2">⚡</span><span class="kd-thunder-flash"></span></div></div>`
  }
  if (overlay.kind === 'heart_burst') {
    return `<div class="kd-vfx-wrap" aria-hidden="true"><div class="kd-head-fx kd-burst-vfx kd-heart-burst"><span class="kd-burst-ring"></span><span class="kd-burst-core">💖</span><span class="kd-burst-p p1">💕</span><span class="kd-burst-p p2">💗</span><span class="kd-burst-p p3">💓</span><span class="kd-burst-p p4">💞</span><span class="kd-burst-p p5">💘</span><span class="kd-burst-p p6">💝</span></div></div>`
  }
  if (overlay.kind === 'vip_spectacle') {
    return `<div class="kd-vfx-wrap kd-vfx-wrap--vip" style="--kd-donate-scale:${overlay.scale};z-index:${Math.round(30 + overlay.scale * 10)}" aria-hidden="true"><div class="kd-head-fx"><div class="kd-vip-vfx kd-vip-vfx--${overlay.itemId}"><span class="kd-vip-shock"></span><span class="kd-vip-aura"></span><span class="kd-vip-ring"></span><span class="kd-vip-core">${overlay.emoji}</span><span class="kd-vip-spark s1"></span><span class="kd-vip-spark s2"></span><span class="kd-vip-spark s3"></span><span class="kd-vip-spark s4"></span></div></div></div>`
  }
  if (overlay.kind === 'donate_item') {
    return `<div class="kd-vfx-wrap" style="--kd-donate-scale:${overlay.scale}" aria-hidden="true"><div class="kd-head-fx"><div class="kd-donate-avatar-item kd-donate-avatar-item--${overlay.itemId}"><span class="kd-donate-item-glow"></span><span class="kd-donate-item-emoji">${overlay.emoji}</span></div></div></div>`
  }
  return ''
}

export function mapOverlaySig(uid: string, overlays: Map<string, MapAvatarOverlay>): string {
  const ov = overlays.get(uid)
  if (!ov || ov.untilMs <= Date.now()) return ''
  if (ov.kind === 'donate_item') return `d:${ov.itemId}:${ov.emoji}:${ov.scale}:${ov.untilMs}`
  if (ov.kind === 'vip_spectacle') return `vip:${ov.itemId}:${ov.emoji}:${ov.scale}:${ov.untilMs}`
  return `${ov.kind}:${ov.untilMs}`
}

/** ئەنیمەیشنی iOS — spring نەرم */
export const IOS_SPRING_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export function outgoingFriendStorageKey(uid: string) {
  return `kd_outgoing_friend_${uid}`
}

export function loadOutgoingFriendUidsLocal(uid: string): string[] {
  try {
    const key = outgoingFriendStorageKey(uid)
    const raw = safeLocalStorageGet(key)
    if (!raw) return []
    const parsed = safeJsonParse<unknown>(raw, [], key)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function saveOutgoingFriendUidsLocal(uid: string, uids: string[]) {
  safeLocalStorageSet(outgoingFriendStorageKey(uid), JSON.stringify([...new Set(uids)]))
}

/** ڕەنگی بۆکس بەپێی ڕۆڵ + ئاست */
export function playerBoxTheme(level: number) {
  const rank = hunterRankForLevel(level)
  return {
    color: rank.glow,
    glow: `${rank.glow}55`,
    accent: `${rank.glow}99`,
    roleName: rank.name,
    roleIcon: rank.icon,
  }
}

/** ئایکۆنی ئاست لەسەر کارەکتەر — ناچالاک (هیچ ئاستێک ئایکۆنی نییە) */
export function buildMapChestBadgeHtml(_hunterLevel: number): string {
  return ''
}

/** کلیلی بازنەی ژێر پێ — تەنها پادشا */
export type MapFootRingKey = 'padsha'

export function mapFootRingKey(hunterLevel: number): MapFootRingKey | null {
  const rank = hunterRankForLevel(hunterLevel)
  return rank.name === 'پادشا' ? 'padsha' : null
}

/**
 * بازنەی ژێر پێ — تەنها بۆ پادشا؛ چەماوەی خڕی بریقەدار.
 */
export function buildMapFootRingHtml(hunterLevel: number): string {
  const key = mapFootRingKey(hunterLevel)
  if (!key) return ''
  return `<div class="kd-foot-ring kd-foot-ring--padsha" aria-hidden="true"><span class="kd-foot-ring-core"></span><span class="kd-foot-ring-shine"></span></div>`
}

/** دەقێکی کوردی بۆ کاتی دوایین مانەوە */
export function formatLastSeenKu(lastSeenMs: number | null | undefined, nowMs: number): string {
  if (!lastSeenMs || !Number.isFinite(lastSeenMs)) return 'کاتی دوایین مانەوە نەزانراوە'
  const diff = Math.max(0, nowMs - lastSeenMs)
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'پێش کەمتر لە خولەکێک لەسەر هێڵ بوو'
  if (min < 60) return `پێش ${min} خولەک لەسەر هێڵ بوو`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `پێش ${hrs} کاتژمێر لەسەر هێڵ بوو`
  const days = Math.floor(hrs / 24)
  return `پێش ${days} ڕۆژ لەسەر هێڵ بوو`
}

export interface DonateFxEntry {
  id: string
  eventId: string
  itemId: DonateItemId
  emoji: string
  fromUid: string
  targetUid: string
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  ctrlLat: number
  ctrlLng: number
  pathStyle: GiftPathStyle
  startMs: number
  /** کاتی فڕین بەپێی دووری (ms) — ٣–٥چ، max ١٠چ */
  flightMs: number
  /** مانەوە لەسەر وەرگر دوای گەیشتن (ms) — ٥چ */
  holdMs: number
  lineUntilMs: number
  itemUntilMs: number
  /** SVG path لەسەر kd-gift-fx-layer */
  svgPath: SVGPathElement | null
  /** ئایکۆنی فڕین — HTML لەسەر FX layer (دەرەوەی مارکەر، getPointAtLength) */
  flyIcon: HTMLElement | null
  floatMarker: L.Marker | null
  phase: 'flying' | 'floating' | 'done'
  /** خەڵات / باڵانسی وەرگر تەنها جارێک لە کاتی گەیشتن جێبەجێ دەکرێت */
  arrivalHandled: boolean
}

export interface MapGestureState {
  pinching: boolean
  dragging: boolean
  zooming: boolean
  blockedUntil: number
  /** تەنها جووڵەی ڕاستەقینەی بەکارهێنەر — GPS setView ئەمە دانانێت */
  userMapGesture: boolean
  singleTouchActive: boolean
  singleTouchMoved: boolean
  singleTouchStartX: number
  singleTouchStartY: number
}

export function extendMapMarkerClickBlock(
  gesture: React.MutableRefObject<MapGestureState>,
  ms = MAP_MARKER_CLICK_GUARD_MS,
) {
  gesture.current.blockedUntil = Math.max(gesture.current.blockedUntil, Date.now() + ms)
}

export function isMapMarkerClickBlocked(gesture: React.MutableRefObject<MapGestureState>): boolean {
  const g = gesture.current
  return g.pinching || g.dragging || g.zooming || Date.now() < g.blockedUntil
}

/** یەک tap/click — ڕێگری لە دووبارەبوونەوەی touch + click ghost */
export function bindInstantTap(
  touchLockRef: React.MutableRefObject<boolean>,
  action: () => void,
): {
  onTouchEnd: (e: React.TouchEvent) => void
  onClick: (e: React.MouseEvent) => void
} {
  return {
    onTouchEnd(e) {
      e.stopPropagation()
      e.preventDefault()
      if (touchLockRef.current) return
      touchLockRef.current = true
      action()
      window.setTimeout(() => { touchLockRef.current = false }, 450)
    },
    onClick(e) {
      e.stopPropagation()
      if (touchLockRef.current) return
      action()
    },
  }
}

/** دوگمەی نەخشە/markers — touchend/click یەکجار + stopPropagation/preventDefault */
export function runInstantMapTargetAction(
  touchLockRef: React.MutableRefObject<boolean>,
  e: MouseEvent | TouchEvent | PointerEvent | Event,
  action: () => void,
) {
  if (touchLockRef.current) return
  try { e.stopPropagation() } catch { /* ignore */ }
  try { e.preventDefault() } catch { /* ignore */ }
  const t = e.type
  if (t === 'touchend') {
    touchLockRef.current = true
    action()
    window.setTimeout(() => { touchLockRef.current = false }, 450)
    return
  }
  // click (ئەگەر touchend پێشتر نەیکردبێت)
  action()
}

export function isOptimisticDmId(id: string): boolean {
  return id.startsWith('optimistic:')
}

export function mergeDmThreadMessages(serverMsgs: DmMessage[], optimisticMsgs: DmMessage[], myUid: string): DmMessage[] {
  const remaining = optimisticMsgs.filter(opt => {
    if (opt.from !== myUid) return true
    return !serverMsgs.some(s => {
      if (s.from !== myUid || s.kind !== opt.kind) return false
      if (opt.id && s.clientTempId && s.clientTempId === opt.id) return true
      if (s.createdAtMs < opt.createdAtMs - 8000) return false
      if (opt.kind === 'image' || opt.kind === 'audio' || opt.kind === 'video') {
        if (!s.mediaUrl) return false
        // نامەی سێرڤەر بۆ optimisticی ترە
        if (s.clientTempId && s.clientTempId !== opt.id) return false
        if (Math.abs(s.createdAtMs - opt.createdAtMs) > 5000) return false
        // نزیکترین optimistic بۆ ئەم نامەی سێرڤەرە
        const closer = optimisticMsgs.some(o =>
          o !== opt &&
          o.from === myUid &&
          o.kind === opt.kind &&
          Math.abs(s.createdAtMs - o.createdAtMs) < Math.abs(s.createdAtMs - opt.createdAtMs),
        )
        return !closer
      }
      return s.text === opt.text
    })
  })
  return [...serverMsgs, ...remaining].sort((a, b) => a.createdAtMs - b.createdAtMs).slice(-100)
}

export function bumpDmThreadPreview(
  threads: DmThreadSummary[],
  myUid: string,
  partnerUid: string,
  partnerName: string,
  preview: string,
  nowMs: number,
): DmThreadSummary[] {
  const idx = threads.findIndex(t => t.otherUid === partnerUid)
  if (idx >= 0) {
    const updated = { ...threads[idx], lastMessage: preview, updatedAtMs: nowMs }
    const rest = threads.filter((_, i) => i !== idx)
    return [updated, ...rest].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAtMs - a.updatedAtMs
    })
  }
  return [{
    id: [myUid, partnerUid].sort().join('_'),
    otherUid: partnerUid,
    otherName: partnerName,
    lastMessage: preview,
    updatedAtMs: nowMs,
    unreadCount: 0,
    pinned: false,
    muted: false,
  }, ...threads]
}

/** ناوی نێرەر بۆ دەقی ئاگاداری — هەمیشە ناوی تەواو */
export function notifSenderLabel(name: string | undefined | null): string {
  const n = String(name ?? '').trim()
  return n || 'یاریزان'
}

export function notifFriendRequestCopy(fromName: string) {
  const sender = notifSenderLabel(fromName)
  return {
    title: `${sender} — داواکاری هاوڕێیەتی`,
    body: `${sender} داوای هاوڕێیەتی کرد — دەتەوێت قبوڵی بکەیت؟`,
  }
}

export function notifMessageCopy(fromName: string, preview: string, unread: number) {
  const sender = notifSenderLabel(fromName)
  const previewText = preview.trim() || 'نامەیەکی نوێت هەیە'
  const unreadSuffix = unread > 1 ? ` (${unread} نامەی نەخوێندراو)` : ''
  return {
    title: `${sender} — نامەی نوێ`,
    body: `${sender}: ${previewText}${unreadSuffix}`,
  }
}

export function notifDiamondGiftCopy(fromName: string, amount: number) {
  const sender = notifSenderLabel(fromName)
  return {
    title: `${sender} — دیاری`,
    body: `${sender} ${amount.toLocaleString()} ئەڵماسی وەک دیاری بۆت نارد.`,
  }
}

export function notifMapItemGiftCopy(fromName: string, emoji: string, itemLabel: string) {
  const sender = notifSenderLabel(fromName)
  const item = itemLabel.trim() || 'دیاری'
  return {
    title: `${sender} — دیاری`,
    body: `${sender} ئایتمی ${emoji} ${item}ی بۆ بەخشیت.`,
  }
}

export function enrichInboxNotificationCopy(n: InboxNotification): InboxNotification {
  if (!n.fromName) return n
  const sender = notifSenderLabel(n.fromName)
  if (n.body.includes(sender)) return n
  return {
    ...n,
    title: n.title.includes(sender) ? n.title : `${sender} — ${n.title}`,
    body: `${sender}: ${n.body}`,
  }
}

/** Escape values embedded in HTML attributes (map marker data-*). */

export function escapeAttr(value: string): string {

  return String(value ?? '')

    .replace(/&/g, '&amp;')

    .replace(/"/g, '&quot;')

    .replace(/'/g, '&#39;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

}

export function escapeHtml(value: string): string {

  return String(value ?? '')

    .replace(/&/g, '&amp;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

    .replace(/"/g, '&quot;')

}

export type ActiveMapChatBubble = {
  id: string
  uid: string
  text: string
  isPremium: boolean
  createdAtMs: number
  expiresAtMs: number
  /** ئاستی ڕاوکەر بۆ جیاکردنەوەی بڵقی والی+ */
  hunterLevel: number
}

/** والی و بەرزتر (والی، پادشا، سوڵتان، ئیمپراتۆر، ئەفسانە) */
export const MAP_CHAT_ELITE_RANK_MIN = 7

export function isMapChatEliteHunter(hunterLevel: number): boolean {
  return hunterRankIndex(hunterLevel) >= MAP_CHAT_ELITE_RANK_MIN
}

export function mapChatBubbleSig(
  uid: string,
  bubbles: Map<string, ActiveMapChatBubble>,
  revealed: Set<string>,
  myUid: string | null,
): string {
  const b = bubbles.get(uid)
  if (!b || b.expiresAtMs <= Date.now()) return ''
  const clear = b.isPremium === true || b.uid === myUid || revealed.has(b.id)
  const elite = isMapChatEliteHunter(b.hunterLevel)
  return `${b.id}:${clear ? '1' : '0'}:${b.expiresAtMs}:${elite ? 'E' : 'S'}:${Math.max(0, Math.floor(b.hunterLevel || 0))}`
}

export function buildMapChatBubbleHtml(
  uid: string,
  bubbles: Map<string, ActiveMapChatBubble>,
  revealed: Set<string>,
  myUid: string | null,
  hideAll = false,
): string {
  if (hideAll) return ''
  const b = bubbles.get(uid)
  if (!b || b.expiresAtMs <= Date.now()) return ''
  const lifeMs = Math.max(1, b.expiresAtMs - b.createdAtMs)
  const hunterLevel = Math.max(0, Math.floor(Number(b.hunterLevel) || 0))
  const elite = isMapChatEliteHunter(hunterLevel)
  const rank = hunterRankForLevel(hunterLevel)
  const lifeStyle = `--kd-chat-life-ms:${lifeMs}ms;--kd-chat-rank-glow:${escapeAttr(rank.glow)}`
  const clear = b.isPremium === true || b.uid === myUid || revealed.has(b.id)
  const eliteClass = elite ? ' is-elite' : ' is-standard'
  const clearClass = clear ? ' is-clear' : ' is-hidden'
  const badge = ''
  const aura = elite ? '<span class="kd-map-chat-elite-aura" aria-hidden="true"></span>' : ''
  const body = clear
    ? `<span class="kd-map-chat-text">${escapeHtml(b.text)}</span>`
    : `<span class="kd-map-chat-text kd-map-chat-teaser">💬 نامەی نوێ (کلیک بکە)</span>`
  const titleAttr = clear ? '' : ' title="کلیک بکە بۆ بینین"'
  return `<div class="kd-map-chat-bubble${eliteClass}${clearClass}" data-chat-id="${escapeAttr(b.id)}" data-chat-uid="${escapeAttr(uid)}" style="${lifeStyle}"${titleAttr}>${aura}${badge}${body}<span class="kd-map-chat-tail" aria-hidden="true"></span></div>`
}

export const DROP_MARKER_Z_OFFSET = 12000

export type GameAlertTone = 'info' | 'error' | 'success' | 'warn'

export type GameAlertState = {

  title?: string

  message: string

  icon?: string

  tone?: GameAlertTone

  /** toast = non-blocking floating banner; modal = confirm dialog with buttons */
  mode?: 'toast' | 'modal'

  confirmLabel?: string

  cancelLabel?: string

  onConfirm?: () => void

  onCancel?: () => void

  /** مۆدالی داخڵکردنی دەق (لەجیاتی window.prompt) */
  hasInput?: boolean

  inputLabel?: string

  inputPlaceholder?: string

  inputType?: 'text' | 'password' | 'email' | 'tel'

}

export const REWARD_TOAST_MS = 5_000

/** کاتی یاری بە کاتژمێر — کەمتر لە ١ کاتژمێر بە پۆینت (نموونە: ٠.٤ کاتژمێر) */
export function formatPlayTime(ms: number): string {
  const hours = Math.max(0, ms / 3_600_000)
  if (hours < 1) {
    const pts = Math.round(hours * 10) / 10
    return `${pts} کاتژمێر`
  }
  const rounded = Math.round(hours * 10) / 10
  return `${rounded} کاتژمێر`
}

/** بەرواری دروستکردنی هەژمار — هەمیشە کوردی (بێ پشتبەستن بە Intl locale) */
const KU_MONTHS = [
  'کانوونی دووەم',
  'شوبات',
  'ئازار',
  'نیسان',
  'ئایار',
  'حوزەیران',
  'تەممووز',
  'ئاب',
  'ئەیلوول',
  'تشرینی یەکەم',
  'تشرینی دووەم',
  'کانوونی یەکەم',
] as const

export function formatAccountCreatedAt(ms: number | null | undefined): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return '—'
  const d = new Date(ms)
  if (!Number.isFinite(d.getTime())) return '—'
  const day = d.getDate()
  const month = KU_MONTHS[d.getMonth()] ?? String(d.getMonth() + 1)
  const year = d.getFullYear()
  return `${day}ی ${month}ی ${year}`
}

export const DM_EMOJI_LIST = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '⭐', '🎉', '🎮', '💎', '👑', '🫡', '🤝', '👋', '🙏']

export const LOCATION_SYNC_MS = 1600

// خولی هەڵسەنگاندنەوەی خشتەی گشتی درۆپەکان (هەموو کەسێک ڕێک هەمان genesisMs بەکاردێنێت)

export const SCHEDULE_CHECK_MS = 20000

export function formatDurationKu(ms: number): string {

  if (ms < 3600000) return `${Math.round(ms / 60000)} خولەک`

  const hours = ms / 3600000

  if (Number.isInteger(hours)) return `${hours} کاتژمێر`

  const whole = Math.floor(hours)

  const mins = Math.round((hours - whole) * 60)

  if (mins === 30) return `${whole} کاتژمێر و نیو`

  if (mins === 0) return `${whole} کاتژمێر`

  return `${whole} کاتژمێر و ${mins} خولەک`

}

export const FALLBACK_PROFILE: UserProfile = {

  name: 'یاریزان',

  username: '',

  email: '',

  phone: '',

  usernameEditUsed: false,

  emailEditUsed: false,

  phoneEditUsed: false,

  gender: 'male',

  gold: WELCOME_BONUS_GOLD,

  diamond: WELCOME_BONUS_DIAMOND,

  isPremium: false,

  title: HUNTER_ROLE_NAME,

  avatarUrl: null,

  avatar3d: { ...DEFAULT_AVATAR_3D },

  playerId: '',

  settings: { ...DEFAULT_USER_SETTINGS },

  stats: { ...DEFAULT_PLAYER_STATS },

  dropsOpenedByType: { ...EMPTY_DROPS_OPENED },

  hunterLevel: 0,

  playerLevel: 1,

  playerXp: 0,

  welcomeBonusGranted: true,

  createdAtMs: null,

  giftsSentScore: 0,

}

export function avatarForGender(gender?: Gender) {

  return gender === 'female' ? femaleAvatar : maleAvatar

}

/** ئاڤاتاری سەر بۆ ڕیزبەندی دەوڵەمەندەکان — هەمان سەرچاوەی نەخشە/پرۆفایل */
export function resolveLeaderboardHeadAvatar(opts: {
  uid: string
  gender?: Gender | null
  avatarUrl?: string | null
  avatar3d?: Avatar3DCustomization | null
  skinId?: number | null
  borderId?: number | null
  live?: {
    avatarUrl?: string | null
    avatar3d?: Avatar3DCustomization | null
    gender?: Gender | null
    skinId?: number | null
    borderId?: number | null
  } | null
}): {
  avatarUrl: string
  avatar3d: Avatar3DCustomization | null
  skin: CosmeticDef | null
  border: CosmeticDef | null
  gender: Gender
} {
  const live = opts.live
  const gender: Gender = (live?.gender === 'female' || opts.gender === 'female') ? 'female' : 'male'
  const rawUrl = (live?.avatarUrl || opts.avatarUrl || '').trim()
  const avatarUrl = rawUrl || avatarForGender(gender)
  const avatar3d = live?.avatar3d != null
    ? normalizeAvatar3d(live.avatar3d)
    : (opts.avatar3d != null ? normalizeAvatar3d(opts.avatar3d) : null)
  const skinId = live?.skinId ?? opts.skinId ?? null
  const borderId = live?.borderId ?? opts.borderId ?? null
  return {
    avatarUrl,
    avatar3d,
    skin: skinId != null ? COSMETIC_BY_ID[skinId] ?? null : null,
    border: borderId != null ? COSMETIC_BY_ID[borderId] ?? null : null,
    gender,
  }
}

/** ٥ جۆری ڕاستەقینەی درۆپ (Common → Legendary) — neon glass accents */
export const erbilChests = [

  { id: 1, name: '🟡 درۆپی ئەفسانەیی', rarity: 'ئەفسانەیی', boxColor: '#1a1400', tarpColor: '#FFD700', smoke: 'rgba(255,215,0,0.9)', p1: '#FDE047', p2: '#CA8A04', desc: 'دەگمەنترین درۆپ — خەڵاتی ئەفسانەیی لە ئاسمانەوە!', rewards: '💎 ٣٠٠–٥٠٠ ئەڵماس | زێڕ+ئەڵماس زیاتر | کەرەستەی فرۆشگا | کەرەستەی دەگمەن | XP٧٥' },

  { id: 2, name: '🟠 درۆپی دەگمەن',    rarity: 'دەگمەن',    boxColor: '#1a0a00', tarpColor: '#FF6B2D', smoke: 'rgba(255,107,45,0.9)', p1: '#FB923C', p2: '#C2410C', desc: 'درۆپێکی پرتەقاڵی دەگمەن کە خەڵاتی زۆری تێدایە.', rewards: '💎 ٢٠٠–٣٠٠ ئەڵماس | زێڕ+ئەڵماس زیاتر | کەرەستەی فرۆشگا | XP٤٨' },

  { id: 3, name: '🟣 درۆپی ئاست بەرز', rarity: 'ئاست بەرز', boxColor: '#16001f', tarpColor: '#FF2D95', smoke: 'rgba(255,45,149,0.85)',  p1: '#E879F9', p2: '#A21CAF', desc: 'درۆپێکی مۆر کە پارە و زێڕی زۆری تێدایە.', rewards: '💎 ١٥٠–٢٠٠ ئەڵماس | زێڕ+ئەڵماس | کەرەستەی فرۆشگا | XP٣٢' },

  { id: 4, name: '🔵 درۆپی ناوەند',    rarity: 'ناوەند',    boxColor: '#00111f', tarpColor: '#00F0FF', smoke: 'rgba(0,240,255,0.9)', p1: '#67E8F9', p2: '#0891B2', desc: 'درۆپێکی شین کە بۆ بەرزکردنەوەی ئاست باشە.', rewards: '💎 ٧٠–١٥٠ ئەڵماس | زێڕ+ئەڵماس | کەرەستەی فرۆشگا | XP٢٠' },

  { id: 5, name: '⚪ درۆپی ئاسایی',    rarity: 'ئاسایی',    boxColor: '#0b1220', tarpColor: '#38BDF8', smoke: 'rgba(56,189,248,0.75)', p1: '#E0F2FE', p2: '#64748B', desc: 'درۆپێکی کلاسیکی کە بۆ دەستپێکێکی خێرا نایابە.', rewards: '💎 ٥٠–٧٠ ئەڵماس | زێڕ+ئەڵماس | کەرەستەی فرۆشگا | XP١٢' },

]

/** ناوی ئاگادارکردنەوە بەپێی dropType (١=ئاسایی … ٥=ئەفسانەیی) */
export const DROP_RARITY_TIERS = [
  { dropType: 1, rarity: 'ئاسایی', icon: '⚪', toast: '⚪ درۆپێکی ئاسایی کەوتە خوارەوە!', accent: '#e2e8f0' },
  { dropType: 2, rarity: 'ناوەند', icon: '🔵', toast: '🔵 درۆپێکی ناوەند کەوتە خوارەوە!', accent: '#3b82f6' },
  { dropType: 3, rarity: 'ئاست بەرز', icon: '🟣', toast: '🟣 درۆپێکی ئاست بەرز کەوتە خوارەوە!', accent: '#a855f7' },
  { dropType: 4, rarity: 'دەگمەن', icon: '🟠', toast: '🟠 درۆپێکی دەگمەن کەوتە خوارەوە!', accent: '#f97316' },
  { dropType: 5, rarity: 'ئەفسانەیی', icon: '🟡', toast: '🟡 درۆپێکی ئەفسانەیی کەوتە خوارەوە!', accent: '#facc15' },
] as const

export function getDropRarityTier(dropType: number, chestId?: number) {
  if (dropType >= 1 && dropType <= 5) return DROP_RARITY_TIERS[dropType - 1]
  if (typeof chestId === 'number' && chestId >= 1 && chestId <= 5) {
    return DROP_RARITY_TIERS[5 - chestId]
  }
  return DROP_RARITY_TIERS[0]
}

export interface ShopCatalogItem {

  id: number

  name: string

  desc: string

  icon: string

  price: number

  curr: Currency

  isCosmetic: boolean

  tab?: CitadelShopTab

}

/** چەک — وێنە + وەسفی هێز و بەکارهێنان (ئەڵماس / زێڕ) */

export const WEAPON_SHOP_ITEMS: ShopCatalogItem[] = [

  {
    id: 1,
    name: 'دەمانچەی فڵار',
    desc: 'دوای کڕین ڕاستەوخۆ تەقێنرێت و ناچێتە جانتاوە. لەو شوێنەی لێی وەستاویت بانگەوازی درۆپێکی تایبەت دەکات بۆ لات.',
    icon: '🔫',
    price: 150,
    curr: 'diamond',
    isCosmetic: false,
    tab: 'weapons',
  },

  {
    id: 3,
    name: 'کلیلی ئەفسانەیی',
    desc: 'کاتێک چالاک بێت، قوفڵی کاتی درۆپ لادەبات و ڕاستەوخۆ ڕێگەت پێدەدات سندوقەکە بکارێتەوە.',
    icon: '🗝️',
    price: 50,
    curr: 'diamond',
    isCosmetic: false,
    tab: 'weapons',
  },

  {
    id: 15,
    name: 'خەنجەری ڕاوکەر',
    desc: 'پەرەشوتی درۆپی ڕکابەر دەبڕیت کاتێک هەوڵی داگرتنی دەدات — کات لەدەست دەدات و درۆپەکە ناکەوێتە ژێر دەستی.',
    icon: '🗡️',
    price: 1200,
    curr: 'gold',
    isCosmetic: false,
    tab: 'weapons',
  },

  {
    id: 16,
    name: 'تەڵەی سندوق',
    desc: 'سندوقێکی ساختە لەسەر نەخشەکە بەجێدەهێڵێت تا یاریزانانی تر هەڵخەڵەتێنێت.',
    icon: '💣',
    price: 180,
    curr: 'diamond',
    isCosmetic: false,
    tab: 'weapons',
  },

  {
    id: 25,
    name: 'مینەی ناخوێن',
    desc: 'مینەیەکی شاراوە لەسەر نەخشەکە دادەنرێت — هەر کەسێک پێیدا بڕوات زیانی پێ دەگات یان کاتی لێ دەبڕێت.',
    icon: '🪤',
    price: 600,
    curr: 'gold',
    isCosmetic: false,
    tab: 'weapons',
  },

  {
    id: 46,
    name: 'تیری ئاگرین',
    desc: 'ئاراستەی ڕکابەر دەکرێت و بۆ ٣٠ چرکە شاشەکەی کوێر/تاریک دەکات تا نەتوانێت ڕادار یان نەخشە ببینێت.',
    icon: '🏹',
    price: 700,
    curr: 'gold',
    isCosmetic: false,
    tab: 'weapons',
  },

]

/** تەنها ئایتمە چالاکەکانی فرۆشگا — بێ تاب */
export const ACTIVE_SHOP_ITEM_IDS = [1, 3, 15, 16, 25, 46] as const

export const ACTIVE_SHOP_ITEMS: ShopCatalogItem[] = WEAPON_SHOP_ITEMS.filter(i =>
  (ACTIVE_SHOP_ITEM_IDS as readonly number[]).includes(i.id),
)

/** ڕادار — مەودا و ماوە (ئەڵماس / زێڕ) — کۆن / ناچالاک لە UI */

export const RADAR_SHOP_ITEMS: ShopCatalogItem[] = []

/** پاراستن — کۆن / ناچالاک لە UI */

export const PROTECTION_SHOP_ITEMS: ShopCatalogItem[] = []

export const GEAR_SHOP_ITEMS: ShopCatalogItem[] = [

  ...WEAPON_SHOP_ITEMS,

  ...RADAR_SHOP_ITEMS,

  ...PROTECTION_SHOP_ITEMS,

]

/** جوانکاری — ئەڵماس/زێڕ بەپێی کاڵاکە */

export const COSMETIC_SHOP_ITEMS: ShopCatalogItem[] = COSMETIC_ITEMS.map(c => ({

  id: c.id,

  name: c.name,

  desc: c.desc,

  icon: c.icon,

  price: c.price,

  curr: c.curr as Currency,

  isCosmetic: true,

}))

export const COSMETIC_GRID_COLS = 5

export const COSMETIC_GRID_ROWS = 4

export const COSMETIC_PAGE_SIZE = COSMETIC_GRID_COLS * COSMETIC_GRID_ROWS

/** وێنەی بچووک: ئاڤاتار کە کاڵای جوانکاریی لەبەردایە — بێ تێکست */

export function CitadelCosmeticWearThumb({ def, avatarSrc }: { def: CosmeticDef; avatarSrc: string }) {

  const size = 40

  const inner = 34

  const skin = def.slot === 'avatar' ? def : null

  const border = def.slot === 'border' ? def : null

  const headwear = def.slot === 'headwear' ? def : null

  const accessory = def.slot === 'accessory' ? def : null

  const title = def.slot === 'title' ? def : null

  const trail = def.slot === 'trail' ? def : null

  return (

    <div

      className={`kd-avatar-frame ${border?.borderClass ?? ''}`}

      style={{

        width: size,

        height: size,

        borderRadius: '50%',

        flexShrink: 0,

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        position: 'relative',

        overflow: 'visible',

      }}

    >

      {skin?.skinClass ? (

        <div className={`kd-skin-disc ${skin.skinClass}`} style={{ width: inner, height: inner, borderRadius: '50%' }} />

      ) : skin ? (

        <div

          style={{

            width: inner,

            height: inner,

            borderRadius: '50%',

            background: skin.skinGradient,

            boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.15), inset 0 -6px 10px rgba(0,0,0,0.45)',

          }}

        />

      ) : (

        <div style={{ width: inner, height: inner, borderRadius: '50%', overflow: 'hidden', background: '#0f172a' }}>

          <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

        </div>

      )}

      {(headwear || accessory) && (

        <span

          style={{ display: 'contents' }}

          dangerouslySetInnerHTML={{ __html: buildWearableOverlaysHtml(headwear, accessory) }}

        />

      )}

      {title && (

        <span

          aria-hidden="true"

          style={{

            position: 'absolute',

            bottom: -2,

            left: '50%',

            transform: 'translateX(-50%)',

            width: 10,

            height: 4,

            borderRadius: 3,

            background: title.titleColor,

            boxShadow: `0 0 6px ${title.titleGlow}`,

          }}

        />

      )}

      {trail?.trailFx && (

        <span

          aria-hidden="true"

          style={{

            position: 'absolute',

            top: -2,

            right: -2,

            width: 8,

            height: 8,

            borderRadius: '50%',

            background: trail.trailFx.fillColor,

            boxShadow: `0 0 8px ${trail.trailFx.color}`,

          }}

        />

      )}

    </div>

  )

}

/** کاتالۆگی تەواوی فرۆشگای قەڵا — ئەڵماس و زێڕ */

export const blackMarketItems: ShopCatalogItem[] = [...GEAR_SHOP_ITEMS, ...COSMETIC_SHOP_ITEMS]

export function catalogForCitadelTab(_tab?: CitadelShopTab, _gender?: ShopGender): ShopCatalogItem[] {
  return ACTIVE_SHOP_ITEMS
}

export function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {

  const R = 6371e3

  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180

  const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2

  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))

}

/** سنووری ئاسمانی شارەکان (مەتر) — بۆ ئاگاداری فڕۆکە بەپێی لۆکەیشن */
export const CITY_AIRSPACE_RADIUS_M: Record<string, number> = {
  erbil: 14_000,
  sulaymaniyah: 12_000,
  halabja: 8_000,
  kirkuk: 12_000,
  duhok: 10_000,
  zakho: 8_000,
}

export type CityAirspace = {
  key: string
  name: string
  lat: number
  lng: number
  radiusM: number
}

export const CITY_AIRSPACES: CityAirspace[] = FLIGHT_CITIES.map(city => ({
  key: city.key,
  name: city.name,
  lat: city.lat,
  lng: city.lng,
  radiusM: CITY_AIRSPACE_RADIUS_M[city.key] ?? 10_000,
}))

export function formatPlaneCityArrivalMessage(cityName: string): string {
  return `✈️ فڕۆکەکە گەیشتە ئاسمانی شاری ${cityName}! ئامادە بن بۆ درۆپەکان!`
}

/** Lucide-style SVG icons for map FABs — unified stroke set */
export type MapFabIconName =
  | 'settings'
  | 'spin'
  | 'gift'
  | 'shop'
  | 'route'
  | 'plane'
  | 'gps'
  | 'gpsFixed'
  | 'chat'
  | 'radar'
  | 'layers'

export function MapFabIcon({ name }: { name: MapFabIconName }) {
  const props = {
    className: 'kd-map-fab-svg',
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
  switch (name) {
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.5v2M12 19.5v2M4.7 4.7l1.4 1.4M17.9 17.9l1.4 1.4M2.5 12h2M19.5 12h2M4.7 19.3l1.4-1.4M17.9 6.1l1.4-1.4" />
        </svg>
      )
    case 'spin':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="2.6" />
          <path d="M12 3.5v2.8M12 17.7v2.8M3.5 12h2.8M17.7 12h2.8" />
        </svg>
      )
    case 'gift':
      return (
        <svg {...props}>
          <rect x="4" y="9" width="16" height="3.2" rx="1" />
          <path d="M12 9v11M5 12.2V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6.8" />
          <path d="M12 9H8.2A2.2 2.2 0 1 1 8.2 4.6C11 4.6 12 9 12 9zM12 9h3.8a2.2 2.2 0 1 0 0-4.4C13 4.6 12 9 12 9z" />
        </svg>
      )
    case 'shop':
      return (
        <svg {...props}>
          <path d="M6.5 9.5 8 4h8l1.5 5.5" />
          <path d="M5 9.5h14l-1 10.2a1.6 1.6 0 0 1-1.6 1.4H7.6A1.6 1.6 0 0 1 6 19.7L5 9.5z" />
          <path d="M9.2 13.2v2.8M14.8 13.2v2.8" />
        </svg>
      )
    case 'route':
      return (
        <svg {...props}>
          <circle cx="6.5" cy="18.5" r="2" />
          <circle cx="17.5" cy="5.5" r="2" />
          <path d="M8.4 17.2c1.6-2.8 3.4-4.4 5.2-5.6 1.3-.9 2.5-1.4 3.6-1.7" />
        </svg>
      )
    case 'plane':
      return (
        <svg {...props}>
          <path d="M10.5 12.5 4.2 10.8c-.45-.12-.7.4-.35.7L9 14.2l-2.1 2.6H5.2l-.7.7 2.2 1.4 1.4 2.2.7-.7v-1.7l2.6-2.1 2.7 5.15c.3.45.9.35 1.05-.18L20.2 7.8c.2-.7-.45-1.3-1.12-1.05L10.5 12.5z" />
        </svg>
      )
    case 'gps':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="7.2" />
          <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21" />
        </svg>
      )
    case 'gpsFixed':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="7.2" />
          <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21" />
        </svg>
      )
    case 'chat':
      return (
        <svg {...props}>
          <path d="M20.5 11.6a7.8 7.8 0 0 1-.85 3.5 7.9 7.9 0 0 1-7.05 4.35 7.8 7.8 0 0 1-3.5-.85L4 20.5l1.75-5.25a7.8 7.8 0 0 1-.85-3.5 7.9 7.9 0 0 1 4.35-7.05 7.8 7.8 0 0 1 3.5-.85h.45a7.9 7.9 0 0 1 7.3 7.3v.45z" />
        </svg>
      )
    case 'radar':
      return (
        <svg {...props} width={26} height={26}>
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
          <path d="M12 5.2a6.8 6.8 0 0 1 6.8 6.8" />
          <path d="M12 3a9 9 0 0 1 9 9" opacity="0.7" />
          <circle cx="12" cy="12" r="8.4" opacity="0.45" />
          <path d="M12 12l5.4-3.1" />
        </svg>
      )
    case 'layers':
      return (
        <svg {...props}>
          <path d="M12 3.2 3.5 8.2 12 13.2l8.5-5L12 3.2z" />
          <path d="M3.5 12.2 12 17.2l8.5-5" />
          <path d="M3.5 16.2 12 21.2l8.5-5" opacity="0.85" />
        </svg>
      )
    default:
      return null
  }
}

export const NEARBY_MAX_M = 1000

/** کەمترین دووری جوگرافی لە نێوان هەر دوو ئاڤاتار لەسەر نەخشە (مەتر) — تەنها پیشاندان */

export const AVATAR_MIN_SEP_M = 48

export const EARTH_RADIUS_M = 6371000

export function hashUidStable(uid: string): number {

  let h = 2166136261

  for (let i = 0; i < uid.length; i++) {

    h ^= uid.charCodeAt(i)

    h = Math.imul(h, 16777619)

  }

  return h >>> 0

}

/** خاڵێک لە دووری `distanceM` و ئاراستەی `bearingRad` لە (lat,lng) */

export function destinationPoint(lat: number, lng: number, bearingRad: number, distanceM: number) {

  const δ = distanceM / EARTH_RADIUS_M

  const φ1 = lat * Math.PI / 180

  const λ1 = lng * Math.PI / 180

  const φ2 = Math.asin(

    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(bearingRad),

  )

  const λ2 = λ1 + Math.atan2(

    Math.sin(bearingRad) * Math.sin(δ) * Math.cos(φ1),

    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),

  )

  return {

    lat: φ2 * 180 / Math.PI,

    lng: ((λ2 * 180 / Math.PI) + 540) % 360 - 180,

  }

}

export function initialBearingRad(lat1: number, lng1: number, lat2: number, lng2: number) {

  const φ1 = lat1 * Math.PI / 180

  const φ2 = lat2 * Math.PI / 180

  const Δλ = (lng2 - lng1) * Math.PI / 180

  const y = Math.sin(Δλ) * Math.cos(φ2)

  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  return Math.atan2(y, x)

}

/**

 * دوورخستنەوەی جوگرافی ≥ ٢٥ مەتر بۆ پیشاندانی ئاڤاتار — جێگیر بەپێی uid.

 * شوێنی ڕاستەقینەی GPS ناگۆڕێت؛ تەنها LatLngـی مارکەر.

 */

export function computeAvatarDisplayPositions(

  avatars: Array<{ uid: string; lat: number; lng: number }>,

): Map<string, { lat: number; lng: number; zIndex: number }> {

  const sorted = [...avatars].sort((a, b) => a.uid.localeCompare(b.uid))

  const n = sorted.length

  const out = new Map<string, { lat: number; lng: number; zIndex: number }>()

  if (n === 0) return out

  // Union-find: کۆمەڵەکانی ناو ٢٥ مەتر (بەپێی شوێنی ڕاستەقینە)

  const parent = sorted.map((_, i) => i)

  const find = (i: number): number => {

    let x = i

    while (parent[x] !== x) x = parent[x]

    let y = i

    while (parent[y] !== x) {

      const next = parent[y]

      parent[y] = x

      y = next

    }

    return x

  }

  const unite = (a: number, b: number) => {

    const ra = find(a), rb = find(b)

    if (ra === rb) return

    if (sorted[ra].uid < sorted[rb].uid) parent[rb] = ra

    else parent[ra] = rb

  }

  for (let i = 0; i < n; i++) {

    for (let j = i + 1; j < n; j++) {

      if (calcDistance(sorted[i].lat, sorted[i].lng, sorted[j].lat, sorted[j].lng) < AVATAR_MIN_SEP_M) {

        unite(i, j)

      }

    }

  }

  const clusters = new Map<number, number[]>()

  for (let i = 0; i < n; i++) {

    const r = find(i)

    const list = clusters.get(r)

    if (list) list.push(i)

    else clusters.set(r, [i])

  }

  const display = sorted.map(a => ({ lat: a.lat, lng: a.lng }))

  clusters.forEach(members => {

    if (members.length === 1) return

    members.sort((a, b) => sorted[a].uid.localeCompare(sorted[b].uid))

    let cLat = 0, cLng = 0

    for (const i of members) {

      cLat += sorted[i].lat

      cLng += sorted[i].lng

    }

    cLat /= members.length

    cLng /= members.length

    // نیوەتیرەی بازنە: دووری نێوان دراوسێکان ≥ ٢٥ مەتر

    const k = members.length

    const radiusM = Math.max(

      AVATAR_MIN_SEP_M,

      AVATAR_MIN_SEP_M / (2 * Math.sin(Math.PI / k)),

    )

    // ئاراستەی سەرەتایی جێگیر بۆ کۆمەڵەکە

    let clusterHash = 0

    for (const i of members) clusterHash ^= hashUidStable(sorted[i].uid)

    const baseAngle = (clusterHash % 360) * (Math.PI / 180)

    members.forEach((idx, order) => {

      const angle = baseAngle + (2 * Math.PI * order) / k

      const p = destinationPoint(cLat, cLng, angle, radiusM)

      display[idx] = p

    })

  })

  // جیاکردنەوەی دووبارە تا هەموو جووتەکان ≥ ٢٥ مەتر بن

  for (let iter = 0; iter < 12; iter++) {

    let moved = false

    for (let i = 0; i < n; i++) {

      for (let j = i + 1; j < n; j++) {

        const dist = calcDistance(display[i].lat, display[i].lng, display[j].lat, display[j].lng)

        if (dist >= AVATAR_MIN_SEP_M) continue

        moved = true

        const need = (AVATAR_MIN_SEP_M - dist) / 2 + 0.5

        let bearing = initialBearingRad(display[i].lat, display[i].lng, display[j].lat, display[j].lng)

        if (dist < 0.5) {

          // هەمان خاڵ — ئاراستەی جێگیر لە uid

          bearing = ((hashUidStable(sorted[i].uid) ^ hashUidStable(sorted[j].uid)) % 360) * (Math.PI / 180)

        }

        display[j] = destinationPoint(display[j].lat, display[j].lng, bearing, need)

        display[i] = destinationPoint(display[i].lat, display[i].lng, bearing + Math.PI, need)

      }

    }

    if (!moved) break

  }

  for (let i = 0; i < n; i++) {

    out.set(sorted[i].uid, {

      lat: display[i].lat,

      lng: display[i].lng,

      zIndex: 2800 + (hashUidStable(sorted[i].uid) % 800),

    })

  }

  return out

}

// ── Audio ─────────────────────────────────────────────────────────────────────

export let sharedAudioCtx: AudioContext | null = null

export function getAudioCtx() {

  if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

  if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume().catch(() => {})

  return sharedAudioCtx

}

/** Short synthetic SFX (no external assets). Caller must gate on soundEnabled. */

export function playSfxTone(opts: {

  freqs: number[]

  type?: OscillatorType

  duration?: number

  volume?: number

  stagger?: number

}) {

  try {

    const ctx = getAudioCtx()

    const { freqs, type = 'sine', duration = 0.18, volume = 0.16, stagger = 0.06 } = opts

    freqs.forEach((freq, i) => {

      const osc = ctx.createOscillator()

      const gain = ctx.createGain()

      osc.type = type

      osc.frequency.value = freq

      const t0 = ctx.currentTime + i * stagger

      gain.gain.setValueAtTime(0.0001, t0)

      gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02)

      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

      osc.connect(gain)

      gain.connect(ctx.destination)

      osc.start(t0)

      osc.stop(t0 + duration + 0.03)

    })

  } catch {}

}

export function playClaimSfx(volumeScale = 1) {

  // Rising chime — claim / open success

  const v = Math.min(1, Math.max(0, volumeScale))
  if (v <= 0) return
  playSfxTone({ freqs: [523.25, 659.25, 783.99, 1046.5], type: 'triangle', duration: 0.22, volume: 0.15 * v, stagger: 0.07 })

}

export function playEquipSfx() {

  // Drum-like thud + harmonic — inventory equip cosmetics/jamadani

  playSfxTone({ freqs: [110, 220, 330], type: 'square', duration: 0.13, volume: 0.07, stagger: 0.04 })

}

export function playGunShotSfx() {

  playSfxTone({ freqs: [160, 85, 55], type: 'sawtooth', duration: 0.1, volume: 0.18, stagger: 0.025 })

  playSfxTone({ freqs: [420, 180], type: 'triangle', duration: 0.07, volume: 0.08, stagger: 0.02 })

}

export function playReloadSfx() {

  playSfxTone({ freqs: [220, 180, 140], type: 'square', duration: 0.08, volume: 0.06, stagger: 0.05 })

}

export function playHackTickSfx() {

  playSfxTone({ freqs: [720, 540], type: 'square', duration: 0.05, volume: 0.04, stagger: 0.02 })

}

/** دەنگی کردنەوەی قوفڵی خەزێنە — دوای سەوزبوونی گڵۆپی ژیۆسکۆپ */
export function playVaultLockSfx() {
  playSfxTone({ freqs: [180, 320, 520, 780], type: 'triangle', duration: 0.12, volume: 0.09, stagger: 0.06 })
  window.setTimeout(() => {
    playSfxTone({ freqs: [920, 640], type: 'square', duration: 0.07, volume: 0.06, stagger: 0.03 })
  }, 180)
}

export function formatHackClock(sec: number): string {

  const s = Math.max(0, Math.floor(sec))

  const m = Math.floor(s / 60)

  const r = s % 60

  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`

}

// ── Sheet ─────────────────────────────────────────────────────────────────────

export const Sheet = memo(function Sheet({ active, onClose, title, children, heightAuto = false, fitContent = false }: {

  active: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; heightAuto?: boolean; fitContent?: boolean

}) {

  const panelRef = useRef<HTMLDivElement>(null)

  const dragRef = useRef<{ startY: number }>({ startY: 0 })

  const onTouchStart = (e: React.TouchEvent) => {

    dragRef.current.startY = e.touches[0].clientY

    if (panelRef.current) panelRef.current.style.transition = 'none'

  }

  const onTouchMove = (e: React.TouchEvent) => {

    const dy = e.touches[0].clientY - dragRef.current.startY

    if (dy > 0 && panelRef.current) panelRef.current.style.transform = `translateY(${dy}px)`

  }

  const onTouchEnd = (e: React.TouchEvent) => {

    const dy = e.changedTouches[0].clientY - dragRef.current.startY

    if (!panelRef.current) return

    panelRef.current.style.transition = `transform 0.22s ${IOS_SHEET_EASE}`

    if (dy > 80) { panelRef.current.style.transform = 'translateY(100%)'; setTimeout(onClose, 200) }

    else panelRef.current.style.transform = 'translateY(0)'

  }

  return (

    <div

      onClick={e => { if (e.target === e.currentTarget) onClose() }}

      className="glass-surface"

      style={{

        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',

        background: 'rgba(2,6,18,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',

        zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',

        opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none',

        transition: 'opacity 0.18s ease',

      }}

    >

      <div

        ref={panelRef}

        className="glass-surface"

        style={{

          width: '100%',

          height: heightAuto ? 'auto' : '54%',

          maxHeight: fitContent ? 'none' : (heightAuto ? '55%' : undefined),

          background: fitContent
            ? 'linear-gradient(160deg, rgba(15,23,42,0.55) 0%, rgba(6,12,30,0.62) 100%)'
            : 'linear-gradient(160deg,rgba(10,18,42,0.98) 0%,rgba(6,12,30,0.99) 100%)',

          backdropFilter: fitContent ? 'blur(12px)' : 'blur(32px)',

          WebkitBackdropFilter: fitContent ? 'blur(12px)' : 'blur(32px)',

          borderTop: '1px solid rgba(255,255,255,0.1)',

          borderLeft: '1px solid rgba(255,255,255,0.05)',

          borderRight: '1px solid rgba(255,255,255,0.05)',

          borderRadius: '28px 28px 0 0',

          padding: fitContent ? '0 14px 18px' : '0 16px 28px',

          display: 'flex', flexDirection: 'column',

          boxShadow: '0 -24px 60px rgba(0,0,0,0.8), 0 -1px 0 rgba(0,240,255,0.08)',

          color: '#f8fafc',

          overflow: fitContent ? 'visible' : undefined,

          transform: active ? 'translateY(0)' : 'translateY(100%)',

          transition: `transform 0.22s ${IOS_SHEET_EASE}`,

          willChange: 'transform',

        }}

      >

        <div

          className="kd-sheet-drag-handle"

          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}

          style={{ touchAction: 'none', cursor: 'grab', flexShrink: 0, display: 'flex', justifyContent: 'center' }}

        >

          <div style={{ width: 36, height: 3.5, background: 'rgba(255,255,255,0.18)', borderRadius: 10 }} />

        </div>

        <div style={{
          overflowY: fitContent ? 'visible' : 'auto',
          overflowX: 'visible',
          WebkitOverflowScrolling: fitContent ? undefined : ('touch' as any),
          flexGrow: fitContent ? 0 : 1,
          maxHeight: fitContent ? 'none' : undefined,
          scrollbarWidth: 'none',
        } as React.CSSProperties}>

          {children}

        </div>

      </div>

    </div>

  )

})

export function SettingRow({ label, defaultOn = true, checked, onChange }: {

  label: string; defaultOn?: boolean; checked?: boolean; onChange?: (next: boolean) => void

}) {

  const [internalOn, setInternalOn] = useState(defaultOn)

  const on = checked !== undefined ? checked : internalOn

  const toggle = () => {

    const next = !on

    if (onChange) onChange(next)

    else setInternalOn(next)

  }

  return (

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 2px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11.5 }}>

      <span style={{ color: '#f8fafc' }}>{label}</span>

      <div
        role="switch"
        aria-checked={on}
        onClick={toggle}
        style={{
          width: 42, height: 22, background: on ? '#00f0ff' : 'rgba(255,255,255,0.15)', borderRadius: 12,
          position: 'relative', cursor: 'pointer', border: `1px solid ${on ? '#00f0ff' : 'rgba(255,255,255,0.2)'}`,
          transition: 'background 0.12s ease, border-color 0.12s ease', flexShrink: 0, touchAction: 'manipulation',
        }}
      >

        <div style={{ position: 'absolute', width: 18, height: 18, background: on ? '#040812' : '#fff', borderRadius: '50%', top: 1, left: 1, transition: 'transform 0.14s cubic-bezier(0.22, 1, 0.36, 1)', transform: on ? 'translateX(20px)' : 'none', willChange: 'transform' }} />

      </div>

    </div>

  )

}

/** سەردێڕی بەشێکی ڕێکخستن — ئایکۆن + ناونیشان، بۆ هەموو بەشەکانی پرۆفایل بەکاردێت */
export function ProfileSectionHeader({ icon, color, label, marginTop = 12 }: {
  icon: string; color: string; label: string; marginTop?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, direction: 'rtl', marginTop }}>
      <i className="material-icons" style={{ color, fontSize: 15 }}>{icon}</i>
      <span style={{ fontSize: 11.5, fontWeight: 900, color: '#fff' }}>{label}</span>
    </div>
  )
}

/** ڕیزی دەنگ — تۆگڵ + سلایدەری قەبارە پێکەوە، بۆ هەر جۆرە دەنگێکی جیاواز */
export function SoundToggleVolumeRow({ label, volumeLabel, enabled, volume, onToggle, onVolume }: {
  label: string
  volumeLabel: string
  enabled: boolean
  volume: number
  onToggle: (next: boolean) => void
  onVolume: (next: number) => void
}) {
  return (
    <>
      <div className="kd-settings-row">
        <div className="kd-settings-row-label">
          <span>{label}</span>
        </div>
        <div
          className={`kd-settings-toggle${enabled ? ' is-on' : ''}`}
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
        >
          <span />
        </div>
      </div>
      <div className="kd-settings-row">
        <div className="kd-settings-row-label">
          <span>{volumeLabel}</span>
          <span className="kd-settings-row-sub">{Math.round(volume * 100)}%</span>
        </div>
        <input
          className="kd-settings-volume"
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          disabled={!enabled}
          onChange={e => onVolume(Number(e.target.value) / 100)}
          aria-label={volumeLabel}
        />
      </div>
    </>
  )
}

/** MapPlayer — React.memo: تەنها کاتێک lat/lng/dist دەگۆڕێت نوێ دەبێتەوە */
export type NearbyPlayerRowProps = {
  uid: string
  name: string
  lat: number
  lng: number
  distM: number
  isOnline: boolean
  lastSeenMs?: number | null
  avatarUrl: string | null
  avatar3d: Avatar3DCustomization | null
  gender: Gender
  skinId: number | null
  borderId: number | null
  onFocus: (uid: string, lat: number, lng: number) => void
}

export const NearbyPlayerRow = memo(function NearbyPlayerRow({
  uid, name, lat, lng, distM, isOnline, lastSeenMs, avatarUrl, avatar3d, gender, skinId, borderId, onFocus,
}: NearbyPlayerRowProps) {
  const statusText = isOnline
    ? 'ئۆنلاین'
    : formatLastSeenKu(lastSeenMs, Date.now())
  return (
    <button
      type="button"
      className="kd-nearby-row btn-interactive"
      onClick={() => onFocus(uid, lat, lng)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 10px', borderRadius: 14,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff', fontFamily: 'var(--kd-font)', cursor: 'pointer', textAlign: 'right',
        transform: 'translate3d(0,0,0)', willChange: 'transform',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        border: `1.5px solid ${isOnline ? 'rgba(74,222,128,0.65)' : 'rgba(148,163,184,0.35)'}`,
        boxShadow: isOnline ? '0 0 10px rgba(74,222,128,0.35)' : 'none',
        opacity: isOnline ? 1 : 0.85,
      }}>
        <HeadShotAvatar
          sizePx={40}
          gender={gender}
          seed={uid}
          avatarUrl={avatarUrl || avatarForGender(gender)}
          skin={skinId != null ? COSMETIC_BY_ID[skinId] ?? null : null}
          border={borderId != null ? COSMETIC_BY_ID[borderId] ?? null : null}
          avatar3d={avatar3d}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? '#4ade80' : '#94a3b8', flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: isOnline ? '#86efac' : '#94a3b8' }}>{statusText}</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#7dd3fc', direction: 'ltr' }}>
            {distM < 1000 ? `${distM} م` : `${(distM / 1000).toFixed(2)} کم`}
          </span>
        </div>
      </div>
      <i className="material-icons" style={{ fontSize: 18, color: '#38bdf8', flexShrink: 0 }}>my_location</i>
    </button>
  )
}, (prev, next) => (
  prev.uid === next.uid
  && prev.lat === next.lat
  && prev.lng === next.lng
  && prev.distM === next.distM
  && prev.name === next.name
  && prev.isOnline === next.isOnline
  && prev.lastSeenMs === next.lastSeenMs
  && prev.avatarUrl === next.avatarUrl
  && prev.gender === next.gender
  && prev.skinId === next.skinId
  && prev.borderId === next.borderId
  && prev.onFocus === next.onFocus
))

// ── App ───────────────────────────────────────────────────────────────────────

