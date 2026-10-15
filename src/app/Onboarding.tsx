import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVaultStore } from '@/vault/store'

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new'

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-4">
      <div aria-hidden className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {number}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </section>
  )
}

export function Onboarding() {
  const connect = useVaultStore((s) => s.connect)
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('save-link-data')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const repoUrl = `https://github.com/new?name=${encodeURIComponent(repo.trim() || 'save-link-data')}&visibility=private`
  const canSubmit = owner.trim().length > 0 && repo.trim().length > 0 && token.trim().length > 0 && !busy

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    const result = await connect({ owner, repo, path: 'links.json', token })
    setBusy(false)
    if (!result.ok) setError(result.message)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-10 px-5 py-10">
      <header>
        <p className="text-sm font-medium text-primary">개인 링크 저장소</p>
        <h1 className="mt-1 text-3xl font-bold">SaveLink</h1>
        <p className="mt-3 text-muted-foreground">GitHub 비공개 레포의 JSON 파일 하나에 링크를 저장합니다. 서버도 데이터베이스도 없고, 세 단계면 끝나요.</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <Step number={1} title="데이터 레포 만들기">
          <p className="text-sm text-muted-foreground">링크 파일만 들어갈 비공개 레포를 하나 만듭니다. 화면에서 <strong>Private를 선택하세요</strong>.</p>
          <Button asChild variant="outline" className="w-fit">
            <a href={repoUrl} target="_blank" rel="noreferrer">
              GitHub에서 새 레포 열기 <ExternalLink className="size-4" />
            </a>
          </Button>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="owner">GitHub 사용자명</Label>
              <Input id="owner" autoComplete="username" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="octocat" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="repo">레포 이름</Label>
              <Input id="repo" value={repo} onChange={(e) => setRepo(e.target.value)} />
            </div>
          </div>
        </Step>

        <Step number={2} title="토큰 발급">
          <p className="text-sm text-muted-foreground">이 레포 하나에만 쓸 수 있는 fine-grained 토큰을 만듭니다.</p>
          <Button asChild variant="outline" className="w-fit">
            <a href={TOKEN_URL} target="_blank" rel="noreferrer">
              토큰 발급 페이지 열기 <ExternalLink className="size-4" />
            </a>
          </Button>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Repository access → <strong>Only select repositories</strong> → {repo.trim() || 'save-link-data'}</li>
            <li>Repository permissions → <strong>Contents: Read and write</strong></li>
            <li>Expiration → 최대 1년. 만료되면 여기서 다시 붙여 넣으면 됩니다.</li>
          </ul>
        </Step>

        <Step number={3} title="붙여 넣고 연결">
          <div className="grid gap-1.5">
            <Label htmlFor="token">토큰</Label>
            <Input id="token" type="password" autoComplete="off" spellCheck={false} value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" />
            <p className="text-xs text-muted-foreground">토큰은 이 기기의 브라우저에만 저장됩니다.</p>
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={!canSubmit} className="w-full sm:w-fit">
            {busy ? '연결 중…' : '연결'}
          </Button>
        </Step>
      </form>
    </main>
  )
}
