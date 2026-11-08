import React, { useMemo, useState } from 'react'
import { LayoutAnimation, Linking, Pressable, StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronRight, IgBookmark } from '@/components/icons'
import { ScrollView } from '@/components/ScrollView'
import { Avatar, Empty, Screen, SearchBar, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import type { BrandIconName } from '@/components/BrandIcon'
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
  if (min && !max) return `Từ ${f(min)} VNĐ`
  if (!min && max) return `Lên đến ${f(max)} VNĐ`
  if (min === max) return `${f(min!)} VNĐ`
  return `${f(min!)} – ${f(max!)} VNĐ`
}

const QUICK_CITIES = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ']

/** Việc làm: thiết kế kết hợp Meetup (thẻ danh mục nét cọ & dòng thông tin rõ ràng), Instagram (bookmark, pill) và Kakao. */
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

  const salaryCount = useMemo(
    () => posts.filter((p) => !!(p.job?.salaryMin || p.job?.salaryMax)).length,
    [posts],
  )
  const savedCount = useMemo(
    () => posts.filter((p) => savedMap[p.id] ?? p.saved).length,
    [posts, savedMap],
  )

  const jobs = posts.filter((p) => {
    const j = p.job!
    const okKw = !keyword || [j.title, j.company, p.author, p.text].some((s) => s && normalize(s).includes(normalize(keyword)))
    const okCity = !city || matchCity(j.location, city)
    const okSalary = !filters.salary || (filters.salary === 'listed' ? !!(j.salaryMin || j.salaryMax) : !(j.salaryMin || j.salaryMax))
    const okSaved = !filters.saved || (savedMap[p.id] ?? p.saved)
    const okApply = !filters.apply || !!(j.applyUrl || j.contactEmail)
    return okKw && okCity && okSalary && okSaved && okApply
  })

  const updateFilters = (patch: Partial<FilterValues>) => {
    Haptics.selectionAsync().catch(() => {})
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  const toggleSave = async (p: Post) => {
    const now = savedMap[p.id] ?? p.saved
    setSavedMap((m) => ({ ...m, [p.id]: !now }))
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    try {
      if (now) {
        await feedApi.unsave(p.id)
        toast.success('Đã bỏ lưu tin tuyển dụng.')
      } else {
        await feedApi.save(p.id)
        toast.success('Đã lưu tin tuyển dụng.')
      }
    } catch (e) {
      setSavedMap((m) => ({ ...m, [p.id]: now }))
      toast.error(errMsg(e))
    }
  }

  const apply = (j: NonNullable<Post['job']>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
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

  const categoryCards: {
    key: string
    title: string
    sub: string
    icon: BrandIconName
    active: boolean
    onPress: () => void
  }[] = [
    {
      key: 'all',
      title: 'Tất cả việc làm',
      sub: `${posts.length} cơ hội`,
      icon: 'suitcase',
      active: !filters.salary && !filters.saved && !city,
      onPress: () => {
        Haptics.selectionAsync().catch(() => {})
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setFilters({})
      },
    },
    {
      key: 'salary',
      title: 'Công bố lương',
      sub: `${salaryCount} tin rõ lương`,
      icon: 'coin',
      active: filters.salary === 'listed',
      onPress: () => updateFilters({ salary: filters.salary === 'listed' ? undefined : 'listed' }),
    },
    {
      key: 'saved',
      title: 'Tin đã lưu',
      sub: `${savedCount} đã đánh dấu`,
      icon: 'task',
      active: filters.saved === '1',
      onPress: () => updateFilters({ saved: filters.saved === '1' ? undefined : '1' }),
    },
  ]

  return (
    <Screen bg={t.card}>
      <Header title="Việc làm" subtitle={q.isLoading ? undefined : `${jobs.length} cơ hội nghề nghiệp từ cộng đồng`} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={q.isLoading ? [] : jobs}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 28 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            <View style={{ marginBottom: 10 }}>
              {/* Khu vực tìm kiếm & bộ lọc nhanh kiểu Meetup Explore */}
              <View
                style={{
                  backgroundColor: t.card,
                  paddingTop: 10,
                  paddingBottom: 14,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: t.border,
                }}
              >
                <SearchBar
                  value={kw}
                  onChangeText={setKw}
                  placeholder="Chức danh, công ty, kỹ năng..."
                  style={{ paddingHorizontal: 14 }}
                  right={<FilterButton count={countActive(filters)} onPress={() => setSheet(true)} />}
                />

                {/* Dải pill địa điểm gọn nhẹ thay cho ô SelectField thô */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, gap: 8, alignItems: 'center' }}
                >
                  <Pressable
                    onPress={() => updateFilters({ city: undefined })}
                    accessibilityRole="button"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      height: 34,
                      paddingHorizontal: 13,
                      borderRadius: 17,
                      backgroundColor: !city ? t.text : t.inputBg,
                    }}
                  >
                    <BrandIcon name="world" size={15} />
                    <Txt size={12.5} weight="600" color={!city ? t.card : t.text}>
                      Mọi địa điểm
                    </Txt>
                  </Pressable>

                  {QUICK_CITIES.map((c) => {
                    const active = city === c
                    return (
                      <Pressable
                        key={c}
                        onPress={() => updateFilters({ city: active ? undefined : c })}
                        accessibilityRole="button"
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          height: 34,
                          paddingHorizontal: 13,
                          borderRadius: 17,
                          backgroundColor: active ? t.text : t.inputBg,
                        }}
                      >
                        <BrandIcon name="pin" size={14} />
                        <Txt size={12.5} weight="600" color={active ? t.card : t.text}>
                          {c === 'TP. Hồ Chí Minh' ? 'TP.HCM' : c}
                        </Txt>
                      </Pressable>
                    )
                  })}

                  <Pressable
                    onPress={() => setSheet(true)}
                    accessibilityRole="button"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      height: 34,
                      paddingHorizontal: 12,
                      borderRadius: 17,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.card,
                    }}
                  >
                    <Txt size={12.5} weight="600" color={t.textMuted}>
                      {city && !QUICK_CITIES.includes(city) ? city : 'Tỉnh thành khác'}
                    </Txt>
                    <ChevronRight size={14} color={t.textMuted} />
                  </Pressable>
                </ScrollView>

                {/* Thẻ danh mục nổi bật phong cách Meetup "Browse by category" với icon nét cọ */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 12, gap: 10 }}
                >
                  {categoryCards.map((cat) => (
                    <Pressable
                      key={cat.key}
                      onPress={cat.onPress}
                      accessibilityRole="button"
                      style={({ pressed }) => ({
                        width: 142,
                        paddingHorizontal: 12,
                        paddingVertical: 11,
                        borderRadius: 14,
                        backgroundColor: cat.active ? t.primaryTint : t.surface,
                        borderWidth: 1,
                        borderColor: cat.active ? t.primary : t.border,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Txt size={11} weight="700" color={cat.active ? t.primary : t.textMuted} numberOfLines={1}>
                          {cat.sub}
                        </Txt>
                        <BrandIcon name={cat.icon} size={24} />
                      </View>
                      <Txt size={13.5} weight="700" color={t.text} numberOfLines={1}>
                        {cat.title}
                      </Txt>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty
                error={q.error}
                onRetry={() => {
                  void q.refetch()
                }}
                icon={<BrandIcon name="suitcase" size={56} />}
                title="Chưa có tin phù hợp"
                text="Thử đổi địa điểm hoặc từ khoá khác."
                action={countActive(filters) ? 'Xoá bộ lọc' : undefined}
                onAction={() => setFilters({})}
              />
            )
          }
          renderItem={({ item: p }) => {
            const j = p.job!
            const saved = savedMap[p.id] ?? p.saved
            const hasSalary = !!(j.salaryMin || j.salaryMax)
            const companyName = j.company || p.author || 'Doanh nghiệp đối tác'
            const openDetail = () => router.push({ pathname: '/post/[id]', params: { id: p.id } })

            return (
              <Pressable
                onPress={openDetail}
                accessibilityRole="button"
                accessibilityLabel={`Xem việc làm ${j.title}`}
                style={({ pressed }) => ({
                  marginHorizontal: 14,
                  marginBottom: 12,
                  borderRadius: 18,
                  backgroundColor: t.card,
                  borderWidth: 1,
                  borderColor: t.border,
                  padding: 15,
                  opacity: pressed ? 0.96 : 1,
                })}
              >
                {/* Hàng trên cùng: Nhãn trạng thái Meetup + Nút Lưu Instagram (bỏ ô chữ F lặp lại) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 9,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: t.primaryTint,
                      }}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.primary }} />
                      <Txt
                        size={11}
                        weight="800"
                        color={t.primary}
                        style={{ letterSpacing: 0.3, textTransform: 'uppercase' }}
                      >
                        {`Đang tuyển · ${p.time || 'Mới'}`}
                      </Txt>
                    </View>

                    {hasSalary ? (
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: t.successTint,
                        }}
                      >
                        <Txt size={11} weight="700" color={t.success}>
                          Công khai lương
                        </Txt>
                      </View>
                    ) : null}
                  </View>

                  <Pressable
                    onPress={() => void toggleSave(p)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={saved ? 'Bỏ lưu tin' : 'Lưu tin'}
                    style={({ pressed }) => ({
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: pressed ? t.inputBg : 'transparent',
                    })}
                  >
                    <IgBookmark size={20} color={saved ? t.primary : t.text} fill={saved ? t.primary : 'transparent'} />
                  </Pressable>
                </View>

                {/* Chức danh & Tên công ty trải rộng toàn bộ chiều ngang thẻ */}
                <Txt weight="800" size={17} numberOfLines={2} style={{ lineHeight: 23 }}>
                  {j.title}
                </Txt>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 }}>
                  <BrandIcon name="suitcase" size={18} />
                  <Txt size={13.5} weight="600" color={t.textMuted} numberOfLines={1} style={{ flex: 1 }}>
                    {companyName}
                  </Txt>
                </View>

                {/* Khối thông tin Lương & Địa điểm theo bố cục dòng Meetup (có icon nét cọ) */}
                <View
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: t.surface,
                    gap: 7,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <BrandIcon name="coin" size={19} />
                    <Txt
                      size={14}
                      weight="700"
                      color={hasSalary ? t.success : t.text}
                      numberOfLines={1}
                      style={{ flex: 1 }}
                    >
                      {formatSalary(j.salaryMin, j.salaryMax)}
                    </Txt>
                  </View>

                  {j.location ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <BrandIcon name="pin" size={19} />
                      <Txt size={13} color={t.textMuted} numberOfLines={1} style={{ flex: 1 }}>
                        {j.location}
                      </Txt>
                    </View>
                  ) : null}
                </View>

                {/* Chân thẻ kiểu Meetup "Hosted by" + CTA gọn sắc nét */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginTop: 12,
                    paddingTop: 11,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: t.divider,
                  }}
                >
                  <Pressable
                    onPress={() => p.authorId && router.push({ pathname: '/profile/[id]', params: { id: p.authorId } })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}
                  >
                    <Avatar uri={p.avatar} name={p.author} size={28} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt size={11} color={t.textMuted} numberOfLines={1}>
                        Đăng bởi
                      </Txt>
                      <Txt size={12.5} weight="700" color={t.text} numberOfLines={1}>
                        {p.author}
                      </Txt>
                    </View>
                  </Pressable>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Pressable
                      onPress={openDetail}
                      accessibilityRole="button"
                      style={({ pressed }) => ({
                        height: 36,
                        paddingHorizontal: 13,
                        borderRadius: 10,
                        backgroundColor: t.inputBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Txt size={13} weight="600" color={t.text}>
                        Chi tiết
                      </Txt>
                    </Pressable>

                    {j.applyUrl || j.contactEmail ? (
                      <Pressable
                        onPress={() => apply(j)}
                        accessibilityRole="button"
                        accessibilityLabel={`Ứng tuyển ${j.title}`}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          height: 36,
                          paddingHorizontal: 14,
                          borderRadius: 10,
                          backgroundColor: t.action,
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Txt size={13} weight="700" color={t.onAction}>
                          Ứng tuyển
                        </Txt>
                        <ChevronRight size={14} color={t.onAction} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            )
          }}
        />
      </View>
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} title="Lọc việc làm" fields={fields} values={filters} onApply={setFilters} />
    </Screen>
  )
}

