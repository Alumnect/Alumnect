import React from 'react'
import { View } from 'react-native'
import { Card, Empty, Tag, Txt } from '@/components/ui'
import { ArrowDownLeft, Clock, Receipt, XCircle } from '@/components/icons'
import { WALLET_STATUS_LABEL } from '@/api/mentoringWallet'
import type { Wallet } from '@/api/mentoringWallet'
import { formatVnd } from '@/api/mentoring'
import { useTheme } from '@/theme'

/** Tổng quan + danh sách khoản thù lao / hoàn tiền (dùng chung cho Thu nhập và Hoàn tiền). */
export function WalletView({ wallet, counterpartLabel, emptyText }: { wallet?: Wallet; counterpartLabel: string; emptyText: string }) {
  const t = useTheme()
  const total = (wallet?.totalReceived ?? 0) + (wallet?.totalProcessing ?? 0)
  return (
    <View>
      <View style={{ borderRadius: 16, padding: 20, backgroundColor: t.surface, marginBottom: 24 }}>
        <Txt size={14} muted>Tổng giá trị</Txt>
        <Txt size={30} weight="500" style={{ marginTop: 8, fontVariant: ['tabular-nums'] }}>{formatVnd(total)}</Txt>
        <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: t.border }}>
          {[
            ['Đã nhận', wallet?.totalReceived ?? 0],
            ['Đang xử lý', wallet?.totalProcessing ?? 0],
            ['Thất bại', wallet?.totalFailed ?? 0],
          ].map(([l, v]) => (
            <View key={String(l)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14 }}>
              <Txt size={13} muted style={{ flex: 1 }}>{String(l)}</Txt>
              <Txt weight="500" size={14} style={{ fontVariant: ['tabular-nums'], textAlign: 'right', flexShrink: 1 }}>{formatVnd(Number(v))}</Txt>
            </View>
          ))}
        </View>
      </View>
      <Txt weight="800" size={16} style={{ marginBottom: 8 }}>Giao dịch</Txt>
      {(wallet?.items ?? []).length === 0 ? (
        <Empty icon={<Receipt size={26} color={t.primary} />} title="Chưa có giao dịch" text={emptyText} />
      ) : (
        <Card style={{ paddingVertical: 2 }}>
          {(wallet?.items ?? []).map((it, i, arr) => (
            <View key={it.ledgerId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: t.divider }}>
              <View style={{ width: 20, alignItems: 'center', justifyContent: 'center' }}>
                {it.status === 'SUCCEEDED' ? <ArrowDownLeft size={18} color={t.success} /> : it.status === 'FAILED' ? <XCircle size={18} color={t.danger} /> : <Clock size={18} color={t.warning} />}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight="600" size={14} numberOfLines={2}>{it.taskTitle || `Task #${it.taskId ?? '—'}`}</Txt>
                <Txt muted size={12} numberOfLines={1}>{[it.counterpartName ? `${counterpartLabel}: ${it.counterpartName}` : null, new Date(it.transactedAt ?? it.createdAt).toLocaleDateString('vi-VN')].filter(Boolean).join(' · ')}</Txt>
                {it.note ? <Txt muted size={12} numberOfLines={2}>{it.note}</Txt> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6, maxWidth: '46%' }}>
                <Txt weight="600" size={14} style={{ fontVariant: ['tabular-nums'], textAlign: 'right' }}>{formatVnd(it.amount)}</Txt>
                <Tag label={WALLET_STATUS_LABEL[it.status] ?? it.status} tone={it.status === 'SUCCEEDED' ? 'success' : it.status === 'FAILED' ? 'danger' : 'warning'} />
              </View>
            </View>
          ))}
        </Card>
      )}
    </View>
  )
}
