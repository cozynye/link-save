import { cn } from '@/lib/utils'
import type { Tag } from '@/vault/schema'

export interface TagChipProps {
  tag: Tag
  selected?: boolean
  count?: number
  onClick?(): void
  size?: 'sm' | 'md'
  className?: string
}

/**
 * 태그는 색을 쓰지 않는다.
 * - 표시용(onClick 없음): 회색 `#이름` 텍스트.
 * - 선택용(onClick 있음): 테두리만 있는 각진 칩, 선택되면 검정으로 채운다.
 */
export function TagChip({ tag, selected = false, count, onClick, size = 'md', className }: TagChipProps) {
  if (!onClick) {
    return (
      <span className={cn('inline-flex max-w-full items-baseline text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm', className)}>
        <span aria-hidden className="opacity-60">#</span>
        <span className="truncate">{tag.name}</span>
        {count !== undefined && <span className="ml-1 tabular-nums opacity-70">{count}</span>}
      </span>
    )
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md border font-medium',
        size === 'sm' ? 'h-7 px-2 text-xs' : 'h-10 px-3 text-sm',
        selected ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:border-foreground/40',
        className,
      )}
    >
      <span className="truncate">{tag.name}</span>
      {count !== undefined && <span className={cn('tabular-nums', selected ? 'opacity-70' : 'text-muted-foreground')}>{count}</span>}
    </button>
  )
}
