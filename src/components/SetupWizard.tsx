import { useState } from 'react'
import { DataProvider } from '../providers/DataProvider'

interface Props {
  provider: DataProvider
  onComplete: () => void
}

const PROVIDERS = [
  { id: 'openclaw', label: '🐙 OpenClaw', desc: 'Your main AI assistant' },
  { id: 'claude-code', label: '💻 Claude Code', desc: 'Coding assistant' },
  { id: 'etclaw', label: '🦞 ETClaw', desc: 'Desktop instance' },
]

export default function SetupWizard({ provider, onComplete }: Props) {
  const [workspaceDir, setWorkspaceDir] = useState('/app/data/workspace')
  const [selectedProvider, setSelectedProvider] = useState('openclaw')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!workspaceDir.trim()) return
    setSaving(true)
    await provider.updateSettings({ workspaceDir: workspaceDir.trim(), setupComplete: true })
    await provider.createSection('Workspace', workspaceDir.trim(), selectedProvider)
    onComplete()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a2e', color: '#e0e0e0', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#16213e', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)', textAlign: 'center',
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>🚀 ET's Dev Channel</h1>
        <p style={{ margin: '0 0 32px', opacity: 0.7 }}>Set up your workspace to get started</p>

        <label style={{ display: 'block', textAlign: 'left', marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
          Provider
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 8, border: '2px solid',
                borderColor: selectedProvider === p.id ? '#e94560' : '#333',
                background: selectedProvider === p.id ? 'rgba(233,69,96,0.15)' : '#0f3460',
                color: '#e0e0e0', cursor: 'pointer', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18 }}>{p.label}</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{p.desc}</div>
            </button>
          ))}
        </div>

        <label style={{ display: 'block', textAlign: 'left', marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
          Workspace Directory
        </label>
        <input
          type="text"
          value={workspaceDir}
          onChange={e => setWorkspaceDir(e.target.value)}
          placeholder="/app/data/workspace"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #333',
            background: '#0f3460', color: '#e0e0e0', fontSize: 16, outline: 'none',
            boxSizing: 'border-box', marginBottom: 24,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!workspaceDir.trim() || saving}
          style={{
            width: '100%', padding: '14px', borderRadius: 8, border: 'none',
            background: workspaceDir.trim() ? '#e94560' : '#555', color: '#fff',
            fontSize: 16, fontWeight: 600, cursor: workspaceDir.trim() ? 'pointer' : 'default',
          }}
        >
          {saving ? 'Saving...' : 'Get Started'}
        </button>
      </div>
    </div>
  )
}
