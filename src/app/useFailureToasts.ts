import { useEffect } from 'react'
import { toast } from 'sonner'
import { useVaultStore } from '@/vault/store'

export function useFailureToasts(): void {
  useEffect(
    () =>
      useVaultStore.subscribe((state, prev) => {
        if (state.lastFailure && state.lastFailure !== prev.lastFailure) toast.error(state.lastFailure.message)
      }),
    [],
  )
}
