from pathlib import Path
import re

helpers_path = Path(r"G:\My Drive\Kurd Drop\src\appHelpers.tsx")
app_path = Path(r"G:\My Drive\Kurd Drop\src\App.tsx")
t = helpers_path.read_text(encoding="utf-8")
lines = t.splitlines(keepends=True)

# First export after the initial top imports / GoldIcon block
first_export = next(
    i for i, l in enumerate(lines)
    if l.startswith("export function") or l.startswith("export class")
)
print("first_export", first_export + 1)

# Find first misplaced import after AppCrashBoundary class ends
# Look for `import {` or `import type` or `import X from` after first_export
mis_start = None
for i in range(first_export, len(lines)):
    if lines[i].startswith("import "):
        mis_start = i
        break
print("mis_start", mis_start + 1 if mis_start is not None else None)

# Find end of misplaced import section: last line that is part of imports
# before a real `export function/const/type` that isn't inside an import
i = mis_start
while i < len(lines):
    raw = lines[i]
    s = raw.strip()
    if (
        raw.startswith("import ")
        or s == ""
        or s.startswith("//")
        or s.startswith("/*")
        or s.startswith("*")
        or s.startswith("*/")
        or raw.startswith("}")
        or raw.startswith("  ")
        or (s.endswith(",") and not raw.startswith("export"))
        or s.startswith("type ")
        or (s.startswith("{") or s.startswith("}"))
    ):
        i += 1
        continue
    if re.match(r"^\} from ['\"]", s) or re.match(r"^from ['\"]", s):
        i += 1
        continue
    # stop at next real code export/function
    if raw.startswith("export ") or raw.startswith("function ") or raw.startswith("const ") or raw.startswith("type "):
        break
    # bare identifier lines inside imports already handled by indent
    i += 1
    if i > mis_start + 5000:
        break

mis_end = i  # exclusive
print("mis_end", mis_end + 1, "line:", lines[mis_end][:80].rstrip() if mis_end < len(lines) else "EOF")
print("misplaced lines", mis_end - mis_start)

mis_block = "".join(lines[mis_start:mis_end])
# Clean double blank lines
mis_block = re.sub(r"\n{3,}", "\n\n", mis_block)

# Remove misplaced imports from helpers (keep top imports that helpers needs)
# Helpers still needs those imports for its own code - DON'T remove from helpers!
# Only ADD them to App.tsx

app = app_path.read_text(encoding="utf-8")
# Insert before `import AppView`
needle = "import AppView from './AppView'\n"
if needle not in app:
    raise SystemExit("AppView import not found")
if "getOrCreateUser" in app.split("export default function App")[0]:
    print("App already has service imports")
else:
    # Also restore gift VALUE imports (not just types)
    gift_values = """
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
    # Replace types-only gifts import
    app2, n = re.subn(
        r"import \{\s*type DonateItemId,[\s\S]*?\} from '\./data/gifts'\n",
        gift_values.lstrip() + "\n",
        app,
        count=1,
    )
    print("replaced gifts import", n)
    if n != 1:
        # insert gift values if missing
        if "DONATE_ITEMS" not in app2.split("export default function App")[0]:
            app2 = app2.replace(needle, gift_values + "\n" + needle)
            print("inserted gifts before AppView")

    app2 = app2.replace(needle, mis_block.rstrip() + "\n\n" + needle)
    app_path.write_text(app2, encoding="utf-8")
    print("App.tsx updated", app_path.stat().st_size)

# Also move mid-file imports in helpers to the TOP (after existing top imports) for cleanliness
# Find insertion point in helpers: after iqdSvg import
help = "".join(lines)
# Remove mid imports from middle and prepend after line 60 area
help2 = "".join(lines[:mis_start] + lines[mis_end:])
# Insert mis_block after initial asset imports (before GoldIcon)
insert_at = None
for i, l in enumerate(help2.splitlines(keepends=True)):
    if l.startswith("export function GoldIcon"):
        insert_at = i
        break
hl = help2.splitlines(keepends=True)
# Only insert if getOrCreateUser not already in top region
top = "".join(hl[:insert_at])
if "getOrCreateUser" not in top:
    hl = hl[:insert_at] + [mis_block if mis_block.endswith("\n") else mis_block + "\n", "\n"] + hl[insert_at:]
    helpers_path.write_text("".join(hl), encoding="utf-8")
    print("helpers imports hoisted to top")
else:
    print("helpers already has imports near top; left mid-block removed only")
    helpers_path.write_text(help2, encoding="utf-8")
