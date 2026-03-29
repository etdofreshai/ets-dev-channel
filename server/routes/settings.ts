import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  const settings: Record<string, any> = {}
  for (const r of rows) {
    settings[r.key] = r.value === 'true' ? true : r.value === 'false' ? false : r.value
  }
  res.json({ workspaceDir: settings.workspaceDir ?? '', setupComplete: !!settings.setupComplete })
})

router.patch('/', (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
  for (const [k, v] of Object.entries(req.body)) {
    upsert.run(k, String(v))
  }
  res.json({ ok: true })
})

export default router
