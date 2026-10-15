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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={() => openDetail(link.id)}
        aria-label={`${link.title} 상세`}
        className="flex flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="relative">
          <LinkThumb image={link.image} url={link.url} title={link.title} variant="card" className="rounded-none" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 font-semibold leading-snug">{link.title}</h3>
          <p className="text-xs text-muted-foreground">
            {link.siteName || hostnameOf(link.url)} · {formatDate(link.createdAt)}
          </p>
          {link.note && <p className="line-clamp-2 text-sm text-foreground/80">{link.note}</p>}
          {tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}
        </div>
      </button>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Button size="icon-sm" variant="secondary" aria-label={link.pinned ? '고정 해제' : '고정'} aria-pressed={link.pinned} onClick={handlePin}>
          {link.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
        </Button>
        <Button size="icon-sm" variant="secondary" asChild>
          <a href={link.url} target="_blank" rel="noreferrer noopener" aria-label="새 탭에서 열기" onClick={(e) => e.stopPropagation()}>
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
      {link.pinned && <Pin aria-hidden className="absolute left-3 top-3 size-4 fill-primary text-primary drop-shadow" />}
    </article>
  )
}
