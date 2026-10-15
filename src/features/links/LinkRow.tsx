import { ExternalLink, Pin } from 'lucide-react'
import { TagChip } from '@/features/tags/TagChip'
import { formatDate } from '@/lib/format'
import { useUiStore } from '@/lib/uiStore'
import { hostnameOf } from '@/metadata/normalizeUrl'
import type { Link, Tag } from '@/vault/schema'
import { LinkThumb } from './LinkThumb'

const MAX_TAGS = 3

export function LinkRow({ link, tags }: { link: Link; tags: Tag[] }) {
  const openDetail = useUiStore((s) => s.openDetail)
  const shown = tags.slice(0, MAX_TAGS)
  const extra = tags.length - shown.length
  return (
    <li className="flex items-start gap-1">
      <button
        type="button"
        onClick={() => openDetail(link.id)}
        aria-label={`${link.title} 상세`}
        className="flex min-h-[44px] min-w-0 flex-1 items-start gap-3 rounded-md py-3 pl-1 pr-1 text-left active:bg-accent"
      >
        <LinkThumb image={link.image} url={link.url} title={link.title} siteName={link.siteName} variant="row" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.01em]">
            {link.pinned && <Pin aria-label="고정됨" className="mr-1 inline size-3.5 -translate-y-px fill-highlight text-highlight" />}
            {link.title}
          </h3>
          <div className="mt-1 flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">{link.siteName || hostnameOf(link.url)}</span>
            <time className="shrink-0 tabular-nums" dateTime={link.createdAt}>{formatDate(link.createdAt)}</time>
          </div>
          {shown.length > 0 && (
            <div className="mt-1 flex items-center gap-x-2.5 overflow-hidden">
              {shown.map((tag) => (
                <TagChip key={tag.id} tag={tag} size="sm" />
              ))}
              {extra > 0 && <span className="text-xs text-muted-foreground">+{extra}</span>}
            </div>
          )}
        </div>
      </button>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${link.title} 열기`}
        className="mt-2 grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground active:bg-accent active:text-foreground"
      >
        <ExternalLink aria-hidden className="size-[18px]" />
      </a>
    </li>
  )
}
