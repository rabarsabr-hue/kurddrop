// @ts-nocheck — props bag لە App.tsx (Record)؛ جۆری توند لێرە کاری UI دەشکێنێت
/** Presentational JSX extracted from App.tsx */
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
  MOTION_ITEMS,
  canAffordMotion,
  formatMotionCostLabel,
  type MotionId,
} from './data/motions'

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
import gameLogo from './imports/logo.png'
import GyroscopeHeistGame from './components/GyroscopeHeistGame'
import { CurrencyStore } from './components/CurrencyStore'
import { HeadShotAvatar, Realistic3DAvatarDisc } from './components/Realistic3DAvatar'
import { AvatarStudioPanel } from './components/AvatarStudioPanel'
import TpsArenaDuel from './components/TpsArenaDuel'
import { ArDropCamera } from './components/ArDropCamera'
import { STEAL_SHIELD_MS } from './services/userService'

import {
  ACTIVE_FLIGHT_MS,
  CITY_LEG_MS,
  CYCLE_MS,
  DROP_TYPES,
  FLIGHT_CITIES,
  USA_APPROACH_MS,
  getCycleIndex,
  getDropTypeForCycle,
} from './services/airdropService'
import {
  AVATAR_3D_EYE_COLORS,
  AVATAR_3D_HAIR_STYLES,
  AVATAR_3D_OUTFIT_COLORS,
  HAIR_PALETTE,
  SKIN_PALETTE,
  normalizeAvatar3d,
} from './fullBody3dAvatar'
import {
  CITADEL_SHOP_TABS,
  COSMETIC_BY_ID,
  cosmeticSlotLabel,
  toggleCosmeticInInventory,
} from './cosmetics'
import {
  DAILY_BONUS_REWARDS,
  DAILY_BONUS_TOTAL_DAYS,
  hideDmThreadForUser,
  setChatMuted,
  setDmThreadPinned,
} from './services/userService'
import {
  NATIONAL_FACTORY_BY_ID,
  factoryLabel,
  FACTORY_GOLD_DAILY_CAP,
  FACTORY_DIAMOND_DAILY_CAP,
} from './data/nationalFactories'
import {
  pendingAmountForFactory,
  producedAmountFromStock,
  collectsRemainingToday,
  msUntilNextFactoryUnit,
  formatFactoryCountdown,
  factoryCycleProgress,
} from './services/factoryService'
import { MAP_CHAT_MAX_LEN } from './services/chatService'
import {
  ACTIVE_PASS_KINDS,
  MASTER_FAIL_REFUND_DIAMONDS,
  MASTER_FINAL_DIAMOND,
  MASTER_PERFECT_DAYS_REQUIRED,
  PASS_DEFS,
  PASS_DURATION_DAYS,
  SOCIAL_FINAL_DIAMOND,
  canClaimMasterDaily,
  formatCountdownKu,
  formatKurdistanNextDate,
  getKurdistanSeasonInfo,
  masterMissionsForUi,
  msUntilSocialSubmit,
  passDayNumber,
  type PassKind,
} from './services/passService'
import {
  RP_MISSIONS,
  bumpMission,
  normalizeMissions,
  saveSeasonPass,
} from './seasonPass'
import {
  HUNTER_RANKS,
  hunterRankForLevel,
  resolveHunterLevel,
} from './hunterLevel'
import { XP_REWARDS, xpForDropType } from './playerXp'
import { formatActivityAt, loadActivityArchive } from './activityArchive'
import { formatNotifTime } from './services/notificationService'
import { isBotPlayerUid } from './services/locationService'
import maleAvatar from './imports/male.png'

import femaleAvatar from './imports/female.png'

import { GOLD_HEADER_ICON, GEM_HEADER_ICON } from './currencyStore'

/** ئایکۆنی یەکگرتووی زێڕ — هەمان وێنەی هێدەر لە هەموو یارییەکەدا */

import {
  GoldIcon,
  DiamondIcon,
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
  spinSliceUsesCurrencyImage,
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
  notifMapItemGiftCopy,
  enrichInboxNotificationCopy,
  escapeAttr,
  escapeHtml,
  isMapChatEliteHunter,
  mapChatBubbleSig,
  buildMapChatBubbleHtml,
  formatPlayTime,
  formatAccountCreatedAt,
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
  ProfileSectionHeader,
  SoundToggleVolumeRow,
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
  AppCrashBoundary,
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


export default function AppView(s: Record<string, any>) {
  const [showProfileAccountDetails, setShowProfileAccountDetails] = useState(false)
  const {
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
    chestVolume,
    citadelTab,
    claimArDrop,
    claimRpMission,
    clearAirdropTimer,
    clearDuelMapFx,
    clearLevelUpTimers,
    clickCount,
    clickResetRef,
    closeArDropSession,
    closeNationalFactory,
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
    dmTotalUnread,
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
    friendsList,
    friendsTab,
    friendRequestNotifsEnabled,
    gameAlert,
    gamePromptValue,
    gamePromptValueRef,
    geoWatchIdRef,
    getMapMarkerByUid,
    ghostMode,
    giftSoundEnabled,
    giftVolume,
    giftsLogList,
    hackIntervalRef,
    hackSecondsLeft,
    handleAcceptFriendRequest,
    handleArenaSettled,
    handleBlockFriend,
    handleBlockPlayer,
    handleBuyGemPack,
    handleBuyGoldPack,
    handleChestVolume,
    handleClaimDailyBonus,
    handleClaimMasterDaily,
    handleClaimSocialFinal,
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
    handleToggleMusic,
    handleToggleNotifications,
    handleTogglePlaneSound,
    handleToggleRadarAlerts,
    handleToggleShowMyAvatarOnMap,
    handleToggleShowOtherPlayers,
    handleToggleSound,
    handleUnblockPlayer,
    handleUnfriend,
    hasViewedInv,
    headerEl,
    headerRef,
    hideBlockedUsers,
    hideGlobalChat,
    hideWhenOffline,
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
    planeVolume,
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
    privateBadgeCount,
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
    setAvatarStudioGender,
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
    showDeleteAccountPanel,
    showChangePasswordPanel,
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
  } = s

  useEffect(() => {
    if (activeSheet !== 'profile') setShowProfileAccountDetails(false)
  }, [activeSheet])

  return (

    <>
      {authLoading && (

        <div style={{ position: 'fixed', inset: 0, background: '#040812', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 9999, fontFamily: 'var(--kd-font)', direction: 'rtl' }}>

          <img
            src={gameLogo}
            alt="Kurd Drop"
            draggable={false}
            style={{
              width: 'min(56vw, 200px)',
              height: 'auto',
              marginBottom: 14,
              filter: 'drop-shadow(0 8px 24px rgba(0,240,255,0.25))',
              mixBlendMode: 'lighten',
              animation: 'avatarPop 0.6s ease',
            }}
          />

          <div style={{ color: '#00f0ff', fontSize: 14, fontWeight: 900 }}>بارکردن...</div>

        </div>

      )}

      {!authLoading && !authUserId && <AuthModal />}

      {authUserId && (

      <AppCrashBoundary onReset={handleResetAppData}>
      <div className="kd-app-shell" style={{ opacity: 1, width: '100%', height: '100%', minHeight: '100dvh' }}>

        {/* نەخشە — edge-to-edge لە ژێر UI؛ قەبارە لە CSS (#leaflet-map) قوفڵ کراوە */}

        <div id="leaflet-map" className={`kd-map-theme-${mapTheme}`} />

        {/* ئەنیمەیشنی پیرۆزبایی — ئێستا لە reward toast ـی خوارەوە */}

        {planeCityToast && (

          <div
            className={`kd-location-banner${dropLandToast ? ' kd-location-banner--with-drop' : ''}`}
            role="status"
            aria-live="polite"
          >
            <div className="kd-location-banner__card">
              <span className="kd-location-banner__icon" aria-hidden="true">✈️</span>
              <p className="kd-location-banner__text">{planeCityToast.message}</p>
              <span className="kd-location-banner__pulse" aria-hidden="true" />
            </div>
          </div>

        )}

        {dropLandToast && (

          <div
            className={`kd-drop-land-toast${planeCityToast ? ' kd-drop-land-toast--stacked' : ''}`}
            role="status"
            aria-live="polite"
            style={{ ['--drop-accent' as string]: dropLandToast.accent }}
          >
            <div className="kd-drop-land-toast__card">
              <div className="kd-drop-land-toast__dot" />
              <div className="kd-drop-land-toast__text">{dropLandToast.message}</div>
            </div>
          </div>

        )}

        {/* Level-up — تەنها لەسەر ئاڤاتاری هێدەر (بێ مۆدالی سەر شاشە) */}

        {/* مۆدالی ڕوونکردنەوەی پلەکان */}

        {showLevelRulesModal && createPortal(
          <div

            className="kd-game-alert-backdrop kd-level-rules-portal"

            onClick={e => { if (e.target === e.currentTarget) setShowLevelRulesModal(false) }}

            style={{

              background: 'rgba(2, 6, 18, 0.78)',

              backdropFilter: 'blur(12px)',

              WebkitBackdropFilter: 'blur(12px)',

              display: 'flex', alignItems: 'center', justifyContent: 'center',

              padding: '18px 14px', direction: 'rtl',

            }}

          >

            <div

              className="kd-game-alert-card glass-surface"

              onClick={e => e.stopPropagation()}

              style={{

                width: '100%', maxWidth: 360, maxHeight: '82%',

                overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any,

                borderRadius: 22,

                border: '1px solid rgba(56,189,248,0.35)',

                background: 'linear-gradient(160deg, rgba(8,18,36,0.96), rgba(4,10,22,0.98))',

                boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 28px rgba(56,189,248,0.12)',

                padding: '18px 16px 14px',

              }}

            >

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                  <span style={{

                    width: 34, height: 34, borderRadius: 12,

                    display: 'flex', alignItems: 'center', justifyContent: 'center',

                    background: 'linear-gradient(145deg, rgba(56,189,248,0.35), rgba(2,132,199,0.2))',

                    border: '1px solid rgba(56,189,248,0.45)', fontSize: 16,

                  }}>📜</span>

                  <div>

                    <div style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc' }}>ڕوونکردنەوەی پلەکان</div>

                    <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>چۆن پلە بەرز دەبیتەوە</div>

                  </div>

                </div>

              </div>

              <div style={{

                padding: '10px 12px', borderRadius: 14, marginBottom: 10,

                background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.22)',

                fontSize: 11, fontWeight: 800, color: '#e2e8f0', lineHeight: 1.65,

              }}>

                پلەکان تەنها بە کردنەوەی درۆپ بەرز دەبن — بێ سنووری ڕۆژانە. لە دەرەوەی شاری خۆت هەر درۆپێک بە ٢× حیساب دەکرێت. کڕینی ڕێڕەوی کوردستان → پلەی پادشا.

              </div>

              <div style={{ fontSize: 11, fontWeight: 900, color: '#67e8f9', marginBottom: 6 }}>جۆرەکانی درۆپ</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>

                {[

                  { t: 'جۆری ١', d: 'هەر ٧ درۆپ = ١ ئاست' },

                  { t: 'جۆری ٢', d: 'هەر ٥ درۆپ = ١ ئاست' },

                  { t: 'جۆری ٣', d: 'هەر ٣ درۆپ = ١ ئاست' },

                  { t: 'جۆری ٤', d: 'هەر ٢ درۆپ = ١ ئاست' },

                  { t: 'جۆری ٥', d: 'هەر ١ درۆپ = ١ ئاست' },

                ].map(row => (

                  <div

                    key={row.t}

                    style={{

                      display: 'flex', gap: 8, alignItems: 'flex-start',

                      padding: '8px 10px', borderRadius: 12,

                      background: 'rgba(255,255,255,0.04)',

                      border: '1px solid rgba(255,255,255,0.08)',

                    }}

                  >

                    <span style={{

                      flexShrink: 0, fontSize: 9, fontWeight: 900, color: '#0ea5e9',

                      background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.35)',

                      borderRadius: 8, padding: '3px 7px',

                    }}>{row.t}</span>

                    <span style={{ fontSize: 10, fontWeight: 800, color: '#cbd5e1', lineHeight: 1.5 }}>{row.d}</span>

                  </div>

                ))}

              </div>

              <div style={{ fontSize: 11, fontWeight: 900, color: '#67e8f9', marginBottom: 6 }}>١٢ پلە (بە ڕیز)</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>

                {HUNTER_RANKS.map(rank => (

                  <div

                    key={rank.name}

                    style={{

                      display: 'flex', alignItems: 'center', gap: 8,

                      padding: '7px 9px', borderRadius: 11,

                      background: 'rgba(255,255,255,0.035)',

                      border: `1px solid ${rank.glow}33`,

                    }}

                  >

                    <span style={{

                      width: 26, height: 26, borderRadius: '50%',

                      display: 'flex', alignItems: 'center', justifyContent: 'center',

                      background: `linear-gradient(145deg, ${rank.glow}55, rgba(4,8,18,0.75))`,

                      border: `1px solid ${rank.glow}66`, fontSize: 13, flexShrink: 0,

                    }}>{rank.icon}</span>

                    <span style={{ fontSize: 11, fontWeight: 900, color: '#f1f5f9' }}>{rank.name}</span>

                  </div>

                ))}

              </div>

              <button

                type="button"

                onClick={() => setShowLevelRulesModal(false)}

                className="btn-interactive"

                style={{

                  width: '100%', padding: '12px 10px', borderRadius: 14,

                  border: '1px solid rgba(56,189,248,0.45)',

                  background: 'linear-gradient(135deg, rgba(14,165,233,0.35), rgba(2,132,199,0.22))',

                  color: '#f0f9ff', fontWeight: 900, fontSize: 12,

                  fontFamily: 'var(--kd-font)',

                }}

              >

                باشە

              </button>

            </div>

          </div>

        , document.body)}

        {/* چەرخی بەخت — Daily Spin Wheel */}

        {activeSheet === 'dailyBonus' && headerEl && createPortal((() => {
          const viewReward = DAILY_BONUS_REWARDS.find(r => r.day === dailyBonusViewDay) ?? DAILY_BONUS_REWARDS[0]
          const viewIsDone = dailyBonusViewDay < dailyBonusDay
          const viewIsCurrent = dailyBonusViewDay === dailyBonusDay
          const viewIsLocked = dailyBonusViewDay > dailyBonusDay
          const canClaimViewDay = canClaimDailyBonus && viewIsCurrent
          const isMegaView = viewReward.day === DAILY_BONUS_TOTAL_DAYS
          const showCooldown = isDailyBonusOnCooldown && dailyBonusCooldownLeftMs > 0
          const progressPct = Math.min(100, Math.max(0, ((dailyBonusDay - 1) / Math.max(1, DAILY_BONUS_TOTAL_DAYS)) * 100))
          return (
            <>
              <div className="kd-header-pop-scrim" onClick={() => dismissAllOverlaysRef.current(null)} aria-hidden="true" />
              <div
                className="kd-header-dropdown kd-header-sheet kd-daily-center-card glass-surface"
                role="dialog"
                aria-modal="true"
                aria-label="دیاریی ڕۆژانە"
                onClick={e => e.stopPropagation()}
              >
                <div className="kd-daily-center-head">
                  <div className="kd-daily-center-head-text">
                    <h3 className="kd-daily-center-title">دیاریی ڕۆژانە</h3>
                    <p className="kd-daily-center-sub">ڕۆژ {dailyBonusDay} لە {DAILY_BONUS_TOTAL_DAYS}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-interactive kd-daily-center-close"
                    onClick={() => setActiveSheet(null)}
                    aria-label="داخستن"
                  >
                    <i className="material-icons" style={{ fontSize: 18 }}>close</i>
                  </button>
                </div>

                <div className="kd-daily-progress" aria-hidden="true">
                  <div className="kd-daily-progress-meta">
                    <span>پێشکەوتن</span>
                    <span>{Math.max(0, dailyBonusDay - 1)}/{DAILY_BONUS_TOTAL_DAYS}</span>
                  </div>
                  <div className="kd-daily-progress-track">
                    <div className="kd-daily-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <div className={`kd-daily-hero${isMegaView ? ' is-mega' : ''}`}>
                  <div className="kd-daily-hero-icon" aria-hidden="true">
                    {viewIsDone ? '✓' : viewIsLocked ? '🔒' : '🎁'}
                  </div>
                  <div className="kd-daily-hero-body">
                    <span className="kd-daily-hero-label">
                      {viewIsDone ? 'وەرگیراوە' : viewIsLocked ? 'قفڵکراو' : viewIsCurrent ? 'دیاریی ئەمڕۆ' : `ڕۆژ ${dailyBonusViewDay}`}
                    </span>
                    <div className="kd-daily-hero-dual">
                      <span className="kd-daily-hero-chip is-gold">
                        <GoldIcon size={16} />
                        <strong>{(viewReward.gold ?? 0).toLocaleString('en-US')}</strong>
                        <em>زێڕ</em>
                      </span>
                      <span className="kd-daily-hero-chip is-diamond">
                        <DiamondIcon size={16} />
                        <strong>{(viewReward.diamond ?? 0).toLocaleString('en-US')}</strong>
                        <em>ئەڵماس</em>
                      </span>
                    </div>
                  </div>
                </div>

                <div ref={dailyTabStripRef} className="kd-daily-hscroll" role="tablist" aria-label="ڕۆژەکان">
                  {DAILY_BONUS_REWARDS.map(reward => {
                    const day = reward.day
                    const isDone = day < dailyBonusDay
                    const isCurrent = day === dailyBonusDay
                    const isLocked = day > dailyBonusDay
                    const selected = day === dailyBonusViewDay
                    const display = getDailyCardRewardDisplay(reward)
                    return (
                      <button
                        key={day}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        data-daily-tab={day}
                        className={`kd-daily-day-card${selected ? ' selected' : ''}${isDone ? ' claimed' : ''}${isCurrent ? ' current' : ''}${isLocked ? ' locked' : ''}`}
                        onClick={() => setDailyBonusViewDay(day)}
                      >
                        <span className="kd-daily-day-num">ڕۆژ {day}</span>
                        <span className="kd-daily-day-icon" aria-hidden="true">
                          {isDone ? '✓' : isLocked ? '🔒' : display.icon === '🪙' ? (
                            <GoldIcon size={20} />
                          ) : display.icon === '💎' ? (
                            <DiamondIcon size={20} />
                          ) : display.icon}
                        </span>
                        {display.amount ? (
                          <span className="kd-daily-day-amt">{display.amount}</span>
                        ) : null}
                        <span className="kd-daily-day-unit">{display.unit}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="kd-daily-center-footer">
                  {showCooldown && (
                    <div className="kd-daily-center-countdown" aria-live="polite">
                      <span className="kd-daily-center-countdown-dot" aria-hidden="true" />
                      <span>{formatCountdownKu(dailyBonusCooldownLeftMs)}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleClaimDailyBonus}
                    disabled={!canClaimViewDay}
                    className={`btn-interactive kd-daily-center-claim${canClaimViewDay ? ' ready' : ''}`}
                  >
                    {canClaimViewDay
                      ? `وەرگرتنی دیاری · ڕۆژ ${dailyBonusDay}`
                      : viewIsLocked
                        ? 'ئەم ڕۆژە هێشتا قوفڵە'
                        : viewIsDone
                          ? 'ئەم ڕۆژە پێشتر وەرگیراوە'
                          : showCooldown
                            ? `چاوەڕێ · ${formatCountdownKu(dailyBonusCooldownLeftMs)}`
                            : 'وەرگرتنی دیاری'}
                  </button>
                </div>
              </div>
            </>
          )
        })(), headerEl)}

        {showSpinWheel && headerEl && createPortal(

          <>
            <div
              className="kd-header-pop-scrim"
              onClick={() => { if (!spinAnimating) closeSpinWheelAnimated() }}
              aria-hidden="true"
            />
            <div
              className={`kd-header-dropdown kd-header-sheet kd-spin-modal glass-surface${spinSheetIn ? ' is-in' : ''}${spinSheetClosing ? ' is-closing' : ''}`}
              role="dialog"
              aria-modal="true"
              aria-label="چەرخی بەخت"
              onClick={e => e.stopPropagation()}
            >

              <div className="kd-spin-modal-header">

                <div className="kd-spin-modal-title">

                  <span aria-hidden="true">🎰</span>

                  <span>چەرخی بەخت</span>

                </div>

                <button

                  type="button"

                  className="btn-interactive kd-spin-close-btn"

                  disabled={spinAnimating}

                  onClick={() => closeSpinWheelAnimated()}

                  aria-label="داخستن"

                >

                  <i className="material-icons" style={{ fontSize: 18 }}>close</i>

                </button>

              </div>

              <div className="kd-spin-wheel-wrap">

                {/* Outer spinning ring — SVG Pure Slices Engine */}
                <div
                  className={`kd-spin-wheel kd-spin-outer${spinAnimating ? ' is-spinning' : ''}`}
                  style={{ transform: `rotate(${spinRotation}deg)` }}
                >
                  <svg
                    className="kd-spin-wheel-svg"
                    viewBox="0 0 200 200"
                    aria-hidden="true"
                  >
                    {/* ١٦ خانەی کەوانەیی یەکسان — path حیسابکراو */}
                    {SPIN_WHEEL_SEGMENTS.map((seg, i) => (
                      <path
                        key={`slice-${seg.id}`}
                        className="kd-spin-slice"
                        d={spinSlicePath(i)}
                        fill={seg.color}
                      />
                    ))}
                    {/* هێڵی ئاڵتوونی جیاکەرەوە لە نێوان خانەکان */}
                    {SPIN_WHEEL_SEGMENTS.map((seg, i) => (
                      <path
                        key={`div-${seg.id}`}
                        d={spinDividerPath(i)}
                        fill="none"
                        stroke={SPIN_GOLD_STROKE}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    ))}
                    {/* بازنەی دەرەوەی ئاڵتوونی */}
                    <circle
                      cx={SPIN_WHEEL_SVG_CX}
                      cy={SPIN_WHEEL_SVG_CY}
                      r={SPIN_WHEEL_SVG_R}
                      fill="none"
                      stroke={SPIN_GOLD_STROKE}
                      strokeWidth={2.2}
                    />
                    {/* ناوەڕاستی تاریک بۆ hub */}
                    <circle
                      cx={SPIN_WHEEL_SVG_CX}
                      cy={SPIN_WHEEL_SVG_CY}
                      r={SPIN_WHEEL_HUB_R}
                      fill="#0b0d14"
                      stroke={SPIN_GOLD_STROKE}
                      strokeWidth={1.6}
                    />
                    {/* ژمارە سەرەوە + ئایکۆنی کۆین خوارەوە — بێ دەقی کوردی */}
                    {SPIN_WHEEL_SEGMENTS.map((seg, i) => {
                      const amount = formatSpinSegAmount(seg)
                      const isRetry = seg.kind === 'retry'
                      return (
                        <g
                          key={`lbl-${seg.id}`}
                          className={`kd-spin-slice-stack${isRetry ? ' is-retry' : ''}`}
                          transform={spinLabelTransform(i)}
                        >
                          {!isRetry && amount ? (
                            <text
                              className="kd-spin-slice-amount"
                              x={0}
                              y={-5.5}
                              textAnchor="middle"
                              dominantBaseline="central"
                            >
                              {amount}
                            </text>
                          ) : null}
                          {spinSliceUsesCurrencyImage(seg) ? (
                            <image
                              className="kd-spin-slice-coin"
                              href={spinSliceIcon(seg)}
                              x={-6.5}
                              y={isRetry ? -6.5 : 1}
                              width={13}
                              height={13}
                              preserveAspectRatio="xMidYMid meet"
                            />
                          ) : (
                            <text
                              className="kd-spin-slice-icon"
                              x={0}
                              y={isRetry ? 0 : 6.5}
                              textAnchor="middle"
                              dominantBaseline="central"
                            >
                              {spinSliceIcon(seg)}
                            </text>
                          )}
                        </g>
                      )
                    })}
                  </svg>
                </div>

                {/* Fixed decorative ring + pointer */}
                <div className="kd-spin-wheel-ring" aria-hidden="true" />
                <div className="kd-spin-pointer" aria-hidden="true" />

                {/* Fixed center hub — ناچەرخێت */}
                <div className="kd-spin-hub" aria-hidden="true">
                  <div className="kd-spin-hub-disc" />
                </div>

                <button
                  type="button"
                  className={`btn-interactive kd-spin-center-btn${isFreeSpinNext ? ' is-free' : ''}`}
                  disabled={spinAnimating || !!spinResult}
                  onClick={handleSpinWheel}
                >
                  {isFreeSpinNext ? (
                    'بێ بەرامبەر'
                  ) : (
                    <>
                      <DiamondIcon size={15} />
                      <span>{nextSpinCost} ئەڵماس</span>
                    </>
                  )}
                </button>

              </div>

              <p className="kd-spin-meta">

                {isFreeSpinNext

                  ? 'سووڕانەوەی یەکەمی ڕۆژ · بێ بەرامبەر'

                  : `سووڕانی داهاتوو · ${nextSpinCost} ئەڵماس (+٣٠٪ دوای هەر جار)`}

              </p>

            </div>
          </>

        , headerEl)}

        {/* ئەنجامی خەڵاتی چەرخ — سەرووی هەموو شتێک (portal → body) */}
        {spinResult && createPortal(
          <div
            className="kd-spin-result-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="ئەنجامی خەڵات"
            onClick={dismissSpinResult}
          >
            <div
              className={`kd-spin-result-card${spinResult.kind === 'retry' ? ' retry' : ''}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="kd-spin-result-icon" aria-hidden="true">
                {spinResult.kind === 'retry' ? '🔄'
                  : spinResult.kind === 'gold' ? <GoldIcon size={52} />
                    : spinResult.kind === 'diamond' ? <DiamondIcon size={52} />
                      : spinResult.icon}
              </div>
              <p className="kd-spin-result-title">
                {spinResult.kind === 'retry' ? 'دووبارە هەوڵبدە!' : 'پیرۆزە! خەڵاتت برد'}
              </p>
              <p
                className={`kd-spin-result-amount${
                  spinResult.kind === 'diamond' ? ' is-diamond'
                    : spinResult.kind === 'retry' ? ' is-retry'
                      : ''
                }`}
              >
                {spinResult.kind === 'retry'
                  ? 'هیچ خەڵاتێک نەدرا'
                  : spinResult.label}
              </p>
              <p className="kd-spin-result-sub">
                {spinResult.kind === 'retry'
                  ? 'دووبارە بسووڕێنە بۆ هەوڵێکی نوێ'
                  : spinResult.kind === 'gold'
                    ? `${spinResult.amount.toLocaleString()} زێڕ زیاد کرا`
                    : spinResult.kind === 'diamond'
                      ? `${spinResult.amount.toLocaleString()} ئەڵماس زیاد کرا`
                      : `${spinResult.label} بەدەست هێنا`}
              </p>
              <button
                type="button"
                className="btn-interactive kd-spin-result-btn"
                onClick={dismissSpinResult}
              >
                باشە
              </button>
            </div>
          </div>,
          document.body,
        )}

        {/* گۆڕینی ژمارەی نهێنی — هەنگاوی کۆن → نوێ */}
        {showChangePasswordPanel && createPortal(
          <div
            className="kd-game-alert-backdrop"
            onClick={e => { if (e.target === e.currentTarget && !changePwBusy) setShowChangePasswordPanel(false) }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 18, 0.78)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '18px 14px',
              direction: 'rtl',
              zIndex: 100320,
            }}
          >
            <div
              className="kd-game-alert-card glass-surface"
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 360,
                borderRadius: 18,
                padding: '18px 16px',
                border: '1.5px solid rgba(251,191,36,0.45)',
                background: 'linear-gradient(160deg, rgba(30,20,8,0.95), rgba(8,12,22,0.96))',
                boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 28px rgba(251,191,36,0.18)',
                fontFamily: 'var(--kd-font)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <i className="material-icons" style={{ fontSize: 22, color: '#fbbf24' }}>lock</i>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>گۆڕینی ژمارەی نهێنی</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
                    {changePwStep === 'old' ? 'هەنگاوی ١: وشەی نهێنی کۆن' : 'هەنگاوی ٢: وشەی نهێنی نوێ'}
                  </div>
                </div>
              </div>

              {changePwStep === 'old' ? (
                <label style={{ display: 'block', marginBottom: 10 }}>
                  <span style={{ display: 'block', fontSize: 9, fontWeight: 800, color: '#94a3b8', marginBottom: 5, textAlign: 'right' }}>
                    ژمارەی نهێنی کۆن
                  </span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={changePwOld}
                    disabled={changePwBusy}
                    onChange={e => { setChangePwError(''); setChangePwOld(e.target.value) }}
                    placeholder="وشەی نهێنی ئێستا"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(0,0,0,0.35)',
                      color: '#fff',
                      fontSize: 13,
                      fontFamily: 'var(--kd-font)',
                      textAlign: 'right',
                      outline: 'none',
                    }}
                  />
                </label>
              ) : (
                <>
                  <label style={{ display: 'block', marginBottom: 10 }}>
                    <span style={{ display: 'block', fontSize: 9, fontWeight: 800, color: '#94a3b8', marginBottom: 5, textAlign: 'right' }}>
                      ژمارەی نهێنی نوێ
                    </span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={changePwNew}
                      disabled={changePwBusy}
                      onChange={e => { setChangePwError(''); setChangePwNew(e.target.value) }}
                      placeholder="لانیکەم ٨ پیت"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '11px 12px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: 'rgba(0,0,0,0.35)',
                        color: '#fff',
                        fontSize: 13,
                        fontFamily: 'var(--kd-font)',
                        textAlign: 'right',
                        outline: 'none',
                      }}
                    />
                  </label>
                  <label style={{ display: 'block', marginBottom: 10 }}>
                    <span style={{ display: 'block', fontSize: 9, fontWeight: 800, color: '#94a3b8', marginBottom: 5, textAlign: 'right' }}>
                      دووبارەکردنەوەی وشەی نهێنی نوێ
                    </span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={changePwNew2}
                      disabled={changePwBusy}
                      onChange={e => { setChangePwError(''); setChangePwNew2(e.target.value) }}
                      placeholder="هەمان وشەی نوێ"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '11px 12px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: 'rgba(0,0,0,0.35)',
                        color: '#fff',
                        fontSize: 13,
                        fontFamily: 'var(--kd-font)',
                        textAlign: 'right',
                        outline: 'none',
                      }}
                    />
                  </label>
                </>
              )}

              {changePwError ? (
                <div style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#fecaca',
                  background: 'rgba(248,113,113,0.12)',
                  border: '1px solid rgba(248,113,113,0.35)',
                  borderRadius: 10,
                  padding: '8px 10px',
                  marginBottom: 10,
                  textAlign: 'right',
                }}>
                  {changePwError}
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  disabled={changePwBusy}
                  onClick={() => {
                    if (changePwStep === 'new') {
                      setChangePwStep('old')
                      setChangePwError('')
                      return
                    }
                    setShowChangePasswordPanel(false)
                  }}
                  className="btn-interactive"
                  style={{
                    flex: 1,
                    padding: '11px 8px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#cbd5e1',
                    fontWeight: 900,
                    fontSize: 11,
                    fontFamily: 'var(--kd-font)',
                  }}
                >
                  {changePwStep === 'new' ? 'گەڕانەوە' : 'پاشگەزبوونەوە'}
                </button>
                <button
                  type="button"
                  disabled={changePwBusy}
                  onClick={() => { void handleChangePasswordSubmit() }}
                  className="btn-interactive"
                  style={{
                    flex: 1.2,
                    padding: '11px 8px',
                    borderRadius: 12,
                    border: '1px solid rgba(251,191,36,0.5)',
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.28), rgba(180,83,9,0.22))',
                    color: '#fef3c7',
                    fontWeight: 900,
                    fontSize: 11,
                    fontFamily: 'var(--kd-font)',
                  }}
                >
                  {changePwBusy ? '...' : changePwStep === 'old' ? 'دواتر' : 'پاشەکەوتکردن'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

        {/* مۆدالی ئاگاداری ناو یاری — toast (بێ قفڵ) یان confirm / prompt (مۆدال) */}

        {gameAlert && (() => {

          const toneBorder = gameAlert.tone === 'error' ? 'rgba(248,113,113,0.55)'

            : gameAlert.tone === 'success' ? 'rgba(74,222,128,0.55)'

              : gameAlert.tone === 'warn' ? 'rgba(251,191,36,0.55)'

                : 'rgba(0,240,255,0.45)'

          const toneGlow = gameAlert.tone === 'error' ? 'rgba(248,113,113,0.35)'

            : gameAlert.tone === 'success' ? 'rgba(74,222,128,0.32)'

              : gameAlert.tone === 'warn' ? 'rgba(251,191,36,0.32)'

                : 'rgba(0,240,255,0.28)'

          const toneBg = gameAlert.tone === 'error'

            ? 'linear-gradient(135deg, rgba(248,113,113,0.22), rgba(8,12,24,0.92))'

            : gameAlert.tone === 'success'

              ? 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(8,12,24,0.92))'

              : gameAlert.tone === 'warn'

                ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(8,12,24,0.92))'

                : 'linear-gradient(135deg, rgba(0,240,255,0.18), rgba(8,12,24,0.92))'

          const isModal = gameAlert.mode === 'modal' || Boolean(gameAlert.cancelLabel) || Boolean(gameAlert.hasInput)
          const hasInput = Boolean(gameAlert.hasInput)

          const card = (
            <div
              className={isModal ? 'kd-game-alert-card' : 'kd-reward-toast__card'}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: hasInput ? 380 : (isModal ? 520 : 440),
                display: 'flex',
                flexDirection: hasInput ? 'column' : 'row',
                alignItems: hasInput ? 'stretch' : 'center',
                gap: hasInput ? 12 : 12,
                background: toneBg,
                border: `1.5px solid ${toneBorder}`,
                borderRadius: 16,
                padding: hasInput ? '16px 14px' : '13px 14px',
                boxShadow: `0 12px 40px rgba(0,0,0,0.45), 0 0 24px ${toneGlow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                fontFamily: 'var(--kd-font)',
                backdropFilter: 'blur(16px) saturate(1.35)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, direction: 'rtl' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${toneBorder}`,
                  boxShadow: `0 0 16px ${toneGlow}`,
                  overflow: 'hidden',
                }}>
                  {gameAlert.icon && (/^(https?:|data:|blob:|\/)/.test(gameAlert.icon) || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(gameAlert.icon)) ? (
                    <img
                      src={gameAlert.icon}
                      alt=""
                      draggable={false}
                      style={{ width: 34, height: 34, objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    gameAlert.icon ?? '💬'
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                  {gameAlert.title && (
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#f8fafc', marginBottom: 3, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                      {gameAlert.title}
                    </div>
                  )}
                  <div style={{
                    fontSize: 11, fontWeight: 800, color: '#cbd5e1', lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}>{gameAlert.message}</div>
                </div>
                {isModal && !hasInput && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    {gameAlert.cancelLabel && (
                      <button
                        type="button"
                        onClick={() => gameAlert.onCancel?.()}
                        className="btn-interactive"
                        style={{
                          padding: '8px 12px', borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.14)',
                          background: 'rgba(255,255,255,0.06)',
                          color: '#94a3b8', fontWeight: 900, fontSize: 10,
                          fontFamily: 'var(--kd-font)',
                          whiteSpace: 'nowrap',
                        }}
                      >{gameAlert.cancelLabel}</button>
                    )}
                    <button
                      type="button"
                      onClick={() => gameAlert.onConfirm?.()}
                      className="btn-interactive"
                      style={{
                        padding: '8px 14px', borderRadius: 10,
                        border: `1px solid ${toneBorder}`,
                        background: gameAlert.tone === 'error'
                          ? 'linear-gradient(135deg, rgba(248,113,113,0.28), rgba(127,29,29,0.35))'
                          : 'linear-gradient(135deg, rgba(0,240,255,0.28), rgba(2,132,199,0.25))',
                        color: '#f8fafc', fontWeight: 900, fontSize: 10,
                        fontFamily: 'var(--kd-font)',
                        whiteSpace: 'nowrap',
                        boxShadow: `0 0 14px ${toneGlow}`,
                      }}
                    >{gameAlert.confirmLabel ?? 'بەڵێ'}</button>
                  </div>
                )}
              </div>

              {hasInput && (
                <label style={{ display: 'block', direction: 'rtl' }}>
                  {gameAlert.inputLabel ? (
                    <span style={{ display: 'block', fontSize: 9, fontWeight: 800, color: '#94a3b8', marginBottom: 6, textAlign: 'right' }}>
                      {gameAlert.inputLabel}
                    </span>
                  ) : null}
                  <input
                    autoFocus
                    type={gameAlert.inputType || 'text'}
                    value={gamePromptValue}
                    placeholder={gameAlert.inputPlaceholder || ''}
                    onChange={e => {
                      const v = e.target.value
                      gamePromptValueRef.current = v
                      setGamePromptValue(v)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        gameAlert.onConfirm?.()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        gameAlert.onCancel?.()
                      }
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 12px',
                      borderRadius: 12,
                      border: `1px solid ${toneBorder}`,
                      background: 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 800,
                      fontFamily: 'var(--kd-font)',
                      textAlign: 'right',
                      outline: 'none',
                      boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 16px ${toneGlow}`,
                    }}
                  />
                </label>
              )}

              {hasInput && (
                <div style={{ display: 'flex', gap: 8, direction: 'rtl' }}>
                  <button
                    type="button"
                    onClick={() => gameAlert.onConfirm?.()}
                    className="btn-interactive"
                    style={{
                      flex: 1.2,
                      padding: '11px 10px',
                      borderRadius: 12,
                      border: `1px solid ${toneBorder}`,
                      background: 'linear-gradient(135deg, rgba(0,240,255,0.28), rgba(2,132,199,0.25))',
                      color: '#f8fafc',
                      fontWeight: 900,
                      fontSize: 11,
                      fontFamily: 'var(--kd-font)',
                      boxShadow: `0 0 14px ${toneGlow}`,
                    }}
                  >{gameAlert.confirmLabel ?? 'پاشەکەوتکردن'}</button>
                  {gameAlert.cancelLabel && (
                    <button
                      type="button"
                      onClick={() => gameAlert.onCancel?.()}
                      className="btn-interactive"
                      style={{
                        flex: 1,
                        padding: '11px 10px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#94a3b8',
                        fontWeight: 900,
                        fontSize: 11,
                        fontFamily: 'var(--kd-font)',
                      }}
                    >{gameAlert.cancelLabel}</button>
                  )}
                </div>
              )}
            </div>
          )

          if (!isModal) {
            // Non-blocking bottom toast — pointer-events none so map stays interactive
            return (
              <div
                className="kd-reward-toast"
                role="status"
                aria-live="polite"
                style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  bottom: 0,
                  zIndex: 100200,
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '0 12px calc(72px + env(safe-area-inset-bottom, 0px))',
                  pointerEvents: 'none',
                  direction: 'rtl',
                }}
              >
                {card}
              </div>
            )
          }

          return createPortal(
            <div
              className="kd-game-alert-backdrop"
              onClick={e => {
                if (e.target !== e.currentTarget) return
                gameAlert.onCancel?.()
              }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100300,
                background: 'rgba(2, 6, 18, 0.62)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '18px 14px',
                direction: 'rtl',
              }}
            >
              {card}
            </div>,
            document.body,
          )

        })()}

        {/* پەردەی دەرەوەی بۆکسەکان — کلیک لە هەر شوێنێکی تر → داخستن */}

        {isAnyExclusiveBoxOpen && (

          <div
            onClick={() => {
              if (spinAnimating) return
              dismissAllOverlaysRef.current(null)
            }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 45 }}
          />

        )}

        {/* هێدەری سەرەوە و بۆکسەکان */}

        <div ref={setHeaderNode} className="glass-surface kd-app-header" style={{ position: 'absolute', top: 'calc(2px + env(safe-area-inset-top, 0px))', left: 'calc(8px + env(safe-area-inset-left, 0px))', right: 'calc(8px + env(safe-area-inset-right, 0px))', zIndex: 100100, borderRadius: 22, padding: '7px 9px 6px', display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.16s cubic-bezier(0.22, 1, 0.36, 1)' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* بۆکسی پرۆفایل و دوگمەکانی (هەمیشەیی/خۆڕایی) */}

            <div className="kd-header-profile-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderRadius: 18, padding: '6px 8px' }}>

              <div onClick={() => toggleSheet('profile')} className="btn-interactive" style={{ display: 'flex', alignItems: 'center', gap: 8, flexGrow: 1 }}>

                <div className={`kd-xp-avatar-wrap${levelUpBurst ? ' is-level-up' : ''}`} title={`ئاست ${playerLevelNum} · XP ${playerXpNum}/${playerXpNeed}`}>

                  {levelUpBurst && <span className="kd-xp-levelup-aura" aria-hidden="true" />}
                  {levelUpBurst && <span className="kd-xp-levelup-sheen" aria-hidden="true" />}

                  <svg className="kd-xp-ring" viewBox="0 0 48 48" aria-hidden="true">

                    <defs>

                      <linearGradient id="kdXpRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">

                        <stop offset="0%" stopColor="#67e8f9" />

                        <stop offset="55%" stopColor="#38bdf8" />

                        <stop offset="100%" stopColor="#fbbf24" />

                      </linearGradient>

                    </defs>

                    <circle className="kd-xp-ring-bg" cx="24" cy="24" r="20" />

                    <circle

                      className={`kd-xp-ring-fg${xpRingFillBoost ? ' is-filling' : ''}`}

                      cx="24"

                      cy="24"

                      r="20"

                      strokeDasharray={125.664}

                      strokeDashoffset={xpRingFillBoost ? 0 : 125.664 * (1 - playerXpPct / 100)}

                    />

                  </svg>

                  <div className={`kd-avatar-frame kd-xp-avatar-core ${cosmeticBorder?.borderClass ?? ''}`}>

                    <HeadShotAvatar

                      sizePx={34}

                      gender={userProfile?.gender}

                      seed={authUserId || 'self'}

                      avatarUrl={playerAvatar}

                      skin={cosmeticSkin}

                      border={cosmeticBorder}

                      avatar3d={playerAvatar3d}

                    />

                  </div>

                  <span className={`kd-xp-level-badge${levelBadgeAnim ? ' is-popping' : ''}`} key={levelBadgeAnim ? `lv-${levelBadgeAnim.to}` : `lv-${playerLevelNum}`}>
                    {levelBadgeAnim ? levelBadgeAnim.to : playerLevelNum}
                  </span>

                </div>

                <div className="kd-header-profile-meta">
                  <span className="kd-header-profile-name">{playerName}{wallet.isPremium ? ' 👑' : ''}</span>

                  <div className="kd-header-level" title={`ئاست: ${currentLevel.name}`}>
                    <span className="kd-header-level-label">ئاست: {currentLevel.name}</span>
                    <span className="kd-header-level-icon" aria-hidden="true">{currentLevel.icon}</span>
                  </div>

                  <div className="kd-header-player-level">لێڤڵ: {playerLevelNum}</div>

                  {playerIdDisplay ? (
                    <button
                      type="button"
                      className={`btn-interactive kd-header-id-row${idCopiedFlash ? ' is-copied' : ''}`}
                      onClick={e => { e.stopPropagation(); copyPlayerId() }}
                      title={idCopiedFlash ? 'کۆپی کرا' : 'کۆپی ئایدی'}
                      aria-label={idCopiedFlash ? 'ئایدی کۆپی کرا' : `کۆپی ئایدی ${playerIdDisplay}`}
                    >
                      <span className="kd-header-id-text">ID: {playerIdDisplay}</span>
                      <i className="material-icons kd-header-id-copy" aria-hidden="true">
                        {idCopiedFlash ? 'check_circle' : 'content_copy'}
                      </i>
                    </button>
                  ) : null}
                </div>

              </div>

              <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'flex-start' }}>

                <div onClick={() => toggleSheet('notifications')} className="btn-interactive" style={{ position: 'relative', background: activeSheet === 'notifications' ? 'rgba(56,189,248,0.22)' : 'rgba(255,255,255,0.08)', border: `1px solid ${activeSheet === 'notifications' ? 'rgba(56,189,248,0.45)' : 'rgba(255,255,255,0.14)'}`, borderRadius: 12, padding: '5px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 50, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: unreadNotifCount > 0 ? '0 0 14px rgba(56,189,248,0.35)' : 'none' }}>

                  <i className="material-icons" style={{ fontSize: 15, color: '#7dd3fc' }}>notifications</i>

                  <span style={{ fontSize: 7.5, fontWeight: 900, color: '#e0f2fe' }}>ئاگادارییەکان</span>

                  {unreadNotifCount > 0 && (

                    <div style={{ position: 'absolute', top: -3, left: -3, minWidth: 14, height: 14, borderRadius: 7, background: '#ef4444', color: '#fff', fontSize: 7, fontWeight: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 3px', border: '1.5px solid #041018', boxShadow: '0 0 8px rgba(239,68,68,0.7)' }}>

                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}

                    </div>

                  )}

                </div>

                <div onClick={() => { setPassView('picker'); setSocialLinkInput(''); toggleSheet('premium') }} className="btn-interactive" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '5px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 50 }}>

                  <i className="material-icons" style={{ fontSize: 15, color: '#fde047' }}>terrain</i>

                  <span style={{ fontSize: 8, fontWeight: 900, color: '#fef08a' }}>ڕێڕەوی کوردستان</span>

                </div>

              </div>

            </div>

            {/* باڵانسەکان — کلیک → فرۆشگای زێڕ / ئەڵماس */}

            <div className="kd-header-curr-row">

              <div
                onClick={() => toggleBalance('gold')}
                className={`btn-interactive kd-header-curr kd-header-curr--gold${activeBalance === 'gold' ? ' is-store-open' : ''}`}
                title="فرۆشگای زێڕ"
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBalance('gold') } }}
              >

                <div className="kd-header-curr-meta">

                  <span className="kd-header-curr-val">{wallet.gold.toLocaleString()}</span>

                  <span className="kd-header-curr-label">زێڕ</span>

                </div>

                <img
                  src={GOLD_HEADER_ICON}
                  alt=""
                  aria-hidden="true"
                  className="kd-header-curr-icon"
                  draggable={false}
                />

              </div>

              <div
                onClick={() => toggleBalance('diamond')}
                className={`btn-interactive kd-header-curr kd-header-curr--diamond${activeBalance === 'diamond' ? ' is-store-open' : ''}`}
                title="فرۆشگای ئەڵماس"
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBalance('diamond') } }}
              >

                <div className="kd-header-curr-meta">

                  <span className="kd-header-curr-val">{wallet.diamond.toLocaleString()}</span>

                  <span className="kd-header-curr-label">ئەڵماس</span>

                </div>

                <img
                  src={GEM_HEADER_ICON}
                  alt=""
                  aria-hidden="true"
                  className="kd-header-curr-icon"
                  draggable={false}
                />

              </div>

            </div>

          </div>

          {/* ناڤبار — RTL: ماپ - تایبەتی - جانتا - دەوروبەر - دەوڵەمەندەکان - ئاست */}

          <div className="kd-header-nav" style={{ display: 'flex', direction: 'rtl', borderRadius: 16, padding: '4px', gap: 3 }}>

            {([

              { id: 'map',         icon: 'map',           label: 'ماپ',     color: '#00f0ff', action: null as string | null },

              { id: 'private',     icon: 'lock_person',   label: 'تایبەتی', color: '#4ade80', action: 'private' },

              { id: 'inventory',   icon: 'backpack',      label: 'جانتا',   color: '#c084fc', action: 'inventory' },

              { id: 'nearby',      icon: 'groups',        label: 'دەوروبەر', color: '#38bdf8', action: 'nearby' },

              { id: 'leaderboard', icon: 'workspace_premium', label: 'دەوڵەمەندەکان', color: '#fbbf24', action: 'leaderboard' },

              { id: 'levels',      icon: 'grade',         label: 'ئاست',    color: '#a78bfa', action: 'levels' },

            ] as const).map(({ id, icon, label, color, action }) => {

              const isActive = activeSheet === action
                || (!action && id === 'map' && !activeSheet && !activeBalance);

              return (

                <div 

                  key={id} 

                  onClick={() => {

                    if (action === 'private') {

                      if (activeSheet === 'private') closeDropdownAnimated()

                      else {

                        setActiveDmPartner(null)

                        openPrivateSheet(privateTab || 'messages')

                      }

                      return

                    }

                    toggleSheet(action)

                  }} 

                  className="btn-interactive" 

                  style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '5px 0', borderRadius: 12, background: isActive ? `linear-gradient(to bottom, ${color}28, transparent)` : 'transparent', border: isActive ? `1px solid ${color}55` : '1px solid transparent' }}

                >

                  <i className="material-icons" style={{ fontSize: 17, color: isActive ? color : 'rgba(255,255,255,0.5)', textShadow: isActive ? `0 0 8px ${color}` : 'none' }}>{icon}</i>

                  <span style={{ fontSize: 7.5, fontWeight: isActive ? 900 : 700, color: isActive ? color : 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.15 }}>{label}</span>

                  {id === 'inventory' && boughtItems.length > 0 && !hasViewedInv && (

                    <div style={{ position: 'absolute', top: -2, right: 2, background: '#ef4444', color: '#fff', fontSize: 7, fontWeight: 900, width: 13, height: 13, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1.5px solid #000', boxShadow: '0 0 5px rgba(239,68,68,0.8)' }}>

                      {boughtItems.length}

                    </div>

                  )}

                  {id === 'nearby' && nearbyPlayers.length > 0 && (

                    <div style={{ position: 'absolute', top: -2, right: 2, minWidth: 14, height: 14, borderRadius: 7, background: '#0ea5e9', color: '#fff', fontSize: 7, fontWeight: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 3px', border: '1.5px solid #040812' }}>

                      {nearbyPlayers.length > 99 ? '99+' : nearbyPlayers.length}

                    </div>

                  )}

                  {id === 'private' && privateBadgeCount > 0 && (

                    <div style={{ position: 'absolute', top: -2, right: 2, minWidth: 14, height: 14, borderRadius: 7, background: '#ef4444', color: '#fff', fontSize: 7, fontWeight: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 3px', border: '1.5px solid #040812', boxShadow: '0 0 6px rgba(239,68,68,0.7)' }}>

                      {privateBadgeCount > 99 ? '99+' : privateBadgeCount}

                    </div>

                  )}

                </div>

              );

            })}

          </div>

          {/* ══ ناوەڕۆکی دابەزیو ══ */}

          {isDropdownSheetOpen && (

            <div id="dropdown-wrapper" style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 12, marginTop: 4, maxHeight: '62vh', overflow: 'hidden', animation: 'smoothExpand 0.22s cubic-bezier(0.22, 1, 0.36, 1)' }}>

              <div style={{ overflowY: 'auto', flexGrow: 1, paddingBottom: 15, scrollbarWidth: 'none' }}>

                {activeSheet === 'nearby' && (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, direction: 'rtl' }}>

                      <div>

                        <div style={{ fontSize: 13, fontWeight: 900, color: '#e0f2fe' }}>دەوروبەر</div>

                        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>یاریزانانی ناو ١ کم</div>

                      </div>

                      <i className="material-icons" style={{ fontSize: 20, color: '#38bdf8' }}>groups</i>

                    </div>

                    {nearbyPlayers.length === 0 ? (

                      <div style={{ textAlign: 'center', padding: '22px 12px', color: '#64748b', fontSize: 11, fontWeight: 800, lineHeight: 1.7 }}>

                        هیچ یاریزانێک لە ناو ١ کم دا نییە

                      </div>

                    ) : (

                      nearbyPlayers.map(p => (
                        <NearbyPlayerRow
                          key={p.uid}
                          uid={p.uid}
                          name={p.name}
                          lat={p.lat}
                          lng={p.lng}
                          distM={p.distM}
                          isOnline={p.isOnline}
                          lastSeenMs={p.lastSeenMs}
                          avatarUrl={p.avatarUrl}
                          avatar3d={p.avatar3d}
                          gender={p.gender}
                          skinId={p.skinId}
                          borderId={p.borderId}
                          onFocus={focusNearbyPlayer}
                        />
                      ))

                    )}

                  </div>

                )}

                {(activeBalance === 'gold' || activeBalance === 'diamond') && (
                  <CurrencyStore
                    mode={activeBalance === 'gold' ? 'gold' : 'diamond'}
                    onBuyGoldPack={handleBuyGoldPack}
                    onBuyGemPack={handleBuyGemPack}
                  />
                )}

                {/* فرۆشگا — تەنها ٦ ئایتم · بێ تاب · ٢ ستوون */}

                {activeSheet === 'market' && (() => {

                  const ownedIds = new Set(boughtItems.map(i => i.id))

                  const displayItems = ACTIVE_SHOP_ITEMS

                  const priceLabel = (item: ShopCatalogItem): ReactNode => {
                    const icon =
                      item.curr === 'gold' ? <GoldIcon size={12} />
                        : <DiamondIcon size={12} />
                    return (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        {item.price.toLocaleString()}
                        {icon}
                      </span>
                    )
                  }
                  const priceStyle = (item: ShopCatalogItem, owned: boolean) => ({

                    background: owned && item.isCosmetic

                      ? 'rgba(34,197,94,0.12)'

                      : item.curr === 'gold'

                        ? 'linear-gradient(135deg, rgba(251,191,36,0.22), rgba(120,53,15,0.25))'

                        : 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(2,60,90,0.3))',

                    border: `1px solid ${owned && item.isCosmetic ? 'rgba(34,197,94,0.4)' : item.curr === 'gold' ? 'rgba(251,191,36,0.4)' : 'rgba(0,240,255,0.4)'}`,

                    color: owned && item.isCosmetic ? '#86efac' : item.curr === 'gold' ? '#fde68a' : '#cffafe',

                    opacity: owned && item.isCosmetic ? 0.85 : 1,

                  })

                  return (

                    <div className="kd-citadel-shop kd-skins-shop glass-surface" style={{ ['--shop-accent' as string]: '#67e8f9' }}>

                      <div className="kd-citadel-header">

                        <span className="kd-citadel-title">🏰 فرۆشگا</span>

                      </div>

                        <div className="kd-citadel-body">

                          <div className="kd-shop-items-col">

                            <div className="kd-shop-items-grid gear-grid kd-shop-items-grid--2col">

                              {displayItems.map(item => {

                                const owned = ownedIds.has(item.id)

                                return (

                                  <div key={item.id} className="kd-gear-card">

                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>

                                      <div className="kd-shop-thumb kd-thumb-default" style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>

                                        {item.icon}

                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>

                                        <span style={{ fontSize: 11, fontWeight: 900, color: '#f8fafc', lineHeight: 1.25 }}>{item.name}</span>

                                        <span style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 800, lineHeight: 1.2 }}>چۆن کاردەکات؟</span>

                                        <span style={{ fontSize: 8, color: '#cbd5e1', lineHeight: 1.45 }}>{item.desc}</span>

                                      </div>

                                    </div>

                                    <button

                                      type="button"

                                      onClick={() => buyMarketItem(item.id)}

                                      className="btn-interactive kd-price-btn"

                                      style={priceStyle(item, owned)}

                                    >

                                      {priceLabel(item)}

                                    </button>

                                  </div>

                                )

                              })}

                            </div>

                          </div>

                        </div>

                      <p style={{ fontSize: 7.5, color: 'rgba(148,163,184,0.85)', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>

                        فڵار ڕاستەوخۆ تەقێنرێت · کلیل و کەرەستەکانی تر لە جانتادا چالاک بکە.

                      </p>

                    </div>

                  )

                })()}

                {/* جانتا */}

                {activeSheet === 'inventory' && (

                  <>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, direction: 'rtl', marginBottom: 5 }}>

                      <i className="material-icons" style={{ color: '#c084fc', fontSize: 18 }}>backpack</i>

                      <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>جانتاکەت 🎒 ({boughtItems.length}/{inventoryCapacity})</span>

                    </div>

                    {boughtItems.length === 0 ? (

                      <div style={{ textAlign: 'center', padding: '16px 10px', color: '#64748b' }}>

                        <div style={{ fontSize: 32, marginBottom: 8 }}>🎒</div>

                        <p style={{ fontSize: 10 }}>جانتاکەت بەتاڵە! لە بازاڕ شت بکڕە.</p>

                      </div>

                    ) : (

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                        {boughtItems.map(item => {

                          const cosmetic = COSMETIC_BY_ID[item.id]

                          return (

                          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', padding: 10, background: item.active ? 'rgba(0,240,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${item.active ? 'rgba(0,240,255,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12 }}>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                              <span style={{ fontSize: 24 }}>{item.icon}</span>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>

                                <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>{item.name}</span>

                                <span style={{ color: '#94a3b8', fontSize: 8.5 }}>{item.desc}</span>

                                {cosmetic && (

                                  <span style={{ fontSize: 7.5, fontWeight: 800, color: '#c084fc', background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 6, padding: '1px 6px', width: 'fit-content' }}>

                                    {cosmeticSlotLabel(cosmetic.slot)}

                                  </span>

                                )}

                              </div>

                            </div>

                            {/* نۆتە: کاریگەری ڕاستەقینەی هەندێک کەرەستە بە ڕاستەوخۆ بەندە بە دۆخی چالاک/ناچالاک بوونیان

                                (نموونە: کلیلی ئەفسانەیی #3 قوفڵی کاتی درۆپەکان لادەبات، قەڵغانی پاراستن #4 لە دزین دەتپارێزێت) */}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>

                              <button onClick={() => {

                                const isCosmetic = Boolean(COSMETIC_BY_ID[item.id])

                                const willEquip = isCosmetic && !item.active

                                setBoughtItems(prev => {

                                  const next = isCosmetic

                                    ? toggleCosmeticInInventory(prev, item.id)

                                    : prev.map(x => x.id === item.id ? { ...x, active: !x.active } : x)

                                  persistInventoryAndWallet(next, wallet)

                                  // نوێکردنەوەی نەخشە و لۆکەیشن دوای چالاککردن

                                  queueMicrotask(() => {

                                    updateUserMarkerIcon()

                                    pushLocationToFirestore(userLatRef.current, userLngRef.current, true)

                                  })

                                  return next

                                })

                                if (willEquip && soundEnabledRef.current) playEquipSfx()

                                if (willEquip) {

                                  const next = bumpMission(normalizeMissions(seasonPassRef.current), 'equipCosmetic', 1)

                                  seasonPassRef.current = next

                                  setSeasonPass(next)

                                  saveSeasonPass(userIdRef.current, next)

                                }

                              }} className="btn-interactive" style={{ gridColumn: '1 / span 2', background: item.active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)', border: `1px solid ${item.active ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`, borderRadius: 8, padding: '7px', color: item.active ? '#fca5a5' : '#bbf7d0', fontSize: 9.5, fontWeight: 'bold' }}>{item.active ? '✅ چالاکە — ناچالاککردن' : 'چالاککردن و بەکارهێنان'}</button>

                              <button onClick={async () => { if(await showGameConfirm({ message: 'دڵنیایت لە فرۆشتنی ئەم کەرەستەیە بە نیوەی نرخ؟' })) { const refund = Math.floor(item.price / 2); const nextWallet = item.curr === 'gold' ? { ...wallet, gold: wallet.gold + refund } : { ...wallet, diamond: wallet.diamond + refund }; const nextItems = boughtItems.filter(x => x.id !== item.id); setWallet(nextWallet); setBoughtItems(nextItems); persistInventoryAndWallet(nextItems, nextWallet); addXP(XP_REWARDS.sellItem); } }} className="btn-interactive" style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 8, padding: '6px', color: '#fef08a', fontSize: 9.5, fontWeight: 'bold' }}>فرۆشتن</button>

                              <button onClick={async () => { if(await showGameConfirm({ message: 'دڵنیایت لە سڕینەوەی ئەم کەرەستەیە؟' })) { const nextItems = boughtItems.filter(x => x.id !== item.id); setBoughtItems(nextItems); persistInventoryAndWallet(nextItems, wallet); } }} className="btn-interactive" style={{ background: 'rgba(148,163,184,0.2)', border: '1px solid rgba(148,163,184,0.4)', borderRadius: 8, padding: '6px', color: '#cbd5e1', fontSize: 9.5, fontWeight: 'bold' }}>سڕینەوە</button>

                            </div>

                          </div>

                          )

                        })}

                      </div>

                    )}

                  </>

                )}

                {/* ١٢ پلەی کلاسیک — تەنها ناو/ئایکۆن بێ ژمارە */}

                {activeSheet === 'levels' && (

                  <>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, direction: 'rtl', marginBottom: 8 }}>

                      <i className="material-icons" style={{ color: currentLevel.glow, fontSize: 18 }}>grade</i>

                      <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>پلەکانی ڕاوکەری</span>

                    </div>

                    <div style={{

                      padding: '12px 14px', borderRadius: 16, marginBottom: 10, direction: 'rtl',

                      background: `linear-gradient(145deg, ${currentLevel.glow}22, rgba(4,8,18,0.85))`,

                      border: `1px solid ${currentLevel.glow}66`,

                    }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                        <span

                          style={{

                            width: 40,

                            height: 40,

                            borderRadius: '50%',

                            display: 'flex',

                            alignItems: 'center',

                            justifyContent: 'center',

                            background: `linear-gradient(145deg, ${currentLevel.glow}, #0284c7)`,

                            boxShadow: `0 0 14px ${currentLevel.glow}88`,

                            flexShrink: 0,

                            fontSize: 20,

                          }}

                        >

                          {currentLevel.icon}

                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>

                          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{currentLevel.name}</div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>

                            <div style={{ fontSize: 8.5, color: '#94a3b8', lineHeight: 1.35, flex: '1 1 120px' }}>

                              تەنها بە کردنەوەی درۆپ بەرز دەبیتەوە · بێ سنووری ڕۆژانە

                            </div>

                            <button

                              type="button"

                              onClick={e => { e.stopPropagation(); dismissAllOverlaysRef.current('levelRules'); setShowLevelRulesModal(true) }}

                              className="btn-interactive"

                              style={{

                                flexShrink: 0,

                                padding: '5px 10px',

                                borderRadius: 999,

                                border: `1px solid ${currentLevel.glow}88`,

                                background: `linear-gradient(135deg, ${currentLevel.glow}33, rgba(2,132,199,0.2))`,

                                color: '#e0f2fe',

                                fontSize: 9,

                                fontWeight: 900,

                                fontFamily: 'var(--kd-font)',

                                letterSpacing: 0.2,

                                boxShadow: `0 0 10px ${currentLevel.glow}33`,

                              }}

                            >

                              ڕوونکردنەوە

                            </button>

                          </div>

                        </div>

                      </div>

                      <div style={{ marginTop: 10, height: 7, borderRadius: 7, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>

                        <div style={{ width: `${Math.round(currentLevel.progressToNext * 100)}%`, height: '100%', background: `linear-gradient(90deg, ${currentLevel.glow}, #38bdf8)` }} />

                      </div>

                    </div>

                    {HUNTER_RANKS.map((rank, i) => {

                      const isCurrent = i === currentLevel.rankIndex

                      const unlocked = i <= currentLevel.rankIndex

                      return (

                        <div

                          key={rank.name}

                          style={{

                            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px',

                            background: isCurrent ? `${rank.glow}18` : 'rgba(255,255,255,0.04)',

                            border: `1px solid ${isCurrent ? `${rank.glow}88` : 'rgba(255,255,255,0.08)'}`,

                            borderRadius: 12, marginBottom: 6, direction: 'rtl',

                            boxShadow: isCurrent ? `0 0 12px ${rank.glow}33` : 'none',

                            opacity: unlocked ? 1 : 0.55,

                          }}

                        >

                          <span

                            style={{

                              width: 32, height: 32, borderRadius: '50%',

                              display: 'flex', alignItems: 'center', justifyContent: 'center',

                              background: `linear-gradient(145deg, ${rank.glow}55, rgba(4,8,18,0.7))`,

                              border: `1px solid ${rank.glow}66`,

                              fontSize: 15, flexShrink: 0,

                            }}

                          >

                            {rank.icon}

                          </span>

                          <span style={{ fontSize: 12, fontWeight: 900, color: isCurrent ? rank.glow : '#fff', flexGrow: 1 }}>

                            {rank.name}

                          </span>

                          {isCurrent && (

                            <span style={{ fontSize: 8, fontWeight: 900, color: rank.glow, background: `${rank.glow}22`, border: `1px solid ${rank.glow}66`, borderRadius: 6, padding: '2px 6px' }}>ئێستا</span>

                          )}

                        </div>

                      )

                    })}

                  </>

                )}

                {/* دەوڵەمەندەکان — Dropdown لکاو بە هێدەر */}

                {activeSheet === 'leaderboard' && (() => {
                  const rows =
                    royalLbTab === 'wealth' ? lbWealth
                      : royalLbTab === 'level' ? lbLevel
                        : lbGifters
                  const myIdx = rows.findIndex(u => u.uid === authUserId)
                  const myEntry = myIdx >= 0 ? rows[myIdx] : null
                  const myRank = myIdx >= 0 ? myIdx + 1 : null
                  const meName = myEntry?.name || userProfile?.name || 'تۆ'
                  let meScore: ReactNode = '—'
                  if (myEntry) {
                    if (royalLbTab === 'wealth') {
                      meScore = (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <DiamondIcon size={12} /> {myEntry.diamond.toLocaleString()}
                          <span aria-hidden="true"> · </span>
                          <GoldIcon size={12} /> {myEntry.gold.toLocaleString()}
                        </span>
                      )
                    } else if (royalLbTab === 'level') {
                      meScore = `Lv ${myEntry.playerLevel}`
                    } else {
                      meScore = `🎁 ${myEntry.giftsSentScore.toLocaleString()}`
                    }
                  }
                  return (
                    <div className="kd-royal-lb-drop" dir="rtl">
                      <div className="kd-royal-lb-head">
                        <div className="kd-royal-lb-title">
                          <span className="kd-royal-lb-crown" aria-hidden="true">👑</span>
                          <span>دەوڵەمەندەکان</span>
                        </div>
                      </div>

                      <div className="kd-royal-lb-tabs" role="tablist" aria-label="جۆری ڕیزبەندی">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={royalLbTab === 'wealth'}
                          className={`kd-royal-lb-tab${royalLbTab === 'wealth' ? ' is-on' : ''}`}
                          onClick={() => setRoyalLbTab('wealth')}
                        >
                          دەوڵەمەندترینەکان
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={royalLbTab === 'level'}
                          className={`kd-royal-lb-tab${royalLbTab === 'level' ? ' is-on' : ''}`}
                          onClick={() => setRoyalLbTab('level')}
                        >
                          بەرزترین ئاستەکان
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={royalLbTab === 'gifters'}
                          className={`kd-royal-lb-tab${royalLbTab === 'gifters' ? ' is-on' : ''}`}
                          onClick={() => setRoyalLbTab('gifters')}
                        >
                          دڵسۆزترین بەخشەرەکان
                        </button>
                      </div>

                      <div className="kd-royal-lb-list">
                        {rows.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: 22, color: '#64748b', fontSize: 11, fontWeight: 800 }}>
                            هیچ یاریزانێک نییە...
                          </div>
                        ) : rows.map((user, i) => {
                          const rank = i + 1
                          const medal = royalRankMedal(rank)
                          const isMe = user.uid === authUserId
                          const rankCls = `${rank <= 3 ? ` rank-${rank}` : ''}${isMe ? ' is-me' : ''}`
                          let scoreNode: ReactNode = null
                          if (royalLbTab === 'wealth') {
                            scoreNode = (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                                <DiamondIcon size={12} /> {user.diamond.toLocaleString()}
                                <span aria-hidden="true"> · </span>
                                <GoldIcon size={12} /> {user.gold.toLocaleString()}
                              </span>
                            )
                          } else if (royalLbTab === 'level') {
                            scoreNode = `Lv ${user.playerLevel}`
                          } else {
                            scoreNode = `🎁 ${user.giftsSentScore.toLocaleString()}`
                          }
                          const live = isMe
                            ? null
                            : onlinePlayersRef.current.get(user.uid) ?? null
                          const head = isMe
                            ? {
                                avatarUrl: playerAvatar,
                                avatar3d: playerAvatar3d,
                                skin: cosmeticSkin,
                                border: cosmeticBorder,
                                gender: (userProfile?.gender === 'female' ? 'female' : 'male') as Gender,
                              }
                            : resolveLeaderboardHeadAvatar({
                                uid: user.uid,
                                gender: user.gender,
                                avatarUrl: user.avatarUrl,
                                avatar3d: user.avatar3d,
                                skinId: user.skinId,
                                borderId: user.borderId,
                                live,
                              })
                          return (
                            <div
                              key={user.playerId || user.uid || String(rank)}
                              className={`kd-royal-lb-row btn-interactive${rankCls}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                if (isMe) handleSelfClick()
                                else handlePlayerClick(user.uid)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  if (isMe) handleSelfClick()
                                  else handlePlayerClick(user.uid)
                                }
                              }}
                              aria-label={`پرۆفایلی ${user.name}`}
                            >
                              <div className="kd-royal-lb-rank">{medal || rank}</div>
                              <div className="kd-royal-lb-avatar" aria-hidden="true">
                                <HeadShotAvatar
                                  sizePx={30}
                                  gender={head.gender}
                                  seed={user.uid}
                                  avatarUrl={head.avatarUrl}
                                  skin={head.skin}
                                  border={head.border}
                                  avatar3d={head.avatar3d}
                                />
                              </div>
                              <div className="kd-royal-lb-meta">
                                <div className="kd-royal-lb-name">{user.name}{isMe ? ' (تۆ)' : ''}</div>
                              </div>
                              <div className="kd-royal-lb-score">{scoreNode}</div>
                            </div>
                          )
                        })}
                      </div>

                      <div
                        className="kd-royal-lb-footer btn-interactive"
                        aria-label="پرۆفایلی من"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelfClick()}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleSelfClick()
                          }
                        }}
                      >
                        <div className="kd-royal-lb-footer-rank">
                          {myRank != null ? `#${myRank}` : '—'}
                        </div>
                        <div className="kd-royal-lb-avatar" aria-hidden="true">
                          <HeadShotAvatar
                            sizePx={30}
                            gender={userProfile?.gender}
                            seed={authUserId || 'self'}
                            avatarUrl={playerAvatar}
                            skin={cosmeticSkin}
                            border={cosmeticBorder}
                            avatar3d={playerAvatar3d}
                          />
                        </div>
                        <div className="kd-royal-lb-footer-meta">
                          <div className="kd-royal-lb-footer-name">{meName}</div>
                        </div>
                        <div className="kd-royal-lb-score">{meScore}</div>
                      </div>
                    </div>
                  )
                })()}

                {/* پرۆفایل و ڕێکخستنەکان */}

                {activeSheet === 'profile' && (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, direction: 'rtl' }}>

                      <i className="material-icons" style={{ color: '#00f0ff', fontSize: 18 }}>person</i>

                      <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>پرۆفایل</span>

                    </div>

                    <div className="kd-vip-glass kd-profile-card" style={{ flexDirection: 'column', alignItems: 'center', gap: 8, padding: 12 }}>
                      <div className={`kd-avatar-frame ${cosmeticBorder?.borderClass ?? ''}`} style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        <HeadShotAvatar
                          sizePx={58}
                          gender={userProfile?.gender}
                          seed={authUserId || 'self'}
                          avatarUrl={playerAvatar}
                          skin={cosmeticSkin}
                          border={cosmeticBorder}
                          avatar3d={playerAvatar3d}
                        />
                      </div>
                      <div className="kd-profile-meta">
                        <div className="kd-profile-name">{playerName}{wallet.isPremium ? ' 👑' : ''}</div>
                        {cosmeticTitle && (
                          <div className="kd-profile-cosmetic-title" style={{ color: cosmeticTitle.titleColor, textShadow: `0 0 10px ${cosmeticTitle.titleGlow}` }}>
                            {cosmeticTitle.titleText}
                          </div>
                        )}
                        <div className="kd-profile-line">ئاست: {currentLevel.name}</div>
                        <div className="kd-profile-line">لێڤڵ: {playerLevelNum}</div>
                        {playerIdDisplay ? (
                          <div className="kd-profile-id-row">
                            <span className="kd-profile-line">ئایدی: {playerIdDisplay}</span>
                            <button
                              type="button"
                              onClick={copyPlayerId}
                              className={`btn-interactive kd-profile-copy-btn${idCopiedFlash ? ' is-copied' : ''}`}
                              title={idCopiedFlash ? 'کۆپی کرا' : 'کۆپی ئایدی'}
                              aria-label={idCopiedFlash ? 'ئایدی کۆپی کرا' : 'کۆپی ئایدی'}
                            >
                              <i className="material-icons">{idCopiedFlash ? 'check_circle' : 'content_copy'}</i>
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {!showProfileAccountDetails ? (
                        <button
                          type="button"
                          onClick={() => setShowProfileAccountDetails(true)}
                          className="btn-interactive"
                          style={{
                            width: '100%',
                            marginTop: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            direction: 'rtl',
                            padding: '11px 10px',
                            borderRadius: 14,
                            border: '1px solid rgba(56,189,248,0.45)',
                            background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(2,132,199,0.14))',
                            color: '#e0f2fe',
                            fontWeight: 900,
                            fontSize: 11,
                            fontFamily: 'var(--kd-font)',
                          }}
                        >
                          <i className="material-icons" style={{ fontSize: 17, color: '#38bdf8' }}>manage_accounts</i>
                          زانیارییەکانی هەژمار
                          <i className="material-icons" style={{ fontSize: 16, color: '#7dd3fc' }}>expand_more</i>
                        </button>
                      ) : (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => setShowProfileAccountDetails(false)}
                            className="btn-interactive"
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              direction: 'rtl',
                              padding: '8px 10px',
                              borderRadius: 12,
                              border: '1px solid rgba(255,255,255,0.12)',
                              background: 'rgba(255,255,255,0.05)',
                              color: '#94a3b8',
                              fontWeight: 900,
                              fontSize: 10,
                              fontFamily: 'var(--kd-font)',
                            }}
                          >
                            <i className="material-icons" style={{ fontSize: 16 }}>expand_less</i>
                            داخستنی زانیارییەکان
                          </button>

                          {[
                            { label: 'ناوی تەواو', value: (playerFullName || userProfile?.name || '').trim() && (playerFullName || userProfile?.name) !== 'یاریزان' ? (playerFullName || userProfile?.name || '').trim() : ((userProfile?.username || '').trim() || '—'), editable: false },
                            {
                              label: 'یوزەرنەیمی یاری',
                              value: userProfile?.username ? `@${userProfile.username}` : '—',
                              editable: !userProfile?.usernameEditUsed,
                              onEdit: handleEditUsernameOnce,
                              used: userProfile?.usernameEditUsed === true,
                            },
                            {
                              label: 'ئایدی',
                              value: playerIdDisplay || '—',
                              editable: false,
                              copy: Boolean(playerIdDisplay),
                            },
                            {
                              label: 'ڕەگەز',
                              value: userProfile?.gender === 'female' ? 'مێ' : 'نێر',
                              editable: false,
                            },
                            {
                              label: 'ئیمەیڵ',
                              value: (userProfile?.email || '').trim() || '—',
                              editable: !userProfile?.emailEditUsed,
                              onEdit: handleEditEmailOnce,
                              used: userProfile?.emailEditUsed === true,
                            },
                            {
                              label: 'ژمارەی مۆبایل',
                              value: (userProfile?.phone || '').trim() || '—',
                              editable: !userProfile?.phoneEditUsed,
                              onEdit: handleEditPhoneOnce,
                              used: userProfile?.phoneEditUsed === true,
                            },
                            {
                              label: 'بەرواری دروستکردنی هەژمار',
                              value: formatAccountCreatedAt(userProfile?.createdAtMs),
                              editable: false,
                            },
                          ].map(row => (
                            <div
                              key={row.label}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                direction: 'rtl',
                                padding: '8px 10px',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                                <div style={{ fontSize: 8, fontWeight: 800, color: '#94a3b8' }}>{row.label}</div>
                                <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', marginTop: 2, wordBreak: 'break-all' }}>{row.value}</div>
                                {row.used ? (
                                  <div style={{ fontSize: 7.5, color: '#fbbf24', marginTop: 2 }}>یەکجار گۆڕدراوە</div>
                                ) : null}
                              </div>
                              {row.copy ? (
                                <button
                                  type="button"
                                  onClick={copyPlayerId}
                                  className={`btn-interactive kd-profile-copy-btn${idCopiedFlash ? ' is-copied' : ''}`}
                                  title={idCopiedFlash ? 'کۆپی کرا' : 'کۆپی ئایدی'}
                                  aria-label={idCopiedFlash ? 'ئایدی کۆپی کرا' : 'کۆپی ئایدی'}
                                >
                                  <i className="material-icons">{idCopiedFlash ? 'check_circle' : 'content_copy'}</i>
                                </button>
                              ) : null}
                              {row.editable && row.onEdit ? (
                                <button
                                  type="button"
                                  disabled={profileFieldBusy}
                                  onClick={() => { void row.onEdit?.() }}
                                  className="btn-interactive"
                                  style={{
                                    flexShrink: 0,
                                    padding: '6px 8px',
                                    borderRadius: 9,
                                    border: '1px solid rgba(56,189,248,0.4)',
                                    background: 'rgba(56,189,248,0.15)',
                                    color: '#bae6fd',
                                    fontSize: 8,
                                    fontWeight: 900,
                                    fontFamily: 'var(--kd-font)',
                                  }}
                                >
                                  گۆڕین
                                </button>
                              ) : null}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={openChangePasswordPanel}
                            className="btn-interactive"
                            style={{
                              width: '100%',
                              marginTop: 2,
                              padding: '12px 10px',
                              borderRadius: 12,
                              border: '1px solid rgba(251,191,36,0.45)',
                              background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(180,83,9,0.16))',
                              color: '#fef3c7',
                              fontWeight: 900,
                              fontSize: 11,
                              fontFamily: 'var(--kd-font)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              direction: 'rtl',
                            }}
                          >
                            <i className="material-icons" style={{ fontSize: 16, color: '#fbbf24' }}>lock</i>
                            گۆڕینی ژمارەی نهێنی
                          </button>
                        </div>
                      )}
                    </div>

                    <input

                      ref={avatarInputRef}

                      type="file"

                      accept="image/*"

                      style={{ display: 'none' }}

                      onChange={e => { const f = e.target.files?.[0]; if (f) updatePlayerAvatar(f); e.target.value = '' }}

                    />

                    {/* ── ئاماری یاریزان ── */}

                    <ProfileSectionHeader icon="bar_chart" color="#38bdf8" label="ئاماری یاریزان" marginTop={2} />

                    <div className="kd-profile-stats-grid">

                      {[
                        { icon: 'schedule', label: 'کاتی یاری', value: formatPlayTime(playerStats.playTimeMs), color: '#7dd3fc' },
                        { icon: 'shopping_bag', label: 'کەرەستە کڕدراو', value: String(playerStats.itemsPurchased), color: '#e9d5ff' },
                        { icon: 'redeem', label: 'ڕۆژی خەڵات', value: String(playerStats.dailyBonusClaims), color: '#fbbf24' },
                        { icon: 'card_giftcard', label: 'دیاری وەرگیراو', value: String(playerStats.giftsReceived), color: '#fde68a' },
                        { icon: 'send', label: 'دیاری ناردن', value: String(userProfile?.giftsSentScore ?? 0), color: '#c084fc' },
                        { icon: 'directions_walk', label: 'مەودای بڕدراو', value: playerStats.distanceTraveledM >= 1000 ? `${(playerStats.distanceTraveledM / 1000).toFixed(1)} کم` : `${playerStats.distanceTraveledM} م`, color: '#86efac' },
                      ].map(stat => (
                        <div key={stat.label} className="kd-profile-stat-box" style={{ background: `linear-gradient(160deg, ${stat.color}22 0%, rgba(8,12,22,0.4) 100%)` }}>
                          <i className="material-icons" style={{ color: stat.color }}>{stat.icon}</i>
                          <span className="kd-profile-stat-label">{stat.label}</span>
                          <span className="kd-profile-stat-value" style={{ color: stat.color }}>{stat.value}</span>
                        </div>
                      ))}

                    </div>

                    {/* ── ئاگادارکردنەوەکان ── */}

                    <ProfileSectionHeader icon="notifications" color="#38bdf8" label="ئاگادارکردنەوەکان" marginTop={4} />

                    <div className="kd-profile-settings">
                      <SettingRow label="ئاگادارکردنەوەکان" checked={notificationsEnabled} onChange={handleToggleNotifications} />
                      <SettingRow label="ئاگادارکردنەوەی ڕووداو تەیارە و درۆپ" checked={radarAlertsEnabled} onChange={handleToggleRadarAlerts} />
                    </div>

                    {/* ── دەنگ ── */}

                    <ProfileSectionHeader icon="volume_up" color="#00f0ff" label="دەنگ" />

                    <div className="kd-profile-settings">

                      <div className="kd-settings-row">
                        <div className="kd-settings-row-label">
                          <span>دەنگی کاریگەرییەکان</span>
                        </div>
                        <div
                          className={`kd-settings-toggle${soundEnabled ? ' is-on' : ''}`}
                          role="switch"
                          aria-checked={soundEnabled}
                          onClick={() => handleToggleSound(!soundEnabled)}
                        >
                          <span />
                        </div>
                      </div>

                      <div className="kd-settings-row">
                        <div className="kd-settings-row-label">
                          <span>قەبارەی دەنگ</span>
                          <span className="kd-settings-row-sub">{Math.round(sfxVolume * 100)}%</span>
                        </div>
                        <input
                          className="kd-settings-volume"
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(sfxVolume * 100)}
                          disabled={!soundEnabled}
                          onChange={e => handleSfxVolume(Number(e.target.value) / 100)}
                          aria-label="قەبارەی دەنگ"
                        />
                      </div>

                      <SoundToggleVolumeRow
                        label="دەنگی تەیارە"
                        volumeLabel="قەبارەی دەنگی تەیارە"
                        enabled={planeSoundEnabled}
                        volume={planeVolume}
                        onToggle={handleTogglePlaneSound}
                        onVolume={handlePlaneVolume}
                      />

                      <SoundToggleVolumeRow
                        label="دەنگی بەخشین"
                        volumeLabel="قەبارەی دەنگی بەخشین"
                        enabled={giftSoundEnabled}
                        volume={giftVolume}
                        onToggle={handleToggleGiftSound}
                        onVolume={handleGiftVolume}
                      />

                      <SoundToggleVolumeRow
                        label="دەنگی کردنەوەی بۆکسەکان"
                        volumeLabel="قەبارەی دەنگی بۆکسەکان"
                        enabled={chestSoundEnabled}
                        volume={chestVolume}
                        onToggle={handleToggleChestSound}
                        onVolume={handleChestVolume}
                      />

                    </div>

                    {/* ── دۆخی تارمایی ── */}

                    <ProfileSectionHeader icon="visibility_off" color="#c084fc" label="دۆخی تارمایی" />

                    <div className="kd-profile-settings">

                      <SettingRow label="پیشاندانی کەسایەتم لەسەر نەخشە" checked={showMyAvatarOnMap} onChange={handleToggleShowMyAvatarOnMap} />
                      <SettingRow label="وونم بکە کاتێک لەسەر هێڵ نیم" checked={hideWhenOffline} onChange={handleToggleHideWhenOffline} />
                      <SettingRow label="وونکردنی کەسایەتی تر" checked={!showOtherPlayers} onChange={(next) => handleToggleShowOtherPlayers(!next)} />
                      <SettingRow label="وونکردنی چاتی گشتی" checked={hideGlobalChat} onChange={handleToggleHideGlobalChat} />
                      <SettingRow
                        label="ڕێگەدانی نامە هاتن بێ هاوڕێیەتی"
                        checked={allowDmWithoutFriendship}
                        onChange={handleToggleAllowDmWithoutFriendship}
                      />
                      <SettingRow label="داخرانی وەرگرتنی دیاری" checked={blockIncomingGifts} onChange={handleToggleBlockIncomingGifts} />

                    </div>

                    {/* ── هەژمارەکەم ── */}

                    <ProfileSectionHeader icon="person" color="#f87171" label="هەژمارەکەم" />

                    <div className="kd-profile-settings" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                      {!showAvatarStudio ? (
                        <button
                          type="button"
                          onClick={() => setShowAvatarStudio(true)}
                          className="btn-interactive"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            direction: 'rtl',
                            padding: '12px 10px',
                            borderRadius: 14,
                            border: '1px solid rgba(251,191,36,0.5)',
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.22), rgba(180,83,9,0.18))',
                            color: '#fffbeb',
                            fontWeight: 900,
                            fontSize: 12,
                            fontFamily: 'var(--kd-font)',
                          }}
                        >
                          <i className="material-icons" style={{ fontSize: 18, color: '#fbbf24' }}>face</i>
                          دەستکاریکردنی کەسایەتی
                        </button>
                      ) : (
                        <AvatarStudioPanel
                          draft={avatarStudioDraft}
                          cam={avatarStudioCam}
                          saving={avatarStudioSaving}
                          gender={userProfile?.gender === 'female' ? 'female' : 'male'}
                          avatarUrl={userProfile?.avatarUrl ?? null}
                          onCam={setAvatarStudioCam}
                          onChange={setAvatarStudioDraft}
                          onGenderChange={(g) => { void setAvatarStudioGender(g) }}
                          onClose={() => setShowAvatarStudio(false)}
                          onSave={() => { void saveAvatarStudio() }}
                        />
                      )}

                      <button
                        type="button"
                        className="btn-interactive kd-settings-logout"
                        onClick={() => { void handleLogout() }}
                      >
                        چوونەدەرەوە
                      </button>

                    </div>

                    <div

                      onClick={() => {

                        const uid = userIdRef.current

                        if (uid) setActivityArchive(loadActivityArchive(uid))

                        setActiveSheet('activityArchive')

                      }}

                      className="btn-interactive"

                      style={{

                        display: 'flex',

                        alignItems: 'center',

                        gap: 10,

                        direction: 'rtl',

                        background: 'linear-gradient(135deg, rgba(192,132,252,0.12), rgba(8,12,22,0.4))',

                        border: '1px solid rgba(192,132,252,0.35)',

                        borderRadius: 12,

                        padding: '10px 12px',

                        marginTop: 2,

                      }}

                    >

                      <span style={{ fontSize: 18 }}>📜</span>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, textAlign: 'right' }}>

                        <span style={{ fontSize: 11, fontWeight: 900, color: '#e9d5ff' }}>ئەرشیفی بەسەرهاتەکان</span>

                        <span style={{ fontSize: 8, color: '#94a3b8' }}>{activityArchive.length} تۆمار · هەمیشەیی</span>

                      </div>

                      <i className="material-icons" style={{ fontSize: 18, color: '#c084fc' }}>chevron_left</i>

                    </div>

                  </div>

                )}

                {activeSheet === 'activityArchive' && (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                        <span style={{ fontSize: 18 }}>📜</span>

                        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>ئەرشیفی بەسەرهاتەکان</span>

                      </div>

                      <div

                        onClick={() => setActiveSheet('profile')}

                        className="btn-interactive"

                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '4px 8px' }}

                      >

                        <span style={{ fontSize: 8.5, fontWeight: 900, color: '#94a3b8' }}>گەڕانەوە</span>

                      </div>

                    </div>

                    <div style={{ fontSize: 8.5, color: '#64748b', textAlign: 'center', direction: 'rtl' }}>

                      تۆماری هەمیشەیی جووڵەکانت — نوێترینەکان سەرەوە

                    </div>

                    {activityArchive.length === 0 ? (

                      <div style={{ textAlign: 'center', padding: '20px 8px', color: '#64748b', fontSize: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>

                        هێشتا هیچ بەسەرهاتێک تۆمار نەکراوە...

                      </div>

                    ) : (

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '48vh', overflowY: 'auto' }}>

                        {activityArchive.map(entry => (

                          <div

                            key={entry.id}

                            style={{

                              display: 'flex',

                              alignItems: 'flex-start',

                              gap: 8,

                              direction: 'rtl',

                              padding: '8px 10px',

                              background: 'rgba(255,255,255,0.03)',

                              border: '1px solid rgba(255,255,255,0.07)',

                              borderRadius: 11,

                            }}

                          >

                            <span style={{ fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>{entry.icon}</span>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flexGrow: 1, textAlign: 'right' }}>

                              <span style={{ fontSize: 10, fontWeight: 800, color: '#e2e8f0', lineHeight: 1.35 }}>{entry.text}</span>

                              <span style={{ fontSize: 8, fontWeight: 700, color: '#64748b', direction: 'rtl', textAlign: 'right' }}>

                                {formatActivityAt(entry.atMs)}

                              </span>

                            </div>

                          </div>

                        ))}

                      </div>

                    )}

                  </div>

                )}

                {/* تایبەتی — هاب بۆ هاوڕێکان / نامە / دیاری */}

                {activeSheet === 'private' && (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4, direction: 'rtl' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                      <i className="material-icons" style={{ color: '#4ade80', fontSize: 18 }}>lock_person</i>

                      <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>تایبەتی</span>

                    </div>

                    <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 4 }}>

                      {([

                        { key: 'messages' as const, label: 'نامەی تایبەت', icon: 'mail', color: '#00f0ff', badge: dmTotalUnread },

                        { key: 'friends' as const, label: 'هاوڕێکان', icon: 'group', color: '#4ade80', badge: incomingFriendRequests.length },

                        { key: 'gifts' as const, label: 'دیارییەکان', icon: 'card_giftcard', color: '#fbbf24', badge: 0 },

                      ]).map(tab => {

                        const on = privateTab === tab.key

                        return (

                          <div

                            key={tab.key}

                            onClick={() => {

                              if (tab.key === 'messages') {

                                setActiveDmPartner(null)

                                setDmShowEmoji(false)

                                setDmSelectedIds([])

                                setDmDeleteConfirm(false)

                                setDmThreadMenu(null)

                              }

                              if (tab.key === 'friends') {

                                setFriendsTab(incomingFriendRequests.length > 0 ? 'requests' : 'friends')

                              }

                              setPrivateTab(tab.key)

                            }}

                            className="btn-interactive"

                            style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 2px', borderRadius: 10, background: on ? `linear-gradient(135deg, ${tab.color}28, rgba(4,8,18,0.35))` : 'transparent', border: on ? `1px solid ${tab.color}66` : '1px solid transparent' }}

                          >

                            {tab.badge > 0 && (

                              <div style={{ position: 'absolute', top: -4, left: -2, minWidth: 14, height: 14, borderRadius: 7, background: '#ef4444', color: '#fff', fontSize: 7, fontWeight: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 3px', border: '1.5px solid #040812' }}>{tab.badge > 99 ? '99+' : tab.badge}</div>

                            )}

                            <i className="material-icons" style={{ fontSize: 15, color: on ? tab.color : '#94a3b8' }}>{tab.icon}</i>

                            <span style={{ fontSize: 7, fontWeight: 900, color: on ? '#e2e8f0' : '#64748b', textAlign: 'center' }}>{tab.label}</span>

                          </div>

                        )

                      })}

                    </div>

                  </div>

                )}

                {/* هاوڕێکانم — تابی داواکارییەکان / هاوڕێکان / بمدۆزەرەوە / بلۆککراوەکان */}

                {showFriendsPanel && (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {activeSheet !== 'private' && (

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, direction: 'rtl' }}>

                      <i className="material-icons" style={{ color: '#4ade80', fontSize: 18 }}>group</i>

                      <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>هاوڕێکانم</span>

                    </div>

                    )}

                    <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, overflowX: 'auto' }}>

                      <div

                        onClick={() => setFriendsTab('requests')}

                        className="btn-interactive"

                        style={{ flex: 1, minWidth: 58, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '6px 3px', borderRadius: 9, background: friendsTab === 'requests' ? 'linear-gradient(135deg, rgba(0,240,255,0.22), rgba(2,132,199,0.08))' : 'transparent', border: friendsTab === 'requests' ? '1px solid rgba(0,240,255,0.4)' : '1px solid transparent' }}

                      >

                        <i className="material-icons" style={{ fontSize: 13, color: friendsTab === 'requests' ? '#00f0ff' : '#94a3b8' }}>person_add</i>

                        <span style={{ fontSize: 7.5, fontWeight: 900, color: friendsTab === 'requests' ? '#cffafe' : '#94a3b8' }}>داواکاری</span>

                        {incomingFriendRequests.length > 0 && (

                          <div style={{ minWidth: 12, height: 12, borderRadius: 6, background: '#ef4444', color: '#fff', fontSize: 7, fontWeight: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 3px' }}>{incomingFriendRequests.length}</div>

                        )}

                      </div>

                      <div

                        onClick={() => setFriendsTab('friends')}

                        className="btn-interactive"

                        style={{ flex: 1, minWidth: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '6px 3px', borderRadius: 9, background: friendsTab === 'friends' ? 'linear-gradient(135deg, rgba(74,222,128,0.22), rgba(21,128,61,0.08))' : 'transparent', border: friendsTab === 'friends' ? '1px solid rgba(74,222,128,0.4)' : '1px solid transparent' }}

                      >

                        <i className="material-icons" style={{ fontSize: 13, color: friendsTab === 'friends' ? '#4ade80' : '#94a3b8' }}>group</i>

                        <span style={{ fontSize: 7.5, fontWeight: 900, color: friendsTab === 'friends' ? '#bbf7d0' : '#94a3b8' }}>هاوڕێ ({friendsList.length})</span>

                      </div>

                      <div

                        onClick={() => setFriendsTab('find')}

                        className="btn-interactive"

                        style={{ flex: 1, minWidth: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '6px 3px', borderRadius: 9, background: friendsTab === 'find' ? 'linear-gradient(135deg, rgba(251,191,36,0.22), rgba(217,119,6,0.08))' : 'transparent', border: friendsTab === 'find' ? '1px solid rgba(251,191,36,0.4)' : '1px solid transparent' }}

                      >

                        <i className="material-icons" style={{ fontSize: 13, color: friendsTab === 'find' ? '#fbbf24' : '#94a3b8' }}>person_search</i>

                        <span style={{ fontSize: 7.5, fontWeight: 900, color: friendsTab === 'find' ? '#fef08a' : '#94a3b8' }}>بمدۆزەرەوە</span>

                      </div>

                      <div

                        onClick={() => setFriendsTab('blocked')}

                        className="btn-interactive"

                        style={{ flex: 1, minWidth: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '6px 3px', borderRadius: 9, background: friendsTab === 'blocked' ? 'linear-gradient(135deg, rgba(248,113,113,0.22), rgba(153,27,27,0.08))' : 'transparent', border: friendsTab === 'blocked' ? '1px solid rgba(248,113,113,0.4)' : '1px solid transparent' }}

                      >

                        <i className="material-icons" style={{ fontSize: 13, color: friendsTab === 'blocked' ? '#f87171' : '#94a3b8' }}>block</i>

                        <span style={{ fontSize: 7.5, fontWeight: 900, color: friendsTab === 'blocked' ? '#fecaca' : '#94a3b8' }}>بلۆک ({blockedUsersList.length})</span>

                      </div>

                    </div>

                    {friendsTab === 'find' && (

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                        <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>IDی ٨ ژمارەیی یاریزانەکە بنووسە بۆ دۆزینەوەی</div>

                        <div style={{ display: 'flex', gap: 6 }}>

                          <input

                            value={findIdInput}

                            onChange={e => setFindIdInput(e.target.value.replace(/\D/g, '').slice(0, 8))}

                            onKeyDown={e => { if (e.key === 'Enter') handleFindPlayerById() }}

                            placeholder="ID: 84920135"

                            inputMode="numeric"

                            maxLength={8}

                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 10px', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Arial', textAlign: 'center', letterSpacing: 1, outline: 'none' }}

                          />

                          <button

                            onClick={handleFindPlayerById}

                            disabled={findLoading}

                            className="btn-interactive"

                            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(217,119,6,0.2))', border: '1px solid rgba(251,191,36,0.5)', borderRadius: 10, padding: '0 16px', color: '#fef08a', fontWeight: 900, fontSize: 10, opacity: findLoading ? 0.6 : 1 }}

                          >{findLoading ? '...' : 'گەڕان'}</button>

                        </div>

                        {findError && (

                          <div style={{ textAlign: 'center', padding: '8px 6px', color: '#fca5a5', fontSize: 9.5, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10 }}>{findError}</div>

                        )}

                        {findResult && (

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 14 }}>

                            <div style={{ width: 40, height: 40, borderRadius: '50%', boxShadow: '0 0 10px rgba(74,222,128,0.4)', overflow: 'hidden', flexShrink: 0 }}>

                              <HeadShotAvatar

                                sizePx={40}

                                gender={findResult.gender}

                                seed={findResult.uid}

                                avatarUrl={findResult.avatarUrl || avatarForGender(findResult.gender)}

                                avatar3d={findResult.avatar3d}

                              />

                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>

                              <span style={{ color: '#fff', fontSize: 11.5, fontWeight: 900 }}>{findResult.name}{findResult.isPremium ? ' 👑' : ''}</span>

                              <span style={{ fontSize: 8, color: '#64748b', fontFamily: 'Arial' }}>ID: {findResult.playerId}</span>

                            </div>

                            <div

                              onClick={() => handleSendMessageToPlayer(findResult.uid, findResult.name)}

                              className="btn-interactive"

                              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,240,255,0.18)', border: '1px solid rgba(0,240,255,0.45)', borderRadius: 8, padding: '6px 8px', flexShrink: 0 }}

                            >

                              <i className="material-icons" style={{ fontSize: 13, color: '#67e8f9' }}>chat_bubble</i>

                            </div>

                            <div

                              onClick={() => { handleSendFriendRequestToPlayer(findResult.uid, findResult.name); setFindResult(null); setFindIdInput('') }}

                              className="btn-interactive"

                              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.45)', borderRadius: 8, padding: '6px 10px', flexShrink: 0 }}

                            >

                              <i className="material-icons" style={{ fontSize: 13, color: '#bbf7d0' }}>person_add</i>

                              <span style={{ fontSize: 8.5, fontWeight: 900, color: '#bbf7d0' }}>ناردنی هاوڕێیەتی</span>

                            </div>

                          </div>

                        )}

                      </div>

                    )}

                    {friendsTab === 'requests' && (

                      incomingFriendRequests.length === 0 ? (

                        <div style={{ textAlign: 'center', padding: '14px 6px', color: '#64748b', fontSize: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>هیچ داواکارییەکی نوێ نییە...</div>

                      ) : (

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

                          {incomingFriendRequests.map(req => (

                            <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>

                              <i className="material-icons" style={{ fontSize: 18, color: '#4ade80' }}>account_circle</i>

                              <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700, flexGrow: 1 }}>{req.fromName}</span>

                              <div onClick={() => handleAcceptFriendRequest(req)} className="btn-interactive" style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.45)', borderRadius: 8, padding: '4px 8px' }}>

                                <span style={{ fontSize: 8.5, fontWeight: 900, color: '#bbf7d0' }}>پەسەندکردن</span>

                              </div>

                              <div onClick={() => handleDeclineFriendRequest(req)} className="btn-interactive" style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 8, padding: '4px 8px' }}>

                                <span style={{ fontSize: 8.5, fontWeight: 900, color: '#fca5a5' }}>ڕەتکردنەوە</span>

                              </div>

                            </div>

                          ))}

                        </div>

                      )

                    )}

                    {friendsTab === 'friends' && (

                      friendsList.length === 0 ? (

                        <div style={{ textAlign: 'center', padding: '14px 6px', color: '#64748b', fontSize: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>هێشتا هیچ هاوڕێیەکت نییە...</div>

                      ) : (

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

                          {friendsList.map(f => (

                            <div key={f.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>

                              <i className="material-icons" style={{ fontSize: 16, color: '#4ade80' }}>account_circle</i>

                              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>

                                <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700 }}>{f.name}</span>

                                {f.playerId && <span style={{ fontSize: 7, color: '#64748b', fontFamily: 'Arial' }}>ID: {f.playerId}</span>}

                              </div>

                              <div onClick={() => { setActiveDmPartner({ uid: f.uid, name: f.name }); setDmShowEmoji(false); setDmSelectedIds([]); setDmDeleteConfirm(false); setPrivateTab('messages'); setActiveSheet('private') }} className="btn-interactive" style={{ background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.4)', borderRadius: 8, padding: '4px 6px', flexShrink: 0 }}>

                                <i className="material-icons" style={{ fontSize: 13, color: '#00f0ff' }}>chat_bubble</i>

                              </div>

                              <div onClick={() => handleUnfriend(f)} className="btn-interactive" style={{ background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.4)', borderRadius: 8, padding: '4px 6px', flexShrink: 0 }}>

                                <i className="material-icons" style={{ fontSize: 13, color: '#cbd5e1' }}>person_remove</i>

                              </div>

                              <div onClick={() => handleBlockFriend(f)} className="btn-interactive" style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 8, padding: '4px 6px', flexShrink: 0 }}>

                                <i className="material-icons" style={{ fontSize: 13, color: '#f87171' }}>block</i>

                              </div>

                            </div>

                          ))}

                        </div>

                      )

                    )}

                    {friendsTab === 'blocked' && (

                      blockedUsersList.length === 0 ? (

                        <div style={{ textAlign: 'center', padding: '14px 6px', color: '#64748b', fontSize: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>هیچ یاریزانێکت بلۆک نەکردووە...</div>

                      ) : (

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

                          {blockedUsersList.map(b => (

                            <div key={b.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12 }}>

                              <i className="material-icons" style={{ fontSize: 16, color: '#f87171' }}>account_circle</i>

                              <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700, flexGrow: 1 }}>{b.name}</span>

                              <div onClick={() => handleUnblockPlayer(b)} className="btn-interactive" style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 8, padding: '4px 8px' }}>

                                <span style={{ fontSize: 9, fontWeight: 900, color: '#4ade80' }}>لابردنی بلۆک</span>

                              </div>

                            </div>

                          ))}

                        </div>

                      )

                    )}

                  </div>

                )}

                {/* دیارییەکان — مێژووی دیارییە وەرگیراوەکان */}

                {showGiftsPanel && (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {activeSheet !== 'private' && (

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, direction: 'rtl' }}>

                      <i className="material-icons" style={{ color: '#fbbf24', fontSize: 18 }}>card_giftcard</i>

                      <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>دیارییەکان 🎁 ({giftsLogList.length})</span>

                    </div>

                    )}

                    {giftsLogList.length === 0 ? (

                      <div style={{ textAlign: 'center', padding: '10px 6px', color: '#64748b', fontSize: 10 }}>هێشتا هیچ دیاریەکت وەرنەگرتووە...</div>

                    ) : (

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

                        {giftsLogList.map((g, i) => (

                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12 }}>

                            <span style={{ fontSize: 18 }}>🎁</span>

                            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>

                              <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700 }}>{g.fromName}</span>

                              <span style={{ color: '#64748b', fontSize: 8 }}>{new Date(g.atMs).toLocaleString('en-GB')}</span>

                            </div>

                            <span style={{ color: '#fde68a', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }}>+{g.amount.toLocaleString()} ئەڵماس</span>

                          </div>

                        ))}

                      </div>

                    )}

                  </div>

                )}

                {/* نامەی تایبەت — شێوازی مێسەنجەر */}

                {showMessagesPanel && (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', position: 'relative', direction: 'rtl' }}>

                    <input

                      ref={dmImageInputRef}

                      type="file"

                      accept="image/*,video/*,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.heic,.mp4,.webm,.mov"

                      style={{ display: 'none' }}

                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) {
                          if (f.type.startsWith('video/')) void handleSendDmVideo(f)
                          else void handleSendDmImage(f)
                        }
                        e.target.value = ''
                      }}

                    />

                    {!activeDmPartner ? (

                      <>

                        {activeSheet !== 'private' && (

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                          <i className="material-icons" style={{ color: '#00f0ff', fontSize: 18 }}>mail</i>

                          <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>نامەی تایبەت</span>

                          {dmTotalUnread > 0 && (

                            <span style={{ marginRight: 'auto', minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 5px' }}>{dmTotalUnread > 99 ? '99+' : dmTotalUnread}</span>

                          )}

                        </div>

                        )}

                        <div style={{ fontSize: 8.5, color: '#64748b', textAlign: 'center' }}>دەتوانیت بۆ هەر یاریزانێک نامە بنێریت — تەنانەت بەبێ هاوڕێیەتی</div>

                        {dmThreads.length === 0 ? (

                          <div style={{ textAlign: 'center', padding: '10px 6px', color: '#64748b', fontSize: 10 }}>هێشتا هیچ گفتوگۆیەکت نییە...</div>

                        ) : (

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

                            {dmThreads.map(t => (

                              <div

                                key={t.id}

                                onClick={() => {

                                  if (dmLongPressFiredRef.current) { dmLongPressFiredRef.current = false; return }

                                  if (dmThreadMenu) return

                                  setActiveDmPartner({ uid: t.otherUid, name: t.otherName })

                                  setDmShowEmoji(false)

                                  setDmSelectedIds([])

                                  setDmDeleteConfirm(false)

                                  setDmThreadMenu(null)

                                }}

                                onContextMenu={e => { e.preventDefault(); setDmThreadMenu(t) }}

                                onTouchStart={() => {

                                  dmLongPressFiredRef.current = false

                                  if (dmLongPressTimerRef.current) clearTimeout(dmLongPressTimerRef.current)

                                  dmLongPressTimerRef.current = setTimeout(() => {

                                    dmLongPressFiredRef.current = true

                                    setDmThreadMenu(t)

                                  }, 480)

                                }}

                                onTouchEnd={() => { if (dmLongPressTimerRef.current) { clearTimeout(dmLongPressTimerRef.current); dmLongPressTimerRef.current = null } }}

                                onTouchMove={() => { if (dmLongPressTimerRef.current) { clearTimeout(dmLongPressTimerRef.current); dmLongPressTimerRef.current = null } }}

                                className="btn-interactive"

                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 9px', background: t.pinned ? 'rgba(251,191,36,0.08)' : 'rgba(0,240,255,0.06)', border: `1px solid ${t.pinned ? 'rgba(251,191,36,0.35)' : 'rgba(0,240,255,0.25)'}`, borderRadius: 12 }}

                              >

                                {(() => {

                                  const loc = onlinePlayersRef.current.get(t.otherUid)

                                  return (

                                    <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1px solid ${t.pinned ? 'rgba(251,191,36,0.45)' : 'rgba(0,240,255,0.35)'}` }}>

                                      <HeadShotAvatar

                                        sizePx={36}

                                        gender={loc?.gender}

                                        seed={t.otherUid}

                                        avatarUrl={loc?.avatarUrl || avatarForGender(loc?.gender)}

                                        skin={loc?.skinId != null ? COSMETIC_BY_ID[loc.skinId] ?? null : null}

                                        border={loc?.borderId != null ? COSMETIC_BY_ID[loc.borderId] ?? null : null}

                                        avatar3d={loc?.avatar3d ? normalizeAvatar3d(loc.avatar3d) : null}

                                      />

                                    </div>

                                  )

                                })()}

                                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>

                                  <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 900 }}>{t.otherName}</span>

                                  <span style={{ color: '#94a3b8', fontSize: 8.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.lastMessage}</span>

                                </div>

                                {t.unreadCount > 0 && !mutedChatUids.includes(t.otherUid) && (

                                  <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 5px', flexShrink: 0 }}>{t.unreadCount > 99 ? '99+' : t.unreadCount}</span>

                                )}

                              </div>

                            ))}

                          </div>

                        )}

                        {dmThreadMenu && (

                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,8,18,0.82)', borderRadius: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, zIndex: 6 }}>

                            <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{dmThreadMenu.otherName}</div>

                            <button

                              type="button"

                              onClick={() => {

                                const myUid = userIdRef.current

                                if (!myUid) return

                                void setDmThreadPinned(myUid, dmThreadMenu.otherUid, !dmThreadMenu.pinned).then(() => setDmThreadMenu(null)).catch(() => showGameAlert({ message: '❌ نەتوانرا پین بکرێت' }))

                              }}

                              className="btn-interactive"

                              style={{ width: '100%', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.45)', borderRadius: 10, padding: '10px 8px', color: '#fde68a', fontWeight: 900, fontSize: 11, fontFamily: 'var(--kd-font)' }}

                            >📌 {dmThreadMenu.pinned ? 'لابردنی پین' : 'پینکردن'}</button>

                            <button

                              type="button"

                              onClick={() => {

                                const myUid = userIdRef.current

                                if (!myUid) return

                                const muted = mutedChatUids.includes(dmThreadMenu.otherUid)

                                void setChatMuted(myUid, dmThreadMenu.otherUid, !muted)

                                  .then(() => setDmThreadMenu(null))

                                  .catch(() => showGameAlert({ message: '❌ نەتوانرا Mute بکرێت' }))

                              }}

                              className="btn-interactive"

                              style={{ width: '100%', background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.4)', borderRadius: 10, padding: '10px 8px', color: '#e2e8f0', fontWeight: 900, fontSize: 11, fontFamily: 'var(--kd-font)' }}

                            >{mutedChatUids.includes(dmThreadMenu.otherUid) ? '🔔 لابردنی سڕکردن' : '🔕 سڕکردنی نامە'}</button>

                            <button

                              type="button"

                              onClick={async () => {

                                const myUid = userIdRef.current

                                if (!myUid) return

                                if (!await showGameConfirm({ message: 'دڵنیایت لە سڕینەوەی ئەم گفتوگۆیە لە لیستەکەت؟ (نامەکان دەمێننەوە)' })) return

                                void hideDmThreadForUser(myUid, dmThreadMenu.otherUid).then(() => setDmThreadMenu(null)).catch(() => showGameAlert({ message: '❌ نەتوانرا بسڕدرێتەوە' }))

                              }}

                              className="btn-interactive"

                              style={{ width: '100%', background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.45)', borderRadius: 10, padding: '10px 8px', color: '#fecaca', fontWeight: 900, fontSize: 11, fontFamily: 'var(--kd-font)' }}

                            >🗑️ سڕینەوە</button>

                            <button type="button" onClick={() => setDmThreadMenu(null)} className="btn-interactive" style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px', color: '#94a3b8', fontWeight: 800, fontSize: 9, fontFamily: 'var(--kd-font)' }}>پاشگەزبوونەوە</button>

                          </div>

                        )}

                      </>

                    ) : (

                      <>

                        {dmSelectedIds.length > 0 ? (

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 10, padding: '6px 8px' }}>

                            <span style={{ fontSize: 11, fontWeight: 900, color: '#67e8f9' }}>دیاریکردن ({dmSelectedIds.length})</span>

                            <div style={{ marginRight: 'auto', display: 'flex', gap: 6 }}>

                              <button type="button" onClick={() => setDmDeleteConfirm(true)} className="btn-interactive" style={{ background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.45)', borderRadius: 8, padding: '5px 10px', color: '#fecaca', fontWeight: 900, fontSize: 10, fontFamily: 'var(--kd-font)' }}>سڕینەوە</button>

                              <button type="button" onClick={() => { setDmSelectedIds([]); setDmDeleteConfirm(false) }} className="btn-interactive" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 8px', color: '#94a3b8', fontWeight: 800, fontSize: 9, fontFamily: 'var(--kd-font)' }}>هەڵوەشاندنەوە</button>

                            </div>

                          </div>

                        ) : (

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                            <div onClick={() => { setActiveDmPartner(null); setDmShowEmoji(false); setDmSelectedIds([]); setDmDeleteConfirm(false) }} className="btn-interactive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}>

                              <i className="material-icons" style={{ fontSize: 15, color: '#fff' }}>arrow_forward</i>

                            </div>

                            {(() => {

                              const loc = onlinePlayersRef.current.get(activeDmPartner.uid)

                              return (

                                <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>

                                  <HeadShotAvatar

                                    sizePx={28}

                                    gender={loc?.gender}

                                    seed={activeDmPartner.uid}

                                    avatarUrl={loc?.avatarUrl || avatarForGender(loc?.gender)}

                                    skin={loc?.skinId != null ? COSMETIC_BY_ID[loc.skinId] ?? null : null}

                                    border={loc?.borderId != null ? COSMETIC_BY_ID[loc.borderId] ?? null : null}

                                    avatar3d={loc?.avatar3d ? normalizeAvatar3d(loc.avatar3d) : null}

                                  />

                                </div>

                              )

                            })()}

                            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{activeDmPartner.name}</span>

                            {mutedChatUids.includes(activeDmPartner.uid) && (

                              <span style={{ fontSize: 8, fontWeight: 900, color: '#cbd5e1', background: 'rgba(148,163,184,0.18)', border: '1px solid rgba(148,163,184,0.35)', borderRadius: 6, padding: '1px 6px' }}>سڕکراو</span>

                            )}

                            <button

                              type="button"

                              onClick={() => {

                                const myUid = userIdRef.current

                                if (!myUid || !activeDmPartner) return

                                const muted = mutedChatUids.includes(activeDmPartner.uid)

                                void setChatMuted(myUid, activeDmPartner.uid, !muted)

                                  .catch(() => showGameAlert({ message: '❌ نەتوانرا Mute بکرێت' }))

                              }}

                              className="btn-interactive"

                              style={{ marginRight: 'auto', background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.35)', borderRadius: 8, padding: '4px 8px', color: '#e2e8f0', fontWeight: 900, fontSize: 8.5, fontFamily: 'var(--kd-font)' }}

                            >{mutedChatUids.includes(activeDmPartner.uid) ? 'لابردنی سڕ' : 'سڕکردنی نامە'}</button>

                            {dmSendingMedia && <span style={{ fontSize: 8, color: '#67e8f9' }}>ناردن...</span>}

                          </div>

                        )}

                        <div ref={dmChatScrollRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>

                          {dmMessages.length === 0 ? (

                            <div style={{ textAlign: 'center', padding: '10px 6px', color: '#64748b', fontSize: 10 }}>یەکەم نامەت بنێرە...</div>

                          ) : dmMessages.map(m => {

                            const mine = m.from === authUserId

                            const selected = dmSelectedIds.includes(m.id)

                            if (m.kind === 'system') {

                              return (

                                <div

                                  key={m.id}

                                  style={{

                                    alignSelf: 'center',

                                    maxWidth: '92%',

                                    background: 'rgba(251,191,36,0.1)',

                                    border: '1px solid rgba(251,191,36,0.35)',

                                    borderRadius: 10,

                                    padding: '7px 10px',

                                    textAlign: 'center',

                                  }}

                                >

                                  <div style={{ fontSize: 9, color: '#fde68a', lineHeight: 1.45, fontWeight: 800 }}>{m.text}</div>

                                </div>

                              )

                            }

                            return (

                              <div

                                key={m.id}

                                onClick={() => toggleDmMessageSelect(m.id)}

                                className="btn-interactive"

                                style={{

                                  alignSelf: mine ? 'flex-start' : 'flex-end',

                                  maxWidth: '85%',

                                  background: selected ? 'rgba(0,240,255,0.28)' : (mine ? 'rgba(0,240,255,0.18)' : 'rgba(255,255,255,0.06)'),

                                  border: `1.5px solid ${selected ? 'rgba(0,240,255,0.75)' : (mine ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.12)')}`,

                                  borderRadius: 12,

                                  padding: '6px 10px',

                                  minWidth: 0,

                                }}

                              >

                                {m.kind === 'image' && m.mediaUrl ? (

                                  <div style={{ position: 'relative', width: 'min(220px, 72vw)', maxWidth: 220 }}>

                                    <img

                                      src={m.mediaUrl}

                                      alt="وێنە"

                                      loading="eager"

                                      decoding="async"

                                      onClick={e => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        if (m.mediaUrl && (dmMediaProgress[m.id] == null || dmMediaProgress[m.id] >= 100)) {
                                          setDmLightboxUrl(m.mediaUrl)
                                        }
                                      }}

                                      onError={e => {
                                        const el = e.currentTarget
                                        el.style.opacity = '0.35'
                                        el.alt = 'وێنە بارنەبوو'
                                      }}

                                      style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 10, cursor: 'pointer', display: 'block', background: 'rgba(0,0,0,0.35)' }}

                                    />

                                    {typeof dmMediaProgress[m.id] === 'number' && dmMediaProgress[m.id] < 100 && (

                                      <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'rgba(2,6,18,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, pointerEvents: 'none' }}>

                                        <div style={{ fontSize: 14, fontWeight: 900, color: '#67e8f9', direction: 'ltr' }}>{Math.max(0, Math.min(99, dmMediaProgress[m.id]))}%</div>

                                        <div style={{ width: '72%', height: 5, borderRadius: 5, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>

                                          <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, dmMediaProgress[m.id]))}%`, background: 'linear-gradient(90deg, #22d3ee, #67e8f9)', transition: 'width 100ms linear' }} />

                                        </div>

                                      </div>

                                    )}

                                  </div>

                                ) : m.kind === 'image' ? (

                                  <div style={{ fontSize: 10, color: '#94a3b8' }}>📷 وێنە (بارنەبوو)</div>

                                ) : m.kind === 'video' && m.mediaUrl ? (

                                  <video

                                    src={m.mediaUrl}

                                    controls

                                    playsInline

                                    onClick={e => e.stopPropagation()}

                                    style={{ width: 180, maxHeight: 220, borderRadius: 8, display: 'block', background: '#000' }}

                                  />

                                ) : m.kind === 'audio' && m.mediaUrl ? (

                                  <audio
                                    controls
                                    preload="metadata"
                                    playsInline
                                    src={m.mediaUrl}
                                    onClick={e => e.stopPropagation()}
                                    style={{ width: 196, height: 36, outline: 'none', borderRadius: 8 }}
                                  />

                                ) : (

                                  <div style={{ fontSize: 10, color: '#e2e8f0', lineHeight: 1.4, wordBreak: 'break-word' }}>{m.text}</div>

                                )}

                                {mine && (

                                  <div style={{ fontSize: 8, fontWeight: 800, color: m.status === 'seen' ? '#67e8f9' : '#94a3b8', marginTop: 3, textAlign: 'left', direction: 'ltr' }}>

                                    {m.status === 'seen' ? 'بینرا' : m.status === 'delivered' ? '✔️✔️' : '✔️'}

                                  </div>

                                )}

                              </div>

                            )

                          })}

                          <div ref={dmChatEndRef} aria-hidden="true" style={{ height: 1, width: '100%', flexShrink: 0 }} />

                        </div>

                        {dmShowEmoji && (

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 6 }}>

                            {DM_EMOJI_LIST.map(em => (

                              <div key={em} onClick={() => setDmInput(prev => prev + em)} className="btn-interactive" style={{ fontSize: 14, textAlign: 'center', padding: 2 }}>{em}</div>

                            ))}

                          </div>

                        )}

                        <div style={{ display: 'flex', gap: 4, marginTop: 2, alignItems: 'center', position: 'relative' }}>

                          <div key="dm-tools" style={{ display: 'flex', gap: 4, flexShrink: 0, width: dmRecording ? 36 : 68, justifyContent: 'flex-start' }}>
                            {!dmRecording ? (
                              <>
                                <div onClick={() => setDmShowEmoji(v => !v)} className="btn-interactive" style={{ width: 32, height: 32, borderRadius: 8, background: dmShowEmoji ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                  <i className="material-icons" style={{ fontSize: 16, color: '#fde68a' }}>emoji_emotions</i>
                                </div>
                                <div onClick={() => { if (!dmSendingMedia) dmImageInputRef.current?.click() }} className="btn-interactive" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, opacity: dmSendingMedia ? 0.5 : 1 }}>
                                  <i className="material-icons" style={{ fontSize: 16, color: '#67e8f9' }}>photo_library</i>
                                </div>
                              </>
                            ) : dmVoiceLocked ? (
                              <div
                                onClick={e => { e.stopPropagation(); handleDmVoiceTrash() }}
                                className="btn-interactive"
                                title="سڕینەوە"
                                style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                              >
                                <i className="material-icons" style={{ fontSize: 18, color: '#fca5a5' }}>delete</i>
                              </div>
                            ) : null}
                          </div>

                          <div key="dm-main" style={{ flex: 1, minWidth: 0 }}>
                            {dmRecording ? (
                              <div
                                style={{
                                  height: 36,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '0 8px',
                                  background: dmVoiceCancelArmed
                                    ? 'rgba(248,113,113,0.22)'
                                    : 'rgba(239,68,68,0.12)',
                                  border: `1px solid ${dmVoiceCancelArmed ? 'rgba(248,113,113,0.65)' : 'rgba(239,68,68,0.35)'}`,
                                  borderRadius: 12,
                                  overflow: 'hidden',
                                }}
                              >
                                <span style={{ fontSize: 10, fontWeight: 900, color: '#fecaca', direction: 'ltr', minWidth: 34, fontVariantNumeric: 'tabular-nums' }}>
                                  {`${Math.floor(dmVoiceSeconds / 60)}:${String(dmVoiceSeconds % 60).padStart(2, '0')}`}
                                </span>
                                <div style={{ flex: 1, minWidth: 0, height: 28, display: 'flex', alignItems: 'center', gap: 2 }}>
                                  {(dmVoiceLevels || []).map((lvl: number, i: number) => (
                                    <span
                                      key={i}
                                      style={{
                                        flex: 1,
                                        minWidth: 2,
                                        height: `${Math.round(8 + lvl * 18)}px`,
                                        borderRadius: 2,
                                        background: dmVoiceCancelArmed ? '#f87171' : (i % 3 === 0 ? '#f87171' : '#fb7185'),
                                        opacity: 0.75 + lvl * 0.25,
                                        transition: 'height 50ms linear',
                                      }}
                                    />
                                  ))}
                                </div>
                                <span style={{ fontSize: 8, fontWeight: 800, color: dmVoiceCancelArmed ? '#fecaca' : '#94a3b8', whiteSpace: 'nowrap' }}>
                                  {dmVoiceCancelArmed
                                    ? 'پەشیمانبوونەوە'
                                    : dmVoiceHint === 'lock'
                                      ? '↑ قفڵ'
                                      : dmVoiceLocked
                                        ? 'تۆمارکردن...'
                                        : '← پەشیمان · ↑ قفڵ'}
                                </span>
                              </div>
                            ) : (
                              <input
                                value={dmInput}
                                onChange={e => setDmInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendDmMessage()
                                  }
                                }}
                                placeholder="پەیامێک بنووسە..."
                                disabled={dmSendingMedia}
                                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 10px', color: '#fff', fontSize: 10, fontFamily: 'var(--kd-font)', outline: 'none' }}
                              />
                            )}
                          </div>

                          <div key="dm-action" style={{ flexShrink: 0, minWidth: 40, display: 'flex', justifyContent: 'center' }}>
                            {dmRecording && dmVoiceLocked ? (
                              <div
                                onClick={e => { e.stopPropagation(); handleDmVoiceSendLocked() }}
                                className="btn-interactive"
                                title="ناردن"
                                style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(145deg, #25d366, #128c7e)', border: '1px solid rgba(37,211,102,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 10px rgba(37,211,102,0.35)' }}
                              >
                                <i className="material-icons" style={{ fontSize: 20, color: '#fff' }}>send</i>
                              </div>
                            ) : !dmRecording && dmInput.trim() ? (
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); handleSendDmMessage() }}
                                className="btn-interactive"
                                style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.3), rgba(2,132,199,0.2))', border: '1px solid rgba(0,240,255,0.5)', borderRadius: 10, padding: '0 12px', height: 32, color: '#cffafe', fontWeight: 900, fontSize: 10, fontFamily: 'var(--kd-font)' }}
                              >ناردن</button>
                            ) : (
                              <div
                                onPointerDown={handleDmVoicePointerDown}
                                onPointerMove={handleDmVoicePointerMove}
                                onPointerUp={handleDmVoicePointerUp}
                                onPointerCancel={handleDmVoicePointerCancel}
                                onContextMenu={e => e.preventDefault()}
                                className="btn-interactive kd-dm-mic-btn"
                                title={dmRecording ? 'بەردەست بهێڵە بۆ تۆمار' : 'دایگرە بۆ تۆماری دەنگ'}
                                style={{
                                  width: dmRecording ? 44 : 36,
                                  height: dmRecording ? 44 : 36,
                                  borderRadius: '50%',
                                  background: dmRecording
                                    ? (dmVoiceCancelArmed ? 'rgba(248,113,113,0.45)' : 'linear-gradient(145deg, #ef4444, #b91c1c)')
                                    : 'linear-gradient(145deg, #25d366, #128c7e)',
                                  border: dmRecording
                                    ? `2px solid ${dmVoiceCancelArmed ? '#fca5a5' : '#fecaca'}`
                                    : '1px solid rgba(37,211,102,0.65)',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  touchAction: 'none',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  boxShadow: dmRecording
                                    ? '0 0 0 6px rgba(239,68,68,0.18)'
                                    : '0 2px 8px rgba(37,211,102,0.3)',
                                  transform: dmRecording ? 'scale(1.06)' : undefined,
                                  transition: 'transform 80ms ease, background 80ms ease',
                                  cursor: 'pointer',
                                }}
                              >
                                <i className="material-icons" style={{ fontSize: dmRecording ? 22 : 18, color: '#fff', pointerEvents: 'none' }}>
                                  {dmVoiceCancelArmed ? 'delete' : 'mic'}
                                </i>
                              </div>
                            )}
                          </div>

                        </div>

                        {dmDeleteConfirm && (

                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,8,18,0.82)', borderRadius: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 16, zIndex: 5 }}>

                            <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.5 }}>تەنها لەلای خۆت بسڕێتەوە یان لەلای کەسی بەرانبەریش؟</div>

                            <div style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center' }}>نامە لە داتابەیس دەمێنێتەوە — تەنها لە بینین دەشاردرێتەوە ({dmSelectedIds.length})</div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>

                              <button type="button" onClick={() => { void handleConfirmHideDmMessages(false) }} className="btn-interactive" style={{ background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.4)', borderRadius: 10, padding: '10px 8px', color: '#e2e8f0', fontWeight: 900, fontSize: 10, fontFamily: 'var(--kd-font)' }}>تەنها لەلای خۆم</button>

                              <button type="button" onClick={() => { void handleConfirmHideDmMessages(true) }} className="btn-interactive" style={{ background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.45)', borderRadius: 10, padding: '10px 8px', color: '#fecaca', fontWeight: 900, fontSize: 10, fontFamily: 'var(--kd-font)' }}>لەلای هەردووکمان</button>

                              <button type="button" onClick={() => setDmDeleteConfirm(false)} className="btn-interactive" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px', color: '#94a3b8', fontWeight: 800, fontSize: 9, fontFamily: 'var(--kd-font)' }}>پاشگەزبوونەوە</button>

                            </div>

                          </div>

                        )}

                      </>

                    )}

                    {dmLightboxUrl && createPortal(
                      <div
                        onClick={() => setDmLightboxUrl(null)}
                        style={{
                          position: 'fixed',
                          inset: 0,
                          zIndex: 300000,
                          background: 'rgba(0,0,0,0.92)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 16,
                          direction: 'rtl',
                        }}
                      >
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setDmLightboxUrl(null) }}
                          className="btn-interactive"
                          style={{
                            position: 'absolute',
                            top: 'calc(12px + env(safe-area-inset-top, 0px))',
                            left: 12,
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 10,
                            padding: '8px 12px',
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: 12,
                            fontFamily: 'var(--kd-font)',
                          }}
                        >داخستن</button>
                        <img
                          src={dmLightboxUrl}
                          alt="وێنە"
                          onClick={e => e.stopPropagation()}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '88vh',
                            borderRadius: 12,
                            objectFit: 'contain',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
                          }}
                        />
                      </div>,
                      document.body,
                    )}

                  </div>

                )}

                {/* ڕێڕەوی کوردستان — یەک جۆر · ناوی چیا هەر ٢ مانگ */}

                {activeSheet === 'premium' && (() => {

                  const sp = normalizeMissions(seasonPass)

                  const masterUi = masterMissionsForUi()

                  const kurdSeason = getKurdistanSeasonInfo(new Date(passNowMs))

                  const renderMissionRow = (m: (typeof RP_MISSIONS)[number], goldTone: boolean) => {

                    const prog = sp.missions[m.id] ?? { progress: 0, claimed: false, periodKey: '' }

                    const done = prog.progress >= m.target

                    return (

                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: goldTone ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${goldTone ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12 }}>

                        <div style={{ flexGrow: 1, textAlign: 'right' }}>

                          <div style={{ fontSize: 10.5, fontWeight: 900, color: '#fff' }}>{m.title}</div>

                          <div style={{ fontSize: 8, color: '#94a3b8' }}>{m.desc}</div>

                          <div style={{ marginTop: 5, height: 5, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>

                            <div style={{ width: `${Math.min(100, (prog.progress / m.target) * 100)}%`, height: '100%', background: goldTone ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#00f0ff,#38bdf8)' }} />

                          </div>

                          <div style={{ fontSize: 7.5, color: '#64748b', marginTop: 2, direction: 'rtl', textAlign: 'left' }}>{Math.min(prog.progress, m.target)}/{m.target}</div>

                        </div>

                        <button

                          type="button"

                          disabled={!done || prog.claimed}

                          onClick={() => claimRpMission(m.id)}

                          className="btn-interactive"

                          style={{

                            flexShrink: 0, padding: '8px 10px', borderRadius: 9, fontSize: 8.5, fontWeight: 900, fontFamily: 'var(--kd-font)',

                            background: prog.claimed ? 'rgba(34,197,94,0.15)' : done ? (goldTone ? 'rgba(251,191,36,0.22)' : 'rgba(0,240,255,0.2)') : 'rgba(255,255,255,0.04)',

                            border: `1px solid ${prog.claimed ? 'rgba(34,197,94,0.4)' : done ? (goldTone ? 'rgba(251,191,36,0.45)' : 'rgba(0,240,255,0.45)') : 'rgba(255,255,255,0.1)'}`,

                            color: prog.claimed ? '#86efac' : done ? (goldTone ? '#fef08a' : '#cffafe') : '#64748b',

                          }}

                        >{prog.claimed ? '✓' : 'جێبەجێم کرد'}</button>

                      </div>

                    )

                  }

                  const renderSocialDash = (kind: 'tiktok' | 'facebook') => {

                    const def = PASS_DEFS[kind]

                    const pass = vipPasses[kind]

                    const cool = msUntilSocialSubmit(pass, passNowMs)

                    const day = passDayNumber(pass.purchasedAtMs, passNowMs)

                    const pct = Math.round((pass.completedDays / PASS_DURATION_DAYS) * 100)

                    if (!pass.owned) {

                      return (

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                          <button type="button" onClick={() => setPassView('picker')} className="btn-interactive" style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#94a3b8', fontSize: 9, fontWeight: 800, fontFamily: 'var(--kd-font)' }}>← گەڕانەوە</button>

                          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{def.title}</div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>

                            {[

                              { k: 'نرخ', v: def.priceLabel },

                              { k: 'ماوە', v: def.durationLabel },

                              { k: 'خەڵات', v: def.rewardLabel },

                            ].map(chip => (

                              <div key={chip.k} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 12, background: `${def.accent}14`, border: `1px solid ${def.accent}44` }}>

                                <div style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 800 }}>{chip.k}</div>

                                <div style={{ fontSize: 10, fontWeight: 900, color: def.accent, marginTop: 2 }}>{chip.v}</div>

                              </div>

                            ))}

                          </div>

                          <div style={{ padding: 11, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: `1px solid ${def.accent}33`, direction: 'rtl' }}>

                            <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', marginBottom: 6 }}>✨ سوودەکان</div>

                            {def.benefits.map(b => (

                              <div key={b} style={{ fontSize: 9, color: '#cbd5e1', lineHeight: 1.55, marginBottom: 4 }}>• {b}</div>

                            ))}

                          </div>

                          <div style={{ padding: 11, borderRadius: 14, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)', direction: 'rtl' }}>

                            <div style={{ fontSize: 10, fontWeight: 900, color: '#fecaca', marginBottom: 6 }}>📋 یاساکان</div>

                            {def.rules.map(r => (

                              <div key={r} style={{ fontSize: 9, color: '#e2e8f0', lineHeight: 1.55, marginBottom: 4 }}>• {r}</div>

                            ))}

                          </div>

                          <button type="button" onClick={() => buyVipPass(kind)} className="btn-interactive" style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.28), rgba(2,80,120,0.3))', border: '1px solid rgba(0,240,255,0.45)', borderRadius: 12, padding: '12px', color: '#cffafe', fontSize: 11, fontWeight: 900, fontFamily: 'var(--kd-font)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>

                            کڕین بە {def.diamondCost} ئەڵماس <DiamondIcon size={14} />

                          </button>

                        </div>

                      )

                    }

                    return (

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                        <button type="button" onClick={() => setPassView('picker')} className="btn-interactive" style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#94a3b8', fontSize: 9, fontWeight: 800, fontFamily: 'var(--kd-font)' }}>← گەڕانەوە</button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl' }}>

                          <div>

                            <div style={{ fontSize: 8, color: def.accent, fontWeight: 800 }}>چالاکە</div>

                            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{def.title}</div>

                          </div>

                          <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '6px 10px', border: `1px solid ${def.accent}55` }}>

                            <div style={{ fontSize: 7.5, color: '#94a3b8' }}>ڕۆژ</div>

                            <div style={{ fontSize: 15, fontWeight: 900, color: def.accent }}>{pass.completedDays}<span style={{ fontSize: 9, color: '#64748b' }}>/{PASS_DURATION_DAYS}</span></div>

                          </div>

                        </div>

                        <div style={{ height: 8, borderRadius: 8, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>

                          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${def.accent}, #38bdf8)`, transition: 'width 0.35s' }} />

                        </div>

                        <div style={{ fontSize: 8, color: '#94a3b8', direction: 'rtl' }}>ڕۆژی تێپەڕبوو: {day}/{PASS_DURATION_DAYS} · خەڵاتی کۆتایی: {SOCIAL_FINAL_DIAMOND.toLocaleString()} ئەڵماس</div>

                        <div style={{ fontSize: 9, color: '#cbd5e1', lineHeight: 1.45, direction: 'rtl' }}>

                          هەر ڕۆژێک پۆستێک لەسەر یارییەکە بڵاوبکەرەوە، لینکەکە دابنێ و <b style={{ color: '#fff' }}>جێبەجێم کرد</b> دابگرە. لینکی دووبارە قەدەغەیە — دوای ٣ هەوڵ ڕۆژەکان دەگەڕێنەوە بۆ ٠.

                        </div>

                        <input

                          value={socialLinkInput}

                          onChange={e => setSocialLinkInput(e.target.value)}

                          placeholder={kind === 'tiktok' ? 'لینکی پۆستی تیک‌تۆک…' : 'لینکی پۆستی فەیسبووک…'}

                          dir="ltr"

                          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 11, fontFamily: 'Arial, sans-serif', outline: 'none' }}

                        />

                        <button

                          type="button"

                          onClick={() => { void handleSocialSubmit(kind) }}

                          className="btn-interactive"

                          style={{

                            background: cool > 0

                              ? 'rgba(34,197,94,0.18)'

                              : 'linear-gradient(135deg, rgba(0,240,255,0.28), rgba(2,80,120,0.28))',

                            border: `1px solid ${cool > 0 ? 'rgba(34,197,94,0.45)' : 'rgba(0,240,255,0.45)'}`,

                            borderRadius: 12, padding: '12px', fontWeight: 900, fontSize: 11,

                            color: cool > 0 ? '#86efac' : '#cffafe',

                            fontFamily: 'var(--kd-font)',

                          }}

                        >

                          {cool > 0 ? `دەستخۆشی · چاوەڕێ ${formatCountdownKu(cool)}` : 'جێبەجێم کرد'}

                        </button>

                        {pass.completedDays >= PASS_DURATION_DAYS && !pass.finalRewardClaimed && (

                          <button type="button" onClick={() => handleClaimSocialFinal(kind)} className="btn-interactive" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(21,128,61,0.25))', border: '1px solid rgba(34,197,94,0.5)', borderRadius: 12, padding: '12px', color: '#bbf7d0', fontSize: 11, fontWeight: 900, fontFamily: 'var(--kd-font)' }}>

                            وەرگرتنی {SOCIAL_FINAL_DIAMOND.toLocaleString()} ئەڵماس

                          </button>

                        )}

                        {pass.finalRewardClaimed && (

                          <div style={{ textAlign: 'center', fontSize: 10, color: '#86efac', fontWeight: 900 }}>✓ خەڵاتی کۆتایی وەرگیرا</div>

                        )}

                      </div>

                    )

                  }

                  const renderMasterDash = () => {

                    const def = PASS_DEFS.master

                    const pass = vipPasses.master

                    const day = passDayNumber(pass.purchasedAtMs, passNowMs)

                    const canDaily = canClaimMasterDaily(pass, passNowMs)

                    const perfect = pass.perfectDayKeys.length

                    if (!pass.owned) {

                      return (

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                          <button type="button" onClick={() => setPassView('picker')} className="btn-interactive" style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#94a3b8', fontSize: 9, fontWeight: 800, fontFamily: 'var(--kd-font)' }}>← گەڕانەوە</button>

                          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{kurdSeason.title}</div>

                          <div style={{ fontSize: 8.5, color: '#67e8f9', fontWeight: 800 }}>دواتر: {kurdSeason.nextMountain} · {formatKurdistanNextDate(kurdSeason.nextStartsAtMs)}</div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>

                            {[

                              { k: 'نرخ', v: def.priceLabel },

                              { k: 'ماوە', v: def.durationLabel },

                              { k: 'خەڵات', v: def.rewardLabel },

                            ].map(chip => (

                              <div key={chip.k} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 12, background: `${def.accent}14`, border: `1px solid ${def.accent}44` }}>

                                <div style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 800 }}>{chip.k}</div>

                                <div style={{ fontSize: 10, fontWeight: 900, color: def.accent, marginTop: 2 }}>{chip.v}</div>

                              </div>

                            ))}

                          </div>

                          <div style={{ padding: 11, borderRadius: 14, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', direction: 'rtl' }}>

                            <div style={{ fontSize: 10, fontWeight: 900, color: '#fef08a', marginBottom: 6 }}>✨ سوودەکان</div>

                            {def.benefits.map(b => (

                              <div key={b} style={{ fontSize: 9, color: '#e2e8f0', lineHeight: 1.55, marginBottom: 4 }}>• {b}</div>

                            ))}

                          </div>

                          <div style={{ padding: 11, borderRadius: 14, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)', direction: 'rtl' }}>

                            <div style={{ fontSize: 10, fontWeight: 900, color: '#fecaca', marginBottom: 6 }}>📋 یاساکان</div>

                            {def.rules.map(r => (

                              <div key={r} style={{ fontSize: 9, color: '#e2e8f0', lineHeight: 1.55, marginBottom: 4 }}>• {r}</div>

                            ))}

                          </div>

                          <button type="button" onClick={() => buyVipPass('master')} className="btn-interactive" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(120,53,15,0.35))', border: '1px solid rgba(251,191,36,0.5)', borderRadius: 12, padding: '12px', color: '#fef08a', fontSize: 11, fontWeight: 900, fontFamily: 'var(--kd-font)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>

                            کڕین بە {def.diamondCost} ئەڵماس <DiamondIcon size={14} />

                          </button>

                        </div>

                      )

                    }

                    return (

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                        <button type="button" onClick={() => setPassView('picker')} className="btn-interactive" style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#94a3b8', fontSize: 9, fontWeight: 800, fontFamily: 'var(--kd-font)' }}>← گەڕانەوە</button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl' }}>

                          <div>

                            <div style={{ fontSize: 8, color: '#fde68a', fontWeight: 800 }}>{pass.status === 'failed' ? 'سەرنەکەوت' : pass.status === 'rewardClaimed' || pass.status === 'completed' ? 'تەواو' : 'چالاکە'}</div>

                            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{kurdSeason.title}</div>

                            <div style={{ fontSize: 8, color: '#67e8f9', fontWeight: 800, marginTop: 2 }}>دواتر: {kurdSeason.nextMountain}</div>

                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>

                            <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '6px 8px', border: '1px solid rgba(251,191,36,0.3)' }}>

                              <div style={{ fontSize: 7, color: '#94a3b8' }}>ڕۆژ</div>

                              <div style={{ fontSize: 14, fontWeight: 900, color: '#fde047' }}>{day}/{PASS_DURATION_DAYS}</div>

                            </div>

                            <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '6px 8px', border: '1px solid rgba(0,240,255,0.3)' }}>

                              <div style={{ fontSize: 7, color: '#94a3b8' }}>تەواو</div>

                              <div style={{ fontSize: 14, fontWeight: 900, color: '#67e8f9' }}>{perfect}/{MASTER_PERFECT_DAYS_REQUIRED}</div>

                            </div>

                          </div>

                        </div>

                        <button

                          type="button"

                          disabled={!canDaily}

                          onClick={handleClaimMasterDaily}

                          className="btn-interactive"

                          style={{

                            background: canDaily ? 'linear-gradient(135deg, rgba(251,191,36,0.28), rgba(120,53,15,0.3))' : 'rgba(255,255,255,0.04)',

                            border: `1px solid ${canDaily ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'}`,

                            borderRadius: 12, padding: '11px', color: canDaily ? '#fef08a' : '#64748b',

                            fontSize: 10.5, fontWeight: 900, fontFamily: 'var(--kd-font)',

                          }}

                        >

                          {canDaily ? `وەرگرتنی خەڵاتی ڕۆژی ${day}` : 'خەڵاتی ڕۆژانە ئامادە نییە / وەرگیراوە'}

                        </button>

                        <div style={{ fontSize: 8, color: '#94a3b8', lineHeight: 1.4, direction: 'rtl' }}>

                          ١–٥: ٥٠ زێڕ · ٦–١٠: ١٠٠ · ١١–١٥: ١٥٠ · ١٦–٢٠: ٢٠٠ · ٢١–٢٥: ١٠–٢٥ ئەڵماس · ٢٦–٣٠: ٢٠–٣٥ · ٣١–٦٠: ٢٥ ئەڵماس

                        </div>

                        <div style={{ fontSize: 9, fontWeight: 900, color: '#67e8f9' }}>ئەسپاردە ڕۆژانەکان (٣)</div>

                        {masterUi.daily.map(m => renderMissionRow(m, false))}

                        <div style={{ fontSize: 9, fontWeight: 900, color: '#fde68a', marginTop: 2 }}>ئەسپاردە هەفتەیییەکان (٣)</div>

                        {masterUi.weekly.map(m => renderMissionRow(m, true))}

                        {(day >= PASS_DURATION_DAYS || (pass.endsAtMs != null && passNowMs >= pass.endsAtMs) || pass.finalSettled) && !pass.finalRewardClaimed && !pass.refundGranted && (

                          <button type="button" onClick={handleSettleMaster} className="btn-interactive" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(180,83,9,0.25))', border: '1px solid rgba(251,191,36,0.5)', borderRadius: 12, padding: '12px', color: '#fef08a', fontSize: 11, fontWeight: 900, fontFamily: 'var(--kd-font)' }}>

                            یەکلایی کردنەوەی کۆتایی

                          </button>

                        )}

                        {pass.finalRewardClaimed && <div style={{ textAlign: 'center', fontSize: 10, color: '#86efac', fontWeight: 900 }}>✓ {MASTER_FINAL_DIAMOND.toLocaleString()} ئەڵماس وەرگیرا</div>}

                        {pass.refundGranted && <div style={{ textAlign: 'center', fontSize: 10, color: '#fde68a', fontWeight: 900 }}>↩ {MASTER_FAIL_REFUND_DIAMONDS} ئەڵماس گەڕایەوە</div>}

                      </div>

                    )

                  }

                  return (

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, direction: 'rtl' }}>

                      <div style={{

                        background: 'linear-gradient(145deg, rgba(251,191,36,0.14), rgba(8,12,22,0.92) 45%, rgba(0,240,255,0.08))',

                        border: '1px solid rgba(251,191,36,0.35)',

                        borderRadius: 14,

                        padding: 12,

                        boxShadow: '0 0 24px rgba(251,191,36,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',

                      }}>

                        <div style={{ fontSize: 8, color: '#fde68a', fontWeight: 800 }}>ڕێڕەوی کوردستان</div>

                        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>چیای {kurdSeason.mountain}</div>

                        <div style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 4, lineHeight: 1.45 }}>
                          یەک ڕێڕەو · تەنها بە ئەڵماس · هەر ٢ مانگ ناوی چیاکە دەگۆڕدرێت
                        </div>

                        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(251,191,36,0.28)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 800 }}>ئێستا</div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: '#fef08a' }}>🏔 {kurdSeason.mountain}</div>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 800 }}>دواتر</div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: '#67e8f9' }}>🏔 {kurdSeason.nextMountain}</div>
                            <div style={{ fontSize: 7, color: '#64748b', marginTop: 2, direction: 'ltr' }}>{formatKurdistanNextDate(kurdSeason.nextStartsAtMs)}</div>
                          </div>
                        </div>

                      </div>

                      {(passView === 'picker' || passView === 'tiktok' || passView === 'facebook') && (

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                          {ACTIVE_PASS_KINDS.map(kind => {

                            const def = PASS_DEFS[kind]

                            const owned = vipPasses.master.owned

                            const progress = `${vipPasses.master.perfectDayKeys.length}/${MASTER_PERFECT_DAYS_REQUIRED} تەواو`

                            const displayTitle = kind === 'master' ? kurdSeason.title : def.title

                            return (

                              <div key={kind} style={{

                                display: 'flex', flexDirection: 'column', gap: 9, padding: 13,

                                background: `linear-gradient(155deg, ${def.accent}12, rgba(4,8,18,0.75))`,

                                border: `1px solid ${def.accent}44`,

                                borderRadius: 16,

                                boxShadow: `0 0 18px ${def.accent}14`,

                              }}>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

                                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${def.accent}22`, border: `1px solid ${def.accent}66`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                                    <i className="material-icons" style={{ fontSize: 20, color: def.accent }}>{def.icon}</i>

                                  </div>

                                  <div style={{ flexGrow: 1, textAlign: 'right' }}>

                                    <div style={{ fontSize: 12.5, fontWeight: 900, color: '#fff' }}>{displayTitle}</div>

                                    <div style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 2 }}>{def.desc}</div>

                                    <div style={{ fontSize: 8, color: '#67e8f9', fontWeight: 800, marginTop: 3 }}>دواتر: {kurdSeason.nextMountain}</div>

                                    {owned && <div style={{ fontSize: 8, color: def.accent, fontWeight: 800, marginTop: 3 }}>✓ چالاک · {progress}</div>}

                                  </div>

                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>

                                  <div style={{ textAlign: 'center', padding: '6px 3px', borderRadius: 10, background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)' }}>

                                    <div style={{ fontSize: 7, color: '#64748b', fontWeight: 800 }}>نرخ</div>

                                    <div style={{ fontSize: 9, fontWeight: 900, color: '#cffafe', marginTop: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                      <DiamondIcon size={12} /> {def.diamondCost}
                                    </div>

                                  </div>

                                  <div style={{ textAlign: 'center', padding: '6px 3px', borderRadius: 10, background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)' }}>

                                    <div style={{ fontSize: 7, color: '#64748b', fontWeight: 800 }}>ماوە</div>

                                    <div style={{ fontSize: 9, fontWeight: 900, color: def.accent, marginTop: 1 }}>{def.durationLabel}</div>

                                  </div>

                                  <div style={{ textAlign: 'center', padding: '6px 3px', borderRadius: 10, background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)' }}>

                                    <div style={{ fontSize: 7, color: '#64748b', fontWeight: 800 }}>خەڵات</div>

                                    <div style={{ fontSize: 9, fontWeight: 900, color: '#86efac', marginTop: 1 }}>{def.rewardLabel}</div>

                                  </div>

                                </div>

                                {!owned && (

                                  <div style={{ fontSize: 8.5, color: '#cbd5e1', lineHeight: 1.45, direction: 'rtl' }}>

                                    {def.benefits[0]}

                                  </div>

                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: owned ? '1fr' : '1fr 1fr', gap: 6 }}>

                                  {!owned && (

                                    <button type="button" onClick={() => buyVipPass(kind)} className="btn-interactive" style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.22), rgba(2,80,120,0.25))', border: '1px solid rgba(0,240,255,0.4)', borderRadius: 10, padding: '9px', color: '#cffafe', fontSize: 9.5, fontWeight: 900, fontFamily: 'var(--kd-font)' }}>

                                      کڕین

                                    </button>

                                  )}

                                  <button type="button" onClick={() => { setPassView(kind); setSocialLinkInput('') }} className="btn-interactive" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 10, padding: '9px', color: '#fef08a', fontSize: 9.5, fontWeight: 900, fontFamily: 'var(--kd-font)' }}>

                                    {owned ? 'داشبۆرد' : 'وردەکاری و یاسا'}

                                  </button>

                                </div>

                              </div>

                            )

                          })}

                        </div>

                      )}

                      {passView === 'master' && renderMasterDash()}

                    </div>

                  )

                })()}

                {/* ناوەندی ئاگادارییەکان */}

                {activeSheet === 'notifications' && (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, direction: 'rtl' }}>

                    <div style={{

                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,

                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',

                      borderRadius: 14, padding: '10px 12px',

                      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',

                    }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                        <i className="material-icons" style={{ color: '#7dd3fc', fontSize: 18 }}>notifications</i>

                        <div>

                          <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>ئاگادارییەکان</div>

                          <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>

                            {unreadNotifCount > 0 ? `${unreadNotifCount} نەخوێندراو` : 'هەموو بینراون'}

                          </div>

                        </div>

                      </div>

                      <button

                        type="button"

                        onClick={handleMarkAllNotifsRead}

                        className="btn-interactive"

                        style={{

                          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',

                          borderRadius: 10, padding: '8px 10px', color: '#e0f2fe', fontSize: 9, fontWeight: 900,

                          fontFamily: 'var(--kd-font)', whiteSpace: 'nowrap',

                        }}

                      >هەموویم بینیوە</button>

                    </div>

                    {notificationsFeed.length === 0 ? (

                      <div style={{ textAlign: 'center', padding: '28px 12px', color: '#64748b', fontSize: 11, fontWeight: 800 }}>

                        هیچ ئاگادارییەک نییە

                      </div>

                    ) : (

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                        {notificationsFeed.map(n => {

                          const isRead = readNotifIds.has(n.id)

                          const req = n.kind === 'friend_request' && n.friendRequestId

                            ? incomingFriendRequests.find(r => r.id === n.friendRequestId)

                            : null

                          return (

                            <div

                              key={n.id}

                              onClick={() => handleNotificationClick(n)}

                              className="btn-interactive"

                              style={{

                                display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 14,

                                textAlign: 'right',

                                background: isRead

                                  ? 'rgba(255,255,255,0.04)'

                                  : 'linear-gradient(145deg, rgba(14,40,70,0.92), rgba(8,18,36,0.95))',

                                border: isRead

                                  ? '1px solid rgba(255,255,255,0.08)'

                                  : '1px solid rgba(56,189,248,0.45)',

                                boxShadow: isRead

                                  ? 'none'

                                  : '0 0 18px rgba(56,189,248,0.28), inset 0 1px 0 rgba(255,255,255,0.08)',

                                backdropFilter: 'blur(10px)',

                                WebkitBackdropFilter: 'blur(10px)',

                                transition: 'background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',

                              }}

                            >

                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>

                                <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{n.icon}</span>

                                <div style={{ flexGrow: 1, minWidth: 0 }}>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>

                                    <span style={{ fontSize: 11, fontWeight: 900, color: isRead ? '#e2e8f0' : '#fff' }}>{n.title}</span>

                                    <span style={{ fontSize: 7.5, color: '#64748b', direction: 'ltr', flexShrink: 0 }}>{formatNotifTime(n.atMs)}</span>

                                  </div>

                                  <div style={{ fontSize: 9, color: isRead ? '#94a3b8' : '#cbd5e1', marginTop: 4, lineHeight: 1.45 }}>{n.body}</div>

                                </div>

                              </div>

                              {n.kind === 'steal' && n.fromUid && !n.revengeClaimed && ((n.goldAmount || 0) > 0 || (n.diamondAmount || 0) > 0) && (Date.now() - (n.atMs || 0) <= STEAL_SHIELD_MS) && (

                                <button

                                  type="button"

                                  onClick={e => { void handleRevengeSteal(n, e) }}

                                  className="btn-interactive"

                                  style={{

                                    background: 'linear-gradient(135deg, rgba(192,132,252,0.28), rgba(88,28,135,0.3))',

                                    border: '1px solid rgba(192,132,252,0.5)', borderRadius: 10, padding: '8px 10px',

                                    color: '#e9d5ff', fontSize: 10, fontWeight: 900, fontFamily: 'var(--kd-font)',

                                  }}

                                >تۆڵەسەندنەوە (٢x 🪙💎)</button>

                              )}

                              {n.kind === 'heist' && n.heistId && !n.heistResolved && (

                                <button

                                  type="button"

                                  onClick={e => {
                                    e.stopPropagation()
                                    markNotifRead(n.id)
                                    setIncomingHeistAlert({
                                      heistId: n.heistId!,
                                      thiefUid: n.fromUid || '',
                                      thiefName: n.fromName || 'یاریزان',
                                      mode: n.heistMode === 'online' ? 'online' : 'offline',
                                      expiresAtMs: Date.now() + 60_000,
                                    })
                                  }}

                                  className="btn-interactive"

                                  style={{ background: 'rgba(248,113,113,0.16)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 10, padding: '8px 10px', color: '#fecaca', fontSize: 10, fontWeight: 900, fontFamily: 'var(--kd-font)' }}

                                >ڕازی / ڕەتکردنەوە</button>

                              )}

                              {req && (

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>

                                  <button

                                    type="button"

                                    onClick={e => { e.stopPropagation(); markNotifRead(n.id); void handleAcceptFriendRequest(req) }}

                                    className="btn-interactive"

                                    style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.45)', borderRadius: 10, padding: '8px', color: '#bbf7d0', fontSize: 9.5, fontWeight: 900, fontFamily: 'var(--kd-font)' }}

                                  >قبووڵکردن</button>

                                  <button

                                    type="button"

                                    onClick={e => { e.stopPropagation(); markNotifRead(n.id); void handleDeclineFriendRequest(req) }}

                                    className="btn-interactive"

                                    style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 10, padding: '8px', color: '#fecaca', fontSize: 9.5, fontWeight: 900, fontFamily: 'var(--kd-font)' }}

                                  >ڕەتکردنەوە</button>

                                </div>

                              )}

                            </div>

                          )

                        })}

                      </div>

                    )}

                  </div>

                )}

                {activeSheet === 'airdropTypes' && (() => {

                  const now = Date.now()

                  const cycleIdx = getCycleIndex(now)

                  const currentType = getDropTypeForCycle(cycleIdx)

                  const cycleHourLabels = ['08:00', '10:00', '12:00', '14:00', '16:00']

                  return (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, direction: 'rtl' }}>

                        <i className="material-icons" style={{ color: '#00f0ff', fontSize: 18 }}>flight</i>

                        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>ڕێڕەوی فڕۆکە</span>

                      </div>

                      <div style={{ color: '#94a3b8', fontSize: 8, lineHeight: 1.5 }}>

                        خول لە ٠٨:٠٠ی بەیانی (UTC+3) دەستپێدەکات و هەموو ٢ کاتژمێر دووبارە دەبێتەوە. فڕۆکە تەنها ٣٠ خولەک دەمێنێتەوە، پاشان ون دەبێت تا خولی دواتر.

                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>

                        <div style={{ flex: 1, textAlign: 'center', background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: '6px 4px' }}>

                          <span style={{ color: '#94a3b8', fontSize: 7 }}>خول</span><br/>

                          <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 900 }}>{formatDurationKu(CYCLE_MS)}</span>

                        </div>

                        <div style={{ flex: 1, textAlign: 'center', background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 10, padding: '6px 4px' }}>

                          <span style={{ color: '#94a3b8', fontSize: 7 }}>فڕینی چالاک</span><br/>

                          <span style={{ color: '#00f0ff', fontSize: 10, fontWeight: 900 }}>{formatDurationKu(ACTIVE_FLIGHT_MS)}</span>

                        </div>

                        <div style={{ flex: 1, textAlign: 'center', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '6px 4px' }}>

                          <span style={{ color: '#94a3b8', fontSize: 7 }}>گەشت نێوان شارەکان</span><br/>

                          <span style={{ color: '#4ade80', fontSize: 10, fontWeight: 900 }}>{formatDurationKu(CITY_LEG_MS)}</span>

                        </div>

                        <div style={{ flex: 1, textAlign: 'center', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '6px 4px' }}>

                          <span style={{ color: '#94a3b8', fontSize: 7 }}>هاتن / دەرچوون</span><br/>

                          <span style={{ color: '#fca5a5', fontSize: 10, fontWeight: 900 }}>{formatDurationKu(USA_APPROACH_MS)}</span>

                        </div>

                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>

                          <span style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', width: 14, textAlign: 'center' }}>✈</span>

                          <span style={{ color: '#94a3b8', fontSize: 10.5, fontWeight: 900, flexGrow: 1 }}>ئەمریکا → … → ڕووسیا (بەبێ وێستان)</span>

                        </div>

                        {FLIGHT_CITIES.map((city, idx) => (

                          <div key={city.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>

                            <span style={{ fontSize: 9, fontWeight: 900, color: '#00f0ff', width: 14, textAlign: 'center' }}>{idx + 1}</span>

                            <i className="material-icons" style={{ fontSize: 16, color: '#94a3b8' }}>location_city</i>

                            <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 900, flexGrow: 1 }}>{city.name}</span>

                            <span style={{ fontSize: 7.5, color: '#64748b', fontWeight: 700 }}>١ درۆپ</span>

                          </div>

                        ))}

                      </div>

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, direction: 'rtl' }}>

                        <i className="material-icons" style={{ color: '#00f0ff', fontSize: 18 }}>layers</i>

                        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>جۆرەکانی درۆپ (زنجیرەیی)</span>

                      </div>

                      <div style={{ color: '#94a3b8', fontSize: 8, lineHeight: 1.5 }}>هەر خولێک تەنها یەک جۆر فڕێدەدات (٦ شار × ١ درۆپ). دوای جۆری ٥ دووبارە لە جۆری ١ دەستپێدەکاتەوە.</div>

                      <div style={{ color: '#94a3b8', fontSize: 8, lineHeight: 1.5 }}>⏱️ کەوتنەخوارەوە: ١ خولەک · قوفڵ و ونبوون بەپێی جۆر زیاد دەبن (+٥ خولەک).</div>

                      <div style={{ color: '#94a3b8', fontSize: 8, lineHeight: 1.5 }}>⚠️ ئەگەر جۆرێکت کردەوە، تا ٢٤ کاتژمێر ناتوانیت هەمان جۆر دووبارە بکەیتەوە.</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

                        {DROP_TYPES.map(dt => {

                          const chest = erbilChests.find(c => c.id === dt.chestId) ?? erbilChests[4]

                          const isCurrent = dt.type === currentType

                          const hourHint = cycleHourLabels[dt.type - 1]

                          return (

                            <div key={dt.type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: isCurrent ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isCurrent ? 'rgba(0,240,255,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12 }}>

                              <div style={{ width: 38, height: 38, borderRadius: 10, position: 'relative', flexShrink: 0, background: chest.boxColor, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>

                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, background: chest.tarpColor, opacity: 0.85 }} />

                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1, minWidth: 0 }}>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>

                                  <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 900 }}>{dt.icon} {chest.name}</span>

                                  <span style={{ fontSize: 7.5, fontWeight: 900, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '1px 6px' }}>{chest.rarity}</span>

                                  {isCurrent && (

                                    <span style={{ fontSize: 7.5, fontWeight: 900, color: '#cffafe', background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.4)', borderRadius: 6, padding: '1px 6px' }}>ئێستا</span>

                                  )}

                                </div>

                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>

                                  <span style={{ fontSize: 7.5, color: '#bbf7d0', fontWeight: 700, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 6, padding: '2px 6px' }}>🕐 نموونە {hourHint}</span>

                                  <span style={{ fontSize: 7.5, color: '#fde68a', fontWeight: 700, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6, padding: '2px 6px' }}>🔒 قوفڵ {formatDurationKu(dt.lockMs)}</span>

                                  <span style={{ fontSize: 7.5, color: '#fca5a5', fontWeight: 700, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 6, padding: '2px 6px' }}>ونبوون {formatDurationKu(dt.despawnMs)}</span>

                                </div>

                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>

                                  <span style={{ fontSize: 7.5, color: '#cffafe', fontWeight: 700, background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)', borderRadius: 6, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                    <DiamondIcon size={10} /> {dt.bonusDiamondMin.toLocaleString()} - {dt.bonusDiamondMax.toLocaleString()} ئەڵماس
                                  </span>

                                  <span style={{ fontSize: 7.5, color: '#fde68a', fontWeight: 700, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                    <GoldIcon size={10} /> {dt.goldMin}-{dt.goldMax}
                                  </span>

                                  <span style={{ fontSize: 7.5, color: '#cffafe', fontWeight: 700, background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)', borderRadius: 6, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                    <DiamondIcon size={10} /> {dt.diamondMin}-{dt.diamondMax}
                                  </span>

                                  <span style={{ fontSize: 7.5, color: '#c4b5fd', fontWeight: 700, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 6, padding: '2px 6px' }}>🎁 کەرەستەی فرۆشگا · XP{xpForDropType(dt.type)}</span>

                                </div>

                              </div>

                            </div>

                          )

                        })}

                      </div>

                    </div>

                  </div>

                  )

                })()}

              </div>

              {/* ══ هێڵی خوارەوە بۆ داخستن بە ڕاکێشان بەرەو سەرەوە ══ */}

              <div 

                className="kd-player-focus-drag"

                style={{ margin: '0 -8px', padding: '16px 24px 8px' }}

                onClick={closeDropdownAnimated}

                onTouchStart={(e) => {

                  const el = document.getElementById('dropdown-wrapper');

                  if(el) { el.dataset.startY = e.touches[0].clientY.toString(); el.style.transition = 'none'; }

                }}

                onTouchMove={(e) => {

                  const el = document.getElementById('dropdown-wrapper');

                  if(el && el.dataset.startY) {

                    const dy = e.touches[0].clientY - parseFloat(el.dataset.startY);

                    if(dy < 0) el.style.opacity = String(1 - Math.abs(dy)/200);

                  }

                }}

                onTouchEnd={(e) => {

                  const el = document.getElementById('dropdown-wrapper');

                  if(el && el.dataset.startY) {

                    const dy = e.changedTouches[0].clientY - parseFloat(el.dataset.startY);

                    if(dy < -20) {

                      closeDropdownAnimated();

                    } else {

                      el.style.transition = 'opacity 0.15s ease';

                      el.style.opacity = '1';

                    }

                    el.dataset.startY = '';

                  }

                }}

              >

                <div className="kd-player-focus-drag-bar" />

              </div>

            </div>

          )}

        </div>

        {/* ══ دەستی ڕاست — ئایکۆنە شووشەییەکان (سەرەوە → خوارەوە) ══ */}

        <div
          className={`kd-map-right-fabs${isAnyExclusiveBoxOpen ? ' is-hidden' : ''}`}
          style={{
            position: 'absolute',
            top: rightIconsTop,
            right: 'calc(12px + env(safe-area-inset-right, 0px))',
            zIndex: 48,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'center',
          }}
          aria-hidden={isAnyExclusiveBoxOpen}
        >

          <div className="kd-map-theme-fab-inner">
            <button
              type="button"
              onClick={toggleMapTheme}
              className={`kd-map-fab kd-map-fab--layers glass-surface btn-interactive${mapTheme !== 'standard' ? ' is-on' : ''}`}
              title={MAP_THEME_LABELS[mapTheme]}
              aria-label={`گۆڕینی نەخشە · ${MAP_THEME_LABELS[mapTheme]}`}
            >
              <MapFabIcon name="layers" />
            </button>
            {mapThemeToast ? (
              <span className="kd-map-theme-toast" dir="rtl" role="status" aria-live="polite">
                {mapThemeToast}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeSheet === 'market') closeDropdownAnimated()
              else openCitadelShop()
            }}
            className={`kd-map-fab kd-map-fab--shop glass-surface btn-interactive${activeSheet === 'market' ? ' is-on' : ''}`}
            title="فرۆشگا"
            aria-label="فرۆشگا"
            aria-expanded={activeSheet === 'market'}
          >
            <MapFabIcon name="shop" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeSheet === 'dailyBonus') {
                setActiveSheet(null)
                return
              }
              dismissAllOverlaysRef.current('dropdown')
              setActiveSheet('dailyBonus')
            }}
            className={`kd-map-fab kd-map-fab--gift glass-surface btn-interactive${activeSheet === 'dailyBonus' ? ' is-on' : ''}`}
            title="دیاریی ڕۆژانە"
            aria-label="دیاریی ڕۆژانە"
            aria-expanded={activeSheet === 'dailyBonus'}
          >
            <MapFabIcon name="gift" />
            {canClaimDailyBonus && <span className="kd-map-fab-dot alert" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (showSpinWheel) closeSpinWheelAnimated()
              else openSpinWheel()
            }}
            className={`kd-map-fab kd-map-fab--spin glass-surface btn-interactive${showSpinWheel ? ' is-on' : ''}`}
            title="چەرخی بەخت"
            aria-label="چەرخی بەخت"
            aria-expanded={showSpinWheel}
          >
            <MapFabIcon name="spin" />
            {isFreeSpinNext && <span className="kd-map-fab-dot" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() => toggleSheet('airdropTypes')}
            className={`kd-map-fab kd-map-fab--route glass-surface btn-interactive${activeSheet === 'airdropTypes' ? ' is-on' : ''}`}
            title="ڕێڕەوی فڕۆکە"
            aria-label="ڕێڕەوی فڕۆکە"
          >
            <MapFabIcon name="route" />
          </button>

          <button
            type="button"
            onClick={togglePlaneFollow}
            className={`kd-map-fab kd-map-fab--plane glass-surface btn-interactive${followPlane ? ' is-on' : ''}`}
            title="تەیارەکە"
            aria-label="تەیارەکە"
          >
            <MapFabIcon name="plane" />
          </button>

        </div>

        {/* ══ شوێنم — دەستی ڕاستی خوارەوە (هەمیشە جێگیر) ══ */}

        <div style={{ position: 'absolute', bottom: 'calc(25px + env(safe-area-inset-bottom, 0px))', right: 'calc(16px + env(safe-area-inset-right, 0px))', zIndex: 40, pointerEvents: 'auto' }}>

          <button
            type="button"
            onClick={centerGPS}
            className={`kd-map-fab-stack btn-interactive${followMe ? ' is-on' : ''}`}
            title="شوێنم"
            aria-label="شوێنم"
          >
            <span className={`kd-map-fab kd-map-fab--gps glass-surface${followMe ? ' is-on' : ''}`}>
              <MapFabIcon name={followMe ? 'gpsFixed' : 'gps'} />
            </span>
            <span className="kd-map-fab-caption">شوێنم</span>
          </button>

        </div>

        {/* ئایکۆنی چاتی گشتی — لای چەپی شاشە (هەمیشە جێگیر) */}

        <div className="kd-map-chat-side">

          <button
            type="button"
            onClick={() => {
              if (showMapChatModal) {
                closeMapChatAnimated({ force: true })
                return
              }
              dismissAllOverlaysRef.current('mapChat')
              setMapChatSheetClosing(false)
              setMapChatSheetIn(false)
              setShowMapChatModal(true)
            }}
            className={`kd-map-fab kd-map-fab--chat glass-surface btn-interactive${showMapChatModal ? ' is-on' : ''}`}
            title="چاتی گشتی نەخشە"
            aria-label="چاتی گشتی نەخشە"
          >
            <MapFabIcon name="chat" />
          </button>

        </div>

        {/* دوگمەی ڕادار — ناوەڕاستی خوارەوە */}

        <div style={{ position: 'absolute', bottom: 'calc(25px + env(safe-area-inset-bottom, 0px))', left: '50%', transform: 'translateX(-50%)', zIndex: 40, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>

          <div className="kd-map-dist-badge">

            نزیکترین: {chestDist}

          </div>

          <div className="kd-map-fab-row">

            <div
              onMouseDown={handleRadarDown}
              onMouseUp={handleRadarUp}
              onTouchStart={handleRadarDown}
              onTouchEnd={handleRadarUp}
              className="kd-map-fab kd-map-fab--radar glass-surface btn-interactive is-on"
              role="button"
              aria-label="ڕادار"
              style={{ borderColor: radarColor }}
            >
              <MapFabIcon name="radar" />
              <div className="radar-wave"></div>
            </div>

          </div>

        </div>

        {/* مۆداڵی نووسینی چاتی گشتی */}

        {showMapChatModal && (

          <div
            className={`kd-map-chat-overlay${mapChatSheetIn ? ' is-in' : ''}${mapChatSheetClosing ? ' is-closing' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="چاتی گشتی نەخشە"
            style={{ ['--kd-map-chat-kb' as string]: `${mapChatKbInset}px` }}
            onClick={() => { if (!mapChatSending) closeMapChatAnimated() }}
          >

            <div
              className="kd-map-chat-modal glass-surface"
              onClick={e => e.stopPropagation()}
            >

              <div className="kd-map-chat-modal-head">

                <div className="kd-map-chat-modal-title">

                  <span className={`kd-map-fab glass-surface is-on`} style={{ width: 28, height: 28, borderRadius: '50%' }}>
                    <MapFabIcon name="chat" />
                  </span>

                  <span>چاتی گشتی</span>

                </div>

                <button
                  type="button"
                  className="btn-interactive kd-spin-close-btn"
                  disabled={mapChatSending}
                  onClick={() => closeMapChatAnimated()}
                  aria-label="داخستن"
                  style={{ width: 30, height: 30 }}
                >
                  <i className="material-icons" style={{ fontSize: 16 }}>close</i>
                </button>

              </div>

              <div
                ref={mapChatFeedListRef}
                className="kd-map-chat-feed"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
              >
                {mapChatFeed.length === 0 ? (
                  <div className="kd-map-chat-feed-empty">
                    چاتەکە خاڵییە — نامەکان بەم زووانە دێن…
                  </div>
                ) : (
                  mapChatFeed.map((m) => (
                    <div
                      key={m.id}
                      className={`kd-map-chat-row${m.isSelf ? ' is-self' : ''}`}
                    >
                      <button
                        type="button"
                        className="btn-interactive kd-map-chat-avatar kd-map-chat-profile-hit"
                        onClick={(e) => {
                          e.stopPropagation()
                          closeMapChatAnimated()
                          if (m.isSelf) handleSelfClick()
                          else handlePlayerClick(m.uid)
                        }}
                        aria-label={`پرۆفایلی ${m.name}`}
                        title={m.name}
                      >
                        <HeadShotAvatar
                          sizePx={28}
                          gender={m.gender}
                          seed={m.uid}
                          avatarUrl={m.avatarUrl || avatarForGender(m.gender)}
                          avatar3d={m.avatar3d}
                        />
                      </button>
                      <div className="kd-map-chat-body">
                        <button
                          type="button"
                          className="btn-interactive kd-map-chat-name kd-map-chat-profile-hit"
                          onClick={(e) => {
                            e.stopPropagation()
                            closeMapChatAnimated()
                            if (m.isSelf) handleSelfClick()
                            else handlePlayerClick(m.uid)
                          }}
                        >
                          {m.name}
                        </button>
                        <div className="kd-map-chat-msg">{m.text}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={mapChatFeedEndRef} aria-hidden="true" />
              </div>

              {mapChatShowEmoji && (
                <div className="kd-map-chat-emoji-panel" role="listbox" aria-label="ئیمۆژی">
                  {DM_EMOJI_LIST.map((em) => (
                    <div
                      key={em}
                      role="option"
                      className="btn-interactive kd-map-chat-emoji-btn"
                      onClick={() => {
                        setMapChatDraft((prev) => (prev + em).slice(0, MAP_CHAT_MAX_LEN))
                      }}
                    >
                      {em}
                    </div>
                  ))}
                </div>
              )}

              <div className="kd-map-chat-composer">

                <button
                  type="button"
                  className={`btn-interactive kd-map-chat-emoji-toggle${mapChatShowEmoji ? ' is-on' : ''}`}
                  disabled={mapChatSending}
                  onClick={() => setMapChatShowEmoji((v) => !v)}
                  title="ئیمۆژی"
                  aria-label="ئیمۆژی"
                  aria-pressed={mapChatShowEmoji}
                >
                  <i className="material-icons" style={{ fontSize: 18 }}>emoji_emotions</i>
                </button>

                <input
                  className="kd-map-chat-input"
                  type="text"
                  value={mapChatDraft}
                  maxLength={100}
                  placeholder="نامەکەت بنووسە..."
                  disabled={mapChatSending}
                  autoFocus
                  enterKeyHint="send"
                  onFocus={() => {
                    setMapChatShowEmoji(false)
                    const bump = () => {
                      const vv = window.visualViewport
                      if (!vv) return
                      setMapChatKbInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)))
                    }
                    bump()
                    window.setTimeout(bump, 80)
                    window.setTimeout(bump, 280)
                    window.setTimeout(bump, 520)
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      const vv = window.visualViewport
                      if (!vv) { setMapChatKbInset(0); return }
                      setMapChatKbInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)))
                    }, 80)
                  }}
                  onChange={e => setMapChatDraft(e.target.value.slice(0, MAP_CHAT_MAX_LEN))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleSendMapChat()
                    }
                  }}
                  aria-label="نامەی گشتی نەخشە"
                />

                <span className="kd-map-chat-count">{mapChatDraft.length}/100</span>

                <button
                  type="button"
                  className="btn-interactive kd-map-chat-send"
                  disabled={mapChatSending || !mapChatDraft.trim()}
                  onClick={() => { void handleSendMapChat() }}
                  title="ناردن"
                  aria-label="ناردنی نامە"
                >
                  <i className="material-icons">send</i>
                </button>

              </div>

              <p className="kd-map-chat-hint">
                تا ١٠٠ پیت · نامەکان ڕاستەوخۆ لەم پانێڵەدا دەردەکەون
              </p>

            </div>

          </div>

        )}

        {vipSpectacle && Date.now() < vipSpectacle.untilMs && (
          <div
            className={`kd-vip-spectacle kd-vip-spectacle--${vipSpectacle.itemId}`}
            style={{ ['--kd-donate-scale' as string]: String(vipSpectacle.scale) }}
            aria-hidden="true"
          >
            <div className="kd-vip-spectacle-bg" />
            <div className="kd-vip-spectacle-burst" />
            {(vipSpectacle.fromName || vipSpectacle.toName) && (
              <div className="kd-vip-spectacle-names">
                <div className="kd-vip-spectacle-names-row">
                  <span className="from">{vipSpectacle.fromName || 'یاریزان'}</span>
                  <span className="arrow">➜</span>
                  <span className="to">{vipSpectacle.toName || 'یاریزان'}</span>
                </div>
                <div className="kd-vip-spectacle-names-sub">
                  {vipSpectacle.fromName || 'یاریزان'} ناردی · {vipSpectacle.toName || 'یاریزان'} وەریگرت
                </div>
              </div>
            )}
            <div className="kd-vip-spectacle-core">{vipSpectacle.emoji}</div>
            <div className="kd-vip-spectacle-label">{vipSpectacle.emoji} {vipSpectacle.label}</div>
          </div>
        )}

        {/* ══ Player Focus — Bottom Glass Panel (avatar stays on map) ══ */}

        {selectedPlayer && (() => {

          const skinWearGender = selectedPlayer.skinId != null

            ? COSMETIC_BY_ID[selectedPlayer.skinId]?.wearGender

            : undefined

          const sheetPanelGender: Gender =

            selectedPlayer.gender === 'female' || selectedPlayer.gender === 'male'

              ? selectedPlayer.gender

              : skinWearGender === 'female' || skinWearGender === 'male'

                ? skinWearGender

                : 'male'

          const sheetName = (typeof selectedPlayer.name === 'string' && selectedPlayer.name.trim())

            ? selectedPlayer.name.trim()

            : 'یاریزان'

          const sheetUid = selectedPlayer.uid || 'unknown'

          const sheetHunter = resolveHunterLevel(
            selectedPlayer.hunterLevel,
            selectedPlayer.dropsOpenedByType,
          )

          const sheetOnline = selectedPlayer.isOnline === true

          const title = selectedPlayer.titleId != null ? COSMETIC_BY_ID[selectedPlayer.titleId] ?? null : null

          const isBotPlayer = selectedPlayer.isBot === true || isBotPlayerUid(sheetUid)

          const rank = hunterRankForLevel(sheetHunter)

          const theme = playerBoxTheme(sheetHunter)

          const lastSeenText = sheetOnline

            ? 'ئۆنلاین'

            : formatLastSeenKu(selectedPlayer.lastSeenMs ?? onlinePlayersRef.current.get(sheetUid)?.lastSeenMs, passNowMs)

          const isFriend = friendsList.some(f => f.uid === sheetUid)

          const friendPending = outgoingFriendUids.includes(sheetUid)

          const friendBtn = isFriend

            ? { key: 'friend' as const, label: 'لە لیستی هاوڕێ', icon: 'group', color: '#86efac', disabled: true, action: () => {} }

            : friendPending

              ? { key: 'friend' as const, label: 'داواکاری نێردرا', icon: 'hourglass_top', color: '#fbbf24', disabled: true, action: () => {} }

              : { key: 'friend' as const, label: 'ببە هاوڕێم', icon: 'person_add', color: '#4ade80', disabled: isBotPlayer, action: () => handleSendFriendRequestToPlayer(sheetUid, sheetName) }

          const actionBtns = ([

            friendBtn,

            { key: 'message', label: 'نامە', icon: 'chat_bubble', color: '#00f0ff', disabled: isBotPlayer || blockedUidsRef.current.has(sheetUid), action: () => handleSendMessageToPlayer(sheetUid, sheetName) },

            { key: 'steal', label: 'دزین', icon: 'lock_open', color: '#e879f9', disabled: isBotPlayer || selectedPlayer.isSelf || (stealCooldownUntilMs > Date.now()), action: () => handleStealMoneyFromPlayer(sheetUid, sheetName) },

            { key: 'donate', label: 'جووڵە', icon: 'directions_run', color: '#f472b6', disabled: isBotPlayer || selectedPlayer.isSelf, action: () => { if (donatePickerUid === sheetUid || donatePickerClosing) { softCloseDonatePicker() } else { setDonatePickerClosing(false); setDonatePickerUid(sheetUid) } } },

            { key: 'block', label: 'بلۆک', icon: 'block', color: '#f87171', disabled: isBotPlayer, action: () => handleBlockPlayer(sheetUid, sheetName) },

          ] as const)

          const playerActionDisabledMsg = (btn: typeof actionBtns[number]): string | null => {

            if (!btn.disabled) return null

            if (isBotPlayer) return 'ℹ️ ئەم یاریزانە تەنها بۆ نەخشەیە — کارلێک بەردەست نییە'

            if (btn.key === 'message') return '🚫 نامە ناردن بۆ بلۆککراو ڕێگەپێنەدراوە'

            if (btn.key === 'steal' && selectedPlayer.isSelf) return 'ناتوانیت لە خۆت بدزیت'

            if (btn.key === 'steal' && stealCooldownUntilMs > Date.now()) {
              const leftMin = Math.ceil((stealCooldownUntilMs - Date.now()) / 60_000)
              return `⏳ Cooldownی دزی — ${leftMin} خولەک ماوە`
            }

            if (btn.key === 'donate' && selectedPlayer.isSelf) return 'ناتوانیت بۆ خۆت جووڵە بنێریت'

            return null

          }

          return (

          <div

            className={`kd-player-focus-wrap${(donatePickerUid === sheetUid || donatePickerClosing) ? ' is-gifting-open' : ''}`}

            style={{

              position: 'absolute', inset: 0, zIndex: 110,

              pointerEvents: 'none',

              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',

              padding: '0 10px calc(6px + env(safe-area-inset-bottom, 0px))',

            }}

          >

            <div

              className={`kd-player-focus-backdrop${(donatePickerUid === sheetUid || donatePickerClosing) ? ' is-gifting' : ''}`}

              aria-hidden="true"

              style={{

                position: 'absolute', inset: 0, zIndex: 0,

                pointerEvents: 'auto',

                touchAction: 'none',

                background: (donatePickerUid === sheetUid || donatePickerClosing) ? 'transparent' : 'rgba(2,6,18,0.28)',

              }}

              onClick={() => {

                if (donatePickerUid === sheetUid || donatePickerClosing) softCloseDonatePicker()

                else closePlayerSheet({ animated: true })

              }}

              onTouchStart={e => { e.stopPropagation() }}

              onTouchMove={e => { e.preventDefault(); e.stopPropagation() }}

              onTouchEnd={e => {

                e.preventDefault()

                e.stopPropagation()

                if (donatePickerUid === sheetUid || donatePickerClosing) softCloseDonatePicker()

                else closePlayerSheet({ animated: true })

              }}

              onWheel={e => { e.preventDefault(); e.stopPropagation() }}

            />

            <div

              ref={playerPanelRef}

              className={`glass-surface kd-player-focus-panel kd-sheet-${sheetPanelGender} ${playerSheetAnimIn ? 'is-in' : ''} ${(donatePickerUid === sheetUid || donatePickerClosing) ? 'is-donate-open' : ''}`}

              onTouchStart={e => e.stopPropagation()}

              onTouchMove={e => e.stopPropagation()}

              onTouchEnd={e => e.stopPropagation()}

              onClick={e => e.stopPropagation()}

              style={{

                pointerEvents: 'auto',

                position: 'relative',

                zIndex: 1,

                width: '100%',

                maxWidth: 400,

                direction: 'rtl',

                padding: '0 10px calc(8px + env(safe-area-inset-bottom, 0px))',

                ['--level-accent' as string]: theme.accent,

                ['--level-glow' as string]: theme.glow,

              }}

            >

              <div className="kd-player-focus-aurora" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

              <div

                className="kd-player-focus-drag"

                onTouchStart={e => {

                  e.stopPropagation()

                  playerPanelDragRef.current.startY = e.touches[0].clientY

                  if (playerPanelRef.current) playerPanelRef.current.style.transition = 'none'

                }}

                onTouchMove={e => {

                  e.stopPropagation()

                  const dy = e.touches[0].clientY - playerPanelDragRef.current.startY

                  if (dy > 0 && playerPanelRef.current) playerPanelRef.current.style.transform = `translateY(${dy}px)`

                }}

                onTouchEnd={e => {

                  e.stopPropagation()

                  const dy = e.changedTouches[0].clientY - playerPanelDragRef.current.startY

                  if (!playerPanelRef.current) return

                  playerPanelRef.current.style.transition = `transform 0.22s ${IOS_SPRING_EASE}`

                  if (dy > 56) {

                    playerPanelRef.current.style.transform = 'translateY(110%)'

                    closePlayerSheet({ animated: true })

                  } else {

                    playerPanelRef.current.style.transform = ''

                    if (Math.abs(dy) < 10 && (donatePickerUid === sheetUid || donatePickerClosing)) {

                      softCloseDonatePicker()

                    }

                  }

                }}

              >

                <button

                  type="button"

                  className="kd-player-focus-drag-bar"

                  aria-label="داخستنی جووڵە"

                  title="داخستنی جووڵە"

                  onClick={e => {

                    e.stopPropagation()

                    if (donatePickerUid === sheetUid || donatePickerClosing) softCloseDonatePicker()

                  }}

                />

              </div>

              <div className="kd-player-focus-inner">

                <div className="kd-player-focus-hero" style={{ display: 'flex', flexDirection: 'column', gap: 7, textAlign: 'right', marginBottom: 10 }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>

                    {selectedPlayer.isPremium && <i className="material-icons" style={{ fontSize: 16, color: '#ffd700', filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.65))' }}>workspace_premium</i>}

                    <span
                      className="kd-player-focus-name"
                      style={{
                        fontSize: 17,
                        fontWeight: 900,
                        lineHeight: 1.2,
                        background: 'linear-gradient(120deg, #ffffff 0%, #a5f3fc 40%, #fbcfe8 70%, #fde68a 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        textShadow: 'none',
                        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))',
                      }}
                    >{sheetName}</span>

                    {selectedPlayer.isSelf && <span style={{ fontSize: 8, fontWeight: 900, color: '#fef08a', background: 'linear-gradient(135deg, rgba(255,215,0,0.28), rgba(251,191,36,0.12))', border: '1px solid rgba(255,215,0,0.55)', borderRadius: 999, padding: '2px 8px', boxShadow: '0 0 10px rgba(251,191,36,0.25)' }}>تۆ</span>}

                  </div>

                  <div

                    style={{

                      display: 'inline-flex',

                      alignItems: 'center',

                      gap: 5,

                      width: 'fit-content',

                      padding: '3px 9px 3px 5px',

                      borderRadius: 999,

                      background: `linear-gradient(135deg, ${theme.color}22, rgba(2,132,199,0.12))`,

                      border: `1px solid ${theme.accent}`,

                      boxShadow: `0 0 10px ${theme.glow}`,

                    }}

                  >

                    <span

                      style={{

                        width: 18,

                        height: 18,

                        borderRadius: '50%',

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'center',

                        background: `linear-gradient(145deg, ${theme.color}, ${rank.glow})`,

                        boxShadow: `0 0 6px ${theme.glow}`,

                        flexShrink: 0,

                        fontSize: 11,

                      }}

                    >

                      {rank.icon}

                    </span>

                    <span style={{ fontSize: 10, fontWeight: 900, color: theme.color }}>{theme.roleName}</span>

                    <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(226,232,240,0.85)', marginRight: 4 }}>ئاست {sheetHunter}</span>

                  </div>

                  {title && (

                    <div style={{ fontSize: 11, fontWeight: 900, color: title.titleColor, textShadow: `0 0 8px ${title.titleGlow}` }}>{title.titleText}</div>

                  )}

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      width: 'fit-content',
                      padding: '3px 9px',
                      borderRadius: 999,
                      background: sheetOnline
                        ? 'linear-gradient(135deg, rgba(74,222,128,0.22), rgba(6,78,59,0.25))'
                        : 'linear-gradient(135deg, rgba(148,163,184,0.18), rgba(30,41,59,0.35))',
                      border: sheetOnline ? '1px solid rgba(74,222,128,0.45)' : '1px solid rgba(148,163,184,0.3)',
                      boxShadow: sheetOnline ? '0 0 12px rgba(74,222,128,0.2)' : 'none',
                    }}
                  >

                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: sheetOnline ? '#4ade80' : '#94a3b8', boxShadow: sheetOnline ? '0 0 8px rgba(74,222,128,0.8)' : 'none', flexShrink: 0 }} />

                    <span style={{ fontSize: 9, fontWeight: 900, color: sheetOnline ? '#bbf7d0' : '#cbd5e1' }}>

                      {sheetOnline ? 'دۆخی مانەوە: ئۆنلاین' : lastSeenText}

                    </span>

                  </div>

                  {!selectedPlayer.isSelf && blockedUidsRef.current.has(sheetUid) && (

                    <span style={{ alignSelf: 'flex-start', fontSize: 8, fontWeight: 900, color: '#fca5a5', background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.45)', borderRadius: 6, padding: '2px 7px' }}>بلۆککراو</span>

                  )}

                  {selectedPlayer.isSelf && (

                    <span style={{ alignSelf: 'flex-start', fontSize: 8, fontWeight: 900, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 7px' }}>ئاڤاتاری خۆت لەسەر نەخشە</span>

                  )}

                </div>

                {!(donatePickerUid === sheetUid || donatePickerClosing) && (() => {
                  const st = selectedPlayer.stats ?? { chestsOpened: 0, dailyBonusClaims: 0, distanceTraveledM: 0, playTimeMs: 0, itemsPurchased: 0, giftsReceived: 0 }
                  const distLabel = st.distanceTraveledM >= 1000
                    ? `${(st.distanceTraveledM / 1000).toFixed(1)} کم`
                    : `${Math.max(0, Math.floor(st.distanceTraveledM))} م`
                  const focusStats = [
                    { icon: 'schedule', label: 'کاتی یاری', value: formatPlayTime(st.playTimeMs), color: '#7dd3fc' },
                    { icon: 'card_giftcard', label: 'دیاری وەرگیراو', value: String(st.giftsReceived), color: '#fde68a' },
                    { icon: 'directions_walk', label: 'مەودا', value: distLabel, color: '#86efac' },
                  ]
                  return (
                    <div className="kd-player-focus-stats">
                      <div className="kd-player-focus-stats-head">
                        <i className="material-icons" aria-hidden="true">bar_chart</i>
                        ئاماری یاریزان
                      </div>
                      <div className="kd-player-focus-stats-grid">
                        {focusStats.map(stat => (
                          <div
                            key={stat.label}
                            className="kd-player-focus-stat"
                            style={{
                              background: `linear-gradient(160deg, ${stat.color}18 0%, rgba(8,12,22,0.55) 100%)`,
                              borderColor: `${stat.color}33`,
                            }}
                          >
                            <i className="material-icons" style={{ color: stat.color }} aria-hidden="true">{stat.icon}</i>
                            <div className="kd-player-focus-stat-label">{stat.label}</div>
                            <div className="kd-player-focus-stat-value" style={{ color: stat.color }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {(donatePickerUid === sheetUid || donatePickerClosing) && !selectedPlayer.isSelf && (

                  <div
                    className={`kd-donate-picker-wrap${donatePickerClosing ? ' is-closing' : ''}`}
                    onTouchStart={e => e.stopPropagation()}
                    onTouchMove={e => e.stopPropagation()}
                  >

                    <div className="kd-donate-picker-title">
                      هەڵبژاردنی جووڵە بۆ {sheetName}
                    </div>

                    <div className="kd-donate-picker">

                      {MOTION_ITEMS.map(dItem => {
                        const canAfford = canAffordMotion(wallet, dItem)
                        const priceTone = !canAfford
                          ? ' is-muted'
                          : dItem.diamondPrice > 0
                            ? ' is-diamond'
                            : ''
                        return (
                        <button

                          key={dItem.id}

                          type="button"

                          className={`kd-donate-picker-btn btn-interactive kd-donate-picker-btn--${dItem.tier}`}

                          disabled={!canAfford || donatePickerClosing}

                          {...bindInstantTap(playerSheetTapLockRef, () => {

                            if (donatePickerClosing || !canAfford) return

                            handleSendDonateItem(sheetUid, sheetName, dItem.id as MotionId)

                          })}

                        >

                          <span className="kd-donate-emoji" aria-hidden="true">{dItem.emoji}</span>

                          <span className="kd-donate-label">{dItem.label}</span>

                          <span
                            className={`kd-donate-price${priceTone}`}
                          >
                            {dItem.goldPrice > 0 && (
                              <>
                                <span className="kd-donate-price-num">{dItem.goldPrice}</span>
                                <GoldIcon size={11} className="kd-donate-price-coin" />
                              </>
                            )}
                            {dItem.goldPrice > 0 && dItem.diamondPrice > 0 && (
                              <span className="kd-donate-price-plus">+</span>
                            )}
                            {dItem.diamondPrice > 0 && (
                              <>
                                <span className="kd-donate-price-num">{dItem.diamondPrice}</span>
                                <DiamondIcon size={11} className="kd-donate-price-coin" />
                              </>
                            )}
                          </span>

                        </button>
                        )
                      })}

                    </div>

                  </div>

                )}

                {!(donatePickerUid === sheetUid || donatePickerClosing) && (
                <div className="kd-player-focus-actions">

                  {selectedPlayer.isSelf ? (

                    <button

                      type="button"

                      {...bindInstantTap(playerSheetTapLockRef, () => {

                        closePlayerSheet()

                        setTimeout(() => toggleSheet('profile'), PLAYER_SHEET_ANIM_MS)

                      })}

                      className="btn-interactive"

                      style={{

                        flex: 1,

                        padding: '11px 10px',

                        borderRadius: 12,

                        border: '1px solid rgba(0,240,255,0.45)',

                        background: 'linear-gradient(135deg, rgba(0,240,255,0.22), rgba(2,132,199,0.14))',

                        color: '#e0f2fe',

                        fontWeight: 900,

                        fontSize: 11,

                        fontFamily: 'var(--kd-font)',

                        textShadow: '0 1px 3px rgba(0,0,0,0.55)',

                      }}

                    >کردنەوەی ڕێکخستن و پرۆفایل</button>

                  ) : actionBtns.map(btn => (

                    <button

                      key={btn.key}

                      type="button"

                      {...bindPlayerSheetTap(btn.key, btn.disabled, playerActionDisabledMsg(btn), btn.action)}

                      className="btn-interactive kd-player-action-btn"

                      title={btn.label}

                      style={{

                        flex: 1,

                        minWidth: 0,

                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,

                        background: btn.disabled ? 'rgba(30,41,59,0.5)' : `linear-gradient(135deg, ${btn.color}33, rgba(4,8,18,0.35))`,

                        border: `1px solid ${btn.disabled ? 'rgba(100,116,139,0.4)' : `${btn.color}66`}`,

                        borderRadius: 12, padding: '8px 2px', minHeight: 52,

                        opacity: btn.disabled ? 0.45 : 1,

                        boxShadow: btn.disabled ? 'none' : `0 2px 10px ${btn.color}22`,

                      }}

                    >

                      <i className="material-icons" style={{ fontSize: 17, color: btn.disabled ? '#64748b' : btn.color }}>{btn.icon}</i>

                      <span style={{ fontSize: 7, fontWeight: 900, color: btn.disabled ? '#64748b' : '#fff', textAlign: 'center', lineHeight: 1.1, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{btn.label}</span>

                    </button>

                  ))}

                </div>
                )}

              </div>

            </div>

          </div>

          )

        })()}

        {/* دزی — ئاگاداری پێش دەستپێکردن */}

        {stealWarningTarget && (

          <div

            onClick={e => { if (e.target === e.currentTarget) setStealWarningTarget(null) }}

            style={{ position: 'absolute', inset: 0, zIndex: 210, background: 'rgba(2,6,18,0.78)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', direction: 'rtl' }}

          >

            <div style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(165deg, rgba(40,10,50,0.98), rgba(8,10,24,0.99))', borderTop: '1px solid rgba(192,132,252,0.4)', borderRadius: '24px 24px 0 0', padding: '18px 16px 26px', boxShadow: '0 -20px 50px rgba(0,0,0,0.7)' }}>

              <div style={{ fontSize: 14, fontWeight: 900, color: '#f5d0fe', lineHeight: 1.55, textAlign: 'center', marginBottom: 12 }}>

                دزی لە خەزێنەی {stealWarningTarget.name}

              </div>

              <div style={{ fontSize: 10, fontWeight: 800, color: '#e9d5ff', lineHeight: 1.55, textAlign: 'center', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.35)', borderRadius: 12, padding: '10px 12px', marginBottom: 10 }}>

                {stealWarningTarget.mode === 'online'
                  ? '🟢 ئۆنلاین · دەستکەوت: %٧ زێڕ + %٥ ئەڵماس — ئاگاداری قبوڵ/ڕەت بۆ بەرامبەر دەچێت'
                  : '⚫ ئۆفلاین · دەستکەوت: %٥ زێڕ + %٣ ئەڵماس — ئەگەر هاتە سەر هێڵ دزی هەڵدەوەشێتەوە'}

              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: '#f87171', lineHeight: 1.55, textAlign: 'center', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 12, padding: '10px 12px', marginBottom: 14 }}>

                دوای سەرکەوتن: Cooldownی ٦ کاتژمێر · تۆڵەی ٢x تا ٢٤ کاتژمێر · مۆبایلەکە ڕابگرە تا گڵۆپ سەوز ببێت

              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

                <button type="button" onClick={() => setStealWarningTarget(null)} className="btn-interactive" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: '12px 8px', color: '#94a3b8', fontWeight: 900, fontSize: 11, fontFamily: 'var(--kd-font)' }}>پاشگەزبوونەوە</button>

                <button type="button" onClick={() => { void startStealHack(stealWarningTarget.uid, stealWarningTarget.name, stealWarningTarget.mode) }} className="btn-interactive" style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.35), rgba(88,28,135,0.4))', border: '1px solid rgba(192,132,252,0.55)', borderRadius: 12, padding: '12px 8px', color: '#f5d0fe', fontWeight: 900, fontSize: 11, fontFamily: 'var(--kd-font)' }}>دەستپێکردنی دزی 🥷</button>

              </div>

            </div>

          </div>

        )}

        {/* مینی-گەیمی ژیۆسکۆپ */}

        {activeHack && (

          <GyroscopeHeistGame
            victimName={activeHack.victimName}
            mode={activeHack.mode}
            expiresAtMs={activeHack.endsAtMs}
            onSuccess={handleGyroHeistSuccess}
            onCancel={handleGyroHeistCancel}
            onExpired={handleGyroHeistExpired}
          />

        )}

        {/* ئاگاداری دزی هاتوو — ڕازی / ڕەت */}

        {incomingHeistAlert && !activeHack && (

          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 226, background: 'rgba(2,6,18,0.82)',
              backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', direction: 'rtl',
            }}
          >
            <div style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(165deg, rgba(60,10,20,0.98), rgba(8,10,24,0.99))', borderTop: '1px solid rgba(248,113,113,0.45)', borderRadius: '24px 24px 0 0', padding: '18px 16px 26px' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#fecaca', textAlign: 'center', marginBottom: 10 }}>
                🚨 {incomingHeistAlert.thiefName} خەریکی دزیکردنە لە خەزێنەکەت!
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginBottom: 14, lineHeight: 1.5 }}>
                ئایا ڕازیت یان ڕەتیدەکەیتەوە؟ ڕەتکردنەوە → قەڵغانی ٢٤ کاتژمێر
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button type="button" onClick={() => { void handleRejectIncomingHeist() }} className="btn-interactive" style={{ background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.45)', borderRadius: 12, padding: '12px 8px', color: '#fecaca', fontWeight: 900, fontSize: 11, fontFamily: 'var(--kd-font)' }}>ڕەتکردنەوە</button>
                <button type="button" onClick={() => { void handleAcceptIncomingHeist() }} className="btn-interactive" style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.45)', borderRadius: 12, padding: '12px 8px', color: '#bbf7d0', fontWeight: 900, fontSize: 11, fontFamily: 'var(--kd-font)' }}>ڕازیم</button>
              </div>
            </div>
          </div>

        )}

        {/* داواکاری شەڕی هاتوو — ١٥ چرکە قبوڵ/ڕەتکردنەوە */}

        {incomingChallenge && !arenaSession && (

          <div

            style={{

              position: 'absolute', inset: 0, zIndex: 225, background: 'rgba(2,6,18,0.78)',

              backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', direction: 'rtl',

            }}

          >

            <div style={{

              width: '100%', maxWidth: 420,

              background: 'linear-gradient(165deg, rgba(60,10,20,0.98), rgba(8,10,24,0.99))',

              borderTop: '1px solid rgba(251,113,133,0.45)', borderRadius: '24px 24px 0 0',

              padding: '18px 16px 26px', boxShadow: '0 -20px 50px rgba(0,0,0,0.7)',

            }}>

              <div style={{ fontSize: 15, fontWeight: 900, color: '#fecaca', textAlign: 'center' }}>⚔️ داواکاری شەڕ · ١v١</div>

              <div style={{ fontSize: 12, fontWeight: 800, color: '#e2e8f0', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>

                {incomingChallenge.fromName} داوای شەڕی ئارێنای کردووە

              </div>

              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textAlign: 'center', marginTop: 10, direction: 'ltr' }}>

                {Math.max(0, Math.ceil((incomingChallenge.expiresAtMs - Date.now()) / 1000))}ث

              </div>

              <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>١٥ چرکە بۆ قبوڵکردن یان ڕەتکردنەوە</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>

                <button

                  type="button"

                  disabled={challengeBusy}

                  onClick={() => void handleRespondFightChallenge(false)}

                  className="btn-interactive"

                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: '12px 8px', color: '#94a3b8', fontWeight: 900, fontSize: 12, fontFamily: 'var(--kd-font)' }}

                >ڕەتکردنەوە</button>

                <button

                  type="button"

                  disabled={challengeBusy}

                  onClick={() => void handleRespondFightChallenge(true)}

                  className="btn-interactive"

                  style={{ background: 'linear-gradient(135deg, rgba(251,113,133,0.4), rgba(127,29,29,0.45))', border: '1px solid rgba(251,113,133,0.55)', borderRadius: 12, padding: '12px 8px', color: '#fecaca', fontWeight: 900, fontSize: 12, fontFamily: 'var(--kd-font)' }}

                >قبوڵکردن</button>

              </div>

            </div>

          </div>

        )}

        {/* چاوەڕوانی داواکاری شەڕی نێردراو */}

        {outgoingChallenge && !arenaSession && (

          <div style={{ position: 'absolute', top: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 55, pointerEvents: 'none', direction: 'rtl' }}>

            <div style={{ background: 'rgba(40,8,12,0.92)', border: '1px solid #fb7185', borderRadius: 14, padding: '8px 14px', boxShadow: '0 0 22px rgba(251,113,133,0.35)', textAlign: 'center', minWidth: 170 }}>

              <div style={{ fontSize: 10, fontWeight: 900, color: '#fecaca' }}>چاوەڕوانی · {outgoingChallenge.name}</div>

              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', direction: 'ltr', marginTop: 2 }}>

                {Math.max(0, Math.ceil((outgoingChallenge.expiresAtMs - Date.now()) / 1000))}ث

              </div>

            </div>

          </div>

        )}

        {/* ئارێنای TPS ١v١ / سێپێکتەیت */}

        {arenaSession && authUserId && (

          <TpsArenaDuel

            duelId={arenaSession.duelId}

            myUid={authUserId}

            mode={arenaSession.mode}

            soundEnabled={soundEnabled}

            playGunSfx={playGunShotSfx}

            playReloadSfx={playReloadSfx}

            onSettled={handleArenaSettled}

            onClose={() => { clearDuelMapFx(); setArenaSession(null) }}

          />

        )}

        {/* بلۆک لەگەڵ هۆکار */}

        {blockReasonTarget && (

          <div

            onClick={e => { if (e.target === e.currentTarget) { setBlockReasonTarget(null); setBlockReasonText('') } }}

            style={{ position: 'absolute', inset: 0, zIndex: 210, background: 'rgba(2,6,18,0.78)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', direction: 'rtl' }}

          >

            <div style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(165deg, rgba(40,12,16,0.98), rgba(8,10,24,0.99))', borderTop: '1px solid rgba(248,113,113,0.4)', borderRadius: '24px 24px 0 0', padding: '18px 16px 26px' }}>

              <div style={{ fontSize: 14, fontWeight: 900, color: '#fecaca', marginBottom: 6 }}>🚫 بلۆککردنی {blockReasonTarget.name}</div>

              <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 10, lineHeight: 1.45 }}>هۆکارەکە بۆ ئەو کەسە دەنێردرێت. بلۆک تەنها نامەی تایبەت دەگرێت — ئاڤاتار لەسەر نەخشە دەمێنێتەوە.</div>

              <textarea

                value={blockReasonText}

                onChange={e => setBlockReasonText(e.target.value.slice(0, 280))}

                placeholder="هۆکاری بلۆک بنووسە..."

                rows={3}

                style={{ width: '100%', resize: 'none', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 12, padding: '10px 12px', color: '#fff', fontSize: 11, fontFamily: 'var(--kd-font)', outline: 'none', marginBottom: 12 }}

              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

                <button type="button" onClick={() => { setBlockReasonTarget(null); setBlockReasonText('') }} className="btn-interactive" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: '12px 8px', color: '#94a3b8', fontWeight: 900, fontSize: 11, fontFamily: 'var(--kd-font)' }}>پاشگەزبوونەوە</button>

                <button type="button" onClick={() => { void confirmBlockWithReason() }} className="btn-interactive" style={{ background: 'linear-gradient(135deg, rgba(248,113,113,0.3), rgba(127,29,29,0.4))', border: '1px solid rgba(248,113,113,0.5)', borderRadius: 12, padding: '12px 8px', color: '#fecaca', fontWeight: 900, fontSize: 11, fontFamily: 'var(--kd-font)' }}>بلۆک بکە</button>

              </div>

            </div>

          </div>

        )}

        {selectedFactoryId && (() => {
          const factory = NATIONAL_FACTORY_BY_ID[selectedFactoryId]
          if (!factory) return null
          const produced = producedAmountFromStock(
            factoryStock?.factoryId === factory.id ? factoryStock : null,
            factoryTickMs,
          )
          const pending = pendingAmountForFactory(
            factory,
            factoryStock?.factoryId === factory.id ? factoryStock : null,
            factoryProgress,
            factoryTickMs,
          )
          const remain = collectsRemainingToday(factoryProgress, factory.kind)
          const dailyMax = factory.kind === 'gold' ? FACTORY_GOLD_DAILY_CAP : FACTORY_DIAMOND_DAILY_CAP
          const waitMs = msUntilNextFactoryUnit(
            factoryStock?.factoryId === factory.id ? factoryStock : null,
            factory.kind,
            factoryTickMs,
          )
          const cyclePct = factoryCycleProgress(
            factoryStock?.factoryId === factory.id ? factoryStock : null,
            factory.kind,
            factoryTickMs,
          ) * 100
          const canCollect = pending > 0 && remain > 0 && !factoryCollectBusy && vipPasses.master.owned
          const unitName = factory.kind === 'gold' ? 'زێڕ' : 'ئەڵماس'
          const taken = dailyMax - remain
          const stockEmpty = produced <= 0
          const needsKurdistanPass = !vipPasses.master.owned
          return (
            <div
              className="kd-factory-sheet-backdrop"
              onClick={e => { if (e.target === e.currentTarget) closeNationalFactory() }}
              style={{
                position: 'absolute', inset: 0, zIndex: 210,
                background: 'transparent',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                direction: 'rtl',
                pointerEvents: 'auto',
              }}
            >
              <div
                className={`glass-surface kd-factory-panel${factory.kind === 'diamond' ? ' is-diamond' : ' is-gold'}`}
                onClick={e => e.stopPropagation()}
              >
                <div className="kd-factory-panel-head">
                  <div className="kd-factory-panel-title">{factoryLabel(factory)}</div>
                  <button
                    type="button"
                    className="btn-interactive kd-factory-close"
                    onClick={closeNationalFactory}
                    aria-label="داخستن"
                  >
                    <i className="material-icons" aria-hidden="true">close</i>
                  </button>
                </div>

                <div className={`kd-factory-timer${factory.kind === 'diamond' ? ' is-diamond' : ''}${stockEmpty ? ' is-empty' : ''}`}>
                  <div className="kd-factory-timer-main">
                    <span className="kd-factory-timer-label">
                      {stockEmpty ? 'چاوەڕوانی بەرهەم' : 'یەکەی داهاتوو'}
                    </span>
                    <span className="kd-factory-timer-clock" aria-live="polite">
                      {formatFactoryCountdown(waitMs)}
                    </span>
                  </div>
                  <div className="kd-factory-timer-bar" aria-hidden="true">
                    <span style={{ width: `${cyclePct}%` }} />
                  </div>
                </div>

                <div className="kd-factory-stat-row">
                  <div className={`kd-factory-stat${factory.kind === 'diamond' ? ' is-diamond' : ''}`}>
                    <strong>{produced.toLocaleString()}</strong>
                    <span>کۆگا</span>
                  </div>
                  <div className={`kd-factory-stat${factory.kind === 'diamond' ? ' is-diamond' : ''}`}>
                    <strong>{pending.toLocaleString()}</strong>
                    <span>دەتوانیت</span>
                  </div>
                  <div className="kd-factory-stat">
                    <strong>{taken}/{dailyMax}</strong>
                    <span>ڕۆژانە</span>
                  </div>
                </div>

                <div className="kd-factory-help">
                  {factory.kind === 'gold' ? '١ زێڕ / خولەک' : '١ ئەڵماس / ٥ خولەک'}
                  {' · '}
                  تەنها {factory.cityName}
                  {needsKurdistanPass ? ' · کۆکردنەوە تەنها بۆ ڕێڕەوی کوردستان' : ' · ڕێڕەوی کوردستان'}
                </div>

                <button
                  type="button"
                  className={`btn-interactive kd-factory-collect-btn${factory.kind === 'diamond' ? ' is-diamond' : ''}${needsKurdistanPass ? ' is-locked' : ''}`}
                  disabled={!canCollect}
                  onClick={() => { void handleCollectFactory() }}
                >
                  {needsKurdistanPass
                    ? '🔒 کۆکردنەوە پێویستی بە ڕێڕەوی کوردستانە'
                    : factoryCollectBusy
                      ? '…'
                      : canCollect
                        ? `کۆکردنەوە · ${pending.toLocaleString()} ${unitName}`
                        : remain <= 0
                          ? 'سنووری ڕۆژ تەواو'
                          : stockEmpty
                            ? `بەتاڵ · ${formatFactoryCountdown(waitMs)}`
                            : `چاوەڕوان · ${formatFactoryCountdown(waitMs)}`}
                </button>
              </div>
            </div>
          )
        })()}

        <Sheet active={activeSheet === 'chestInfo'} onClose={() => setActiveSheet(null)} heightAuto fitContent>

          <div
            className="kd-drop-modal-glass"
            style={{
              ['--kd-drop-neon' as string]: selectedChest.tarpColor,
              ['--kd-drop-neon-soft' as string]: selectedChest.p1,
            }}
          >
            <div className="kd-drop-modal-border-glow" aria-hidden="true" />

            <div className="kd-drop-modal-hero">
              <div className="kd-drop-modal-aura" aria-hidden="true" />
              <div className="kd-drop-modal-smoke" aria-hidden="true">
                <span className="s1" /><span className="s2" /><span className="s3" />
              </div>
              <div className="kd-drop-modal-crate" aria-hidden="true">
                <div className="kd-drop-modal-crate-lid" style={{ background: `linear-gradient(180deg, ${selectedChest.p1}, ${selectedChest.tarpColor})` }} />
                <div className="kd-drop-modal-crate-body" style={{ background: `linear-gradient(165deg, rgba(255,255,255,0.22), ${selectedChest.boxColor})`, borderColor: selectedChest.tarpColor }} />
                <div className="kd-drop-modal-crate-sheen" />
                <div className="kd-drop-modal-crate-pulse" />
              </div>
            </div>

            <h3 className="kd-drop-modal-title">{selectedChest.name}</h3>
            <div className="kd-drop-modal-rarity" style={{ color: selectedChest.tarpColor, borderColor: `${selectedChest.tarpColor}99`, background: `${selectedChest.tarpColor}22`, boxShadow: `0 0 14px ${selectedChest.tarpColor}44` }}>
              <i className="material-icons" aria-hidden="true">auto_awesome</i>
              ئاستی دەگمەنی: {selectedChest.rarity}
            </div>
            <p className="kd-drop-modal-desc">{selectedChest.desc}</p>

            <div className="kd-drop-modal-rewards">
              <div className="kd-drop-modal-rewards-label">
                <i className="material-icons" aria-hidden="true">card_giftcard</i>
                خەڵاتەکانی ناو درۆپ
              </div>
              <div className="kd-drop-modal-rewards-body">
                {selectedAirdropReward ? (
                  <>
                    {selectedAirdropReward.diamond > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <DiamondIcon size={12} /> {selectedAirdropReward.diamond}
                      </span>
                    )}
                    {selectedAirdropReward.gold > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <GoldIcon size={12} /> {selectedAirdropReward.gold.toLocaleString()}
                      </span>
                    )}
                    {selectedAirdropReward.itemNames.map(n => (
                      <span key={n}>🎁 {n}</span>
                    ))}
                  </>
                ) : selectedChest.rewards}
              </div>
            </div>

            <button
              type="button"
              onClick={() => selectedAirdropId && openChest(selectedAirdropId)}
              className="btn-interactive kd-drop-modal-cta"
              style={{
                background: `linear-gradient(135deg, ${selectedChest.tarpColor}, ${selectedChest.p2 || '#0b1220'})`,
                borderColor: selectedChest.tarpColor,
                boxShadow: `0 0 24px ${selectedChest.tarpColor}aa, 0 8px 18px rgba(0,0,0,0.35)`,
              }}
            >
              <i className="material-icons" aria-hidden="true">lock_open</i>
              کردنەوەی درۆپەکە
            </button>
          </div>

        </Sheet>

        {arDropSession && createPortal(
          <ArDropCamera
            chest={arDropSession.chest}
            distM={arDropSession.distM}
            claiming={arDropClaiming}
            claimBurst={arDropBurst}
            onClose={closeArDropSession}
            onClaim={() => { void claimArDrop() }}
          />,
          document.body,
        )}

      </div>
      </AppCrashBoundary>

      )}

    </>

  )
}
