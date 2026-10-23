import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Chip, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { WalletView } from '@/components/WalletView'
import { walletApi } from '@/api/mentoringWallet'
import type { RefundAccount } from '@/api/mentoringWallet'
import { toast, errMsg } from '@/lib/toast'
import { useTheme } from '@/theme'

interface Bank { bin: string; name: string }

async function fetchBanks(): Promise<Bank[]> {
  const res = await fetch('https://api.vietqr.io/v2/banks')
  const body = (await res.json()) as { data: { bin: string; shortName: string; transferSupported: number }[] }
  return body.data
    .filter((b) => b.transferSupported === 1 && /^\d{6}$/.test(b.bin))
    .map((b) => ({ bin: b.bin, name: b.shortName }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

/** Hoàn tiền Mentoring: khai báo tài khoản nhận hoàn tiền + các khoản hoàn. Bắt buộc trước khi gửi/đồng ý thỏa thuận dừng Task. */
export default function RefundsScreen() {
  const t = useTheme()
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
      const p: RefundAccount = { bankName: bank!.name, bankBin: bank!.bin, bankAccountNumber: number, bankAccountHolder: holder.trim().toUpperCase() }
      return walletApi.saveRefundAccount(p)
    },
    onSuccess: () => {
      toast.success('Đã lưu tài khoản nhận hoàn tiền')
      qc.invalidateQueries({ queryKey: ['mentoring-wallet'] })
      qc.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('mentoring') })
    },
    onError: (e) => toast.error(errMsg(e, 'Không thể lưu tài khoản')),
  })

  const shown = (banks.data ?? []).filter((b) => b.name.toLowerCase().includes(bankQ.toLowerCase())).slice(0, 8)
  const saved = account.data

  return (
    <Screen>
      <Header title="Hoàn tiền" />
      {refunds.isLoading || account.isLoading ? <Loading /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Txt muted size={13} style={{ marginBottom: 12 }}>Khoản hoàn khi Task dừng theo thỏa thuận hoặc được Ban Quản Trị phân xử sẽ chuyển về tài khoản bạn khai báo.</Txt>
            {refunds.data?.bankAccountRequired ? (
              <Card style={{ marginBottom: 12, borderColor: t.danger }}>
                <Txt weight="700">Có khoản hoàn tiền đang chờ tài khoản</Txt>
                <Txt muted size={13}>Khai báo tài khoản bên dưới, hệ thống sẽ chuyển tiền ngay sau khi lưu.</Txt>
              </Card>
            ) : null}
            <Card style={{ marginBottom: 16 }}>
              <Txt weight="700" size={16}>Tài khoản nhận hoàn tiền</Txt>
              <Txt size={12} color={saved ? t.success : t.primary} style={{ marginVertical: 6 }}>
                {saved ? `Đã khai báo: ${saved.bankName} ••• ${saved.bankAccountNumber.slice(-4)} · ${saved.bankAccountHolder}` : 'Chưa khai báo — bắt buộc trước khi gửi hoặc đồng ý thỏa thuận dừng Task.'}
              </Txt>
              <Txt muted size={13} style={{ marginBottom: 6 }}>Ngân hàng: {bank?.name ?? 'Chưa chọn'}</Txt>
              <Input value={bankQ} onChangeText={setBankQ} placeholder="Tìm ngân hàng..." />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
                {shown.map((b) => <Chip key={b.bin} label={b.name} active={bank?.bin === b.bin} onPress={() => setBank(b)} />)}
              </View>
              <Input label="Số tài khoản" value={number} onChangeText={(v) => setNumber(v.replace(/\D/g, ''))} keyboardType="number-pad" />
              <Input label="Chủ tài khoản (không dấu, in hoa)" value={holder} onChangeText={setHolder} autoCapitalize="characters" />
              <Button title="Lưu tài khoản" onPress={() => save.mutate()} loading={save.isPending} disabled={!valid} />
            </Card>
            <WalletView wallet={refunds.data} counterpartLabel="Mentor" emptyText="Chưa có khoản hoàn tiền nào." />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  )
}
