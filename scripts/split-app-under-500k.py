from __future__ import annotations

import re
from pathlib import Path

root = Path(r"G:\My Drive\Kurd Drop")
app_path = root / "src" / "App.tsx"
text = app_path.read_text(encoding="utf-8")
lines = text.splitlines(keepends=True)

start = next(i for i, l in enumerate(lines) if l.startswith("export default function App"))
ret = None
for i in range(start, len(lines)):
    if lines[i] == "  return (\n" and i + 2 < len(lines) and "<>" in (lines[i + 1] + lines[i + 2]):
        ret = i
        break
if ret is None:
    raise SystemExit("main return not found")

print(f"App starts {start+1}, return {ret+1}, end {len(lines)}")

# --- 1) helpers file: everything before export default function App, except css/gift imports stay in App
pre = "".join(lines[:start])

# Split imports vs helper code in pre
import_lines: list[str] = []
helper_lines: list[str] = []
seen_non_import = False
for line in lines[:start]:
    stripped = line.lstrip()
    is_imp = (
        stripped.startswith("import ")
        or stripped.startswith("import{")
        or stripped.startswith("} from ")
        or (not seen_non_import and (stripped.startswith("from ") or stripped == "" or stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*") or stripped.startswith("*/") or stripped.startswith("'") or stripped.startswith('"')))
    )
    # Once we hit a real const/function/type at top level after imports, rest is helpers
    if not seen_non_import:
        if re.match(r"^(export )?(const|let|function|type|interface|class|async)\b", stripped):
            # but skip if still in import (type imports)
            if stripped.startswith("import "):
                import_lines.append(line)
                continue
            seen_non_import = True
            helper_lines.append(line)
        else:
            import_lines.append(line)
    else:
        helper_lines.append(line)

# Safer: find first top-level const/function after all imports
# Recompute: last import line
last_import_idx = 0
for i, line in enumerate(lines[:start]):
    if line.startswith("import ") or (line.startswith("}") and "from '" in line) or (line.startswith("}") and 'from "' in line):
        last_import_idx = i
    # multi-line import continuation
    if i and last_import_idx == i - 1 and (line.startswith("  ") or line.startswith("\t") or line.startswith("}") or line.startswith("  type ") or line.strip().startswith("type ")):
        last_import_idx = i

# Find end of import section more carefully
idx = 0
while idx < start:
    line = lines[idx]
    if line.startswith("import "):
        # consume until we see from '...'\n or ; end
        while idx < start:
            if re.search(r"from\s+['\"].*['\"]\s*;?\s*$", lines[idx]) or (lines[idx].startswith("import ") and " from " in lines[idx] and lines[idx].rstrip().endswith(("'", '"', "';"))):
                idx += 1
                break
            idx += 1
        continue
    if line.strip() == "" or line.strip().startswith("//"):
        idx += 1
        continue
    break

helpers_start = idx
print(f"imports 1-{helpers_start}, helpers {helpers_start+1}-{start}")

imports_blob = "".join(lines[:helpers_start])
helpers_blob = "".join(lines[helpers_start:start])

# Helpers need React/leaflet types etc. — import from the same modules App uses.
# Easiest: helpers file gets the App imports that helpers need by importing *relevant* and
# App imports helpers.

helpers_path = root / "src" / "appHelpers.ts"
# Prepend imports used by helpers: copy all App imports into helpers, then helpers can stand alone.
# App will import { ... } from appHelpers — but exporting every symbol is huge.
# Instead: helpers as a module that App imports with `import './appHelpers'` NO that doesn't export.

# Approach: appHelpers.ts contains imports + helpers, and re-exports everything with export keyword added.
# App imports { X, Y, Z } from './appHelpers' — need export list.

# Simpler approach for helpers: keep helpers in appHelpers.ts as exported, add `export` to each top-level decl.

hb = helpers_blob
# Add export to top-level declarations that aren't already exported
def exportify(src: str) -> str:
    out_lines = []
    for line in src.splitlines(keepends=True):
        if re.match(r"^(const|let|function|async function|type|interface|class)\b", line):
            out_lines.append("export " + line)
        else:
            out_lines.append(line)
    return "".join(out_lines)

helpers_exported = exportify(hb)

# Helpers file needs imports — use the same import block, but remove CSS/leaflet side-effect? keep leaflet types.
helpers_imports = imports_blob
# Remove CSS side-effect imports from helpers (keep in App only)
helpers_imports = re.sub(r"^import\s+'leaflet/dist/leaflet\.css'\s*\n", "", helpers_imports, flags=re.M)
helpers_imports = re.sub(r"^import\s+'\./styles/app\.css'\s*\n", "", helpers_imports, flags=re.M)
# Remove image asset imports if only used in JSX — keep for now

helpers_path.write_text(
    "/** Top-level helpers extracted from App.tsx to keep Babel file size under 500KB */\n"
    + helpers_imports
    + "\n"
    + helpers_exported,
    encoding="utf-8",
)
print(f"Wrote helpers {helpers_path.stat().st_size}")

# Collect exported names from helpers for App import
export_names: list[str] = []
for m in re.finditer(r"^export (?:async )?function ([A-Za-z0-9_]+)", helpers_exported, re.M):
    export_names.append(m.group(1))
for m in re.finditer(r"^export const ([A-Za-z0-9_]+)", helpers_exported, re.M):
    export_names.append(m.group(1))
for m in re.finditer(r"^export type ([A-Za-z0-9_]+)", helpers_exported, re.M):
    export_names.append(m.group(1))
for m in re.finditer(r"^export interface ([A-Za-z0-9_]+)", helpers_exported, re.M):
    export_names.append(m.group(1))

# Dedupe preserve order
seen: set[str] = set()
uniq = []
for n in export_names:
    if n not in seen:
        seen.add(n)
        uniq.append(n)
print(f"helper exports: {len(uniq)}")

# --- 2) JSX → AppView.tsx
jsx_blob = "".join(lines[ret:])  # starts with `  return (` 
# change to function body return
# Collect bindings from App body used in JSX — pass as `s` bag

body_lines = lines[start:ret]
body = "".join(body_lines)

# Bindings: const X = / const [X, setX] = / function X
bindings: list[str] = []
for m in re.finditer(r"\bconst \[([A-Za-z0-9_]+),\s*([A-Za-z0-9_]+)\]", body):
    bindings.extend([m.group(1), m.group(2)])
for m in re.finditer(r"\bconst ([A-Za-z0-9_]+)\s*=", body):
    bindings.append(m.group(1))
for m in re.finditer(r"\bfunction ([A-Za-z0-9_]+)\s*\(", body):
    bindings.append(m.group(1))

# Also include helper exports referenced in JSX (they're in scope via import)
# AppView will import helpers too for things referenced in JSX that aren't in s

b_seen: set[str] = set()
b_uniq: list[str] = []
for n in bindings:
    if n not in b_seen and not n.startswith("_"):
        b_seen.add(n)
        b_uniq.append(n)

print(f"app bindings: {len(b_uniq)}")

# Transform jsx: `  return (` → stay, but wrap in function
# Replace top-level return of App with AppView call

jsx_inner = "".join(lines[ret + 1 :])  # content inside return ( ... );
# drop trailing `)\n` of return — last non-empty should close App function
# lines[ret] = `  return (`
# ends with `)\n}\n` typically

# Find closing of return — the `  )` before final `}` of App
# jsx_blob is `  return (\n ... \n  )\n}\n`
m = re.match(r"  return \((.*)\)\s*\}\s*$", jsx_blob, re.S)
if not m:
    # try without final brace
    m = re.match(r"  return \((.*)\)\s*$", jsx_blob, re.S)
if not m:
    raise SystemExit("could not parse return JSX wrapper")
jsx_content = m.group(1)

view_path = root / "src" / "AppView.tsx"
# AppView imports helpers + react, destructures s
# Import all helper names used — import * as H and also destructure from s for local state

# For JSX, identifiers referring to helpers remain as-is if we import them in AppView
helper_import = ",\n  ".join(uniq)
bind_destr = ",\n    ".join(b_uniq)

view_src = f'''/** JSX shell extracted from App.tsx (keeps Babel parse size under 500KB) */
{imports_blob}
import {{
  {helper_import}
}} from './appHelpers'

export type AppViewState = Record<string, any>

export default function AppView(s: AppViewState) {{
  const {{
    {bind_destr}
  }} = s

  return ({jsx_content})
}}
'''
view_path.write_text(view_src, encoding="utf-8")
print(f"Wrote AppView {view_path.stat().st_size}")

# --- 3) Rewrite App.tsx
helper_import_app = ",\n  ".join(uniq)
bag_fields = ",\n    ".join(b_uniq)

# Body without final return — replace return with AppView
new_app = (
    "".join(lines[:helpers_start])
    + f"\nimport {{\n  {helper_import_app}\n}} from './appHelpers'\n"
    + "import AppView from './AppView'\n\n"
    + "".join(lines[start:ret])
    + f"  const __viewState = {{\n    {bag_fields}\n  }}\n"
    + "  return <AppView {{...__viewState}} />\n"
    + "}\n"
)

app_path.write_text(new_app, encoding="utf-8")
print(f"Wrote App {app_path.stat().st_size}")
print("sizes:", app_path.stat().st_size, helpers_path.stat().st_size, view_path.stat().st_size)
