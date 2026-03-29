import type { Plugin, ViteDevServer } from 'vite'

export function backendPlugin(): Plugin {
  return {
    name: 'ets-dev-channel-backend',
    configureServer(server: ViteDevServer) {
      try {
        import('./app.js').then(({ default: app }) => {
          server.middlewares.use(app)
          console.log('🐙 Backend API mounted on Vite dev server')
        }).catch(err => {
          console.warn('⚠️ Backend plugin failed to load (non-fatal):', err.message)
        })
      } catch (err: any) {
        console.warn('⚠️ Backend plugin failed (non-fatal):', err.message)
      }
    },
  }
}
