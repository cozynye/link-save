export function formatDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const sameYear = date.getFullYear() === now.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return sameYear ? `${month}월 ${day}일` : `${date.getFullYear()}년 ${month}월 ${day}일`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
