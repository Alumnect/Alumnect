import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Plus } from 'lucide-react-native'
import { Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { ShareSheet } from '@/components/ShareSheet'
import { groupPath } from '@/lib/share'
import { GroupPostCard } from '@/components/GroupPostCard'
import { categoryLabel, groupApi, isManager } from '@/api/groups'
import { useTheme } from '@/theme'
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
    mutationFn: () => groupApi.leave(gid),
    onSuccess: () => { toast.success('Bạn đã rời nhóm.'); refresh(); router.back() },
    onError: (e) => toast.error(errMsg(e)),
  })

  if (group.isLoading) return <Screen><Header title="Nhóm" /><Loading /></Screen>
  if (!g) return <Screen><Header title="Nhóm" /><Empty text="Không tìm thấy nhóm." /></Screen>
  const manager = isManager(g.viewerRole)
  const owner = g.viewerRole === 'OWNER'
  const pending = g.viewerMembershipStatus === 'PENDING'

  const actions = [
    { label: 'Chia sẻ nhóm', onPress: () => setShareOpen(true) },
    ...(manager ? [{ label: 'Chỉnh sửa nhóm', onPress: () => router.push({ pathname: '/groups/create', params: { id } }) }] : []),
    ...(manager ? [{ label: `Yêu cầu tham gia${g.pendingRequestCount ? ` (${g.pendingRequestCount})` : ''}`, onPress: () => router.push({ pathname: '/groups/[id]/join-requests', params: { id } }) }] : []),
    ...(owner ? [{ label: g.status === 'INACTIVE' ? 'Mở lại nhóm' : 'Đóng nhóm', onPress: () => run(() => groupApi.setStatus(gid, g.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'), g.status === 'INACTIVE' ? 'Đã mở lại nhóm.' : 'Đã đóng nhóm.') }] : []),
    ...(owner ? [{ label: 'Xóa nhóm vĩnh viễn', danger: true, onPress: () => run(() => groupApi.remove(gid), 'Đã xóa nhóm.', () => router.back()) }] : []),
    ...(isMember && !owner ? [{ label: 'Rời khỏi nhóm', danger: true, onPress: () => leave.mutate() }] : []),
  ]

  return (
    <Screen>
      <Header title={g.name} right={actions.length ? <Pressable onPress={() => setMenu(true)} hitSlop={10}><MoreHorizontal size={22} color={t.text} /></Pressable> : undefined} />
      <FlashList
        data={items}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        onEndReached={() => posts.hasNextPage && posts.fetchNextPage()}
        ListHeaderComponent={
          <View>
            {g.coverImageUrl ? <Image source={{ uri: g.coverImageUrl }} style={{ height: 150 }} contentFit="cover" /> : <View style={{ height: 80, backgroundColor: t.primaryTint }} />}
            <View style={{ padding: 16 }}>
              <Txt size={22} weight="800">{g.name}</Txt>
              <Txt muted size={13} style={{ marginTop: 2 }}>{categoryLabel(g.category)} · {g.privacy === 'PRIVATE' ? 'Riêng tư' : 'Công khai'} · {g.memberCount} thành viên</Txt>
              <Txt style={{ marginTop: 10, lineHeight: 21 }}>{g.description}</Txt>
              {g.joinRules ? <Txt muted size={13} style={{ marginTop: 8 }}>Quy định: {g.joinRules}</Txt> : null}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                {!isMember ? (
                  <Button title={pending ? 'Đang chờ duyệt' : 'Tham gia nhóm'} disabled={pending || g.status !== 'ACTIVE'} onPress={() => join.mutate()} loading={join.isPending} style={{ flex: 1 }} />
                ) : null}
                {g.canViewMembers || isMember ? <Button title="Thành viên" variant="outline" onPress={() => router.push({ pathname: '/groups/[id]/members', params: { id } })} style={{ flex: 1 }} /> : null}
              </View>
              {g.conversationId && isMember ? (
                <Button title="Mở chat nhóm" variant="ghost" onPress={() => groupApi.joinChat(gid).then((r) => router.push({ pathname: '/chat/[id]', params: { id: String(r.conversationId) } })).catch((e) => toast.error(errMsg(e)))} style={{ marginTop: 6 }} />
              ) : null}
              {g.status === 'INACTIVE' ? <Txt color={t.warning} weight="600" style={{ marginTop: 8 }}>Nhóm đang tạm đóng.</Txt> : null}
              <Txt weight="700" size={16} style={{ marginTop: 18 }}>Bài viết</Txt>
            </View>
          </View>
        }
        ListEmptyComponent={posts.isLoading ? <Loading /> : <Empty text={isMember || g.privacy === 'PUBLIC' ? 'Chưa có bài viết nào.' : 'Tham gia nhóm để xem bài viết.'} />}
        renderItem={({ item }) => <View style={{ paddingHorizontal: 16 }}><GroupPostCard post={item} /></View>}
      />
      {isMember ? (
        <Pressable onPress={() => router.push({ pathname: '/groups/[id]/create-post', params: { id } })} style={{ position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 }}>
          <Plus size={28} color="#fff" />
        </Pressable>
      ) : null}
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
    </Screen>
  )
}
