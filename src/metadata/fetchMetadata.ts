export interface LinkMetadata {
  title: string
  description: string
  image: string | null
  siteName: string
}

export async function fetchMetadata(
  url: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = (input, init) => globalThis.fetch(input, init),
): Promise<LinkMetadata | null> {
  try {
    const res = await fetchImpl(`/api/metadata?url=${encodeURIComponent(url)}`, { signal })
    if (!res.ok) return null
    const data = (await res.json()) as Partial<Record<keyof LinkMetadata, unknown>>
    return {
      title: typeof data.title === 'string' ? data.title : '',
      description: typeof data.description === 'string' ? data.description : '',
      image: typeof data.image === 'string' ? data.image : null,
      siteName: typeof data.siteName === 'string' ? data.siteName : '',
    }
  } catch {
    return null
  }
}
