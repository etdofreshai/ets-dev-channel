import { useState } from 'react'
import { conversations as initialConversations, sections, Conversation, Message } from './data/mockData'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
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
    }
    setConversations(prev => [newConv, ...prev])
    setActiveId(id)
  }

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        sections={sections}
        activeId={activeId}
        onSelect={handleSelect}
        onNewConversation={handleNewConversation}
        search={search}
        onSearch={setSearch}
        hidden={sidebarHidden}
      />
      <ChatArea
        conversation={activeConv}
        onSend={handleSend}
        onBack={() => setSidebarHidden(false)}
      />
    </div>
  )
}
