import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Globe, History, MapPin, Users } from '@/components/icons'
import { Avatar, Card, Chip, Empty, IconButton, Screen, SearchBar, Segmented, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import {
  CapacityMeter,
  EventCover,
  EventStatusTag,
  dayGroupLabel,
  daysUntil,
  eventEyebrow,
  eventPhase,
  isOnlineLocation,
  locationLabel,
  startsIn,
} from '@/components/EventBits'
import { feedApi } from '@/api/feed'
import type { Post } from '@/api/feed'
import { normalize } from '@/constants/filters'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

type Tab = 'upcoming' | 'this_month'
type Quick = 'all' | 'registered' | 'available' | 'online'

/** Một dòng trong danh sách: tiêu đề nhóm thời gian hoặc thẻ sự kiện. */
type Row = { kind: 'header'; key: string; label: string; count: number } | { kind: 'event'; key: string; post: Post }

/** Thẻ sự kiện: ảnh bìa, dòng ngày giờ nổi bật, tiêu đề, địa điểm, người tổ chức và sức chứa. */
const EventCard = React.memo(function EventCard({ p }: { p: Post }) {
  const t = useTheme()
  const router = useRouter()
  const e = p.event!
  const start = new Date(e.startTime!)
  const end = e.endTime ? new Date(e.endTime) : null
  const phase = eventPhase({ status: e.status, start, end, count: e.attendeeCount, capacity: e.capacity })
  const online = isOnlineLocation(e.location)
  const place = locationLabel(e.location)
  const when = phase === 'open' || phase === 'full' ? startsIn(start, end) : null
  const muted = phase === 'cancelled' || phase === 'ended'

  return (
    <Card
      style={{ marginHorizontal: 16, marginBottom: 16, padding: 0, overflow: 'hidden' }}
      onPress={() => e.id && router.push({ pathname: '/events/[id]', params: { id: String(e.id), postId: p.id } })}
    >
      <EventCover uri={p.images[0]} start={start} online={online} height={148} rounded dim={muted}>
        <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', gap: 6 }}>
          <EventStatusTag phase={phase} registered={e.isRegistered} onCover />
        </View>
      </EventCover>
      <View style={{ padding: 16, gap: 6 }}>
        <Txt size={12} weight="700" color={muted ? t.textMuted : t.primary} numberOfLines={1}>
          {eventEyebrow(start)}
          {when ? <Txt size={12} weight="500" muted>{`  ·  ${when}`}</Txt> : null}
        </Txt>
        <Txt weight="700" size={17} numberOfLines={2}>{e.title}</Txt>
        {place ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {online ? <Globe size={14} color={t.textMuted} /> : <MapPin size={14} color={t.textMuted} />}
            <Txt muted size={13} numberOfLines={1} style={{ flex: 1 }}>{place}</Txt>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <Avatar uri={p.avatar} name={p.author} size={24} />
          <Txt muted size={13} numberOfLines={1} style={{ flex: 1 }}>{`Tổ chức bởi ${p.author}`}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Users size={14} color={t.textMuted} />
            <Txt size={13} weight="600" style={{ fontVariant: ['tabular-nums'] }}>{`${e.attendeeCount}${e.capacity ? `/${e.capacity}` : ''}`}</Txt>
          </View>
        </View>
        {e.capacity && !muted ? <View style={{ marginTop: 4 }}><CapacityMeter compact count={e.attendeeCount} capacity={e.capacity} /></View> : null}
      </View>
    </Card>
  )
})

/** Sự kiện: tab thời gian, tìm kiếm, lọc nhanh và danh sách nhóm theo ngày (Hôm nay, Ngày mai, ...). */
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

  const rows = useMemo<Row[]>(() => {
    const all = (q.data?.pages.flatMap((p) => p.items) ?? []).filter((p) => p.event?.startTime)
    const filtered = all.filter((p) => {
      const e = p.event!
      const okKw = !keyword || [e.title, e.location, p.text, p.author].some((s) => s && normalize(s).includes(keyword))
      const okQuick =
        quick === 'all' ||
        (quick === 'registered' && e.isRegistered) ||
        (quick === 'available' && (!e.capacity || e.attendeeCount < e.capacity) && e.status !== 'CANCELLED') ||
        (quick === 'online' && isOnlineLocation(e.location))
      return okKw && okQuick
    })
    // Từ hôm nay trở đi xếp gần nhất trước; sự kiện của những ngày trước (tab trong tháng) xuống cuối, mới nhất trước.
    const time = (p: Post) => new Date(p.event!.startTime!).getTime()
    const before = (p: Post) => (daysUntil(new Date(time(p))) < 0 ? 1 : 0)
    const sorted = [...filtered].sort((a, b) => {
      if (before(a) !== before(b)) return before(a) - before(b)
      return before(a) ? time(b) - time(a) : time(a) - time(b)
    })
    const out: Row[] = []
    let current: Extract<Row, { kind: 'header' }> | null = null
    for (const post of sorted) {
      const label = dayGroupLabel(new Date(time(post)))
      if (!current || current.label !== label) {
        current = { kind: 'header', key: `h-${label}`, label, count: 0 }
        out.push(current)
      }
      current.count++
      out.push({ kind: 'event', key: post.id, post })
    }
    return out
  }, [q.data, keyword, quick])

  return (
    <Screen bg={t.card}>
      <Header title="Sự kiện & Họp mặt" right={<IconButton label="Lịch sử tham gia" icon={<History size={20} color={t.text} />} onPress={() => router.push('/events/history')} />} />
      <Segmented<Tab> tabs={[['upcoming', 'Sắp diễn ra'], ['this_month', 'Trong tháng này']]} value={tab} onChange={setTab} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={q.isLoading ? [] : rows}
          keyExtractor={(r) => r.key}
          getItemType={(r) => r.kind}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.card, paddingTop: 12, marginBottom: 8 }}>
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
            q.isLoading ? null : (
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<BrandIcon name="calendar" size={56} />}
                title={keyword || quick !== 'all' ? 'Không có sự kiện phù hợp' : 'Chưa có sự kiện'}
                text={keyword || quick !== 'all' ? 'Thử đổi từ khóa hoặc bộ lọc khác.' : 'Sự kiện mới sẽ xuất hiện ở đây khi được đăng.'}
              />
            )
          }
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 }}>
                <Txt size={15} weight="700" heading>{item.label}</Txt>
                <Txt muted size={13}>{`${item.count} sự kiện`}</Txt>
              </View>
            ) : (
              <EventCard p={item.post} />
            )
          }
        />
      </View>
    </Screen>
  )
}
