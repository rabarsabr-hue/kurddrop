import type { CSSProperties } from 'react'
import type { CosmeticDef } from '../cosmetics'
import {
  USE_REALISTIC_3D_AVATAR,
  useRealistic3DAvatar,
  USE_FULL_BODY_3D_AVATAR,
  useFullBody3DAvatar,
  buildRealistic3DHumanHtml,
  buildFullBody3DHumanHtml,
  buildMapAvatarInnerHtml,
  buildHeadShotAvatarHtml,
  buildUiHeadShotInnerHtml,
  type AvatarGender,
  type Avatar3DCustomization,
  type Avatar3DViewMode,
} from '../realistic3dAvatar'
import {
  FULL_BODY_MARKER_WIDTH,
  FULL_BODY_MARKER_HEIGHT,
  FULL_BODY_ICON_ANCHOR_Y,
  fullBodyScaleForZoom,
  fullBodyMarkerMetrics,
} from '../fullBody3dAvatar'

export {
  USE_REALISTIC_3D_AVATAR,
  useRealistic3DAvatar,
  USE_FULL_BODY_3D_AVATAR,
  useFullBody3DAvatar,
  buildRealistic3DHumanHtml,
  buildFullBody3DHumanHtml,
  buildMapAvatarInnerHtml,
  buildHeadShotAvatarHtml,
  buildUiHeadShotInnerHtml,
  FULL_BODY_MARKER_WIDTH,
  FULL_BODY_MARKER_HEIGHT,
  FULL_BODY_ICON_ANCHOR_Y,
  fullBodyScaleForZoom,
  fullBodyMarkerMetrics,
}

export type { Avatar3DCustomization, Avatar3DViewMode }

/** React wrapper — respects full-body (static pose) → bust → classic switcher. */
export function Realistic3DAvatarDisc({
  avatarUrl = '',
  skin,
  border,
  sizePx = 38,
  gender,
  seed,
  isMoving,
  avatar3d,
  viewMode = 'full',
}: {
  avatarUrl?: string
  skin?: CosmeticDef | null
  border?: CosmeticDef | null
  sizePx?: number
  gender?: AvatarGender | null
  seed?: string
  isMoving?: boolean | null
  avatar3d?: Avatar3DCustomization | null
  viewMode?: Avatar3DViewMode
}) {
  const html = buildMapAvatarInnerHtml({
    avatarUrl,
    skin,
    border,
    sizePx: useFullBody3DAvatar ? (sizePx > 50 ? sizePx : FULL_BODY_MARKER_WIDTH) : sizePx,
    gender,
    seed,
    isMoving,
    avatar3d,
    viewMode,
  })

  const w = useFullBody3DAvatar ? (sizePx > 50 ? sizePx : FULL_BODY_MARKER_WIDTH) : sizePx
  const h = useFullBody3DAvatar
    ? (viewMode === 'head' ? w : Math.round(w * (FULL_BODY_MARKER_HEIGHT / FULL_BODY_MARKER_WIDTH)))
    : sizePx

  return (
    <span
      style={{
        display: 'inline-flex',
        width: w,
        height: h,
        borderRadius: useFullBody3DAvatar && viewMode !== 'head' ? 0 : '50%',
        overflow: useFullBody3DAvatar && viewMode !== 'head' ? 'visible' : 'hidden',
        flexShrink: 0,
        background: 'transparent',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** Circular head-shot for header / messaging chrome — never full-body. */
export function HeadShotAvatar({
  avatarUrl = '',
  skin,
  border,
  sizePx = 40,
  gender,
  seed,
  avatar3d,
  className,
  style,
}: {
  avatarUrl?: string
  skin?: CosmeticDef | null
  border?: CosmeticDef | null
  sizePx?: number
  gender?: AvatarGender | null
  seed?: string
  avatar3d?: Avatar3DCustomization | null
  className?: string
  style?: CSSProperties
}) {
  const html = buildUiHeadShotInnerHtml({
    avatarUrl,
    skin,
    border,
    sizePx,
    gender,
    seed,
    avatar3d,
  })
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        width: sizePx,
        height: sizePx,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
