import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data.db')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS sections (id TEXT PRIMARY KEY, name TEXT, directory TEXT, "order" INTEGER);
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY, name TEXT, avatar TEXT, description TEXT,
    sectionId TEXT, parentId TEXT, archived BOOLEAN DEFAULT 0,
    createdAt INTEGER, updatedAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, conversationId TEXT, text TEXT, sender TEXT,
    timestamp INTEGER, type TEXT DEFAULT 'text',
    FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
  );
`)

// Seed default settings if empty
const settingsCount = db.prepare('SELECT COUNT(*) as c FROM settings').get() as { c: number }
if (settingsCount.c === 0) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('workspaceDir', '')
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('setupComplete', 'false')
}

export default db
