import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Empty, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { ArrowDownLeft, Clock, Receipt, XCircle } from '@/components/icons'
import { WALLET_STATUS_LABEL } from '@/api/mentoringWallet'
import type { Wallet } from '@/api/mentoringWallet'
import { formatVnd } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/** Tổng quan + danh sách khoản thù lao / hoàn tiền (KakaoPay x Meetup Ledger 2026 — Cam - Trắng - Đen). */
export function WalletView({ wallet, counterpartLabel, emptyText }: { wallet?: Wallet; counterpartLabel: string; emptyText: string }) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
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
              </View>
            </View>
          ))}
        </View>
      )}
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
})
