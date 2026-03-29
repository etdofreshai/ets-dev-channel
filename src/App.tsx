import { useState, useEffect, useCallback, useMemo } from 'react'
import { Conversation, Section } from './data/mockData'
import { DataProvider } from './providers/DataProvider'
import { LiveProvider } from './providers/LiveProvider'
import { MockProvider } from './providers/MockProvider'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import SetupWizard from './components/SetupWizard'

export default function App() {
  const provider = useMemo<DataProvider>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('data') === 'mock' ? new MockProvider() : new LiveProvider()
  }, [])

  const isMock = provider instanceof MockProvider

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
        if (!isMock) {
          const settings = await provider.getSettings()
          setSetupComplete(settings.setupComplete)
        }
        await reload()
      } catch (err: any) {
        if (!isMock) {
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

  return (
    <div className="app">
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
