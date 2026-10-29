import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChatWindow } from '@/components/ChatWindow'
import { chatApi, convName, isGroup } from '@/api/chat'
import { Empty, Loading, Screen } from '@/components/ui'
import { Header } from '@/components/Header'

export default function ChatScreen() {
  const { id, mentoring } = useLocalSearchParams<{ id: string; mentoring?: string }>()
  const convId = Number(id)
  // Dùng lại cache danh sách để lấy tên/loại hội thoại.
  const q = useQuery({ queryKey: ['conversations', 'primary'], queryFn: () => chatApi.conversations('primary') })
  const mq = useQuery({ queryKey: ['conversations', 'mentoring'], queryFn: () => chatApi.conversations('primary', 'MENTORING') })
  const rq = useQuery({ queryKey: ['conversations', 'requests'], queryFn: () => chatApi.conversations('requests') })
  const mconv = mq.data?.data.find((c) => c.id === convId)
  const conv = q.data?.data.find((c) => c.id === convId) ?? mconv ?? rq.data?.data.find((c) => c.id === convId)
  if (!conv && (q.isLoading || mq.isLoading || rq.isLoading)) return <Screen><Header title="Tin nhắn" /><Loading /></Screen>
  if (!conv) return <Screen><Header title="Tin nhắn" /><Empty title="Không thể mở cuộc trò chuyện" text="Cuộc trò chuyện không còn trong hộp thư hoặc bạn không có quyền truy cập." error={q.error ?? mq.error ?? rq.error} action="Thử lại" onAction={() => { void q.refetch(); void mq.refetch(); void rq.refetch() }} /></Screen>
  return <ChatWindow key={convId} conversationId={convId} title={convName(conv)} isGroupChat={isGroup(conv)} isMentoring={mentoring === '1' || !!mconv || conv.type === 'MENTORING'} />
}
