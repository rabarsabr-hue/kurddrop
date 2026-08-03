from __future__ import annotations

import re
from pathlib import Path

root = Path(r"G:\My Drive\Kurd Drop")
app_path = root / "src" / "App.tsx"
view_path = root / "src" / "AppView.tsx"
app = app_path.read_text(encoding="utf-8")
view = view_path.read_text(encoding="utf-8")

body_m = re.search(r"export default function App\(\) \{([\s\S]*)\n  const __kdView", app)
body = body_m.group(1) if body_m else ""
top: set[str] = set()
for line in body.splitlines():
    mm = re.match(r"  const \[([A-Za-z_][\w]*),\s*([A-Za-z_][\w]*)\]", line)
    if mm:
        top.add(mm.group(1))
        top.add(mm.group(2))
        continue
    mm = re.match(r"  const ([A-Za-z_][\w]*)\s*=", line)
    if mm:
        top.add(mm.group(1))
        continue
    mm = re.match(r"  function ([A-Za-z_][\w]*)\s*\(", line)
    if mm:
        top.add(mm.group(1))

# Keep only valid top-level bindings that appear in AppView JSX (optional filter)
# Always keep all top-level — AppView may reference them
valid = sorted(top)
print("valid bindings", len(valid))

bag = ",\n    ".join(valid)
new_kd = f"  const __kdView = {{\n    {bag}\n  }}\n  return <AppView {{...__kdView}} />\n}}\n"

app2 = re.sub(
    r"  const __kdView = \{[\s\S]*?\}\n\s*return <AppView \{\.\.\.__kdView\} />\n\}\n?\s*$",
    new_kd,
    app,
    count=1,
)
if app2 == app:
    raise SystemExit("failed to replace __kdView")
app_path.write_text(app2, encoding="utf-8")
print("App rewritten", app_path.stat().st_size)

# Fix AppView destructuring — replace the big const { ... } = s block
destr = ",\n    ".join(valid)
view2, n = re.subn(
    r"export default function AppView\(s: Record<string, any>\) \{\n  const \{[\s\S]*?\} = s\n\n  return \(",
    f"export default function AppView(s: Record<string, any>) {{\n  const {{\n    {destr}\n  }} = s\n\n  return (",
    view,
    count=1,
)
print("AppView destr replaced", n)
if n != 1:
    raise SystemExit("AppView destructure replace failed")
view_path.write_text(view2, encoding="utf-8")

# Remove duplicate gift imports from App that also come from appHelpers
# Keep types + unique from gifts; remove value constants duplicated in helpers import
dup_values = [
    "DONATE_HOLD_MS",
    "PREMIUM_GIFT_SENDER_BOOST_MS",
    "PREMIUM_GIFT_SENDER_SCALE",
    "PREMIUM_GIFT_SENDER_Z_OFFSET",
    "PREMIUM_GIFT_GROW_MS",
    "GIFT_RECIPIENT_CUT_PCT",
    "MAP_AMBIENT_GIFT_MS",
    "DONATE_ITEM_STAY_MS",
    "DONATE_THUNDER_MS",
    "DONATE_BURST_MS",
    "DONATE_VIP_STAY_MS",
    "DONATE_FLIGHT_MIN_MS",
    "DONATE_FLIGHT_MAX_MS",
    "DONATE_FLIGHT_HARD_MAX_MS",
    "DONATE_FLIGHT_SPEED_MPS",
    "GIFT_FLY_ICON_PX",
    "GIFT_OVERLAY_Z",
    "GIFT_PATH_FADE_MS",
    "VIP_GIFT_GIF",
    "DONATE_ITEMS",
    "DONATE_BY_ID",
    "isAmbientMapGift",
    "isPremiumGiftItem",
    "giftPathStyleForItem",
]

app3 = app_path.read_text(encoding="utf-8")
# Slim gifts import to types only (values come via appHelpers re-export? wait helpers imports gifts but may not re-export)
# Check if appHelpers re-exports gift symbols — it imports them for use, not re-export.
# So App needs gifts import for values used in App body OR get them only from one place.

# Better: remove duplicates from appHelpers import list in App, keep gifts import.
helpers_imp = re.search(r"import \{([\s\S]*?)\} from '\./appHelpers'", app3)
if not helpers_imp:
    raise SystemExit("no appHelpers import")
h_body = helpers_imp.group(1)
for name in dup_values:
    h_body = re.sub(rf"^\s*{name}\s*,\s*$", "", h_body, flags=re.M)
app3 = app3[: helpers_imp.start(1)] + h_body + app3[helpers_imp.end(1) :]
app_path.write_text(app3, encoding="utf-8")
print("Removed dup value imports from appHelpers import")

# Verify no GIFT_FLY twice in first 400 lines
head = "\n".join(app_path.read_text(encoding="utf-8").splitlines()[:350])
print("GIFT_FLY_ICON_PX count in head", head.count("GIFT_FLY_ICON_PX"))
