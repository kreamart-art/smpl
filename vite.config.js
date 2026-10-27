import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // React and the router change far less often than the app: their own
        // chunk stays cached in browsers across deploys
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//.test(id)) return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5190,
    host: true,
    strictPort: false,
    proxy: {
      '/api': { target: 'http://localhost:5191', changeOrigin: true },
    },
  },
})
