import { useEffect, useMemo, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { EMPTY_SELECTION, TagPicker, commitTagSelection, type TagSelection } from '@/features/tags/TagPicker'
import { useUiStore } from '@/lib/uiStore'
import { fetchMetadata } from '@/metadata/fetchMetadata'
import { hostnameOf } from '@/metadata/normalizeUrl'
import { findLinkByUrl } from '@/vault/ops'
import type { Vault } from '@/vault/schema'
import { useVaultStore } from '@/vault/store'
import { LinkThumb } from './LinkThumb'

interface MetaState {
  loading: boolean
  failed: boolean
  description: string
  image: string | null
  siteName: string
}

function CaptureForm({ url, vault, onClose, onOpenExisting }: { url: string; vault: Vault; onClose(): void; onOpenExisting(id: string): void }) {
  const duplicate = useMemo(() => findLinkByUrl(vault, url), [vault, url])
  const host = hostnameOf(url)
  const [meta, setMeta] = useState<MetaState>({ loading: !duplicate, failed: false, description: '', image: null, siteName: host })
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [selection, setSelection] = useState<TagSelection>(EMPTY_SELECTION)

  useEffect(() => {
    if (duplicate) return
    const controller = new AbortController()
    void fetchMetadata(url, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      if (!result) {
        setMeta((prev) => ({ ...prev, loading: false, failed: true }))
        return
      }
      setMeta({ loading: false, failed: false, description: result.description, image: result.image, siteName: result.siteName || host })
      setTitle((prev) => (prev.trim() ? prev : result.title))
    })
    return () => controller.abort()
  }, [url, duplicate, host])

  function save() {
    const store = useVaultStore.getState()
    const guard = store.canWrite()
    if (!guard.ok) {
      toast.error(guard.message)
      return
    }
    const tags = commitTagSelection(selection, store)
    const link = store.addLink({
      url,
      title: title.trim() || host,
      description: meta.description,
      note: note.trim(),
      image: meta.image,
      siteName: meta.siteName || host,
      tags,
    })
    onClose()
    toast.success('저장했어요', {
      action: {
        label: '실행 취소',
        onClick: () => {
          const latest = useVaultStore.getState()
          const latestGuard = latest.canWrite()
          if (!latestGuard.ok) {
            toast.error(latestGuard.message)
            return
          }
          latest.deleteLink(link.id)
        },
      },
    })
  }

  if (duplicate) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl bg-accent p-4">
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="font-medium">이미 저장된 링크예요</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{duplicate.title}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-11 md:h-9" onClick={onClose}>닫기</Button>
          <Button className="h-11 md:h-9" onClick={() => onOpenExisting(duplicate.id)}>열기</Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <div className="flex gap-4">
        {meta.loading ? <Skeleton className="size-24 shrink-0 rounded-xl" /> : <LinkThumb image={meta.image} url={url} title={title || host} variant="row" className="size-24 rounded-xl" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{meta.siteName || host}</p>
          <p className="mt-1 break-all text-xs text-muted-foreground/80">{url}</p>
          {meta.loading ? (
            <Skeleton className="mt-2 h-4 w-3/4" />
          ) : meta.description ? (
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{meta.description}</p>
          ) : null}
          {meta.failed && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CircleAlert aria-hidden className="size-3.5" /> 정보를 가져오지 못했어요
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="capture-title">제목</Label>
        {meta.loading && !title ? <Skeleton className="h-10 rounded-lg" /> : null}
        <Input id="capture-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={host} className={meta.loading && !title ? 'sr-only' : 'h-10 rounded-lg'} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="capture-note">노트</Label>
        <Textarea id="capture-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="왜 저장했는지, 나중에 볼 포인트" rows={3} className="rounded-lg" />
      </div>

      <div className="grid gap-1.5">
        <Label>태그</Label>
        <TagPicker vault={vault} value={selection} onChange={setSelection} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" className="h-11 md:h-9" onClick={onClose}>취소</Button>
        <Button type="submit" className="h-11 md:h-9">저장</Button>
      </div>
    </form>
  )
}

export function CaptureSheet() {
  const url = useUiStore((s) => s.captureUrl)
  const closeCapture = useUiStore((s) => s.closeCapture)
  const openDetail = useUiStore((s) => s.openDetail)
  const vault = useVaultStore((s) => s.vault)

  return (
    <ResponsiveSheet open={url !== null} onOpenChange={(open) => !open && closeCapture()} title="링크 저장" description="제목과 노트, 태그는 모두 선택이에요">
      {url && vault && <CaptureForm key={url} url={url} vault={vault} onClose={closeCapture} onOpenExisting={openDetail} />}
    </ResponsiveSheet>
  )
}
