import React, { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, LogOut, UserPlus, Users, XCircle } from '@/components/icons'
import { Avatar, Button, Card, Input, Loading, MenuRow, Screen, SearchBar, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { chatApi } from '@/api/chat'
import type { Participant } from '@/api/chat'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { pickImage, uploadImage } from '@/lib/upload'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/**
 * UC71–72: thông tin nhóm chat — đồng bộ GroupInfoModal của Web:
 * đổi tên / ảnh nhóm, thêm / xóa thành viên, rời nhóm (admin chọn người nhận quyền), giải tán nhóm.
 * Nhóm chat gắn với Hội nhóm (communityGroupId): không giải tán được ở đây, chủ hội nhóm không được rời.
 */
export default function GroupChatInfoScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const convId = Number(id)
  const me = useAuthStore((s) => s.user)
  const [name, setName] = useState('')
  const [sel, setSel] = useState<Participant | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [kw, setKw] = useState('')
  const [picked, setPicked] = useState<number[]>([])
  const [uploading, setUploading] = useState(false)
  const [confirm, setConfirm] = useState<'leave' | 'transfer' | 'disband' | null>(null)
  const [newAdminId, setNewAdminId] = useState<number | null>(null)
  const keyword = useDebounced(kw, 400)

  const convs = useQuery({ queryKey: ['conversations', 'primary'], queryFn: () => chatApi.conversations('primary') })
  const conv = convs.data?.data.find((c) => c.id === convId)
  const members = useQuery({ queryKey: ['group-members', convId], queryFn: () => chatApi.members(convId) })
  const list = members.data?.data ?? []
  const amAdmin =
    list.find((m) => String(m.userId) === me?.id)?.role === 'ADMIN' || (conv?.adminId != null && String(conv.adminId) === me?.id)
  const isCommunity = conv?.communityGroupId != null
  const others = list.filter((m) => String(m.userId) !== me?.id)
  const memberIds = useMemo(() => new Set(list.map((m) => m.userId)), [list])

  const candidates = useQuery({
    queryKey: ['chat-users', keyword],
    queryFn: () => chatApi.searchUsers(keyword),
    enabled: addOpen,
  })
  const candidateList = (candidates.data?.data ?? []).filter((u) => !memberIds.has(u.userId))

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['group-members', convId] })
    qc.invalidateQueries({ queryKey: ['conversations'] })
  }
  const leaveDone = (msg: string) => {
    toast.success(msg)
    setConfirm(null)
    refresh()
    router.dismissTo('/chat')
  }

  const rename = useMutation({
    mutationFn: () => chatApi.updateGroup(convId, { title: name.trim() }),
    onSuccess: () => { toast.success('Đã cập nhật tên nhóm.'); setName(''); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const changeAvatar = async () => {
    const [img] = await pickImage()
    if (!img) return
    setUploading(true)
    try {
      const url = await uploadImage(img, 'avatars')
      await chatApi.updateGroup(convId, { avatarUrl: url })
      toast.success('Đã cập nhật ảnh nhóm.')
      refresh()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }
  const add = useMutation({
    mutationFn: () => chatApi.addMembers(convId, picked),
    onSuccess: () => {
      toast.success(`Đã thêm ${picked.length} thành viên vào nhóm.`)
      setPicked([]); setKw(''); setAddOpen(false)
      refresh()
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const remove = useMutation({
    mutationFn: (userId: number) => chatApi.removeMember(convId, userId),
    onSuccess: () => { toast.success('Đã xóa thành viên khỏi nhóm.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const leave = useMutation({
    mutationFn: (adminId?: number) => chatApi.removeMember(convId, Number(me!.id), adminId),
    onSuccess: () => leaveDone('Bạn đã rời nhóm.'),
    onError: (e) => toast.error(errMsg(e)),
  })
  const disband = useMutation({
    mutationFn: () => chatApi.remove(convId),
    onSuccess: () => leaveDone('Đã giải tán nhóm trò chuyện.'),
    onError: (e) => toast.error(errMsg(e)),
  })

  const onLeave = () => {
    if (isCommunity && amAdmin) {
      toast.error('Bạn là Chủ sở hữu hội nhóm nên không thể rời nhóm trò chuyện này.')
      return
    }
    if (!isCommunity && amAdmin && others.length > 0) {
      setNewAdminId(others[0].userId)
      setConfirm('transfer')
      return
    }
    setConfirm('leave')
  }
  const togglePick = (uid: number) => setPicked((p) => (p.includes(uid) ? p.filter((x) => x !== uid) : [...p, uid]))

  return (
    <Screen keyboard>
      <Header title="Thông tin nhóm" />
      {members.isLoading ? <Loading /> : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Pressable
              disabled={!amAdmin || uploading}
              onPress={changeAvatar}
              accessibilityRole="button"
              accessibilityLabel="Đổi ảnh nhóm"
              style={{ opacity: uploading ? 0.6 : 1 }}
            >
              <Avatar uri={conv?.avatarUrl} name={conv?.title ?? 'Nhóm'} size={84} ring />
              {amAdmin ? (
                <View style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: t.primary, borderWidth: 2, borderColor: t.bg }}>
                  <Camera size={15} color="#fff" />
                </View>
              ) : null}
            </Pressable>
            <Txt weight="700" size={18} style={{ marginTop: 10, textAlign: 'center' }} numberOfLines={2}>{conv?.title ?? 'Nhóm trò chuyện'}</Txt>
            <Txt muted size={13} style={{ marginTop: 2 }}>
              {isCommunity ? `Nhóm chat của hội nhóm${conv?.communityGroupName ? ` · ${conv.communityGroupName}` : ''}` : `${list.length} thành viên`}
            </Txt>
            {uploading ? <Txt muted size={12} style={{ marginTop: 4 }}>Đang tải ảnh lên...</Txt> : null}
          </View>

          {amAdmin ? (
            <View style={{ marginBottom: 8 }}>
              <Input label="Đổi tên nhóm" value={name} onChangeText={setName} placeholder={conv?.title} />
              <Button title="Lưu tên nhóm" variant="outline" disabled={!name.trim()} loading={rename.isPending} onPress={() => rename.mutate()} />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <Txt weight="700" style={{ flex: 1 }}>Thành viên ({list.length})</Txt>
            {amAdmin && !isCommunity ? (
              <Button title="Thêm" size="sm" variant="secondary" icon={<UserPlus size={16} color={t.primary} />} onPress={() => setAddOpen(true)} />
            ) : null}
          </View>
          <Card>
            {list.map((m) => {
              const self = String(m.userId) === me?.id
              return (
                <Pressable
                  key={m.userId}
                  onPress={() => (amAdmin && !self && !isCommunity ? setSel(m) : router.push({ pathname: '/profile/[id]', params: { id: String(m.userId) } }))}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
                >
                  <Avatar uri={m.avatar} name={m.fullName} size={40} />
                  <Txt style={{ flex: 1 }} weight="600" numberOfLines={1}>{self ? `${m.fullName} (Bạn)` : m.fullName}</Txt>
                  {m.role === 'ADMIN' ? <Txt size={12} color={t.primary} weight="700">Quản trị</Txt> : null}
                </Pressable>
              )
            })}
          </Card>
          {amAdmin && !isCommunity ? <Txt muted size={12} style={{ marginTop: 6 }}>Chạm vào một thành viên để xem hồ sơ hoặc xóa khỏi nhóm.</Txt> : null}
          {isCommunity ? <Txt muted size={12} style={{ marginTop: 6 }}>Thành viên được đồng bộ theo hội nhóm, quản lý thành viên tại trang hội nhóm.</Txt> : null}

          <Card style={{ marginTop: 20 }}>
            <MenuRow icon={<LogOut size={18} />} label="Rời khỏi nhóm" danger onPress={onLeave} last={!(amAdmin && !isCommunity)} />
            {amAdmin && !isCommunity ? (
              <MenuRow icon={<XCircle size={18} />} label="Giải tán nhóm" hint="Xóa nhóm trò chuyện cho tất cả thành viên" danger onPress={() => setConfirm('disband')} last />
            ) : null}
          </Card>
        </ScrollView>
      )}

      <ActionSheet
        visible={!!sel}
        onClose={() => setSel(null)}
        title={sel?.fullName}
        actions={sel ? [
          { label: 'Xem trang cá nhân', onPress: () => router.push({ pathname: '/profile/[id]', params: { id: String(sel.userId) } }) },
          { label: `Xóa ${sel.fullName} khỏi nhóm`, danger: true, onPress: () => remove.mutate(sel.userId) },
        ] : []}
      />

      <ActionSheet visible={addOpen} onClose={() => { if (!add.isPending) setAddOpen(false) }} title="Thêm thành viên">
        <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm người dùng..." />
        <View style={{ marginTop: 8, minHeight: 120 }}>
          {candidates.isLoading ? <Loading /> : candidateList.length === 0 ? (
            <Txt muted style={{ textAlign: 'center', paddingVertical: 24 }}>Không tìm thấy người dùng phù hợp.</Txt>
          ) : candidateList.map((u) => (
            <Pressable key={u.userId} onPress={() => togglePick(u.userId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <Avatar uri={u.avatarUrl} name={u.fullName} size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight="600" numberOfLines={1}>{u.fullName}</Txt>
                {u.headline ? <Txt muted size={12} numberOfLines={1}>{u.headline}</Txt> : null}
              </View>
              {picked.includes(u.userId) ? <Check size={20} color={t.primary} /> : null}
            </Pressable>
          ))}
        </View>
        <Button title={`Thêm vào nhóm (${picked.length})`} icon={<Users size={16} color="#fff" />} disabled={!picked.length} loading={add.isPending} onPress={() => add.mutate()} style={{ marginTop: 12 }} />
      </ActionSheet>

      <ActionSheet visible={confirm === 'transfer'} onClose={() => { if (!leave.isPending) setConfirm(null) }} title="Chọn quản trị viên mới">
        <Txt muted style={{ marginBottom: 12 }}>Bạn là quản trị viên. Hãy chọn người nhận quyền quản trị trước khi rời nhóm.</Txt>
        {others.map((m) => (
          <Pressable key={m.userId} onPress={() => setNewAdminId(m.userId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <Avatar uri={m.avatar} name={m.fullName} size={36} />
            <Txt weight="600" style={{ flex: 1 }} numberOfLines={1}>{m.fullName}</Txt>
            {newAdminId === m.userId ? <Check size={20} color={t.primary} /> : null}
          </Pressable>
        ))}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <Button title="Hủy" variant="outline" disabled={leave.isPending} onPress={() => setConfirm(null)} style={{ flex: 1 }} />
          <Button title="Chuyển quyền & rời" variant="danger" disabled={newAdminId == null} loading={leave.isPending} onPress={() => leave.mutate(newAdminId ?? undefined)} style={{ flex: 1 }} />
        </View>
      </ActionSheet>

      <ConfirmSheet
        visible={confirm === 'leave'}
        title="Rời khỏi nhóm?"
        message="Bạn sẽ không nhận được tin nhắn mới từ nhóm này nữa."
        confirmLabel="Rời nhóm"
        loading={leave.isPending}
        onConfirm={() => leave.mutate(undefined)}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'disband'}
        title="Giải tán nhóm?"
        message="Nhóm trò chuyện và toàn bộ tin nhắn sẽ bị xóa với tất cả thành viên. Hành động này không thể hoàn tác."
        confirmLabel="Giải tán"
        loading={disband.isPending}
        onConfirm={() => disband.mutate()}
        onClose={() => setConfirm(null)}
      />
    </Screen>
  )
}
