/**
 * Socket.io client for Kurd Drop real-time map sync.
 * Talks to server/index.js (join_map, move_player, send_global_message, send_gift, update_xp).
 */
import { io, type Socket } from 'socket.io-client'

export type SocketPlayerPayload = {
  uid: string
  name: string
  gender?: 'male' | 'female'
  lat: number
  lng: number
  avatarUrl?: string | null
  showMyAvatarOnMap?: boolean
  playerLevel?: number
  playerXp?: number
  skinId?: number | null
  borderId?: number | null
  titleId?: number | null
  headwearId?: number | null
  accessoryId?: number | null
  hunterLevel?: number
  playerId?: string
  avatar3d?: unknown
  updatedAtMs?: number
}

export type SocketChatPayload = {
  id: string
  uid: string
  name: string
  text: string
  isPremium?: boolean
  createdAtMs: number
  expiresAtMs: number
  /** دۆخی تارمایی — چاتی گشتی: تەنها نێرەر خۆی دەیبینێت، کەسانی تر نا */
  hiddenFromOthers?: boolean
}

export type SocketGiftPayload = {
  id: string
  fromUid: string
  toUid: string
  itemId: string
  emoji: string
  goldCost: number
  diamondCost: number
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  startMs: number
}

export type SocketXpPayload = {
  uid: string
  playerLevel: number
  playerXp: number
  leveledUp?: boolean
  previousLevel?: number
  name?: string
  updatedAtMs?: number
}

type SocketClientHandlers = {
  onConnect?: () => void
  onDisconnect?: (reason: string) => void
  onMapState?: (data: { selfUid: string; players: SocketPlayerPayload[]; serverTimeMs: number }) => void
  onPlayerJoined?: (data: { player: SocketPlayerPayload; players: SocketPlayerPayload[] }) => void
  onPlayerMoved?: (data: SocketPlayerPayload & { uid: string; lat: number; lng: number }) => void
  onPlayerLeft?: (data: { uid: string; name?: string }) => void
  onPlayersSync?: (data: { players: SocketPlayerPayload[] }) => void
  onGlobalMessage?: (message: SocketChatPayload) => void
  onGiftReceived?: (event: SocketGiftPayload) => void
  onXpUpdated?: (data: SocketXpPayload) => void
  onError?: (data: { message: string }) => void
}

function resolveSocketUrl(): string {
  const envUrl = (import.meta as { env?: { VITE_SOCKET_URL?: string } }).env?.VITE_SOCKET_URL
  if (envUrl && String(envUrl).trim()) return String(envUrl).trim().replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location.hostname) {
    // Dev / LAN: same-origin so Vite `/socket.io` proxy works on phones via IP
    // (phone only needs the Vite port — no direct :3001 firewall hole).
    const { hostname, port, protocol, origin } = window.location
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'
    const isPrivateLan =
      /^192\.168\.\d+\.\d+$/.test(hostname)
      || /^10\.\d+\.\d+\.\d+$/.test(hostname)
      || /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
    const isViteDevPort = port === '5173' || port === '5174' || port === ''
    if (import.meta.env.DEV || isViteDevPort || isPrivateLan || (isLocalHost && protocol === 'http:')) {
      return origin
    }
  }
  return 'http://localhost:3001'
}

class MapSocketClient {
  private socket: Socket | null = null
  private handlers: SocketClientHandlers = {}
  private selfUid: string | null = null

  get connected(): boolean {
    return Boolean(this.socket?.connected)
  }

  get uid(): string | null {
    return this.selfUid
  }

  setHandlers(handlers: SocketClientHandlers) {
    this.handlers = handlers
  }

  connect(uid: string, profile: Omit<SocketPlayerPayload, 'uid'> & { uid?: string }) {
    if (!uid) return
    this.selfUid = uid

    if (this.socket?.connected) {
      this.joinMap({ ...profile, uid })
      return
    }

    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }

    const url = resolveSocketUrl()
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 800,
    })

    const s = this.socket

    s.on('connect', () => {
      this.handlers.onConnect?.()
      this.joinMap({ ...profile, uid })
    })

    s.on('disconnect', (reason) => {
      this.handlers.onDisconnect?.(String(reason))
    })

    s.on('map_state', (data) => this.handlers.onMapState?.(data))
    s.on('player_joined', (data) => this.handlers.onPlayerJoined?.(data))
    s.on('player_moved', (data) => this.handlers.onPlayerMoved?.(data))
    s.on('player_left', (data) => this.handlers.onPlayerLeft?.(data))
    s.on('players_sync', (data) => this.handlers.onPlayersSync?.(data))
    s.on('global_message', (message) => this.handlers.onGlobalMessage?.(message))
    s.on('gift_received', (event) => this.handlers.onGiftReceived?.(event))
    s.on('xp_updated', (data) => this.handlers.onXpUpdated?.(data))
    s.on('error_message', (data) => this.handlers.onError?.(data))
  }

  private joinMap(payload: SocketPlayerPayload) {
    this.socket?.emit('join_map', payload)
  }

  /** Re-announce presence (e.g. after profile/avatar change). */
  emitJoinMap(payload: SocketPlayerPayload) {
    if (!this.socket?.connected) return
    this.socket.emit('join_map', payload)
  }

  emitMovePlayer(payload: SocketPlayerPayload) {
    if (!this.socket?.connected) return
    this.socket.emit('move_player', payload)
  }

  emitGlobalMessage(payload: {
    uid: string
    name: string
    text: string
    isPremium?: boolean
    hiddenFromOthers?: boolean
  }) {
    if (!this.socket?.connected) return
    this.socket.emit('send_global_message', payload)
  }

  emitGift(payload: Omit<SocketGiftPayload, 'id'> & { id?: string }) {
    if (!this.socket?.connected) return
    this.socket.emit('send_gift', payload)
  }

  emitXpUpdate(payload: {
    uid: string
    playerLevel: number
    playerXp: number
    leveledUp?: boolean
    previousLevel?: number
    name?: string
  }) {
    if (!this.socket?.connected) return
    this.socket.emit('update_xp', payload)
  }

  disconnect() {
    if (!this.socket) return
    this.socket.removeAllListeners()
    this.socket.disconnect()
    this.socket = null
    this.selfUid = null
  }
}

export const mapSocket = new MapSocketClient()
export { resolveSocketUrl }
