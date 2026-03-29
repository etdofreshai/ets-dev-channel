import { useState, useRef, useEffect } from 'react'
import { Conversation } from '../data/mockData'

interface Props {
  conversation: Conversation
  open: boolean
  onClose: () => void
  onUpdate: (id: string, fields: Partial<Conversation>) => void
}

export default function ConversationInfoPanel({ conversation, open, onClose, onUpdate }: Props) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingEmoji, setEditingEmoji] = useState(false)
  const [title, setTitle] = useState(conversation.name)
  const [emoji, setEmoji] = useState(conversation.avatar)
  const [description, setDescription] = useState(conversation.description ?? '')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTitle(conversation.name)
    setEmoji(conversation.avatar)
    setDescription(conversation.description ?? '')
  }, [conversation.id, conversation.name, conversation.avatar, conversation.description])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid catching the click that opened the panel
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
    }
  }, [open, onClose])

  const saveTitle = () => {
    setEditingTitle(false)
    if (title.trim() && title !== conversation.name) {
      onUpdate(conversation.id, { name: title.trim() })
    }
  }

  const saveEmoji = () => {
    setEditingEmoji(false)
    if (emoji.trim() && emoji !== conversation.avatar) {
      onUpdate(conversation.id, { avatar: emoji.trim() })
    }
  }

  const saveDescription = () => {
    if (description !== (conversation.description ?? '')) {
      onUpdate(conversation.id, { description })
    }
  }

  return (
    <div className={`info-panel-overlay ${open ? 'open' : ''}`}>
      <div className={`info-panel ${open ? 'open' : ''}`} ref={panelRef}>
        <div className="info-panel-header">
          <h3>Conversation Info</h3>
          <button className="info-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="info-panel-body">
          <div className="info-panel-emoji-section">
            {editingEmoji ? (
              <input
                className="info-panel-emoji-input"
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                onBlur={saveEmoji}
                onKeyDown={e => e.key === 'Enter' && saveEmoji()}
                autoFocus
                maxLength={4}
              />
            ) : (
              <div className="info-panel-emoji" onClick={() => setEditingEmoji(true)} title="Click to change icon">
                {conversation.avatar}
              </div>
            )}
          </div>

          <div className="info-panel-field">
            <label>Name</label>
            {editingTitle ? (
              <input
                className="info-panel-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => e.key === 'Enter' && saveTitle()}
                autoFocus
              />
            ) : (
              <div className="info-panel-value" onClick={() => setEditingTitle(true)} title="Click to edit">
                {conversation.name}
              </div>
            )}
          </div>

          <div className="info-panel-field">
            <label>Description</label>
            <textarea
              className="info-panel-textarea"
              placeholder="Add a description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={saveDescription}
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
