import { cn } from '@/lib/utils'
import type { Tag } from '@/vault/schema'
import { TAG_CHIP_CLASS, TAG_DOT_CLASS } from './palette'

export interface TagChipProps {
  tag: Tag
  selected?: boolean
  count?: number
  onClick?(): void
  size?: 'sm' | 'md'
  className?: string
}

export function TagChip({ tag, selected = false, count, onClick, size = 'md', className }: TagChipProps) {
  const base = cn(
    'inline-flex max-w-full items-center gap-1.5 rounded-full font-medium transition-[background-color,box-shadow,transform]',
    size === 'sm' ? 'h-6 px-2 text-[11px]' : 'h-10 px-3.5 text-sm',
    TAG_CHIP_CLASS[tag.color],
    selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
    className,
  )
  const content = (
    <>
      <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', TAG_DOT_CLASS[tag.color])} />
      <span className="truncate">{tag.name}</span>
      {count !== undefined && <span className="tabular-nums opacity-70">{count}</span>}
    </>
  )
  if (!onClick) return <span className={base}>{content}</span>
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={cn(base, 'cursor-pointer hover:brightness-95 active:scale-[0.97]')}>
      {content}
    </button>
  )
}
