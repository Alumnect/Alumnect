import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Globe, ImagePlus, Lock, MessageCircle, MessageSquare, MoreHorizontal, Share2, UserPlus, Users } from '@/components/icons'
import { Avatar, Button, Empty, IconButton, Loading, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { useDebounced } from '@/lib/hooks'
import { ShareSheet } from '@/components/ShareSheet'
import { groupPath } from '@/lib/share'
import { GroupPostCard } from '@/components/GroupPostCard'
import { categoryLabel, groupApi, isManager } from '@/api/groups'
import { useTheme } from '@/theme'
import { BrandCover } from '@/components/DetailBits'
import { toast, errMsg } from '@/lib/toast'

/** UC114–120, 125: chi tiết nhóm + bài viết + thao tác quản lý. */
export default function GroupDetailScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const gid = Number(id)
  const [menu, setMenu] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const me = useAuthStore((s) => s.user)
  const [confirm, setConfirm] = useState<'leave' | 'delete' | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [newOwner, setNewOwner] = useState<number | null>(null)
  const [memberKw, setMemberKw] = useState('')
  const memberKeyword = useDebounced(memberKw, 400)

  const group = useQuery({ queryKey: ['group', id], queryFn: () => groupApi.get(id!) })
  const g = group.data
  const isMember = g?.viewerMembershipStatus === 'ACTIVE'
  const posts = useInfiniteQuery({
    queryKey: ['group-posts', gid],
    enabled: isMember || g?.privacy === 'PUBLIC',
    initialPageParam: 0,
    queryFn: ({ pageParam }) => groupApi.posts(gid, pageParam),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = posts.data?.pages.flatMap((p) => p.items) ?? []
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['group', id] })
    qc.invalidateQueries({ queryKey: ['groups'] })
  }
  const run = (fn: () => Promise<unknown>, ok: string, then?: () => void) =>
    fn().then(() => { toast.success(ok); refresh(); then?.() }).catch((e) => toast.error(errMsg(e)))

  const join = useMutation({
    mutationFn: () => groupApi.join(gid),
    onSuccess: (r) => { toast.success(r.viewerMembershipStatus === 'PENDING' ? 'Đã gửi yêu cầu tham gia nhóm!' : 'Đã tham gia nhóm!'); refresh(); qc.invalidateQueries({ queryKey: ['group-posts', gid] }) },
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
    onSuccess: () => { toast.success('Đã xóa nhóm.'); setConfirm(null); refresh(); router.back() },
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

  if (group.isLoading) return <Screen><Header title="Nhóm" /><Loading /></Screen>
  if (!g) return <Screen><Header title="Nhóm" /><Empty text="Không tìm thấy nhóm." error={group.error} onRetry={() => { void group.refetch() }} /></Screen>
  const manager = isManager(g.viewerRole)
  const owner = g.viewerRole === 'OWNER'
  const pending = g.viewerMembershipStatus === 'PENDING'

  const actions = [
    { label: 'Chia sẻ nhóm', onPress: () => setShareOpen(true) },
    ...(manager ? [{ label: 'Chỉnh sửa nhóm', onPress: () => router.push({ pathname: '/groups/create', params: { id } }) }] : []),
    ...(manager ? [{ label: `Yêu cầu tham gia${g.pendingRequestCount ? ` (${g.pendingRequestCount})` : ''}`, onPress: () => router.push({ pathname: '/groups/[id]/join-requests', params: { id } }) }] : []),
    ...(owner ? [{ label: g.status === 'INACTIVE' ? 'Mở lại nhóm' : 'Đóng nhóm', onPress: () => run(() => groupApi.setStatus(gid, g.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'), g.status === 'INACTIVE' ? 'Đã mở lại nhóm.' : 'Đã đóng nhóm.') }] : []),
    ...(isMember
      ? [{
          label: 'Rời khỏi nhóm',
          danger: true,
          onPress: () => {
            if (owner && g.memberCount > 1) {
              setNewOwner(null)
              setMemberKw('')
              setTransferOpen(true)
            } else setConfirm('leave')
          },
        }]
      : []),
    ...(owner ? [{ label: 'Xóa nhóm vĩnh viễn', danger: true, onPress: () => setConfirm('delete') }] : []),
  ]

  const canSee = isMember || g.privacy === 'PUBLIC'

  return (
    <Screen bg={t.card}>
      <Header title={g.name} right={actions.length ? <IconButton label="Tuỳ chọn nhóm" icon={<MoreHorizontal size={20} color={t.text} />} onPress={() => setMenu(true)} /> : undefined} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={items}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}
          refreshing={posts.isRefetching}
          onRefresh={() => { group.refetch(); posts.refetch() }}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.card, marginBottom: 16 }}>
                {g.coverImageUrl ? (
                  <Image source={{ uri: g.coverImageUrl }} style={{ height: 170, backgroundColor: t.inputBg }} contentFit="cover" />
                ) : (
                  <BrandCover height={110} />
                )}
                <View style={{ padding: 16 }}>
                  <Txt size={24} weight="800">{g.name}</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <Tag
                      label={g.privacy === 'PRIVATE' ? 'Nhóm riêng tư' : 'Nhóm công khai'}
                      tone="neutral"
                      icon={g.privacy === 'PRIVATE' ? <Lock size={11} color={t.textMuted} /> : <Globe size={11} color={t.textMuted} />}
                    />
                    <Tag label={categoryLabel(g.category)} />
                    <Txt muted size={13}>{`· ${g.memberCount} thành viên`}</Txt>
                  </View>
                  {g.status === 'INACTIVE' ? <Tag label="Nhóm đang tạm đóng" tone="warning" style={{ marginTop: 10 }} /> : null}

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                    {!isMember ? (
                      <Button
                        title={pending ? 'Đang chờ duyệt' : 'Tham gia nhóm'}
                        icon={pending ? undefined : <UserPlus size={16} color="#fff" />}
                        disabled={pending || g.status !== 'ACTIVE'}
                        onPress={() => join.mutate()}
                        loading={join.isPending}
                        style={{ flex: 1, height: 40 }}
                        size="sm"
                      />
                    ) : (
                      <Button title="Đã tham gia" variant="secondary" size="sm" icon={<Check size={16} color={t.primary} />} onPress={() => setMenu(true)} style={{ flex: 1, height: 40 }} />
                    )}
                    {g.canViewMembers || isMember ? (
                      <Button title="Thành viên" variant="outline" size="sm" icon={<Users size={16} color={t.text} />} onPress={() => router.push({ pathname: '/groups/[id]/members', params: { id } })} style={{ flex: 1, height: 40 }} />
                    ) : null}
                    {isMember && (g.conversationId || owner) ? (
                      <IconButton
                        label={g.conversationId ? (g.isConversationMember ? 'Mở chat nhóm' : 'Tham gia chat nhóm') : 'Tạo nhóm chat'}
                        icon={<MessageCircle size={18} color={g.conversationId ? t.text : t.primary} />}
                        onPress={() => { if (!chat.isPending) chat.mutate(g.conversationId ? (g.isConversationMember ? 'open' : 'join') : 'create') }}
                      />
                    ) : null}
                    <IconButton label="Chia sẻ nhóm" icon={<Share2 size={18} color={t.text} />} onPress={() => setShareOpen(true)} />
                  </View>

                  {manager && g.pendingRequestCount ? (
                    <Pressable
                      onPress={() => router.push({ pathname: '/groups/[id]/join-requests', params: { id } })}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: t.warningTint }}
                    >
                      <Bell size={16} color={t.warning} />
                      <Txt size={13} weight="700" color={t.warning} style={{ flex: 1 }}>{`${g.pendingRequestCount} yêu cầu tham gia đang chờ duyệt`}</Txt>
                    </Pressable>
                  ) : null}

                  {g.description ? (
                    <View style={{ marginTop: 14 }}>
                      <Txt weight="800" style={{ marginBottom: 4 }}>Giới thiệu</Txt>
                      <Txt style={{ lineHeight: 21 }} numberOfLines={aboutOpen ? undefined : 3}>{g.description}</Txt>
                      {g.description.length > 140 ? <Txt size={13} weight="700" color={t.primary} onPress={() => setAboutOpen(!aboutOpen)}>{aboutOpen ? 'Thu gọn' : 'Xem thêm'}</Txt> : null}
                    </View>
                  ) : null}
                  {g.joinRules ? (
                    <View style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: t.surface }}>
                      <Txt weight="700" size={13}>Quy định nhóm</Txt>
                      <Txt muted size={13} style={{ marginTop: 2 }}>{g.joinRules}</Txt>
                    </View>
                  ) : null}
                </View>
              </View>

              {isMember ? (
                <Pressable
                  onPress={() => router.push({ pathname: '/groups/[id]/create-post', params: { id } })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.card, marginHorizontal: 16, marginBottom: 16, padding: 12, borderRadius: 16 }}
                  accessibilityRole="button"
                >
                  <Avatar uri={me?.avatarUrl} name={me?.name} size={38} />
                  <View style={{ flex: 1, height: 38, borderRadius: 19, backgroundColor: t.inputBg, justifyContent: 'center', paddingHorizontal: 14 }}>
                    <Txt muted>Viết gì đó cho nhóm...</Txt>
                  </View>
                  <ImagePlus size={22} color={t.textMuted} />
                </Pressable>
              ) : null}
              {canSee ? <Txt weight="800" size={16} style={{ paddingHorizontal: 16, marginBottom: 8 }}>Bài viết</Txt> : null}
            </View>
          }
          ListEmptyComponent={
            posts.isLoading && canSee ? (
              <Loading />
            ) : (
              <Empty
                error={canSee ? posts.error : undefined}
                onRetry={() => { void posts.refetch() }}
                icon={canSee ? <MessageSquare size={26} color={t.primary} /> : <Lock size={26} color={t.primary} />}
                title={canSee ? 'Chưa có bài viết' : 'Nhóm riêng tư'}
                text={canSee ? 'Hãy mở đầu cuộc trò chuyện trong nhóm.' : 'Tham gia nhóm để xem bài viết và thảo luận.'}
              />
            )
          }
          renderItem={({ item }) => <View style={{ paddingHorizontal: 16 }}><GroupPostCard post={item} /></View>}
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
            <Pressable key={m.userId} onPress={() => setNewOwner(m.userId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
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
        title="Rời khỏi nhóm?"
        message={owner ? 'Bạn là thành viên duy nhất của nhóm. Sau khi rời, nhóm sẽ không còn quản trị viên.' : 'Bạn sẽ không còn xem được bài viết riêng tư và thông báo của nhóm.'}
        confirmLabel="Rời nhóm"
        loading={leave.isPending}
        onConfirm={() => leave.mutate(undefined)}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'delete'}
        title="Xóa nhóm vĩnh viễn?"
        message="Toàn bộ bài viết, thành viên và dữ liệu của nhóm sẽ bị xóa. Hành động này không thể hoàn tác."
        confirmLabel="Xóa nhóm"
        loading={del.isPending}
        onConfirm={() => del.mutate()}
        onClose={() => setConfirm(null)}
      />
    </Screen>
  )
}
