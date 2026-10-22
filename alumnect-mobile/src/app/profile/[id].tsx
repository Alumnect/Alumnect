import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Empty, Loading, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { ProfileView } from '@/components/ProfileView'
import { userApi } from '@/api/users'
import { useAuthStore } from '@/store/authStore'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const me = useAuthStore((s) => s.user)
  const q = useQuery({ queryKey: ['profile', id], queryFn: () => userApi.profile(id!) })
  return (
    <Screen>
      <Header title="Hồ sơ" />
      {q.isLoading ? <Loading /> : q.data?.data ? <ProfileView profile={q.data.data} isMe={me?.id === id} /> : <Empty text="Không tìm thấy người dùng." />}
    </Screen>
  )
}
