import React, { useMemo, useState } from 'react'
import { Pressable, RefreshControl, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Briefcase,
  Laptop,
  Lock,
  MapPin,
  Plus,
  Share2,
  Sparkles,
  Users,
  X,
} from '@/components/icons'
import { Button, Empty, Screen, SearchBar, Tag, Txt } from '@/components/ui'
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

/** Ánh xạ thông minh icon và mã màu chủ đạo theo từ khóa vị trí công việc, chuẩn hóa 100% như Web. */
function getJobStyle(role: string, t: ReturnType<typeof useTheme>) {
  const r = role.toLowerCase()
  if (r.includes('data') || r.includes('analyst') || r.includes('dữ liệu') || r.includes('bi')) {
    return {
      Icon: BarChart3,
      bg: t.infoTint,
      color: t.info,
      border: t.isDark ? '#1E3A8A' : '#BFDBFE',
    }
  }
  if (r.includes('design') || r.includes('ui') || r.includes('ux') || r.includes('thiết kế') || r.includes('graphic')) {
    return {
      Icon: Sparkles,
      bg: t.dangerTint,
      color: t.danger,
      border: t.isDark ? '#7F1D1D' : '#FECDD3',
    }
  }
  if (
    r.includes('dev') ||
    r.includes('lập trình') ||
    r.includes('engineer') ||
    r.includes('kỹ sư') ||
    r.includes('software') ||
    r.includes('frontend') ||
    r.includes('backend') ||
    r.includes('fullstack')
  ) {
    return {
      Icon: Laptop,
      bg: t.primaryTint,
      color: t.primary,
      border: t.isDark ? '#7C2D12' : '#FED7AA',
    }
  }
  if (r.includes('market') || r.includes('seo') || r.includes('content') || r.includes('quảng cáo') || r.includes('media')) {
    return {
      Icon: Share2,
      bg: t.infoTint,
      color: t.info,
      border: t.isDark ? '#1E3A8A' : '#BFDBFE',
    }
  }
  if (
    r.includes('business') ||
    r.includes('sales') ||
    r.includes('kinh doanh') ||
    r.includes('finance') ||
    r.includes('tài chính') ||
    r.includes('manager') ||
    r.includes('quản lý') ||
    r.includes('pm')
  ) {
    return {
      Icon: Briefcase,
      bg: t.successTint,
      color: t.success,
      border: t.isDark ? '#14532D' : '#BBF7D0',
    }
  }
  return {
    Icon: Users,
    bg: t.warningTint,
    color: t.warning,
    border: t.isDark ? '#78350F' : '#FED7AA',
  }
}

/** Một thẻ thống kê vị trí công việc: Icon squircle, badge cấp bậc, thanh khoảng P25–P75 chuẩn Web. */
function StatRow({ r, max }: { r: SalaryStatRow; max: number }) {
  const t = useTheme()
  const style = getJobStyle(r.role, t)
  const IconComponent = style.Icon

  const left = Math.min(96, Math.max(0, (r.p25 / max) * 100))
  const width = Math.min(100 - left, Math.max(4, ((r.p75 - r.p25) / max) * 100))
  const mid = Math.min(99, Math.max(1, (r.median / max) * 100))

  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.card,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Tiêu đề vị trí & số lượt đóng góp */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: style.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={18} color={style.color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: 1 }}>
              <Txt weight="700" size={15} numberOfLines={1}>{r.role}</Txt>
              {r.level ? (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                    backgroundColor: style.bg,
                    borderWidth: 1,
                    borderColor: style.border,
                  }}
                >
                  <Txt size={11} weight="600" color={style.color}>{r.level}</Txt>
                </View>
              ) : null}
              {r.region ? (
                <Txt muted size={12}>· {r.region}</Txt>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <Users size={12} color={t.textMuted} />
              <Txt muted size={12}>{`${r.samples} lượt chia sẻ`}</Txt>
            </View>
          </View>
        </View>
      </View>

      {/* Mức phổ biến: X Triệu / tháng */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginBottom: 8 }}>
        <Txt size={13} weight="500" color={t.textSubtle}>Mức phổ biến:</Txt>
        <Txt weight="800" size={18} color={t.primary}>{`${r.median} Triệu`}</Txt>
        <Txt size={12} color={t.textSubtle}>/ tháng</Txt>
      </View>

      {/* Thanh trực quan dải lương chuẩn Web */}
      <View>
        <View style={{ height: 12, borderRadius: 6, backgroundColor: t.isDark ? '#2A2A2E' : '#EAECEF', overflow: 'hidden' }}>
          {/* Dải lương từ thấp đến cao (p25 -> p75) màu primary chuẩn Web */}
          <View
            style={{
              position: 'absolute',
              left: `${left}%`,
              width: `${width}%`,
              height: 12,
              borderRadius: 6,
              backgroundColor: t.primary,
            }}
          />
          {/* Vạch mốc lương phổ biến: màu vàng gold #F59E0B */}
          <View
            style={{
              position: 'absolute',
              left: `${mid}%`,
              width: 5,
              marginLeft: -2.5,
              height: 12,
              borderRadius: 2.5,
              backgroundColor: '#F59E0B',
            }}
          />
        </View>

        {/* Hai đầu dải lương: Từ X Tr - Đến Y Tr */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
          <Txt size={12} weight="500" color={t.textSubtle}>{`Từ ${r.p25} Tr`}</Txt>
          <Txt size={12} weight="500" color={t.textSubtle}>{`Đến ${r.p75} Tr`}</Txt>
        </View>
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
          {/* Card Hero: GÓC NHÌN THU NHẬP - Chuẩn mã màu ấm áp Web */}
          <Enter
            style={{
              borderRadius: 24,
              padding: 22,
              backgroundColor: t.isDark ? '#231B14' : '#FFF3EA',
              borderWidth: 1,
              borderColor: t.isDark ? '#4A2C18' : '#FFE2CC',
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Txt size={11} weight="700" color={t.primary} style={{ letterSpacing: 1.2 }}>GÓC NHÌN THU NHẬP</Txt>
                <Txt size={14} weight="600" style={{ marginTop: 6 }}>{`Lương trung vị${region ? ` · ${region}` : ''}`}</Txt>
              </View>
              <BrandIcon name="coin" size={56} />
            </View>
            <Txt size={34} weight="800" color={t.primary} style={{ marginTop: 8, fontVariant: ['tabular-nums'] }}>
              {s?.overallMedian != null ? `${Number(s.overallMedian).toLocaleString('vi-VN')} Triệu` : '—'}
            </Txt>
            <Txt size={12} muted>Thu nhập gộp mỗi tháng (Triệu VNĐ / tháng)</Txt>
            <View
              style={{
                flexDirection: 'row',
                gap: 24,
                marginTop: 18,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: t.isDark ? '#3D2817' : '#FFD9BF',
              }}
            >
              <View style={{ flex: 1 }}>
                <Txt size={18} weight="700">{s?.totalContributions ?? '—'}</Txt>
                <Txt size={12} muted>lượt chia sẻ</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={18} weight="700">{s?.trackedPositions ?? '—'}</Txt>
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

          {/* Danh sách: Mức lương theo vị trí từ database - Chuẩn mã màu & Card riêng như Web */}
          <View style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Txt weight="700" size={17}>Mức lương theo vị trí</Txt>
              <Txt muted size={12} weight="500">(Triệu VNĐ / tháng)</Txt>
            </View>
            <Txt muted size={12} style={{ marginTop: 3, marginBottom: 12 }}>
              Khoảng phổ biến P25–P75 · Điểm vàng là trung vị
            </Txt>

            {stats.isError ? (
              <Empty text="Không tải được thống kê." error={stats.error} onRetry={() => void stats.refetch()} />
            ) : stats.isLoading ? (
              <ListSkeleton variant="row" count={3} />
            ) : rows.length ? (
              rows.map((r, i) => <StatRow key={`${r.role}-${r.level}-${r.region}-${i}`} r={r} max={max} />)
            ) : (
              <Txt muted style={{ paddingVertical: 24, textAlign: 'center' }}>
                Chưa có dữ liệu thống kê cho tiêu chí lọc này.
              </Txt>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: 16 }}>
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
      {/* Đổi nhãn tab thành 'Đóng góp gần đây' chuẩn hóa như Web */}
      <SoftTabs<Tab>
        tabs={[['stats', 'Tổng quan'], ['feed', 'Đóng góp gần đây']]}
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
                  title="Chưa có đóng góp gần đây"
                  text="Thử bỏ bớt bộ lọc hoặc đổi từ khoá."
                />
              ) : null
            }
            renderItem={({ item }) => (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 12,
                  padding: 16,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.card,
                }}
              >
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
              </View>
            )}
          />
        )}
      </View>
      <FilterSheet
        visible={feedSheet}
        onClose={() => setFeedSheet(false)}
        title="Lọc đóng góp"
        fields={feedFields}
        values={feedFilters}
        defaults={{ sort: 'latest' }}
        onApply={setFeedFilters}
      />
    </Screen>
  )
}
