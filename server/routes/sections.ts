import { Router } from 'express'
import db from '../db.js'
import crypto from 'crypto'

const router = Router()

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM sections ORDER BY "order"').all())
})

router.post('/', (req, res) => {
  const { name, directory } = req.body
  const id = crypto.randomUUID()
  const order = (db.prepare('SELECT MAX("order") as m FROM sections').get() as any)?.m ?? -1
  db.prepare('INSERT INTO sections (id, name, directory, "order") VALUES (?, ?, ?, ?)').run(id, name, directory, order + 1)
  res.json({ id, name, directory, order: order + 1 })
})

router.patch('/:id', (req, res) => {
  const sets: string[] = []; const vals: any[] = []
  for (const [k, v] of Object.entries(req.body)) {
    if (['name', 'directory', 'order'].includes(k)) { sets.push(`"${k}" = ?`); vals.push(v) }
  }
  if (sets.length) { vals.push(req.params.id); db.prepare(`UPDATE sections SET ${sets.join(', ')} WHERE id = ?`).run(...vals) }
  res.json({ ok: true })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM conversations WHERE sectionId = ?').run(req.params.id)
  db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
