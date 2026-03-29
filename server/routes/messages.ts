import { Router } from 'express'
import db from '../db.js'
import crypto from 'crypto'

const router = Router()

router.get('/:id/messages', (req, res) => {
  const rows = db.prepare('SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC').all(req.params.id)
  res.json(rows)
})

router.post('/:id/messages', (req, res) => {
  const { text, sender } = req.body
  const id = crypto.randomUUID()
  const now = Date.now()
  const type = text?.includes('```') ? 'code' : 'text'
  db.prepare('INSERT INTO messages (id, conversationId, text, sender, timestamp, type) VALUES (?,?,?,?,?,?)')
    .run(id, req.params.id, text, sender || 'me', now, type)
  db.prepare('UPDATE conversations SET updatedAt = ? WHERE id = ?').run(now, req.params.id)
  res.json({ id, conversationId: req.params.id, text, sender: sender || 'me', timestamp: now, type })
})

export default router
