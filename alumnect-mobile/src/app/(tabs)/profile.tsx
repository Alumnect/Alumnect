import React from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Briefcase, CalendarCheck, Coins, KeyRound, LogOut, MessageCircle, Pencil, Route, Users } from '@/components/icons'
import { Button, Card, Empty, IconButton, Loading, MenuRow, PageHeader, Screen, Txt } from '@/components/ui'
import { ProfileView } from '@/components/ProfileView'
import { userApi } from '@/api/users'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast } from '@/lib/toast'

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Txt muted size={14} weight="500" style={{ marginLeft: 4, marginBottom: 8 }}>{title}</Txt>
      <Card style={{ paddingVertical: 2 }}>{children}</Card>
    </View>
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

  if (q.isLoading) return <Screen><PageHeader title="Cá nhân" /><Loading /></Screen>
  if (!q.data?.data) return <Screen><PageHeader title="Cá nhân" /><Empty text="Chưa có thông tin hồ sơ." error={q.error} onRetry={() => { void q.refetch() }} /></Screen>
  const isAlumni = q.data.data.role === 'ALUMNI'
  return (
    <Screen bg={t.card}>
      <PageHeader title="Cá nhân" right={<IconButton label="Tin nhắn" icon={<MessageCircle size={20} color={t.text} />} onPress={() => router.push('/chat')} />} />
      <ProfileView profile={q.data.data} isMe>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <Button title="Sửa hồ sơ" size="sm" icon={<Pencil size={15} color={t.onPrimary} />} onPress={() => router.push('/profile/edit')} style={{ flex: 1, height: 40 }} />
          <Button title="Kinh nghiệm" size="sm" variant="secondary" icon={<Briefcase size={15} color={t.primary} />} onPress={() => router.push('/profile/experience')} style={{ flex: 1, height: 40 }} />
        </View>

        <Group title="Hoạt động của tôi">
          <MenuRow icon={<Bookmark size={18} color={t.primary} />} label="Bài viết đã lưu" onPress={() => router.push('/saved-posts')} />
          <MenuRow icon={<CalendarCheck size={18} color={t.primary} />} label="Lịch sử sự kiện" hint="Sự kiện đã đăng ký tham gia" onPress={() => router.push('/events/history')} />
          <MenuRow icon={<Users size={18} color={t.primary} />} label={isAlumni ? 'Hội nhóm cựu sinh viên' : 'Hội nhóm'} onPress={() => router.push('/groups')} />
          <MenuRow icon={<Coins size={18} color={t.primary} />} label="Khảo sát lương" hint="Đóng góp và xem mức lương" onPress={() => router.push('/salary')} />
          <MenuRow icon={<Route size={18} color={t.primary} />} label="Lộ trình sự nghiệp" onPress={() => router.push('/career')} last />
        </Group>

        <Group title="Tài khoản">
          <MenuRow icon={<KeyRound size={18} color={t.primary} />} label="Đổi mật khẩu" onPress={() => router.push('/change-password')} />
          <MenuRow icon={<LogOut size={18} color={t.danger} />} label={out.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'} danger onPress={() => out.mutate()} last />
        </Group>
        <Txt muted size={12} style={{ textAlign: 'center', marginTop: 4 }}>Alumnect · FPT University</Txt>
      </ProfileView>
    </Screen>
  )
}
