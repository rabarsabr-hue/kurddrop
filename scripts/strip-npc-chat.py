from pathlib import Path
import re

npc = Path(r"G:\My Drive\Kurd Drop\src\npcData.ts")
text = npc.read_text(encoding="utf-8")

# Remove DIALECT_CHAT / DIALECT_DROP_CHAT / NPC_COMEDY / PUBLIC_CHAT arrays
# Keep pickUniquePublicChatLine
pat = re.compile(
    r"\n/\*\* نامەی کۆمیدی بەپێی شێوەزار.*?\nexport const PUBLIC_CHAT_ONE_LINERS: string\[\] = \[.*?\n\]\n",
    re.S,
)
new, n = pat.subn("\n", text, count=1)
print("npc chat arrays removed:", n)
if n != 1:
    # try alternate without first comment
    pat2 = re.compile(
        r"\nconst DIALECT_CHAT: Record<NpcDialect, string\[\]> = \{.*?\nexport const PUBLIC_CHAT_ONE_LINERS: string\[\] = \[.*?\n\]\n",
        re.S,
    )
    new, n = pat2.subn("\n", text, count=1)
    print("alt remove:", n)

npc.write_text(new, encoding="utf-8")
print("npcData size", npc.stat().st_size)
