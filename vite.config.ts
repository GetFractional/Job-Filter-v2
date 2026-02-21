import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const buildSha =
  process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ??
  process.env.GITHUB_SHA?.slice(0, 7) ??
  process.env.COMMIT_SHA?.slice(0, 7) ??
  'local'
const appEnv = process.env.CF_PAGES_BRANCH
  ? 'preview'
  : (process.env.NODE_ENV ?? 'dev')

export default defineConfig({
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha),
    __APP_ENV__: JSON.stringify(appEnv),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: [],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      workbox: {
        mode: 'development',
      },
      manifest: {
        name: 'Job Filter',
        short_name: 'JobFilter',
        description: 'Premium job revenue cockpit',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
