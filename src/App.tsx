import { Component, useState, useEffect, useRef, useCallback, useMemo, memo, type ErrorInfo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import L from 'leaflet'

import 'leaflet/dist/leaflet.css'
import './styles/app.css'

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
  isProtectedAccount,
  lockProtectedWallet,
  PROTECTED_LOCKED_GOLD,
  PROTECTED_LOCKED_DIAMOND,
} from './data/protectedPlayers'

import {
  NATIONAL_FACTORIES,
  NATIONAL_FACTORY_BY_ID,
  factoryCityName,
  factoryLabel,
  factoryVisualScaleForZoom,
  type NationalFactory,
} from './data/nationalFactories'

import {
  loadFactoryProgress,
  saveFactoryProgress,
  claimFromNationalFactory,
  emptyFactoryProgress,
  ensureFactoryStockDoc,
  subscribeFactoryStock,
  type FactoryProgressState,
  type SharedFactoryStock,
} from './services/factoryService'


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

/** ئایکۆنی یەکگرتووی زێڕ — هەمان وێنەی هێدەر لە هەموو یارییەکەدا */

import {
  GoldIcon,
  hunterDisplay,
  giftPathControlPoint,
  calcDonateFlightMs,
  giftSvgStrokeStyle,
  giftQuadraticScreenControl,
  giftQuadraticScreenPathD,
  giftQuadraticScreenPointAt,
  ensureGiftFxLayer,
  ensureGiftTrajectoryOverlay,
  ensureGiftFlyOverlay,
  isMapMobileCoolMode,
  createGiftFlyIconEl,
  positionGiftFlyIcon,
  positionGiftFlyIconOnPath,
  removeGiftFlyIcon,
  giftFlyIconScreenPos,
  createGiftTrajectoryPath,
  updateGiftSvgPathReveal,
  applyGiftTrajectoryPathD,
  refreshGiftTrajectoryPaths,
  fadeOutGiftSvgPath,
  donateItemValueScore,
  sfxForDonateItem,
  spawnMapAmbientGiftFx,
  royalRankMedal,
  donateVisualScale,
  donateFlyVisualScale,
  donateFlyIconSize,
  donateFlyZIndex,
  canAffordDonateItem,
  formatDonateCostLabel,
  spinDegToRad,
  spinSliceAngles,
  spinPolar,
  spinSegmentUnit,
  formatSpinSegAmount,
  spinSliceIcon,
  spinSlicePath,
  spinDividerPath,
  spinLabelTransform,
  getDailyCardRewardDisplay,
  getDailySpinDayKey,
  getSpinCostForNext,
  playerSpendStorageKey,
  dailySpinStorageKey,
  isLocalNetworkHttpOrigin,
  normalizeMapThemeId,
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeJsonParse,
  readStoredMapTheme,
  persistMapTheme,
  nextMapTheme,
  mapThemeTileUrl,
  applyMapThemeClass,
  createMapThemeTileLayer,
  clearLocalPlayerEconomyData,
  loadPlayerSpend,
  recordPlayerSpend,
  loadDailySpinState,
  saveDailySpinState,
  totalSpendGoldEq,
  spinRewardGoldEq,
  canWinSpinReward,
  weightedPickSegment,
  pickSpinReward,
  donateOverlayDurationMs,
  buildDonateFlyHtml,
  buildLiquidSplatHtml,
  buildMapEffectOverlayHtml,
  mapOverlaySig,
  outgoingFriendStorageKey,
  loadOutgoingFriendUidsLocal,
  saveOutgoingFriendUidsLocal,
  playerBoxTheme,
  buildMapChestBadgeHtml,
  mapFootRingKey,
  buildMapFootRingHtml,
  formatLastSeenKu,
  extendMapMarkerClickBlock,
  isMapMarkerClickBlocked,
  bindInstantTap,
  runInstantMapTargetAction,
  isOptimisticDmId,
  mergeDmThreadMessages,
  bumpDmThreadPreview,
  notifSenderLabel,
  notifFriendRequestCopy,
  notifMessageCopy,
  notifDiamondGiftCopy,
  notifMapItemGiftCopy,
  enrichInboxNotificationCopy,
  escapeAttr,
  escapeHtml,
  isMapChatEliteHunter,
  mapChatBubbleSig,
  buildMapChatBubbleHtml,
  formatPlayTime,
  formatDurationKu,
  avatarForGender,
  resolveLeaderboardHeadAvatar,
  getDropRarityTier,
  CitadelCosmeticWearThumb,
  catalogForCitadelTab,
  calcDistance,
  formatPlaneCityArrivalMessage,
  MapFabIcon,
  hashUidStable,
  destinationPoint,
  initialBearingRad,
  computeAvatarDisplayPositions,
  getAudioCtx,
  playSfxTone,
  playClaimSfx,
  playEquipSfx,
  playGunShotSfx,
  playReloadSfx,
  playHackTickSfx,
  formatHackClock,
  SettingRow,
  HAIR_STYLE_LABELS_KU,
  INVENTORY_CAPACITY,
  PLAYER_MARKER_ICON_SIZE,
  PLAYER_MARKER_ICON_ANCHOR,
  MAP_MARKER_CLICK_GUARD_MS,
  MAP_TOUCH_DRAG_THRESHOLD_PX,
  MAP_AVATAR_FOCUS_SCALE,
  PLAYER_SHEET_ANIM_MS,
  IOS_SHEET_EASE,
  NPC_MARKER_THROTTLE_MS,
  MAP_LOOP_MIN_GAP_DESKTOP_MS,
  MAP_LOOP_MIN_GAP_MOBILE_FX_MS,
  MAP_LOOP_MIN_GAP_MOBILE_IDLE_MS,

  SPIN_WHEEL_SEGMENTS,
  SPIN_SLICE_DEG,
  SPIN_WHEEL_SVG_R,
  SPIN_WHEEL_SVG_CX,
  SPIN_WHEEL_SVG_CY,
  SPIN_WHEEL_HUB_R,
  SPIN_WHEEL_LABEL_R,
  SPIN_GOLD_STROKE,
  SPIN_ANIM_MS,
  SPIN_PAID_BASE_DIAMOND,
  SPIN_PRICE_SCALE,
  SPIN_RESULT_Z,
  ECONOMY_ZERO_RESET_FLAG,
  FACTORY_RESET_FLAG,
  MAP_THEME_STORAGE_KEY,
  DEFAULT_MAP_THEME,
  DEFAULT_MAP_CENTER,
  MAP_THEME_ORDER,
  MAP_THEME_LABELS,
  MAP_TILE_LIGHT,
  MAP_TILE_DARK,
  MAP_TILE_SATELLITE,
  MAP_TILE_STANDARD,
  HEAD_EXPLOSION_DONATE_ITEMS,
  IOS_SPRING_EASE,
  MAP_CHAT_ELITE_RANK_MIN,
  DROP_MARKER_Z_OFFSET,
  REWARD_TOAST_MS,
  DM_EMOJI_LIST,
  LOCATION_SYNC_MS,
  SCHEDULE_CHECK_MS,
  FALLBACK_PROFILE,
  erbilChests,
  DROP_RARITY_TIERS,
  WEAPON_SHOP_ITEMS,
  ACTIVE_SHOP_ITEMS,
  RADAR_SHOP_ITEMS,
  PROTECTION_SHOP_ITEMS,
  GEAR_SHOP_ITEMS,
  COSMETIC_SHOP_ITEMS,
  COSMETIC_GRID_COLS,
  COSMETIC_GRID_ROWS,
  COSMETIC_PAGE_SIZE,
  blackMarketItems,
  CITY_AIRSPACE_RADIUS_M,
  CITY_AIRSPACES,
  NEARBY_MAX_M,
  AVATAR_MIN_SEP_M,
  EARTH_RADIUS_M,
  Sheet,
  NearbyPlayerRow,
  type AppCrashBoundaryProps,
  type AppCrashBoundaryState,
  type GiftFxLayer,
  type SpinRewardKind,
  type SpinWheelSegment,
  type PlayerSpendTotals,
  type MapThemeId,
  type MapAvatarOverlay,
  type MapFootRingKey,
  type ActiveMapChatBubble,
  type GameAlertTone,
  type GameAlertState,
  type CityAirspace,
  type MapFabIconName,
  type NearbyPlayerRowProps,
  type SelectedOnlinePlayer,
  type DonateFxEntry,
  type MapGestureState,
  type ShopCatalogItem,
} from './appHelpers'

import {

  getOrCreateUser,

  getUserPublicProfile,

  getDefaultProfile,

  syncUserBalances,

  syncUserWalletAndInventory,

  syncUserProfile,

  changeUsernameOnce,

  changeEmailOnce,

  changePhoneOnce,

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

  runGlobalGameplayResetIfNeeded,

  factoryResetAllCharacters,

  DAILY_BONUS_REWARDS,

  DAILY_BONUS_TOTAL_DAYS,

  getSpinWindowState,

  recordDailySpin,

  syncReadNotificationIds,

  parseEpochMs,

  syncUserSettings,
  loadUserSettingsLocal,
  saveUserSettingsLocal,

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

  takePendingRegisteredProfile,

  peekPendingRegisteredProfile,

  isIdentityIncomplete,

  waitForRegisteredIdentity,

  repairUserIdentity,

  isRegistrationInflight,

  applyLockedIdentity,

  getLockedIdentity,

  peekRegistrationIntent,

  bindRegistrationIdentityToUid,

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
  STEAL_SHIELD_MS,

  FIGHT_SMOKE_MS,

  type UserProfile,

  type Gender,

  type InventoryItem,

  type Currency,

  type BlockedUser,

  type FriendEntry,

  type GiftLogEntry,

  type IncomingFriendRequest,

  type DmThreadSummary,

  type DmMessage,

  type FoundPlayer,

  type IncomingHeistSummary,

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
  NPC_FIRESTORE_SYNC_MS,
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
  applyNpcGiftTransfer,
  nextNpcChatDelayMs,
  tickNpcStatsGrowth,
  tickNpcDailySystems,
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

  PADSHA_HUNTER_LEVEL,

  hunterLevelInfo,

  hunterRankForLevel,

  hunterRankIndex,

  parseDropsOpenedByType,

  computeHunterLevel,

  resolveHunterLevel,

  ensureDropsForMinLevel,

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

  nearestFlightCity,

  ensureHomeCityKey,

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
  runLeaderboardFactoryResetIfNeeded,
  recordNpcGiftScore,
  upsertNpcLeaderboardPresence,
  type LeaderboardEntry,
  type RoyalLeaderboardEntry,
  type RoyalLeaderboardTab,
} from './services/leaderboardService'

import {
  playSoundEffect,
  configureSfx,
  configureSfxCategory,
  startSpinWheelTicks,
  stopSpinWheelTicks,
  stopBackgroundMusic,
  configureMusic,
  type SoundEffectType,
} from './sfx'

import { realtimeSync } from './realtimeSync'

import { auth, signOutUser, onAuthReady } from './firebase'

import { deleteOwnAccount, mapFirebaseAuthError, changeAccountPassword, changeAuthEmail, clearAuthSessionHints } from './services/authService'

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
import { formatUsd, preloadCurrencyPackImages, GOLD_PACK_6_ICON, GEM_PACK_6_ICON } from './currencyStore'

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

  getKurdistanSeasonInfo,

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

  type VipPassesState,

  type PassKind,

  type PassAlert,

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

import AppView from './AppView'
import { compressImageToMaxBytes, prepareDmVideoFile } from './dmMedia'

export default function App() {

  const mapRef          = useRef<L.Map | null>(null)

  const baseTileLayerRef = useRef<L.TileLayer | null>(null)

  const userMarkerRef   = useRef<L.Marker | null>(null)

  const userLatRef      = useRef(36.1911)

  const userLngRef      = useRef(44.0091)

  const activeDropsRef  = useRef<Map<string, { marker: L.Marker; data: Airdrop }>>(new Map())

  const airdropsDataRef = useRef<Map<string, Airdrop>>(new Map())

  const airdropTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  const airdropFallTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const mapPlayersTickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const planeNodesRef   = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null)

  const planeMarkerRef  = useRef<L.Marker | null>(null)

  const planeGenesisRef = useRef<number | null>(null)

  const planeRafIdRef   = useRef<number | null>(null)

  const followPlaneRef  = useRef(false)

  const planeCamThrottleRef = useRef(0)
  const planeDrawThrottleRef = useRef(0)

  const planeCityCheckAtRef = useRef(0)

  const planeCityAnnouncedRef = useRef<{ cycleIndex: number; keys: Set<string> }>({
    cycleIndex: -1,
    keys: new Set(),
  })

  const planeCityToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const announcePlaneCityArrivalRef = useRef<(city: CityAirspace) => void>(() => {})

  const clickResetRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playerSheetCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const closePlayerSheetRef = useRef<(opts?: { animated?: boolean }) => void>(() => {})

  /** داخستنی هەموو بۆکسەکان — تەنها یەک لە یەک کاتدا دەمێنێتەوە (keep) */
  type OverlayKeep = 'spin' | 'mapChat' | 'player' | 'dropdown' | 'levelRules' | 'arDrop' | null
  const dismissAllOverlaysRef = useRef<(keep?: OverlayKeep) => void>(() => {})

  const triggerFlareRef = useRef<() => void>(undefined)

  const radarHoldRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const otherPlayerMarkersRef = useRef<Map<string, L.Marker>>(new Map())

  /** ٢٠ کارەکتەری چالاک لە هەولێر — تەنها لە syncNpcMarkersToMap بە viewport cull */
  const npcLiveRef = useRef<LiveNpcState[]>(createInitialNpcStates(NPC_COUNT))
  const syncNpcMarkersRef = useRef<((opts?: { rebuildIcons?: boolean }) => void) | null>(null)
  const spawnDonateFxRef = useRef<((event: MapDonationEvent, itemId: DonateItemId) => void) | null>(null)
  const showOtherPlayersRef = useRef(true)
  const overlayBatchRef = useRef<BatchedMapOverlayUpdate[]>([])
  const applyAvatarDonateOverlayRef = useRef<(targetUid: string, itemId: DonateItemId, emoji: string, eventKey?: string) => void>(() => {})

  const otherPlayerTruePosRef = useRef<Map<string, { lat: number; lng: number }>>(new Map())

  /** Last known true GPS for motion detection (walk vs idle). */

  const otherPlayerMotionRef = useRef<Map<string, { lat: number; lng: number; moving: boolean; movedAt: number }>>(new Map())

  const otherPlayerIconSigRef = useRef<Map<string, string>>(new Map())

  const selfMovingRef = useRef(false)

  const selfMovedAtRef = useRef(0)

  const selfIconSigRef = useRef('')

  const mapZoomRef = useRef(14)

  const mapGestureRef = useRef<MapGestureState>({
    pinching: false,
    dragging: false,
    zooming: false,
    blockedUntil: 0,
    userMapGesture: false,
    singleTouchActive: false,
    singleTouchMoved: false,
    singleTouchStartX: 0,
    singleTouchStartY: 0,
  })

  /** Plain FeatureGroup — clustering off so taps are never swallowed by cluster icons */

  const playerMarkersGroupRef = useRef<L.FeatureGroup | null>(null)

  const fireTrailLayersRef = useRef<Array<L.CircleMarker | L.Marker>>([])

  const lastFireTrailAtRef = useRef(0)

  const onlinePlayersRef = useRef<Map<string, PlayerLocation>>(new Map())

  const layoutAvatarsRafRef = useRef<number | null>(null)
  const layoutAvatarsLastRunRef = useRef(0)
  const layoutAvatarsThrottleTimerRef = useRef<number | null>(null)
  const pageVisibleRef = useRef(
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  )

  const blockedUidsRef = useRef<Set<string>>(new Set())

  const lastLocationSyncRef = useRef(0)

  const geoWatchIdRef = useRef<number | null>(null)

  const userProfileRef = useRef<UserProfile | null>(FALLBACK_PROFILE)

  const walletRef = useRef({ diamond: WELCOME_BONUS_DIAMOND, gold: WELCOME_BONUS_GOLD, isPremium: false })

  const soundEnabledRef = useRef(true)

  const followMeRef = useRef(false)

  const showMyAvatarOnMapRef = useRef(true)

  const sessionStartRef = useRef(Date.now())

  const settingsHydratedRef = useRef(false)
  const profileHydratedRef = useRef(false)

  const distanceAccumRef = useRef(0)

  const radarAlertedIdsRef = useRef<Set<string>>(new Set())

  const avatarInputRef = useRef<HTMLInputElement>(null)

  const dmImageInputRef = useRef<HTMLInputElement>(null)

  const dmMediaRecorderRef = useRef<MediaRecorder | null>(null)

  const dmAudioChunksRef = useRef<Blob[]>([])

  const dmVoiceAnalyserRef = useRef<AnalyserNode | null>(null)

  const dmVoiceAudioCtxRef = useRef<AudioContext | null>(null)

  const dmVoiceRafRef = useRef<number | null>(null)

  const dmVoiceLocalUrlsRef = useRef<Set<string>>(new Set())
  const dmVoiceDiscardRef = useRef(false)
  const dmVoiceStreamRef = useRef<MediaStream | null>(null)
  const dmVoiceMaxTimerRef = useRef<number | null>(null)
  const dmVoiceTickRef = useRef<number | null>(null)
  const dmVoiceStartXYRef = useRef<{ x: number; y: number } | null>(null)
  const dmVoicePointerIdRef = useRef<number | null>(null)
  const dmVoiceLockedRef = useRef(false)
  const dmVoiceRecordingRef = useRef(false)
  const dmVoicePendingActionRef = useRef<'none' | 'send' | 'discard'>('none')

  const dmChatScrollRef = useRef<HTMLDivElement>(null)

  const dmChatEndRef = useRef<HTMLDivElement>(null)

  const headerRef = useRef<HTMLDivElement>(null)
  const [headerEl, setHeaderEl] = useState<HTMLDivElement | null>(null)
  const setHeaderNode = useCallback((el: HTMLDivElement | null) => {
    headerRef.current = el
    setHeaderEl(el)
  }, [])

  const [rightIconsTop, setRightIconsTop] = useState(198)

  const boughtItemsRef = useRef<InventoryItem[]>([])

  const dropTypeCooldownsRef = useRef<Record<string, number>>({})

  const [wallet,         setWallet]         = useState({ diamond: WELCOME_BONUS_DIAMOND, gold: WELCOME_BONUS_GOLD, isPremium: false })

  const [userProfile,    setUserProfile]    = useState<UserProfile | null>(FALLBACK_PROFILE)

  const [authUserId,     setAuthUserId]     = useState<string | null>(null)

  const [authLoading,    setAuthLoading]    = useState(true)

  const [mapReady,       setMapReady]       = useState(false)

  const userIdRef         = useRef<string | null>(null)

  const [activeSheet,    setActiveSheet]    = useState<string | null>(null)

  const [activeBalance,  setActiveBalance]  = useState<string | null>(null)

  const [radarColor,     setRadarColor]     = useState('rgba(0,240,255,0.4)')

  const [clickCount,     setClickCount]     = useState(0)

  const [chestDist,      setChestDist]      = useState('-- مەتر')

  const [selectedPlayer, setSelectedPlayer] = useState<SelectedOnlinePlayer | null>(null)

  const selectedPlayerUidRef = useRef<string | null>(null)

  const [avatarStudioDraft, setAvatarStudioDraft] = useState<Avatar3DCustomization>({ ...DEFAULT_AVATAR_3D })

  const [avatarStudioCam, setAvatarStudioCam] = useState<Avatar3DViewMode>('full')

  const [avatarStudioSaving, setAvatarStudioSaving] = useState(false)

  const [showAvatarStudio, setShowAvatarStudio] = useState(false)

  const [selectedChest,  setSelectedChest]  = useState(erbilChests[0])

  const [selectedAirdropId, setSelectedAirdropId] = useState<string | null>(null)

  const [selectedAirdropReward, setSelectedAirdropReward] = useState<{ gold: number; diamond: number; itemNames: string[] } | null>(null)

  /** کارگە نیشتمانی — پانێڵی Collect */
  const [selectedFactoryId, setSelectedFactoryId] = useState<string | null>(null)
  const [factoryProgress, setFactoryProgress] = useState<FactoryProgressState>(() => emptyFactoryProgress())
  const [factoryStock, setFactoryStock] = useState<SharedFactoryStock | null>(null)
  const [factoryCollectBusy, setFactoryCollectBusy] = useState(false)
  const [factoryTickMs, setFactoryTickMs] = useState(() => Date.now())
  const factoryMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const openFactoryRef = useRef<(factoryId: string) => void>(() => {})

  /** سێشنی کامێرای AR بۆ کردنەوەی درۆپ لە مەودای ≤٥٠م */
  const [arDropSession, setArDropSession] = useState<{
    airdropId: string
    distM: number
    chest: typeof erbilChests[number]
  } | null>(null)
  const [arDropClaiming, setArDropClaiming] = useState(false)
  const [arDropBurst, setArDropBurst] = useState(false)
  const arDropClaimingRef = useRef(false)

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  const [royalLbTab, setRoyalLbTab] = useState<RoyalLeaderboardTab>('wealth')

  const [lbWealth, setLbWealth] = useState<RoyalLeaderboardEntry[]>([])

  const [lbLevel, setLbLevel] = useState<RoyalLeaderboardEntry[]>([])

  const [lbGifters, setLbGifters] = useState<RoyalLeaderboardEntry[]>([])

  const [boughtItems,    setBoughtItems]    = useState<InventoryItem[]>([])

  const [shopGender, setShopGender] = useState<ShopGender>('male')

  const [citadelTab, setCitadelTab] = useState<CitadelShopTab>('weapons')

  const [cosmeticPage, setCosmeticPage] = useState(0)

  const [seasonPass, setSeasonPass] = useState<SeasonPassState>(() => emptySeasonPassState())

  const [vipPasses, setVipPasses] = useState<VipPassesState>(() => emptyVipPassesState())

  const [passView, setPassView] = useState<'picker' | PassKind>('picker')

  const [socialLinkInput, setSocialLinkInput] = useState('')

  const [gameAlert, setGameAlert] = useState<GameAlertState | null>(null)
  const [gamePromptValue, setGamePromptValue] = useState('')
  const gamePromptValueRef = useRef('')

  const [showLevelRulesModal, setShowLevelRulesModal] = useState(false)

  const [playerSheetAnimIn, setPlayerSheetAnimIn] = useState(false)

  const [donatePickerUid, setDonatePickerUid] = useState<string | null>(null)
  const [donatePickerClosing, setDonatePickerClosing] = useState(false)
  const donatePickerCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [vipSpectacle, setVipSpectacle] = useState<{
    eventKey: string
    itemId: DonateItemId
    emoji: string
    label: string
    scale: number
    untilMs: number
    fromName?: string
    toName?: string
  } | null>(null)

  const playerPanelRef = useRef<HTMLDivElement>(null)

  const playerPanelDragRef = useRef<{ startY: number }>({ startY: 0 })

  const donateFxRef = useRef<DonateFxEntry[]>([])

  type PendingDonateArrivalReward = {
    gold: number
    diamond: number
    itemLabel: string
    emoji: string
    fromName: string
    fromUid: string
  }
  /** eventId → recipient reward applied when SVG gift lands on target */
  const pendingDonateArrivalRef = useRef<Map<string, PendingDonateArrivalReward>>(new Map())
  const settleDonateArrivalRef = useRef<(eventId: string) => void>(() => {})

  /** uid → untilMs — گەورەکردنی کارەکتەری بەخشیار (VIP gift) ١٠چ */
  const vipSenderBoostUntilRef = useRef<Map<string, number>>(new Map())
  const reapplyVipSenderBoostVisualsRef = useRef<() => void>(() => {})

  const mapAvatarOverlaysRef = useRef<Map<string, MapAvatarOverlay>>(new Map())

  const mapChatBubblesRef = useRef<Map<string, ActiveMapChatBubble>>(new Map())

  const revealedMapChatIdsRef = useRef<Set<string>>(new Set())

  const [mapChatDraft, setMapChatDraft] = useState('')

  const [mapChatSending, setMapChatSending] = useState(false)

  const [mapChatShowEmoji, setMapChatShowEmoji] = useState(false)

  const [showMapChatModal, setShowMapChatModal] = useState(false)

  const [mapChatSheetIn, setMapChatSheetIn] = useState(false)

  const [mapChatSheetClosing, setMapChatSheetClosing] = useState(false)

  const mapChatCloseTimerRef = useRef<number | null>(null)
  const [mapChatKbInset, setMapChatKbInset] = useState(0)

  /** لیستی چاتی گشتی — نامە + ناو + ئاڤاتار (وەک پرۆفایل) */
  type MapChatFeedItem = {
    id: string
    uid: string
    name: string
    text: string
    avatarUrl: string | null
    avatar3d: Avatar3DCustomization | null
    gender: Gender
    createdAtMs: number
    isSelf?: boolean
  }
  const [mapChatFeed, setMapChatFeed] = useState<MapChatFeedItem[]>([])
  const mapChatFeedIdsRef = useRef<Set<string>>(new Set())
  const mapChatFeedListRef = useRef<HTMLDivElement | null>(null)
  const mapChatFeedEndRef = useRef<HTMLDivElement | null>(null)

  const appendMapChatFeed = useCallback((item: MapChatFeedItem) => {
    if (!item.id || mapChatFeedIdsRef.current.has(item.id)) return
    mapChatFeedIdsRef.current.add(item.id)
    setMapChatFeed((prev) => {
      const next = [...prev, item]
      if (next.length > GLOBAL_CHAT_FEED_MAX) {
        const trimmed = next.slice(-GLOBAL_CHAT_FEED_MAX)
        mapChatFeedIdsRef.current = new Set(trimmed.map((m) => m.id))
        return trimmed
      }
      return next
    })
  }, [])

  const processedDonationIdsRef = useRef<Set<string>>(new Set())

  const playerSheetTapLockRef = useRef(false)

  const mapMarkerTapLockRef = useRef(false)

  const mapSheetDismissLockRef = useRef(0)

  const [mapDonationNotifs, setMapDonationNotifs] = useState<Array<{

    id: string

    fromUid: string

    fromName: string

    itemLabel: string

    emoji: string

    atMs: number

  }>>([])

  const [outgoingFriendUids, setOutgoingFriendUids] = useState<string[]>([])

  const [passNowMs, setPassNowMs] = useState(() => Date.now())

  const seasonPassRef = useRef<SeasonPassState>(emptySeasonPassState())

  const vipPassesRef = useRef<VipPassesState>(emptyVipPassesState())

  const [activityArchive, setActivityArchive] = useState<ActivityEntry[]>([])

  const loginLoggedRef = useRef(false)

  const logActivity = useCallback((kind: ActivityKind, text: string, icon: string) => {

    const uid = userIdRef.current

    if (!uid) return

    setActivityArchive(appendActivity(uid, kind, text, icon))

  }, [])

  const [hasViewedInv,   setHasViewedInv]   = useState(false)

  /** Header avatar level-up FX — no modal popup */
  const [levelUpBurst, setLevelUpBurst] = useState(false)
  const [xpRingFillBoost, setXpRingFillBoost] = useState(false)
  const [levelBadgeAnim, setLevelBadgeAnim] = useState<{ from: number; to: number } | null>(null)
  const levelUpTimersRef = useRef<number[]>([])

  const [dropLandToast, setDropLandToast] = useState<{ id: string; message: string; accent: string } | null>(null)

  const [planeCityToast, setPlaneCityToast] = useState<{ id: string; cityKey: string; message: string } | null>(null)

  const announcedDropLandIdsRef = useRef<Set<string>>(new Set())

  const dropLandToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const rewardToastTimerRef = useRef<number | null>(null)

  const notificationsEnabledRef = useRef(true)

  const clearLevelUpTimers = useCallback(() => {
    for (const t of levelUpTimersRef.current) window.clearTimeout(t)
    levelUpTimersRef.current = []
  }, [])

  const triggerHeaderLevelUp = useCallback((fromLevel: number, toLevel: number) => {
    clearLevelUpTimers()
    playSoundEffect('levelUp')
    setXpRingFillBoost(true)
    setLevelUpBurst(true)
    setLevelBadgeAnim({ from: fromLevel, to: fromLevel })
    // ١) بازنەی XP تا ١٠٠٪ پڕ دەبێتەوە
    levelUpTimersRef.current.push(window.setTimeout(() => {
      setLevelBadgeAnim({ from: fromLevel, to: toLevel })
      setXpRingFillBoost(false)
    }, 720))
    // ٢) دوای ئەنیمەیشن پاکدەبێتەوە
    levelUpTimersRef.current.push(window.setTimeout(() => {
      setLevelUpBurst(false)
      setLevelBadgeAnim(null)
    }, 2800))
  }, [clearLevelUpTimers])

  const addXP = useCallback((amount: number) => {
    const gain = Math.max(0, Math.floor(amount))
    if (gain <= 0) return
    const uid = userIdRef.current
    setUserProfile(prev => {
      const base = prev ?? FALLBACK_PROFILE
      const result = applyXpGain(base.playerLevel ?? 1, base.playerXp ?? 0, gain)
      const next = { ...base, playerLevel: result.playerLevel, playerXp: result.playerXp }
      if (uid) {
        syncUserProfile(uid, { playerLevel: result.playerLevel, playerXp: result.playerXp }).catch(() => {})
        saveUserDataLocal(uid, {
          playerId: next.playerId,
          gold: next.gold,
          diamond: next.diamond,
          isPremium: next.isPremium,
          playerLevel: result.playerLevel,
          playerXp: result.playerXp,
          hunterLevel: next.hunterLevel,
          inventory: boughtItemsRef.current,
        })
        realtimeSync.emitXp({
          playerLevel: result.playerLevel,
          playerXp: result.playerXp,
          leveledUp: result.leveledUp,
          previousLevel: result.previousLevel,
          name: next.name,
        })
      }
      if (result.leveledUp) {
        queueMicrotask(() => {
          triggerHeaderLevelUp(result.previousLevel, result.playerLevel)
        })
      }
      return next
    })
  }, [triggerHeaderLevelUp])

  const showGameAlert = useCallback((opts: {

    title?: string

    message: string

    icon?: string

    tone?: GameAlertTone

  }) => {

    const msg = opts.message

    let tone: GameAlertTone = opts.tone ?? 'info'

    let icon = opts.icon

    if (!icon) {

      if (/❌|🚫|⚠️|نەتوان|بەش ناکات|هەڵە/.test(msg)) { icon = '⚠️'; tone = opts.tone ?? 'error' }

      else if (/✅|🎉|پیرۆز|سەرکەوت|کڕدرا/.test(msg)) { icon = '✅'; tone = opts.tone ?? 'success' }

      else if (/💎|🪙|💰|ئەڵماس|زێڕ|د\.ع/.test(msg)) { icon = '💎'; tone = opts.tone ?? 'warn' }

      else icon = '💬'

    }

    if (rewardToastTimerRef.current) {
      window.clearTimeout(rewardToastTimerRef.current)
      rewardToastTimerRef.current = null
    }

    // Non-blocking floating toast — بێ backdrop / بێ دوگمەی «باشە»
    setGameAlert({
      title: opts.title,
      message: msg,
      icon,
      tone,
      mode: 'toast',
    })

    rewardToastTimerRef.current = window.setTimeout(() => {
      setGameAlert(null)
      rewardToastTimerRef.current = null
    }, REWARD_TOAST_MS)

  }, [])

  /** Reward toast + save to notification inbox history */
  const showRewardToast = useCallback((opts: {
    title?: string
    message: string
    icon?: string
    inboxKind?: InboxNotification['kind']
  }) => {
    showGameAlert({
      title: opts.title,
      message: opts.message,
      icon: opts.icon ?? '🎁',
      tone: 'success',
    })
    const uid = userIdRef.current
    if (!uid) return
    const entry: InboxNotification = {
      id: `reward_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      kind: opts.inboxKind ?? 'other',
      icon: opts.icon ?? '🎁',
      title: opts.title ?? 'خەڵات',
      body: opts.message.replace(/\n+/g, ' · ').trim(),
      atMs: Date.now(),
    }
    // Optimistic local + Firestore — subscribeToUser هەروەها نوێ دەکاتەوە
    pushLocalInboxRef.current(entry)
    pushInboxNotification(uid, entry).catch(() => {})
    // خەڵاتەکانی خۆت وەک «خوێندراو» دەستنیشان بکە — نەبێتە ئاگاداری نەکراوە
    setReadNotifIds(prev => {
      const next = markNotificationRead(uid, entry.id, prev)
      syncReadNotificationIds(uid, [...next]).catch(() => {})
      return next
    })
  }, [showGameAlert])

  const showGameConfirm = useCallback((opts: {

    title?: string

    message: string

    icon?: string

    confirmLabel?: string

    cancelLabel?: string

  }) => new Promise<boolean>(resolve => {

    if (rewardToastTimerRef.current) {
      window.clearTimeout(rewardToastTimerRef.current)
      rewardToastTimerRef.current = null
    }

    setGameAlert({

      title: opts.title,

      message: opts.message,

      icon: opts.icon ?? '❓',

      tone: 'warn',

      mode: 'modal',

      confirmLabel: opts.confirmLabel ?? 'بەڵێ',

      cancelLabel: opts.cancelLabel ?? 'نەخێر',

      onConfirm: () => { setGameAlert(null); resolve(true) },

      onCancel: () => { setGameAlert(null); resolve(false) },

    })

  }), [])

  /** بۆکسی داخڵکردنی تایبەت بە یاری — لەجیاتی window.prompt */
  const showGamePrompt = useCallback((opts: {
    title?: string
    message: string
    icon?: string
    label?: string
    placeholder?: string
    defaultValue?: string
    inputType?: 'text' | 'password' | 'email' | 'tel'
    confirmLabel?: string
    cancelLabel?: string
  }) => new Promise<string | null>(resolve => {
    if (rewardToastTimerRef.current) {
      window.clearTimeout(rewardToastTimerRef.current)
      rewardToastTimerRef.current = null
    }
    const initial = opts.defaultValue ?? ''
    gamePromptValueRef.current = initial
    setGamePromptValue(initial)
    setGameAlert({
      title: opts.title,
      message: opts.message,
      icon: opts.icon ?? '✏️',
      tone: 'info',
      mode: 'modal',
      hasInput: true,
      inputLabel: opts.label,
      inputPlaceholder: opts.placeholder,
      inputType: opts.inputType ?? 'text',
      confirmLabel: opts.confirmLabel ?? 'پاشەکەوتکردن',
      cancelLabel: opts.cancelLabel ?? 'پاشگەزبوونەوە',
      onConfirm: () => {
        const v = gamePromptValueRef.current
        setGameAlert(null)
        resolve(v)
      },
      onCancel: () => {
        setGameAlert(null)
        resolve(null)
      },
    })
  }), [])

  const showPassAlert = useCallback((alert: PassAlert) => {

    showGameAlert({

      title: alert.tone === 'error' ? 'ئاگاداری' : 'تێبینی',

      message: alert.message,

      icon: alert.tone === 'error' ? '💎' : '⚠️',

      tone: alert.tone === 'error' ? 'error' : 'warn',

    })

  }, [showGameAlert])

  useEffect(() => {

    if (!selectedPlayer || activeSheet !== 'playerInfo') {

      if (!selectedPlayer) {

        setPlayerSheetAnimIn(false)

      }

      return

    }

    if (playerSheetCloseTimerRef.current) {

      clearTimeout(playerSheetCloseTimerRef.current)

      playerSheetCloseTimerRef.current = null

    }

    setPlayerSheetAnimIn(false)

    let openRaf2 = 0

    const openRaf1 = requestAnimationFrame(() => {

      openRaf2 = requestAnimationFrame(() => setPlayerSheetAnimIn(true))

    })

    return () => {

      cancelAnimationFrame(openRaf1)

      if (openRaf2) cancelAnimationFrame(openRaf2)

    }

  }, [selectedPlayer?.uid, activeSheet])

  const [soundEnabled,   setSoundEnabled]   = useState(true)

  const [sfxVolume, setSfxVolume] = useState(1)

  const [planeSoundEnabled, setPlaneSoundEnabled] = useState(true)
  const [planeVolume, setPlaneVolume] = useState(1)
  const planeSoundEnabledRef = useRef(true)
  const planeVolumeRef = useRef(1)

  const [giftSoundEnabled, setGiftSoundEnabled] = useState(true)
  const [giftVolume, setGiftVolume] = useState(1)
  const giftSoundEnabledRef = useRef(true)
  const giftVolumeRef = useRef(1)

  const [chestSoundEnabled, setChestSoundEnabled] = useState(true)
  const [chestVolume, setChestVolume] = useState(1)
  const chestSoundEnabledRef = useRef(true)
  const chestVolumeRef = useRef(1)

  const [musicEnabled, setMusicEnabled] = useState(false)
  const [musicVolume, setMusicVolume] = useState(0.5)

  const [hideWhenOffline, setHideWhenOffline] = useState(false)
  const hideWhenOfflineRef = useRef(false)

  const [hideBlockedUsers, setHideBlockedUsers] = useState(false)
  const hideBlockedUsersRef = useRef(false)

  const [hideGlobalChat, setHideGlobalChat] = useState(false)
  const hideGlobalChatRef = useRef(false)

  const [allowDmWithoutFriendship, setAllowDmWithoutFriendship] = useState(true)

  const [showDeleteAccountPanel, setShowDeleteAccountPanel] = useState(false)
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('')
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null)

  const [showChangePasswordPanel, setShowChangePasswordPanel] = useState(false)
  const [changePwOld, setChangePwOld] = useState('')
  const [changePwNew, setChangePwNew] = useState('')
  const [changePwNew2, setChangePwNew2] = useState('')
  const [changePwBusy, setChangePwBusy] = useState(false)
  const [changePwError, setChangePwError] = useState('')
  const [changePwStep, setChangePwStep] = useState<'old' | 'new'>('old')
  const [profileFieldBusy, setProfileFieldBusy] = useState(false)

  const [highGraphics, setHighGraphics] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      return !window.matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)').matches
    } catch {
      return true
    }
  })

  const [showPlayerNames, setShowPlayerNames] = useState(true)

  const [blockIncomingGifts, setBlockIncomingGifts] = useState(false)

  const [ghostMode, setGhostMode] = useState(false)

  const showPlayerNamesRef = useRef(true)

  const blockIncomingGiftsRef = useRef(false)

  const ghostModeRef = useRef(false)

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [radarAlertsEnabled, setRadarAlertsEnabled] = useState(true)
  const [friendRequestNotifsEnabled, setFriendRequestNotifsEnabled] = useState(true)
  const radarAlertsEnabledRef = useRef(true)
  const friendRequestNotifsEnabledRef = useRef(true)

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled
  }, [notificationsEnabled])
  useEffect(() => {
    radarAlertsEnabledRef.current = radarAlertsEnabled
  }, [radarAlertsEnabled])
  useEffect(() => {
    friendRequestNotifsEnabledRef.current = friendRequestNotifsEnabled
  }, [friendRequestNotifsEnabled])

  const [showOtherPlayers, setShowOtherPlayers] = useState(true)
  showOtherPlayersRef.current = showOtherPlayers

  const [showMyAvatarOnMap, setShowMyAvatarOnMap] = useState(true)

  const [followMe,       setFollowMe]       = useState(false)

  const [followPlane,    setFollowPlane]    = useState(false)

  const [mapTheme, setMapTheme] = useState<MapThemeId>(() => readStoredMapTheme() || DEFAULT_MAP_THEME)
  const [mapThemeToast, setMapThemeToast] = useState<string | null>(null)
  const mapThemeToastTimerRef = useRef<number | null>(null)

  const [sessionMinutes, setSessionMinutes] = useState(0)

  const [dailyBonusDay,        setDailyBonusDay]        = useState(1)

  const [dailyBonusLastClaimMs, setDailyBonusLastClaimMs] = useState<number | null>(null)

  const [dailyBonusViewDay, setDailyBonusViewDay] = useState(1)

  const [showSpinWheel, setShowSpinWheel] = useState(false)

  const [spinSheetIn, setSpinSheetIn] = useState(false)

  const [spinSheetClosing, setSpinSheetClosing] = useState(false)

  const spinCloseTimerRef = useRef<number | null>(null)

  const [spinRotation, setSpinRotation] = useState(0)

  const [spinAnimating, setSpinAnimating] = useState(false)

  const [dailySpinSpinsToday, setDailySpinSpinsToday] = useState(0)

  const [spinResult, setSpinResult] = useState<SpinWheelSegment | null>(null)

  const spinRotationRef = useRef(0)

  const playerSpendRef = useRef<PlayerSpendTotals>({ gold: 0, diamond: 0 })

  const dailyTabStripRef = useRef<HTMLDivElement>(null)

  const [blockedUsersList, setBlockedUsersList] = useState<BlockedUser[]>([])

  const [friendsList,      setFriendsList]      = useState<FriendEntry[]>([])

  const [giftsLogList,     setGiftsLogList]     = useState<GiftLogEntry[]>([])

  const [inboxNotifications, setInboxNotifications] = useState<InboxNotification[]>([])
  const pushLocalInboxRef = useRef<(entry: InboxNotification) => void>(() => {})
  pushLocalInboxRef.current = (entry: InboxNotification) => {
    setInboxNotifications(prev => {
      if (prev.some(n => n.id === entry.id)) return prev
      return [entry, ...prev].slice(0, 80)
    })
  }

  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(() => new Set())

  const [incomingFriendRequests, setIncomingFriendRequests] = useState<IncomingFriendRequest[]>([])

  const [friendsTab, setFriendsTab] = useState<'friends' | 'requests' | 'find' | 'blocked'>('friends')

  const [privateTab, setPrivateTab] = useState<'friends' | 'messages' | 'gifts'>('messages')

  const [findIdInput,  setFindIdInput]  = useState('')

  const [findResult,   setFindResult]   = useState<FoundPlayer | null>(null)

  const [findLoading,  setFindLoading]  = useState(false)

  const [findError,    setFindError]    = useState('')

  const [dmThreads,        setDmThreads]        = useState<DmThreadSummary[]>([])

  const [activeDmPartner,  setActiveDmPartner]  = useState<{ uid: string; name: string } | null>(null)

  const [dmMessages,       setDmMessages]       = useState<DmMessage[]>([])

  const [dmInput,          setDmInput]          = useState('')

  const [dmShowEmoji,      setDmShowEmoji]      = useState(false)

  const [dmLightboxUrl,    setDmLightboxUrl]    = useState<string | null>(null)

  const [dmSelectedIds,    setDmSelectedIds]    = useState<string[]>([])

  const [dmDeleteConfirm,  setDmDeleteConfirm]  = useState(false)

  const [dmRecording,      setDmRecording]      = useState(false)
  const [dmVoiceLocked,    setDmVoiceLocked]    = useState(false)
  const [dmVoiceCancelArmed, setDmVoiceCancelArmed] = useState(false)
  const [dmVoiceSeconds,   setDmVoiceSeconds]   = useState(0)
  const [dmVoiceHint,      setDmVoiceHint]      = useState<'none' | 'cancel' | 'lock'>('none')

  const [dmVoiceLevels,    setDmVoiceLevels]    = useState<number[]>(() => Array.from({ length: 28 }, () => 0.12))

  const [dmSendingMedia,   setDmSendingMedia]   = useState(false)

  /** progressی ناردنی وێنە — key = messageId، value = ٠–١٠٠ */
  const [dmMediaProgress,  setDmMediaProgress]  = useState<Record<string, number>>({})

  const [dmThreadMenu,     setDmThreadMenu]     = useState<DmThreadSummary | null>(null)

  const [mutedChatUids,    setMutedChatUids]    = useState<string[]>([])

  const mutedChatUidsRef = useRef<Set<string>>(new Set())

  const [stealWarningTarget, setStealWarningTarget] = useState<{ uid: string; name: string; mode: 'online' | 'offline' } | null>(null)

  const [activeHack, setActiveHack] = useState<{

    victimUid: string

    victimName: string

    endsAtMs: number

    heistId: string

    mode: 'online' | 'offline'

  } | null>(null)

  const [hackSecondsLeft, setHackSecondsLeft] = useState(0)

  const [stealCooldownUntilMs, setStealCooldownUntilMs] = useState(0)

  const [incomingHeistAlert, setIncomingHeistAlert] = useState<{
    heistId: string
    thiefUid: string
    thiefName: string
    mode: 'online' | 'offline'
    expiresAtMs: number
  } | null>(null)

  const [arenaSession, setArenaSession] = useState<{

    duelId: string

    mode: 'fighter' | 'spectator'

  } | null>(null)

  const [outgoingChallenge, setOutgoingChallenge] = useState<{

    duelId: string

    name: string

    expiresAtMs: number

  } | null>(null)

  const [incomingChallenge, setIncomingChallenge] = useState<{

    duelId: string

    fromUid: string

    fromName: string

    expiresAtMs: number

  } | null>(null)

  const [challengeBusy, setChallengeBusy] = useState(false)

  const [fightChallengeLog, setFightChallengeLog] = useState<Record<string, { count: number; banUntilMs: number }>>({})

  const [blockReasonTarget, setBlockReasonTarget] = useState<{ uid: string; name: string; fromFriend?: boolean } | null>(null)

  const [blockReasonText, setBlockReasonText] = useState('')

  const [selfMapFx, setSelfMapFx] = useState<{ smokeUntilMs: number; duelFxUntilMs: number; activeDuelId: string | null }>({

    smokeUntilMs: 0, duelFxUntilMs: 0, activeDuelId: null,

  })

  const [fightBanUntilMs, setFightBanUntilMs] = useState(0)

  const [mapPlayersTick, setMapPlayersTick] = useState(0)

  const hackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const heistNotifSeenRef = useRef<Set<string>>(new Set())
  const liveIncomingHeistRef = useRef<IncomingHeistSummary | null>(null)
  const homeCityKeyRef = useRef('')
  const heistUnsubRef = useRef<(() => void) | null>(null)

  const activeHackRef = useRef<{
    victimUid: string
    victimName: string
    endsAtMs: number
    heistId: string
    mode: 'online' | 'offline'
  } | null>(null)

  const outgoingChallengeRef = useRef<string | null>(null)

  const selfMapFxRef = useRef(selfMapFx)

  const arenaSessionRef = useRef(arenaSession)

  selfMapFxRef.current = selfMapFx

  arenaSessionRef.current = arenaSession

  const dmLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dmLongPressFiredRef = useRef(false)

  const dmDeliveredMarkRef = useRef<Set<string>>(new Set())

  const dmTotalUnread = dmThreads.reduce((sum, t) => {

    if (mutedChatUids.includes(t.otherUid)) return sum

    return sum + (t.unreadCount || 0)

  }, 0)

  const privateBadgeCount = incomingFriendRequests.length + dmTotalUnread

  const showFriendsPanel = activeSheet === 'friends' || (activeSheet === 'private' && privateTab === 'friends')

  const showMessagesPanel = activeSheet === 'messages' || (activeSheet === 'private' && privateTab === 'messages')

  const showGiftsPanel = activeSheet === 'gifts' || (activeSheet === 'private' && privateTab === 'gifts')

  const viewingDmPartnerUid =
    showMessagesPanel && activeDmPartner?.uid ? activeDmPartner.uid : null

  /** unread بۆ بادج/ئاگاداری — چاتی کراوەتەوە حیساب ناکرێت */
  const dmUnreadVisible = dmThreads.reduce((sum, t) => {
    if (mutedChatUids.includes(t.otherUid)) return sum
    if (viewingDmPartnerUid && t.otherUid === viewingDmPartnerUid) return sum
    return sum + (t.unreadCount || 0)
  }, 0)

  const privateBadgeVisible = incomingFriendRequests.length + dmUnreadVisible

  const sheetOpenKeys = ['nearby', 'market', 'inventory', 'levels', 'leaderboard', 'profile', 'activityArchive', 'premium', 'notifications', 'friends', 'gifts', 'messages', 'private', 'airdropTypes']

  const isDropdownSheetOpen = Boolean(activeBalance || (activeSheet != null && sheetOpenKeys.includes(activeSheet)))

  const isAnyExclusiveBoxOpen = Boolean(
    isDropdownSheetOpen
    || activeSheet === 'dailyBonus'
    || showSpinWheel
    || showMapChatModal
    || showLevelRulesModal
    || Boolean(arDropSession)
    || (activeSheet === 'playerInfo' && selectedPlayer != null)
    || Boolean(selectedFactoryId),
  )

  /** لیستی یەکگرتووی ئاگادارییەکان — دزی/بلۆک لە Firestore + داواکاری/نامە/دیاری لە داتای زیندوو */

  const notificationsFeed = useMemo((): InboxNotification[] => {

    const myUid = authUserId ?? ''

    const items: InboxNotification[] = []

    for (const n of inboxNotifications) items.push(enrichInboxNotificationCopy(n))

    for (const req of incomingFriendRequests) {

      const copy = notifFriendRequestCopy(req.fromName)

      items.push({

        id: `friendreq_${req.id}`,

        kind: 'friend_request',

        icon: '👤',

        title: copy.title,

        body: copy.body,

        atMs: Number.MAX_SAFE_INTEGER - 1,

        fromUid: req.from,

        fromName: notifSenderLabel(req.fromName),

        friendRequestId: req.id,

      })

    }

    for (const t of dmThreads) {

      if ((t.unreadCount || 0) <= 0) continue

      if (mutedChatUids.includes(t.otherUid)) continue

      // لەناو هەمان گفتوگۆ — ئاگاداری «نامەت بۆ هاتووە» مەنێرە
      if (viewingDmPartnerUid && t.otherUid === viewingDmPartnerUid) continue

      const copy = notifMessageCopy(t.otherName, t.lastMessage || '', t.unreadCount || 0)

      items.push({

        id: `dm_${t.otherUid}`,

        kind: 'message',

        icon: '💬',

        title: copy.title,

        body: copy.body,

        atMs: t.updatedAtMs || Date.now(),

        fromUid: t.otherUid,

        fromName: notifSenderLabel(t.otherName),

        threadPartnerUid: t.otherUid,

      })

    }

    for (const g of giftsLogList.slice(0, 30)) {

      if (myUid && g.from === myUid) continue

      const copy = notifDiamondGiftCopy(g.fromName, g.amount)

      items.push({

        id: `gift_${g.from}_${g.atMs}`,

        kind: 'gift',

        icon: '🎁',

        title: copy.title,

        body: copy.body,

        atMs: g.atMs || 0,

        fromUid: g.from,

        fromName: notifSenderLabel(g.fromName),

        amount: g.amount,

        currency: 'diamond',

      })

    }

    for (const d of mapDonationNotifs) {

      const copy = notifMapItemGiftCopy(d.fromName, d.emoji, d.itemLabel)

      items.push({

        id: d.id,

        kind: 'gift',

        icon: d.emoji,

        title: copy.title,

        body: copy.body,

        atMs: d.atMs,

        fromUid: d.fromUid,

        fromName: notifSenderLabel(d.fromName),

      })

    }

    const seen = new Set<string>()

    const kindRank = (k: InboxNotification['kind']) =>

      k === 'friend_request' ? 3 : k === 'steal' ? 2 : k === 'message' ? 2 : 1

    return items

      .filter(n => {

        if (!n.id || seen.has(n.id)) return false

        seen.add(n.id)

        return true

      })

      .sort((a, b) => {

        const rd = kindRank(b.kind) - kindRank(a.kind)

        if (rd !== 0) return rd

        return b.atMs - a.atMs

      })

  }, [inboxNotifications, incomingFriendRequests, dmThreads, giftsLogList, mapDonationNotifs, mutedChatUids, authUserId, viewingDmPartnerUid])

  const unreadNotifCount = useMemo(

    () => notificationsFeed.reduce((n, item) => n + (readNotifIds.has(item.id) ? 0 : 1), 0),

    [notificationsFeed, readNotifIds],

  )

  /** Coalesce player-list React ticks — raw RT updates must not re-render App every GPS ping. */

  const bumpMapPlayersTick = useCallback(() => {

    if (mapPlayersTickTimerRef.current != null) return

    mapPlayersTickTimerRef.current = setTimeout(() => {

      mapPlayersTickTimerRef.current = null

      setMapPlayersTick(t => t + 1)

    }, 750)

  }, [])

  const nearbyPlayers = useMemo(() => {

    void mapPlayersTick

    const list: Array<{

      uid: string

      name: string

      distM: number

      isOnline: boolean

      lastSeenMs: number | null

      avatarUrl: string | null

      avatar3d: Avatar3DCustomization | null

      gender: Gender

      lat: number

      lng: number

      skinId: number | null

      borderId: number | null

    }> = []

    onlinePlayersRef.current.forEach(p => {

      if (hideBlockedUsersRef.current && blockedUidsRef.current.has(p.uid)) return

      const distM = calcDistance(userLatRef.current, userLngRef.current, p.lat, p.lng)

      if (distM > NEARBY_MAX_M) return

      list.push({

        uid: p.uid,

        name: p.name,

        distM,

        isOnline: p.isOnline,

        lastSeenMs: p.lastSeenMs ?? null,

        avatarUrl: p.avatarUrl,

        avatar3d: p.avatar3d ? normalizeAvatar3d(p.avatar3d) : null,

        gender: p.gender,

        lat: p.lat,

        lng: p.lng,

        skinId: p.skinId ?? null,

        borderId: p.borderId ?? null,

      })

    })

    list.sort((a, b) => a.distM - b.distM)

    return list

  }, [mapPlayersTick])

  const markNotifRead = useCallback((id: string) => {

    const uid = userIdRef.current

    setReadNotifIds(prev => {
      const next = markNotificationRead(uid, id, prev)
      if (uid) syncReadNotificationIds(uid, [...next]).catch(() => {})
      return next
    })

  }, [])

  const handleMarkAllNotifsRead = useCallback(() => {

    const uid = userIdRef.current

    setReadNotifIds(prev => {
      const next = markAllNotificationsRead(uid, notificationsFeed.map(n => n.id), prev)
      if (uid) syncReadNotificationIds(uid, [...next]).catch(() => {})
      return next
    })

  }, [notificationsFeed])

  soundEnabledRef.current = soundEnabled

  showPlayerNamesRef.current = showPlayerNames

  blockIncomingGiftsRef.current = blockIncomingGifts

  ghostModeRef.current = ghostMode

  planeSoundEnabledRef.current = planeSoundEnabled
  planeVolumeRef.current = planeVolume
  giftSoundEnabledRef.current = giftSoundEnabled
  giftVolumeRef.current = giftVolume
  chestSoundEnabledRef.current = chestSoundEnabled
  chestVolumeRef.current = chestVolume
  hideWhenOfflineRef.current = hideWhenOffline
  hideBlockedUsersRef.current = hideBlockedUsers
  hideGlobalChatRef.current = hideGlobalChat

  followMeRef.current = followMe

  followPlaneRef.current = followPlane

  showMyAvatarOnMapRef.current = showMyAvatarOnMap

  const inventoryCapacity = INVENTORY_CAPACITY

  const isDailyBonusOnCooldown = dailyBonusLastClaimMs !== null && passNowMs - dailyBonusLastClaimMs < DAILY_BONUS_MIN_GAP_MS

  const canClaimDailyBonus = !isDailyBonusOnCooldown

  const dailyBonusCooldownLeftMs = dailyBonusLastClaimMs != null

    ? Math.max(0, dailyBonusLastClaimMs + DAILY_BONUS_MIN_GAP_MS - passNowMs)

    : 0

  const playerFullName = userProfile?.name ?? 'یاریزان'
  const playerName = (userProfile?.username?.trim() || playerFullName)

  const playerIdDisplay = userProfile?.playerId ?? ''
  const [idCopiedFlash, setIdCopiedFlash] = useState(false)
  const idCopiedTimerRef = useRef<number | null>(null)

  // Rank name/icon from cached level; progress bar uses counts (self profile only — never on avatar click)

  const currentLevel = hunterDisplay(

    userProfile?.hunterLevel ?? 0,

    userProfile?.dropsOpenedByType,

  )

  const playerAvatar = userProfile?.avatarUrl || (userProfile?.gender === 'female' ? femaleAvatar : maleAvatar)

  const playerLevelNum = Math.max(1, Math.floor(userProfile?.playerLevel ?? 1))

  const playerXpNum = Math.max(0, Math.floor(userProfile?.playerXp ?? 0))

  const playerXpNeed = xpRequiredForLevel(playerLevelNum)

  const playerXpPct = xpProgressRatio(playerLevelNum, playerXpNum) * 100

  const playerStats = userProfile?.stats ?? DEFAULT_PLAYER_STATS

  const playerAvatar3d = normalizeAvatar3d(userProfile?.avatar3d ?? DEFAULT_AVATAR_3D)

  // مەسڕەوەی ناسنامەی تۆمارکراو — تەنها کاتێک state باشتر/تەواوتر بێت
  useEffect(() => {
    if (!userProfile) return
    const prev = userProfileRef.current
    if (
      prev
      && !isIdentityIncomplete(prev)
      && isIdentityIncomplete(userProfile)
      && (prev.playerId === userProfile.playerId || !userProfile.playerId)
    ) {
      const kept: UserProfile = {
        ...userProfile,
        name: prev.name,
        username: prev.username,
        email: prev.email,
        phone: prev.phone,
        gender: prev.gender,
        createdAtMs: userProfile.createdAtMs ?? prev.createdAtMs,
      }
      userProfileRef.current = kept
      // state ـیش بپارێزە — UI مەگەڕێتەوە بۆ «یاریزان»
      if (
        userProfile.username !== kept.username
        || userProfile.email !== kept.email
        || userProfile.phone !== kept.phone
        || userProfile.name !== kept.name
      ) {
        setUserProfile(kept)
      }
      return
    }
    userProfileRef.current = userProfile
  }, [userProfile])

  walletRef.current = wallet

  boughtItemsRef.current = boughtItems

  const activeCosmetics = getActiveCosmetics(boughtItems)

  const cosmeticTitle = activeCosmetics.title

  const cosmeticBorder = activeCosmetics.border

  const cosmeticSkin = activeCosmetics.avatar

  const cosmeticHeadwear = activeCosmetics.headwear

  const cosmeticAccessory = activeCosmetics.accessory

  useEffect(() => {

    if (activeSheet !== 'profile') {

      setShowAvatarStudio(false)

      return

    }

  }, [activeSheet])

  useEffect(() => {

    if (!showAvatarStudio) return

    setAvatarStudioDraft(normalizeAvatar3d(userProfile?.avatar3d ?? DEFAULT_AVATAR_3D))

    setAvatarStudioCam('full')

  }, [showAvatarStudio, userProfile?.avatar3d])

  const pushLocationToFirestore = useCallback((lat: number, lng: number, force = false) => {

    const uid = userIdRef.current

    const profile = userProfileRef.current ?? FALLBACK_PROFILE

    if (!uid) return

    const now = Date.now()

    const effectiveInterval = LOCATION_SYNC_MS

    if (!force && now - lastLocationSyncRef.current < effectiveInterval) return

    lastLocationSyncRef.current = now

    const cos = cosmeticsToPublic(boughtItemsRef.current)

    const protectedSelf = isProtectedAccount({
      uid,
      playerId: profile.playerId,
    })
    // هەژماری تایبەت هەمیشە لەسەر نەخشە دیارە لە لۆکەیشنی GPS ـی خۆی
    const mapVisible = protectedSelf
      ? true
      : (showMyAvatarOnMapRef.current && !ghostModeRef.current)

    updatePlayerLocation(uid, {

      name: profile.username?.trim() || profile.name,

      gender: profile.gender,

      lat,

      lng,

      isOnline: true,

      showMyAvatarOnMap: mapVisible,

      avatarUrl: profile.avatarUrl,

      avatar3d: normalizeAvatar3d(profile.avatar3d),

      skinId: cos.skinId,

      borderId: cos.borderId,

      titleId: cos.titleId,

      headwearId: cos.headwearId,

      accessoryId: cos.accessoryId,

      mapAuraId: cos.mapAuraId,

      companionId: cos.companionId,

      hunterLevel: profile.hunterLevel ?? 0,

      playerId: profile.playerId ?? '',

      lastSeenMs: now,

    }).catch(err => console.error('Location sync failed:', err))

    if (!homeCityKeyRef.current) {
      ensureHomeCityKey(uid, lat, lng).then(key => {
        if (key) homeCityKeyRef.current = key
      }).catch(() => {})
    }

    // Socket.io live broadcast — move_player
    realtimeSync.emitMove({
      uid,
      name: profile.username?.trim() || profile.name,
      gender: profile.gender,
      lat,
      lng,
      avatarUrl: profile.avatarUrl,
      showMyAvatarOnMap: mapVisible,
      avatar3d: normalizeAvatar3d(profile.avatar3d),
      skinId: cos.skinId,
      borderId: cos.borderId,
      titleId: cos.titleId,
      headwearId: cos.headwearId,
      accessoryId: cos.accessoryId,
      hunterLevel: profile.hunterLevel ?? 0,
      playerId: profile.playerId ?? '',
      playerLevel: profile.playerLevel ?? 1,
      playerXp: profile.playerXp ?? 0,
    })

  }, [])

  // نۆتە: لەسەر نەخشە تەنها ئاڤاتاری جەستە (+ نێۆن ڕینگ) — بێ ئاست/نازناو/بادج؛ ئاست لە هێدەر و UI

  const buildPlayerFxOverlayHtml = useCallback((smokeUntilMs: number, duelFxUntilMs: number, activeDuelId: string | null = null) => {

    const now = Date.now()

    const showSmoke = smokeUntilMs > now

    const showLive = Boolean(activeDuelId) && duelFxUntilMs > Date.now()

    const showDuel = !showLive && duelFxUntilMs > now

    if (!showSmoke && !showDuel && !showLive) return ''

    return `

      ${showLive ? `<div class="kd-live-war-badge" data-duel-id="${escapeAttr(String(activeDuelId ?? ''))}">🔴 LIVE 1v1 WAR</div>` : ''}

      ${showDuel ? `<div class="kd-duel-crosshair" aria-hidden="true">⚔</div><div class="kd-duel-arc" aria-hidden="true"></div>` : ''}

      ${showSmoke ? `<div class="kd-fight-smoke" aria-hidden="true"></div>` : ''}

    `

  }, [])

  const buildOnlinePlayerMarkerHtml = useCallback((

    uid: string,

    avatarUrl: string,

    hunterLevel: number,

    skin?: CosmeticDef | null,

    border?: CosmeticDef | null,

    title?: CosmeticDef | null,

    headwear?: CosmeticDef | null,

    accessory?: CosmeticDef | null,

    smokeUntilMs = 0,

    duelFxUntilMs = 0,

    activeDuelId: string | null = null,

    gender?: Gender,

    isMoving?: boolean | null,

    sizePx?: number,

    avatar3d?: Avatar3DCustomization | null,

    isSelected = false,

    displayName?: string | null,

  ) => {

    const fullBody = useFullBody3DAvatar

    void sizePx

    const zoom = mapZoomRef.current

    const visualScale = fullBody ? fullBodyScaleForZoom(zoom) : 1

    const underFeet = FULL_BODY_MARKER_HEIGHT - FULL_BODY_ICON_ANCHOR_Y

    const inner = buildMapAvatarInnerHtml({

      avatarUrl,

      skin,

      border,

      sizePx: fullBody ? FULL_BODY_MARKER_WIDTH : 38,

      gender,

      seed: uid,

      isMoving,

      avatar3d: avatar3d ?? null,

    })

    void title
    void displayName

    const frame = fullBody

      ? `<div class="kd-fb3d-frame" style="position:relative;overflow:visible;background:transparent;">${inner}</div>`

      : buildAvatarFrameHtml(inner, border, 38, headwear, accessory)

    const chestBadge = buildMapChestBadgeHtml(hunterLevel)

    const footRing = buildMapFootRingHtml(hunterLevel)

    const fx = buildPlayerFxOverlayHtml(smokeUntilMs, duelFxUntilMs, activeDuelId)

    // Chat + gift FX لە توێی overlayـی جیا — بێ ڕیفڕێشی ئاڤاتار
    const visualBottom = fullBody ? -underFeet : 0

    const visualOrigin = fullBody ? `50% ${FULL_BODY_ICON_ANCHOR_Y}px` : '50% 100%'

    const visualXf = `translate3d(-50%, 0, 0) scale(var(--vs, ${visualScale}))`

    const selectedClass = isSelected ? ' is-selected' : ''

    const safeUid = escapeAttr(String(uid ?? ''))

    const clickClass = 'kd-clickable-player'

    // Chat slot دەرەوەی visual — filter/transform کلیپی bubble ناکات؛ float layer لەسەرەوەی gift
    return `<div class="avatar-inner ${clickClass}${isSelected ? ' kd-player-marker-selected' : ''}" data-uid="${safeUid}">

       <div class="kd-avatar-hit" aria-hidden="true"></div>

       <div class="kd-map-overlay-layer kd-map-overlay-chat" data-overlay="chat"></div>

       <div class="map-avatar-visual${selectedClass}" style="--vs:${visualScale};position:absolute;left:50%;bottom:${visualBottom}px;margin:0;transform:${visualXf};transform-origin:${visualOrigin};will-change:transform;display:flex;flex-direction:column;align-items:center;">

         <div class="map-avatar-marker${fullBody ? ' map-avatar-marker--fullbody' : ''}" style="display:flex;flex-direction:column;align-items:center;background:transparent;position:relative;will-change:transform;transform:translate3d(0,0,0);">

           ${footRing}

           ${fx}

           ${frame}

           ${chestBadge}

           <div class="kd-map-overlay-layer kd-map-overlay-fx" data-overlay="fx"></div>

         </div>

       </div>

     </div>`

  }, [buildPlayerFxOverlayHtml])

  const buildSelfPlayerMarkerHtml = useCallback((

    avatarUrl: string,

    hunterLevel: number,

    skin?: CosmeticDef | null,

    border?: CosmeticDef | null,

    title?: CosmeticDef | null,

    headwear?: CosmeticDef | null,

    accessory?: CosmeticDef | null,

    smokeUntilMs = 0,

    duelFxUntilMs = 0,

    activeDuelId: string | null = null,

    gender?: Gender,

    isMoving?: boolean | null,

    sizePx?: number,

    avatar3d?: Avatar3DCustomization | null,

    isSelected = false,

  ) => {

    const fullBody = useFullBody3DAvatar

    void sizePx

    const zoom = mapZoomRef.current

    const visualScale = fullBody ? fullBodyScaleForZoom(zoom) : 1

    const underFeet = FULL_BODY_MARKER_HEIGHT - FULL_BODY_ICON_ANCHOR_Y

    const inner = buildMapAvatarInnerHtml({

      avatarUrl,

      skin,

      border,

      sizePx: fullBody ? FULL_BODY_MARKER_WIDTH : 38,

      gender,

      seed: 'self',

      isMoving,

      avatar3d: avatar3d ?? null,

    })

    void title

    const frame = fullBody

      ? `<div class="kd-fb3d-frame" style="position:relative;overflow:visible;background:transparent;">${inner}</div>`

      : buildAvatarFrameHtml(inner, border, 38, headwear, accessory)

    const chestBadge = buildMapChestBadgeHtml(hunterLevel)

    const footRing = buildMapFootRingHtml(hunterLevel)

    const fx = buildPlayerFxOverlayHtml(smokeUntilMs, duelFxUntilMs, activeDuelId)

    const visualBottom = fullBody ? -underFeet : 0

    const visualOrigin = fullBody ? `50% ${FULL_BODY_ICON_ANCHOR_Y}px` : '50% 100%'

    const visualXf = `translate3d(-50%, 0, 0) scale(var(--vs, ${visualScale}))`

    const selectedClass = isSelected ? ' is-selected' : ''

    return `<div class="avatar-inner kd-clickable-self${isSelected ? ' kd-player-marker-selected' : ''}">

       <div class="kd-avatar-hit" aria-hidden="true"></div>

       <div class="map-avatar-visual${selectedClass}" style="--vs:${visualScale};position:absolute;left:50%;bottom:${visualBottom}px;margin:0;transform:${visualXf};transform-origin:${visualOrigin};will-change:transform;display:flex;flex-direction:column;align-items:center;">

         <div class="kd-map-overlay-layer kd-map-overlay-chat" data-overlay="chat"></div>

         <div class="map-avatar-marker${fullBody ? ' map-avatar-marker--fullbody' : ''}" style="display:flex;flex-direction:column;align-items:center;background:transparent;position:relative;will-change:transform;transform:translate3d(0,0,0);">

           ${footRing}

           ${fx}

           ${frame}

           ${chestBadge}

           <div class="kd-map-overlay-layer kd-map-overlay-fx" data-overlay="fx"></div>

         </div>

       </div>

     </div>`

  }, [buildPlayerFxOverlayHtml])

  const updateUserMarkerIcon = useCallback(() => {

    if (!userMarkerRef.current) return

    const uid = userIdRef.current
    const protectedSelf = isProtectedAccount({
      uid,
      playerId: userProfileRef.current?.playerId,
    })
    // هەژماری تایبەت هەمیشە لەسەر نەخشە دیارە
    if (!showMyAvatarOnMapRef.current && !protectedSelf) {

      userMarkerRef.current.setOpacity(0)

      try { userMarkerRef.current.options.interactive = false } catch {}

      return

    }

    userMarkerRef.current.setOpacity(1)

    try { userMarkerRef.current.options.interactive = true } catch {}

    const profile = userProfileRef.current ?? FALLBACK_PROFILE

    const avatarUrl = profile.avatarUrl || avatarForGender(profile.gender)

    const hunterLvl = profile.hunterLevel ?? 0

    const cos = getActiveCosmetics(boughtItemsRef.current)

    const a3d = normalizeAvatar3d(profile.avatar3d)

    const visualScale = useFullBody3DAvatar ? fullBodyScaleForZoom(mapZoomRef.current) : 1

    const moving = selfMovingRef.current

    const fx = selfMapFxRef.current

    const selfUid = userIdRef.current ?? 'self'

    const isSelected = selectedPlayerUidRef.current === selfUid

    const sig = [

      visualScale,

      profile.gender,

      avatarUrl,

      hunterLvl,

      cos.avatar?.id ?? '',

      cos.border?.id ?? '',

      cos.title?.id ?? '',

      cos.headwear?.id ?? '',

      cos.accessory?.id ?? '',

      avatar3dSignature(a3d),

      fx.smokeUntilMs,

      fx.duelFxUntilMs,

      fx.activeDuelId ?? '',

      moving ? '1' : '0',

      isSelected ? '1' : '0',

    ].join('|')

    if (sig === selfIconSigRef.current) return

    selfIconSigRef.current = sig

    userMarkerRef.current.setIcon(L.divIcon({

      className: 'avatar-marker-clean',

      html: buildSelfPlayerMarkerHtml(

        avatarUrl, hunterLvl, cos.avatar, cos.border, cos.title, cos.headwear, cos.accessory,

        fx.smokeUntilMs, fx.duelFxUntilMs, fx.activeDuelId,

        profile.gender,

        moving,

        undefined,

        a3d,

        isSelected,

      ),

      iconSize: PLAYER_MARKER_ICON_SIZE,

      iconAnchor: PLAYER_MARKER_ICON_ANCHOR,

    }))

    userMarkerRef.current.setZIndexOffset(isSelected ? 5200 : 3600)
    const m = userMarkerRef.current
    window.requestAnimationFrame(() => {
      if (!m) return
      const chatHtml = buildMapChatBubbleHtml(
        selfUid,
        mapChatBubblesRef.current,
        revealedMapChatIdsRef.current,
        selfUid,
        hideGlobalChatRef.current,
      )
      const fxHtml = buildMapEffectOverlayHtml(selfUid, mapAvatarOverlaysRef.current)
      patchMarkerChatOverlay(m, chatHtml)
      patchMarkerFxOverlay(m, fxHtml)
      // Restore VIP size after icon rebuild (click empty / sheet close)
      reapplyVipSenderBoostVisualsRef.current()
    })

  }, [buildSelfPlayerMarkerHtml])

  const updateUserMarkerIconRef = useRef(updateUserMarkerIcon)
  updateUserMarkerIconRef.current = updateUserMarkerIcon

  const saveAvatarStudio = useCallback(async () => {

    const uid = userIdRef.current

    if (!uid) return

    const next = normalizeAvatar3d(avatarStudioDraft)

    setAvatarStudioSaving(true)

    try {

      await syncUserProfile(uid, { avatar3d: next })

      setUserProfile(prev => (prev ? { ...prev, avatar3d: next } : prev))

      userProfileRef.current = { ...(userProfileRef.current ?? FALLBACK_PROFILE), avatar3d: next }

      selfIconSigRef.current = ''

      updateUserMarkerIcon()

      pushLocationToFirestore(userLatRef.current, userLngRef.current, true)

      showGameAlert({ message: '✅ ڕووکاری کەسایەتی خەزنکرا' })

    } catch {

      showGameAlert({ message: '❌ نەتوانرا خەزن بکرێت' })

    } finally {

      setAvatarStudioSaving(false)

    }

  }, [avatarStudioDraft, pushLocationToFirestore, updateUserMarkerIcon])

  /** جێگیرکردنی ئاڤاتارەکان بە دووری ≥٢٥م + z-index — تەنها پیشاندان، GPSـی ڕاستەقینە ناگۆڕێت */

  const layoutMapAvatars = useCallback(() => {

    if (!mapRef.current) return

    const selfUid = userIdRef.current || '__self__'

    const avatars: Array<{ uid: string; lat: number; lng: number }> = []

    if (showMyAvatarOnMapRef.current) {

      avatars.push({ uid: selfUid, lat: userLatRef.current, lng: userLngRef.current })

    }

    otherPlayerTruePosRef.current.forEach((pos, uid) => {

      avatars.push({ uid, lat: pos.lat, lng: pos.lng })

    })

    if (avatars.length === 0) return

    const placed = computeAvatarDisplayPositions(avatars)

    const now = Date.now()
    const vipBoosted = (uid: string) => (vipSenderBoostUntilRef.current.get(uid) ?? 0) > now

    const selfPlace = placed.get(selfUid)

    if (selfPlace && userMarkerRef.current) {

      userMarkerRef.current.setLatLng([selfPlace.lat, selfPlace.lng])

      userMarkerRef.current.setZIndexOffset(
        vipBoosted(selfUid) ? PREMIUM_GIFT_SENDER_Z_OFFSET : selfPlace.zIndex + 1000,
      )

    }

    otherPlayerMarkersRef.current.forEach((marker, uid) => {

      const place = placed.get(uid)

      if (!place) return

      const prev = marker.getLatLng()

      const moved = Math.abs(prev.lat - place.lat) > 1e-9 || Math.abs(prev.lng - place.lng) > 1e-9

      marker.setZIndexOffset(vipBoosted(uid) ? PREMIUM_GIFT_SENDER_Z_OFFSET : place.zIndex)

      if (moved) marker.setLatLng([place.lat, place.lng])

    })

    // Keep drops above avatars after layout

    activeDropsRef.current.forEach(({ marker }) => {

      try { marker.setZIndexOffset(DROP_MARKER_Z_OFFSET) } catch {}

    })

    const map = mapRef.current
    if (map) {
      try {
        syncAllMapChatFloatPositions(map, (uid) => {
          if (uid === userIdRef.current) return userMarkerRef.current
          return otherPlayerMarkersRef.current.get(uid) ?? null
        })
      } catch { /* ignore */ }
    }

  }, [])

  const scheduleLayoutMapAvatars = useCallback(() => {
    // Page Visibility — هیچ layoutـێک لە باکگراوند
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return

    // Throttle ١٥٠–٢٠٠ms — ڕێگری لە نوێکردنەوەی زۆر مارکەر لە هەر frame
    if (layoutAvatarsThrottleTimerRef.current != null) return
    const elapsed = performance.now() - layoutAvatarsLastRunRef.current
    const delay = Math.max(0, NPC_MARKER_THROTTLE_MS - elapsed)

    layoutAvatarsThrottleTimerRef.current = window.setTimeout(() => {
      layoutAvatarsThrottleTimerRef.current = null
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      if (layoutAvatarsRafRef.current != null) cancelAnimationFrame(layoutAvatarsRafRef.current)
      layoutAvatarsRafRef.current = requestAnimationFrame(() => {
        layoutAvatarsRafRef.current = null
        layoutAvatarsLastRunRef.current = performance.now()
        layoutMapAvatars()
      })
    }, delay)
  }, [layoutMapAvatars])

  /** نوێکردنەوەی chat/FX بەبێ setIcon — Batchـی یەک frame */
  const getMapMarkerByUid = useCallback((uid: string): L.Marker | null => {
    if (uid === userIdRef.current) return userMarkerRef.current
    return otherPlayerMarkersRef.current.get(uid) ?? null
  }, [])

  /**
   * VIP gift — کارەکتەری بەخشیار ١٠چ زۆر گەورە دەمێنێتەوە.
   * کلیک لە بۆشایی / نوێکردنەوەی ئایکۆن نابێت boost بشکێنێت پێش کۆتایی کات.
   */
  const reapplyVipSenderBoostVisuals = useCallback(() => {
    const now = Date.now()
    for (const [uid, untilMs] of [...vipSenderBoostUntilRef.current.entries()]) {
      if (untilMs <= now) {
        vipSenderBoostUntilRef.current.delete(uid)
        const marker = getMapMarkerByUid(uid)
        const el = marker?.getElement()
        const target = (el?.querySelector('.map-avatar-visual') as HTMLElement | null) ?? el
        try { target?.classList.remove('kd-vip-sender-boost') } catch { /* ignore */ }
        continue
      }
      const marker = getMapMarkerByUid(uid)
      if (!marker) continue
      const el = marker.getElement()
      const target = (el?.querySelector('.map-avatar-visual') as HTMLElement | null) ?? el
      if (!target) continue
      target.classList.add('kd-vip-sender-boost')
      try { marker.setZIndexOffset(PREMIUM_GIFT_SENDER_Z_OFFSET) } catch { /* ignore */ }
    }
  }, [getMapMarkerByUid])

  reapplyVipSenderBoostVisualsRef.current = reapplyVipSenderBoostVisuals

  const applyVipSenderBoost = useCallback((fromUid: string, remainingMs = PREMIUM_GIFT_SENDER_BOOST_MS) => {
    if (remainingMs <= 0) return
    const untilMs = Date.now() + remainingMs
    vipSenderBoostUntilRef.current.set(fromUid, untilMs)
    reapplyVipSenderBoostVisuals()
    window.setTimeout(() => {
      if ((vipSenderBoostUntilRef.current.get(fromUid) ?? 0) > Date.now()) return
      vipSenderBoostUntilRef.current.delete(fromUid)
      const marker = getMapMarkerByUid(fromUid)
      const el = marker?.getElement()
      const target = (el?.querySelector('.map-avatar-visual') as HTMLElement | null) ?? el
      try { target?.classList.remove('kd-vip-sender-boost') } catch { /* ignore */ }
    }, remainingMs + 40)
  }, [getMapMarkerByUid, reapplyVipSenderBoostVisuals])

  const enqueueMapOverlay = useCallback((update: BatchedMapOverlayUpdate) => {
    overlayBatchRef.current.push(update)
  }, [])

  const flushMapOverlayBatch = useCallback(() => {
    if (overlayBatchRef.current.length === 0) return
    const batch = overlayBatchRef.current
    overlayBatchRef.current = []
    flushBatchedMapOverlays(batch, getMapMarkerByUid)
    const map = mapRef.current
    if (map) {
      try { syncAllMapChatFloatPositions(map, getMapMarkerByUid) } catch { /* ignore */ }
    }
  }, [getMapMarkerByUid])

  const syncMarkerOverlaysForUid = useCallback((uid: string) => {
    const marker = getMapMarkerByUid(uid)
    if (!marker) return
    const chatHtml = buildMapChatBubbleHtml(
      uid,
      mapChatBubblesRef.current,
      revealedMapChatIdsRef.current,
      userIdRef.current,
      hideGlobalChatRef.current,
    )
    const fxHtml = buildMapEffectOverlayHtml(uid, mapAvatarOverlaysRef.current)
    patchMarkerChatOverlay(marker, chatHtml)
    patchMarkerFxOverlay(marker, fxHtml)
  }, [getMapMarkerByUid])

  const syncAllVisibleMarkerOverlays = useCallback(() => {
    const myUid = userIdRef.current
    if (myUid) syncMarkerOverlaysForUid(myUid)
    otherPlayerMarkersRef.current.forEach((_m, uid) => {
      syncMarkerOverlaysForUid(uid)
    })
  }, [syncMarkerOverlaysForUid])

  const focusNearbyPlayer = useCallback((uid: string, lat: number, lng: number) => {

    const map = mapRef.current

    if (!map) return

    setFollowMe(false)

    followMeRef.current = false

    const marker = otherPlayerMarkersRef.current.get(uid)

    const focusLatLng = marker ? marker.getLatLng() : { lat, lng }

    try {

      map.panTo([focusLatLng.lat, focusLatLng.lng], { animate: true, duration: 0.28 })

      if (map.getZoom() < 16) map.setZoom(16, { animate: true })

    } catch {}

    if (marker) {

      try {

        marker.setZIndexOffset(9000)

        const el = marker.getElement()

        if (el) {

          el.style.transition = 'filter 0.25s ease'

          el.style.filter = 'drop-shadow(0 0 12px rgba(56,189,248,0.95))'

          window.setTimeout(() => {

            try { el.style.filter = '' } catch {}

            scheduleLayoutMapAvatars()

          }, 1400)

        }

      } catch {}

    }

    setActiveSheet(null)

    setActiveBalance(null)

  }, [scheduleLayoutMapAvatars])

  const setWalletAndSync = useCallback((updater: React.SetStateAction<typeof wallet>) => {

    setWallet(prev => {

      let next = typeof updater === 'function' ? updater(prev) : updater

      const uid = userIdRef.current
      const playerId = userProfileRef.current?.playerId
      const protectedAcc = isProtectedAccount({ uid, playerId })

      if (uid) {

        if (protectedAcc) {
          next = lockProtectedWallet(next)
        } else {
          const spentGold = Math.max(0, prev.gold - next.gold)
          const spentDiamond = Math.max(0, prev.diamond - next.diamond)
          if (spentGold || spentDiamond) {
            playerSpendRef.current = recordPlayerSpend(uid, {
              gold: spentGold,
              diamond: spentDiamond,
            })
          }
        }

        // Sanitize negatives only — earned balances persist to Firestore + local cache
        next = clampWalletToCap(next)
        if (protectedAcc) next = lockProtectedWallet(next)

        const goldGain = Math.max(0, next.gold - prev.gold)
        const diamondGain = Math.max(0, next.diamond - prev.diamond)
        if (!protectedAcc && (goldGain || diamondGain)) {
          incrementLeaderboardWealth(uid, { gold: goldGain, diamond: diamondGain }).catch(() => {})
        }

        saveUserDataLocal(uid, {
          playerId: userProfileRef.current?.playerId,
          gold: next.gold,
          diamond: next.diamond,
          isPremium: next.isPremium,
          playerLevel: userProfileRef.current?.playerLevel,
          playerXp: userProfileRef.current?.playerXp,
          hunterLevel: userProfileRef.current?.hunterLevel,
          inventory: boughtItemsRef.current,
        })

        syncUserBalances(uid, {

          gold: next.gold,

          diamond: next.diamond,

          isPremium: next.isPremium,

        }).catch(err => console.error('Firestore sync failed:', err))

      }

      return next

    })

  }, [])

  // هەژماری تایبەت — زێڕ/ئەڵماس هەمیشە لە باڵانسی جێگیر دەمێننەوە
  useEffect(() => {
    const uid = userIdRef.current
    const playerId = userProfileRef.current?.playerId
    if (!isProtectedAccount({ uid, playerId })) return
    if (wallet.gold === PROTECTED_LOCKED_GOLD && wallet.diamond === PROTECTED_LOCKED_DIAMOND) return
    setWalletAndSync(w => lockProtectedWallet(w))
  }, [wallet.gold, wallet.diamond, setWalletAndSync])

  const openChest = useCallback(async (airdropId: string): Promise<boolean> => {

    const uid = userIdRef.current

    if (!uid) return false

    const airdrop = airdropsDataRef.current.get(airdropId)

    // کلیلی ئەفسانەیی (کاڵای ژمارە ٣): ئەگەر چالاک بێت، قوفڵی کاتی درۆپەکان بەبێ چاوەڕوانی دەکرێتەوە

    const hasLegendaryKey = boughtItemsRef.current.some(i => i.id === 3 && i.active)

    // قوفڵی درۆپ: هەر جۆرێک کاتی قوفڵی تایبەتی خۆی هەیە (airdrop.unlockAtMs)

    if (airdrop && !hasLegendaryKey) {

      if (Date.now() < airdrop.unlockAtMs) {

        const secsLeft = Math.ceil((airdrop.unlockAtMs - Date.now()) / 1000)

        const mm = Math.floor(secsLeft / 60).toString().padStart(2, '0')

        const ss = (secsLeft % 60).toString().padStart(2, '0')

        showGameAlert({ message: `🔒 ئەم درۆپە هێشتا قوفڵ کراوە! چاوەڕوان بە ${mm}:${ss}` })

        return false

      }

    }

    // ڕاگرتنی ٢٤ کاتژمێری بۆ هەمان جۆری درۆپ

    if (airdrop && airdrop.dropType >= 1) {

      const remain = getDropTypeCooldownRemaining(dropTypeCooldownsRef.current, airdrop.dropType)

      if (remain > 0) {

        showGameAlert({ message: formatDropCooldownMessage(airdrop.dropType, remain) })

        return false

      }

    }

    try {

      const result = await claimAirdrop(uid, airdropId)

      setWallet(prev => ({

        ...prev,

        gold: result.gold,

        diamond: result.diamond,

      }))

      setUserProfile(prev => {

        if (!prev) return prev

        const next = {

          ...prev,

          gold: result.gold,

          diamond: result.diamond,

          dropsOpenedByType: result.dropsOpenedByType,

          hunterLevel: result.hunterLevel,

        }

        userProfileRef.current = next

        return next

      })

      selfIconSigRef.current = ''

      updateUserMarkerIcon()

      pushLocationToFirestore(userLatRef.current, userLngRef.current, true)

      if (result.grantedItems.length > 0) {

        setBoughtItems(prev => {

          const owned = new Set(prev.map(i => i.id))

          const merged = [...prev]

          for (const item of result.grantedItems) {

            if (!owned.has(item.id)) merged.push(item)

          }

          return merged

        })

        setHasViewedInv(false)

      }

      setActiveSheet(null)

      setSelectedAirdropId(null)

      addXP(xpForDropType(airdrop?.dropType ?? 0))

      incrementPlayerStats(uid, { chestsOpened: 1 }).catch(() => {})

      if (soundEnabledRef.current && chestSoundEnabledRef.current) playClaimSfx(chestVolumeRef.current)

      {

        const next = bumpMission(normalizeMissions(seasonPassRef.current), 'claimDrop', 1)

        seasonPassRef.current = next

        setSeasonPass(next)

        saveSeasonPass(uid, next)

      }

      const parts: string[] = []

      if (result.rewardDiamond) parts.push(`💎 ${result.rewardDiamond} ئەڵماس`)

      if (result.rewardGold) parts.push(`🟡 ${result.rewardGold.toLocaleString()} زێڕ`)

      for (const item of result.grantedItems) parts.push(`🎁 ${item.name}`)

      if (result.skippedItemIds.length > 0) {

        parts.push(boughtItemsRef.current.length >= inventoryCapacity

          ? `⚠️ جانتا پڕە (زۆرترین ${inventoryCapacity} کەرەستە) — هەندێک خەڵات نەدرا`

          : '⚠️ هەندێک کەرەستە نەدرا (هەبوو یان جانتا پڕ بوو)')

      }

      const giftList = parts.length ? parts.join('، ') : 'خەڵات'
      const awayNote = result.awayCityBonus ? ' · ⚡ ٢× (دەرەوەی شاری خۆت)' : ''
      const rankName = hunterRankForLevel(result.hunterLevel).name
      const notifBody = `تۆ بە سەرکەوتوویی درۆپێکت کردەوە و ئەم دیارییانەت دەستکەوت: ${giftList}${awayNote}`

      logActivity('claimDrop', `کردنەوەی درۆپ — ${giftList}${awayNote} · ${rankName}`, '📦')

      showRewardToast({
        title: result.awayCityBonus ? 'درۆپ · ٢× ئاست' : 'درۆپ کرایەوە',
        message: notifBody,
        icon: result.awayCityBonus ? '⚡' : '📦',
        inboxKind: 'other',
      })

      return true

    } catch (err) {

      showGameAlert({ message: err instanceof Error ? err.message : '❌ نەتوانرا درۆپەکە بکرێتەوە' })
      return false

    }

  }, [logActivity, pushLocationToFirestore, updateUserMarkerIcon, showRewardToast, showGameAlert])

  // ── کارلێکەکانی بۆکسی کاردانەوەی یاریزان (پۆپئەپی ئاڤاتار) ──────────────────

  const openPrivateSheet = useCallback((tab: 'friends' | 'messages' | 'gifts' = 'messages') => {

    dismissAllOverlaysRef.current('dropdown')

    if (tab === 'friends') {

      setFriendsTab(incomingFriendRequests.length > 0 ? 'requests' : 'friends')

      setFindIdInput('')

      setFindResult(null)

      setFindError('')

    }

    if (tab === 'messages') {

      setDmShowEmoji(false)

      setDmSelectedIds([])

      setDmDeleteConfirm(false)

      setDmThreadMenu(null)

    }

    setPrivateTab(tab)

    const el = document.getElementById('dropdown-wrapper')

    if (el) {

      el.style.transition = 'none'

      el.style.maxHeight = '62vh'

      el.style.opacity = '1'

      el.style.paddingTop = '12px'

      el.style.marginTop = '4px'

      el.style.borderTopColor = 'rgba(255, 255, 255, 0.1)'

    }

    setActiveSheet('private')

    setActiveBalance(null)

  }, [incomingFriendRequests.length])

  const runPlayerAction = useCallback((key: string, disabled: boolean, disabledMsg: string | null, action: () => void) => {

    if (disabled) {

      if (disabledMsg) showGameAlert({ message: disabledMsg })

      return

    }

    action()

  }, [showGameAlert])

  const bindPlayerSheetTap = useCallback(

    (key: string, disabled: boolean, disabledMsg: string | null, action: () => void) =>

      bindInstantTap(playerSheetTapLockRef, () => runPlayerAction(key, disabled, disabledMsg, action)),

    [runPlayerAction],

  )

  const handleSendMessageToPlayer = useCallback(async (uid: string, name: string) => {

    // نامەی ئاسایی/تایبەت — بۆ هەموو کەسێک، تەنانەت بەبێ هاوڕێیەتی (مەگەر وەرگر ڕێگری کردبێت)

    if (blockedUidsRef.current.has(uid)) {

      showGameAlert({ message: '🚫 ئەم یاریزانە بلۆک کراوە — ناتوانیت نامەی بۆ بنێریت' })

      return

    }

    const isFriend = friendsList.some(f => f.uid === uid)

    if (!isFriend && uid !== userIdRef.current) {

      try {
        const recipientProfile = await getUserPublicProfile(uid)
        if (recipientProfile && recipientProfile.allowDmWithoutFriendship === false) {
          showGameAlert({ message: '🚫 ئەم یاریزانە ڕێگە نادات بێ هاوڕێیەتی نامەی بۆ بنێردرێت' })
          return
        }
      } catch { /* fail-open — ڕێگری لە نامەکردن نەکەیت لەبەر هەڵەی تۆڕ */ }

    }

    closePlayerSheetRef.current()

    setActiveDmPartner({ uid, name })

    setDmShowEmoji(false)

    setDmSelectedIds([])

    setDmDeleteConfirm(false)

    openPrivateSheet('messages')

  }, [openPrivateSheet, showGameAlert, friendsList])

  const handleBlockPlayer = useCallback((uid: string, name: string) => {
    setBlockReasonText('')
    setBlockReasonTarget({ uid, name })
  }, [])

  const confirmBlockWithReason = useCallback(async () => {

    const target = blockReasonTarget

    if (!target) return

    const myUid = userIdRef.current

    const myName = userProfileRef.current?.name ?? FALLBACK_PROFILE.name

    const reason = blockReasonText.trim()

    if (!reason) {

      showGameAlert({ message: 'تکایە هۆکاری بلۆک بنووسە' })

      return

    }

    try {

      if (target.fromFriend && myUid) {

        await removeFriend(myUid, target.uid)

      }

      blockedUidsRef.current.add(target.uid)

      if (myUid) await blockUserPersist(myUid, { uid: target.uid, name: target.name }, myName, reason)

      setBlockReasonTarget(null)

      setBlockReasonText('')

      setActiveSheet(null)

      showGameAlert({ message: `🚫 ${target.name} بلۆک کرا — نامەی تایبەت ڕاگیرا؛ ئاڤاتار لەسەر نەخشە دەمێنێتەوە.` })

    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : '❌ نەتوانرا ئەم یاریزانە بلۆک بکرێت'
      showGameAlert({ message: msg })

    }

  }, [blockReasonTarget, blockReasonText, showGameAlert])

  const handleUnblockPlayer = useCallback((target: BlockedUser) => {

    const myUid = userIdRef.current

    if (!myUid) return

    const myName = userProfileRef.current?.name ?? FALLBACK_PROFILE.name

    blockedUidsRef.current.delete(target.uid)

    unblockUserPersist(myUid, target, myName).catch(() => {})

  }, [])

  const handleSendFriendRequestToPlayer = useCallback(async (uid: string, name: string) => {

    const myUid = userIdRef.current

    const myName = userProfileRef.current?.name ?? FALLBACK_PROFILE.name

    if (!myUid) return

    if (friendsList.some(f => f.uid === uid)) {

      showGameAlert({ message: `🤝 ${name} پێشتر لە لیستی هاوڕێیانتدایە` })

      return

    }

    if (outgoingFriendUids.includes(uid)) {

      showGameAlert({ message: `⏳ داواکاری هاوڕێیەتی پێشتر نێردراوە بۆ ${name}` })

      return

    }

    try {

      await sendFriendRequest(myUid, myName, uid)

      setOutgoingFriendUids(prev => {

        const next = prev.includes(uid) ? prev : [...prev, uid]

        saveOutgoingFriendUidsLocal(myUid, next)

        return next

      })

      showGameAlert({ message: `🤝 داواکاری هاوڕێیەتی بۆ ${name} نێردرا!`, tone: 'success' })

      logActivity('friend', `داوای هاوڕێیەتی نێردرا بۆ ${name}`, '🤝')

    } catch (err) {

      const msg = err instanceof Error ? err.message : '❌ نەتوانرا داواکارییەکە بنێردرێت'

      if (msg.includes('پێشتر هاوڕێ') || msg.includes('هاوڕێیت')) {

        showGameAlert({ message: `🤝 ${name} پێشتر لە لیستی هاوڕێیانتدایە` })

      } else if (msg.includes('پێشتر نێردراوە')) {

        setOutgoingFriendUids(prev => {

          const next = prev.includes(uid) ? prev : [...prev, uid]

          saveOutgoingFriendUidsLocal(myUid, next)

          return next

        })

        showGameAlert({ message: `⏳ داواکاری پێشتر نێردراوە بۆ ${name}` })

      } else {

        showGameAlert({ message: msg })

      }

    }

  }, [friendsList, outgoingFriendUids, showGameAlert])

  const handleFindPlayerById = useCallback(async () => {

    const myUid = userIdRef.current

    setFindError('')

    setFindResult(null)

    const trimmed = findIdInput.trim()

    if (!/^\d{8}$/.test(trimmed)) {

      setFindError('تکایە IDیەکی ٨ ژمارەیی ڕاست بنووسە')

      return

    }

    setFindLoading(true)

    try {

      const result = await findUserByPlayerId(trimmed)

      if (!result) {

        setFindError('هیچ یاریزانێک بەم IDیە نەدۆزرایەوە')

      } else if (result.uid === myUid) {

        setFindError('ئەمە IDی خۆتە!')

      } else {

        setFindResult(result)

      }

    } catch (err) {

      setFindError(err instanceof Error ? err.message : 'هەڵەیەک ڕوویدا')

    } finally {

      setFindLoading(false)

    }

  }, [findIdInput])

  const handleUnfriend = useCallback(async (friend: FriendEntry) => {

    const myUid = userIdRef.current

    if (!myUid) return

    if (!await showGameConfirm({ message: `دڵنیایت لە سڕینەوەی ${friend.name} لە لیستی هاوڕێکانت؟` })) return

    try {

      await removeFriend(myUid, friend.uid)

    } catch {

      showGameAlert({ message: '❌ نەتوانرا هاوڕێیەکە بسڕدرێتەوە' })

    }

  }, [showGameAlert, showGameConfirm])

  const handleBlockFriend = useCallback(async (friend: FriendEntry) => {
    setBlockReasonText('')
    setBlockReasonTarget({ uid: friend.uid, name: friend.name, fromFriend: true })
  }, [])

  const handleAcceptFriendRequest = useCallback(async (req: IncomingFriendRequest) => {

    const myUid = userIdRef.current

    const myName = userProfileRef.current?.name ?? FALLBACK_PROFILE.name

    if (!myUid) return

    try {

      await acceptFriendRequest(req.id, myUid, myName, req.from, req.fromName)

      setFriendsTab('friends')

      showGameAlert({ message: `✅ ${req.fromName} ئێستا لە لیستی هاوڕێکانتدایە!` })

      logActivity('friend', `هاوڕێیەتی قبوڵ کرا — ${req.fromName}`, '✅')

    } catch (err) {

      showGameAlert({ message: err instanceof Error ? err.message : '❌ هەڵەیەک ڕوویدا' })

    }

  }, [logActivity])

  const handleDeclineFriendRequest = useCallback(async (req: IncomingFriendRequest) => {

    try {

      await declineFriendRequest(req.id)

    } catch {

      showGameAlert({ message: '❌ نەتوانرا داواکارییەکە ڕەت بکرێتەوە' })

    }

  }, [])

  const handleSendGiftToPlayer = useCallback(async (uid: string, name: string) => {

    const myUid = userIdRef.current

    const myName = userProfileRef.current?.name ?? FALLBACK_PROFILE.name

    if (!myUid) return

    const amountStr = prompt(`چەند ئەڵماس دەتەوێت وەک دیاری بۆ ${name} بنێریت؟`, '10')

    if (!amountStr) return

    const amount = Math.round(Number(amountStr))

    if (!amount || amount <= 0) { showGameAlert({ message: '❌ بڕی هەڵە' }); return }

    try {

      await sendGift(myUid, myName, uid, amount)

      setWallet(prev => ({ ...prev, diamond: Math.max(0, prev.diamond - amount) }))

      showGameAlert({ message: `🎁 ${amount.toLocaleString()} ئەڵماس بۆ ${name} نێردرا!` })

      logActivity('gift', `ناردنی دیاری — ${amount.toLocaleString()} ئەڵماس بۆ ${name}`, '🎁')

      addXP(XP_REWARDS.giftBasic)

      setActiveSheet(null)

    } catch (err) {

      showGameAlert({ message: err instanceof Error ? err.message : '❌ نەتوانرا دیاریەکە بنێردرێت' })

    }

  }, [addXP])

  const handleSendDmMessage = useCallback(() => {

    const myUid = userIdRef.current

    const myName = userProfileRef.current?.name ?? FALLBACK_PROFILE.name

    const partner = activeDmPartner

    const text = dmInput.trim()

    if (!myUid || !partner || !text) return

    if (blockedUidsRef.current.has(partner.uid)) {

      showGameAlert({ message: '🚫 نامە ناردن ڕێگەپێنەدراوە — یەکێکتان بلۆک کراوە' })

      return

    }

    const recipientOnline = onlinePlayersRef.current.get(partner.uid)?.isOnline === true

    const now = Date.now()

    const tempId = `optimistic:${now}:${Math.random().toString(36).slice(2, 9)}`

    const optimisticMsg: DmMessage = {

      id: tempId,

      from: myUid,

      text,

      kind: 'text',

      mediaUrl: null,

      createdAtMs: now,

      status: recipientOnline ? 'delivered' : 'sent',

      deliveredAt: recipientOnline ? now : null,

      seenAt: null,

      hiddenFor: [],

      clientTempId: tempId,

    }

    const preview = text.slice(0, 200)

    setDmInput('')

    setDmShowEmoji(false)

    setDmMessages(prev => [...prev, optimisticMsg].slice(-100))

    setDmThreads(prev => bumpDmThreadPreview(prev, myUid, partner.uid, partner.name, preview, now))

    logActivity('message', `نامە نێردرا بۆ ${partner.name}`, '✉️')

    void sendPrivateMessage(myUid, myName, partner.uid, partner.name, text, {
      recipientOnline,
      clientTempId: tempId,
      skipBlockCheck: true,
    })

      .catch(err => {

        console.error('Send DM failed:', err)

        setDmMessages(prev => prev.filter(m => m.id !== tempId))

        setDmInput(text)

        showGameAlert({ message: err instanceof Error ? err.message : '❌ نەتوانرا نامەکە بنێردرێت' })

      })

  }, [dmInput, activeDmPartner, showGameAlert, logActivity])

  const handleConfirmHideDmMessages = useCallback(async (forBoth: boolean) => {

    const myUid = userIdRef.current

    if (!myUid || !activeDmPartner || dmSelectedIds.length === 0) return

    try {

      await hideDmMessages(myUid, activeDmPartner.uid, dmSelectedIds, forBoth)

      setDmSelectedIds([])

      setDmDeleteConfirm(false)

    } catch {

      showGameAlert({ message: '❌ نەتوانرا نامەکە بشاردرێتەوە' })

    }

  }, [activeDmPartner, dmSelectedIds])

  const toggleDmMessageSelect = useCallback((messageId: string) => {

    setDmDeleteConfirm(false)

    setDmSelectedIds(prev => prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId])

  }, [])

  const handleSendDmImage = useCallback(async (file: File) => {

    const myUid = userIdRef.current

    const myName = userProfileRef.current?.name ?? FALLBACK_PROFILE.name

    const partner = activeDmPartner

    if (!myUid || !partner) return

    const looksImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name || '')
    if (!looksImage) { showGameAlert({ message: '❌ تکایە تەنها فایلی وێنە هەڵبژێرە' }); return }

    // پیشاندانی خێرا بە کوالێتی ڕەسەن — ناگۆڕدرێت بۆ وێنەی پەستراوی تاریک
    const previewUrl = URL.createObjectURL(file)
    dmVoiceLocalUrlsRef.current.add(previewUrl)
    const now = Date.now()
    const tempId = `optimistic:${now}:${Math.random().toString(36).slice(2, 9)}`
    const recipientOnline = onlinePlayersRef.current.get(partner.uid)?.isOnline === true

    const clearProgress = () => {
      setDmMediaProgress(prev => {
        if (prev[tempId] == null) return prev
        const next = { ...prev }
        delete next[tempId]
        return next
      })
    }

    const setProgress = (pct: number) => {
      setDmMediaProgress(prev => ({ ...prev, [tempId]: Math.max(0, Math.min(100, Math.round(pct))) }))
    }

    const optimisticImg: DmMessage = {
      id: tempId,
      from: myUid,
      text: '',
      kind: 'image',
      mediaUrl: previewUrl,
      createdAtMs: now,
      status: recipientOnline ? 'delivered' : 'sent',
      deliveredAt: recipientOnline ? now : null,
      seenAt: null,
      hiddenFor: [],
      clientTempId: tempId,
    }
    setDmMessages(prev => [...prev, optimisticImg].slice(-100))
    setDmThreads(prev => bumpDmThreadPreview(prev, myUid, partner.uid, partner.name, '📷 وێنە', now))
    setDmSendingMedia(true)
    setProgress(4)

    try {
      // پەستاندنی کوالێتی-بەرز (١٦٠٠px / ~١MB)
      const blob = await compressImageToMaxBytes(file, undefined, pct => {
        setProgress(4 + Math.round(pct * 0.28))
      })
      setProgress(36)

      const threadId = [myUid, partner.uid].sort().join('_')
      const isGif = (blob.type || '').includes('gif') || /\.gif$/i.test(file.name || '')
      const contentType = isGif ? 'image/gif' : (blob.type || 'image/jpeg')
      const fileName = isGif ? 'image.gif' : 'image.jpg'

      let mediaUrl = await uploadDmMediaWithProgress(
        threadId,
        fileName,
        blob,
        contentType,
        pct => setProgress(36 + Math.round(pct * 0.52)),
      )

      if (!mediaUrl) {
        // تەنها بۆ وێنەی زۆر بچووک — Storage سەرنەکەوت
        if (blob.size > 400_000) throw new Error('بارکردنی وێنە سەرنەکەوت — دوبارە هەوڵبدەرەوە')
        setProgress(90)
        mediaUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('read'))
          reader.readAsDataURL(blob)
        })
      }

      setProgress(94)
      await sendPrivateMessage(myUid, myName, partner.uid, partner.name, '', {
        kind: 'image',
        mediaUrl,
        recipientOnline,
        clientTempId: tempId,
        skipBlockCheck: true,
      })
      setProgress(100)
      clearProgress()

    } catch (err) {

      setDmMessages(prev => prev.filter(m => m.id !== tempId))
      clearProgress()
      try { URL.revokeObjectURL(previewUrl) } catch { /* ignore */ }
      dmVoiceLocalUrlsRef.current.delete(previewUrl)

      showGameAlert({ message: err instanceof Error ? err.message : '❌ نەتوانرا وێنەکە بنێردرێت' })

    } finally {

      setDmSendingMedia(false)

    }

  }, [activeDmPartner, showGameAlert])

  const handleSendDmVideo = useCallback(async (file: File) => {

    const myUid = userIdRef.current

    const myName = userProfileRef.current?.name ?? FALLBACK_PROFILE.name

    const partner = activeDmPartner

    if (!myUid || !partner) return

    setDmSendingMedia(true)

    let tempId: string | null = null
    let localUrl: string | null = null

    try {

      const videoFile = await prepareDmVideoFile(file)

      const threadId = [myUid, partner.uid].sort().join('_')

      const contentType = videoFile.type || 'video/mp4'

      const ext = contentType.includes('webm') ? 'webm' : contentType.includes('quicktime') ? 'mov' : 'mp4'

      let mediaUrl = await uploadDmMedia(threadId, `video.${ext}`, videoFile, contentType)

      if (!mediaUrl) throw new Error('نەتوانرا ڤیدیۆکە باربکرێت — دوبارە هەوڵبدەرەوە')

      localUrl = URL.createObjectURL(videoFile)
      dmVoiceLocalUrlsRef.current.add(localUrl)
      const now = Date.now()
      tempId = `optimistic:${now}:${Math.random().toString(36).slice(2, 9)}`
      const recipientOnline = onlinePlayersRef.current.get(partner.uid)?.isOnline === true
      const optimisticVideo: DmMessage = {
        id: tempId,
        from: myUid,
        text: '',
        kind: 'video',
        mediaUrl: localUrl,
        createdAtMs: now,
        status: recipientOnline ? 'delivered' : 'sent',
        deliveredAt: recipientOnline ? now : null,
        seenAt: null,
        hiddenFor: [],
        clientTempId: tempId,
      }
      setDmMessages(prev => [...prev, optimisticVideo].slice(-100))
      setDmThreads(prev => bumpDmThreadPreview(prev, myUid, partner.uid, partner.name, '🎬 ڤیدیۆ', now))

      await sendPrivateMessage(myUid, myName, partner.uid, partner.name, '', {
        kind: 'video',
        mediaUrl,
        recipientOnline,
        clientTempId: tempId,
        skipBlockCheck: true,
      })

    } catch (err) {

      if (tempId) setDmMessages(prev => prev.filter(m => m.id !== tempId))
      if (localUrl) {
        try { URL.revokeObjectURL(localUrl) } catch { /* ignore */ }
        dmVoiceLocalUrlsRef.current.delete(localUrl)
      }
      showGameAlert({ message: err instanceof Error ? err.message : '❌ نەتوانرا ڤیدیۆکە بنێردرێت' })

    } finally {

      setDmSendingMedia(false)

    }

  }, [activeDmPartner])

  const stopDmVoiceMeter = useCallback(() => {
    if (dmVoiceRafRef.current != null) {
      cancelAnimationFrame(dmVoiceRafRef.current)
      dmVoiceRafRef.current = null
    }
    dmVoiceAnalyserRef.current = null
    const ctx = dmVoiceAudioCtxRef.current
    dmVoiceAudioCtxRef.current = null
    if (ctx) {
      try { void ctx.close() } catch { /* ignore */ }
    }
    setDmVoiceLevels(Array.from({ length: 28 }, () => 0.12))
  }, [])

  const clearDmVoiceTimers = useCallback(() => {
    if (dmVoiceMaxTimerRef.current != null) {
      window.clearTimeout(dmVoiceMaxTimerRef.current)
      dmVoiceMaxTimerRef.current = null
    }
    if (dmVoiceTickRef.current != null) {
      window.clearInterval(dmVoiceTickRef.current)
      dmVoiceTickRef.current = null
    }
  }, [])

  const resetDmVoiceUi = useCallback(() => {
    dmVoiceRecordingRef.current = false
    dmVoiceLockedRef.current = false
    dmVoicePointerIdRef.current = null
    dmVoiceStartXYRef.current = null
    setDmRecording(false)
    setDmVoiceLocked(false)
    setDmVoiceCancelArmed(false)
    setDmVoiceHint('none')
    setDmVoiceSeconds(0)
    stopDmVoiceMeter()
    clearDmVoiceTimers()
  }, [stopDmVoiceMeter, clearDmVoiceTimers])

  const stopDmVoiceTracks = useCallback(() => {
    const stream = dmVoiceStreamRef.current
    dmVoiceStreamRef.current = null
    if (stream) {
      try { stream.getTracks().forEach(t => t.stop()) } catch { /* ignore */ }
    }
  }, [])

  /** وەک واتساپ: action=send → ناردن؛ discard → پەشیمانبوونەوە */
  const finishDmVoiceRecording = useCallback((action: 'send' | 'discard') => {
    const recorder = dmMediaRecorderRef.current
    if (!recorder) {
      resetDmVoiceUi()
      stopDmVoiceTracks()
      return
    }
    dmVoiceDiscardRef.current = action === 'discard'
    try {
      if (recorder.state === 'recording') recorder.requestData()
    } catch { /* ignore */ }
    try {
      if (recorder.state !== 'inactive') recorder.stop()
    } catch { /* ignore */ }
    resetDmVoiceUi()
  }, [resetDmVoiceUi, stopDmVoiceTracks])

  const startDmVoiceRecording = useCallback(async () => {
    const myUid = userIdRef.current
    const myName = userProfileRef.current?.name ?? FALLBACK_PROFILE.name
    const partner = activeDmPartner
    if (!myUid || !partner || dmVoiceRecordingRef.current) return
    if (blockedUidsRef.current.has(partner.uid)) {
      showGameAlert({ message: '🚫 نامە ناردن ڕێگەپێنەدراوە — یەکێکتان بلۆک کراوە' })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      })
      dmVoiceStreamRef.current = stream

      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ]
      const mime = mimeCandidates.find(t => {
        try { return MediaRecorder.isTypeSupported(t) } catch { return false }
      }) || ''

      const recorderOpts: MediaRecorderOptions = {}
      if (mime) recorderOpts.mimeType = mime
      recorderOpts.audioBitsPerSecond = 128_000
      let recorder: MediaRecorder
      try {
        recorder = new MediaRecorder(stream, recorderOpts)
      } catch {
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      }

      const partnerUid = partner.uid
      const partnerName = partner.name
      dmAudioChunksRef.current = []
      dmVoiceDiscardRef.current = false
      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) dmAudioChunksRef.current.push(e.data)
      }

      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (AC) {
          const audioCtx = new AC()
          const source = audioCtx.createMediaStreamSource(stream)
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 128
          analyser.smoothingTimeConstant = 0.4
          source.connect(analyser)
          dmVoiceAudioCtxRef.current = audioCtx
          dmVoiceAnalyserRef.current = analyser
          const data = new Uint8Array(analyser.frequencyBinCount)
          const tick = () => {
            const a = dmVoiceAnalyserRef.current
            if (!a) return
            a.getByteFrequencyData(data)
            const bars = 28
            const step = Math.max(1, Math.floor(data.length / bars))
            const next: number[] = []
            for (let i = 0; i < bars; i++) {
              let sum = 0
              for (let j = 0; j < step; j++) sum += data[i * step + j] || 0
              const avg = sum / step / 255
              next.push(Math.max(0.08, Math.min(1, avg * 1.45)))
            }
            setDmVoiceLevels(next)
            dmVoiceRafRef.current = requestAnimationFrame(tick)
          }
          dmVoiceRafRef.current = requestAnimationFrame(tick)
        }
      } catch { /* ignore meter */ }

      recorder.onstop = () => {
        const discard = dmVoiceDiscardRef.current
        dmVoiceDiscardRef.current = false
        stopDmVoiceMeter()
        stopDmVoiceTracks()
        const chunks = dmAudioChunksRef.current.slice()
        dmAudioChunksRef.current = []
        dmMediaRecorderRef.current = null
        clearDmVoiceTimers()

        if (discard) return

        const blobType = recorder.mimeType || mime || 'audio/webm'
        const blob = new Blob(chunks, { type: blobType })
        if (blob.size < 200) return

        const localUrl = URL.createObjectURL(blob)
        dmVoiceLocalUrlsRef.current.add(localUrl)
        const now = Date.now()
        const tempId = `optimistic:${now}:${Math.random().toString(36).slice(2, 9)}`
        const recipientOnline = onlinePlayersRef.current.get(partnerUid)?.isOnline === true
        const optimisticAudio: DmMessage = {
          id: tempId,
          from: myUid,
          text: '',
          kind: 'audio',
          mediaUrl: localUrl,
          createdAtMs: now,
          status: recipientOnline ? 'delivered' : 'sent',
          deliveredAt: recipientOnline ? now : null,
          seenAt: null,
          hiddenFor: [],
          clientTempId: tempId,
        }
        setDmMessages(prev => [...prev, optimisticAudio].slice(-100))
        setDmThreads(prev => bumpDmThreadPreview(prev, myUid, partnerUid, partnerName, '🎤 نامەی دەنگی', now))

        // ناردن لە پاشخان — UI دەستبەجێ
        void (async () => {
          try {
            const threadId = [myUid, partnerUid].sort().join('_')
            const ext = blobType.includes('mp4') ? 'm4a' : blobType.includes('ogg') ? 'ogg' : 'webm'
            let mediaUrl = await uploadDmMediaWithProgress(threadId, `voice.${ext}`, blob, blobType)
            if (!mediaUrl) {
              if (blob.size > 1_200_000) throw new Error('دەنگەکە زۆر درێژە')
              mediaUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(new Error('read'))
                reader.readAsDataURL(blob)
              })
            }
            await sendPrivateMessage(myUid, myName, partnerUid, partnerName, '', {
              kind: 'audio',
              mediaUrl,
              recipientOnline,
              clientTempId: tempId,
              skipBlockCheck: true,
            })
          } catch (err) {
            setDmMessages(prev => prev.filter(m => m.id !== tempId))
            try { URL.revokeObjectURL(localUrl) } catch { /* ignore */ }
            dmVoiceLocalUrlsRef.current.delete(localUrl)
            showGameAlert({ message: err instanceof Error ? err.message : '❌ نەتوانرا نامەی دەنگی بنێردرێت' })
          }
        })()
      }

      dmMediaRecorderRef.current = recorder
      recorder.start(250)
      dmVoiceRecordingRef.current = true
      dmVoiceLockedRef.current = false
      setDmRecording(true)
      setDmVoiceLocked(false)
      setDmVoiceCancelArmed(false)
      setDmVoiceHint('none')
      setDmVoiceSeconds(0)

      const startedAt = Date.now()
      dmVoiceTickRef.current = window.setInterval(() => {
        setDmVoiceSeconds(Math.floor((Date.now() - startedAt) / 1000))
      }, 250)

      // ٦٠ چرکە — وەک سنووری واتساپـی کورتی یاری
      dmVoiceMaxTimerRef.current = window.setTimeout(() => {
        if (dmMediaRecorderRef.current === recorder && recorder.state === 'recording') {
          finishDmVoiceRecording('send')
        }
      }, 60_000)

      const pending = dmVoicePendingActionRef.current
      dmVoicePendingActionRef.current = 'none'
      if (pending === 'discard') {
        finishDmVoiceRecording('discard')
      } else if (pending === 'send') {
        finishDmVoiceRecording('send')
      }
    } catch {
      dmVoicePendingActionRef.current = 'none'
      resetDmVoiceUi()
      stopDmVoiceTracks()
      showGameAlert({ message: '❌ مۆڵەتی مایکرۆفۆن نەدرا' })
    }
  }, [activeDmPartner, showGameAlert, stopDmVoiceMeter, stopDmVoiceTracks, clearDmVoiceTimers, resetDmVoiceUi, finishDmVoiceRecording])

  const handleDmVoicePointerDown = useCallback((e: React.PointerEvent) => {
    if (dmVoiceRecordingRef.current || dmSendingMedia) return
    e.preventDefault()
    e.stopPropagation()
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* ignore */ }
    dmVoicePointerIdRef.current = e.pointerId
    dmVoiceStartXYRef.current = { x: e.clientX, y: e.clientY }
    dmVoicePendingActionRef.current = 'none'
    void startDmVoiceRecording()
  }, [dmSendingMedia, startDmVoiceRecording])

  const handleDmVoicePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dmVoiceRecordingRef.current || dmVoiceLockedRef.current) return
    if (dmVoicePointerIdRef.current != null && e.pointerId !== dmVoicePointerIdRef.current) return
    const start = dmVoiceStartXYRef.current
    if (!start) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    // RTL: خلیسکاندن بۆ ڕاست/چەپ بۆ پەشیمانبوونەوە؛ سەرەوە بۆ قفڵ
    const cancel = Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy)
    const lock = dy < -56 && Math.abs(dy) > Math.abs(dx)
    setDmVoiceCancelArmed(cancel)
    setDmVoiceHint(cancel ? 'cancel' : lock ? 'lock' : 'none')
  }, [])

  const handleDmVoicePointerUp = useCallback((e: React.PointerEvent) => {
    if (dmVoicePointerIdRef.current != null && e.pointerId !== dmVoicePointerIdRef.current) return
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* ignore */ }

    const start = dmVoiceStartXYRef.current
    const dx = start ? e.clientX - start.x : 0
    const dy = start ? e.clientY - start.y : 0
    const cancel = Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy)
    const lock = dy < -56 && Math.abs(dy) > Math.abs(dx)

    // هێشتا مایک دەستپێنەکراوە — کردار دوای دەستپێکردن
    if (!dmVoiceRecordingRef.current) {
      dmVoicePendingActionRef.current = cancel ? 'discard' : (lock ? 'none' : 'send')
      if (lock) {
        // قفڵ دوای دەستپێکردن
        dmVoicePendingActionRef.current = 'none'
        const waitLock = window.setInterval(() => {
          if (!dmVoiceRecordingRef.current) return
          window.clearInterval(waitLock)
          dmVoiceLockedRef.current = true
          setDmVoiceLocked(true)
        }, 40)
        window.setTimeout(() => window.clearInterval(waitLock), 2000)
      }
      return
    }

    if (dmVoiceLockedRef.current) return

    if (lock) {
      dmVoiceLockedRef.current = true
      setDmVoiceLocked(true)
      setDmVoiceCancelArmed(false)
      setDmVoiceHint('none')
      dmVoicePointerIdRef.current = null
      return
    }
    finishDmVoiceRecording(cancel ? 'discard' : 'send')
  }, [finishDmVoiceRecording])

  const handleDmVoicePointerCancel = useCallback(() => {
    if (dmVoiceLockedRef.current) return
    if (!dmVoiceRecordingRef.current) {
      dmVoicePendingActionRef.current = 'discard'
      return
    }
    finishDmVoiceRecording('discard')
  }, [finishDmVoiceRecording])

  const handleDmVoiceLock = useCallback(() => {
    if (!dmVoiceRecordingRef.current) return
    dmVoiceLockedRef.current = true
    setDmVoiceLocked(true)
    setDmVoiceCancelArmed(false)
    setDmVoiceHint('none')
  }, [])

  const handleDmVoiceTrash = useCallback(() => {
    finishDmVoiceRecording('discard')
  }, [finishDmVoiceRecording])

  const handleDmVoiceSendLocked = useCallback(() => {
    finishDmVoiceRecording('send')
  }, [finishDmVoiceRecording])

  /** کۆنی toggle — کاتێک قفڵ کراوە وەک stop/send */
  const handleToggleDmVoice = useCallback(() => {
    if (dmVoiceRecordingRef.current) {
      finishDmVoiceRecording(dmVoiceLockedRef.current ? 'send' : 'discard')
      return
    }
    void startDmVoiceRecording()
  }, [finishDmVoiceRecording, startDmVoiceRecording])

  const copyPlayerId = useCallback(() => {

    const id = userProfileRef.current?.playerId ?? ''

    if (!id) return

    const markCopied = () => {
      setIdCopiedFlash(true)
      if (idCopiedTimerRef.current) window.clearTimeout(idCopiedTimerRef.current)
      idCopiedTimerRef.current = window.setTimeout(() => {
        setIdCopiedFlash(false)
        idCopiedTimerRef.current = null
      }, 30_000)
    }

    const fallbackCopy = (): boolean => {
      try {
        const ta = document.createElement('textarea')
        ta.value = id
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.top = '0'
        ta.style.left = '0'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        ta.setSelectionRange(0, id.length)
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        return ok
      } catch {
        return false
      }
    }

    const finish = (ok: boolean) => {
      if (ok) markCopied()
      else showGameAlert({ message: '❌ نەتوانرا ID کۆپی بکرێت' })
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        finish(true)
      }).catch(() => {
        finish(fallbackCopy())
      })
      return
    }

    finish(fallbackCopy())

  }, [showGameAlert])

  const finishHackSteal = useCallback(async (victimUid: string, victimName: string, heistId: string, mode: 'online' | 'offline') => {

    const myUid = userIdRef.current

    // UI دابخە بەڵام heist هێشتا لە سێرڤەر — لە شکستدا cancel
    setActiveHack(null)

    activeHackRef.current = null

    if (hackIntervalRef.current) {

      clearInterval(hackIntervalRef.current)

      hackIntervalRef.current = null

    }

    if (heistUnsubRef.current) {
      try { heistUnsubRef.current() } catch { /* ignore */ }
      heistUnsubRef.current = null
    }

    if (!myUid) return

    if (mode === 'offline' && onlinePlayersRef.current.get(victimUid)?.isOnline === true) {

      try { await cancelHeist(myUid, heistId, 'online') } catch { /* ignore */ }

      showGameAlert({ message: '💰 دزی هەڵوەشایەوە — یاریزانەکە هاتە سەر خەت' })

      return

    }

    try {

      const result = await completeSteal(myUid, victimUid, { heistId, mode })

      if (result.success) {

        setWalletAndSync(prev => ({

          ...prev,

          gold: prev.gold + result.goldStolen,

          diamond: prev.diamond + result.diamondStolen,

        }))

        if (result.cooldownUntilMs) setStealCooldownUntilMs(result.cooldownUntilMs)

        const parts: string[] = []

        if (result.goldStolen > 0) parts.push(`🪙 ${result.goldStolen.toLocaleString()} زێڕ`)

        if (result.diamondStolen > 0) parts.push(`💎 ${result.diamondStolen.toLocaleString()} ئەڵماس`)

        logActivity('confront', `دزی لە ${victimName} — ${parts.join(' + ')}`, '🥷')

        showGameAlert({ message: `💰 سەرکەوتوو بوویت!\n${parts.join('\n')}\nلە ${victimName} دزیت!\nCooldown: ٦ کاتژمێر` })

      } else {

        // دزی سەرنەکەوت — هەڵوەشاندن بۆ پاککردنەوەی incomingHeistی قوربانی
        try { await cancelHeist(myUid, heistId, 'abort') } catch { /* ignore */ }

        showGameAlert({ message: `❌ نەتوانرا! ${result.reason || `${victimName} پارێزراوە.`}` })

      }

    } catch (err) {

      try { await cancelHeist(myUid, heistId, 'abort') } catch { /* ignore */ }

      showGameAlert({ message: err instanceof Error ? err.message : '❌ هەڵەیەک ڕوویدا' })

    }

  }, [logActivity, setWalletAndSync])

  const abortActiveHeist = useCallback(async (reason: 'online' | 'timeout' | 'abort' = 'abort') => {
    const cur = activeHackRef.current
    const myUid = userIdRef.current
    setActiveHack(null)
    activeHackRef.current = null
    if (hackIntervalRef.current) {
      clearInterval(hackIntervalRef.current)
      hackIntervalRef.current = null
    }
    if (myUid && cur?.heistId) {
      try { await cancelHeist(myUid, cur.heistId, reason) } catch { /* ignore */ }
    }
  }, [])

  const startStealHack = useCallback(async (uid: string, name: string, mode: 'online' | 'offline') => {

    const myUid = userIdRef.current

    if (!myUid) return

    if (activeHackRef.current) {

      showGameAlert({ message: '🥷 پێشتر دزییەک لە جێبەجێکردندایە' })

      return

    }

    if (stealCooldownUntilMs > Date.now()) {
      const leftMin = Math.ceil((stealCooldownUntilMs - Date.now()) / 60_000)
      showGameAlert({ message: `⏳ دوای دزی سەرکەوتوو ناتوانیت تا ${leftMin} خولەک بدزیتەوە (٦ کاتژمێر)` })
      return
    }

    const isOnline = onlinePlayersRef.current.get(uid)?.isOnline === true
    if (mode === 'offline' && isOnline) {
      showGameAlert({ message: '💰 ئەم یاریزانە ئێستا ئۆنلاینە — دزیی ئۆنلاین هەڵبژێرە' })
      return
    }
    if (mode === 'online' && !isOnline) {
      showGameAlert({ message: '💰 ئەم یاریزانە ئۆفلاینە — دزیی ئۆفلاین هەڵبژێرە' })
      return
    }

    setStealWarningTarget(null)

    try {
      const started = await startHeist(myUid, uid, name, mode)
      const hack = {
        victimUid: uid,
        victimName: name,
        endsAtMs: started.expiresAtMs,
        heistId: started.heistId,
        mode,
      }
      activeHackRef.current = hack
      setActiveHack(hack)
      setHackSecondsLeft(Math.ceil((started.expiresAtMs - Date.now()) / 1000))
      setActiveSheet(null)

      // گوێگرتن لە ڕەتکردنەوە / هەڵوەشاندن
      if (heistUnsubRef.current) { try { heistUnsubRef.current() } catch { /* ignore */ } }
      heistUnsubRef.current = subscribeToHeistSession(started.heistId, session => {
        if (!session) return
        if (session.status === 'rejected') {
          if (heistUnsubRef.current) { try { heistUnsubRef.current() } catch { /* ignore */ } }
          heistUnsubRef.current = null
          // قوربانی پێشتر ڕەتی کردووە — تەنها UI پاک بکە (cancel دووبارە مەکە)
          setActiveHack(null)
          activeHackRef.current = null
          if (hackIntervalRef.current) {
            clearInterval(hackIntervalRef.current)
            hackIntervalRef.current = null
          }
          showGameAlert({ message: '🛡️ قوربانی دزییەکەی ڕەتکردەوە — قەڵغانی ٢٤ کاتژمێری وەرگرت' })
        } else if (session.status === 'cancelled' || session.status === 'expired') {
          if (heistUnsubRef.current) { try { heistUnsubRef.current() } catch { /* ignore */ } }
          heistUnsubRef.current = null
          setActiveHack(null)
          activeHackRef.current = null
          if (hackIntervalRef.current) {
            clearInterval(hackIntervalRef.current)
            hackIntervalRef.current = null
          }
          showGameAlert({ message: '💰 دزی هەڵوەشایەوە' })
        } else if (session.status === 'completed') {
          if (heistUnsubRef.current) { try { heistUnsubRef.current() } catch { /* ignore */ } }
          heistUnsubRef.current = null
        }
      })

      if (hackIntervalRef.current) clearInterval(hackIntervalRef.current)

      hackIntervalRef.current = setInterval(() => {
        const cur = activeHackRef.current
        if (!cur) return

        if (cur.mode === 'offline' && onlinePlayersRef.current.get(cur.victimUid)?.isOnline === true) {
          void abortActiveHeist('online')
          showGameAlert({ message: '💰 دزی هەڵوەشایەوە — یاریزانەکە هاتە سەر خەت' })
          return
        }

        const left = Math.max(0, Math.ceil((cur.endsAtMs - Date.now()) / 1000))
        setHackSecondsLeft(left)
      }, 250)
    } catch (err) {
      showGameAlert({ message: err instanceof Error ? err.message : '❌ نەتوانرا دزی دەستپێبکرێت' })
    }

  }, [finishHackSteal, abortActiveHeist, stealCooldownUntilMs])

  const handleStealMoneyFromPlayer = useCallback((uid: string, name: string) => {

    if (activeHackRef.current) {

      showGameAlert({ message: '🥷 پێشتر دزییەک لە جێبەجێکردندایە' })

      return

    }

    if (stealCooldownUntilMs > Date.now()) {
      const leftMin = Math.ceil((stealCooldownUntilMs - Date.now()) / 60_000)
      showGameAlert({ message: `⏳ ناتوانیت بدزیت — ${leftMin} خولەک ماوە (Cooldown ٦ کاتژمێر)` })
      return
    }

    const isOnline = onlinePlayersRef.current.get(uid)?.isOnline === true
    setStealWarningTarget({ uid, name, mode: isOnline ? 'online' : 'offline' })

  }, [stealCooldownUntilMs])

  const handleGyroHeistSuccess = useCallback(() => {
    const cur = activeHackRef.current
    if (!cur) return
    void finishHackSteal(cur.victimUid, cur.victimName, cur.heistId, cur.mode)
  }, [finishHackSteal])

  const handleGyroHeistCancel = useCallback(() => {
    void abortActiveHeist('abort')
  }, [abortActiveHeist])

  const handleGyroHeistExpired = useCallback(() => {
    void abortActiveHeist('timeout')
    showGameAlert({ message: '⏳ کاتی دزی تەواو بوو' })
  }, [abortActiveHeist])

  const handleRejectIncomingHeist = useCallback(async () => {
    const myUid = userIdRef.current
    const alert = incomingHeistAlert
    if (!myUid || !alert) return
    try {
      await rejectHeist(myUid, alert.heistId)
      setIncomingHeistAlert(null)
      showGameAlert({ message: '🛡️ دزی ڕەتکرا — قەڵغانی پاراستنی ٢٤ کاتژمێرت وەرگرت' })
    } catch (err) {
      showGameAlert({ message: err instanceof Error ? err.message : '❌ ڕەتکردنەوە سەرنەکەوت' })
    }
  }, [incomingHeistAlert])

  const handleAcceptIncomingHeist = useCallback(async () => {
    const myUid = userIdRef.current
    const alert = incomingHeistAlert
    if (!myUid || !alert) return
    try {
      await acceptHeist(myUid, alert.heistId)
      setIncomingHeistAlert(null)
    } catch (err) {
      showGameAlert({ message: err instanceof Error ? err.message : '❌ هەڵە' })
    }
  }, [incomingHeistAlert])

  const handleNotificationClick = useCallback((n: InboxNotification) => {

    markNotifRead(n.id)

    if (n.kind === 'heist' && n.heistId && !n.heistResolved) {
      const live = liveIncomingHeistRef.current
      const expiresAtMs = live?.heistId === n.heistId
        ? live.expiresAtMs
        : (Number(n.atMs) || Date.now()) + STEAL_HEIST_TIMEOUT_MS
      setIncomingHeistAlert({
        heistId: n.heistId,
        thiefUid: n.fromUid || live?.thiefUid || '',
        thiefName: n.fromName || live?.thiefName || 'یاریزان',
        mode: n.heistMode === 'online' || live?.mode === 'online' ? 'online' : 'offline',
        expiresAtMs,
      })
      return
    }

    if (n.kind === 'message' && n.threadPartnerUid) {

      handleSendMessageToPlayer(n.threadPartnerUid, n.fromName || 'یاریزان')

      return

    }

    if (n.kind === 'friend_request') {

      setFriendsTab('requests')

      openPrivateSheet('friends')

      return

    }

    if (n.kind === 'gift') {

      openPrivateSheet('gifts')

      return

    }

  }, [markNotifRead, handleSendMessageToPlayer, openPrivateSheet])

  const handleRevengeSteal = useCallback(async (n: InboxNotification, e: { stopPropagation: () => void }) => {

    e.stopPropagation()

    markNotifRead(n.id)

    if (!n.fromUid || n.revengeClaimed) return

    if (Date.now() - (n.atMs || 0) > STEAL_SHIELD_MS) {
      showGameAlert({ message: '⏳ کاتی تۆڵەسەندنەوە تەواو بوو (٢٤ کاتژمێر)' })
      return
    }

    const myUid = userIdRef.current

    if (!myUid) return

    const goldBase = Number(n.goldAmount) || 0

    const diamondBase = Number(n.diamondAmount) || 0

    if (goldBase <= 0 && diamondBase <= 0) {

      showGameAlert({ message: 'بڕی تۆڵە بەردەست نییە لەم ئاگادارییەدا' })

      return

    }

    try {

      const result = await claimRevengeSteal(myUid, n.fromUid, n.id, goldBase, diamondBase)

      setWallet(prev => ({

        ...prev,

        gold: prev.gold + result.goldStolen,

        diamond: prev.diamond + result.diamondStolen,

      }))

      logActivity('confront', `تۆڵەی ٢x لە ${n.fromName || 'دز'} — 🪙${result.goldStolen} 💎${result.diamondStolen}`, '⚡')

      showGameAlert({ message: `⚡ تۆڵەسەندنەوە سەرکەوتوو!\n🪙 ${result.goldStolen.toLocaleString()} زێڕ\n💎 ${result.diamondStolen.toLocaleString()} ئەڵماس` })

    } catch (err) {

      showGameAlert({ message: err instanceof Error ? err.message : '❌ تۆڵە سەرنەکەوت' })

    }

  }, [markNotifRead, logActivity])

  const handleFightWithPlayer = useCallback(async (uid: string, name: string) => {

    if (onlinePlayersRef.current.get(uid)?.isOnline !== true) {

      showGameAlert({ message: '⚔️ شەڕکردن تەنها کاتێک یاریزان ئۆنلاین بێت' })

      return

    }

    if (fightBanUntilMs > Date.now()) {

      showGameAlert({ message: '💥 تۆ قەدەغەی شەڕت هەیە بۆ ٢٤ کاتژمێر (دوای دۆڕان)' })

      return

    }

    if (activeHack) {

      showGameAlert({ message: '🥷 لە کاتی هەکدا ناتوانیت شەڕ بکەیت' })

      return

    }

    if (arenaSession || outgoingChallenge || challengeBusy) {

      showGameAlert({ message: '⚔️ پێشتر شەڕ/داواکارییەک لە جێبەجێکردندایە' })

      return

    }

    const blockUntil = getChallengeBlockUntil(fightChallengeLog, uid)

    if (blockUntil > Date.now()) {

      showGameAlert({ message: 'بۆ ٢٤ کاتژمێر ناتوانیت داواکاری شەڕ بۆ ئەم کەسە بنێریت' })

      return

    }

    const myUid = userIdRef.current

    const myName = userProfileRef.current?.name || 'یاریزان'

    if (!myUid) return

    setChallengeBusy(true)

    setActiveSheet(null)

    try {

      const res = await sendFightChallenge(myUid, myName, uid, name)

      outgoingChallengeRef.current = res.duelId

      setOutgoingChallenge({ duelId: res.duelId, name, expiresAtMs: res.expiresAtMs })

      showGameAlert({ message: `⚔️ داواکاری شەڕ نێردرا — ١٥ چرکە چاوەڕوانی قبوڵکردن\nباقی: ${res.remainingRequests} داواکاری` })

    } catch (err) {

      showGameAlert({ message: err instanceof Error ? err.message : '❌ نەتوانرا داواکاری شەڕ بنێردرێت' })

    } finally {

      setChallengeBusy(false)

    }

  }, [fightBanUntilMs, activeHack, arenaSession, outgoingChallenge, challengeBusy, fightChallengeLog])

  const handleRespondFightChallenge = useCallback(async (accept: boolean) => {

    if (!incomingChallenge || challengeBusy) return

    setChallengeBusy(true)

    try {

      const res = await respondFightChallenge(incomingChallenge.duelId, userIdRef.current || '', accept)

      setIncomingChallenge(null)

      if (res.status === 'active') {

        setArenaSession({ duelId: incomingChallenge.duelId, mode: 'fighter' })

        setSelfMapFx(prev => ({ ...prev, activeDuelId: incomingChallenge.duelId, duelFxUntilMs: Date.now() + 5 * 60_000 }))

      } else if (!accept) {

        showGameAlert({ message: 'ڕەتکرایەوە — داواکار بۆ ٢٤ کاتژمێر بۆ تۆ قەدەغە دەبێت' })

      }

    } catch (err) {

      showGameAlert({ message: err instanceof Error ? err.message : '❌ هەڵەیەک ڕوویدا' })

    } finally {

      setChallengeBusy(false)

    }

  }, [incomingChallenge, challengeBusy])

  const clearDuelMapFx = useCallback(() => {

    setSelfMapFx(prev => ({ ...prev, activeDuelId: null, duelFxUntilMs: 0 }))

    const uid = userIdRef.current

    if (uid) void updatePlayerMapFx(uid, { activeDuelId: null, duelFxUntilMs: 0 })

    selfIconSigRef.current = ''

    updateUserMarkerIcon()

  }, [updateUserMarkerIcon])

  const handleArenaSettled = useCallback((info: {

    goldAmount: number

    iAmWinner: boolean

    iAmLoser: boolean

    isDraw: boolean

    smokeUntilMs: number

    loserBanUntilMs: number

  }) => {

    if (info.iAmWinner && info.goldAmount > 0) {

      setWallet(prev => ({ ...prev, gold: prev.gold + info.goldAmount }))

      logActivity('confront', `ئارێنای ١v١ — سەرکەوتن (+${info.goldAmount.toLocaleString()} زێڕ)`, '⚔️')

    } else if (info.iAmLoser) {

      setWallet(prev => ({ ...prev, gold: Math.max(0, prev.gold - info.goldAmount) }))

      setFightBanUntilMs(info.loserBanUntilMs)

      setSelfMapFx(prev => ({

        ...prev,

        smokeUntilMs: info.smokeUntilMs || Date.now() + FIGHT_SMOKE_MS,

        activeDuelId: null,

        duelFxUntilMs: 0,

      }))

      logActivity('confront', `ئارێنای ١v١ — دۆڕان (−${info.goldAmount.toLocaleString()} زێڕ)`, '💥')

    } else if (info.isDraw) {

      logActivity('confront', 'ئارێنای ١v١ — یەکسان', '🤝')

    }

    clearDuelMapFx()

  }, [logActivity, clearDuelMapFx])

  // ── Firebase Auth & Firestore ──────────────────────────────────────────────

  useEffect(() => {

    let cancelled = false

    userProfileRef.current = FALLBACK_PROFILE

    const hydrateFromSnapshot = (uid: string, data: {
      gold: number
      diamond: number
      isPremium: boolean
      playerLevel: number
      playerXp: number
      hunterLevel: number
      name: string
      username: string
      email?: string
      phone?: string
      usernameEditUsed?: boolean
      emailEditUsed?: boolean
      phoneEditUsed?: boolean
      gender: 'male' | 'female'
      title: string
      avatarUrl: string | null
      avatar3d: typeof DEFAULT_AVATAR_3D
      inventory?: InventoryItem[]
      dropsOpenedByType: typeof EMPTY_DROPS_OPENED
      welcomeBonusGranted?: boolean
      settings?: UserProfile['settings']
      stats?: UserProfile['stats']
      playerId?: string
      dailyBonusDay?: number
      dailyBonusLastClaimMs?: number | null
      spinLastFreeAtMs?: number | null
      spinSpinsInWindow?: number
      readNotificationIds?: string[]
      createdAtMs?: number | null
      giftsSentScore?: number
    }) => {
      const locked = getLockedIdentity(uid) ?? (isRegistrationInflight() ? peekRegistrationIntent() : null)
      const dataWithLock = locked
        ? applyLockedIdentity(uid, {
            ...data,
            name: locked.name || data.name,
            username: locked.username || data.username,
            email: locked.email || data.email || '',
            phone: locked.phone || data.phone || '',
            gender: locked.gender || data.gender,
            createdAtMs: data.createdAtMs ?? locked.createdAtMs ?? null,
          })
        : data
      const wallet = clampWalletToCap({
        gold: dataWithLock.gold,
        diamond: dataWithLock.diamond,
      })
      const prev = userProfileRef.current ?? FALLBACK_PROFILE
      const nextName = (typeof dataWithLock.name === 'string' && dataWithLock.name.trim() && dataWithLock.name.trim() !== 'یاریزان')
        ? dataWithLock.name.trim()
        : (prev.name && prev.name !== 'یاریزان' ? prev.name : (dataWithLock.name || prev.name || 'یاریزان'))
      const nextUsername = (typeof dataWithLock.username === 'string' && dataWithLock.username.trim())
        ? dataWithLock.username.trim()
        : (prev.username || '')
      const nextEmail = (typeof dataWithLock.email === 'string' && dataWithLock.email.trim())
        ? dataWithLock.email.trim()
        : (prev.email || '')
      const nextPhone = (typeof dataWithLock.phone === 'string' && dataWithLock.phone.trim())
        ? dataWithLock.phone.trim()
        : (prev.phone || '')
      const profile: UserProfile = {
        ...prev,
        name: nextName,
        username: nextUsername,
        email: nextEmail,
        phone: nextPhone,
        usernameEditUsed: dataWithLock.usernameEditUsed === true || prev.usernameEditUsed === true,
        emailEditUsed: dataWithLock.emailEditUsed === true || prev.emailEditUsed === true,
        phoneEditUsed: dataWithLock.phoneEditUsed === true || prev.phoneEditUsed === true,
        gender: dataWithLock.gender === 'female' || dataWithLock.gender === 'male' ? dataWithLock.gender : prev.gender,
        ...wallet,
        isPremium: dataWithLock.isPremium,
        title: dataWithLock.title || HUNTER_ROLE_NAME,
        avatarUrl: dataWithLock.avatarUrl,
        avatar3d: dataWithLock.avatar3d ?? { ...DEFAULT_AVATAR_3D },
        playerId: dataWithLock.playerId ?? prev.playerId ?? '',
        settings: dataWithLock.settings ?? prev.settings ?? { ...DEFAULT_USER_SETTINGS },
        stats: dataWithLock.stats ?? prev.stats ?? { ...DEFAULT_PLAYER_STATS },
        dropsOpenedByType: dataWithLock.dropsOpenedByType ?? { ...EMPTY_DROPS_OPENED },
        hunterLevel: dataWithLock.hunterLevel,
        playerLevel: dataWithLock.playerLevel,
        playerXp: dataWithLock.playerXp,
        welcomeBonusGranted: dataWithLock.welcomeBonusGranted !== false,
        createdAtMs: dataWithLock.createdAtMs !== undefined && dataWithLock.createdAtMs != null
          ? dataWithLock.createdAtMs
          : (prev.createdAtMs ?? null),
        giftsSentScore: Math.max(0, Math.floor(Number(dataWithLock.giftsSentScore ?? prev.giftsSentScore) || 0)),
      }
      userProfileRef.current = profile
      setUserProfile(profile)
      setWallet({
        diamond: wallet.diamond,
        gold: wallet.gold,
        isPremium: dataWithLock.isPremium,
      })
      if (Array.isArray(dataWithLock.inventory)) {
        setBoughtItems(dataWithLock.inventory)
      }

      // Daily bonus + spin cooldowns must hydrate immediately (not wait for subscribe)
      if (dataWithLock.dailyBonusLastClaimMs !== undefined) {
        setDailyBonusLastClaimMs(parseEpochMs(dataWithLock.dailyBonusLastClaimMs) ?? dataWithLock.dailyBonusLastClaimMs)
      }
      {
        const lastMs = dataWithLock.dailyBonusLastClaimMs !== undefined
          ? (parseEpochMs(dataWithLock.dailyBonusLastClaimMs) ?? dataWithLock.dailyBonusLastClaimMs)
          : null
        const resolvedDay = resolveDailyBonusStreakDay(
          dataWithLock.dailyBonusDay != null ? Number(dataWithLock.dailyBonusDay) || 1 : 1,
          lastMs,
          Date.now(),
        )
        setDailyBonusDay(resolvedDay)
        setDailyBonusViewDay(resolvedDay)
        if (
          resolvedDay === 1
          && (Number(dataWithLock.dailyBonusDay) || 1) !== 1
          && isDailyBonusStreakBroken(lastMs, Date.now())
        ) {
          persistDailyBonusStreakReset(uid, typeof dataWithLock.playerId === 'string' ? dataWithLock.playerId : undefined).catch(() => {})
        }
      }
      const spinState = getSpinWindowState({
        spinLastFreeAtMs: dataWithLock.spinLastFreeAtMs ?? null,
        spinSpinsInWindow: dataWithLock.spinSpinsInWindow ?? 0,
      })
      // Prefer Firestore; fall back to legacy localStorage only if remote has never spun
      if (dataWithLock.spinLastFreeAtMs != null || (dataWithLock.spinSpinsInWindow != null && dataWithLock.spinSpinsInWindow > 0)) {
        setDailySpinSpinsToday(spinState.spinsToday)
      } else {
        const localSpin = loadDailySpinState(uid)
        if (localSpin.spinsToday > 0) {
          setDailySpinSpinsToday(localSpin.spinsToday)
          // Migrate legacy local free-spin usage into Firestore (lock free for 24h from now)
          recordDailySpin(uid, {
            wasFree: true,
            spinsInWindow: localSpin.spinsToday,
            lastFreeAtMs: Date.now(),
          }).catch(() => {})
        } else {
          setDailySpinSpinsToday(0)
        }
      }
      if (Array.isArray(dataWithLock.readNotificationIds) && dataWithLock.readNotificationIds.length > 0) {
        const localRead = loadReadNotificationIds(uid)
        const merged = new Set([...localRead, ...dataWithLock.readNotificationIds])
        setReadNotifIds(merged)
        saveReadNotificationIds(uid, merged)
      }

      saveUserDataLocal(uid, {
        playerId: profile.playerId,
        gold: wallet.gold,
        diamond: wallet.diamond,
        isPremium: dataWithLock.isPremium,
        playerLevel: dataWithLock.playerLevel,
        playerXp: dataWithLock.playerXp,
        hunterLevel: dataWithLock.hunterLevel,
        name: profile.name,
        username: profile.username,
        email: profile.email,
        phone: profile.phone,
        usernameEditUsed: profile.usernameEditUsed,
        emailEditUsed: profile.emailEditUsed,
        phoneEditUsed: profile.phoneEditUsed,
        gender: profile.gender,
        title: profile.title,
        avatarUrl: dataWithLock.avatarUrl,
        avatar3d: profile.avatar3d,
        inventory: dataWithLock.inventory,
        dropsOpenedByType: profile.dropsOpenedByType,
        welcomeBonusGranted: profile.welcomeBonusGranted,
        dailyBonusDay: dataWithLock.dailyBonusDay,
        dailyBonusLastClaimMs: dataWithLock.dailyBonusLastClaimMs,
        spinLastFreeAtMs: dataWithLock.spinLastFreeAtMs,
        spinSpinsInWindow: dataWithLock.spinSpinsInWindow,
        readNotificationIds: dataWithLock.readNotificationIds,
        createdAtMs: profile.createdAtMs,
        giftsSentScore: profile.giftsSentScore,
      })
    }

    const bootstrapAuthenticatedUser = async (uid: string) => {

      userIdRef.current = uid

      setAuthUserId(uid)
      profileHydratedRef.current = false

      // دەستبەجێ ناسنامەی فۆرم/قوفڵ — پێش چاوەڕوانی Firestore
      const intentNow = getLockedIdentity(uid) ?? (isRegistrationInflight() ? peekRegistrationIntent() : null)
      if (intentNow?.username?.trim()) {
        bindRegistrationIdentityToUid(uid, intentNow)
        hydrateFromSnapshot(uid, {
          ...FALLBACK_PROFILE,
          name: intentNow.name,
          username: intentNow.username,
          email: intentNow.email,
          phone: intentNow.phone,
          gender: intentNow.gender,
          createdAtMs: intentNow.createdAtMs ?? Date.now(),
          playerId: intentNow.playerId || '',
        })
        profileHydratedRef.current = true
        setAuthLoading(false)
      }

      // ══ بنبڕی تۆمارکردن: چاوەڕوانی ناسنامەی تەواو پێش هەر شتێک ══
      if (isRegistrationInflight() || peekPendingRegisteredProfile(uid) || intentNow?.username) {
        const registered = await waitForRegisteredIdentity(uid, 25_000)
        if (registered && registered.username?.trim()) {
          hydrateFromSnapshot(uid, registered)
          profileHydratedRef.current = true
          setAuthLoading(false)
          void repairUserIdentity(uid, {
            name: registered.name,
            username: registered.username,
            email: registered.email,
            phone: registered.phone,
            gender: registered.gender,
            playerId: registered.playerId,
          }).catch(() => {})
        }
      }

      // تۆمارکردنی تازە — داتای تۆمارکردن دەستبەجێ
      const pendingReg = peekPendingRegisteredProfile(uid)
      if (pendingReg && pendingReg.username?.trim() && !profileHydratedRef.current) {
        hydrateFromSnapshot(uid, pendingReg)
        profileHydratedRef.current = true
      }

      // Instant UI from UID / playerId local cache while Firestore loads
      const cachedByUid = loadUserDataLocal(uid)
      const cachedByPlayerId = cachedByUid?.playerId
        ? loadUserDataLocal(cachedByUid.playerId)
        : null
      const cached = cachedByPlayerId ?? cachedByUid
      // کاشی بەتاڵ/یاریزان مەنووسە بەسەر ناسنامەی تۆمارکراو
      if (cached && !isIdentityIncomplete(cached) && !pendingReg && !profileHydratedRef.current) {
        hydrateFromSnapshot(uid, cached)
        profileHydratedRef.current = true
      } else if (cached && pendingReg && pendingReg.username?.trim()) {
        hydrateFromSnapshot(uid, {
          ...cached,
          name: pendingReg.name || cached.name,
          username: pendingReg.username || cached.username,
          email: pendingReg.email || cached.email,
          phone: pendingReg.phone || cached.phone,
          gender: pendingReg.gender || cached.gender,
        })
        profileHydratedRef.current = true
      }

      // Enter map immediately — never wait on Firestore for first paint
      setAuthLoading(false)

      // Mark legacy one-shot resets as done so they never wipe accounts again
      safeLocalStorageSet(FACTORY_RESET_FLAG, '1')
      safeLocalStorageSet(ECONOMY_ZERO_RESET_FLAG, '1')

      // هەموو کارە قورسەکان لە پاشبنەما — چوونەژوورەوە نابێت چاوەڕوان بێت
      void (async () => {
        if (cancelled) return

        let didGlobalWipe = false
        try {
          const wipe = await runGlobalGameplayResetIfNeeded()
          if (wipe.ran) {
            didGlobalWipe = true
            console.info('Global gameplay reset applied', wipe)
          }
        } catch (err) {
          console.error('Global gameplay reset failed:', err)
        }
        if (cancelled) return

        // Factory reset بۆ ٣ تابـی دەوڵەمەندەکان + تەنها ٥ فەیک
        let didLbFactory = false
        try {
          const lb = await runLeaderboardFactoryResetIfNeeded()
          if (lb.ran) {
            didLbFactory = true
            console.info('Leaderboard factory reset applied', lb)
          }
        } catch (err) {
          console.error('Leaderboard factory reset failed:', err)
        }
        if (cancelled) return

        // تەنها دوای wipeی گشتی — مەسڕەوەی کاش لە هەر چوونەژوورەوەیەک
        if (didGlobalWipe) {
          try { clearLocalPlayerEconomyData(uid) } catch { /* ignore */ }
          try {
            const emptyVip = emptyVipPassesState()
            const emptySeason = emptySeasonPassState()
            setVipPasses(emptyVip)
            vipPassesRef.current = emptyVip
            saveVipPasses(uid, emptyVip)
            setSeasonPass(emptySeason)
            seasonPassRef.current = emptySeason
            saveSeasonPass(uid, emptySeason)
            npcLiveRef.current = createInitialNpcStates(NPC_COUNT)
          } catch (err) {
            console.error('Local wipe after global reset failed:', err)
          }
        } else if (didLbFactory) {
          // ٥ فەیکی نوێ لە سەرەتا
          npcLiveRef.current = createInitialNpcStates(NPC_COUNT)
        } else if (npcLiveRef.current.length !== NPC_COUNT) {
          npcLiveRef.current = createInitialNpcStates(NPC_COUNT)
        }

        // هەمیشە ئەگەر ناسنامە بەتاڵ بێت یان تۆمارکردنی تازە / wipe
        const current = userProfileRef.current
        const needProfileFetch = didGlobalWipe
          || !cached
          || Boolean(pendingReg)
          || isIdentityIncomplete(current)
          || isIdentityIncomplete(cached)
        if (needProfileFetch) {
          // دوای تۆمارکردن — چاوەڕوانی ناسنامە پێش getOrCreate
          if (isRegistrationInflight() || peekPendingRegisteredProfile(uid)) {
            const registered = await waitForRegisteredIdentity(uid, 20_000)
            if (registered && registered.username?.trim()) {
              hydrateFromSnapshot(uid, registered)
              profileHydratedRef.current = true
              setWallet({
                gold: registered.gold,
                diamond: registered.diamond,
                isPremium: registered.isPremium,
              })
            }
          }
          const PROFILE_FETCH_MS = 15_000
          let remote: Awaited<ReturnType<typeof getOrCreateUser>> | null = null
          try {
            remote = await Promise.race([
              getOrCreateUser(uid),
              new Promise<null>((resolve) => {
                window.setTimeout(() => resolve(null), PROFILE_FETCH_MS)
              }),
            ])
            if (!remote) {
              const again = peekPendingRegisteredProfile(uid) ?? loadUserDataLocal(uid)
              if (again && !isIdentityIncomplete(again)) {
                remote = again as Awaited<ReturnType<typeof getOrCreateUser>>
              } else {
                try { remote = await getOrCreateUser(uid) } catch { /* ignore */ }
              }
            }
          } catch (err) {
            console.error('getOrCreateUser failed:', err)
            remote = null
          }
          if (cancelled) return

          if (remote) {
            const pendingKeep = peekPendingRegisteredProfile(uid)
            const safeRemote = pendingKeep && pendingKeep.username?.trim()
              ? {
                  ...remote,
                  name: pendingKeep.name || remote.name,
                  username: pendingKeep.username,
                  email: pendingKeep.email || remote.email,
                  phone: pendingKeep.phone || remote.phone,
                  gender: pendingKeep.gender || remote.gender,
                }
              : remote
            // مەنووسە پرۆفایلی بەتاڵ بەسەر ناسنامەی تۆمارکراو
            if (!isIdentityIncomplete(safeRemote) || !current || isIdentityIncomplete(current)) {
              hydrateFromSnapshot(uid, safeRemote)
              profileHydratedRef.current = true
              setWallet({
                gold: safeRemote.gold,
                diamond: safeRemote.diamond,
                isPremium: safeRemote.isPremium,
              })
            }
          } else if (!cached && !pendingReg) {
            console.warn('Firestore profile timed out — continuing with local/fallback state')
          }
        }

        ensureLeaderboardEpoch(uid).catch(() => {})

        const npcSeed = npcLiveRef.current.map((n) => {
          return {
            uid: n.uid,
            index: n.index,
            name: n.name,
            gender: n.gender,
            playerLevel: n.playerLevel,
            playerXp: n.playerXp,
            hunterLevel: n.hunterLevel,
            avatarUrl: avatarForGender(n.gender),
            avatar3d: n.avatar3d,
            gold: n.gold,
            diamond: n.diamond,
            stats: n.stats,
            dropsOpenedByType: n.dropsOpenedByType,
            dailyBonusDay: n.dailyBonusDay,
            dailyBonusLastClaimMs: n.dailyBonusLastClaimMs,
            spinLastFreeAtMs: n.spinLastFreeAtMs,
            spinSpinsInWindow: n.spinSpinsInWindow,
            isOnline: n.isOnline,
            lastSeenMs: n.lastSeenMs,
          }
        })
        upsertNpcLeaderboardPresence(npcSeed).catch((err) => {
          console.error('NPC leaderboard seed failed:', err)
        })

        if (cancelled) return

        try {
          const seedKey = BOT_SEED_STORAGE_KEY
          if (!safeLocalStorageGet(seedKey)) {
            void resetMapPresenceAndSeedBots(uid)
              .then(() => safeLocalStorageSet(seedKey, '1'))
              .catch((seedErr) => console.error('Bot seed failed:', seedErr))
          }
        } catch (seedErr) {
          console.error('Bot seed failed:', seedErr)
        }

        if (cancelled) return
        updateUserMarkerIconRef.current()
      })()

    }

    // Optimistic restore — نەخشە/پرۆفایل لە کاش پێش onAuthStateChanged
    try {
      const lastUid = typeof localStorage !== 'undefined'
        ? localStorage.getItem('kd_auth_last_uid')
        : null
      const cur = auth.currentUser
      const optimisticUid = (cur && !cur.isAnonymous) ? cur.uid : lastUid
      if (optimisticUid) {
        userIdRef.current = optimisticUid
        setAuthUserId(optimisticUid)
        const cachedByUid = loadUserDataLocal(optimisticUid)
        const cachedByPlayerId = cachedByUid?.playerId
          ? loadUserDataLocal(cachedByUid.playerId)
          : null
        const cached = cachedByPlayerId ?? cachedByUid
        if (cached) {
          hydrateFromSnapshot(optimisticUid, cached)
          profileHydratedRef.current = true
        }
        setAuthLoading(false)
      }
    } catch { /* ignore */ }

    // If Firebase Auth is slow/blocked, still reveal AuthModal instead of infinite «بارکردن»
    const authSafetyTimer = window.setTimeout(() => {
      if (!cancelled) setAuthLoading(false)
    }, 2000)

    const unsub = onAuthReady(async (user) => {

      if (cancelled) return

      if (user && !user.isAnonymous) {

        try {
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('kd_auth_last_uid', user.uid)
            }
          } catch { /* ignore */ }
          await bootstrapAuthenticatedUser(user.uid)

        } catch (err) {

          console.error('Auth/Firestore init failed:', err)

          // Offline / timeout: keep UID-keyed local cache if present
          if (!cancelled && user.uid) {
            const cached = loadUserDataLocal(user.uid)
            if (cached) {
              userIdRef.current = user.uid
              setAuthUserId(user.uid)
              hydrateFromSnapshot(user.uid, cached)
              profileHydratedRef.current = true
            } else {
              userIdRef.current = user.uid
              setAuthUserId(user.uid)
            }
          }

        } finally {

          if (!cancelled) setAuthLoading(false)

        }

      } else {

        userIdRef.current = null

        setAuthUserId(null)
        profileHydratedRef.current = false
        try { clearAuthSessionHints() } catch { /* ignore */ }

        setAuthLoading(false)

      }

    })

    // کاتێک تۆمارکردن تەواو دەبێت — یوزەرنەیم/ئیمەیڵ/مۆبایل/ناو دەستبەجێ
    const onRegProfileReady = (ev: Event) => {
      if (cancelled) return
      const detail = (ev as CustomEvent<Record<string, unknown>>).detail ?? {}
      const uid = typeof detail.uid === 'string' ? detail.uid : (userIdRef.current ?? '')
      if (!uid) return

      // لە detail یان pending — تەنانەت ئەگەر take پێشتر کرابوو
      let pending = peekPendingRegisteredProfile(uid)
      if ((!pending || isIdentityIncomplete(pending)) && detail.username) {
        try {
          bindRegistrationIdentityToUid(uid, {
            name: String(detail.name ?? ''),
            username: String(detail.username ?? ''),
            email: String(detail.email ?? ''),
            phone: String(detail.phone ?? ''),
            gender: detail.gender === 'female' ? 'female' : 'male',
            playerId: typeof detail.playerId === 'string' ? detail.playerId : undefined,
            createdAtMs: typeof detail.createdAtMs === 'number' ? detail.createdAtMs : Date.now(),
          })
          pending = {
            ...(userProfileRef.current ?? FALLBACK_PROFILE),
            name: String(detail.name ?? ''),
            username: String(detail.username ?? ''),
            email: String(detail.email ?? ''),
            phone: String(detail.phone ?? ''),
            gender: detail.gender === 'female' ? 'female' : 'male',
            playerId: typeof detail.playerId === 'string' ? detail.playerId : (userProfileRef.current?.playerId ?? ''),
            gold: Number(detail.gold) || WELCOME_BONUS_GOLD,
            diamond: Number(detail.diamond) || WELCOME_BONUS_DIAMOND,
            isPremium: detail.isPremium === true,
            playerLevel: Math.max(1, Math.floor(Number(detail.playerLevel) || 1)),
            playerXp: Math.max(0, Math.floor(Number(detail.playerXp) || 0)),
            hunterLevel: Math.max(0, Math.floor(Number(detail.hunterLevel) || 0)),
            title: typeof detail.title === 'string' ? detail.title : HUNTER_ROLE_NAME,
            avatarUrl: typeof detail.avatarUrl === 'string' ? detail.avatarUrl : null,
            avatar3d: (detail.avatar3d as UserProfile['avatar3d']) ?? { ...DEFAULT_AVATAR_3D },
            createdAtMs: typeof detail.createdAtMs === 'number' ? detail.createdAtMs : Date.now(),
            giftsSentScore: Math.max(0, Math.floor(Number(detail.giftsSentScore) || 0)),
            usernameEditUsed: detail.usernameEditUsed === true,
            emailEditUsed: detail.emailEditUsed === true,
            phoneEditUsed: detail.phoneEditUsed === true,
            welcomeBonusGranted: detail.welcomeBonusGranted !== false,
          } as ReturnType<typeof peekPendingRegisteredProfile>
        } catch { /* ignore */ }
      }
      if (!pending) pending = takePendingRegisteredProfile(uid)
      if (!pending) return
      // تەنانەت بەبێ تەواوی مۆبایل — یوزەرنەیم/ناو/ئیمەیڵ دابنێ
      if (!(pending.username?.trim() || pending.email?.trim())) return

      takePendingRegisteredProfile(uid)
      userIdRef.current = uid
      setAuthUserId(uid)
      hydrateFromSnapshot(uid, pending)
      profileHydratedRef.current = true
      setAuthLoading(false)
      setWallet({
        gold: pending.gold,
        diamond: pending.diamond,
        isPremium: pending.isPremium,
      })
    }
    window.addEventListener('kd-reg-profile-ready', onRegProfileReady)

    return () => {
      cancelled = true
      window.clearTimeout(authSafetyTimer)
      window.removeEventListener('kd-reg-profile-ready', onRegProfileReady)
      unsub()
    }

  }, [])

  // ڕێکخستنەکان لە localStorage — خێرا پێش Firestore
  useEffect(() => {
    if (!authUserId) {
      settingsHydratedRef.current = false
      return
    }
    const local = loadUserSettingsLocal(authUserId)
    if (!local) return
    setSoundEnabled(local.soundEnabled)
    setSfxVolume(local.sfxVolume ?? 1)
    setHighGraphics(local.highGraphics !== false)
    setShowPlayerNames(local.showPlayerNames !== false)
    setBlockIncomingGifts(local.blockIncomingGifts === true)
    setGhostMode(local.hideLocation === true)
    setPlaneSoundEnabled(local.planeSoundEnabled !== false)
    setPlaneVolume(local.planeVolume ?? 1)
    setGiftSoundEnabled(local.giftSoundEnabled !== false)
    setGiftVolume(local.giftVolume ?? 1)
    setChestSoundEnabled(local.chestSoundEnabled !== false)
    setChestVolume(local.chestVolume ?? 1)
    setMusicEnabled(false)
    setMusicVolume(local.musicVolume ?? 0.5)
    setHideWhenOffline(local.hideWhenOffline === true)
    setHideBlockedUsers(local.hideBlockedUsers === true)
    setHideGlobalChat(local.hideGlobalChat === true)
    setAllowDmWithoutFriendship(local.allowDmWithoutFriendship !== false)
    setRadarAlertsEnabled(local.radarAlertsEnabled !== false)
    setFriendRequestNotifsEnabled(local.friendRequestNotifsEnabled !== false)
    setNotificationsEnabled(local.notificationsEnabled !== false)
    setShowOtherPlayers(local.showOtherPlayers !== false)
    setShowMyAvatarOnMap(local.showMyAvatarOnMap !== false)
    try {
      configureSfx({ muted: local.soundEnabled === false, volume: local.sfxVolume ?? 1 })
      configureSfxCategory('gift', { muted: local.giftSoundEnabled === false, volume: local.giftVolume ?? 1 })
      configureMusic({
        muted: true,
        volume: local.musicVolume ?? 0.5,
      })
      try { stopBackgroundMusic() } catch { /* ignore */ }
    } catch { /* ignore */ }
  }, [authUserId])

  // Real-time profile, wallet & inventory from Firestore

  useEffect(() => {

    if (!authUserId) return

    return subscribeToUser(authUserId, data => {

      profileHydratedRef.current = true

      // مەسڕەوەی ناسنامەی تۆمارکراو ئەگەر snapshot بەتاڵ/یاریزان بێت
      const prev = userProfileRef.current
      const pending = peekPendingRegisteredProfile(authUserId)
      const lockedId = getLockedIdentity(authUserId)
      const lockedName = (lockedId?.name?.trim() && lockedId.name !== 'یاریزان')
        ? lockedId.name.trim()
        : ((pending?.name?.trim() && pending.name !== 'یاریزان')
          ? pending.name.trim()
          : (prev?.name && prev.name !== 'یاریزان' ? prev.name : ''))
      const lockedUsername = lockedId?.username?.trim() || pending?.username?.trim() || prev?.username?.trim() || ''
      const lockedEmail = lockedId?.email?.trim() || pending?.email?.trim() || prev?.email?.trim() || ''
      const lockedPhone = lockedId?.phone?.trim() || pending?.phone?.trim() || prev?.phone?.trim() || ''

      const nextName = (data.name && data.name.trim() && data.name.trim() !== 'یاریزان')
        ? data.name.trim()
        : (lockedName || data.name || 'یاریزان')
      const nextUsername = (data.username && data.username.trim()) || lockedUsername
      const nextEmail = (data.email && data.email.trim()) || lockedEmail
      const nextPhone = (data.phone && data.phone.trim()) || lockedPhone

      // ئەگەر Firestore هێشتا بەتاڵە بەڵام ناسنامەمان هەیە — چاکی بکەرەوە و مەسڕەوە
      if ((!nextUsername || !nextEmail) && lockedUsername && lockedEmail) {
        void repairUserIdentity(authUserId, {
          name: lockedName || lockedUsername,
          username: lockedUsername,
          email: lockedEmail,
          phone: lockedPhone,
          gender: (lockedId?.gender || pending?.gender || prev?.gender || data.gender || 'male') as 'male' | 'female',
          playerId: data.playerId || prev?.playerId,
        }).catch(() => {})
      }

      if (!nextUsername && !nextEmail && lockedUsername) {
        return
      }

      const merged = applyLockedIdentity(authUserId, {
        ...data,
        name: nextName,
        username: nextUsername,
        email: nextEmail,
        phone: nextPhone,
        gender: data.gender || lockedId?.gender || pending?.gender || prev?.gender || 'male',
        createdAtMs: data.createdAtMs ?? lockedId?.createdAtMs ?? pending?.createdAtMs ?? prev?.createdAtMs ?? null,
      })

      // هەرگیز ناسنامەی تەواو مەگۆڕە بۆ بەتاڵ
      if (isIdentityIncomplete(merged) && prev && !isIdentityIncomplete(prev)) {
        return
      }

      userProfileRef.current = merged

      setUserProfile(merged)

      setWallet({

        diamond: isProtectedAccount({ uid: authUserId, playerId: data.playerId })
          ? PROTECTED_LOCKED_DIAMOND
          : data.diamond,

        gold: isProtectedAccount({ uid: authUserId, playerId: data.playerId })
          ? PROTECTED_LOCKED_GOLD
          : data.gold,

        isPremium: data.isPremium,

      })

      setBoughtItems(data.inventory)

      {
        const resolvedDay = resolveDailyBonusStreakDay(
          data.dailyBonusDay,
          data.dailyBonusLastClaimMs,
          Date.now(),
        )
        setDailyBonusDay(resolvedDay)
        if (
          resolvedDay === 1
          && data.dailyBonusDay !== 1
          && isDailyBonusStreakBroken(data.dailyBonusLastClaimMs, Date.now())
        ) {
          persistDailyBonusStreakReset(authUserId, data.playerId).catch(() => {})
        }
      }

      setDailyBonusLastClaimMs(data.dailyBonusLastClaimMs)

      {
        const spinState = getSpinWindowState({
          spinLastFreeAtMs: data.spinLastFreeAtMs,
          spinSpinsInWindow: data.spinSpinsInWindow,
        })
        setDailySpinSpinsToday(spinState.spinsToday)
      }

      setBlockedUsersList(data.blockedUsers)

      setFriendsList(data.friends)

      setGiftsLogList(data.giftsLog)

      setInboxNotifications(data.inboxNotifications ?? [])

      // Push — ئاگادارییەکانی تایبەت بە خۆت (نامە، هاوڕێ، دزی، دیاری، …)
      if (notificationsEnabledRef.current && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const known = heistNotifSeenRef.current
        const personalKinds = new Set([
          'heist', 'steal', 'friend_request', 'message', 'gift', 'daily', 'spin', 'duel', 'challenge', 'donate',
          'fight', 'luck', 'wheel', 'reward', 'bonus', 'pass', 'shop',
        ])
        for (const n of data.inboxNotifications ?? []) {
          if (!n?.id || known.has(n.id)) continue
          known.add(n.id)
          if (!personalKinds.has(String(n.kind || ''))) continue
          if (Date.now() - (n.atMs || 0) > 120_000) continue
          try {
            new Notification(n.title || 'کورد درۆپ', {
              body: n.body || '',
              tag: n.id,
            })
          } catch { /* ignore */ }
        }
        if (known.size > 200) {
          const trimmed = [...known].slice(-120)
          heistNotifSeenRef.current = new Set(trimmed)
        }
      }

      // Merge remote + local read flags so unread never "comes back" after login
      {
        const localRead = loadReadNotificationIds(authUserId)
        const merged = new Set([...localRead, ...(data.readNotificationIds ?? [])])
        setReadNotifIds(merged)
        saveReadNotificationIds(authUserId, merged)
      }

      dropTypeCooldownsRef.current = data.dropTypeCooldowns ?? {}

      blockedUidsRef.current = new Set(data.blockedUsers.map(b => b.uid))

      const muted = data.mutedChatUids ?? []

      setMutedChatUids(muted)

      mutedChatUidsRef.current = new Set(muted)

      setFightBanUntilMs(Number(data.fightBanUntilMs) || 0)

      setStealCooldownUntilMs(Number(data.stealCooldownUntilMs) || 0)

      setFightChallengeLog(data.fightChallengeLog ?? {})

      const incoming = parseIncomingFight(data.incomingFight)

      setIncomingChallenge(prev => {

        if (!incoming) return null

        if (prev?.duelId === incoming.duelId) return { ...incoming }

        return incoming

      })

      {
        const heist = data.incomingHeist
        liveIncomingHeistRef.current = heist && heist.expiresAtMs > Date.now() ? heist : null
        if (typeof data.homeCityKey === 'string' && data.homeCityKey.trim()) {
          homeCityKeyRef.current = data.homeCityKey.trim()
        }
        setIncomingHeistAlert(prev => {
          if (!heist || heist.expiresAtMs <= Date.now()) return null
          if (prev?.heistId === heist.heistId) return prev
          return {
            heistId: heist.heistId,
            thiefUid: heist.thiefUid,
            thiefName: heist.thiefName,
            mode: heist.mode,
            expiresAtMs: heist.expiresAtMs,
          }
        })
      }
      // Season Pass + VIP passes تەنها یەک جار لەسەر سەرەتای سێشن بار دەکرێن

      if (!settingsHydratedRef.current) {

        // Prefer Firestore read ids (already merged above); keep local as backup seed
        setReadNotifIds(prev => {
          const local = loadReadNotificationIds(authUserId)
          return new Set([...local, ...prev])
        })

        let sp = normalizeMissions(loadSeasonPass(authUserId))

        sp = bumpMission(sp, 'login', 1)

        seasonPassRef.current = sp

        setSeasonPass(sp)

        saveSeasonPass(authUserId, sp)

        let vp = loadVipPasses(authUserId)

        if (vp.master.owned) {

          vp = { ...vp, master: maybeRecordMasterPerfectDay(vp.master, sp) }

        }

        vipPassesRef.current = vp

        setVipPasses(vp)

        saveVipPasses(authUserId, vp)

        // خاوەنی ڕێڕەوی کوردستان → لانیکەم پادشا
        if (vp.master.owned || sp.eliteOwned) {
          const prevDrops = parseDropsOpenedByType(data.dropsOpenedByType ?? EMPTY_DROPS_OPENED)
          if (computeHunterLevel(prevDrops) < PADSHA_HUNTER_LEVEL || (data.hunterLevel ?? 0) < PADSHA_HUNTER_LEVEL) {
            const dropsOpenedByType = ensureDropsForMinLevel(prevDrops, PADSHA_HUNTER_LEVEL)
            const hunterLevel = Math.max(computeHunterLevel(dropsOpenedByType), PADSHA_HUNTER_LEVEL)
            syncUserProfile(authUserId, { dropsOpenedByType, hunterLevel }).catch(() => {})
            setUserProfile(prev => prev ? { ...prev, dropsOpenedByType, hunterLevel } : prev)
          }
        }

        loadVipPassesFromFirestore(authUserId).then(remote => {

          if (!remote) {

            syncVipPasses(authUserId, vipPassesRef.current).catch(() => {})

            return

          }

          let merged = remote

          if (merged.master.owned) {

            merged = { ...merged, master: maybeRecordMasterPerfectDay(merged.master, seasonPassRef.current) }

          }

          vipPassesRef.current = merged

          setVipPasses(merged)

          saveVipPasses(authUserId, merged)

        }).catch(() => {

          syncVipPasses(authUserId, vipPassesRef.current).catch(() => {})

        })

        setActivityArchive(loadActivityArchive(authUserId))

        if (!loginLoggedRef.current) {

          loginLoggedRef.current = true

          setActivityArchive(appendActivity(authUserId, 'login', 'چوونەژوورەوەی یاری', '🚪'))

        }

      }

      if (!settingsHydratedRef.current) {

        settingsHydratedRef.current = true

        setSoundEnabled(data.settings.soundEnabled)

        setSfxVolume(data.settings.sfxVolume ?? 1)

        setHighGraphics(data.settings.highGraphics !== false)

        setShowPlayerNames(data.settings.showPlayerNames !== false)

        setBlockIncomingGifts(data.settings.blockIncomingGifts === true)

        setGhostMode(data.settings.hideLocation === true)

        setPlaneSoundEnabled(data.settings.planeSoundEnabled !== false)
        setPlaneVolume(data.settings.planeVolume ?? 1)
        setGiftSoundEnabled(data.settings.giftSoundEnabled !== false)
        setGiftVolume(data.settings.giftVolume ?? 1)
        setChestSoundEnabled(data.settings.chestSoundEnabled !== false)
        setChestVolume(data.settings.chestVolume ?? 1)
        setMusicEnabled(false)
        setMusicVolume(data.settings.musicVolume ?? 0.5)
        setHideWhenOffline(data.settings.hideWhenOffline === true)
        setHideBlockedUsers(data.settings.hideBlockedUsers === true)
        setHideGlobalChat(data.settings.hideGlobalChat === true)
        setAllowDmWithoutFriendship(data.settings.allowDmWithoutFriendship !== false)
        setRadarAlertsEnabled(data.settings.radarAlertsEnabled !== false)
        setFriendRequestNotifsEnabled(data.settings.friendRequestNotifsEnabled !== false)

        try {
          configureSfx({
            muted: data.settings.soundEnabled === false,
            volume: data.settings.sfxVolume ?? 1,
          })
          configureSfxCategory('gift', {
            muted: data.settings.giftSoundEnabled === false,
            volume: data.settings.giftVolume ?? 1,
          })
          configureMusic({
            muted: true,
            volume: data.settings.musicVolume ?? 0.5,
          })
          try { stopBackgroundMusic() } catch { /* ignore */ }
        } catch (err) {
          console.error('SFX hydrate failed:', err)
        }

        setNotificationsEnabled(data.settings.notificationsEnabled !== false)

        setShowOtherPlayers(data.settings.showOtherPlayers !== false)

        setShowMyAvatarOnMap(data.settings.showMyAvatarOnMap !== false)

        saveUserSettingsLocal(authUserId, data.settings)

      }

      updateUserMarkerIcon()

    })

  }, [authUserId, updateUserMarkerIcon])

  // Auto-cache profile/wallet/inventory keyed by in-game playerId (+ uid mirror)
  useEffect(() => {
    if (!authUserId || !userProfile || !profileHydratedRef.current) return
    if (!userProfile.playerId) return
    saveUserDataLocal(authUserId, {
      playerId: userProfile.playerId,
      gold: wallet.gold,
      diamond: wallet.diamond,
      isPremium: wallet.isPremium,
      playerLevel: userProfile.playerLevel,
      playerXp: userProfile.playerXp,
      hunterLevel: userProfile.hunterLevel,
      name: userProfile.name,
      username: userProfile.username,
      email: userProfile.email,
      phone: userProfile.phone,
      usernameEditUsed: userProfile.usernameEditUsed,
      emailEditUsed: userProfile.emailEditUsed,
      phoneEditUsed: userProfile.phoneEditUsed,
      gender: userProfile.gender,
      title: userProfile.title,
      avatarUrl: userProfile.avatarUrl,
      avatar3d: userProfile.avatar3d,
      inventory: boughtItems,
      dropsOpenedByType: userProfile.dropsOpenedByType,
      welcomeBonusGranted: userProfile.welcomeBonusGranted,
      createdAtMs: userProfile.createdAtMs,
      giftsSentScore: userProfile.giftsSentScore,
    })
  }, [
    authUserId,
    wallet.gold,
    wallet.diamond,
    wallet.isPremium,
    userProfile?.playerId,
    userProfile?.playerLevel,
    userProfile?.playerXp,
    userProfile?.hunterLevel,
    userProfile?.name,
    userProfile?.username,
    userProfile?.email,
    userProfile?.phone,
    boughtItems,
  ])

  // شێواز‌کردنی کاتی مانگرتن لەم یارییەدا (بۆ خەڵاتی ڕۆژانە)

  useEffect(() => {

    const tick = () => setSessionMinutes(Math.floor((Date.now() - sessionStartRef.current) / 60000))

    tick()

    const t = setInterval(tick, 15000)

    return () => clearInterval(t)

  }, [])

  // شوێنی ئایکۆنەکانی دەستی ڕاست — تەنها بەپێی بەشی کۆمپاکتی هێدەر (بێ درۆپداون)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const measure = () => {
      const compact = el.querySelector('.kd-header-curr-row') as HTMLElement | null
      const bottom = compact
        ? el.offsetTop + compact.offsetTop + compact.offsetHeight
        : el.offsetTop + Math.min(el.offsetHeight, 180)
      const fullBottom = el.offsetTop + el.offsetHeight
      setRightIconsTop(bottom + 10)
      document.documentElement.style.setProperty('--kd-header-bottom', `${bottom}px`)
      document.documentElement.style.setProperty('--kd-header-full-bottom', `${fullBottom}px`)
      const shell = el.closest('.kd-app-shell') as HTMLElement | null
      if (shell) {
        shell.style.setProperty('--kd-header-bottom', `${bottom}px`)
        shell.style.setProperty('--kd-header-full-bottom', `${fullBottom}px`)
      }
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const compact = el.querySelector('.kd-header-curr-row')
    if (compact) ro.observe(compact)
    return () => ro.disconnect()
  }, [authLoading])

  // کۆکردنەوەی کاتی ڕاستەقینەی یاری (Play Time) بە بەردەوامی و خەزنکردنی لە Firestore

  // هەموو ٣٠ چرکە جارێک ٣٠،٠٠٠ میللی چرکە زیاد دەکات بۆ کۆی گشتی کاتی یاری بەردەوامی یاریزان

  useEffect(() => {

    const PLAY_TIME_TICK_MS = 30000

    const t = setInterval(() => {

      const uid = userIdRef.current

      if (uid) incrementPlayerStats(uid, { playTimeMs: PLAY_TIME_TICK_MS }).catch(() => {})

    }, PLAY_TIME_TICK_MS)

    return () => clearInterval(t)

  }, [])

  // داواکارییە هاوڕێیەتییە هاتووەکان (Incoming Friend Requests)

  useEffect(() => {
    if (!authUserId) return
    const knownIds = new Set<string>()
    let primed = false
    return subscribeToIncomingFriendRequests(authUserId, (reqs) => {
      setIncomingFriendRequests(reqs)
      if (!primed) {
        for (const r of reqs) knownIds.add(r.id)
        primed = true
        return
      }
      for (const r of reqs) {
        if (knownIds.has(r.id)) continue
        knownIds.add(r.id)
        if (
          !notificationsEnabledRef.current
          || typeof Notification === 'undefined'
          || Notification.permission !== 'granted'
        ) continue
        try {
          const fromName = (r.fromName || 'یاریزان').trim() || 'یاریزان'
          new Notification('کورد درۆپ 🤝', {
            body: `داوای هاوڕێیەتی لە ${fromName}`,
            tag: `friend-req-${r.id}`,
          })
        } catch { /* ignore */ }
      }
    })
  }, [authUserId])

  useEffect(() => {

    if (!authUserId) return

    const local = loadOutgoingFriendUidsLocal(authUserId)

    setOutgoingFriendUids(local)

    return subscribeToOutgoingFriendRequests(authUserId, remote => {

      const merged = [...new Set([...remote, ...loadOutgoingFriendUidsLocal(authUserId)])]

      setOutgoingFriendUids(merged)

      saveOutgoingFriendUidsLocal(authUserId, merged)

    })

  }, [authUserId])

  useEffect(() => {

    const friendUids = new Set(friendsList.map(f => f.uid))

    setOutgoingFriendUids(prev => {

      const next = prev.filter(u => !friendUids.has(u))

      if (authUserId) saveOutgoingFriendUidsLocal(authUserId, next)

      return next

    })

  }, [friendsList, authUserId])

  // لیستی چاتە تایبەتەکان (My DM Threads)

  useEffect(() => {

    if (!authUserId) return

    return subscribeToMyDmThreads(authUserId, setDmThreads)

  }, [authUserId])

  // چاتی تایبەت لەگەڵ کەسێکی دیاریکراو (Active DM Thread)

  useEffect(() => {

    if (!authUserId || !activeDmPartner) { setDmMessages([]); return }

    // کردنەوەی چات — unread دەسڕێتەوە (بێ سکانکردنی هەموو مێژوو)
    markDmThreadRead(authUserId, activeDmPartner.uid, []).catch(() => {})

    let lastSeenMarkAt = 0

    return subscribeToDmThread(authUserId, activeDmPartner.uid, msgs => {

      setDmMessages(prev => {

        const optimistic = prev.filter(m => isOptimisticDmId(m.id))

        const merged = mergeDmThreadMessages(msgs, optimistic, authUserId)

        const keptOpt = new Set(merged.filter(m => isOptimisticDmId(m.id)).map(m => m.id))
        const dropped = optimistic.filter(m => !keptOpt.has(m.id)).map(m => m.id)
        if (dropped.length) {
          setDmMediaProgress(p => {
            let changed = false
            const next = { ...p }
            for (const id of dropped) {
              if (next[id] != null) {
                delete next[id]
                changed = true
              }
            }
            return changed ? next : p
          })
        }

        return merged

      })

      const unseenIds = msgs
        .filter(m => m.from !== authUserId && m.status !== 'seen' && !isOptimisticDmId(m.id))
        .map(m => m.id)

      const now = Date.now()
      // debounce — هەر نامەیەک نەبێتە writeی جیا
      if (unseenIds.length && now - lastSeenMarkAt > 400) {
        lastSeenMarkAt = now
        markDmThreadRead(authUserId, activeDmPartner.uid, unseenIds).catch(() => {})
      }

      const undelivered = msgs
        .filter(m => m.from !== authUserId && m.status === 'sent')
        .map(m => m.id)
        .filter(id => !dmDeliveredMarkRef.current.has(id))

      if (undelivered.length) {
        undelivered.forEach(id => dmDeliveredMarkRef.current.add(id))
        markIncomingDmDelivered(authUserId, activeDmPartner.uid, undelivered).catch(() => {})
      }

    })

  }, [authUserId, activeDmPartner])

  // خۆکار سکڕۆڵ بۆ کۆتا نامە کاتێک چات دەکرێتەوە یان نامەی نوێ دێت

  useEffect(() => {

    if (!activeDmPartner || !showMessagesPanel) return

    const scrollToLatest = () => {

      try {

        dmChatEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })

      } catch {}

      try {

        const box = dmChatScrollRef.current

        if (box) box.scrollTop = box.scrollHeight

      } catch {}

    }

    requestAnimationFrame(scrollToLatest)

  }, [activeDmPartner, dmMessages, showMessagesPanel])

  // کاتێک لە یارییەکەدا ئۆنلاینیت، نامەی نەگەیەنراو بۆ گەیاندن نوێ دەکرێتەوە

  useEffect(() => {

    if (!authUserId || !showMessagesPanel || activeDmPartner) return

    let cancelled = false
    const pendingUnsubs: Array<() => void> = []

    ;(async () => {

      for (const t of dmThreads.slice(0, 15)) {

        if (cancelled || t.unreadCount <= 0) continue

        await new Promise<void>(resolve => {

          let settled = false
          const finish = () => {
            if (settled) return
            settled = true
            resolve()
          }

          const unsub = subscribeToDmThread(authUserId, t.otherUid, msgs => {
            unsub()
            const idx = pendingUnsubs.indexOf(unsub)
            if (idx >= 0) pendingUnsubs.splice(idx, 1)

            if (!cancelled) {
              const undelivered = msgs
                .filter(m => m.from !== authUserId && m.status === 'sent')
                .map(m => m.id)

              if (undelivered.length) {
                markIncomingDmDelivered(authUserId, t.otherUid, undelivered).catch(() => {})
              }
            }

            finish()
          })

          pendingUnsubs.push(unsub)
          if (cancelled) {
            try { unsub() } catch { /* ignore */ }
            finish()
          }

        })

      }

    })()

    return () => {
      cancelled = true
      for (const u of pendingUnsubs) {
        try { u() } catch { /* ignore */ }
      }
      pendingUnsubs.length = 0
    }

  }, [authUserId, showMessagesPanel, activeDmPartner, dmThreads])

  // نوێکردنەوەی قەبارەی نەخشە کاتێک شاشە/کۆنتەینەر دەگۆڕدرێت (portrait/landscape / iPhone viewport)

  useEffect(() => {

    const delayTimers: ReturnType<typeof setTimeout>[] = []

    let rafId: number | null = null

    const invalidateNow = () => {

      const map = mapRef.current

      if (!map) return

      try { map.invalidateSize({ animate: false }) } catch {}

    }

    /** Immediate (rAF-coalesced) + delayed retries so tiles fill after layout settles. */

    const scheduleInvalidate = () => {

      if (rafId != null) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {

        rafId = null

        invalidateNow()

      })

      delayTimers.forEach(clearTimeout)

      delayTimers.length = 0

      delayTimers.push(setTimeout(invalidateNow, 100))

      delayTimers.push(setTimeout(invalidateNow, 300))

    }

    window.addEventListener('resize', scheduleInvalidate)

    window.addEventListener('orientationchange', scheduleInvalidate)

    const vv = window.visualViewport

    vv?.addEventListener('resize', scheduleInvalidate)

    vv?.addEventListener('scroll', scheduleInvalidate)

    // Desktop phone-frame ↔ mobile fullscreen breakpoint

    const desktopMq = window.matchMedia('(min-width: 769px)')

    const onDesktopMq = () => scheduleInvalidate()

    if (typeof desktopMq.addEventListener === 'function') {

      desktopMq.addEventListener('change', onDesktopMq)

    } else {

      // Safari < 14

      desktopMq.addListener(onDesktopMq)

    }

    // Container ResizeObserver — iPhone rotate / chrome layout / desktop frame / safe-area

    const mapEl = document.getElementById('leaflet-map')

    const shellEl = document.querySelector('.kd-app-shell')

    let ro: ResizeObserver | null = null

    if (typeof ResizeObserver !== 'undefined') {

      ro = new ResizeObserver(() => scheduleInvalidate())

      if (mapEl) ro.observe(mapEl)

      if (shellEl) ro.observe(shellEl)

    }

    scheduleInvalidate()

    return () => {

      if (rafId != null) cancelAnimationFrame(rafId)

      delayTimers.forEach(clearTimeout)

      window.removeEventListener('resize', scheduleInvalidate)

      window.removeEventListener('orientationchange', scheduleInvalidate)

      vv?.removeEventListener('resize', scheduleInvalidate)

      vv?.removeEventListener('scroll', scheduleInvalidate)

      if (typeof desktopMq.removeEventListener === 'function') {

        desktopMq.removeEventListener('change', onDesktopMq)

      } else {

        desktopMq.removeListener(onDesktopMq)

      }

      ro?.disconnect()

    }

  }, [])

  // Initial map load — refresh Leaflet size + iOS Safari hitboxes after first paint
  useEffect(() => {
    if (!mapReady) return
    const t = setTimeout(() => {
      const map = mapRef.current
      if (!map) return
      try {
        map.invalidateSize()
        // Intentional iOS Safari nudge so marker hitboxes align after layout settle
        map.panBy([1, 1], { animate: false })
        setTimeout(() => {
          try { map.panBy([-1, -1], { animate: false }) } catch {}
        }, 50)
      } catch {}
    }, 800)
    return () => clearTimeout(t)
  }, [mapReady])

  useEffect(() => {
    const handleFullyLoaded = () => {
      if (mapRef.current) {
        try {
          mapRef.current.invalidateSize({ animate: false })
        } catch {}
      }
    }

    // SPA hot reload / late mount: window `load` may already have fired
    if (mapReady && document.readyState === 'complete') {
      handleFullyLoaded()
    }

    window.addEventListener('load', handleFullyLoaded)
    // هەروەها دوای 1 چرکە لە لۆدبوون بۆ دڵنیایی زیاتر لە کاتی ڕیفڕێش:
    const timer = setTimeout(handleFullyLoaded, 1000)
    return () => {
      window.removeEventListener('load', handleFullyLoaded)
      clearTimeout(timer)
    }
  }, [mapReady])

  // Sheet / balance chrome open-close can leave Leaflet with a stale size (blank tile gaps)

  useEffect(() => {

    if (!mapReady) return

    const invalidateNow = () => {

      const map = mapRef.current

      if (!map) return

      try { map.invalidateSize({ animate: false }) } catch {}

    }

    invalidateNow()

    const t100 = setTimeout(invalidateNow, 100)

    const t300 = setTimeout(invalidateNow, 300)

    return () => {

      clearTimeout(t100)

      clearTimeout(t300)

    }

  }, [activeSheet, activeBalance, mapReady, authLoading])

  const persistInventoryAndWallet = useCallback((

    nextInventory: InventoryItem[],

    nextWallet: typeof wallet,

  ) => {

    const uid = userIdRef.current

    if (!uid) return

    saveUserDataLocal(uid, {
      playerId: userProfileRef.current?.playerId,
      gold: nextWallet.gold,
      diamond: nextWallet.diamond,
      isPremium: nextWallet.isPremium,
      playerLevel: userProfileRef.current?.playerLevel,
      playerXp: userProfileRef.current?.playerXp,
      hunterLevel: userProfileRef.current?.hunterLevel,
      inventory: nextInventory,
    })

    syncUserWalletAndInventory(uid, nextWallet, nextInventory).catch(err => {

      console.error('Inventory sync failed:', err)

      showGameAlert({ message: '❌ نەتوانرا زانیارییەکان پاشەکەوت بکرێن' })

    })

  }, [])

  const updatePlayerAvatar = useCallback((file: File) => {

    const uid = userIdRef.current

    if (!uid) return

    if (!file.type.startsWith('image/')) { showGameAlert({ message: '❌ تکایە تەنها فایلی وێنە هەڵبژێرە' }); return }

    const reader = new FileReader()

    reader.onload = () => {

      const img = new Image()

      img.onload = () => {

        const size = 128

        const canvas = document.createElement('canvas')

        canvas.width = size

        canvas.height = size

        const ctx = canvas.getContext('2d')

        if (!ctx) return

        const scale = Math.max(size / img.width, size / img.height)

        const w = img.width * scale, h = img.height * scale

        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.75)

        syncUserProfile(uid, { avatarUrl: dataUrl }).catch(() => showGameAlert({ message: '❌ نەتوانرا وێنەکە پاشەکەوت بکرێت' }))

      }

      img.onerror = () => showGameAlert({ message: '❌ نەتوانرا وێنەکە بار بکرێت' })

      img.src = reader.result as string

    }

    reader.onerror = () => showGameAlert({ message: '❌ نەتوانرا فایلەکە بخوێنرێتەوە' })

    reader.readAsDataURL(file)

  }, [])

  const handleToggleSound = useCallback((next: boolean) => {

    setSoundEnabled(next)

    try { configureSfx({ muted: !next }) } catch (err) { console.error('SFX toggle failed:', err) }

    const uid = userIdRef.current

    if (uid) syncUserSettings(uid, { soundEnabled: next }).catch(() => {})

  }, [])

  const handleSfxVolume = useCallback((next: number) => {
    const vol = Math.min(1, Math.max(0, next))
    setSfxVolume(vol)
    try { configureSfx({ volume: vol }) } catch (err) { console.error('SFX volume update failed:', err) }
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { sfxVolume: vol }).catch(() => {})
  }, [])

  const handleTogglePlaneSound = useCallback((next: boolean) => {
    setPlaneSoundEnabled(next)
    planeSoundEnabledRef.current = next
    if (!next) {
      try { stopPlaneSound() } catch { /* ignore */ }
    }
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { planeSoundEnabled: next }).catch(() => {})
  }, [])

  const handlePlaneVolume = useCallback((next: number) => {
    const vol = Math.min(1, Math.max(0, next))
    setPlaneVolume(vol)
    planeVolumeRef.current = vol
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { planeVolume: vol }).catch(() => {})
  }, [])

  const handleToggleGiftSound = useCallback((next: boolean) => {
    setGiftSoundEnabled(next)
    try { configureSfxCategory('gift', { muted: !next }) } catch (err) { console.error('Gift SFX toggle failed:', err) }
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { giftSoundEnabled: next }).catch(() => {})
  }, [])

  const handleGiftVolume = useCallback((next: number) => {
    const vol = Math.min(1, Math.max(0, next))
    setGiftVolume(vol)
    try { configureSfxCategory('gift', { volume: vol }) } catch (err) { console.error('Gift SFX volume update failed:', err) }
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { giftVolume: vol }).catch(() => {})
  }, [])

  const handleToggleChestSound = useCallback((next: boolean) => {
    setChestSoundEnabled(next)
    chestSoundEnabledRef.current = next
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { chestSoundEnabled: next }).catch(() => {})
  }, [])

  const handleChestVolume = useCallback((next: number) => {
    const vol = Math.min(1, Math.max(0, next))
    setChestVolume(vol)
    chestVolumeRef.current = vol
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { chestVolume: vol }).catch(() => {})
  }, [])

  const handleToggleMusic = useCallback((next: boolean) => {
    setMusicEnabled(next)
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { musicEnabled: next }).catch(() => {})
  }, [])

  const handleMusicVolume = useCallback((next: number) => {
    const vol = Math.min(1, Math.max(0, next))
    setMusicVolume(vol)
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { musicVolume: vol }).catch(() => {})
  }, [])

  const handleToggleHideWhenOffline = useCallback((next: boolean) => {
    setHideWhenOffline(next)
    hideWhenOfflineRef.current = next
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { hideWhenOffline: next }).catch(() => {})
    logActivity('settings', next ? 'وونم بکە کاتێک لەسەر هێڵ نیم چالاک کرا' : 'وونم بکە کاتێک لەسەر هێڵ نیم ناچاڵاک کرا', '👻')
  }, [logActivity])

  const handleToggleHideBlockedUsers = useCallback((next: boolean) => {
    setHideBlockedUsers(next)
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { hideBlockedUsers: next }).catch(() => {})
  }, [])

  const handleToggleHideGlobalChat = useCallback((next: boolean) => {
    setHideGlobalChat(next)
    hideGlobalChatRef.current = next
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { hideGlobalChat: next }).catch(() => {})
    try { syncAllVisibleMarkerOverlays() } catch { /* ignore */ }
    logActivity('settings', next ? 'وونکردنی چاتی گشتی چالاک کرا' : 'وونکردنی چاتی گشتی ناچاڵاک کرا', '💬')
  }, [syncAllVisibleMarkerOverlays, logActivity])

  const handleToggleAllowDmWithoutFriendship = useCallback((next: boolean) => {
    setAllowDmWithoutFriendship(next)
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { allowDmWithoutFriendship: next }).catch(() => {})
    logActivity(
      'settings',
      next ? 'نامەی بێ هاوڕێیەتی ڕێگەپێدرا' : 'تەنها هاوڕێ دەتوانێت نامە بنێرێت',
      '✉️',
    )
  }, [logActivity])

  const handleResetAppData = useCallback(() => {
    try { clearLocalPlayerEconomyData(userIdRef.current) } catch (err) { console.error('Economy local cleanup failed:', err) }
    try { if (typeof localStorage !== 'undefined') localStorage.clear() } catch (err) { console.error('localStorage clear failed:', err) }
    window.location.reload()
  }, [])

  const handleDeleteAccount = useCallback(async (password: string) => {
    const confirmed = await showGameConfirm({
      title: 'سڕینەوەی هەژمار',
      message: 'ئایا دڵنیایت لە سڕینەوەی هەژمارەکەت؟ ئەم کردارە هەمیشەییە و ناگەڕێتەوە.',
      icon: '⚠️',
      confirmLabel: 'بەڵێ، بیسڕەوە',
      cancelLabel: 'پاشگەزبوونەوە',
    })
    if (!confirmed) return
    const uid = userIdRef.current
    setDeleteAccountError(null)
    setDeleteAccountBusy(true)
    try {
      if (uid) {
        try { await setPlayerOffline(uid) } catch { /* ignore */ }
      }
      await deleteOwnAccount(password)
      realtimeSync.disconnect()
      try { clearLocalPlayerEconomyData(uid) } catch { /* ignore */ }
      try { if (typeof localStorage !== 'undefined') localStorage.clear() } catch { /* ignore */ }
      window.location.reload()
    } catch (err) {
      setDeleteAccountBusy(false)
      setDeleteAccountError(mapFirebaseAuthError(err))
    }
  }, [showGameConfirm])

  const handleLogout = useCallback(async () => {
    const uid = userIdRef.current
    try {
      if (uid) {
        appendActivity(uid, 'logout', 'دەرچوون لە یاری', '🚪')
        await setPlayerOffline(uid, { hideFromMap: hideWhenOfflineRef.current })
      }
      realtimeSync.disconnect()
      try { clearAuthSessionHints() } catch { /* ignore */ }
      await signOutUser()
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      window.location.reload()
    }
  }, [])

  const openChangePasswordPanel = useCallback(() => {
    setChangePwOld('')
    setChangePwNew('')
    setChangePwNew2('')
    setChangePwError('')
    setChangePwStep('old')
    setChangePwBusy(false)
    setShowChangePasswordPanel(true)
  }, [])

  const handleChangePasswordSubmit = useCallback(async () => {
    setChangePwError('')
    if (changePwStep === 'old') {
      if (!changePwOld.trim()) {
        setChangePwError('وشەی نهێنی کۆن بنووسە.')
        return
      }
      setChangePwStep('new')
      return
    }
    if (changePwNew.length < 8) {
      setChangePwError('وشەی نهێنی نوێ لانیکەم ٨ پیت بێت.')
      return
    }
    if (changePwNew !== changePwNew2) {
      setChangePwError('وشەی نهێنی نوێ و دووبارەکردنەوە یەک ناگرنەوە.')
      return
    }
    setChangePwBusy(true)
    try {
      await changeAccountPassword(changePwOld, changePwNew)
      setShowChangePasswordPanel(false)
      showGameAlert({ message: '✅ وشەی نهێنی بە سەرکەوتوویی گۆڕدرا', tone: 'success' })
      logActivity('settings', 'گۆڕینی وشەی نهێنی', '🔑')
    } catch (err) {
      setChangePwError(mapFirebaseAuthError(err))
    } finally {
      setChangePwBusy(false)
    }
  }, [changePwStep, changePwOld, changePwNew, changePwNew2, showGameAlert, logActivity])

  const handleEditUsernameOnce = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid || profileFieldBusy) return
    if (userProfileRef.current?.usernameEditUsed) {
      showGameAlert({ message: '⚠️ تۆ پێشتر یەک جار یوزەرنەیمەکەت گۆڕیوە', tone: 'warn' })
      return
    }
    const ok = await showGameConfirm({
      title: 'ئاگاداری — یوزەرنەیم',
      message: 'تەنها یەک جار دەتوانیت یوزەرنەیم بگۆڕیت. دوای گۆڕین ناتوانیت دووبارە بگۆڕیتەوە. دڵنیایت بەردەوام بیت؟',
      icon: '⚠️',
      confirmLabel: 'بەڵێ، بەردەوامبە',
      cancelLabel: 'پاشگەزبوونەوە',
    })
    if (!ok) return
    const current = userProfileRef.current?.username || ''
    const next = await showGamePrompt({
      title: 'یوزەرنەیمی نوێ',
      message: 'یوزەرنەیمی نوێی یاری بنووسە.',
      icon: '✏️',
      label: 'یوزەرنەیم',
      placeholder: 'نموونە: kurd_player',
      defaultValue: current,
      inputType: 'text',
      confirmLabel: 'گۆڕین',
    })
    if (next == null || !next.trim()) return
    setProfileFieldBusy(true)
    try {
      const parsed = await changeUsernameOnce(uid, next)
      userProfileRef.current = parsed
      setUserProfile(parsed)
      showGameAlert({ message: '✅ یوزەرنەیم گۆڕدرا', tone: 'success' })
      logActivity('settings', 'گۆڕینی یوزەرنەیم (یەکجار)', '✏️')
    } catch (err) {
      showGameAlert({ message: err instanceof Error ? err.message : 'نەتوانرا بگۆڕدرێت', tone: 'error' })
    } finally {
      setProfileFieldBusy(false)
    }
  }, [profileFieldBusy, showGameAlert, showGameConfirm, showGamePrompt, logActivity])

  const handleEditEmailOnce = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid || profileFieldBusy) return
    if (userProfileRef.current?.emailEditUsed) {
      showGameAlert({ message: '⚠️ تۆ پێشتر یەک جار ئیمەیڵەکەت گۆڕیوە', tone: 'warn' })
      return
    }
    const ok = await showGameConfirm({
      title: 'ئاگاداری — ئیمەیڵ',
      message: 'تەنها یەک جار دەتوانیت ئیمەیڵ بگۆڕیت. دوای گۆڕین ناتوانیت دووبارە بگۆڕیتەوە. دڵنیایت بەردەوام بیت؟',
      icon: '⚠️',
      confirmLabel: 'بەڵێ، بەردەوامبە',
      cancelLabel: 'پاشگەزبوونەوە',
    })
    if (!ok) return
    const current = userProfileRef.current?.email || ''
    const next = await showGamePrompt({
      title: 'ئیمەیڵی نوێ',
      message: 'ئیمەیڵی نوێ بنووسە.',
      icon: '✉️',
      label: 'ئیمەیڵ',
      placeholder: 'name@example.com',
      defaultValue: current,
      inputType: 'email',
      confirmLabel: 'دواتر',
    })
    if (next == null || !next.trim()) return
    const password = await showGamePrompt({
      title: 'پشتڕاستکردنەوە',
      message: 'بۆ گۆڕینی ئیمەیڵ، وشەی نهێنی ئێستات بنووسە.',
      icon: '🔒',
      label: 'وشەی نهێنی',
      placeholder: 'وشەی نهێنی ئێستا',
      defaultValue: '',
      inputType: 'password',
      confirmLabel: 'گۆڕین',
    })
    if (password == null || !password.trim()) return
    setProfileFieldBusy(true)
    try {
      await changeAuthEmail(password, next)
      const parsed = await changeEmailOnce(uid, next)
      userProfileRef.current = parsed
      setUserProfile(parsed)
      showGameAlert({ message: '✅ ئیمەیڵ گۆڕدرا', tone: 'success' })
      logActivity('settings', 'گۆڕینی ئیمەیڵ (یەکجار)', '✉️')
    } catch (err) {
      showGameAlert({ message: mapFirebaseAuthError(err), tone: 'error' })
    } finally {
      setProfileFieldBusy(false)
    }
  }, [profileFieldBusy, showGameAlert, showGameConfirm, showGamePrompt, logActivity])

  const handleEditPhoneOnce = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid || profileFieldBusy) return
    if (userProfileRef.current?.phoneEditUsed) {
      showGameAlert({ message: '⚠️ تۆ پێشتر یەک جار ژمارەی مۆبایلەکەت گۆڕیوە', tone: 'warn' })
      return
    }
    const ok = await showGameConfirm({
      title: 'ئاگاداری — مۆبایل',
      message: 'تەنها یەک جار دەتوانیت ژمارەی مۆبایل بگۆڕیت. دوای گۆڕین ناتوانیت دووبارە بگۆڕیتەوە. دڵنیایت بەردەوام بیت؟',
      icon: '⚠️',
      confirmLabel: 'بەڵێ، بەردەوامبە',
      cancelLabel: 'پاشگەزبوونەوە',
    })
    if (!ok) return
    const current = userProfileRef.current?.phone || ''
    const next = await showGamePrompt({
      title: 'ژمارەی مۆبایلی نوێ',
      message: 'ژمارەی مۆبایلی نوێ بنووسە.',
      icon: '📱',
      label: 'ژمارەی مۆبایل',
      placeholder: '0750xxxxxxx',
      defaultValue: current,
      inputType: 'tel',
      confirmLabel: 'گۆڕین',
    })
    if (next == null || !next.trim()) return
    setProfileFieldBusy(true)
    try {
      const parsed = await changePhoneOnce(uid, next)
      userProfileRef.current = parsed
      setUserProfile(parsed)
      showGameAlert({ message: '✅ ژمارەی مۆبایل گۆڕدرا', tone: 'success' })
      logActivity('settings', 'گۆڕینی مۆبایل (یەکجار)', '📱')
    } catch (err) {
      showGameAlert({ message: err instanceof Error ? err.message : 'نەتوانرا بگۆڕدرێت', tone: 'error' })
    } finally {
      setProfileFieldBusy(false)
    }
  }, [profileFieldBusy, showGameAlert, showGameConfirm, showGamePrompt, logActivity])

  const handleToggleShowOtherPlayers = useCallback((next: boolean) => {

    setShowOtherPlayers(next)

    const uid = userIdRef.current

    if (uid) syncUserSettings(uid, { showOtherPlayers: next }).catch(() => {})

    // نەخشە لە frameی داهاتوو نوێ دەبێتەوە — تۆگڵ خاو نابێت
    window.requestAnimationFrame(() => bumpMapPlayersTick())

    logActivity('settings', next ? 'پیشاندانی کەسایەتییەکانی تر چالاک کرا' : 'وونکردنی کەسایەتی تر چالاک کرا', '👥')

  }, [logActivity, bumpMapPlayersTick])

  const handleToggleShowMyAvatarOnMap = useCallback((next: boolean) => {

    setShowMyAvatarOnMap(next)

    showMyAvatarOnMapRef.current = next

    const uid = userIdRef.current

    if (uid) syncUserSettings(uid, { showMyAvatarOnMap: next }).catch(() => {})

    // UI یەکسەر؛ کارە قورسەکانی نەخشە لە frameی داهاتوو
    window.requestAnimationFrame(() => {
      updateUserMarkerIcon()
      pushLocationToFirestore(userLatRef.current, userLngRef.current, true)
    })

    logActivity('settings', next ? 'پیشاندانی کەسایەتم لەسەر نەخشە چالاک کرا' : 'پیشاندانی کەسایەتم لەسەر نەخشە ناچاڵاک کرا', '🧍')

  }, [pushLocationToFirestore, updateUserMarkerIcon, logActivity])

  const handleToggleNotifications = useCallback((next: boolean) => {

    const uid = userIdRef.current

    if (!next) {

      setNotificationsEnabled(false)

      if (uid) syncUserSettings(uid, { notificationsEnabled: false }).catch(() => {})

      logActivity('settings', 'ئاگادارکردنەوەکان ناچاڵاک کران', '🔔')

      return

    }

    if (typeof Notification === 'undefined') {

      showGameAlert({ message: '❌ وێبگەڕەکەت ئاگادارکردنەوە پاڵپشتی نەکرد' })

      return

    }

    Notification.requestPermission().then(permission => {

      if (permission === 'granted') {

        setNotificationsEnabled(true)

        if (uid) syncUserSettings(uid, { notificationsEnabled: true }).catch(() => {})

        logActivity('settings', 'ئاگادارکردنەوەکان چالاک کران', '🔔')

        new Notification('کورد درۆپ 🎮', { body: 'ئاگادارکردنەوەکان چالاک کرا! ✅' })

      } else {

        showGameAlert({ message: '❌ مۆڵەتی ئاگادارکردنەوە نەدرا' })

      }

    }).catch(() => showGameAlert({ message: '❌ نەتوانرا مۆڵەت وەربگیرێت' }))

  }, [showGameAlert, logActivity])

  const handleToggleRadarAlerts = useCallback((next: boolean) => {
    const uid = userIdRef.current
    if (!next) {
      setRadarAlertsEnabled(false)
      radarAlertsEnabledRef.current = false
      if (uid) syncUserSettings(uid, { radarAlertsEnabled: false }).catch(() => {})
      logActivity('settings', 'ئاگادارکردنەوەی تەیارە و درۆپ ناچاڵاک کرا', '✈️')
      return
    }
    const enable = () => {
      setRadarAlertsEnabled(true)
      radarAlertsEnabledRef.current = true
      if (uid) syncUserSettings(uid, { radarAlertsEnabled: true }).catch(() => {})
      logActivity('settings', 'ئاگادارکردنەوەی تەیارە و درۆپ چالاک کرا', '✈️')
    }
    if (typeof Notification === 'undefined') {
      enable()
      return
    }
    if (Notification.permission === 'granted') {
      enable()
      return
    }
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        enable()
        try {
          new Notification('کورد درۆپ ✈️', { body: 'ئاگادارکردنەوەی تەیارە و درۆپ چالاک کرا! ✅' })
        } catch { /* ignore */ }
      } else {
        showGameAlert({ message: '❌ مۆڵەتی ئاگادارکردنەوە نەدرا' })
      }
    }).catch(() => showGameAlert({ message: '❌ نەتوانرا مۆڵەت وەربگیرێت' }))
  }, [showGameAlert, logActivity])

  const handleToggleFriendRequestNotifs = useCallback((next: boolean) => {
    setFriendRequestNotifsEnabled(next)
    friendRequestNotifsEnabledRef.current = next
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { friendRequestNotifsEnabled: next }).catch(() => {})
  }, [])

  const handleClaimDailyBonus = useCallback(async () => {

    const uid = userIdRef.current

    if (!uid) return

    if (isDailyBonusOnCooldown) {

      showGameAlert({ message: `⏳ دیاریی دواتر دوای ${formatCountdownKu(dailyBonusCooldownLeftMs)} بەردەست دەبێت.` })

      return

    }

    try {

      const result = await claimDailyBonus(uid)

      setDailyBonusDay(result.nextDay)

      setDailyBonusLastClaimMs(result.nextClaimMs)

      const summary = formatDailyBonusSummary(result.reward)

      showRewardToast({

        title: `دیاریی ڕۆژی ${result.claimedDay}`,

        message: `${summary}${result.itemNote ? `\nℹ️ ${result.itemNote}` : ''}`,

        icon: result.reward.cardIcon,

        inboxKind: 'other',

      })

      logActivity('daily', `وەرگرتنی دیاریی ڕۆژانە — ڕۆژی ${result.claimedDay}: ${summary}`, '🎁')

      addXP(result.claimedDay >= DAILY_BONUS_TOTAL_DAYS ? XP_REWARDS.dailyMega : XP_REWARDS.dailyBonus)

    } catch (err) {

      showGameAlert({ message: `❌ ${err instanceof Error ? err.message : 'نەتوانرا دیاری وەربگیرێت'}` })

    }

  }, [isDailyBonusOnCooldown, dailyBonusCooldownLeftMs, addXP, showRewardToast, showGameAlert, logActivity])

  useEffect(() => {

    spinRotationRef.current = spinRotation

  }, [spinRotation])

  useEffect(() => {

    if (!authUserId) return

    // Spin state comes from Firestore via subscribe/hydrate — keep spend local
    playerSpendRef.current = loadPlayerSpend(authUserId)

  }, [authUserId])

  const nextSpinCost = getSpinCostForNext(dailySpinSpinsToday)

  const isFreeSpinNext = dailySpinSpinsToday === 0

  const openSpinWheel = useCallback(() => {

    dismissAllOverlaysRef.current('spin')

    const uid = userIdRef.current

    if (uid) {

      const cached = loadUserDataLocal(uid)
      const spin = getSpinWindowState({
        spinLastFreeAtMs: cached?.spinLastFreeAtMs ?? null,
        spinSpinsInWindow: cached?.spinSpinsInWindow ?? 0,
      })
      setDailySpinSpinsToday(spin.spinsToday)
      playerSpendRef.current = loadPlayerSpend(uid)

    }

    setSpinResult(null)

    setSpinSheetClosing(false)

    setSpinSheetIn(false)

    setShowSpinWheel(true)

  }, [])

  const dismissSpinResult = useCallback(() => {

    setSpinResult(null)

  }, [])

  const closeSpinWheelAnimated = useCallback((opts?: { force?: boolean }) => {
    if (!opts?.force && spinAnimating) return
    stopSpinWheelTicks()
    setSpinResult(null)
    setSpinAnimating(false)
    if (spinCloseTimerRef.current) {
      window.clearTimeout(spinCloseTimerRef.current)
      spinCloseTimerRef.current = null
    }
    if (opts?.force) {
      setSpinSheetIn(false)
      setSpinSheetClosing(false)
      setShowSpinWheel(false)
      return
    }
    setSpinSheetIn(false)
    setSpinSheetClosing(true)
    spinCloseTimerRef.current = window.setTimeout(() => {
      setShowSpinWheel(false)
      setSpinSheetClosing(false)
      spinCloseTimerRef.current = null
    }, PLAYER_SHEET_ANIM_MS)
  }, [spinAnimating])

  const closeMapChatAnimated = useCallback((opts?: { force?: boolean }) => {
    if (!opts?.force && mapChatSending) return
    if (mapChatCloseTimerRef.current) {
      window.clearTimeout(mapChatCloseTimerRef.current)
      mapChatCloseTimerRef.current = null
    }
    setMapChatShowEmoji(false)
    setMapChatSheetIn(false)
    setMapChatSheetClosing(true)
    mapChatCloseTimerRef.current = window.setTimeout(() => {
      setShowMapChatModal(false)
      setMapChatSheetClosing(false)
      mapChatCloseTimerRef.current = null
    }, PLAYER_SHEET_ANIM_MS)
  }, [mapChatSending])

  const handleSpinWheel = useCallback(() => {

    if (spinAnimating || spinResult) return

    const uid = userIdRef.current

    if (!uid) return

    const cost = getSpinCostForNext(dailySpinSpinsToday)

    if (cost > 0 && walletRef.current.diamond < cost) {

      showGameAlert({ message: `💎 پێویستت بە ${cost} ئەڵماسە بۆ سووڕانەوە` })

      return

    }

    const spend = loadPlayerSpend(uid)

    const reward = pickSpinReward(dailySpinSpinsToday, spend)

    const index = SPIN_WHEEL_SEGMENTS.findIndex(s => s.id === reward.id)

    if (index < 0) return

    if (cost > 0) {

      setWalletAndSync(w => ({ ...w, diamond: w.diamond - cost }))
      playerSpendRef.current = recordPlayerSpend(uid, { diamond: cost })

    }

    stopSpinWheelTicks()
    startSpinWheelTicks(SPIN_ANIM_MS)

    // خانەکان لە سەرەوە دەست پێدەکەن (نیشاندەری سەرەوە) — سووڕان بە زاوەی دیاریکراو
    const segmentCenter = index * SPIN_SLICE_DEG
    const current = spinRotationRef.current
    const currentMod = ((current % 360) + 360) % 360
    let delta = (360 - segmentCenter) - currentMod
    if (delta < 0) delta += 360
    // کەمێک ڕێکخستن بۆ ناوەڕاستی خانە (slice لە -slice/2 دەستپێدەکات)
    const target = current + delta + 360 * 7

    // یەکەم: transition چالاک بکە، پاشان زاویەکە بگۆڕە تا ئەنیمەیشن دەستپێبکات
    setSpinAnimating(true)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        spinRotationRef.current = target
        setSpinRotation(target)
      })
    })

    window.setTimeout(() => {
      stopSpinWheelTicks()
      setSpinAnimating(false)
      spinRotationRef.current = target
      const newSpins = dailySpinSpinsToday + 1
      const wasFree = dailySpinSpinsToday === 0
      const now = Date.now()
      setDailySpinSpinsToday(newSpins)
      // Legacy local mirror + durable Firestore (24h free spin)
      saveDailySpinState(uid, { dayKey: getDailySpinDayKey(), spinsToday: newSpins })
      recordDailySpin(uid, {
        wasFree,
        spinsInWindow: newSpins,
        lastFreeAtMs: wasFree ? now : undefined,
      }).catch((err) => console.error('Spin persist failed:', err))
      if (reward.kind !== 'retry') {
        setWalletAndSync(w => {
          if (reward.kind === 'gold') return { ...w, gold: w.gold + reward.amount }
          return { ...w, diamond: w.diamond + reward.amount }
        })
        playSoundEffect('win')
        addXP(XP_REWARDS.spinWin)
      } else {
        addXP(XP_REWARDS.spinRetry)
      }
      const rewardLabel = reward.kind === 'retry'
        ? 'دووبارە هەوڵبدە'
        : reward.kind === 'gold'
          ? `${reward.amount.toLocaleString()} زێڕ`
          : `${reward.amount.toLocaleString()} ئەڵماس`
      logActivity('spin', `چەرخی بەخت — ${rewardLabel}${wasFree ? ' (بەخۆڕایی)' : ''}`, '🎡')
      setSpinResult(reward)
    }, SPIN_ANIM_MS)

  }, [dailySpinSpinsToday, spinAnimating, spinResult, setWalletAndSync, showGameAlert, addXP, logActivity])

  // ── Functions ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showSpinWheel) {
      setSpinSheetIn(false)
      return
    }
    setSpinSheetClosing(false)
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSpinSheetIn(true))
    })
    return () => window.cancelAnimationFrame(id)
  }, [showSpinWheel])

  useEffect(() => {
    if (!showMapChatModal) {
      setMapChatSheetIn(false)
      return
    }
    setMapChatSheetClosing(false)
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setMapChatSheetIn(true))
    })
    return () => window.cancelAnimationFrame(id)
  }, [showMapChatModal])

  const closeDropdownAnimated = () => {

    const el = document.getElementById('dropdown-wrapper');

    if (el) {

      el.style.transition = `all 0.18s ${IOS_SHEET_EASE}`;

      el.style.maxHeight = '0px';

      el.style.opacity = '0';

      el.style.paddingTop = '0px';

      el.style.marginTop = '0px';

      el.style.borderTopColor = 'transparent';

      setTimeout(() => {

        setActiveBalance(null);

        setActiveSheet(prev => (prev === 'playerInfo' ? prev : null));

      }, 180);

    } else {

      setActiveBalance(null);

      setActiveSheet(prev => (prev === 'playerInfo' ? prev : null));

    }

  }

  const snapCloseDropdownUi = () => {
    const el = document.getElementById('dropdown-wrapper')
    if (el) {
      el.style.transition = 'none'
      el.style.maxHeight = '0px'
      el.style.opacity = '0'
      el.style.paddingTop = '0px'
      el.style.marginTop = '0px'
      el.style.borderTopColor = 'transparent'
    }
  }

  const expandDropdownUi = (maxHeight = '62vh') => {
    const el = document.getElementById('dropdown-wrapper')
    if (el) {
      el.style.transition = 'none'
      el.style.maxHeight = maxHeight
      el.style.opacity = '1'
      el.style.paddingTop = '12px'
      el.style.marginTop = '4px'
      el.style.borderTopColor = 'rgba(255, 255, 255, 0.1)'
    }
  }

  const toggleBalance = (type: string) => {

    if (activeBalance === type) {

      closeDropdownAnimated();

    } else {

      dismissAllOverlaysRef.current('dropdown')
      preloadCurrencyPackImages()
      expandDropdownUi()
      setActiveBalance(type);
      setActiveSheet(null);

    }

  }

  const toggleSheet = (action: string | null) => {

    if (!action) {

      closeDropdownAnimated();

      return;

    }

    if (action === 'inventory') setHasViewedInv(true);
    if (action === 'leaderboard') setRoyalLbTab('wealth');

    if (activeSheet === action) {

      closeDropdownAnimated();

    } else {

      dismissAllOverlaysRef.current('dropdown')
      expandDropdownUi(action === 'market' ? '68vh' : '62vh')
      setActiveSheet(action);
      setActiveBalance(null);

    }

  }

  const RADAR_ALERT_RADIUS_M = 150
  /** مەودای کردنەوەی درۆپ لە ڕادار / AR — زیاتر لە ٥٠م ڕێگە نادرێت */
  const DROP_AR_MAX_M = 50

  const closeArDropSession = useCallback(() => {
    setArDropSession(null)
    setArDropClaiming(false)
    setArDropBurst(false)
    arDropClaimingRef.current = false
  }, [])

  const tryOpenDropAr = useCallback((airdropId: string, opts?: { fromRadar?: boolean }) => {
    const id = String(airdropId || '').trim()
    if (!id) return
    const airdrop = airdropsDataRef.current.get(id)
    if (!airdrop) {
      showGameAlert({ message: 'درۆپەکە نەدۆزرایەوە' })
      return
    }
    const landed = Date.now() - airdrop.createdAtMs >= AIRDROP_FALL_MS
    if (!landed) {
      showGameAlert({ message: 'درۆپەکە هێشتا لە ئاسماندایە — چاوەڕوانی گەیشتن بە زەوی بکە' })
      return
    }
    const distM = calcDistance(userLatRef.current, userLngRef.current, airdrop.lat, airdrop.lng)
    if (distM > DROP_AR_MAX_M) {
      if (mapRef.current) {
        try { mapRef.current.flyTo([airdrop.lat, airdrop.lng], 18, { animate: true, duration: 0.45 }) } catch {}
      }
      const meters = Math.max(1, Math.round(distM))
      showGameAlert({
        title: 'زۆر دووریت',
        message:
          `تۆ ئێستا ${meters.toLocaleString('en-US')} مەتر دووریت لە درۆپەکە.\n` +
          `پێویستە بە لایەنی کەم ${DROP_AR_MAX_M} مەتر نزیک بیت بۆ بینین و کردنەوەی درۆپەکە.\n\n` +
          `💡 ئاماژە: کلیلی ئەفسانەیی بکڕە — قوفڵی کاتی درۆپ لادەبات.\n` +
          `بە داخەوە ئەگەر لە ماڵەوە بیت ناتوانیت ئەم درۆپە بکەیتەوە.`,
        icon: '📍',
        tone: 'warn',
      })
      return
    }
    dismissAllOverlaysRef.current('arDrop')
    const resolvedChestId = resolveChestId(airdrop.chestId, airdrop.dropType)
    const chest = erbilChests.find(c => c.id === resolvedChestId) ?? erbilChests[0]
    setSelectedAirdropId(id)
    setSelectedChest(chest)
    const itemNames = (airdrop.rewardItemIds ?? [])
      .map(itemId => COSMETIC_BY_ID[itemId]?.name)
      .filter((n): n is string => Boolean(n))
    setSelectedAirdropReward({ gold: airdrop.gold, diamond: airdrop.diamond, itemNames })
    setActiveSheet(null)
    setArDropBurst(false)
    setArDropClaiming(false)
    arDropClaimingRef.current = false
    setArDropSession({ airdropId: id, distM, chest })
    if (opts?.fromRadar && soundEnabledRef.current) {
      try {
        const ctx = getAudioCtx()
        const osc = ctx.createOscillator(), gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(1200, ctx.currentTime)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
        osc.connect(gain); gain.connect(ctx.destination)
        osc.start(); osc.stop(ctx.currentTime + 0.15)
      } catch {}
    }
  }, [showGameAlert])

  const claimArDrop = useCallback(async () => {
    if (!arDropSession || arDropClaimingRef.current) return
    arDropClaimingRef.current = true
    setArDropClaiming(true)
    setArDropBurst(true)
    const ok = await openChest(arDropSession.airdropId)
    if (ok) {
      window.setTimeout(() => {
        closeArDropSession()
      }, 900)
      return
    }
    setArDropClaiming(false)
    setArDropBurst(false)
    arDropClaimingRef.current = false
  }, [arDropSession, openChest, closeArDropSession])

  const updateDistTracker = (lat: number, lng: number) => {

    let min = Infinity

    let nearestId: string | null = null

    activeDropsRef.current.forEach(({ data }, id) => {

      if (Date.now() - data.createdAtMs < AIRDROP_FALL_MS) return // هێشتا لە ئاسماندایە

      const d = calcDistance(lat, lng, data.lat, data.lng)

      if (d < min) { min = d; nearestId = id }

    })

    setChestDist(min === Infinity ? '-- مەتر' : `${min} مەتر`)

    if (nearestId && min <= RADAR_ALERT_RADIUS_M && !radarAlertedIdsRef.current.has(nearestId)) {

      radarAlertedIdsRef.current.add(nearestId)

      if (soundEnabledRef.current) try {

        const ctx = getAudioCtx()

        const osc = ctx.createOscillator(), gain = ctx.createGain()

        osc.type = 'square'

        osc.frequency.setValueAtTime(880, ctx.currentTime)

        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12)

        gain.gain.setValueAtTime(0.25, ctx.currentTime)

        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

        osc.connect(gain); gain.connect(ctx.destination)

        osc.start(); osc.stop(ctx.currentTime + 0.3)

      } catch {}

      try { navigator.vibrate?.([80, 60, 80]) } catch {}

    }

  }

  const clearAirdropTimer = (airdropId: string) => {

    const timer = airdropTimersRef.current.get(airdropId)

    if (timer) {

      clearInterval(timer)

      airdropTimersRef.current.delete(airdropId)

    }

    const fallT = airdropFallTimersRef.current.get(airdropId)

    if (fallT) {

      clearTimeout(fallT)

      airdropFallTimersRef.current.delete(airdropId)

    }

  }

  const announceDropLanded = useCallback((airdrop: Airdrop, opts?: { force?: boolean }) => {
    if (!opts?.force && announcedDropLandIdsRef.current.has(airdrop.id)) return
    announcedDropLandIdsRef.current.add(airdrop.id)

    const tier = getDropRarityTier(airdrop.dropType, airdrop.chestId)
    const toastId = `${airdrop.id}_${Date.now()}`
    if (dropLandToastTimerRef.current) clearTimeout(dropLandToastTimerRef.current)
    setDropLandToast({ id: toastId, message: tier.toast, accent: tier.accent })
    dropLandToastTimerRef.current = setTimeout(() => {
      setDropLandToast(prev => (prev?.id === toastId ? null : prev))
      dropLandToastTimerRef.current = null
    }, 4200)

    try {
      if (
        radarAlertsEnabledRef.current
        && typeof Notification !== 'undefined'
        && Notification.permission === 'granted'
      ) {
        new Notification('کورد درۆپ 📦', { body: tier.toast, tag: `drop-land-${airdrop.id}` })
      }
    } catch {}
  }, [])

  const announcePlaneCityArrival = useCallback((city: CityAirspace) => {
    const message = formatPlaneCityArrivalMessage(city.name)
    const toastId = `plane_${city.key}_${Date.now()}`
    if (planeCityToastTimerRef.current) clearTimeout(planeCityToastTimerRef.current)
    setPlaneCityToast({ id: toastId, cityKey: city.key, message })
    planeCityToastTimerRef.current = setTimeout(() => {
      setPlaneCityToast(prev => (prev?.id === toastId ? null : prev))
      planeCityToastTimerRef.current = null
    }, 5200)

    try {
      if (
        radarAlertsEnabledRef.current
        && typeof Notification !== 'undefined'
        && Notification.permission === 'granted'
      ) {
        new Notification('کورد درۆپ ✈️', { body: message, tag: `plane-city-${city.key}` })
      }
    } catch {}
  }, [])

  announcePlaneCityArrivalRef.current = announcePlaneCityArrival

  const formatDropClock = (totalSecs: number) => {

    const s = Math.max(0, totalSecs)

    const hours = Math.floor(s / 3600)

    const minutes = Math.floor((s % 3600) / 60).toString().padStart(2, '0')

    const seconds = (s % 60).toString().padStart(2, '0')

    if (hours > 0) return `${hours}:${minutes}:${seconds}`

    return `${minutes}:${seconds}`

  }

  // کاتژمێری درۆپ: کاتێک unlockLeft = ٠، ڕاستەوخۆ کاتژمێری ونبوون (despawn) دەستپێدەکات

  const startAirdropTimer = useCallback((airdropId: string, unlockAtMs: number, despawnAtMs: number) => {

    clearAirdropTimer(airdropId)

    const markerUid = airdropId.replace(/[^a-zA-Z0-9]/g, '')

    const tick = () => {

      const now = Date.now()

      const unlockLeft = Math.max(0, Math.ceil((unlockAtMs - now) / 1000))

      // despawn لە unlockAtMs ـەوە دەژمێردرێت؛ دوای تەواوبوونی قوفڵ ڕاستەوخۆ دەردەکەوێت

      const despawnLeft = Math.max(0, Math.ceil((despawnAtMs - now) / 1000))

      const el = document.getElementById(`timer-${markerUid}`)

      const lockEl = document.getElementById(`lock-${markerUid}`)

      const boxEl = document.getElementById(`chestbox-${markerUid}`)

      const wrapperEl = document.getElementById(`timer-wrapper-${markerUid}`)

      const iconEl = document.getElementById(`timer-icon-${markerUid}`)

      if (unlockLeft > 0) {

        // قۆناغی قوفڵ

        if (wrapperEl) {

          wrapperEl.style.opacity = '1'

          wrapperEl.style.borderColor = '#fbbf24'

          wrapperEl.style.color = '#fde68a'

        }

        if (iconEl) iconEl.textContent = '🔒'

        if (el) el.innerText = formatDropClock(unlockLeft)

        if (lockEl) lockEl.style.opacity = '1'

        // قوفڵکراویش — سندوق ڕوون و بەردەوام دیارە، هیچ کەمبوونەوەی opacity نییە
        if (boxEl) boxEl.style.opacity = '1'

      } else if (despawnLeft > 0) {

        // قوفڵ = ٠ → کاتژمێری ونبوون ڕاستەوخۆ دەستپێدەکات تا تەواوبوونی مانەوە لەسەر نەخشە

        if (wrapperEl) {

          wrapperEl.style.opacity = '1'

          wrapperEl.style.borderColor = '#f87171'

          wrapperEl.style.color = '#fecaca'

        }

        if (iconEl) iconEl.textContent = '⌛'

        if (el) el.innerText = `ونبوون لە: ${formatDropClock(despawnLeft)}`

        if (lockEl) lockEl.style.opacity = '0'

        if (boxEl) boxEl.style.opacity = '1'

      } else {

        // کاتی ونبوون تەواو بوو — مارکەر و کاتژمێر لادەبرێن

        clearAirdropTimer(airdropId)

        const map = mapRef.current

        const entry = activeDropsRef.current.get(airdropId)

        if (entry && map) {

          try { map.removeLayer(entry.marker) } catch {}

        }

        activeDropsRef.current.delete(airdropId)

        airdropsDataRef.current.delete(airdropId)

        updateDistTracker(userLatRef.current, userLngRef.current)

      }

    }

    tick()

    airdropTimersRef.current.set(airdropId, setInterval(tick, 1000))

  }, [])

  const renderAirdropMarker = useCallback((airdrop: Airdrop) => {

    const map = mapRef.current

    if (!map || activeDropsRef.current.has(airdrop.id)) return

    const resolvedChestId = resolveChestId(airdrop.chestId, airdrop.dropType)

    const chest = erbilChests.find(c => c.id === resolvedChestId) ?? erbilChests[4]

    const markerUid = airdrop.id.replace(/[^a-zA-Z0-9]/g, '')

    const elapsed = Date.now() - airdrop.createdAtMs

    const animDelay = elapsed >= AIRDROP_FALL_MS ? -45 : elapsed > 0 ? -(elapsed / 1000) : 0

    const showLanded = elapsed >= AIRDROP_FALL_MS

    const isLocked = Date.now() < airdrop.unlockAtMs

    const despawnLeftSec = Math.max(0, Math.ceil((airdrop.despawnAtMs - Date.now()) / 1000))

    const unlockLeftSec = Math.max(0, Math.ceil((airdrop.unlockAtMs - Date.now()) / 1000))

    // ئەگەر قوفڵ تەواو بووبێت، کاتژمێری ونبوون پیشان بدە (نەک قوفڵی ٠٠:٠٠)

    const initialTimerText = isLocked

      ? formatDropClock(unlockLeftSec)

      : `ونبوون لە: ${formatDropClock(despawnLeftSec)}`

    const timerBorder = isLocked ? '#fbbf24' : '#f87171'

    const timerColor = isLocked ? '#fde68a' : '#fecaca'

    const timerIcon = isLocked ? '🔒' : '⌛'

    // تیشکی ڕووناکی ستوونی — ڕەنگ لەپێی دەگمەنی (tarp/p1); دوای دابەزین لاواز دەبێتەوە

    const beamCore = chest.tarpColor

    const beamSoft = chest.p1

    const beamLandedOpacity = isLocked ? 0.55 : 0.28

    const beamFallOpacity = 0.95

    // Neon glow accents by rarity — Electric Cyan / Radiant Gold / Deep Magenta
    const neonAccent = chest.tarpColor
    const neonSoft = chest.p1
    const glassBorder = `${neonAccent}cc`

    const cIcon = L.divIcon({

      className: 'drop-marker-clean',

      html: `<div class="kd-airdrop-root kd-clickable-drop kd-drop-neon" data-drop-id="${escapeAttr(airdrop.id)}" style="--kd-drop-neon:${neonAccent};--kd-drop-neon-soft:${neonSoft};position:relative;width:92px;height:128px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;z-index:40;transform:translate3d(0,0,0);animation:pubgFall 45s cubic-bezier(0.1,0.8,0.4,1) forwards;animation-delay:${animDelay}s;">

               <div class="kd-airdrop-aura kd-drop-neon-ring" style="opacity:${showLanded ? 1 : 0.45};"></div>

               <div id="beam-glow-${markerUid}" class="kd-airdrop-beam-glow" style="position:absolute;bottom:28px;left:50%;width:56px;height:300px;margin-left:-28px;z-index:0;pointer-events:none;opacity:${showLanded ? beamLandedOpacity * 0.55 : beamFallOpacity * 0.5};transition:opacity 2.2s ease;background:linear-gradient(to top, ${beamCore}55 0%, ${beamSoft}33 35%, transparent 100%);filter:blur(14px);border-radius:50%;"></div>

               <div id="beam-${markerUid}" class="kd-airdrop-beam" style="position:absolute;bottom:30px;left:50%;width:12px;height:280px;margin-left:-6px;z-index:1;pointer-events:none;opacity:${showLanded ? beamLandedOpacity : beamFallOpacity};transition:opacity 2.2s ease;background:linear-gradient(to top, ${beamCore} 0%, ${beamCore}cc 12%, ${beamSoft}88 42%, ${beamSoft}22 72%, transparent 100%);box-shadow:0 0 12px ${beamCore},0 0 28px ${chest.smoke},0 0 48px ${beamSoft}66;filter:blur(0.6px);border-radius:40% 40% 12% 12%;animation:kdBeamPulse 2.4s ease-in-out infinite;"></div>

               <div id="para-${markerUid}" class="kd-airdrop-para" style="display:flex;flex-direction:column;align-items:center;transition:opacity 2s ease-in-out;margin-bottom:0;z-index:20;opacity:${showLanded ? 0 : 1};pointer-events:none;position:relative;flex-shrink:0;">
                 <div class="kd-para-canopy" aria-hidden="true"></div>
                 <div class="kd-para-cords" aria-hidden="true"></div>
                 <div class="kd-para-stem" aria-hidden="true"></div>
               </div>

               <div id="timer-wrapper-${markerUid}" class="kd-airdrop-timer kd-drop-glass-timer" style="opacity:${showLanded ? 1 : 0};border-color:${glassBorder};color:${timerColor};">
                 <span id="timer-icon-${markerUid}">${timerIcon}</span> <span id="timer-${markerUid}">${initialTimerText}</span>
               </div>

               <div id="chestbox-${markerUid}" class="kd-airdrop-hit kd-pubg-crate kd-drop-glass-crate" style="opacity:1;--kd-drop-neon:${neonAccent};--kd-drop-neon-soft:${neonSoft};">
                 <div class="kd-crate-pulse-ring" aria-hidden="true"></div>
                 <div class="kd-crate-3d" aria-hidden="true">
                   <div class="kd-crate-side"></div>
                   <div class="kd-crate-body"></div>
                   <div class="kd-crate-metal-sheen"></div>
                   <div class="kd-crate-tarp" style="background:linear-gradient(180deg,${neonSoft} 0%,${neonAccent} 55%,#0f172a 100%);box-shadow:inset 0 2px 0 rgba(255,255,255,0.35),0 0 12px ${neonAccent}99,0 0 0 1.5px ${neonAccent};"></div>
                   <div class="kd-crate-band kd-crate-band--v"></div>
                   <div class="kd-crate-band kd-crate-band--h"></div>
                   <div class="kd-crate-rivet r1"></div>
                   <div class="kd-crate-rivet r2"></div>
                   <div class="kd-crate-rivet r3"></div>
                   <div class="kd-crate-rivet r4"></div>
                 </div>
                 <div id="lock-${markerUid}" class="kd-crate-lock" style="opacity:${showLanded && isLocked ? 1 : 0};">🔒</div>
               </div>

               <div id="smoke-${markerUid}" class="kd-airdrop-smoke kd-pubg-smoke" style="opacity:${showLanded ? 1 : 0};">
                 <span class="kd-pubg-smoke-plume kd-pubg-smoke-plume--y"></span>
                 <span class="kd-pubg-smoke-plume kd-pubg-smoke-plume--r"></span>
                 <span class="kd-pubg-smoke-plume kd-pubg-smoke-plume--core"></span>
                 <span class="kd-real-smoke-puff p1"></span>
                 <span class="kd-real-smoke-puff p2"></span>
                 <span class="kd-real-smoke-puff p3"></span>
                 <span class="kd-real-smoke-puff p4"></span>
               </div>

             </div>`,

      iconSize: [92, 128],

      iconAnchor: [46, 122],

    })

    const marker = L.marker([airdrop.lat, airdrop.lng], {

      icon: cIcon,

      interactive: true,

      bubblingMouseEvents: false,

      keyboard: false,

      zIndexOffset: DROP_MARKER_Z_OFFSET,

    }).addTo(map)

    activeDropsRef.current.set(airdrop.id, { marker, data: airdrop })

    airdropsDataRef.current.set(airdrop.id, airdrop)

    updateDistTracker(userLatRef.current, userLngRef.current)

    if (showLanded) {

      startAirdropTimer(airdrop.id, airdrop.unlockAtMs, airdrop.despawnAtMs)

      const landedAgoMs = Date.now() - (airdrop.createdAtMs + AIRDROP_FALL_MS)

      if (landedAgoMs >= 0 && landedAgoMs < 90_000) announceDropLanded(airdrop)

      else announcedDropLandIdsRef.current.add(airdrop.id)

    } else {

      const prevFall = airdropFallTimersRef.current.get(airdrop.id)

      if (prevFall) clearTimeout(prevFall)

      const fallT = setTimeout(() => {

        airdropFallTimersRef.current.delete(airdrop.id)

        if (!activeDropsRef.current.has(airdrop.id)) return

        startAirdropTimer(airdrop.id, airdrop.unlockAtMs, airdrop.despawnAtMs)

        announceDropLanded(airdrop)

        const para = document.getElementById(`para-${markerUid}`)

        const smoke = document.getElementById(`smoke-${markerUid}`)

        const timerWrapper = document.getElementById(`timer-wrapper-${markerUid}`)

        const beam = document.getElementById(`beam-${markerUid}`)

        const beamGlow = document.getElementById(`beam-glow-${markerUid}`)

        const stillLocked = Date.now() < airdrop.unlockAtMs

        const dim = stillLocked ? 0.55 : 0.28

        if (para) para.style.opacity = '0'

        if (smoke) smoke.style.opacity = '1'

        if (timerWrapper) timerWrapper.style.opacity = '1'

        if (beam) beam.style.opacity = String(dim)

        if (beamGlow) beamGlow.style.opacity = String(dim * 0.7)

      }, Math.max(0, AIRDROP_FALL_MS - elapsed))

      airdropFallTimersRef.current.set(airdrop.id, fallT)

    }

  }, [startAirdropTimer, announceDropLanded])

  const removeAirdropMarker = useCallback((airdropId: string) => {

    const map = mapRef.current

    const entry = activeDropsRef.current.get(airdropId)

    if (entry && map) {

      try { map.removeLayer(entry.marker) } catch {}

    }

    activeDropsRef.current.delete(airdropId)

    airdropsDataRef.current.delete(airdropId)

    clearAirdropTimer(airdropId)

    updateDistTracker(userLatRef.current, userLngRef.current)

  }, [])

  const applyGpsPosition = useCallback((lat: number, lng: number, sync = true, forceSync = false) => {

    const prevLat = userLatRef.current, prevLng = userLngRef.current

    const moved = calcDistance(prevLat, prevLng, lat, lng)

    if (moved >= 1.2 && moved < 500) {

      selfMovingRef.current = true

      selfMovedAtRef.current = Date.now()

    } else if (Date.now() - selfMovedAtRef.current > 2200) {

      selfMovingRef.current = false

    }

    if (moved > 0 && moved < 500) {

      distanceAccumRef.current += moved

      if (distanceAccumRef.current >= 20) {

        const toSync = Math.round(distanceAccumRef.current)

        distanceAccumRef.current = 0

        const uid = userIdRef.current

        if (uid) {

          incrementPlayerStats(uid, { distanceTraveledM: toSync }).catch(() => {})

          const next = bumpMission(normalizeMissions(seasonPassRef.current), 'travelM', toSync)

          seasonPassRef.current = next

          setSeasonPass(next)

          saveSeasonPass(uid, next)

          setActivityArchive(appendActivity(uid, 'travel', `گەشتی نەخشە — ${toSync} مەتر`, '🚶'))

        }

      }

    }

    // شوێنپێی جوانکاری — کاتێک trail چالاکە و یاریزان دەجووڵێت

    const activeTrail = getActiveCosmetic(boughtItemsRef.current, 'trail')

    const fx = activeTrail?.trailFx

    if (fx && moved >= 3 && moved < 200) {

      const now = Date.now()

      if (now - lastFireTrailAtRef.current >= 450) {

        lastFireTrailAtRef.current = now

        const map = mapRef.current

        if (map) {

          let layer: L.CircleMarker | L.Marker

          if (fx.emoji && (fx.kind === 'glyph' || fx.kind === 'petal' || fx.kind === 'snow')) {

            layer = L.marker([prevLat, prevLng], {

              interactive: false,

              keyboard: false,

              icon: L.divIcon({

                className: '',

                html: `<div style="font-size:14px;line-height:1;filter:drop-shadow(0 0 4px ${fx.fillColor});opacity:0.95;">${fx.emoji}</div>`,

                iconSize: [16, 16],

                iconAnchor: [8, 8],

              }),

            }).addTo(map)

          } else {

            layer = L.circleMarker([prevLat, prevLng], {

              radius: fx.radius ?? 5,

              color: fx.color,

              fillColor: fx.fillColor,

              fillOpacity: 0.85,

              weight: 1,

              opacity: 0.9,

              interactive: false,

            }).addTo(map)

          }

          fireTrailLayersRef.current.push(layer)

          if (fireTrailLayersRef.current.length > 28) {

            const old = fireTrailLayersRef.current.shift()

            if (old) try { map.removeLayer(old) } catch {}

          }

          window.setTimeout(() => {

            try { map.removeLayer(layer) } catch {}

            fireTrailLayersRef.current = fireTrailLayersRef.current.filter(x => x !== layer)

          }, 3500)

        }

      }

    }

    const prevNearbyLat = userLatRef.current

    const prevNearbyLng = userLngRef.current

    userLatRef.current = lat

    userLngRef.current = lng

    userMarkerRef.current?.setLatLng([lat, lng])

    updateUserMarkerIcon()

    scheduleLayoutMapAvatars()

    if (calcDistance(prevNearbyLat, prevNearbyLng, lat, lng) >= 20) {

      bumpMapPlayersTick()

    }

    updateDistTracker(lat, lng)

    if (sync) pushLocationToFirestore(lat, lng, forceSync)

  }, [pushLocationToFirestore, updateUserMarkerIcon, scheduleLayoutMapAvatars, bumpMapPlayersTick])

  /** Hard mute beyond this distance (meters) from the player avatar. */

  const PLANE_AUDIO_MAX_DIST_M = 800

  const startPlaneSound = () => {

    if (!soundEnabledRef.current) return

    if (planeNodesRef.current) return // avoid overlapping engine loops

    try {

      const ctx = getAudioCtx()

      const osc1 = ctx.createOscillator(), osc2 = ctx.createOscillator()

      const filter = ctx.createBiquadFilter(), gain = ctx.createGain()

      osc1.type = 'sawtooth'; osc1.frequency.value = 55

      osc2.type = 'square';   osc2.frequency.value = 58

      filter.type = 'lowpass'; filter.frequency.value = 180

      osc1.connect(filter); osc2.connect(filter)

      filter.connect(gain); gain.connect(ctx.destination)

      gain.gain.value = 0

      osc1.start(); osc2.start()

      planeNodesRef.current = { osc1, osc2, gain }

    } catch {}

  }

  /** 3D distance attenuation: linear falloff to 0 at 800m, hard mute beyond. */

  const updatePlaneSound = (planeLat: number, planeLng: number) => {

    if (!soundEnabledRef.current || !planeSoundEnabledRef.current) { stopPlaneSound(); return }

    if (!planeNodesRef.current) startPlaneSound()

    if (!planeNodesRef.current) return

    const { gain, osc1, osc2 } = planeNodesRef.current

    const distM = calcDistance(planeLat, planeLng, userLatRef.current, userLngRef.current)

    // Linear: 1 at 0m → 0 at 800m; fully muted when farther than 800m

    const vol = distM > PLANE_AUDIO_MAX_DIST_M

      ? 0

      : Math.max(0, 1 - distM / PLANE_AUDIO_MAX_DIST_M)

    try {

      const ctx = getAudioCtx()

      gain.gain.setTargetAtTime(vol * 1.5 * planeVolumeRef.current, ctx.currentTime, 0.15)

      osc1.frequency.setTargetAtTime(55 + vol * 12, ctx.currentTime, 0.15)

      osc2.frequency.setTargetAtTime(58 + vol * 12, ctx.currentTime, 0.15)

    } catch {}

  }

  const stopPlaneSound = () => {

    if (!planeNodesRef.current) return

    const { gain, osc1, osc2 } = planeNodesRef.current

    planeNodesRef.current = null

    try {

      const ctx = getAudioCtx()

      gain.gain.cancelScheduledValues(ctx.currentTime)

      gain.gain.setValueAtTime(0, ctx.currentTime)

      osc1.stop(ctx.currentTime)

      osc2.stop(ctx.currentTime)

      osc1.disconnect(); osc2.disconnect(); gain.disconnect()

    } catch {

      try { osc1.stop() } catch {}

      try { osc2.stop() } catch {}

    }

  }

  // ✈️ فڕۆکەی هاوبەشی گشتی — HTML/SVGـی فڕۆکەکە جارێک دروست دەبێت و بۆ هەمیشە

  // هەمان مارکەر بەردەوام نوێ دەکرێتەوە (نەک دروستکردن/سڕینەوەی دووبارە)

  const buildPlaneIcon = (headingDeg: number) => {

    const planeSvg = `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">

      <defs>

        <linearGradient id="fusGrad-global" x1="0" y1="0" x2="1" y2="0">

          <stop offset="0%" stop-color="#94a3b8"/><stop offset="30%" stop-color="#ffffff"/><stop offset="70%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#64748b"/>

        </linearGradient>

        <linearGradient id="wingGrad-global" x1="0" y1="0" x2="0" y2="1">

          <stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#94a3b8"/>

        </linearGradient>

        <filter id="glowLight-global">

          <feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>

        </filter>

      </defs>

      <g>

        <path d="M45,135 L18,150 L18,155 L45,144 Z" fill="#cbd5e1"/>

        <path d="M55,135 L82,150 L82,155 L55,144 Z" fill="#cbd5e1"/>

        <path d="M42,65 L4,105 L4,116 L42,85 Z" fill="url(#wingGrad-global)"/>

        <path d="M58,65 L96,105 L96,116 L58,85 Z" fill="url(#wingGrad-global)"/>

        <rect x="20" y="85" width="8" height="18" rx="4" fill="#64748b"/>

        <rect x="72" y="85" width="8" height="18" rx="4" fill="#64748b"/>

        <ellipse cx="24" cy="86" rx="3" ry="1.5" fill="#1e293b"/>

        <ellipse cx="76" cy="86" rx="3" ry="1.5" fill="#1e293b"/>

        <path d="M50,10 C45,10 42,20 42,50 L42,130 C42,145 47,155 50,155 C53,155 58,145 58,130 L58,50 C58,20 55,10 50,10 Z" fill="url(#fusGrad-global)"/>

        <path d="M45,18 C45,15 50,14 55,18 L56,22 C50,23 46,22 44,22 Z" fill="#0284c7"/>

        <path d="M48,135 L50,112 L52,135 L52,152 L48,152 Z" fill="#0284c7"/>

        <path d="M42,60 L42,125 L43,125 L43,60 Z" fill="#0284c7" opacity="0.8"/>

        <path d="M58,60 L58,125 L57,125 L57,60 Z" fill="#0284c7" opacity="0.8"/>

        <line x1="44" y1="35" x2="44" y2="115" stroke="#334155" stroke-width="1.2" stroke-dasharray="1.5, 3"/>

        <line x1="56" y1="35" x2="56" y2="115" stroke="#334155" stroke-width="1.2" stroke-dasharray="1.5, 3"/>

        <circle cx="4" cy="105" r="1.5" fill="#ef4444" filter="url(#glowLight-global)"><animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite"/></circle>

        <circle cx="96" cy="105" r="1.5" fill="#22c55e" filter="url(#glowLight-global)"><animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite"/></circle>

      </g>

    </svg>`

    return L.divIcon({

      className: 'plane-marker-wrapper',

      html: `

        <div id="plane-global" style="position:relative;width:96px;height:144px;transform:rotate(${headingDeg}deg);transform-origin:center center;filter:drop-shadow(40px 60px 15px rgba(0,0,0,0.5));will-change:transform;">

          ${planeSvg}

          <div style="position:absolute;top:85%;left:22px;width:3px;height:160px;background:linear-gradient(to bottom,rgba(255,255,255,0.7),transparent);filter:blur(2px);z-index:-1;"></div>

          <div style="position:absolute;top:85%;right:22px;width:3px;height:160px;background:linear-gradient(to bottom,rgba(255,255,255,0.7),transparent);filter:blur(2px);z-index:-1;"></div>

        </div>`,

      iconSize: [96, 144],

      iconAnchor: [48, 72],

    })

  }

  // خولی ٢ کاتژمێری جێگیر (٠٨:٠٠، ١٠:٠٠، … UTC+3) — ٣٠ خولەک چالاک، پاشان ون

  useEffect(() => {

    if (authLoading || !mapReady) return

    let cancelled = false

    const startLoop = () => {

      if (cancelled) return

      const map = mapRef.current

      if (!map) return

      const tick = () => {

        if (cancelled) return

        const map2 = mapRef.current

        if (!map2) {

          planeRafIdRef.current = window.setTimeout(() => {
            planeRafIdRef.current = requestAnimationFrame(tick)
          }, 1000) as unknown as number

          return

        }

        const state = computeGlobalPlaneState(null, Date.now())

        if (!state) {

          // Plane left map / cycle idle — fully stop engine audio (no hanging loop)

          if (planeMarkerRef.current) {

            try { map2.removeLayer(planeMarkerRef.current) } catch {}

            planeMarkerRef.current = null

          }

          stopPlaneSound()

          // Idle: poll every 2.5s — 60fps rAF when no plane overheats phones
          planeRafIdRef.current = window.setTimeout(() => {
            planeRafIdRef.current = requestAnimationFrame(tick)
          }, 2500) as unknown as number

          return

        }

        const nowPerf = performance.now()
        const mobileCool = document.documentElement.classList.contains('kd-mobile-perf')
          || document.documentElement.classList.contains('low-gfx')
        const drawGap = mobileCool ? 80 : 33
        if (nowPerf - planeDrawThrottleRef.current >= drawGap) {
          planeDrawThrottleRef.current = nowPerf
          if (!planeMarkerRef.current) {
            planeMarkerRef.current = L.marker([state.lat, state.lng], {
              icon: buildPlaneIcon(state.headingDeg),
              interactive: false,
              keyboard: false,
              zIndexOffset: 8000,
            }).addTo(map2)
          } else {
            try { planeMarkerRef.current.setLatLng([state.lat, state.lng]) } catch {}
            const el = document.getElementById('plane-global')
            if (el) el.style.transform = `rotate(${state.headingDeg}deg)`
          }
          updatePlaneSound(state.lat, state.lng)
        }

        // Location-based aircraft notification — چوونە ناو سنووری شار
        const nowMs = Date.now()
        const announced = planeCityAnnouncedRef.current
        if (announced.cycleIndex !== state.cycleIndex) {
          announced.cycleIndex = state.cycleIndex
          announced.keys = new Set()
        }
        if (nowMs - planeCityCheckAtRef.current >= 450) {
          planeCityCheckAtRef.current = nowMs
          for (const city of CITY_AIRSPACES) {
            if (announced.keys.has(city.key)) continue
            const distM = calcDistance(state.lat, state.lng, city.lat, city.lng)
            if (distM <= city.radiusM) {
              announced.keys.add(city.key)
              announcePlaneCityArrivalRef.current(city)
              break
            }
          }
        }

        if (followPlaneRef.current && nowPerf - planeCamThrottleRef.current > 400) {
          planeCamThrottleRef.current = nowPerf
          try { map2.panTo([state.lat, state.lng], { animate: true, duration: 0.22 }) } catch {}
        }

        if (mobileCool) {
          planeRafIdRef.current = window.setTimeout(() => {
            planeRafIdRef.current = requestAnimationFrame(tick)
          }, drawGap) as unknown as number
        } else {
          planeRafIdRef.current = requestAnimationFrame(tick)
        }

      }

      planeRafIdRef.current = requestAnimationFrame(tick)

    }

    ensurePlaneGenesis().then(() => { if (!cancelled) startLoop() }).catch(err => console.error('Plane schedule failed:', err))

    return () => {

      cancelled = true

      if (planeRafIdRef.current != null) {
        window.cancelAnimationFrame(planeRafIdRef.current)
        window.clearTimeout(planeRafIdRef.current)
      }

      planeRafIdRef.current = null

      if (planeMarkerRef.current && mapRef.current) {

        try { mapRef.current.removeLayer(planeMarkerRef.current) } catch {}

      }

      planeMarkerRef.current = null

      stopPlaneSound()

    }

  }, [authLoading, mapReady])

  // خولی هەڵسەنگاندنی خشتەی گشتی درۆپەکان — هەر ئامێرێکی چالاک هەر ٢٠ چرکەجارێک

  // پشکنین دەکات ئایا intervalی هەر جۆرێک گەیشتووە یان نا (تەنها ئەو جۆرانەی کاتیان هاتووە

  // دروست دەبن — نەک هەموو جۆرەکان لە هەر سووڕانەوەی فڕۆکەدا)

  useEffect(() => {

    if (authLoading || !mapReady) return

    const uid = userIdRef.current

    if (!uid) return

    let cancelled = false

    const check = async () => {

      const genesisMs = await ensurePlaneGenesis().catch(() => null)

      if (cancelled || genesisMs == null) return

      await ensureAllScheduledDrops(genesisMs, uid).catch(err => console.error('Ensure scheduled drops failed:', err))

    }

    check()

    const timer = setInterval(check, SCHEDULE_CHECK_MS)

    return () => { cancelled = true; clearInterval(timer) }

  }, [authLoading, mapReady, authUserId])

  const triggerPersonalFlare = async () => {

    const uid = userIdRef.current

    if (!uid) return

    try {

      await createPersonalAirdrop(uid, userLatRef.current, userLngRef.current)

    } catch (err) {

      console.error('Personal flare failed:', err)

    }

  }

  triggerFlareRef.current = triggerPersonalFlare

  /** کڕینی پاکێجی زێڕ — نرخ بە USD (IAP placeholder) */
  const handleBuyGoldPack = useCallback(async (pack: { id: string; gold: number; usd: number }) => {
    const usdLabel = formatUsd(pack.usd)
    const ok = await showGameConfirm({
      title: 'کڕینی زێڕ',
      message: `ئایا دەتەوێت ${pack.gold.toLocaleString()} زێڕ بکڕیت بە ${usdLabel}؟`,
      icon: '🪙',
      confirmLabel: `کڕین · ${usdLabel}`,
      cancelLabel: 'پاشگەزبوونەوە',
    })
    if (!ok) return
    setWalletAndSync(w => ({
      ...w,
      gold: w.gold + pack.gold,
    }))
    showRewardToast({
      title: 'زێڕ وەرگیرا',
      message: `+${pack.gold.toLocaleString()} زێڕ (${usdLabel})`,
      icon: '🪙',
      inboxKind: 'other',
    })
  }, [setWalletAndSync, showGameConfirm, showRewardToast])

  /** کڕینی پاکێجی ئەڵماس — نرخ بە USD (IAP placeholder تا پارەدانی ڕاستەقینە ببەسترێت) */
  const handleBuyGemPack = useCallback(async (pack: { id: string; gems: number; usd: number }) => {
    const usdLabel = formatUsd(pack.usd)
    const ok = await showGameConfirm({
      title: 'کڕینی ئەڵماس',
      message: `ئایا دەتەوێت ${pack.gems.toLocaleString()} ئەڵماس بکڕیت بە ${usdLabel}؟`,
      icon: '💎',
      confirmLabel: `کڕین · ${usdLabel}`,
      cancelLabel: 'پاشگەزبوونەوە',
    })
    if (!ok) return
    setWalletAndSync(w => ({
      ...w,
      diamond: w.diamond + pack.gems,
    }))
    showRewardToast({
      title: 'ئەڵماس وەرگیرا',
      message: `+${pack.gems.toLocaleString()} ئەڵماس (${usdLabel})`,
      icon: '💎',
      inboxKind: 'other',
    })
  }, [setWalletAndSync, showGameConfirm, showRewardToast])

  const buyMarketItem = async (id: number) => {

    const uid = userIdRef.current

    const item = blackMarketItems.find(i => i.id === id)

    if (!uid || !item) return

    if (boughtItems.length >= inventoryCapacity && item.id !== 13 && item.id !== 1) {

      showGameAlert({

        title: 'جانتا پڕە',

        message: `❌ جانتاکەت پڕە! تەنها جێگەی ${inventoryCapacity} کەرەستەی تێدا دەبێتەوە. سەرەتا شتێک بسڕەوە یان بفرۆشە.`,

        icon: '🎒',

        tone: 'error',

      })

      return

    }

    const bal = wallet[item.curr as keyof typeof wallet] as number

    if (bal < item.price) {

      const currLabel = item.curr === 'diamond' ? 'ئەڵماس' : 'زێڕ'

      const currIcon = item.curr === 'diamond' ? '💎' : '🪙'

      showGameAlert({

        title: 'باڵانس بەش ناکات',

        message: `${currIcon} ${currLabel}ـەکەت بەش ناکات بۆ کڕینی «${item.name}». پێویستت بە ${item.price.toLocaleString()} ${currLabel} هەیە.`,

        icon: currIcon,

        tone: 'error',

      })

      return

    }

    try {

      await purchaseMarketItem(uid, {

        id: item.id,

        name: item.name,

        icon: item.icon,

        desc: item.desc,

        price: item.price,

        curr: item.curr as Currency,

      })

      if (item.id === 1) {

        closeDropdownAnimated()

        setTimeout(() => triggerFlareRef.current?.(), 100)

      } else {

        setHasViewedInv(false)

        showGameAlert({ message: `✅ ${item.name} کڕدرا و چوویە جانتاکەت.` })

      }

      addXP(XP_REWARDS.buyItem)

      {

        const next = bumpMission(normalizeMissions(seasonPassRef.current), 'buyItem', 1)

        seasonPassRef.current = next

        setSeasonPass(next)

        saveSeasonPass(uid, next)

      }

      logActivity('shopBuy', `کڕین لە فرۆشگا — ${item.name}`, '🛒')

    } catch (err) {

      const message = err instanceof Error ? err.message : 'کڕین سەرکەوتوو نەبوو'

      showGameAlert({ message: `❌ ${message}` })

    }

  }

  seasonPassRef.current = seasonPass

  vipPassesRef.current = vipPasses

  const persistSeason = useCallback((next: SeasonPassState) => {

    seasonPassRef.current = next

    setSeasonPass(next)

    saveSeasonPass(userIdRef.current, next)

    // تۆمارکردنی ڕۆژی تەواو بۆ ڕێڕەوی کوردستان

    const master = maybeRecordMasterPerfectDay(vipPassesRef.current.master, next)

    if (master !== vipPassesRef.current.master) {

      const vp = { ...vipPassesRef.current, master }

      vipPassesRef.current = vp

      setVipPasses(vp)

      const uid = userIdRef.current

      saveVipPasses(uid, vp)

      if (uid) syncVipPasses(uid, vp).catch(() => {})

    }

  }, [])

  const persistVipPasses = useCallback((next: VipPassesState) => {

    vipPassesRef.current = next

    setVipPasses(next)

    const uid = userIdRef.current

    saveVipPasses(uid, next)

    if (uid) {

      syncVipPasses(uid, next).catch(() => {})

      const active: PassKind[] = []

      if (next.tiktok.owned && next.tiktok.status === 'active') active.push('tiktok')

      if (next.facebook.owned && next.facebook.status === 'active') active.push('facebook')

      if (next.master.owned && next.master.status === 'active') active.push('master')

      syncPassOwnershipFlags(uid, { isPremium: anyPassOwned(next) || next.master.owned, activePasses: active }).catch(() => {})

    }

  }, [])

  // تۆماری ڕۆژی تەواو کاتێک ئەرکەکان پێشدەکەون (سەفەر/درۆپ/…)

  useEffect(() => {

    if (!vipPasses.master.owned || vipPasses.master.status !== 'active') return

    const master = maybeRecordMasterPerfectDay(vipPasses.master, normalizeMissions(seasonPass))

    if (master.perfectDayKeys.length === vipPasses.master.perfectDayKeys.length) return

    persistVipPasses({ ...vipPassesRef.current, master })

  }, [seasonPass, vipPasses.master.owned, vipPasses.master.status, vipPasses.master.perfectDayKeys.length, persistVipPasses])

  useEffect(() => {

    if (activeSheet !== 'premium' && activeSheet !== 'dailyBonus') return

    setPassNowMs(Date.now())

    const t = window.setInterval(() => setPassNowMs(Date.now()), 1000)

    return () => window.clearInterval(t)

  }, [activeSheet])

  useEffect(() => {

    if (activeSheet === 'dailyBonus') setDailyBonusViewDay(dailyBonusDay)

  }, [activeSheet, dailyBonusDay])

  // ئەگەر ٢٤ کاتژمێر دوای کاتی وەرگرتن داخڵ نەبوو → بگەڕێتەوە بۆ ڕۆژی ١
  useEffect(() => {
    if (!authUserId) return
    if (!isDailyBonusStreakBroken(dailyBonusLastClaimMs, passNowMs)) return
    if (dailyBonusDay === 1) return
    setDailyBonusDay(1)
    setDailyBonusViewDay(1)
    persistDailyBonusStreakReset(authUserId, userProfileRef.current?.playerId).catch(() => {})
  }, [authUserId, dailyBonusLastClaimMs, dailyBonusDay, passNowMs])

  useEffect(() => {

    if (activeSheet !== 'dailyBonus' || !dailyTabStripRef.current) return

    const tab = dailyTabStripRef.current.querySelector(`[data-daily-tab="${dailyBonusViewDay}"]`)

    tab?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })

  }, [activeSheet, dailyBonusViewDay])

  const buyVipPass = useCallback(async (kind: PassKind) => {

    if (kind !== 'master') {

      showGameAlert({

        title: 'ڕێڕەوی کوردستان',

        message: 'تەنها یەک جۆری ڕێڕەو بەردەستە: ڕێڕەوی کوردستان.',

        icon: '🏔',

        tone: 'warn',

      })

      return

    }

    const def = PASS_DEFS[kind]

    const cost = def.diamondCost

    const displayTitle = getKurdistanSeasonInfo().title

    if (wallet.diamond < cost) {

      showGameAlert({

        title: 'ئەڵماس بەش ناکات',

        message: `💎 ئەڵماسەکانت بەش ناکەن بۆ کڕینی «${displayTitle}». پێویستت بە ${cost} ئەڵماس هەیە.`,

        icon: '💎',

        tone: 'error',

      })

      return

    }

    if (!await showGameConfirm({

      title: 'کڕینی ڕێڕەوی کوردستان',

      message: `کڕینی ${displayTitle} بە ${cost} ئەڵماس؟`,

      icon: '🏔',

      confirmLabel: 'کڕین',

      cancelLabel: 'پاشگەزبوونەوە',

    })) return

    const result = purchasePass(vipPassesRef.current, kind)

    if (!result.ok) {

      showPassAlert(result.alert)

      return

    }

    const premium = anyPassOwned(result.state) || kind === 'master'

    setWalletAndSync(p => ({ ...p, diamond: p.diamond - cost, isPremium: premium || p.isPremium }))

    // ڕێڕەوی کوردستان = تاجی VIP + پلەی پادشا
    if (kind === 'master') {

      const sp = { ...normalizeMissions(seasonPassRef.current), eliteOwned: true }

      persistSeason(sp)

      const myUid = userIdRef.current
      const base = userProfileRef.current
      if (myUid && base) {
        const prevDrops = parseDropsOpenedByType(base.dropsOpenedByType ?? EMPTY_DROPS_OPENED)
        const dropsOpenedByType = ensureDropsForMinLevel(prevDrops, PADSHA_HUNTER_LEVEL)
        const hunterLevel = Math.max(computeHunterLevel(dropsOpenedByType), PADSHA_HUNTER_LEVEL)
        const next = { ...base, dropsOpenedByType, hunterLevel }
        userProfileRef.current = next
        setUserProfile(next)
        selfIconSigRef.current = ''
        updateUserMarkerIcon()
        syncUserProfile(myUid, { dropsOpenedByType, hunterLevel }).catch(() => {})
        showRewardToast({
          title: 'پادشا',
          message: 'بە کڕینی ڕێڕەوی کوردستان پلەکەت بوو بە پادشا 👑',
          icon: '👑',
          inboxKind: 'other',
        })
      }

    }

    persistVipPasses(result.state)

    logActivity('shopBuy', `کڕینی ${displayTitle}`, '🏔')

    showRewardToast({ title: 'چالاک بوو', message: `پیرۆزە! ${displayTitle} چالاک بوو`, icon: '🏔', inboxKind: 'other' })

    setPassView(kind)

    setSocialLinkInput('')

  }, [wallet.diamond, setWalletAndSync, persistVipPasses, persistSeason, logActivity, showPassAlert, showGameAlert, showGameConfirm, showRewardToast, updateUserMarkerIcon])

  const handleSocialSubmit = useCallback(async (kind: 'tiktok' | 'facebook') => {

    const before = vipPassesRef.current[kind]

    const result = submitSocialPassLink(before, kind, socialLinkInput)

    if (!result.ok) {

      persistVipPasses({ ...vipPassesRef.current, [kind]: result.state })

      showPassAlert(result.alert)

      // تۆماری هەوڵی دووبارە بۆ ئەدمین

      if (result.alert.message.includes('دووبارە') || result.alert.message.includes('لینکی دووبارە')) {

        const parsed = normalizeSocialUrl(socialLinkInput)

        const uid = userIdRef.current

        if (uid && parsed) {

          recordSocialPassSubmission({

            uid,

            playerId: userProfileRef.current?.playerId,

            playerName: userProfileRef.current?.name,

            kind,

            link: socialLinkInput.trim(),

            postId: parsed.postId,

            completedDays: result.state.completedDays,

            duplicateAttempt: true,

          }).catch(() => {})

        }

      }

      return

    }

    persistVipPasses({ ...vipPassesRef.current, [kind]: result.state })

    setSocialLinkInput('')

    showRewardToast({ title: 'پاس', message: result.message, icon: '🔗', inboxKind: 'other' })

    if (soundEnabledRef.current && chestSoundEnabledRef.current) playClaimSfx(chestVolumeRef.current)

    const uid = userIdRef.current

    const parsed = normalizeSocialUrl(socialLinkInput)

    if (uid && parsed) {

      recordSocialPassSubmission({

        uid,

        playerId: userProfileRef.current?.playerId,

        playerName: userProfileRef.current?.name,

        kind,

        link: socialLinkInput.trim(),

        postId: parsed.postId,

        completedDays: result.state.completedDays,

      }).catch(() => {})

    }

    logActivity('passClaim', `${PASS_DEFS[kind].title} — ڕۆژی ${result.state.completedDays}`, '🔗')

  }, [socialLinkInput, persistVipPasses, showPassAlert, logActivity, showRewardToast])

  const handleClaimSocialFinal = useCallback((kind: 'tiktok' | 'facebook') => {

    const result = claimSocialFinalReward(vipPassesRef.current[kind])

    if (!result.ok) {

      showPassAlert(result.alert)

      return

    }

    setWalletAndSync(p => ({ ...p, diamond: p.diamond + result.diamond }))

    persistVipPasses({ ...vipPassesRef.current, [kind]: result.state })

    if (soundEnabledRef.current && chestSoundEnabledRef.current) playClaimSfx(chestVolumeRef.current)

    showRewardToast({ title: 'خەڵاتی کۆتایی', message: `${result.diamond.toLocaleString()} ئەڵماس وەرگیرا!`, icon: '💎', inboxKind: 'other' })

    logActivity('passClaim', `خەڵاتی کۆتایی ${PASS_DEFS[kind].title}`, '💰')

  }, [setWalletAndSync, persistVipPasses, showPassAlert, logActivity, showRewardToast])

  const handleClaimMasterDaily = useCallback(() => {

    const result = claimMasterDailyReward(vipPassesRef.current.master)

    if (!result.ok) {

      showPassAlert(result.alert)

      return

    }

    if (result.reward.kind === 'gold') {

      setWalletAndSync(p => ({ ...p, gold: p.gold + result.reward.amount }))

    } else {

      setWalletAndSync(p => ({ ...p, diamond: p.diamond + result.reward.amount }))

    }

    persistVipPasses({ ...vipPassesRef.current, master: result.state })

    if (soundEnabledRef.current && chestSoundEnabledRef.current) playClaimSfx(chestVolumeRef.current)

    showRewardToast({ title: 'خەڵاتی ڕۆژانە', message: result.message, icon: '🎁', inboxKind: 'other' })

    logActivity('passClaim', `خەڵاتی ڕۆژانەی ڕێڕەوی کوردستان — ${result.message}`, '🎁')

  }, [setWalletAndSync, persistVipPasses, showPassAlert, logActivity, showRewardToast])

  const handleSettleMaster = useCallback(() => {

    const result = settleMasterPass(vipPassesRef.current.master)

    if (!result.ok) {

      showPassAlert(result.alert)

      return

    }

    if (result.outcome === 'success') {

      if (!result.state.finalRewardClaimed) {

        setWalletAndSync(p => ({ ...p, diamond: p.diamond + result.diamond }))

        persistVipPasses({

          ...vipPassesRef.current,

          master: markMasterFinalClaimed(result.state),

        })

        showRewardToast({ title: 'ڕێڕەوی کوردستان', message: result.message, icon: '🏔', inboxKind: 'other' })

        logActivity('passClaim', `خەڵاتی کۆتایی ڕێڕەوی کوردستان — ${MASTER_FINAL_DIAMOND.toLocaleString()} ئەڵماس`, '🏔')

      }

    } else {

      if (!result.state.refundGranted) {

        setWalletAndSync(p => ({ ...p, diamond: p.diamond + result.refundDiamonds }))

        persistVipPasses({

          ...vipPassesRef.current,

          master: markMasterRefundGranted(result.state),

        })

        showPassAlert({ tone: 'warn', message: result.message })

        logActivity('passClaim', `گەڕاندنەوەی ${MASTER_FAIL_REFUND_DIAMONDS} ئەڵماس — ڕێڕەوی کوردستان سەرنەکەوت`, '↩️')

      }

    }

    if (soundEnabledRef.current && chestSoundEnabledRef.current) playClaimSfx(chestVolumeRef.current)

  }, [setWalletAndSync, persistVipPasses, showPassAlert, logActivity, showRewardToast])

  const claimRpMission = useCallback((missionId: string) => {

    const claimed = claimMissionXp(seasonPassRef.current, missionId)

    if (!claimed) {

      showPassAlert({ tone: 'error', message: '❌ ئەسپاردە تەواو نەبووە یان پێشتر وەرگیراوە' })

      return

    }

    persistSeason(claimed)

    if (soundEnabledRef.current && chestSoundEnabledRef.current) playClaimSfx(chestVolumeRef.current)

    const def = RP_MISSIONS.find(m => m.id === missionId)

    logActivity('passClaim', `تەواوکردنی ئەسپاردە — ${def?.title ?? missionId}`, '📜')

    showRewardToast({ title: 'ئەسپاردە', message: `✅ ئەسپاردە تەواو بوو: ${def?.title ?? ''}`, icon: '📜', inboxKind: 'other' })

  }, [persistSeason, logActivity, showPassAlert, showRewardToast])

  // ── Map setup ──────────────────────────────────────────────────────────────

  useEffect(() => {

    if (!authUserId) return

    let disposed = false
    let map: L.Map | null = null
    let markersGroup: L.FeatureGroup | null = null
    let mountRaf = 0
    let mountT100: ReturnType<typeof setTimeout> | undefined
    let mountT300: ReturnType<typeof setTimeout> | undefined
    let readyT300: ReturnType<typeof setTimeout> | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let retries = 0

    const tearDown = () => {
      if (mountRaf) cancelAnimationFrame(mountRaf)
      if (mountT100 != null) clearTimeout(mountT100)
      if (mountT300 != null) clearTimeout(mountT300)
      if (readyT300 != null) clearTimeout(readyT300)
      if (retryTimer != null) clearTimeout(retryTimer)

      if (markersGroup) {
        otherPlayerMarkersRef.current.forEach(marker => {
          try { markersGroup!.removeLayer(marker) } catch {}
        })
        otherPlayerMarkersRef.current.clear()
        if (map) {
          try { map.removeLayer(markersGroup) } catch {}
        }
      }
      playerMarkersGroupRef.current = null

      if (map) {
        fireTrailLayersRef.current.forEach(layer => { try { map!.removeLayer(layer) } catch {} })
        fireTrailLayersRef.current = []

        activeDropsRef.current.forEach(({ marker }) => {
          try { map!.removeLayer(marker) } catch {}
        })
        activeDropsRef.current.clear()

        airdropTimersRef.current.forEach(t => clearInterval(t))
        airdropTimersRef.current.clear()

        airdropFallTimersRef.current.forEach(t => clearTimeout(t))
        airdropFallTimersRef.current.clear()

        try { map.remove() } catch {}
      }

      mapRef.current = null
      userMarkerRef.current = null
      baseTileLayerRef.current = null
      setMapReady(false)
    }

    const initMap = () => {
      if (disposed || mapRef.current) return

      const host = document.getElementById('leaflet-map')
      if (!host) {
        // DOM may lag one frame behind authUserId — retry briefly
        if (retries++ < 40) {
          retryTimer = setTimeout(initMap, 16)
        } else {
          console.error('Map init failed: #leaflet-map never appeared')
        }
        return
      }

      const initLat = Number.isFinite(userLatRef.current) ? userLatRef.current : DEFAULT_MAP_CENTER[0]
      const initLng = Number.isFinite(userLngRef.current) ? userLngRef.current : DEFAULT_MAP_CENTER[1]
      const localHttp = isLocalNetworkHttpOrigin()
      const startLat = localHttp ? DEFAULT_MAP_CENTER[0] : initLat
      const startLng = localHttp ? DEFAULT_MAP_CENTER[1] : initLng

      let created: L.Map
      try {
        created = L.map(host, {
          zoomControl: false,
          attributionControl: false,
          minZoom: 2,
          maxZoom: 19,
          trackResize: true,
          zoomAnimation: true,
          fadeAnimation: false,
          markerZoomAnimation: true,
          inertia: true,
          inertiaDeceleration: 2800,
          easeLinearity: 0.2,
          wheelPxPerZoomLevel: 70,
          zoomSnap: 0.5,
          zoomDelta: 0.5,
        }).setView([startLat, startLng], 14)
      } catch (err) {
        console.error('Map init failed:', err)
        return
      }
      if (disposed) {
        try { created.remove() } catch {}
        return
      }

      map = created
      host.style.width = '100%'
      host.style.height = '100%'
      host.style.minHeight = '100dvh'
      mapRef.current = map
      // یاری دەستبەجێ — مەچاوەڕوانە whenReady بۆ GPS/socket
      setMapReady(true)

      // Player-related popups/tooltips must not pan the map (scrambles the tap target)
      try { L.Popup.mergeOptions({ autoPan: false }) } catch {}
      try { L.Tooltip.mergeOptions({ sticky: false }) } catch {}

      const initialTheme = readStoredMapTheme()
      const tiles = createMapThemeTileLayer(initialTheme).addTo(map)
      baseTileLayerRef.current = tiles
      try {
        tiles.on('tileerror', () => {
          try { map!.invalidateSize({ animate: false }) } catch { /* ignore */ }
        })
      } catch (err) {
        console.error('Map tile fallback binding failed:', err)
      }
      try {
        applyMapThemeClass(map.getContainer(), initialTheme)
      } catch { /* ignore */ }

      const bumpSize = () => {
        try { map!.invalidateSize({ animate: false }) } catch {}
      }

      // Mount + delayed passes fill 100% after first paint / safe-area settle
      mountRaf = requestAnimationFrame(bumpSize)
      mountT100 = setTimeout(bumpSize, 60)
      mountT300 = setTimeout(bumpSize, 180)

      mapZoomRef.current = map.getZoom()

      userMarkerRef.current = L.marker([userLatRef.current, userLngRef.current], {
        icon: L.divIcon({
          className: 'avatar-marker-clean',
          html: buildSelfPlayerMarkerHtml(maleAvatar, 0, null, null, null),
          iconSize: PLAYER_MARKER_ICON_SIZE,
          iconAnchor: PLAYER_MARKER_ICON_ANCHOR,
        }),
        pane: 'markerPane',
        interactive: true,
        bubblingMouseEvents: false,
        keyboard: false,
        zIndexOffset: 3600,
      }).addTo(map)

      // No MarkerClusterGroup — avatars stay individually tappable at every zoom
      markersGroup = L.featureGroup()
      markersGroup.addTo(map)
      playerMarkersGroupRef.current = markersGroup

      map.whenReady(() => {
        if (disposed) return
        // سەرەتای یاری — کلیکی کارەکتەر دەستبەجێ کار بکات (بێ GPS settle block)
        mapGestureRef.current.blockedUntil = 0
        mapGestureRef.current.userMapGesture = false
        mapGestureRef.current.zooming = false
        mapGestureRef.current.dragging = false
        updateUserMarkerIconRef.current()
        bumpSize()
        readyT300 = setTimeout(() => {
          if (disposed || !map) return
          bumpSize()
          try {
            map.invalidateSize({ animate: false })
            map.fire('moveend')
          } catch {}
          mapGestureRef.current.blockedUntil = 0
        }, 160)
      })
    }

    initMap()

    return () => {
      disposed = true
      tearDown()
    }

  }, [authUserId, buildSelfPlayerMarkerHtml])

  useEffect(() => {
    if (!authUserId || !mapReady) return
    const map = mapRef.current
    if (!map) return
    const host = document.getElementById('leaflet-map')
    const invalidate = () => {
      try { map.invalidateSize({ animate: false }) } catch (err) { console.error('Post-auth map resize failed:', err) }
    }
    const raf = requestAnimationFrame(invalidate)
    const t120 = setTimeout(invalidate, 80)
    const t420 = setTimeout(invalidate, 220)
    let ro: ResizeObserver | null = null
    if (host && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => invalidate())
      ro.observe(host)
    }
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t120)
      clearTimeout(t420)
      ro?.disconnect()
    }
  }, [authUserId, mapReady])

  /** سووڕانەوەی ٤ شێوازی نەخشە + بڵقی کوردی ٢ چرکە */
  const toggleMapTheme = useCallback(() => {
    setMapTheme((prev) => {
      const next = nextMapTheme(prev)
      persistMapTheme(next)
      if (mapThemeToastTimerRef.current != null) {
        window.clearTimeout(mapThemeToastTimerRef.current)
      }
      setMapThemeToast(MAP_THEME_LABELS[next])
      mapThemeToastTimerRef.current = window.setTimeout(() => {
        setMapThemeToast(null)
        mapThemeToastTimerRef.current = null
      }, 2000)
      return next
    })
  }, [])

  useEffect(() => {
    return () => {
      if (mapThemeToastTimerRef.current != null) {
        window.clearTimeout(mapThemeToastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    const wantUrl = mapThemeTileUrl(mapTheme)
    const prev = baseTileLayerRef.current
    const prevUrl = (prev as L.TileLayer & { _url?: string } | null)?._url
    if (prev && prevUrl === wantUrl) {
      try {
        applyMapThemeClass(map.getContainer(), mapTheme)
      } catch { /* ignore */ }
      return
    }

    if (prev) {
      try { map.removeLayer(prev) } catch { /* ignore */ }
      baseTileLayerRef.current = null
    }

    const tiles = createMapThemeTileLayer(mapTheme).addTo(map)
    baseTileLayerRef.current = tiles

    try {
      applyMapThemeClass(map.getContainer(), mapTheme)
    } catch { /* ignore */ }
  }, [mapReady, mapTheme])

  // GPS → Firestore locations/{uid}

  useEffect(() => {

    if (authLoading || !mapReady || !userIdRef.current) return

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(

      pos => {

        applyGpsPosition(pos.coords.latitude, pos.coords.longitude, true, true)

        try { mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15) } catch {}

      },

      () => {},

      { enableHighAccuracy: true },

    )

    geoWatchIdRef.current = navigator.geolocation.watchPosition(

      pos => {

        applyGpsPosition(pos.coords.latitude, pos.coords.longitude)

        if (!homeCityKeyRef.current) {
          const uid = userIdRef.current
          if (uid) {
            ensureHomeCityKey(uid, pos.coords.latitude, pos.coords.longitude).then(key => {
              if (key) homeCityKeyRef.current = key
            }).catch(() => {})
          }
        }

        if (followMeRef.current) {

          try { mapRef.current?.panTo([pos.coords.latitude, pos.coords.longitude], { animate: true }) } catch {}

        }

      },

      () => {},

      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },

    )

    // دڵنیابوونەوە کە شوێن بڵاوکراوەتەوە (بەتایبەت ئایدی 00000001)
    const bootPush = window.setTimeout(() => {
      const uid = userIdRef.current
      if (!uid) return
      if (!Number.isFinite(userLatRef.current) || !Number.isFinite(userLngRef.current)) return
      pushLocationToFirestore(userLatRef.current, userLngRef.current, true)
    }, 500)

    return () => {

      window.clearTimeout(bootPush)

      if (geoWatchIdRef.current != null) {

        navigator.geolocation.clearWatch(geoWatchIdRef.current)

        geoWatchIdRef.current = null

      }

    }

  }, [authLoading, mapReady, applyGpsPosition, pushLocationToFirestore])

  useEffect(() => {

    if (!mapReady) return

    updateUserMarkerIcon()

  }, [mapReady, userProfile, boughtItems, showMyAvatarOnMap, selfMapFx, updateUserMarkerIcon])

  /** Zoom → refresh CSS visual scale only (Leaflet iconSize/iconAnchor stay fixed). */

  const refreshOtherPlayerIconsForZoom = useCallback(() => {

    const visualScale = useFullBody3DAvatar ? fullBodyScaleForZoom(mapZoomRef.current) : 1

    const players = onlinePlayersRef.current

    otherPlayerMarkersRef.current.forEach((marker, uid) => {

      const player = players.get(uid)

      if (!player) return

      const motion = otherPlayerMotionRef.current.get(uid)

      const avatarUrl = player.avatarUrl || avatarForGender(player.gender)

      const hunterLvl = player.hunterLevel ?? 0

      const skin = player.skinId != null ? COSMETIC_BY_ID[player.skinId] ?? null : null

      const border = player.borderId != null ? COSMETIC_BY_ID[player.borderId] ?? null : null

      const title = player.titleId != null ? COSMETIC_BY_ID[player.titleId] ?? null : null

      const headwear = player.headwearId != null ? COSMETIC_BY_ID[player.headwearId] ?? null : null

      const accessory = player.accessoryId != null ? COSMETIC_BY_ID[player.accessoryId] ?? null : null

      const a3d = player.avatar3d ? normalizeAvatar3d(player.avatar3d) : null

      const moving = motion ? motion.moving : null

      const isSelected = selectedPlayerUidRef.current === uid

      const sig = [

        visualScale,

        player.gender,

        avatarUrl,

        hunterLvl,

        player.skinId ?? '',

        player.borderId ?? '',

        player.titleId ?? '',

        player.headwearId ?? '',

        player.accessoryId ?? '',

        avatar3dSignature(a3d),

        player.smokeUntilMs || 0,

        player.duelFxUntilMs || 0,

        player.activeDuelId || '',

        moving === true ? '1' : moving === false ? '0' : 'g',

        isSelected ? '1' : '0',

        showPlayerNamesRef.current ? '1' : '0',

        showPlayerNamesRef.current ? (player.name || '') : '',

      ].join('|')

      otherPlayerIconSigRef.current.set(uid, sig)

      marker.setIcon(L.divIcon({

        className: 'avatar-marker-clean',

        html: buildOnlinePlayerMarkerHtml(

          player.uid, avatarUrl, hunterLvl, skin, border, title, headwear, accessory,

          player.smokeUntilMs || 0, player.duelFxUntilMs || 0, player.activeDuelId || null,

          player.gender,

          moving,

          undefined,

          a3d,

          isSelected,

          player.name,

        ),

        iconSize: PLAYER_MARKER_ICON_SIZE,

        iconAnchor: PLAYER_MARKER_ICON_ANCHOR,

      }))

      marker.setZIndexOffset(isSelected ? 5200 : 0)

      window.requestAnimationFrame(() => {
        const chatHtml = buildMapChatBubbleHtml(uid, mapChatBubblesRef.current, revealedMapChatIdsRef.current, userIdRef.current, hideGlobalChatRef.current)
        const fxHtml = buildMapEffectOverlayHtml(uid, mapAvatarOverlaysRef.current)
        patchMarkerChatOverlay(marker, chatHtml, uid)
        patchMarkerFxOverlay(marker, fxHtml)
      })

    })

  }, [buildOnlinePlayerMarkerHtml])

  useEffect(() => {

    if (!mapReady) return

    const map = mapRef.current

    if (!map) return

    const onZoomRecompute = () => {

      const z = map.getZoom()

      const prev = mapZoomRef.current

      mapZoomRef.current = z

      // 25m geo layout + CSS scale refresh — Leaflet iconAnchor never changes

      scheduleLayoutMapAvatars()

      const prevScale = useFullBody3DAvatar ? fullBodyScaleForZoom(prev) : 1

      const nextScale = useFullBody3DAvatar ? fullBodyScaleForZoom(z) : 1

      if (prevScale !== nextScale) {

        selfIconSigRef.current = ''

        updateUserMarkerIcon()

        refreshOtherPlayerIconsForZoom()

      }

    }

    const onZoomLive = () => { mapZoomRef.current = map.getZoom() }

    map.on('zoomend', onZoomRecompute)

    map.on('zoom', onZoomLive)

    return () => {

      try { map.off('zoomend', onZoomRecompute) } catch {}

      try { map.off('zoom', onZoomLive) } catch {}

    }

  }, [mapReady, updateUserMarkerIcon, refreshOtherPlayerIconsForZoom, scheduleLayoutMapAvatars])

  // Pinch / zoom / drag — block marker taps until 500ms after gesture ends
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map) return
    const container = map.getContainer()
    const g = mapGestureRef

    const isMapTouchTarget = (e: TouchEvent) => {
      const t = e.target
      if (!(t instanceof Node)) return false
      return container.contains(t)
    }

    const onDragStart = () => {
      g.current.dragging = true
      g.current.userMapGesture = true
    }
    const onDragEnd = () => {
      g.current.dragging = false
      if (g.current.userMapGesture) {
        extendMapMarkerClickBlock(g)
        g.current.userMapGesture = false
      }
    }
    const onZoomStart = () => { g.current.zooming = true }
    const onZoomEnd = () => {
      g.current.zooming = false
      // تەنها دوای pinch/drag ـی بەکارهێنەر — نەک GPS setView لە سەرەتا
      if (g.current.userMapGesture) {
        extendMapMarkerClickBlock(g)
        g.current.userMapGesture = false
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!isMapTouchTarget(e)) return
      if (e.touches.length > 1) {
        g.current.pinching = true
        g.current.userMapGesture = true
        g.current.singleTouchActive = false
        g.current.singleTouchMoved = false
        return
      }
      if (e.touches.length === 1) {
        g.current.singleTouchActive = true
        g.current.singleTouchMoved = false
        g.current.singleTouchStartX = e.touches[0].clientX
        g.current.singleTouchStartY = e.touches[0].clientY
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isMapTouchTarget(e) && !g.current.pinching && !g.current.singleTouchActive) return
      if (e.touches.length > 1) {
        g.current.pinching = true
        g.current.userMapGesture = true
        return
      }
      if (g.current.singleTouchActive && e.touches.length === 1) {
        const dx = e.touches[0].clientX - g.current.singleTouchStartX
        const dy = e.touches[0].clientY - g.current.singleTouchStartY
        if (dx * dx + dy * dy > MAP_TOUCH_DRAG_THRESHOLD_PX * MAP_TOUCH_DRAG_THRESHOLD_PX) {
          g.current.singleTouchMoved = true
          g.current.userMapGesture = true
        }
      }
    }

    const finishTouch = () => {
      if (g.current.pinching) {
        g.current.pinching = false
        if (g.current.userMapGesture) {
          extendMapMarkerClickBlock(g)
          g.current.userMapGesture = false
        }
      }
      if (g.current.singleTouchActive) {
        if (g.current.singleTouchMoved && g.current.userMapGesture) {
          extendMapMarkerClickBlock(g)
          g.current.userMapGesture = false
        }
        g.current.singleTouchActive = false
        g.current.singleTouchMoved = false
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!isMapTouchTarget(e) && !g.current.pinching && !g.current.singleTouchActive) return
      finishTouch()
    }

    map.on('dragstart', onDragStart)
    map.on('dragend', onDragEnd)
    map.on('zoomstart', onZoomStart)
    map.on('zoomend', onZoomEnd)
    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true })
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: true })
    window.addEventListener('touchend', onTouchEnd, { capture: true, passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { capture: true, passive: true })

    return () => {
      map.off('dragstart', onDragStart)
      map.off('dragend', onDragEnd)
      map.off('zoomstart', onZoomStart)
      map.off('zoomend', onZoomEnd)
      window.removeEventListener('touchstart', onTouchStart, true)
      window.removeEventListener('touchmove', onTouchMove, true)
      window.removeEventListener('touchend', onTouchEnd, true)
      window.removeEventListener('touchcancel', onTouchEnd, true)
    }
  }, [mapReady])

  // داواکاری شەڕی نێردراو — چاوەڕوانی قبوڵکردن / دەستپێکردنی ئارێنا

  useEffect(() => {

    if (!outgoingChallenge) return

    const duelId = outgoingChallenge.duelId

    const unsub = subscribeToDuel(duelId, room => {

      if (!room) return

      if (room.status === 'active') {

        setOutgoingChallenge(null)

        outgoingChallengeRef.current = null

        setArenaSession({ duelId, mode: 'fighter' })

        setSelfMapFx(prev => ({ ...prev, activeDuelId: duelId, duelFxUntilMs: room.endsAtMs || Date.now() + 5 * 60_000 }))

      } else if (room.status === 'declined' || room.status === 'expired') {

        setOutgoingChallenge(null)

        outgoingChallengeRef.current = null

        if (room.status === 'declined') showGameAlert({ message: 'داواکاری شەڕ ڕەتکرایەوە — ٢٤ کاتژمێر قەدەغە بۆ ئەم کەسە' })

        else showGameAlert({ message: 'کاتی ١٥ چرکە تەواوبوو — داواکاری بەسەرچوو' })

      }

    })

    const expireTimer = window.setTimeout(() => {

      void expirePendingChallenge(duelId)

    }, Math.max(500, outgoingChallenge.expiresAtMs - Date.now() + 200))

    return () => {

      unsub()

      window.clearTimeout(expireTimer)

    }

  }, [outgoingChallenge?.duelId])

  // نوێکردنەوەی تایمەری ١٥چ / بەسەرچوونی داواکاری هاتوو

  const [, setChallengeClock] = useState(0)

  useEffect(() => {

    if (!incomingChallenge && !outgoingChallenge) return

    const id = window.setInterval(() => {

      setChallengeClock(c => c + 1)

      const inc = incomingChallenge

      if (inc && inc.expiresAtMs <= Date.now()) {

        void expirePendingChallenge(inc.duelId)

        setIncomingChallenge(null)

      }

    }, 400)

    return () => window.clearInterval(id)

  }, [incomingChallenge, outgoingChallenge])

  // هۆست-ئۆثۆریتیڤ: تیک لە پاشبنەما تەنانەت ئەگەر مۆداڵ داخرا بێت

  useEffect(() => {

    const duelId = selfMapFx.activeDuelId

    const myUid = userIdRef.current

    if (!duelId || !myUid) return

    let room: DuelRoom | null = null

    let lastTick = 0

    const unsub = subscribeToDuel(duelId, next => { room = next })

    const id = window.setInterval(() => {

      const r = room

      if (!r || r.status !== 'active' || r.hostUid !== myUid) return

      // ئەگەر مۆداڵی شەڕکەر کراوەتەوە، تیک لەناو کۆمپۆنێنتەکەدایە

      if (arenaSessionRef.current?.duelId === duelId && arenaSessionRef.current.mode === 'fighter') return

      const now = Date.now()

      if (now - lastTick < 160) return

      lastTick = now

      const next = hostSimulateTick(r, now)

      room = next

      void pushHostDuelState(duelId, {

        challenger: next.challenger,

        defender: next.defender,

        status: next.status,

        outcome: next.outcome,

        winnerUid: next.winnerUid,

        loserUid: next.loserUid,

        lastTickMs: next.lastTickMs,

      })

    }, 160)

    return () => {

      unsub()

      window.clearInterval(id)

    }

  }, [selfMapFx.activeDuelId])

  const handleToggleHighGraphics = useCallback((next: boolean) => {
    setHighGraphics(next)
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { highGraphics: next, batterySaver: !next }).catch(() => {})
  }, [])

  const handleToggleShowPlayerNames = useCallback((next: boolean) => {
    setShowPlayerNames(next)
    showPlayerNamesRef.current = next
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { showPlayerNames: next }).catch(() => {})
    otherPlayerIconSigRef.current.clear()
    selfIconSigRef.current = ''
    updateUserMarkerIcon()
    refreshOtherPlayerIconsForZoom()
  }, [updateUserMarkerIcon, refreshOtherPlayerIconsForZoom])

  const handleToggleBlockIncomingGifts = useCallback((next: boolean) => {
    setBlockIncomingGifts(next)
    blockIncomingGiftsRef.current = next
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { blockIncomingGifts: next }).catch(() => {})
    logActivity('settings', next ? 'داخرانی وەرگرتنی دیاری چالاک کرا' : 'داخرانی وەرگرتنی دیاری ناچاڵاک کرا', '🎁')
  }, [logActivity])

  const handleToggleGhostMode = useCallback((next: boolean) => {
    setGhostMode(next)
    ghostModeRef.current = next
    const uid = userIdRef.current
    if (uid) syncUserSettings(uid, { hideLocation: next }).catch(() => {})
    pushLocationToFirestore(userLatRef.current, userLngRef.current, true)
    updateUserMarkerIcon()
  }, [pushLocationToFirestore, updateUserMarkerIcon])

  // Real-time other players on map (FeatureGroup — no cluster swallowing taps)

  useEffect(() => {

    const uid = userIdRef.current

    const map = mapRef.current

    const group = playerMarkersGroupRef.current

    if (authLoading || !mapReady || !uid || !map || !group) return

    const unsub = subscribeToOtherPlayers(uid, players => {

      // Client NPCs own the map cast — skip Firestore bots so they don't stack on the same hubs
      const nextMap = new Map(
        players
          .filter((p) => !p.isBot && !isBotPlayerUid(p.uid))
          .map((p) => [p.uid, p] as const),
      )
      for (const npc of npcLiveRef.current) {
        nextMap.set(npc.uid, liveNpcToPlayerLocation(npc))
      }
      if (hideBlockedUsersRef.current && blockedUidsRef.current.size > 0) {
        for (const blockedUid of blockedUidsRef.current) nextMap.delete(blockedUid)
      }
      onlinePlayersRef.current = nextMap

      bumpMapPlayersTick()

      const markerMap = otherPlayerMarkersRef.current

      const truePos = otherPlayerTruePosRef.current

      if (!showOtherPlayers) {

        markerMap.forEach(marker => { try { group.removeLayer(marker) } catch {} })

        markerMap.clear()

        truePos.clear()

        scheduleLayoutMapAvatars()

        return

      }

      // بلۆک ئاڤاتار ناشارێتەوە — تەنها نامەی تایبەت دەگیرێت

      const activeUids = new Set(nextMap.keys())

      markerMap.forEach((marker, playerUid) => {

        // مارکەری NPC تەنها لە syncNpcMarkersToMap دەسڕدرێتەوە (viewport culling)
        if (isNpcPlayerUid(playerUid)) return

        if (!activeUids.has(playerUid) || isBotPlayerUid(playerUid)) {

          try { group.removeLayer(marker) } catch {}

          markerMap.delete(playerUid)

          truePos.delete(playerUid)
          otherPlayerIconSigRef.current.delete(playerUid)
          otherPlayerMotionRef.current.delete(playerUid)

        }

      })

      const visualScale = useFullBody3DAvatar ? fullBodyScaleForZoom(mapZoomRef.current) : 1

      const now = Date.now()

      nextMap.forEach(player => {

        // ٢٠ NPC — تەنها لە syncNpcMarkersToMap بە viewport cull ڕەندەر دەبن
        if (isNpcPlayerUid(player.uid)) return
        // Defense: never draw Firestore bots next to client NPCs (same Erbil hubs)
        if (player.isBot || isBotPlayerUid(player.uid)) return

        const prevMotion = otherPlayerMotionRef.current.get(player.uid)

        let actuallyMoved = false

        let moving: boolean | null = null

        if (prevMotion) {

          const movedM = calcDistance(prevMotion.lat, prevMotion.lng, player.lat, player.lng)

          actuallyMoved = movedM >= 1.5

          moving = actuallyMoved

          // Hold walk briefly after last real move so animation doesn't flicker

          if (!moving && prevMotion.moving && now - prevMotion.movedAt < 2200) moving = true

        }

        otherPlayerMotionRef.current.set(player.uid, {

          lat: player.lat,

          lng: player.lng,

          moving: moving === true,

          movedAt: actuallyMoved ? now : (prevMotion?.movedAt ?? now),

        })

        truePos.set(player.uid, { lat: player.lat, lng: player.lng })

        const avatarUrl = player.avatarUrl || avatarForGender(player.gender)

        const hunterLvl = player.hunterLevel ?? 0

        const skin = player.skinId != null ? COSMETIC_BY_ID[player.skinId] ?? null : null

        const border = player.borderId != null ? COSMETIC_BY_ID[player.borderId] ?? null : null

        const title = player.titleId != null ? COSMETIC_BY_ID[player.titleId] ?? null : null

        const headwear = player.headwearId != null ? COSMETIC_BY_ID[player.headwearId] ?? null : null

        const accessory = player.accessoryId != null ? COSMETIC_BY_ID[player.accessoryId] ?? null : null

        const a3d = player.avatar3d ? normalizeAvatar3d(player.avatar3d) : null

        const isSelected = selectedPlayerUidRef.current === player.uid

        const sig = [

          visualScale,

          player.gender,

          avatarUrl,

          hunterLvl,

          player.skinId ?? '',

          player.borderId ?? '',

          player.titleId ?? '',

          player.headwearId ?? '',

          player.accessoryId ?? '',

          avatar3dSignature(a3d),

          player.smokeUntilMs || 0,

          player.duelFxUntilMs || 0,

          player.activeDuelId || '',

          moving === true ? '1' : moving === false ? '0' : 'g',

          isSelected ? '1' : '0',

          showPlayerNamesRef.current ? '1' : '0',

          showPlayerNamesRef.current ? (player.name || '') : '',

        ].join('|')

        const existing = markerMap.get(player.uid)

        if (existing && otherPlayerIconSigRef.current.get(player.uid) === sig) {

          // Position-only update — no icon rebuild (clicks via map container delegation)

          return

        }

        otherPlayerIconSigRef.current.set(player.uid, sig)

        const icon = L.divIcon({

          className: 'avatar-marker-clean',

          html: buildOnlinePlayerMarkerHtml(

            player.uid, avatarUrl, hunterLvl, skin, border, title, headwear, accessory,

            player.smokeUntilMs || 0, player.duelFxUntilMs || 0, player.activeDuelId || null,

            player.gender,

            moving,

            undefined,

            a3d,

            isSelected,

            player.name,

          ),

          iconSize: PLAYER_MARKER_ICON_SIZE,

          iconAnchor: PLAYER_MARKER_ICON_ANCHOR,

        })

        if (existing) {

          existing.setIcon(icon)

          existing.setZIndexOffset(isSelected ? 5200 : 0)

          window.requestAnimationFrame(() => {
            const chatHtml = buildMapChatBubbleHtml(player.uid, mapChatBubblesRef.current, revealedMapChatIdsRef.current, userIdRef.current, hideGlobalChatRef.current)
            const fxHtml = buildMapEffectOverlayHtml(player.uid, mapAvatarOverlaysRef.current)
            patchMarkerChatOverlay(existing, chatHtml, player.uid)
            patchMarkerFxOverlay(existing, fxHtml)
          })

          return

        }

        const marker = L.marker([player.lat, player.lng], {

          icon,

          pane: 'markerPane',

          interactive: true,

          bubblingMouseEvents: false,

          keyboard: false,

          zIndexOffset: isSelected ? 5200 : 2800 + (hashUidStable(player.uid) % 800),

        })

        group.addLayer(marker)

        markerMap.set(player.uid, marker)

        markAvatarFirstEnter(marker)

        window.requestAnimationFrame(() => {
          const chatHtml = buildMapChatBubbleHtml(player.uid, mapChatBubblesRef.current, revealedMapChatIdsRef.current, userIdRef.current, hideGlobalChatRef.current)
          const fxHtml = buildMapEffectOverlayHtml(player.uid, mapAvatarOverlaysRef.current)
          patchMarkerChatOverlay(marker, chatHtml, player.uid)
          patchMarkerFxOverlay(marker, fxHtml)
        })

      })

      // Drop motion / icon cache for players who left

      otherPlayerMotionRef.current.forEach((_, uid) => {

        if (!activeUids.has(uid)) {

          otherPlayerMotionRef.current.delete(uid)

          otherPlayerIconSigRef.current.delete(uid)

        }

      })

      scheduleLayoutMapAvatars()

      // دوای نوێکردنەوەی یاریزانە ڕاستەقینەکان — NPCـەکانی ناو viewport دووبارە sync بکە
      // (لە ڕێگەی ref چونکە syncNpcMarkersToMap دواتر پێناسە دەکرێت)
      syncNpcMarkersRef.current?.()

    })

    return unsub

  }, [authLoading, mapReady, buildOnlinePlayerMarkerHtml, showOtherPlayers, scheduleLayoutMapAvatars, bumpMapPlayersTick])

  /** نوێکردنەوەی مارکەری یاریزانە سیموولەکراوەکان — تەنها ئۆنلاین + viewport */
  const syncNpcMarkersToMap = useCallback((opts?: { rebuildIcons?: boolean }) => {
    const map = mapRef.current
    const group = playerMarkersGroupRef.current
    if (!map || !group) return

    const markerMap = otherPlayerMarkersRef.current
    const truePos = otherPlayerTruePosRef.current
    const visualScale = useFullBody3DAvatar ? fullBodyScaleForZoom(mapZoomRef.current) : 1
    const now = Date.now()
    const rebuild = opts?.rebuildIcons === true

    // Viewport culling — تەنها ئۆنلاینەکانی ناو شاشە (+ padding)
    const b = map.getBounds()
    const padded = padLatLngBounds(b.getSouth(), b.getWest(), b.getNorth(), b.getEast(), 0.2)
    const visibleNpcs = filterNpcsInViewport(npcLiveRef.current, padded)
    const visibleSet = new Set(visibleNpcs.map((n) => n.uid))

    // مارکەری دەرەوەی شاشە یان ئۆفلاین لاببە
    for (const [uid, marker] of [...markerMap.entries()]) {
      if (!isNpcPlayerUid(uid)) continue
      if (visibleSet.has(uid)) continue
      try { group.removeLayer(marker) } catch { /* ignore */ }
      markerMap.delete(uid)
      otherPlayerIconSigRef.current.delete(uid)
      otherPlayerMotionRef.current.delete(uid)
    }

    // داتا بۆ کلیک/شیت؛ مارکەر تەنها بۆ ئۆنلاین+visible
    for (const npc of npcLiveRef.current) {
      const player = liveNpcToPlayerLocation(npc)
      onlinePlayersRef.current.set(npc.uid, player)
      if (npc.isOnline) {
        truePos.set(npc.uid, { lat: npc.lat, lng: npc.lng })
      } else {
        truePos.delete(npc.uid)
      }
    }

    for (const npc of visibleNpcs) {
      const player = liveNpcToPlayerLocation(npc)

      const prevMotion = otherPlayerMotionRef.current.get(npc.uid)
      const actuallyMoved = prevMotion
        ? calcDistance(prevMotion.lat, prevMotion.lng, npc.lat, npc.lng) >= 1.5
        : false
      let moving: boolean | null = npc.moving || actuallyMoved
      if (!moving && prevMotion?.moving && now - prevMotion.movedAt < 2200) moving = true
      otherPlayerMotionRef.current.set(npc.uid, {
        lat: npc.lat,
        lng: npc.lng,
        moving: moving === true,
        movedAt: actuallyMoved || npc.moving ? now : (prevMotion?.movedAt ?? now),
      })

      const existing = markerMap.get(npc.uid)
      const playDisappear = shouldPlayNpcDisappearAnim(npc, now)
      const playAppear = shouldPlayNpcAppearAnim(npc, now)

      // fade-out لە شوێنی کۆن — بێ گۆڕینی پۆتان
      if (existing && playDisappear) {
        markAvatarDisappearFade(existing, NPC_FADE_OUT_MS)
        continue
      }

      if (existing && !rebuild && !playAppear) {
        existing.setLatLng([npc.lat, npc.lng])
        continue
      }

      const avatarUrl = player.avatarUrl || avatarForGender(player.gender)
      const hunterLvl = player.hunterLevel ?? 0
      const a3d = player.avatar3d ? normalizeAvatar3d(player.avatar3d) : null
      const isSelected = selectedPlayerUidRef.current === npc.uid
      // Chat/FX لە overlayـی جیا — لە sig دانەنراون تا ڕیفڕێش نەکەن
      const sig = [
        visualScale, player.gender, avatarUrl, hunterLvl,
        avatar3dSignature(a3d),
        moving === true ? '1' : '0',
        isSelected ? '1' : '0',
        playAppear ? `a${npc.appearAtMs}` : '0',
      ].join('|')
      if (existing && otherPlayerIconSigRef.current.get(npc.uid) === sig && !playAppear) {
        existing.setLatLng([npc.lat, npc.lng])
        continue
      }
      otherPlayerIconSigRef.current.set(npc.uid, sig)
      const icon = L.divIcon({
        className: 'avatar-marker-clean',
        html: buildOnlinePlayerMarkerHtml(
          npc.uid, avatarUrl, hunterLvl, null, null, null, null, null,
          0, 0, null, player.gender, moving, undefined, a3d, isSelected, player.name,
        ),
        iconSize: PLAYER_MARKER_ICON_SIZE,
        iconAnchor: PLAYER_MARKER_ICON_ANCHOR,
      })
      if (existing) {
        existing.setIcon(icon)
        existing.setLatLng([npc.lat, npc.lng])
        if (playAppear) markAvatarAppearFade(existing, NPC_APPEAR_FADE_MS)
        else markAvatarFirstEnter(existing)
        // overlay دوای setIcon
        window.requestAnimationFrame(() => {
          const chatHtml = buildMapChatBubbleHtml(npc.uid, mapChatBubblesRef.current, revealedMapChatIdsRef.current, userIdRef.current, hideGlobalChatRef.current)
          const fxHtml = buildMapEffectOverlayHtml(npc.uid, mapAvatarOverlaysRef.current)
          patchMarkerChatOverlay(existing, chatHtml, npc.uid)
          patchMarkerFxOverlay(existing, fxHtml)
        })
      } else {
        const marker = L.marker([npc.lat, npc.lng], {
          icon,
          pane: 'markerPane',
          interactive: true,
          bubblingMouseEvents: false,
          keyboard: false,
          zIndexOffset: 1800 + (hashUidStable(npc.uid) % 600),
        })
        group.addLayer(marker)
        markerMap.set(npc.uid, marker)
        if (playAppear) markAvatarAppearFade(marker, NPC_APPEAR_FADE_MS)
        else markAvatarFirstEnter(marker)
        window.requestAnimationFrame(() => {
          const chatHtml = buildMapChatBubbleHtml(npc.uid, mapChatBubblesRef.current, revealedMapChatIdsRef.current, userIdRef.current, hideGlobalChatRef.current)
          const fxHtml = buildMapEffectOverlayHtml(npc.uid, mapAvatarOverlaysRef.current)
          patchMarkerChatOverlay(marker, chatHtml, npc.uid)
          patchMarkerFxOverlay(marker, fxHtml)
        })
      }
    }
    scheduleLayoutMapAvatars()
  }, [buildOnlinePlayerMarkerHtml, scheduleLayoutMapAvatars])

  syncNpcMarkersRef.current = syncNpcMarkersToMap

  // یاریزانە سیموولەکراوەکان — یەکەم جار + گۆڕانی viewport
  useEffect(() => {
    if (authLoading || !mapReady || !showOtherPlayers) return
    syncNpcMarkersToMap({ rebuildIcons: true })
    const map = mapRef.current
    if (!map) return
    const onViewChange = () => { syncNpcMarkersToMap() }
    map.on('moveend', onViewChange)
    map.on('zoomend', onViewChange)
    return () => {
      map.off('moveend', onViewChange)
      map.off('zoomend', onViewChange)
    }
  }, [authLoading, mapReady, showOtherPlayers, syncNpcMarkersToMap])

  // Centralized Animation Loop — جووڵە / چات / دیاری / overlay لە یەک rAF
  useEffect(() => {
    if (authLoading || !mapReady) return

    let raf = 0
    let lastNpcSim = 0
    let lastPresenceTick = 0
    let lastRelocateWave = Date.now()
    let nextChatAt = Date.now() + nextNpcChatDelayMs('boot')
    let lastBubbleSweep = 0
    let lastNpcPosSync = 0
    let lastNpcFirestoreSync = 0
    let npcDirtyPos = true

    const getMarker = (uid: string): L.Marker | null => {
      if (uid === userIdRef.current) return userMarkerRef.current
      return otherPlayerMarkersRef.current.get(uid) ?? null
    }

    const queueChat = (uid: string) => {
      overlayBatchRef.current.push({
        kind: 'chat',
        uid,
        html: buildMapChatBubbleHtml(
          uid,
          mapChatBubblesRef.current,
          revealedMapChatIdsRef.current,
          userIdRef.current,
          hideGlobalChatRef.current,
        ),
      })
    }

    const resolveDonateEndpointLatLng = (
      uid: string,
      fallbackLat: number,
      fallbackLng: number,
    ): { lat: number; lng: number } => {
      const marker = getMarker(uid)
      if (marker) {
        try {
          const ll = marker.getLatLng()
          if (Number.isFinite(ll.lat) && Number.isFinite(ll.lng)) {
            return { lat: ll.lat, lng: ll.lng }
          }
        } catch { /* ignore */ }
      }
      if (uid && uid === userIdRef.current) {
        return { lat: userLatRef.current, lng: userLngRef.current }
      }
      const npc = npcLiveRef.current.find((n) => n.uid === uid)
      if (npc && Number.isFinite(npc.lat) && Number.isFinite(npc.lng)) {
        return { lat: npc.lat, lng: npc.lng }
      }
      const player = onlinePlayersRef.current.get(uid)
      if (player && Number.isFinite(player.lat) && Number.isFinite(player.lng)) {
        return { lat: player.lat, lng: player.lng }
      }
      return { lat: fallbackLat, lng: fallbackLng }
    }

    /** نوێکردنەوەی سووکەڵەی پۆتان — تەنها setLatLng، بێ rebuildـی icon */
    const syncNpcPositionsThrottled = () => {
      const markerMap = otherPlayerMarkersRef.current
      const truePos = otherPlayerTruePosRef.current
      let movedAny = false
      const nowTick = Date.now()
      for (const npc of npcLiveRef.current) {
        if (!npc.isOnline) continue
        truePos.set(npc.uid, { lat: npc.lat, lng: npc.lng })
        const marker = markerMap.get(npc.uid)
        if (!marker) continue
        if (shouldPlayNpcDisappearAnim(npc, nowTick)) continue
        try {
          const prev = marker.getLatLng()
          if (Math.abs(prev.lat - npc.lat) > 1e-8 || Math.abs(prev.lng - npc.lng) > 1e-8) {
            marker.setLatLng([npc.lat, npc.lng])
            movedAny = true
          }
        } catch { /* ignore */ }
      }
      if (movedAny) scheduleLayoutMapAvatars()
    }

    let loopFrame = 0
    let lastHeavyTickMs = 0
    const loop = (ts: number) => {
      // Page Visibility — وەستاندنی تەواوی لووپ لە باکگراوند (≈٠٪ CPU)
      if (document.visibilityState === 'hidden') {
        raf = 0
        return
      }
      raf = window.requestAnimationFrame(loop)
      loopFrame += 1
      const mobileCool = isMapMobileCoolMode()
      const hasDonateFx = donateFxRef.current.length > 0
      // FPS cap: desktop ~60 | mobile+gift ~30 | mobile idle ~20
      const minGap = !mobileCool
        ? MAP_LOOP_MIN_GAP_DESKTOP_MS
        : hasDonateFx
          ? MAP_LOOP_MIN_GAP_MOBILE_FX_MS
          : MAP_LOOP_MIN_GAP_MOBILE_IDLE_MS
      if (ts - lastHeavyTickMs < minGap) return
      lastHeavyTickMs = ts
      const now = Date.now()
      const map = mapRef.current

      // ── Donate FX (پۆتان + SVG) — layer size/z-index هەمیشە پێش نوێکردنەوە ──
      if (hasDonateFx && map) {
        try { ensureGiftFxLayer(map) } catch { /* ignore */ }
      }
      for (const fx of donateFxRef.current) {
        if (fx.phase === 'flying') {
          const flightMs = fx.flightMs || DONATE_FLIGHT_MIN_MS
          const raw = Math.min(1, (now - fx.startMs) / flightMs)
          const t = 1 - Math.pow(1 - raw, 3)

          const fromLive = resolveDonateEndpointLatLng(fx.fromUid, fx.fromLat, fx.fromLng)
          const toLive = resolveDonateEndpointLatLng(fx.targetUid, fx.toLat, fx.toLng)
          fx.fromLat = fromLive.lat
          fx.fromLng = fromLive.lng
          fx.toLat = toLive.lat
          fx.toLng = toLive.lng
          const ctrl = giftPathControlPoint(
            fx.fromLat, fx.fromLng, fx.toLat, fx.toLng, fx.pathStyle,
          )
          fx.ctrlLat = ctrl.lat
          fx.ctrlLng = ctrl.lng

          // جوگرافی ctrl نوێ دەکرێتەوە؛ ئایکۆن بە getPointAtLength لەسەر هەمان SVG path
          if (fx.svgPath && map) {
            try {
              const p1 = map.latLngToContainerPoint([fx.fromLat, fx.fromLng])
              const p2 = map.latLngToContainerPoint([fx.toLat, fx.toLng])
              const d = giftQuadraticScreenPathD(p1.x, p1.y, p2.x, p2.y, fx.pathStyle)
              applyGiftTrajectoryPathD(fx.svgPath, d, !mobileCool)
              updateGiftSvgPathReveal(fx.svgPath, t, fx.pathStyle)
              if (fx.flyIcon) {
                positionGiftFlyIconOnPath(fx.svgPath, fx.flyIcon, t, {
                  x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, style: fx.pathStyle,
                })
              }
            } catch { /* ignore */ }
          } else if (fx.flyIcon && map) {
            const screen = giftFlyIconScreenPos(
              map,
              fx.fromLat, fx.fromLng,
              fx.toLat, fx.toLng,
              fx.pathStyle,
              t,
            )
            if (screen) positionGiftFlyIcon(fx.flyIcon, screen.x, screen.y)
          }

          if (t >= 1) {
            fx.phase = 'floating'
            fx.itemUntilMs = now + (fx.holdMs || DONATE_HOLD_MS)
            fadeOutGiftSvgPath(fx.svgPath)
            fx.svgPath = null
            removeGiftFlyIcon(fx.flyIcon)
            fx.flyIcon = null
            applyAvatarDonateOverlayRef.current(fx.targetUid, fx.itemId, fx.emoji, fx.eventId)
            // Balance credit + 5s reward toast exactly when gift reaches target
            if (!fx.arrivalHandled) {
              fx.arrivalHandled = true
              settleDonateArrivalRef.current(fx.eventId)
            }
          }
        } else if (fx.phase === 'floating') {
          if (now >= fx.itemUntilMs) {
            fx.phase = 'done'
            mapAvatarOverlaysRef.current.delete(fx.targetUid)
            setVipSpectacle(prev => (prev && prev.eventKey === fx.eventId ? null : prev))
            overlayBatchRef.current.push({ kind: 'clearFx', uid: fx.targetUid })
          }
        }
      }
      donateFxRef.current = donateFxRef.current.filter((f) => f.phase !== 'done')

      // ── Overlay expiry (chat + fx) — batched ──
      if (now - lastBubbleSweep >= 250) {
        lastBubbleSweep = now
        for (const [uid, ov] of mapAvatarOverlaysRef.current.entries()) {
          if (ov.untilMs <= now) {
            mapAvatarOverlaysRef.current.delete(uid)
            overlayBatchRef.current.push({ kind: 'clearFx', uid })
          }
        }
        for (const [uid, b] of mapChatBubblesRef.current) {
          if (b.expiresAtMs <= now) {
            mapChatBubblesRef.current.delete(uid)
            overlayBatchRef.current.push({ kind: 'clearChat', uid })
          }
        }
        setVipSpectacle(prev => (prev && prev.untilMs <= now ? null : prev))
      }

      // ── NPC position throttle (١٧٥ms) — تەنها کاتێک جووڵە هەیە یان dirty ──
      {
      const npcThrottleMs = mobileCool ? 320 : NPC_MARKER_THROTTLE_MS
      if (
        showOtherPlayersRef.current
        && now - lastNpcPosSync >= npcThrottleMs
      ) {
        lastNpcPosSync = now
        const needsPos =
          npcDirtyPos
          || npcLiveRef.current.some((n) => n.isOnline && n.moving)
        if (needsPos) {
          npcDirtyPos = false
          syncNpcPositionsThrottled()
        }
      }
      }

      // ── Dynamic Session Controller (~1s): ١–٥٠ گۆڕانی ئۆنلاین/ئۆفلاین ──
      if (showOtherPlayersRef.current && now - lastPresenceTick >= 1000) {
        lastPresenceTick = now
        const presence = tickNpcOnlinePresence(npcLiveRef.current, now)
        npcLiveRef.current = presence.npcs
        // ئاماری وەک یاریزانی ڕاستەقینە — زیادبوون بە تێپەڕبوونی کات
        npcLiveRef.current = tickNpcStatsGrowth(npcLiveRef.current, now, 1000)
        npcLiveRef.current = tickNpcDailySystems(npcLiveRef.current, now)

        // تەواوکردنی fade-out → شوێنی نوێ
        const fin = finalizeNpcRelocations(npcLiveRef.current, now)
        npcLiveRef.current = fin.npcs

        // شەپۆلی ٪٦٠ Relocation (هەر ~٣ خولەک)
        if (now - lastRelocateWave >= NPC_RELOCATE_INTERVAL_MS) {
          lastRelocateWave = now
          const wave = beginNpcRelocationWave(npcLiveRef.current, now)
          npcLiveRef.current = wave.npcs
          for (const uid of wave.fadingOut) {
            const m = otherPlayerMarkersRef.current.get(uid)
            if (m) markAvatarDisappearFade(m, NPC_FADE_OUT_MS)
          }
        }

        for (const uid of presence.wentOffline) {
          mapChatBubblesRef.current.delete(uid)
          mapAvatarOverlaysRef.current.delete(uid)
          overlayBatchRef.current.push({ kind: 'clearChat', uid })
          overlayBatchRef.current.push({ kind: 'clearFx', uid })
        }
        const presenceChanged = presence.wentOnline.length > 0 || presence.wentOffline.length > 0
        const relocatedChanged = fin.relocated.length > 0
        if (presenceChanged || relocatedChanged) {
          bumpMapPlayersTick()
        }
        const selectedUid = selectedPlayerUidRef.current
        if (selectedUid && isNpcPlayerUid(selectedUid)) {
          const sel = npcLiveRef.current.find((n) => n.uid === selectedUid)
          if (sel) {
            setSelectedPlayer((prev) => {
              if (!prev || prev.uid !== selectedUid) return prev
              return {
                ...prev,
                isOnline: sel.isOnline,
                lastSeenMs: sel.lastSeenMs,
                hunterLevel: sel.hunterLevel,
                gold: sel.gold,
                diamond: sel.diamond,
                stats: { ...DEFAULT_PLAYER_STATS, ...sel.stats },
                dropsOpenedByType: { ...sel.dropsOpenedByType },
              }
            })
          }
        }
        if (presenceChanged || relocatedChanged) {
          syncNpcMarkersRef.current?.()
          npcDirtyPos = true
        }
      }

      // ── NPC sim (~3.5s) — تەنها پۆتان، بێ bump React ──
      if (showOtherPlayersRef.current && now - lastNpcSim >= 3500) {
        lastNpcSim = now
        const drops: ActiveDropInfo[] = []
        airdropsDataRef.current.forEach((d) => {
          if (d.opened) return
          if (d.despawnAtMs > 0 && d.despawnAtMs <= now) return
          // تەنها دوای نیشتەوە — پۆتانی ڕاستەقینەی سەر نەخشە
          if (now - d.createdAtMs < AIRDROP_FALL_MS) return
          if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return
          drops.push({ id: d.id, lat: d.lat, lng: d.lng, dropType: d.dropType })
        })
        const result = tickNpcMovement(npcLiveRef.current, drops, now)
        npcLiveRef.current = result.npcs
        for (const chat of result.dropChats) {
          const speaker = npcLiveRef.current.find((n) => n.uid === chat.uid)
          mapChatBubblesRef.current.set(chat.uid, {
            id: `npc_drop_${chat.uid}_${now}`,
            uid: chat.uid,
            text: chat.text.slice(0, MAP_CHAT_MAX_LEN),
            isPremium: true,
            createdAtMs: now,
            expiresAtMs: now + randomMapChatBubbleMs(),
            hunterLevel: Math.max(0, Math.floor(Number(speaker?.hunterLevel) || 0)),
          })
          queueChat(chat.uid)
          if (speaker) {
            appendMapChatFeed({
              id: `npc_drop_feed_${chat.uid}_${now}`,
              uid: speaker.uid,
              name: speaker.name,
              text: chat.text.slice(0, MAP_CHAT_MAX_LEN),
              avatarUrl: null,
              avatar3d: speaker.avatar3d ?? null,
              gender: speaker.gender,
              createdAtMs: now,
            })
          }
        }
        // پۆتان لە throttleـی ١٧٥ms نوێ دەبێتەوە
        npcDirtyPos = true
        lastNpcPosSync = 0
      }

      // ── Gift stagger (چات لە Global Chat Engine ـە) ──
      if (showOtherPlayersRef.current && now >= nextChatAt) {
        nextChatAt = now + nextNpcChatDelayMs(`nxt:${now}`)
        const action = pickOneNpcAutoAction(npcLiveRef.current, now)
        if (action?.type === 'gift') {
            const fromNpc = npcLiveRef.current.find((n) => n.uid === action.fromUid)
            const toNpc = npcLiveRef.current.find((n) => n.uid === action.toUid)
            const npcItem = DONATE_BY_ID[action.itemId]
            const goldCost = Math.max(0, Math.floor(action.goldCost ?? npcItem?.goldPrice ?? 0))
            const diamondCost = Math.max(0, Math.floor(action.diamondCost ?? npcItem?.diamondPrice ?? 0))
            if (
              fromNpc
              && (fromNpc.gold < goldCost || fromNpc.diamond < diamondCost)
            ) {
              // ناتوانێت ببەخشێت — دواتر دووبارە هەڵدەبژێردرێت
            } else {
            mapChatBubblesRef.current.set(action.fromUid, {
              id: `npc_gift_${action.fromUid}_${now}`,
              uid: action.fromUid,
              text: action.text.slice(0, MAP_CHAT_MAX_LEN),
              isPremium: true,
              createdAtMs: now,
              expiresAtMs: now + randomMapChatBubbleMs(),
              hunterLevel: Math.max(0, Math.floor(Number(fromNpc?.hunterLevel) || 0)),
            })
            mapChatBubblesRef.current.set(action.toUid, {
              id: `npc_gift_to_${action.toUid}_${now}`,
              uid: action.toUid,
              text: `${action.emoji} سوپاس ${action.fromName}!`.slice(0, MAP_CHAT_MAX_LEN),
              isPremium: true,
              createdAtMs: now + 1,
              expiresAtMs: now + randomMapChatBubbleMs(),
              hunterLevel: Math.max(0, Math.floor(Number(toNpc?.hunterLevel) || 0)),
            })
            queueChat(action.fromUid)
            queueChat(action.toUid)
            npcLiveRef.current = applyNpcGiftTransfer(
              npcLiveRef.current,
              action.fromUid,
              action.toUid,
              goldCost,
              diamondCost,
            )
            npcLiveRef.current = applyNpcGiftXp(
              npcLiveRef.current,
              action.fromUid,
              npcItem?.tier ?? 'basic',
            )
            if (fromNpc && npcItem) {
              recordNpcGiftScore(
                {
                  uid: fromNpc.uid,
                  name: fromNpc.name,
                  gender: fromNpc.gender,
                  avatarUrl: avatarForGender(fromNpc.gender),
                  avatar3d: fromNpc.avatar3d,
                  index: fromNpc.index,
                  playerLevel: fromNpc.playerLevel,
                },
                donateItemValueScore(npcItem),
              ).catch(() => {})
            }
            spawnDonateFxRef.current?.(
              {
                id: `npc_fx_${action.fromUid}_${action.toUid}_${now}`,
                fromUid: action.fromUid,
                toUid: action.toUid,
                itemId: action.itemId,
                emoji: action.emoji,
                goldCost,
                diamondCost,
                fromLat: action.fromLat,
                fromLng: action.fromLng,
                toLat: action.toLat,
                toLng: action.toLng,
                startMs: now,
              },
              action.itemId,
            )
            }
        }
      }

      // ── Firestore sync — باڵانس / ئامار / دیاری ڕۆژانە / چەرخ ──
      if (
        showOtherPlayersRef.current
        && now - lastNpcFirestoreSync >= NPC_FIRESTORE_SYNC_MS
      ) {
        lastNpcFirestoreSync = now
        const syncPayload = npcLiveRef.current.map((n) => ({
          uid: n.uid,
          index: n.index,
          name: n.name,
          gender: n.gender,
          playerLevel: n.playerLevel,
          playerXp: n.playerXp,
          hunterLevel: n.hunterLevel,
          avatarUrl: avatarForGender(n.gender),
          avatar3d: n.avatar3d,
          gold: n.gold,
          diamond: n.diamond,
          stats: n.stats,
          dropsOpenedByType: n.dropsOpenedByType,
          dailyBonusDay: n.dailyBonusDay,
          dailyBonusLastClaimMs: n.dailyBonusLastClaimMs,
          spinLastFreeAtMs: n.spinLastFreeAtMs,
          spinSpinsInWindow: n.spinSpinsInWindow,
          isOnline: n.isOnline,
          lastSeenMs: n.lastSeenMs,
        }))
        upsertNpcLeaderboardPresence(syncPayload).catch(() => {})
      }

      // ── Batched overlay DOM writes (یەک جار لە frame) ──
      if (overlayBatchRef.current.length > 0) {
        const batch = overlayBatchRef.current
        overlayBatchRef.current = []
        flushBatchedMapOverlays(batch, getMarker)
      }
      if (map) {
        try { syncAllMapChatFloatPositions(map, getMarker) } catch { /* ignore */ }
      }
    }

    const onVisibilityChange = () => {
      const visible = document.visibilityState !== 'hidden'
      pageVisibleRef.current = visible
      document.documentElement.classList.toggle('kd-page-hidden', !visible)
      if (!visible) {
        if (raf) window.cancelAnimationFrame(raf)
        raf = 0
        const uid = userIdRef.current
        if (uid) {
          // ئۆفلاین تۆمار بکە؛ تەنها ئەگەر «وونم بکە» چالاک بێت ئەڤاتار بشارەوە
          setPlayerOffline(uid, { hideFromMap: hideWhenOfflineRef.current }).catch(() => {})
        }
        return
      }
      // گەڕانەوە — لووپ و پۆتان دەستپێبکەرەوە + دووبارە دەرکەوتن لەسەر نەخشە
      npcDirtyPos = true
      lastNpcPosSync = 0
      if (!raf) raf = window.requestAnimationFrame(loop)
      const uid = userIdRef.current
      if (uid && Number.isFinite(userLatRef.current) && Number.isFinite(userLngRef.current)) {
        pushLocationToFirestore(userLatRef.current, userLngRef.current, true)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    if (document.visibilityState === 'hidden') {
      document.documentElement.classList.add('kd-page-hidden')
      pageVisibleRef.current = false
    } else {
      raf = window.requestAnimationFrame(loop)
    }

    return () => {
      window.cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.documentElement.classList.remove('kd-page-hidden')
    }
  }, [authLoading, mapReady, scheduleLayoutMapAvatars, bumpMapPlayersTick, appendMapChatFeed, pushLocationToFirestore])

  // Real-time global airdrops on map

  useEffect(() => {

    const map = mapRef.current

    if (authLoading || !mapReady || !map) return

    const unsub = subscribeToAirdrops(airdrops => {

      const activeIds = new Set(airdrops.map(a => a.id))

      activeDropsRef.current.forEach((_, id) => {

        if (!activeIds.has(id)) removeAirdropMarker(id)

      })

      airdrops.forEach(airdrop => {

        airdropsDataRef.current.set(airdrop.id, airdrop)

        renderAirdropMarker(airdrop)

      })

      updateDistTracker(userLatRef.current, userLngRef.current)

    })

    return unsub

  }, [authLoading, mapReady, renderAirdropMarker, removeAirdropMarker])

  // Real-time leaderboard (legacy dropdown + royal modal)

  useEffect(() => {

    if (authLoading) return

    return subscribeToLeaderboard(setLeaderboard)

  }, [authLoading])

  useEffect(() => {
    const root = document.documentElement
    if (highGraphics) root.classList.remove('low-gfx')
    else root.classList.add('low-gfx')
    return () => { root.classList.remove('low-gfx') }
  }, [highGraphics])

  /** Mobile Performance — کەمکردنەوەی فلتەر/بلۆر لەسەر مۆبایل */
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)')
    const apply = () => {
      root.classList.toggle('kd-mobile-perf', mq.matches)
      // Always drop heavy blur/glow layers on phones (even if High GFX toggled)
      if (mq.matches) root.classList.add('kd-mobile-cool')
      else root.classList.remove('kd-mobile-cool')
    }
    apply()
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', apply)
    else mq.addListener(apply)
    return () => {
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', apply)
      else mq.removeListener(apply)
      root.classList.remove('kd-mobile-perf')
      root.classList.remove('kd-mobile-cool')
    }
  }, [])

  useEffect(() => {
    try {
      configureSfx({ muted: !soundEnabled, volume: sfxVolume })
    } catch (err) {
      console.error('SFX init/update failed:', err)
    }
  }, [soundEnabled, sfxVolume])

  useEffect(() => {
    try {
      configureSfxCategory('gift', { muted: !giftSoundEnabled, volume: giftVolume })
    } catch (err) {
      console.error('Gift SFX config failed:', err)
    }
  }, [giftSoundEnabled, giftVolume])

  useEffect(() => {
    try {
      configureMusic({ muted: true, volume: musicVolume })
      stopBackgroundMusic()
    } catch (err) {
      console.error('Background music disabled:', err)
    }
  }, [musicVolume])

  useEffect(() => {
    return () => {
      try { stopBackgroundMusic() } catch { /* ignore */ }
      for (const url of dmVoiceLocalUrlsRef.current) {
        try { URL.revokeObjectURL(url) } catch { /* ignore */ }
      }
      dmVoiceLocalUrlsRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const onWindowError = (event: ErrorEvent) => {
      console.error('Global window error captured:', event.error ?? event.message)
    }
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection captured:', event.reason)
    }
    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  useEffect(() => {
    if (activeSheet !== 'leaderboard' || authLoading) return
    const unsubs = [
      subscribeToWealthLeaderboard(setLbWealth),
      subscribeToLevelLeaderboard(setLbLevel),
      subscribeToGifterLeaderboard(setLbGifters),
    ]
    return () => { unsubs.forEach(u => u()) }
  }, [activeSheet, authLoading])

  // Remove location when leaving the game

  useEffect(() => {

    let loggedOut = false

    const clearLocation = () => {

      const uid = userIdRef.current

      // شوێنی دوایین دەمێنێتەوە؛ ئەگەر «وونم بکە» ناچاڵاک بێت ئەڤاتار لەسەر نەخشە دەمێنێتەوە

      if (uid) setPlayerOffline(uid, { hideFromMap: hideWhenOfflineRef.current }).catch(() => {})

    }

    const onPageLeave = () => {

      const uid = userIdRef.current

      if (uid && !loggedOut) {

        loggedOut = true

        appendActivity(uid, 'logout', 'دەرچوون لە یاری', '🚪')

      }

      clearLocation()

    }

    window.addEventListener('pagehide', onPageLeave)

    window.addEventListener('beforeunload', onPageLeave)

    return () => {

      clearLocation()

      window.removeEventListener('pagehide', onPageLeave)

      window.removeEventListener('beforeunload', onPageLeave)

    }

  }, [])

  const openGateRef = useRef({ key: '', at: 0 })

  const beginOpen = useCallback((key: string) => {

    const now = Date.now()

    if (key === openGateRef.current.key && now - openGateRef.current.at < 350) return false

    openGateRef.current = { key, at: now }

    return true

  }, [])

  // Capture-phase — کلیکی کارەکتەر تەنها بە تاپی ڕاستەقینە (pinch/drag نا)
  useEffect(() => {
    /** pinch / دوو پەنجە / drag / دوای zoom ـی بەکارهێنەر → کلیکی کارەکتەر مەکە */
    const isGestureBlockingCharacterOpen = (e: Event) => {
      const g = mapGestureRef.current
      if (g.pinching || g.zooming || g.dragging || g.singleTouchMoved) return true
      if (Date.now() < g.blockedUntil) return true
      if (e.type === 'touchend' || e.type === 'touchcancel' || e.type === 'touchstart') {
        const te = e as TouchEvent
        if (te.touches && te.touches.length > 1) return true
        if (e.type !== 'touchstart' && te.touches.length > 0) return true
        if (te.changedTouches && te.changedTouches.length > 1) return true
      }
      return false
    }

    const stopMapFromEating = (e: Event) => {
      try { e.stopPropagation() } catch { /* ignore */ }
      try { e.preventDefault() } catch { /* ignore */ }
    }

    const forceClickInterceptor = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target?.closest) return

      // کارەکتەر / خۆت
      const playerEl = target.closest('.kd-clickable-player') as HTMLElement | null
      if (playerEl) {
        // دوو پەنجە → pinch؛ دەست مەوەستێنە
        if (e.type === 'touchstart' && (e as TouchEvent).touches.length > 1) return
        if (isGestureBlockingCharacterOpen(e)) return
        // 1) stopPropagation — نەخشە کلیک نەخوات
        stopMapFromEating(e)
        // touchstart: تەنها ڕێگری لە map؛ کردنەوە لە touchend/click
        if (e.type === 'touchstart') return
        const uid = playerEl.getAttribute('data-uid')
        if (!uid) return
        runInstantMapTargetAction(mapMarkerTapLockRef, e, () => {
          ;(window as any).__openPlayer?.(uid)
        })
        return
      }

      const selfEl = target.closest('.kd-clickable-self')
      if (selfEl) {
        if (e.type === 'touchstart' && (e as TouchEvent).touches.length > 1) return
        if (isGestureBlockingCharacterOpen(e)) return
        stopMapFromEating(e)
        if (e.type === 'touchstart') return
        runInstantMapTargetAction(mapMarkerTapLockRef, e, () => {
          ;(window as any).__openSelf?.()
        })
        return
      }

      // باقی ئامانجەکان — تەنها ئەگەر gesture نەبێت
      if (isMapMarkerClickBlocked(mapGestureRef)) return

      // Map chat bubble — reveal spoiler (before opening player sheet)
      const chatEl = target.closest('.kd-map-chat-bubble') as HTMLElement | null
      if (chatEl) {
        const chatId = chatEl.getAttribute('data-chat-id')
        if (chatId && chatEl.classList.contains('is-hidden')) {
          runInstantMapTargetAction(mapMarkerTapLockRef, e, () => {
            revealedMapChatIdsRef.current.add(chatId)
            updateUserMarkerIcon()
            refreshOtherPlayerIconsForZoom()
          })
          return
        }
        // Clear bubble: don't open player on bubble tap
        e.stopPropagation()
        e.preventDefault()
        return
      }

      // LIVE war badge (replaces former inline onclick)
      const liveEl = target.closest('.kd-live-war-badge') as HTMLElement | null
      if (liveEl) {
        const duelId = liveEl.getAttribute('data-duel-id')
        if (duelId) {
          runInstantMapTargetAction(mapMarkerTapLockRef, e, () => { (window as any).__spectateDuel?.(duelId) })
          return
        }
      }

      const dropEl = target.closest('.kd-clickable-drop') as HTMLElement | null
      if (dropEl) {
        const dropId = dropEl.getAttribute('data-drop-id')
        if (dropId) {
          runInstantMapTargetAction(mapMarkerTapLockRef, e, () => { (window as any).__openChest?.(dropId) })
          return
        }
      }

      const factoryEl = target.closest('.kd-clickable-factory') as HTMLElement | null
      if (factoryEl) {
        const factoryId = factoryEl.getAttribute('data-factory-id')
        if (factoryId) {
          runInstantMapTargetAction(mapMarkerTapLockRef, e, () => { (window as any).__openFactory?.(factoryId) })
          return
        }
      }

    }

    const touchOpts: AddEventListenerOptions = { capture: true, passive: false }
    window.addEventListener('touchstart', forceClickInterceptor, touchOpts)
    window.addEventListener('touchend', forceClickInterceptor, touchOpts)
    window.addEventListener('click', forceClickInterceptor, true)
    return () => {
      window.removeEventListener('touchstart', forceClickInterceptor, true)
      window.removeEventListener('touchend', forceClickInterceptor, true)
      window.removeEventListener('click', forceClickInterceptor, true)
    }
  }, [updateUserMarkerIcon, refreshOtherPlayerIconsForZoom])

  const applyMapAvatarFocus = useCallback((uid: string | null) => {

    const map = mapRef.current

    const container = map?.getContainer()

    if (container) {

      container.querySelectorAll('.map-avatar-visual.is-selected').forEach(el => {

        el.classList.remove('is-selected')

        el.closest('.avatar-inner')?.classList.remove('kd-player-marker-selected')

      })

      if (uid) {

        const selfUid = userIdRef.current ?? 'self'

        const inner = uid === selfUid

          ? container.querySelector('.kd-clickable-self')

          : container.querySelector(`.kd-clickable-player[data-uid="${uid.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`)

        if (inner) {

          inner.classList.add('kd-player-marker-selected')

          inner.querySelector('.map-avatar-visual')?.classList.add('is-selected')

        }

      }

    }

    if (uid) {

      const selfUid = userIdRef.current ?? 'self'

      if (uid === selfUid) {

        userMarkerRef.current?.setZIndexOffset(5200)

      } else {

        otherPlayerMarkersRef.current.get(uid)?.setZIndexOffset(5200)

      }

    } else {

      // Preserve VIP sender boost z-index when dismissing selection
      reapplyVipSenderBoostVisualsRef.current()
      const now = Date.now()
      const selfUid = userIdRef.current
      const selfBoosted = selfUid != null && (vipSenderBoostUntilRef.current.get(selfUid) ?? 0) > now
      if (!selfBoosted) {
        userMarkerRef.current?.setZIndexOffset(3600)
      }

      otherPlayerMarkersRef.current.forEach((marker, id) => {
        if ((vipSenderBoostUntilRef.current.get(id) ?? 0) > now) {
          try { marker.setZIndexOffset(PREMIUM_GIFT_SENDER_Z_OFFSET) } catch { /* ignore */ }
          return
        }
        marker.setZIndexOffset(2800 + (hashUidStable(id) % 800))
      })

    }

  }, [])

  const closePlayerSheet = useCallback((opts?: { animated?: boolean }) => {

    selectedPlayerUidRef.current = null

    applyMapAvatarFocus(null)

    selfIconSigRef.current = ''

    updateUserMarkerIcon()

    setPlayerSheetAnimIn(false)

    if (donatePickerCloseTimerRef.current) {
      clearTimeout(donatePickerCloseTimerRef.current)
      donatePickerCloseTimerRef.current = null
    }
    setDonatePickerUid(null)
    setDonatePickerClosing(false)

    if (playerPanelRef.current) {

      if (opts?.animated) {

        playerPanelRef.current.style.transition = `transform 0.22s ${IOS_SPRING_EASE}`

        playerPanelRef.current.style.transform = 'translateY(110%)'

      } else {

        playerPanelRef.current.style.transition = ''

        playerPanelRef.current.style.transform = ''

      }

    }

    const finish = () => {

      setSelectedPlayer(null)

      setActiveSheet(prev => (prev === 'playerInfo' ? null : prev))

      if (playerSheetCloseTimerRef.current) {

        clearTimeout(playerSheetCloseTimerRef.current)

        playerSheetCloseTimerRef.current = null

      }

    }

    if (playerSheetCloseTimerRef.current) clearTimeout(playerSheetCloseTimerRef.current)

    if (opts?.animated) {

      playerSheetCloseTimerRef.current = setTimeout(finish, PLAYER_SHEET_ANIM_MS)

    } else {

      finish()

    }

  }, [applyMapAvatarFocus, updateUserMarkerIcon])

  closePlayerSheetRef.current = closePlayerSheet

  const registerRecipientGiftArrival = useCallback((event: MapDonationEvent, itemId: DonateItemId) => {
    const myUid = userIdRef.current
    if (!myUid || event.toUid !== myUid) return
    if (event.fromUid === myUid) return
    if (blockIncomingGiftsRef.current) return
    if (pendingDonateArrivalRef.current.has(event.id)) return

    const itemDef = DONATE_BY_ID[itemId]
    // ٪٣٠ لە نرخی کڕین — بۆ هەموو جۆرە دیارییەک (سادە / ناوەند / VIP)
    const paidGold = Math.max(0, Math.floor(Number(event.goldCost) || itemDef?.goldPrice || 0))
    const paidDiamond = Math.max(0, Math.floor(Number(event.diamondCost) || itemDef?.diamondPrice || 0))
    const gold = Math.max(0, Math.round(paidGold * GIFT_RECIPIENT_CUT_PCT))
    const diamond = Math.max(0, Math.round(paidDiamond * GIFT_RECIPIENT_CUT_PCT))
    const fromName = onlinePlayersRef.current.get(event.fromUid)?.name ?? 'یاریزان'
    pendingDonateArrivalRef.current.set(event.id, {
      gold,
      diamond,
      itemLabel: itemDef?.label ?? 'دیاری',
      emoji: event.emoji || itemDef?.emoji || '🎁',
      fromName,
      fromUid: event.fromUid,
    })
  }, [])

  const settleDonateArrival = useCallback((eventId: string) => {
    const pending = pendingDonateArrivalRef.current.get(eventId)
    if (!pending) return
    pendingDonateArrivalRef.current.delete(eventId)

    const myUid = userIdRef.current
    const goldCut = Math.max(0, pending.gold)
    const diamondCut = Math.max(0, pending.diamond)

    // Immediate Firestore + local wallet update on arrival
    if (myUid && (goldCut > 0 || diamondCut > 0)) {
      setWalletAndSync(w => ({
        ...w,
        gold: w.gold + goldCut,
        diamond: w.diamond + diamondCut,
      }))
      creditGiftRevenueShare(myUid, { gold: goldCut, diamond: diamondCut }).catch(() => {})
    }

    const cutParts: string[] = []
    if (goldCut > 0) cutParts.push(`+${goldCut} 🪙`)
    if (diamondCut > 0) cutParts.push(`+${diamondCut} 💎`)
    const rewardLine = cutParts.length > 0 ? ` · ${cutParts.join(' · ')}` : ''

    // 5-second reward toast at the exact moment of impact
    showRewardToast({
      title: 'دیاری وەرگیرا',
      message: `🎁 ${pending.emoji} ${pending.itemLabel} لە ${pending.fromName}${rewardLine}`,
      icon: pending.emoji,
      inboxKind: 'gift',
    })

    setMapDonationNotifs(prev => {
      const entry = {
        id: `mapdon_${eventId}`,
        fromUid: pending.fromUid,
        fromName: pending.fromName,
        itemLabel: pending.itemLabel,
        emoji: pending.emoji,
        atMs: Date.now(),
      }
      if (prev.some(n => n.id === entry.id)) return prev
      return [entry, ...prev].slice(0, 60)
    })
  }, [setWalletAndSync, showRewardToast])

  settleDonateArrivalRef.current = settleDonateArrival

  const applyAvatarDonateOverlay = useCallback((
    targetUid: string,
    itemId: DonateItemId,
    emoji: string,
    eventKey?: string,
    meta?: { fromName?: string; toName?: string },
  ) => {

    const untilMs = Date.now() + donateOverlayDurationMs(itemId)
    const item = DONATE_BY_ID[itemId]
    const scale = donateVisualScale(itemId)

    if (itemId === 'tomato') {
      mapAvatarOverlaysRef.current.set(targetUid, { kind: 'tomato_splat', untilMs })
    } else if (itemId === 'egg') {
      mapAvatarOverlaysRef.current.set(targetUid, { kind: 'egg_splat', untilMs })
    } else if (itemId === 'crown') {
      mapAvatarOverlaysRef.current.set(targetUid, { kind: 'crown', untilMs })
    } else if (itemId === 'thunder') {
      mapAvatarOverlaysRef.current.set(targetUid, { kind: 'thunder', untilMs })
    } else if (itemId === 'heart') {
      mapAvatarOverlaysRef.current.set(targetUid, { kind: 'heart_burst', untilMs })
    } else if (item?.tier === 'vip') {
      // بارانی زێڕ / گەلەستێرە — تەنها ئێفێکتی نەخشە (بێ ئایکۆنی گەورەی سەر شاشە / سەر سەر)
      if (!isAmbientMapGift(itemId)) {
        mapAvatarOverlaysRef.current.set(targetUid, { kind: 'vip_spectacle', itemId, emoji, scale, untilMs })
        setVipSpectacle({
          eventKey: eventKey ?? `${targetUid}_${itemId}_${untilMs}`,
          itemId,
          emoji,
          label: item.label,
          scale,
          untilMs,
          fromName: meta?.fromName,
          toName: meta?.toName,
        })
      } else {
        setVipSpectacle(null)
        mapAvatarOverlaysRef.current.delete(targetUid)
      }
    } else {
      mapAvatarOverlaysRef.current.set(targetUid, { kind: 'donate_item', emoji, itemId, scale, untilMs })
    }

    // Overlay layer — بێ ڕیفڕێشی تەواوی ئاڤاتار
    const fxHtml = buildMapEffectOverlayHtml(targetUid, mapAvatarOverlaysRef.current)
    const marker = targetUid === userIdRef.current
      ? userMarkerRef.current
      : otherPlayerMarkersRef.current.get(targetUid)
    if (marker) {
      patchMarkerFxOverlay(marker, fxHtml)
    } else {
      enqueueMapOverlay({ kind: 'fx', uid: targetUid, html: fxHtml })
    }

  }, [enqueueMapOverlay])

  applyAvatarDonateOverlayRef.current = applyAvatarDonateOverlay

  const spawnDonateFxFromEvent = useCallback((event: MapDonationEvent, itemId: DonateItemId) => {

    const map = mapRef.current

    if (!map) return

    if (donateFxRef.current.some(fx => fx.eventId === event.id)) return

    const now = event.startMs

    const holdMs = isAmbientMapGift(itemId) ? MAP_AMBIENT_GIFT_MS : donateOverlayDurationMs(itemId)

    const elapsed = Date.now() - now

    const fromName =
      (event.fromUid === userIdRef.current ? userProfileRef.current?.name : null)
      || onlinePlayersRef.current.get(event.fromUid)?.name
      || 'یاریزان'
    const toName =
      (event.toUid === userIdRef.current ? userProfileRef.current?.name : null)
      || onlinePlayersRef.current.get(event.toUid)?.name
      || 'یاریزان'

    // VIP gift — بەخشیار ١٠چ زۆر گەورە + هالۆ
    if (isPremiumGiftItem(itemId)) {
      applyVipSenderBoost(event.fromUid, PREMIUM_GIFT_SENDER_BOOST_MS - elapsed)
    }

    // بارانی زێڕ / گەلەستێرە — بێ هێڵی باریک؛ ئێفێکتی تەواو + ناوەکان لەسەر نەخشە
    if (isAmbientMapGift(itemId)) {
      if (elapsed >= holdMs) return
      const item = DONATE_BY_ID[itemId]
      spawnMapAmbientGiftFx(map, {
        itemId,
        emoji: event.emoji || item?.emoji || '💰',
        label: item?.label ?? 'دیاری',
        fromName,
        toName,
        durationMs: Math.max(800, holdMs - elapsed),
      })
      applyAvatarDonateOverlay(event.toUid, itemId, event.emoji, event.id, { fromName, toName })
      try {
        playSoundEffect(sfxForDonateItem(itemId), 'gift')
      } catch { /* ignore */ }

      const fx: DonateFxEntry = {
        id: `${event.id}_${event.toUid}`,
        eventId: event.id,
        itemId,
        emoji: event.emoji,
        fromUid: event.fromUid,
        targetUid: event.toUid,
        fromLat: event.fromLat,
        fromLng: event.fromLng,
        toLat: event.toLat,
        toLng: event.toLng,
        ctrlLat: event.fromLat,
        ctrlLng: event.fromLng,
        pathStyle: 'wealth',
        startMs: now,
        flightMs: 0,
        holdMs,
        lineUntilMs: now,
        itemUntilMs: now + holdMs,
        svgPath: null,
        flyIcon: null,
        floatMarker: null,
        phase: 'floating',
        arrivalHandled: false,
      }
      if (!fx.arrivalHandled) {
        fx.arrivalHandled = true
        settleDonateArrivalRef.current(event.id)
      }
      donateFxRef.current.push(fx)
      return
    }

    const flightMs = calcDonateFlightMs(event.fromLat, event.fromLng, event.toLat, event.toLng)

    if (elapsed >= flightMs + holdMs) return

    const pathStyle = giftPathStyleForItem(itemId)
    const ctrl = giftPathControlPoint(
      event.fromLat, event.fromLng,
      event.toLat, event.toLng,
      pathStyle,
    )

    ensureGiftFxLayer(map)

    const svgPath = elapsed < flightMs
      ? createGiftTrajectoryPath(map, pathStyle)
      : null

    let flyIcon: HTMLElement | null = null
    let p1x = 0
    let p1y = 0
    let p2x = 0
    let p2y = 0
    let t0 = 0
    try {
      const p1 = map.latLngToContainerPoint([event.fromLat, event.fromLng])
      const p2 = map.latLngToContainerPoint([event.toLat, event.toLng])
      p1x = p1.x
      p1y = p1.y
      p2x = p2.x
      p2y = p2.y
      const raw0 = Math.min(1, Math.max(0, elapsed / Math.max(1, flightMs)))
      t0 = 1 - Math.pow(1 - raw0, 3)
      if (svgPath && Number.isFinite(p1x) && Number.isFinite(p2x)) {
        const d = giftQuadraticScreenPathD(p1x, p1y, p2x, p2y, pathStyle)
        applyGiftTrajectoryPathD(svgPath, d, true)
        updateGiftSvgPathReveal(svgPath, t0, pathStyle)
      }
    } catch { /* path geometry — icon fallback below */ }

    try {
      flyIcon = createGiftFlyIconEl(map, itemId, event.emoji)
      if (svgPath) {
        positionGiftFlyIconOnPath(svgPath, flyIcon, t0, {
          x1: p1x, y1: p1y, x2: p2x, y2: p2y, style: pathStyle,
        })
        ;(svgPath as SVGPathElement & { _kdFlyIcon?: HTMLElement })._kdFlyIcon = flyIcon
      } else if (Number.isFinite(p1x) && Number.isFinite(p2x)) {
        const screen = giftQuadraticScreenPointAt(p1x, p1y, p2x, p2y, pathStyle, t0)
        positionGiftFlyIcon(flyIcon, screen.x, screen.y)
      }
    } catch { /* ignore icon create */ }

    const fx: DonateFxEntry = {

      id: `${event.id}_${event.toUid}`,

      eventId: event.id,

      itemId,

      emoji: event.emoji,

      fromUid: event.fromUid,

      targetUid: event.toUid,

      fromLat: event.fromLat,

      fromLng: event.fromLng,

      toLat: event.toLat,

      toLng: event.toLng,

      ctrlLat: ctrl.lat,

      ctrlLng: ctrl.lng,

      pathStyle,

      startMs: now,

      flightMs,

      holdMs,

      lineUntilMs: now + flightMs,

      itemUntilMs: now + flightMs + holdMs,

      svgPath,

      flyIcon,

      floatMarker: null,

      phase: elapsed >= flightMs ? 'floating' : 'flying',

      arrivalHandled: false,

    }

    if (fx.phase === 'floating') {

      applyAvatarDonateOverlay(event.toUid, itemId, event.emoji, event.id, { fromName, toName })
      if (!fx.arrivalHandled) {
        fx.arrivalHandled = true
        settleDonateArrivalRef.current(event.id)
      }

    }

    donateFxRef.current.push(fx)

  }, [applyAvatarDonateOverlay, applyVipSenderBoost])

  spawnDonateFxRef.current = spawnDonateFxFromEvent

  const isGiftingOpen = Boolean(donatePickerUid) || donatePickerClosing

  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map) return
    const container = map.getContainer()
    if (isGiftingOpen) {
      try { map.dragging.disable() } catch {}
      try { map.touchZoom.disable() } catch {}
      try { map.doubleClickZoom.disable() } catch {}
      try { map.scrollWheelZoom.disable() } catch {}
      try { map.boxZoom.disable() } catch {}
      try { map.keyboard.disable() } catch {}
      container.classList.add('kd-map-gifting-lock')
      container.style.touchAction = 'none'
    } else {
      try { map.dragging.enable() } catch {}
      try { map.touchZoom.enable() } catch {}
      try { map.doubleClickZoom.enable() } catch {}
      try { map.scrollWheelZoom.enable() } catch {}
      try { map.boxZoom.enable() } catch {}
      try { map.keyboard.enable() } catch {}
      container.classList.remove('kd-map-gifting-lock')
      container.style.touchAction = ''
    }
    return () => {
      try { map.dragging.enable() } catch {}
      try { map.touchZoom.enable() } catch {}
      try { map.doubleClickZoom.enable() } catch {}
      try { map.scrollWheelZoom.enable() } catch {}
      try { map.boxZoom.enable() } catch {}
      try { map.keyboard.enable() } catch {}
      container.classList.remove('kd-map-gifting-lock')
      container.style.touchAction = ''
    }
  }, [isGiftingOpen, mapReady])

  // Gift SVG + chat floats — glue to lat/lng during pan/zoom (rAF-coalesced)
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map) return

    let giftRaf = 0
    let chatRaf = 0
    const getMarker = (uid: string): L.Marker | null => {
      if (uid === userIdRef.current) return userMarkerRef.current
      return otherPlayerMarkersRef.current.get(uid) ?? null
    }

    const syncChatNow = () => {
      try {
        syncAllMapChatFloatPositions(map, getMarker)
      } catch { /* ignore */ }
    }
    /** Continuous pan/zoom: one rAF sync max — updates before paint, no over-schedule */
    const scheduleChat = () => {
      if (chatRaf) return
      chatRaf = window.requestAnimationFrame(() => {
        chatRaf = 0
        syncChatNow()
      })
    }
    /** Gesture end / resize: cancel pending rAF and sync immediately */
    const flushChatNow = () => {
      if (chatRaf) {
        window.cancelAnimationFrame(chatRaf)
        chatRaf = 0
      }
      syncChatNow()
    }

    const flushGifts = () => {
      giftRaf = 0
      try {
        refreshGiftTrajectoryPaths(map, donateFxRef.current)
      } catch { /* ignore */ }
    }
    /** Gifts: sync immediately on move so icon stays glued to stroke mid-drag */
    const scheduleGifts = () => {
      flushGifts()
      if (giftRaf) return
      giftRaf = window.requestAnimationFrame(flushGifts)
    }
    const flushGiftsNow = () => {
      if (giftRaf) {
        window.cancelAnimationFrame(giftRaf)
        giftRaf = 0
      }
      flushGifts()
      flushChatNow()
    }

    map.on('move zoom zoomanim', scheduleChat)
    map.on('move zoom zoomanim', scheduleGifts)
    map.on('moveend zoomend viewreset resize', flushGiftsNow)

    return () => {
      if (giftRaf) window.cancelAnimationFrame(giftRaf)
      if (chatRaf) window.cancelAnimationFrame(chatRaf)
      try { map.off('move zoom zoomanim', scheduleChat) } catch { /* ignore */ }
      try { map.off('move zoom zoomanim', scheduleGifts) } catch { /* ignore */ }
      try { map.off('moveend zoomend viewreset resize', flushGiftsNow) } catch { /* ignore */ }
    }
  }, [mapReady])

  const softCloseDonatePicker = useCallback(() => {
    if (donatePickerCloseTimerRef.current) {
      clearTimeout(donatePickerCloseTimerRef.current)
      donatePickerCloseTimerRef.current = null
    }
    if (!donatePickerUid && !donatePickerClosing) return
    setDonatePickerClosing(true)
    donatePickerCloseTimerRef.current = setTimeout(() => {
      setDonatePickerUid(null)
      setDonatePickerClosing(false)
      donatePickerCloseTimerRef.current = null
    }, PLAYER_SHEET_ANIM_MS)
  }, [donatePickerUid, donatePickerClosing])

  /** تەنها یەک بۆکس لە یەک کاتدا — کردنەوەی نوێ، ئەوانی تر دەسڕێتەوە */
  const dismissAllOverlays = useCallback((keep: OverlayKeep = null) => {
    if (keep !== 'spin') {
      try { stopSpinWheelTicks() } catch { /* ignore */ }
      if (spinCloseTimerRef.current) {
        window.clearTimeout(spinCloseTimerRef.current)
        spinCloseTimerRef.current = null
      }
      setSpinResult(null)
      setSpinAnimating(false)
      setSpinSheetIn(false)
      setSpinSheetClosing(false)
      setShowSpinWheel(false)
    }

    if (keep !== 'mapChat') {
      if (mapChatCloseTimerRef.current) {
        window.clearTimeout(mapChatCloseTimerRef.current)
        mapChatCloseTimerRef.current = null
      }
      setMapChatShowEmoji(false)
      setMapChatSheetIn(false)
      setMapChatSheetClosing(false)
      setShowMapChatModal(false)
    }

    if (keep !== 'player') {
      if (selectedPlayerUidRef.current) {
        closePlayerSheet()
      } else {
        if (donatePickerCloseTimerRef.current) {
          clearTimeout(donatePickerCloseTimerRef.current)
          donatePickerCloseTimerRef.current = null
        }
        setDonatePickerUid(null)
        setDonatePickerClosing(false)
      }
    }

    if (keep !== 'dropdown') {
      snapCloseDropdownUi()
      setActiveBalance(null)
      setActiveSheet(null)
      setShowAvatarStudio(false)
    } else if (selectedPlayerUidRef.current) {
      closePlayerSheet()
      setShowAvatarStudio(false)
    } else {
      setShowAvatarStudio(false)
    }

    if (keep !== 'levelRules') {
      setShowLevelRulesModal(false)
    }

    if (keep !== 'arDrop') {
      closeArDropSession()
    }

    setSelectedFactoryId(null)
  }, [closePlayerSheet, closeArDropSession])

  dismissAllOverlaysRef.current = dismissAllOverlays

  const handleSendDonateItem = useCallback(async (targetUid: string, targetName: string, itemId: DonateItemId) => {

    const myUid = userIdRef.current

    if (!myUid) return

    const item = DONATE_ITEMS.find(d => d.id === itemId)

    if (!item) return

    const target = onlinePlayersRef.current.get(targetUid)

    if (!target) {

      showGameAlert({ message: '❌ یاریزانەکە لە نەخشەدا نەدۆزرایەوە' })

      return

    }

    if (!isNpcPlayerUid(targetUid) && !isBotPlayerUid(targetUid)) {
      try {
        const recipientProfile = await getUserPublicProfile(targetUid)
        if (recipientProfile?.blockIncomingGifts === true) {
          showGameAlert({ message: '🚫 ئەم یاریزانە وەرگرتنی دیاری داخستووە' })
          return
        }
      } catch { /* fail-open on network error */ }
    }

    if (!canAffordDonateItem(walletRef.current, item)) {
      const need = formatDonateCostLabel(item)
      showGameAlert({ message: `❌ باڵانس بەش ناکات — پێویستت بە ${need} هەیە`, tone: 'warn' })
      return
    }

    const fromLat = userLatRef.current
    const fromLng = userLngRef.current
    const toLat = target.lat
    const toLng = target.lng
    const now = Date.now()
    const goldCost = item.goldPrice
    const diamondCost = item.diamondPrice

    setWalletAndSync(p => ({
      ...p,
      gold: Math.max(0, p.gold - goldCost),
      diamond: Math.max(0, p.diamond - diamondCost),
    }))
    if (userIdRef.current) {
      recordPlayerSpend(userIdRef.current, { gold: goldCost, diamond: diamondCost })
    }

    setDonatePickerUid(null)
    setDonatePickerClosing(false)

    try {
      const eventId = await realtimeSync.broadcastGift({
        fromUid: myUid,
        toUid: targetUid,
        itemId: item.id,
        emoji: item.emoji,
        goldCost,
        diamondCost,
        fromLat,
        fromLng,
        toLat,
        toLng,
        startMs: now,
      })

      processedDonationIdsRef.current.add(eventId)

      spawnDonateFxFromEvent({
        id: eventId,
        fromUid: myUid,
        toUid: targetUid,
        itemId: item.id,
        emoji: item.emoji,
        goldCost,
        diamondCost,
        fromLat,
        fromLng,
        toLat,
        toLng,
        startMs: now,
      }, item.id)

      // Ambient gifts play SFX inside spawn (shared with remote viewers)
      if (!isAmbientMapGift(item.id)) {
        playSoundEffect(sfxForDonateItem(item.id), 'gift')
      }

      incrementGiftsSentScore(myUid, donateItemValueScore(item)).catch(() => {})

      // ٪٣٠ بۆ وەرگر — بۆ NPC/بۆت نێرەر دەینووسێت (وەرگری فەیک کلاینتی نییە)
      const cutGold = Math.max(0, Math.round(goldCost * GIFT_RECIPIENT_CUT_PCT))
      const cutDiamond = Math.max(0, Math.round(diamondCost * GIFT_RECIPIENT_CUT_PCT))
      if (cutGold > 0 || cutDiamond > 0) {
        const recipientNeedsSenderCredit =
          isNpcPlayerUid(targetUid) || isBotPlayerUid(targetUid)
        if (recipientNeedsSenderCredit) {
          creditGiftRevenueShare(targetUid, { gold: cutGold, diamond: cutDiamond }).catch((err) => {
            console.error('NPC gift cut failed:', err)
          })
        }
      }

      const cutHint = cutDiamond > 0
        ? ` · ٪٣٠ → +${cutDiamond}💎 بۆ ${targetName}`
        : cutGold > 0
          ? ` · ٪٣٠ → +${cutGold}🪙 بۆ ${targetName}`
          : ''
      showGameAlert({
        message: `${item.emoji} ${item.label} بۆ ${targetName} نێردرا! (−${formatDonateCostLabel(item)})${cutHint}`,
        tone: 'success',
      })

      logActivity('gift', `بەخشین — ${item.label} بۆ ${targetName}`, item.emoji || '🎁')

      addXP(item.tier === 'vip' ? XP_REWARDS.giftVip : item.tier === 'mid' ? XP_REWARDS.giftMid : XP_REWARDS.giftBasic)

    } catch (err) {
      setWalletAndSync(p => ({
        ...p,
        gold: p.gold + goldCost,
        diamond: p.diamond + diamondCost,
      }))
      showGameAlert({ message: err instanceof Error ? err.message : '❌ نەتوانرا بەخشینەکە بنێردرێت' })
    }

  }, [showGameAlert, setWalletAndSync, spawnDonateFxFromEvent, addXP, logActivity])

  useEffect(() => {

    if (!mapReady) return

    const map = mapRef.current

    if (!map) return

    const container = map.getContainer()

    const isMapDismissTarget = (target: EventTarget | null) => {

      if (!(target instanceof HTMLElement)) return false

      if (!container.contains(target)) return false

      if (target.closest('.kd-clickable-player, .kd-clickable-self, .kd-clickable-drop, .kd-clickable-factory, .kd-live-war-badge')) return false

      return true

    }

    const dismissFromMap = (fromTouch: boolean) => {

      if (fromTouch && mapGestureRef.current.singleTouchMoved) return

      if (isMapMarkerClickBlocked(mapGestureRef)) return

      const now = Date.now()

      if (now - mapSheetDismissLockRef.current < 400) return

      mapSheetDismissLockRef.current = now

      if (selectedPlayerUidRef.current) {

        closePlayerSheet()

        return

      }

      // کلیک لەسەر نەخشە — هەر بۆکسێکی کراوە دابخە
      dismissAllOverlaysRef.current(null)

    }

    const onMapClick = () => dismissFromMap(false)

    const onMapTouchEnd = (e: TouchEvent) => {

      if (!isMapDismissTarget(e.target)) return

      dismissFromMap(true)

    }

    map.on('click', onMapClick)

    container.addEventListener('touchend', onMapTouchEnd, { capture: true, passive: false })

    return () => {

      try { map.off('click', onMapClick) } catch {}

      container.removeEventListener('touchend', onMapTouchEnd, true)

    }

  }, [mapReady, closePlayerSheet])

  useEffect(() => {

    if (!mapReady || !authUserId) return

    return subscribeToMapDonations(sessionStartRef.current, event => {

      if (processedDonationIdsRef.current.has(event.id)) return

      processedDonationIdsRef.current.add(event.id)

      const myUid = userIdRef.current

      // Block Incoming Gifts — وەرگر دیاری نابینێت / ئاگاداری وەرناگرێت
      if (myUid && event.toUid === myUid && blockIncomingGiftsRef.current) return

      const itemId = (DONATE_ITEMS.find(d => d.id === event.itemId)?.id ?? 'tomato') as DonateItemId

      // Queue recipient reward for impact moment (not on send)
      registerRecipientGiftArrival(event, itemId)

      spawnDonateFxFromEvent(event, itemId)

    })

  }, [mapReady, authUserId, spawnDonateFxFromEvent, registerRecipientGiftArrival])

  // Socket.io real-time map (server/index.js) — join_map / move / gifts / chat / xp
  useEffect(() => {
    if (authLoading || !authUserId || !mapReady) return
    const profile = userProfileRef.current ?? FALLBACK_PROFILE
    const cos = cosmeticsToPublic(boughtItemsRef.current)
    realtimeSync.connect(authUserId, {
      uid: authUserId,
      name: profile.name,
      gender: profile.gender,
      lat: userLatRef.current,
      lng: userLngRef.current,
      avatarUrl: profile.avatarUrl,
      showMyAvatarOnMap: showMyAvatarOnMapRef.current && !ghostModeRef.current,
      avatar3d: normalizeAvatar3d(profile.avatar3d),
      skinId: cos.skinId,
      borderId: cos.borderId,
      titleId: cos.titleId,
      headwearId: cos.headwearId,
      accessoryId: cos.accessoryId,
      hunterLevel: profile.hunterLevel ?? 0,
      playerId: profile.playerId ?? '',
      playerLevel: profile.playerLevel ?? 1,
      playerXp: profile.playerXp ?? 0,
    })

    const unsub = realtimeSync.on(event => {
      if (event.channel === 'players' && event.type === 'moved') {
        const sp = event.player
        if (!sp?.uid || sp.uid === authUserId) return
        const prev = onlinePlayersRef.current.get(sp.uid)
        const next = {
          ...(prev ?? {
            uid: sp.uid,
            isOnline: true,
            mapAuraId: null,
            companionId: null,
            smokeUntilMs: 0,
            duelFxUntilMs: 0,
            activeDuelId: null,
            playerId: '',
            isBot: false,
            lastSeenMs: Date.now(),
          }),
          uid: sp.uid,
          name: sp.name || prev?.name || 'یاریزان',
          gender: (sp.gender === 'female' ? 'female' : 'male') as Gender,
          lat: sp.lat,
          lng: sp.lng,
          isOnline: true,
          showMyAvatarOnMap: sp.showMyAvatarOnMap !== false,
          avatarUrl: sp.avatarUrl ?? prev?.avatarUrl ?? null,
          avatar3d: (sp.avatar3d as any) ?? prev?.avatar3d ?? null,
          skinId: sp.skinId ?? prev?.skinId ?? null,
          borderId: sp.borderId ?? prev?.borderId ?? null,
          titleId: sp.titleId ?? prev?.titleId ?? null,
          headwearId: sp.headwearId ?? prev?.headwearId ?? null,
          accessoryId: sp.accessoryId ?? prev?.accessoryId ?? null,
          hunterLevel: sp.hunterLevel ?? prev?.hunterLevel ?? 0,
          playerId: typeof sp.playerId === 'string' && sp.playerId ? sp.playerId : (prev?.playerId ?? ''),
          lastSeenMs: sp.updatedAtMs ?? Date.now(),
        }
        onlinePlayersRef.current.set(sp.uid, next)
        otherPlayerTruePosRef.current.set(sp.uid, { lat: sp.lat, lng: sp.lng })
        const marker = otherPlayerMarkersRef.current.get(sp.uid)
        if (marker) {
          try { marker.setLatLng([sp.lat, sp.lng]) } catch {}
          scheduleLayoutMapAvatars()
        } else {
          bumpMapPlayersTick()
        }
        return
      }

      if (event.channel === 'players' && event.type === 'left') {
        const uid = event.uid
        onlinePlayersRef.current.delete(uid)
        otherPlayerTruePosRef.current.delete(uid)
        const marker = otherPlayerMarkersRef.current.get(uid)
        const group = playerMarkersGroupRef.current
        if (marker && group) {
          try { group.removeLayer(marker) } catch {}
        }
        otherPlayerMarkersRef.current.delete(uid)
        otherPlayerIconSigRef.current.delete(uid)
        otherPlayerMotionRef.current.delete(uid)
        bumpMapPlayersTick()
        return
      }

      if (event.channel === 'players' && event.type === 'sync') {
        // Merge live humans from socket; keep bots already in map from Firestore seed
        for (const p of event.players) {
          if (!p.uid || p.uid === authUserId) continue
          const prev = onlinePlayersRef.current.get(p.uid)
          if (prev?.isBot) continue
          onlinePlayersRef.current.set(p.uid, {
            ...p,
            smokeUntilMs: prev?.smokeUntilMs ?? 0,
            duelFxUntilMs: prev?.duelFxUntilMs ?? 0,
            activeDuelId: prev?.activeDuelId ?? null,
            mapAuraId: prev?.mapAuraId ?? null,
            companionId: prev?.companionId ?? null,
          })
          otherPlayerTruePosRef.current.set(p.uid, { lat: p.lat, lng: p.lng })
        }
        bumpMapPlayersTick()
        return
      }

      if (event.channel === 'gifts' && event.type === 'broadcast') {
        const donation = event.event
        if (processedDonationIdsRef.current.has(donation.id)) return
        processedDonationIdsRef.current.add(donation.id)
        const myUid = userIdRef.current
        if (myUid && donation.toUid === myUid && blockIncomingGiftsRef.current) return
        const itemId = (DONATE_ITEMS.find(d => d.id === donation.itemId)?.id ?? 'tomato') as DonateItemId
        registerRecipientGiftArrival(donation, itemId)
        spawnDonateFxFromEvent(donation, itemId)
        return
      }

      if (event.channel === 'mapChat' && event.type === 'message') {
        const msg = event.message
        if (msg.hiddenFromOthers && msg.uid !== userIdRef.current) return
        const liveHunter =
          onlinePlayersRef.current.get(msg.uid)?.hunterLevel
          ?? (msg.uid === userIdRef.current ? userProfileRef.current?.hunterLevel : undefined)
          ?? 0
        mapChatBubblesRef.current.set(msg.uid, {
          id: msg.id,
          uid: msg.uid,
          text: msg.text,
          isPremium: msg.isPremium === true,
          createdAtMs: msg.createdAtMs,
          expiresAtMs: msg.expiresAtMs,
          hunterLevel: Math.max(0, Math.floor(Number(liveHunter) || 0)),
        })
        if (msg.uid === userIdRef.current) updateUserMarkerIcon()
        else {
          otherPlayerIconSigRef.current.delete(msg.uid)
          bumpMapPlayersTick()
        }
        return
      }

      if (event.channel === 'xp' && event.type === 'updated') {
        // Live level badge sync for remote players (stored on location payload next move)
        const data = event.data
        if (!data?.uid || data.uid === authUserId) return
        const prev = onlinePlayersRef.current.get(data.uid)
        if (!prev) return
        onlinePlayersRef.current.set(data.uid, { ...prev, lastSeenMs: data.updatedAtMs ?? Date.now() })
      }
    })

    return () => {
      unsub()
      realtimeSync.disconnect()
    }
  }, [authLoading, authUserId, mapReady, bumpMapPlayersTick, scheduleLayoutMapAvatars, spawnDonateFxFromEvent, registerRecipientGiftArrival, updateUserMarkerIcon])

  const applyMapChatMessages = useCallback((messages: MapChatMessage[]) => {

    const now = Date.now()

    const next = new Map<string, ActiveMapChatBubble>()

    // دوایین نامەی هەر یاریزانێک — یەک بڵق لەسەر سەر

    const myUidForChat = userIdRef.current

    for (const msg of messages) {

      if (!msg.uid || msg.expiresAtMs <= now) continue

      if (msg.hiddenFromOthers && msg.uid !== myUidForChat) continue

      const prev = next.get(msg.uid)

      if (!prev || msg.createdAtMs >= prev.createdAtMs) {

        const liveHunter =
          onlinePlayersRef.current.get(msg.uid)?.hunterLevel
          ?? (msg.uid === userIdRef.current ? userProfileRef.current?.hunterLevel : undefined)
          ?? prev?.hunterLevel
          ?? 0

        next.set(msg.uid, {

          id: msg.id,

          uid: msg.uid,

          text: msg.text.slice(0, MAP_CHAT_MAX_LEN),

          isPremium: msg.isPremium,

          createdAtMs: msg.createdAtMs,

          expiresAtMs: msg.expiresAtMs,

          hunterLevel: Math.max(0, Math.floor(Number(liveHunter) || 0)),

        })

      }

    }

    // بڵقە کۆمیدییەکانی NPC بپارێزە (Firestore بیانسڕێتەوە)
    for (const [uid, b] of mapChatBubblesRef.current) {
      if (!isNpcPlayerUid(uid) || b.expiresAtMs <= now) continue
      const cur = next.get(uid)
      if (!cur || cur.createdAtMs < b.createdAtMs) next.set(uid, b)
    }

    let changed = false

    if (next.size !== mapChatBubblesRef.current.size) changed = true

    else {

      for (const [uid, b] of next) {

        const old = mapChatBubblesRef.current.get(uid)

        if (!old || old.id !== b.id || old.expiresAtMs !== b.expiresAtMs || old.hunterLevel !== b.hunterLevel) {

          changed = true

          break

        }

      }

    }

    const prevBubbleUids = [...mapChatBubblesRef.current.keys()]

    mapChatBubblesRef.current = next

    if (changed) {
      // Batched overlay patches — ئاڤاتارەکان ڕیفڕێش نابن
      const touched = new Set<string>([...next.keys(), ...prevBubbleUids])
      for (const uid of touched) {
        const html = buildMapChatBubbleHtml(
          uid,
          mapChatBubblesRef.current,
          revealedMapChatIdsRef.current,
          userIdRef.current,
          hideGlobalChatRef.current,
        )
        overlayBatchRef.current.push(
          html ? { kind: 'chat', uid, html } : { kind: 'clearChat', uid },
        )
      }
    }

    // نوێکردنەوەی لیستی چاتی گشتی (React state)
    for (const msg of messages) {
      if (!msg.id || !msg.text) continue
      if (msg.hiddenFromOthers && msg.uid !== myUidForChat) continue
      const loc = onlinePlayersRef.current.get(msg.uid)
      appendMapChatFeed({
        id: msg.id,
        uid: msg.uid,
        name: msg.name || loc?.name || 'یاریزان',
        text: msg.text.slice(0, MAP_CHAT_MAX_LEN),
        avatarUrl: loc?.avatarUrl || null,
        avatar3d: loc?.avatar3d ? normalizeAvatar3d(loc.avatar3d) : null,
        gender: loc?.gender === 'female' ? 'female' : 'male',
        createdAtMs: msg.createdAtMs,
        isSelf: msg.uid === userIdRef.current,
      })
    }

  }, [appendMapChatFeed])

  useEffect(() => {

    if (!mapReady || !authUserId) return

    return subscribeToMapChat(applyMapChatMessages)

  }, [mapReady, authUserId, applyMapChatMessages])

  /** Global Chat Engine — تایمەری بەردەوام (٣–١٠ چرکە)؛ دەوەستێت لە باکگراوند */
  useEffect(() => {
    if (authLoading || !mapReady) return
    let cancelled = false
    let timer = 0

    const scheduleNext = (ms?: number) => {
      if (cancelled) return
      window.clearTimeout(timer)
      timer = window.setTimeout(pushSimChat, ms ?? nextGlobalChatDelayMs())
    }

    const pushSimChat = () => {
      if (cancelled) return
      // Page Visibility — چات لە باکگراوند ناچێتە پێشەوە
      if (document.visibilityState === 'hidden') {
        scheduleNext(2500)
        return
      }
      const now = Date.now()
      // نامە چالاکەکان (کە بەسەرنەچووون) کۆدەکەینەوە تاوەکو دوو کارەکتەری
      // نزیک لە یەک کاتدا هەمان نامە پیشان نەدەن
      const activeChatTexts = new Set<string>()
      for (const b of mapChatBubblesRef.current.values()) {
        if (b.expiresAtMs > now) activeChatTexts.add(b.text)
      }
      const line = pickOnlineGlobalChatLine(npcLiveRef.current, now, activeChatTexts)
      if (line) {
        const loc = onlinePlayersRef.current.get(line.uid)
        const npc = npcLiveRef.current.find((n) => n.uid === line.uid)
        const avatar3d = loc?.avatar3d
          ? normalizeAvatar3d(loc.avatar3d)
          : (npc?.avatar3d ?? null)
        const id = `gchat_${line.uid}_${now}`
        mapChatBubblesRef.current.set(line.uid, {
          id,
          uid: line.uid,
          text: line.text.slice(0, MAP_CHAT_MAX_LEN),
          isPremium: true,
          createdAtMs: now,
          expiresAtMs: now + randomMapChatBubbleMs(),
          hunterLevel: Math.max(0, Math.floor(Number(line.hunterLevel) || 0)),
        })
        overlayBatchRef.current.push({
          kind: 'chat',
          uid: line.uid,
          html: buildMapChatBubbleHtml(
            line.uid,
            mapChatBubblesRef.current,
            revealedMapChatIdsRef.current,
            userIdRef.current,
            hideGlobalChatRef.current,
          ),
        })
        appendMapChatFeed({
          id,
          uid: line.uid,
          name: line.name,
          text: line.text.slice(0, MAP_CHAT_MAX_LEN),
          avatarUrl: loc?.avatarUrl || null,
          avatar3d,
          gender: line.gender,
          createdAtMs: now,
        })
      }
      scheduleNext()
    }

    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        window.clearTimeout(timer)
        return
      }
      scheduleNext(800)
    }

    document.addEventListener('visibilitychange', onVis)
    scheduleNext()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [authLoading, mapReady, appendMapChatFeed])

  /** auto-scroll بۆ خوارەوە کاتێک نامەی نوێ دێت */
  useEffect(() => {
    if (!showMapChatModal) return
    const end = mapChatFeedEndRef.current
    const list = mapChatFeedListRef.current
    if (end) {
      end.scrollIntoView({ behavior: 'smooth', block: 'end' })
    } else if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [mapChatFeed, showMapChatModal])

  useEffect(() => {
    if (!showMapChatModal) {
      setMapChatKbInset(0)
      return
    }
    const updateKbInset = () => {
      const vv = window.visualViewport
      if (!vv) {
        setMapChatKbInset(0)
        return
      }
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
      setMapChatKbInset(inset)
    }
    updateKbInset()
    const vv = window.visualViewport
    vv?.addEventListener('resize', updateKbInset)
    vv?.addEventListener('scroll', updateKbInset)
    window.addEventListener('resize', updateKbInset)
    // Re-measure shortly after focus / keyboard animation
    const t1 = window.setTimeout(updateKbInset, 80)
    const t2 = window.setTimeout(updateKbInset, 280)
    const t3 = window.setTimeout(updateKbInset, 520)
    return () => {
      vv?.removeEventListener('resize', updateKbInset)
      vv?.removeEventListener('scroll', updateKbInset)
      window.removeEventListener('resize', updateKbInset)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      setMapChatKbInset(0)
    }
  }, [showMapChatModal])

  const handleSendMapChat = useCallback(async () => {

    const uid = userIdRef.current

    if (!uid || mapChatSending) return

    const text = mapChatDraft.trim().slice(0, MAP_CHAT_MAX_LEN)

    if (!text) return

    setMapChatSending(true)

    try {

      const msg = await realtimeSync.broadcastMapChat({

        uid,

        name: userProfileRef.current?.name || 'یاریزان',

        text,

        isPremium: walletRef.current.isPremium === true,

        playerId: userProfileRef.current?.playerId || '',

        hiddenFromOthers: hideGlobalChatRef.current,

      })

      setMapChatDraft('')

      if (msg) {

        // Optimistic local bubble

        mapChatBubblesRef.current.set(uid, {

          id: msg.id,

          uid: msg.uid,

          text: msg.text,

          isPremium: msg.isPremium,

          createdAtMs: msg.createdAtMs,

          expiresAtMs: msg.expiresAtMs,

          hunterLevel: Math.max(0, Math.floor(Number(userProfileRef.current?.hunterLevel) || 0)),

        })

        appendMapChatFeed({
          id: msg.id,
          uid: msg.uid,
          name: msg.name,
          text: msg.text,
          avatarUrl: userProfileRef.current?.avatarUrl || null,
          avatar3d: userProfileRef.current?.avatar3d
            ? normalizeAvatar3d(userProfileRef.current.avatar3d)
            : null,
          gender: userProfileRef.current?.gender === 'female' ? 'female' : 'male',
          createdAtMs: msg.createdAtMs,
          isSelf: true,
        })

        setMapChatShowEmoji(false)

        updateUserMarkerIcon()

        playSoundEffect('chat')

        addXP(XP_REWARDS.mapChat)

      }

    } catch (err) {

      showGameAlert({ message: `❌ ${err instanceof Error ? err.message : 'نەتوانرا نامە بنێردرێت'}` })

    } finally {

      setMapChatSending(false)

    }

  }, [mapChatDraft, mapChatSending, updateUserMarkerIcon, showGameAlert, addXP, appendMapChatFeed])

  /** Open player info sheet — capture interceptor → __openPlayer (thin once-open gate). */

  const handlePlayerClick = useCallback((uid: string) => {

    try {

      const id = String(uid || '').trim()

      if (!id || !beginOpen(`p:${id}`)) return

      dismissAllOverlaysRef.current('player')

      const loc = onlinePlayersRef.current.get(id)

      const bot = loc?.isBot === true || isBotPlayerUid(id)

      const npcLive = isNpcPlayerUid(id)
        ? npcLiveRef.current.find((n) => n.uid === id)
        : undefined

      const safeGender: Gender = loc?.gender === 'female' || npcLive?.gender === 'female' ? 'female' : 'male'

      const safeName =

        (typeof loc?.name === 'string' && loc.name.trim())

          ? loc.name.trim()

          : (npcLive?.name?.trim() || 'یاریزان')

      let safeAvatar3d = { ...DEFAULT_AVATAR_3D }

      try { safeAvatar3d = normalizeAvatar3d(loc?.avatar3d ?? npcLive?.avatar3d ?? DEFAULT_AVATAR_3D) } catch { safeAvatar3d = { ...DEFAULT_AVATAR_3D } }

      // Open sheet once, instantly — profile hydrate is best-effort after

      selectedPlayerUidRef.current = id

      applyMapAvatarFocus(id)

      setSelectedPlayer({

        uid: id,

        name: safeName,

        gender: safeGender,

        gold: npcLive ? npcLive.gold : 0,

        diamond: npcLive ? npcLive.diamond : 0,

        isPremium: false,

        isSelf: false,

        isOnline: loc?.isOnline === true || npcLive?.isOnline === true,

        isBot: bot,

        avatarUrl: typeof loc?.avatarUrl === 'string' && loc.avatarUrl ? loc.avatarUrl : null,

        avatar3d: safeAvatar3d,

        hunterLevel: resolveHunterLevel(
          npcLive?.hunterLevel ?? loc?.hunterLevel,
          npcLive?.dropsOpenedByType,
        ),

        dropsOpenedByType: npcLive
          ? { ...npcLive.dropsOpenedByType }
          : { ...EMPTY_DROPS_OPENED },

        skinId: typeof loc?.skinId === 'number' ? loc.skinId : null,

        borderId: typeof loc?.borderId === 'number' ? loc.borderId : null,

        titleId: typeof loc?.titleId === 'number' ? loc.titleId : null,

        headwearId: typeof loc?.headwearId === 'number' ? loc.headwearId : null,

        accessoryId: typeof loc?.accessoryId === 'number' ? loc.accessoryId : null,

        lastSeenMs: loc?.lastSeenMs ?? npcLive?.lastSeenMs ?? null,

        stats: npcLive
          ? { ...DEFAULT_PLAYER_STATS, ...npcLive.stats }
          : { ...DEFAULT_PLAYER_STATS },

      })

      setActiveSheet('playerInfo')

      void getUserPublicProfile(id).then(profile => {

        if (!profile) return

        setSelectedPlayer(prev => {

          if (!prev || prev.uid !== id) return prev

          let nextAvatar3d = prev.avatar3d ?? { ...DEFAULT_AVATAR_3D }

          try {

            nextAvatar3d = normalizeAvatar3d(profile.avatar3d ?? prev.avatar3d ?? DEFAULT_AVATAR_3D)

          } catch { /* keep previous */ }

          // NPC — ئاماری زیندوو لەسەر نەخشە پێشینەیە
          if (isNpcPlayerUid(id)) {
            const npc = npcLiveRef.current.find((n) => n.uid === id)
            return {
              ...prev,
              name: (typeof profile.name === 'string' && profile.name.trim()) ? profile.name.trim() : prev.name,
              gender: profile.gender === 'female' || prev.gender === 'female' ? 'female' : 'male',
              gold: Math.max(Number(profile.gold) || 0, npc?.gold ?? prev.gold),
              diamond: Math.max(Number(profile.diamond) || 0, npc?.diamond ?? prev.diamond),
              isPremium: Boolean(profile.isPremium),
              avatarUrl: typeof profile.avatarUrl === 'string' && profile.avatarUrl ? profile.avatarUrl : prev.avatarUrl,
              avatar3d: nextAvatar3d,
              dropsOpenedByType: npc
                ? { ...npc.dropsOpenedByType }
                : parseDropsOpenedByType(profile.dropsOpenedByType ?? prev.dropsOpenedByType),
              hunterLevel: resolveHunterLevel(
                npc?.hunterLevel ?? profile.hunterLevel ?? prev.hunterLevel,
                npc
                  ? npc.dropsOpenedByType
                  : parseDropsOpenedByType(profile.dropsOpenedByType ?? prev.dropsOpenedByType),
              ),
              stats: npc
                ? { ...DEFAULT_PLAYER_STATS, ...npc.stats }
                : (profile.stats ? { ...DEFAULT_PLAYER_STATS, ...profile.stats } : prev.stats),
            }
          }

          return {

            ...prev,

            name: (typeof profile.name === 'string' && profile.name.trim()) ? profile.name.trim() : prev.name,

            gender: profile.gender === 'female' ? 'female' : 'male',

            gold: Number(profile.gold) || 0,

            diamond: Number(profile.diamond) || 0,

            isPremium: Boolean(profile.isPremium),

            isBot: prev.isBot || Boolean(profile.isBot) || isBotPlayerUid(id) || bot,

            avatarUrl: typeof profile.avatarUrl === 'string' && profile.avatarUrl ? profile.avatarUrl : prev.avatarUrl,

            avatar3d: nextAvatar3d,

            dropsOpenedByType: parseDropsOpenedByType(profile.dropsOpenedByType ?? prev.dropsOpenedByType),

            hunterLevel: resolveHunterLevel(
              profile.hunterLevel ?? prev.hunterLevel,
              parseDropsOpenedByType(profile.dropsOpenedByType ?? prev.dropsOpenedByType),
            ),

            stats: profile.stats ? { ...DEFAULT_PLAYER_STATS, ...profile.stats } : prev.stats,

          }

        })

      }).catch(() => {})

    } catch (err) {

      console.error('handlePlayerClick failed:', err)

    }

  }, [beginOpen, applyMapAvatarFocus])

  const handleSelfClick = useCallback(() => {

    try {

      if (!beginOpen('self')) return

      dismissAllOverlaysRef.current('player')

      const uid = userIdRef.current

      const profile = userProfileRef.current ?? FALLBACK_PROFILE

      const w = walletRef.current

      const cos = cosmeticsToPublic(boughtItemsRef.current)

      const selfUid = uid ?? 'self'

      selectedPlayerUidRef.current = selfUid

      applyMapAvatarFocus(selfUid)

      setSelectedPlayer({

        uid: selfUid,

        name: profile.name,

        gender: profile.gender,

        gold: w.gold,

        diamond: w.diamond,

        isPremium: w.isPremium,

        isSelf: true,

        isOnline: true,

        isBot: false,

        avatarUrl: profile.avatarUrl,

        avatar3d: normalizeAvatar3d(profile.avatar3d),

        dropsOpenedByType: profile.dropsOpenedByType ?? { ...EMPTY_DROPS_OPENED },

        hunterLevel: resolveHunterLevel(
          profile.hunterLevel,
          profile.dropsOpenedByType ?? EMPTY_DROPS_OPENED,
        ),

        skinId: cos.skinId,

        borderId: cos.borderId,

        titleId: cos.titleId,

        headwearId: cos.headwearId,

        accessoryId: cos.accessoryId,

        lastSeenMs: Date.now(),

        stats: { ...DEFAULT_PLAYER_STATS, ...(profile.stats ?? {}) },

      })

      setActiveSheet('playerInfo')

    } catch (err) {

      console.error('handleSelfClick failed:', err)

    }

  }, [beginOpen, applyMapAvatarFocus])

  const openDropModal = useCallback((airdropId: string) => {

    if (isMapMarkerClickBlocked(mapGestureRef)) return

    const id = String(airdropId || '').trim()

    if (!id || !beginOpen(`drop:${id}`)) return

    tryOpenDropAr(id)

  }, [beginOpen, tryOpenDropAr])

  const handlePlayerClickRef = useRef(handlePlayerClick)

  const handleSelfClickRef = useRef(handleSelfClick)

  const openDropModalRef = useRef(openDropModal)

  handlePlayerClickRef.current = handlePlayerClick

  handleSelfClickRef.current = handleSelfClick

  openDropModalRef.current = openDropModal

  const openCitadelShop = useCallback(() => {
    if (!beginOpen('shop:citadel')) return
    dismissAllOverlaysRef.current('dropdown')
    setCitadelTab('weapons')
    setCosmeticPage(0)
    setSeasonPass(prev => {
      const next = bumpMission(normalizeMissions(prev), 'openShop', 1)
      seasonPassRef.current = next
      if (userIdRef.current) saveSeasonPass(userIdRef.current, next)
      return next
    })
    expandDropdownUi('68vh')
    setActiveSheet('market')
    setActiveBalance(null)
  }, [beginOpen])

  const openNationalFactory = useCallback((factoryId: string) => {
    const id = String(factoryId || '').trim()
    if (!id || !beginOpen(`factory:${id}`)) return
    const factory = NATIONAL_FACTORY_BY_ID[id]
    if (!factory) {
      showGameAlert({ message: 'کارگەکە نەدۆزرایەوە' })
      return
    }

    void (async () => {
      let homeKey = (homeCityKeyRef.current || '').trim()
      // دوای سڕینەوە / یەکەم جار — شار لە GPS تۆمار بکە (بێ پێویستی جووڵە)
      if (!homeKey) {
        const uid = userIdRef.current
        if (uid) {
          try {
            const key = await ensureHomeCityKey(uid, userLatRef.current, userLngRef.current)
            if (key) {
              homeKey = key
              homeCityKeyRef.current = key
            }
          } catch (err) {
            console.error('ensureHomeCityKey on factory open failed:', err)
          }
        }
      }

      if (!homeKey) {
        showGameAlert({
          message: 'شارەکەت هێشتا دیارینەکراوە — مۆڵەتی شوێن (GPS) چالاک بکە یان پەیوەندی بپشکنە',
          tone: 'warn',
        })
        return
      }
      if (homeKey !== factory.cityKey) {
        const homeName = factoryCityName(homeKey)
        showGameAlert({
          title: 'کارگەی شارێکی تر',
          message: `تۆ نیشتەجێی شاری ${homeName}یت و ناتوانیت لە کارگەکانی شاری ${factory.cityName} زێڕ و ئەڵماس ببات.`,
          icon: '🏭',
          tone: 'warn',
        })
        return
      }

      dismissAllOverlaysRef.current(null)
      const uid = userIdRef.current
      setFactoryProgress(loadFactoryProgress(uid))
      setFactoryStock(null)
      setFactoryTickMs(Date.now())
      setSelectedFactoryId(id)
      logActivity('other', `کردنەوەی ${factoryLabel(factory)}`, factory.kind === 'gold' ? '🪙' : '💠')

      void ensureFactoryStockDoc(id)
        .then(stock => {
          setFactoryStock(stock)
          setFactoryTickMs(Date.now())
        })
        .catch(err => {
          console.error('ensureFactoryStockDoc failed:', err)
          showGameAlert({ message: 'نەتوانرا کۆگای کارگە بکرێتەوە — پەیوەندی بپشکنە', tone: 'warn' })
        })
    })()
  }, [beginOpen, showGameAlert, logActivity])

  openFactoryRef.current = openNationalFactory

  const closeNationalFactory = useCallback(() => {
    setSelectedFactoryId(null)
    setFactoryStock(null)
    setFactoryCollectBusy(false)
  }, [])

  const handleCollectFactory = useCallback(async () => {
    const id = selectedFactoryId
    if (!id || factoryCollectBusy) return
    const factory = NATIONAL_FACTORY_BY_ID[id]
    if (!factory) return

    const homeKey = (homeCityKeyRef.current || '').trim()
    if (!homeKey || homeKey !== factory.cityKey) {
      const homeName = factoryCityName(homeKey || '—')
      showGameAlert({
        title: 'کارگەی شارێکی تر',
        message: `تۆ نیشتەجێی شاری ${homeName}یت و ناتوانیت لە کارگەکانی شاری ${factory.cityName} زێڕ و ئەڵماس ببات.`,
        icon: '🏭',
        tone: 'warn',
      })
      return
    }
    if (!vipPassesRef.current.master.owned) {
      showGameAlert({
        title: 'ڕێڕەوی کوردستان',
        message: 'تەنها بەشداربووانی ڕێڕەوی کوردستان دەتوانن لە کارگەکان پارە ببەن.',
        icon: '🏔',
        tone: 'warn',
      })
      return
    }

    const uid = userIdRef.current
    if (!uid) {
      showGameAlert({ message: 'چوونەژوورەوە پێویستە', tone: 'warn' })
      return
    }

    setFactoryCollectBusy(true)
    try {
      const result = await claimFromNationalFactory(uid, id)
      if (result.stock) setFactoryStock(result.stock)
      if (result.personal) {
        setFactoryProgress(result.personal)
        saveFactoryProgress(uid, result.personal)
      }
      setFactoryTickMs(Date.now())
      if (!result.ok) {
        showGameAlert({ message: result.message, tone: 'warn' })
        return
      }
      setWallet(prev => ({ ...prev, gold: result.gold, diamond: result.diamond }))
      setUserProfile(prev => {
        if (!prev) return prev
        const next = { ...prev, gold: result.gold, diamond: result.diamond }
        userProfileRef.current = next
        return next
      })
      if (result.kind === 'gold') {
        showGameAlert({
          message: `${result.amount.toLocaleString()} زێڕ لە کارگە کۆکرایەوە`,
          tone: 'success',
          icon: GOLD_PACK_6_ICON,
        })
        logActivity('other', `کۆکردنەوەی ${result.amount.toLocaleString()} زێڕ لە ${factoryLabel(factory)}`, '🪙')
      } else {
        showGameAlert({
          message: `${result.amount.toLocaleString()} ئەڵماس لە کارگە کۆکرایەوە`,
          tone: 'success',
          icon: GEM_PACK_6_ICON,
        })
        logActivity('other', `کۆکردنەوەی ${result.amount.toLocaleString()} ئەڵماس لە ${factoryLabel(factory)}`, '💠')
      }
    } catch (err) {
      console.error('handleCollectFactory failed:', err)
      showGameAlert({ message: 'کۆکردنەوە سەرکەوتوو نەبوو — دووبارە هەوڵبدەوە', tone: 'warn' })
    } finally {
      setFactoryCollectBusy(false)
    }
  }, [selectedFactoryId, factoryCollectBusy, showGameAlert, logActivity])

  // کارگە نیشتمانییەکان — دوای یەکەم paint (نەبێتە هۆی شاشەی سپی)
  useEffect(() => {
    if (authLoading || !mapReady) return
    let cancelled = false
    let applyFactoryZoom: (() => void) | null = null
    let map: L.Map | null = null

    const mountFactories = () => {
      if (cancelled) return
      try {
        map = mapRef.current
        if (!map) return

        const buildHtml = (f: NationalFactory) => {
          const kindClass = f.kind === 'gold' ? 'is-gold' : 'is-diamond'
          const iconSrc = f.kind === 'gold' ? GOLD_PACK_6_ICON : GEM_PACK_6_ICON
          const short = f.kind === 'gold' ? 'زێڕ' : 'ئەڵماس'
          return `<div class="kd-factory-root kd-clickable-factory ${kindClass}" data-factory-id="${escapeAttr(f.id)}" role="button" aria-label="${escapeAttr(factoryLabel(f))}" style="--kd-fscale:1">
        <img class="kd-factory-icon" src="${escapeAttr(iconSrc)}" alt="" draggable="false" />
        <div class="kd-factory-label">${escapeHtml(short)}</div>
      </div>`
        }

        for (const f of NATIONAL_FACTORIES) {
          if (cancelled) return
          if (factoryMarkersRef.current.has(f.id)) continue
          const icon = L.divIcon({
            className: 'factory-marker-clean',
            html: buildHtml(f),
            iconSize: [56, 68],
            iconAnchor: [28, 64],
          })
          const marker = L.marker([f.lat, f.lng], {
            icon,
            interactive: true,
            keyboard: false,
            bubblingMouseEvents: false,
            zIndexOffset: 700,
          })
          marker.addTo(map)
          factoryMarkersRef.current.set(f.id, marker)
        }

        applyFactoryZoom = () => {
          try {
            if (!map) return
            const z = map.getZoom()
            mapZoomRef.current = z
            const scale = factoryVisualScaleForZoom(z)
            const lite = z < 11.5
            factoryMarkersRef.current.forEach((marker) => {
              const el = marker.getElement()
              const root = el?.querySelector('.kd-factory-root') as HTMLElement | null
              if (!root) return
              root.style.visibility = 'visible'
              root.style.pointerEvents = 'auto'
              root.style.setProperty('--kd-fscale', String(Number(scale.toFixed(3))))
              root.classList.toggle('is-lite', lite)
            })
          } catch (err) {
            console.error('Factory zoom sync failed:', err)
          }
        }

        applyFactoryZoom()
        map.on('zoomend', applyFactoryZoom)
      } catch (err) {
        console.error('Factory markers init failed:', err)
      }
    }

    const t = window.setTimeout(mountFactories, 0)

    return () => {
      cancelled = true
      window.clearTimeout(t)
      try {
        if (map && applyFactoryZoom) map.off('zoomend', applyFactoryZoom)
      } catch { /* ignore */ }
      factoryMarkersRef.current.forEach(m => {
        try { map?.removeLayer(m) } catch { /* ignore */ }
      })
      factoryMarkersRef.current.clear()
    }
  }, [authLoading, mapReady])
  // نوێکردنەوەی pending کاتێک پانێڵ کراوەیە
  useEffect(() => {
    if (!selectedFactoryId) return
    const t = window.setInterval(() => setFactoryTickMs(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [selectedFactoryId])

  // کۆگای هاوبەش — ڕاستەوخۆ لە Firestore
  useEffect(() => {
    if (!selectedFactoryId) {
      setFactoryStock(null)
      return
    }
    const unsub = subscribeFactoryStock(selectedFactoryId, (stock) => {
      setFactoryStock(stock)
      setFactoryTickMs(Date.now())
    })
    return () => unsub()
  }, [selectedFactoryId])

  // hydrate factory personal quota on login
  useEffect(() => {
    if (!authUserId) {
      setFactoryProgress(emptyFactoryProgress())
      return
    }
    setFactoryProgress(loadFactoryProgress(authUserId))
  }, [authUserId])

  useEffect(() => {
    ;(window as any).__openPlayer = (uid: string) => { handlePlayerClickRef.current(uid) }
    ;(window as any).__openSelf = () => { handleSelfClickRef.current() }
    ;(window as any).__openChest = (airdropId: string) => { openDropModalRef.current(airdropId) }
    ;(window as any).__spectateDuel = (duelId: string) => {
      if (!duelId) return
      // ئەگەر خۆت لە شەڕدایت — وەک شەڕکەر بکەرەوە، نەک سێپێکتەیت
      if (selfMapFxRef.current.activeDuelId === duelId || arenaSessionRef.current?.duelId === duelId) {
        setArenaSession({ duelId, mode: 'fighter' })
        return
      }
      setArenaSession({ duelId, mode: 'spectator' })
      setActiveSheet(null)
    }
    ;(window as any).__openMapShop = (_shopKey?: string) => {
      openCitadelShop()
    }
    ;(window as any).__openFactory = (factoryId: string) => { openFactoryRef.current(factoryId) }
    return () => {
      try { delete (window as any).__openPlayer } catch {}
      try { delete (window as any).__openSelf } catch {}
      try { delete (window as any).__openChest } catch {}
      try { delete (window as any).__spectateDuel } catch {}
      try { delete (window as any).__openMapShop } catch {}
      try { delete (window as any).__openFactory } catch {}
    }
  }, [beginOpen, openCitadelShop])

  const togglePlaneFollow = useCallback(() => {

    setFollowPlane(prev => {

      const next = !prev

      if (next) setFollowMe(false)

      return next

    })

  }, [])

  const centerGPS = useCallback(() => {

    // کلیکی یەکەم: ناوەند دەکاتەوە لەسەر شوێنی خۆت. کلیکی دووەم: بەستنی نەخشە بە شوێنەکەتەوە (Follow me) چالاک/ناچالاک دەکات

    setFollowPlane(false)

    setFollowMe(prev => !prev)

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(pos => {

      applyGpsPosition(pos.coords.latitude, pos.coords.longitude, true, true)

      try { mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { animate: true, duration: 0.5 }) } catch {}

    }, () => {

      try { mapRef.current?.flyTo([userLatRef.current, userLngRef.current], 15, { animate: true, duration: 0.5 }) } catch {}

      showGameAlert({ message: 'ناتوانرێت شوێنەکەت بدۆزرێتەوە!' })

    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })

  }, [applyGpsPosition, showGameAlert])

  const handleRadarClick = useCallback(() => {

    // نزیکترین درۆپی گەیشتوو بە زەوی — تەنها لە ≤٥٠م AR دەکرێتەوە
    let min = Infinity
    let nearestId: string | null = null

    activeDropsRef.current.forEach(({ data }, id) => {
      const landed = Date.now() - data.createdAtMs >= AIRDROP_FALL_MS
      if (!landed) return
      const d = calcDistance(userLatRef.current, userLngRef.current, data.lat, data.lng)
      if (d < min) {
        min = d
        nearestId = id
      }
    })

    setClickCount(prev => {
      const next = prev + 1
      setRadarColor(next > 7 ? 'rgba(255,42,95,0.85)' : 'rgba(0,240,255,0.4)')
      return next
    })

    if (clickResetRef.current) clearTimeout(clickResetRef.current)
    clickResetRef.current = setTimeout(() => {
      setClickCount(0); setRadarColor('rgba(0,240,255,0.4)')
      clickResetRef.current = null
    }, 1500)

    if (!nearestId) {
      showGameAlert({ message: 'هیچ درۆپی گەیشتووە بە زەوی لەسەر نەخشەکە نییە!' })
      return
    }

    tryOpenDropAr(nearestId, { fromRadar: true })

  }, [showGameAlert, tryOpenDropAr])

  const handleRadarDown = useCallback(() => {
    if (radarHoldRef.current) clearTimeout(radarHoldRef.current)
    radarHoldRef.current = null
  }, [])

  const handleRadarUp = useCallback(() => {
    if (radarHoldRef.current) {
      clearTimeout(radarHoldRef.current)
      radarHoldRef.current = null
    }
    handleRadarClick()
  }, [handleRadarClick])

  // Global timer / listener cleanup on unmount (coalesce + leak guard)

  useEffect(() => {

    return () => {

      if (clickResetRef.current) clearTimeout(clickResetRef.current)

      if (playerSheetCloseTimerRef.current) clearTimeout(playerSheetCloseTimerRef.current)

      if (radarHoldRef.current) clearTimeout(radarHoldRef.current)

      if (mapPlayersTickTimerRef.current) clearTimeout(mapPlayersTickTimerRef.current)

      airdropTimersRef.current.forEach(t => clearInterval(t))

      airdropTimersRef.current.clear()

      airdropFallTimersRef.current.forEach(t => clearTimeout(t))

      airdropFallTimersRef.current.clear()

      if (hackIntervalRef.current) {

        clearInterval(hackIntervalRef.current)

        hackIntervalRef.current = null

      }

      if (heistUnsubRef.current) {
        try { heistUnsubRef.current() } catch { /* ignore */ }
        heistUnsubRef.current = null
      }

      if (layoutAvatarsThrottleTimerRef.current != null) {

        window.clearTimeout(layoutAvatarsThrottleTimerRef.current)

        layoutAvatarsThrottleTimerRef.current = null

      }

      if (layoutAvatarsRafRef.current != null) {

        cancelAnimationFrame(layoutAvatarsRafRef.current)

        layoutAvatarsRafRef.current = null

      }

    }

  }, [])

  const __kdView = {
    PLANE_AUDIO_MAX_DIST_M,
    RADAR_ALERT_RADIUS_M,
    activeBalance,
    activeCosmetics,
    activeDmPartner,
    activeDropsRef,
    activeHack,
    activeHackRef,
    activeSheet,
    activityArchive,
    addXP,
    airdropFallTimersRef,
    airdropTimersRef,
    airdropsDataRef,
    allowDmWithoutFriendship,
    announceDropLanded,
    announcePlaneCityArrival,
    announcePlaneCityArrivalRef,
    announcedDropLandIdsRef,
    appendMapChatFeed,
    applyAvatarDonateOverlay,
    applyAvatarDonateOverlayRef,
    applyGpsPosition,
    applyMapAvatarFocus,
    applyMapChatMessages,
    applyVipSenderBoost,
    arDropBurst,
    arDropClaiming,
    arDropSession,
    arenaSession,
    arenaSessionRef,
    authLoading,
    authUserId,
    avatarInputRef,
    avatarStudioCam,
    avatarStudioDraft,
    avatarStudioSaving,
    baseTileLayerRef,
    beginOpen,
    bindPlayerSheetTap,
    blockIncomingGifts,
    blockIncomingGiftsRef,
    blockReasonTarget,
    blockReasonText,
    blockedUidsRef,
    blockedUsersList,
    boughtItems,
    boughtItemsRef,
    buildOnlinePlayerMarkerHtml,
    buildPlaneIcon,
    buildPlayerFxOverlayHtml,
    buildSelfPlayerMarkerHtml,
    bumpMapPlayersTick,
    buyMarketItem,
    buyVipPass,
    canClaimDailyBonus,
    centerGPS,
    challengeBusy,
    chestDist,
    chestSoundEnabled,
    chestSoundEnabledRef,
    chestVolume,
    chestVolumeRef,
    citadelTab,
    claimArDrop,
    claimRpMission,
    clearAirdropTimer,
    clearDuelMapFx,
    clearLevelUpTimers,
    closeArDropSession,
    closeNationalFactory,
    clickCount,
    clickResetRef,
    closeDropdownAnimated,
    closeMapChatAnimated,
    closePlayerSheet,
    closePlayerSheetRef,
    closeSpinWheelAnimated,
    confirmBlockWithReason,
    copyPlayerId,
    dismissAllOverlaysRef,
    idCopiedFlash,
    cosmeticAccessory,
    cosmeticBorder,
    cosmeticHeadwear,
    cosmeticPage,
    cosmeticSkin,
    cosmeticTitle,
    currentLevel,
    dailyBonusCooldownLeftMs,
    dailyBonusDay,
    dailyBonusLastClaimMs,
    dailyBonusViewDay,
    dailySpinSpinsToday,
    factoryProgress,
    factoryStock,
    factoryCollectBusy,
    factoryTickMs,
    handleCollectFactory,
    dailyTabStripRef,
    deleteAccountBusy,
    deleteAccountError,
    deleteAccountPassword,
    changePwBusy,
    changePwError,
    changePwNew,
    changePwNew2,
    changePwOld,
    changePwStep,
    profileFieldBusy,
    showChangePasswordPanel,
    dismissSpinResult,
    distanceAccumRef,
    dmAudioChunksRef,
    dmChatEndRef,
    dmChatScrollRef,
    dmDeleteConfirm,
    dmDeliveredMarkRef,
    dmImageInputRef,
    dmInput,
    dmLightboxUrl,
    dmLongPressFiredRef,
    dmLongPressTimerRef,
    dmMediaRecorderRef,
    dmMessages,
    dmRecording,
    dmVoiceLocked,
    dmVoiceCancelArmed,
    dmVoiceSeconds,
    dmVoiceHint,
    dmVoiceLevels,
    handleDmVoicePointerDown,
    handleDmVoicePointerMove,
    handleDmVoicePointerUp,
    handleDmVoicePointerCancel,
    handleDmVoiceLock,
    handleDmVoiceTrash,
    handleDmVoiceSendLocked,
    dmSelectedIds,
    dmSendingMedia,
    dmMediaProgress,
    dmShowEmoji,
    dmThreadMenu,
    dmThreads,
    dmTotalUnread: dmUnreadVisible,
    donateFxRef,
    donatePickerCloseTimerRef,
    donatePickerClosing,
    donatePickerUid,
    dropLandToast,
    dropLandToastTimerRef,
    dropTypeCooldownsRef,
    enqueueMapOverlay,
    fightBanUntilMs,
    fightChallengeLog,
    findError,
    findIdInput,
    findLoading,
    findResult,
    finishHackSteal,
    fireTrailLayersRef,
    flushMapOverlayBatch,
    focusNearbyPlayer,
    followMe,
    followMeRef,
    followPlane,
    followPlaneRef,
    formatDropClock,
    friendRequestNotifsEnabled,
    friendsList,
    friendsTab,
    gameAlert,
    gamePromptValue,
    gamePromptValueRef,
    geoWatchIdRef,
    getMapMarkerByUid,
    ghostMode,
    ghostModeRef,
    giftSoundEnabled,
    giftSoundEnabledRef,
    giftVolume,
    giftVolumeRef,
    giftsLogList,
    hackIntervalRef,
    hackSecondsLeft,
    handleAcceptFriendRequest,
    handleArenaSettled,
    handleBlockFriend,
    handleBlockPlayer,
    handleBuyGemPack,
    handleBuyGoldPack,
    handleClaimDailyBonus,
    handleClaimMasterDaily,
    handleClaimSocialFinal,
    handleChestVolume,
    handleConfirmHideDmMessages,
    handleDeclineFriendRequest,
    handleDeleteAccount,
    handleFightWithPlayer,
    handleFindPlayerById,
    handleGiftVolume,
    handleLogout,
    handleEditUsernameOnce,
    handleEditEmailOnce,
    handleEditPhoneOnce,
    handleChangePasswordSubmit,
    openChangePasswordPanel,
    handleMarkAllNotifsRead,
    handleMusicVolume,
    handleNotificationClick,
    handlePlaneVolume,
    handlePlayerClick,
    handlePlayerClickRef,
    handleRadarClick,
    handleRadarDown,
    handleRadarUp,
    handleResetAppData,
    handleRespondFightChallenge,
    handleRevengeSteal,
    handleSelfClick,
    handleSelfClickRef,
    handleSendDmImage,
    handleSendDmVideo,
    handleSendDmMessage,
    handleSendDonateItem,
    handleSendFriendRequestToPlayer,
    handleSendGiftToPlayer,
    handleSendMapChat,
    handleSendMessageToPlayer,
    handleSettleMaster,
    handleSfxVolume,
    handleSocialSubmit,
    handleSpinWheel,
    handleStealMoneyFromPlayer,
    handleToggleAllowDmWithoutFriendship,
    handleToggleBlockIncomingGifts,
    handleToggleChestSound,
    handleToggleDmVoice,
    handleToggleFriendRequestNotifs,
    handleToggleGhostMode,
    handleToggleGiftSound,
    handleToggleHideBlockedUsers,
    handleToggleHideGlobalChat,
    handleToggleHideWhenOffline,
    handleToggleHighGraphics,
    handleToggleMusic,
    handleToggleNotifications,
    handleTogglePlaneSound,
    handleToggleRadarAlerts,
    handleToggleShowMyAvatarOnMap,
    handleToggleShowOtherPlayers,
    handleToggleShowPlayerNames,
    handleToggleSound,
    handleUnblockPlayer,
    handleUnfriend,
    hasViewedInv,
    headerEl,
    headerRef,
    hideBlockedUsers,
    hideGlobalChat,
    hideWhenOffline,
    highGraphics,
    inboxNotifications,
    incomingChallenge,
    incomingFriendRequests,
    inventoryCapacity,
    isDailyBonusOnCooldown,
    isDropdownSheetOpen,
    isAnyExclusiveBoxOpen,
    isFreeSpinNext,
    isGiftingOpen,
    lastFireTrailAtRef,
    lastLocationSyncRef,
    layoutAvatarsLastRunRef,
    layoutAvatarsRafRef,
    layoutAvatarsThrottleTimerRef,
    layoutMapAvatars,
    lbGifters,
    lbLevel,
    lbWealth,
    leaderboard,
    levelBadgeAnim,
    levelUpBurst,
    levelUpTimersRef,
    logActivity,
    loginLoggedRef,
    mapAvatarOverlaysRef,
    mapChatBubblesRef,
    mapChatCloseTimerRef,
    mapChatDraft,
    mapChatFeed,
    mapChatFeedEndRef,
    mapChatFeedIdsRef,
    mapChatFeedListRef,
    mapChatKbInset,
    mapChatSending,
    mapChatSheetClosing,
    mapChatSheetIn,
    mapChatShowEmoji,
    mapDonationNotifs,
    mapGestureRef,
    mapMarkerTapLockRef,
    mapPlayersTick,
    mapPlayersTickTimerRef,
    mapReady,
    mapRef,
    mapSheetDismissLockRef,
    mapTheme,
    mapThemeToast,
    mapThemeToastTimerRef,
    mapZoomRef,
    markNotifRead,
    musicEnabled,
    musicVolume,
    mutedChatUids,
    mutedChatUidsRef,
    nearbyPlayers,
    nextSpinCost,
    notificationsEnabled,
    notificationsEnabledRef,
    notificationsFeed,
    npcLiveRef,
    onlinePlayersRef,
    openChest,
    openCitadelShop,
    openDropModal,
    openDropModalRef,
    openGateRef,
    openPrivateSheet,
    openSpinWheel,
    otherPlayerIconSigRef,
    otherPlayerMarkersRef,
    otherPlayerMotionRef,
    otherPlayerTruePosRef,
    outgoingChallenge,
    outgoingChallengeRef,
    outgoingFriendUids,
    overlayBatchRef,
    pageVisibleRef,
    passNowMs,
    passView,
    pendingDonateArrivalRef,
    persistInventoryAndWallet,
    persistSeason,
    persistVipPasses,
    planeCamThrottleRef,
    planeCityAnnouncedRef,
    planeCityCheckAtRef,
    planeCityToast,
    planeCityToastTimerRef,
    planeDrawThrottleRef,
    planeGenesisRef,
    planeMarkerRef,
    planeNodesRef,
    planeRafIdRef,
    planeSoundEnabled,
    planeSoundEnabledRef,
    planeVolume,
    planeVolumeRef,
    playerAvatar,
    playerAvatar3d,
    playerIdDisplay,
    playerLevelNum,
    playerMarkersGroupRef,
    playerName,
    playerFullName,
    playerPanelDragRef,
    playerPanelRef,
    playerSheetAnimIn,
    playerSheetCloseTimerRef,
    playerSheetTapLockRef,
    playerSpendRef,
    playerStats,
    playerXpNeed,
    playerXpNum,
    playerXpPct,
    privateBadgeCount: privateBadgeVisible,
    privateTab,
    processedDonationIdsRef,
    profileHydratedRef,
    pushLocalInboxRef,
    pushLocationToFirestore,
    radarAlertedIdsRef,
    radarAlertsEnabled,
    radarColor,
    radarHoldRef,
    readNotifIds,
    reapplyVipSenderBoostVisuals,
    reapplyVipSenderBoostVisualsRef,
    refreshOtherPlayerIconsForZoom,
    registerRecipientGiftArrival,
    removeAirdropMarker,
    renderAirdropMarker,
    revealedMapChatIdsRef,
    rewardToastTimerRef,
    rightIconsTop,
    royalLbTab,
    runPlayerAction,
    saveAvatarStudio,
    scheduleLayoutMapAvatars,
    seasonPass,
    seasonPassRef,
    selectedAirdropId,
    selectedAirdropReward,
    selectedChest,
    selectedFactoryId,
    selectedPlayer,
    selectedPlayerUidRef,
    selfIconSigRef,
    selfMapFx,
    selfMapFxRef,
    selfMovedAtRef,
    selfMovingRef,
    sessionMinutes,
    sessionStartRef,
    setActiveBalance,
    setActiveDmPartner,
    setActiveHack,
    setActiveSheet,
    setActivityArchive,
    setAllowDmWithoutFriendship,
    setArenaSession,
    setAuthLoading,
    setAuthUserId,
    setAvatarStudioCam,
    setAvatarStudioDraft,
    setAvatarStudioSaving,
    setBlockIncomingGifts,
    setBlockReasonTarget,
    setBlockReasonText,
    setBlockedUsersList,
    setBoughtItems,
    setChallengeBusy,
    setChestDist,
    setChestSoundEnabled,
    setChestVolume,
    setCitadelTab,
    setClickCount,
    setCosmeticPage,
    setDailyBonusDay,
    setDailyBonusLastClaimMs,
    setDailyBonusViewDay,
    setDailySpinSpinsToday,
    setDeleteAccountBusy,
    setDeleteAccountError,
    setDeleteAccountPassword,
    setDmDeleteConfirm,
    setDmInput,
    setDmLightboxUrl,
    setDmMessages,
    setDmRecording,
    setDmSelectedIds,
    setDmSendingMedia,
    setDmShowEmoji,
    setDmThreadMenu,
    setDmThreads,
    setDonatePickerClosing,
    setDonatePickerUid,
    setDropLandToast,
    setFightBanUntilMs,
    setFightChallengeLog,
    setFindError,
    setFindIdInput,
    setFindLoading,
    setFindResult,
    setFollowMe,
    setFollowPlane,
    setFriendsList,
    setFriendsTab,
    setGameAlert,
    setGamePromptValue,
    setGhostMode,
    setGiftSoundEnabled,
    setGiftVolume,
    setGiftsLogList,
    setHackSecondsLeft,
    setHasViewedInv,
    setHeaderEl,
    setHeaderNode,
    setHideBlockedUsers,
    setHideGlobalChat,
    setHideWhenOffline,
    setHighGraphics,
    setInboxNotifications,
    setIncomingChallenge,
    setIncomingFriendRequests,
    setLbGifters,
    setLbLevel,
    setLbWealth,
    setLeaderboard,
    setLevelBadgeAnim,
    setLevelUpBurst,
    setMapChatDraft,
    setMapChatFeed,
    setMapChatKbInset,
    setMapChatSending,
    setMapChatSheetClosing,
    setMapChatSheetIn,
    setMapChatShowEmoji,
    setMapDonationNotifs,
    setMapPlayersTick,
    setMapReady,
    setMapTheme,
    setMapThemeToast,
    setMusicEnabled,
    setMusicVolume,
    setMutedChatUids,
    setNotificationsEnabled,
    setOutgoingChallenge,
    setOutgoingFriendUids,
    setPassNowMs,
    setPassView,
    setPlaneCityToast,
    setPlaneSoundEnabled,
    setPlaneVolume,
    setPlayerSheetAnimIn,
    setPrivateTab,
    setRadarColor,
    setReadNotifIds,
    setRightIconsTop,
    setRoyalLbTab,
    setSeasonPass,
    setSelectedAirdropId,
    setSelectedAirdropReward,
    setSelectedChest,
    setSelectedPlayer,
    setSelfMapFx,
    setSessionMinutes,
    setSfxVolume,
    setShopGender,
    setShowAvatarStudio,
    setShowDeleteAccountPanel,
    setShowChangePasswordPanel,
    setChangePwOld,
    setChangePwNew,
    setChangePwNew2,
    setChangePwStep,
    setChangePwError,
    setShowLevelRulesModal,
    setShowMapChatModal,
    setShowMyAvatarOnMap,
    setShowOtherPlayers,
    setShowPlayerNames,
    setShowSpinWheel,
    setSocialLinkInput,
    setSoundEnabled,
    setSpinAnimating,
    setSpinResult,
    setSpinRotation,
    setSpinSheetClosing,
    setSpinSheetIn,
    setStealWarningTarget,
    setUserProfile,
    setVipPasses,
    setVipSpectacle,
    setWallet,
    setWalletAndSync,
    setXpRingFillBoost,
    settingsHydratedRef,
    settleDonateArrival,
    settleDonateArrivalRef,
    sfxVolume,
    sheetOpenKeys,
    shopGender,
    showAvatarStudio,
    showFriendsPanel,
    showGameAlert,
    showGameConfirm,
    showGiftsPanel,
    showLevelRulesModal,
    showMapChatModal,
    showMessagesPanel,
    showMyAvatarOnMap,
    showMyAvatarOnMapRef,
    showOtherPlayers,
    showOtherPlayersRef,
    showPassAlert,
    showPlayerNames,
    showPlayerNamesRef,
    showRewardToast,
    showSpinWheel,
    socialLinkInput,
    softCloseDonatePicker,
    soundEnabled,
    soundEnabledRef,
    spawnDonateFxFromEvent,
    spawnDonateFxRef,
    spinAnimating,
    spinCloseTimerRef,
    spinResult,
    spinRotation,
    spinRotationRef,
    spinSheetClosing,
    spinSheetIn,
    startAirdropTimer,
    startPlaneSound,
    startStealHack,
    stealWarningTarget,
    stealCooldownUntilMs,
    incomingHeistAlert,
    setIncomingHeistAlert,
    handleGyroHeistSuccess,
    handleGyroHeistCancel,
    handleGyroHeistExpired,
    handleRejectIncomingHeist,
    handleAcceptIncomingHeist,
    stopPlaneSound,
    syncAllVisibleMarkerOverlays,
    syncMarkerOverlaysForUid,
    syncNpcMarkersRef,
    syncNpcMarkersToMap,
    toggleBalance,
    toggleDmMessageSelect,
    toggleMapTheme,
    togglePlaneFollow,
    toggleSheet,
    triggerFlareRef,
    triggerHeaderLevelUp,
    triggerPersonalFlare,
    tryOpenDropAr,
    unreadNotifCount,
    updateDistTracker,
    updatePlaneSound,
    updatePlayerAvatar,
    updateUserMarkerIcon,
    userIdRef,
    userLatRef,
    userLngRef,
    userMarkerRef,
    userProfile,
    userProfileRef,
    vipPasses,
    vipPassesRef,
    vipSenderBoostUntilRef,
    vipSpectacle,
    wallet,
    walletRef,
    xpRingFillBoost
  }
  return <AppView {...__kdView} />
}
