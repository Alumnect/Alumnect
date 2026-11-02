import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  MentoringGroupData,
  MentoringGroupRequestSummaryData,
  CreateMentoringGroupPayload,
  UpdateMentoringGroupPayload,
} from '../model/mentoringRequestTypes'

export const mentoringGroupApi = {
  create: async (payload: CreateMentoringGroupPayload) =>
    (await http.post<unknown, ApiResponse<MentoringGroupData>>('/mentoring/groups', payload)).data,

  update: async (id: number, payload: UpdateMentoringGroupPayload) =>
    (await http.patch<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/${id}`, payload)).data,

  getAll: async (filter?: string) =>
    (await http.get<unknown, ApiResponse<MentoringGroupData[]>>('/mentoring/groups', { params: filter ? { filter } : undefined })).data,

  getMine: async (filter?: string) =>
    (await http.get<unknown, ApiResponse<MentoringGroupData[]>>('/mentoring/groups', { params: filter ? { filter } : undefined })).data,

  getInvitations: async () =>
    (await http.get<unknown, ApiResponse<MentoringGroupData[]>>('/mentoring/groups/invitations/mine')).data,

  getDetail: async (id: number) =>
    (await http.get<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/${id}`)).data,

  getById: async (id: number) =>
    (await http.get<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/${id}`)).data,

  invite: async (id: number, userIds: number[]) =>
    (await http.post<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/${id}/members`, { userIds })).data,

  accept: async (id: number) =>
    (await http.post<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/${id}/accept`)).data,

  acceptInvitation: async (invitationId: number) =>
    (await http.post<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/invitations/${invitationId}/accept`)).data,

  decline: async (id: number) =>
    (await http.post<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/${id}/decline`)).data,

  declineInvitation: async (invitationId: number) =>
    (await http.post<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/invitations/${invitationId}/decline`)).data,

  cancelInvitation: async (invitationId: number, groupId?: number) =>
    (await http.post<unknown, ApiResponse<MentoringGroupData>>(
      groupId ? `/mentoring/groups/${groupId}/invitations/${invitationId}/cancel` : `/mentoring/groups/invitations/${invitationId}/cancel`
    )).data,

  cancelInvitationByUser: async (groupId: number, userId: number) =>
    (await http.post<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/${groupId}/cancel-invitation/${userId}`)).data,

  leaveGroup: async (id: number) =>
    (await http.post<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/${id}/leave`)).data,

  deleteGroup: async (id: number) =>
    (await http.delete<unknown, ApiResponse<null>>(`/mentoring/groups/${id}`)).data,

  remove: async (id: number, userId: number) =>
    (await http.delete<unknown, ApiResponse<MentoringGroupData>>(`/mentoring/groups/${id}/members/${userId}`)).data,

  getRequests: async (id: number) =>
    (await http.get<unknown, ApiResponse<MentoringGroupRequestSummaryData[]>>(`/mentoring/groups/${id}/requests`)).data,
}
