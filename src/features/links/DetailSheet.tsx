import { useState } from 'react'
import { Copy, ExternalLink, Pin, PinOff, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { Textarea } from '@/components/ui/textarea'
import { TagPicker, commitTagSelection, type TagSelection } from '@/features/tags/TagPicker'
import { formatDate } from '@/lib/format'
import { useUiStore } from '@/lib/uiStore'
import { fetchMetadata } from '@/metadata/fetchMetadata'
import { hostnameOf, normalizeUrl } from '@/metadata/normalizeUrl'
import { findLinkByUrl, type LinkPatch } from '@/vault/ops'
import type { Link, Vault } from '@/vault/schema'
import { useVaultStore } from '@/vault/store'
import { LinkThumb } from './LinkThumb'

// mobile(기본)에서 최소 44px 터치 영역을 보장하고, md 이상 데스크톱에서는 브리프의 size="sm"(32px)로 되돌린다.
const MOBILE_TOUCH_SIZE = 'h-11 md:h-8'

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x))
}

function DetailForm({ link, vault, onClose }: { link: Link; vault: Vault; onClose(): void }) {
  const [title, setTitle] = useState(link.title)
  const [url, setUrl] = useState(link.url)
  const [note, setNote] = useState(link.note)
  const [description, setDescription] = useState(link.description)
  const [image, setImage] = useState(link.image)
  const [siteName, setSiteName] = useState(link.siteName)
  const [selection, setSelection] = useState<TagSelection>({ selectedIds: link.tags, draftNames: [] })
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    title !== link.title || url !== link.url || note !== link.note || description !== link.description ||
    image !== link.image || siteName !== link.siteName || !sameSet(selection.selectedIds, link.tags) || selection.draftNames.length > 0

  function guard(): boolean {
    const result = useVaultStore.getState().canWrite()
    if (!result.ok) toast.error(result.message)
    return result.ok
  }

  function save() {
    setError(null)
    const normalized = normalizeUrl(url)
    if (!normalized.ok) {
      setError('올바른 주소가 아니에요')
      return
    }
    if (findLinkByUrl(vault, normalized.url, link.id)) {
      setError('이미 저장된 링크예요')
      return
    }
    if (!guard()) return
    const store = useVaultStore.getState()
    const tags = commitTagSelection(selection, store)
    const patch: LinkPatch = {}
    const finalTitle = title.trim() || hostnameOf(normalized.url)
    if (finalTitle !== link.title) patch.title = finalTitle
    if (normalized.url !== link.url) patch.url = normalized.url
    if (note.trim() !== link.note) patch.note = note.trim()
    if (description !== link.description) patch.description = description
    if (image !== link.image) patch.image = image
    if (siteName !== link.siteName) patch.siteName = siteName
    if (!sameSet(tags, link.tags)) patch.tags = tags
    if (Object.keys(patch).length > 0) {
      store.updateLink(link.id, patch)
      toast.success('저장했어요')
    }
    onClose()
  }

  async function refresh() {
    const normalized = normalizeUrl(url)
    if (!normalized.ok) {
      setError('올바른 주소가 아니에요')
      return
    }
    setRefreshing(true)
    const result = await fetchMetadata(normalized.url)
    setRefreshing(false)
    if (!result) {
      toast.error('정보를 가져오지 못했어요')
      return
    }
    if (result.title) setTitle(result.title)
    setDescription(result.description)
    setImage(result.image)
    if (result.siteName) setSiteName(result.siteName)
  }

  function togglePin() {
    if (!guard()) return
    useVaultStore.getState().togglePin(link.id)
  }

  function remove() {
    if (!guard()) return
    const store = useVaultStore.getState()
    const removed = store.deleteLink(link.id)
    onClose()
    if (removed) {
      toast.success('삭제했어요', {
        action: {
          label: '실행 취소',
          onClick: () => {
            const latest = useVaultStore.getState()
            const latestGuard = latest.canWrite()
            if (!latestGuard.ok) {
              toast.error(latestGuard.message)
              return
            }
            latest.restoreLink(removed)
          },
        },
      })
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(link.url)
      toast('주소를 복사했어요')
    } catch {
      toast.error('복사하지 못했어요')
    }
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <LinkThumb image={image} url={url} title={title} variant="card" className="rounded-xl" />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" className={MOBILE_TOUCH_SIZE} asChild>
          <a href={link.url} target="_blank" rel="noreferrer noopener">
            <ExternalLink className="size-4" /> 열기
          </a>
        </Button>
        <Button type="button" variant="secondary" size="sm" className={MOBILE_TOUCH_SIZE} onClick={copyUrl}>
          <Copy className="size-4" /> 복사
        </Button>
        <Button type="button" variant="secondary" size="sm" className={MOBILE_TOUCH_SIZE} onClick={togglePin} aria-pressed={link.pinned}>
          {link.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />} {link.pinned ? '고정 해제' : '고정'}
        </Button>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="detail-title">제목</Label>
        <Input id="detail-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-lg" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="detail-url">주소</Label>
        <Input id="detail-url" value={url} inputMode="url" autoCapitalize="off" spellCheck={false} onChange={(e) => { setUrl(e.target.value); setError(null) }} className="h-10 rounded-lg" />
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">사이트 설명</span>
          <Button type="button" variant="ghost" size="sm" className={MOBILE_TOUCH_SIZE} onClick={refresh} disabled={refreshing}>
            <RefreshCw className={refreshing ? 'size-4 animate-spin' : 'size-4'} /> 다시 가져오기
          </Button>
        </div>
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{description || '설명이 없어요'}</p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="detail-note">노트</Label>
        <Textarea id="detail-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="rounded-lg" placeholder="왜 저장했는지, 나중에 볼 포인트" />
      </div>

      <div className="grid gap-1.5">
        <Label>태그</Label>
        <TagPicker vault={vault} value={selection} onChange={setSelection} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        저장 {formatDate(link.createdAt)} · 수정 {formatDate(link.updatedAt)}
      </p>

      <div className="flex items-center justify-between gap-2 pt-1">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" className="h-11 md:h-9 text-destructive hover:text-destructive">
              <Trash2 className="size-4" /> 삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>이 링크를 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>삭제 직후 토스트의 실행 취소로 되살릴 수 있어요.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11 md:h-9">취소</AlertDialogCancel>
              <AlertDialogAction onClick={remove} className="h-11 md:h-9 bg-destructive text-white hover:bg-destructive/90">삭제하기</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-11 md:h-9" onClick={onClose}>닫기</Button>
          <Button type="submit" className="h-11 md:h-9" disabled={!dirty}>저장</Button>
        </div>
      </div>
    </form>
  )
}

export function DetailSheet() {
  const id = useUiStore((s) => s.detailId)
  const closeDetail = useUiStore((s) => s.closeDetail)
  const vault = useVaultStore((s) => s.vault)
  const link = vault?.links.find((l) => l.id === id) ?? null

  return (
    <ResponsiveSheet open={id !== null && link !== null} onOpenChange={(open) => !open && closeDetail()} title="링크" description={link?.siteName || undefined}>
      {link && vault && <DetailForm key={link.id} link={link} vault={vault} onClose={closeDetail} />}
    </ResponsiveSheet>
  )
}
