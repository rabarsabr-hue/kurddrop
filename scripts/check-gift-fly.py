from pathlib import Path
import re

t = Path(r"G:\My Drive\Kurd Drop\src\AppView.tsx").read_text(encoding="utf-8")
for i, line in enumerate(t.splitlines(), 1):
    if "GIFT_FLY" in line or (("from '" in line or 'from "' in line) and ("appHelpers" in line or "gifts" in line)):
        print(f"{i}: {line}")

h = re.search(r"import \{([\s\S]*?)\} from '\./appHelpers'", t)
g = re.search(r"import \{([\s\S]*?)\} from '\./data/gifts'", t)
print("helpers has GIFT_FLY:", "GIFT_FLY_ICON_PX" in h.group(1))
print("gifts has GIFT_FLY:", "GIFT_FLY_ICON_PX" in g.group(1))
idx = h.group(1).find("GIFT")
print("helpers GIFT context:", repr(h.group(1)[max(0, idx - 80): idx + 80]) if idx >= 0 else "none")

# Also check destructuring conflict
m = re.search(r"const \{([\s\S]*?)\} = s", t)
if m and "GIFT_FLY_ICON_PX" in m.group(1):
    print("ALSO destructured from s!")
else:
    print("not in s destructure")
