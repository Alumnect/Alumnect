export type MediaType = 'IMAGE' | 'VIDEO' | 'FILE'
export type ConversationType = 'DIRECT' | 'GROUP'
export type ParticipantRole = 'ADMIN' | 'MEMBER'
export type MessageType = 'TEXT' | 'SYSTEM' | 'IMAGE' | 'FILE'
export type MessageSendStatus = 'sending' | 'sent' | 'error'

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
  type?: MessageType
  status?: MessageSendStatus
  attachments: MessageAttachment[]
}

export interface Conversation {
  id: number | null // null đối với draft conversation chưa gửi tin nhắn
  type?: ConversationType
  isGroup?: boolean
  title?: string
  avatarUrl?: string | null
  createdAt: string
  lastMessageAt: string
  recipientId?: number | null
  recipientName: string
  recipientAvatar?: string | null
  recipientMajor?: string | null
  memberCount?: number
  isAccepted?: boolean
  adminId?: number | null
  lastMessage?: string
  unreadCount: number
  communityGroupId?: number | null
  communityGroupName?: string | null
}

/** Kiểm tra cuộc hội thoại có phải là nhóm hay không */
export function isGroupConversation(conv?: Partial<Conversation> | null): boolean {
  if (!conv) return false
  return conv.type === 'GROUP' || conv.isGroup === true
}

export interface SendMessagePayload {
  conversationId?: number | null
  recipientId?: number | null
  content?: string
  attachments?: {
    mediaType: MediaType
    url: string
    fileName?: string
    fileSize?: number
  }[]
}

export interface Participant {
  userId: number
  fullName: string
  avatar?: string | null
  major?: string | null
  role: ParticipantRole
  joinedAt: string
}

export interface CreateGroupPayload {
  title: string
  avatarUrl?: string
  memberIds: number[]
}

export interface UpdateGroupPayload {
  title?: string
  avatarUrl?: string
}

export interface AddMembersPayload {
  memberIds: number[]
}

export interface ChatCandidateUser {
  userId: number
  fullName: string
  avatarUrl?: string | null
  headline?: string | null
  major?: string | null
  isFollowing: boolean
}

