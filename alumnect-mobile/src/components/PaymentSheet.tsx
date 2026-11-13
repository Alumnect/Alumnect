import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, AppState, Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import * as Clipboard from 'expo-clipboard'
import * as WebBrowser from 'expo-web-browser'
import * as Haptics from 'expo-haptics'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library/legacy'
import { useKeepAwake } from 'expo-keep-awake'
import { ActionSheet } from './ActionSheet'
import { Button, Txt } from './ui'
import { Copy, Download } from './icons'
import { formatVnd, qrImageUrl } from '@/api/mentoring'
import type { PaymentStatus } from '@/api/mentoring'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

export interface CheckoutLike {
  orderCode: number
  amount: number
  description?: string
  qrCodeUrl?: string | null
  checkoutUrl: string
  accountNumber?: string | null
  accountName?: string | null
}

/** Giữ màn hình sáng khi đang hiện mã QR (để quét bằng máy khác không bị tắt màn hình). */
function KeepScreenOn() {
  useKeepAwake('payment-qr')
  return null
}

/** Tải ảnh QR (URL hoặc data URI) về bộ nhớ đệm rồi lưu vào thư viện ảnh. */
async function saveQrToLibrary(uri: string, orderCode: number) {
  const perm = await MediaLibrary.requestPermissionsAsync(true)
  if (!perm.granted) throw new Error('Bạn cần cho phép ứng dụng lưu ảnh vào thư viện.')
  const target = `${FileSystem.cacheDirectory}alumnect-qr-${orderCode}.png`
  if (uri.startsWith('data:')) {
    const base64 = uri.slice(uri.indexOf(',') + 1)
    await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 })
  } else {
    const res = await FileSystem.downloadAsync(uri, target)
    if (res.status !== 200) throw new Error('Không tải được ảnh QR, vui lòng thử lại.')
  }
  await MediaLibrary.saveToLibraryAsync(target)
}

/**
 * Bottom sheet thanh toán PayOS (UC83, UC95): VietQR + lưu QR vào thư viện + chạm để sao chép từng dòng / sao chép tất cả
 * + mở cổng PayOS. Trạng thái được kiểm tra mỗi 3 giây và ngay khi người dùng quay lại app (từ app ngân hàng / trình duyệt).
 */
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
  const [saving, setSaving] = useState(false)
  const done = useRef(false)
  const stopped = useRef(false)
  const checking = useRef(false)
  const orderCode = checkout?.orderCode

  const check = useCallback(async () => {
    if (orderCode == null || done.current || stopped.current || checking.current) return
    checking.current = true
    try {
      const r = await poll(orderCode)
      setStatus(r.paymentStatus)
      if (r.paymentStatus === 'PAID' && !done.current) {
        done.current = true
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        toast.success('Thanh toán thành công!')
        onPaid()
      } else if (r.isTerminal) {
        stopped.current = true
      }
    } catch {
      /* thử lại ở lần kiểm tra kế tiếp */
    } finally {
      checking.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode])

  useEffect(() => {
    if (orderCode == null) return
    done.current = false
    stopped.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('PENDING')
    const id = setInterval(check, 3000)
    // Quay lại app (sau khi chuyển khoản ở app ngân hàng) → kiểm tra ngay, không đợi lượt kế tiếp.
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') void check() })
    return () => { clearInterval(id); sub.remove() }
  }, [orderCode, check])

  const copy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text)
    Haptics.selectionAsync()
    toast.info(`Đã sao chép ${label}.`)
  }

  const failed = status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED'
  const qr = checkout ? qrImageUrl(checkout) : ''
  const content = checkout ? checkout.description || String(checkout.orderCode) : ''

  const saveQr = async () => {
    if (!checkout || saving) return
    setSaving(true)
    try {
      await saveQrToLibrary(qr, checkout.orderCode)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.success('Đã lưu mã QR vào thư viện ảnh. Mở app ngân hàng → Quét QR → chọn ảnh vừa lưu.')
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  const copyAll = () => {
    if (!checkout) return
    const lines = [
      checkout.accountNumber ? `Số tài khoản: ${checkout.accountNumber}` : null,
      checkout.accountName ? `Chủ tài khoản: ${checkout.accountName}` : null,
      `Số tiền: ${checkout.amount}`,
      `Nội dung: ${content}`,
    ].filter(Boolean)
    void copy(lines.join('\n'), 'toàn bộ thông tin chuyển khoản')
  }

  const rows: { label: string; value: string; copyValue: string; copyLabel: string; highlight?: boolean }[] = checkout
    ? [
        ...(checkout.accountNumber ? [{ label: 'Số tài khoản', value: checkout.accountNumber, copyValue: checkout.accountNumber, copyLabel: 'số tài khoản' }] : []),
        ...(checkout.accountName ? [{ label: 'Chủ tài khoản', value: checkout.accountName, copyValue: checkout.accountName, copyLabel: 'tên chủ tài khoản' }] : []),
        { label: 'Số tiền', value: formatVnd(checkout.amount), copyValue: String(checkout.amount), copyLabel: 'số tiền', highlight: true },
        { label: 'Nội dung', value: content, copyValue: content, copyLabel: 'nội dung chuyển khoản' },
      ]
    : []

  return (
    <ActionSheet visible={!!checkout} onClose={onClose} title="Thanh toán chuyển khoản">
      {checkout ? (
        <View style={{ alignItems: 'center', gap: 10 }}>
          {!failed ? <KeepScreenOn /> : null}
          <Image source={{ uri: qr }} style={{ width: 210, height: 210 }} contentFit="contain" />
          <Pressable
            onPress={saveQr}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Lưu mã QR vào thư viện ảnh"
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: pressed ? t.inputBg : t.surface, opacity: saving ? 0.6 : 1 })}
          >
            {saving ? <ActivityIndicator size="small" color={t.primary} /> : <Download size={16} color={t.primary} />}
            <Txt size={13} weight="700" color={t.primary}>{saving ? 'Đang lưu...' : 'Lưu ảnh QR'}</Txt>
          </Pressable>

          {/* Chạm vào từng dòng để sao chép */}
          <View style={{ alignSelf: 'stretch', borderRadius: 14, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
            {rows.map((r, i) => (
              <Pressable
                key={r.label}
                onPress={() => copy(r.copyValue, r.copyLabel)}
                accessibilityRole="button"
                accessibilityLabel={`Sao chép ${r.copyLabel}`}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10,
                  backgroundColor: pressed ? t.inputBg : t.card,
                  borderTopWidth: i ? 1 : 0, borderTopColor: t.divider,
                })}
              >
                <Txt muted size={12} style={{ width: 92 }}>{r.label}</Txt>
                <Txt size={r.highlight ? 16 : 13} weight={r.highlight ? '800' : '600'} color={r.highlight ? t.primary : t.text} style={{ flex: 1, textAlign: 'right' }} numberOfLines={2}>
                  {r.value}
                </Txt>
                <Copy size={16} color={t.textMuted} />
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
            <Button title="Sao chép tất cả" variant="outline" icon={<Copy size={16} color={t.text} />} style={{ flex: 1, minHeight: 44 }} onPress={copyAll} />
            <Button
              title="Mở PayOS"
              style={{ flex: 1, minHeight: 44 }}
              onPress={async () => {
                await WebBrowser.openBrowserAsync(checkout.checkoutUrl)
                void check() // đóng trình duyệt → kiểm tra ngay
              }}
            />
          </View>
          {failed ? (
            <Txt color={t.danger} weight="600">{status === 'EXPIRED' ? 'Giao dịch đã hết hạn.' : status === 'CANCELLED' ? 'Giao dịch đã bị hủy.' : 'Thanh toán thất bại.'}</Txt>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={t.primary} />
              <Txt muted size={13}>Chuyển khoản xong, quay lại app sẽ tự xác nhận...</Txt>
            </View>
          )}
          {onCancel && !failed ? <Button title="Hủy giao dịch" variant="ghost" onPress={onCancel} /> : null}
        </View>
      ) : null}
    </ActionSheet>
  )
}
