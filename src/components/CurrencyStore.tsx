/** فرۆشگای زێڕ و ئەڵماس — تەنها کارتەکانی پاکێج (نرخ بە USD) */
import type { GoldPackDef, GemPackDef } from '../currencyStore'
import { GOLD_STORE_PACKS, GEM_STORE_PACKS, formatUsd } from '../currencyStore'

type CurrencyStoreProps = {
  mode: 'gold' | 'diamond'
  onBuyGoldPack: (pack: GoldPackDef) => void
  onBuyGemPack: (pack: GemPackDef) => void
}

function PackImage({ src, priority }: { src: string; priority: boolean }) {
  return (
    <img
      src={src}
      alt=""
      className="kd-currency-pack-img"
      draggable={false}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'low'}
      width={120}
      height={120}
    />
  )
}

export function CurrencyStore({
  mode,
  onBuyGoldPack,
  onBuyGemPack,
}: CurrencyStoreProps) {
  const isGold = mode === 'gold'

  return (
    <div className={`kd-currency-store${isGold ? ' is-gold' : ' is-gem'}`} dir="rtl">
      <div className="kd-currency-pack-grid" role="list">
        {isGold
          ? GOLD_STORE_PACKS.map((pack, idx) => (
              <button
                key={pack.id}
                type="button"
                role="listitem"
                className="kd-currency-pack kd-currency-pack--gold"
                onClick={() => onBuyGoldPack(pack)}
                aria-label={`کڕینی ${pack.gold.toLocaleString()} زێڕ بە ${formatUsd(pack.usd)}`}
              >
                {pack.badge ? <span className="kd-currency-pack-badge">{pack.badge}</span> : null}
                <div className="kd-currency-pack-art">
                  <PackImage src={pack.image} priority={idx < 4} />
                </div>
                <div className="kd-currency-pack-meta">
                  <span className="kd-currency-pack-amount">{pack.gold.toLocaleString()}</span>
                  <span className="kd-currency-pack-unit">زێڕ</span>
                </div>
                <span className="kd-currency-pack-price kd-currency-pack-price--usd">
                  {formatUsd(pack.usd)}
                </span>
              </button>
            ))
          : GEM_STORE_PACKS.map((pack, idx) => (
              <button
                key={pack.id}
                type="button"
                role="listitem"
                className="kd-currency-pack kd-currency-pack--gem"
                onClick={() => onBuyGemPack(pack)}
                aria-label={`کڕینی ${pack.gems.toLocaleString()} ئەڵماس بە ${formatUsd(pack.usd)}`}
              >
                {pack.badge ? <span className="kd-currency-pack-badge">{pack.badge}</span> : null}
                <div className="kd-currency-pack-art">
                  <PackImage src={pack.image} priority={idx < 4} />
                </div>
                <div className="kd-currency-pack-meta">
                  <span className="kd-currency-pack-amount">{pack.gems.toLocaleString()}</span>
                  <span className="kd-currency-pack-unit">ئەڵماس</span>
                </div>
                <span className="kd-currency-pack-price kd-currency-pack-price--usd">
                  {formatUsd(pack.usd)}
                </span>
              </button>
            ))}
      </div>
    </div>
  )
}
