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
import { ChevronRight, Clock, ListChecks, UserRound } from '@/components/icons'
import { Header } from '@/components/Header'
import { TASK_STAGES, TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'
import { useAuthStore } from '@/store/authStore'
import { useMentoringTheme } from '@/theme/mentoringTheme'

const isPast = (d: Date) => d.getTime() < Date.now()

/** UC96: danh sách task của tôi theo giai đoạn (Meetup Item x Instagram Progress Card — Cam - Trắng - Đen). */
export default function TasksScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
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
      <Header
        title="Nhiệm vụ của tôi"
        subtitle="Theo dõi tiến độ, nhật ký & nghiệm thu cố vấn"
      />

      {/* Stage Filter Rail (Instagram / Meetup Pill Tabs) */}
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
                    backgroundColor: active ? colors.actionBg : colors.surface,
                    borderColor: active ? colors.actionBg : colors.border,
                  },
                ]}
              >
                <Txt
                  size={12}
                  weight={active ? '700' : '600'}
                  style={{ color: active ? colors.actionText : colors.textSecondary }}
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
                text="Nhiệm vụ sẽ được kích hoạt ngay sau khi hai bên thống nhất và thanh toán thỏa thuận cố vấn."
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
                      backgroundColor: pressed ? (isDark ? '#222222' : '#FAFAFB') : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Meetup Eyebrow */}
                  <View style={styles.eyebrowRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <BrandIcon name="task" size={17} />
                      <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.4 }}>
                        {`NHIỆM VỤ #${item.id}`}
                      </Txt>
                    </View>
                    <Tag label={TASK_STATUS_LABEL[item.status] ?? item.status} tone={statusTone(item.status)} />
                  </View>

                  {/* Title */}
                  <Txt weight="800" size={16} style={{ color: colors.text, marginTop: 6 }} numberOfLines={2}>
                    {item.taskTitle}
                  </Txt>

                  {/* Counterpart Row */}
                  <View style={styles.counterpartRow}>
                    <UserRound size={13} color={colors.textTertiary} />
                    <Txt size={12} style={{ color: colors.textSecondary }}>
                      {`${me?.role === 'STUDENT' ? 'Mentor đồng hành' : 'Học viên'}: `}
                      <Txt weight="700" size={12} style={{ color: colors.text }}>
                        {other}
                      </Txt>
                    </Txt>
                  </View>

                  {/* Progress Bar (Instagram / Kakao style) */}
                  <View style={styles.progressRow}>
                    <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${pct}%`,
                            backgroundColor: pct >= 100 ? '#16A34A' : viridian,
                          },
                        ]}
                      />
                    </View>
                    <Txt size={12} weight="800" style={{ color: pct >= 100 ? '#16A34A' : viridian }}>
                      {`${pct}%`}
                    </Txt>
                  </View>

                  {/* Pending Worklog Banner */}
                  {item.pendingWorkLogs ? (
                    <View
                      style={[
                        styles.pendingBadge,
                        {
                          backgroundColor: isDark ? '#2E1C10' : viridianSoft,
                          borderColor: isDark ? '#4A2C16' : '#FAD9C2',
                        },
                      ]}
                    >
                      <Txt size={11} weight="700" style={{ color: viridian }}>
                        ● {item.pendingWorkLogs} nhật ký công việc đang chờ xác nhận
                      </Txt>
                    </View>
                  ) : null}

                  {/* Footer: Price + Deadline + CTA */}
                  <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
                    <Txt weight="800" size={15} style={{ color: viridian, flex: 1 }}>
                      {formatVnd(item.agreedPrice)}
                    </Txt>
                    <View style={styles.deadlineContainer}>
                      <Clock size={13} color={late ? '#DC2626' : colors.textTertiary} />
                      <Txt
                        size={12}
                        weight={late ? '700' : '500'}
                        style={{ color: late ? '#DC2626' : colors.textTertiary, marginLeft: 4 }}
                      >
                        {`Hạn ${deadline.toLocaleDateString('vi-VN')}`}
                      </Txt>
                      <ChevronRight size={13} color={colors.textTertiary} weight="bold" style={{ marginLeft: 4 }} />
                    </View>
                  </View>
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
    borderWidth: 1,
  },
  taskCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  counterpartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  pendingBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
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
})
