import { Router } from 'express'
import { getDb, save, queryAll, queryOne } from '../db.js'
import crypto from 'crypto'

const router = Router()

router.get('/', async (_req, res) => {
  const db = await getDb()
  res.json(queryAll(db, 'SELECT * FROM sections ORDER BY "order"'))
})

router.post('/', async (req, res) => {
  const db = await getDb()
  const { name, directory, provider } = req.body
  const validProviders = ['openclaw', 'claude-code', 'etclaw']
  const resolvedProvider = validProviders.includes(provider) ? provider : 'openclaw'
  const id = crypto.randomUUID()
  const maxRow = queryOne(db, 'SELECT MAX("order") as m FROM sections')
  const order = (maxRow?.m ?? -1) + 1
  db.run('INSERT INTO sections (id, name, directory, provider, "order") VALUES (?, ?, ?, ?, ?)', [id, name, directory, resolvedProvider, order])
  save()
  res.json({ id, name, directory, provider: resolvedProvider, order })
})

router.patch('/:id', async (req, res) => {
  const db = await getDb()
  const sets: string[] = []; const vals: any[] = []
  for (const [k, v] of Object.entries(req.body)) {
    if (['name', 'directory', 'order'].includes(k)) { sets.push(`"${k}" = ?`); vals.push(v) }
  }
  if (sets.length) {
    vals.push(req.params.id)
    db.run(`UPDATE sections SET ${sets.join(', ')} WHERE id = ?`, vals)
    save()
  }
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  const db = await getDb()
  db.run('DELETE FROM conversations WHERE sectionId = ?', [req.params.id])
  db.run('DELETE FROM sections WHERE id = ?', [req.params.id])
  save()
  res.json({ ok: true })
})

export default router
