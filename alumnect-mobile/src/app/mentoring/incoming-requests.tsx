import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { ChevronRight, Sparkles } from '@/components/icons'
import { Avatar, Empty, Screen, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Enter, MotionPressable } from '@/components/Motion'
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

/** UC93: yêu cầu đến dành cho mentor (Meetup Item x Instagram Pill Tabs x Kakao Action Card). */
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

  const handleTabChange = (nextTab: Tab) => {
    Haptics.selectionAsync()
    setTab(nextTab)
  }

  return (
    <Screen bg={colors.bg}>
      <Header title="Yêu cầu đến" subtitle="Sinh viên đang cần bạn cố vấn & đồng hành" />

      {/* Pill Filter Rail (Meetup x Instagram Pill Tabs) */}
      <View style={[styles.tabRail, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map(([k, l]) => {
            const active = tab === k
            return (
              <MotionPressable
                key={k}
                onPress={() => handleTabChange(k)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[
                  styles.tabChip,
                  active
                    ? {
                        backgroundColor: viridian,
                        borderColor: viridian,
                        shadowColor: viridian,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3,
                        elevation: 2,
                      }
                    : {
                        backgroundColor: isDark ? colors.surface : '#F7F8FA',
                        borderColor: isDark ? colors.border : '#E6E8EB',
                      },
                ]}
              >
                <Txt
                  size={12.5}
                  weight={active ? '800' : '600'}
                  style={{ color: active ? '#FFFFFF' : colors.text }}
                >
                  {l}
                </Txt>
              </MotionPressable>
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
                icon={<BrandIcon name="writing" size={54} />}
                title="Chưa có yêu cầu đến"
                text="Khi sinh viên gửi yêu cầu phù hợp với lĩnh vực của bạn, danh sách sẽ hiển thị tại đây."
              />
            }
            renderItem={({ item }) => (
              <Enter duration={280}>
                <MotionPressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    router.push({ pathname: '/mentoring/incoming/[id]', params: { id: String(item.id) } })
                  }}
                  accessibilityRole="button"
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: isDark ? colors.border : '#EAECEF',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar uri={item.studentAvatar} name={item.studentName} size={46} ring />
                    <View style={{ flex: 1 }}>
                      <Txt weight="800" size={15.5} style={{ color: colors.text }} numberOfLines={1}>
                        {item.studentName}
                      </Txt>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Sparkles size={11} color={viridian} weight="fill" />
                        <Txt size={12} weight="700" style={{ color: viridian }}>
                          {taskTypeLabel(item.taskType)}
                        </Txt>
                      </View>
                    </View>
                    <Tag label={RESPONSE_STATUS_LABEL[item.responseStatus] ?? item.responseStatus} tone={statusTone(item.responseStatus)} />
                  </View>

                  <Txt weight="800" size={15} style={{ color: colors.text, marginTop: 12, lineHeight: 21 }} numberOfLines={2}>
                    {item.title}
                  </Txt>

                  <View style={[styles.footerRow, { borderTopColor: isDark ? colors.borderSubtle : '#F0F2F5' }]}>
                    <View
                      style={[
                        styles.actionPill,
                        {
                          backgroundColor: isDark ? '#2E1C10' : '#FFF3EB',
                          borderWidth: 1,
                          borderColor: isDark ? '#4A2C16' : '#FFDFCC',
                        },
                      ]}
                    >
                      <Txt size={11.5} weight="800" style={{ color: viridian }}>
                        Xem chi tiết & Phản hồi
                      </Txt>
                      <ChevronRight size={12} color={viridian} weight="bold" />
                    </View>
                  </View>
                </MotionPressable>
              </Enter>
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
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  footerRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
})
