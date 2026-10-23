import React, { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react-native'
import { Avatar, Button, Card, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { exploreApi } from '@/api/explore'
import type { CareerSummary } from '@/api/explore'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

const year = (d?: string | null) => (d ? d.slice(0, 4) : '')

function Timeline({ items }: { items: { key: string | number; title: string; company: string; start: string; end?: string | null; current: boolean }[] }) {
  const t = useTheme()
  return (
    <View style={{ marginLeft: 6 }}>
      {items.map((e, i) => (
        <View key={e.key} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: e.current ? t.primary : t.border, marginTop: 4 }} />
            {i < items.length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: t.border }} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: 14 }}>
            <Txt weight="700">{e.title}</Txt>
            <Txt muted size={13}>{e.company}</Txt>
            <Txt muted size={12}>{year(e.start)} — {e.current ? 'Hiện tại' : year(e.end)}</Txt>
          </View>
        </View>
      ))}
    </View>
  )
}

/** UC55–56: Career Path dạng cây tiến trình dọc; chạm vào người để xem toàn bộ lộ trình. */
export default function CareerScreen() {
  const t = useTheme()
  const router = useRouter()
  const [kw, setKw] = useState('')
  const [sel, setSel] = useState<CareerSummary | null>(null)
  const search = useDebounced(kw, 400)
  const q = useInfiniteQuery({
    queryKey: ['career-paths', search],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => exploreApi.careerPaths({ search: search || undefined, page: pageParam }),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const detail = useQuery({ queryKey: ['career-detail', sel?.userId], queryFn: () => exploreApi.careerDetail(sel!.userId), enabled: !!sel })

  return (
    <Screen>
      <Header title="Career Path" />
      <View style={{ margin: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 12 }}>
        <Search size={18} color={t.textMuted} />
        <TextInput value={kw} onChangeText={setKw} placeholder="Tìm theo tên, công ty, chức danh..." placeholderTextColor={t.textMuted} style={{ flex: 1, color: t.text, paddingVertical: 10, paddingHorizontal: 8 }} />
      </View>
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(c) => String(c.userId)}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          ListEmptyComponent={<Empty text="Không tìm thấy lộ trình phù hợp." />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 12 }} onPress={() => setSel(item)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Avatar uri={item.avatarUrl} name={item.fullName} size={44} />
                <View style={{ flex: 1 }}>
                  <Txt weight="700">{item.fullName}</Txt>
                  <Txt muted size={12} numberOfLines={1}>{[item.major, item.cohort ? `K${item.cohort}` : null].filter(Boolean).join(' · ')}</Txt>
                </View>
              </View>
              <Timeline items={item.careerPreview.map((e) => ({ key: e.experienceId, title: e.title, company: e.company, start: e.startDate, end: e.endDate, current: e.isCurrent }))} />
              {item.totalExperiences > item.careerPreview.length ? <Txt size={12} color={t.primary} weight="600">+{item.totalExperiences - item.careerPreview.length} vị trí khác</Txt> : null}
            </Card>
          )}
        />
      )}
      <ActionSheet visible={!!sel} onClose={() => setSel(null)} title={sel?.fullName}>
        {detail.isLoading ? <Loading /> : detail.data ? (
          <View style={{ gap: 12, maxHeight: 460 }}>
            <Timeline items={detail.data.experiences.map((e) => ({ key: e.id, title: e.title, company: e.company, start: e.startDate, end: e.endDate, current: e.isCurrent }))} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Xem hồ sơ" style={{ flex: 1 }} onPress={() => { const id = sel!.userId; setSel(null); router.push({ pathname: '/profile/[id]', params: { id: String(id) } }) }} />
              <Button title="Nhắn tin" variant="outline" style={{ flex: 1 }} onPress={() => { const id = sel!.userId; setSel(null); router.push({ pathname: '/chat/direct/[userId]', params: { userId: String(id) } }) }} />
            </View>
          </View>
        ) : null}
      </ActionSheet>
      <Pressable style={{ display: 'none' }} />
    </Screen>
  )
}
