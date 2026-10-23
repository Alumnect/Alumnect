import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import {Card, Chip, Empty, Screen, Txt, Tag } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { CalendarDays } from '@/components/icons'
import { Header } from '@/components/Header'
import { eventApi } from '@/api/events'
import type { HistoryFilter } from '@/api/events'
import { palette, useTheme } from '@/theme'

const FILTERS: [HistoryFilter, string][] = [['all', 'Tất cả'], ['upcoming', 'Sắp diễn ra'], ['past', 'Đã qua'], ['cancelled', 'Đã hủy']]

/** UC28: lịch sử tham gia sự kiện. */
export default function EventHistoryScreen() {
  const router = useRouter()
  const t = useTheme()
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const q = useInfiniteQuery({
    queryKey: ['event-history', filter],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => eventApi.history(pageParam, filter),
    getNextPageParam: (l) => (l.data.last ? undefined : l.data.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.data.content) ?? []
  return (
    <Screen>
      <Header title="Lịch sử sự kiện" />
      <View style={{ backgroundColor: t.card }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}>
          {FILTERS.map(([k, l]) => <Chip key={k} label={l} active={filter === k} onPress={() => setFilter(k)} />)}
        </ScrollView>
      </View>
      {q.isLoading ? <ListSkeleton variant="row" /> : (
        <FlashList
          data={items}
          keyExtractor={(e) => String(e.registrationId)}
          contentContainerStyle={{ padding: 12 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty icon={<CalendarDays size={26} color={palette.primary} />} title="Chưa tham gia sự kiện" text="Sự kiện bạn đăng ký sẽ được lưu lại ở đây." action="Khám phá sự kiện" onAction={() => router.push('/events')} />}
          renderItem={({ item }) => (
            <Card
              style={{ marginBottom: 10 }}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(item.eventId), title: item.title, start: item.startTime ?? '', end: item.endTime ?? '', location: item.location ?? '' } })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Txt weight="800" size={15} style={{ flex: 1 }} numberOfLines={2}>{item.title}</Txt>
                {item.registrationStatus === 'CANCELLED' || item.eventStatus === 'CANCELLED' ? (
                  <Tag label="Đã huỷ" tone="danger" />
                ) : item.attendanceState === 'PAST' ? (
                  <Tag label="Đã qua" tone="neutral" />
                ) : (
                  <Tag label="Sắp diễn ra" tone="success" />
                )}
              </View>
              {item.startTime ? <Txt muted size={13} style={{ marginTop: 6 }}>{new Date(item.startTime).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Txt> : null}
              {item.location ? <Txt muted size={13} numberOfLines={1}>{item.location}</Txt> : null}
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
