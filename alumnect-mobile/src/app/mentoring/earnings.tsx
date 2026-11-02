import React from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { Info } from '@/components/icons'
import { WalletView } from '@/components/WalletView'
import { walletApi } from '@/api/mentoringWallet'
import { useTheme } from '@/theme'

/** Thu nhập Mentor: thù lao các Task đã nghiệm thu, tự động chi về tài khoản ngân hàng trong hồ sơ Mentor. */
export default function EarningsScreen() {
  const t = useTheme()
  const router = useRouter()
  const q = useQuery({ queryKey: ['mentoring-wallet', 'earnings'], queryFn: walletApi.earnings })
  return (
    <Screen>
      <Header title="Thu nhập" />
      {q.isLoading ? <Loading /> : q.isError ? <Empty text="Không tải được thu nhập." error={q.error} onRetry={() => { void q.refetch() }} /> : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, backgroundColor: t.infoTint, marginBottom: 12 }}>
            <Info size={16} color={t.info} />
            <Txt size={13} color={t.info} style={{ flex: 1 }}>Thù lao được chi tự động về tài khoản ngân hàng trong hồ sơ Mentor sau khi Học viên nghiệm thu Task.</Txt>
          </View>
          {q.data?.bankAccountRequired ? (
            <Card style={{ marginBottom: 14, borderLeftWidth: 4, borderLeftColor: t.danger }}>
              <Txt weight="700">Có khoản thù lao đang chờ tài khoản nhận tiền</Txt>
              <Txt muted size={13} style={{ marginVertical: 6 }}>Tài khoản ngân hàng trong hồ sơ Mentor chưa hợp lệ. Hệ thống sẽ chuyển lại sau khi bạn cập nhật.</Txt>
              <Button title="Cập nhật tài khoản" size="sm" onPress={() => router.push('/mentoring/register')} />
            </Card>
          ) : null}
          <WalletView wallet={q.data} counterpartLabel="Học viên" emptyText="Chưa có khoản thù lao nào." />
        </ScrollView>
      )}
    </Screen>
  )
}
