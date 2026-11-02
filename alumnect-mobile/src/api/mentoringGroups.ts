import http from '@/lib/http'
import type { ApiResponse } from '@/lib/http'

export type GroupMemberStatus = 'PENDING' | 'JOINED' | 'DECLINED' | 'REMOVED' | 'CANCELLED' | 'INVITED' | 'ACTIVE'

export interface GroupMember {
  id: number
  groupId?: number
  userId: number
  fullName: string
  email?: string
  avatarUrl?: string | null
  major?: string | null
  role?: string | null
  leader: boolean
  status: GroupMemberStatus
  invitedAt?: string
  joinedAt?: string | null
}

export interface GroupRequestSummary {
  id: number
  title: string
  requestType: 'GENERAL' | 'DIRECT'
  status: string
  targetMentorName?: string | null
  taskId?: number | null
  createdAt: string
}

export interface MentoringGroup {
  id: number
  requestId?: number | null
  name: string
  description?: string | null
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED'
  leaderId: number
  leaderName?: string | null
  leaderAvatarUrl?: string | null
  maxMembers: number
  joinedMemberCount?: number
  pendingMemberCount?: number
  canManage: boolean
  members: GroupMember[]
  requests?: GroupRequestSummary[]
}

export type GroupFilter = 'ALL' | 'MANAGED' | 'JOINED'

export const isActiveMember = (m: GroupMember) => m.status === 'JOINED' || m.status === 'ACTIVE'
export const isPendingMember = (m: GroupMember) => m.status === 'PENDING' || m.status === 'INVITED'

const d = <T>(p: Promise<ApiResponse<T>>) => p.then((r) => r.data)
const base = '/mentoring/groups'

/** Khớp MentoringGroupController (/mentoring/groups). */
export const groupApi = {
  mine: (filter: GroupFilter = 'ALL') => d(http.get<unknown, ApiResponse<MentoringGroup[]>>(base, { params: { filter } })),
  invitations: () => d(http.get<unknown, ApiResponse<MentoringGroup[]>>(`${base}/invitations/mine`)),
  detail: (id: number) => d(http.get<unknown, ApiResponse<MentoringGroup>>(`${base}/${id}`)),
  create: (p: { name: string; description?: string }) => d(http.post<unknown, ApiResponse<MentoringGroup>>(base, p)),
  update: (id: number, p: { name?: string; description?: string }) => d(http.patch<unknown, ApiResponse<MentoringGroup>>(`${base}/${id}`, p)),
  invite: (id: number, userIds: number[]) => d(http.post<unknown, ApiResponse<MentoringGroup>>(`${base}/${id}/members`, { userIds })),
  accept: (id: number) => d(http.post<unknown, ApiResponse<MentoringGroup>>(`${base}/${id}/accept`)),
  decline: (id: number) => d(http.post<unknown, ApiResponse<MentoringGroup>>(`${base}/${id}/decline`)),
  cancelInvitationByUser: (id: number, userId: number) => d(http.post<unknown, ApiResponse<MentoringGroup>>(`${base}/${id}/cancel-invitation/${userId}`)),
  leave: (id: number) => d(http.post<unknown, ApiResponse<MentoringGroup>>(`${base}/${id}/leave`)),
  remove: (id: number, userId: number) => d(http.delete<unknown, ApiResponse<MentoringGroup>>(`${base}/${id}/members/${userId}`)),
  delete: (id: number) => d(http.delete<unknown, ApiResponse<null>>(`${base}/${id}`)),
}
