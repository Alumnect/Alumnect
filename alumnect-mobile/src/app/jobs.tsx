import React, { useMemo, useState } from 'react'
import { Linking, Pressable, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Bookmark, Building2, MapPin, Search, Coins } from 'lucide-react-native'
import { Avatar, Button, Card, Empty, Screen, Txt } from '@/components/ui'
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

/** Tách tên tỉnh/thành từ địa chỉ (bám theo JobsPage trên Web) để lọc nhanh. */
const CITIES: [string, string[]][] = [
  ['Hồ Chí Minh', ['hồ chí minh', 'hcm', 'sài gòn', 'saigon']],
  ['Hà Nội', ['hà nội', 'ha noi']],
  ['Đà Nẵng', ['đà nẵng', 'da nang']],
  ['Cần Thơ', ['cần thơ', 'can tho']],
  ['Hải Phòng', ['hải phòng', 'hai phong']],
  ['Bình Dương', ['bình dương', 'binh duong']],
]

/** Việc làm: bài viết loại "recruitment" trong Feed (giống trang /app/jobs trên Web). */
export default function JobsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [kw, setKw] = useState('')
  const [city, setCity] = useState<string | null>(null)
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({})
  const keyword = useDebounced(kw, 300).trim().toLowerCase()

  const q = useInfiniteQuery({
    queryKey: ['jobs'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getFeed({ page: pageParam, filter: 'recruitment' }),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const posts = useMemo(() => (q.data?.pages.flatMap((p) => p.items) ?? []).filter((p) => p.job), [q.data])

  const jobs = posts.filter((p) => {
    const j = p.job!
    const loc = (j.location ?? '').toLowerCase()
    const okKw = !keyword || [j.title, j.company, p.author, p.text].some((s) => s?.toLowerCase().includes(keyword))
    const okCity = !city || CITIES.find(([n]) => n === city)![1].some((a) => loc.includes(a))
    return okKw && okCity
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

  return (
    <Screen>
      <Header title="Tuyển dụng việc làm" />
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 12 }}>
          <Search size={18} color={t.textMuted} />
          <TextInput value={kw} onChangeText={setKw} placeholder="Chức danh, công ty hoặc từ khóa..." placeholderTextColor={t.textMuted} style={{ flex: 1, color: t.text, paddingVertical: 10, paddingHorizontal: 8 }} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {[null, ...CITIES.map(([n]) => n)].map((c) => (
            <Pressable key={c ?? 'all'} onPress={() => setCity(c)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: city === c ? t.primary : t.inputBg }}>
              <Txt size={12} weight="600" color={city === c ? '#fff' : t.text}>{c ?? 'Mọi địa điểm'}</Txt>
            </Pressable>
          ))}
        </View>
      </View>
      {q.isLoading ? (
        <ListSkeleton variant="post" />
      ) : (
        <FlashList
          data={jobs}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text="Không có tin tuyển dụng phù hợp." />}
          renderItem={({ item: p }) => {
            const j = p.job!
            const saved = savedMap[p.id] ?? p.saved
            return (
              <Card style={{ marginBottom: 12 }} onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Avatar uri={p.avatar} name={p.author} size={42} />
                  <View style={{ flex: 1 }}>
                    <Txt weight="700" size={16} numberOfLines={2}>{j.title}</Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Building2 size={14} color={t.textMuted} /><Txt muted size={13} numberOfLines={1}>{j.company || p.author}</Txt>
                    </View>
                  </View>
                  <Pressable onPress={() => void toggleSave(p)} hitSlop={8}>
                    <Bookmark size={20} color={saved ? t.primary : t.textMuted} fill={saved ? t.primary : 'transparent'} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
                  {j.location ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><MapPin size={14} color={t.textMuted} /><Txt muted size={13}>{j.location}</Txt></View> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Coins size={14} color={t.textMuted} /><Txt muted size={13}>{formatSalary(j.salaryMin, j.salaryMax)}</Txt></View>
                </View>
                {j.applyUrl || j.contactEmail ? <Button title="Ứng tuyển" onPress={() => apply(j)} style={{ marginTop: 12 }} /> : null}
              </Card>
            )
          }}
        />
      )}
    </Screen>
  )
}
