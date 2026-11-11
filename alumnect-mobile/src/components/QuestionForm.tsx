import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Easing, LayoutAnimation, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Text, TextInput } from '@/components/AppText'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle2, Globe, Send, X } from '@/components/icons'
import { BrandIcon } from './BrandIcon'
import { TopicPill, topicIcon } from './ForumBits'
import { Header } from './Header'
import { Enter, MotionPressable, useReducedMotion } from './Motion'
import { SelectField } from './SelectField'
import { SkeletonBlock } from './Skeleton'
import { Avatar, Screen, Txt } from './ui'
import { forumApi } from '@/api/forum'
import type { QuestionDetail } from '@/api/forum'
import { authApi } from '@/api/auth'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import { radius, useTheme } from '@/theme'

// References: E:/Clone UIUX/{kakaostory-clone,instagram-clone,export}.
// Kakao "Story mới": borderless canvas, media strip, pill toolbar pinned above the keyboard;
// Instagram: author row, one quiet action colour; Meetup: illustrated sections and a persistent primary action.

const DRAFT_KEY = 'alumnect.draft.question'
const TITLE_MAX = 250
const BODY_MAX = 10000
const IMAGE_MAX = 5
/** Ngưỡng của bảng gợi ý: tiêu đề đủ cụ thể, nội dung đủ bối cảnh. */
const TITLE_GOOD = 15
const BODY_GOOD = 40

type Draft = { title?: string; body?: string; topicId?: number | null; majorId?: number | null }

/** Một dòng gợi ý: dấu tích xanh bật nảy khi điều kiện đạt. */
function TipRow({ done, label }: { done: boolean; label: string }) {
  const t = useTheme()
  const reduced = useReducedMotion()
  const [pop] = useState(() => new Animated.Value(done ? 1 : 0))
  useEffect(() => {
    const animation = reduced
      ? Animated.timing(pop, { toValue: done ? 1 : 0, duration: 0, useNativeDriver: true })
      : done
        ? Animated.spring(pop, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true })
        : Animated.timing(pop, { toValue: 0, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    animation.start()
    return () => animation.stop()
  }, [done, reduced, pop])
  return (
    <View accessible accessibilityLabel={`${label}, ${done ? 'đã đạt' : 'chưa đạt'}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 30 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: t.controlBorder }}>
        <Animated.View style={{ position: 'absolute', top: -1.5, left: -1.5, right: -1.5, bottom: -1.5, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: t.success, opacity: pop.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: pop }] }}>
          <Check size={13} color={t.isDark ? t.bg : '#fff'} weight="bold" />
        </Animated.View>
      </View>
      <Txt size={13} weight={done ? '600' : '400'} color={done ? t.text : t.textMuted} style={{ flex: 1 }}>{label}</Txt>
    </View>
  )
}

/** Bảng gợi ý viết câu hỏi tốt: thanh tiến độ và ba dấu tích cập nhật ngay khi người dùng gõ. */
function QualityTips({ checks }: { checks: [boolean, string][] }) {
  const t = useTheme()
  const reduced = useReducedMotion()
  const done = checks.filter(([ok]) => ok).length
  const [fill] = useState(() => new Animated.Value(done / checks.length))
  useEffect(() => {
    const animation = Animated.timing(fill, { toValue: done / checks.length, duration: reduced ? 0 : 260, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    animation.start()
    return () => animation.stop()
  }, [done, checks.length, reduced, fill])
  return (
    <Enter delay={120} style={{ margin: 16, padding: 16, borderRadius: 20, backgroundColor: t.primaryTint }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Txt weight="700">Câu hỏi rõ ràng, trả lời nhanh hơn</Txt>
          <Txt muted size={12} style={{ marginTop: 2 }}>{done === checks.length ? 'Tuyệt vời, câu hỏi đã sẵn sàng!' : `Đã đạt ${done}/${checks.length} gợi ý`}</Txt>
        </View>
        <BrandIcon name="sparkle" size={40} />
      </View>
      <View style={{ height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: t.card, marginTop: 12, marginBottom: 8 }}>
        <Animated.View style={{ flex: 1, borderRadius: 3, backgroundColor: t.primary, transformOrigin: 'left center', transform: [{ scaleX: fill }] }} />
      </View>
      {checks.map(([ok, label]) => <TipRow key={label} done={ok} label={label} />)}
    </Enter>
  )
}

/** Form đặt (UC37) / sửa (UC43) câu hỏi, tự lưu nháp khi đặt mới. */
export function QuestionForm({ existing }: { existing?: QuestionDetail }) {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const reduced = useReducedMotion()
  const user = useAuthStore((s) => s.user)
  const bodyRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [topicId, setTopicId] = useState<number | null>(existing?.topicId ?? null)
  const [majorId, setMajorId] = useState<number | null>(existing?.majorId ?? null)
  const [images, setImages] = useState<string[]>(existing?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [shake] = useState(() => new Animated.Value(0))
  const [pop] = useState(() => new Animated.Value(1))
  const topics = useQuery({ queryKey: ['forum-topics'], queryFn: forumApi.topics })
  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors })

  // Khôi phục nháp (chỉ khi đặt câu hỏi mới).
  useEffect(() => {
    if (existing) return
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (!raw) return
      try {
        const d = JSON.parse(raw) as Draft
        if (d.title) setTitle(d.title)
        if (d.body) setBody(d.body)
        if (d.topicId != null) setTopicId(d.topicId)
        if (d.majorId != null) setMajorId(d.majorId)
      } catch {}
    }).catch(() => {})
  }, [existing])

  // Tự động lưu nháp.
  useEffect(() => {
    if (existing) return
    const id = setTimeout(() => {
      if (!title && !body) return
      const draft: Draft = { title, body, topicId, majorId }
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).then(() => setDraftSaved(true)).catch(() => {})
    }, 600)
    return () => clearTimeout(id)
  }, [title, body, topicId, majorId, existing])

  const ready = !!title.trim() && !!body.trim() && !uploading
  // Nút đăng nảy nhẹ một lần khi form vừa đủ điều kiện gửi.
  useEffect(() => {
    if (!ready || reduced) return
    pop.setValue(0.92)
    const animation = Animated.spring(pop, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true })
    animation.start()
    return () => animation.stop()
  }, [ready, reduced, pop])

  const m = useMutation({
    mutationFn: () => {
      const input = { title: title.trim(), body: body.trim(), topicId, majorId, imageUrls: images }
      return existing ? forumApi.update(existing.id, input) : forumApi.create(input)
    },
    onSuccess: (res) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      toast.success(existing ? 'Cập nhật câu hỏi thành công!' : 'Đặt câu hỏi thành công!')
      if (!existing) AsyncStorage.removeItem(DRAFT_KEY).catch(() => {})
      qc.invalidateQueries({ queryKey: ['forum'] })
      qc.invalidateQueries({ queryKey: ['question', res.id] })
      if (existing) router.back()
      else router.replace({ pathname: '/forum/[id]', params: { id: res.id } })
    },
    onError: (e) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      toast.error(errMsg(e))
    },
  })

  const animateLayout = () => {
    if (!reduced) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }
  const touched = (field?: string) => {
    if (draftSaved) setDraftSaved(false)
    if (field && errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const addImages = async () => {
    const picked = await pickImage(true)
    if (!picked.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(picked.slice(0, IMAGE_MAX - images.length).map((p) => uploadImage(p, 'common')))
      animateLayout()
      setImages((x) => [...x, ...urls])
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }
  const removeImage = (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    animateLayout()
    setImages((x) => x.filter((i) => i !== uri))
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Tiêu đề câu hỏi không được để trống'
    else if (title.trim().length > TITLE_MAX) e.title = `Tiêu đề câu hỏi không được vượt quá ${TITLE_MAX} ký tự`
    if (!body.trim()) e.body = 'Nội dung câu hỏi không được để trống'
    else if (body.trim().length > BODY_MAX) e.body = `Nội dung câu hỏi không được vượt quá ${BODY_MAX} ký tự`
    setErrors(e)
    if (!Object.keys(e).length) return m.mutate()
    // Thiếu thông tin: rung nhẹ và lắc khung soạn để chỉ đúng chỗ cần sửa.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
    if (reduced) return
    shake.setValue(0)
    Animated.sequence([8, -8, 6, -6, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 50, useNativeDriver: true }))).start()
  }

  const busy = m.isPending || uploading
  const full = images.length >= IMAGE_MAX
  const active = ready || m.isPending
  const submitFg = active ? t.onPrimary : t.textMuted
  const submitLabel = existing ? 'Lưu thay đổi' : 'Đăng câu hỏi'

  return (
    <Screen keyboard bg={t.bg}>
      <Header title={existing ? 'Sửa câu hỏi' : 'Đặt câu hỏi'} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* 1. Khung soạn không viền: tác giả, tiêu đề lớn, nội dung, dải ảnh. */}
        <View style={{ backgroundColor: t.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
          <Enter style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
            <Avatar uri={user?.avatarUrl} name={user?.name ?? 'Bạn'} size={44} ring />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight="700" numberOfLines={1}>{user?.name ?? 'Bạn'}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: t.surface }}>
                  <Globe size={12} color={t.textMuted} />
                  <Txt muted size={12} weight="500">Hỏi công khai trong Alumnect</Txt>
                </View>
                {draftSaved && !existing ? (
                  <Enter style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <CheckCircle2 size={12} color={t.success} />
                    <Txt size={12} weight="500" color={t.success}>Đã lưu nháp</Txt>
                  </Enter>
                ) : null}
              </View>
            </View>
          </Enter>

          <Animated.View style={{ paddingHorizontal: 16, transform: [{ translateX: shake }] }}>
            <TextInput
              value={title}
              onChangeText={(v) => {
                setTitle(v.replace(/\n/g, ' '))
                touched('title')
              }}
              multiline
              scrollEnabled={false}
              submitBehavior="submit"
              returnKeyType="next"
              onSubmitEditing={() => bodyRef.current?.focus()}
              placeholder="Bạn muốn hỏi điều gì?"
              placeholderTextColor={t.textSubtle}
              selectionColor={t.primary}
              accessibilityLabel="Tiêu đề câu hỏi"
              style={{ fontSize: 20, lineHeight: 28, fontWeight: '700', color: t.text, paddingVertical: 4, textAlignVertical: 'top' }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 20, marginTop: 2 }}>
              <Text style={{ flex: 1, color: t.danger, fontSize: 12 }}>{errors.title ?? ''}</Text>
              <Text style={{ fontSize: 12, color: title.length > TITLE_MAX ? t.danger : t.textMuted, fontWeight: title.length > TITLE_MAX ? '600' : '400' }}>{title.length}/{TITLE_MAX}</Text>
            </View>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginTop: 8, marginBottom: 10 }} />
            <TextInput
              ref={bodyRef}
              value={body}
              onChangeText={(v) => {
                setBody(v)
                touched('body')
              }}
              multiline
              scrollEnabled={false}
              placeholder="Mô tả chi tiết bối cảnh để mọi người trả lời chính xác hơn: bạn đang ở giai đoạn nào, đã thử gì, cần lời khuyên về điều gì..."
              placeholderTextColor={t.textSubtle}
              selectionColor={t.primary}
              accessibilityLabel="Nội dung câu hỏi"
              style={{ fontSize: 16, lineHeight: 24, color: t.text, minHeight: 132, paddingVertical: 4, textAlignVertical: 'top' }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 20, marginTop: 2, marginBottom: 10 }}>
              <Text style={{ flex: 1, color: t.danger, fontSize: 12 }}>{errors.body ?? ''}</Text>
              {body.length >= BODY_MAX * 0.9 ? <Text style={{ fontSize: 12, color: body.length > BODY_MAX ? t.danger : t.warning, fontWeight: '600' }}>{body.length}/{BODY_MAX}</Text> : null}
            </View>
          </Animated.View>

          {images.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 14, gap: 10 }}>
              {images.map((uri, i) => (
                <View key={uri} style={{ width: 96, height: 96, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.inputBg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border }}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
                  <Pressable
                    onPress={() => removeImage(uri)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Bỏ ảnh ${i + 1}`}
                    style={({ pressed }) => ({ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.65)', opacity: pressed ? 0.7 : 1 })}
                  >
                    <X size={14} color="#fff" />
                  </Pressable>
                  <View style={{ position: 'absolute', left: 5, bottom: 5, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{i + 1}</Text>
                  </View>
                </View>
              ))}
              {!full ? (
                <MotionPressable
                  onPress={addImages}
                  disabled={uploading}
                  accessibilityRole="button"
                  accessibilityLabel="Thêm ảnh"
                  style={{ width: 96, height: 96, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.controlBorder, backgroundColor: t.inputBg, alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                  {uploading ? <ActivityIndicator size="small" color={t.primary} /> : (
                    <>
                      <BrandIcon name="photo" size={30} />
                      <Txt muted size={12} weight="600">{images.length}/{IMAGE_MAX}</Txt>
                    </>
                  )}
                </MotionPressable>
              ) : null}
            </ScrollView>
          ) : null}
        </View>

        {/* 2. Phân loại: chủ đề chọn ngay bằng viên có minh hoạ, ngành chọn trong bảng tìm kiếm. */}
        <Enter delay={60} style={{ backgroundColor: t.card, marginTop: 8, paddingTop: 16, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: t.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 12 }}>
            <BrandIcon name="list" size={34} />
            <View style={{ flex: 1 }}>
              <Txt size={16} weight="700" heading>Phân loại câu hỏi</Txt>
              <Txt muted size={12}>Giúp câu hỏi đến đúng người có kinh nghiệm</Txt>
            </View>
          </View>
          <Txt muted size={13} weight="600" style={{ paddingHorizontal: 16 }}>Chủ đề</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="radiogroup" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, gap: 8 }}>
            {topics.data ? topics.data.map((tp) => (
              <TopicPill
                key={tp.id}
                icon={topicIcon(tp.name, tp.id)}
                label={tp.name}
                active={topicId === tp.id}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {})
                  setTopicId(topicId === tp.id ? null : tp.id)
                  touched()
                }}
              />
            )) : [112, 148, 96].map((w) => <SkeletonBlock key={w} width={w} height={44} round />)}
          </ScrollView>
          <View style={{ paddingHorizontal: 16 }}>
            <SelectField
              variant="float"
              label="Ngành liên quan"
              placeholder="Chọn ngành"
              icon={<BrandIcon name="building" size={24} />}
              value={majorId == null ? null : String(majorId)}
              options={(majors.data?.data ?? []).map((mj) => ({ value: String(mj.id), label: mj.name }))}
              onChange={(v) => {
                setMajorId(v == null ? null : Number(v))
                touched()
              }}
            />
          </View>
        </Enter>

        {/* 3. Gợi ý viết câu hỏi tốt, cập nhật theo nội dung đang gõ. */}
        <QualityTips
          checks={[
            [title.trim().length >= TITLE_GOOD, `Tiêu đề cụ thể (từ ${TITLE_GOOD} ký tự)`],
            [body.trim().length >= BODY_GOOD, 'Nội dung nêu rõ bối cảnh của bạn'],
            [topicId != null, 'Đã gắn chủ đề phù hợp'],
          ]}
        />
      </ScrollView>

      {/* 4. Thanh thao tác ghim đáy, luôn nằm trên bàn phím: thêm ảnh bên trái, nút đăng bên phải. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: t.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }}>
        <MotionPressable
          onPress={addImages}
          disabled={uploading || full}
          accessibilityRole="button"
          accessibilityLabel={`Thêm ảnh, đã chọn ${images.length} trên ${IMAGE_MAX}`}
          accessibilityState={{ disabled: uploading || full, busy: uploading }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, paddingLeft: 10, paddingRight: 14, borderRadius: radius.full, backgroundColor: t.inputBg, opacity: full ? 0.55 : 1 }}
        >
          <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
            {uploading ? <ActivityIndicator size="small" color={t.primary} /> : <BrandIcon name="photo" size={26} />}
          </View>
          <Txt size={13} weight="600">{images.length ? `Ảnh ${images.length}/${IMAGE_MAX}` : 'Thêm ảnh'}</Txt>
        </MotionPressable>
        <View style={{ flex: 1 }} />
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <MotionPressable
            onPress={submit}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={submitLabel}
            accessibilityState={{ disabled: busy, busy: m.isPending }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, minWidth: 148, paddingHorizontal: 20, borderRadius: radius.full, backgroundColor: active ? t.primary : t.inputBg }}
          >
            {m.isPending ? <ActivityIndicator size="small" color={submitFg} /> : (
              <>
                <Send size={18} color={submitFg} weight={active ? 'fill' : 'regular'} />
                <Text style={{ color: submitFg, fontSize: 15, fontWeight: '700' }}>{submitLabel}</Text>
              </>
            )}
          </MotionPressable>
        </Animated.View>
      </View>
    </Screen>
  )
}
