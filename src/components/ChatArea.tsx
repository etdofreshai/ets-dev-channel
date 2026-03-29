import { useState, useRef, useEffect } from 'react'
import { Conversation, Message } from '../data/mockData'
import MessageBubble from './MessageBubble'

interface Props {
  conversation: Conversation | null
  onSend: (convId: string, text: string) => void
  onBack: () => void
}

export default function ChatArea({ conversation, onSend, onBack }: Props) {
  const [input, setInput] = useState('')
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
        <div className="conv-avatar" style={{ width: 36, height: 36, fontSize: 16 }}>
          {conversation.avatar}
        </div>
        <div className="chat-header-info">
          <h2>{conversation.name}</h2>
          <div className="chat-header-status">
            {conversation.typing ? 'typing...' : conversation.online ? 'online' : 'last seen recently'}
          </div>
        </div>
      </div>

      <div className="messages" ref={messagesRef}>
        {conversation.messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
      </div>

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
    </div>
  )
}
