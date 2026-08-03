from __future__ import annotations

import re
from pathlib import Path

root = Path(r"G:\My Drive\Kurd Drop")
app_path = root / "src" / "App.tsx"
app = app_path.read_text(encoding="utf-8")

m = re.search(r"const __kdView = \{([\s\S]*?)\}\n\s*return <AppView", app)
if not m:
    raise SystemExit("no __kdView")
keys = re.findall(r"^\s*([A-Za-z_][\w]*)\s*,?\s*$", m.group(1), re.M)
print("kdView keys", len(keys))

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

print("top-level approx", len(top))
bad = [k for k in keys if k not in top]
print("bad count", len(bad))
print("sample bad:", bad[:50])

# Duplicate imports from gifts vs appHelpers
gifts_block = re.search(r"import \{([\s\S]*?)\} from '\./data/gifts'", app)
helpers_block = re.search(r"import \{([\s\S]*?)\} from '\./appHelpers'", app)
gifts_names = set(re.findall(r"\b([A-Za-z_][\w]*)\b", gifts_block.group(1))) if gifts_block else set()
# strip type keyword noise
helpers_names = set(re.findall(r"^\s*(?:type\s+)?([A-Za-z_][\w]*)\s*,?\s*$", helpers_block.group(1), re.M)) if helpers_block else set()
dup = sorted(gifts_names & helpers_names - {"type"})
print("dup imports gifts∩helpers:", dup)
