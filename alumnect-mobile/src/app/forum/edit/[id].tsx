import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { QuestionForm } from '@/components/QuestionForm'
import { Loading } from '@/components/ui'
import { forumApi } from '@/api/forum'

export default function EditQuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const q = useQuery({ queryKey: ['question', id], queryFn: () => forumApi.get(id!) })
  if (!q.data) return <Loading />
  return <QuestionForm existing={q.data} />
}
