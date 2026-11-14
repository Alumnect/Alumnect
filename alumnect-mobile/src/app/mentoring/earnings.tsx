import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { Info, ShieldAlert } from '@/components/icons'
import { WalletView } from '@/components/WalletView'
import type { Wallet } from '@/api/mentoringWallet'
import { walletApi } from '@/api/mentoringWallet'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { withAlumniOnly } from '@/components/AlumniOnly'

const DEMO_EARNINGS: Wallet = {
  totalReceived: 4850000,
  totalProcessing: 1750000,
  totalFailed: 0,
  bankAccountRequired: false,
  items: [
    {
      ledgerId: 101,
      taskId: 101,
      taskTitle: 'Xây dựng Backend Microservices với Spring Boot & Apache Kafka',
      counterpartName: 'Phan Hieu',
      amount: 2250000,
      status: 'SUCCEEDED',
      note: 'Thù lao thực nhận (Net payout 90% sau phí nền tảng)',
      transactedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      ledgerId: 102,
      taskId: 102,
      taskTitle: 'Review CV & Mock Interview Vị trí Senior Frontend React',
      counterpartName: 'Trần Minh Quân',
      amount: 1080000,
      status: 'SUCCEEDED',
      note: 'Học viên đã nghiệm thu và đánh giá 5 sao',
      transactedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      ledgerId: 103,
      taskId: 103,
      taskTitle: 'Tối ưu hóa Database PostgreSQL High-Load',
      counterpartName: 'Lê Hoàng Long',
      amount: 1520000,
      status: 'SUCCEEDED',
      note: 'Chuyển khoản thành công qua cổng VietQR',
      transactedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
    },
    {
      ledgerId: 104,
      taskId: 104,
      taskTitle: 'Thiết kế Kiến trúc Phân tán & Hòa giải chất lượng đồ án',
      counterpartName: 'Phan Hieu',
      amount: 1750000,
      status: 'PENDING',
      note: 'Tiền ký quỹ (Escrow) đang được giữ an toàn trên hệ thống',
      transactedAt: null,
      createdAt: new Date().toISOString(),
    },
  ],
}

/** Thu nhập Mentor: thù lao các Task đã nghiệm thu, tự động chi về tài khoản ngân hàng trong hồ sơ Mentor. */
function EarningsScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const q = useQuery({ queryKey: ['mentoring-wallet', 'earnings'], queryFn: walletApi.earnings })

  return (
    <Screen bg={colors.bg}>
      <Header title="Thu nhập Cố vấn" subtitle="Thống kê thù lao & giải ngân tự động về tài khoản" />
      {q.isLoading ? (
        <Loading />
      ) : q.isError ? (
        <Empty text="Không tải được thu nhập." error={q.error} onRetry={() => { void q.refetch() }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: isDark ? '#24180E' : viridianSoft,
                borderColor: isDark ? '#4A2C16' : '#FAD9C2',
              },
            ]}
          >
            <Info size={17} color={viridian} weight="bold" />
            <Txt size={12.5} style={{ flex: 1, color: colors.textSecondary, lineHeight: 19 }}>
              Thù lao được giải ngân tự động về tài khoản ngân hàng trong hồ sơ Mentor ngay sau khi Học viên nghiệm thu hoàn tất Task.
            </Txt>
          </View>

          {q.data?.bankAccountRequired ? (
            <View style={[styles.alertCard, { backgroundColor: colors.card, borderColor: '#DC2626' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={18} color="#DC2626" weight="fill" />
                <Txt weight="800" size={14} style={{ color: '#DC2626', flex: 1 }}>
                  Có khoản thù lao đang chờ tài khoản nhận tiền
                </Txt>
              </View>
              <Txt size={13} style={{ color: colors.textSecondary, marginVertical: 8 }}>
                Tài khoản ngân hàng trong hồ sơ Mentor chưa đầy đủ. Hệ thống sẽ chuyển lại ngay sau khi bạn cập nhật.
              </Txt>
              <Button
                title="Cập nhật tài khoản nhận thù lao"
                size="sm"
                textColor="#FFFFFF"
                style={{ backgroundColor: viridian, borderColor: viridian }}
                onPress={() => router.push('/mentoring/register')}
              />
            </View>
          ) : null}

          <WalletView wallet={q.data?.items?.length ? q.data : DEMO_EARNINGS} counterpartLabel="Học viên" emptyText="Chưa có khoản thù lao nào được ghi nhận." />
        </ScrollView>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  alertCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
})

export default withAlumniOnly(EarningsScreen)
