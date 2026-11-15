import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Crown, Lock, MoreHorizontal } from '@/components/icons'
import { Avatar, Empty, IconButton, Loading, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { withGroupsAlumniOnly } from '@/components/GroupsAlumniOnly'
import { ActionSheet } from '@/components/ActionSheet'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { groupApi } from '@/api/groups'
import type { GroupMember } from '@/api/groups'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

const ROLE_LABEL = { OWNER: 'Chủ sở hữu', ADMIN: 'Quản trị viên', MEMBER: '' }

/** UC121, 123, 124: danh sách thành viên, xóa thành viên, bổ nhiệm / gỡ quản trị viên (mỗi nhóm tối đa một quản trị viên). */
function GroupMembersScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const gid = Number(id)
  const me = useAuthStore((s) => s.user)
  const [kw, setKw] = useState('')
  const [sel, setSel] = useState<GroupMember | null>(null)
  const [toRemove, setToRemove] = useState<GroupMember | null>(null)
  const keyword = useDebounced(kw, 400)

  const group = useQuery({ queryKey: ['group', id], queryFn: () => groupApi.get(id!) })
  const viewerRole = group.data?.viewerRole
  const canView = !!group.data?.canViewMembers || group.data?.viewerMembershipStatus === 'ACTIVE'
  const q = useInfiniteQuery({
    queryKey: ['group-members', 'g', gid, keyword],
    initialPageParam: 0,
    enabled: !!group.data && canView,
    queryFn: ({ pageParam }) => groupApi.members(gid, pageParam, keyword),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  // Danh sách không lọc để biết nhóm đã có quản trị viên chưa (cùng cách làm của web).
  const all = useInfiniteQuery({
    queryKey: ['group-members', 'g', gid, ''],
    initialPageParam: 0,
    enabled: !!group.data && canView && viewerRole === 'OWNER',
    queryFn: ({ pageParam }) => groupApi.members(gid, pageParam, ''),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const hasAdmin = all.data?.pages.some((p) => p.items.some((m) => m.role === 'ADMIN')) ?? true
  const items = q.data?.pages.flatMap((p) => p.items) ?? []
  const total = q.data?.pages[0]?.total ?? 0

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['group-members', 'g', gid] })
    qc.invalidateQueries({ queryKey: ['group', id] })
  }
  const role = useMutation({
    mutationFn: (m: GroupMember) => groupApi.changeRole(gid, m.userId, m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'),
    onSuccess: () => { toast.success('Đã cập nhật vai trò thành viên.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const remove = useMutation({
    mutationFn: (m: GroupMember) => groupApi.removeMember(gid, m.userId),
    onSuccess: () => { toast.success('Đã xóa thành viên khỏi nhóm.'); setToRemove(null); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })

  /** Quyền thao tác của người xem đối với một thành viên (khớp web và backend). */
  const isSelf = (m: GroupMember) => String(m.userId) === me?.id
  const canRemove = (m: GroupMember) => !isSelf(m) && ((viewerRole === 'OWNER' && m.role !== 'OWNER') || (viewerRole === 'ADMIN' && m.role === 'MEMBER'))
  const canChangeRole = (m: GroupMember) => viewerRole === 'OWNER' && !isSelf(m) && m.role !== 'OWNER' && (m.role === 'ADMIN' || !hasAdmin)
  const actionsFor = (m: GroupMember) => [
    ...(canChangeRole(m) ? [{ label: m.role === 'ADMIN' ? 'Gỡ quyền Quản trị' : 'Bổ nhiệm Quản trị', onPress: () => role.mutate(m) }] : []),
    ...(canRemove(m) ? [{ label: 'Xóa khỏi nhóm', danger: true, onPress: () => setToRemove(m) }] : []),
  ]

  if (group.isLoading) return <Screen><Header title="Thành viên" /><Loading /></Screen>
  if (!group.data) return <Screen><Header title="Thành viên" /><Empty text="Không tìm thấy nhóm." error={group.error} onRetry={() => { void group.refetch() }} /></Screen>
  if (!canView) {
    return (
      <Screen>
        <Header title="Thành viên" />
        <Empty
          icon={<Lock size={26} color={t.primary} />}
          title="Danh sách thành viên chỉ dành cho thành viên nhóm"
          text="Hãy tham gia hội nhóm để xem thành viên và nội dung dành riêng cho thành viên."
        />
      </Screen>
    )
  }

  return (
    <Screen>
      <Header title="Thành viên" />
      <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm thành viên..." style={{ margin: 16, marginBottom: 4 }} />
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(m) => String(m.userId)}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          ListHeaderComponent={items.length ? <Txt muted size={12} weight="600" style={{ paddingHorizontal: 16, paddingVertical: 8 }}>{`${total} thành viên`}</Txt> : null}
          ListEmptyComponent={<Empty error={q.error} onRetry={() => { void q.refetch() }} title="Không tìm thấy thành viên" text={keyword ? 'Không có thành viên nào phù hợp.' : 'Hội nhóm chưa có thành viên.'} />}
          renderItem={({ item }) => {
            const actions = actionsFor(item)
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(item.userId) } })}
                accessibilityRole="button"
                accessibilityLabel={`Xem hồ sơ ${item.fullName}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}
              >
                <Avatar uri={item.avatarUrl} name={item.fullName} size={44} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt weight="700" numberOfLines={1}>{item.fullName}</Txt>
                  {item.headline ? <Txt muted size={13} numberOfLines={1}>{item.headline}</Txt> : null}
                </View>
                {ROLE_LABEL[item.role] ? (
                  <Tag label={ROLE_LABEL[item.role]} tone={item.role === 'OWNER' ? 'warning' : 'primary'} icon={item.role === 'OWNER' ? <Crown size={11} color={t.warning} /> : undefined} />
                ) : null}
                {actions.length ? (
                  <IconButton label={`Quản lý ${item.fullName}`} icon={<MoreHorizontal size={20} color={t.text} />} onPress={() => setSel(item)} />
                ) : null}
              </Pressable>
            )
          }}
        />
      )}
      <ActionSheet visible={!!sel} onClose={() => setSel(null)} title={sel?.fullName} actions={sel ? actionsFor(sel) : []} />
      <ConfirmSheet
        visible={!!toRemove}
        title="Xóa khỏi nhóm"
        message={`Bạn có chắc muốn xóa ${toRemove?.fullName ?? 'thành viên này'} khỏi hội nhóm? Người này sẽ mất toàn bộ quyền truy cập và thảo luận nội bộ.`}
        confirmLabel="Xóa khỏi nhóm"
        loading={remove.isPending}
        onConfirm={() => { if (toRemove) remove.mutate(toRemove) }}
        onClose={() => setToRemove(null)}
      />
    </Screen>
  )
}

export default withGroupsAlumniOnly(GroupMembersScreen)
