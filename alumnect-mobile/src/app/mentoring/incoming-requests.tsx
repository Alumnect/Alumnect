import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Inbox } from '@/components/icons'
import { Avatar, Card, Empty, Screen, Segmented, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ListSkeleton } from '@/components/Skeleton'
import { RESPONSE_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import { statusTone } from '@/constants/status'
import { useTheme } from '@/theme'

type Tab = 'ALL' | 'WAITING' | 'ACCEPTED' | 'DECLINED'

/** UC93: yêu cầu đến dành cho mentor. */
export default function IncomingRequestsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('ALL')
  const status = tab === 'ALL' ? undefined : tab
  const q = useInfiniteQuery({
    queryKey: ['mentoring-incoming', status],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => requestApi.incoming({ status, page: pageParam }),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  return (
    <Screen bg={t.card}>
      <Header title="Yêu cầu đến" subtitle="Sinh viên đang cần bạn hỗ trợ" />
      <Segmented<Tab> tabs={[['ALL', 'Tất cả'], ['WAITING', 'Đang chờ'], ['ACCEPTED', 'Đã nhận'], ['DECLINED', 'Từ chối']]} value={tab} onChange={setTab} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {q.isLoading ? <ListSkeleton variant="row" /> : (
          <FlashList
            data={items}
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={{ paddingVertical: 12 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            ListEmptyComponent={<Empty error={q.error} onRetry={() => { void q.refetch() }} icon={<Inbox size={28} color={t.primary} />} title="Chưa có yêu cầu" text="Khi sinh viên gửi yêu cầu phù hợp, bạn sẽ thấy ở đây." />}
            renderItem={({ item }) => (
              <Card style={{ marginHorizontal: 16, marginBottom: 16 }} onPress={() => router.push({ pathname: '/mentoring/incoming/[id]', params: { id: String(item.id) } })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar uri={item.studentAvatar} name={item.studentName} size={44} />
                  <View style={{ flex: 1 }}>
                    <Txt weight="700" numberOfLines={1}>{item.studentName}</Txt>
                    <Txt muted size={12}>{taskTypeLabel(item.taskType)}</Txt>
                  </View>
                  <Tag label={RESPONSE_STATUS_LABEL[item.responseStatus] ?? item.responseStatus} tone={statusTone(item.responseStatus)} />
                </View>
                <Txt weight="800" size={15} style={{ marginTop: 10 }} numberOfLines={2}>{item.title}</Txt>
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  )
}
