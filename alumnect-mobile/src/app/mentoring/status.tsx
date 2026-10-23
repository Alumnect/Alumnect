import React from 'react'
import { ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Check, X } from '@/components/icons'
import { Button, Card, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { mentoringApi } from '@/api/mentoring'
import { useTheme } from '@/theme'

const STATUS_LABEL: Record<string, string> = { INCOMPLETE: 'Chưa hoàn thiện', PAYMENT_PENDING: 'Chờ thanh toán', ACTIVE: 'Đang hoạt động', EXPIRED: 'Đã hết hạn' }

/** UC84: trạng thái mentor và gói đăng ký; điểm vào các bước điều khoản → hồ sơ → gói. */
function Row({ ok, label }: { ok: boolean; label: string }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
      {ok ? <Check size={18} color={t.success} /> : <X size={18} color={t.danger} />}
      <Txt>{label}</Txt>
    </View>
  )
}

export default function MentorStatusScreen() {
  const t = useTheme()
  const router = useRouter()
  const q = useQuery({ queryKey: ['mentoring-status'], queryFn: mentoringApi.status })
  const s = q.data
  if (q.isLoading || !s) return <Screen><Header title="Trạng thái mentor" /><Loading /></Screen>

  return (
    <Screen>
      <Header title="Trạng thái mentor" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <Txt muted size={13}>Trạng thái</Txt>
          <Txt size={22} weight="800" color={s.active ? t.success : t.primary}>{STATUS_LABEL[s.mentorStatus] ?? s.mentorStatus}</Txt>
          <Txt muted style={{ marginTop: 4 }}>{s.statusMessage}</Txt>
          {s.hasSubscription ? <Txt style={{ marginTop: 8 }}>Gói: {s.packageName}{s.remainingDays != null ? ` · còn ${s.remainingDays} ngày` : ''}</Txt> : null}
        </Card>
        <Card style={{ marginTop: 12 }}>
          <Txt weight="700" style={{ marginBottom: 4 }}>Điều kiện hoạt động</Txt>
          <Row ok={s.termsAccepted} label="Đã chấp nhận điều khoản" />
          <Row ok={s.profileComplete} label="Hồ sơ mentor đầy đủ" />
          <Row ok={s.hasCv} label="Đã tải CV" />
          <Row ok={s.bankInformationComplete} label="Có tài khoản nhận chi trả" />
          <Row ok={s.hasSubscription && s.subscriptionStatus === 'ACTIVE'} label="Có gói mentor đang hiệu lực" />
        </Card>
        <View style={{ gap: 10, marginTop: 16 }}>
          {!s.termsAccepted ? <Button title="Xem & chấp nhận điều khoản" onPress={() => router.push('/mentoring/terms')} /> : null}
          <Button title={s.hasMentorProfile ? 'Cập nhật hồ sơ mentor' : 'Đăng ký làm mentor'} variant={s.termsAccepted ? 'primary' : 'outline'} onPress={() => (s.termsAccepted ? router.push('/mentoring/register') : router.push('/mentoring/terms'))} />
          {s.profileComplete ? <Button title={s.active ? 'Gia hạn / đổi gói' : 'Chọn gói mentor'} variant="outline" onPress={() => router.push('/mentoring/plans')} /> : null}
        </View>
      </ScrollView>
    </Screen>
  )
}
