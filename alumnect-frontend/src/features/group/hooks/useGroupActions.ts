import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { groupApi } from '../api/groupApi'
import type { GroupInput, GroupRole, GroupStatus } from '../model/group'

/** Làm mới toàn bộ cache liên quan tới một hội nhóm (danh sách, nhóm của tôi, chi tiết, thành viên, yêu cầu). */
function refreshGroup(queryClient: QueryClient, id?: number) {
  queryClient.invalidateQueries({ queryKey: ['groups'] })
  queryClient.invalidateQueries({ queryKey: ['my-groups'] })
  if (id !== undefined) {
    queryClient.invalidateQueries({ queryKey: ['group', String(id)] })
    queryClient.invalidateQueries({ queryKey: ['group-members', id] })
    queryClient.invalidateQueries({ queryKey: ['group-requests', id] })
  }
}

/** Hook tạo hội nhóm mới. */
export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GroupInput) => groupApi.create(input),
    onSuccess: () => refreshGroup(queryClient),
  })
}

/** Hook cập nhật thông tin hội nhóm. */
export function useUpdateGroup(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GroupInput) => groupApi.update(id, input),
    onSuccess: () => refreshGroup(queryClient, id),
  })
}

/** Hook đóng / mở lại hội nhóm (Owner). */
export function useSetGroupStatus(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: Extract<GroupStatus, 'ACTIVE' | 'INACTIVE'>) => groupApi.setStatus(id, status),
    onSuccess: () => refreshGroup(queryClient, id),
  })
}

/** Hook xóa hội nhóm (Owner). */
export function useDeleteGroup(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => groupApi.remove(id),
    onSuccess: () => refreshGroup(queryClient, id),
  })
}

/** Hook tham gia nhóm công khai / gửi yêu cầu tham gia nhóm riêng tư. Nhận id nhóm khi gọi để dùng được trên nhiều thẻ. */
export function useJoinGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => groupApi.join(id),
    onSuccess: (_data, id) => refreshGroup(queryClient, id),
  })
}

/**
 * Hook rời nhóm / hủy yêu cầu tham gia; Owner truyền `transferToUserId` để chuyển quyền sở hữu.
 * Làm mới chi tiết nhóm TRƯỚC (đợi xong) rồi mới làm mới thành viên/yêu cầu: sau khi rời, người dùng không còn quyền xem
 * yêu cầu/thành viên nhóm riêng tư, nên các query đó phải bị tắt theo quyền mới thay vì gọi API và nhận lỗi 403.
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, transferToUserId }: { id: number; transferToUserId?: number }) => groupApi.leave(id, transferToUserId),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({ queryKey: ['group', String(vars.id)] })
      refreshGroup(queryClient, vars.id)
    },
  })
}

/** Hook duyệt / từ chối yêu cầu tham gia. */
export function useHandleJoinRequest(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: number; action: 'APPROVE' | 'REJECT' }) => groupApi.handleRequest(id, requestId, action),
    onSuccess: () => refreshGroup(queryClient, id),
  })
}

/** Hook xóa thành viên khỏi nhóm. */
export function useRemoveMember(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => groupApi.removeMember(id, userId),
    onSuccess: () => refreshGroup(queryClient, id),
  })
}

/** Hook phân quyền / thu hồi quyền quản trị viên (Owner). */
export function useChangeMemberRole(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: Extract<GroupRole, 'ADMIN' | 'MEMBER'> }) => groupApi.changeRole(id, userId, role),
    onSuccess: () => refreshGroup(queryClient, id),
  })
}
