import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Button, Card, Chip, Empty, Screen, Tag, Txt } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { statusTone } from '@/constants/status'
import { Handshake, MessageCircle } from '@/components/icons'
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
    <Screen bg={t.card}>
      <Header title="Thỏa thuận" />
      <View style={{ backgroundColor: t.card }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}>
          {TABS.map(([k, l]) => <Chip key={l} label={l} active={status === k} onPress={() => setStatus(k)} />)}
        </ScrollView>
      </View>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {q.isLoading ? <ListSkeleton variant="row" /> : (
          <FlashList
            data={items}
            keyExtractor={(d) => String(d.id)}
            contentContainerStyle={{ paddingVertical: 12 }}
            onEndReached={() => q.hasNextPage && q.fetchNextPage()}
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            ListEmptyComponent={
              <Empty
                icon={<Handshake size={28} color={t.primary} />}
                title="Chưa có thỏa thuận"
                text={status ? 'Không có thỏa thuận nào ở trạng thái này.' : 'Thỏa thuận được tạo trong phần trao đổi sau khi Mentor đồng ý yêu cầu.'}
              />
            }
            renderItem={({ item: d }) => (
              <Card style={{ marginHorizontal: 12, marginBottom: 10 }} onPress={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(d.id) } })}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Txt weight="800" size={15} numberOfLines={2} style={{ flex: 1 }}>{d.requestTitle || d.taskScope}</Txt>
                  <Tag label={DEAL_STATUS_LABEL[d.status] ?? d.status} tone={statusTone(d.status)} />
                </View>
                <Txt muted size={13} style={{ marginTop: 4 }}>{`${d.studentName} ↔ ${d.mentorName}`}</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  <Tag label={taskTypeLabel(d.taskType)} tone="neutral" />
                  <Tag label={`Hạn ${new Date(d.deadline).toLocaleDateString('vi-VN')}`} tone="neutral" />
                  {d.isPaid ? <Tag label="Đã thanh toán" tone="success" /> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.divider }}>
                  <Txt weight="800" size={16} color={t.primary} style={{ flex: 1 }}>{formatVnd(d.agreedPrice)}</Txt>
                  {d.conversationId ? (
                    <Button title="Mở chat" size="sm" variant="secondary" icon={<MessageCircle size={14} color={t.primary} />} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(d.conversationId) } })} />
                  ) : null}
                </View>
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  )
}
