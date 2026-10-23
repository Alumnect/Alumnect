import React from 'react'
import { FlashList } from '@shopify/flash-list'
import { useInfiniteQuery } from '@tanstack/react-query'
import { View } from 'react-native'
import { Bookmark } from '@/components/icons'
import { Empty, Screen } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { palette } from '@/theme'
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
      {q.isLoading ? <ListSkeleton variant="post" /> : (
        <FlashList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty icon={<Bookmark size={26} color={palette.primary} />} title="Chưa lưu bài viết nào" text="Bấm biểu tượng Lưu trên bài viết để đọc lại sau." />}
          renderItem={({ item }) => <PostCard post={item} />}
        />
      )}
    </Screen>
  )
}
