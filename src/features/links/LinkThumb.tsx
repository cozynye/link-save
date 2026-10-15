import { useState } from 'react'
import { hostnameOf } from '@/metadata/normalizeUrl'
import { cn } from '@/lib/utils'

export interface LinkThumbProps {
  image: string | null
  url: string
  title: string
  variant: 'card' | 'row'
  className?: string
}

export function faviconUrl(url: string): string {
  const host = hostnameOf(url)
  return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : ''
}

interface Failed {
  forImage: string | null
  image: boolean
  favicon: boolean
}

export function LinkThumb({ image, url, title, variant, className }: LinkThumbProps) {
  const [failedState, setFailed] = useState<Failed>({ forImage: image, image: false, favicon: false })
  // 이미지 URL이 바뀌면 실패 기록을 새로 시작한다(렌더 중 파생, effect 없음).
  const failed = failedState.forImage === image ? failedState : { forImage: image, image: false, favicon: false }

  const shape = variant === 'card' ? 'aspect-video w-full' : 'size-14 shrink-0'
  const favicon = faviconUrl(url)
  const initial = (title.trim()[0] ?? hostnameOf(url)[0] ?? '?').toUpperCase()

  if (image && !failed.image) {
    return (
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed({ ...failed, image: true })}
        className={cn(shape, 'rounded-lg bg-muted object-cover', className)}
      />
    )
  }
  if (favicon && !failed.favicon) {
    return (
      <div className={cn(shape, 'grid place-items-center rounded-lg bg-muted', className)}>
        <img
          src={favicon}
          alt=""
          width={variant === 'card' ? 48 : 28}
          height={variant === 'card' ? 48 : 28}
          loading="lazy"
          onError={() => setFailed({ ...failed, favicon: true })}
          className="rounded"
        />
      </div>
    )
  }
  return (
    <div
      aria-hidden
      className={cn(shape, 'grid place-items-center rounded-lg bg-accent font-semibold text-accent-foreground', variant === 'card' ? 'text-4xl' : 'text-lg', className)}
    >
      {initial}
    </div>
  )
}
