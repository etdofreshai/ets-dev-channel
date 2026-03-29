import { Router } from 'express'
import { getDb, save, queryAll } from '../db.js'
import crypto from 'crypto'

const router = Router()

router.get('/:id/messages', async (req, res) => {
  const db = await getDb()
  const rows = queryAll(db, 'SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC', [req.params.id])
  res.json(rows)
})

router.post('/:id/messages', async (req, res) => {
  const db = await getDb()
  const { text, sender } = req.body
  const id = crypto.randomUUID()
  const now = Date.now()
  const type = text?.includes('```') ? 'code' : 'text'
  db.run('INSERT INTO messages (id, conversationId, text, sender, timestamp, type) VALUES (?,?,?,?,?,?)',
    [id, req.params.id, text, sender || 'me', now, type])
  db.run('UPDATE conversations SET updatedAt = ? WHERE id = ?', [now, req.params.id])
  save()
  res.json({ id, conversationId: req.params.id, text, sender: sender || 'me', timestamp: now, type })
})

export default router
