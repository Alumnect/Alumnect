import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Button, Empty, Screen, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { ListSkeleton } from '@/components/Skeleton'
import { statusTone } from '@/constants/status'
import { ChevronRight, MessageCircle } from '@/components/icons'
import { Header } from '@/components/Header'
import { DEAL_STATUS_LABEL, dealApi, taskTypeLabel } from '@/api/mentoringFlow'
import type { DealStatus } from '@/api/mentoringFlow'
import { formatVnd } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'

const TABS: [DealStatus | undefined, string][] = [
  [undefined, 'Tất cả'],
  ['DEAL_CONFIRMED', 'Đã xác nhận'],
  ['CANCELLED', 'Đã hủy'],
]

/** Danh sách thỏa thuận Mentoring (UC94): Meetup Contract Item x Instagram x KakaoPay Ledger Design (Cam - Trắng - Đen). */
export default function DealsScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const [status, setStatus] = useState<DealStatus | undefined>()
  const q = useInfiniteQuery({
    queryKey: ['mentoring-deals', status],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => dealApi.mine(status, pageParam),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const confirmedCount = items.filter((d) => d.status === 'DEAL_CONFIRMED').length
  const paidCount = items.filter((d) => d.isPaid).length

  return (
    <Screen bg={colors.bg}>
      <Header
        title="Thỏa thuận hợp tác"
        subtitle="Hợp đồng & điều khoản hướng dẫn giữa Học viên và Mentor"
      />

      {/* Instagram / Meetup Pill Filter Rail */}
      <View style={[styles.tabRail, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map(([k, l]) => {
            const active = status === k
            return (
              <Pressable
                key={l}
                onPress={() => setStatus(k)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? colors.actionBg : colors.surface,
                    borderColor: active ? colors.actionBg : colors.border,
                  },
                ]}
              >
                <Txt
                  size={12}
                  weight={active ? '700' : '600'}
                  style={{ color: active ? colors.actionText : colors.textSecondary }}
                >
                  {l}
                </Txt>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {q.isLoading ? (
          <ListSkeleton variant="row" />
        ) : (
          <FlashList
            data={items}
            keyExtractor={(d) => String(d.id)}
            contentContainerStyle={{ paddingBottom: 28 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            ListHeaderComponent={
              <View style={styles.headerBentoWrap}>
                {/* KakaoPay Escrow & Contract Bento Summary */}
                <View style={[styles.summaryBento, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.summaryTopRow}>
                    <View style={[styles.summaryIconBox, { backgroundColor: viridianSoft }]}>
                      <BrandIcon name="check" size={30} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Txt weight="800" size={14} style={{ color: colors.text }}>
                          Sổ cái Hợp đồng & Cam kết
                        </Txt>
                      </View>
                      <Txt size={11} style={{ color: colors.textSecondary, marginTop: 1 }}>
                        Mọi thỏa thuận được bảo vệ thanh toán qua cổng PayOS
                      </Txt>
                    </View>
                    <View style={[styles.escrowPill, { backgroundColor: viridianSoft, borderColor: viridian }]}>
                      <BrandIcon name="lock" size={14} />
                      <Txt size={10} weight="800" style={{ color: viridian }}>
                        Escrow
                      </Txt>
                    </View>
                  </View>

                  <View style={[styles.summaryStatsGrid, { borderTopColor: colors.borderSubtle }]}>
                    <View style={styles.statCell}>
                      <Txt weight="800" size={17} style={{ color: colors.text }}>
                        {items.length}
                      </Txt>
                      <Txt size={11} weight="600" style={{ color: colors.textTertiary }}>
                        Tổng thỏa thuận
                      </Txt>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
                    <View style={styles.statCell}>
                      <Txt weight="800" size={17} style={{ color: viridian }}>
                        {confirmedCount}
                      </Txt>
                      <Txt size={11} weight="600" style={{ color: colors.textTertiary }}>
                        Đã ký nhận
                      </Txt>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
                    <View style={styles.statCell}>
                      <Txt weight="800" size={17} style={{ color: '#10B981' }}>
                        {paidCount}
                      </Txt>
                      <Txt size={11} weight="600" style={{ color: colors.textTertiary }}>
                        Đã thanh toán
                      </Txt>
                    </View>
                  </View>
                </View>
              </View>
            }
            ListEmptyComponent={
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<BrandIcon name="check" size={64} />}
                title="Chưa có thỏa thuận hợp tác nào"
                text={
                  status
                    ? 'Không có thỏa thuận nào ở trạng thái này.'
                    : 'Thỏa thuận được tạo trong phòng chat sau khi Cố vấn đồng ý yêu cầu hướng dẫn.'
                }
              />
            }
            renderItem={({ item: d }) => (
              <Pressable
                onPress={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(d.id) } })}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.dealCard,
                  {
                    backgroundColor: pressed ? (isDark ? '#222222' : '#FAFAFB') : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Meetup Eyebrow */}
                <View style={styles.eyebrowRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <BrandIcon name="check" size={17} />
                    <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.4 }}>
                      {`HỢP ĐỒNG #${d.id}`}
                    </Txt>
                  </View>
                  <Tag label={DEAL_STATUS_LABEL[d.status] ?? d.status} tone={statusTone(d.status)} />
                </View>

                {/* Title */}
                <Txt weight="800" size={16} numberOfLines={2} style={{ color: colors.text, marginTop: 6 }}>
                  {d.requestTitle || d.taskScope}
                </Txt>

                {/* Kakao / Instagram Counterpart Pairing Strip */}
                <View style={[styles.pairBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <View style={{ flex: 1 }}>
                    <Txt size={10} weight="700" style={{ color: colors.textTertiary, textTransform: 'uppercase' }}>
                      Học viên
                    </Txt>
                    <Txt size={13} weight="700" style={{ color: colors.text, marginTop: 1 }} numberOfLines={1}>
                      {d.studentName}
                    </Txt>
                  </View>
                  <View style={[styles.pairBadge, { backgroundColor: viridianSoft }]}>
                    <BrandIcon name="fist" size={16} />
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Txt size={10} weight="700" style={{ color: viridian, textTransform: 'uppercase' }}>
                      Mentor
                    </Txt>
                    <Txt size={13} weight="700" style={{ color: colors.text, marginTop: 1 }} numberOfLines={1}>
                      {d.mentorName}
                    </Txt>
                  </View>
                </View>

                {/* Tags */}
                <View style={styles.tagWrap}>
                  <View style={[styles.metaChip, { backgroundColor: viridianSoft }]}>
                    <Txt size={11} weight="700" style={{ color: viridian }}>
                      {taskTypeLabel(d.taskType)}
                    </Txt>
                  </View>
                  <View style={[styles.metaChip, { backgroundColor: colors.surface }]}>
                    <BrandIcon name="calendar" size={13} />
                    <Txt size={11} weight="600" style={{ color: colors.textSecondary, marginLeft: 5 }}>
                      {`Hạn ${new Date(d.deadline).toLocaleDateString('vi-VN')}`}
                    </Txt>
                  </View>
                  {d.isPaid ? <Tag label="Đã thanh toán" tone="success" /> : null}
                </View>

                {/* KakaoPay Ledger Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <BrandIcon name="coin" size={22} />
                    <View>
                      <Txt size={10} weight="600" style={{ color: colors.textTertiary, textTransform: 'uppercase' }}>
                        Giá trị thỏa thuận
                      </Txt>
                      <Txt weight="800" size={16} style={{ color: viridian, fontVariant: ['tabular-nums'] }}>
                        {formatVnd(d.agreedPrice)}
                      </Txt>
                    </View>
                  </View>
                  {d.conversationId ? (
                    <Button
                      title="Nhắn tin"
                      size="sm"
                      variant="secondary"
                      icon={<MessageCircle size={14} color={viridian} weight="fill" />}
                      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(d.conversationId) } })}
                    />
                  ) : (
                    <ChevronRight size={16} color={colors.textTertiary} weight="bold" />
                  )}
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  tabRail: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerBentoWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  summaryBento: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  dealCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pairBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  pairBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
})
