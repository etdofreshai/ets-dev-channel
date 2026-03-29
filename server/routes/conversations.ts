import { Router } from 'express'
import { getDb, save, queryAll, queryOne } from '../db.js'
import crypto from 'crypto'

const router = Router()

function enrichConversation(db: any, row: any) {
  const lastMsg = queryOne(db, 'SELECT text, timestamp FROM messages WHERE conversationId = ? ORDER BY timestamp DESC LIMIT 1', [row.id])
  return {
    ...row,
    archived: !!row.archived,
    lastMessage: lastMsg?.text ?? '',
    lastTimestamp: lastMsg?.timestamp ?? row.updatedAt ?? row.createdAt,
    messages: [],
  }
}

router.get('/', async (_req, res) => {
  const db = await getDb()
  const rows = queryAll(db, 'SELECT * FROM conversations ORDER BY updatedAt DESC')
  res.json(rows.map(r => enrichConversation(db, r)))
})

router.post('/', async (req, res) => {
  const db = await getDb()
  const { sectionId, name, avatar, parentId } = req.body
  const id = crypto.randomUUID()
  const now = Date.now()
  db.run('INSERT INTO conversations (id, name, avatar, sectionId, parentId, archived, createdAt, updatedAt) VALUES (?,?,?,?,?,0,?,?)',
    [id, name || 'New Conversation', avatar || '💬', sectionId, parentId || null, now, now])
  save()
  const row = queryOne(db, 'SELECT * FROM conversations WHERE id = ?', [id])
  res.json(enrichConversation(db, row))
})

router.patch('/:id', async (req, res) => {
  const db = await getDb()
  const allowed = ['name', 'avatar', 'description', 'sectionId', 'parentId']
  const sets: string[] = ['updatedAt = ?']; const vals: any[] = [Date.now()]
  for (const [k, v] of Object.entries(req.body)) {
    if (allowed.includes(k)) { sets.push(`${k} = ?`); vals.push(v) }
  }
  vals.push(req.params.id)
  db.run(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ?`, vals)
  save()
  res.json({ ok: true })
})

router.post('/:id/archive', async (req, res) => {
  const db = await getDb()
  db.run('UPDATE conversations SET archived = 1, updatedAt = ? WHERE id = ?', [Date.now(), req.params.id])
  save()
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  const db = await getDb()
  db.run('DELETE FROM messages WHERE conversationId = ?', [req.params.id])
  db.run('DELETE FROM conversations WHERE id = ?', [req.params.id])
  save()
  res.json({ ok: true })
})

export default router
