import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { CalendarDays, FilePlus2, FileText, Users } from '@/components/icons'
import { Button, Card, Empty, Screen, Segmented, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ListSkeleton } from '@/components/Skeleton'
import { REQUEST_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import { statusTone } from '@/constants/status'
import { useTheme } from '@/theme'

type Tab = 'ALL' | 'OPEN' | 'MATCHED' | 'DONE'

/** UC92: danh sách yêu cầu của tôi, chia theo trạng thái. */
export default function MyRequestsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('ALL')
  const q = useInfiniteQuery({
    queryKey: ['mentoring-requests'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => requestApi.mine(pageParam),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const all = q.data?.pages.flatMap((p) => p.content) ?? []
  const items = all.filter((r) => tab === 'ALL' || (tab === 'DONE' ? ['CLOSED', 'CANCELLED', 'EXPIRED'].includes(r.status) : r.status === tab))

  return (
    <Screen bg={t.card}>
      <Header title="Yêu cầu của tôi" right={<Button title="Tạo mới" size="sm" icon={<FilePlus2 size={15} color="#fff" />} onPress={() => router.push('/mentoring/create-request')} />} />
      <Segmented<Tab> tabs={[['ALL', 'Tất cả'], ['OPEN', 'Đang mở'], ['MATCHED', 'Đã ghép'], ['DONE', 'Đã kết thúc']]} value={tab} onChange={setTab} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {q.isLoading ? <ListSkeleton variant="row" /> : (
          <FlashList
            data={items}
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={{ paddingVertical: 12 }}
            onEndReached={() => q.hasNextPage && q.fetchNextPage()}
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            ListEmptyComponent={
              <Empty icon={<FileText size={28} color={t.primary} />} title="Chưa có yêu cầu" text="Tạo yêu cầu để hệ thống ghép bạn với mentor phù hợp." action="Tạo yêu cầu" onAction={() => router.push('/mentoring/create-request')} />
            }
            renderItem={({ item }) => (
              <Card style={{ marginHorizontal: 12, marginBottom: 10 }} onPress={() => router.push({ pathname: '/mentoring/request/[id]', params: { id: String(item.id) } })}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Txt weight="800" size={15} style={{ flex: 1 }} numberOfLines={2}>{item.title}</Txt>
                  <Tag label={REQUEST_STATUS_LABEL[item.status] ?? item.status} tone={statusTone(item.status)} />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  <Tag label={taskTypeLabel(item.taskType)} tone="neutral" />
                  {item.industryName ? <Tag label={item.industryName} tone="neutral" /> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.divider }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                    <Users size={14} color={t.textMuted} />
                    <Txt muted size={12} numberOfLines={1}>{item.requestType === 'DIRECT' ? `Gửi trực tiếp: ${item.targetMentorName ?? ''}` : `${item.matchedCount} mentor phù hợp`}</Txt>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <CalendarDays size={14} color={t.textMuted} />
                    <Txt muted size={12}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Txt>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  )
}
