from pathlib import Path
import re

t = Path(r"G:\My Drive\Kurd Drop\src\AppView.tsx").read_text(encoding="utf-8")
h = re.search(r"import \{([\s\S]*?)\} from '\./appHelpers'", t)
block = h.group(1)
needed = [
    "AppCrashBoundary",
    "GoldIcon",
    "Sheet",
    "NearbyPlayerRow",
    "MapFabIcon",
    "SettingRow",
    "CitadelCosmeticWearThumb",
]
for n in needed:
    # value import (not type-only)
    as_type = bool(re.search(rf"^\s*type\s+{n}\s*,?\s*$", block, re.M))
    as_value = bool(re.search(rf"^\s*{n}\s*,?\s*$", block, re.M))
    used = t.count(n)
    print(f"{n}: value={as_value} typeOnly={as_type} occurrences={used}")
