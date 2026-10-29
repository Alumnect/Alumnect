import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from '@/components/icons'
import { Button, Chip, Input, Screen, Txt } from './ui'
import { Header } from './Header'
import { feedApi } from '@/api/feed'
import type { CreatePostInput, Post, PostType } from '@/api/feed'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'

const TYPES: [PostType, string][] = [
  ['normal', 'Bài thường'],
  ['achievement', 'Thành tựu'],
  ['recruitment', 'Tuyển dụng'],
  ['event', 'Sự kiện'],
]
const MAX = 5000
const DRAFT_KEY = 'alumnect.draft.post'

/** Form dùng chung cho tạo (UC14) và sửa (UC22) bài viết; tự lưu nháp khi tạo mới. */
export function PostForm({ existing, initialType }: { existing?: Post; initialType?: PostType }) {
  const router = useRouter()
  const qc = useQueryClient()
  const [type, setType] = useState<PostType>(existing?.type ?? initialType ?? 'normal')
  const [content, setContent] = useState(existing?.text ?? '')
  const [media, setMedia] = useState<string[]>(existing?.images.length ? existing.images : existing?.image ? [existing.image] : [])
  const [uploading, setUploading] = useState(false)
  const [job, setJob] = useState({ title: existing?.job?.title ?? '', company: existing?.job?.company ?? '', location: existing?.job?.location ?? '', applyUrl: existing?.job?.applyUrl ?? '', salaryMin: existing?.job?.salaryMin == null ? '' : String(existing.job.salaryMin), salaryMax: existing?.job?.salaryMax == null ? '' : String(existing.job.salaryMax), contactEmail: existing?.job?.contactEmail ?? '' })
  const [ev, setEv] = useState({ title: existing?.event?.title ?? '', startTime: existing?.event?.startTime ?? '', endTime: existing?.event?.endTime ?? '', location: existing?.event?.location ?? '', capacity: existing?.event?.capacity ? String(existing.event.capacity) : '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Khôi phục / lưu nháp tự động (chỉ khi tạo mới).
  useEffect(() => {
    if (existing) return
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (!raw) return
      const d = JSON.parse(raw) as { content?: string; type?: PostType }
      if (d.content) setContent(d.content)
      if (d.type) setType(d.type)
    })
  }, [existing])
  useEffect(() => {
    if (existing) return
    const id = setTimeout(() => {
      if (content || type !== 'normal') AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ content, type })).catch(() => {})
    }, 600)
    return () => clearTimeout(id)
  }, [content, type, existing])

  const mutation = useMutation({
    mutationFn: (input: CreatePostInput) => (existing ? feedApi.editPost(existing.id, input) : feedApi.createPost(input)),
    onSuccess: () => {
      toast.success(existing ? 'Cập nhật bài viết thành công!' : 'Đăng bài viết thành công!')
      if (!existing) AsyncStorage.removeItem(DRAFT_KEY).catch(() => {})
      qc.invalidateQueries({ queryKey: ['feed'] })
      if (existing) qc.invalidateQueries({ queryKey: ['post', existing.id] })
      if (existing?.eventId) qc.invalidateQueries({ queryKey: ['event-detail', existing.eventId] })
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const addImages = async () => {
    const picked = await pickImage(true)
    if (!picked.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(picked.slice(0, 10 - media.length).map((p) => uploadImage(p, 'posts')))
      setMedia((m) => [...m, ...urls])
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const submit = () => {
    const e: Record<string, string> = {}
    const text = content.trim()
    if (text.length > MAX) e.content = `Nội dung bài viết không được vượt quá ${MAX} ký tự`
    if (type === 'normal' && !text) e.content = 'Nội dung bài viết không được để trống'
    if (type === 'recruitment') {
      if (!job.title.trim()) e.jobTitle = 'Bắt buộc nhập chức danh'
      if (!job.company.trim()) e.jobCompany = 'Bắt buộc nhập công ty'
      for (const field of ['salaryMin', 'salaryMax'] as const) if (job[field] && (!Number.isFinite(Number(job[field])) || Number(job[field]) < 0)) e[field] = 'Mức lương phải là số không âm'
      if (job.salaryMin && job.salaryMax && Number(job.salaryMin) > Number(job.salaryMax)) e.salaryMax = 'Lương tối đa phải lớn hơn hoặc bằng tối thiểu'
      if (job.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.contactEmail.trim())) e.contactEmail = 'Email liên hệ không hợp lệ'
    }
    if (type === 'event') {
      if (!ev.title.trim()) e.evTitle = 'Bắt buộc nhập tên sự kiện'
      if (!ev.startTime.trim() || isNaN(Date.parse(ev.startTime))) e.evStart = 'Bắt buộc nhập thời gian bắt đầu (VD: 2026-12-31T18:00:00)'
      else if (ev.endTime && Date.parse(ev.endTime) <= Date.parse(ev.startTime)) e.evEnd = 'Ngày kết thúc phải sau ngày bắt đầu'
      if (ev.capacity && Number(ev.capacity) < 1) e.evCap = 'Sức chứa tối thiểu là 1 người'
    }
    setErrors(e)
    if (Object.keys(e).length) return
    const input: CreatePostInput = { content: text, type, mediaUrls: media }
    if (type === 'recruitment') input.job = {
      title: job.title.trim(), company: job.company.trim(), location: job.location || undefined, applyUrl: job.applyUrl || undefined,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
      contactEmail: job.contactEmail.trim() || undefined,
    }
    if (type === 'event') input.event = { title: ev.title.trim(), startTime: ev.startTime, endTime: ev.endTime || undefined, location: ev.location || undefined, capacity: ev.capacity ? Number(ev.capacity) : undefined }
    mutation.mutate(input)
  }

  return (
    <Screen>
      <Header title={existing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
            {TYPES.map(([k, l]) => (
              <Chip key={k} label={l} active={type === k} onPress={() => setType(k)} />
            ))}
          </View>
          <Input value={content} onChangeText={setContent} multiline placeholder="Bạn đang nghĩ gì?" error={errors.content} />
          <Txt muted size={12} style={{ textAlign: 'right', marginTop: -8, marginBottom: 12 }}>{content.length}/{MAX}</Txt>

          {type === 'recruitment' ? (
            <>
              <Input label="Chức danh" value={job.title} onChangeText={(v) => setJob({ ...job, title: v })} error={errors.jobTitle} />
              <Input label="Công ty" value={job.company} onChangeText={(v) => setJob({ ...job, company: v })} error={errors.jobCompany} />
              <Input label="Địa điểm" value={job.location} onChangeText={(v) => setJob({ ...job, location: v })} />
              <Input label="Lương tối thiểu (VND)" value={job.salaryMin} onChangeText={(v) => setJob({ ...job, salaryMin: v.replace(/\D/g, '') })} keyboardType="number-pad" error={errors.salaryMin} />
              <Input label="Lương tối đa (VND)" value={job.salaryMax} onChangeText={(v) => setJob({ ...job, salaryMax: v.replace(/\D/g, '') })} keyboardType="number-pad" error={errors.salaryMax} />
              <Input label="Email liên hệ" value={job.contactEmail} onChangeText={(v) => setJob({ ...job, contactEmail: v })} keyboardType="email-address" autoCapitalize="none" maxLength={255} error={errors.contactEmail} />
              <Input label="Link ứng tuyển" value={job.applyUrl} onChangeText={(v) => setJob({ ...job, applyUrl: v })} autoCapitalize="none" />
            </>
          ) : null}
          {type === 'event' ? (
            <>
              <Input label="Tên sự kiện" value={ev.title} onChangeText={(v) => setEv({ ...ev, title: v })} error={errors.evTitle} />
              <Input label="Bắt đầu (ISO)" value={ev.startTime} onChangeText={(v) => setEv({ ...ev, startTime: v })} autoCapitalize="none" placeholder="2026-12-31T18:00:00" error={errors.evStart} />
              <Input label="Kết thúc (ISO)" value={ev.endTime} onChangeText={(v) => setEv({ ...ev, endTime: v })} autoCapitalize="none" error={errors.evEnd} />
              <Input label="Địa điểm" value={ev.location} onChangeText={(v) => setEv({ ...ev, location: v })} />
              <Input label="Sức chứa" value={ev.capacity} onChangeText={(v) => setEv({ ...ev, capacity: v.replace(/\D/g, '') })} keyboardType="number-pad" error={errors.evCap} />
            </>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {media.map((u) => (
              <View key={u}>
                <Image source={{ uri: u }} style={{ width: 90, height: 90, borderRadius: 10 }} contentFit="cover" />
                <Pressable onPress={() => setMedia((m) => m.filter((x) => x !== u))} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 2 }}>
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
          <Button title="Thêm ảnh" variant="outline" onPress={addImages} loading={uploading} disabled={media.length >= 10} style={{ marginBottom: 12 }} />
          <Button title={existing ? 'Lưu thay đổi' : 'Đăng bài'} onPress={submit} loading={mutation.isPending} disabled={uploading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
