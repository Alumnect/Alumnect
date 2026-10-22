import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Card, Chip, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { TASK_STAGES, TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'

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
    <Screen>
      <Header title="Task của tôi" />
      <View style={{ height: 52 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
          {TASK_STAGES.map(([k, l]) => <Chip key={l} label={l} active={stage === k} onPress={() => setStage(k)} />)}
        </ScrollView>
      </View>
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(x) => String(x.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text="Chưa có task nào." />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 10 }} onPress={() => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(item.id) } })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Txt weight="700" style={{ flex: 1 }} numberOfLines={2}>{item.taskTitle}</Txt>
                <Txt size={12} weight="700" color={t.primary}>{TASK_STATUS_LABEL[item.status] ?? item.status}</Txt>
              </View>
              <Txt muted size={13} style={{ marginTop: 4 }}>{me?.role === 'STUDENT' ? `Mentor: ${item.mentorName}` : `Sinh viên: ${item.studentName}`}</Txt>
              <View style={{ height: 6, backgroundColor: t.inputBg, borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(100, item.progressPercentage ?? 0)}%`, height: 6, backgroundColor: t.primary }} />
              </View>
              <Txt muted size={12} style={{ marginTop: 6 }}>{formatVnd(item.agreedPrice)} · Hạn {new Date(item.deadline).toLocaleDateString('vi-VN')}{item.pendingWorkLogs ? ` · ${item.pendingWorkLogs} nhật ký chờ xác nhận` : ''}</Txt>
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
