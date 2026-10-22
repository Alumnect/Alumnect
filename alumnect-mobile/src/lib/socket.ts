import { AppState } from 'react-native'
import { Client } from '@stomp/stompjs'
import type { IMessage, StompSubscription } from '@stomp/stompjs'
import type { InfiniteData } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { useAuthStore } from '@/store/authStore'

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://10.0.2.2:8080/ws'

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

function onNotification(m: IMessage) {
  try {
    const n = JSON.parse(m.body) as { type?: string }
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    if (n.type?.startsWith('MENTORING_')) {
      queryClient.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('mentoring') })
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
