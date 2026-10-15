import { z } from 'zod'

export const TAG_COLORS = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'pink'] as const
export type TagColor = (typeof TAG_COLORS)[number]

export const VAULT_VERSION = 1 as const

export const tagSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  color: z.enum(TAG_COLORS),
})

export const linkSchema = z.object({
  id: z.string().min(1),
  url: z.url(),
  title: z.string().trim().min(1),
  description: z.string(),
  note: z.string(),
  image: z.url().nullable(),
  siteName: z.string(),
  tags: z.array(z.string()),
  pinned: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const vaultSchema = z.object({
  version: z.literal(VAULT_VERSION),
  tags: z.array(tagSchema),
  links: z.array(linkSchema),
})

export type Tag = z.infer<typeof tagSchema>
export type Link = z.infer<typeof linkSchema>
export type Vault = z.infer<typeof vaultSchema>

export type ParseResult =
  | { ok: true; vault: Vault }
  | { ok: false; reason: 'invalid-json' | 'unsupported-version' | 'invalid-shape'; detail?: string }

export function emptyVault(): Vault {
  return { version: VAULT_VERSION, tags: [], links: [] }
}

export function parseVault(text: string): ParseResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'invalid-json' }
  }
  if (typeof json === 'object' && json !== null && 'version' in json) {
    const version = (json as { version: unknown }).version
    if (version !== VAULT_VERSION) return { ok: false, reason: 'unsupported-version', detail: String(version) }
  }
  const result = vaultSchema.safeParse(json)
  if (!result.success) {
    const detail = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return { ok: false, reason: 'invalid-shape', detail }
  }
  return { ok: true, vault: result.data }
}

export function serializeVault(vault: Vault): string {
  return `${JSON.stringify(vault, null, 2)}\n`
}

export function newLinkId(): string {
  return crypto.randomUUID()
}

const TAG_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function newTagId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => TAG_ID_ALPHABET[b % TAG_ID_ALPHABET.length]).join('')
}
