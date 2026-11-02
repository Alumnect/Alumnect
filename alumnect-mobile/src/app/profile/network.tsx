import React, { useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Empty, Screen, Segmented } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { UserRow } from '@/components/UserRow'
import { userApi } from '@/api/users'

export default function NetworkListScreen() {
  const { id, tab: initial } = useLocalSearchParams<{ id: string; tab?: string }>()
  const [tab, setTab] = useState<'followers' | 'following'>(initial === 'following' ? 'following' : 'followers')
  const q = useInfiniteQuery({
    queryKey: ['network', id, tab],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => (tab === 'followers' ? userApi.followers(id!, pageParam) : userApi.following(id!, pageParam)),
    getNextPageParam: (l) => (l.data.last ? undefined : l.data.pageNumber + 1),
  })
  const users = q.data?.pages.flatMap((p) => p.data.content) ?? []
  return (
    <Screen>
      <Header title="Kết nối" />
      <Segmented tabs={[['followers', 'Người theo dõi'], ['following', 'Đang theo dõi']]} value={tab} onChange={(k) => setTab(k as typeof tab)} />
      {q.isLoading ? <ListSkeleton variant="row" /> : (
        <FlashList
          data={users}
          keyExtractor={(u) => String(u.userId)}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          ListEmptyComponent={<Empty error={q.error} onRetry={() => { void q.refetch() }} title="Danh sách trống" text={tab === 'followers' ? 'Chưa có ai theo dõi.' : 'Chưa theo dõi ai.'} />}
          renderItem={({ item }) => <UserRow user={item} />}
        />
      )}
    </Screen>
  )
}
