import express from 'express'
import cors from 'cors'
import conversationsRouter from './routes/conversations.js'
import messagesRouter from './routes/messages.js'
import sectionsRouter from './routes/sections.js'
import settingsRouter from './routes/settings.js'
import botRouter from './routes/bot.js'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

app.use(cors())
app.use(express.json())

app.use('/api/conversations', conversationsRouter)
app.use('/api/conversations', messagesRouter)
app.use('/api/sections', sectionsRouter)
app.use('/api/settings', settingsRouter)
app.use('/bot', botRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
