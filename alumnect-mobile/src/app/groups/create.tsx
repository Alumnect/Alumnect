import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Chip, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { GROUP_CATEGORIES, groupApi } from '@/api/groups'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'

const parseTopics = (text: string) => Array.from(new Set(text.split(',').map((s) => s.trim()).filter(Boolean)))

/** UC115 tạo / UC116 sửa nhóm (truyền `id` để sửa). */
export default function GroupFormScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const existing = useQuery({ queryKey: ['group', id], queryFn: () => groupApi.get(id!), enabled: !!id })
  const [f, setF] = useState({ name: '', description: '', joinRules: '', topics: '' })
  const [category, setCategory] = useState('other')
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [cover, setCover] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const g = existing.data
  if (g && !loaded) {
    setLoaded(true)
    setF({ name: g.name, description: g.description, joinRules: g.joinRules ?? '', topics: g.topics.join(', ') })
    setCategory(g.category); setPrivacy(g.privacy); setCover(g.coverImageUrl)
  }
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const m = useMutation({
    mutationFn: () => {
      const input = { name: f.name.trim(), description: f.description.trim(), category, topics: parseTopics(f.topics), privacy, joinRules: f.joinRules.trim() || null, coverImageUrl: cover }
      return id ? groupApi.update(Number(id), input) : groupApi.create(input)
    },
    onSuccess: (res) => {
      toast.success(id ? 'Đã cập nhật nhóm.' : 'Tạo nhóm thành công!')
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['group', String(res.id)] })
      if (id) router.back()
      else router.replace({ pathname: '/groups/[id]', params: { id: String(res.id) } })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const pickCover = async () => {
    const [img] = await pickImage()
    if (!img) return
    setUploading(true)
    try { setCover(await uploadImage(img, 'common')) } catch (e) { toast.error(errMsg(e)) } finally { setUploading(false) }
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.name.trim()) e.name = 'Vui lòng nhập tên hội nhóm'
    else if (f.name.length > 200) e.name = 'Tên tối đa 200 ký tự'
    if (!f.description.trim()) e.description = 'Vui lòng nhập mô tả hội nhóm'
    else if (f.description.length > 5000) e.description = 'Mô tả tối đa 5000 ký tự'
    if (f.joinRules.length > 2000) e.joinRules = 'Quy định tối đa 2000 ký tự'
    const topics = parseTopics(f.topics)
    if (topics.length > 5) e.topics = 'Chỉ được nhập tối đa 5 chủ đề'
    else if (topics.some((x) => x.length > 50)) e.topics = 'Mỗi chủ đề tối đa 50 ký tự'
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  if (id && existing.isLoading) return <Screen><Header title="Cập nhật nhóm" /><Loading /></Screen>
  if (id && !g) return <Screen><Header title="Cập nhật nhóm" /><Empty text="Không tìm thấy nhóm." error={existing.error} onRetry={() => { void existing.refetch() }} /></Screen>

  return (
    <Screen keyboard>
      <Header title={id ? 'Cập nhật nhóm' : 'Tạo nhóm mới'} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {cover ? <Image source={{ uri: cover }} style={{ height: 140, borderRadius: 12, marginBottom: 8 }} contentFit="cover" /> : null}
        <Button title={cover ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'} variant="outline" onPress={pickCover} loading={uploading} style={{ marginBottom: 16 }} />
        <Input label="Tên nhóm" value={f.name} onChangeText={set('name')} error={errors.name} />
        <Input label="Mô tả" value={f.description} onChangeText={set('description')} multiline error={errors.description} />
        <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Danh mục</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 14 }}>
          {GROUP_CATEGORIES.map((c) => <Chip key={c.value} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} />)}
        </View>
        <Input label="Chủ đề (cách nhau bằng dấu phẩy)" value={f.topics} onChangeText={set('topics')} error={errors.topics} />
        <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Quyền riêng tư</Txt>
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          <Chip label="Công khai" active={privacy === 'PUBLIC'} onPress={() => setPrivacy('PUBLIC')} />
          <Chip label="Riêng tư (cần duyệt)" active={privacy === 'PRIVATE'} onPress={() => setPrivacy('PRIVATE')} />
        </View>
        <Input label="Quy định nhóm" value={f.joinRules} onChangeText={set('joinRules')} multiline error={errors.joinRules} />
        <Button title={id ? 'Lưu thay đổi' : 'Tạo nhóm'} onPress={submit} loading={m.isPending} disabled={uploading} />
      </ScrollView>
    </Screen>
  )
}
