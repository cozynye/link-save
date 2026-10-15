import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { orderedTags } from '@/vault/derive'
import { findTagByName, normalizeTagName, pickTagColor } from '@/vault/ops'
import type { Tag, Vault } from '@/vault/schema'
import type { VaultState } from '@/vault/store'
import { TagChip } from './TagChip'

export interface TagSelection {
  selectedIds: string[]
  draftNames: string[]
}

export const EMPTY_SELECTION: TagSelection = { selectedIds: [], draftNames: [] }

/** 초안 태그를 실제로 만들고 최종 id 목록을 돌려준다. */
export function commitTagSelection(selection: TagSelection, store: Pick<VaultState, 'addTag'>): string[] {
  const ids = [...selection.selectedIds]
  for (const name of selection.draftNames) {
    const tag = store.addTag(name)
    if (!ids.includes(tag.id)) ids.push(tag.id)
  }
  return ids
}

export function TagPicker({ vault, value, onChange }: { vault: Vault; value: TagSelection; onChange(next: TagSelection): void }) {
  const [draft, setDraft] = useState('')
  const tags = orderedTags(vault)
  const draftColor = pickTagColor(vault)

  function toggle(id: string) {
    const selectedIds = value.selectedIds.includes(id) ? value.selectedIds.filter((x) => x !== id) : [...value.selectedIds, id]
    onChange({ ...value, selectedIds })
  }

  function addDraft() {
    const name = draft.trim()
    if (!name) return
    setDraft('')
    const existing = findTagByName(vault, name)
    if (existing) {
      if (!value.selectedIds.includes(existing.id)) onChange({ ...value, selectedIds: [...value.selectedIds, existing.id] })
      return
    }
    if (value.draftNames.some((d) => normalizeTagName(d) === normalizeTagName(name))) return
    onChange({ ...value, draftNames: [...value.draftNames, name] })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagChip key={tag.id} tag={tag} selected={value.selectedIds.includes(tag.id)} onClick={() => toggle(tag.id)} />
        ))}
        {value.draftNames.map((name) => {
          const provisional: Tag = { id: `draft:${name}`, name, color: draftColor }
          return (
            <TagChip
              key={provisional.id}
              tag={provisional}
              selected
              onClick={() => onChange({ ...value, draftNames: value.draftNames.filter((d) => d !== name) })}
            />
          )
        })}
      </div>
      <div className="relative">
        <Plus aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="새 태그"
          placeholder="새 태그 이름을 입력하고 Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addDraft()
            }
          }}
          className="h-10 rounded-lg pl-9"
        />
      </div>
    </div>
  )
}
