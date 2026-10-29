import type { Href } from 'expo-router'

/** Ánh xạ đích của thông báo (targetType/targetId) sang màn hình tương ứng. Dùng chung cho danh sách thông báo và push. */
export function routeForTarget(targetType?: string | null, targetId?: string | number | null): Href | null {
  if (!targetType) return null
  const type = targetType.toUpperCase()
  if (type === 'MENTOR_PAYOUT') return '/mentoring/earnings'
  if (type === 'MENTORING_REFUND') return '/mentoring/refunds'
  if (type === 'MENTOR_SUBSCRIPTION') return '/mentoring/plans'
  if (type === 'MENTORING_GROUP_DISBANDED') return '/mentoring/groups'
  if (targetId == null || targetId === '') return null
  const id = String(targetId).split(':')[0]
  if (type === 'MENTORING_GROUP_REQUEST_CHAT') {
    const conversationId = String(targetId).split(':')[1]
    return conversationId ? { pathname: '/chat/[id]', params: { id: conversationId, mentoring: '1' } } : '/mentoring/messages'
  }
  if (type.startsWith('MENTORING_GROUP')) return { pathname: '/mentoring/groups/[id]', params: { id } }
  if (type.startsWith('MENTORING_TASK') || type === 'MENTORING_WORK_LOG') return { pathname: '/mentoring/tasks/[id]', params: { id } }
  if (type.startsWith('MENTORING_INCOMING_REQUEST')) return { pathname: '/mentoring/incoming/[id]', params: { id } }
  if (type.startsWith('MENTORING_REQUEST')) return { pathname: '/mentoring/request/[id]', params: { id } }
  if (type === 'MENTORING_TICKET') return { pathname: '/mentoring/dispute/[ticketId]/chat', params: { ticketId: id } }
  switch (type) {
    case 'POST':
      return { pathname: '/post/[id]', params: { id } }
    case 'USER':
      return { pathname: '/profile/[id]', params: { id } }
    case 'QUESTION':
      return { pathname: '/forum/[id]', params: { id } }
    case 'EVENT':
      return { pathname: '/events/[id]', params: { id } }
    case 'GROUP':
      return { pathname: '/groups/[id]', params: { id } }
    case 'MENTOR':
      return { pathname: '/mentoring/mentor/[id]', params: { id } }
    case 'CONVERSATION':
    case 'MESSAGE':
      return { pathname: '/chat/[id]', params: { id } }
    default:
      return null
  }
}
