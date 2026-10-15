import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUiStore } from '@/lib/uiStore'
import { cn } from '@/lib/utils'
import { tagCounts } from '@/vault/derive'
import { findTagByName } from '@/vault/ops'
import { TAG_COLORS, type Tag, type TagColor, type Vault } from '@/vault/schema'
import { useVaultStore } from '@/vault/store'
import { TAG_COLOR_LABEL, TAG_DOT_CLASS } from './palette'

function guard(): boolean {
  const result = useVaultStore.getState().canWrite()
  if (!result.ok) toast.error(result.message)
  return result.ok
}

function TagRow({ tag, vault, count }: { tag: Tag; vault: Vault; count: number }) {
  const [name, setName] = useState(tag.name)
  const [error, setError] = useState<string | null>(null)

  function commitName() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === tag.name) {
      setName(tag.name)
      return
    }
    const clash = findTagByName(vault, trimmed)
    if (clash && clash.id !== tag.id) {
      setError('이미 있는 태그예요')
      return
    }
    if (!guard()) return
    setError(null)
    useVaultStore.getState().updateTag(tag.id, { name: trimmed })
  }

  function changeColor(color: TagColor) {
    if (!guard()) return
    useVaultStore.getState().updateTag(tag.id, { color })
  }

  function remove() {
    if (!guard()) return
    useVaultStore.getState().deleteTag(tag.id)
    useUiStore.getState().removeTagFromFilter(tag.id)
  }

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span aria-hidden className={cn('size-3 shrink-0 rounded-full', TAG_DOT_CLASS[tag.color])} />
        <Input
          aria-label={`${tag.name} 이름`}
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitName()
            }
          }}
          className="h-11 flex-1 rounded-lg md:h-9"
        />
        <select
          aria-label={`${tag.name} 색`}
          value={tag.color}
          onChange={(e) => changeColor(e.target.value as TagColor)}
          className="h-11 rounded-lg border bg-card px-2 text-sm md:h-9"
        >
          {TAG_COLORS.map((color) => (
            <option key={color} value={color}>{TAG_COLOR_LABEL[color]}</option>
          ))}
        </select>
        <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{count}</span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`${tag.name} 삭제`} className="size-11 text-muted-foreground hover:text-destructive md:size-8">
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>&lsquo;{tag.name}&rsquo; 태그를 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>링크 {count}개에서 이 태그가 빠집니다. 링크 자체는 지워지지 않아요.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11 md:h-9">취소</AlertDialogCancel>
              <AlertDialogAction onClick={remove} className="h-11 bg-destructive text-white hover:bg-destructive/90 md:h-9">삭제하기</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {error && <p role="alert" className="pl-5 text-xs text-destructive">{error}</p>}
    </li>
  )
}

export function TagManager({ vault }: { vault: Vault }) {
  const [draft, setDraft] = useState('')
  const counts = tagCounts(vault)

  function add() {
    const name = draft.trim()
    if (!name) return
    if (findTagByName(vault, name)) {
      toast.error('이미 있는 태그예요')
      return
    }
    if (!guard()) return
    useVaultStore.getState().addTag(name)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <Plus aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="새 태그 이름" placeholder="새 태그 이름" value={draft} onChange={(e) => setDraft(e.target.value)} className="h-11 rounded-lg pl-9 pr-16 md:h-10" />
        <Button type="submit" size="sm" disabled={!draft.trim()} className="absolute right-1 top-1/2 h-11 -translate-y-1/2 rounded-md md:h-8">추가</Button>
      </form>
      {vault.tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 태그가 없어요. 링크를 저장할 때 바로 만들 수도 있어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {[...vault.tags].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((tag) => (
            <TagRow key={tag.id} tag={tag} vault={vault} count={counts.get(tag.id) ?? 0} />
          ))}
        </ul>
      )}
    </div>
  )
}
