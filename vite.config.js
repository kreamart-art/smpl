import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5190,
    host: true,
    strictPort: false,
    proxy: {
      '/api': { target: 'http://localhost:5191', changeOrigin: true },
    },
  },
})
