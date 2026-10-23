import React, { useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { MessageSquare, Plus, Search } from 'lucide-react-native'
import { Avatar, Card, Chip, Empty, Screen, Txt } from '@/components/ui'
import { VoteButton } from '@/components/VoteButton'
import { forumApi } from '@/api/forum'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { ListSkeleton } from '@/components/Skeleton'

const SORTS: [string, string][] = [['recent', 'Mới nhất'], ['votes', 'Nhiều vote'], ['answers', 'Nhiều trả lời']]

export default function ForumTab() {
  const t = useTheme()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const [topicId, setTopicId] = useState<number | undefined>()
  const keyword = useDebounced(search, 400)
  const topics = useQuery({ queryKey: ['forum-topics'], queryFn: forumApi.topics })
  const q = useInfiniteQuery({
    queryKey: ['forum', keyword, sort, topicId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => forumApi.list({ page: pageParam, keyword, sort, topicId }),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <Screen>
      <Txt size={24} weight="800" style={{ paddingHorizontal: 16, paddingTop: 8 }}>Hỏi đáp</Txt>
      <View style={{ margin: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 12 }}>
        <Search size={18} color={t.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Tìm câu hỏi..." placeholderTextColor={t.textMuted} style={{ flex: 1, color: t.text, paddingVertical: 10, paddingHorizontal: 8 }} />
      </View>
      <View style={{ height: 44 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {SORTS.map(([k, l]) => <Chip key={k} label={l} active={sort === k} onPress={() => setSort(k)} />)}
        </ScrollView>
      </View>
      <View style={{ height: 44 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <Chip label="Mọi chủ đề" active={!topicId} onPress={() => setTopicId(undefined)} />
          {(topics.data ?? []).map((tp) => <Chip key={tp.id} label={tp.name} active={topicId === tp.id} onPress={() => setTopicId(tp.id)} />)}
        </ScrollView>
      </View>
      {q.isLoading ? <ListSkeleton variant="post" /> : (
        <FlashList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text="Chưa có câu hỏi nào." />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 12 }} onPress={() => router.push({ pathname: '/forum/[id]', params: { id: item.id } })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Avatar uri={item.avatar} name={item.author} size={28} />
                <Txt size={13} weight="600" style={{ flex: 1 }} numberOfLines={1}>{item.author}</Txt>
                <Txt muted size={12}>{item.time}</Txt>
              </View>
              <Txt weight="700" size={16} style={{ marginTop: 8 }}>{item.title}</Txt>
              {item.excerpt ? <Txt muted numberOfLines={2} style={{ marginTop: 4 }}>{item.excerpt}</Txt> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 }}>
                <VoteButton voted={item.voted} votes={item.votes} onVote={() => forumApi.vote(item.id)} onUnvote={() => forumApi.unvote(item.id)} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MessageSquare size={16} color={t.textMuted} /><Txt muted size={13}>{item.answers}</Txt>
                </View>
                {item.topic ? <Txt size={12} color={t.primary} weight="600">{item.topic}</Txt> : null}
              </View>
            </Card>
          )}
        />
      )}
      <Pressable onPress={() => router.push('/forum/ask')} style={{ position: 'absolute', right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 }}>
        <Plus size={28} color="#fff" />
      </Pressable>
    </Screen>
  )
}
