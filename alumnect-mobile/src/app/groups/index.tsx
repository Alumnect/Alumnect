import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Globe, Lock, Plus, Users } from '@/components/icons'
import { Button, Card, Empty, Screen, SearchBar, Segmented, Tag, Txt } from '@/components/ui'
import { SelectField } from '@/components/SelectField'
import { Header } from '@/components/Header'
import { ListSkeleton } from '@/components/Skeleton'
import { GROUP_CATEGORIES, categoryLabel, groupApi } from '@/api/groups'
import type { GroupCard } from '@/api/groups'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { BrandCover } from '@/components/DetailBits'

type Tab = 'all' | 'mine'

const GroupItem = React.memo(function GroupItem({ g }: { g: GroupCard }) {
  const t = useTheme()
  const router = useRouter()
  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 16, padding: 0, overflow: 'hidden' }} onPress={() => router.push({ pathname: '/groups/[id]', params: { id: String(g.id) } })}>
      {g.coverImageUrl ? (
        <Image source={{ uri: g.coverImageUrl }} style={{ height: 120, backgroundColor: t.inputBg }} contentFit="cover" />
      ) : (
        <BrandCover height={96} />
      )}
      <View style={{ padding: 14, gap: 4 }}>
        <Txt weight="800" size={16} numberOfLines={1}>{g.name}</Txt>
        {g.shortDescription ? <Txt muted numberOfLines={2} style={{ lineHeight: 20 }}>{g.shortDescription}</Txt> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <Tag label={categoryLabel(g.category)} />
          <Tag
            label={g.privacy === 'PRIVATE' ? 'Riêng tư' : 'Công khai'}
            tone="neutral"
            icon={g.privacy === 'PRIVATE' ? <Lock size={11} color={t.textMuted} /> : <Globe size={11} color={t.textMuted} />}
          />
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Users size={14} color={t.textMuted} />
            <Txt muted size={12}>{`${g.memberCount} thành viên`}</Txt>
          </View>
        </View>
      </View>
    </Card>
  )
})

/** UC113: khám phá nhóm theo chủ đề + nhóm của tôi. */
export default function GroupsScreen() {
  const t = useTheme()
  const router = useRouter()
  const role = useAuthStore((s) => s.user?.role)
  const [tab, setTab] = useState<Tab>('all')
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
    <Screen bg={t.card}>
      <Header
        title="Hội nhóm"
        right={role === 'ALUMNI' ? <Button title="Tạo nhóm" size="sm" icon={<Plus size={16} color="#fff" />} onPress={() => router.push('/groups/create')} /> : undefined}
      />
      <Segmented<Tab> tabs={[['all', 'Khám phá'], ['mine', 'Nhóm của tôi']]} value={tab} onChange={setTab} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={q.isLoading ? [] : items}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            <View>
              {tab === 'all' ? (
                <View style={{ backgroundColor: t.card, paddingTop: 12, marginBottom: 16 }}>
                  <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm nhóm theo tên, chủ đề..." style={{ paddingHorizontal: 16 }} />
                  <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                    <SelectField label="Chủ đề nhóm" placeholder="Tất cả chủ đề" value={category} options={[...GROUP_CATEGORIES]} onChange={(value) => setCategory(value ?? '')} />
                  </View>
                </View>
              ) : <View style={{ height: 10 }} />}
              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty error={q.error} onRetry={() => { void q.refetch() }}
                icon={<Users size={28} color={t.primary} />}
                title={tab === 'mine' ? 'Bạn chưa tham gia nhóm nào' : 'Không tìm thấy nhóm'}
                text={tab === 'mine' ? 'Khám phá các nhóm cùng sở thích, ngành nghề.' : 'Thử đổi chủ đề hoặc từ khoá khác.'}
                action={tab === 'mine' ? 'Khám phá nhóm' : undefined}
                onAction={() => setTab('all')}
              />
            )
          }
          renderItem={({ item }) => <GroupItem g={item} />}
        />
      </View>
    </Screen>
  )
}
