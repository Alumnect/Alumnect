import React, { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from '@/components/icons'
import { Button, Input, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { groupApi } from '@/api/groups'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'

/** UC125: đăng / sửa bài viết trong nhóm (truyền `postId` để sửa). */
export default function GroupPostFormScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const { id, postId } = useLocalSearchParams<{ id: string; postId?: string }>()
  const gid = Number(id)
  const existing = useQuery({ queryKey: ['group-post', gid, Number(postId)], queryFn: () => groupApi.post(gid, Number(postId)), enabled: !!postId })
  const [content, setContent] = useState('')
  const [topic, setTopic] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  if (existing.data && !loaded) {
    setLoaded(true)
    setContent(existing.data.content); setTopic(existing.data.topic ?? ''); setImages(existing.data.imageUrls ?? [])
  }

  const m = useMutation({
    mutationFn: () => {
      const p = { content: content.trim(), topic: topic.trim() || null, imageUrls: images }
      return postId ? groupApi.updatePost(gid, Number(postId), p) : groupApi.createPost(gid, p)
    },
    onSuccess: () => {
      toast.success(postId ? 'Đã cập nhật bài viết.' : 'Đăng bài viết thành công!')
      qc.invalidateQueries({ queryKey: ['group-posts', gid] })
      qc.invalidateQueries({ queryKey: ['group-post', gid] })
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const add = async () => {
    const picked = await pickImage(true)
    if (!picked.length) return
    setUploading(true)
    try { const urls = await Promise.all(picked.map((p) => uploadImage(p, 'posts'))); setImages((x) => [...x, ...urls]) }
    catch (e) { toast.error(errMsg(e)) } finally { setUploading(false) }
  }

  return (
    <Screen>
      <Header title={postId ? 'Sửa bài viết' : 'Đăng bài trong nhóm'} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Input value={content} onChangeText={setContent} multiline placeholder="Chia sẻ với nhóm..." error={error} />
        <Input label="Chủ đề (tùy chọn)" value={topic} onChangeText={setTopic} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {images.map((u) => (
            <View key={u}>
              <Image source={{ uri: u }} style={{ width: 90, height: 90, borderRadius: 10 }} contentFit="cover" />
              <Pressable onPress={() => setImages((x) => x.filter((i) => i !== u))} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 2 }}><X size={14} color="#fff" /></Pressable>
            </View>
          ))}
        </View>
        <Button title="Thêm ảnh" variant="outline" onPress={add} loading={uploading} style={{ marginBottom: 12 }} />
        <Button title={postId ? 'Lưu thay đổi' : 'Đăng bài'} loading={m.isPending} disabled={uploading} onPress={() => { if (!content.trim()) return setError('Nội dung bài viết không được để trống'); setError(''); m.mutate() }} />
      </ScrollView>
    </Screen>
  )
}
