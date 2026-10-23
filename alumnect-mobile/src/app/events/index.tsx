import React, { useMemo, useState } from 'react'
import { ScrollView, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { CalendarCheck, MapPin, Search, Users } from 'lucide-react-native'
import { Card, Chip, Empty, Screen, Txt } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { feedApi } from '@/api/feed'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

const TABS: [string | undefined, string][] = [['upcoming', 'Sắp diễn ra'], ['this_month', 'Trong tháng này']]

/** Danh sách sự kiện: bài viết loại "event" trong Feed, backend lọc theo eventFilter (giống /app/events trên Web). */
export default function EventsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [tab, setTab] = useState<string | undefined>('upcoming')
  const [kw, setKw] = useState('')
  const keyword = useDebounced(kw, 300).trim().toLowerCase()

  const q = useInfiniteQuery({
    queryKey: ['events-list', tab],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getFeed({ page: pageParam, filter: 'event', eventFilter: tab }),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const events = useMemo(() => {
    const all = (q.data?.pages.flatMap((p) => p.items) ?? []).filter((p) => p.event?.startTime)
    if (!keyword) return all
    return all.filter((p) => [p.event?.title, p.event?.location, p.text, p.author].some((s) => s?.toLowerCase().includes(keyword)))
  }, [q.data, keyword])

  return (
    <Screen>
      <Header title="Sự kiện & Họp mặt" right={<Txt color={t.primary} weight="600" size={13} onPress={() => router.push('/events/history')}>Lịch sử</Txt>} />
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 12 }}>
          <Search size={18} color={t.textMuted} />
          <TextInput value={kw} onChangeText={setKw} placeholder="Tìm sự kiện, địa điểm..." placeholderTextColor={t.textMuted} style={{ flex: 1, color: t.text, paddingVertical: 10, paddingHorizontal: 8 }} />
        </View>
      </View>
      <View style={{ height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}>
          {TABS.map(([k, l]) => <Chip key={l} label={l} active={tab === k} onPress={() => setTab(k)} />)}
        </ScrollView>
      </View>
      {q.isLoading ? (
        <ListSkeleton variant="post" />
      ) : (
        <FlashList
          data={events}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text="Chưa có sự kiện nào." />}
          renderItem={({ item: p }) => {
            const e = p.event!
            const d = new Date(e.startTime!)
            return (
              <Card
                style={{ marginBottom: 12 }}
                onPress={() => e.id && router.push({ pathname: '/events/[id]', params: { id: String(e.id), title: e.title ?? '', start: e.startTime ?? '', end: e.endTime ?? '', location: e.location ?? '', hostId: p.authorId ?? '', postId: p.id } })}
              >
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ width: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: t.primaryTint, paddingVertical: 8 }}>
                    <Txt size={11} weight="700" color={t.primary}>{`TH${d.getMonth() + 1}`}</Txt>
                    <Txt size={22} weight="800" color={t.primary}>{String(d.getDate()).padStart(2, '0')}</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt weight="700" size={16} numberOfLines={2}>{e.title}</Txt>
                    <Txt muted size={13} style={{ marginTop: 2 }}>{d.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</Txt>
                    {e.location ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin size={13} color={t.textMuted} /><Txt muted size={13} numberOfLines={1}>{e.location}</Txt></View> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Users size={13} color={t.textMuted} />
                        <Txt muted size={12}>{e.attendeeCount}{e.capacity ? `/${e.capacity}` : ''} tham gia</Txt>
                      </View>
                      {e.isRegistered ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><CalendarCheck size={13} color={t.primary} /><Txt size={12} weight="700" color={t.primary}>Đã đăng ký</Txt></View> : null}
                      {e.status === 'CANCELLED' ? <Txt size={12} weight="700" color={t.danger}>Đã hủy</Txt> : null}
                    </View>
                  </View>
                </View>
              </Card>
            )
          }}
        />
      )}
    </Screen>
  )
}
