import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronRight, Inbox, Sparkles } from '@/components/icons'
import { Avatar, Empty, Screen, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ListSkeleton } from '@/components/Skeleton'
import { RESPONSE_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import { statusTone } from '@/constants/status'
import { useMentoringTheme } from '@/theme/mentoringTheme'

type Tab = 'ALL' | 'WAITING' | 'ACCEPTED' | 'DECLINED'
const TABS: [Tab, string][] = [
  ['ALL', 'Tất cả'],
  ['WAITING', 'Đang chờ duyệt'],
  ['ACCEPTED', 'Đã chấp nhận'],
  ['DECLINED', 'Đã từ chối'],
]

/** UC93: yêu cầu đến dành cho mentor (Meetup Item x Instagram Pill Tabs). */
export default function IncomingRequestsScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('ALL')
  const status = tab === 'ALL' ? undefined : tab
  const q = useInfiniteQuery({
    queryKey: ['mentoring-incoming', status],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => requestApi.incoming({ status, page: pageParam }),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []

  return (
    <Screen bg={colors.bg}>
      <Header title="Yêu cầu đến" subtitle="Sinh viên đang cần bạn cố vấn & đồng hành" />

      {/* Pill Filter Rail */}
      <View style={[styles.tabRail, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map(([k, l]) => {
            const active = tab === k
            return (
              <Pressable
                key={k}
                onPress={() => setTab(k)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? colors.actionBg : colors.surface,
                    borderColor: active ? colors.actionBg : colors.border,
                  },
                ]}
              >
                <Txt size={12} weight={active ? '700' : '600'} style={{ color: active ? colors.actionText : colors.textSecondary }}>
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
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={{ paddingVertical: 14 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            ListEmptyComponent={
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<Inbox size={32} color={viridian} />}
                title="Chưa có yêu cầu đến"
                text="Khi sinh viên gửi yêu cầu phù hợp với lĩnh vực của bạn, danh sách sẽ hiển thị tại đây."
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({ pathname: '/mentoring/incoming/[id]', params: { id: String(item.id) } })}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: pressed ? (isDark ? '#222222' : '#FAFAFB') : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar uri={item.studentAvatar} name={item.studentName} size={46} ring />
                  <View style={{ flex: 1 }}>
                    <Txt weight="800" size={15} style={{ color: colors.text }} numberOfLines={1}>
                      {item.studentName}
                    </Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Sparkles size={11} color={viridian} weight="fill" />
                      <Txt size={12} weight="600" style={{ color: viridian }}>
                        {taskTypeLabel(item.taskType)}
                      </Txt>
                    </View>
                  </View>
                  <Tag label={RESPONSE_STATUS_LABEL[item.responseStatus] ?? item.responseStatus} tone={statusTone(item.responseStatus)} />
                </View>

                <Txt weight="800" size={15} style={{ color: colors.text, marginTop: 12 }} numberOfLines={2}>
                  {item.title}
                </Txt>

                <View style={[styles.footerRow, { borderTopColor: colors.borderSubtle }]}>
                  <View style={[styles.actionPill, { backgroundColor: viridianSoft }]}>
                    <Txt size={11} weight="700" style={{ color: viridian }}>
                      Xem chi tiết & Phản hồi
                    </Txt>
                    <ChevronRight size={12} color={viridian} weight="bold" />
                  </View>
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
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
})
