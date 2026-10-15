import { ExternalLink, Pin, PinOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TagChip } from '@/features/tags/TagChip'
import { formatDate } from '@/lib/format'
import { useUiStore } from '@/lib/uiStore'
import { hostnameOf } from '@/metadata/normalizeUrl'
import type { Link, Tag } from '@/vault/schema'
import { useVaultStore } from '@/vault/store'
import { LinkThumb } from './LinkThumb'

export function LinkCard({ link, tags }: { link: Link; tags: Tag[] }) {
  const openDetail = useUiStore((s) => s.openDetail)
  const togglePin = useVaultStore((s) => s.togglePin)
  const canWrite = useVaultStore((s) => s.canWrite)

  function handlePin(event: React.MouseEvent) {
    event.stopPropagation()
    const guard = canWrite()
    if (!guard.ok) {
      toast.error(guard.message)
      return
    }
    togglePin(link.id)
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border bg-card hover:border-foreground/30">
      <button
        type="button"
        onClick={() => openDetail(link.id)}
        aria-label={`${link.title} 상세`}
        className="flex flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <LinkThumb image={link.image} url={link.url} title={link.title} variant="card" className="border-b" />
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">{link.siteName || hostnameOf(link.url)}</span>
            <time className="shrink-0 tabular-nums" dateTime={link.createdAt}>{formatDate(link.createdAt)}</time>
          </div>
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.01em]">
            {link.pinned && <Pin aria-label="고정됨" className="mr-1 inline size-3.5 -translate-y-px fill-highlight text-highlight" />}
            {link.title}
          </h3>
          {link.note && <p className="line-clamp-2 text-sm text-muted-foreground">{link.note}</p>}
          {tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-x-2.5 gap-y-1 pt-1.5">
              {tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}
        </div>
      </button>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
        <Button size="icon-sm" variant="outline" className="bg-card" aria-label={link.pinned ? '고정 해제' : '고정'} aria-pressed={link.pinned} onClick={handlePin}>
          {link.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
        </Button>
        <Button size="icon-sm" variant="outline" className="bg-card" asChild>
          <a href={link.url} target="_blank" rel="noreferrer noopener" aria-label="새 탭에서 열기" onClick={(e) => e.stopPropagation()}>
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
    </article>
  )
}
