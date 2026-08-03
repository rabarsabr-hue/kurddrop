/**
 * Real-time multiplayer sync — Socket.io live channel + Firestore persistence helpers.
 */
import {
  publishMapDonation,
  type MapDonationEvent,
} from './services/mapDonationService'
import {
  sendMapChatMessage,
  type MapChatMessage,
} from './services/chatService'
import type { PlayerLocation } from './services/locationService'
import {
  mapSocket,
  type SocketChatPayload,
  type SocketGiftPayload,
  type SocketPlayerPayload,
  type SocketXpPayload,
} from './socketClient'

export type RealtimeConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected'

export type RealtimeEvent =
  | { channel: 'players'; type: 'sync'; players: PlayerLocation[] }
  | { channel: 'players'; type: 'moved'; player: SocketPlayerPayload }
  | { channel: 'players'; type: 'left'; uid: string }
  | { channel: 'gifts'; type: 'broadcast'; event: MapDonationEvent }
  | { channel: 'mapChat'; type: 'message'; message: SocketChatPayload }
  | { channel: 'xp'; type: 'updated'; data: SocketXpPayload }
  | { channel: 'system'; type: 'status'; state: RealtimeConnectionState }

type RealtimeHandler = (event: RealtimeEvent) => void

export function socketPlayerToLocation(p: SocketPlayerPayload): PlayerLocation {
  return {
    uid: p.uid,
    name: p.name || 'یاریزان',
    gender: p.gender === 'female' ? 'female' : 'male',
    lat: p.lat,
    lng: p.lng,
    isOnline: true,
    showMyAvatarOnMap: p.showMyAvatarOnMap !== false,
    avatarUrl: p.avatarUrl ?? null,
    avatar3d: (p.avatar3d as PlayerLocation['avatar3d']) ?? null,
    skinId: p.skinId ?? null,
    borderId: p.borderId ?? null,
    titleId: p.titleId ?? null,
    headwearId: p.headwearId ?? null,
    accessoryId: p.accessoryId ?? null,
    mapAuraId: null,
    companionId: null,
    smokeUntilMs: 0,
    duelFxUntilMs: 0,
    activeDuelId: null,
    hunterLevel: p.hunterLevel ?? 0,
    playerId: typeof p.playerId === 'string' ? p.playerId : '',
    isBot: false,
    lastSeenMs: p.updatedAtMs ?? Date.now(),
  }
}

export class RealtimeSyncClient {
  private handlers = new Set<RealtimeHandler>()
  private uid: string | null = null
  private _state: RealtimeConnectionState = 'idle'
  private lastProfile: SocketPlayerPayload | null = null

  get state(): RealtimeConnectionState {
    return this._state
  }

  get isConnected(): boolean {
    return mapSocket.connected
  }

  on(handler: RealtimeHandler): () => void {
    this.handlers.add(handler)
    return () => { this.handlers.delete(handler) }
  }

  private emit(event: RealtimeEvent) {
    this.handlers.forEach(h => {
      try { h(event) } catch (err) { console.error('Realtime handler failed:', err) }
    })
  }

  private setState(state: RealtimeConnectionState) {
    this._state = state
    this.emit({ channel: 'system', type: 'status', state })
  }

  /** Connect to Socket.io map room and register live handlers. */
  connect(uid: string, profile: SocketPlayerPayload): void {
    if (!uid) return
    this.uid = uid
    this.lastProfile = { ...profile, uid }
    this.setState('connecting')

    mapSocket.setHandlers({
      onConnect: () => this.setState('connected'),
      onDisconnect: () => this.setState('disconnected'),
      onMapState: (data) => {
        const players = (data.players || [])
          .filter(p => p.uid !== uid && p.showMyAvatarOnMap !== false)
          .map(socketPlayerToLocation)
        this.emit({ channel: 'players', type: 'sync', players })
      },
      onPlayerJoined: (data) => {
        const players = (data.players || [])
          .filter(p => p.uid !== uid && p.showMyAvatarOnMap !== false)
          .map(socketPlayerToLocation)
        this.emit({ channel: 'players', type: 'sync', players })
      },
      onPlayersSync: (data) => {
        const players = (data.players || [])
          .filter(p => p.uid !== uid && p.showMyAvatarOnMap !== false)
          .map(socketPlayerToLocation)
        this.emit({ channel: 'players', type: 'sync', players })
      },
      onPlayerMoved: (player) => {
        if (!player?.uid || player.uid === uid) return
        if (player.showMyAvatarOnMap === false) {
          this.emit({ channel: 'players', type: 'left', uid: player.uid })
          return
        }
        this.emit({ channel: 'players', type: 'moved', player })
      },
      onPlayerLeft: (data) => {
        if (!data?.uid || data.uid === uid) return
        this.emit({ channel: 'players', type: 'left', uid: data.uid })
      },
      onGlobalMessage: (message) => {
        this.emit({ channel: 'mapChat', type: 'message', message })
      },
      onGiftReceived: (event) => {
        this.emit({ channel: 'gifts', type: 'broadcast', event: event as MapDonationEvent })
      },
      onXpUpdated: (data) => {
        this.emit({ channel: 'xp', type: 'updated', data })
      },
    })

    mapSocket.connect(uid, profile)
  }

  rejoin(profile: SocketPlayerPayload) {
    if (!this.uid) return
    this.lastProfile = { ...profile, uid: this.uid }
    mapSocket.emitJoinMap(this.lastProfile)
  }

  emitMove(profile: Partial<SocketPlayerPayload> & { lat: number; lng: number }) {
    if (!this.uid) return
    const payload: SocketPlayerPayload = {
      uid: this.uid,
      name: profile.name || this.lastProfile?.name || 'یاریزان',
      gender: profile.gender || this.lastProfile?.gender || 'male',
      lat: profile.lat,
      lng: profile.lng,
      avatarUrl: profile.avatarUrl ?? this.lastProfile?.avatarUrl ?? null,
      showMyAvatarOnMap: profile.showMyAvatarOnMap ?? this.lastProfile?.showMyAvatarOnMap,
      playerLevel: profile.playerLevel ?? this.lastProfile?.playerLevel,
      playerXp: profile.playerXp ?? this.lastProfile?.playerXp,
      skinId: profile.skinId ?? this.lastProfile?.skinId,
      borderId: profile.borderId ?? this.lastProfile?.borderId,
      titleId: profile.titleId ?? this.lastProfile?.titleId,
      headwearId: profile.headwearId ?? this.lastProfile?.headwearId,
      accessoryId: profile.accessoryId ?? this.lastProfile?.accessoryId,
      hunterLevel: profile.hunterLevel ?? this.lastProfile?.hunterLevel,
      avatar3d: profile.avatar3d ?? this.lastProfile?.avatar3d,
    }
    this.lastProfile = payload
    mapSocket.emitMovePlayer(payload)
  }

  emitXp(data: {
    playerLevel: number
    playerXp: number
    leveledUp?: boolean
    previousLevel?: number
    name?: string
  }) {
    if (!this.uid) return
    mapSocket.emitXpUpdate({ uid: this.uid, ...data })
  }

  disconnect(): void {
    mapSocket.disconnect()
    this.uid = null
    this.lastProfile = null
    if (this._state !== 'idle') this.setState('disconnected')
  }

  /** Firestore persist + Socket.io live broadcast */
  async broadcastGift(event: Omit<MapDonationEvent, 'id'>): Promise<string> {
    const id = await publishMapDonation(event)
    mapSocket.emitGift({ ...event, id })
    return id
  }

  /** Socket.io live broadcast + Firestore persist */
  async broadcastMapChat(input: {
    uid: string
    name: string
    text: string
    isPremium?: boolean
    playerId?: string
    hiddenFromOthers?: boolean
  }): Promise<MapChatMessage | null> {
    mapSocket.emitGlobalMessage(input)
    return sendMapChatMessage({
      ...input,
      isPremium: Boolean(input.isPremium),
      playerId: input.playerId,
      hiddenFromOthers: input.hiddenFromOthers,
    })
  }
}

export const realtimeSync = new RealtimeSyncClient()

export type { SocketGiftPayload, SocketChatPayload, SocketPlayerPayload }
