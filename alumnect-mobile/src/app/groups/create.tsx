import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from '@/components/icons'
import { Button, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { withGroupsAlumniOnly } from '@/components/GroupsAlumniOnly'
import { GROUP_CATEGORIES, groupApi, parseTopics } from '@/api/groups'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { useTheme } from '@/theme'
import { BrandIcon } from '@/components/BrandIcon'
import { MotionPressable } from '@/components/Motion'
import { FormSection } from '@/components/SocialUI'
import { BottomBar } from '@/components/DetailBits'
import { SelectField } from '@/components/SelectField'

/** Giới hạn đồng bộ với validation của Backend và web. */
const NAME_MAX = 200
const DESCRIPTION_MAX = 5000
const RULES_MAX = 2000
const TOPIC_MAX_LENGTH = 50
const MAX_TOPICS = 5

/** UC115 tạo / UC116 sửa nhóm (truyền `id` để sửa). */
function GroupFormScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const existing = useQuery({ queryKey: ['group', id], queryFn: () => groupApi.get(id!), enabled: !!id })
  const [f, setF] = useState({ name: '', description: '', joinRules: '' })
  const [category, setCategory] = useState<string | null>(null)
  const [topics, setTopics] = useState<string[]>([])
  const [topicInput, setTopicInput] = useState('')
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [cover, setCover] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const g = existing.data
  if (g && !loaded) {
    setLoaded(true)
    setF({ name: g.name, description: g.description, joinRules: g.joinRules ?? '' })
    setTopics(g.topics)
    setCategory(g.category); setPrivacy(g.privacy); setCover(g.coverImageUrl)
  }
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  /** Thêm các chủ đề vừa nhập (cho phép nhập nhiều chủ đề ngăn bằng dấu phẩy), bỏ trùng không phân biệt hoa thường. */
  const addTopics = (raw = topicInput): string[] | null => {
    const next = [...topics]
    for (const c of parseTopics(raw)) if (!next.some((x) => x.toLowerCase() === c.toLowerCase())) next.push(c)
    if (next.length > MAX_TOPICS) { setErrors((e) => ({ ...e, topics: `Chỉ được nhập tối đa ${MAX_TOPICS} chủ đề` })); return null }
    if (next.some((x) => x.length > TOPIC_MAX_LENGTH)) { setErrors((e) => ({ ...e, topics: `Mỗi chủ đề tối đa ${TOPIC_MAX_LENGTH} ký tự` })); return null }
    setErrors((e) => ({ ...e, topics: '' }))
    setTopics(next)
    setTopicInput('')
    return next
  }

  const m = useMutation({
    mutationFn: (finalTopics: string[]) => {
      const input = { name: f.name.trim(), description: f.description.trim(), category: category!, topics: finalTopics, privacy, joinRules: f.joinRules.trim() || null, coverImageUrl: cover }
      return id ? groupApi.update(Number(id), input) : groupApi.create(input)
    },
    onSuccess: (res) => {
      toast.success(id ? 'Đã cập nhật hội nhóm.' : 'Tạo hội nhóm thành công!')
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
    else if (f.name.trim().length > NAME_MAX) e.name = `Tên tối đa ${NAME_MAX} ký tự`
    if (!f.description.trim()) e.description = 'Vui lòng nhập mô tả hội nhóm'
    else if (f.description.trim().length > DESCRIPTION_MAX) e.description = `Mô tả tối đa ${DESCRIPTION_MAX} ký tự`
    if (!category) e.category = 'Vui lòng chọn danh mục'
    if (f.joinRules.length > RULES_MAX) e.joinRules = `Quy định tối đa ${RULES_MAX} ký tự`
    // Chủ đề đang gõ dở cũng được thêm khi bấm lưu (giống web).
    const finalTopics = topicInput.trim() ? addTopics() : topics
    if (!finalTopics) return
    setErrors((prev) => ({ ...e, topics: prev.topics ?? '' }))
    if (Object.keys(e).length) return
    m.mutate(finalTopics)
  }

  if (id && existing.isLoading) return <Screen><Header title="Chỉnh sửa hội nhóm" /><Loading /></Screen>
  if (id && !g) return <Screen><Header title="Chỉnh sửa hội nhóm" /><Empty text="Không tìm thấy nhóm." error={existing.error} onRetry={() => { void existing.refetch() }} /></Screen>

  return (
    <Screen keyboard>
      <Header title={id ? 'Chỉnh sửa hội nhóm' : 'Tạo hội nhóm mới'} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <MotionPressable accessibilityRole="button" accessibilityLabel={cover ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'} disabled={uploading} onPress={pickCover} style={{ minHeight: 172, borderRadius: 22, overflow: 'hidden', backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: cover ? 8 : 20 }}>
          {cover ? <Image source={{ uri: cover }} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" transition={180} /> : <BrandIcon name="people" size={64} />}
          <View style={{ backgroundColor: t.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}><Txt weight="600" size={13}>{uploading ? 'Đang tải ảnh...' : cover ? 'Đổi ảnh bìa' : 'Thêm ảnh bìa cho nhóm'}</Txt></View>
          {!cover ? <Txt muted size={12}>Một nơi dành cho những người cùng sở thích</Txt> : null}
        </MotionPressable>
        {cover ? <Button title="Gỡ ảnh bìa" variant="ghost" size="sm" disabled={uploading} onPress={() => setCover(null)} style={{ alignSelf: 'flex-end', marginBottom: 12 }} /> : null}
        <FormSection icon="people2" title="Nhóm của bạn" caption="01 · Tạo dấu ấn riêng cho cộng đồng">
          <Input label="Tên nhóm *" placeholder="Bạn muốn gọi cộng đồng là gì?" value={f.name} onChangeText={set('name')} error={errors.name} maxLength={NAME_MAX} />
          <Input label="Giới thiệu nhóm *" placeholder="Chia sẻ điều kết nối mọi người trong nhóm..." value={f.description} onChangeText={set('description')} multiline error={errors.description} maxLength={DESCRIPTION_MAX} />
          <SelectField label="Danh mục *" placeholder="Chọn danh mục hoạt động" value={category} options={[...GROUP_CATEGORIES]} onChange={setCategory} clearable={false} error={errors.category} />
          <Txt weight="500" size={14} style={{ marginBottom: 8 }}>{`Chủ đề · Tối đa ${MAX_TOPICS}`}</Txt>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Input placeholder="VD: Thiết kế, Portfolio" value={topicInput} onChangeText={setTopicInput} onSubmitEditing={() => addTopics()} returnKeyType="done" maxLength={TOPIC_MAX_LENGTH * MAX_TOPICS} error={errors.topics || undefined} />
            </View>
            <Button title="Thêm" variant="outline" size="sm" disabled={!topicInput.trim() || topics.length >= MAX_TOPICS} onPress={() => addTopics()} style={{ minHeight: 50 }} />
          </View>
          {topics.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {topics.map((tp) => (
                <View key={tp} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 12, borderRadius: 16, backgroundColor: t.primaryTint }}>
                  <Txt size={13} weight="600" color={t.primary}>{`#${tp}`}</Txt>
                  <Pressable onPress={() => setTopics((x) => x.filter((v) => v !== tp))} accessibilityRole="button" accessibilityLabel={`Xóa chủ đề ${tp}`} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} color={t.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : <Txt muted size={12} style={{ marginBottom: 8 }}>Thêm chủ đề để mọi người dễ tìm thấy nhóm và lọc bài viết.</Txt>}
        </FormSection>
        <FormSection icon="world" title="Không gian kết nối" caption="02 · Chọn cách mọi người tham gia">
          {(['PUBLIC', 'PRIVATE'] as const).map((value) => <MotionPressable key={value} onPress={() => setPrivacy(value)} accessibilityRole="radio" accessibilityState={{ checked: privacy === value }} style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: privacy === value ? t.primary : t.border, backgroundColor: privacy === value ? t.primaryTint : t.card, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ flex: 1 }}><Txt weight="600" size={14}>{value === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</Txt><Txt muted size={12}>{value === 'PUBLIC' ? 'Mọi người có thể tham gia nhóm.' : 'Yêu cầu tham gia cần được phê duyệt.'}</Txt></View>
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: privacy === value ? 6 : 1.5, borderColor: privacy === value ? t.primary : t.controlBorder }} />
          </MotionPressable>)}
          <View style={{ height: 8 }} />
          <Input label="Quy định nhóm · Không bắt buộc" placeholder="Những điều thành viên cần biết..." value={f.joinRules} onChangeText={set('joinRules')} multiline error={errors.joinRules} maxLength={RULES_MAX} />
        </FormSection>
      </ScrollView>
      <BottomBar><Button title={id ? 'Lưu thay đổi' : 'Tạo hội nhóm'} variant="brand" onPress={submit} loading={m.isPending} disabled={uploading} style={{ flex: 1 }} /></BottomBar>
    </Screen>
  )
}

export default withGroupsAlumniOnly(GroupFormScreen)
