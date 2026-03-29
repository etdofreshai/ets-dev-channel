import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { backendPlugin } from './server/vite-plugin'

export default defineConfig({
  plugins: [react(), backendPlugin()],
  server: {
    allowedHosts: true,
  },
})
