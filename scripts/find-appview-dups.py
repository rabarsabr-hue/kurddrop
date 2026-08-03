from pathlib import Path
import re

view = Path(r"G:\My Drive\Kurd Drop\src\AppView.tsx")
t = view.read_text(encoding="utf-8")
g = re.search(r"import \{([\s\S]*?)\} from '\./data/gifts'", t)
h = re.search(r"import \{([\s\S]*?)\} from '\./appHelpers'", t)
gn = set(re.findall(r"^\s*(?:type\s+)?([A-Za-z_][\w]*)\s*,?\s*$", g.group(1), re.M))
hn = set(re.findall(r"^\s*(?:type\s+)?([A-Za-z_][\w]*)\s*,?\s*$", h.group(1), re.M))
print("dups", sorted(gn & hn - {"type"}))
