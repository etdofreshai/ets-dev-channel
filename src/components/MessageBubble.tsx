import { Message } from '../data/mockData'

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function renderVoice(text: string) {
  const bars = Array.from({ length: 20 }, (_, i) => {
    const h = 4 + Math.random() * 16
    return <span key={i} style={{ height: `${h}px` }} />
  })
  return (
    <div className="msg-voice">
      <span style={{ fontSize: 18 }}>▶</span>
      <div className="msg-voice-bar">{bars}</div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{text.replace('🎤 ', '')}</span>
    </div>
  )
}

function renderText(text: string) {
  // Handle code blocks
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/^```(\w*)\n?([\s\S]*?)```$/)
      if (match) {
        return (
          <div key={i} className="msg-code-block">
            {match[1] && <div className="msg-code-lang">{match[1]}</div>}
            <code>{match[2].trim()}</code>
          </div>
        )
      }
    }
    // Inline markdown: bold, italic, inline code
    const html = part
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
    return <span key={i} className="msg-text" dangerouslySetInnerHTML={{ __html: html }} />
  })
}

export default function MessageBubble({ msg }: { msg: Message }) {
  return (
    <div className={`msg-row ${msg.sender}`}>
      <div className="msg-bubble">
        {msg.sender === 'other' && msg.senderName && (
          <div className="msg-sender">{msg.senderName}</div>
        )}
        {msg.type === 'voice' ? renderVoice(msg.text) : renderText(msg.text)}
        <div className="msg-time">{formatTime(msg.timestamp)}</div>
      </div>
    </div>
  )
}
