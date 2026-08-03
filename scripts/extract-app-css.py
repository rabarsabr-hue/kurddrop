from __future__ import annotations

import re
from pathlib import Path

root = Path(r"G:\My Drive\Kurd Drop")
app_path = root / "src" / "App.tsx"
text = app_path.read_text(encoding="utf-8")
lines = text.splitlines(keepends=True)

css_start = None
css_end = None
for i, line in enumerate(lines):
    if css_start is None and re.match(r"\s*const css = `", line):
        css_start = i
        continue
    if css_start is not None and css_end is None and re.match(r"\s*`\s*$", line):
        if i - css_start > 100:
            css_end = i
            break

if css_start is None or css_end is None:
    raise SystemExit(f"CSS bounds not found: start={css_start} end={css_end}")

print(f"CSS lines {css_start + 1}-{css_end + 1} ({css_end - css_start + 1} lines)")

inner = lines[css_start + 1 : css_end]
css_body = "".join(inner)

repls = {
    "${PREMIUM_GIFT_SENDER_SCALE}": "1.85",
    "${PREMIUM_GIFT_SENDER_Z_OFFSET}": "99998",
    "${PREMIUM_GIFT_GROW_MS}": "15000",
    "${SPIN_RESULT_Z}": "999999",
    "${MAP_CHAT_BUBBLE_MS}": "10000",
}
for k, v in repls.items():
    if k not in css_body:
        print("WARN missing interpolation:", k)
    css_body = css_body.replace(k, v)

css_body = css_body.lstrip("\n")

styles_dir = root / "src" / "styles"
styles_dir.mkdir(parents=True, exist_ok=True)
css_path = styles_dir / "app.css"
css_path.write_text(css_body, encoding="utf-8")
print(f"Wrote {css_path} ({css_path.stat().st_size} bytes)")

remove_from = css_start
while remove_from > 0 and (
    lines[remove_from - 1].strip() == "" or "CSS" in lines[remove_from - 1]
):
    remove_from -= 1
    if "CSS" in lines[remove_from] and lines[remove_from].strip().startswith("//"):
        break

new_lines = lines[:remove_from] + lines[css_end + 1 :]
joined = "".join(new_lines)
joined2, n = re.subn(r"\s*<style>\{css\}</style>\s*\n", "\n", joined, count=1)
print(f"Removed style tag: {n}")

if "styles/app.css" not in joined2:
    joined2 = joined2.replace(
        "import 'leaflet/dist/leaflet.css'\n",
        "import 'leaflet/dist/leaflet.css'\nimport './styles/app.css'\n",
        1,
    )
    print("Inserted app.css import")

app_path.write_text(joined2, encoding="utf-8")
print(f"App.tsx now {app_path.stat().st_size} bytes")
