import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { QuestionForm } from '@/components/QuestionForm'
import { Empty, Loading, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { forumApi } from '@/api/forum'

export default function EditQuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const q = useQuery({ queryKey: ['question', id], queryFn: () => forumApi.get(id!) })
  if (q.isLoading) return <Screen><Header title="Sửa câu hỏi" /><Loading /></Screen>
  if (!q.data) return <Screen><Header title="Sửa câu hỏi" /><Empty text="Không tìm thấy câu hỏi." error={q.error} onRetry={() => { void q.refetch() }} /></Screen>
  return <QuestionForm existing={q.data} />
}
