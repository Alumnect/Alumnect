import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from '@/components/icons'
import { Avatar, Button, Input, Screen, Txt, SearchBar } from '@/components/ui'
import { Header } from '@/components/Header'
import { chatApi } from '@/api/chat'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC70: tạo nhóm chat. */
export default function CreateGroupScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [kw, setKw] = useState('')
  const [picked, setPicked] = useState<number[]>([])
  const [error, setError] = useState('')
  const keyword = useDebounced(kw, 400)
  const q = useQuery({ queryKey: ['chat-users', keyword], queryFn: () => chatApi.searchUsers(keyword) })

  const m = useMutation({
    mutationFn: () => chatApi.createGroup({ title: title.trim(), memberIds: picked }),
    onSuccess: (res) => {
      toast.success('Đã tạo nhóm chat.')
      qc.invalidateQueries({ queryKey: ['conversations'] })
      router.replace({ pathname: '/chat/[id]', params: { id: String(res.data.id) } })
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const submit = () => {
    if (!title.trim()) return setError('Tên nhóm không được để trống')
    if (picked.length < 1) return setError('Vui lòng chọn ít nhất 1 thành viên')
    setError('')
    m.mutate()
  }
  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  return (
    <Screen>
      <Header title="Tạo nhóm chat" />
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Input label="Tên nhóm" value={title} onChangeText={setTitle} error={error} />
        <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm thành viên..." />
      </View>
      <FlashList
        data={q.data?.data ?? []}
        extraData={picked}
        keyExtractor={(u) => String(u.userId)}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggle(item.userId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Avatar uri={item.avatarUrl} name={item.fullName} size={42} />
            <Txt style={{ flex: 1 }} weight="600">{item.fullName}</Txt>
            {picked.includes(item.userId) ? <Check size={20} color={t.primary} /> : null}
          </Pressable>
        )}
      />
      <View style={{ padding: 16 }}>
        <Button title={`Tạo nhóm (${picked.length})`} onPress={submit} loading={m.isPending} />
      </View>
    </Screen>
  )
}
