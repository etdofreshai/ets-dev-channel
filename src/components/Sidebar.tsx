import { useState, useEffect } from 'react'
import { Conversation, Section } from '../data/mockData'

type ViewMode = 'regular' | 'compact'

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
  sections: Section[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewConversation: (sectionId: string) => void
  search: string
  onSearch: (q: string) => void
  hidden: boolean
}

export default function Sidebar({ conversations, sections, activeId, onSelect, onNewConversation, search, onSearch, hidden }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('sidebar-view') as ViewMode) || 'regular'
  })
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sidebar-collapsed') || '[]')
      return new Set(saved)
    } catch { return new Set() }
  })

  useEffect(() => {
    localStorage.setItem('sidebar-view', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify([...collapsedSections]))
  }, [collapsedSections])

  const toggleView = () => setViewMode(v => v === 'regular' ? 'compact' : 'regular')

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // Sort sections: workspace first, then alphabetical
  const sortedSections = [...sections].sort((a, b) => {
    if (a.id === 'workspace') return -1
    if (b.id === 'workspace') return 1
    return a.name.localeCompare(b.name)
  })

  const isCompact = viewMode === 'compact'

  return (
    <div className={`sidebar ${hidden ? 'hidden' : ''}`}>
      <div className="sidebar-header">
        <input
          className="search"
          placeholder="Search conversations..."
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
        <button
          className="view-toggle-btn"
          title={isCompact ? 'Regular view' : 'Compact view'}
          onClick={toggleView}
        >
          {isCompact ? '☰' : '≡'}
        </button>
      </div>
      <div className="conversation-list">
        {sortedSections.map(section => {
          const sectionConvs = filtered.filter(c => c.sectionId === section.id)
          if (sectionConvs.length === 0 && search) return null
          const collapsed = collapsedSections.has(section.id)

          return (
            <div key={section.id} className="sidebar-section">
              <div className="section-header" onClick={() => toggleSection(section.id)}>
                <div className="section-header-left">
                  <span className={`section-chevron ${collapsed ? 'collapsed' : ''}`}>▼</span>
                  <div className="section-title-group">
                    <span className="section-name">{section.name}</span>
                    {!isCompact && <span className="section-dir">{section.directory}</span>}
                  </div>
                </div>
                <button
                  className="section-add-btn"
                  title={`New conversation in ${section.name}`}
                  onClick={e => { e.stopPropagation(); onNewConversation(section.id) }}
                >+</button>
              </div>
              {!collapsed && sectionConvs.map(c => (
                <div
                  key={c.id}
                  className={`conv-item ${c.id === activeId ? 'active' : ''} ${isCompact ? 'compact' : ''}`}
                  onClick={() => onSelect(c.id)}
                >
                  <div className="conv-avatar">{c.avatar}</div>
                  {isCompact ? (
                    <div className="conv-info compact-info">
                      <span className="conv-name">{c.name}</span>
                      <span className="conv-time">{formatTime(c.lastTimestamp)}</span>
                    </div>
                  ) : (
                    <div className="conv-info">
                      <div className="conv-top">
                        <span className="conv-name">{c.name}</span>
                        <span className="conv-time">{formatTime(c.lastTimestamp)}</span>
                      </div>
                      <div className="conv-preview">{c.lastMessage}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
