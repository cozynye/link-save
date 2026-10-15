import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUiStore } from '@/lib/uiStore'
import { useVaultStore } from '@/vault/store'

export function ConnectionPanel() {
  const settings = useVaultStore((s) => s.settings)
  const connect = useVaultStore((s) => s.connect)
  const disconnect = useVaultStore((s) => s.disconnect)
  const closeSettings = useUiStore((s) => s.closeSettings)
  const [owner, setOwner] = useState(settings?.owner ?? '')
  const [repo, setRepo] = useState(settings?.repo ?? '')
  const [path, setPath] = useState(settings?.path ?? 'links.json')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)

  async function reconnect() {
    setBusy(true)
    const result = await connect({ owner, repo, path, token: token.trim() || settings?.token || '' })
    setBusy(false)
    if (result.ok) {
      setToken('')
      toast.success('연결했어요')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="conn-owner">GitHub 사용자명</Label>
          <Input id="conn-owner" value={owner} onChange={(e) => setOwner(e.target.value)} className="h-11 rounded-lg md:h-10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="conn-repo">레포 이름</Label>
          <Input id="conn-repo" value={repo} onChange={(e) => setRepo(e.target.value)} className="h-11 rounded-lg md:h-10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="conn-path">파일 경로</Label>
          <Input id="conn-path" value={path} onChange={(e) => setPath(e.target.value)} className="h-11 rounded-lg md:h-10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="conn-token">새 토큰</Label>
          <Input id="conn-token" type="password" autoComplete="off" placeholder="바꿀 때만 입력" value={token} onChange={(e) => setToken(e.target.value)} className="h-11 rounded-lg md:h-10" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" className="h-11 text-destructive hover:text-destructive md:h-9">연결 해제</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>이 기기에서 연결을 해제할까요?</AlertDialogTitle>
              <AlertDialogDescription>저장된 토큰과 사본을 이 브라우저에서 지웁니다. GitHub의 데이터는 그대로 남아요.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11 md:h-9">취소</AlertDialogCancel>
              <AlertDialogAction onClick={() => { disconnect(); closeSettings() }} className="h-11 bg-destructive text-white hover:bg-destructive/90 md:h-9">해제하기</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button type="button" onClick={reconnect} disabled={busy || !owner.trim() || !repo.trim()} className="h-11 md:h-9">
          {busy ? '연결 중…' : '재연결'}
        </Button>
      </div>
    </div>
  )
}
