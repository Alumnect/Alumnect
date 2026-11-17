import React, { useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { ArrowDownLeft, Clock, Receipt, ShieldAlert, XCircle } from '@/components/icons'
import { WALLET_STATUS_LABEL } from '@/api/mentoringWallet'
import type { Wallet, WalletItem } from '@/api/mentoringWallet'
import { taskApi } from '@/api/mentoringTask'
import { toast, errMsg } from '@/lib/toast'
import { SheetModal } from '@/components/SheetModal'
import { formatVnd } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'

const QUICK_REASONS = [
  'Chưa nhận được tiền thù lao / hoàn tiền vào tài khoản',
  'Lệnh chi trả / hoàn tiền báo lỗi (FAILED)',
  'Số tiền nhận được sai lệch so với thỏa thuận',
  'Lỗi tài khoản ngân hàng / cần chi trả thủ công',
]

/** Tổng quan + danh sách khoản thù lao / hoàn tiền (KakaoPay x Meetup Ledger 2026 — Cam - Trắng - Đen). */
export function WalletView({ wallet, counterpartLabel, emptyText }: { wallet?: Wallet; counterpartLabel: string; emptyText: string }) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<WalletItem | null>(null)
  const [reason, setReason] = useState('')
  const [selectedQuick, setSelectedQuick] = useState<string | null>(null)

  const pingMutation = useMutation({
    mutationFn: ({ taskId, text, issueType }: { taskId: number; text: string; issueType?: string }) =>
      taskApi.pingAdminFinance(taskId, { reason: text, issueType }),
    onSuccess: () => {
      toast.success('Đã gửi phản ánh sự cố dòng tiền đến Ban Quản Trị!')
      setSelectedItem(null)
      setReason('')
      setSelectedQuick(null)
      void queryClient.invalidateQueries({ queryKey: ['mentoring-wallet'] })
    },
    onError: (e) => {
      toast.error(errMsg(e, 'Không thể gửi phản ánh, vui lòng thử lại sau.'))
    },
  })

  const handleSendPing = () => {
    if (!selectedItem?.taskId) return
    const text = reason.trim() || selectedQuick || ''
    if (text.length < 5) {
      toast.info('Vui lòng nhập lý do cụ thể (tối thiểu 5 ký tự).')
      return
    }
    let issueType = 'OTHER'
    if (selectedQuick?.includes('hoàn tiền')) issueType = 'REFUND_NOT_RECEIVED'
    else if (selectedQuick?.includes('thù lao')) issueType = 'PAYOUT_NOT_RECEIVED'
    else if (selectedQuick?.includes('sai lệch')) issueType = 'WRONG_AMOUNT'
    else if (selectedQuick?.includes('ngân hàng')) issueType = 'ACCOUNT_ERROR'

    pingMutation.mutate({ taskId: selectedItem.taskId, text, issueType })
  }

  const total = (wallet?.totalReceived ?? 0) + (wallet?.totalProcessing ?? 0)

  return (
    <View>
      {/* Hero Wallet Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? '#1E140C' : viridianSoft,
            borderColor: isDark ? '#4A2C16' : '#FAD9C2',
          },
        ]}
      >
        <View style={styles.heroHeader}>
          <View>
            <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Tổng giá trị giao dịch
            </Txt>
            <Txt size={30} weight="800" style={{ color: colors.text, marginTop: 4, fontVariant: ['tabular-nums'] }}>
              {formatVnd(total)}
            </Txt>
          </View>
          <BrandIcon name="coin" size={46} />
        </View>

        <View style={[styles.statGrid, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
          <View style={styles.statCol}>
            <Txt size={11} weight="600" style={{ color: colors.textTertiary }}>
              Đã nhận
            </Txt>
            <Txt weight="800" size={14} style={{ color: '#16A34A', marginTop: 2, fontVariant: ['tabular-nums'] }}>
              {formatVnd(wallet?.totalReceived ?? 0)}
            </Txt>
          </View>
          <View style={[styles.vDivider, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.statCol}>
            <Txt size={11} weight="600" style={{ color: colors.textTertiary }}>
              Đang xử lý
            </Txt>
            <Txt weight="800" size={14} style={{ color: viridian, marginTop: 2, fontVariant: ['tabular-nums'] }}>
              {formatVnd(wallet?.totalProcessing ?? 0)}
            </Txt>
          </View>
          <View style={[styles.vDivider, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.statCol}>
            <Txt size={11} weight="600" style={{ color: colors.textTertiary }}>
              Thất bại
            </Txt>
            <Txt weight="800" size={14} style={{ color: '#DC2626', marginTop: 2, fontVariant: ['tabular-nums'] }}>
              {formatVnd(wallet?.totalFailed ?? 0)}
            </Txt>
          </View>
        </View>
      </View>

      <Txt weight="800" size={16} style={{ color: colors.text, marginBottom: 10 }}>
        Lịch sử dòng tiền & giải ngân
      </Txt>

      {(wallet?.items ?? []).length === 0 ? (
        <Empty icon={<Receipt size={30} color={viridian} />} title="Chưa có giao dịch" text={emptyText} />
      ) : (
        <View style={[styles.ledgerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(wallet?.items ?? []).map((it, i, arr) => (
            <View
              key={it.ledgerId}
              style={[
                styles.ledgerRow,
                i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
              ]}
            >
              <View
                style={[
                  styles.txIconBox,
                  {
                    backgroundColor:
                      it.status === 'SUCCEEDED'
                        ? isDark
                          ? '#142E1F'
                          : '#EAFBF0'
                        : it.status === 'FAILED'
                          ? isDark
                            ? '#2B1414'
                            : '#FEF2F2'
                          : viridianSoft,
                  },
                ]}
              >
                {it.status === 'SUCCEEDED' ? (
                  <ArrowDownLeft size={18} color="#16A34A" weight="bold" />
                ) : it.status === 'FAILED' ? (
                  <XCircle size={18} color="#DC2626" weight="bold" />
                ) : (
                  <Clock size={18} color={viridian} weight="bold" />
                )}
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight="700" size={14} style={{ color: colors.text, lineHeight: 20 }}>
                  {it.taskTitle || `Task #${it.taskId ?? '—'}`}
                </Txt>
                <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
                  {[
                    it.counterpartName ? `${counterpartLabel}: ${it.counterpartName}` : null,
                    new Date(it.transactedAt ?? it.createdAt).toLocaleDateString('vi-VN'),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Txt>
                {it.note ? (
                  <Txt size={12} style={{ color: colors.textTertiary, marginTop: 2 }} numberOfLines={2}>
                    {it.note}
                  </Txt>
                ) : null}
              </View>

              <View style={{ alignItems: 'flex-end', gap: 5, maxWidth: '44%' }}>
                <Txt weight="800" size={14} style={{ color: viridian, fontVariant: ['tabular-nums'], textAlign: 'right' }}>
                  {formatVnd(it.amount)}
                </Txt>
                <Tag
                  label={WALLET_STATUS_LABEL[it.status] ?? itemStatus(it.status)}
                  tone={it.status === 'SUCCEEDED' ? 'success' : it.status === 'FAILED' ? 'danger' : 'warning'}
                />
                {it.status === 'FAILED' && it.taskId ? (
                  <Pressable
                    onPress={() => setSelectedItem(it)}
                    style={({ pressed }) => [
                      styles.reportBtn,
                      {
                        backgroundColor: isDark ? '#2B1414' : '#FEF2F2',
                        borderColor: '#DC2626',
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <ShieldAlert size={12} color="#DC2626" weight="bold" />
                    <Txt size={11} weight="700" style={{ color: '#DC2626' }}>
                      Báo cáo
                    </Txt>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* SheetModal Báo cáo sự cố dòng tiền */}
      <SheetModal
        visible={Boolean(selectedItem)}
        onClose={() => {
          setSelectedItem(null)
          setReason('')
          setSelectedQuick(null)
        }}
      >
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.txIconBox, { backgroundColor: isDark ? '#2B1414' : '#FEF2F2' }]}>
              <ShieldAlert size={20} color="#DC2626" weight="bold" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={16} weight="800" style={{ color: colors.text }}>
                Báo cáo sự cố dòng tiền
              </Txt>
              <Txt size={12} style={{ color: colors.textSecondary }}>
                Gửi Ban Quản Trị đối soát cho {selectedItem?.taskTitle || `Task #${selectedItem?.taskId ?? ''}`}
              </Txt>
            </View>
          </View>

          {selectedItem ? (
            <View
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor: isDark ? '#251313' : '#FFF5F5',
                borderWidth: 1,
                borderColor: '#FCA5A5',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt size={12} weight="800" style={{ color: '#DC2626' }}>
                  {selectedItem.taskId ? `Task #${selectedItem.taskId}` : 'Giao dịch'}
                </Txt>
                <Txt size={12} weight="800" style={{ color: colors.text }}>
                  {formatVnd(selectedItem.amount)}
                </Txt>
              </View>
              {selectedItem.note ? (
                <Txt size={11.5} style={{ color: '#DC2626', marginTop: 4 }}>
                  Chi tiết lỗi: {selectedItem.note}
                </Txt>
              ) : null}
            </View>
          ) : null}

          <Txt size={12} weight="700" style={{ color: colors.textSecondary, marginTop: 14, marginBottom: 8, textTransform: 'uppercase' }}>
            Chọn nhanh sự cố
          </Txt>
          <View style={{ gap: 6 }}>
            {QUICK_REASONS.map((item) => {
              const active = selectedQuick === item
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    setSelectedQuick(active ? null : item)
                    if (!active) setReason(item)
                  }}
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: active ? viridian : colors.borderSubtle,
                    backgroundColor: active ? (isDark ? '#14261C' : viridianSoft) : colors.card,
                  }}
                >
                  <Txt size={12.5} weight={active ? '700' : '400'} style={{ color: active ? viridian : colors.text }}>
                    {item}
                  </Txt>
                </Pressable>
              )
            })}
          </View>

          <Txt size={12} weight="700" style={{ color: colors.textSecondary, marginTop: 14, marginBottom: 6, textTransform: 'uppercase' }}>
            Chi tiết phản ánh
          </Txt>
          <TextInput
            multiline
            numberOfLines={3}
            value={reason}
            onChangeText={setReason}
            placeholder="Mô tả cụ thể sự cố (thời gian kiểm tra, số tài khoản, thắc mắc...)"
            placeholderTextColor={colors.textTertiary}
            style={{
              minHeight: 70,
              textAlignVertical: 'top',
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: isDark ? colors.surface : '#F8F9FA',
              color: colors.text,
              fontSize: 13,
            }}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Button
              title="Đóng"
              variant="outline"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => {
                setSelectedItem(null)
                setReason('')
                setSelectedQuick(null)
              }}
            />
            <Button
              title={pingMutation.isPending ? 'Đang gửi...' : 'Gửi cho Admin'}
              size="sm"
              textColor="#FFFFFF"
              disabled={pingMutation.isPending}
              style={{ flex: 2, backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              onPress={handleSendPing}
            />
          </View>
        </View>
      </SheetModal>
    </View>
  )
}

function itemStatus(s: string) {
  return s
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  vDivider: {
    width: 1,
    height: 26,
  },
  ledgerCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
})
