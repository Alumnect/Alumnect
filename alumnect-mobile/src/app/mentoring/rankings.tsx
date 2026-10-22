import React, { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Avatar, Card, Chip, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { mentoringApi } from '@/api/mentoring'
import { useTheme } from '@/theme'

/** UC87: bảng xếp hạng mentor theo lĩnh vực. */
export default function RankingsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [fieldId, setFieldId] = useState<number | null>(null)
  const industries = useQuery({ queryKey: ['mentoring-industries'], queryFn: mentoringApi.industries })
  useEffect(() => {
    if (fieldId == null && industries.data?.length) setFieldId(industries.data[0].id)
  }, [industries.data, fieldId])

  const q = useInfiniteQuery({
    queryKey: ['mentoring-ranking', fieldId],
    enabled: fieldId != null,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => mentoringApi.ranking(fieldId!, pageParam),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  return (
    <Screen>
      <Header title="Bảng xếp hạng mentor" />
      <View style={{ height: 52 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
          {(industries.data ?? []).map((i) => <Chip key={i.id} label={i.name} active={fieldId === i.id} onPress={() => setFieldId(i.id)} />)}
        </ScrollView>
      </View>
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(m) => String(m.mentorId)}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          ListEmptyComponent={<Empty text="Chưa có dữ liệu xếp hạng." />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(item.mentorId) } })}>
              <Txt size={20} weight="800" color={item.rank <= 3 ? t.primary : t.textMuted} style={{ width: 28, textAlign: 'center' }}>{item.rank}</Txt>
              <Avatar uri={item.avatarUrl} name={item.fullName} size={46} />
              <View style={{ flex: 1 }}>
                <Txt weight="700" numberOfLines={1}>{item.fullName}</Txt>
                <Txt muted size={12} numberOfLines={1}>{item.currentCompany ?? item.headline ?? ''}</Txt>
                <Txt size={12}>★ {item.rating?.toFixed?.(1)} · {item.completedTasks} task</Txt>
              </View>
              <Txt weight="800" color={t.primary}>{Math.round(item.reputationScore)}</Txt>
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
