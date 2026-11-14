import { AppState } from 'react-native'
import { Client } from '@stomp/stompjs'
import type { IMessage, StompSubscription } from '@stomp/stompjs'
import type { InfiniteData } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { useAuthStore } from '@/store/authStore'
import type { ApiResponse } from './http'
import { toast, errMsg } from './toast'
import { requestApi } from '@/api/mentoringFlow'
import { notificationApi } from '@/api/notifications'
import { syncAnswerVoteInCache, syncQuestionVoteInCache } from '@/api/forum'
import { syncPostLikeInCache } from '@/api/feed'

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'wss://alumnect.online/ws'

type Listener = (msg: IMessage) => void

let client: Client | null = null
const topicListeners = new Map<string, Set<Listener>>()
const topicSubs = new Map<string, StompSubscription>()

function attach(dest: string) {
  if (!client?.connected || topicSubs.has(dest)) return
  topicSubs.set(
    dest,
    client.subscribe(dest, (m) => topicListeners.get(dest)?.forEach((l) => l(m))),
  )
}

/** Đăng ký lắng nghe một kênh STOMP bất kỳ (vd ticket chat UC109). Trả về hàm huỷ. */
export function subscribeTopic(dest: string, listener: Listener): () => void {
  if (!topicListeners.has(dest)) topicListeners.set(dest, new Set())
  topicListeners.get(dest)!.add(listener)
  attach(dest)
  return () => {
    const set = topicListeners.get(dest)
    set?.delete(listener)
    if (set && set.size === 0) {
      topicListeners.delete(dest)
      topicSubs.get(dest)?.unsubscribe()
      topicSubs.delete(dest)
    }
  }
}

function onChatMessage(m: IMessage) {
  try {
    const msg = JSON.parse(m.body) as { id: number; conversationId: number; content?: string; createdAt: string; attachments?: { mediaType: string }[]; type?: string }
    const convId = Number(msg.conversationId)
    queryClient.setQueryData<InfiniteData<{ content?: { id: number }[]; totalElements?: number }>>(['messages', convId], (old) => {
      if (!old?.pages?.length) return old
      if (old.pages.some((p) => p.content?.some((x) => x.id === msg.id))) return old
      const first = old.pages[0]
      return { ...old, pages: [{ ...first, content: [msg, ...(first.content ?? [])] }, ...old.pages.slice(1)] }
    })
    queryClient.invalidateQueries({ queryKey: ['messages', convId] })
    queryClient.invalidateQueries({ queryKey: ['conversations'] })
    if (msg.type === 'SYSTEM') queryClient.invalidateQueries({ queryKey: ['group-members', convId] })
  } catch {
    /* bỏ qua frame hỏng */
  }
}

const isMentoringKey = (q: { queryKey: readonly unknown[] }) =>
  typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('mentoring')

type SocketNotification = { id: number; type?: string; content?: string; targetType?: string | null; targetId?: string | null }

function onNotification(m: IMessage) {
  try {
    const n = JSON.parse(m.body) as SocketNotification

    // Chuông tăng ngay lập tức (không chờ gọi lại API), đồng bộ với server sau đó.
    queryClient.setQueryData<ApiResponse<{ unreadCount: number }>>(['notifications', 'unread'], (old) =>
      old ? { ...old, data: { ...old.data, unreadCount: (old.data?.unreadCount ?? 0) + 1 } } : old,
    )
    queryClient.invalidateQueries({ queryKey: ['notifications'] })

    if (n.type?.startsWith('MENTORING_')) queryClient.invalidateQueries({ predicate: isMentoringKey })

    // Kết quả xét duyệt nâng cấp Cựu sinh viên (UC08): làm mới trạng thái xác minh và hồ sơ.
    if (n.type === 'ALUMNI_VERIFICATION' || n.targetType === 'ALUMNI_VERIFICATION') {
      queryClient.invalidateQueries({ queryKey: ['verification'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }

    // Yêu cầu mentoring mới: toast có nút Nhận / Bỏ qua (giống Web).
    if (n.targetType === 'MENTORING_INCOMING_REQUEST' && n.targetId) {
      const requestId = Number(n.targetId)
      if (Number.isInteger(requestId) && requestId > 0) {
        const respond = async (accepted: boolean) => {
          try {
            if (accepted) {
              await requestApi.accept(requestId)
              toast.success('Đã nhận yêu cầu Mentoring. Kênh trao đổi đã được mở.')
            } else {
              await requestApi.decline(requestId)
              toast.success('Đã bỏ qua yêu cầu Mentoring.')
            }
            await notificationApi.markRead(n.id)
          } catch (e) {
            toast.error(errMsg(e, 'Không thể xử lý yêu cầu Mentoring'))
          } finally {
            queryClient.invalidateQueries({ predicate: isMentoringKey })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
          }
        }
        toast.action(n.content || 'Bạn vừa nhận được một yêu cầu Mentoring mới.', [
          { label: 'Nhận', onPress: () => void respond(true) },
          { label: 'Bỏ qua', secondary: true, onPress: () => void respond(false) },
        ])
      }
    }
  } catch {
    /* bỏ qua */
  }
}

export function connectSocket() {
  const token = useAuthStore.getState().accessToken
  if (!token || client?.active) return
  client = new Client({
    brokerURL: WS_URL,
    connectHeaders: { Authorization: `Bearer ${token}` },
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    beforeConnect: () => {
      const latest = useAuthStore.getState().accessToken
      if (latest && client) client.connectHeaders = { Authorization: `Bearer ${latest}` }
    },
    onConnect: () => {
      topicSubs.clear()
      client!.subscribe('/user/queue/messages', onChatMessage)
      client!.subscribe('/user/queue/notifications', onNotification)
      client!.subscribe('/topic/forum/votes', (m) => {
        try {
          const ev = JSON.parse(m.body) as {
            targetType?: 'QUESTION' | 'ANSWER'
            targetId?: number | string
            questionId?: number | string
            voteCount?: number
            voterId?: number | string
            voted?: boolean
          }
          if (typeof ev.voteCount !== 'number' || ev.targetId == null) return
          const myId = useAuthStore.getState().user?.id
          const isMe = myId != null && ev.voterId != null && String(myId) === String(ev.voterId)
          if (ev.targetType === 'QUESTION') {
            syncQuestionVoteInCache(String(ev.targetId), {
              votes: ev.voteCount,
              ...(isMe && typeof ev.voted === 'boolean' ? { voted: ev.voted } : {}),
            })
          } else if (ev.targetType === 'ANSWER' && ev.questionId != null) {
            syncAnswerVoteInCache(String(ev.questionId), String(ev.targetId), {
              votes: ev.voteCount,
              ...(isMe && typeof ev.voted === 'boolean' ? { voted: ev.voted } : {}),
            })
          }
        } catch {
          /* bỏ qua */
        }
      })
      client!.subscribe('/topic/feed', (m) => {
        try {
          const ev = JSON.parse(m.body) as {
            type?: string
            postId?: number | string
            likeCount?: number
            userId?: number | string
            liked?: boolean
          }
          if (ev.type === 'POST_LIKE' && ev.postId != null && typeof ev.likeCount === 'number') {
            const myId = useAuthStore.getState().user?.id
            const isMe = myId != null && ev.userId != null && String(myId) === String(ev.userId)
            syncPostLikeInCache(String(ev.postId), {
              likes: ev.likeCount,
              ...(isMe && typeof ev.liked === 'boolean' ? { liked: ev.liked } : {}),
            })
          }
        } catch {
          /* bỏ qua */
        }
      })
      topicListeners.forEach((_s, dest) => attach(dest))
    },
    onStompError: (f) => {
      const msg = f.headers['message'] ?? ''
      if (msg.includes('JWT') || msg.includes('xác thực') || msg.includes('hết hạn')) disconnectSocket()
    },
  })
  client.activate()
}

export function disconnectSocket() {
  topicSubs.clear()
  void client?.deactivate()
  client = null
}

/** Gắn vòng đời socket với AppState + đăng nhập (gọi một lần ở root). */
export function startRealtime(): () => void {
  const sync = () => {
    if (AppState.currentState === 'active' && useAuthStore.getState().isAuthenticated) {
      connectSocket()
    }
  }
  sync()
  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active') {
      sync()
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } else if (s === 'background') {
      disconnectSocket()
    }
  })
  const unsubAuth = useAuthStore.subscribe((st, prev) => {
    if (st.accessToken !== prev.accessToken) {
      if (!st.accessToken) disconnectSocket()
      else if (!client?.active) sync()
    }
  })
  return () => {
    sub.remove()
    unsubAuth()
    disconnectSocket()
  }
}
