import { useState } from 'react'
import { conversations as initialConversations, Conversation, Message } from './data/mockData'
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

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
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
