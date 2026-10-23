import React, { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Route } from '@/components/icons'
import { Avatar, Button, Card, Empty, Loading, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { FilterButton, FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { ListSkeleton } from '@/components/Skeleton'
import { exploreApi } from '@/api/explore'
import type { CareerSummary } from '@/api/explore'
import { authApi } from '@/api/auth'
import { DEFAULT_COHORTS } from '@/constants/filters'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

const year = (d?: string | null) => (d ? d.slice(0, 4) : '')

function Timeline({ items }: { items: { key: string | number; title: string; company: string; start: string; end?: string | null; current: boolean }[] }) {
  const t = useTheme()
  return (
    <View style={{ marginLeft: 6 }}>
      {items.map((e, i) => (
        <View key={e.key} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: e.current ? t.primary : t.border, marginTop: 4 }} />
            {i < items.length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: t.border }} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: 14 }}>
            <Txt weight="700">{e.title}</Txt>
            <Txt muted size={13}>{e.company}</Txt>
            <Txt muted size={12}>{year(e.start)} — {e.current ? 'Hiện tại' : year(e.end)}</Txt>
          </View>
        </View>
      ))}
    </View>
  )
}

/** UC55–56: lộ trình sự nghiệp dạng dòng thời gian, lọc theo chức danh, công ty, nơi làm việc, khóa, ngành (như Web). */
export default function CareerScreen() {
  const t = useTheme()
  const router = useRouter()
  const [kw, setKw] = useState('')
  const [filters, setFilters] = useState<FilterValues>({})
  const [sheet, setSheet] = useState(false)
  const [sel, setSel] = useState<CareerSummary | null>(null)
  const search = useDebounced(kw, 400)
  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors, staleTime: 30 * 60_000 })

  const params = {
    search: search || undefined,
    title: (filters.title as string)?.trim() || undefined,
    company: (filters.company as string)?.trim() || undefined,
    location: (filters.location as string)?.trim() || undefined,
    cohort: filters.cohort ? Number(filters.cohort) : undefined,
    majorId: filters.majorId ? Number(filters.majorId) : undefined,
  }
  const q = useInfiniteQuery({
    queryKey: ['career-paths', params],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => exploreApi.careerPaths({ ...params, page: pageParam }),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const detail = useQuery({ queryKey: ['career-detail', sel?.userId], queryFn: () => exploreApi.careerDetail(sel!.userId), enabled: !!sel })

  const fields: FilterField[] = useMemo(
    () => [
      { key: 'title', title: 'Chức danh', type: 'text', placeholder: 'VD: Frontend Developer...' },
      { key: 'company', title: 'Công ty', type: 'text', placeholder: 'VD: FPT Software, VNG...' },
      { key: 'location', title: 'Nơi làm việc', type: 'text', placeholder: 'VD: Hà Nội, TP.HCM...' },
      { key: 'cohort', title: 'Khóa', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...DEFAULT_COHORTS.map((c) => ({ value: String(c), label: `K${c}` }))] },
      { key: 'majorId', title: 'Chuyên ngành', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...(majors.data?.data ?? []).map((m) => ({ value: String(m.id), label: m.name }))] },
    ],
    [majors.data],
  )
  const active = countActive(filters)

  return (
    <Screen bg={t.card}>
      <Header title="Lộ trình sự nghiệp" subtitle="Học hỏi con đường của người đi trước" />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={q.isLoading ? [] : items}
          keyExtractor={(c) => String(c.userId)}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.card, paddingVertical: 12, marginBottom: 10 }}>
                <SearchBar value={kw} onChangeText={setKw} placeholder="Tên, công ty, chức danh, ngành..." style={{ paddingHorizontal: 16 }} right={<FilterButton count={active} onPress={() => setSheet(true)} />} />
              </View>
              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty icon={<Route size={28} color={t.primary} />} title="Không tìm thấy lộ trình" text="Thử bỏ bớt bộ lọc hoặc đổi từ khoá." action={active ? 'Xoá bộ lọc' : undefined} onAction={() => setFilters({})} />
            )
          }
          renderItem={({ item }) => (
            <Card style={{ marginHorizontal: 12, marginBottom: 10 }} onPress={() => setSel(item)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Avatar uri={item.avatarUrl} name={item.fullName} size={46} />
                <View style={{ flex: 1 }}>
                  <Txt weight="800">{item.fullName}</Txt>
                  <Txt muted size={12} numberOfLines={1}>{[item.currentTitle, item.currentCompany].filter(Boolean).join(' tại ') || [item.major, item.cohort ? `K${item.cohort}` : null].filter(Boolean).join(' · ')}</Txt>
                </View>
                {item.cohort ? <Tag label={`K${item.cohort}`} tone="neutral" /> : null}
              </View>
              <Timeline items={item.careerPreview.map((e) => ({ key: e.experienceId, title: e.title, company: e.company, start: e.startDate, end: e.endDate, current: e.isCurrent }))} />
              {item.totalExperiences > item.careerPreview.length ? <Txt size={12} color={t.primary} weight="700">{`Xem thêm ${item.totalExperiences - item.careerPreview.length} vị trí khác`}</Txt> : null}
            </Card>
          )}
        />
      </View>
      <ActionSheet visible={!!sel} onClose={() => setSel(null)} title={sel?.fullName}>
        {detail.isLoading ? <Loading /> : detail.data ? (
          <View style={{ gap: 12, maxHeight: 480, paddingHorizontal: 12 }}>
            <ScrollView style={{ maxHeight: 380 }}>
              <Timeline items={detail.data.experiences.map((e) => ({ key: e.id, title: e.title, company: e.company, start: e.startDate, end: e.endDate, current: e.isCurrent }))} />
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Xem hồ sơ" style={{ flex: 1 }} onPress={() => { const id = sel!.userId; setSel(null); router.push({ pathname: '/profile/[id]', params: { id: String(id) } }) }} />
              <Button title="Nhắn tin" variant="secondary" style={{ flex: 1 }} onPress={() => { const id = sel!.userId; setSel(null); router.push({ pathname: '/chat/direct/[userId]', params: { userId: String(id) } }) }} />
            </View>
          </View>
        ) : null}
      </ActionSheet>
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} title="Lọc lộ trình" fields={fields} values={filters} onApply={setFilters} />
    </Screen>
  )
}
