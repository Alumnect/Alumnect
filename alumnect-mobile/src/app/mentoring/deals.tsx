import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Button, Card, Chip, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { DEAL_STATUS_LABEL, dealApi, taskTypeLabel } from '@/api/mentoringFlow'
import type { DealStatus } from '@/api/mentoringFlow'
import { formatVnd } from '@/api/mentoring'
import { useTheme } from '@/theme'

const TABS: [DealStatus | undefined, string][] = [[undefined, 'Tất cả'], ['DEAL_CONFIRMED', 'Đã chốt'], ['CANCELLED', 'Đã hủy']]

/** Danh sách thỏa thuận Mentoring (UC94): chỉ liệt kê và dẫn tới chi tiết / chat, không tạo deal độc lập. */
export default function DealsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [status, setStatus] = useState<DealStatus | undefined>()
  const q = useInfiniteQuery({
    queryKey: ['mentoring-deals', status],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => dealApi.mine(status, pageParam),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []

  return (
    <Screen>
      <Header title="Thỏa thuận" />
      <View style={{ height: 52 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
          {TABS.map(([k, l]) => <Chip key={l} label={l} active={status === k} onPress={() => setStatus(k)} />)}
        </ScrollView>
      </View>
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text={status ? 'Không có thỏa thuận nào ở trạng thái này.' : 'Thỏa thuận được tạo trong phần trao đổi sau khi Mentor đồng ý yêu cầu.'} />}
          renderItem={({ item: d }) => (
            <Card style={{ marginBottom: 12 }} onPress={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(d.id) } })}>
              <Txt weight="700" size={16} numberOfLines={2}>{d.requestTitle || d.taskScope}</Txt>
              <Txt muted size={13} style={{ marginTop: 2 }}>{d.studentName} ↔ {d.mentorName}</Txt>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Txt weight="800">{formatVnd(d.agreedPrice)}</Txt>
                <Txt size={12} weight="700" color={d.status === 'DEAL_CONFIRMED' ? t.success : d.status === 'CANCELLED' || d.status === 'REJECTED' ? t.danger : t.primary}>{DEAL_STATUS_LABEL[d.status] ?? d.status}</Txt>
              </View>
              <Txt muted size={12} style={{ marginTop: 4 }}>{taskTypeLabel(d.taskType)} · Hạn: {new Date(d.deadline).toLocaleDateString('vi-VN')}{d.isPaid ? ' · Đã thanh toán' : ''}</Txt>
              {d.conversationId ? <Button title="Mở chat" variant="outline" style={{ marginTop: 10, height: 38 }} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(d.conversationId) } })} /> : null}
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
