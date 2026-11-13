import http from '@/lib/http'
import type { ApiResponse, PageResponse } from '@/lib/http'
import type { Deal } from './mentoringFlow'

export type MediaType = 'IMAGE' | 'VIDEO' | 'FILE'
export type OutgoingAttachment = { mediaType: MediaType; url: string; fileName?: string; fileSize?: number }

export interface MentoringChatContext {
  conversationId: number
  readOnly: boolean
  readOnlyReason?: string | null
  canSendMessage: boolean
  canCreateDealTicket: boolean
  canAcceptDealByRequest: boolean
  acceptByRequestUnavailableReason?: string | null
  deal?: { deal: Deal } | null
  taskId?: number | null
  groupId?: number | null
}

export interface MessageAttachment {
  id: number
  mediaType: MediaType
  url: string
  fileName?: string
  fileSize?: number
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
  type?: 'TEXT' | 'SYSTEM' | 'IMAGE' | 'FILE'
  attachments: MessageAttachment[]
}

export interface Conversation {
  id: number | null
  type?: 'DIRECT' | 'GROUP' | 'MENTORING'
  isGroup?: boolean
  title?: string
  avatarUrl?: string | null
  lastMessageAt: string
  recipientId?: number | null
  recipientName: string
  recipientAvatar?: string | null
  memberCount?: number
  isAccepted?: boolean
  adminId?: number | null
  lastMessage?: string
  unreadCount: number
}

export interface Participant {
  userId: number
  fullName: string
  avatar?: string | null
  role: 'ADMIN' | 'MEMBER'
}

export interface ChatCandidate {
  userId: number
  fullName: string
  avatarUrl?: string | null
  headline?: string | null
  isFollowing: boolean
}

export const isGroup = (c?: Partial<Conversation> | null) => !!c && (c.type === 'GROUP' || c.isGroup === true)
export const convName = (c: Conversation) => (isGroup(c) ? c.title : c.recipientName) || c.recipientName
export const convAvatar = (c: Conversation) => (isGroup(c) ? c.avatarUrl : c.recipientAvatar)

export const chatApi = {
  mentoringContext: (id: number) => http.get<unknown, ApiResponse<MentoringChatContext>>(`/mentoring/conversations/${id}`).then((r) => r.data),
  conversations: (tab: 'primary' | 'requests' = 'primary', scope: 'GENERAL' | 'MENTORING' = 'GENERAL') =>
    http.get<unknown, ApiResponse<Conversation[]>>('/conversations', { params: { tab, scope } }),
  direct: (userId: number) => http.post<unknown, ApiResponse<Conversation>>(`/conversations/direct/${userId}`),
  messages: (id: number, page = 0, size = 30) =>
    http.get<unknown, ApiResponse<PageResponse<Message>>>(`/conversations/${id}/messages`, { params: { page, size } }),
  send: (p: { conversationId?: number | null; recipientId?: number | null; content?: string; attachments?: OutgoingAttachment[] }) =>
    http.post<unknown, ApiResponse<Message>>('/messages', p),
  read: (id: number) => http.post<unknown, ApiResponse<void>>(`/conversations/${id}/read`),
  accept: (id: number) => http.post<unknown, ApiResponse<void>>(`/conversations/${id}/accept`),
  remove: (id: number) => http.delete<unknown, ApiResponse<void>>(`/conversations/${id}`),
  createGroup: (p: { title: string; avatarUrl?: string; memberIds: number[] }) =>
    http.post<unknown, ApiResponse<Conversation>>('/conversations/group', p),
  updateGroup: (id: number, p: { title?: string; avatarUrl?: string }) =>
    http.put<unknown, ApiResponse<Conversation>>(`/conversations/${id}/group`, p),
  addMembers: (id: number, memberIds: number[]) =>
    http.post<unknown, ApiResponse<Conversation>>(`/conversations/${id}/members`, { memberIds }),
  removeMember: (id: number, userId: number, newAdminId?: number) =>
    http.delete<unknown, ApiResponse<void>>(`/conversations/${id}/members/${userId}`, { params: newAdminId ? { newAdminId } : undefined }),
  members: (id: number) => http.get<unknown, ApiResponse<Participant[]>>(`/conversations/${id}/members`),
  searchUsers: (keyword?: string) =>
    http.get<unknown, ApiResponse<ChatCandidate[]>>('/conversations/users/search', { params: { keyword: keyword || undefined } }),
}
