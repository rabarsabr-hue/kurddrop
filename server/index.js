/**
 * Kurd Drop — Real-time Socket.io backend
 * Events: join_map, move_player, send_global_message, send_gift, update_xp
 */
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = Number(process.env.PORT) || 3001
const MAP_ROOM = 'map'

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.get('/health', (_req, res) => {
  res.json({ ok: true, players: playersByUid.size, uptimeMs: Date.now() - startedAt })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

/** @typedef {{
 *   uid: string
 *   socketId: string
 *   name: string
 *   gender: string
 *   lat: number
 *   lng: number
 *   avatarUrl: string | null
 *   showMyAvatarOnMap: boolean
 *   playerLevel: number
 *   playerXp: number
 *   joinedAtMs: number
 *   updatedAtMs: number
 * }} LivePlayer
 */

/** @type {Map<string, LivePlayer>} */
const playersByUid = new Map()
/** @type {Map<string, string>} socketId -> uid */
const uidBySocket = new Map()
const startedAt = Date.now()

function publicPlayersList(excludeUid = '') {
  const list = []
  for (const p of playersByUid.values()) {
    if (excludeUid && p.uid === excludeUid) continue
    if (p.showMyAvatarOnMap === false) continue
    list.push({ ...p })
  }
  return list
}

function sanitizePlayer(raw = {}, fallbackUid = '') {
  const uid = String(raw.uid || fallbackUid || '').trim()
  const lat = Number(raw.lat)
  const lng = Number(raw.lng)
  return {
    uid,
    name: String(raw.name || 'یاریزان').slice(0, 40),
    gender: raw.gender === 'female' ? 'female' : 'male',
    lat: Number.isFinite(lat) ? lat : 36.1911,
    lng: Number.isFinite(lng) ? lng : 44.0092,
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : null,
    showMyAvatarOnMap: raw.showMyAvatarOnMap !== false,
    playerLevel: Math.max(1, Math.floor(Number(raw.playerLevel) || 1)),
    playerXp: Math.max(0, Math.floor(Number(raw.playerXp) || 0)),
    skinId: raw.skinId ?? null,
    borderId: raw.borderId ?? null,
    titleId: raw.titleId ?? null,
    headwearId: raw.headwearId ?? null,
    accessoryId: raw.accessoryId ?? null,
    hunterLevel: Math.max(0, Math.floor(Number(raw.hunterLevel) || 0)),
    avatar3d: raw.avatar3d ?? null,
  }
}

io.on('connection', (socket) => {
  console.log(`[socket] connected ${socket.id}`)

  socket.on('join_map', (payload = {}) => {
    try {
      const base = sanitizePlayer(payload, payload.uid)
      if (!base.uid) {
        socket.emit('error_message', { message: 'join_map requires uid' })
        return
      }

      // Replace previous socket for same uid
      const prev = playersByUid.get(base.uid)
      if (prev && prev.socketId !== socket.id) {
        const oldSock = io.sockets.sockets.get(prev.socketId)
        if (oldSock) {
          uidBySocket.delete(prev.socketId)
          oldSock.leave(MAP_ROOM)
        }
      }

      const now = Date.now()
      /** @type {LivePlayer} */
      const player = {
        ...base,
        socketId: socket.id,
        joinedAtMs: prev?.joinedAtMs ?? now,
        updatedAtMs: now,
      }

      playersByUid.set(player.uid, player)
      uidBySocket.set(socket.id, player.uid)
      socket.join(MAP_ROOM)

      // Snapshot for the joiner
      socket.emit('map_state', {
        selfUid: player.uid,
        players: publicPlayersList(player.uid),
        serverTimeMs: now,
      })

      // Broadcast join to everyone (including self for consistency)
      io.to(MAP_ROOM).emit('player_joined', {
        player,
        players: publicPlayersList(),
      })

      console.log(`[socket] join_map uid=${player.uid} name=${player.name}`)
    } catch (err) {
      console.error('join_map failed:', err)
      socket.emit('error_message', { message: 'join_map failed' })
    }
  })

  socket.on('move_player', (payload = {}) => {
    try {
      const uid = String(payload.uid || uidBySocket.get(socket.id) || '').trim()
      if (!uid) return
      const existing = playersByUid.get(uid)
      if (!existing || existing.socketId !== socket.id) {
        // Allow move if joined under this socket
        if (!existing) return
      }

      const lat = Number(payload.lat)
      const lng = Number(payload.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

      const next = {
        ...existing,
        ...sanitizePlayer({ ...existing, ...payload, uid }, uid),
        lat,
        lng,
        socketId: socket.id,
        updatedAtMs: Date.now(),
      }
      playersByUid.set(uid, next)
      uidBySocket.set(socket.id, uid)

      // Instant broadcast to all map players
      io.to(MAP_ROOM).emit('player_moved', {
        uid,
        lat: next.lat,
        lng: next.lng,
        name: next.name,
        gender: next.gender,
        avatarUrl: next.avatarUrl,
        showMyAvatarOnMap: next.showMyAvatarOnMap,
        playerLevel: next.playerLevel,
        playerXp: next.playerXp,
        skinId: next.skinId,
        borderId: next.borderId,
        titleId: next.titleId,
        headwearId: next.headwearId,
        accessoryId: next.accessoryId,
        hunterLevel: next.hunterLevel,
        avatar3d: next.avatar3d,
        updatedAtMs: next.updatedAtMs,
      })
    } catch (err) {
      console.error('move_player failed:', err)
    }
  })

  socket.on('send_global_message', (payload = {}) => {
    try {
      const uid = String(payload.uid || uidBySocket.get(socket.id) || '').trim()
      const text = String(payload.text || '').trim().slice(0, 100)
      if (!uid || !text) return
      const name = String(payload.name || playersByUid.get(uid)?.name || 'یاریزان').slice(0, 40)
      const now = Date.now()
      const message = {
        id: `sock_chat_${now}_${Math.random().toString(36).slice(2, 8)}`,
        uid,
        name,
        text,
        isPremium: payload.isPremium === true,
        createdAtMs: now,
        expiresAtMs: now + 10_000,
        hiddenFromOthers: payload.hiddenFromOthers === true,
      }
      io.to(MAP_ROOM).emit('global_message', message)
      console.log(`[socket] chat from ${uid}: ${text.slice(0, 40)}`)
    } catch (err) {
      console.error('send_global_message failed:', err)
    }
  })

  socket.on('send_gift', (payload = {}) => {
    try {
      const fromUid = String(payload.fromUid || uidBySocket.get(socket.id) || '').trim()
      const toUid = String(payload.toUid || '').trim()
      if (!fromUid || !toUid) return
      const now = Date.now()
      const event = {
        id: String(payload.id || `sock_gift_${now}_${Math.random().toString(36).slice(2, 8)}`),
        fromUid,
        toUid,
        itemId: String(payload.itemId || 'gift'),
        emoji: String(payload.emoji || '🎁'),
        goldCost: Math.max(0, Math.floor(Number(payload.goldCost) || 0)),
        diamondCost: Math.max(0, Math.floor(Number(payload.diamondCost) || 0)),
        fromLat: Number(payload.fromLat) || 0,
        fromLng: Number(payload.fromLng) || 0,
        toLat: Number(payload.toLat) || 0,
        toLng: Number(payload.toLng) || 0,
        startMs: Number(payload.startMs) || now,
      }
      io.to(MAP_ROOM).emit('gift_received', event)
      console.log(`[socket] gift ${event.itemId} ${fromUid} -> ${toUid}`)
    } catch (err) {
      console.error('send_gift failed:', err)
    }
  })

  socket.on('update_xp', (payload = {}) => {
    try {
      const uid = String(payload.uid || uidBySocket.get(socket.id) || '').trim()
      if (!uid) return
      const playerLevel = Math.max(1, Math.floor(Number(payload.playerLevel) || 1))
      const playerXp = Math.max(0, Math.floor(Number(payload.playerXp) || 0))
      const existing = playersByUid.get(uid)
      if (existing && existing.socketId === socket.id) {
        existing.playerLevel = playerLevel
        existing.playerXp = playerXp
        existing.updatedAtMs = Date.now()
        playersByUid.set(uid, existing)
      }
      io.to(MAP_ROOM).emit('xp_updated', {
        uid,
        playerLevel,
        playerXp,
        leveledUp: payload.leveledUp === true,
        previousLevel: Number(payload.previousLevel) || playerLevel,
        name: existing?.name || payload.name || 'یاریزان',
        updatedAtMs: Date.now(),
      })
    } catch (err) {
      console.error('update_xp failed:', err)
    }
  })

  socket.on('disconnect', (reason) => {
    const uid = uidBySocket.get(socket.id)
    uidBySocket.delete(socket.id)
    if (!uid) {
      console.log(`[socket] disconnect ${socket.id} (${reason})`)
      return
    }
    const player = playersByUid.get(uid)
    if (player && player.socketId === socket.id) {
      playersByUid.delete(uid)
      io.to(MAP_ROOM).emit('player_left', { uid, name: player.name })
      io.to(MAP_ROOM).emit('players_sync', { players: publicPlayersList() })
      console.log(`[socket] leave_map uid=${uid} (${reason})`)
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`Kurd Drop Socket.io server listening on http://localhost:${PORT}`)
})
