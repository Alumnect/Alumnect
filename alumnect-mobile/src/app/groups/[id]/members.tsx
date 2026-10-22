import React, { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { groupApi, isManager } from '@/api/groups'
import type { GroupMember } from '@/api/groups'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

const ROLE_LABEL = { OWNER: 'Trưởng nhóm', ADMIN: 'Quản trị', MEMBER: '' }

/** UC121, 123, 124: danh sách thành viên, xóa thành viên, đổi vai trò. */
export default function GroupMembersScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const gid = Number(id)
  const me = useAuthStore((s) => s.user)
  const [kw, setKw] = useState('')
  const [sel, setSel] = useState<GroupMember | null>(null)
  const keyword = useDebounced(kw, 400)

  const group = useQuery({ queryKey: ['group', id], queryFn: () => groupApi.get(id!) })
  const q = useInfiniteQuery({
    queryKey: ['group-members', 'g', gid, keyword],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => groupApi.members(gid, pageParam, keyword),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []
  const viewerRole = group.data?.viewerRole
  const act = (fn: () => Promise<unknown>, ok: string) =>
    fn().then(() => { toast.success(ok); qc.invalidateQueries({ queryKey: ['group-members', 'g', gid] }); qc.invalidateQueries({ queryKey: ['group', id] }) }).catch((e) => toast.error(errMsg(e)))

  const actionsFor = (m: GroupMember) => {
    if (String(m.userId) === me?.id || m.role === 'OWNER') return []
    const a = []
    if (viewerRole === 'OWNER') a.push({ label: m.role === 'ADMIN' ? 'Hạ xuống thành viên' : 'Thăng làm quản trị', onPress: () => act(() => groupApi.changeRole(gid, m.userId, m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'), 'Đã đổi vai trò thành viên.') })
    if (isManager(viewerRole) && !(viewerRole === 'ADMIN' && m.role === 'ADMIN')) a.push({ label: 'Xóa khỏi nhóm', danger: true, onPress: () => act(() => groupApi.removeMember(gid, m.userId), 'Đã xóa thành viên khỏi nhóm.') })
    return a
  }

  return (
    <Screen>
      <Header title="Thành viên" />
      <TextInput value={kw} onChangeText={setKw} placeholder="Tìm thành viên..." placeholderTextColor={t.textMuted} style={{ margin: 16, backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }} />
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(m) => String(m.userId)}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          ListEmptyComponent={<Empty text="Không có thành viên." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(item.userId) } })}
              onLongPress={() => actionsFor(item).length && setSel(item)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Avatar uri={item.avatarUrl} name={item.fullName} size={44} />
              <View style={{ flex: 1 }}>
                <Txt weight="700">{item.fullName}</Txt>
                <Txt muted size={13} numberOfLines={1}>{item.headline ?? ''}</Txt>
              </View>
              {ROLE_LABEL[item.role] ? <Txt size={12} weight="700" color={t.primary}>{ROLE_LABEL[item.role]}</Txt> : null}
            </Pressable>
          )}
        />
      )}
      {isManager(viewerRole) ? <Txt muted size={12} style={{ textAlign: 'center', padding: 8 }}>Giữ lâu một thành viên để quản lý.</Txt> : null}
      <ActionSheet visible={!!sel} onClose={() => setSel(null)} title={sel?.fullName} actions={sel ? actionsFor(sel) : []} />
    </Screen>
  )
}
