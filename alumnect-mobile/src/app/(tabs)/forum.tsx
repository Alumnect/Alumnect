import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { BadgeCheck, CheckCircle2, Clock, Flame, HelpCircle, MessageSquare, PenSquare } from '@/components/icons'
import { Avatar, Button, Chip, Empty, PageHeader, Screen, SearchBar, Tag, Txt } from '@/components/ui'
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

/** Thẻ câu hỏi dạng toàn chiều rộng, cùng nhịp với bài viết ở bảng tin: tác giả, tiêu đề, trích đoạn, bình chọn / trả lời. */
const QuestionCard = React.memo(function QuestionCard({ item }: { item: Question }) {
  const t = useTheme()
  const router = useRouter()
  const open = () => router.push({ pathname: '/forum/[id]', params: { id: item.id } })
  const openAuthor = () => item.authorId && router.push({ pathname: '/profile/[id]', params: { id: item.authorId } })
  return (
    <View style={{ backgroundColor: t.card, paddingTop: 12, paddingBottom: 4, marginBottom: 8, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: t.border }}>
      <Pressable onPress={openAuthor} accessibilityRole="button" accessibilityLabel={`Trang cá nhân ${item.author}`} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
        <Avatar uri={item.avatar} name={item.author} size={40} />
        <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Txt weight="700" size={15} numberOfLines={1} style={{ flexShrink: 1 }}>{item.author}</Txt>
            {item.verified ? <BadgeCheck size={15} color={t.info} weight="fill" /> : null}
          </View>
          <Txt muted size={12} numberOfLines={1}>{[item.major, item.time].filter(Boolean).join(' · ')}</Txt>
        </View>
      </Pressable>
      <Pressable onPress={open} accessibilityRole="link" accessibilityLabel={item.title} style={{ paddingHorizontal: 14, marginTop: 10 }}>
        <Txt weight="700" size={17} style={{ lineHeight: 24 }} numberOfLines={3}>{item.title}</Txt>
        {item.excerpt ? <Txt muted size={14} numberOfLines={2} style={{ marginTop: 4, lineHeight: 21 }}>{item.excerpt}</Txt> : null}
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 6, paddingTop: 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.divider }}>
        <View style={{ paddingHorizontal: 8 }}>
          <VoteButton voted={item.voted} votes={item.votes} onVote={() => forumApi.vote(item.id)} onUnvote={() => forumApi.unvote(item.id)} />
        </View>
        <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${item.answers ?? 0} trả lời`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 8 }}>
          <MessageSquare size={20} color={item.answers ? t.success : t.textMuted} />
          <Txt size={13} weight="600" color={item.answers ? t.success : t.textMuted}>{item.answers ? `${item.answers} trả lời` : 'Chưa có trả lời'}</Txt>
        </Pressable>
        <View style={{ flex: 1 }} />
        {item.topic ? <Tag label={item.topic} tone="neutral" style={{ maxWidth: '42%', marginRight: 8, alignSelf: 'center' }} /> : null}
      </View>
    </View>
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

  const selectedTopics = (filters.topics as string[]) ?? []
  const topicIds = selectedTopics.map(Number)
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
      { key: 'majors', title: 'Ngành (chọn nhiều)', type: 'multi', options: (majors.data?.data ?? []).map((m) => ({ value: String(m.id), label: m.name })) },
    ],
    [majors.data],
  )

  return (
    <Screen bg={t.card}>
      <PageHeader title="Hỏi đáp" right={<Button title="Đặt câu hỏi" size="sm" icon={<PenSquare size={16} color={t.onPrimary} />} onPress={() => router.push('/forum/ask')} />} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={q.isLoading ? [] : items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
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
                  right={<FilterButton count={countActive(filters, ['sort', 'topics'])} onPress={() => setSheet(true)} />}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Chip label="Tất cả" active={!selectedTopics.length} onPress={() => setFilters((f) => ({ ...f, topics: [] }))} />
                  {(topics.data ?? []).map((tp) => {
                    const id = String(tp.id)
                    const on = selectedTopics.includes(id)
                    return <Chip key={tp.id} label={tp.name} active={on} onPress={() => setFilters((f) => ({ ...f, topics: on ? selectedTopics.filter((x) => x !== id) : [...selectedTopics, id] }))} />
                  })}
                </ScrollView>
              </View>
              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty error={q.error} onRetry={() => { void q.refetch() }}
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
