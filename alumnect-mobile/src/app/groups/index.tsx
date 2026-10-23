import React, { useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Lock, Plus, Users } from 'lucide-react-native'
import { Card, Chip, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { GROUP_CATEGORIES, categoryLabel, groupApi } from '@/api/groups'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

/** UC113: tìm kiếm nhóm + nhóm của tôi. */
export default function GroupsScreen() {
  const t = useTheme()
  const router = useRouter()
  const role = useAuthStore((s) => s.user?.role)
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [kw, setKw] = useState('')
  const [category, setCategory] = useState('')
  const keyword = useDebounced(kw, 400)

  const q = useInfiniteQuery({
    queryKey: ['groups', tab, keyword, category],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => (tab === 'mine' ? groupApi.mine(pageParam) : groupApi.list({ page: pageParam, keyword, category })),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <Screen>
      <Header title="Hội nhóm" />
      <View style={{ flexDirection: 'row', padding: 12, paddingBottom: 0 }}>
        <Chip label="Khám phá" active={tab === 'all'} onPress={() => setTab('all')} />
        <Chip label="Nhóm của tôi" active={tab === 'mine'} onPress={() => setTab('mine')} />
      </View>
      {tab === 'all' ? (
        <>
          <TextInput value={kw} onChangeText={setKw} placeholder="Tìm nhóm..." placeholderTextColor={t.textMuted} style={{ margin: 12, backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }} />
          <View style={{ height: 44 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
              <Chip label="Tất cả" active={!category} onPress={() => setCategory('')} />
              {GROUP_CATEGORIES.map((c) => <Chip key={c.value} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} />)}
            </ScrollView>
          </View>
        </>
      ) : null}
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text={tab === 'mine' ? 'Bạn chưa tham gia nhóm nào.' : 'Không tìm thấy nhóm phù hợp.'} />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }} onPress={() => router.push({ pathname: '/groups/[id]', params: { id: String(item.id) } })}>
              {item.coverImageUrl ? <Image source={{ uri: item.coverImageUrl }} style={{ height: 110 }} contentFit="cover" /> : <View style={{ height: 60, backgroundColor: t.primaryTint }} />}
              <View style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Txt weight="700" size={16} style={{ flex: 1 }} numberOfLines={1}>{item.name}</Txt>
                  {item.privacy === 'PRIVATE' ? <Lock size={14} color={t.textMuted} /> : null}
                </View>
                {item.shortDescription ? <Txt muted numberOfLines={2} style={{ marginTop: 2 }}>{item.shortDescription}</Txt> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Users size={14} color={t.textMuted} /><Txt muted size={12}>{item.memberCount}</Txt></View>
                  <Txt size={12} color={t.primary} weight="600">{categoryLabel(item.category)}</Txt>
                </View>
              </View>
            </Card>
          )}
        />
      )}
      {role === 'ALUMNI' ? (
        <Pressable onPress={() => router.push('/groups/create')} style={{ position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 }}>
          <Plus size={28} color="#fff" />
        </Pressable>
      ) : null}
    </Screen>
  )
}
