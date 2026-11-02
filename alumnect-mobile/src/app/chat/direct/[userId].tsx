import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChatWindow } from '@/components/ChatWindow'
import { Empty, Loading, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { chatApi } from '@/api/chat'

export default function DirectChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const q = useQuery({
    queryKey: ['direct', userId],
    queryFn: () => chatApi.direct(Number(userId)),
    staleTime: 0,
  })
  if (q.isLoading) return <Screen><Header title="Tin nhắn" /><Loading /></Screen>
  if (!q.data) return <Screen><Header title="Tin nhắn" /><Empty text="Không mở được cuộc trò chuyện." error={q.error} onRetry={() => { void q.refetch() }} /></Screen>
  const c = q.data.data
  return <ChatWindow conversationId={c.id} recipientId={Number(userId)} title={c.recipientName} />
}
