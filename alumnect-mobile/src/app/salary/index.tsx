import React, { useMemo, useState } from 'react'
import { Pressable, RefreshControl, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Briefcase, MapPin, Plus, Lock, X } from '@/components/icons'
import { Button, Card, Empty, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { SelectField } from '@/components/SelectField'
import { FilterButton, FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { Header } from '@/components/Header'
import { ListSkeleton } from '@/components/Skeleton'
import { formatVnd, salaryApi } from '@/api/salary'
import type { SalaryStatRow } from '@/api/salary'
import { useAuthStore } from '@/store/authStore'
import { VN_CITIES } from '@/constants/filters'
import {
  JOB_TITLES_BY_INDUSTRY,
  SALARY_LEVELS,
  STANDARD_JOB_TITLES,
  type SalaryLevel,
} from '@/constants/jobTitles'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { SoftTabs } from '@/components/SocialUI'
import { Enter } from '@/components/Motion'

type Tab = 'stats' | 'feed'
const SORTS: [string, string][] = [
  ['latest', 'Mới nhất'],
  ['salaryDesc', 'Lương cao nhất'],
  ['salaryAsc', 'Lương thấp nhất'],
]

/** Một dòng thống kê: thanh khoảng P25–P75 và điểm trung vị, đồng bộ hoàn toàn với Web. */
function StatRow({ r, max }: { r: SalaryStatRow; max: number }) {
  const t = useTheme()
  const left = Math.min(96, Math.max(0, (r.p25 / max) * 100))
  const width = Math.min(100 - left, Math.max(4, ((r.p75 - r.p25) / max) * 100))
  const mid = Math.min(99, Math.max(1, (r.median / max) * 100))

  return (
    <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.divider }}>
      {/* Tiêu đề vị trí & số lượt chia sẻ */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Txt weight="700" size={15} numberOfLines={1}>{r.role}</Txt>
            {r.level ? (
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: t.primaryTint,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <Txt size={11} weight="600" color={t.primary}>{r.level}</Txt>
              </View>
            ) : null}
            {r.region ? (
              <Txt muted size={12}>· {r.region}</Txt>
            ) : null}
          </View>
        </View>
        <Txt muted size={12} style={{ marginTop: 2 }}>{`${r.samples} lượt chia sẻ`}</Txt>
      </View>

      {/* Mức phổ biến: X Triệu / tháng (đồng bộ Web: t('salary.commonSalary') + Triệu / tháng) */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
        <Txt muted size={12} weight="500">Mức phổ biến:</Txt>
        <Txt weight="800" size={16} color={t.primary}>{`${r.median} Triệu`}</Txt>
        <Txt muted size={12}>/ tháng</Txt>
      </View>

      {/* Dải lương trực quan */}
      <View style={{ height: 10, borderRadius: 5, backgroundColor: t.inputBg, marginTop: 8, overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            left: `${left}%`,
            width: `${width}%`,
            height: 10,
            borderRadius: 5,
            backgroundColor: t.primaryTint,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: `${mid}%`,
            width: 5,
            marginLeft: -2.5,
            height: 10,
            borderRadius: 2.5,
            backgroundColor: '#F59E0B',
          }}
        />
      </View>

      {/* Hai đầu dải lương: Từ X Tr - Đến Y Tr (đồng bộ Web) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
        <Txt muted size={11}>{`Từ ${r.p25} Tr`}</Txt>
        <Txt muted size={11}>{`Đến ${r.p75} Tr`}</Txt>
      </View>
    </View>
  )
}

/** UC50–51: thống kê lương (lọc chức danh, ngành, khu vực, cấp bậc) lấy 100% từ database như Web. */
export default function SalaryScreen() {
  const t = useTheme()
  const router = useRouter()
  const role = useAuthStore((s) => s.user?.role)
  const [tab, setTab] = useState<Tab>('stats')

  // Bộ lọc thống kê (đồng bộ Web UC54)
  const [jobTitle, setJobTitle] = useState<string | null>(null)
  const [industryId, setIndustryId] = useState<number | null>(null)
  const [region, setRegion] = useState<string | null>(null)
  const [level, setLevel] = useState<SalaryLevel | null>(null)

  // Bộ lọc feed
  const [feedFilters, setFeedFilters] = useState<FilterValues>({ sort: 'latest' })
  const [feedSheet, setFeedSheet] = useState(false)
  const [feedKw, setFeedKw] = useState('')
  const feedSearch = useDebounced(feedKw, 400)

  const isFiltering = !!jobTitle || industryId !== null || !!region || level !== null

  const clearFilters = () => {
    setJobTitle(null)
    setIndustryId(null)
    setRegion(null)
    setLevel(null)
  }

  // 1. Lấy danh sách ngành nghề trực tiếp từ database (/industries)
  const industries = useQuery({
    queryKey: ['industries'],
    queryFn: salaryApi.industries,
    staleTime: 30 * 60_000,
  })

  // 2. Lấy số liệu thống kê gốc toàn bộ từ database để trích xuất danh mục động (khớp 100% Web SalaryPage.tsx)
  const baseStats = useQuery({
    queryKey: ['salary-stats-base'],
    queryFn: () => salaryApi.statistics({}),
    staleTime: 5 * 60_000,
  })

  // Thống kê lương theo bộ lọc hiện tại từ database
  const stats = useQuery({
    queryKey: ['salary-stats', industryId, region, jobTitle, level],
    queryFn: () => salaryApi.statistics({
      industryId,
      region: region || undefined,
      jobTitle: jobTitle || undefined,
      level: level || undefined,
    }),
  })

  const baseRows = useMemo(() => {
    if (baseStats.data?.rows?.length) return baseStats.data.rows
    if (stats.data?.rows?.length) return stats.data.rows
    return []
  }, [baseStats.data?.rows, stats.data?.rows])

  const selectedIndustryName = useMemo(() => {
    return industries.data?.find((i) => i.id === industryId)?.name ?? ''
  }, [industries.data, industryId])

  // 3. Dropdown Khu vực / Thành phố: Lấy các tỉnh/thành CÓ TRONG DATABASE từ baseRows (khớp Web SalaryPage.tsx)
  const regionOptions = useMemo(() => {
    const dbCities = Array.from(
      new Set(baseRows.map((r) => r.region).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'vi'))

    const cities = dbCities.length > 0 ? dbCities : VN_CITIES

    return [
      { value: '', label: 'Tất cả khu vực' },
      ...cities.map((city) => ({ value: city, label: city })),
    ]
  }, [baseRows])

  // 4. Dropdown Chức danh: Lấy các chức danh CÓ TRONG DATABASE từ baseRows
  const jobTitleOptions = useMemo(() => {
    const dbRoles = Array.from(
      new Set(baseRows.map((r) => r.role).filter(Boolean))
    )

    let roles: readonly string[] = dbRoles
    if (industryId != null && selectedIndustryName) {
      const industryTitles = JOB_TITLES_BY_INDUSTRY[selectedIndustryName] ?? []
      const matched = dbRoles.filter((r) =>
        industryTitles.some((t) => t.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(t.toLowerCase()))
      )
      roles = matched.length > 0 ? matched : industryTitles
    } else if (roles.length === 0) {
      roles = STANDARD_JOB_TITLES
    }

    const sortedRoles = Array.from(new Set(roles)).sort((a, b) => a.localeCompare(b, 'vi'))

    return [
      { value: '', label: 'Tất cả chức danh' },
      ...sortedRoles.map((title) => ({ value: title, label: title })),
    ]
  }, [baseRows, industryId, selectedIndustryName])

  // 5. Cấp bậc: Chỉ hiển thị các cấp bậc thực tế có trong database (khớp Web)
  const availableLevels = useMemo(() => {
    const present = new Set(baseRows.map((r) => r.level))
    const list = SALARY_LEVELS.filter((lv) => present.has(lv))
    return list.length > 0 ? list : SALARY_LEVELS
  }, [baseRows])

  // 6. Ngành nghề: Đổ từ database, loại bỏ 'Khác' nếu có
  const industryOptions = useMemo(() => {
    const list = (industries.data ?? []).filter((i) => i.name.trim().toLowerCase() !== 'khác')
    return [
      { value: '', label: 'Tất cả ngành' },
      ...list.map((i) => ({ value: String(i.id), label: i.name })),
    ]
  }, [industries.data])

  const feedSortBy = (feedFilters.sort as string) ?? 'latest'
  const feedIndustryId = feedFilters.industry ? Number(feedFilters.industry) : null

  const feed = useInfiniteQuery({
    queryKey: ['salary-feed', feedIndustryId, feedSortBy, feedSearch],
    enabled: tab === 'feed',
    initialPageParam: 0,
    queryFn: ({ pageParam }) => salaryApi.feed(pageParam, { industryId: feedIndustryId, sortBy: feedSortBy, search: feedSearch }),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })

  const items = feed.data?.pages.flatMap((p) => p.items) ?? []
  const s = stats.data
  const rows = s?.rows ?? []
  const max = Math.max(1, ...rows.map((r) => r.p75))

  const feedFields: FilterField[] = useMemo(
    () => [
      {
        key: 'industry',
        title: 'Ngành nghề',
        type: 'single',
        options: [{ value: '', label: 'Tất cả ngành' }, ...(industries.data ?? []).map((i) => ({ value: String(i.id), label: i.name }))],
      },
      {
        key: 'sort',
        title: 'Sắp xếp đóng góp',
        type: 'single',
        options: SORTS.map(([v, l]) => ({ value: v, label: l })),
      },
    ],
    [industries.data],
  )

  const controls = tab === 'stats' ? (
    <View style={{ backgroundColor: t.card, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 10 }}>
      {/* 1. Dropdown Chức danh (lấy từ database) */}
      <SelectField
        label="Chức danh"
        placeholder="Tất cả chức danh"
        value={jobTitle}
        options={jobTitleOptions}
        onChange={(v) => setJobTitle(v ? v : null)}
      />

      {/* 2. Dropdown Ngành nghề & Khu vực (đều lấy từ database) */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <SelectField
            label="Ngành nghề"
            placeholder="Tất cả ngành"
            value={industryId == null ? null : String(industryId)}
            options={industryOptions}
            onChange={(v) => {
              setIndustryId(v ? Number(v) : null)
              setJobTitle(null)
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField
            label="Khu vực"
            placeholder="Tất cả khu vực"
            value={region}
            options={regionOptions}
            onChange={(v) => setRegion(v ? v : null)}
          />
        </View>
      </View>

      {/* 3. Cấp bậc filter chips (lấy từ database) + Nút Xóa lọc */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Txt size={12} weight="600" muted>Cấp bậc:</Txt>
          <Pressable
            onPress={() => setLevel(null)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 16,
              backgroundColor: level === null ? t.primary : t.inputBg,
            }}
          >
            <Txt size={12} weight="600" color={level === null ? '#fff' : t.textMuted}>Tất cả</Txt>
          </Pressable>
          {availableLevels.map((lv) => {
            const active = level === lv
            return (
              <Pressable
                key={lv}
                onPress={() => setLevel(active ? null : lv)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 16,
                  backgroundColor: active ? t.primary : t.inputBg,
                }}
              >
                <Txt size={12} weight="600" color={active ? '#fff' : t.textMuted}>{lv}</Txt>
              </Pressable>
            )
          })}
        </View>

        {isFiltering ? (
          <Pressable
            onPress={clearFilters}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}
          >
            <X size={14} color={t.danger} />
            <Txt size={12} weight="600" color={t.danger}>Xóa lọc</Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  ) : (
    <View style={{ backgroundColor: t.card, paddingTop: 4, paddingBottom: 8 }}>
      <SearchBar
        value={feedKw}
        onChangeText={setFeedKw}
        placeholder="Tìm chức danh, công ty..."
        style={{ paddingHorizontal: 16 }}
        right={<FilterButton count={countActive(feedFilters, ['sort'])} onPress={() => setFeedSheet(true)} />}
      />
    </View>
  )

  const header = (
    <View style={{ paddingTop: 16 }}>
      {tab === 'stats' ? (
        <View style={{ paddingHorizontal: 16 }}>
          {/* Card Hero: GÓC NHÌN THU NHẬP - Lấy từ database, hiển thị X Triệu */}
          <Enter style={{ borderRadius: 24, padding: 22, backgroundColor: t.primaryTint, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Txt size={11} weight="600" color={t.primary} style={{ letterSpacing: 1 }}>GÓC NHÌN THU NHẬP</Txt>
                <Txt size={13} style={{ marginTop: 6 }}>{`Lương trung vị${region ? ` · ${region}` : ''}`}</Txt>
              </View>
              <BrandIcon name="coin" size={56} />
            </View>
            <Txt size={32} weight="800" color={t.primary} style={{ marginTop: 8, fontVariant: ['tabular-nums'] }}>
              {s?.overallMedian != null ? `${Number(s.overallMedian).toLocaleString('vi-VN')} Triệu` : '—'}
            </Txt>
            <Txt size={12} muted>Thu nhập gộp mỗi tháng (Triệu VNĐ / tháng)</Txt>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.isDark ? t.border : '#EADACE' }}>
              <View style={{ flex: 1 }}>
                <Txt size={18} weight="600">{s?.totalContributions ?? '—'}</Txt>
                <Txt size={12} muted>đóng góp ẩn danh</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={18} weight="600">{s?.trackedPositions ?? '—'}</Txt>
                <Txt size={12} muted>vị trí công việc</Txt>
              </View>
            </View>
          </Enter>

          {role === 'ALUMNI' ? (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <Button
                title="Đóng góp lương"
                variant="brand"
                size="sm"
                icon={<Plus size={16} color="#fff" />}
                onPress={() => router.push('/salary/contribute')}
                style={{ flex: 1 }}
              />
              <Button
                title="Đóng góp của tôi"
                size="sm"
                variant="outline"
                onPress={() => router.push('/salary/mine')}
                style={{ flex: 1, minHeight: 44 }}
              />
            </View>
          ) : null}

          {/* Danh sách: Mức lương theo vị trí từ database - Đồng bộ tiêu đề & đơn vị */}
          <Card style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Txt weight="700" size={16}>Mức lương theo vị trí</Txt>
              <Txt muted size={12}>(Triệu VNĐ / tháng)</Txt>
            </View>
            <Txt muted size={12} style={{ marginTop: 4, marginBottom: 10 }}>
              Khoảng phổ biến P25–P75 · Điểm vàng là trung vị
            </Txt>
            {stats.isError ? (
              <Empty text="Không tải được thống kê." error={stats.error} onRetry={() => void stats.refetch()} />
            ) : stats.isLoading ? (
              <ListSkeleton variant="row" count={3} />
            ) : rows.length ? (
              rows.map((r, i) => <StatRow key={`${r.role}-${r.level}-${r.region}-${i}`} r={r} max={max} />)
            ) : (
              <Txt muted style={{ paddingVertical: 20, textAlign: 'center' }}>
                Chưa có dữ liệu thống kê cho tiêu chí lọc này.
              </Txt>
            )}
          </Card>

          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 16 }}>
            <Lock size={14} color={t.textMuted} />
            <Txt size={12} muted>Dữ liệu do cộng đồng chia sẻ ẩn danh</Txt>
          </View>
        </View>
      ) : feed.isLoading ? (
        <ListSkeleton variant="row" />
      ) : null}
    </View>
  )

  return (
    <Screen bg={t.card}>
      <Header title="Khảo sát lương" />
      <SoftTabs<Tab>
        tabs={[['stats', 'Tổng quan'], ['feed', 'Chia sẻ gần đây']]}
        value={tab}
        onChange={setTab}
      />
      {controls}
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {tab === 'stats' ? (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={stats.isRefetching || baseStats.isRefetching}
                onRefresh={() => {
                  void stats.refetch()
                  void baseStats.refetch()
                }}
                tintColor={t.primary}
                colors={[t.primary]}
              />
            }
          >
            {header}
          </ScrollView>
        ) : (
          <FlashList
            data={!feed.isLoading ? items : []}
            maintainVisibleContentPosition={{ disabled: true }}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            onEndReached={() => tab === 'feed' && feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
            refreshing={feed.isRefetching}
            onRefresh={() => feed.refetch()}
            ListHeaderComponent={header}
            ListEmptyComponent={
              tab === 'feed' && !feed.isLoading ? (
                <Empty
                  error={feed.error}
                  onRetry={() => void feed.refetch()}
                  icon={<BrandIcon name="coin" size={56} />}
                  title="Chưa có đóng góp"
                  text="Thử bỏ bớt bộ lọc hoặc đổi từ khoá."
                />
              ) : null
            }
            renderItem={({ item }) => (
              <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt weight="800" size={15}>{item.jobTitle}</Txt>
                    {item.company ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Briefcase size={13} color={t.textMuted} />
                        <Txt muted size={13}>{item.company}</Txt>
                      </View>
                    ) : null}
                    {item.region ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} color={t.textMuted} />
                        <Txt muted size={13}>{item.region}</Txt>
                      </View>
                    ) : null}
                  </View>
                  <Txt weight="800" size={16} color={t.success}>{formatVnd(item.grossAmount)}</Txt>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                  {item.industry ? <Tag label={item.industry} tone="neutral" /> : null}
                  {item.yearsExperience != null ? <Tag label={`${item.yearsExperience} năm KN`} tone="info" /> : null}
                </View>
              </Card>
            )}
          />
        )}
      </View>
      <FilterSheet
        visible={feedSheet}
        onClose={() => setFeedSheet(false)}
        title="Lọc lương"
        fields={feedFields}
        values={feedFilters}
        defaults={{ sort: 'latest' }}
        onApply={setFeedFilters}
      />
    </Screen>
  )
}
