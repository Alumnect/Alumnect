import React, { useEffect, useRef, useState } from 'react'
import { Animated, FlatList, LayoutAnimation, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { Bookmark, Building2, Coins, Heart, MapPin, MessageCircle, MoreHorizontal, Send, BadgeCheck } from '@/components/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Chip, Input, Tag, Txt } from './ui'
import { ActionSheet } from './ActionSheet'
import { feedApi } from '@/api/feed'
import type { Post } from '@/api/feed'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'
import { ShareSheet } from './ShareSheet'
import { CommentsSheet } from './CommentsSheet'
import { postPath } from '@/lib/share'

const TYPE_TAG: Record<string, [string, 'warning' | 'info' | 'primary']> = {
  achievement: ['Thành tựu', 'warning'],
  recruitment: ['Tuyển dụng', 'info'],
  event: ['Sự kiện', 'primary'],
}

function formatJobSalary(min?: number | null, max?: number | null) {
  const f = (n: number) => n.toLocaleString('vi-VN')
  if (!min && !max) return null
  if (min && !max) return `Từ ${f(min)} VNĐ`
  if (!min && max) return `Đến ${f(max)} VNĐ`
  return `${f(min!)} – ${f(max!)} VNĐ`
}

/** Nút trong thanh hành động của bài viết (Thích, Bình luận, Chia sẻ, Lưu). */
export function ActionBtn({ icon, text, label, onPress, active, activeColor }: { icon: React.ReactNode; text: string; label: string; onPress: () => void; active?: boolean; activeColor?: string }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: pressed ? t.inputBg : 'transparent' })}
    >
      {icon}
      <Txt size={13} weight="600" color={active ? activeColor : t.textMuted}>{text}</Txt>
    </Pressable>
  )
}

/** Nút hành động gọn với icon + nhãn/số đếm, vùng chạm chuẩn >= 44dp. */
function Act({ icon, count, text, label, onPress, active, activeColor }: { icon: React.ReactNode; count?: number; text?: string; label: string; onPress: () => void; active?: boolean; activeColor?: string }) {
  const t = useTheme()
  const display = count && count > 0 ? fmtCount(count) : text
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={count ? `${label}, ${count}` : label}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({
        minWidth: 44,
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: pressed ? t.inputBg : 'transparent',
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      {icon}
      {display ? <Txt size={13} weight="600" color={active && activeColor ? activeColor : t.textMuted}>{display}</Txt> : null}
    </Pressable>
  )
}

export const REPORT_REASONS: [string, string][] = [
  ['SPAM', 'Spam'],
  ['INAPPROPRIATE', 'Nội dung không phù hợp'],
  ['MISINFORMATION', 'Thông tin sai lệch'],
  ['SCAM_OR_FRAUD', 'Lừa đảo hoặc gian lận'],
  ['OTHER', 'Lý do khác'],
]

/** Ảnh bài viết responsive theo chiều rộng thực của thẻ: vuốt ngang nhiều ảnh, chạm đúp để thích, chạm một lần mở bài. */
function PostMedia({ postId, images, onOpen, onDoubleLike }: { postId: string; images: string[]; onOpen: () => void; onDoubleLike: () => void }) {
  const t = useTheme()
  const { width: windowWidth } = useWindowDimensions()
  const [containerWidth, setContainerWidth] = useState(0)
  const width = containerWidth > 0 ? containerWidth : windowWidth
  const [index, setIndex] = useState(0)
  const [burst] = useState(() => new Animated.Value(0))
  const lastTap = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tỉ lệ khung ảnh linh hoạt từ 4:5 (0.8) đến banner ngang (2.2) để không cắt mất chữ trên banner tuyển dụng/sự kiện.
  const [ratio, setRatio] = useState(1.5)
  const firstImage = images[0]

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const height = Math.round(width / ratio)

  const runBurst = () => {
    burst.setValue(0)
    Animated.timing(burst, { toValue: 1, duration: 800, useNativeDriver: true }).start()
  }
  const onTap = () => {
    const now = Date.now()
    if (now - lastTap.current < 280) {
      if (timer.current) clearTimeout(timer.current)
      lastTap.current = 0
      runBurst()
      onDoubleLike()
      return
    }
    lastTap.current = now
    timer.current = setTimeout(onOpen, 280)
  }
  const scale = burst.interpolate({ inputRange: [0, 0.25, 0.45, 0.65, 1], outputRange: [0.3, 1.15, 0.98, 1.02, 1.3] })
  const opacity = burst.interpolate({ inputRange: [0, 0.2, 0.65, 1], outputRange: [0, 1, 1, 0] })

  return (
    <View
      style={{ marginTop: 10 }}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width)
        if (w > 0 && w !== containerWidth) setContainerWidth(w)
      }}
    >
      <View style={{ width: '100%', height, backgroundColor: t.inputBg, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: t.divider, overflow: 'hidden' }}>
        <FlatList
          data={images}
          keyExtractor={(u, i) => `${postId}-${i}-${u}`}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            if (width > 0) setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }}
          getItemLayout={(_d, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item }) => (
            <Pressable onPress={onTap} accessibilityRole="imagebutton" accessibilityLabel="Ảnh bài viết, chạm hai lần để thích">
              <Image
                recyclingKey={`${postId}-${item}`}
                source={{ uri: item }}
                style={{ width, height }}
                contentFit="cover"
                cachePolicy="disk"
                transition={180}
                onLoad={
                  item === firstImage
                    ? (e) => {
                        if (e.source.width > 0 && e.source.height > 0) {
                          const natural = e.source.width / e.source.height
                          setRatio(Math.min(2.2, Math.max(0.8, natural)))
                        }
                      }
                    : undefined
                }
              />
            </Pressable>
          )}
        />
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity, transform: [{ scale }] }}>
          <Heart size={88} color="#fff" weight="fill" />
        </Animated.View>
        {images.length > 1 ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.62)' }}>
            <Txt size={12} weight="600" color="#fff">{index + 1}/{images.length}</Txt>
          </View>
        ) : null}
      </View>
      {images.length > 1 ? (
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <Dots count={images.length} index={index} />
        </View>
      ) : null}
    </View>
  )
}

/** Chấm phân trang dưới ảnh, chỉ hiện khi có nhiều ảnh. */
function Dots({ count, index }: { count: number; index: number }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
      {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
        <View key={i} style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? t.primary : t.controlBorder }} />
      ))}
    </View>
  )
}

function fmtCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '')}K` : String(n)
}

function PostCardBody({ post, detail }: { post: Post; detail?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likes)
  const [saved, setSaved] = useState(post.saved)
  const [menu, setMenu] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('SPAM')
  const [reportDescription, setReportDescription] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [likeBounce] = useState(() => new Animated.Value(1))
  const [saveBounce] = useState(() => new Animated.Value(1))

  const isMine = me?.id === post.authorId
  const images = post.images.length ? post.images : post.image ? [post.image] : []

  const likeM = useMutation({
    mutationFn: (next: boolean) => (next ? feedApi.like(post.id) : feedApi.unlike(post.id)),
    onError: (e, next) => {
      setLiked(!next)
      setLikes((n) => n + (next ? -1 : 1))
      toast.error(errMsg(e))
    },
  })
  const saveM = useMutation({
    mutationFn: (next: boolean) => (next ? feedApi.save(post.id) : feedApi.unsave(post.id)),
    onSuccess: (_d, next) => {
      toast.success(next ? 'Đã lưu bài viết vào danh sách.' : 'Đã bỏ lưu bài viết.')
      qc.invalidateQueries({ queryKey: ['saved-posts'] })
    },
    onError: (e, next) => {
      setSaved(!next)
      toast.error(errMsg(e))
    },
  })
  const delM = useMutation({
    mutationFn: () => feedApi.deletePost(post.id),
    onSuccess: () => {
      toast.success('Đã xóa bài viết.')
      qc.invalidateQueries({ queryKey: ['feed'] })
      if (detail) router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const reportM = useMutation({
    mutationFn: () => feedApi.report(post.id, { reason: reportReason, description: reportDescription.trim() || undefined }),
    onSuccess: () => { setReportOpen(false); setReportDescription(''); toast.success('Đã gửi báo cáo vi phạm, cảm ơn bạn đã đóng góp!') },
    onError: (e) => toast.error(errMsg(e)),
  })

  const toggleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = !liked
    setLiked(next)
    setLikes((n) => n + (next ? 1 : -1))
    likeBounce.setValue(0.75)
    Animated.spring(likeBounce, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }).start()
    likeM.mutate(next)
  }
  const toggleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = !saved
    setSaved(next)
    saveBounce.setValue(0.8)
    Animated.spring(saveBounce, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }).start()
    saveM.mutate(next)
  }

  const openPost = () => !detail && router.push({ pathname: '/post/[id]', params: { id: post.id } })
  // Ở feed: bình luận hiện dạng bảng trượt lên như Instagram. Ở màn chi tiết bài viết thì danh sách đã nằm ngay bên dưới.
  const openComments = () => (detail ? undefined : setCommentsOpen(true))
  const openAuthor = () => post.authorId && router.push({ pathname: '/profile/[id]', params: { id: post.authorId } })

  const typeTag = TYPE_TAG[post.type]
  const eventDate = post.event?.startTime ? new Date(post.event.startTime) : null
  const cleanRole = post.role?.replace(/\s*\|\s*FPTU Alumni/gi, '').replace(/FPTU Alumni/gi, '').trim()
  const subtitle = [cleanRole, post.time].filter(Boolean).join(' · ')
  const salaryText = post.job ? formatJobSalary(post.job.salaryMin, post.job.salaryMax) : null

  const likeByDoubleTap = () => { if (!liked) toggleLike() }
  const longText = post.text.length > 140 || post.text.split('\n').length > 3

  return (
    <View
      style={{
        backgroundColor: t.card,
        paddingTop: 12,
        paddingBottom: 6,
        marginBottom: detail ? 0 : 8,
        borderTopWidth: detail ? 0 : StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
      }}
    >
      {/* Header tác giả + phân loại bài + thời gian */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 6 }}>
        <Pressable onPress={openAuthor} accessibilityRole="button" accessibilityLabel={`Trang cá nhân ${post.author}`}>
          <Avatar uri={post.avatar} name={post.author} size={40} />
        </Pressable>
        <Pressable onPress={openAuthor} style={{ flex: 1, minWidth: 0, marginLeft: 10, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Txt weight="700" size={15} numberOfLines={1} style={{ flexShrink: 1 }}>{post.author}</Txt>
            {post.verified ? <BadgeCheck size={15} color={t.info} weight="fill" /> : null}
            {typeTag ? <Tag label={typeTag[0]} tone={typeTag[1]} style={{ marginLeft: 2 }} /> : null}
          </View>
          {subtitle ? <Txt muted size={12} numberOfLines={1} style={{ marginTop: 1 }}>{subtitle}</Txt> : null}
        </Pressable>
        <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="Tùy chọn bài viết" style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21 }}>
          <MoreHorizontal size={22} color={t.textMuted} weight="bold" />
        </Pressable>
      </View>

      {/* Nội dung chữ của bài viết */}
      {post.text ? (
        <Pressable
          onPress={
            !detail && longText && !expanded
              ? () => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                  setExpanded(true)
                }
              : detail
                ? undefined
                : openPost
          }
          style={{ paddingHorizontal: 14, marginTop: 8 }}
        >
          <Txt size={14} style={{ lineHeight: 21 }} numberOfLines={detail || expanded ? undefined : 4}>
            {post.text}
          </Txt>
          {!detail && longText && !expanded ? (
            <Txt size={13} weight="600" color={t.textMuted} style={{ marginTop: 2 }}>Xem thêm</Txt>
          ) : null}
        </Pressable>
      ) : null}

      {/* Ảnh bài viết */}
      {images.length ? <PostMedia key={`${post.id}-${images[0]}`} postId={post.id} images={images} onOpen={openPost} onDoubleLike={likeByDoubleTap} /> : null}

      {/* Khối thông tin tuyển dụng */}
      {post.job ? (
        <Pressable
          onPress={detail ? undefined : openPost}
          style={{
            marginTop: 10,
            marginHorizontal: 14,
            padding: 12,
            borderRadius: 12,
            backgroundColor: t.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            gap: 5,
          }}
        >
          <Txt weight="700" size={15} numberOfLines={2}>{post.job.title}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 14, rowGap: 4 }}>
            {post.job.company ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 }}>
                <Building2 size={14} color={t.textMuted} />
                <Txt muted size={13} numberOfLines={1} style={{ flexShrink: 1 }}>{post.job.company}</Txt>
              </View>
            ) : null}
            {salaryText ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Coins size={14} color={t.success} />
                <Txt size={13} weight="600" color={t.success}>{salaryText}</Txt>
              </View>
            ) : null}
          </View>
          {post.job.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MapPin size={14} color={t.primary} />
              <Txt muted size={12} numberOfLines={1} style={{ flex: 1 }}>{post.job.location}</Txt>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {/* Khối thông tin sự kiện */}
      {post.event ? (
        <Pressable
          onPress={() => post.event?.id && router.push({ pathname: '/events/[id]', params: { id: post.event.id, title: post.event.title ?? '', start: post.event.startTime ?? '', end: post.event.endTime ?? '', location: post.event.location ?? '', hostId: post.authorId ?? '' } })}
          style={{
            marginTop: 10,
            marginHorizontal: 14,
            padding: 12,
            borderRadius: 12,
            backgroundColor: t.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <View style={{ width: 50, borderRadius: 10, overflow: 'hidden', backgroundColor: t.card, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border }}>
            <View style={{ alignSelf: 'stretch', backgroundColor: t.primary, paddingVertical: 2 }}>
              <Txt size={10} weight="800" color={t.onPrimary} style={{ textAlign: 'center' }}>{eventDate ? `TH${eventDate.getMonth() + 1}` : 'TH--'}</Txt>
            </View>
            <Txt size={19} weight="800" style={{ paddingVertical: 4 }}>{eventDate ? String(eventDate.getDate()).padStart(2, '0') : '--'}</Txt>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Txt weight="700" size={15} numberOfLines={2}>{post.event.title}</Txt>
            {eventDate ? <Txt muted size={12}>{eventDate.toLocaleString('vi-VN', { weekday: 'short', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</Txt> : null}
            {post.event.location ? <Txt muted size={12} numberOfLines={1}>{post.event.location}</Txt> : null}
          </View>
        </Pressable>
      ) : null}

      {/* Thanh hành động tương tác */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginHorizontal: 6, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.divider }}>
        <Act
          onPress={toggleLike}
          label={liked ? 'Bỏ thích' : 'Thích'}
          count={likes}
          text="Thích"
          active={liked}
          activeColor={t.danger}
          icon={
            <Animated.View style={{ transform: [{ scale: likeBounce }] }}>
              <Heart size={22} color={liked ? t.danger : t.textMuted} weight={liked ? 'fill' : 'regular'} />
            </Animated.View>
          }
        />
        <Act
          onPress={openPost}
          label="Bình luận"
          count={post.comments}
          text="Bình luận"
          icon={<MessageCircle size={22} color={t.textMuted} />}
        />
        <Act
          onPress={() => setShareOpen(true)}
          label="Chia sẻ"
          text="Chia sẻ"
          icon={<Send size={21} color={t.textMuted} />}
        />
        <View style={{ flex: 1 }} />
        <Act
          onPress={toggleSave}
          label={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
          active={saved}
          activeColor={t.primary}
          icon={
            <Animated.View style={{ transform: [{ scale: saveBounce }] }}>
              <Bookmark size={22} color={saved ? t.primary : t.textMuted} weight={saved ? 'fill' : 'regular'} />
            </Animated.View>
          }
        />
      </View>

      {detail ? null : <CommentsSheet postId={post.id} visible={commentsOpen} onClose={() => setCommentsOpen(false)} />}
      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        item={{
          title: post.author,
          subtitle: post.text,
          thumbnail: post.image || post.images?.[0] || null,
          avatarUrl: post.avatar,
          path: postPath(post.id),
          typeLabel: 'bài viết',
        }}
      />
      <ActionSheet
        visible={menu}
        onClose={() => setMenu(false)}
        actions={
          isMine
            ? [
                { label: 'Chỉnh sửa bài viết', onPress: () => router.push({ pathname: '/post/edit/[id]', params: { id: post.id } }) },
                { label: 'Xóa bài viết', danger: true, onPress: () => setDeleteOpen(true) },
              ]
            : [{ label: 'Báo cáo vi phạm', danger: true, onPress: () => setReportOpen(true) }]
        }
      />
      <ActionSheet
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Xóa bài viết này?"
        actions={[{ label: 'Xác nhận xóa bài viết', danger: true, onPress: () => delM.mutate() }]}
      />
      <ActionSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Báo cáo vi phạm"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 16 }}>
          {REPORT_REASONS.map(([k, label]) => <Chip key={k} label={label} active={reportReason === k} onPress={() => setReportReason(k)} />)}
        </View>
        <Input label={reportReason === 'OTHER' ? 'Mô tả lý do (bắt buộc)' : 'Mô tả thêm (tùy chọn)'} placeholder="Cho biết nội dung cần xem xét..." value={reportDescription} onChangeText={setReportDescription} multiline maxLength={500} />
        <Button title="Gửi báo cáo" loading={reportM.isPending} disabled={reportReason === 'OTHER' && !reportDescription.trim()} onPress={() => reportM.mutate()} />
      </ActionSheet>
    </View>
  )
}

function PostCardImpl({ post, detail }: { post: Post; detail?: boolean }) {
  return <PostCardBody key={`${post.id}-${post.liked}-${post.likes}-${post.saved}`} post={post} detail={detail} />
}

export const PostCard = React.memo(PostCardImpl)
