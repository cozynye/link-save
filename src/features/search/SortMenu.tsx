import { ArrowUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUiStore } from '@/lib/uiStore'
import { SORT_KEYS, SORT_LABELS, type SortKey } from './sortLinks'

export function SortMenu() {
  const sort = useUiStore((s) => s.sort)
  const setSort = useUiStore((s) => s.setSort)
  return (
    <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
      <SelectTrigger aria-label="정렬" className="h-10 w-auto gap-2 rounded-lg">
        <ArrowUpDown aria-hidden className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_KEYS.map((key) => (
          <SelectItem key={key} value={key}>
            {SORT_LABELS[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
