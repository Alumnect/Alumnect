import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { WalletView } from '@/components/WalletView'
import { walletApi } from '@/api/mentoringWallet'
import type { RefundAccount } from '@/api/mentoringWallet'
import { toast, errMsg } from '@/lib/toast'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { Check, CheckCircle2, Landmark, ShieldAlert } from '@/components/icons'

interface Bank {
  bin: string
  name: string
}

async function fetchBanks(): Promise<Bank[]> {
  const res = await fetch('https://api.vietqr.io/v2/banks')
  const body = (await res.json()) as { data: { bin: string; shortName: string; transferSupported: number }[] }
  return body.data
    .filter((b) => b.transferSupported === 1 && /^\d{6}$/.test(b.bin))
    .map((b) => ({ bin: b.bin, name: b.shortName }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

/** Hoàn tiền Mentoring: khai báo tài khoản nhận hoàn tiền + các khoản hoàn (KakaoPay x Meetup 2026). */
export default function RefundsScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const qc = useQueryClient()
  const refunds = useQuery({ queryKey: ['mentoring-wallet', 'refunds'], queryFn: walletApi.refunds })
  const account = useQuery({ queryKey: ['mentoring-wallet', 'refund-account'], queryFn: walletApi.refundAccount })
  const banks = useQuery({ queryKey: ['vietqr-banks'], queryFn: fetchBanks, staleTime: Infinity })

  const [bank, setBank] = useState<Bank | null>(null)
  const [bankQ, setBankQ] = useState('')
  const [number, setNumber] = useState('')
  const [holder, setHolder] = useState('')

  useEffect(() => {
    const a = account.data
    if (a) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setBank({ bin: a.bankBin, name: a.bankName })
      setNumber(a.bankAccountNumber)
      setHolder(a.bankAccountHolder)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [account.data])

  const valid = !!bank && /^\d{6,30}$/.test(number) && holder.trim().length > 0
  const save = useMutation({
    mutationFn: () => {
      const p: RefundAccount = {
        bankName: bank!.name,
        bankBin: bank!.bin,
        bankAccountNumber: number,
        bankAccountHolder: holder.trim().toUpperCase(),
      }
      return walletApi.saveRefundAccount(p)
    },
    onSuccess: () => {
      toast.success('Đã lưu tài khoản nhận hoàn tiền')
      qc.invalidateQueries({ queryKey: ['mentoring-wallet'] })
      qc.invalidateQueries({
        predicate: (q) => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('mentoring'),
      })
    },
    onError: (e) => toast.error(errMsg(e, 'Không thể lưu tài khoản')),
  })

  const shown = (banks.data ?? []).filter((b) => b.name.toLowerCase().includes(bankQ.toLowerCase())).slice(0, 10)
  const saved = account.data

  return (
    <Screen bg={colors.bg}>
      <Header
        title="Hoàn tiền & Tranh chấp"
        subtitle="Bảo vệ quyền lợi học viên & giải ngân tự động qua VietQR"
      />
      {refunds.isLoading || account.isLoading ? (
        <Loading />
      ) : refunds.isError || account.isError ? (
        <Empty
          text="Không tải được thông tin hoàn tiền."
          error={refunds.error ?? account.error}
          onRetry={() => {
            void Promise.all([refunds.refetch(), account.refetch()])
          }}
        />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {/* Warning Banner if Pending Refund Needs Bank Account */}
            {refunds.data?.bankAccountRequired ? (
              <View style={[styles.alertCard, { backgroundColor: isDark ? '#2B1414' : '#FEF2F2', borderColor: '#DC2626' }]}>
                <ShieldAlert size={20} color="#DC2626" weight="fill" />
                <View style={{ flex: 1 }}>
                  <Txt weight="800" size={14} style={{ color: '#DC2626' }}>
                    Có khoản hoàn tiền đang chờ tài khoản nhận
                  </Txt>
                  <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
                    Khai báo tài khoản ngân hàng bên dưới, hệ thống sẽ tự động giải ngân ngay sau khi lưu.
                  </Txt>
                </View>
              </View>
            ) : null}

            {/* Bank Account Card */}
            <View style={[styles.bankCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.bankHeader}>
                <View style={[styles.bankIconWrap, { backgroundColor: viridianSoft }]}>
                  <Landmark size={20} color={viridian} weight="bold" />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt weight="800" size={16} style={{ color: colors.text }}>
                    Tài khoản nhận hoàn tiền
                  </Txt>
                  <Txt size={12} style={{ color: saved ? '#16A34A' : viridian, fontWeight: '600', marginTop: 2 }}>
                    {saved
                      ? `Đã liên kết: ${saved.bankName} •••${saved.bankAccountNumber.slice(-4)} · ${saved.bankAccountHolder}`
                      : 'Chưa khai báo — bắt buộc trước khi gửi/đồng ý hòa giải'}
                  </Txt>
                </View>
                {saved && <CheckCircle2 size={20} color="#16A34A" weight="fill" />}
              </View>

              <Txt size={12} weight="700" style={{ color: colors.textSecondary, marginBottom: 6 }}>
                Ngân hàng thụ hưởng: <Txt size={12} weight="800" style={{ color: viridian }}>{bank?.name ?? 'Chưa chọn'}</Txt>
              </Txt>

              <Input value={bankQ} onChangeText={setBankQ} placeholder="Tìm nhanh ngân hàng (VCB, MB, Techcombank...)" />

              <View style={styles.bankChipWrap}>
                {shown.map((b) => {
                  const active = bank?.bin === b.bin
                  return (
                    <Pressable
                      key={b.bin}
                      onPress={() => setBank(b)}
                      style={[
                        styles.bankChip,
                        {
                          backgroundColor: active ? (isDark ? viridian : colors.actionBg) : colors.surface,
                          borderColor: active ? (isDark ? viridian : colors.actionBg) : colors.border,
                        },
                      ]}
                    >
                      {active && <Check size={12} color={isDark ? '#FFFFFF' : colors.actionText} weight="bold" />}
                      <Txt
                        size={12}
                        weight={active ? '700' : '600'}
                        style={{ color: active ? (isDark ? '#FFFFFF' : colors.actionText) : colors.text }}
                      >
                        {b.name}
                      </Txt>
                    </Pressable>
                  )
                })}
              </View>

              <Input
                label="Số tài khoản ngân hàng"
                placeholder="Nhập chính xác số tài khoản..."
                value={number}
                onChangeText={(v) => setNumber(v.replace(/\D/g, ''))}
                keyboardType="number-pad"
              />
              <Input
                label="Tên chủ tài khoản (Không dấu, IN HOA)"
                placeholder="VD: NGUYEN VAN A"
                value={holder}
                onChangeText={setHolder}
                autoCapitalize="characters"
              />
              <Button
                title="Lưu tài khoản nhận hoàn tiền"
                textColor="#FFFFFF"
                onPress={() => save.mutate()}
                loading={save.isPending}
                disabled={!valid}
                style={{
                  backgroundColor: valid ? viridian : colors.border,
                  borderColor: valid ? viridian : colors.border,
                }}
              />
            </View>

            <WalletView wallet={refunds.data} counterpartLabel="Mentor" emptyText="Chưa có khoản hoàn tiền nào phát sinh." />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  bankCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  bankIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
})
