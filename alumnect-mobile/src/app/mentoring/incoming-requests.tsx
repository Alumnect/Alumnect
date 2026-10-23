import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Avatar, Card, Chip, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { RESPONSE_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import { useTheme } from '@/theme'

const FILTERS: [string | undefined, string][] = [[undefined, 'Tất cả'], ['WAITING', 'Đang chờ'], ['ACCEPTED', 'Đã nhận'], ['DECLINED', 'Đã từ chối']]

/** UC93: yêu cầu đến dành cho mentor. */
export default function IncomingRequestsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [status, setStatus] = useState<string | undefined>()
  const q = useInfiniteQuery({
    queryKey: ['mentoring-incoming', status],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => requestApi.incoming({ status, page: pageParam }),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  return (
    <Screen>
      <Header title="Yêu cầu đến" />
      <View style={{ flexDirection: 'row', padding: 12 }}>
        {FILTERS.map(([k, l]) => <Chip key={l} label={l} active={status === k} onPress={() => setStatus(k)} />)}
      </View>
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text="Chưa có yêu cầu nào." />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 10 }} onPress={() => router.push({ pathname: '/mentoring/incoming/[id]', params: { id: String(item.id) } })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar uri={item.studentAvatar} name={item.studentName} size={40} />
                <View style={{ flex: 1 }}>
                  <Txt weight="700" numberOfLines={1}>{item.title}</Txt>
                  <Txt muted size={12}>{item.studentName} · {taskTypeLabel(item.taskType)}</Txt>
                </View>
                <Txt size={12} weight="700" color={item.responseStatus === 'ACCEPTED' ? t.success : t.primary}>{RESPONSE_STATUS_LABEL[item.responseStatus] ?? item.responseStatus}</Txt>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
