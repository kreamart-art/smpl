// The layout everyone outside the preview still sees: the frontend of main at
// 2b4b32e, built from legacy/ into dist-legacy/. The server picks a build per
// account (server/layout.js). Shared public files come from dist/, so
// legacy/public only holds what differs: the old app manifest.
// Local: `npm run dev:legacy` (API on 5191, like `npm run dev`).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'legacy',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../dist-legacy', emptyOutDir: true },
  server: {
    port: 5192,
    host: true,
    proxy: {
      '/api': { target: 'http://localhost:5191', changeOrigin: true },
    },
  },
})
