import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { Info, ShieldAlert } from '@/components/icons'
import { WalletView } from '@/components/WalletView'
import { walletApi } from '@/api/mentoringWallet'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/** Thu nhập Mentor: thù lao các Task đã nghiệm thu, tự động chi về tài khoản ngân hàng trong hồ sơ Mentor. */
export default function EarningsScreen() {
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

          <WalletView wallet={q.data} counterpartLabel="Học viên" emptyText="Chưa có khoản thù lao nào được ghi nhận." />
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
