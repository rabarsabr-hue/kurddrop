/** دەستکاریکردنی کەسایەتی — ستودیۆی ئاڤاتاری ٣د */
import type { ReactNode } from 'react'
import type { Avatar3DCustomization, Avatar3DHairStyle, Avatar3DViewMode } from '../fullBody3dAvatar'
import {
  AVATAR_3D_EYE_COLORS,
  AVATAR_3D_HAIR_STYLES,
  AVATAR_3D_OUTFIT_COLORS,
  SKIN_PALETTE,
  HAIR_PALETTE,
} from '../fullBody3dAvatar'
import { HAIR_STYLE_LABELS_KU } from '../appHelpers'
import { Realistic3DAvatarDisc } from './Realistic3DAvatar'
import type { Gender } from '../services/userService'

type Props = {
  draft: Avatar3DCustomization
  cam: Avatar3DViewMode
  saving: boolean
  gender: Gender
  avatarUrl: string | null
  onCam: (m: Avatar3DViewMode) => void
  onChange: (next: Avatar3DCustomization) => void
  onClose: () => void
  onSave: () => void
}

function SwatchRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, direction: 'rtl' }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, direction: 'rtl' }}>{children}</div>
    </div>
  )
}

export function AvatarStudioPanel({
  draft,
  cam,
  saving,
  gender,
  avatarUrl,
  onCam,
  onChange,
  onClose,
  onSave,
}: Props) {
  const patch = (partial: Partial<Avatar3DCustomization>) => onChange({ ...draft, ...partial })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        direction: 'rtl',
        padding: '10px 8px',
        borderRadius: 14,
        border: '1px solid rgba(251,191,36,0.35)',
        background: 'linear-gradient(160deg, rgba(251,191,36,0.1), rgba(8,12,22,0.55))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="material-icons" style={{ color: '#fbbf24', fontSize: 15 }}>face</i>
          <span style={{ fontSize: 11.5, fontWeight: 900, color: '#fff' }}>دەستکاریکردنی کەسایەتی</span>
        </div>
        <button
          type="button"
          className="btn-interactive"
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '4px 8px',
            color: '#94a3b8',
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          داخستن
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <Realistic3DAvatarDisc
          avatarUrl={avatarUrl || ''}
          sizePx={cam === 'head' ? 88 : 110}
          gender={gender}
          avatar3d={draft}
          viewMode={cam}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {([
          { id: 'full' as const, label: 'تەواو' },
          { id: 'head' as const, label: 'سەر' },
        ]).map(opt => (
          <button
            key={opt.id}
            type="button"
            className="btn-interactive"
            onClick={() => onCam(opt.id)}
            style={{
              padding: '5px 12px',
              borderRadius: 9,
              border: `1px solid ${cam === opt.id ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.12)'}`,
              background: cam === opt.id ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
              color: '#f8fafc',
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <SwatchRow label="ڕەنگی پێست">
        {SKIN_PALETTE.map((tone, i) => (
          <button
            key={i}
            type="button"
            className="btn-interactive"
            aria-label={`پێست ${i + 1}`}
            onClick={() => patch({ skinTone: i })}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: draft.skinTone === i ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)',
              background: tone.base,
              padding: 0,
            }}
          />
        ))}
      </SwatchRow>

      <SwatchRow label="شێوازی قژ">
        {AVATAR_3D_HAIR_STYLES.map((style: Avatar3DHairStyle) => (
          <button
            key={style}
            type="button"
            className="btn-interactive"
            onClick={() => patch({ hairStyle: style })}
            style={{
              padding: '5px 9px',
              borderRadius: 8,
              border: `1px solid ${draft.hairStyle === style ? 'rgba(56,189,248,0.55)' : 'rgba(255,255,255,0.12)'}`,
              background: draft.hairStyle === style ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
              color: '#e2e8f0',
              fontSize: 9,
              fontWeight: 800,
            }}
          >
            {HAIR_STYLE_LABELS_KU[style]}
          </button>
        ))}
      </SwatchRow>

      <SwatchRow label="ڕەنگی قژ">
        {HAIR_PALETTE.map((tone, i) => (
          <button
            key={i}
            type="button"
            className="btn-interactive"
            aria-label={`قژ ${i + 1}`}
            onClick={() => patch({ hairColor: i })}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: draft.hairColor === i ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
              background: tone.base,
              padding: 0,
            }}
          />
        ))}
      </SwatchRow>

      <SwatchRow label="ڕەنگی چاو">
        {AVATAR_3D_EYE_COLORS.map(color => (
          <button
            key={color}
            type="button"
            className="btn-interactive"
            onClick={() => patch({ eyeColor: color })}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: draft.eyeColor === color ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.2)',
              background: color,
              padding: 0,
            }}
          />
        ))}
      </SwatchRow>

      <SwatchRow label="ڕەنگی جل">
        <button
          type="button"
          className="btn-interactive"
          onClick={() => patch({ outfitColor: '' })}
          style={{
            padding: '5px 9px',
            borderRadius: 8,
            border: `1px solid ${!draft.outfitColor ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.12)'}`,
            background: !draft.outfitColor ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.04)',
            color: '#e2e8f0',
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          بنەڕەت
        </button>
        {AVATAR_3D_OUTFIT_COLORS.map(color => (
          <button
            key={color}
            type="button"
            className="btn-interactive"
            onClick={() => patch({ outfitColor: color })}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: draft.outfitColor === color ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)',
              background: color,
              padding: 0,
            }}
          />
        ))}
      </SwatchRow>

      <button
        type="button"
        className="btn-interactive"
        disabled={saving}
        onClick={onSave}
        style={{
          width: '100%',
          marginTop: 4,
          padding: '11px 10px',
          borderRadius: 12,
          border: '1px solid rgba(251,191,36,0.5)',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.35), rgba(180,83,9,0.35))',
          color: '#fffbeb',
          fontWeight: 900,
          fontSize: 13,
          fontFamily: 'var(--kd-font)',
          opacity: saving ? 0.65 : 1,
        }}
      >
        {saving ? 'خەزنکردن...' : 'خەزنکردن'}
      </button>
    </div>
  )
}
