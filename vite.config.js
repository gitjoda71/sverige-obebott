import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serveras på /<repo-name>/ — sätts via env vid CI build.
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
