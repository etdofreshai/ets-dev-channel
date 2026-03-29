import { Conversation, Message, Section } from '../data/mockData'

export interface AppSettings {
  workspaceDir: string
  setupComplete: boolean
}

export interface DataProvider {
  getConversations(): Promise<Conversation[]>
  getMessages(conversationId: string): Promise<Message[]>
  getSections(): Promise<Section[]>
  sendMessage(conversationId: string, text: string): Promise<Message>
  createConversation(sectionId: string, name: string): Promise<Conversation>
  updateConversation(id: string, updates: Partial<Conversation>): Promise<void>
  archiveConversation(id: string): Promise<void>
  deleteConversation(id: string): Promise<void>
  createSection(name: string, directory: string): Promise<Section>
  updateSection(id: string, updates: Partial<Section>): Promise<void>
  deleteSection(id: string): Promise<void>
  getSettings(): Promise<AppSettings>
  updateSettings(settings: Partial<AppSettings>): Promise<void>
}
