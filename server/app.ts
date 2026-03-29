import express from 'express'
import cors from 'cors'
import conversationsRouter from './routes/conversations.js'
import messagesRouter from './routes/messages.js'
import sectionsRouter from './routes/sections.js'
import settingsRouter from './routes/settings.js'
import botRouter from './routes/bot.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/conversations', conversationsRouter)
app.use('/api/conversations', messagesRouter)
app.use('/api/sections', sectionsRouter)
app.use('/api/settings', settingsRouter)
app.use('/bot', botRouter)

export default app
