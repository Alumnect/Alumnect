import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { Card, Chip, Empty, Screen, Txt, Tag } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { CalendarDays, Globe, MapPin } from '@/components/icons'
import { Header } from '@/components/Header'
import { DateBadge, eventEyebrow, isOnlineLocation, locationLabel } from '@/components/EventBits'
import { eventApi } from '@/api/events'
import type { EventHistoryItem, HistoryFilter } from '@/api/events'
import { radius, useTheme } from '@/theme'

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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          {FILTERS.map(([k, l]) => <Chip key={k} label={l} active={filter === k} onPress={() => setFilter(k)} />)}
        </ScrollView>
      </View>
      {q.isLoading ? <ListSkeleton variant="row" /> : (
        <FlashList
          data={items}
          keyExtractor={(e) => String(e.registrationId)}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty error={q.error} onRetry={() => { void q.refetch() }} icon={<CalendarDays size={26} color={t.primary} />} title="Chưa tham gia sự kiện" text="Sự kiện bạn đăng ký sẽ được lưu lại ở đây." action="Khám phá sự kiện" onAction={() => router.push('/events')} />}
          renderItem={({ item }) => (
            <HistoryCard item={item} onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(item.eventId) } })} />
          )}
        />
      )}
    </Screen>
  )
}

type TagTone = NonNullable<React.ComponentProps<typeof Tag>['tone']>

/** Nhãn theo `attendanceState` do backend tính; phân biệt sự kiện bị hủy với việc tự hủy đăng ký. */
const STATE_TAG: Record<string, { label: string; tone: TagTone }> = {
  UPCOMING: { label: 'Sắp diễn ra', tone: 'success' },
  ONGOING: { label: 'Đang diễn ra', tone: 'primary' },
  PAST: { label: 'Đã qua', tone: 'neutral' },
  EVENT_CANCELLED: { label: 'Sự kiện đã hủy', tone: 'danger' },
  REGISTRATION_CANCELLED: { label: 'Bạn đã hủy đăng ký', tone: 'warning' },
}

/** Thẻ lịch sử: ảnh bìa hoặc ô lịch, ngày giờ nổi bật, tiêu đề, địa điểm và trạng thái tham gia. */
function HistoryCard({ item, onPress }: { item: EventHistoryItem; onPress: () => void }) {
  const t = useTheme()
  const start = item.startTime ? new Date(item.startTime) : null
  const state = item.attendanceState
  const cancelled = state === 'EVENT_CANCELLED' || state === 'REGISTRATION_CANCELLED'
  const past = state === 'PAST'
  const tag = STATE_TAG[state] ?? STATE_TAG.UPCOMING
  const place = locationLabel(item.location)
  return (
    <Card style={{ marginBottom: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }} onPress={onPress}>
      {item.coverUrl ? (
        <Image source={{ uri: item.coverUrl }} style={{ width: 64, height: 64, borderRadius: radius.md, backgroundColor: t.inputBg, opacity: cancelled ? 0.6 : 1 }} contentFit="cover" cachePolicy="disk" />
      ) : start ? (
        <DateBadge date={start} size={56} />
      ) : null}
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        {start ? <Txt size={12} weight="700" color={cancelled || past ? t.textMuted : t.primary} numberOfLines={1}>{eventEyebrow(start)}</Txt> : null}
        <Txt weight="700" size={15} numberOfLines={2}>{item.title}</Txt>
        {place ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isOnlineLocation(item.location) ? <Globe size={13} color={t.textMuted} /> : <MapPin size={13} color={t.textMuted} />}
            <Txt muted size={13} numberOfLines={1} style={{ flex: 1 }}>{place}</Txt>
          </View>
        ) : null}
        <View style={{ marginTop: 4 }}>
          <Tag label={tag.label} tone={tag.tone} />
        </View>
      </View>
    </Card>
  )
}
