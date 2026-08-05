import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function hideBootSplash() {
  const boot = document.getElementById('kd-boot')
  if (boot) boot.hidden = true
}

function hideBootError() {
  const box = document.getElementById('kd-boot-error')
  if (!box) return
  box.classList.remove('is-on')
  box.setAttribute('hidden', '')
  box.setAttribute('aria-hidden', 'true')
}

function showBootError(err: unknown) {
  hideBootSplash()
  const box = document.getElementById('kd-boot-error')
  const msg = document.getElementById('kd-boot-error-msg')
  const btn = document.getElementById('kd-boot-reload')
  const text =
    err instanceof Error
      ? `${err.name}: ${err.message}\n\n${err.stack || ''}`
      : String(err)
  if (msg) msg.textContent = text
  if (box) {
    box.classList.add('is-on')
    box.removeAttribute('hidden')
    box.setAttribute('aria-hidden', 'false')
  }
  if (btn) btn.onclick = () => window.location.reload()
  try {
    ;(window as Window & { __KD_LAST_RENDER_ERROR?: string }).__KD_LAST_RENDER_ERROR = text
  } catch { /* ignore */ }
}

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RootErrorBoundary:', error, info)
    ;(window as Window & { __KD_LAST_RENDER_ERROR?: string }).__KD_LAST_RENDER_ERROR =
      `${error?.name || 'Error'}: ${error?.message || String(error)}\n${error?.stack || ''}\n${info?.componentStack || ''}`
  }

  render() {
    if (this.state.error) {
      const err = this.state.error
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#040812',
            color: '#f8fafc',
            fontFamily: 'system-ui, sans-serif',
            padding: 24,
            direction: 'rtl',
            overflow: 'auto',
            zIndex: 99999,
          }}
        >
          <h1 style={{ color: '#f87171', fontSize: 18, marginTop: 0 }}>هەڵەی پیشاندان</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#cbd5e1', direction: 'ltr', textAlign: 'left' }}>
            {`${err.name}: ${err.message}\n\n${err.stack || ''}`}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '10px 14px',
              fontWeight: 800,
              cursor: 'pointer',
              borderRadius: 10,
              border: '1px solid rgba(248,113,113,0.5)',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              color: '#fff',
            }}
          >
            دووبارە بارکردنەوە
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  showBootError(new Error('#root missing'))
} else {
  const root = createRoot(rootEl)

  // دەستپێکردنی پێشبارکردنی کارەکتەرەکان پێش App — نەخشە خێراتر پڕ دەبێت
  const characterPreload = import('./glb/mapGlbAvatarSystem')
    .then((m) => m.preloadCharacterTemplates())
    .catch((err) => console.warn('Character preload skipped:', err))

  // Dynamic import: broken App module → dark error UI (never blank white)
  void import('./App.tsx')
    .then(async (mod) => {
      try {
        const { preloadCurrencyPackImages } = await import('./currencyStore')
        preloadCurrencyPackImages()
      } catch (err) {
        console.warn('Currency preload skipped:', err)
      }

      // چاوەڕێی پێشبارکردن مەکە بۆ ڕێندەر — لە پاشخان درێژە بکێشێت
      void characterPreload

      const App = mod.default
      if (typeof App !== 'function') {
        throw new Error('App.tsx default export is missing')
      }

      root.render(
        <StrictMode>
          <RootErrorBoundary>
            <App />
          </RootErrorBoundary>
        </StrictMode>,
      )

      // First paint landed — clear boot chrome
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          hideBootError()
          hideBootSplash()
        })
      })
    })
    .catch((err) => {
      console.error('App module failed to load:', err)
      showBootError(err)
    })
}
