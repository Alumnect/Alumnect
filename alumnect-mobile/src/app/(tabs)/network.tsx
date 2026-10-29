import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Map, Sparkles, UserSearch } from '@/components/icons'
import { Chip, Empty, IconButton, PageHeader, Screen, SearchBar, Segmented, Txt } from '@/components/ui'
import { FilterButton, FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { UserRow } from '@/components/UserRow'
import { userApi } from '@/api/users'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { DEFAULT_COHORTS, VN_CITIES } from '@/constants/filters'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { ListSkeleton } from '@/components/Skeleton'

type Tab = 'directory' | 'suggestions' | 'following'

const SORTS: Record<string, [string, 'ASC' | 'DESC', string]> = {
  newest: ['createdAt', 'DESC', 'Mới nhất'],
  name: ['fullName', 'ASC', 'Họ tên A-Z'],
  cohort: ['cohort', 'DESC', 'Khóa học'],
}

/** Mạng lưới: danh bạ có bộ lọc đầy đủ như Web, gợi ý kết nối, và danh sách đang theo dõi. */
export default function NetworkScreen() {
  const t = useTheme()
  const router = useRouter()
  const meId = useAuthStore((s) => s.user?.id)
  const [tab, setTab] = useState<Tab>('directory')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FilterValues>({ sort: 'newest' })
  const [sheet, setSheet] = useState(false)
  const debounced = useDebounced(query, 400)

  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors, staleTime: 30 * 60_000 })
  const opts = useQuery({ queryKey: ['user-filter-options'], queryFn: userApi.filterOptions, staleTime: 30 * 60_000 })
  const cohorts = opts.data?.cohorts?.length ? opts.data.cohorts : DEFAULT_COHORTS
  const cities = opts.data?.cities?.length ? opts.data.cities : VN_CITIES

  const fields: FilterField[] = useMemo(
    () => [
      { key: 'sort', title: 'Sắp xếp', type: 'single', options: Object.entries(SORTS).map(([k, v]) => ({ value: k, label: v[2] })) },
      { key: 'role', title: 'Vai trò', type: 'single', options: [{ value: '', label: 'Tất cả' }, { value: 'ALUMNI', label: 'Cựu sinh viên' }, { value: 'STUDENT', label: 'Sinh viên' }] },
      { key: 'majorId', title: 'Chuyên ngành', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...(majors.data?.data ?? []).map((m) => ({ value: String(m.id), label: m.name }))] },
      { key: 'cohort', title: 'Khóa', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...cohorts.map((c) => ({ value: String(c), label: `K${c}` }))] },
      { key: 'city', title: 'Tỉnh / thành phố', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...cities.map((c) => ({ value: c, label: c }))] },
      { key: 'company', title: 'Công ty', type: 'text', placeholder: 'VD: FPT Software, VNG...' },
      { key: 'skill', title: 'Kỹ năng', type: 'text', placeholder: 'VD: React, Java, Marketing...' },
    ],
    [majors.data, cohorts, cities],
  )

  const sort = SORTS[(filters.sort as string) ?? 'newest'] ?? SORTS.newest
  const params = {
    query: debounced.trim() || undefined,
    role: (filters.role as string) || undefined,
    majorId: filters.majorId ? Number(filters.majorId) : undefined,
    cohort: filters.cohort ? Number(filters.cohort) : undefined,
    city: (filters.city as string) || undefined,
    company: (filters.company as string)?.trim() || undefined,
    skill: (filters.skill as string)?.trim() || undefined,
    sortBy: sort[0],
    sortDirection: sort[1],
  }

  const results = useInfiniteQuery({
    queryKey: ['users-search', params],
    enabled: tab === 'directory',
    initialPageParam: 0,
    queryFn: ({ pageParam }) => userApi.search({ ...params, page: pageParam }),
    getNextPageParam: (l) => (l.data.last ? undefined : l.data.pageNumber + 1),
  })
  const suggestions = useQuery({ queryKey: ['suggestions', 30], enabled: tab === 'suggestions', queryFn: () => userApi.suggestions(30) })
  const following = useInfiniteQuery({
    queryKey: ['following', meId],
    enabled: tab === 'following' && !!meId,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => userApi.following(meId!, pageParam),
    getNextPageParam: (l) => (l.data.last ? undefined : l.data.pageNumber + 1),
  })

  const active = countActive(filters, ['sort'])
  const setRole = (role?: string) => setFilters((f) => ({ ...f, role }))

  const data =
    tab === 'directory'
      ? results.data?.pages.flatMap((p) => p.data.content) ?? []
      : tab === 'suggestions'
        ? suggestions.data?.data ?? []
        : following.data?.pages.flatMap((p) => p.data.content) ?? []
  const loading = tab === 'directory' ? results.isLoading : tab === 'suggestions' ? suggestions.isLoading : following.isLoading
  const total = tab === 'directory' ? results.data?.pages[0]?.data.totalElements : undefined

  return (
    <Screen bg={t.card}>
      <PageHeader title="Mạng lưới" right={<IconButton label="Bản đồ cựu sinh viên" icon={<Map size={20} color={t.text} />} onPress={() => router.push('/map')} />} />
      <Segmented<Tab>
        tabs={[['directory', 'Danh bạ'], ['suggestions', 'Gợi ý'], ['following', 'Đang theo dõi']]}
        value={tab}
        onChange={setTab}
      />
      <View style={{ flex: 1, backgroundColor: t.card }}>
        <FlashList
          data={loading ? [] : data}
          keyExtractor={(u) => String(u.userId)}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => {
            if (tab === 'directory' && results.hasNextPage) results.fetchNextPage()
            if (tab === 'following' && following.hasNextPage) following.fetchNextPage()
          }}
          refreshing={tab === 'directory' ? results.isRefetching : tab === 'suggestions' ? suggestions.isRefetching : following.isRefetching}
          onRefresh={() => (tab === 'directory' ? results.refetch() : tab === 'suggestions' ? suggestions.refetch() : following.refetch())}
          ListHeaderComponent={
            <View>
              {tab === 'directory' ? (
                <View style={{ backgroundColor: t.card, paddingTop: 12 }}>
                  <SearchBar
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Tên, chức danh, kỹ năng, công ty, mã SV..."
                    style={{ paddingHorizontal: 16 }}
                    right={<FilterButton count={active} onPress={() => setSheet(true)} />}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 }}>
                    <Chip label="Tất cả" active={!filters.role} onPress={() => setRole(undefined)} />
                    <Chip label="Cựu sinh viên" active={filters.role === 'ALUMNI'} onPress={() => setRole('ALUMNI')} />
                    <Chip label="Sinh viên" active={filters.role === 'STUDENT'} onPress={() => setRole('STUDENT')} />
                  </ScrollView>
                </View>
              ) : null}
              {tab === 'directory' && total != null ? (
                <Txt muted size={13} style={{ paddingHorizontal: 16, paddingBottom: 8 }}>{`${total} thành viên`}</Txt>
              ) : null}
              {tab === 'suggestions' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 8 }}>
                  <Sparkles size={16} color={t.primary} />
                  <Txt muted size={13}>Dựa trên ngành học, khóa và mối quan hệ chung</Txt>
                </View>
              ) : null}
              {loading ? <ListSkeleton variant="row" /> : null}
            </View>
          }
          ListEmptyComponent={
            loading ? null : (
              <Empty
                error={tab === 'directory' ? results.error : tab === 'suggestions' ? suggestions.error : following.error}
                onRetry={() => { void (tab === 'directory' ? results.refetch() : tab === 'suggestions' ? suggestions.refetch() : following.refetch()) }}
                icon={<UserSearch size={28} color={t.primary} />}
                title={tab === 'following' ? 'Bạn chưa theo dõi ai' : 'Không tìm thấy thành viên'}
                text={tab === 'following' ? 'Theo dõi cựu sinh viên để cập nhật hoạt động của họ.' : 'Thử bỏ bớt bộ lọc hoặc đổi từ khoá.'}
                action={tab === 'directory' && active > 0 ? 'Xoá bộ lọc' : undefined}
                onAction={() => setFilters({ sort: 'newest' })}
              />
            )
          }
          renderItem={({ item }) => <UserRow user={item} />}
        />
      </View>
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} title="Lọc thành viên" fields={fields} values={filters} defaults={{ sort: 'newest' }} onApply={setFilters} />
    </Screen>
  )
}
