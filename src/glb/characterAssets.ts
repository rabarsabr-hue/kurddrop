/**
 * کارەکتەری نەخشە — male.gltf / female.gltf لە public/
 */
export type CharacterGender = 'male' | 'female'

const MODEL_URL: Record<CharacterGender, string> = {
  male: '/male.gltf',
  female: '/female.gltf',
}

const resolved = new Map<CharacterGender, string>()

/** خێرا — بێ HEAD؛ فایلەکان لە public دانراون */
export async function resolveCharacterModelUrl(gender: CharacterGender): Promise<string> {
  const g = gender === 'female' ? 'female' : 'male'
  const cached = resolved.get(g)
  if (cached) return cached
  const url = MODEL_URL[g]
  resolved.set(g, url)
  return url
}

export function characterModelUrlSync(gender?: CharacterGender): string {
  const g = gender === 'female' ? 'female' : 'male'
  return resolved.get(g) || MODEL_URL[g]
}
