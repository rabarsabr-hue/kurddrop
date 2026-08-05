/**
 * Leaflet DivIcon host for Rive map avatars.
 * When .riv assets are missing, callers keep using SVG via patchMarkerAvatarPose.
 */
import { useEffect, useRef } from 'react'
import {
  mountMapRiveAvatar,
  type MapRiveHandle,
  USE_RIVE_MAP_AVATAR,
} from '../rive/mapAvatarRuntime'

type Props = {
  gender: 'male' | 'female'
  width?: number
  height?: number
  pose?: string
  className?: string
}

export function MapRiveAvatar({
  gender,
  width = 48,
  height = 92,
  pose = 'stand_breathe',
  className,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const handleRef = useRef<MapRiveHandle | null>(null)

  useEffect(() => {
    if (!USE_RIVE_MAP_AVATAR || !hostRef.current) return
    let cancelled = false
    mountMapRiveAvatar({
      container: hostRef.current,
      gender,
      width,
      height,
    }).then((h) => {
      if (cancelled) {
        h.destroy()
        return
      }
      handleRef.current = h
      h.setPose(pose)
    })
    return () => {
      cancelled = true
      handleRef.current?.destroy()
      handleRef.current = null
    }
  }, [gender, width, height])

  useEffect(() => {
    handleRef.current?.setPose(pose)
  }, [pose])

  return (
    <div
      ref={hostRef}
      className={className ?? 'kd-map-rive-host'}
      style={{ width, height, position: 'relative', overflow: 'visible' }}
      data-pose={pose}
      aria-hidden
    />
  )
}

export { USE_RIVE_MAP_AVATAR }
