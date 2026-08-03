from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
view = (root / 'src/AppView.tsx').read_text(encoding='utf-8')
app = (root / 'src/App.tsx').read_text(encoding='utf-8')

m = re.search(r'export default function AppView', view)
imports = view[: m.start()]
body = view[m.start() :]

dm = re.search(r'const \{([\s\S]*?)\} = s\n', body)
destructured = set(re.findall(r'\b([A-Za-z_][A-Za-z0-9_]*)\b', dm.group(1) if dm else ''))
imported = set(re.findall(r'\b([A-Za-z_][A-Za-z0-9_]*)\b', imports))
local = set(re.findall(r'\b(?:const|let|function)\s+([A-Za-z_][A-Za-z0-9_]*)', body))
defined = imported | destructured | local

app_imports = set()
for line in app.splitlines():
    if line.startswith('import '):
        app_imports.update(re.findall(r'\b([A-Za-z_][A-Za-z0-9_]*)\b', line))

used = set(re.findall(r'(?<![\w.])([A-Za-z_][A-Za-z0-9_]*)\b', body))

builtins = {
    'React', 'Fragment', 'Component', 'memo', 'useState', 'useEffect', 'useRef', 'useCallback',
    'useMemo', 'createPortal', 'ErrorInfo', 'ReactNode', 'L', 'console', 'window', 'document',
    'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Map', 'Set',
    'Promise', 'Error', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'undefined', 'null',
    'true', 'false', 'NaN', 'Infinity', 'Intl', 'URL', 'Blob', 'File', 'FileReader', 'Image',
    'Audio', 'navigator', 'localStorage', 'sessionStorage', 'requestAnimationFrame',
    'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
    'performance', 'crypto', 'fetch', 'FormData', 'AbortController', 'ResizeObserver',
    'HTMLElement', 'SVGElement', 'Event', 'CustomEvent', 'MouseEvent', 'TouchEvent',
    'KeyboardEvent', 'PointerEvent', 'Node', 'Element', 'CSS', 'getComputedStyle', 'matchMedia',
    'structuredClone', 'queueMicrotask', 'atob', 'btoa', 'encodeURIComponent',
    'decodeURIComponent', 'TextEncoder', 'TextDecoder', 'URLSearchParams', 'Headers', 'Request',
    'Response', 'typeof', 'keyof', 'Readonly', 'Partial', 'Required', 'Record', 'any', 'string',
    'number', 'boolean', 'void', 'never', 'unknown', 'as', 'from', 'import', 'export', 'default',
    'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
    'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'class', 'extends',
    'super', 'this', 'static', 'async', 'await', 'yield', 'of', 'in', 'delete', 'instanceof',
    'type', 'interface', 'enum', 'implements', 'public', 'private', 'protected', 'abstract',
    'readonly', 'declare', 'module', 'namespace', 'satisfies', 'infer', 'asserts', 's',
}

interesting_prefixes = (
    'is', 'has', 'can', 'get', 'load', 'save', 'format', 'build', 'create', 'apply', 'update',
    'toggle', 'play', 'spawn', 'ensure', 'flush', 'mark', 'patch', 'sync', 'bump', 'bind', 'run',
    'merge', 'enrich', 'escape', 'calc', 'hash', 'avatar', 'donate', 'spin', 'map', 'player',
    'gift', 'notif', 'daily', 'safe', 'read', 'persist', 'next', 'clear', 'record', 'total',
    'weighted', 'pick', 'catalog', 'royal', 'sfx', 'NPC', 'BOT', 'DONATE', 'FALLBACK', 'DEFAULT',
    'MAP_', 'SPIN_', 'VIP_', 'RP_', 'CITY_', 'NEARBY_', 'EARTH_', 'IOS_', 'DROP_', 'REWARD_',
    'DM_', 'LOCATION_', 'SCHEDULE_', 'FACTORY_', 'ECONOMY_', 'HEAD_', 'COSMETIC_', 'WEAPON_',
    'RADAR_', 'PROTECTION_', 'GEAR_', 'WELCOME_', 'HUNTER_', 'PLANE_', 'FULL_', 'PLAYER_',
    'GIFT_', 'PREMIUM_', 'MASTER_', 'SEASON_', 'PASS_', 'AIRDROP_', 'CHAT_', 'FRIEND_',
)

missing = []
for name in sorted(used):
    if name in defined or name in builtins or len(name) < 3:
        continue
    if name in app_imports or name.startswith(interesting_prefixes) or name[:1].isupper():
        missing.append(name)

# Resolve export locations
export_index: dict[str, list[str]] = {}
for p in (root / 'src').rglob('*.ts*'):
    if p.name == 'AppView.tsx':
        continue
    txt = p.read_text(encoding='utf-8', errors='ignore')
    for name in missing:
        if re.search(
            rf'export (?:async )?function {re.escape(name)}\b|'
            rf'export const {re.escape(name)}\b|'
            rf'export class {re.escape(name)}\b|'
            rf'export \{{[^}}]*\b{re.escape(name)}\b',
            txt,
        ):
            export_index.setdefault(name, []).append(str(p.relative_to(root)).replace('\\', '/'))

print(f'Potentially missing ({len(missing)}):')
for name in missing:
    locs = export_index.get(name, [])
    print(f'  {name}  <- {", ".join(locs[:3]) or "NOT FOUND AS EXPORT"}')
