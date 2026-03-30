import { Router } from 'express'
import { getDb, save, queryAll } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  const db = await getDb()
  const rows = queryAll(db, 'SELECT key, value FROM settings')
  const settings: Record<string, any> = {}
  for (const r of rows) {
    settings[r.key] = r.value === 'true' ? true : r.value === 'false' ? false : r.value
  }
  res.json({ workspaceDir: settings.workspaceDir ?? '', setupComplete: !!settings.setupComplete })
})

router.patch('/', async (req, res) => {
  const db = await getDb()
  for (const [k, v] of Object.entries(req.body)) {
    db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [k, String(v)])
  }
  save()
  res.json({ ok: true })
})

router.post('/reset', async (_req, res) => {
  const db = await getDb()
  db.run('DELETE FROM messages')
  db.run('DELETE FROM conversations')
  db.run('DELETE FROM sections')
  db.run('DELETE FROM settings')
  db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['workspaceDir', ''])
  db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['setupComplete', 'false'])
  save()
  res.json({ ok: true })
})

export default router
