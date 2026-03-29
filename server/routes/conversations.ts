import { Router } from 'express'
import db from '../db.js'
import crypto from 'crypto'

const router = Router()

function enrichConversation(row: any) {
  const lastMsg = db.prepare('SELECT text, timestamp FROM messages WHERE conversationId = ? ORDER BY timestamp DESC LIMIT 1').get(row.id) as any
  return {
    ...row,
    archived: !!row.archived,
    lastMessage: lastMsg?.text ?? '',
    lastTimestamp: lastMsg?.timestamp ?? row.updatedAt ?? row.createdAt,
    messages: [],
  }
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM conversations ORDER BY updatedAt DESC').all()
  res.json(rows.map(enrichConversation))
})

router.post('/', (req, res) => {
  const { sectionId, name, avatar, parentId } = req.body
  const id = crypto.randomUUID()
  const now = Date.now()
  db.prepare('INSERT INTO conversations (id, name, avatar, sectionId, parentId, archived, createdAt, updatedAt) VALUES (?,?,?,?,?,0,?,?)')
    .run(id, name || 'New Conversation', avatar || '💬', sectionId, parentId || null, now, now)
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id)
  res.json(enrichConversation(row))
})

router.patch('/:id', (req, res) => {
  const allowed = ['name', 'avatar', 'description', 'sectionId', 'parentId']
  const sets: string[] = ['updatedAt = ?']; const vals: any[] = [Date.now()]
  for (const [k, v] of Object.entries(req.body)) {
    if (allowed.includes(k)) { sets.push(`${k} = ?`); vals.push(v) }
  }
  vals.push(req.params.id)
  db.prepare(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  res.json({ ok: true })
})

router.post('/:id/archive', (req, res) => {
  db.prepare('UPDATE conversations SET archived = 1, updatedAt = ? WHERE id = ?').run(Date.now(), req.params.id)
  res.json({ ok: true })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM messages WHERE conversationId = ?').run(req.params.id)
  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
