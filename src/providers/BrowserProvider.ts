import initSqlJs, { Database } from 'sql.js'
import { Conversation, Message, Section } from '../data/mockData'
import { DataProvider, AppSettings } from './DataProvider'

const SQL_WASM_URL = 'https://sql.js.org/dist/sql-wasm.wasm'
const STORAGE_KEY = 'ets-dev-channel-db'

export class BrowserProvider implements DataProvider {
  private db: Database | null = null
  private initPromise: Promise<Database> | null = null

  private getDb(): Promise<Database> {
    if (this.db) return Promise.resolve(this.db)
    if (!this.initPromise) this.initPromise = this.init()
    return this.initPromise
  }

  private async init(): Promise<Database> {
    const SQL = await initSqlJs({ locateFile: () => SQL_WASM_URL })
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const buf = Uint8Array.from(atob(saved), c => c.charCodeAt(0))
      this.db = new SQL.Database(buf)
    } else {
      this.db = new SQL.Database()
    }
    this.db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`)
    this.db.run(`CREATE TABLE IF NOT EXISTS sections (id TEXT PRIMARY KEY, name TEXT, directory TEXT, "order" INTEGER)`)
    this.db.run(`CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, name TEXT, avatar TEXT, description TEXT, sectionId TEXT, parentId TEXT, archived INTEGER DEFAULT 0, createdAt INTEGER, updatedAt INTEGER)`)
    this.db.run(`CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, conversationId TEXT, text TEXT, sender TEXT, timestamp INTEGER, type TEXT DEFAULT 'text')`)
    this.save()
    return this.db
  }

  private save() {
    if (!this.db) return
    const data = this.db.export()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)))
    localStorage.setItem(STORAGE_KEY, base64)
  }

  private uid(): string {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)
  }

  async getSettings(): Promise<AppSettings> {
    const db = await this.getDb()
    const rows = db.exec("SELECT key, value FROM settings WHERE key IN ('workspaceDir','setupComplete')")
    const map: Record<string, string> = {}
    if (rows.length) rows[0].values.forEach(([k, v]) => { map[k as string] = v as string })
    return {
      workspaceDir: map.workspaceDir || '',
      setupComplete: map.setupComplete === 'true',
    }
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const db = await this.getDb()
    for (const [key, value] of Object.entries(settings)) {
      db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, String(value)])
    }
    this.save()
  }

  async getSections(): Promise<Section[]> {
    const db = await this.getDb()
    const rows = db.exec('SELECT id, name, directory, "order" FROM sections ORDER BY "order"')
    if (!rows.length) return []
    return rows[0].values.map(([id, name, directory, order]) => ({
      id: id as string, name: name as string, directory: directory as string, order: order as number,
    }))
  }

  async createSection(name: string, directory: string): Promise<Section> {
    const db = await this.getDb()
    const id = this.uid()
    const existing = db.exec('SELECT MAX("order") FROM sections')
    const order = (existing.length && existing[0].values[0][0] != null) ? (existing[0].values[0][0] as number) + 1 : 0
    db.run('INSERT INTO sections (id, name, directory, "order") VALUES (?, ?, ?, ?)', [id, name, directory, order])
    this.save()
    return { id, name, directory, order }
  }

  async updateSection(id: string, updates: Partial<Section>): Promise<void> {
    const db = await this.getDb()
    const fields: string[] = []
    const vals: any[] = []
    if (updates.name !== undefined) { fields.push('name = ?'); vals.push(updates.name) }
    if (updates.directory !== undefined) { fields.push('directory = ?'); vals.push(updates.directory) }
    if (updates.order !== undefined) { fields.push('"order" = ?'); vals.push(updates.order) }
    if (fields.length) {
      vals.push(id)
      db.run(`UPDATE sections SET ${fields.join(', ')} WHERE id = ?`, vals)
      this.save()
    }
  }

  async deleteSection(id: string): Promise<void> {
    const db = await this.getDb()
    db.run('DELETE FROM messages WHERE conversationId IN (SELECT id FROM conversations WHERE sectionId = ?)', [id])
    db.run('DELETE FROM conversations WHERE sectionId = ?', [id])
    db.run('DELETE FROM sections WHERE id = ?', [id])
    this.save()
  }

  async getConversations(): Promise<Conversation[]> {
    const db = await this.getDb()
    const rows = db.exec('SELECT id, name, avatar, description, sectionId, parentId, archived, createdAt, updatedAt FROM conversations ORDER BY updatedAt DESC')
    if (!rows.length) return []
    return rows[0].values.map(([id, name, avatar, description, sectionId, parentId, archived, createdAt, updatedAt]) => {
      // Get last message
      const msgRows = db.exec('SELECT text, timestamp FROM messages WHERE conversationId = ? ORDER BY timestamp DESC LIMIT 1', [id as string])
      const lastMessage = msgRows.length ? msgRows[0].values[0][0] as string : ''
      const lastTimestamp = msgRows.length ? msgRows[0].values[0][1] as number : (updatedAt as number || 0)
      return {
        id: id as string, name: name as string, avatar: (avatar as string) || '💬',
        description: (description as string) || '', sectionId: sectionId as string,
        parentId: (parentId as string) || undefined, archived: !!(archived as number),
        lastMessage: (lastMessage || '').slice(0, 50), lastTimestamp,
        messages: [],
      }
    })
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const db = await this.getDb()
    const rows = db.exec('SELECT id, text, sender, timestamp, type FROM messages WHERE conversationId = ? ORDER BY timestamp', [conversationId])
    if (!rows.length) return []
    return rows[0].values.map(([id, text, sender, timestamp, type]) => ({
      id: id as string, text: text as string, sender: sender as 'me' | 'other',
      timestamp: timestamp as number, type: (type as Message['type']) || 'text',
    }))
  }

  async sendMessage(conversationId: string, text: string): Promise<Message> {
    const db = await this.getDb()
    const id = this.uid()
    const timestamp = Date.now()
    db.run('INSERT INTO messages (id, conversationId, text, sender, timestamp, type) VALUES (?, ?, ?, ?, ?, ?)',
      [id, conversationId, text, 'me', timestamp, 'text'])
    db.run('UPDATE conversations SET updatedAt = ? WHERE id = ?', [timestamp, conversationId])
    this.save()
    return { id, text, sender: 'me', timestamp, type: 'text' }
  }

  async createConversation(sectionId: string, name: string): Promise<Conversation> {
    const db = await this.getDb()
    const id = this.uid()
    const now = Date.now()
    db.run('INSERT INTO conversations (id, name, avatar, description, sectionId, parentId, archived, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
      [id, name, '💬', '', sectionId, null, now, now])
    this.save()
    return { id, name, avatar: '💬', lastMessage: '', lastTimestamp: now, messages: [], sectionId, description: '' }
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const db = await this.getDb()
    const fields: string[] = []
    const vals: any[] = []
    if (updates.name !== undefined) { fields.push('name = ?'); vals.push(updates.name) }
    if (updates.avatar !== undefined) { fields.push('avatar = ?'); vals.push(updates.avatar) }
    if (updates.description !== undefined) { fields.push('description = ?'); vals.push(updates.description) }
    if (updates.sectionId !== undefined) { fields.push('sectionId = ?'); vals.push(updates.sectionId) }
    if (updates.parentId !== undefined) { fields.push('parentId = ?'); vals.push(updates.parentId) }
    if (fields.length) {
      fields.push('updatedAt = ?'); vals.push(Date.now())
      vals.push(id)
      db.run(`UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`, vals)
      this.save()
    }
  }

  async archiveConversation(id: string): Promise<void> {
    const db = await this.getDb()
    db.run('UPDATE conversations SET archived = 1, updatedAt = ? WHERE id = ?', [Date.now(), id])
    this.save()
  }

  async deleteConversation(id: string): Promise<void> {
    const db = await this.getDb()
    db.run('DELETE FROM messages WHERE conversationId = ?', [id])
    db.run('DELETE FROM conversations WHERE id = ?', [id])
    this.save()
  }
}
