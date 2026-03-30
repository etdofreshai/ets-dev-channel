import { Router } from 'express'
import { getDb, save } from '../db.js'
import crypto from 'crypto'

const router = Router()

// Track the last update_id delivered via getUpdates
let lastUpdateId = 0
// Queue of undelivered user messages for polling
const updateQueue: Array<{
  update_id: number
  message: {
    message_id: string
    chat: { id: string }
    from: { id: string; first_name: string }
    text: string
    date: number
  }
}> = []

// Called internally when a user sends a message
export function enqueueUserMessage(msg: { id: string; conversationId: string; text: string; sender: string; timestamp: number }) {
  if (msg.sender === 'bot') return // Don't queue bot messages
  lastUpdateId++
  updateQueue.push({
    update_id: lastUpdateId,
    message: {
      message_id: msg.id,
      chat: { id: msg.conversationId },
      from: { id: msg.sender, first_name: msg.sender },
      text: msg.text,
      date: Math.floor(msg.timestamp / 1000),
    },
  })
}

// Long-polling endpoint — mirrors Telegram's getUpdates
router.get('/getUpdates', async (req, res) => {
  const offset = parseInt(req.query.offset as string) || 0
  const timeout = Math.min(parseInt(req.query.timeout as string) || 30, 60)

  // Return any updates with update_id >= offset
  const pending = updateQueue.filter(u => u.update_id >= offset)
  if (pending.length > 0) {
    return res.json({ ok: true, result: pending })
  }

  // Long-poll: wait up to `timeout` seconds for new messages
  const start = Date.now()
  const interval = setInterval(() => {
    const updates = updateQueue.filter(u => u.update_id >= offset)
    if (updates.length > 0 || Date.now() - start >= timeout * 1000) {
      clearInterval(interval)
      res.json({ ok: true, result: updates })
    }
  }, 500)

  // Cleanup on client disconnect
  req.on('close', () => clearInterval(interval))
})

// Trim acknowledged updates (keep queue small)
router.post('/ackUpdates', (req, res) => {
  const { offset } = req.body
  if (offset) {
    const idx = updateQueue.findIndex(u => u.update_id >= offset)
    if (idx > 0) updateQueue.splice(0, idx)
  }
  res.json({ ok: true })
})

// In-memory typing state
const typingState = new Map<string, { action: string; timestamp: number }>()

router.post('/sendMessage', async (req, res) => {
  const db = await getDb()
  const { chat_id, text, parse_mode } = req.body
  if (!chat_id || !text) return res.status(400).json({ ok: false, error: 'chat_id and text required' })
  const id = crypto.randomUUID()
  const now = Date.now()
  const type = text.includes('```') ? 'code' : 'text'
  db.run('INSERT INTO messages (id, conversationId, text, sender, timestamp, type) VALUES (?,?,?,?,?,?)', [id, chat_id, text, 'bot', now, type])
  db.run('UPDATE conversations SET updatedAt = ? WHERE id = ?', [now, chat_id])
  save()
  res.json({ ok: true, result: { message_id: id, chat: { id: chat_id }, text, date: Math.floor(now / 1000) } })
})

router.post('/editMessageText', async (req, res) => {
  const db = await getDb()
  const { chat_id, message_id, text } = req.body
  if (!chat_id || !message_id || !text) return res.status(400).json({ ok: false, error: 'chat_id, message_id, and text required' })
  const type = text.includes('```') ? 'code' : 'text'
  db.run('UPDATE messages SET text = ?, type = ? WHERE id = ? AND conversationId = ?', [text, type, message_id, chat_id])
  save()
  res.json({ ok: true, result: { message_id, chat: { id: chat_id }, text } })
})

router.post('/deleteMessage', async (req, res) => {
  const db = await getDb()
  const { chat_id, message_id } = req.body
  if (!chat_id || !message_id) return res.status(400).json({ ok: false, error: 'chat_id and message_id required' })
  db.run('DELETE FROM messages WHERE id = ? AND conversationId = ?', [message_id, chat_id])
  save()
  res.json({ ok: true, result: true })
})

router.post('/sendChatAction', (req, res) => {
  const { chat_id, action } = req.body
  if (!chat_id || !action) return res.status(400).json({ ok: false, error: 'chat_id and action required' })
  typingState.set(chat_id, { action, timestamp: Date.now() })
  res.json({ ok: true, result: true })
})

router.get('/getChatAction/:chatId', (req, res) => {
  const state = typingState.get(req.params.chatId)
  if (state && Date.now() - state.timestamp < 10000) {
    res.json({ ok: true, result: state })
  } else {
    typingState.delete(req.params.chatId)
    res.json({ ok: true, result: null })
  }
})

export default router
