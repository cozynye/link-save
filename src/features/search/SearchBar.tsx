import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useUiStore } from '@/lib/uiStore'

export function SearchBar() {
  const setQuery = useUiStore((s) => s.setQuery)
  const [draft, setDraft] = useState(() => useUiStore.getState().filter.query)
  const debounced = useDebounce(draft, 250)

  // 입력이 멈추면 스토어에 반영한다(스토어 setter 호출이라 React setState 규칙과 무관).
  useEffect(() => {
    setQuery(debounced)
  }, [debounced, setQuery])

  // 다른 곳에서 필터를 초기화하면 입력도 비운다. 구독 콜백 안에서만 setState한다.
  useEffect(
    () =>
      useUiStore.subscribe((state, prev) => {
        if (state.filter.query === '' && prev.filter.query !== '') setDraft('')
      }),
    [],
  )

  return (
    <div className="relative flex-1">
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input aria-label="검색" placeholder="검색" value={draft} onChange={(e) => setDraft(e.target.value)} className="h-10 rounded-lg pl-9 pr-12 md:pr-9" />
      {draft && (
        <Button type="button" variant="ghost" size="icon-sm" aria-label="검색어 지우기" onClick={() => setDraft('')} className="absolute right-1 top-1/2 size-11 -translate-y-1/2 md:size-7">
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
