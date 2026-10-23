import React, { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { BadgeCheck, CheckCircle2, Clock, Flame, HelpCircle, MessageSquare, PenSquare } from '@/components/icons'
import { Avatar, Button, Card, Chip, Empty, PageHeader, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { FilterButton, FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { VoteButton } from '@/components/VoteButton'
import { forumApi } from '@/api/forum'
import type { Question } from '@/api/forum'
import { authApi } from '@/api/auth'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { ListSkeleton } from '@/components/Skeleton'

const SORTS: [string, string, React.ComponentType<{ size: number; color: string }>][] = [
  ['recent', 'Mới nhất', Clock],
  ['votes', 'Nhiều bình chọn', Flame],
  ['answers', 'Nhiều trả lời', CheckCircle2],
]

const QuestionCard = React.memo(function QuestionCard({ item }: { item: Question }) {
  const t = useTheme()
  const router = useRouter()
  return (
    <Card style={{ marginHorizontal: 12, marginBottom: 10 }} onPress={() => router.push({ pathname: '/forum/[id]', params: { id: item.id } })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar uri={item.avatar} name={item.author} size={32} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Txt size={13} weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>{item.author}</Txt>
            {item.verified ? <BadgeCheck size={13} color={t.info} /> : null}
          </View>
          <Txt muted size={11} numberOfLines={1}>{[item.major, item.time].filter(Boolean).join(' · ')}</Txt>
        </View>
      </View>
      <Txt weight="800" size={16} style={{ marginTop: 10, lineHeight: 22 }} numberOfLines={3}>{item.title}</Txt>
      {item.excerpt ? <Txt muted numberOfLines={2} style={{ marginTop: 4, lineHeight: 20 }}>{item.excerpt}</Txt> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 }}>
        <VoteButton voted={item.voted} votes={item.votes} onVote={() => forumApi.vote(item.id)} onUnvote={() => forumApi.unvote(item.id)} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MessageSquare size={17} color={item.answers ? t.success : t.textMuted} />
          <Txt size={13} weight="600" color={item.answers ? t.success : t.textMuted}>{`${item.answers ?? 0} trả lời`}</Txt>
        </View>
        <View style={{ flex: 1 }} />
        {item.topic ? <Tag label={item.topic} tone="neutral" /> : null}
      </View>
    </Card>
  )
})

/** Hỏi đáp: tìm kiếm, sắp xếp và lọc nhiều thể loại / nhiều ngành như Web. */
export default function ForumTab() {
  const t = useTheme()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<FilterValues>({ sort: 'recent' })
  const [sheet, setSheet] = useState(false)
  const keyword = useDebounced(search, 400)
  const topics = useQuery({ queryKey: ['forum-topics'], queryFn: forumApi.topics, staleTime: 30 * 60_000 })
  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors, staleTime: 30 * 60_000 })

  const topicIds = ((filters.topics as string[]) ?? []).map(Number)
  const majorIds = ((filters.majors as string[]) ?? []).map(Number)
  const sort = (filters.sort as string) ?? 'recent'

  const q = useInfiniteQuery({
    queryKey: ['forum', keyword, sort, topicIds, majorIds],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => forumApi.list({ page: pageParam, keyword, sort, topicIds, majorIds }),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  const fields: FilterField[] = useMemo(
    () => [
      { key: 'sort', title: 'Sắp xếp', type: 'single', options: SORTS.map(([k, l]) => ({ value: k, label: l })) },
      { key: 'topics', title: 'Thể loại (chọn nhiều)', type: 'multi', options: (topics.data ?? []).map((tp) => ({ value: String(tp.id), label: tp.name })) },
      { key: 'majors', title: 'Ngành (chọn nhiều)', type: 'multi', options: (majors.data?.data ?? []).map((m) => ({ value: String(m.id), label: m.name })) },
    ],
    [topics.data, majors.data],
  )
  const toggleTopic = (id: string) =>
    setFilters((f) => {
      const cur = (f.topics as string[]) ?? []
      return { ...f, topics: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] }
    })

  return (
    <Screen bg={t.card}>
      <PageHeader title="Hỏi đáp" right={<Button title="Đặt câu hỏi" size="sm" icon={<PenSquare size={16} color={t.onPrimary} />} onPress={() => router.push('/forum/ask')} />} />
      <View style={{ flex: 1, backgroundColor: t.card }}>
        <FlashList
          data={q.isLoading ? [] : items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.card, paddingTop: 4 }}>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Tìm câu hỏi theo tiêu đề, nội dung..."
                  style={{ paddingHorizontal: 16 }}
                  right={<FilterButton count={countActive(filters, ['sort'])} onPress={() => setSheet(true)} />}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Chip label="Mọi thể loại" active={topicIds.length === 0} onPress={() => setFilters((f) => ({ ...f, topics: [] }))} />
                  {(topics.data ?? []).map((tp) => (
                    <Chip key={tp.id} label={tp.name} active={topicIds.includes(tp.id)} onPress={() => toggleTopic(String(tp.id))} />
                  ))}
                </ScrollView>
              </View>
              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty
                icon={<HelpCircle size={28} color={t.primary} />}
                title="Chưa có câu hỏi phù hợp"
                text="Đặt câu hỏi để nhận lời khuyên từ cựu sinh viên."
                action="Đặt câu hỏi"
                onAction={() => router.push('/forum/ask')}
              />
            )
          }
          renderItem={({ item }) => <QuestionCard item={item} />}
        />
      </View>
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} title="Lọc câu hỏi" fields={fields} values={filters} defaults={{ sort: 'recent' }} onApply={setFilters} />
    </Screen>
  )
}
