import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Button, Empty, Screen, Tag, Txt } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { statusTone } from '@/constants/status'
import { Handshake, MessageCircle } from '@/components/icons'
import { Header } from '@/components/Header'
import { DEAL_STATUS_LABEL, dealApi, taskTypeLabel } from '@/api/mentoringFlow'
import type { DealStatus } from '@/api/mentoringFlow'
import { formatVnd } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'

const TABS: [DealStatus | undefined, string][] = [
  [undefined, 'Tất cả'],
  ['DEAL_CONFIRMED', 'Đã chốt'],
  ['CANCELLED', 'Đã hủy'],
]

/** Danh sách thỏa thuận Mentoring (UC94): Meetup x KakaoStory Card Design. */
export default function DealsScreen() {
  const { colors, viridian, isDark } = useMentoringTheme()
  const router = useRouter()
  const [status, setStatus] = useState<DealStatus | undefined>()
  const q = useInfiniteQuery({
    queryKey: ['mentoring-deals', status],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => dealApi.mine(status, pageParam),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []

  return (
    <Screen bg={colors.bg}>
      <Header title="Thỏa thuận Cố vấn" />

      {/* Meetup Tab Filter Rail */}
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
                    backgroundColor: active ? viridian : (isDark ? '#2C2C2E' : '#F2F2F7'),
                  },
                ]}
              >
                <Txt
                  size={12}
                  weight={active ? '700' : '500'}
                  style={{ color: active ? '#FFFFFF' : colors.textSecondary }}
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
            contentContainerStyle={{ paddingVertical: 14 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            ListEmptyComponent={
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<Handshake size={32} color={viridian} />}
                title="Chưa có thỏa thuận nào"
                text={
                  status
                    ? 'Không có thỏa thuận nào ở trạng thái này.'
                    : 'Thỏa thuận được tạo tự động trong phòng chat sau khi Cố vấn đồng ý yêu cầu.'
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
                    backgroundColor: pressed ? (isDark ? '#252628' : '#F9FAFB') : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Txt weight="800" size={15} numberOfLines={2} style={{ flex: 1, color: colors.text }}>
                    {d.requestTitle || d.taskScope}
                  </Txt>
                  <Tag label={DEAL_STATUS_LABEL[d.status] ?? d.status} tone={statusTone(d.status)} />
                </View>

                <Txt size={13} style={{ color: colors.textSecondary, marginTop: 4 }}>
                  {`${d.studentName} ↔ ${d.mentorName}`}
                </Txt>

                <View style={styles.tagWrap}>
                  <Tag label={taskTypeLabel(d.taskType)} tone="neutral" />
                  <Tag label={`Hạn ${new Date(d.deadline).toLocaleDateString('vi-VN')}`} tone="neutral" />
                  {d.isPaid ? <Tag label="Đã thanh toán" tone="success" /> : null}
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
                  <Txt weight="800" size={15} style={{ color: viridian, flex: 1 }}>
                    {formatVnd(d.agreedPrice)}
                  </Txt>
                  {d.conversationId ? (
                    <Button
                      title="Nhắn tin"
                      size="sm"
                      variant="secondary"
                      icon={<MessageCircle size={14} color={viridian} />}
                      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(d.conversationId) } })}
                    />
                  ) : null}
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
  },
  dealCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
})
