import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { GROUP_CATEGORIES, groupApi } from '@/api/groups'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { useTheme } from '@/theme'
import { BrandIcon } from '@/components/BrandIcon'
import { MotionPressable } from '@/components/Motion'
import { FormSection } from '@/components/SocialUI'
import { BottomBar } from '@/components/DetailBits'
import { SelectField } from '@/components/SelectField'

const parseTopics = (text: string) => Array.from(new Set(text.split(',').map((s) => s.trim()).filter(Boolean)))

/** UC115 tạo / UC116 sửa nhóm (truyền `id` để sửa). */
export default function GroupFormScreen() {
  const t = useTheme()
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
        <MotionPressable accessibilityRole="button" accessibilityLabel={cover ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'} disabled={uploading} onPress={pickCover} style={{ minHeight: 172, borderRadius: 22, overflow: 'hidden', backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {cover ? <Image source={{ uri: cover }} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" transition={180} /> : <BrandIcon name="people" size={64} />}
          <View style={{ backgroundColor: t.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}><Txt weight="600" size={13}>{uploading ? 'Đang tải ảnh...' : cover ? 'Đổi ảnh bìa' : 'Thêm ảnh bìa cho nhóm'}</Txt></View>
          {!cover ? <Txt muted size={12}>Một nơi dành cho những người cùng sở thích</Txt> : null}
        </MotionPressable>
        <FormSection icon="people2" title="Nhóm của bạn" caption="01 · Tạo dấu ấn riêng cho cộng đồng">
          <Input label="Tên nhóm *" placeholder="Bạn muốn gọi cộng đồng là gì?" value={f.name} onChangeText={set('name')} error={errors.name} maxLength={200} />
          <Input label="Giới thiệu nhóm *" placeholder="Chia sẻ điều kết nối mọi người trong nhóm..." value={f.description} onChangeText={set('description')} multiline error={errors.description} />
          <SelectField label="Danh mục" value={category} options={[...GROUP_CATEGORIES]} onChange={(v) => setCategory(v ?? 'other')} clearable={false} />
          <Input label="Chủ đề · Tối đa 5" placeholder="Thiết kế, chia sẻ nghề, portfolio" value={f.topics} onChangeText={set('topics')} error={errors.topics} />
          <Txt muted size={12}>Ngăn cách các chủ đề bằng dấu phẩy để mọi người dễ tìm thấy nhóm.</Txt>
        </FormSection>
        <FormSection icon="world" title="Không gian kết nối" caption="02 · Chọn cách mọi người tham gia">
          {(['PUBLIC', 'PRIVATE'] as const).map((value) => <MotionPressable key={value} onPress={() => setPrivacy(value)} accessibilityRole="radio" accessibilityState={{ checked: privacy === value }} style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: privacy === value ? t.primary : t.border, backgroundColor: privacy === value ? t.primaryTint : t.card, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ flex: 1 }}><Txt weight="600" size={14}>{value === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</Txt><Txt muted size={12}>{value === 'PUBLIC' ? 'Mọi người có thể tham gia nhóm.' : 'Yêu cầu tham gia cần được phê duyệt.'}</Txt></View>
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: privacy === value ? 6 : 1.5, borderColor: privacy === value ? t.primary : t.controlBorder }} />
          </MotionPressable>)}
          <View style={{ height: 8 }} />
          <Input label="Quy định nhóm · Không bắt buộc" placeholder="Những điều thành viên cần biết..." value={f.joinRules} onChangeText={set('joinRules')} multiline error={errors.joinRules} />
        </FormSection>
      </ScrollView>
      <BottomBar><Button title={id ? 'Lưu thay đổi' : 'Tạo nhóm mới'} variant="brand" onPress={submit} loading={m.isPending} disabled={uploading} style={{ flex: 1 }} /></BottomBar>
    </Screen>
  )
}
