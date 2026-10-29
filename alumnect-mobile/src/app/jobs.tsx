import React, { useMemo, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Bookmark, Building2, BriefcaseBusiness, MapPin, Coins } from '@/components/icons'
import { Avatar, Button, Card, Empty, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { SelectField } from '@/components/SelectField'
import { FilterButton, FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { VN_CITIES, matchCity, normalize } from '@/constants/filters'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { feedApi } from '@/api/feed'
import type { Post } from '@/api/feed'
import { useDebounced } from '@/lib/hooks'
import { toast, errMsg } from '@/lib/toast'
import { useTheme } from '@/theme'

const formatSalary = (min?: number | null, max?: number | null) => {
  const f = (n: number) => n.toLocaleString('vi-VN')
  if (!min && !max) return 'Thỏa thuận'
  if (min && !max) return `Từ ${f(min)} VND`
  if (!min && max) return `Lên đến ${f(max)} VND`
  return `${f(min!)} – ${f(max!)} VND`
}

/** Việc làm: bài viết loại "recruitment" trong Feed (giống trang /app/jobs trên Web). */
export default function JobsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [kw, setKw] = useState('')
  const [filters, setFilters] = useState<FilterValues>({})
  const [sheet, setSheet] = useState(false)
  const city = (filters.city as string) || null
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({})
  const keyword = useDebounced(kw, 300).trim()

  const q = useInfiniteQuery({
    queryKey: ['jobs'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getFeed({ page: pageParam, filter: 'recruitment' }),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const posts = useMemo(() => (q.data?.pages.flatMap((p) => p.items) ?? []).filter((p) => p.job), [q.data])

  const jobs = posts.filter((p) => {
    const j = p.job!
    const okKw = !keyword || [j.title, j.company, p.author, p.text].some((s) => s && normalize(s).includes(normalize(keyword)))
    const okCity = !city || matchCity(j.location, city)
    const okSalary = !filters.salary || (filters.salary === 'listed' ? !!(j.salaryMin || j.salaryMax) : !(j.salaryMin || j.salaryMax))
    const okSaved = !filters.saved || (savedMap[p.id] ?? p.saved)
    const okApply = !filters.apply || !!(j.applyUrl || j.contactEmail)
    return okKw && okCity && okSalary && okSaved && okApply
  })

  const toggleSave = async (p: Post) => {
    const now = savedMap[p.id] ?? p.saved
    setSavedMap((m) => ({ ...m, [p.id]: !now }))
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    try {
      if (now) {
        await feedApi.unsave(p.id)
        toast.success('Đã bỏ lưu bài viết.')
      } else {
        await feedApi.save(p.id)
        toast.success('Đã lưu bài viết vào danh sách.')
      }
    } catch (e) {
      setSavedMap((m) => ({ ...m, [p.id]: now }))
      toast.error(errMsg(e))
    }
  }

  const apply = (j: NonNullable<Post['job']>) => {
    const url = j.applyUrl || (j.contactEmail ? `mailto:${j.contactEmail}` : null)
    if (!url) return toast.info('Tin này chưa có liên kết ứng tuyển.')
    Linking.openURL(url).catch(() => toast.error('Không thể mở liên kết ứng tuyển.'))
  }

  const fields: FilterField[] = [
    { key: 'city', title: 'Địa điểm', type: 'single', options: [{ value: '', label: 'Mọi địa điểm' }, ...VN_CITIES.map((c) => ({ value: c, label: c }))] },
    { key: 'salary', title: 'Mức lương', type: 'single', options: [{ value: '', label: 'Tất cả' }, { value: 'listed', label: 'Có công bố lương' }, { value: 'negotiable', label: 'Thỏa thuận' }] },
    { key: 'apply', title: 'Ứng tuyển', type: 'single', options: [{ value: '', label: 'Tất cả' }, { value: '1', label: 'Có link / email ứng tuyển' }] },
    { key: 'saved', title: 'Đã lưu', type: 'single', options: [{ value: '', label: 'Tất cả' }, { value: '1', label: 'Chỉ tin đã lưu' }] },
  ]

  return (
    <Screen bg={t.card}>
      <Header title="Việc làm" subtitle={q.isLoading ? undefined : `${jobs.length} tin tuyển dụng`} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={q.isLoading ? [] : jobs}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.card, paddingTop: 12, marginBottom: 16 }}>
                <SearchBar value={kw} onChangeText={setKw} placeholder="Chức danh, công ty hoặc từ khóa..." style={{ paddingHorizontal: 16 }} right={<FilterButton count={countActive(filters)} onPress={() => setSheet(true)} />} />
                <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                  <SelectField label="Địa điểm" placeholder="Mọi địa điểm" value={city} options={VN_CITIES.map((c) => ({ value: c, label: c }))} onChange={(value) => setFilters((f) => ({ ...f, city: value ?? undefined }))} />
                </View>
              </View>
              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty error={q.error} onRetry={() => { void q.refetch() }} icon={<BriefcaseBusiness size={28} color={t.primary} />} title="Chưa có tin phù hợp" text="Thử đổi địa điểm hoặc từ khoá khác." action={countActive(filters) ? 'Xoá bộ lọc' : undefined} onAction={() => setFilters({})} />
            )
          }
          renderItem={({ item: p }) => {
            const j = p.job!
            const saved = savedMap[p.id] ?? p.saved
            return (
              <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: t.infoTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt size={20} weight="800" color={t.info}>{(j.company || p.author || '?').trim().charAt(0).toUpperCase()}</Txt>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Xem việc làm ${j.title}`} onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })} style={{ flex: 1, minHeight: 44 }}>
                    <Txt weight="800" size={16} numberOfLines={2}>{j.title}</Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Building2 size={14} color={t.textMuted} /><Txt muted size={13} numberOfLines={1} style={{ flex: 1 }}>{j.company || p.author}</Txt>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => void toggleSave(p)} hitSlop={8} accessibilityRole="button" accessibilityLabel={saved ? 'Bỏ lưu tin' : 'Lưu tin'}>
                    <Bookmark size={22} color={saved ? t.primary : t.textMuted} fill={saved ? t.primary : 'transparent'} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {j.location ? <Tag label={j.location} tone="neutral" icon={<MapPin size={12} color={t.textMuted} />} /> : null}
                  <Tag label={formatSalary(j.salaryMin, j.salaryMax)} tone="success" icon={<Coins size={12} color={t.success} />} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.divider }}>
                  <Avatar uri={p.avatar} name={p.author} size={24} />
                  <Txt muted size={12} numberOfLines={1} style={{ flex: 1 }}>{[p.author, p.time].filter(Boolean).join(' · ')}</Txt>
                  {j.applyUrl || j.contactEmail ? <Button title="Ứng tuyển" size="sm" onPress={() => apply(j)} /> : null}
                </View>
              </Card>
            )
          }}
        />
      </View>
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} title="Lọc việc làm" fields={fields} values={filters} onApply={setFilters} />
    </Screen>
  )
}
