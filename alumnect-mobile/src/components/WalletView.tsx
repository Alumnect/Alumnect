import React from 'react'
import { View } from 'react-native'
import { Card, Empty, Txt } from '@/components/ui'
import { WALLET_STATUS_LABEL } from '@/api/mentoringWallet'
import type { Wallet } from '@/api/mentoringWallet'
import { formatVnd } from '@/api/mentoring'
import { useTheme } from '@/theme'

/** Tổng quan + danh sách khoản thù lao / hoàn tiền (dùng chung cho Thu nhập và Hoàn tiền). */
export function WalletView({ wallet, counterpartLabel, emptyText }: { wallet?: Wallet; counterpartLabel: string; emptyText: string }) {
  const t = useTheme()
  const color = (s: string) => (s === 'SUCCEEDED' ? t.success : s === 'FAILED' ? t.danger : t.primary)
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[
          ['Đã nhận', wallet?.totalReceived ?? 0],
          ['Đang xử lý', wallet?.totalProcessing ?? 0],
          ['Thất bại', wallet?.totalFailed ?? 0],
        ].map(([l, v]) => (
          <Card key={String(l)} style={{ flex: 1, padding: 10 }}>
            <Txt muted size={11}>{l}</Txt>
            <Txt weight="800" size={14} style={{ marginTop: 2 }}>{formatVnd(Number(v))}</Txt>
          </Card>
        ))}
      </View>
      {(wallet?.items ?? []).length === 0 ? (
        <Empty text={emptyText} />
      ) : (
        (wallet?.items ?? []).map((it) => (
          <Card key={it.ledgerId} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Txt weight="700" style={{ flex: 1 }} numberOfLines={2}>{it.taskTitle || `Task #${it.taskId ?? '—'}`}</Txt>
              <Txt weight="800">{formatVnd(it.amount)}</Txt>
            </View>
            {it.counterpartName ? <Txt muted size={13}>{counterpartLabel}: {it.counterpartName}</Txt> : null}
            {it.note ? <Txt muted size={12} style={{ marginTop: 2 }}>{it.note}</Txt> : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Txt size={12} weight="700" color={color(it.status)}>{WALLET_STATUS_LABEL[it.status] ?? it.status}</Txt>
              <Txt muted size={12}>{new Date(it.transactedAt ?? it.createdAt).toLocaleString('vi-VN')}</Txt>
            </View>
          </Card>
        ))
      )}
    </View>
  )
}
