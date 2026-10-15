import { useState } from 'react'
import { hostnameOf } from '@/metadata/normalizeUrl'
import { cn } from '@/lib/utils'

export interface LinkThumbProps {
  image: string | null
  url: string
  title: string
  /** 화면에 보이는 사이트 이름. 있으면 대체 글자를 여기서 딴다. */
  siteName?: string
  /** card: 이미지가 있을 때만 그린다. row: 이미지가 없으면 도메인 첫 글자 사각형을 그린다. */
  variant: 'card' | 'row'
  className?: string
}

/** 썸네일 대체용 글자. 외부 서비스(파비콘 등)에 도메인을 보내지 않는다. 사이트 이름 → 도메인 → 제목 순서로 첫 글자를 쓴다. */
export function monogramOf(url: string, title: string, siteName = ''): string {
  const source = siteName.trim() || hostnameOf(url) || title.trim()
  return (source[0] ?? '?').toUpperCase()
}

export function LinkThumb({ image, url, title, siteName, variant, className }: LinkThumbProps) {
  const [failedFor, setFailedFor] = useState<string | null>(null)
  const showImage = image !== null && failedFor !== image

  if (showImage) {
    return (
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailedFor(image)}
        className={cn(variant === 'card' ? 'aspect-video w-full' : 'size-12 shrink-0 rounded-md', 'bg-muted object-cover', className)}
      />
    )
  }
  if (variant === 'card') return null
  return (
    <div
      aria-hidden
      className={cn('grid size-12 shrink-0 place-items-center rounded-md border bg-muted text-base font-semibold text-muted-foreground', className)}
    >
      {monogramOf(url, title, siteName)}
    </div>
  )
}
