import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Input, Loading, Screen, Txt, Card } from '@/components/ui'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { chatApi } from '@/api/chat'
import type { Participant } from '@/api/chat'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC71–72: thông tin nhóm, đổi tên, quản lý thành viên, rời nhóm. */
export default function GroupChatInfoScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const convId = Number(id)
  const me = useAuthStore((s) => s.user)
  const [name, setName] = useState('')
  const [sel, setSel] = useState<Participant | null>(null)

  const members = useQuery({ queryKey: ['group-members', convId], queryFn: () => chatApi.members(convId) })
  const list = members.data?.data ?? []
  const amAdmin = list.find((m) => String(m.userId) === me?.id)?.role === 'ADMIN'
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['group-members', convId] })
    qc.invalidateQueries({ queryKey: ['conversations'] })
  }

  const rename = useMutation({
    mutationFn: () => chatApi.updateGroup(convId, { title: name.trim() }),
    onSuccess: () => { toast.success('Đã cập nhật thông tin nhóm.'); setName(''); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const remove = useMutation({
    mutationFn: (userId: number) => chatApi.removeMember(convId, userId),
    onSuccess: () => { toast.success('Đã xóa thành viên khỏi nhóm.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const leave = useMutation({
    mutationFn: () => {
      const other = list.find((m) => String(m.userId) !== me?.id)
      return chatApi.removeMember(convId, Number(me!.id), amAdmin ? other?.userId : undefined)
    },
    onSuccess: () => { toast.success('Bạn đã rời nhóm.'); refresh(); router.dismissTo('/chat') },
    onError: (e) => toast.error(errMsg(e)),
  })

  return (
    <Screen keyboard>
      <Header title="Thông tin nhóm" />
      {members.isLoading ? <Loading /> : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {amAdmin ? (
            <View style={{ marginBottom: 8 }}>
              <Input label="Đổi tên nhóm" value={name} onChangeText={setName} />
              <Button title="Lưu tên nhóm" variant="outline" disabled={!name.trim()} loading={rename.isPending} onPress={() => rename.mutate()} />
            </View>
          ) : null}
          <Txt weight="700" style={{ marginVertical: 12 }}>Thành viên ({list.length})</Txt>
          <Card>
            {list.map((m) => (
              <Pressable key={m.userId} onLongPress={() => amAdmin && String(m.userId) !== me?.id && setSel(m)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                <Avatar uri={m.avatar} name={m.fullName} size={40} />
                <Txt style={{ flex: 1 }} weight="600">{m.fullName}</Txt>
                {m.role === 'ADMIN' ? <Txt size={12} color={t.primary} weight="700">Quản trị</Txt> : null}
              </Pressable>
            ))}
          </Card>
          {amAdmin ? <Txt muted size={12} style={{ marginTop: 6 }}>Giữ lâu một thành viên để xóa khỏi nhóm.</Txt> : null}
          <Button title="Rời nhóm" variant="danger" onPress={() => leave.mutate()} loading={leave.isPending} style={{ marginTop: 24 }} />
        </ScrollView>
      )}
      <ActionSheet visible={!!sel} onClose={() => setSel(null)} actions={sel ? [{ label: `Xóa ${sel.fullName} khỏi nhóm`, danger: true, onPress: () => remove.mutate(sel.userId) }] : []} />
    </Screen>
  )
}
