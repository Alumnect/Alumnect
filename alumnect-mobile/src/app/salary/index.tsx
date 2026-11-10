import React, { useMemo, useState } from 'react'
import { RefreshControl, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Briefcase, MapPin, Plus, Lock } from '@/components/icons'
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
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { SoftTabs } from '@/components/SocialUI'
import { Enter } from '@/components/Motion'

type Tab = 'stats' | 'feed'
const SORTS: [string, string][] = [['latest', 'Mới nhất'], ['salaryDesc', 'Lương cao nhất'], ['salaryAsc', 'Lương thấp nhất']]
const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}tr` : formatVnd(n))

/** Một dòng thống kê: thanh khoảng P25–P75 và điểm trung vị. */
function StatRow({ r, max }: { r: SalaryStatRow; max: number }) {
  const t = useTheme()
  const left = Math.min(96, Math.max(0, (r.p25 / max) * 100))
  const width = Math.min(100 - left, Math.max(4, ((r.p75 - r.p25) / max) * 100))
  const mid = Math.min(99, Math.max(1, (r.median / max) * 100))
  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.divider }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Txt weight="600" size={14} numberOfLines={2}>{r.role}</Txt>
          <Txt muted size={12} numberOfLines={1}>{[r.level, r.region, `${r.samples} mẫu`].filter(Boolean).join(' · ')}</Txt>
        </View>
        <Txt weight="800" color={t.primary}>{short(r.median)}</Txt>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: t.inputBg, marginTop: 8 }}>
        <View style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, height: 8, borderRadius: 4, backgroundColor: t.primaryTint }} />
        <View style={{ position: 'absolute', left: `${mid}%`, width: 4, marginLeft: -2, height: 8, borderRadius: 2, backgroundColor: t.primary }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Txt muted size={11}>{`P25 ${short(r.p25)}`}</Txt>
        <Txt muted size={11}>{`P75 ${short(r.p75)}`}</Txt>
      </View>
    </View>
  )
}

/** UC50–51: thống kê lương (lọc ngành, khu vực) và các đóng góp ẩn danh. */
export default function SalaryScreen() {
  const t = useTheme()
  const router = useRouter()
  const role = useAuthStore((s) => s.user?.role)
  const [tab, setTab] = useState<Tab>('stats')
  const [filters, setFilters] = useState<FilterValues>({ sort: 'latest' })
  const [sheet, setSheet] = useState(false)
  const [kw, setKw] = useState('')
  const search = useDebounced(kw, 400)

  const industryId = filters.industry ? Number(filters.industry) : null
  const region = (filters.region as string) || undefined
  const sortBy = (filters.sort as string) ?? 'latest'

  const industries = useQuery({ queryKey: ['industries'], queryFn: salaryApi.industries, staleTime: 30 * 60_000 })
  const stats = useQuery({ queryKey: ['salary-stats', industryId, region], queryFn: () => salaryApi.statistics({ industryId, region }) })
  const feed = useInfiniteQuery({
    queryKey: ['salary-feed', industryId, sortBy, search],
    enabled: tab === 'feed',
    initialPageParam: 0,
    queryFn: ({ pageParam }) => salaryApi.feed(pageParam, { industryId, sortBy, search }),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = feed.data?.pages.flatMap((p) => p.items) ?? []
  const s = stats.data
  const rows = s?.rows ?? []
  const max = Math.max(1, ...rows.map((r) => r.p75))

  const fields: FilterField[] = useMemo(
    () => [
      { key: 'industry', title: 'Ngành nghề', type: 'single', options: [{ value: '', label: 'Tất cả ngành' }, ...(industries.data ?? []).map((i) => ({ value: String(i.id), label: i.name }))] },
      { key: 'region', title: 'Khu vực (thống kê)', type: 'single', options: [{ value: '', label: 'Tất cả khu vực' }, ...VN_CITIES.map((c) => ({ value: c, label: c }))] },
      { key: 'sort', title: 'Sắp xếp đóng góp', type: 'single', options: SORTS.map(([v, l]) => ({ value: v, label: l })) },
    ],
    [industries.data],
  )

  // Keep the search input mounted when typing switches from statistics to feed.
  const controls = (
      <View style={{ backgroundColor: t.card, paddingTop: 4, paddingBottom: 4 }}>
        <SearchBar
          value={kw}
          onChangeText={(v) => {
            setKw(v)
            if (v && tab !== 'feed') setTab('feed')
          }}
          placeholder="Tìm chức danh, công ty..."
          style={{ paddingHorizontal: 16 }}
          right={<FilterButton count={countActive(filters, ['sort'])} onPress={() => setSheet(true)} />}
        />
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <SelectField label="Ngành nghề" placeholder="Mọi ngành" value={filters.industry as string | undefined} options={(industries.data ?? []).map((i) => ({ value: String(i.id), label: i.name }))} onChange={(value) => setFilters((f) => ({ ...f, industry: value ?? undefined }))} />
        </View>
      </View>
  )

  const header = (
    <View style={{ paddingTop: 16 }}>
      {tab === 'stats' ? (
        <View style={{ paddingHorizontal: 16 }}>
          <Enter style={{ borderRadius: 24, padding: 22, backgroundColor: t.primaryTint, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Txt size={11} weight="600" color={t.primary} style={{ letterSpacing: 1 }}>GÓC NHÌN THU NHẬP</Txt>
                <Txt size={13} style={{ marginTop: 6 }}>{`Lương trung vị${region ? ` · ${region}` : ''}`}</Txt>
              </View>
              <BrandIcon name="coin" size={56} />
            </View>
            <Txt size={32} weight="700" style={{ marginTop: 8, fontVariant: ['tabular-nums'] }}>{s?.overallMedian != null ? formatVnd(s.overallMedian) : '—'}</Txt>
            <Txt size={12} muted>Thu nhập gộp mỗi tháng</Txt>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.isDark ? t.border : '#EADACE' }}>
              <View style={{ flex: 1 }}><Txt size={18} weight="600">{s?.totalContributions ?? '—'}</Txt><Txt size={12} muted>đóng góp ẩn danh</Txt></View>
              <View style={{ flex: 1 }}><Txt size={18} weight="600">{s?.trackedPositions ?? '—'}</Txt><Txt size={12} muted>vị trí công việc</Txt></View>
            </View>
          </Enter>
          {role === 'ALUMNI' ? (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <Button title="Đóng góp lương" variant="brand" size="sm" icon={<Plus size={16} color="#fff" />} onPress={() => router.push('/salary/contribute')} style={{ flex: 1 }} />
              <Button title="Đóng góp của tôi" size="sm" variant="outline" onPress={() => router.push('/salary/mine')} style={{ flex: 1, minHeight: 44 }} />
            </View>
          ) : null}
          <Card style={{ paddingVertical: 4 }}>
            <Txt weight="600" size={16} style={{ marginTop: 10 }}>Mức lương theo vị trí</Txt>
            <Txt muted size={12} style={{ marginTop: 4, marginBottom: 8 }}>Khoảng phổ biến P25–P75 · Chấm cam là trung vị</Txt>
            {stats.isError ? <Empty text="Không tải được thống kê." error={stats.error} onRetry={() => void stats.refetch()} /> : stats.isLoading ? <ListSkeleton variant="row" count={3} /> : rows.length ? rows.map((r, i) => <StatRow key={`${r.role}-${r.level}-${r.region}-${i}`} r={r} max={max} />) : (
              <Txt muted style={{ paddingVertical: 16 }}>Chưa đủ dữ liệu cho bộ lọc này.</Txt>
            )}
          </Card>
          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 16 }}><Lock size={14} color={t.textMuted} /><Txt size={12} muted>Dữ liệu do cộng đồng chia sẻ ẩn danh</Txt></View>
        </View>
      ) : feed.isLoading ? <ListSkeleton variant="row" /> : null}
    </View>
  )

  return (
    <Screen bg={t.card}>
      <Header title="Khảo sát lương" />
      <SoftTabs<Tab> tabs={[['stats', 'Tổng quan'], ['feed', 'Chia sẻ gần đây']]} value={tab} onChange={setTab} />
      {controls}
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {tab === 'stats' ? <ScrollView refreshControl={<RefreshControl refreshing={stats.isRefetching} onRefresh={() => void stats.refetch()} tintColor={t.primary} colors={[t.primary]} />}>{header}</ScrollView> : (
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
            tab === 'feed' && !feed.isLoading ? <Empty error={feed.error} onRetry={() => void feed.refetch()} icon={<BrandIcon name="coin" size={56} />} title="Chưa có đóng góp" text="Thử bỏ bớt bộ lọc hoặc đổi từ khoá." /> : null
          }
          renderItem={({ item }) => (
            <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt weight="800" size={15}>{item.jobTitle}</Txt>
                  {item.company ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Briefcase size={13} color={t.textMuted} /><Txt muted size={13}>{item.company}</Txt></View>
                  ) : null}
                  {item.region ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><MapPin size={13} color={t.textMuted} /><Txt muted size={13}>{item.region}</Txt></View>
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
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} title="Lọc lương" fields={fields} values={filters} defaults={{ sort: 'latest' }} onApply={setFilters} />
    </Screen>
  )
}
