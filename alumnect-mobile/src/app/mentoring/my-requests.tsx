import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronRight, Plus } from '@/components/icons'
import { Empty, Screen, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { ListSkeleton } from '@/components/Skeleton'
import { REQUEST_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import type { MentoringRequest } from '@/api/mentoringFlow'
import { statusTone } from '@/constants/status'
import { useMentoringTheme } from '@/theme/mentoringTheme'

const DEMO_MY_REQUESTS: MentoringRequest[] = [
  {
    id: 101,
    requestType: 'GENERAL',
    title: 'Cần mentor định hướng Data Engineering & Spark Optimization thực chiến',
    description: 'Em muốn tìm hiểu lộ trình xây dựng Data Lakehouse, tối ưu Spark Job và thiết kế Data Pipeline bằng Airflow.',
    industryName: 'Dữ liệu lớn & AI',
    budgetMin: 1500000,
    budgetMax: 2500000,
    workingMode: 'BOTH',
    participationType: 'INDIVIDUAL',
    taskType: 'TECHNICAL_CONSULTING',
    expectedDeadline: new Date(Date.now() + 20 * 86400000).toISOString(),
    status: 'OPEN',
    matchedCount: 4,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 102,
    requestType: 'DIRECT',
    targetMentorName: 'Bùi Anh Tuấn (Grab Vietnam)',
    title: 'Review CV & Mock Interview Vị trí Senior Frontend React/React Native',
    description: 'Chỉnh sửa Portfolio, luyện phỏng vấn thuật toán và System Design UI.',
    industryName: 'Công nghệ thông tin',
    budgetMin: 1000000,
    budgetMax: 1500000,
    workingMode: 'ONLINE',
    participationType: 'INDIVIDUAL',
    taskType: 'RESUME_REVIEW',
    expectedDeadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: 'MATCHED',
    matchedCount: 1,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    directMentorResponseStatus: 'ACCEPTED',
  },
  {
    id: 103,
    requestType: 'GENERAL',
    title: 'Cố vấn Tối ưu hóa Database PostgreSQL & Indexing High-Load',
    description: 'Phân tích truy vấn chậm, cấu hình Partitioning cho hệ thống thanh toán.',
    industryName: 'Công nghệ thông tin',
    budgetMin: 1800000,
    budgetMax: 2000000,
    workingMode: 'BOTH',
    participationType: 'INDIVIDUAL',
    taskType: 'TECHNICAL_CONSULTING',
    expectedDeadline: new Date(Date.now() - 10 * 86400000).toISOString(),
    status: 'CLOSED',
    matchedCount: 2,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
]

type Tab = 'ALL' | 'OPEN' | 'MATCHED' | 'DONE'
const TABS: [Tab, string][] = [
  ['ALL', 'Tất cả'],
  ['OPEN', 'Đang mở'],
  ['MATCHED', 'Đã ghép nối'],
  ['DONE', 'Đã kết thúc'],
]

/** UC92: danh sách yêu cầu của tôi (Meetup Item x Instagram Pill Tabs x Kakao Bento Summary). */
export default function MyRequestsScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('ALL')
  const q = useInfiniteQuery({
    queryKey: ['mentoring-requests'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => requestApi.mine(pageParam),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const queryAll = q.data?.pages.flatMap((p) => p.content) ?? []
  const all = queryAll.length > 0 ? queryAll : DEMO_MY_REQUESTS
  const openCount = all.filter((r) => r.status === 'OPEN').length
  const matchedCount = all.filter((r) => r.status === 'MATCHED').length
  const doneCount = all.filter((r) => ['CLOSED', 'CANCELLED', 'EXPIRED'].includes(r.status)).length

  const items = all.filter(
    (r) => tab === 'ALL' || (tab === 'DONE' ? ['CLOSED', 'CANCELLED', 'EXPIRED'].includes(r.status) : r.status === tab),
  )

  return (
    <Screen bg={colors.bg}>
      <Header
        title="Yêu cầu của tôi"
        subtitle="Theo dõi kết nối & phản hồi từ Mentor"
        right={
          <Pressable
            onPress={() => router.push('/mentoring/create-request')}
            style={({ pressed }) => [
              styles.createBtn,
              {
                backgroundColor: viridian,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.createBtnIconWrap}>
              <BrandIcon name="pencil" size={14} />
            </View>
            <Txt size={12} weight="800" style={{ color: '#FFFFFF' }}>
              Tạo mới
            </Txt>
          </Pressable>
        }
      />

      {/* Instagram / Meetup Pill Filter Rail */}
      <View style={[styles.tabRail, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map(([k, l]) => {
            const active = tab === k
            const count =
              k === 'ALL' ? all.length : k === 'OPEN' ? openCount : k === 'MATCHED' ? matchedCount : doneCount
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
                {count > 0 && (
                  <View
                    style={[
                      styles.tabCountBadge,
                      {
                        backgroundColor: active ? viridian : colors.card,
                      },
                    ]}
                  >
                    <Txt size={10} weight="800" style={{ color: active ? '#FFFFFF' : colors.textSecondary }}>
                      {count}
                    </Txt>
                  </View>
                )}
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
            contentContainerStyle={{ paddingBottom: 28 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            ListHeaderComponent={
              <View style={styles.headerBentoWrap}>
                {/* Kakao Summary Bento Card */}
                <View style={[styles.summaryBento, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.summaryTopRow}>
                    <View style={[styles.summaryIconBox, { backgroundColor: viridianSoft }]}>
                      <BrandIcon name="writing" size={30} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Txt weight="800" size={14} style={{ color: colors.text }}>
                        Nhật ký Yêu cầu Cố vấn
                      </Txt>
                      <Txt size={11} style={{ color: colors.textSecondary, marginTop: 1 }}>
                        Quản lý các đề xuất 1:1 và ghép nối tự động
                      </Txt>
                    </View>
                    <Pressable
                      onPress={() => router.push('/mentoring/create-request')}
                      style={[styles.miniAddPill, { backgroundColor: viridianSoft, borderColor: viridian }]}
                    >
                      <Plus size={12} color={viridian} weight="bold" />
                      <Txt size={11} weight="800" style={{ color: viridian }}>
                        Đăng bài
                      </Txt>
                    </Pressable>
                  </View>

                  <View style={[styles.summaryStatsGrid, { borderTopColor: colors.borderSubtle }]}>
                    <View style={styles.statCell}>
                      <Txt weight="800" size={17} style={{ color: viridian }}>
                        {openCount}
                      </Txt>
                      <Txt size={11} weight="600" style={{ color: colors.textTertiary }}>
                        Đang mở
                      </Txt>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
                    <View style={styles.statCell}>
                      <Txt weight="800" size={17} style={{ color: colors.text }}>
                        {matchedCount}
                      </Txt>
                      <Txt size={11} weight="600" style={{ color: colors.textTertiary }}>
                        Đã ghép nối
                      </Txt>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
                    <View style={styles.statCell}>
                      <Txt weight="800" size={17} style={{ color: colors.textSecondary }}>
                        {doneCount}
                      </Txt>
                      <Txt size={11} weight="600" style={{ color: colors.textTertiary }}>
                        Đã kết thúc
                      </Txt>
                    </View>
                  </View>
                </View>
              </View>
            }
            ListEmptyComponent={
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<BrandIcon name="writing" size={64} />}
                title="Chưa có yêu cầu nào"
                text="Tạo yêu cầu cố vấn để hệ thống ghép bạn với các chuyên gia phù hợp nhất."
                action="Tạo yêu cầu mới"
                onAction={() => router.push('/mentoring/create-request')}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({ pathname: '/mentoring/request/[id]', params: { id: String(item.id) } })}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.reqCard,
                  {
                    backgroundColor: pressed ? (isDark ? '#222222' : '#FAFAFB') : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Meetup Eyebrow: Request Type & Status */}
                <View style={styles.eyebrowRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <BrandIcon name={item.requestType === 'DIRECT' ? 'chat' : 'writing'} size={17} />
                    <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.4 }}>
                      {item.requestType === 'DIRECT' ? 'GỬI TRỰC TIẾP 1:1' : 'GHÉP TỰ ĐỘNG'}
                    </Txt>
                  </View>
                  <Tag label={REQUEST_STATUS_LABEL[item.status] ?? item.status} tone={statusTone(item.status)} />
                </View>

                {/* Title */}
                <Txt weight="800" size={16} style={{ color: colors.text, marginTop: 6, lineHeight: 22 }}>
                  {item.title}
                </Txt>

                {/* Tags */}
                <View style={styles.tagWrap}>
                  <View style={[styles.metaChip, { backgroundColor: viridianSoft }]}>
                    <Txt size={11} weight="700" style={{ color: viridian }}>
                      {taskTypeLabel(item.taskType)}
                    </Txt>
                  </View>
                  {item.industryName ? (
                    <View style={[styles.metaChip, { backgroundColor: colors.surface }]}>
                      <Txt size={11} weight="600" style={{ color: colors.textSecondary }}>
                        {item.industryName}
                      </Txt>
                    </View>
                  ) : null}
                </View>

                {/* Meetup Hairline Footer */}
                <View style={[styles.footerRow, { borderTopColor: colors.borderSubtle }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <BrandIcon name="people" size={16} />
                    <Txt size={12} weight="600" style={{ color: colors.text, lineHeight: 18 }}>
                      {item.requestType === 'DIRECT'
                        ? `Mentor: ${item.targetMentorName ?? '—'}`
                        : `${item.matchedCount} mentor phù hợp`}
                    </Txt>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <BrandIcon name="calendar" size={14} />
                    <Txt size={12} style={{ color: colors.textTertiary }}>
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </Txt>
                    <ChevronRight size={13} color={colors.textTertiary} weight="bold" />
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 999,
  },
  createBtnIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRail: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  headerBentoWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  summaryBento: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  reqCard: {
    marginHorizontal: 16,
    marginTop: 10,
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
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  metaChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
})
