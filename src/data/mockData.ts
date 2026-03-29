export interface Message {
  id: string
  text: string
  sender: 'me' | 'other'
  timestamp: number
  type: 'text' | 'code' | 'voice' | 'file'
  senderName?: string
  language?: string
}

export interface Section {
  id: string
  name: string
  directory: string
  collapsed?: boolean
  order?: number
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
  sectionId: string
  archived?: boolean
  description?: string
  parentId?: string
}

const now = Date.now()
const h = (hours: number) => now - hours * 3600000
const m = (mins: number) => now - mins * 60000

export const sections: Section[] = [
  { id: 'workspace', name: 'Workspace', directory: '/workspace', order: 0 },
  { id: 'personal', name: 'Personal', directory: '/personal', order: 1 },
  { id: 'cicd', name: 'CI/CD', directory: '/ci', order: 2 },
]

export const conversations: Conversation[] = [
  {
    id: '1',
    name: 'OpenClaw Dev',
    avatar: '🐙',
    lastMessage: 'Deployed v2.4.1 — check staging',
    lastTimestamp: m(3),
    online: true,
    sectionId: 'workspace',
    archived: false,
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
    id: '1-sub-1',
    name: '🔧 Fix Monarch Zod',
    avatar: '🔧',
    lastMessage: 'Patched Zod schema — types now validate correctly',
    lastTimestamp: m(12),
    sectionId: 'workspace',
    archived: false,
    parentId: '1',
    messages: [
      { id: 's1a', text: 'Starting sub-agent: fix Monarch Zod validation errors in plugin loader', sender: 'other', timestamp: m(30), type: 'text', senderName: 'Archie' },
      { id: 's1b', text: '```typescript\n// Fixed schema\nconst MonarchSchema = z.object({\n  name: z.string(),\n  version: z.string().regex(/^\\d+\\.\\d+\\.\\d+$/),\n  rules: z.array(TokenRuleSchema),\n});\n```', sender: 'other', timestamp: m(20), type: 'code', language: 'typescript', senderName: 'Archie' },
      { id: 's1c', text: 'Patched Zod schema — types now validate correctly', sender: 'other', timestamp: m(12), type: 'text', senderName: 'Archie' },
    ],
  },
  {
    id: '1-sub-2',
    name: '📊 Deep Analysis Report',
    avatar: '📊',
    lastMessage: 'Report generated — 14 findings, 2 critical',
    lastTimestamp: m(45),
    sectionId: 'workspace',
    archived: false,
    parentId: '1',
    messages: [
      { id: 's2a', text: 'Running deep analysis on plugin dependency graph...', sender: 'other', timestamp: h(1.5), type: 'text', senderName: 'Archie' },
      { id: 's2b', text: 'Report generated — 14 findings, 2 critical', sender: 'other', timestamp: m(45), type: 'text', senderName: 'Archie' },
    ],
  },
  {
    id: '1-sub-3',
    name: '🐙 Ingestor Sync Fix',
    avatar: '🐙',
    lastMessage: 'Sync loop patched — no more duplicate events',
    lastTimestamp: h(2),
    sectionId: 'workspace',
    archived: false,
    parentId: '1',
    messages: [
      { id: 's3a', text: 'Investigating duplicate event ingestion on webhook handler', sender: 'other', timestamp: h(3), type: 'text', senderName: 'Archie' },
      { id: 's3b', text: '```diff\n- await ingest(event);\n+ if (!seen.has(event.id)) {\n+   seen.add(event.id);\n+   await ingest(event);\n+ }\n```', sender: 'other', timestamp: h(2.5), type: 'code', language: 'diff', senderName: 'Archie' },
      { id: 's3c', text: 'Sync loop patched — no more duplicate events', sender: 'other', timestamp: h(2), type: 'text', senderName: 'Archie' },
    ],
  },
  {
    id: '2',
    name: 'Dokploy Infra',
    avatar: '🚀',
    lastMessage: '🎤 Voice message (0:42)',
    lastTimestamp: m(28),
    sectionId: 'workspace',
    archived: false,
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
    sectionId: 'personal',
    archived: false,
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
    sectionId: 'cicd',
    archived: false,
    messages: [
      { id: '4a', text: '❌ Build failed — main@def5678\n\nError: Type \'string\' is not assignable to type \'number\'', sender: 'other', timestamp: h(8), type: 'text', senderName: 'CI Bot' },
      { id: '4b', text: 'Fixed the type mismatch in the message handler', sender: 'me', timestamp: h(4), type: 'text' },
      { id: '4c', text: '```diff\n- const count: number = getMessage();\n+ const count: number = getMessageCount();\n```', sender: 'me', timestamp: h(3.5), type: 'code', language: 'diff' },
      { id: '4d', text: '✅ Build passed — main@abc1234', sender: 'other', timestamp: h(1), type: 'text', senderName: 'CI Bot' },
    ],
  },
]
