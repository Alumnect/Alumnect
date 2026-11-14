import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, Users } from '@/components/icons'
import { Avatar, Button, Input, Screen, Txt, SearchBar } from '@/components/ui'
import { Header } from '@/components/Header'
import { chatApi } from '@/api/chat'
import { useDebounced } from '@/lib/hooks'
import { pickImage, uploadImage } from '@/lib/upload'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC70: tạo nhóm chat (hỗ trợ chọn ảnh đại diện nhóm giống Web). */
export default function CreateGroupScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [kw, setKw] = useState('')
  const [picked, setPicked] = useState<number[]>([])
  const [error, setError] = useState('')
  const keyword = useDebounced(kw, 400)
  const q = useQuery({ queryKey: ['chat-users', keyword], queryFn: () => chatApi.searchUsers(keyword) })

  const pickAvatar = async () => {
    const [img] = await pickImage()
    if (!img) return
    setUploading(true)
    try {
      const url = await uploadImage(img, 'avatars')
      setAvatarUrl(url)
    } catch (e) {
      toast.error(errMsg(e, 'Không thể tải ảnh đại diện lên. Vui lòng thử lại.'))
    } finally {
      setUploading(false)
    }
  }

  const m = useMutation({
    mutationFn: () =>
      chatApi.createGroup({
        title: title.trim(),
        avatarUrl: avatarUrl || undefined,
        memberIds: picked,
      }),
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
    <Screen keyboard>
      <Header title="Tạo nhóm trò chuyện" />
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <Pressable
            disabled={uploading}
            onPress={() => void pickAvatar()}
            accessibilityRole="button"
            accessibilityLabel="Tải ảnh đại diện nhóm"
            style={{ opacity: uploading ? 0.6 : 1 }}
          >
            {avatarUrl ? (
              <Avatar uri={avatarUrl} name={title.trim() || 'Nhóm'} size={76} ring />
            ) : (
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: t.primaryTint,
                  borderWidth: 1.5,
                  borderColor: t.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={30} color={t.primary} />
              </View>
            )}
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.primary,
                borderWidth: 2,
                borderColor: t.bg,
              }}
            >
              <Camera size={14} color="#fff" />
            </View>
          </Pressable>
          <Txt muted size={12} style={{ marginTop: 6 }}>
            {uploading ? 'Đang tải ảnh đại diện...' : avatarUrl ? 'Chạm để đổi ảnh nhóm' : 'Thêm ảnh đại diện nhóm (không bắt buộc)'}
          </Txt>
        </View>
        <Input label="Tên nhóm *" placeholder="Nhập tên nhóm trò chuyện..." value={title} onChangeText={setTitle} error={error} />
        <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm kiếm theo tên thành viên..." />
      </View>
      <FlashList
        data={q.data?.data ?? []}
        extraData={picked}
        keyExtractor={(u) => String(u.userId)}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggle(item.userId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Avatar uri={item.avatarUrl} name={item.fullName} size={42} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight="600" numberOfLines={1}>{item.fullName}</Txt>
              {item.headline ? <Txt muted size={12} numberOfLines={1}>{item.headline}</Txt> : null}
            </View>
            {picked.includes(item.userId) ? <Check size={20} color={t.primary} /> : null}
          </Pressable>
        )}
      />
      <View style={{ padding: 16 }}>
        <Button title={`Tạo nhóm (${picked.length})`} onPress={submit} loading={m.isPending} disabled={uploading} />
      </View>
    </Screen>
  )
}
