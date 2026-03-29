import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function safeBackendPlugin(): Plugin {
  return {
    name: 'ets-dev-channel-backend',
    configureServer(server) {
      import('./server/app.js')
        .then(({ default: app }) => {
          server.middlewares.use(app)
          console.log('🐙 Backend API mounted on Vite dev server')
        })
        .catch(() => {
          console.log('⚠️ Backend not available — running frontend only')
        })
    },
  }
}

export default defineConfig({
  plugins: [react(), safeBackendPlugin()],
  server: {
    allowedHosts: true,
  },
})
