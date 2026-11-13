import React from 'react'
import { FlashList } from '@shopify/flash-list'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Empty, Screen } from '@/components/ui'
import { MeetupScribble } from '@/components/MeetupScribble'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { PostCard } from '@/components/PostCard'
import { feedApi } from '@/api/feed'
import { palette } from '@/theme'

export default function SavedPostsScreen() {
  const q = useInfiniteQuery({
    queryKey: ['saved-posts'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getSaved(pageParam),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const posts = q.data?.pages.flatMap((p) => p.items) ?? []
  return (
    <Screen>
      <Header title="Bài viết đã lưu" />
      {q.isLoading ? <ListSkeleton variant="post" /> : (
        <FlashList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty error={q.error} onRetry={() => { void q.refetch() }} icon={<MeetupScribble name="empty_box" size={54} color={palette.primary} />} title="Chưa lưu bài viết nào" text="Bấm biểu tượng Lưu trên bài viết để đọc lại sau." />}
          renderItem={({ item }) => <PostCard post={item} />}
        />
      )}
    </Screen>
  )
}
