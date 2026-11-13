import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from '@/components/icons'
import { Button, Input, Screen, Txt } from './ui'
import { SelectField } from './SelectField'
import { Header } from './Header'
import { forumApi } from '@/api/forum'
import type { QuestionDetail } from '@/api/forum'
import { authApi } from '@/api/auth'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'

const DRAFT_KEY = 'alumnect.draft.question'
const TITLE_MAX = 250
const BODY_MAX = 10000
const IMAGE_MAX = 5

/** Form đặt (UC37) / sửa (UC43) câu hỏi, tự lưu nháp khi đặt mới. */
export function QuestionForm({ existing }: { existing?: QuestionDetail }) {
  const router = useRouter()
  const qc = useQueryClient()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [topicId, setTopicId] = useState<number | null>(existing?.topicId ?? null)
  const [majorId, setMajorId] = useState<number | null>(existing?.majorId ?? null)
  const [images, setImages] = useState<string[]>(existing?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const topics = useQuery({ queryKey: ['forum-topics'], queryFn: forumApi.topics })
  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors })

  useEffect(() => {
    if (existing) return
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (!raw) return
      const d = JSON.parse(raw) as { title?: string; body?: string }
      if (d.title) setTitle(d.title)
      if (d.body) setBody(d.body)
    })
  }, [existing])
  useEffect(() => {
    if (existing) return
    const id = setTimeout(() => {
      if (title || body) AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body })).catch(() => {})
    }, 600)
    return () => clearTimeout(id)
  }, [title, body, existing])

  const m = useMutation({
    mutationFn: () => {
      const input = { title: title.trim(), body: body.trim(), topicId, majorId, imageUrls: images }
      return existing ? forumApi.update(existing.id, input) : forumApi.create(input)
    },
    onSuccess: (res) => {
      toast.success(existing ? 'Cập nhật câu hỏi thành công!' : 'Đặt câu hỏi thành công!')
      if (!existing) AsyncStorage.removeItem(DRAFT_KEY).catch(() => {})
      qc.invalidateQueries({ queryKey: ['forum'] })
      qc.invalidateQueries({ queryKey: ['question', res.id] })
      if (existing) router.back()
      else router.replace({ pathname: '/forum/[id]', params: { id: res.id } })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const addImages = async () => {
    const picked = await pickImage(true)
    if (!picked.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(picked.slice(0, IMAGE_MAX - images.length).map((p) => uploadImage(p, 'common')))
      setImages((x) => [...x, ...urls])
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Tiêu đề câu hỏi không được để trống'
    else if (title.trim().length > TITLE_MAX) e.title = `Tiêu đề câu hỏi không được vượt quá ${TITLE_MAX} ký tự`
    if (!body.trim()) e.body = 'Nội dung câu hỏi không được để trống'
    else if (body.trim().length > BODY_MAX) e.body = `Nội dung câu hỏi không được vượt quá ${BODY_MAX} ký tự`
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  return (
    <Screen>
      <Header title={existing ? 'Sửa câu hỏi' : 'Đặt câu hỏi'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Input label="Tiêu đề" value={title} onChangeText={setTitle} placeholder="Bạn muốn hỏi điều gì?" error={errors.title} />
          <Txt muted size={12} style={{ textAlign: 'right', marginTop: -12, marginBottom: 12 }}>{`${title.length}/${TITLE_MAX}`}</Txt>
          <Input label="Nội dung" value={body} onChangeText={setBody} multiline placeholder="Mô tả chi tiết bối cảnh để mọi người trả lời chính xác hơn..." error={errors.body} />
          <Txt muted size={12} style={{ textAlign: 'right', marginTop: -12, marginBottom: 12 }}>{`${body.length}/${BODY_MAX}`}</Txt>
          <SelectField
            label="Chủ đề"
            placeholder="Chọn chủ đề"
            value={topicId == null ? null : String(topicId)}
            options={(topics.data ?? []).map((tp) => ({ value: String(tp.id), label: tp.name }))}
            onChange={(v) => setTopicId(v == null ? null : Number(v))}
          />
          <SelectField
            label="Ngành"
            placeholder="Chọn ngành"
            value={majorId == null ? null : String(majorId)}
            options={(majors.data?.data ?? []).map((mj) => ({ value: String(mj.id), label: mj.name }))}
            onChange={(v) => setMajorId(v == null ? null : Number(v))}
          />
          {images.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {images.map((u) => (
                <View key={u}>
                  <Image source={{ uri: u }} style={{ width: 90, height: 90, borderRadius: 10 }} contentFit="cover" />
                  <Pressable onPress={() => setImages((x) => x.filter((i) => i !== u))} accessibilityRole="button" accessibilityLabel="Bỏ ảnh" hitSlop={6} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 2 }}>
                    <X size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <Button title={`Thêm ảnh (${images.length}/${IMAGE_MAX})`} variant="outline" onPress={addImages} loading={uploading} disabled={images.length >= IMAGE_MAX} style={{ marginBottom: 12 }} />
          <Button title={existing ? 'Lưu thay đổi' : 'Đăng câu hỏi'} onPress={submit} loading={m.isPending} disabled={uploading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
