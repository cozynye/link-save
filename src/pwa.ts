import { registerSW } from 'virtual:pwa-register'

export function setupPwa(): void {
  if (!('serviceWorker' in navigator)) return
  registerSW({ immediate: true })
}
