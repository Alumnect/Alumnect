import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CalendarDays, Check, ChevronRight, Crown, Globe, ImagePlus, Info, Lock, MessageCircle, MessageSquare, MoreHorizontal, Share2, UserPlus, Users } from '@/components/icons'
import { Avatar, Button, Card, Chip, ChipRow, Empty, IconButton, Loading, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { Header } from '@/components/Header'
import { withGroupsAlumniOnly } from '@/components/GroupsAlumniOnly'
import { ActionSheet } from '@/components/ActionSheet'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { useDebounced } from '@/lib/hooks'
import { ShareSheet } from '@/components/ShareSheet'
import { groupPath } from '@/lib/share'
import { GroupPostCard } from '@/components/GroupPostCard'
import { categoryLabel, groupApi, isManager } from '@/api/groups'
import { useTheme } from '@/theme'
import { BrandCover } from '@/components/DetailBits'
import { SoftTabs } from '@/components/SocialUI'
import { toast, errMsg } from '@/lib/toast'

type Tab = 'discussions' | 'about' | 'manage'

/** Ba quy chuẩn ứng xử mẫu hiển thị ở tab Giới thiệu (giống web). */
const SAMPLE_RULES: [string, string][] = [
  ['Tôn trọng & Lắng nghe', 'Luôn giữ tinh thần hòa nhã, lịch sự trong giao tiếp và tranh luận mang tính xây dựng.'],
  ['Không quảng cáo rác & Spam', 'Mọi bài viết thương mại hoặc tuyển dụng cần được sự đồng ý của ban quản trị nhóm.'],
  ['Bảo mật thông tin nội bộ', 'Không mang nội dung thảo luận riêng tư của các thành viên ra các kênh công cộng khi chưa được phép.'],
]

/** Một dòng cài đặt trong tab Quản lý: tiêu đề, mô tả và nút thao tác. */
function SettingRow({ title, desc, action, danger, onPress, disabled, badge }: { title: string; desc: string; action: string; danger?: boolean; onPress: () => void; disabled?: boolean; badge?: number }) {
  const t = useTheme()
  return (
    <View style={{ padding: 14, borderRadius: 16, borderWidth: 1, borderColor: danger ? t.danger : t.border, backgroundColor: danger ? t.dangerTint : t.card, marginBottom: 12, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Txt weight="700" color={danger ? t.danger : t.text} style={{ flex: 1 }}>{title}</Txt>
        {badge ? <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}><Txt size={12} weight="700" color="#fff">{badge}</Txt></View> : null}
      </View>
      <Txt muted size={13}>{desc}</Txt>
      <Button title={action} size="sm" variant={danger ? 'danger' : 'outline'} disabled={disabled} onPress={onPress} style={{ alignSelf: 'flex-start' }} />
    </View>
  )
}

/** UC114–125: chi tiết nhóm gồm tab Thảo luận / Giới thiệu / Quản lý (Owner/Admin), thao tác tham gia và quản lý. */
function GroupDetailScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const gid = Number(id)
  const me = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('discussions')
  const [topic, setTopic] = useState<string>('')
  const [menu, setMenu] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [confirm, setConfirm] = useState<'leave' | 'delete' | 'pause' | 'cancel' | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [newOwner, setNewOwner] = useState<number | null>(null)
  const [memberKw, setMemberKw] = useState('')
  const memberKeyword = useDebounced(memberKw, 400)

  const group = useQuery({ queryKey: ['group', id], queryFn: () => groupApi.get(id!) })
  const g = group.data
  const isMember = g?.viewerMembershipStatus === 'ACTIVE'
  const canSee = !!g && (isMember || g.privacy === 'PUBLIC')
  // Chủ đề đang lọc chỉ hợp lệ khi còn thuộc danh sách chủ đề của nhóm.
  const activeTopic = g?.topics.includes(topic) ? topic : ''
  const posts = useInfiniteQuery({
    queryKey: ['group-posts', gid, activeTopic],
    enabled: canSee,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => groupApi.posts(gid, pageParam, activeTopic || undefined),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  // Gộp các trang, loại bài trùng do phân trang offset khi có bài mới (giống web).
  const items = (() => {
    const seen = new Set<number>()
    return (posts.data?.pages ?? []).flatMap((p) => p.items).filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
  })()
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['group', id] })
    qc.invalidateQueries({ queryKey: ['groups'] })
    qc.invalidateQueries({ queryKey: ['group-posts', gid] })
  }

  const join = useMutation({
    mutationFn: () => groupApi.join(gid),
    onSuccess: (r) => { toast.success(r.message || (r.viewerMembershipStatus === 'PENDING' ? 'Đã gửi yêu cầu tham gia nhóm!' : 'Đã tham gia nhóm!')); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const cancel = useMutation({
    mutationFn: () => groupApi.leave(gid),
    onSuccess: (r) => { toast.success(r?.message || 'Đã hủy yêu cầu tham gia.'); setConfirm(null); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const leave = useMutation({
    mutationFn: (newOwnerId?: number) => groupApi.leave(gid, newOwnerId),
    onSuccess: (r) => {
      toast.success(r?.message || 'Bạn đã rời nhóm.')
      setConfirm(null)
      setTransferOpen(false)
      refresh()
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const del = useMutation({
    mutationFn: () => groupApi.remove(gid),
    onSuccess: () => { toast.success('Đã xóa hội nhóm.'); setConfirm(null); refresh(); router.back() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const status = useMutation({
    mutationFn: (next: 'ACTIVE' | 'INACTIVE') => groupApi.setStatus(gid, next),
    onSuccess: (_r, next) => { toast.success(next === 'ACTIVE' ? 'Đã mở lại hội nhóm.' : 'Đã tạm ngừng hội nhóm.'); setConfirm(null); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  // Giống Web: đã ở trong chat → mở; có chat nhưng chưa vào → tham gia; chưa có chat → chủ nhóm tạo.
  const chat = useMutation({
    mutationFn: async (mode: 'open' | 'join' | 'create') => {
      if (mode === 'open') return { conversationId: group.data!.conversationId! }
      return mode === 'join' ? groupApi.joinChat(gid) : groupApi.createChat(gid)
    },
    onSuccess: (r, mode) => {
      if (mode !== 'open') {
        toast.success(mode === 'create' ? 'Đã tạo nhóm chat cho hội nhóm.' : 'Đã tham gia nhóm chat.')
        refresh()
        qc.invalidateQueries({ queryKey: ['conversations'] })
      }
      router.push({ pathname: '/chat/[id]', params: { id: String(r.conversationId) } })
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  // Chủ nhóm rời nhóm khi còn thành viên khác → bắt buộc chuyển quyền sở hữu (giống TransferOwnershipModal của Web).
  const candidates = useQuery({
    queryKey: ['group-members', gid, 'transfer', memberKeyword],
    queryFn: () => groupApi.members(gid, 0, memberKeyword.trim()),
    enabled: transferOpen,
  })
  const transferList = (candidates.data?.items ?? []).filter((m) => String(m.userId) !== me?.id)

  if (group.isLoading) return <Screen><Header title="Hội nhóm" /><Loading /></Screen>
  if (!g) {
    const notFound = (group.error as { status?: number } | null)?.status === 404
    return (
      <Screen>
        <Header title="Hội nhóm" />
        <Empty
          title={notFound ? 'Không tìm thấy hội nhóm' : undefined}
          text={notFound ? 'Hội nhóm này không tồn tại hoặc đã bị xóa.' : 'Không tải được hội nhóm.'}
          error={notFound ? undefined : group.error}
          onRetry={() => { void group.refetch() }}
          action="Về danh sách hội nhóm"
          onAction={() => router.replace('/groups')}
        />
      </Screen>
    )
  }
  const manager = isManager(g.viewerRole)
  const owner = g.viewerRole === 'OWNER'
  const pending = g.viewerMembershipStatus === 'PENDING'
  const inactive = g.status === 'INACTIVE'
  const created = g.createdAt ? new Date(g.createdAt).toLocaleDateString('vi-VN') : ''

  const startLeave = () => {
    if (owner && g.memberCount > 1) {
      setNewOwner(null)
      setMemberKw('')
      setTransferOpen(true)
    } else setConfirm('leave')
  }
  const actions = [
    { label: 'Chia sẻ nhóm', onPress: () => setShareOpen(true) },
    ...(g.canViewMembers || isMember ? [{ label: 'Xem thành viên', onPress: () => router.push({ pathname: '/groups/[id]/members', params: { id } }) }] : []),
    ...(manager ? [{ label: 'Quản lý hội nhóm', onPress: () => setTab('manage') }] : []),
    ...(isMember ? [{ label: 'Rời nhóm', danger: true, onPress: startLeave }] : []),
  ]
  const tabs: [Tab, string][] = [['discussions', 'Thảo luận'], ['about', 'Giới thiệu'], ...(manager ? [['manage', g.pendingRequestCount ? `Quản lý (${g.pendingRequestCount})` : 'Quản lý'] as [Tab, string]] : [])]
  const visibleTab: Tab = tab === 'manage' && !manager ? 'discussions' : tab

  const membershipButtons = !isMember ? (
    pending ? (
      <>
        <Button title="Chờ duyệt" variant="secondary" size="sm" disabled style={{ flex: 1 }} />
        <Button title="Hủy yêu cầu" variant="outline" size="sm" onPress={() => setConfirm('cancel')} style={{ flex: 1 }} />
      </>
    ) : inactive ? (
      <Button title="Tạm ngừng hoạt động" variant="secondary" size="sm" disabled style={{ flex: 1 }} />
    ) : (
      <Button
        title={g.privacy === 'PRIVATE' ? 'Gửi yêu cầu tham gia' : 'Tham gia nhóm'}
        icon={<UserPlus size={16} color="#fff" />}
        onPress={() => join.mutate()}
        loading={join.isPending}
        size="sm"
        style={{ flex: 1 }}
      />
    )
  ) : (
    <Button title="Đã tham gia" variant="secondary" size="sm" icon={<Check size={16} color={t.primary} />} onPress={() => setMenu(true)} style={{ flex: 1 }} />
  )

  const header = (
    <View style={{ backgroundColor: t.card }}>
      {g.coverImageUrl ? (
        <Image source={{ uri: g.coverImageUrl }} style={{ height: 170, backgroundColor: t.inputBg }} contentFit="cover" />
      ) : (
        <BrandCover height={110} />
      )}
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Tag label={categoryLabel(g.category)} tone="primary" />
          <Tag
            label={g.privacy === 'PRIVATE' ? 'Riêng tư' : 'Công khai'}
            tone="neutral"
            icon={g.privacy === 'PRIVATE' ? <Lock size={11} color={t.textMuted} /> : <Globe size={11} color={t.textMuted} />}
          />
          {inactive ? <Tag label="Tạm ngừng" tone="warning" /> : null}
        </View>
        <Txt size={24} weight="800" style={{ marginTop: 8 }}>{g.name}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 14, rowGap: 6, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Users size={15} color={t.primary} />
            <Txt size={13} weight="700">{`${g.memberCount} thành viên`}</Txt>
          </View>
          {created ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <CalendarDays size={14} color={t.textMuted} />
              <Txt muted size={13}>{`Thành lập ${created}`}</Txt>
            </View>
          ) : null}
        </View>
        {g.owner ? (
          <Pressable
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(g.owner!.userId) } })}
            accessibilityRole="button"
            accessibilityLabel={`Người sáng lập ${g.owner.fullName}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, minHeight: 32 }}
          >
            <Crown size={15} color={t.warning} />
            <Avatar uri={g.owner.avatarUrl} name={g.owner.fullName} size={22} />
            <Txt size={13} weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>{g.owner.fullName}</Txt>
            <Txt muted size={12}>(Người sáng lập)</Txt>
          </Pressable>
        ) : null}

        {inactive ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: t.warningTint }}>
            <Info size={16} color={t.warning} />
            <Txt size={13} weight="600" color={t.warning} style={{ flex: 1 }}>Hội nhóm đang tạm ngừng hoạt động và không nhận thêm thành viên mới.</Txt>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' }}>
          {membershipButtons}
          {isMember && (g.conversationId || owner) ? (
            <IconButton
              label={g.conversationId ? (g.isConversationMember ? 'Nhắn tin nhóm' : 'Tham gia nhóm chat') : 'Tạo nhóm chat'}
              icon={<MessageCircle size={18} color={g.conversationId ? t.text : t.primary} />}
              onPress={() => { if (!chat.isPending) chat.mutate(g.conversationId ? (g.isConversationMember ? 'open' : 'join') : 'create') }}
            />
          ) : null}
          {g.canViewMembers || isMember ? (
            <IconButton label="Xem thành viên" icon={<Users size={18} color={t.text} />} onPress={() => router.push({ pathname: '/groups/[id]/members', params: { id } })} />
          ) : null}
          <IconButton label="Chia sẻ nhóm" icon={<Share2 size={18} color={t.text} />} onPress={() => setShareOpen(true)} />
        </View>
        {manager && g.pendingRequestCount ? (
          <Pressable
            onPress={() => router.push({ pathname: '/groups/[id]/join-requests', params: { id } })}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: t.warningTint }}
          >
            <Bell size={16} color={t.warning} />
            <Txt size={13} weight="700" color={t.warning} style={{ flex: 1 }}>{`${g.pendingRequestCount} yêu cầu tham gia đang chờ duyệt`}</Txt>
            <ChevronRight size={16} color={t.warning} />
          </Pressable>
        ) : null}
      </View>
      <SoftTabs<Tab> tabs={tabs} value={visibleTab} onChange={setTab} />
    </View>
  )

  const discussionsTop = (
    <View style={{ paddingTop: 12 }}>
      {!canSee ? null : isMember && !inactive ? (
        <Pressable
          onPress={() => router.push({ pathname: '/groups/[id]/create-post', params: { id } })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.card, marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Viết bài cho nhóm"
        >
          <Avatar uri={me?.avatarUrl} name={me?.name} size={38} />
          <View style={{ flex: 1, minHeight: 38, borderRadius: 19, backgroundColor: t.inputBg, justifyContent: 'center', paddingHorizontal: 14 }}>
            <Txt muted numberOfLines={1}>{`Chia sẻ với ${g.name}...`}</Txt>
          </View>
          <ImagePlus size={22} color={t.textMuted} />
        </Pressable>
      ) : !isMember && !inactive ? (
        <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <Txt weight="700" size={14}>{`Tham gia ${g.name} để cùng thảo luận`}</Txt>
          <Txt muted size={12} style={{ marginTop: 4 }}>Trở thành thành viên để đăng bài viết, bình luận và kết nối với các cựu sinh viên khác.</Txt>
        </Card>
      ) : null}
      {canSee && g.topics.length ? (
        <ChipRow style={{ marginBottom: 12 }}>
          <Chip label="Tất cả" active={!activeTopic} onPress={() => setTopic('')} />
          {g.topics.map((tp) => <Chip key={tp} label={`#${tp}`} active={activeTopic === tp} onPress={() => setTopic(tp)} />)}
        </ChipRow>
      ) : null}
      {canSee && posts.isLoading ? <Loading /> : null}
    </View>
  )

  const aboutTab = (
    <View style={{ padding: 16, gap: 16 }}>
      <Card>
        <Txt weight="800" size={16}>Mô tả hội nhóm</Txt>
        <Txt style={{ marginTop: 8, lineHeight: 21 }}>{g.description || 'Chưa có mô tả.'}</Txt>
        {g.topics.length ? (
          <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.divider }}>
            <Txt muted size={12} weight="700" style={{ marginBottom: 8 }}>CHỦ ĐỀ HOẠT ĐỘNG</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {g.topics.map((tp) => <Tag key={tp} label={`#${tp}`} tone="neutral" />)}
            </View>
          </View>
        ) : null}
      </Card>
      <Card>
        <Txt weight="800" size={16}>Nội quy & Chuẩn mực cộng đồng</Txt>
        {g.joinRules ? (
          <View style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: t.surface }}>
            <Txt muted style={{ lineHeight: 21 }}>{g.joinRules}</Txt>
          </View>
        ) : (
          <Txt muted size={13} style={{ marginTop: 8 }}>Hội nhóm này áp dụng các quy tắc văn hóa và ứng xử chung của nền tảng AlumNect.</Txt>
        )}
        <View style={{ marginTop: 12, gap: 10 }}>
          {SAMPLE_RULES.map(([title, desc], i) => (
            <View key={title} style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: t.border }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={12} weight="800" color={t.primary}>{i + 1}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="700" size={14}>{title}</Txt>
                <Txt muted size={12}>{desc}</Txt>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  )

  const manageTab = (
    <View style={{ padding: 16 }}>
      <SettingRow
        title="Yêu cầu tham gia"
        desc="Duyệt hoặc từ chối các yêu cầu đang chờ."
        action="Xem yêu cầu"
        badge={g.pendingRequestCount ?? undefined}
        onPress={() => router.push({ pathname: '/groups/[id]/join-requests', params: { id } })}
      />
      <SettingRow
        title="Chỉnh sửa thông tin hội nhóm"
        desc={inactive ? 'Mở lại hội nhóm để chỉnh sửa thông tin.' : 'Cập nhật thông tin và quy định nhóm.'}
        action="Chỉnh sửa"
        disabled={inactive}
        onPress={() => router.push({ pathname: '/groups/create', params: { id } })}
      />
      {owner ? (
        <>
          <SettingRow
            title={inactive ? 'Mở lại hội nhóm' : 'Tạm ngừng hội nhóm'}
            desc={inactive ? 'Kích hoạt lại để nhóm hoạt động bình thường.' : 'Tạm ẩn nhóm và ngừng nhận thành viên mới.'}
            action={inactive ? 'Mở lại nhóm' : 'Tạm ngừng'}
            disabled={status.isPending}
            onPress={() => (inactive ? status.mutate('ACTIVE') : setConfirm('pause'))}
          />
          <SettingRow title="Xóa vĩnh viễn hội nhóm" desc="Xóa hoàn toàn hội nhóm. Không thể khôi phục." action="Xóa nhóm" danger onPress={() => setConfirm('delete')} />
        </>
      ) : null}
    </View>
  )

  const listHeader = (
    <View>
      {header}
      {visibleTab === 'discussions' ? discussionsTop : visibleTab === 'about' ? aboutTab : manageTab}
    </View>
  )

  return (
    <Screen bg={t.card}>
      <Header title={g.name} right={<IconButton label="Tuỳ chọn nhóm" icon={<MoreHorizontal size={20} color={t.text} />} onPress={() => setMenu(true)} />} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={visibleTab === 'discussions' && canSee ? items : []}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => visibleTab === 'discussions' && posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}
          refreshing={posts.isRefetching}
          onRefresh={() => { group.refetch(); if (canSee) posts.refetch() }}
          ListHeaderComponent={listHeader}
          ListFooterComponent={
            visibleTab === 'discussions' && items.length && !posts.hasNextPage ? (
              <Txt muted size={12} style={{ textAlign: 'center', paddingVertical: 16 }}>Đã xem hết thảo luận gần đây</Txt>
            ) : posts.isFetchingNextPage ? <Loading /> : null
          }
          ListEmptyComponent={
            visibleTab !== 'discussions' || (canSee && posts.isLoading) ? null : (
              <Empty
                error={canSee ? posts.error : undefined}
                onRetry={() => { void posts.refetch() }}
                icon={canSee ? <MessageSquare size={26} color={t.primary} /> : <Lock size={26} color={t.primary} />}
                title={!canSee ? 'Hội nhóm riêng tư' : activeTopic ? `Chưa có bài thảo luận về ${activeTopic}` : 'Chưa có bài thảo luận nào'}
                text={!canSee
                  ? 'Hãy tham gia hội nhóm để xem nội dung và thảo luận cùng mọi người.'
                  : isMember ? 'Hãy là người đầu tiên đăng bài viết khởi động các cuộc thảo luận sôi nổi trong nhóm!' : 'Hãy tham gia nhóm để bắt đầu chia sẻ và trao đổi cùng mọi người.'}
              />
            )
          }
          renderItem={({ item }) => <View style={{ paddingHorizontal: 16 }}><GroupPostCard post={item} canInteract={isMember && !inactive} /></View>}
        />
      </View>
      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        item={{
          title: g.name,
          subtitle: `${g.memberCount} thành viên • ${g.description || 'Hội nhóm trên AlumNect'}`,
          thumbnail: g.coverImageUrl,
          path: groupPath(g.id),
          typeLabel: 'hội nhóm',
        }}
      />
      <ActionSheet visible={menu} onClose={() => setMenu(false)} actions={actions} />
      <ActionSheet visible={transferOpen} onClose={() => { if (!leave.isPending) setTransferOpen(false) }} title="Chuyển quyền chủ nhóm">
        <Txt muted style={{ marginBottom: 12 }}>Bạn là chủ nhóm. Hãy chọn thành viên nhận quyền sở hữu trước khi rời nhóm.</Txt>
        <SearchBar value={memberKw} onChangeText={setMemberKw} placeholder="Tìm thành viên..." />
        <View style={{ marginTop: 8, minHeight: 120 }}>
          {candidates.isLoading ? <Loading /> : transferList.length === 0 ? (
            <Txt muted style={{ textAlign: 'center', paddingVertical: 24 }}>Không tìm thấy thành viên phù hợp.</Txt>
          ) : transferList.map((m) => (
            <Pressable key={m.userId} onPress={() => setNewOwner(m.userId)} accessibilityRole="radio" accessibilityState={{ checked: newOwner === m.userId }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <Avatar uri={m.avatarUrl} name={m.fullName} size={38} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight="600" numberOfLines={1}>{m.fullName}</Txt>
                {m.headline ? <Txt muted size={12} numberOfLines={1}>{m.headline}</Txt> : null}
              </View>
              {newOwner === m.userId ? <Check size={20} color={t.primary} /> : null}
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <Button title="Hủy" variant="outline" disabled={leave.isPending} onPress={() => setTransferOpen(false)} style={{ flex: 1 }} />
          <Button title="Chuyển quyền & rời" variant="danger" disabled={newOwner == null} loading={leave.isPending} onPress={() => { if (newOwner != null) leave.mutate(newOwner) }} style={{ flex: 1 }} />
        </View>
      </ActionSheet>
      <ConfirmSheet
        visible={confirm === 'leave'}
        title="Rời khỏi hội nhóm"
        message={owner
          ? `Bạn là thành viên cuối cùng của ${g.name}. Nếu rời nhóm, hội nhóm sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn tiếp tục?`
          : `Bạn có chắc muốn rời khỏi ${g.name}? Bạn sẽ mất quyền truy cập nội dung dành riêng cho thành viên.`}
        confirmLabel="Rời nhóm"
        loading={leave.isPending}
        onConfirm={() => leave.mutate(undefined)}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'cancel'}
        title="Hủy yêu cầu tham gia?"
        message={`Yêu cầu tham gia ${g.name} sẽ bị hủy. Bạn có thể gửi lại sau.`}
        confirmLabel="Hủy yêu cầu"
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'pause'}
        title="Tạm ngừng hội nhóm"
        message="Tạm ẩn nhóm và ngừng nhận thành viên mới. Bạn có thể mở lại bất kỳ lúc nào."
        confirmLabel="Tạm ngừng"
        loading={status.isPending}
        onConfirm={() => status.mutate('INACTIVE')}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'delete'}
        title="Xóa vĩnh viễn hội nhóm"
        message={`Bạn có chắc chắn muốn xóa nhóm ${g.name}? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa nhóm"
        loading={del.isPending}
        onConfirm={() => del.mutate()}
        onClose={() => setConfirm(null)}
      />
    </Screen>
  )
}

export default withGroupsAlumniOnly(GroupDetailScreen)
