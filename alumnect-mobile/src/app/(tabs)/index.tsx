import React, { useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Bell, MessageCircle, Plus, Search } from 'lucide-react-native'
import { Screen, Txt, Chip, Empty } from '@/components/ui'
import { PostCard } from '@/components/PostCard'
import { feedApi } from '@/api/feed'
import type { FeedFilter, Post } from '@/api/feed'
import { useTheme } from '@/theme'
import { useDebounced } from '@/lib/hooks'
import { useUnreadCount } from '@/api/notifications'
import { ListSkeleton } from '@/components/Skeleton'

const FILTERS: [FeedFilter, string][] = [
  ['all', 'Tất cả'],
  ['normal', 'Bài thường'],
  ['achievement', 'Thành tựu'],
  ['recruitment', 'Tuyển dụng'],
  ['event', 'Sự kiện'],
]

export default function FeedScreen() {
  const t = useTheme()
  const router = useRouter()
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [search, setSearch] = useState('')
  const keyword = useDebounced(search, 400)
  const unread = useUnreadCount()

  const q = useInfiniteQuery({
    queryKey: ['feed', filter, keyword],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getFeed({ page: pageParam, filter, keyword }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  })
  const posts: Post[] = q.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, gap: 10 }}>
        <Txt size={24} weight="800" color={t.primary} style={{ flex: 1 }}>Alumnect</Txt>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
          <Bell size={24} color={t.text} />
          {unread > 0 ? (
            <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: t.danger, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={10} weight="700" color="#fff">{unread > 99 ? '99+' : unread}</Txt>
            </View>
          ) : null}
        </Pressable>
        <Pressable onPress={() => router.push('/chat')} hitSlop={8}>
          <MessageCircle size={24} color={t.text} />
        </Pressable>
      </View>

      <View style={{ margin: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 12 }}>
        <Search size={18} color={t.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Tìm kiếm bài viết..." placeholderTextColor={t.textMuted} style={{ flex: 1, color: t.text, paddingVertical: 10, paddingHorizontal: 8 }} />
      </View>

      <View style={{ height: 44 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {FILTERS.map(([k, label]) => (
            <Chip key={k} label={label} active={filter === k} onPress={() => setFilter(k)} />
          ))}
        </ScrollView>
      </View>

      {q.isLoading ? (
        <ListSkeleton variant="post" />
      ) : (
        <FlashList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshing={q.isRefetching}
          onRefresh={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            q.refetch()
          }}
          ListEmptyComponent={<Empty text="Chưa có bài viết nào." />}
        />
      )}

      <Pressable
        onPress={() => router.push('/post/create')}
        style={{ position: 'absolute', right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 }}
      >
        <Plus size={28} color="#fff" />
      </Pressable>
    </Screen>
  )
}
