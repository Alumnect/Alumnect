import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronRight, Inbox, Sparkles } from '@/components/icons'
import { Avatar, Empty, Screen, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ListSkeleton } from '@/components/Skeleton'
import { RESPONSE_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import type { IncomingRequest } from '@/api/mentoringFlow'
import { statusTone } from '@/constants/status'
import { useMentoringTheme } from '@/theme/mentoringTheme'

type Tab = 'ALL' | 'WAITING' | 'ACCEPTED' | 'DECLINED'
const TABS: [Tab, string][] = [
  ['ALL', 'Tất cả'],
  ['WAITING', 'Đang chờ duyệt'],
  ['ACCEPTED', 'Đã chấp nhận'],
  ['DECLINED', 'Đã từ chối'],
]

const DEMO_INCOMING: IncomingRequest[] = [
  {
    id: 301,
    title: 'Xin hướng dẫn đồ án tốt nghiệp Capstone Project AI & Spring Boot Microservices',
    description: 'Em cần mentor định hướng kiến trúc Event-Driven Kafka và hỗ trợ tối ưu thuật toán nhận diện.',
    industryName: 'Công nghệ thông tin',
    studentId: 1,
    studentName: 'Trần Quốc Bảo',
    studentAvatar: null,
    taskType: 'CAPSTONE_ADVICE',
    participationType: 'INDIVIDUAL',
    workingMode: 'BOTH',
    budgetMin: 2000000,
    budgetMax: 3000000,
    expectedDeadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    responseStatus: 'WAITING',
    requestStatus: 'OPEN',
    requestType: 'DIRECT',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 302,
    title: 'Tư vấn lộ trình phát triển Senior Cloud DevOps AWS & Kubernetes thực chiến',
    description: 'Học viên muốn chuyển hướng từ Software Engineer sang Cloud Architect.',
    industryName: 'Điện toán đám mây',
    studentId: 2,
    studentName: 'Lê Hoàng Yến',
    studentAvatar: null,
    taskType: 'CAREER_ORIENTATION',
    participationType: 'INDIVIDUAL',
    workingMode: 'ONLINE',
    budgetMin: 1500000,
    budgetMax: 2000000,
    expectedDeadline: new Date(Date.now() + 15 * 86400000).toISOString(),
    responseStatus: 'ACCEPTED',
    requestStatus: 'MATCHED',
    requestType: 'DIRECT',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 303,
    title: 'Review CV và phỏng vấn thử vị trí Backend Java Engineer tại Product Company',
    description: 'Luyện 3 vòng phỏng vấn kỹ thuật thuật toán và thiết kế hệ thống.',
    industryName: 'Công nghệ thông tin',
    studentId: 3,
    studentName: 'Vũ Minh Đức',
    studentAvatar: null,
    taskType: 'RESUME_REVIEW',
    participationType: 'INDIVIDUAL',
    workingMode: 'ONLINE',
    budgetMin: 800000,
    budgetMax: 1200000,
    expectedDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    responseStatus: 'DECLINED',
    requestStatus: 'CLOSED',
    requestType: 'GENERAL',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
]

/** UC93: yêu cầu đến dành cho mentor (Meetup Item x Instagram Pill Tabs). */
export default function IncomingRequestsScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('ALL')
  const status = tab === 'ALL' ? undefined : tab
  const q = useInfiniteQuery({
    queryKey: ['mentoring-incoming', status],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => requestApi.incoming({ status, page: pageParam }),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const queryItems = q.data?.pages.flatMap((p) => p.content) ?? []
  const items = queryItems.length > 0
    ? queryItems
    : DEMO_INCOMING.filter((r) => (!status ? true : r.responseStatus === status))

  return (
    <Screen bg={colors.bg}>
      <Header title="Yêu cầu đến" subtitle="Sinh viên đang cần bạn cố vấn & đồng hành" />

      {/* Pill Filter Rail */}
      <View style={[styles.tabRail, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map(([k, l]) => {
            const active = tab === k
            return (
              <Pressable
                key={k}
                onPress={() => setTab(k)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? colors.actionBg : colors.surface,
                    borderColor: active ? colors.actionBg : colors.border,
                  },
                ]}
              >
                <Txt size={12} weight={active ? '700' : '600'} style={{ color: active ? colors.actionText : colors.textSecondary }}>
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
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={{ paddingVertical: 14 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            ListEmptyComponent={
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<Inbox size={32} color={viridian} />}
                title="Chưa có yêu cầu đến"
                text="Khi sinh viên gửi yêu cầu phù hợp với lĩnh vực của bạn, danh sách sẽ hiển thị tại đây."
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({ pathname: '/mentoring/incoming/[id]', params: { id: String(item.id) } })}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: pressed ? (isDark ? '#222222' : '#FAFAFB') : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar uri={item.studentAvatar} name={item.studentName} size={46} ring />
                  <View style={{ flex: 1 }}>
                    <Txt weight="800" size={15} style={{ color: colors.text, lineHeight: 20 }}>
                      {item.studentName}
                    </Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Sparkles size={11} color={viridian} weight="fill" />
                      <Txt size={12} weight="600" style={{ color: viridian }}>
                        {taskTypeLabel(item.taskType)}
                      </Txt>
                    </View>
                  </View>
                  <Tag label={RESPONSE_STATUS_LABEL[item.responseStatus] ?? item.responseStatus} tone={statusTone(item.responseStatus)} />
                </View>

                <Txt weight="800" size={15} style={{ color: colors.text, marginTop: 12, lineHeight: 22 }}>
                  {item.title}
                </Txt>

                <View style={[styles.footerRow, { borderTopColor: colors.borderSubtle }]}>
                  <View style={[styles.actionPill, { backgroundColor: viridianSoft }]}>
                    <Txt size={11} weight="700" style={{ color: viridian }}>
                      Xem chi tiết & Phản hồi
                    </Txt>
                    <ChevronRight size={12} color={viridian} weight="bold" />
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  tabRail: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
})
