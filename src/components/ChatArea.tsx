import { useState, useRef, useEffect } from 'react'
import { Conversation, Message } from '../data/mockData'
import MessageBubble from './MessageBubble'
import ConversationInfoPanel from './ConversationInfoPanel'

interface Props {
  conversation: Conversation | null
  onSend: (convId: string, text: string) => void
  onBack: () => void
  onUpdateConversation: (id: string, fields: Partial<Conversation>) => void
}

export default function ChatArea({ conversation, onSend, onBack, onUpdateConversation }: Props) {
  const [input, setInput] = useState('')
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [conversation?.messages.length])

  if (!conversation) {
    return (
      <div className="chat-area">
        <div className="no-chat">Select a conversation to start</div>
      </div>
    )
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    onSend(conversation.id, text)
    setInput('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <button className="chat-header-back" onClick={onBack}>←</button>
        <div className="conv-avatar chat-header-clickable" style={{ width: 36, height: 36, fontSize: 16 }} onClick={() => setInfoPanelOpen(true)}>
          {conversation.avatar}
        </div>
        <div className="chat-header-info chat-header-clickable" onClick={() => setInfoPanelOpen(true)}>
          <h2>{conversation.name}</h2>
          <div className="chat-header-status" style={{ color: '#8899a6' }}>
            {conversation.description || ''}
          </div>
        </div>
      </div>

      <div className="messages" ref={messagesRef}>
        {conversation.messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
      </div>

      {conversation.parentId ? (
        <div className="input-area input-area-readonly">
          <span className="subagent-readonly-label">🐙 Sub-agent session — read only</span>
        </div>
      ) : (
        <div className="input-area">
          <button className="input-btn" title="Attach file">📎</button>
          <textarea
            placeholder="Message..."
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 120) + 'px'
            }}
          />
          <button className="input-btn" title="Voice message">🎤</button>
          <button className="send-btn" onClick={handleSend} title="Send">➤</button>
        </div>
      )}

      <ConversationInfoPanel
        conversation={conversation}
        open={infoPanelOpen}
        onClose={() => setInfoPanelOpen(false)}
        onUpdate={onUpdateConversation}
      />
    </div>
  )
}
