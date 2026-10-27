import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Card, Chip, Empty, Screen, Tag, Txt } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { statusTone } from '@/constants/status'
import { Clock, ListChecks } from '@/components/icons'
import { Header } from '@/components/Header'
import { TASK_STAGES, TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'

/** Hạn đã qua chưa (tách khỏi render để giữ component thuần). */
const isPast = (d: Date) => d.getTime() < Date.now()

/** UC96: danh sách task của tôi theo giai đoạn. */
export default function TasksScreen() {
  const t = useTheme()
  const router = useRouter()
  const me = useAuthStore((s) => s.user)
  const [stage, setStage] = useState<string | undefined>()
  const q = useInfiniteQuery({
    queryKey: ['mentoring-tasks', stage],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => taskApi.mine({ stage, page: pageParam }),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  return (
    <Screen bg={t.card}>
      <Header title="Task của tôi" />
      <View style={{ backgroundColor: t.card }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          {TASK_STAGES.map(([k, l]) => <Chip key={l} label={l} active={stage === k} onPress={() => setStage(k)} />)}
        </ScrollView>
      </View>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {q.isLoading ? <ListSkeleton variant="row" /> : (
          <FlashList
            data={items}
            keyExtractor={(x) => String(x.id)}
            contentContainerStyle={{ paddingVertical: 12 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            ListEmptyComponent={<Empty error={q.error} onRetry={() => { void q.refetch() }} icon={<ListChecks size={28} color={t.primary} />} title="Chưa có task" text="Task được tạo sau khi hai bên chốt thỏa thuận." />}
            renderItem={({ item }) => {
              const pct = Math.min(100, item.progressPercentage ?? 0)
              const other = me?.role === 'STUDENT' ? item.mentorName : item.studentName
              const deadline = new Date(item.deadline)
              const late = isPast(deadline) && pct < 100
              return (
                <Card style={{ marginHorizontal: 16, marginBottom: 16 }} onPress={() => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(item.id) } })}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <Txt weight="800" size={15} style={{ flex: 1 }} numberOfLines={2}>{item.taskTitle}</Txt>
                    <Tag label={TASK_STATUS_LABEL[item.status] ?? item.status} tone={statusTone(item.status)} />
                  </View>
                  <Txt muted size={13} style={{ marginTop: 4 }}>{`${me?.role === 'STUDENT' ? 'Mentor' : 'Sinh viên'}: ${other}`}</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <View style={{ flex: 1, height: 8, backgroundColor: t.inputBg, borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ width: `${pct}%`, height: 8, borderRadius: 4, backgroundColor: pct >= 100 ? t.success : t.primary }} />
                    </View>
                    <Txt size={12} weight="800">{`${pct}%`}</Txt>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.divider }}>
                    <Txt weight="800" color={t.primary} style={{ flex: 1 }}>{formatVnd(item.agreedPrice)}</Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} color={late ? t.danger : t.textMuted} />
                      <Txt size={12} color={late ? t.danger : t.textMuted} weight={late ? '700' : '400'}>{`Hạn ${deadline.toLocaleDateString('vi-VN')}`}</Txt>
                    </View>
                  </View>
                  {item.pendingWorkLogs ? <Tag label={`${item.pendingWorkLogs} nhật ký chờ xác nhận`} tone="warning" style={{ marginTop: 8 }} /> : null}
                </Card>
              )
            }}
          />
        )}
      </View>
    </Screen>
  )
}
