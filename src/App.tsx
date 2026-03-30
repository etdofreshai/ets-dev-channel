import { useState, useEffect, useCallback, useMemo } from 'react'
import { Conversation, Section } from './data/mockData'
import { DataProvider } from './providers/DataProvider'
import { LiveProvider } from './providers/LiveProvider'
import { MockProvider } from './providers/MockProvider'
import { BrowserProvider } from './providers/BrowserProvider'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import SetupWizard from './components/SetupWizard'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const provider = useMemo<DataProvider>(() => {
    const params = new URLSearchParams(window.location.search)
    const mode = params.get('data')
    if (mode === 'mock') return new MockProvider()
    if (mode === 'live') return new LiveProvider()
    return new BrowserProvider()
  }, [])

  const isMock = provider instanceof MockProvider
  const isLive = provider instanceof LiveProvider
  const providerName = isMock ? 'Mock' : isLive ? 'Live' : 'Browser'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [sectionsList, setSectionsList] = useState<Section[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [setupComplete, setSetupComplete] = useState(isMock)
  const [loading, setLoading] = useState(true)
  const [backendError, setBackendError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [convs, secs] = await Promise.all([provider.getConversations(), provider.getSections()])
    setConversations(convs)
    setSectionsList(secs)
    if (!activeId && convs.length) setActiveId(convs[0].id)
  }, [provider, activeId])

  useEffect(() => {
    ;(async () => {
      try {
        if (isMock) {
          setSetupComplete(true)
        } else {
          const settings = await provider.getSettings()
          setSetupComplete(settings.setupComplete)
        }
        await reload()
      } catch (err: any) {
        if (isLive) {
          setBackendError(err?.message || 'Cannot connect to backend')
        }
      }
      setLoading(false)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeConv = conversations.find(c => c.id === activeId) ?? null
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (!activeId) { setMessages([]); return }
    provider.getMessages(activeId).then(setMessages)
    // Poll for new messages every 2 seconds
    const interval = setInterval(() => {
      provider.getMessages(activeId).then(setMessages)
    }, 2000)
    return () => clearInterval(interval)
  }, [activeId, provider])

  const activeConvWithMessages = activeConv ? { ...activeConv, messages } : null

  if (loading) return null
  if (backendError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>🐙</div>
        <h2 style={{ color: '#f1f5f9', margin: 0 }}>Backend Not Running</h2>
        <p style={{ maxWidth: 400, lineHeight: 1.5 }}>
          The Express server isn't reachable. Start it with:<br/>
          <code style={{ background: '#1e293b', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.9rem' }}>npm run dev:full</code>
        </p>
        <p style={{ fontSize: '0.85rem' }}>
          Or use <a href="?data=mock" style={{ color: '#60a5fa' }}>mock mode</a> for the testbed.
        </p>
      </div>
    )
  }
  if (!setupComplete) {
    return <SetupWizard provider={provider} onComplete={() => { setSetupComplete(true); reload() }} />
  }

  const handleSelect = (id: string) => { setActiveId(id); setSidebarHidden(true) }

  const handleSend = async (convId: string, text: string) => {
    const msg = await provider.sendMessage(convId, text)
    setMessages(prev => [...prev, msg])
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, lastMessage: text.slice(0, 50), lastTimestamp: Date.now() } : c
    ))
  }

  const handleNewConversation = async (sectionId: string) => {
    const conv = await provider.createConversation(sectionId, 'New Conversation')
    setConversations(prev => [conv, ...prev])
    setActiveId(conv.id)
  }

  const handleArchive = async (id: string) => {
    await provider.archiveConversation(id)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, archived: true } : c))
    if (activeId === id) setActiveId(null)
  }

  const handleDeleteConversation = async (id: string) => {
    await provider.deleteConversation(id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const handleAddSection = async (name: string, directory: string) => {
    const s = await provider.createSection(name, directory)
    setSectionsList(prev => [...prev, s])
  }

  const handleUpdateConversation = async (id: string, fields: Partial<Conversation>) => {
    await provider.updateConversation(id, fields)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c))
  }

  const handleDeleteSection = async (id: string) => {
    await provider.deleteSection(id)
    setSectionsList(prev => prev.filter(s => s.id !== id))
    setConversations(prev => prev.filter(c => c.sectionId !== id))
  }

  const settingsModal = showSettings && (
    <div className="modal-overlay" onClick={() => { setShowSettings(false); setShowResetConfirm(false) }}>
      <div className="modal-dialog settings-modal" onClick={e => e.stopPropagation()}>
        <button className="settings-modal-close" onClick={() => { setShowSettings(false); setShowResetConfirm(false) }}>✕</button>
        <h3>Settings</h3>
        <div className="settings-row"><span className="settings-label">Provider</span><span className="settings-value">{providerName}</span></div>
        <div className="settings-row"><span className="settings-label">Workspace</span><span className="settings-value">{window.location.origin}{window.location.pathname}</span></div>
        <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '1rem 0' }} />
        {!showResetConfirm ? (
          <button className="settings-reset-btn" onClick={() => setShowResetConfirm(true)}>Reset All Data</button>
        ) : (
          <div>
            <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '0.75rem' }}>This will delete all conversations, messages, and sections. Are you sure?</p>
            <div className="modal-btns">
              <button className="confirm-yes" onClick={() => { localStorage.removeItem('ets-dev-channel-db'); window.location.reload() }}>Yes, Reset</button>
              <button className="confirm-no" onClick={() => setShowResetConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="app">
      <button className="settings-gear" onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
      {settingsModal}
      <Sidebar
        conversations={conversations}
        sections={sectionsList}
        activeId={activeId}
        onSelect={handleSelect}
        onNewConversation={handleNewConversation}
        onArchiveConversation={handleArchive}
        onDeleteConversation={handleDeleteConversation}
        onSectionsChange={setSectionsList}
        onAddSection={handleAddSection}
        onDeleteSection={handleDeleteSection}
        search={search}
        onSearch={setSearch}
        hidden={sidebarHidden}
      />
      <ChatArea
        conversation={activeConvWithMessages}
        onSend={handleSend}
        onBack={() => setSidebarHidden(false)}
        onUpdateConversation={handleUpdateConversation}
      />
    </div>
  )
}
