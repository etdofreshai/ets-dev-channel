export interface Message {
  id: string
  text: string
  sender: 'me' | 'other'
  timestamp: number
  type: 'text' | 'code' | 'voice' | 'file'
  senderName?: string
  language?: string
}

export interface Conversation {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastTimestamp: number
  online?: boolean
  typing?: boolean
  messages: Message[]
}

const now = Date.now()
const h = (hours: number) => now - hours * 3600000
const m = (mins: number) => now - mins * 60000

export const conversations: Conversation[] = [
  {
    id: '1',
    name: 'OpenClaw Dev',
    avatar: '🐙',
    lastMessage: 'Deployed v2.4.1 — check staging',
    lastTimestamp: m(3),
    online: true,
    messages: [
      { id: '1a', text: 'Hey, the new plugin system is looking solid', sender: 'other', timestamp: h(2), type: 'text', senderName: 'Archie' },
      { id: '1b', text: 'Thanks! I refactored the loader to support lazy imports', sender: 'me', timestamp: h(1.5), type: 'text' },
      { id: '1c', text: '```typescript\n// Plugin loader with lazy imports\nasync function loadPlugin(name: string) {\n  const mod = await import(`./plugins/${name}/index.ts`);\n  return mod.default satisfies Plugin;\n}\n```', sender: 'me', timestamp: h(1.4), type: 'code', language: 'typescript' },
      { id: '1d', text: 'Clean. Does it handle circular deps?', sender: 'other', timestamp: h(1), type: 'text', senderName: 'Archie' },
      { id: '1e', text: 'Yeah, there\'s a dependency graph resolver that runs first. Throws if it finds cycles.', sender: 'me', timestamp: m(45), type: 'text' },
      { id: '1f', text: 'Deployed v2.4.1 — check staging', sender: 'other', timestamp: m(3), type: 'text', senderName: 'Archie' },
    ],
  },
  {
    id: '2',
    name: 'Dokploy Infra',
    avatar: '🚀',
    lastMessage: '🎤 Voice message (0:42)',
    lastTimestamp: m(28),
    messages: [
      { id: '2a', text: 'The SSL certs are auto-renewing now via Let\'s Encrypt', sender: 'other', timestamp: h(5), type: 'text', senderName: 'DevOps Bot' },
      { id: '2b', text: '```bash\n# Check cert status\ncertbot certificates\n\n# Force renewal\ncertbot renew --force-renewal\n```', sender: 'other', timestamp: h(4.5), type: 'code', language: 'bash', senderName: 'DevOps Bot' },
      { id: '2c', text: 'Perfect. What about the Redis cluster?', sender: 'me', timestamp: h(3), type: 'text' },
      { id: '2d', text: 'Running 3 nodes, replication factor 2. Failover tested.', sender: 'other', timestamp: h(2.5), type: 'text', senderName: 'DevOps Bot' },
      { id: '2e', text: '🎤 Voice message (0:42)', sender: 'me', timestamp: m(28), type: 'voice' },
    ],
  },
  {
    id: '3',
    name: 'ET\'s Notes',
    avatar: '📝',
    lastMessage: 'TODO: Add WebSocket support',
    lastTimestamp: h(6),
    messages: [
      { id: '3a', text: '**Project priorities this week:**\n\n1. Finish chat UI clone\n2. Add WebSocket layer\n3. Deploy to Dokploy\n4. Write API docs', sender: 'me', timestamp: h(12), type: 'text' },
      { id: '3b', text: '```json\n{\n  "api_version": "v1",\n  "endpoints": [\n    "/ws/connect",\n    "/api/messages",\n    "/api/conversations"\n  ]\n}\n```', sender: 'me', timestamp: h(10), type: 'code', language: 'json' },
      { id: '3c', text: 'TODO: Add WebSocket support', sender: 'me', timestamp: h(6), type: 'text' },
    ],
  },
  {
    id: '4',
    name: 'GitHub Actions',
    avatar: '⚡',
    lastMessage: '✅ Build passed — main@abc1234',
    lastTimestamp: h(1),
    online: true,
    messages: [
      { id: '4a', text: '❌ Build failed — main@def5678\n\nError: Type \'string\' is not assignable to type \'number\'', sender: 'other', timestamp: h(8), type: 'text', senderName: 'CI Bot' },
      { id: '4b', text: 'Fixed the type mismatch in the message handler', sender: 'me', timestamp: h(4), type: 'text' },
      { id: '4c', text: '```diff\n- const count: number = getMessage();\n+ const count: number = getMessageCount();\n```', sender: 'me', timestamp: h(3.5), type: 'code', language: 'diff' },
      { id: '4d', text: '✅ Build passed — main@abc1234', sender: 'other', timestamp: h(1), type: 'text', senderName: 'CI Bot' },
    ],
  },
]
