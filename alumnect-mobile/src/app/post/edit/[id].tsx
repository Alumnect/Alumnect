import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { PostForm } from '@/components/PostForm'
import { Empty, Loading, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { feedApi } from '@/api/feed'

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const q = useQuery({ queryKey: ['post', id], queryFn: () => feedApi.getPost(id!) })
  if (q.isLoading) return <Screen><Header title="Chỉnh sửa bài viết" /><Loading /></Screen>
  if (!q.data) return <Screen><Header title="Chỉnh sửa bài viết" /><Empty text="Không tìm thấy bài viết." error={q.error} onRetry={() => { void q.refetch() }} /></Screen>
  return <PostForm existing={q.data} />
}
