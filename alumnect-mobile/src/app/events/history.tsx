import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Card, Chip, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { eventApi } from '@/api/events'
import type { HistoryFilter } from '@/api/events'

const FILTERS: [HistoryFilter, string][] = [['all', 'Tất cả'], ['upcoming', 'Sắp diễn ra'], ['past', 'Đã qua'], ['cancelled', 'Đã hủy']]

/** UC28: lịch sử tham gia sự kiện. */
export default function EventHistoryScreen() {
  const router = useRouter()
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
      <View style={{ height: 52 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
          {FILTERS.map(([k, l]) => <Chip key={k} label={l} active={filter === k} onPress={() => setFilter(k)} />)}
        </ScrollView>
      </View>
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(e) => String(e.registrationId)}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          ListEmptyComponent={<Empty text="Bạn chưa tham gia sự kiện nào." />}
          renderItem={({ item }) => (
            <Card
              style={{ marginBottom: 12 }}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(item.eventId), title: item.title, start: item.startTime ?? '', end: item.endTime ?? '', location: item.location ?? '' } })}
            >
              <Txt weight="700" size={16}>{item.title}</Txt>
              <Txt muted size={13} style={{ marginTop: 4 }}>{item.startTime ? new Date(item.startTime).toLocaleString('vi-VN') : ''}</Txt>
              {item.location ? <Txt muted size={13}>{item.location}</Txt> : null}
              <Txt size={12} weight="700" color="#F27124" style={{ marginTop: 6 }}>{item.registrationStatus === 'CANCELLED' || item.eventStatus === 'CANCELLED' ? 'Đã hủy' : item.attendanceState === 'PAST' ? 'Đã qua' : 'Sắp diễn ra'}</Txt>
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
