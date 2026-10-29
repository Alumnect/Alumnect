import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Image } from 'expo-image'
import * as Clipboard from 'expo-clipboard'
import * as WebBrowser from 'expo-web-browser'
import * as Haptics from 'expo-haptics'
import { ActionSheet } from './ActionSheet'
import { Button, Txt } from './ui'
import { formatVnd, qrImageUrl } from '@/api/mentoring'
import type { PaymentStatus } from '@/api/mentoring'
import { useTheme } from '@/theme'
import { toast } from '@/lib/toast'

export interface CheckoutLike {
  orderCode: number
  amount: number
  description?: string
  qrCodeUrl?: string | null
  checkoutUrl: string
  accountNumber?: string | null
  accountName?: string | null
}

/** Bottom sheet thanh toán PayOS (UC83, UC95): VietQR + sao chép + mở cổng + polling mỗi 3 giây. */
export function PaymentSheet({
  checkout,
  poll,
  onPaid,
  onClose,
  onCancel,
}: {
  checkout: CheckoutLike | null
  poll: (orderCode: number) => Promise<{ paymentStatus: PaymentStatus; isTerminal?: boolean }>
  onPaid: () => void
  onClose: () => void
  onCancel?: () => void
}) {
  const t = useTheme()
  const [status, setStatus] = useState<PaymentStatus>('PENDING')
  const done = useRef(false)

  useEffect(() => {
    if (!checkout) return
    done.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('PENDING')
    const id = setInterval(async () => {
      try {
        const r = await poll(checkout.orderCode)
        setStatus(r.paymentStatus)
        if (r.paymentStatus === 'PAID' && !done.current) {
          done.current = true
          clearInterval(id)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          toast.success('Thanh toán thành công!')
          onPaid()
        } else if (r.isTerminal) {
          clearInterval(id)
        }
      } catch {
        /* thử lại ở lần poll kế tiếp */
      }
    }, 3000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout?.orderCode])

  const copy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text)
    toast.info(`Đã sao chép ${label}.`)
  }

  const failed = status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED'

  return (
    <ActionSheet visible={!!checkout} onClose={onClose} title="Thanh toán chuyển khoản">
      {checkout ? (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Image source={{ uri: qrImageUrl(checkout) }} style={{ width: 220, height: 220 }} contentFit="contain" />
          <Txt size={20} weight="800" color={t.primary}>{formatVnd(checkout.amount)}</Txt>
          {checkout.accountName ? <Txt muted size={13}>{checkout.accountName}{checkout.accountNumber ? ` · ${checkout.accountNumber}` : ''}</Txt> : null}
          <Txt muted size={12} style={{ textAlign: 'center' }}>{checkout.description ?? ''}</Txt>
          <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
            <Button title="Sao chép số tiền" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => copy(String(checkout.amount), 'số tiền')} />
            <Button title="Sao chép nội dung" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => copy(checkout.description || String(checkout.orderCode), 'nội dung chuyển khoản')} />
          </View>
          <Button title="Mở trang thanh toán PayOS" style={{ alignSelf: 'stretch' }} onPress={() => WebBrowser.openBrowserAsync(checkout.checkoutUrl)} />
          {failed ? (
            <Txt color={t.danger} weight="600">{status === 'EXPIRED' ? 'Giao dịch đã hết hạn.' : status === 'CANCELLED' ? 'Giao dịch đã bị hủy.' : 'Thanh toán thất bại.'}</Txt>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={t.primary} />
              <Txt muted size={13}>Đang chờ xác nhận thanh toán...</Txt>
            </View>
          )}
          {onCancel && !failed ? <Button title="Hủy giao dịch" variant="ghost" onPress={onCancel} /> : null}
        </View>
      ) : null}
    </ActionSheet>
  )
}
