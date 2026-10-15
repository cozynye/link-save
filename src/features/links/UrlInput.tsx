import { useState } from 'react'
import { Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUiStore } from '@/lib/uiStore'
import { cn } from '@/lib/utils'
import { looksLikeUrl, normalizeUrl } from '@/metadata/normalizeUrl'

export function UrlInput() {
  const openCapture = useUiStore((s) => s.openCapture)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(raw: string) {
    const result = normalizeUrl(raw)
    if (!result.ok) {
      if (result.reason !== 'empty') setError('올바른 주소가 아니에요')
      return
    }
    setError(null)
    setValue('')
    openCapture(result.url)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit(value)
      }}
      className="relative"
    >
      <LinkIcon aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="링크 붙여 넣기"
        placeholder="링크를 붙여 넣으세요"
        inputMode="url"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setError(null)
        }}
        onPaste={(event) => {
          const text = event.clipboardData.getData('text')
          if (looksLikeUrl(text)) {
            event.preventDefault()
            submit(text)
          }
        }}
        className={cn('h-14 bg-card pl-10 pr-24 text-base md:h-12 md:pr-20', error && 'border-destructive')}
      />
      <Button type="submit" size="sm" disabled={!value.trim()} className="absolute right-1.5 top-1/2 h-11 -translate-y-1/2 md:h-8">
        저장
      </Button>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
