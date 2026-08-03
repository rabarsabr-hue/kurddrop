"""Find identifiers used in App.tsx function body that are neither imported nor declared locally."""
from __future__ import annotations
import re
from pathlib import Path

app = Path(r"G:\My Drive\Kurd Drop\src\App.tsx").read_text(encoding="utf-8")

# imports
imported: set[str] = set()
for m in re.finditer(r"import\s+(type\s+)?\{([^}]+)\}\s+from", app):
    is_type_block = bool(m.group(1))
    for part in m.group(2).split(","):
        part = part.strip()
        if not part:
            continue
        if part.startswith("type "):
            continue  # type-only
        if is_type_block:
            continue
        name = part.split(" as ")[0].strip()
        if re.match(r"^[A-Za-z_]", name):
            imported.add(name)

for m in re.finditer(r"import\s+([A-Za-z_][\w]*)\s+from", app):
    imported.add(m.group(1))

# App function body
bm = re.search(r"export default function App\(\) \{([\s\S]*)\n  const __kdView", app)
body = bm.group(1) if bm else ""
declared: set[str] = set()
for line in body.splitlines():
    mm = re.match(r"  const \[([A-Za-z_][\w]*),\s*([A-Za-z_][\w]*)\]", line)
    if mm:
        declared.update([mm.group(1), mm.group(2)])
        continue
    mm = re.match(r"  const ([A-Za-z_][\w]*)\s*=", line)
    if mm:
        declared.add(mm.group(1))
        continue
    mm = re.match(r"  function ([A-Za-z_][\w]*)\s*\(", line)
    if mm:
        declared.add(mm.group(1))

# Collect identifiers used in body (rough)
used = set(re.findall(r"\b([A-Za-z_][A-Za-z0-9_]*)\b", body))
# builtins / react / common
ignore = {
    "true","false","null","undefined","NaN","Infinity","window","document","console","Math","Date",
    "Map","Set","Array","Object","Promise","JSON","Error","Number","String","Boolean","RegExp",
    "parseInt","parseFloat","isNaN","isFinite","encodeURIComponent","decodeURIComponent",
    "setTimeout","clearTimeout","setInterval","clearInterval","requestAnimationFrame","cancelAnimationFrame",
    "localStorage","sessionStorage","navigator","location","history","performance","crypto",
    "useState","useEffect","useRef","useCallback","useMemo","useLayoutEffect",
    "if","else","for","while","do","switch","case","break","continue","return","throw","try","catch","finally",
    "new","typeof","instanceof","in","of","void","delete","await","async","yield","from","as","satisfies",
    "const","let","var","function","class","extends","super","this","import","export","default","type","interface",
    "L","React","HTMLElement","SVGSVGElement","SVGPathElement","AudioContext","OscillatorNode","GainNode",
    "File","Blob","FormData","URL","URLSearchParams","AbortController","ResizeObserver","IntersectionObserver",
    "Node","Element","Event","MouseEvent","TouchEvent","KeyboardEvent","CustomEvent",
}
# filter to Capitalized or known missing gift names
suspect = []
for name in sorted(used):
    if name in ignore or name in declared or name in imported:
        continue
    if name.startswith("_"):
        continue
    # likely missing if ALL_CAPS or known gift helpers
    if name.isupper() or name in {
        "DONATE_ITEMS","DONATE_BY_ID","isAmbientMapGift","isPremiumGiftItem","VIP_GIFT_GIF",
        "GIFT_FLY_ICON_PX","GIFT_OVERLAY_Z","GIFT_PATH_FADE_MS","PREMIUM_GIFT_SENDER_SCALE",
        "PREMIUM_GIFT_SENDER_BOOST_MS","PREMIUM_GIFT_SENDER_Z_OFFSET","PREMIUM_GIFT_GROW_MS",
        "MAP_AMBIENT_GIFT_MS","GIFT_RECIPIENT_CUT_PCT","giftPathStyleForItem","spawnMapAmbientGiftFx",
        "DONATE_HOLD_MS","DONATE_FLIGHT_MIN_MS","DONATE_FLIGHT_MAX_MS","DONATE_FLIGHT_HARD_MAX_MS",
        "DONATE_FLIGHT_SPEED_MPS","AppCrashBoundary","GoldIcon","Sheet",
    }:
        suspect.append(name)

print("imported count", len(imported))
print("declared count", len(declared))
print("SUSPECT missing in App body:")
for s in suspect:
    print(" ", s)
