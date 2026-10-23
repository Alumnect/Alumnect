import React from 'react'
import { FlashList } from '@shopify/flash-list'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Empty, Loading, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { PostCard } from '@/components/PostCard'
import { feedApi } from '@/api/feed'

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
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          ListEmptyComponent={<Empty text="Bạn chưa lưu bài viết nào." />}
          renderItem={({ item }) => <PostCard post={item} />}
        />
      )}
    </Screen>
  )
}
