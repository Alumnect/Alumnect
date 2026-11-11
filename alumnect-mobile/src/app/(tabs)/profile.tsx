import React from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Briefcase, ChevronRight, Clock, GraduationCap, KeyRound, LogOut, MessageCircle, Pencil } from '@/components/icons'
import { useMyVerification } from '@/lib/verificationHooks'
import { Button, Card, Empty, IconButton, Loading, MenuRow, PageHeader, Screen, Txt } from '@/components/ui'
import { ProfileView } from '@/components/ProfileView'
import { userApi } from '@/api/users'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast } from '@/lib/toast'
import { BrandIcon } from '@/components/BrandIcon'
import { MotionPressable } from '@/components/Motion'

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Txt muted size={14} weight="500" style={{ marginLeft: 4, marginBottom: 8 }}>{title}</Txt>
      <Card style={{ paddingVertical: 2 }}>{children}</Card>
    </View>
  )
}

/** UC08: lối vào nâng cấp lên Cựu sinh viên, chỉ hiện với Sinh viên; nội dung đổi theo trạng thái phiếu gần nhất. */
function UpgradeAlumniCard() {
  const t = useTheme()
  const router = useRouter()
  const { data } = useMyVerification()
  const state = data?.status ?? 'NONE'
  if (state === 'APPROVED') return null
  const cfg = {
    NONE: { icon: <GraduationCap size={22} color={t.primary} />, tint: t.primaryTint, title: 'Đã tốt nghiệp FPTU?', hint: 'Gửi minh chứng để nâng cấp lên Cựu sinh viên' },
    PENDING: { icon: <Clock size={22} color={t.warning} />, tint: t.warningTint, title: 'Đang chờ duyệt Cựu sinh viên', hint: 'Xem trạng thái yêu cầu của bạn' },
    REJECTED: { icon: <AlertTriangle size={22} color={t.danger} />, tint: t.dangerTint, title: 'Cần bổ sung minh chứng', hint: 'Xem lý do và gửi lại yêu cầu' },
  }[state]
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={`${cfg.title}. ${cfg.hint}`}
      onPress={() => router.push('/profile/upgrade-alumni')}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: pressed ? t.inputBg : cfg.tint, marginBottom: 16 })}
    >
      {cfg.icon}
      <View style={{ flex: 1 }}>
        <Txt weight="600">{cfg.title}</Txt>
        <Txt muted size={13}>{cfg.hint}</Txt>
      </View>
      <ChevronRight size={18} color={t.textMuted} />
    </MotionPressable>
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
      <ProfileView profile={q.data.data} isMe actions={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Sửa hồ sơ" variant="brand" size="sm" icon={<Pencil size={15} color={t.onPrimary} />} onPress={() => router.push('/profile/edit')} style={{ flex: 1 }} />
          <Button title="Kinh nghiệm" size="sm" variant="secondary" icon={<Briefcase size={15} color={t.primary} />} onPress={() => router.push('/profile/experience')} style={{ flex: 1, height: 40 }} />
        </View>
      }>
        {q.data.data.role === 'STUDENT' ? <UpgradeAlumniCard /> : null}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
          {([{ icon: 'coin', title: 'Khảo sát lương', hint: 'Hiểu giá trị của bạn', route: '/salary' }, { icon: 'suitcase', title: 'Lộ trình sự nghiệp', hint: 'Cảm hứng từ cộng đồng', route: '/career' }] as const).map((item) => <MotionPressable key={item.route} accessibilityRole="button" onPress={() => router.push(item.route)} style={({ pressed }) => ({ flex: 1, padding: 14, borderRadius: 20, backgroundColor: pressed ? t.inputBg : t.card, borderWidth: 1, borderColor: t.border, gap: 6 })}>
            <BrandIcon name={item.icon} size={38} /><Txt size={13} weight="600">{item.title}</Txt><Txt size={11} muted>{item.hint}</Txt>
          </MotionPressable>)}
        </View>
        <Group title="Không gian của tôi">
          <MenuRow icon={<BrandIcon name="list" size={28} />} label="Bài viết đã lưu" onPress={() => router.push('/saved-posts')} />
          <MenuRow icon={<BrandIcon name="calendar" size={28} />} label="Lịch sử sự kiện" hint="Những cuộc hẹn và trải nghiệm đã đăng ký" onPress={() => router.push('/events/history')} last={!isAlumni} />
          {isAlumni ? (
            <MenuRow icon={<BrandIcon name="people" size={28} />} label="Hội nhóm của tôi" hint="Cùng sở thích, cùng kết nối" onPress={() => router.push('/groups')} last />
          ) : null}
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
