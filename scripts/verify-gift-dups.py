from pathlib import Path
import re

view = Path(r"G:\My Drive\Kurd Drop\src\AppView.tsx").read_text(encoding="utf-8")
g = re.search(r"import \{([\s\S]*?)\} from '\./data/gifts'", view)
h = re.search(r"import \{([\s\S]*?)\} from '\./appHelpers'", view)
gn = set(re.findall(r"^\s*(?:type\s+)?([A-Za-z_][\w]*)\s*,?\s*$", g.group(1), re.M))
hn = set(re.findall(r"^\s*(?:type\s+)?([A-Za-z_][\w]*)\s*,?\s*$", h.group(1), re.M))
print("AppView dups:", sorted(gn & hn - {"type"}))

helpers = Path(r"G:\My Drive\Kurd Drop\src\appHelpers.tsx").read_text(encoding="utf-8")
imp = re.search(r"import \{([\s\S]*?)\} from '\./data/gifts'", helpers)
names = set(re.findall(r"^\s*(?:type\s+)?([A-Za-z_][\w]*)\s*,?\s*$", imp.group(1), re.M)) - {"type"}
redecs = [n for n in sorted(names) if re.search(rf"^export const {n}\b", helpers, re.M)]
print("appHelpers redeclarations:", redecs)
print("GIFT_FLY in AppView gifts:", "GIFT_FLY_ICON_PX" in g.group(1))
print("GIFT_FLY in AppView helpers:", "GIFT_FLY_ICON_PX" in h.group(1))
