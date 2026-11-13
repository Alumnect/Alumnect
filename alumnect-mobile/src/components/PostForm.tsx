import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Text, TextInput } from '@/components/AppText'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  Globe,
  ImagePlus,
  Link2,
  MapPin,
  Sparkles,
  Users,
  X,
} from '@/components/icons'
import { BrandIcon, type BrandIconName } from '@/components/BrandIcon'
import { DateField } from '@/components/DateField'
import { PlaceField } from './PlaceField'
import { PostAiStudioPanel } from './PostAiStudioPanel'
import { Avatar, Button, Input, Screen, Txt } from './ui'
import { Header } from './Header'
import { feedApi } from '@/api/feed'
import type { CreatePostInput, Post, PostType } from '@/api/feed'
import type { GeocodedPlace } from '@/lib/places'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import { radius, useTheme } from '@/theme'

type TypeConfig = {
  type: PostType
  label: string
  icon: BrandIconName
  subtitle: string
  placeholder: string
}

const TYPE_CONFIGS: TypeConfig[] = [
  {
    type: 'normal',
    label: 'Bài thường',
    icon: 'chat',
    subtitle: 'Thảo luận',
    placeholder: 'Bạn đang nghĩ gì? Chia sẻ câu chuyện, kinh nghiệm hoặc gửi câu hỏi đến cộng đồng cựu sinh viên...',
  },
  {
    type: 'achievement',
    label: 'Thành tựu',
    icon: 'task',
    subtitle: 'Vinh danh',
    placeholder: 'Bạn vừa đạt được cột mốc đáng tự hào nào? Chia sẻ niềm vui, bài học và gửi lời cảm ơn...',
  },
  {
    type: 'recruitment',
    label: 'Tuyển dụng',
    icon: 'suitcase',
    subtitle: 'Việc làm',
    placeholder: 'Mô tả cơ hội nghề nghiệp, văn hóa công ty, chế độ đãi ngộ và lộ trình phát triển cho ứng viên...',
  },
  {
    type: 'event',
    label: 'Sự kiện',
    icon: 'calendar',
    subtitle: 'Workshop & Gặp gỡ',
    placeholder: 'Giới thiệu thông điệp sự kiện, nội dung chương trình, các khách mời hoặc diễn giả đặc biệt...',
  },
]

const MAX = 5000
const DRAFT_KEY = 'alumnect.draft.post'

/**
 * Form tạo và chỉnh sửa bài viết (UC14, UC22).
 * Thiết kế giao diện hiện đại tham khảo Kakao & Instagram, tích hợp bộ minh hoạ Meetup BrandIcon.
 */
export function PostForm({ existing, initialType }: { existing?: Post; initialType?: PostType }) {
  const router = useRouter()
  const qc = useQueryClient()
  const theme = useTheme()
  const { user } = useAuthStore()

  const [type, setType] = useState<PostType>(existing?.type ?? initialType ?? 'normal')
  const [content, setContent] = useState(existing?.text ?? '')
  const [media, setMedia] = useState<string[]>(
    existing?.images.length ? existing.images : existing?.image ? [existing.image] : []
  )
  const [uploading, setUploading] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)

  const [job, setJob] = useState({
    title: existing?.job?.title ?? '',
    company: existing?.job?.company ?? '',
    location: existing?.job?.location ?? '',
    applyUrl: existing?.job?.applyUrl ?? '',
    salaryMin: existing?.job?.salaryMin == null ? '' : String(existing.job.salaryMin),
    salaryMax: existing?.job?.salaryMax == null ? '' : String(existing.job.salaryMax),
    contactEmail: existing?.job?.contactEmail ?? '',
  })

  const [ev, setEv] = useState({
    title: existing?.event?.title ?? '',
    startTime: existing?.event?.startTime ?? '',
    endTime: existing?.event?.endTime ?? '',
    location: existing?.event?.location ?? '',
    capacity: existing?.event?.capacity ? String(existing.event.capacity) : '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [jobPlace, setJobPlace] = useState<GeocodedPlace | null>(null)
  const [evPlace, setEvPlace] = useState<GeocodedPlace | null>(null)

  // Khôi phục nháp (chỉ khi tạo mới)
  useEffect(() => {
    if (existing) return
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (!raw) return
      try {
        const d = JSON.parse(raw) as { content?: string; type?: PostType }
        if (d.content) setContent(d.content)
        if (d.type) setType(d.type)
      } catch {}
    })
  }, [existing])

  // Tự động lưu nháp
  useEffect(() => {
    if (existing) return
    const id = setTimeout(() => {
      if (content || type !== 'normal') {
        AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ content, type }))
          .then(() => setDraftSaved(true))
          .catch(() => {})
      }
    }, 600)
    return () => clearTimeout(id)
  }, [content, type, existing])

  const mutation = useMutation({
    mutationFn: (input: CreatePostInput) =>
      existing ? feedApi.editPost(existing.id, input) : feedApi.createPost(input),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      toast.success(existing ? 'Cập nhật bài viết thành công!' : 'Đăng bài viết thành công!')
      if (!existing) AsyncStorage.removeItem(DRAFT_KEY).catch(() => {})
      qc.invalidateQueries({ queryKey: ['feed'] })
      if (existing) qc.invalidateQueries({ queryKey: ['post', existing.id] })
      if (existing?.eventId) qc.invalidateQueries({ queryKey: ['event-detail', existing.eventId] })
      router.back()
    },
    onError: (e) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      toast.error(errMsg(e))
    },
  })

  const addImages = async () => {
    const picked = await pickImage(true)
    if (!picked.length) return
    setUploading(true)
    try {
      const remaining = 10 - media.length
      const urls = await Promise.all(
        picked.slice(0, remaining).map((p) => uploadImage(p, 'posts'))
      )
      setMedia((m) => [...m, ...urls])
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    setMedia((m) => m.filter((x) => x !== url))
  }

  const handleSelectType = (newType: PostType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setType(newType)
    setDraftSaved(false)
  }

  const submit = () => {
    const e: Record<string, string> = {}
    const text = content.trim()

    if (text.length > MAX) {
      e.content = `Nội dung bài viết không được vượt quá ${MAX} ký tự`
    }
    if (type === 'normal' && !text && media.length === 0) {
      e.content = 'Nội dung bài viết hoặc hình ảnh không được để trống'
    }
    if (type === 'recruitment') {
      if (!job.title.trim()) e.jobTitle = 'Bắt buộc nhập chức danh'
      if (!job.company.trim()) e.jobCompany = 'Bắt buộc nhập tên công ty'
      for (const field of ['salaryMin', 'salaryMax'] as const) {
        if (job[field] && (!Number.isFinite(Number(job[field])) || Number(job[field]) < 0)) {
          e[field] = 'Mức lương phải là số không âm'
        }
      }
      if (job.salaryMin && job.salaryMax && Number(job.salaryMin) > Number(job.salaryMax)) {
        e.salaryMax = 'Lương tối đa phải lớn hơn hoặc bằng tối thiểu'
      }
      if (job.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.contactEmail.trim())) {
        e.contactEmail = 'Email liên hệ không hợp lệ'
      }
    }
    if (type === 'event') {
      if (!ev.title.trim()) e.evTitle = 'Bắt buộc nhập tên sự kiện'
      if (!ev.startTime.trim() || isNaN(Date.parse(ev.startTime))) {
        e.evStart = 'Bắt buộc chọn thời gian bắt đầu sự kiện'
      } else if (ev.endTime && Date.parse(ev.endTime) <= Date.parse(ev.startTime)) {
        e.evEnd = 'Thời gian kết thúc phải sau thời gian bắt đầu'
      }
      if (ev.capacity && Number(ev.capacity) < 1) {
        e.evCap = 'Sức chứa tối thiểu là 1 người'
      }
    }

    setErrors(e)
    if (Object.keys(e).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
      return
    }

    const input: CreatePostInput = { content: text, type, mediaUrls: media }
    if (type === 'recruitment') {
      input.job = {
        title: job.title.trim(),
        company: job.company.trim(),
        location: job.location.trim() || undefined,
        applyUrl: job.applyUrl.trim() || undefined,
        salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
        salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
        contactEmail: job.contactEmail.trim() || undefined,
      }
    }
    if (type === 'event') {
      input.event = {
        title: ev.title.trim(),
        startTime: ev.startTime,
        endTime: ev.endTime || undefined,
        location: ev.location.trim() || undefined,
        capacity: ev.capacity ? Number(ev.capacity) : undefined,
      }
    }

    mutation.mutate(input)
  }

  const currentConfig = TYPE_CONFIGS.find((c) => c.type === type) ?? TYPE_CONFIGS[0]
  const isReadyToPost =
    (content.trim().length > 0 || media.length > 0 || (type === 'recruitment' && job.title.trim()) || (type === 'event' && ev.title.trim())) &&
    !uploading &&
    !mutation.isPending

  return (
    <Screen keyboard bg={theme.bg}>
      {/* 1. Header (Instagram & Kakao style): Nút hành động nổi bật ở góc phải */}
      <Header
        title={existing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết'}
        right={
          <Pressable
            onPress={submit}
            disabled={!isReadyToPost}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isReadyToPost ? theme.primary : theme.inputBg,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: radius.full,
              minHeight: 36,
              opacity: pressed ? 0.8 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel={existing ? 'Lưu thay đổi' : 'Đăng bài'}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={{
                  color: isReadyToPost ? '#fff' : theme.textSubtle,
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                {existing ? 'Lưu' : 'Đăng'}
              </Text>
            )}
          </Pressable>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Thông tin tác giả & Quyền riêng tư (Instagram / Kakao style) */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 10,
              backgroundColor: theme.card,
            }}
          >
            <Avatar uri={user?.avatarUrl} name={user?.name ?? 'Bạn'} size={44} ring />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                {user?.name ?? 'Bạn'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: theme.surface,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: radius.sm,
                  }}
                >
                  <Globe size={12} color={theme.textMuted} />
                  <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '500' }}>
                    Công khai trong Alumnect
                  </Text>
                </View>
                {draftSaved && !existing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <CheckCircle2 size={12} color={theme.success} />
                    <Text style={{ fontSize: 11, color: theme.success, fontWeight: '500' }}>
                      Đã lưu nháp
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* 3. Phân loại bài viết với Meetup Brand Icons (Kakao horizontal picker) */}
          <View
            style={{
              backgroundColor: theme.card,
              paddingBottom: 14,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.border,
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            >
              {TYPE_CONFIGS.map((item) => {
                const isSelected = type === item.type
                return (
                  <Pressable
                    key={item.type}
                    onPress={() => handleSelectType(item.type)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: radius.full,
                      backgroundColor: isSelected
                        ? theme.isDark
                          ? '#342116'
                          : '#FFF4EE'
                        : theme.inputBg,
                      borderWidth: 1.5,
                      borderColor: isSelected ? theme.primary : 'transparent',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <BrandIcon name={item.icon} size={22} />
                    <View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? '700' : '600',
                          color: isSelected ? theme.primary : theme.text,
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          {/* 4. Khung nhập nội dung bài viết không viền (Instagram style borderless canvas) */}
          <View style={{ backgroundColor: theme.card, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
            <TextInput
              value={content}
              onChangeText={(text) => {
                setContent(text)
                if (draftSaved) setDraftSaved(false)
                if (errors.content) setErrors((prev) => ({ ...prev, content: '' }))
              }}
              multiline
              placeholder={currentConfig.placeholder}
              placeholderTextColor={theme.textSubtle}
              selectionColor={theme.primary}
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: theme.text,
                minHeight: 120,
                textAlignVertical: 'top',
                paddingTop: 4,
                paddingBottom: 12,
              }}
            />

            {/* Bộ đếm ký tự & Thông báo lỗi */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              {errors.content ? (
                <Text style={{ color: theme.danger, fontSize: 12, flex: 1 }}>{errors.content}</Text>
              ) : (
                <View />
              )}
              <Text
                style={{
                  fontSize: 12,
                  color: content.length > MAX ? theme.danger : theme.textMuted,
                  fontWeight: content.length > MAX ? '600' : '400',
                }}
              >
                {content.length}/{MAX}
              </Text>
            </View>
          </View>

          {/* 5. Bộ sưu tập hình ảnh đính kèm (Instagram carousel preview) */}
          <View style={{ backgroundColor: theme.card, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }}>
            {media.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              >
                {media.map((uri, idx) => (
                  <View
                    key={uri}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: radius.md,
                      overflow: 'hidden',
                      position: 'relative',
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: theme.border,
                    }}
                  >
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    <Pressable
                      onPress={() => removeImage(uri)}
                      style={({ pressed }) => ({
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      })}
                      accessibilityLabel="Xóa ảnh"
                    >
                      <X size={14} color="#fff" />
                    </Pressable>
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 4,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: radius.sm,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                        {idx + 1}
                      </Text>
                    </View>
                  </View>
                ))}

                {media.length < 10 && (
                  <Pressable
                    onPress={addImages}
                    disabled={uploading}
                    style={({ pressed }) => ({
                      width: 100,
                      height: 100,
                      borderRadius: radius.md,
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: theme.controlBorder,
                      backgroundColor: theme.inputBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <>
                        <ImagePlus size={24} color={theme.textMuted} />
                        <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textMuted }}>
                          Thêm ảnh
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.textSubtle }}>
                          {media.length}/10
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </ScrollView>
            ) : (
              <Pressable
                onPress={addImages}
                disabled={uploading}
                style={({ pressed }) => ({
                  marginHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: radius.md,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: theme.inputBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImagePlus size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    Đính kèm hình ảnh
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    Tối đa 10 hình ảnh chất lượng cao
                  </Text>
                </View>
                {uploading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>
                    Chọn ảnh
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          {/* 6. Thẻ cấu trúc chuyên biệt theo loại bài viết (Meetup & Kakao Card Style) */}
          {type === 'recruitment' && (
            <View
              style={{
                margin: 16,
                padding: 16,
                borderRadius: radius.lg,
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              {/* Header của thẻ Tuyển dụng */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <BrandIcon name="suitcase" size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                    Thông tin tuyển dụng
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    Cung cấp thông tin rõ ràng để thu hút ứng viên tài năng
                  </Text>
                </View>
              </View>

              {/* Các trường thông tin */}
              <Input
                label="Chức danh / Vị trí *"
                value={job.title}
                onChangeText={(v) => {
                  setJob({ ...job, title: v })
                  if (errors.jobTitle) setErrors((prev) => ({ ...prev, jobTitle: '' }))
                }}
                placeholder="VD: Senior React Native Developer, Product Designer..."
                error={errors.jobTitle}
              />

              <Input
                label="Công ty / Tổ chức *"
                value={job.company}
                onChangeText={(v) => {
                  setJob({ ...job, company: v })
                  if (errors.jobCompany) setErrors((prev) => ({ ...prev, jobCompany: '' }))
                }}
                placeholder="VD: Techcombank, FPT Software, Google..."
                error={errors.jobCompany}
              />

              <PlaceField
                label="Địa điểm làm việc"
                placeholder="VD: Fpt đà nẵng, Keangnam Hà Nội, Remote..."
                value={job.location}
                hasCoordinates={jobPlace != null}
                onChange={(val) => {
                  setJobPlace(null)
                  setJob((prev) => ({ ...prev, location: val }))
                }}
                onSelect={(place) => {
                  setJobPlace(place)
                  setJob((prev) => ({ ...prev, location: place.location }))
                }}
              />

              {/* Dải lương 2 cột */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Lương tối thiểu (VND)"
                    value={job.salaryMin}
                    onChangeText={(v) => setJob({ ...job, salaryMin: v.replace(/\D/g, '') })}
                    keyboardType="number-pad"
                    placeholder="15000000"
                    error={errors.salaryMin}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Lương tối đa (VND)"
                    value={job.salaryMax}
                    onChangeText={(v) => setJob({ ...job, salaryMax: v.replace(/\D/g, '') })}
                    keyboardType="number-pad"
                    placeholder="30000000"
                    error={errors.salaryMax}
                  />
                </View>
              </View>

              {(job.salaryMin || job.salaryMax) ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: -10,
                    marginBottom: 16,
                    paddingHorizontal: 4,
                  }}
                >
                  <Coins size={14} color={theme.primary} />
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    Dải lương:{' '}
                    <Text style={{ fontWeight: '600', color: theme.primary }}>
                      {job.salaryMin ? Number(job.salaryMin).toLocaleString('vi-VN') : '0'}
                      {' - '}
                      {job.salaryMax ? Number(job.salaryMax).toLocaleString('vi-VN') + ' VND' : 'Thoả thuận'}
                    </Text>
                  </Text>
                </View>
              ) : null}

              <Input
                label="Email liên hệ / Nhận hồ sơ"
                value={job.contactEmail}
                onChangeText={(v) => setJob({ ...job, contactEmail: v })}
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={255}
                placeholder="tuyendung@congty.com"
                error={errors.contactEmail}
              />

              <Input
                label="Link đăng ký / Ứng tuyển"
                value={job.applyUrl}
                onChangeText={(v) => setJob({ ...job, applyUrl: v })}
                autoCapitalize="none"
                placeholder="https://company.com/careers/job-detail"
              />

              {/* AI Poster Studio cho bài Tuyển dụng */}
              {!existing && (
                <PostAiStudioPanel
                  viewerName={user?.name}
                  currentType="recruitment"
                  title={job.title}
                  company={job.company}
                  location={job.location}
                  salaryMin={job.salaryMin}
                  salaryMax={job.salaryMax}
                  content={content}
                  currentMedia={media}
                  onAttachPoster={(url) => {
                    setMedia((prev) => [url, ...prev.filter((u) => u !== url)].slice(0, 10))
                  }}
                  onApplyPolishedContent={(aiText) => setContent(aiText)}
                />
              )}
            </View>
          )}

          {type === 'event' && (
            <View
              style={{
                margin: 16,
                padding: 16,
                borderRadius: radius.lg,
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              {/* Header của thẻ Sự kiện */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <BrandIcon name="calendar" size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                    Thông tin sự kiện
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    Lên lịch toạ đàm, workshop hoặc giao lưu gặp gỡ
                  </Text>
                </View>
              </View>

              <Input
                label="Tên sự kiện *"
                value={ev.title}
                onChangeText={(v) => {
                  setEv({ ...ev, title: v })
                  if (errors.evTitle) setErrors((prev) => ({ ...prev, evTitle: '' }))
                }}
                placeholder="VD: Workshop: Định hướng nghề nghiệp ngành AI"
                error={errors.evTitle}
              />

              <DateField
                label="Thời gian bắt đầu *"
                value={ev.startTime}
                onChange={(iso) => {
                  setEv({ ...ev, startTime: iso })
                  if (errors.evStart) setErrors((prev) => ({ ...prev, evStart: '' }))
                }}
                error={errors.evStart}
              />

              <DateField
                label="Thời gian kết thúc (tùy chọn)"
                value={ev.endTime}
                onChange={(iso) => {
                  setEv({ ...ev, endTime: iso })
                  if (errors.evEnd) setErrors((prev) => ({ ...prev, evEnd: '' }))
                }}
                minimumDate={ev.startTime ? new Date(ev.startTime) : new Date()}
                error={errors.evEnd}
              />

              <PlaceField
                label="Địa điểm tổ chức"
                placeholder="VD: Hội trường A, Fpt đà nẵng, Zoom..."
                value={ev.location}
                hasCoordinates={evPlace != null}
                onChange={(val) => {
                  setEvPlace(null)
                  setEv((prev) => ({ ...prev, location: val }))
                }}
                onSelect={(place) => {
                  setEvPlace(place)
                  setEv((prev) => ({ ...prev, location: place.location }))
                }}
              />

              <Input
                label="Số lượng tham gia tối đa"
                value={ev.capacity}
                onChangeText={(v) => setEv({ ...ev, capacity: v.replace(/\D/g, '') })}
                keyboardType="number-pad"
                placeholder="VD: 50"
                error={errors.evCap}
              />

              {/* AI Poster Studio cho bài Sự kiện */}
              {!existing && (
                <PostAiStudioPanel
                  viewerName={user?.name}
                  currentType="event"
                  title={ev.title}
                  location={ev.location}
                  startTime={ev.startTime}
                  endTime={ev.endTime}
                  capacity={ev.capacity}
                  content={content}
                  currentMedia={media}
                  onAttachPoster={(url) => {
                    setMedia((prev) => [url, ...prev.filter((u) => u !== url)].slice(0, 10))
                  }}
                  onApplyPolishedContent={(aiText) => setContent(aiText)}
                />
              )}
            </View>
          )}

          {type === 'achievement' && (
            <View
              style={{
                margin: 16,
                padding: 16,
                borderRadius: radius.lg,
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <BrandIcon name="task" size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                    Tôn vinh thành tựu
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                    Hãy đính kèm hình ảnh bằng khen, chứng chỉ, kỷ niệm chương hoặc khoảnh khắc nhận giải để bài viết nổi bật và nhận nhiều lời chúc mừng hơn!
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Nút gửi ở cuối trang (Dành cho người dùng cuộn xem hết trang) */}
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <Button
              title={existing ? 'Lưu thay đổi' : 'Đăng bài viết'}
              loading={mutation.isPending}
              disabled={uploading || !isReadyToPost}
              onPress={submit}
              style={{ borderRadius: radius.full, minHeight: 48 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 7. Thanh công cụ phía dưới (Kakao & Instagram style sticky action bar) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: theme.card,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
        }}
      >
        <Pressable
          onPress={addImages}
          disabled={uploading || media.length >= 10}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: radius.full,
            backgroundColor: theme.inputBg,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ImagePlus size={18} color={theme.text} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
            {media.length > 0 ? `Ảnh (${media.length}/10)` : 'Thêm ảnh'}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <BrandIcon name={currentConfig.icon} size={20} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted }}>
            {currentConfig.label}
          </Text>
        </View>
      </View>
    </Screen>
  )
}
