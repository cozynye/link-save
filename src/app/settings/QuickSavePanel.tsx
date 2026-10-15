import { useEffect, useRef } from 'react'
import { Bookmark } from 'lucide-react'
import { bookmarkletCode } from '@/lib/bookmarklet'

export function QuickSavePanel() {
  const origin = window.location.origin
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const code = bookmarkletCode(origin)

  // React 19는 javascript: href를 막으므로 DOM에 직접 넣는다.
  useEffect(() => {
    anchorRef.current?.setAttribute('href', code)
  }, [code])

  return (
    <div className="flex flex-col gap-6 text-sm">
      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">데스크톱 북마클릿</h3>
        <p className="text-muted-foreground">아래 버튼을 브라우저 북마크 바로 끌어다 놓으세요. 어떤 페이지에서든 누르면 그 주소가 SaveLink 저장 시트로 열립니다.</p>
        <a
          ref={anchorRef}
          draggable
          onClick={(e) => e.preventDefault()}
          className="inline-flex h-11 w-fit cursor-grab items-center gap-2 rounded-md border bg-card px-3 font-medium md:h-10"
        >
          <Bookmark className="size-4 text-primary" /> SaveLink에 저장
        </a>
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">iPhone 단축어</h3>
        <p className="text-muted-foreground">단축어 앱에서 새 단축어를 만들고 다음 세 액션을 순서대로 넣으세요.</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>&lsquo;공유 시트에서 URL 받기&rsquo;를 켜고, 입력 유형을 URL로 둡니다.</li>
          <li>&lsquo;URL 인코딩&rsquo; 액션에 단축어 입력을 넣습니다.</li>
          <li>&lsquo;URL 열기&rsquo; 액션에 <code className="rounded bg-muted px-1">{origin}/?url=</code> 뒤에 인코딩 결과를 붙입니다.</li>
        </ol>
        <p className="text-muted-foreground">Safari 공유 시트에서 이 단축어를 누르면 SaveLink가 열리고 저장 시트가 바로 뜹니다.</p>
      </section>
    </div>
  )
}
