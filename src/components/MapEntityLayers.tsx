/**
 * Map entity performance layer — React.memo players + DOM overlay patches
 * (chat/gift) so Leaflet avatar icons are not rebuilt on every bubble/FX.
 */

import { memo, useCallback, type CSSProperties } from 'react'
import type L from 'leaflet'

/** Props بۆ ڕیز/چێپـی یاریزان لە UI (نەک Leaflet HTML) */
export type MapPlayerChipProps = {
  uid: string
  name: string
  lat: number
  lng: number
  distM: number
  isOnline: boolean
  avatarUrl: string | null
  gender: string
  isNpc?: boolean
  onFocus?: (uid: string, lat: number, lng: number) => void
}

export function areMapPlayerChipPropsEqual(
  prev: MapPlayerChipProps,
  next: MapPlayerChipProps,
): boolean {
  // تەنها کاتێک پۆتان / دووری / ناساندن بگۆڕێت نوێ دەبێتەوە
  return (
    prev.uid === next.uid
    && prev.lat === next.lat
    && prev.lng === next.lng
    && prev.distM === next.distM
    && prev.name === next.name
    && prev.isOnline === next.isOnline
    && prev.avatarUrl === next.avatarUrl
    && prev.gender === next.gender
    && prev.isNpc === next.isNpc
    && prev.onFocus === next.onFocus
  )
}

export const MapPlayerChip = memo(function MapPlayerChip({
  uid,
  name,
  lat,
  lng,
  distM,
  isOnline,
  avatarUrl,
  isNpc,
  onFocus,
}: MapPlayerChipProps) {
  const handleClick = useCallback(() => {
    onFocus?.(uid, lat, lng)
  }, [onFocus, uid, lat, lng])

  const style: CSSProperties = {
    transform: 'translate3d(0,0,0)',
    willChange: 'transform',
  }

  return (
    <button
      type="button"
      className="kd-nearby-row btn-interactive"
      style={style}
      onClick={handleClick}
      data-uid={uid}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="kd-nearby-avatar" />
      ) : (
        <span className="kd-nearby-avatar-fallback" aria-hidden="true">👤</span>
      )}
      <span className="kd-nearby-meta">
        <span className="kd-nearby-name">{name}</span>
        <span className="kd-nearby-dist">
          {isOnline ? '🟢' : '⚫'} {Math.round(distM)}م
        </span>
      </span>
    </button>
  )
}, areMapPlayerChipPropsEqual)

export const MapNpcChip = memo(function MapNpcChip(props: MapPlayerChipProps) {
  return <MapPlayerChip {...props} isNpc />
}, areMapPlayerChipPropsEqual)

/** Chat float layer — سەرووی gift traj (10050) لەناو map container */
export const MAP_CHAT_FLOAT_Z_INDEX = 99999

/** Zoom where bubbles reach full readable size */
export const MAP_CHAT_ZOOM_FULL = 16
/** Zoom at/below which bubbles use minimum scale */
export const MAP_CHAT_ZOOM_MIN = 11
export const MAP_CHAT_SCALE_MIN = 0.55
export const MAP_CHAT_SCALE_MAX = 1
/** Below this scale, enable line-clamp / compact overflow */
export const MAP_CHAT_ZOOMED_OUT_SCALE = 0.85

type LeafletMarkerWithMap = L.Marker & { _map?: L.Map | null }

function resolveMarkerMap(marker: L.Marker): L.Map | null {
  const m = marker as LeafletMarkerWithMap
  return m._map ?? null
}

function resolveMarkerChatUid(marker: L.Marker, root?: HTMLElement | null): string {
  const el = root ?? marker.getElement()
  if (!el) return `m_${(marker as unknown as { _leaflet_id?: number })._leaflet_id ?? 'x'}`
  const fromAttr =
    el.querySelector('[data-uid]')?.getAttribute('data-uid')
    || el.querySelector('.kd-map-chat-bubble')?.getAttribute('data-chat-uid')
  if (fromAttr) return fromAttr
  return `m_${(marker as unknown as { _leaflet_id?: number })._leaflet_id ?? 'x'}`
}

/**
 * Map zoom → bubble scale (clamped 0.55–1.0).
 * Linear between zoom 11 (min) and 16 (full).
 */
export function mapChatBubbleZoomScale(zoom: number): number {
  const z = Number(zoom)
  if (!Number.isFinite(z)) return MAP_CHAT_SCALE_MAX
  if (z >= MAP_CHAT_ZOOM_FULL) return MAP_CHAT_SCALE_MAX
  if (z <= MAP_CHAT_ZOOM_MIN) return MAP_CHAT_SCALE_MIN
  const t = (z - MAP_CHAT_ZOOM_MIN) / (MAP_CHAT_ZOOM_FULL - MAP_CHAT_ZOOM_MIN)
  return MAP_CHAT_SCALE_MIN + t * (MAP_CHAT_SCALE_MAX - MAP_CHAT_SCALE_MIN)
}

/** نوێکردنەوەی --kd-chat-zoom-scale + is-zoomed-out لەسەر float layer */
export function applyMapChatZoomScale(layer: HTMLElement, map: L.Map): number {
  const scale = mapChatBubbleZoomScale(map.getZoom())
  const rounded = Number(scale.toFixed(4))
  layer.style.setProperty('--kd-chat-zoom-scale', String(rounded))
  layer.classList.toggle('is-zoomed-out', rounded < MAP_CHAT_ZOOMED_OUT_SCALE)
  return rounded
}

/** لایەری سەرووی نەخشە بۆ bubble ـەکان (بەرزتر لە gift SVG) */
export function ensureMapChatFloatLayer(map: L.Map): HTMLDivElement {
  const container = map.getContainer()
  let layer = container.querySelector(':scope > .kd-map-chat-float-layer') as HTMLDivElement | null
  if (!layer) {
    layer = document.createElement('div')
    layer.className = 'kd-map-chat-float-layer'
    layer.setAttribute('data-overlay', 'map-chat-float')
    layer.setAttribute('aria-hidden', 'true')
  }
  // هەمیشە دوایین منداڵ — لەگەڵ z-index بەرزتر لە gift
  container.appendChild(layer)
  layer.style.zIndex = String(MAP_CHAT_FLOAT_Z_INDEX)
  layer.style.pointerEvents = 'none'
  applyMapChatZoomScale(layer, map)
  return layer
}

/** Default iconAnchor Y for 40×40 center-anchored player markers */
const DEFAULT_CHAT_HEAD_OFFSET_Y = 20

/** iconAnchor Y = px from geo point up to icon top (bubble host sits there). */
function resolveChatHeadOffsetY(marker: L.Marker): number {
  try {
    const icon = marker.options.icon as { options?: { iconAnchor?: L.PointExpression } } | undefined
    const rawAnchor = icon?.options?.iconAnchor
    if (Array.isArray(rawAnchor) && rawAnchor.length >= 2) {
      const ay = Number(rawAnchor[1])
      if (Number.isFinite(ay) && ay > 0) return ay
    } else if (rawAnchor && typeof rawAnchor === 'object' && 'y' in (rawAnchor as object)) {
      const ay = Number((rawAnchor as { y: number }).y)
      if (Number.isFinite(ay) && ay > 0) return ay
    }
  } catch { /* ignore */ }
  return DEFAULT_CHAT_HEAD_OFFSET_Y
}

function storeChatFloatGeo(host: HTMLElement, lat: number, lng: number, headOy: number): void {
  host.setAttribute('data-lat', String(lat))
  host.setAttribute('data-lng', String(lng))
  host.setAttribute('data-chat-head-oy', String(headOy))
}

/** Reproject stored lat/lng → container px (no DOM layout / no getBoundingClientRect). */
function applyChatFloatHostTransform(map: L.Map, host: HTMLElement): boolean {
  const lat = Number(host.getAttribute('data-lat'))
  const lng = Number(host.getAttribute('data-lng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  let headOy = Number(host.getAttribute('data-chat-head-oy'))
  if (!Number.isFinite(headOy) || headOy <= 0) headOy = DEFAULT_CHAT_HEAD_OFFSET_Y
  const pt = map.latLngToContainerPoint([lat, lng])
  // translate3d = geo lock; CSS `scale(var(--kd-chat-zoom-scale))` composes separately
  host.style.transform = `translate3d(${pt.x.toFixed(2)}px, ${(pt.y - headOy).toFixed(2)}px, 0)`
  host.style.transformOrigin = '0 0'
  return true
}

/**
 * Bind float host to marker geographic lat/lng (not screen-relative getBoundingClientRect).
 * Geo point = Leaflet iconAnchor; host sits at icon top-center (bubble above head via CSS bottom).
 */
function positionChatFloatHost(map: L.Map, marker: L.Marker, host: HTMLElement): void {
  const ll = marker.getLatLng()
  if (!ll || !Number.isFinite(ll.lat) || !Number.isFinite(ll.lng)) return
  storeChatFloatGeo(host, ll.lat, ll.lng, resolveChatHeadOffsetY(marker))
  applyChatFloatHostTransform(map, host)
}

/** نوێکردنەوەی پۆتانی هەموو bubble ـە فڕیوەکان (move/zoom/rAF — geo reproject) */
export function syncAllMapChatFloatPositions(
  map: L.Map,
  getMarker: (uid: string) => L.Marker | null | undefined,
): void {
  const layer = map.getContainer().querySelector(':scope > .kd-map-chat-float-layer') as HTMLElement | null
  if (!layer) return
  // Zoom scale + is-zoomed-out in the same sync path as position
  applyMapChatZoomScale(layer, map)
  if (!layer.childElementCount) return
  const hosts = layer.querySelectorAll<HTMLElement>('[data-chat-float]')
  for (const host of hosts) {
    const uid = host.getAttribute('data-chat-float')
    if (!uid) continue
    const marker = getMarker(uid)
    if (!marker) {
      host.remove()
      continue
    }
    try {
      // Refresh lat/lng from live marker, then reproject (works even if icon DOM is briefly gone)
      positionChatFloatHost(map, marker, host)
    } catch {
      if (!applyChatFloatHostTransform(map, host)) host.remove()
    }
  }
}

/** دڵنیابوون لە slotـەکانی overlay لەناو مارکەر (بێ ڕیفڕێشی ئاڤاتار) */
export function ensureMapOverlaySlots(root: HTMLElement): {
  chat: HTMLElement
  fx: HTMLElement
} {
  const visual = root.querySelector('.map-avatar-visual') as HTMLElement | null
  const marker = root.querySelector('.map-avatar-marker') as HTMLElement | null
  const inner = root.querySelector('.avatar-inner') as HTMLElement | null
  // Chat دەبێت دەرەوەی .map-avatar-visual بێت — filter/transform کلیپ دەکات
  const chatHost = inner ?? root

  let chat = chatHost.querySelector(':scope > .kd-map-overlay-chat') as HTMLElement | null
  if (!chat) {
    chat = root.querySelector('.kd-map-overlay-chat') as HTMLElement | null
    if (chat && chat.parentElement !== chatHost) {
      chatHost.insertBefore(chat, chatHost.firstChild)
    }
  }
  if (!chat) {
    chat = document.createElement('div')
    chat.className = 'kd-map-overlay-layer kd-map-overlay-chat'
    chat.setAttribute('data-overlay', 'chat')
    chatHost.insertBefore(chat, chatHost.firstChild)
  }

  const fxHost = marker ?? visual ?? chatHost
  let fx = fxHost.querySelector('.kd-map-overlay-fx') as HTMLElement | null
  if (!fx) {
    fx = document.createElement('div')
    fx.className = 'kd-map-overlay-layer kd-map-overlay-fx'
    fx.setAttribute('data-overlay', 'fx')
    fxHost.appendChild(fx)
  }

  return { chat, fx }
}

export function patchMarkerChatOverlay(marker: L.Marker, html: string, uidHint?: string): boolean {
  const el = marker.getElement()
  const map = resolveMarkerMap(marker)

  // Clear in-marker slot — bubble دەچێتە float layer (بەرزتر لە gift)
  if (el) {
    const { chat } = ensureMapOverlaySlots(el)
    if (chat.innerHTML) chat.innerHTML = ''
  }

  if (!map) {
    if (!el) return false
    const { chat } = ensureMapOverlaySlots(el)
    if (chat.innerHTML === html) return false
    chat.innerHTML = html
    return true
  }

  const layer = ensureMapChatFloatLayer(map)
  const uid = (uidHint && uidHint.length > 0) ? uidHint : resolveMarkerChatUid(marker, el)
  let host: HTMLElement | null = null
  for (let i = 0; i < layer.children.length; i++) {
    const n = layer.children[i] as HTMLElement
    if (n.getAttribute('data-chat-float') === uid) {
      host = n
      break
    }
  }

  if (!html) {
    if (!host) return false
    host.remove()
    return true
  }

  if (!host) {
    host = document.createElement('div')
    host.className = 'kd-map-chat-float-host'
    host.setAttribute('data-chat-float', uid)
    const scaleWrap = document.createElement('div')
    scaleWrap.className = 'kd-map-chat-float-scale'
    host.appendChild(scaleWrap)
    layer.appendChild(host)
  }

  // Zoom scale lives on a nested wrapper — scaling the SAME element that also
  // carries the position `transform` (translate3d) would multiply the two
  // (CSS applies `transform` before the standalone `scale` property), causing
  // the bubble to drift toward the origin as zoom scale shrinks. Keeping
  // position (host, translate3d, no transition) and zoom-scale (child wrapper,
  // `transform: scale()`, transitions) on separate elements avoids that.
  let scaleWrap = host.firstElementChild as HTMLElement | null
  if (!scaleWrap || !scaleWrap.classList.contains('kd-map-chat-float-scale')) {
    scaleWrap = document.createElement('div')
    scaleWrap.className = 'kd-map-chat-float-scale'
    host.insertBefore(scaleWrap, host.firstChild)
  }

  const changed = scaleWrap.innerHTML !== html
  if (changed) scaleWrap.innerHTML = html
  positionChatFloatHost(map, marker, host)

  // Boost marker above peers while chatting (avatars still under float chat)
  try {
    const cur = typeof marker.options.zIndexOffset === 'number' ? marker.options.zIndexOffset : 0
    if (cur < 7500) marker.setZIndexOffset(7500 + (cur % 800))
  } catch { /* ignore */ }

  return changed
}

export function patchMarkerFxOverlay(marker: L.Marker, html: string): boolean {
  const el = marker.getElement()
  if (!el) return false
  const { fx } = ensureMapOverlaySlots(el)
  if (fx.innerHTML === html) return false
  fx.innerHTML = html
  return true
}

/** GPU-friendly position hint on Leaflet icon DOM (inner visual only) */
export function applyGpuAvatarTransform(
  marker: L.Marker,
  opts: { scale?: number; selected?: boolean },
): void {
  const el = marker.getElement()
  if (!el) return
  const visual = el.querySelector('.map-avatar-visual') as HTMLElement | null
  if (!visual) return
  const scale = opts.scale ?? 1
  const selectedBoost = opts.selected ? 1.42 : 1
  visual.style.willChange = 'transform'
  visual.style.transform = `translate3d(-50%, 0, 0) scale(${scale * selectedBoost})`
  visual.classList.toggle('is-selected', opts.selected === true)
}

/** یەکەم جار enter-animation؛ نوێکردنەوەی دواتر بێ pop */
export function markAvatarFirstEnter(marker: L.Marker): void {
  const el = marker.getElement()
  if (!el) return
  const node = el.querySelector('.map-avatar-marker')
  if (!node) return
  node.classList.add('is-enter')
  window.setTimeout(() => {
    try { node.classList.remove('is-enter') } catch { /* ignore */ }
  }, 450)
}

/** fade-in نەرم کاتێک یاریزان دێتە سەر خەت */
export function markAvatarAppearFade(marker: L.Marker, durationMs = 900): void {
  const el = marker.getElement()
  if (!el) return
  const node = el.querySelector('.map-avatar-marker')
  if (!node) return
  node.classList.remove('is-enter', 'is-disappear')
  node.classList.add('is-appear')
  window.setTimeout(() => {
    try { node.classList.remove('is-appear') } catch { /* ignore */ }
  }, Math.max(400, durationMs) + 80)
}

/** fade-out نەرم پێش Relocation */
export function markAvatarDisappearFade(marker: L.Marker, durationMs = 900): void {
  const el = marker.getElement()
  if (!el) return
  const node = el.querySelector('.map-avatar-marker')
  if (!node) return
  if (node.classList.contains('is-disappear')) return
  node.classList.remove('is-enter', 'is-appear')
  node.classList.add('is-disappear')
  window.setTimeout(() => {
    try { node.classList.remove('is-disappear') } catch { /* ignore */ }
  }, Math.max(400, durationMs) + 80)
}

export type BatchedMapOverlayUpdate =
  | { kind: 'chat'; uid: string; html: string }
  | { kind: 'fx'; uid: string; html: string }
  | { kind: 'clearChat'; uid: string }
  | { kind: 'clearFx'; uid: string }

/** جێبەجێکردنی چەند نوێکردنەوەی overlay لە یەک frame */
export function flushBatchedMapOverlays(
  updates: BatchedMapOverlayUpdate[],
  getMarker: (uid: string) => L.Marker | null | undefined,
): void {
  if (updates.length === 0) return
  for (const u of updates) {
    const marker = getMarker(u.uid)
    if (!marker) continue
    if (u.kind === 'chat') patchMarkerChatOverlay(marker, u.html, u.uid)
    else if (u.kind === 'fx') patchMarkerFxOverlay(marker, u.html)
    else if (u.kind === 'clearChat') patchMarkerChatOverlay(marker, '', u.uid)
    else if (u.kind === 'clearFx') patchMarkerFxOverlay(marker, '')
  }
}
