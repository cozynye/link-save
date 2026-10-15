import { Pin } from 'lucide-react'
import { TagChip } from '@/features/tags/TagChip'
import { formatDate } from '@/lib/format'
import { useUiStore } from '@/lib/uiStore'
import { hostnameOf } from '@/metadata/normalizeUrl'
import type { Link, Tag } from '@/vault/schema'
import { LinkThumb } from './LinkThumb'

const MAX_CHIPS = 3

export function LinkRow({ link, tags }: { link: Link; tags: Tag[] }) {
  const openDetail = useUiStore((s) => s.openDetail)
  const shown = tags.slice(0, MAX_CHIPS)
  const extra = tags.length - shown.length
  return (
    <li>
      <button
        type="button"
        onClick={() => openDetail(link.id)}
        aria-label={`${link.title} 상세`}
        className="flex min-h-[44px] w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors active:bg-accent"
      >
        <LinkThumb image={link.image} url={link.url} title={link.title} variant="row" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="line-clamp-2 flex-1 font-medium leading-snug">{link.title}</h3>
            {link.pinned && <Pin aria-label="고정됨" className="mt-0.5 size-3.5 shrink-0 fill-primary text-primary" />}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {link.siteName || hostnameOf(link.url)} · {formatDate(link.createdAt)}
          </p>
          {shown.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1 overflow-hidden">
              {shown.map((tag) => (
                <TagChip key={tag.id} tag={tag} size="sm" />
              ))}
              {extra > 0 && <span className="text-[11px] text-muted-foreground">+{extra}</span>}
            </div>
          )}
        </div>
      </button>
    </li>
  )
}
