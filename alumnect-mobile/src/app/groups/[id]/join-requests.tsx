import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { withGroupsAlumniOnly } from '@/components/GroupsAlumniOnly'
import { groupApi } from '@/api/groups'
import { toast, errMsg } from '@/lib/toast'

/** UC122: duyệt / từ chối yêu cầu tham gia (kèm thời gian gửi yêu cầu như web). */
function JoinRequestsScreen() {
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const gid = Number(id)
  const [busy, setBusy] = useState<number | null>(null)
  const q = useInfiniteQuery({
    queryKey: ['group-requests', gid],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => groupApi.joinRequests(gid, pageParam),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []
  const handle = (requestId: number, action: 'APPROVE' | 'REJECT') => {
    setBusy(requestId)
    groupApi.handleRequest(gid, requestId, action)
      .then(() => {
        toast.success(action === 'APPROVE' ? 'Đã duyệt yêu cầu tham gia.' : 'Đã từ chối yêu cầu tham gia.')
        qc.invalidateQueries({ queryKey: ['group-requests', gid] })
        qc.invalidateQueries({ queryKey: ['group', id] })
        qc.invalidateQueries({ queryKey: ['group-members', 'g', gid] })
      })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setBusy(null))
  }

  return (
    <Screen>
      <Header title="Yêu cầu tham gia" />
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(r) => String(r.requestId)}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          ListEmptyComponent={
            <Empty
              error={q.error}
              onRetry={() => { void q.refetch() }}
              icon={<BrandIcon name="people" size={56} />}
              title="Không có yêu cầu nào đang chờ"
              text="Khi có người gửi yêu cầu tham gia, bạn sẽ thấy họ ở đây."
            />
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar uri={item.avatarUrl} name={item.fullName} size={44} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt weight="700" numberOfLines={1}>{item.fullName}</Txt>
                  {item.headline ? <Txt muted size={12} numberOfLines={1}>{item.headline}</Txt> : null}
                  {item.requestedAt ? <Txt muted size={11}>{`Gửi lúc ${new Date(item.requestedAt).toLocaleString('vi-VN')}`}</Txt> : null}
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="Duyệt" loading={busy === item.requestId} disabled={busy !== null} style={{ flex: 1, minHeight: 44 }} onPress={() => handle(item.requestId, 'APPROVE')} />
                <Button title="Từ chối" variant="outline" disabled={busy !== null} style={{ flex: 1, minHeight: 44 }} onPress={() => handle(item.requestId, 'REJECT')} />
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  )
}

export default withGroupsAlumniOnly(JoinRequestsScreen)
