import React from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { groupApi } from '@/api/groups'
import { toast, errMsg } from '@/lib/toast'

/** UC122: duyệt / từ chối yêu cầu tham gia. */
export default function JoinRequestsScreen() {
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const gid = Number(id)
  const q = useInfiniteQuery({
    queryKey: ['group-requests', gid],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => groupApi.joinRequests(gid, pageParam),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []
  const handle = (requestId: number, action: 'APPROVE' | 'REJECT') =>
    groupApi.handleRequest(gid, requestId, action)
      .then(() => {
        toast.success(action === 'APPROVE' ? 'Đã duyệt yêu cầu tham gia.' : 'Đã từ chối yêu cầu tham gia.')
        qc.invalidateQueries({ queryKey: ['group-requests', gid] })
        qc.invalidateQueries({ queryKey: ['group', id] })
      })
      .catch((e) => toast.error(errMsg(e)))

  return (
    <Screen>
      <Header title="Yêu cầu tham gia" />
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(r) => String(r.requestId)}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          ListEmptyComponent={<Empty text="Không có yêu cầu nào đang chờ." />}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Avatar uri={item.avatarUrl} name={item.fullName} size={44} />
              <View style={{ flex: 1 }}>
                <Txt weight="700">{item.fullName}</Txt>
                <Txt muted size={12} numberOfLines={1}>{item.headline ?? ''}</Txt>
              </View>
              <Button title="Duyệt" style={{ height: 36, paddingHorizontal: 12 }} onPress={() => handle(item.requestId, 'APPROVE')} />
              <Button title="Từ chối" variant="outline" style={{ height: 36, paddingHorizontal: 12 }} onPress={() => handle(item.requestId, 'REJECT')} />
            </View>
          )}
        />
      )}
    </Screen>
  )
}
