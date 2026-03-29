import { DataProvider, AppSettings } from './DataProvider'
import { Conversation, Message, Section, conversations as mockConversations, sections as mockSections } from '../data/mockData'

export class MockProvider implements DataProvider {
  private conversations: Conversation[] = [...mockConversations]
  private sections: Section[] = [...mockSections]
  private settings: AppSettings = { workspaceDir: '/workspace', setupComplete: true }

  async getConversations() { return this.conversations }
  async getMessages(conversationId: string) {
    return this.conversations.find(c => c.id === conversationId)?.messages ?? []
  }
  async getSections() { return this.sections }

  async sendMessage(conversationId: string, text: string): Promise<Message> {
    const msg: Message = {
      id: `${conversationId}-${Date.now()}`,
      text, sender: 'me', timestamp: Date.now(),
      type: text.includes('```') ? 'code' : 'text',
    }
    this.conversations = this.conversations.map(c =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, msg], lastMessage: text.slice(0, 50), lastTimestamp: Date.now() }
        : c
    )
    return msg
  }

  async createConversation(sectionId: string, name: string): Promise<Conversation> {
    const conv: Conversation = {
      id: `new-${Date.now()}`, name, avatar: '💬', lastMessage: '', lastTimestamp: Date.now(),
      sectionId, messages: [], archived: false,
    }
    this.conversations.unshift(conv)
    return conv
  }

  async updateConversation(id: string, updates: Partial<Conversation>) {
    this.conversations = this.conversations.map(c => c.id === id ? { ...c, ...updates } : c)
  }

  async archiveConversation(id: string) {
    this.conversations = this.conversations.map(c => c.id === id ? { ...c, archived: true } : c)
  }

  async deleteConversation(id: string) {
    this.conversations = this.conversations.filter(c => c.id !== id)
  }

  async createSection(name: string, directory: string): Promise<Section> {
    const s: Section = { id: `section-${Date.now()}`, name, directory, order: this.sections.length }
    this.sections.push(s)
    return s
  }

  async updateSection(id: string, updates: Partial<Section>) {
    this.sections = this.sections.map(s => s.id === id ? { ...s, ...updates } : s)
  }

  async deleteSection(id: string) {
    this.sections = this.sections.filter(s => s.id !== id)
    this.conversations = this.conversations.filter(c => c.sectionId !== id)
  }

  async getSettings() { return this.settings }
  async updateSettings(updates: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...updates }
  }
}
