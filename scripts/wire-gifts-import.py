from __future__ import annotations

import re
from pathlib import Path

root = Path(r"G:\My Drive\Kurd Drop")
app = root / "src" / "App.tsx"
text = app.read_text(encoding="utf-8")

# Collapse runs of blank lines to a single blank line, then remove blank lines
# between short consecutive statements to shrink Babel parse size.
lines = text.splitlines(keepends=True)
out: list[str] = []
blank_run = 0
for line in lines:
    if line.strip() == "":
        blank_run += 1
        # keep at most one blank line
        if blank_run == 1:
            out.append("\n")
        continue
    blank_run = 0
    out.append(line)
text = "".join(out)

# Remove gift constants / types that moved to src/data/gifts.ts
# From DONATE_HOLD through DONATE_BY_ID (inclusive), keep flight helpers that remain.

patterns_to_remove = [
    # block of constants starting at DONATE_FLIGHT through VIP_GIFT_GIF and DONATE_ITEMS/BY_ID
]

# More reliable: remove known contiguous regions by markers
def remove_between(src: str, start_pat: str, end_pat: str, keep_end: bool = True) -> str:
    sm = re.search(start_pat, src)
    if not sm:
        print("MISS start", start_pat[:60])
        return src
    em = re.search(end_pat, src[sm.start():])
    if not em:
        print("MISS end", end_pat[:60])
        return src
    end_abs = sm.start() + em.start()
    if keep_end:
        return src[: sm.start()] + src[end_abs:]
    end_abs = sm.start() + em.end()
    return src[: sm.start()] + src[end_abs:]

# Remove from DONATE_FLIGHT_MIN_MS through DONATE_BY_ID reduce closing
text2 = remove_between(
    text,
    r"\nconst DONATE_FLIGHT_MIN_MS = 3_000\n",
    r"\n/\*\* شێوازی هێڵی فڕینی دیاری",
    keep_end=True,
)

# Remove isAmbientMapGift + VIP_GIFT_GIF if still present (may already be gone with block)
# Also remove giftPathStyleForItem function if duplicated - it may still be in App
# Check for remaining duplicates
for name in [
    "PREMIUM_GIFT_SENDER_SCALE",
    "VIP_GIFT_GIF",
    "const DONATE_ITEMS",
    "function isAmbientMapGift",
    "function isPremiumGiftItem",
    "function giftPathStyleForItem",
    "type DonateItemId",
    "type DonateItemDef",
    "type DonateItemTier",
    "type GiftPathStyle",
    "const DONATE_HOLD_MS",
    "const GIFT_FLY_ICON_PX",
    "const GIFT_OVERLAY_Z",
    "const GIFT_PATH_FADE_MS",
    "const DONATE_BY_ID",
    "const MAP_AMBIENT_GIFT_MS",
    "const GIFT_RECIPIENT_CUT_PCT",
    "const PREMIUM_GIFT_SENDER_BOOST_MS",
    "const PREMIUM_GIFT_GROW_MS",
    "const PREMIUM_GIFT_SENDER_Z_OFFSET",
    "const DONATE_ITEM_STAY_MS",
    "const DONATE_THUNDER_MS",
    "const DONATE_BURST_MS",
    "const DONATE_VIP_STAY_MS",
]:
    if name in text2 and name.startswith("const ") or name.startswith("function ") or name.startswith("type "):
        pass

# Remove giftPathStyleForItem function body still in App (moved to data/gifts)
text2 = re.sub(
    r"\n/\*\* شێوازی هێڵی فڕینی دیاری.*?\nfunction giftPathStyleForItem\(itemId: DonateItemId\): GiftPathStyle \{.*?\n\}\n",
    "\n",
    text2,
    count=1,
    flags=re.S,
)

# Remove isPremiumGiftItem if still defined locally later
text2 = re.sub(
    r"\nfunction isPremiumGiftItem\(itemId: DonateItemId\): boolean \{\n  return DONATE_BY_ID\[itemId\]\?\.tier === 'vip'\n\}\n",
    "\n",
    text2,
    count=1,
)

# Insert import after npcData import block / near top imports
gift_import = """
import {
  DONATE_HOLD_MS,
  PREMIUM_GIFT_SENDER_BOOST_MS,
  PREMIUM_GIFT_SENDER_SCALE,
  PREMIUM_GIFT_SENDER_Z_OFFSET,
  PREMIUM_GIFT_GROW_MS,
  GIFT_RECIPIENT_CUT_PCT,
  MAP_AMBIENT_GIFT_MS,
  DONATE_ITEM_STAY_MS,
  DONATE_THUNDER_MS,
  DONATE_BURST_MS,
  DONATE_VIP_STAY_MS,
  DONATE_FLIGHT_MIN_MS,
  DONATE_FLIGHT_MAX_MS,
  DONATE_FLIGHT_HARD_MAX_MS,
  DONATE_FLIGHT_SPEED_MPS,
  GIFT_FLY_ICON_PX,
  GIFT_OVERLAY_Z,
  GIFT_PATH_FADE_MS,
  VIP_GIFT_GIF,
  DONATE_ITEMS,
  DONATE_BY_ID,
  isAmbientMapGift,
  isPremiumGiftItem,
  giftPathStyleForItem,
  type DonateItemId,
  type DonateItemTier,
  type DonateItemDef,
  type GiftPathStyle,
} from './data/gifts'
"""

if "from './data/gifts'" not in text2:
    # place after leaflet css imports
    text2 = text2.replace(
        "import './styles/app.css'\n",
        "import './styles/app.css'\n" + gift_import,
        1,
    )
    print("Inserted gifts import")

app.write_text(text2, encoding="utf-8")
print("App.tsx", app.stat().st_size)
# sanity checks
for needle in ["const DONATE_ITEMS", "const VIP_GIFT_GIF", "type DonateItemId =", "function isAmbientMapGift"]:
    print(needle, "STILL IN APP" if needle in text2 else "ok removed")
