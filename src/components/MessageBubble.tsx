import { Message } from '../data/mockData'

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function renderVoice(msg: Message) {
  const fileUrl = msg.fileUrl
  if (fileUrl) {
    return (
      <div className="msg-voice">
        <audio controls preload="metadata" style={{ maxWidth: '100%', height: 36 }}>
          <source src={fileUrl} type={msg.mimeType || 'audio/webm'} />
        </audio>
        {msg.text && <div className="msg-voice-caption">{msg.text}</div>}
      </div>
    )
  }
  // Legacy voice messages (no file)
  const bars = Array.from({ length: 20 }, (_, i) => {
    const h = 4 + Math.random() * 16
    return <span key={i} style={{ height: `${h}px` }} />
  })
  return (
    <div className="msg-voice">
      <span style={{ fontSize: 18 }}>▶</span>
      <div className="msg-voice-bar">{bars}</div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{msg.text.replace('🎤 ', '')}</span>
    </div>
  )
}

function renderImage(msg: Message) {
  return (
    <div className="msg-image">
      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
        <img src={msg.fileUrl} alt={msg.fileName || 'image'} style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }} />
      </a>
      {msg.text && <div className="msg-caption">{msg.text}</div>}
    </div>
  )
}

function renderFile(msg: Message) {
  return (
    <div className="msg-file">
      <a href={msg.fileUrl} download={msg.fileName} className="msg-file-link">
        <span className="msg-file-icon">📄</span>
        <span className="msg-file-name">{msg.fileName || 'file'}</span>
      </a>
      {msg.text && <div className="msg-caption">{msg.text}</div>}
    </div>
  )
}

function renderText(text: string) {
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
    const html = part
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
    return <span key={i} className="msg-text" dangerouslySetInnerHTML={{ __html: html }} />
  })
}

function renderContent(msg: Message) {
  switch (msg.type) {
    case 'voice': return renderVoice(msg)
    case 'image': return renderImage(msg)
    case 'file': return renderFile(msg)
    default: return renderText(msg.text)
  }
}

export default function MessageBubble({ msg }: { msg: Message }) {
  return (
    <div className={`msg-row ${msg.sender}`}>
      <div className="msg-bubble">
        {msg.sender === 'other' && msg.senderName && (
          <div className="msg-sender">{msg.senderName}</div>
        )}
        {renderContent(msg)}
        <div className="msg-time">{formatTime(msg.timestamp)}</div>
      </div>
    </div>
  )
}
