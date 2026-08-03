from __future__ import annotations

import re
from pathlib import Path

root = Path(r"G:\My Drive\Kurd Drop")
app_path = root / "src" / "App.tsx"
src = app_path.read_text(encoding="utf-8")
lines = src.splitlines(keepends=True)

app_idx = next(i for i, l in enumerate(lines) if l.startswith("export default function App"))

# Find end of import section: first line after imports that starts a decl
i = 0
while i < app_idx:
    line = lines[i]
    if line.startswith("import "):
        # multi-line import
        while i < app_idx and " from " not in lines[i] and not re.search(r"from\s+['\"]", lines[i]):
            # side-effect import: import 'x'
            if re.match(r"import\s+['\"]", lines[i]):
                break
            i += 1
        i += 1
        continue
    if line.strip() == "" or line.strip().startswith("//") or line.strip().startswith("/*") or line.strip().startswith("*") or line.strip().startswith("*/"):
        i += 1
        continue
    break

helpers_start = i
print("helpers_start", helpers_start + 1, "app", app_idx + 1)

imports = "".join(lines[:helpers_start])
helpers = "".join(lines[helpers_start:app_idx])
app_rest = "".join(lines[app_idx:])

# exportify top-level in helpers
out_h = []
for line in helpers.splitlines(keepends=True):
    if re.match(r"^(const|let|function|async function|type|interface|class)\b", line):
        out_h.append("export " + line)
    else:
        out_h.append(line)
helpers_body = "".join(out_h)

# Collect export names
names: list[str] = []
for m in re.finditer(r"^export (?:async )?function ([A-Za-z_][\w]*)", helpers_body, re.M):
    names.append(m.group(1))
for m in re.finditer(r"^export const ([A-Za-z_][\w]*)", helpers_body, re.M):
    names.append(m.group(1))
for m in re.finditer(r"^export type ([A-Za-z_][\w]*)", helpers_body, re.M):
    names.append("type " + m.group(1))
for m in re.finditer(r"^export interface ([A-Za-z_][\w]*)", helpers_body, re.M):
    names.append("type " + m.group(1))

# dedupe
seen = set()
uniq = []
for n in names:
    if n not in seen:
        seen.add(n)
        uniq.append(n)

# Helpers need imports (without css side effects)
h_imports = imports
h_imports = re.sub(r"^import 'leaflet/dist/leaflet\.css'\n", "", h_imports, flags=re.M)
h_imports = re.sub(r"^import '\./styles/app\.css'\n", "", h_imports, flags=re.M)

helpers_path = root / "src" / "appHelpers.ts"
helpers_path.write_text(
    "/** Extracted from App.tsx — static helpers / small components (Babel size) */\n"
    + h_imports
    + "\n"
    + helpers_body,
    encoding="utf-8",
)
print("helpers bytes", helpers_path.stat().st_size, "exports", len(uniq))

# Rewrite App: imports + import helpers + app_rest
# Build import list — type exports need `type X`
value_names = [n for n in uniq if not n.startswith("type ")]
type_names = [n[5:] for n in uniq if n.startswith("type ")]

imp = "import {\n"
for n in value_names:
    imp += f"  {n},\n"
for n in type_names:
    imp += f"  type {n},\n"
imp += "} from './appHelpers'\n\n"

new_app = imports + "\n" + imp + app_rest
app_path.write_text(new_app, encoding="utf-8")
print("App bytes", app_path.stat().st_size)
