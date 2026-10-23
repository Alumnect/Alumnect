import type { Href } from 'expo-router'

/** Ánh xạ đích của thông báo (targetType/targetId) sang màn hình tương ứng. Dùng chung cho danh sách thông báo và push. */
export function routeForTarget(targetType?: string | null, targetId?: string | number | null): Href | null {
  if (!targetType || targetId == null || targetId === '') return null
  const id = String(targetId)
  switch (targetType.toUpperCase()) {
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
