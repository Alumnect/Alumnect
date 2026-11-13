import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Sparkles, XCircle } from '@/components/icons'
import { Button, Empty, Loading, Screen, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { mentoringApi } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { withAlumniOnly } from '@/components/AlumniOnly'

const STATUS_LABEL: Record<string, string> = {
  INCOMPLETE: 'Chưa hoàn thiện hồ sơ',
  PAYMENT_PENDING: 'Chờ kích hoạt gói',
  ACTIVE: 'Đang hoạt động',
  EXPIRED: 'Đã hết hạn gói',
}

/** UC84: trạng thái mentor và gói đăng ký; điểm vào các bước điều khoản → hồ sơ → gói. */
function CheckRow({ ok, label, last }: { ok: boolean; label: string; last?: boolean }) {
  const { colors, viridian } = useMentoringTheme()
  return (
    <View
      style={[
        styles.checkRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
      ]}
    >
      {ok ? (
        <CheckCircle2 size={18} color="#16A34A" weight="fill" />
      ) : (
        <XCircle size={18} color={viridian} weight="fill" />
      )}
      <Txt size={14} weight={ok ? '600' : '500'} style={{ color: colors.text, flex: 1 }}>
        {label}
      </Txt>
      <Tag label={ok ? 'Hoàn tất' : 'Cần bổ sung'} tone={ok ? 'success' : 'warning'} />
    </View>
  )
}

function MentorStatusScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const q = useQuery({ queryKey: ['mentoring-status'], queryFn: mentoringApi.status })
  const s = q.data
  if (q.isLoading)
    return (
      <Screen bg={colors.bg}>
        <Header title="Hồ sơ & Trạng thái Mentor" />
        <Loading />
      </Screen>
    )
  if (!s)
    return (
      <Screen bg={colors.bg}>
        <Header title="Hồ sơ & Trạng thái Mentor" />
        <Empty text="Chưa có thông tin mentor." error={q.error} onRetry={() => { void q.refetch() }} />
      </Screen>
    )

  return (
    <Screen bg={colors.bg}>
      <Header title="Hồ sơ & Trạng thái Mentor" subtitle="Thiết lập tư cách Cố vấn trên Alumnect" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Hero Status Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? '#24180E' : viridianSoft,
              borderColor: isDark ? '#4A2C16' : '#FAD9C2',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Trạng thái Cố vấn hiện tại
              </Txt>
              <Txt size={22} weight="800" style={{ color: s.active ? '#16A34A' : viridian, marginTop: 4 }}>
                {STATUS_LABEL[s.mentorStatus] ?? s.mentorStatus}
              </Txt>
            </View>
            <BrandIcon name="suitcase" size={46} />
          </View>

          <Txt size={13} style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
            {s.statusMessage}
          </Txt>

          {s.hasSubscription ? (
            <View style={[styles.subBadge, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
              <Sparkles size={14} color={viridian} weight="fill" />
              <Txt size={13} weight="700" style={{ color: colors.text }}>
                {`Gói đang dùng: ${s.packageName}`}
                {s.remainingDays != null ? (
                  <Txt size={12} weight="600" style={{ color: viridian }}>{` · còn ${s.remainingDays} ngày`}</Txt>
                ) : null}
              </Txt>
            </View>
          ) : null}
        </View>

        {/* Checklist Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Txt weight="800" size={16} style={{ color: colors.text, marginBottom: 8 }}>
            Điều kiện kích hoạt nhận học viên
          </Txt>
          <CheckRow ok={s.termsAccepted} label="Đồng ý Điều khoản Hướng dẫn & Hỗ trợ" />
          <CheckRow ok={s.profileComplete} label="Hoàn thiện thông tin chuyên môn Mentor" />
          <CheckRow ok={s.hasCv} label="Đính kèm hồ sơ năng lực (CV)" />
          <CheckRow ok={s.bankInformationComplete} label="Khai báo tài khoản ngân hàng nhận thù lao" />
          <CheckRow ok={s.hasSubscription && s.subscriptionStatus === 'ACTIVE'} label="Kích hoạt gói thành viên Mentor" last />
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 10, marginTop: 16 }}>
          {!s.termsAccepted ? (
            <Button
              title="Xem & Chấp nhận điều khoản"
              textColor="#FFFFFF"
              style={{ backgroundColor: viridian, borderColor: viridian }}
              onPress={() => router.push('/mentoring/terms')}
            />
          ) : null}
          <Button
            title={s.hasMentorProfile ? 'Cập nhật hồ sơ chuyên môn Mentor' : 'Đăng ký hồ sơ Mentor'}
            textColor={s.termsAccepted ? '#FFFFFF' : undefined}
            variant={s.termsAccepted ? 'primary' : 'outline'}
            style={s.termsAccepted ? { backgroundColor: viridian, borderColor: viridian } : undefined}
            onPress={() => (s.termsAccepted ? router.push('/mentoring/register') : router.push('/mentoring/terms'))}
          />
          {s.profileComplete ? (
            <Button
              title={s.active ? 'Gia hạn / Nâng cấp gói Mentor' : 'Chọn gói kích hoạt Mentor'}
              variant="secondary"
              onPress={() => router.push('/mentoring/plans')}
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  subBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
})

export default withAlumniOnly(MentorStatusScreen)
