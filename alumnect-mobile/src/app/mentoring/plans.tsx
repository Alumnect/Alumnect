import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { PaymentSheet } from '@/components/PaymentSheet'
import { formatVnd, mentoringApi } from '@/api/mentoring'
import type { CheckoutResponse } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { toast, errMsg } from '@/lib/toast'
import { CheckCircle2, CreditCard, Sparkles } from '@/components/icons'

/** UC82–83: chọn gói mentor và thanh toán PayOS (Meetup x Kakao Pricing Cards — Cam - Trắng - Đen). */
export default function PlansScreen() {
  const { colors, viridian, viridianSoft } = useMentoringTheme()
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
    <Screen bg={colors.bg}>
      <Header title="Gói thành viên Mentor" subtitle="Kích hoạt hồ sơ & nhận yêu cầu từ sinh viên" />
      {q.isLoading ? (
        <Loading />
      ) : (
        <FlashList
          data={q.data ?? []}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
          ListHeaderComponent={
            <Txt size={13} style={{ color: colors.textSecondary, marginBottom: 14, lineHeight: 20 }}>
              Chọn gói phù hợp để hiển thị hồ sơ trên danh bạ chuyên gia, nhận yêu cầu cố vấn 1:1 và tham gia bảng xếp hạng Mentor.
            </Txt>
          }
          ListEmptyComponent={<Empty error={q.error} onRetry={() => { void q.refetch() }} text="Hiện chưa có gói nào." />}
          renderItem={({ item, index }) => {
            const featured = index === 0
            return (
              <View
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: featured ? viridian : colors.border,
                    borderWidth: featured ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.planTopRow}>
                  <Txt weight="800" size={18} style={{ color: colors.text, flex: 1 }}>
                    {item.name}
                  </Txt>
                  {featured && (
                    <View style={[styles.popularPill, { backgroundColor: viridianSoft }]}>
                      <Sparkles size={12} color={viridian} weight="fill" />
                      <Txt size={11} weight="800" style={{ color: viridian }}>
                        Đề xuất
                      </Txt>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginVertical: 10 }}>
                  <Txt size={28} weight="800" style={{ color: viridian, fontVariant: ['tabular-nums'] }}>
                    {formatVnd(item.price)}
                  </Txt>
                  <Txt size={13} weight="600" style={{ color: colors.textSecondary }}>
                    {`/ ${item.durationMonths} tháng`}
                  </Txt>
                </View>

                {item.description ? (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
                    <CheckCircle2 size={16} color={viridian} weight="fill" style={{ marginTop: 2 }} />
                    <Txt size={13} style={{ color: colors.textSecondary, lineHeight: 20, flex: 1 }}>
                      {item.description}
                    </Txt>
                  </View>
                ) : null}

                <Button
                  title="Chọn gói & Thanh toán PayOS"
                  textColor={featured ? '#FFFFFF' : undefined}
                  variant={featured ? 'primary' : 'secondary'}
                  icon={<CreditCard size={16} color={featured ? '#FFFFFF' : viridian} weight="fill" />}
                  style={{
                    marginTop: 16,
                    ...(featured ? { backgroundColor: viridian, borderColor: viridian } : {}),
                  }}
                  onPress={() => pay.mutate(item.id)}
                  loading={pay.isPending && pay.variables === item.id}
                />
              </View>
            )
          }}
        />
      )}
      <PaymentSheet checkout={checkout} poll={mentoringApi.paymentStatus} onPaid={paid} onClose={() => setCheckout(null)} onCancel={cancel} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  planCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  popularPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
})
