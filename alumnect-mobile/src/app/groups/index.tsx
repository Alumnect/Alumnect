import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Globe, Lock, Plus, Users } from '@/components/icons'
import { Button, Card, Chip, ChipRow, Empty, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ListSkeleton } from '@/components/Skeleton'
import { GROUP_CATEGORIES, categoryLabel, groupApi } from '@/api/groups'
import type { GroupCard } from '@/api/groups'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { BrandCover } from '@/components/DetailBits'
import { BrandIcon } from '@/components/BrandIcon'
import { CommunityIntro, SoftTabs } from '@/components/SocialUI'

type Tab = 'all' | 'mine'

const GroupItem = React.memo(function GroupItem({ g }: { g: GroupCard }) {
  const t = useTheme()
  const router = useRouter()
  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 18, padding: 0, borderRadius: 22, overflow: 'hidden' }} onPress={() => router.push({ pathname: '/groups/[id]', params: { id: String(g.id) } })}>
      {g.coverImageUrl ? (
        <Image source={{ uri: g.coverImageUrl }} style={{ aspectRatio: 2.25, backgroundColor: t.inputBg }} contentFit="cover" transition={180} />
      ) : (
        <BrandCover height={96} />
      )}
      <View style={{ padding: 16, gap: 8 }}>
        <Txt weight="600" size={17} numberOfLines={2}>{g.name}</Txt>
        {g.shortDescription ? <Txt muted size={13} numberOfLines={2} style={{ lineHeight: 20 }}>{g.shortDescription}</Txt> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <Tag label={categoryLabel(g.category)} tone="primary" />
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
    enabled: role === 'ALUMNI',
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  if (role !== 'ALUMNI') {
    return (
      <Screen bg={t.card}>
        <Header title="Hội nhóm" />
        <Empty text="Chức năng Hội nhóm chỉ dành cho Cựu sinh viên (Alumni)." />
      </Screen>
    )
  }

  return (
    <Screen bg={t.card}>
      <Header
        title="Hội nhóm"
        right={role === 'ALUMNI' ? <Button title="Tạo nhóm" variant="brand" size="sm" icon={<Plus size={16} color="#fff" />} onPress={() => router.push('/groups/create')} /> : undefined}
      />
      <SoftTabs<Tab> tabs={[['all', 'Khám phá'], ['mine', 'Nhóm của tôi']]} value={tab} onChange={setTab} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={q.isLoading ? [] : items}
          maintainVisibleContentPosition={{ disabled: true }}
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
                  <ChipRow style={{ marginTop: 4 }}><Chip label="Tất cả" active={!category} onPress={() => setCategory('')} />{GROUP_CATEGORIES.map((c) => <Chip key={c.value} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} />)}</ChipRow>
                </View>
              ) : <View style={{ height: 10 }} />}
              {tab === 'all' && !keyword && !category ? <View style={{ paddingHorizontal: 16 }}><CommunityIntro icon="people" eyebrow="TÌM THẤY CỘNG ĐỒNG CỦA BẠN" title="Cùng sở thích. Cùng kết nối." description="Gặp gỡ những người đồng điệu và chia sẻ điều bạn yêu thích." /></View> : null}
              {!q.isLoading && items.length ? <View style={{ paddingHorizontal: 18, marginBottom: 12 }}><Txt size={16} weight="600">{tab === 'mine' ? 'Nơi bạn thuộc về' : keyword || category ? 'Kết quả khám phá' : 'Khám phá các hội nhóm'}</Txt></View> : null}
              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty error={q.error} onRetry={() => { void q.refetch() }}
                icon={<BrandIcon name="people" size={56} />}
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
