import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { getDb, save } from '../db.js'
import { enqueueUserMessage } from './bot.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

const router = Router()

router.post('/:id/upload', upload.single('file'), async (req, res) => {
  const db = await getDb()
  const file = req.file
  if (!file) return res.status(400).json({ error: 'No file provided' })

  const id = crypto.randomUUID()
  const now = Date.now()
  const convId = req.params.id
  const text = req.body.text || ''
  const sender = req.body.sender || 'me'
  const mimeType = file.mimetype
  const fileName = file.originalname
  const fileUrl = `/uploads/${file.filename}`

  let type = 'file'
  if (mimeType.startsWith('image/')) type = 'image'
  else if (mimeType.startsWith('audio/')) type = 'voice'

  db.run(
    'INSERT INTO messages (id, conversationId, text, sender, timestamp, type, fileUrl, fileName, mimeType) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, convId, text, sender, now, type, fileUrl, fileName, mimeType]
  )
  db.run('UPDATE conversations SET updatedAt = ? WHERE id = ?', [now, convId])
  save()

  const msg = { id, conversationId: convId, text, sender, timestamp: now, type, fileUrl, fileName, mimeType }
  enqueueUserMessage(msg)
  res.json(msg)
})

export { UPLOAD_DIR }
export default router
