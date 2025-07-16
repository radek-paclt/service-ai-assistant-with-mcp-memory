export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum MemoryEffectiveness {
  WORKED_CORRECTLY = 'worked_correctly',
  NEW_SOLUTION_STORED = 'new_solution_stored', 
  MEMORY_CORRECTED = 'memory_corrected',
  NO_HELP = 'no_help'
}

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  AZURE_OPENAI = 'azure_openai'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isAnonymized?: boolean
  originalContent?: string
}

export interface UserSession {
  id: string
  username: string
  role: UserRole
  isTemporaryPassword: boolean
}

export interface CreateChatRequest {
  customerName: string
  ticketId: string
}

export interface ChatResponse {
  id: string
  customerName: string
  ticketId: string
  userId: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}