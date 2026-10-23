import React from 'react'
import { View } from 'react-native'
import { Card, Empty, Tag, Txt } from '@/components/ui'
import { ArrowDownLeft, Clock, Receipt, XCircle } from '@/components/icons'
import { WALLET_STATUS_LABEL } from '@/api/mentoringWallet'
import type { Wallet } from '@/api/mentoringWallet'
import { formatVnd } from '@/api/mentoring'
import { useTheme, palette } from '@/theme'

/** Tổng quan + danh sách khoản thù lao / hoàn tiền (dùng chung cho Thu nhập và Hoàn tiền). */
export function WalletView({ wallet, counterpartLabel, emptyText }: { wallet?: Wallet; counterpartLabel: string; emptyText: string }) {
  const t = useTheme()
  const total = (wallet?.totalReceived ?? 0) + (wallet?.totalProcessing ?? 0)
  return (
    <View>
      <View style={{ borderRadius: 18, padding: 18, backgroundColor: palette.primary, overflow: 'hidden', marginBottom: 12 }}>
        <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: palette.primarySoft, opacity: 0.5, top: -80, right: -50 }} />
        <Txt size={13} color="#FFEDE0" weight="600">Tổng giá trị</Txt>
        <Txt size={28} weight="800" color="#fff" style={{ marginTop: 4 }}>{formatVnd(total)}</Txt>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {[
            ['Đã nhận', wallet?.totalReceived ?? 0],
            ['Đang xử lý', wallet?.totalProcessing ?? 0],
            ['Thất bại', wallet?.totalFailed ?? 0],
          ].map(([l, v]) => (
            <View key={String(l)} style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)' }}>
              <Txt size={11} color="#FFEDE0">{String(l)}</Txt>
              <Txt weight="800" size={13} color="#fff" style={{ marginTop: 2 }}>{formatVnd(Number(v))}</Txt>
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
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: it.status === 'SUCCEEDED' ? t.successTint : it.status === 'FAILED' ? t.dangerTint : t.warningTint }}>
                {it.status === 'SUCCEEDED' ? <ArrowDownLeft size={18} color={t.success} /> : it.status === 'FAILED' ? <XCircle size={18} color={t.danger} /> : <Clock size={18} color={t.warning} />}
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="700" numberOfLines={1}>{it.taskTitle || `Task #${it.taskId ?? '—'}`}</Txt>
                <Txt muted size={12} numberOfLines={1}>{[it.counterpartName ? `${counterpartLabel}: ${it.counterpartName}` : null, new Date(it.transactedAt ?? it.createdAt).toLocaleDateString('vi-VN')].filter(Boolean).join(' · ')}</Txt>
                {it.note ? <Txt muted size={12} numberOfLines={2}>{it.note}</Txt> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Txt weight="800" color={it.status === 'SUCCEEDED' ? t.success : t.text}>{formatVnd(it.amount)}</Txt>
                <Tag label={WALLET_STATUS_LABEL[it.status] ?? it.status} tone={it.status === 'SUCCEEDED' ? 'success' : it.status === 'FAILED' ? 'danger' : 'warning'} />
              </View>
            </View>
          ))}
        </Card>
      )}
    </View>
  )
}
