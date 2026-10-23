import React, { useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { PaymentSheet } from '@/components/PaymentSheet'
import { formatVnd, mentoringApi } from '@/api/mentoring'
import type { CheckoutResponse } from '@/api/mentoring'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC82–83: chọn gói mentor và thanh toán PayOS. */
export default function PlansScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null)
  const q = useQuery({ queryKey: ['mentor-packages'], queryFn: mentoringApi.packages })

  const pay = useMutation({
    mutationFn: async (packageId: number) => {
      await mentoringApi.selectPackage(packageId)
      return mentoringApi.checkout(packageId)
    },
    onSuccess: setCheckout,
    onError: (e) => toast.error(errMsg(e)),
  })

  const paid = () => {
    setCheckout(null)
    qc.invalidateQueries({ queryKey: ['mentoring-status'] })
    toast.success('Gói mentor của bạn đã được kích hoạt.')
    router.replace('/mentoring/status')
  }
  const cancel = async () => {
    if (checkout) await mentoringApi.cancelPayment(checkout.orderCode).catch(() => {})
    setCheckout(null)
  }

  return (
    <Screen>
      <Header title="Gói mentor" />
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={q.data ?? []}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Empty text="Hiện chưa có gói nào." />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 12 }}>
              <Txt weight="800" size={18}>{item.name}</Txt>
              <Txt size={24} weight="800" color={t.primary} style={{ marginVertical: 4 }}>{formatVnd(item.price)}</Txt>
              <Txt muted>{item.durationMonths} tháng{item.description ? ` · ${item.description}` : ''}</Txt>
              <Button title="Chọn gói & thanh toán" style={{ marginTop: 12 }} onPress={() => pay.mutate(item.id)} loading={pay.isPending && pay.variables === item.id} />
            </Card>
          )}
        />
      )}
      <PaymentSheet checkout={checkout} poll={mentoringApi.paymentStatus} onPaid={paid} onClose={() => setCheckout(null)} onCancel={cancel} />
    </Screen>
  )
}
