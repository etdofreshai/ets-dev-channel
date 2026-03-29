import { useState, useEffect, useRef } from 'react'
import { Conversation, Section } from '../data/mockData'

type ViewMode = 'regular' | 'compact'
type ViewFilter = 'active' | 'archived' | 'all'

const filterLabels: Record<ViewFilter, string> = {
  active: '💬',
  archived: '📦',
  all: '👁',
}
const filterCycle: Record<ViewFilter, ViewFilter> = {
  active: 'archived',
  archived: 'all',
  all: 'active',
}

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
  onArchiveConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onSectionsChange: (sections: Section[]) => void
  onAddSection: (name: string, directory: string) => void
  onDeleteSection: (id: string) => void
  search: string
  onSearch: (q: string) => void
  hidden: boolean
}

export default function Sidebar({
  conversations, sections, activeId, onSelect, onNewConversation,
  onArchiveConversation, onDeleteConversation, onSectionsChange, onAddSection, onDeleteSection,
  search, onSearch, hidden
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    (localStorage.getItem('sidebar-view') as ViewMode) || 'regular'
  )
  const [viewFilter, setViewFilter] = useState<ViewFilter>('active')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('sidebar-collapsed') || '[]'))
    } catch { return new Set() }
  })
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [renamingSection, setRenamingSection] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showAddWorkspace, setShowAddWorkspace] = useState(false)
  const [newWsName, setNewWsName] = useState('')
  const [newWsDir, setNewWsDir] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteConvConfirm, setDeleteConvConfirm] = useState<string | null>(null)
  const [deleteArchivedConfirm, setDeleteArchivedConfirm] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { localStorage.setItem('sidebar-view', viewMode) }, [viewMode])
  useEffect(() => { localStorage.setItem('sidebar-collapsed', JSON.stringify([...collapsedSections])) }, [collapsedSections])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
        setDeleteConfirm(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (renamingSection && renameRef.current) renameRef.current.focus()
  }, [renamingSection])

  const toggleView = () => setViewMode(v => v === 'regular' ? 'compact' : 'regular')
  const toggleSection = (id: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = conversations.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    if (viewFilter === 'active') return !c.archived && matchesSearch
    if (viewFilter === 'archived') return c.archived && matchesSearch
    return matchesSearch // 'all'
  })

  const sortedSections = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const isCompact = viewMode === 'compact'

  const moveSection = (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const ordered = [...sortedSections]
    const idx = ordered.findIndex(s => s.id === id)
    if (idx === -1) return
    const newOrder = [...ordered]
    const [item] = newOrder.splice(idx, 1)
    if (direction === 'up' && idx > 0) newOrder.splice(idx - 1, 0, item)
    else if (direction === 'down' && idx < ordered.length - 1) newOrder.splice(idx + 1, 0, item)
    else if (direction === 'top') newOrder.unshift(item)
    else if (direction === 'bottom') newOrder.push(item)
    else newOrder.splice(idx, 0, item) // no change
    onSectionsChange(newOrder.map((s, i) => ({ ...s, order: i })))
    setMenuOpen(null)
  }

  const handleRename = (id: string) => {
    if (renameValue.trim()) {
      onSectionsChange(sections.map(s => s.id === id ? { ...s, name: renameValue.trim() } : s))
    }
    setRenamingSection(null)
  }

  const handleAddWorkspace = () => {
    if (newWsName.trim() && newWsDir.trim()) {
      onAddSection(newWsName.trim(), newWsDir.trim())
      setNewWsName('')
      setNewWsDir('')
      setShowAddWorkspace(false)
    }
  }

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
        <button
          className="view-toggle-btn filter-toggle-btn"
          title={`Showing ${viewFilter === 'active' ? 'Active' : viewFilter === 'archived' ? 'Archived' : 'All'}`}
          onClick={() => setViewFilter(f => filterCycle[f])}
        >
          {filterLabels[viewFilter]}
        </button>
      </div>
      <div className="conversation-list">
        {sortedSections.map(section => {
          const sectionConvs = filtered
            .filter(c => c.sectionId === section.id)
            .sort((a, b) => {
              if (a.archived !== b.archived) return a.archived ? 1 : -1
              return b.lastTimestamp - a.lastTimestamp
            })
          if (sectionConvs.length === 0 && search) return null
          const collapsed = collapsedSections.has(section.id)

          return (
            <div key={section.id} className="sidebar-section">
              <div className="section-header" onClick={() => toggleSection(section.id)} title={isCompact ? section.directory : undefined}>
                <div className="section-header-left">
                  <span className={`section-chevron ${collapsed ? 'collapsed' : ''}`}>▼</span>
                  <div className="section-title-group">
                    {renamingSection === section.id ? (
                      <input
                        ref={renameRef}
                        className="section-rename-input"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => handleRename(section.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(section.id); if (e.key === 'Escape') setRenamingSection(null) }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="section-name">{section.name}</span>
                        {!isCompact && <span className="section-dir">{section.directory}</span>}
                      </>
                    )}
                  </div>
                </div>
                <div className="section-header-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="section-add-btn"
                    title={`New conversation in ${section.name}`}
                    onClick={() => onNewConversation(section.id)}
                  >+</button>
                  <div className="section-menu-container" ref={menuOpen === section.id ? menuRef : null}>
                    <button
                      className="section-menu-btn"
                      title="Section options"
                      onClick={() => { setMenuOpen(menuOpen === section.id ? null : section.id); setDeleteConfirm(null) }}
                    >⋮</button>
                    {menuOpen === section.id && (
                      <div className="section-menu-dropdown">
                        <button onClick={() => {
                          setRenamingSection(section.id)
                          setRenameValue(section.name)
                          setMenuOpen(null)
                        }}>Rename</button>
                        <button onClick={() => moveSection(section.id, 'top')}>Move to Top</button>
                        <button onClick={() => moveSection(section.id, 'up')}>Move Up</button>
                        <button onClick={() => moveSection(section.id, 'down')}>Move Down</button>
                        <button onClick={() => moveSection(section.id, 'bottom')}>Move to Bottom</button>
                        <div className="section-menu-divider" />
                        <button className="section-menu-delete" style={{ color: '#e8a040' }} onClick={() => setDeleteArchivedConfirm(section.id)}>Delete All Archived</button>
                        {section.id !== 'workspace' && (
                          <>
                            {deleteConfirm === section.id ? (
                              <div className="section-delete-confirm">
                                <span>Delete section and all conversations?</span>
                                <div className="section-delete-confirm-btns">
                                  <button className="confirm-yes" onClick={() => { onDeleteSection(section.id); setMenuOpen(null); setDeleteConfirm(null) }}>Yes, delete</button>
                                  <button className="confirm-no" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button className="section-menu-delete" onClick={() => setDeleteConfirm(section.id)}>Delete Section</button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`section-content ${collapsed ? 'section-collapsed' : ''}`}>
                {(() => {
                  const topLevel = sectionConvs.filter(c => !c.parentId)
                  const childrenMap = new Map<string, Conversation[]>()
                  sectionConvs.filter(c => c.parentId).forEach(c => {
                    const list = childrenMap.get(c.parentId!) || []
                    list.push(c)
                    childrenMap.set(c.parentId!, list)
                  })
                  // Sort children by timestamp within each group
                  childrenMap.forEach(list => list.sort((a, b) => b.lastTimestamp - a.lastTimestamp))

                  const renderConvItem = (c: Conversation, isSub: boolean, isLastChild?: boolean, hasChildren?: boolean, childrenCollapsed?: boolean, childCount?: number) => (
                    <div
                      key={c.id}
                      className={`conv-item ${c.id === activeId ? 'active' : ''} ${isCompact ? 'compact' : ''} ${c.archived ? 'conv-archived' : ''} ${isSub ? 'conv-sub' : ''}`}
                      onClick={hasChildren ? undefined : () => onSelect(c.id)}
                      title={c.description || undefined}
                      style={{ order: -c.lastTimestamp }}
                    >

                      <div className="conv-avatar">
                        {c.avatar}
                        {hasChildren && childCount && childCount > 0 && (
                          <span className={`conv-child-count ${childrenCollapsed ? 'collapsed' : ''}`}>
                            {childCount}
                          </span>
                        )}
                      </div>
                      {isCompact ? (
                        <div className="conv-info compact-info">
                          <span className="conv-name">{c.name}</span>
                          <div className="conv-actions-row">
                            <span className="conv-time">{formatTime(c.lastTimestamp)}</span>
                            {c.archived ? (
                              <button
                                className="conv-archive-btn conv-delete-btn"
                                title="Delete permanently"
                                onClick={e => { e.stopPropagation(); setDeleteConvConfirm(c.id) }}
                              >✕</button>
                            ) : (
                              <button
                                className="conv-archive-btn"
                                title="Archive"
                                onClick={e => { e.stopPropagation(); onArchiveConversation(c.id) }}
                              >📦</button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="conv-info">
                          <div className="conv-top">
                            <span className="conv-name">{c.name}</span>
                            <div className="conv-actions-row">
                              <span className="conv-time">{formatTime(c.lastTimestamp)}</span>
                              {c.archived ? (
                                <button
                                  className="conv-archive-btn conv-delete-btn"
                                  title="Delete permanently"
                                  onClick={e => { e.stopPropagation(); setDeleteConvConfirm(c.id) }}
                                >✕</button>
                              ) : (
                                <button
                                  className="conv-archive-btn"
                                  title="Archive"
                                  onClick={e => { e.stopPropagation(); onArchiveConversation(c.id) }}
                                >📦</button>
                              )}
                            </div>
                          </div>
                          <div className="conv-preview">{c.lastMessage}</div>
                        </div>
                      )}
                    </div>
                  )

                  return topLevel.map(c => {
                    const children = childrenMap.get(c.id) || []
                    const hasChildren = children.length > 0
                    const parentCollapsed = collapsedParents.has(c.id)
                    return (
                      <div key={c.id} className="conv-group">
                        <div className="conv-parent-row" onClick={hasChildren ? (e) => {
                          e.stopPropagation()
                          if (c.id === activeId) {
                            // Already selected — just toggle children
                            setCollapsedParents(prev => {
                              const next = new Set(prev)
                              next.has(c.id) ? next.delete(c.id) : next.add(c.id)
                              return next
                            })
                          } else {
                            // Select and expand
                            onSelect(c.id)
                            setCollapsedParents(prev => {
                              const next = new Set(prev)
                              next.delete(c.id)
                              return next
                            })
                          }
                        } : undefined}>
                          {renderConvItem(c, false, undefined, hasChildren, parentCollapsed, children.length)}
                        </div>
                        {hasChildren && !parentCollapsed && (
                          <div className="conv-children">
                            {children.map((child, i) => renderConvItem(child, true, i === children.length - 1))}
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )
        })}
      </div>
      <div className="sidebar-footer">
        {showAddWorkspace ? (
          <div className="add-workspace-form">
            <input
              placeholder="Section name"
              value={newWsName}
              onChange={e => setNewWsName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddWorkspace()}
              autoFocus
            />
            <input
              placeholder="Directory path"
              value={newWsDir}
              onChange={e => setNewWsDir(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddWorkspace()}
            />
            <div className="add-workspace-btns">
              <button onClick={handleAddWorkspace}>Add</button>
              <button onClick={() => setShowAddWorkspace(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="add-workspace-btn" onClick={() => setShowAddWorkspace(true)}>
            + Add Workspace
          </button>
        )}
      </div>

      {/* Delete conversation confirmation modal */}
      {deleteConvConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConvConfirm(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <h3>Delete Conversation</h3>
            <p>Are you sure you want to permanently delete this conversation?</p>
            <div className="modal-btns">
              <button className="confirm-yes" onClick={() => { onDeleteConversation(deleteConvConfirm); setDeleteConvConfirm(null) }}>Yes, delete</button>
              <button className="confirm-no" onClick={() => setDeleteConvConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete all archived confirmation modal */}
      {deleteArchivedConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteArchivedConfirm(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <h3>Delete All Archived</h3>
            <p>This will permanently delete all archived conversations in this section. Are you sure?</p>
            <div className="modal-btns">
              <button className="confirm-yes" onClick={() => {
                const sectionConvs = conversations.filter(c => c.sectionId === deleteArchivedConfirm && c.archived)
                sectionConvs.forEach(c => onDeleteConversation(c.id))
                setDeleteArchivedConfirm(null)
                setMenuOpen(null)
              }}>Yes, delete all</button>
              <button className="confirm-no" onClick={() => setDeleteArchivedConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
