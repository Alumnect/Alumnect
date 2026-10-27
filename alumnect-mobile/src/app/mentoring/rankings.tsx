import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Avatar, Card, Chip, Empty, Screen, Txt } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { Star, Trophy } from '@/components/icons'
import { Header } from '@/components/Header'
import { mentoringApi } from '@/api/mentoring'
import { useTheme, palette } from '@/theme'

/** UC87: bảng xếp hạng mentor theo lĩnh vực. */
export default function RankingsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [pickedField, setFieldId] = useState<number | null>(null)
  const industries = useQuery({ queryKey: ['mentoring-industries'], queryFn: mentoringApi.industries })
  const fieldId = pickedField ?? industries.data?.[0]?.id ?? null

  const q = useInfiniteQuery({
    queryKey: ['mentoring-ranking', fieldId],
    enabled: fieldId != null,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => mentoringApi.ranking(fieldId!, pageParam),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const medal = (r: number) => (r === 1 ? '#F5B301' : r === 2 ? '#A0AEC0' : r === 3 ? '#CD7F32' : null)
  return (
    <Screen bg={t.card}>
      <Header title="Bảng xếp hạng mentor" subtitle="Theo điểm uy tín trong từng lĩnh vực" />
      <View style={{ backgroundColor: t.card }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          {(industries.data ?? []).map((i) => <Chip key={i.id} label={i.name} active={fieldId === i.id} onPress={() => setFieldId(i.id)} />)}
        </ScrollView>
      </View>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {q.isLoading ? <ListSkeleton variant="row" /> : (
          <FlashList
            data={items}
            keyExtractor={(m) => String(m.mentorId)}
            contentContainerStyle={{ paddingVertical: 12 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            ListEmptyComponent={<Empty error={q.error} onRetry={() => { void q.refetch() }} icon={<Trophy size={28} color={t.primary} />} title="Chưa có xếp hạng" text="Lĩnh vực này chưa có mentor nào được xếp hạng." />}
            renderItem={({ item }) => {
              const m = medal(item.rank)
              return (
                <Card style={{ marginHorizontal: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(item.mentorId) } })}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: m ? `${m}26` : t.inputBg }}>
                    {m ? <Trophy size={16} color={m} /> : <Txt weight="800" muted>{item.rank}</Txt>}
                  </View>
                  <Avatar uri={item.avatarUrl} name={item.fullName} size={48} />
                  <View style={{ flex: 1 }}>
                    <Txt weight="700" numberOfLines={1}>{item.fullName}</Txt>
                    <Txt muted size={12} numberOfLines={1}>{item.currentCompany ?? item.headline ?? ''}</Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Star size={12} color={palette.star} fill={palette.star} />
                      <Txt size={12} weight="600">{item.rating?.toFixed?.(1)}</Txt>
                      <Txt muted size={12}>{`· ${item.completedTasks} task`}</Txt>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt weight="800" size={18} color={t.primary}>{Math.round(item.reputationScore)}</Txt>
                    <Txt muted size={11}>điểm</Txt>
                  </View>
                </Card>
              )
            }}
          />
        )}
      </View>
    </Screen>
  )
}
