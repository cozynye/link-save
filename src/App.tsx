import { useEffect, useLayoutEffect } from 'react'
import { Toaster } from 'sonner'
import { Main } from '@/app/Main'
import { Onboarding } from '@/app/Onboarding'
import { SettingsSheet } from '@/app/Settings'
import { useFailureToasts } from '@/app/useFailureToasts'
import { CaptureSheet } from '@/features/links/CaptureSheet'
import { DetailSheet } from '@/features/links/DetailSheet'
import { applyTheme, watchSystemTheme } from '@/lib/theme'
import { useUiStore } from '@/lib/uiStore'
import { normalizeUrl } from '@/metadata/normalizeUrl'
import { useVaultStore } from '@/vault/store'

function consumeDeepLink(): void {
  const current = new URL(window.location.href)
  const incoming = current.searchParams.get('url')
  if (!incoming) return
  window.history.replaceState(null, '', current.pathname)
  const normalized = normalizeUrl(incoming)
  if (normalized.ok) useUiStore.getState().setPendingCaptureUrl(normalized.url)
}

export default function App() {
  const status = useVaultStore((s) => s.status)
  const pendingCaptureUrl = useUiStore((s) => s.pendingCaptureUrl)

  // init()은 첫 await 전까지 동기로 실행되어 store의 status를 바로 갱신하므로,
  // useLayoutEffect가 paint 전에 재렌더를 flush해 잘못된 화면이 보이지 않는다.
  // (별도의 "booted" state는 effect 안에서 setState를 호출해야 해서 피한다.)
  useLayoutEffect(() => {
    consumeDeepLink()
    void useVaultStore.getState().init()
    const currentTheme = () => useVaultStore.getState().settings?.theme ?? 'system'
    applyTheme(currentTheme())
    return watchSystemTheme(() => applyTheme(currentTheme()))
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !pendingCaptureUrl) return
    const ui = useUiStore.getState()
    ui.setPendingCaptureUrl(null)
    ui.openCapture(pendingCaptureUrl)
  }, [status, pendingCaptureUrl])

  useFailureToasts()

  useEffect(() => {
    const setOnline = useVaultStore.getState().setOnline
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // 보류 중인 변경이 있거나 쓰는 중에 탭을 닫으면 그 변경을 잃을 수 있으므로 막는다.
  // store를 구독해 최신 pendingCount/writing을 반영한다 (훅 셀렉터를 쓰면 리렌더마다
  // effect를 다시 걸어야 해서, 구독으로 필요할 때만 리스너를 붙이고 뗀다).
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    let attached = false
    const sync = () => {
      const { pendingCount, writing } = useVaultStore.getState()
      const shouldBlock = pendingCount > 0 || writing
      if (shouldBlock && !attached) {
        window.addEventListener('beforeunload', handler)
        attached = true
      } else if (!shouldBlock && attached) {
        window.removeEventListener('beforeunload', handler)
        attached = false
      }
    }
    sync()
    const unsubscribe = useVaultStore.subscribe(sync)
    return () => {
      unsubscribe()
      if (attached) window.removeEventListener('beforeunload', handler)
    }
  }, [])

  return (
    <>
      {status === 'disconnected' ? (
        <Onboarding />
      ) : (
        <>
          <Main />
          <CaptureSheet />
          <DetailSheet />
          <SettingsSheet />
        </>
      )}
      <Toaster position="top-center" richColors closeButton />
    </>
  )
}
