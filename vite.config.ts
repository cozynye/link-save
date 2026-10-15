import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type PluginOption } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { vercelApiDev } from './vite.api-dev'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }

const pwa: PluginOption[] = process.env.VITEST
  ? []
  : [
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        includeAssets: ['favicon.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'SaveLink',
          short_name: 'SaveLink',
          description: '링크를 GitHub 레포에 저장하는 개인용 도구',
          lang: 'ko',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#f7f4ee',
          theme_color: '#f7f4ee',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [],
        },
      }),
    ]

export default defineConfig({
  plugins: [react(), tailwindcss(), vercelApiDev(), ...pwa],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
