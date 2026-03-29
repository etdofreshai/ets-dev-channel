import type { Plugin, ViteDevServer } from 'vite'

export function backendPlugin(): Plugin {
  return {
    name: 'ets-dev-channel-backend',
    configureServer(server: ViteDevServer) {
      // Dynamically import the Express app so it runs inside Vite's process
      import('./app.js').then(({ default: app }) => {
        // Mount Express as middleware — handles /api/* and /bot/* before Vite
        server.middlewares.use(app)
        console.log('🐙 Backend API mounted on Vite dev server')
      }).catch(err => {
        console.error('Failed to load backend:', err)
      })
    },
  }
}
