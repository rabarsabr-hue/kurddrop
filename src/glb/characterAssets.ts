/**
 * کارەکتەری نەخشە — پێشەکی لە public/characters پاشان public/
 */
export type CharacterGender = 'male' | 'female'

const MODEL_CANDIDATES: Record<CharacterGender, string[]> = {
  male: [
    '/characters/character_male.glb',
    '/characters/character_male.gltf',
    '/male.glb',
    '/male.gltf',
  ],
  female: [
    '/characters/character_female.glb',
    '/characters/character_female.gltf',
    '/female.glb',
    '/female.gltf',
  ],
}

const resolved = new Map<CharacterGender, string>()

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'force-cache' })
    if (res.ok) return true
  } catch { /* ignore */ }
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, cache: 'force-cache' })
    return res.ok || res.status === 206
  } catch {
    return false
  }
}

/** خێرا — یەکەم فایلی بەردەست */
export async function resolveCharacterModelUrl(gender: CharacterGender): Promise<string> {
  const g = gender === 'female' ? 'female' : 'male'
  const cached = resolved.get(g)
  if (cached) return cached
  const candidates = MODEL_CANDIDATES[g]
  for (const url of candidates) {
    if (await urlExists(url)) {
      resolved.set(g, url)
      return url
    }
  }
  const fallback = candidates[candidates.length - 1]
  resolved.set(g, fallback)
  return fallback
}

export function characterModelUrlSync(gender?: CharacterGender): string {
  const g = gender === 'female' ? 'female' : 'male'
  return resolved.get(g) || MODEL_CANDIDATES[g][0]
}
