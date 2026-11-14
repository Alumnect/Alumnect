import React, { useMemo, useState } from 'react'
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Briefcase, Lock, MapPin, Plus, X } from '@/components/icons'
import { Button, Empty, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { SelectField } from '@/components/SelectField'
import { FilterButton, FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { Header } from '@/components/Header'
import { ListSkeleton } from '@/components/Skeleton'
import { formatVnd, salaryApi } from '@/api/salary'
import type { SalaryContribution, SalaryStatRow } from '@/api/salary'
import { useAuthStore } from '@/store/authStore'
import { VN_CITIES } from '@/constants/filters'
import {
  JOB_TITLES_BY_INDUSTRY,
  SALARY_LEVELS,
  STANDARD_JOB_TITLES,
  getJobStyle,
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

/** Một thẻ thống kê vị trí công việc: Card bo góc riêng biệt, badge cấp bậc màu theo ngành, thanh khoảng P25–P75 chuẩn Web. */
function SalaryStatCard({ r, max }: { r: SalaryStatRow; max: number }) {
  const t = useTheme()
  const style = getJobStyle(r.role, t)

  const p25 = Math.max(0, Number(r.p25) || 0)
  const p75 = Math.max(0, Number(r.p75) || 0)
  const median = Math.max(0, Number(r.median) || 0)
  const safeMax = max > 0 ? max : Math.max(1, p75, median, p25)

  const left = Math.min(96, Math.max(0, (p25 / safeMax) * 100))
  const width = Math.min(100 - left, Math.max(4, ((p75 - p25) / safeMax) * 100))
  const mid = Math.min(99, Math.max(1, (median / safeMax) * 100))

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
      {/* Tiêu đề vị trí, cấp bậc & số lượt chia sẻ */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Txt weight="700" size={15} numberOfLines={1}>{r.role || 'Chưa rõ vị trí'}</Txt>
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
        </View>
        <Txt muted size={12} weight="500">{`${r.samples ?? 0} lượt chia sẻ`}</Txt>
      </View>

      {/* Mức phổ biến: X Triệu / tháng */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginBottom: 8 }}>
        <Txt size={13} weight="500" color={t.textMuted}>Mức phổ biến:</Txt>
        <Txt weight="800" size={18} color={t.primary}>{`${median} Triệu`}</Txt>
        <Txt size={12} color={t.textMuted}>/ tháng</Txt>
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
          <Txt size={12} weight="500" color={t.textMuted}>{`Từ ${p25} Tr`}</Txt>
          <Txt size={12} weight="500" color={t.textMuted}>{`Đến ${p75} Tr`}</Txt>
        </View>
      </View>
    </View>
  )
}

function formatFeedTimeAgo(iso?: string) {
  if (!iso) return ''
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} ngày trước`
  const dt = new Date(iso)
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`
}

/** Thẻ một lượt đóng góp gần đây chuẩn hóa 100% màu sắc và bố cục theo Web AlumNect. */
function SalaryFeedCard({ item }: { item: SalaryContribution }) {
  const t = useTheme()
  const style = getJobStyle(item.jobTitle, t)
  const timeAgo = formatFeedTimeAgo(item.createdAt)

  return (
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
      {/* Tiêu đề vị trí & Thời gian đăng */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <Txt weight="700" size={15} numberOfLines={1} style={{ flex: 1 }}>
          {item.jobTitle}
        </Txt>
        {timeAgo ? (
          <Txt size={12} color={t.textMuted} weight="500">
            {timeAgo}
          </Txt>
        ) : null}
      </View>

      {/* Badges: Ngành nghề (đổi màu badge theo style Web) & Công ty */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 }}>
        {item.industry ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2.5,
              borderRadius: 6,
              backgroundColor: style.bg,
              borderWidth: 1,
              borderColor: style.border,
            }}
          >
            <Txt size={11} weight="600" color={style.color}>
              {item.industry}
            </Txt>
          </View>
        ) : null}
        {item.company ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2.5,
              borderRadius: 6,
              backgroundColor: t.isDark ? '#26242E' : '#F3F4F6',
              borderWidth: 1,
              borderColor: t.border,
            }}
          >
            <Txt size={11} weight="500" color={t.textMuted} numberOfLines={1}>
              {item.company}
            </Txt>
          </View>
        ) : null}
      </View>

      {/* Địa điểm */}
      {item.region ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <MapPin size={12} color={t.textMuted} />
          <Txt size={12} color={t.textMuted}>
            {item.region}
          </Txt>
        </View>
      ) : null}

      {/* Mức lương (màu cam FPT chuẩn Web) & Kinh nghiệm */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.divider,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Txt weight="800" size={16} color={t.primary}>
            {formatVnd(item.grossAmount)}
          </Txt>
          <Txt size={12} color={t.textMuted}>
            / tháng
          </Txt>
        </View>
        {item.yearsExperience != null ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2.5,
              borderRadius: 6,
              backgroundColor: t.primaryTint,
              borderWidth: 1,
              borderColor: t.isDark ? '#7C2D12' : '#FED7AA',
            }}
          >
            <Txt size={11} weight="600" color={t.primary}>
              {item.yearsExperience > 0 ? `${item.yearsExperience} năm KN` : 'Chưa có KN'}
            </Txt>
          </View>
        ) : null}
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
  const max = Math.max(1, ...rows.map((r) => Number(r.p75) || 0))

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
                <Txt size={12} muted>đóng góp ẩn danh</Txt>
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
              rows.map((r, i) => (
                <SalaryStatCard
                  key={`${r.role || 'role'}-${r.level || 'level'}-${r.region || 'region'}-${i}`}
                  r={r}
                  max={max}
                />
              ))
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
            renderItem={({ item }) => <SalaryFeedCard item={item} />}
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
