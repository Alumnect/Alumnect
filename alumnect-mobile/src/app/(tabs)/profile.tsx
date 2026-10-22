import React from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, CalendarCheck, ChevronRight, DollarSign, KeyRound, LogOut, Users } from 'lucide-react-native'
import { Button, Card, Loading, Screen, Txt } from '@/components/ui'
import { ProfileView } from '@/components/ProfileView'
import { userApi } from '@/api/users'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast } from '@/lib/toast'

function Row({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  const t = useTheme()
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      {icon}
      <Txt style={{ flex: 1 }} weight="600">{label}</Txt>
      <ChevronRight size={18} color={t.textMuted} />
    </Pressable>
  )
}

export default function ProfileTab() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const logout = useAuthStore((s) => s.logout)
  const q = useQuery({ queryKey: ['profile', 'me'], queryFn: userApi.me })

  const out = useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout()
      } catch {
        /* bỏ qua lỗi mạng khi đăng xuất */
      }
    },
    onSuccess: () => {
      qc.clear()
      logout()
      toast.success('Đăng xuất thành công!')
    },
  })

  if (q.isLoading || !q.data?.data) return <Screen><Loading /></Screen>
  const isAlumni = q.data.data.role === 'ALUMNI'
  return (
    <Screen>
      <ProfileView profile={q.data.data} isMe>
        <Button title="Chỉnh sửa hồ sơ" variant="outline" onPress={() => router.push('/profile/edit')} style={{ marginBottom: 12 }} />
        <Card style={{ marginBottom: 12 }}>
          <Row icon={<Bookmark size={20} color={t.primary} />} label="Bài viết đã lưu" onPress={() => router.push('/saved-posts')} />
          <Row icon={<CalendarCheck size={20} color={t.primary} />} label="Lịch sử sự kiện" onPress={() => router.push('/events/history')} />
          <Row icon={<DollarSign size={20} color={t.primary} />} label="Khảo sát lương" onPress={() => router.push('/salary')} />
          <Row icon={<Users size={20} color={t.primary} />} label={isAlumni ? 'Hội nhóm cựu sinh viên' : 'Hội nhóm'} onPress={() => router.push('/groups')} />
          <Row icon={<KeyRound size={20} color={t.primary} />} label="Đổi mật khẩu" onPress={() => router.push('/change-password')} />
        </Card>
        <Button title="Đăng xuất" variant="danger" onPress={() => out.mutate()} loading={out.isPending} />
        <View style={{ height: 8 }} />
        <LogOut size={0} color="transparent" />
      </ProfileView>
    </Screen>
  )
}
