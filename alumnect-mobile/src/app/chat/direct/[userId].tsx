import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChatWindow } from '@/components/ChatWindow'
import { Loading } from '@/components/ui'
import { chatApi } from '@/api/chat'

export default function DirectChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const q = useQuery({
    queryKey: ['direct', userId],
    queryFn: () => chatApi.direct(Number(userId)),
    staleTime: 0,
  })
  if (!q.data) return <Loading />
  const c = q.data.data
  return <ChatWindow conversationId={c.id} recipientId={Number(userId)} title={c.recipientName} />
}
