import initSqlJs, { Database } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db')

let db: Database

export async function getDb(): Promise<Database> {
  if (db) return db
  const SQL = await initSqlJs()
  try {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } catch {
    db = new SQL.Database()
  }

  db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`)
  db.run(`CREATE TABLE IF NOT EXISTS sections (id TEXT PRIMARY KEY, name TEXT, directory TEXT, "order" INTEGER)`)
  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY, name TEXT, avatar TEXT, description TEXT,
    sectionId TEXT, parentId TEXT, archived BOOLEAN DEFAULT 0,
    createdAt INTEGER, updatedAt INTEGER
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, conversationId TEXT, text TEXT, sender TEXT,
    timestamp INTEGER, type TEXT DEFAULT 'text'
  )`)

  // Seed default settings if empty
  const stmt = db.prepare('SELECT COUNT(*) as c FROM settings')
  stmt.step()
  const count = stmt.getAsObject().c as number
  stmt.free()
  if (count === 0) {
    db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['workspaceDir', ''])
    db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['setupComplete', 'false'])
  }

  save()
  return db
}

export function save() {
  if (!db) return
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

/** Helper: run a SELECT and return all rows as objects */
export function queryAll(db: Database, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows: any[] = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

/** Helper: run a SELECT and return first row or null */
export function queryOne(db: Database, sql: string, params: any[] = []): any | null {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const row = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  return row
}
