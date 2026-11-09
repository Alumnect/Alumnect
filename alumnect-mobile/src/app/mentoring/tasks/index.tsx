import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Empty, Screen, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { ListSkeleton } from '@/components/Skeleton'
import { statusTone } from '@/constants/status'
import { ChevronRight, Clock, ListChecks } from '@/components/icons'
import { Header } from '@/components/Header'
import { TASK_STAGES, TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'
import { useAuthStore } from '@/store/authStore'
import { useMentoringTheme } from '@/theme/mentoringTheme'

const isPast = (d: Date) => d.getTime() < Date.now()

/** UC96: danh sách task của tôi theo giai đoạn (Meetup x Instagram Card Design). */
export default function TasksScreen() {
  const { colors, viridian, isDark } = useMentoringTheme()
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
    <Screen bg={colors.bg}>
      <Header title="Nhiệm vụ (Tasks)" />
      
      {/* Stage Filter Rail */}
      <View style={[styles.filterRail, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {TASK_STAGES.map(([k, l]) => {
            const active = stage === k
            return (
              <Pressable
                key={l}
                onPress={() => setStage(k)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? viridian : (isDark ? '#2C2C2E' : '#F2F2F7'),
                  },
                ]}
              >
                <Txt
                  size={12}
                  weight={active ? '700' : '500'}
                  style={{ color: active ? '#FFFFFF' : colors.textSecondary }}
                >
                  {l}
                </Txt>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {q.isLoading ? (
          <ListSkeleton variant="row" />
        ) : (
          <FlashList
            data={items}
            keyExtractor={(x) => String(x.id)}
            contentContainerStyle={{ paddingVertical: 14 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            ListEmptyComponent={
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<BrandIcon name="task" size={56} />}
                title="Chưa có nhiệm vụ nào"
                text="Nhiệm vụ sẽ được tạo tự động sau khi hai bên thống nhất thỏa thuận cố vấn."
              />
            }
            renderItem={({ item }) => {
              const pct = Math.min(100, item.progressPercentage ?? 0)
              const other = me?.role === 'STUDENT' ? item.mentorName : item.studentName
              const deadline = new Date(item.deadline)
              const late = isPast(deadline) && pct < 100

              return (
                <Pressable
                  onPress={() => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(item.id) } })}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.taskCard,
                    {
                      backgroundColor: pressed ? (isDark ? '#252628' : '#F9FAFB') : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Top Status & Title */}
                  <View style={styles.cardHeader}>
                    <Txt weight="800" size={15} style={{ flex: 1, color: colors.text }} numberOfLines={2}>
                      {item.taskTitle}
                    </Txt>
                    <Tag label={TASK_STATUS_LABEL[item.status] ?? item.status} tone={statusTone(item.status)} />
                  </View>

                  <Txt size={13} style={{ color: colors.textSecondary, marginTop: 4 }}>
                    {`${me?.role === 'STUDENT' ? 'Cố vấn' : 'Sinh viên'}: `}
                    <Txt weight="700" size={13} style={{ color: colors.text }}>
                      {other}
                    </Txt>
                  </Txt>

                  {/* Progress Bar (Instagram / Meetup style) */}
                  <View style={styles.progressRow}>
                    <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${pct}%`,
                            backgroundColor: pct >= 100 ? '#10B981' : viridian,
                          },
                        ]}
                      />
                    </View>
                    <Txt size={12} weight="800" style={{ color: pct >= 100 ? '#10B981' : viridian }}>
                      {`${pct}%`}
                    </Txt>
                  </View>

                  {/* Footer: Price + Deadline */}
                  <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
                    <Txt weight="800" size={14} style={{ color: viridian, flex: 1 }}>
                      {formatVnd(item.agreedPrice)}
                    </Txt>
                    <View style={styles.deadlineContainer}>
                      <Clock size={13} color={late ? '#EF4444' : colors.textTertiary} />
                      <Txt
                        size={12}
                        weight={late ? '700' : '400'}
                        style={{ color: late ? '#EF4444' : colors.textTertiary, marginLeft: 4 }}
                      >
                        {`Hạn ${deadline.toLocaleDateString('vi-VN')}`}
                      </Txt>
                      <ChevronRight size={13} color={colors.textTertiary} style={{ marginLeft: 4 }} />
                    </View>
                  </View>

                  {item.pendingWorkLogs ? (
                    <View style={styles.pendingBadge}>
                      <Txt size={11} weight="600" style={{ color: '#D97706' }}>
                        ⏳ {item.pendingWorkLogs} nhật ký tiến độ đang chờ xác nhận
                      </Txt>
                    </View>
                  ) : null}
                </Pressable>
              )
            }}
          />
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  filterRail: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  taskCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 7,
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
})
