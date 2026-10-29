import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Award, ClipboardList, FileText, GraduationCap, Handshake, Landmark, ListChecks, MessageCircle, RotateCcw, UserCheck, Users } from '@/components/icons'
import { Empty, IconButton, PageHeader, PillLink, Screen, SearchBar, Txt } from '@/components/ui'
import { FilterButton, FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { MentorCardView } from '@/components/MentorCardView'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import type { MentoringType, WorkingMode } from '@/api/mentoring'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { ListSkeleton } from '@/components/Skeleton'

const SORTS: [string, string][] = [
  ['reputationScore_desc', 'Uy tín cao nhất'],
  ['rating_desc', 'Đánh giá cao nhất'],
  ['completedMissions_desc', 'Nhiều nhiệm vụ nhất'],
  ['fullName_asc', 'Tên A-Z'],
]
const DEFAULTS: FilterValues = { sort: 'reputationScore_desc' }

/** Cố vấn: lối tắt theo vai trò + tìm mentor với bộ lọc và sắp xếp giống Web. */
export default function MentoringTab() {
  const t = useTheme()
  const router = useRouter()
  const role = useAuthStore((s) => s.user?.role)
  const [kw, setKw] = useState('')
  const [filters, setFilters] = useState<FilterValues>(DEFAULTS)
  const [sheet, setSheet] = useState(false)
  const keyword = useDebounced(kw, 400)
  const ic = (Icon: typeof Users) => <Icon size={18} color={t.primary} weight="bold" />

  const options = useQuery({ queryKey: ['mentor-filter-options'], queryFn: mentoringApi.filterOptions, staleTime: 10 * 60_000 })
  const industries = options.data?.industries ?? []
  const specializations = options.data?.specializations ?? []
  const modeOptions = options.data?.workingModes?.length
    ? options.data.workingModes
    : (Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((v) => ({ value: v, label: WORKING_MODE_LABEL[v] }))
  const typeOptions = options.data?.mentoringTypes?.length
    ? options.data.mentoringTypes
    : (Object.keys(MENTORING_TYPE_LABEL) as MentoringType[]).map((v) => ({ value: v, label: MENTORING_TYPE_LABEL[v] }))
  const skills = options.data?.popularSkills ?? []

  const fields: FilterField[] = [
      { key: 'sort', title: 'Sắp xếp', type: 'single', options: SORTS.map(([v, l]) => ({ value: v, label: l })) },
      { key: 'fieldId', title: 'Lĩnh vực', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...industries.map((i) => ({ value: String(i.id), label: i.name }))] },
      { key: 'majorId', title: 'Chuyên ngành', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...specializations.map((m) => ({ value: String(m.id), label: m.name }))] },
      { key: 'mode', title: 'Hình thức làm việc', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...modeOptions.map((o) => ({ value: o.value, label: o.label }))] },
      { key: 'type', title: 'Loại hình hỗ trợ', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...typeOptions.map((o) => ({ value: o.value, label: o.label }))] },
      { key: 'skill', title: 'Kỹ năng phổ biến', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...skills.map((s) => ({ value: s, label: s }))] },
  ]

  const [sortBy, sortDir] = ((filters.sort as string) ?? 'reputationScore_desc').split('_')
  const params = {
    keyword,
    fieldId: filters.fieldId ? Number(filters.fieldId) : undefined,
    majorId: filters.majorId ? Number(filters.majorId) : undefined,
    skill: (filters.skill as string) || undefined,
    workingMode: (filters.mode as WorkingMode) || undefined,
    mentoringType: (filters.type as MentoringType) || undefined,
    sortBy,
    sortDir,
  }
  const q = useInfiniteQuery({
    queryKey: ['mentoring-search', params],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => mentoringApi.search({ ...params, page: pageParam }),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const active = countActive(filters, ['sort'])

  return (
    <Screen bg={t.card}>
      <PageHeader
        title="Cố vấn"
        right={<IconButton label="Tin nhắn mentoring" icon={<MessageCircle size={20} color={t.text} />} onPress={() => router.push('/mentoring/messages')} />}
      />
      <View style={{ flex: 1, backgroundColor: t.card }}>
        <FlashList
          data={q.isLoading ? [] : items}
          keyExtractor={(m) => String(m.mentorId)}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.card }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                  {role === 'STUDENT' ? <PillLink icon={ic(FileText)} label="Tạo yêu cầu" onPress={() => router.push('/mentoring/create-request')} /> : null}
                  {role === 'STUDENT' ? <PillLink icon={ic(ClipboardList)} label="Yêu cầu của tôi" onPress={() => router.push('/mentoring/my-requests')} /> : null}
                  {role === 'ALUMNI' ? <PillLink icon={ic(ClipboardList)} label="Yêu cầu đến" onPress={() => router.push('/mentoring/incoming-requests')} /> : null}
                  <PillLink icon={ic(ListChecks)} label="Task" onPress={() => router.push('/mentoring/tasks')} />
                  <PillLink icon={ic(Handshake)} label="Thỏa thuận" onPress={() => router.push('/mentoring/deals')} />
                  <PillLink icon={ic(Users)} label="Nhóm" onPress={() => router.push('/mentoring/groups')} />
                  <PillLink icon={ic(Award)} label="Xếp hạng" onPress={() => router.push('/mentoring/rankings')} />
                  {role === 'ALUMNI' ? <PillLink icon={ic(Landmark)} label="Thu nhập" onPress={() => router.push('/mentoring/earnings')} /> : null}
                  <PillLink icon={ic(RotateCcw)} label="Hoàn tiền" onPress={() => router.push('/mentoring/refunds')} />
                  {role === 'ALUMNI' ? <PillLink icon={ic(UserCheck)} label="Làm mentor" onPress={() => router.push('/mentoring/status')} /> : null}
                </ScrollView>
                <SearchBar
                  value={kw}
                  onChangeText={setKw}
                  placeholder="Tìm mentor theo tên, kỹ năng, công ty..."
                  style={{ paddingHorizontal: 16, paddingBottom: 12 }}
                  right={<FilterButton count={active} onPress={() => setSheet(true)} />}
                />
              </View>
              {q.isLoading ? <ListSkeleton variant="row" count={4} /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty error={q.error} onRetry={() => { void q.refetch() }}
                icon={<GraduationCap size={28} color={t.primary} />}
                title="Không tìm thấy mentor"
                text="Thử bỏ bớt bộ lọc hoặc đổi từ khoá."
                action={active ? 'Xoá bộ lọc' : undefined}
                onAction={() => setFilters(DEFAULTS)}
              />
            )
          }
          renderItem={({ item }) => <MentorCardView m={item} />}
          ListFooterComponent={q.isFetchingNextPage ? <Txt muted style={{ textAlign: 'center', padding: 12 }}>Đang tải thêm...</Txt> : null}
        />
      </View>
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} title="Lọc mentor" fields={fields} values={filters} defaults={DEFAULTS} onApply={setFilters} />
    </Screen>
  )
}
