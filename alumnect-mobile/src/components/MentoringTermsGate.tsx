import React from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, FileText } from '@/components/icons'
import { Button, Loading, Screen, Txt } from './ui'
import { Header } from './Header'
import { BrandIcon } from './BrandIcon'
import { mentoringApi } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { errMsg } from '@/lib/toast'

/**
 * Cổng điều khoản Mentoring (UC90) — đồng bộ MentoringTermsGate của Web:
 * chưa đồng ý phiên bản điều khoản hiện hành thì không vào được các màn hình Mentoring.
 * Lỗi kiểm tra cũng không tự mở cổng.
 */
export function MentoringTermsGate({ children, header = true }: { children: React.ReactNode; header?: boolean }) {
  const { colors, viridian, viridianSoft } = useMentoringTheme()
  const router = useRouter()
  const q = useQuery({ queryKey: ['mentoring-terms'], queryFn: mentoringApi.termsStatus, staleTime: 60_000 })

  if (q.data?.accepted) return <>{children}</>

  const body = q.isLoading ? <Loading /> : q.isError ? (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: viridianSoft, marginBottom: 14 }}>
        <AlertTriangle size={26} color={viridian} />
      </View>
      <Txt weight="800" size={17} style={{ textAlign: 'center', color: colors.text }}>Không thể kiểm tra điều khoản</Txt>
      <Txt size={13} style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 6 }}>{errMsg(q.error)}</Txt>
      <Button title="Thử lại" onPress={() => { void q.refetch() }} loading={q.isRefetching} style={{ marginTop: 18, alignSelf: 'stretch', backgroundColor: viridian, borderColor: viridian }} textColor="#FFFFFF" />
    </View>
  ) : (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <View style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 20 }}>
        <BrandIcon name="writing" size={44} />
        <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.6, marginTop: 12 }}>ĐIỀU KHOẢN MENTORING</Txt>
        <Txt weight="800" size={20} style={{ color: colors.text, marginTop: 4 }}>Đồng ý điều khoản để bắt đầu</Txt>
        <Txt size={13} style={{ color: colors.textSecondary, lineHeight: 20, marginTop: 8 }}>
          Trước khi tìm mentor, gửi yêu cầu hay đăng ký làm Mentor, bạn cần đọc và đồng ý Điều khoản Hướng dẫn & Hỗ trợ
          {q.data?.currentVersion ? ` (phiên bản ${q.data.currentVersion})` : ''}.
        </Txt>
        <View style={{ gap: 8, marginTop: 14 }}>
          {['Quy trình thỏa thuận & thanh toán minh bạch', 'Cơ chế nghiệm thu, hoàn tiền và tranh chấp', 'Trách nhiệm của Học viên và Mentor'].map((l) => (
            <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={15} color={viridian} />
              <Txt size={13} style={{ color: colors.text, flex: 1 }}>{l}</Txt>
            </View>
          ))}
        </View>
        <Button
          title="Đọc & đồng ý điều khoản"
          icon={<FileText size={16} color="#FFFFFF" />}
          textColor="#FFFFFF"
          onPress={() => router.push('/mentoring/terms')}
          style={{ marginTop: 18, backgroundColor: viridian, borderColor: viridian }}
        />
      </View>
    </View>
  )

  return (
    <Screen bg={colors.bg}>
      {header ? <Header title="Mentoring" /> : null}
      {body}
    </Screen>
  )
}
