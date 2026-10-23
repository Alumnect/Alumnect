import React from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Card, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { REQUEST_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import { useTheme } from '@/theme'

/** UC92: danh sách yêu cầu của tôi. */
export default function MyRequestsScreen() {
  const t = useTheme()
  const router = useRouter()
  const q = useInfiniteQuery({
    queryKey: ['mentoring-requests'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => requestApi.mine(pageParam),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  return (
    <Screen>
      <Header title="Yêu cầu của tôi" />
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text="Bạn chưa có yêu cầu nào." />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 10 }} onPress={() => router.push({ pathname: '/mentoring/request/[id]', params: { id: String(item.id) } })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Txt weight="700" style={{ flex: 1 }} numberOfLines={2}>{item.title}</Txt>
                <Txt size={12} weight="700" color={t.primary}>{REQUEST_STATUS_LABEL[item.status] ?? item.status}</Txt>
              </View>
              <Txt muted size={13} style={{ marginTop: 4 }}>{taskTypeLabel(item.taskType)} · {item.industryName}</Txt>
              <Txt muted size={12} style={{ marginTop: 2 }}>
                {item.requestType === 'DIRECT' ? `Gửi trực tiếp: ${item.targetMentorName ?? ''}` : `${item.matchedCount} mentor phù hợp`} · {new Date(item.createdAt).toLocaleDateString('vi-VN')}
              </Txt>
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
