import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import app from './app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = parseInt(process.env.PORT || '3001', 10)

// Serve built frontend in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/bot')) return next()
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🐙 ET's Dev Channel running on http://localhost:${PORT}`)
})
