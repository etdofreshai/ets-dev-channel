import { useState, useRef, useEffect, useCallback } from 'react'
import { Conversation, Message } from '../data/mockData'
import MessageBubble from './MessageBubble'
import ConversationInfoPanel from './ConversationInfoPanel'

interface Props {
  conversation: Conversation | null
  onSend: (convId: string, text: string) => void
  onUpload?: (convId: string, file: File, text?: string) => void
  onBack: () => void
  onUpdateConversation: (id: string, fields: Partial<Conversation>) => void
}

export default function ChatArea({ conversation, onSend, onUpload, onBack, onUpdateConversation }: Props) {
  const [input, setInput] = useState('')
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

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

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !onUpload || !conversation) return
    for (let i = 0; i < files.length; i++) {
      onUpload(conversation.id, files[i])
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [conversation, onUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size > 0 && onUpload && conversation) {
          const file = new File([blob], 'voice.webm', { type: 'audio/webm' })
          onUpload(conversation.id, file)
        }
        setIsRecording(false)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  return (
    <div
      className="chat-area"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {dragOver && (
        <div className="drop-overlay">
          <div className="drop-overlay-content">📎 Drop files to upload</div>
        </div>
      )}
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
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            onChange={e => { handleFileSelect(e.target.files); e.target.value = '' }}
          />
          <button className="input-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}>📎</button>
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
          {isRecording ? (
            <button className="input-btn recording" title="Stop recording" onClick={stopRecording}>⏹️</button>
          ) : (
            <button className="input-btn" title="Voice message" onClick={startRecording}>🎤</button>
          )}
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
