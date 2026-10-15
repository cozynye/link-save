import { vaultSchema, type Vault } from '@/vault/schema'
import type { ThemePref } from './theme'

export interface Settings {
  owner: string
  repo: string
  path: string
  token: string
  theme: ThemePref
}

export interface CachedVault {
  vault: Vault
  sha: string
  fetchedAt: string
}

export const SETTINGS_KEY = 'savelink.settings'
export const CACHE_KEY = 'savelink.cache'
export const DEFAULT_PATH = 'links.json'

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간 부족이나 비공개 모드에서는 조용히 무시한다.
  }
}

export function loadSettings(): Settings | null {
  const raw = readJson<Partial<Settings>>(SETTINGS_KEY)
  if (!raw || typeof raw.owner !== 'string' || typeof raw.repo !== 'string' || typeof raw.token !== 'string') return null
  return {
    owner: raw.owner,
    repo: raw.repo,
    path: typeof raw.path === 'string' && raw.path.trim() ? raw.path : DEFAULT_PATH,
    token: raw.token,
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
  }
}

export function saveSettings(settings: Settings): void {
  writeJson(SETTINGS_KEY, settings)
}

export function clearSettings(): void {
  localStorage.removeItem(SETTINGS_KEY)
}

export function loadCache(): CachedVault | null {
  const raw = readJson<Partial<CachedVault>>(CACHE_KEY)
  if (!raw || typeof raw.sha !== 'string' || typeof raw.fetchedAt !== 'string') return null
  const parsed = vaultSchema.safeParse(raw.vault)
  if (!parsed.success) return null
  return { vault: parsed.data, sha: raw.sha, fetchedAt: raw.fetchedAt }
}

export function saveCache(cache: CachedVault): void {
  writeJson(CACHE_KEY, cache)
}

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY)
}
