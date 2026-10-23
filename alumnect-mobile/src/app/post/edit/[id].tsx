import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { PostForm } from '@/components/PostForm'
import { Loading } from '@/components/ui'
import { feedApi } from '@/api/feed'

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const q = useQuery({ queryKey: ['post', id], queryFn: () => feedApi.getPost(id!) })
  if (!q.data) return <Loading />
  return <PostForm existing={q.data} />
}
