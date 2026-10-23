import React from 'react'
import { ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
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
      {q.isLoading ? <Loading /> : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Txt muted size={13} style={{ marginBottom: 12 }}>Thù lao được chi tự động về tài khoản ngân hàng trong hồ sơ Mentor sau khi Học viên nghiệm thu Task.</Txt>
          {q.data?.bankAccountRequired ? (
            <Card style={{ marginBottom: 14, borderColor: t.danger }}>
              <Txt weight="700">Có khoản thù lao đang chờ tài khoản nhận tiền</Txt>
              <Txt muted size={13} style={{ marginVertical: 6 }}>Tài khoản ngân hàng trong hồ sơ Mentor chưa hợp lệ. Hệ thống sẽ chuyển lại sau khi bạn cập nhật.</Txt>
              <Button title="Cập nhật tài khoản" onPress={() => router.push('/mentoring/register')} style={{ height: 40 }} />
            </Card>
          ) : null}
          <WalletView wallet={q.data} counterpartLabel="Học viên" emptyText="Chưa có khoản thù lao nào." />
        </ScrollView>
      )}
    </Screen>
  )
}
