import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Input, Loading, Screen, Txt, SearchBar } from '@/components/ui'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { groupApi, isActiveMember, isPendingMember } from '@/api/mentoringGroups'
import type { GroupMember } from '@/api/mentoringGroups'
import { userApi } from '@/api/users'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { toast, errMsg } from '@/lib/toast'
import { useTheme } from '@/theme'

type Confirm = { title: string; action: () => void } | null

/** Chi tiết nhóm Mentoring: thành viên, mời thành viên, rời / xoá nhóm, chỉnh sửa. */
export default function MentoringGroupDetailScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const gid = Number(id)
  const me = useAuthStore((s) => s.user)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [kw, setKw] = useState('')
  const [confirm, setConfirm] = useState<Confirm>(null)
  const query = useDebounced(kw, 300).trim()

  const q = useQuery({ queryKey: ['mentoring-groups', 'detail', gid], queryFn: () => groupApi.detail(gid) })
  const search = useQuery({ queryKey: ['group-invite-search', query], enabled: query.length >= 2, queryFn: () => userApi.search({ query, size: 8 }) })

  const refresh = () => qc.invalidateQueries({ queryKey: ['mentoring-groups'] })
  const onOk = (msg: string, after?: () => void) => () => {
    toast.success(msg)
    refresh()
    after?.()
  }
  const onErr = (e: unknown) => toast.error(errMsg(e))

  const save = useMutation({ mutationFn: () => groupApi.update(gid, { name: name.trim(), description: desc.trim() }), onSuccess: onOk('Đã cập nhật nhóm', () => setEditing(false)), onError: onErr })
  const invite = useMutation({ mutationFn: (uid: number) => groupApi.invite(gid, [uid]), onSuccess: onOk('Đã gửi lời mời vào nhóm'), onError: onErr })
  const remove = useMutation({ mutationFn: (uid: number) => groupApi.remove(gid, uid), onSuccess: onOk('Đã xoá thành viên khỏi nhóm'), onError: onErr })
  const cancelInv = useMutation({ mutationFn: (uid: number) => groupApi.cancelInvitationByUser(gid, uid), onSuccess: onOk('Đã thu hồi lời mời'), onError: onErr })
  const leave = useMutation({ mutationFn: () => groupApi.leave(gid), onSuccess: onOk('Đã rời nhóm', () => router.back()), onError: onErr })
  const del = useMutation({ mutationFn: () => groupApi.delete(gid), onSuccess: onOk('Đã xoá nhóm', () => router.back()), onError: onErr })

  const g = q.data
  if (q.isLoading) return <Screen><Header title="Nhóm Mentoring" /><Loading /></Screen>
  if (!g) return <Screen><Header title="Nhóm Mentoring" /><Empty text="Không tìm thấy nhóm." /></Screen>

  const isLeader = g.canManage || String(me?.id) === String(g.leaderId)
  const active = g.members.filter(isActiveMember)
  const pending = g.members.filter(isPendingMember)
  const iAmJoined = active.some((m) => String(m.userId) === String(me?.id))
  const memberIds = new Set(g.members.filter((m) => isActiveMember(m) || isPendingMember(m)).map((m) => m.userId))

  const MemberRow = ({ m, action }: { m: GroupMember; action?: React.ReactNode }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <Avatar uri={m.avatarUrl} name={m.fullName} size={38} />
      <View style={{ flex: 1 }}>
        <Txt weight="600" numberOfLines={1}>{m.fullName}{m.leader ? ' · Trưởng nhóm' : ''}</Txt>
        {m.major ? <Txt muted size={12}>{m.major}</Txt> : null}
      </View>
      {action}
    </View>
  )

  return (
    <Screen>
      <Header title={g.name} right={isLeader ? <Txt color={t.primary} weight="600" size={13} onPress={() => { setName(g.name); setDesc(g.description ?? ''); setEditing(true) }}>Sửa</Txt> : undefined} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {editing ? (
          <Card style={{ marginBottom: 14 }}>
            <Input label="Tên nhóm" value={name} onChangeText={setName} />
            <Input label="Mô tả" value={desc} onChangeText={setDesc} multiline />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Lưu" style={{ flex: 1 }} loading={save.isPending} disabled={!name.trim()} onPress={() => save.mutate()} />
              <Button title="Huỷ" variant="outline" style={{ flex: 1 }} onPress={() => setEditing(false)} />
            </View>
          </Card>
        ) : g.description ? <Txt muted style={{ marginBottom: 12 }}>{g.description}</Txt> : null}

        <Card style={{ marginBottom: 14 }}>
          <Txt weight="700" style={{ marginBottom: 4 }}>Thành viên ({active.length}/{g.maxMembers})</Txt>
          {active.map((m) => (
            <MemberRow key={m.id} m={m} action={isLeader && !m.leader ? <Txt color={t.danger} size={13} weight="600" onPress={() => setConfirm({ title: `Xoá ${m.fullName} khỏi nhóm?`, action: () => remove.mutate(m.userId) })}>Xoá</Txt> : undefined} />
          ))}
        </Card>

        {pending.length > 0 ? (
          <Card style={{ marginBottom: 14 }}>
            <Txt weight="700" style={{ marginBottom: 4 }}>Đang chờ phản hồi ({pending.length})</Txt>
            {pending.map((m) => (
              <MemberRow key={m.id} m={m} action={isLeader ? <Txt color={t.danger} size={13} weight="600" onPress={() => cancelInv.mutate(m.userId)}>Thu hồi</Txt> : undefined} />
            ))}
          </Card>
        ) : null}

        {isLeader && g.status === 'ACTIVE' ? (
          <Card style={{ marginBottom: 14 }}>
            <Txt weight="700" style={{ marginBottom: 8 }}>Mời thành viên</Txt>
            <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm theo tên (≥ 2 ký tự)..." />
            {(search.data?.data.content ?? []).map((u) => (
              <View key={u.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                <Avatar uri={u.avatarUrl} name={u.fullName} size={36} />
                <View style={{ flex: 1 }}><Txt weight="600" numberOfLines={1}>{u.fullName}</Txt>{u.headline ? <Txt muted size={12} numberOfLines={1}>{u.headline}</Txt> : null}</View>
                {memberIds.has(u.userId) ? <Txt muted size={12}>Trong nhóm</Txt> : <Txt color={t.primary} weight="700" size={13} onPress={() => invite.mutate(u.userId)}>Mời</Txt>}
              </View>
            ))}
          </Card>
        ) : null}

        {g.requests && g.requests.length > 0 ? (
          <Card style={{ marginBottom: 14 }}>
            <Txt weight="700" style={{ marginBottom: 4 }}>Yêu cầu của nhóm</Txt>
            {g.requests.map((r) => (
              <View key={r.id} style={{ paddingVertical: 6 }}>
                <Txt weight="600" numberOfLines={2} onPress={() => router.push({ pathname: '/mentoring/request/[id]', params: { id: String(r.id) } })}>{r.title}</Txt>
                <Txt muted size={12}>{r.status}{r.targetMentorName ? ` · ${r.targetMentorName}` : ''}</Txt>
              </View>
            ))}
          </Card>
        ) : null}

        {isLeader ? <Button title="Xoá nhóm" variant="danger" onPress={() => setConfirm({ title: 'Xoá vĩnh viễn nhóm này?', action: () => del.mutate() })} /> : null}
        {!isLeader && iAmJoined ? <Button title="Rời nhóm" variant="danger" onPress={() => setConfirm({ title: 'Bạn chắc chắn muốn rời nhóm?', action: () => leave.mutate() })} /> : null}
      </ScrollView>

      <ActionSheet
        visible={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        actions={confirm ? [{ label: 'Xác nhận', danger: true, onPress: () => { const a = confirm.action; setConfirm(null); a() } }] : []}
      />
    </Screen>
  )
}
