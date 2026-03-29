import { Conversation } from '../data/mockData'

function formatTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

interface Props {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  search: string
  onSearch: (q: string) => void
  hidden: boolean
}

export default function Sidebar({ conversations, activeId, onSelect, search, onSearch, hidden }: Props) {
  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`sidebar ${hidden ? 'hidden' : ''}`}>
      <div className="sidebar-header">
        <input
          className="search"
          placeholder="Search conversations..."
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
        <button className="new-btn" title="New session">+</button>
      </div>
      <div className="conversation-list">
        {filtered.map(c => (
          <div
            key={c.id}
            className={`conv-item ${c.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(c.id)}
          >
            <div className="conv-avatar">{c.avatar}</div>
            <div className="conv-info">
              <div className="conv-top">
                <span className="conv-name">{c.name}</span>
                <span className="conv-time">{formatTime(c.lastTimestamp)}</span>
              </div>
              <div className="conv-preview">{c.lastMessage}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
