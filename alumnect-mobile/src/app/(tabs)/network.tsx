import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Map, Sparkles, Users } from '@/components/icons'
import { Chip, Empty, Screen, SearchBar, Txt } from '@/components/ui'
import { FilterButton, FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { UserRow } from '@/components/UserRow'
import { BrandIcon } from '@/components/BrandIcon'
import { userApi } from '@/api/users'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { DEFAULT_COHORTS, VN_CITIES } from '@/constants/filters'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { ListSkeleton } from '@/components/Skeleton'

type Tab = 'directory' | 'suggestions'

const SORTS: Record<string, [string, 'ASC' | 'DESC', string]> = {
  newest: ['createdAt', 'DESC', 'Mới nhất'],
  name: ['fullName', 'ASC', 'Họ tên A-Z'],
  cohort: ['cohort', 'DESC', 'Khóa học'],
}

/** Mạng lưới cựu sinh viên & sinh viên: Danh bạ & Gợi ý kết nối thông minh. */
export default function NetworkScreen() {
  const t = useTheme()
  const router = useRouter()
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

  const suggestions = useQuery({
    queryKey: ['suggestions', 30],
    enabled: tab === 'suggestions',
    queryFn: () => userApi.suggestions(30),
  })

  const active = countActive(filters, ['sort'])
  const setRole = (role?: string) => setFilters((f) => ({ ...f, role }))

  const data =
    tab === 'directory'
      ? results.data?.pages.flatMap((p) => p.data.content) ?? []
      : suggestions.data?.data ?? []
  const loading = tab === 'directory' ? results.isLoading : suggestions.isLoading
  const total = tab === 'directory' ? results.data?.pages[0]?.data.totalElements : undefined

  const handleTabChange = (nextTab: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setTab(nextTab)
  }

  return (
    <Screen bg={t.card}>
      {/* Top Header: Meetup illustration + Title + Map button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          backgroundColor: t.card,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BrandIcon name="people2" size={32} />
          <View>
            <Txt weight="800" size={20} style={{ color: t.text, letterSpacing: -0.3 }}>
              Mạng lưới
            </Txt>
            <Txt size={12} weight="500" style={{ color: t.textMuted }}>
              Kết nối cựu sinh viên & sinh viên
            </Txt>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/map')}
          accessibilityRole="button"
          accessibilityLabel="Bản đồ cựu sinh viên"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 20,
            backgroundColor: t.isDark ? '#262626' : '#FFF3EB',
            borderWidth: 1,
            borderColor: t.isDark ? '#3D3D3D' : '#FFDFCC',
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Map size={15} color={t.primary} weight="bold" />
          <Txt size={12} weight="700" style={{ color: t.primary }}>
            Bản đồ
          </Txt>
        </Pressable>
      </View>

      {/* Kakao & Instagram style Segmented Pill Tabs */}
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 8,
          padding: 4,
          borderRadius: 14,
          backgroundColor: t.isDark ? '#202022' : '#F1F3F5',
          flexDirection: 'row',
        }}
      >
        <Pressable
          onPress={() => handleTabChange('directory')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'directory' }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 9,
            borderRadius: 11,
            backgroundColor: tab === 'directory' ? t.card : 'transparent',
            elevation: tab === 'directory' ? 2 : 0,
            shadowColor: '#000',
            shadowOpacity: tab === 'directory' ? 0.08 : 0,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
          }}
        >
          <Users
            size={16}
            color={tab === 'directory' ? t.primary : t.textMuted}
            weight={tab === 'directory' ? 'bold' : 'regular'}
          />
          <Txt
            size={13}
            weight={tab === 'directory' ? '700' : '500'}
            style={{ color: tab === 'directory' ? t.text : t.textMuted }}
          >
            Danh bạ
          </Txt>
        </Pressable>

        <Pressable
          onPress={() => handleTabChange('suggestions')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'suggestions' }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 9,
            borderRadius: 11,
            backgroundColor: tab === 'suggestions' ? t.card : 'transparent',
            elevation: tab === 'suggestions' ? 2 : 0,
            shadowColor: '#000',
            shadowOpacity: tab === 'suggestions' ? 0.08 : 0,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
          }}
        >
          <Sparkles
            size={16}
            color={tab === 'suggestions' ? t.primary : t.textMuted}
            weight={tab === 'suggestions' ? 'bold' : 'regular'}
          />
          <Txt
            size={13}
            weight={tab === 'suggestions' ? '700' : '500'}
            style={{ color: tab === 'suggestions' ? t.text : t.textMuted }}
          >
            Gợi ý
          </Txt>
        </Pressable>
      </View>

      {/* Main FlashList Content */}
      <View style={{ flex: 1, backgroundColor: t.card }}>
        <FlashList
          data={loading ? [] : data}
          keyExtractor={(u) => String(u.userId)}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => {
            if (tab === 'directory' && results.hasNextPage) results.fetchNextPage()
          }}
          refreshing={tab === 'directory' ? results.isRefetching : suggestions.isRefetching}
          onRefresh={() => (tab === 'directory' ? results.refetch() : suggestions.refetch())}
          ListHeaderComponent={
            <View>
              {tab === 'directory' ? (
                <View style={{ backgroundColor: t.card, paddingTop: 4 }}>
                  <SearchBar
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Tên, chức danh, kỹ năng, công ty..."
                    style={{ paddingHorizontal: 16 }}
                    right={<FilterButton count={active} onPress={() => setSheet(true)} />}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 }}
                  >
                    <Chip label="Tất cả" active={!filters.role} onPress={() => setRole(undefined)} />
                    <Chip label="Cựu sinh viên" active={filters.role === 'ALUMNI'} onPress={() => setRole('ALUMNI')} />
                    <Chip label="Sinh viên" active={filters.role === 'STUDENT'} onPress={() => setRole('STUDENT')} />
                  </ScrollView>

                  {total != null ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 6,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: t.divider,
                      }}
                    >
                      <Txt size={12} weight="600" style={{ color: t.textMuted }}>
                        {`${total.toLocaleString('vi-VN')} thành viên trong cộng đồng`}
                      </Txt>
                      {active > 0 ? (
                        <Pressable onPress={() => setFilters({ sort: 'newest' })}>
                          <Txt size={12} weight="700" style={{ color: t.primary }}>
                            Xóa bộ lọc ({active})
                          </Txt>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {tab === 'suggestions' ? (
                <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <BrandIcon name="people2" size={30} />
                  <View style={{ flex: 1 }}>
                    <Txt size={15} weight="600">Có thể bạn quen</Txt>
                    <Txt size={12} muted>Cùng trường. Thêm kết nối.</Txt>
                  </View>
                </View>
              ) : null}

              {loading ? <ListSkeleton variant="row" /> : null}
            </View>
          }
          ListEmptyComponent={
            loading ? null : (
              <Empty
                error={tab === 'directory' ? results.error : suggestions.error}
                onRetry={() => { void (tab === 'directory' ? results.refetch() : suggestions.refetch()) }}
                icon={tab === 'directory' ? <BrandIcon name="people2" size={56} /> : <BrandIcon name="world" size={56} />}
                title={tab === 'suggestions' ? 'Chưa có thêm gợi ý mới' : 'Không tìm thấy thành viên'}
                text={
                  tab === 'suggestions'
                    ? 'Cập nhật thêm ngành học, khoá và công ty trong hồ sơ của bạn để nhận thêm gợi ý kết nối chuẩn xác.'
                    : 'Thử bỏ bớt bộ lọc hoặc tìm kiếm theo họ tên, kỹ năng khác.'
                }
                action={tab === 'directory' && active > 0 ? 'Xoá bộ lọc' : undefined}
                onAction={() => {
                  if (tab === 'directory') setFilters({ sort: 'newest' })
                }}
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
