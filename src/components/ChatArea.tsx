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

type RecordingState = 'idle' | 'holding' | 'locked'

const LOCK_THRESHOLD = 80
const CANCEL_THRESHOLD = 100

export default function ChatArea({ conversation, onSend, onUpload, onBack, onUpdateConversation }: Props) {
  const [input, setInput] = useState('')
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [slideX, setSlideX] = useState(0)
  const [slideY, setSlideY] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const messagesRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startPosRef = useRef({ x: 0, y: 0 })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordingStateRef = useRef<RecordingState>('idle')
  const cancelledRef = useRef(false)

  // Keep ref in sync with state
  useEffect(() => { recordingStateRef.current = recordingState }, [recordingState])

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [conversation?.messages.length])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const cleanupRecording = useCallback((discard: boolean) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      if (discard) {
        cancelledRef.current = true
        recorder.stop()
      } else {
        cancelledRef.current = false
        recorder.stop()
      }
    }
    setRecordingState('idle')
    setRecordingDuration(0)
    setSlideX(0)
    setSlideY(0)
    setIsPaused(false)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      cancelledRef.current = false

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        if (!cancelledRef.current && chunksRef.current.length > 0 && onUpload && conversation) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          if (blob.size > 0) {
            const file = new File([blob], 'voice.webm', { type: 'audio/webm' })
            onUpload(conversation.id, file)
          }
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setRecordingDuration(0)
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1)
      }, 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
      setRecordingState('idle')
    }
  }, [conversation, onUpload])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (recordingStateRef.current !== 'idle') return
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    startPosRef.current = { x: e.clientX, y: e.clientY }
    setSlideX(0)
    setSlideY(0)
    setRecordingState('holding')
    startRecording()
  }, [startRecording])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (recordingStateRef.current !== 'holding') return
    const dx = e.clientX - startPosRef.current.x
    const dy = e.clientY - startPosRef.current.y
    setSlideX(dx)
    setSlideY(dy)

    // Lock detection
    if (dy < -LOCK_THRESHOLD) {
      setRecordingState('locked')
      setSlideX(0)
      setSlideY(0)
    }
    // Cancel detection
    if (dx < -CANCEL_THRESHOLD) {
      cleanupRecording(true)
    }
  }, [cleanupRecording])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (recordingStateRef.current === 'holding') {
      // Release while holding = send
      cleanupRecording(false)
    }
    // If locked, do nothing on release — user uses buttons
  }, [cleanupRecording])

  const handleLockedSend = useCallback(() => {
    cleanupRecording(false)
  }, [cleanupRecording])

  const handleLockedCancel = useCallback(() => {
    cleanupRecording(true)
  }, [cleanupRecording])

  const handleLockedPause = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    if (isPaused) {
      recorder.resume()
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000)
      setIsPaused(false)
    } else {
      recorder.pause()
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setIsPaused(true)
    }
  }, [isPaused])

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

  const isInCancelZone = slideX < -CANCEL_THRESHOLD * 0.6
  const lockProgress = Math.min(1, Math.abs(Math.min(0, slideY)) / LOCK_THRESHOLD)

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
      ) : recordingState === 'locked' ? (
        /* ── Locked recording UI ── */
        <div className="input-area voice-locked-area">
          <button className="input-btn voice-locked-btn" title={isPaused ? 'Resume' : 'Pause'} onClick={handleLockedPause}>
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <div className="voice-locked-info">
            <span className="voice-rec-dot" style={{ animationPlayState: isPaused ? 'paused' : 'running' }} />
            <span className="voice-rec-timer">{formatTime(recordingDuration)}</span>
          </div>
          <button className="input-btn voice-locked-btn voice-cancel-btn" title="Cancel" onClick={handleLockedCancel}>
            🗑️
          </button>
          <button className="send-btn" title="Send" onClick={handleLockedSend}>➤</button>
        </div>
      ) : recordingState === 'holding' ? (
        /* ── Holding recording UI ── */
        <div className="input-area voice-holding-area" style={{ background: isInCancelZone ? '#3a1020' : undefined }}>
          {/* Lock indicator above mic */}
          <div
            className="voice-lock-indicator"
            style={{ opacity: lockProgress > 0.1 ? 1 : 0, transform: `scale(${0.6 + lockProgress * 0.4})` }}
          >
            🔒
          </div>
          <div className="voice-holding-content" style={{ transform: `translateX(${Math.min(0, slideX)}px)` }}>
            <span className="voice-rec-dot" />
            <span className="voice-rec-timer">{formatTime(recordingDuration)}</span>
            <span className="voice-slide-cancel">
              ‹‹ Slide to cancel
            </span>
          </div>
          <div
            className="voice-mic-btn-area"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <button className="input-btn recording-active">🎤</button>
          </div>
        </div>
      ) : (
        /* ── Normal input area ── */
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
          <button
            className="input-btn"
            title="Hold to record voice"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >🎤</button>
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
