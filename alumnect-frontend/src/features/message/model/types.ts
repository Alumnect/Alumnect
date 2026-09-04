export type MediaType = 'IMAGE' | 'VIDEO' | 'FILE'

export interface MessageAttachment {
  id: number
  mediaType: MediaType
  url: string
  fileName?: string
  fileSize?: number
  createdAt: string
}

export interface Message {
  id: number
  conversationId: number
  senderId: number
  senderName: string
  senderAvatar?: string | null
  content?: string | null
  isDeleted: boolean
  createdAt: string
  attachments: MessageAttachment[]
}

export interface Conversation {
  id: number
  createdAt: string
  lastMessageAt: string
  recipientId: number
  recipientName: string
  recipientAvatar?: string | null
  recipientMajor?: string | null
  lastMessage?: string
  unreadCount: number
}

export interface SendMessagePayload {
  conversationId?: number
  recipientId?: number
  content?: string
  attachments?: {
    mediaType: MediaType
    url: string
    fileName?: string
    fileSize?: number
  }[]
}
