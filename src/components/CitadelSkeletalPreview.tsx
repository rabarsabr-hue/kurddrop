import { useMemo } from 'react'
import { buildMapAuraOverlayHtml, type CosmeticDef } from '../cosmetics'
import { SKIN_PALETTE, type Avatar3DCustomization } from '../fullBody3dAvatar'
import type { Gender } from '../services/userService'

export interface CitadelSkeletalPreviewProps {
  gender: Gender
  avatar3d: Avatar3DCustomization
  mapAura?: CosmeticDef | null
  companion?: CosmeticDef | null
  emoteClass?: string | null
  gearIcon?: string | null
  animKey: number
}

/** CSS3D skeletal rig — joint-based preview (no Three.js) */
export default function CitadelSkeletalPreview({
  gender,
  avatar3d,
  mapAura,
  companion,
  emoteClass,
  gearIcon,
  animKey,
}: CitadelSkeletalPreviewProps) {
  const skinIdx = Math.max(0, Math.min(SKIN_PALETTE.length - 1, avatar3d.skinTone))
  const skin = SKIN_PALETTE[skinIdx]
  const outfit = avatar3d.outfitColor || (gender === 'female' ? '#9f1239' : '#1e3a5f')
  const outfitDark = gender === 'female' ? '#4c0519' : '#0f172a'
  const auraHtml = buildMapAuraOverlayHtml(mapAura ?? null)
  const petEmoji = companion?.companionFx?.emoji ?? null
  const petClass = companion?.companionFx?.companionClass ?? ''

  const rigClass = useMemo(() => {
    const base = 'kd-skel-rig'
    if (emoteClass) return `${base} ${emoteClass}`
    return `${base} kd-skel-idle`
  }, [emoteClass])

  return (
    <div className="kd-skel-preview">
      <div className="kd-skel-vignette" aria-hidden="true" />
      <div className="kd-skel-scene">
        <div className="kd-skel-grid-floor" aria-hidden="true" />
        <div className="kd-skel-spotlight" aria-hidden="true" />

        <div className="kd-skel-stage" key={animKey}>
          {auraHtml && (
            <div
              className="kd-skel-aura-wrap"
              dangerouslySetInnerHTML={{ __html: auraHtml }}
            />
          )}

          <div className={`${rigClass} kd-skel-gender-${gender}`}>
            <div className="kd-skel-root">
              <div className="kd-skel-pelvis" style={{ background: outfit }}>
                <div className="kd-skel-spine">
                  <div className="kd-skel-chest" style={{ background: outfit }}>
                    <div className="kd-skel-neck">
                      <div
                        className="kd-skel-head"
                        style={{ background: `linear-gradient(145deg, ${skin.light}, ${skin.base})` }}
                      >
                        <div className="kd-skel-hair" />
                        <div className="kd-skel-face" style={{ background: skin.blush }} />
                      </div>
                    </div>

                    <div className="kd-skel-shoulder kd-skel-shoulder-l">
                      <div className="kd-skel-upperarm" style={{ background: outfit }}>
                        <div className="kd-skel-lowerarm" style={{ background: skin.base }}>
                          <div className="kd-skel-hand" style={{ background: skin.light }} />
                        </div>
                      </div>
                    </div>

                    <div className="kd-skel-shoulder kd-skel-shoulder-r">
                      <div className="kd-skel-upperarm" style={{ background: outfit }}>
                        <div className="kd-skel-lowerarm" style={{ background: skin.base }}>
                          <div className="kd-skel-hand" style={{ background: skin.light }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="kd-skel-hip kd-skel-hip-l">
                  <div className="kd-skel-upperleg" style={{ background: outfitDark }}>
                    <div className="kd-skel-lowerleg" style={{ background: outfitDark }}>
                      <div className="kd-skel-foot" />
                    </div>
                  </div>
                </div>

                <div className="kd-skel-hip kd-skel-hip-r">
                  <div className="kd-skel-upperleg" style={{ background: outfitDark }}>
                    <div className="kd-skel-lowerleg" style={{ background: outfitDark }}>
                      <div className="kd-skel-foot" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {petEmoji && (
            <div className={`kd-skel-pet ${petClass}`}>
              <span className="kd-skel-pet-emoji">{petEmoji}</span>
            </div>
          )}

          {gearIcon && (
            <div className="kd-skel-gear-float" aria-hidden="true">
              <span>{gearIcon}</span>
            </div>
          )}
        </div>
      </div>
      <p className="kd-skel-caption">بینینی 3D · Skeletal Preview</p>
    </div>
  )
}
