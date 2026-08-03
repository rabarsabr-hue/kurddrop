from __future__ import annotations

import re
from pathlib import Path

root = Path(r"G:\My Drive\Kurd Drop")
app_path = root / "src" / "App.tsx"
lines = app_path.read_text(encoding="utf-8").splitlines(keepends=True)

app_idx = next(i for i, l in enumerate(lines) if l.startswith("export default function App"))
ret = None
for i in range(app_idx, len(lines)):
    if lines[i] == "  return (\n" and i + 2 < len(lines) and "<>" in (lines[i + 1] + lines[i + 2]):
        ret = i
        break
if ret is None:
    raise SystemExit("return not found")

print("app", app_idx + 1, "return", ret + 1)

# Find imports block (everything before export default)
imports = "".join(lines[:app_idx])
body = "".join(lines[app_idx:ret])
jsx_blob = "".join(lines[ret:])

m = re.match(r"  return \((.*)\)\s*\}\s*$", jsx_blob, re.S)
if not m:
    raise SystemExit("jsx wrap parse failed")
jsx_content = m.group(1)

# Bindings from App body
bindings: list[str] = []
for m2 in re.finditer(r"\bconst \[([A-Za-z_][\w]*),\s*([A-Za-z_][\w]*)\]", body):
    bindings.extend([m2.group(1), m2.group(2)])
for m2 in re.finditer(r"\bconst ([A-Za-z_][\w]*)\s*=", body):
    bindings.append(m2.group(1))
for m2 in re.finditer(r"\bfunction ([A-Za-z_][\w]*)\s*\(", body):
    bindings.append(m2.group(1))

seen: set[str] = set()
b_uniq: list[str] = []
for n in bindings:
    if n not in seen:
        seen.add(n)
        b_uniq.append(n)
print("bindings", len(b_uniq))

# AppView imports: same as App (includes appHelpers) + react already there
# Avoid importing App itself
view_imports = imports
# AppView should not need to be circular

destr = ",\n    ".join(b_uniq)
bag = ",\n    ".join(b_uniq)

view = (
    "/** Presentational JSX extracted from App.tsx */\n"
    + view_imports
    + "\nexport default function AppView(s: Record<string, any>) {\n"
    + f"  const {{\n    {destr}\n  }} = s\n\n"
    + f"  return ({jsx_content})\n"
    + "}\n"
)

view_path = root / "src" / "AppView.tsx"
view_path.write_text(view, encoding="utf-8")
print("AppView", view_path.stat().st_size)

new_app = (
    imports
    + "import AppView from './AppView'\n\n"
    + body
    + f"  const __kdView = {{\n    {bag}\n  }}\n"
    + "  return <AppView {...__kdView} />\n"
    + "}\n"
)
app_path.write_text(new_app, encoding="utf-8")
print("App", app_path.stat().st_size)
print("OK", app_path.stat().st_size < 500_000, view_path.stat().st_size < 500_000)
