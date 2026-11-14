import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Globe, Lock, Plus, Users } from '@/components/icons'
import { Button, Card, Chip, ChipRow, Empty, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { withGroupsAlumniOnly } from '@/components/GroupsAlumniOnly'
import { ListSkeleton } from '@/components/Skeleton'
import { GROUP_CATEGORIES, categoryLabel, groupApi, isManager } from '@/api/groups'
import type { GroupCard } from '@/api/groups'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { BrandCover } from '@/components/DetailBits'
import { BrandIcon } from '@/components/BrandIcon'
import { CommunityIntro, SoftTabs } from '@/components/SocialUI'
import { toast, errMsg } from '@/lib/toast'

type Tab = 'all' | 'mine'

/** Nút tham gia nhanh trên thẻ, theo trạng thái người xem (giống GroupMembershipActions của web). */
function CardAction({ g }: { g: GroupCard }) {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const join = useMutation({
    mutationFn: () => groupApi.join(g.id),
    onSuccess: (r) => {
      toast.success(r.message || (r.viewerMembershipStatus === 'PENDING' ? 'Đã gửi yêu cầu tham gia nhóm!' : 'Đã tham gia nhóm!'))
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['group', String(g.id)] })
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  if (g.viewerMembershipStatus === 'ACTIVE') {
    return isManager(g.viewerRole)
      ? <Button title="Quản lý" size="sm" variant="outline" onPress={() => router.push({ pathname: '/groups/[id]', params: { id: String(g.id) } })} />
      : <Tag label="Đã tham gia" tone="success" icon={<Check size={11} color={t.success} />} />
  }
  if (g.viewerMembershipStatus === 'PENDING') return <Tag label="Chờ duyệt" tone="warning" />
  if (g.status !== 'ACTIVE') return null
  return (
    <Button
      title={g.privacy === 'PRIVATE' ? 'Gửi yêu cầu' : 'Tham gia'}
      size="sm"
      variant="brand"
      loading={join.isPending}
      onPress={() => join.mutate()}
    />
  )
}

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Tag label={categoryLabel(g.category)} tone="primary" />
          <Tag
            label={g.privacy === 'PRIVATE' ? 'Riêng tư' : 'Công khai'}
            tone="neutral"
            icon={g.privacy === 'PRIVATE' ? <Lock size={11} color={t.textMuted} /> : <Globe size={11} color={t.textMuted} />}
          />
          {g.status === 'INACTIVE' ? <Tag label="Tạm ngừng" tone="warning" /> : null}
        </View>
        <Txt weight="600" size={17} numberOfLines={2}>{g.name}</Txt>
        {g.shortDescription ? <Txt muted size={13} numberOfLines={2} style={{ lineHeight: 20 }}>{g.shortDescription}</Txt> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.divider }}>
          <Users size={14} color={t.textMuted} />
          <Txt muted size={12} style={{ flex: 1 }}>{`${g.memberCount} thành viên`}</Txt>
          <CardAction g={g} />
        </View>
      </View>
    </Card>
  )
})

/** UC113: khám phá nhóm theo chủ đề + nhóm của tôi (chỉ Cựu sinh viên — backend chặn vai trò khác). */
function GroupsScreen() {
  const t = useTheme()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('all')
  const [kw, setKw] = useState('')
  const [category, setCategory] = useState('')
  const keyword = useDebounced(kw, 400)
  const filtering = !!(keyword.trim() || category)

  const q = useInfiniteQuery({
    queryKey: ['groups', tab, tab === 'mine' ? '' : keyword, tab === 'mine' ? '' : category],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => (tab === 'mine' ? groupApi.mine(pageParam) : groupApi.list({ page: pageParam, keyword, category })),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <Screen bg={t.card}>
      <Header
        title="Hội nhóm"
        right={<Button title="Tạo nhóm" variant="brand" size="sm" icon={<Plus size={16} color="#fff" />} onPress={() => router.push('/groups/create')} />}
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
              {tab === 'all' && !filtering ? <View style={{ paddingHorizontal: 16 }}><CommunityIntro icon="people" eyebrow="TÌM THẤY CỘNG ĐỒNG CỦA BẠN" title="Cùng sở thích. Cùng kết nối." description="Gặp gỡ những người đồng điệu và chia sẻ điều bạn yêu thích." /></View> : null}
              {!q.isLoading && items.length ? <View style={{ paddingHorizontal: 18, marginBottom: 12 }}><Txt size={16} weight="600">{tab === 'mine' ? 'Nơi bạn thuộc về' : filtering ? 'Kết quả khám phá' : 'Khám phá các hội nhóm'}</Txt></View> : null}
              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListFooterComponent={q.isFetchingNextPage ? <ListSkeleton variant="post" count={1} /> : null}
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty error={q.error} onRetry={() => { void q.refetch() }}
                icon={<BrandIcon name="people" size={56} />}
                title={tab === 'mine' ? 'Bạn chưa tham gia nhóm nào' : 'Chưa tìm thấy hội nhóm nào'}
                text={tab === 'mine' ? 'Khám phá các nhóm cùng sở thích, ngành nghề.' : 'Thử tìm kiếm với từ khóa khác hoặc tạo nhóm mới để bắt đầu giao lưu.'}
                action={tab === 'mine' ? 'Khám phá nhóm' : filtering ? 'Xóa bộ lọc' : undefined}
                onAction={() => { if (tab === 'mine') setTab('all'); else { setKw(''); setCategory('') } }}
              />
            )
          }
          renderItem={({ item }) => <GroupItem g={item} />}
        />
      </View>
    </Screen>
  )
}

export default withGroupsAlumniOnly(GroupsScreen)
