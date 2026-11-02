import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { CalendarCheck, CalendarDays, Clock, History, MapPin, Users } from '@/components/icons'
import { Card, Chip, Empty, IconButton, Screen, SearchBar, Segmented, Tag, Txt } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { feedApi } from '@/api/feed'
import type { Post } from '@/api/feed'
import { normalize } from '@/constants/filters'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

type Tab = 'upcoming' | 'this_month'
type Quick = 'all' | 'registered' | 'available' | 'online'

const EventCard = React.memo(function EventCard({ p }: { p: Post }) {
  const t = useTheme()
  const router = useRouter()
  const e = p.event!
  const d = new Date(e.startTime!)
  const full = !!e.capacity && e.attendeeCount >= e.capacity
  const pct = e.capacity ? Math.min(1, e.attendeeCount / e.capacity) : 0
  return (
    <Card
      style={{ marginHorizontal: 16, marginBottom: 16 }}
      onPress={() => e.id && router.push({ pathname: '/events/[id]', params: { id: String(e.id), title: e.title ?? '', start: e.startTime ?? '', end: e.endTime ?? '', location: e.location ?? '', hostId: p.authorId ?? '', postId: p.id } })}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 58, borderRadius: 14, overflow: 'hidden', backgroundColor: t.surface, alignItems: 'center' }}>
          <View style={{ alignSelf: 'stretch', backgroundColor: t.danger, paddingVertical: 3 }}>
            <Txt size={11} weight="800" color="#fff" style={{ textAlign: 'center' }}>{`THÁNG ${d.getMonth() + 1}`}</Txt>
          </View>
          <Txt size={24} weight="800" style={{ paddingTop: 4 }}>{String(d.getDate()).padStart(2, '0')}</Txt>
          <Txt muted size={11} style={{ paddingBottom: 6 }}>{d.toLocaleDateString('vi-VN', { weekday: 'short' })}</Txt>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt weight="800" size={16} numberOfLines={2}>{e.title}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Clock size={13} color={t.textMuted} />
            <Txt muted size={13}>{d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Txt>
          </View>
          {e.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MapPin size={13} color={t.textMuted} />
              <Txt muted size={13} numberOfLines={1} style={{ flex: 1 }}>{e.location}</Txt>
            </View>
          ) : null}
        </View>
      </View>
      <View style={{ marginTop: 12, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Users size={14} color={t.textMuted} />
          <Txt muted size={12} style={{ flex: 1 }}>{`${e.attendeeCount}${e.capacity ? `/${e.capacity}` : ''} người tham gia`}</Txt>
          {e.status === 'CANCELLED' ? <Tag label="Đã huỷ" tone="danger" /> : e.isRegistered ? <Tag label="Đã đăng ký" tone="success" icon={<CalendarCheck size={12} color={t.success} />} /> : full ? <Tag label="Hết chỗ" tone="warning" /> : null}
        </View>
        {e.capacity ? (
          <View style={{ height: 6, borderRadius: 3, backgroundColor: t.inputBg, overflow: 'hidden' }}>
            <View style={{ width: `${pct * 100}%`, height: 6, borderRadius: 3, backgroundColor: full ? t.warning : t.primary }} />
          </View>
        ) : null}
      </View>
    </Card>
  )
})

/** Sự kiện: tab thời gian + tìm kiếm + lọc nhanh (đã đăng ký, còn chỗ, online). */
export default function EventsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [quick, setQuick] = useState<Quick>('all')
  const [kw, setKw] = useState('')
  const keyword = normalize(useDebounced(kw, 300))

  const q = useInfiniteQuery({
    queryKey: ['events-list', tab],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getFeed({ page: pageParam, filter: 'event', eventFilter: tab }),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const events = useMemo(() => {
    const all = (q.data?.pages.flatMap((p) => p.items) ?? []).filter((p) => p.event?.startTime)
    return all.filter((p) => {
      const e = p.event!
      const okKw = !keyword || [e.title, e.location, p.text, p.author].some((s) => s && normalize(s).includes(keyword))
      const okQuick =
        quick === 'all' ||
        (quick === 'registered' && e.isRegistered) ||
        (quick === 'available' && (!e.capacity || e.attendeeCount < e.capacity) && e.status !== 'CANCELLED') ||
        (quick === 'online' && /online|zoom|meet|teams/i.test(e.location ?? ''))
      return okKw && okQuick
    })
  }, [q.data, keyword, quick])

  return (
    <Screen bg={t.card}>
      <Header title="Sự kiện & Họp mặt" right={<IconButton label="Lịch sử tham gia" icon={<History size={20} color={t.text} />} onPress={() => router.push('/events/history')} />} />
      <Segmented<Tab> tabs={[['upcoming', 'Sắp diễn ra'], ['this_month', 'Trong tháng này']]} value={tab} onChange={setTab} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={q.isLoading ? [] : events}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.card, paddingTop: 12, marginBottom: 16 }}>
                <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm sự kiện theo tên, địa điểm..." style={{ paddingHorizontal: 16 }} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                  {([['all', 'Tất cả'], ['registered', 'Đã đăng ký'], ['available', 'Còn chỗ'], ['online', 'Trực tuyến']] as [Quick, string][]).map(([k, l]) => (
                    <Chip key={k} label={l} active={quick === k} onPress={() => setQuick(k)} />
                  ))}
                </ScrollView>
              </View>
              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : <Empty error={q.error} onRetry={() => { void q.refetch() }} icon={<CalendarDays size={28} color={t.primary} />} title="Chưa có sự kiện" text="Sự kiện mới sẽ xuất hiện ở đây khi được đăng." />
          }
          renderItem={({ item }) => <EventCard p={item} />}
        />
      </View>
    </Screen>
  )
}
