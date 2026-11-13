import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Chip, ChipRow, Empty, Screen } from '@/components/ui'
import { MeetupScribble } from '@/components/MeetupScribble'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { PostCard } from '@/components/PostCard'
import { feedApi } from '@/api/feed'
import type { FeedFilter } from '@/api/feed'
import { useAuthStore } from '@/store/authStore'
import { palette } from '@/theme'

const FILTERS: [FeedFilter, string][] = [
  ['all', 'Tất cả'],
  ['achievement', 'Thành tựu'],
  ['recruitment', 'Tuyển dụng'],
  ['event', 'Sự kiện'],
]

/** Bài viết của một người dùng (tab "Bài viết" trên trang hồ sơ — đồng bộ UserPostsView của Web). */
export default function UserPostsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  const me = useAuthStore((s) => s.user)
  const isMe = me?.id === id
  const [filter, setFilter] = useState<FeedFilter>('all')
  const q = useInfiniteQuery({
    queryKey: ['user-posts', id, filter],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getUserPosts(id!, pageParam, filter),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
    enabled: !!id,
  })
  const posts = q.data?.pages.flatMap((p) => p.items) ?? []
  return (
    <Screen>
      <Header title={isMe ? 'Bài viết của tôi' : name ? `Bài viết của ${name}` : 'Bài viết'} />
      <View style={{ paddingTop: 8 }}>
        <ChipRow>
          {FILTERS.map(([k, label]) => <Chip key={k} label={label} active={filter === k} onPress={() => setFilter(k)} />)}
        </ChipRow>
      </View>
      {q.isLoading ? <ListSkeleton variant="post" /> : (
        <FlashList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={
            <Empty
              error={q.error}
              onRetry={() => { void q.refetch() }}
              icon={<MeetupScribble name="empty_box" size={54} color={palette.primary} />}
              title="Chưa có bài viết"
              text={isMe ? 'Những bài bạn đăng sẽ hiển thị tại đây.' : 'Người dùng này chưa đăng bài viết nào.'}
            />
          }
          renderItem={({ item }) => <PostCard post={item} />}
        />
      )}
    </Screen>
  )
}
