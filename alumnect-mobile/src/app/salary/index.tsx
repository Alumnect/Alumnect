import React, { useState } from 'react'
import { ScrollView, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Button, Card, Chip, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { formatVnd, salaryApi } from '@/api/salary'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

const SORTS: [string, string][] = [['latest', 'Mới nhất'], ['salaryDesc', 'Lương cao'], ['salaryAsc', 'Lương thấp']]

/** UC50–51: thống kê và feed lương ẩn danh, lọc theo ngành. */
export default function SalaryScreen() {
  const t = useTheme()
  const router = useRouter()
  const role = useAuthStore((s) => s.user?.role)
  const [industryId, setIndustryId] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState('latest')
  const [kw, setKw] = useState('')
  const search = useDebounced(kw, 400)

  const industries = useQuery({ queryKey: ['industries'], queryFn: salaryApi.industries })
  const stats = useQuery({ queryKey: ['salary-stats', industryId], queryFn: () => salaryApi.statistics({ industryId }) })
  const feed = useInfiniteQuery({
    queryKey: ['salary-feed', industryId, sortBy, search],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => salaryApi.feed(pageParam, { industryId, sortBy, search }),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = feed.data?.pages.flatMap((p) => p.items) ?? []
  const s = stats.data

  return (
    <Screen>
      <Header title="Khảo sát lương" />
      <FlashList
        data={items}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16 }}
        onEndReached={() => feed.hasNextPage && feed.fetchNextPage()}
        ListHeaderComponent={
          <View>
            {role === 'ALUMNI' ? (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <Button title="Đóng góp lương" onPress={() => router.push('/salary/contribute')} style={{ flex: 1 }} />
                <Button title="Của tôi" variant="outline" onPress={() => router.push('/salary/mine')} style={{ flex: 1 }} />
              </View>
            ) : null}
            <Card style={{ marginBottom: 12 }}>
              <Txt muted size={13}>Lương trung vị toàn thị trường</Txt>
              <Txt size={26} weight="800" color={t.primary}>{s?.overallMedian != null ? formatVnd(s.overallMedian) : '—'}</Txt>
              <Txt muted size={12}>{s?.totalContributions ?? 0} đóng góp · {s?.trackedPositions ?? 0} vị trí</Txt>
            </Card>
            {(s?.rows ?? []).slice(0, 8).map((r, i) => (
              <Card key={i} style={{ marginBottom: 8 }}>
                <Txt weight="700">{r.role} {r.level ? `· ${r.level}` : ''}</Txt>
                <Txt muted size={12}>{r.region}</Txt>
                <Txt size={13}>Trung vị {formatVnd(r.median)} · P25 {formatVnd(r.p25)} · P75 {formatVnd(r.p75)}</Txt>
              </Card>
            ))}
            <Txt weight="700" size={16} style={{ marginTop: 12, marginBottom: 8 }}>Đóng góp gần đây</Txt>
            <TextInput value={kw} onChangeText={setKw} placeholder="Tìm chức danh, công ty..." placeholderTextColor={t.textMuted} style={{ backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <Chip label="Mọi ngành" active={industryId == null} onPress={() => setIndustryId(null)} />
              {(industries.data ?? []).map((i) => <Chip key={i.id} label={i.name} active={industryId === i.id} onPress={() => setIndustryId(i.id)} />)}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {SORTS.map(([k, l]) => <Chip key={k} label={l} active={sortBy === k} onPress={() => setSortBy(k)} />)}
            </ScrollView>
            {feed.isLoading ? <Loading /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10 }}>
            <Txt weight="700">{item.jobTitle}</Txt>
            <Txt muted size={13}>{[item.company, item.region, item.industry].filter(Boolean).join(' · ')}</Txt>
            <Txt weight="800" color={t.primary} style={{ marginTop: 4 }}>{formatVnd(item.grossAmount)}</Txt>
            {item.yearsExperience != null ? <Txt muted size={12}>{item.yearsExperience} năm kinh nghiệm</Txt> : null}
          </Card>
        )}
      />
    </Screen>
  )
}
