import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChatWindow } from '@/components/ChatWindow'
import { chatApi, convName, isGroup } from '@/api/chat'

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const convId = Number(id)
  // Dùng lại cache danh sách để lấy tên/loại hội thoại.
  const q = useQuery({ queryKey: ['conversations', 'primary'], queryFn: () => chatApi.conversations('primary') })
  const mq = useQuery({ queryKey: ['conversations', 'mentoring'], queryFn: () => chatApi.conversations('primary', 'MENTORING') })
  const mconv = mq.data?.data.find((c) => c.id === convId)
  const conv = q.data?.data.find((c) => c.id === convId) ?? mconv
  return <ChatWindow conversationId={convId} title={conv ? convName(conv) : 'Tin nhắn'} isGroupChat={isGroup(conv)} isMentoring={!!mconv || conv?.type === 'MENTORING'} />
}
