import { DataProvider, AppSettings } from './DataProvider'
import { Conversation, Message, Section } from '../data/mockData'

const BASE = `${import.meta.env.BASE_URL}api`.replace(/\/\//g, '/')

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json()
}

export class LiveProvider implements DataProvider {
  async getConversations(): Promise<Conversation[]> { return api('/conversations') }
  async getMessages(conversationId: string): Promise<Message[]> { return api(`/conversations/${conversationId}/messages`) }
  async getSections(): Promise<Section[]> { return api('/sections') }

  async sendMessage(conversationId: string, text: string): Promise<Message> {
    return api(`/conversations/${conversationId}/messages`, {
      method: 'POST', body: JSON.stringify({ text }),
    })
  }

  async createConversation(sectionId: string, name: string): Promise<Conversation> {
    return api('/conversations', { method: 'POST', body: JSON.stringify({ sectionId, name }) })
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    await api(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  }

  async archiveConversation(id: string): Promise<void> {
    await api(`/conversations/${id}/archive`, { method: 'POST' })
  }

  async deleteConversation(id: string): Promise<void> {
    await api(`/conversations/${id}`, { method: 'DELETE' })
  }

  async createSection(name: string, directory: string, provider?: string): Promise<Section> {
    return api('/sections', { method: 'POST', body: JSON.stringify({ name, directory, provider: provider || 'openclaw' }) })
  }

  async updateSection(id: string, updates: Partial<Section>): Promise<void> {
    await api(`/sections/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  }

  async deleteSection(id: string): Promise<void> {
    await api(`/sections/${id}`, { method: 'DELETE' })
  }

  async getSettings(): Promise<AppSettings> { return api('/settings') }
  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    await api('/settings', { method: 'PATCH', body: JSON.stringify(settings) })
  }
}
