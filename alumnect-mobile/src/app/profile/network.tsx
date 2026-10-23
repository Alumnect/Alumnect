import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Chip, Empty, Loading, Screen } from '@/components/ui'
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
      <View style={{ flexDirection: 'row', padding: 12 }}>
        <Chip label="Người theo dõi" active={tab === 'followers'} onPress={() => setTab('followers')} />
        <Chip label="Đang theo dõi" active={tab === 'following'} onPress={() => setTab('following')} />
      </View>
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={users}
          keyExtractor={(u) => String(u.userId)}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          ListEmptyComponent={<Empty text="Danh sách trống." />}
          renderItem={({ item }) => <UserRow user={item} />}
        />
      )}
    </Screen>
  )
}
