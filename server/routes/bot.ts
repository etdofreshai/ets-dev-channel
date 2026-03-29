import { Router } from 'express'
import { getDb, save } from '../db.js'
import crypto from 'crypto'

const router = Router()

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
