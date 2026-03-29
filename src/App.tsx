import { useState } from 'react'
import { conversations as initialConversations, sections as initialSections, Conversation, Section, Message } from './data/mockData'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [sectionsList, setSectionsList] = useState<Section[]>(initialSections)
  const [activeId, setActiveId] = useState<string | null>(initialConversations[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [sidebarHidden, setSidebarHidden] = useState(false)

  const activeConv = conversations.find(c => c.id === activeId) ?? null

  const handleSelect = (id: string) => {
    setActiveId(id)
    setSidebarHidden(true)
  }

  const handleSend = (convId: string, text: string) => {
    const newMsg: Message = {
      id: `${convId}-${Date.now()}`,
      text,
      sender: 'me',
      timestamp: Date.now(),
      type: text.includes('```') ? 'code' : 'text',
    }
    setConversations(prev =>
      prev.map(c =>
        c.id === convId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: text.slice(0, 50), lastTimestamp: Date.now() }
          : c
      )
    )
  }

  const handleNewConversation = (sectionId: string) => {
    const id = `new-${Date.now()}`
    const newConv: Conversation = {
      id,
      name: 'New Conversation',
      avatar: '💬',
      lastMessage: '',
      lastTimestamp: Date.now(),
      sectionId,
      messages: [],
      archived: false,
    }
    setConversations(prev => [newConv, ...prev])
    setActiveId(id)
  }

  const handleArchive = (id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, archived: true } : c))
    if (activeId === id) setActiveId(null)
  }

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const handleAddSection = (name: string, directory: string) => {
    const id = `section-${Date.now()}`
    setSectionsList(prev => [...prev, { id, name, directory, order: prev.length }])
  }

  const handleUpdateConversation = (id: string, fields: Partial<Conversation>) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c))
  }

  const handleDeleteSection = (id: string) => {
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
        conversation={activeConv}
        onSend={handleSend}
        onBack={() => setSidebarHidden(false)}
        onUpdateConversation={handleUpdateConversation}
      />
    </div>
  )
}
