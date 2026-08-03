# -*- coding: utf-8 -*-
import json
from pathlib import Path

p = Path(r'C:\Users\lenovo\.cursor\projects\g-My-Drive-Kurd-Drop\agent-transcripts\21917dc6-44d8-40a3-8bab-0d17e53d55bd\21917dc6-44d8-40a3-8bab-0d17e53d55bd.jsonl')
needle = 'setAvatarStudioDraft'
out = Path(r'G:\My Drive\Kurd Drop\scripts\recovered_studio.txt')

best = ''
with p.open(encoding='utf-8') as f:
    for i, line in enumerate(f):
        if needle not in line:
            continue
        if 'دەستکاریکردنی کەسایەتی' not in line:
            continue
        if len(line) > len(best):
            best = line
            print(f'candidate line {i} len={len(line)}')

if not best:
    # try subagents
    root = p.parent
    for sp in root.rglob('*.jsonl'):
        with sp.open(encoding='utf-8') as f:
            for i, line in enumerate(f):
                if needle in line and 'دەستکاریکردنی کەسایەتی' in line and len(line) > len(best):
                    best = line
                    print(f'candidate {sp.name}:{i} len={len(line)}')

if best:
    # Find the JSX block markers
    a = best.find('/* ── ڕووخسار')
    if a < 0:
        a = best.find('ProfileSectionHeader icon=\\"face\\"')
    b = best.find('/* ── ئاماری یاریزان')
    print('markers', a, b)
    if a >= 0 and b > a:
        chunk = best[a:b]
        # unescape json string bits roughly
        try:
            # the line is a full json object - extract text fields
            obj = json.loads(best)
            text = json.dumps(obj, ensure_ascii=False)
            out.write_text(text[:5000], encoding='utf-8')
        except Exception as e:
            out.write_text(best[a:min(b, a+50000)], encoding='utf-8')
            print('raw write', e)
    else:
        out.write_text(best[:20000], encoding='utf-8')
        print('wrote prefix')
else:
    print('nothing found')
