import React, { useRef, useState } from 'react'
import { Animated, FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { Bookmark, Building2, Heart, MapPin, MessageCircle, MoreHorizontal, Send, BadgeCheck } from '@/components/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Chip, Input, Tag, Txt } from './ui'
import { ActionSheet } from './ActionSheet'
import { feedApi } from '@/api/feed'
import type { Post } from '@/api/feed'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'
import { ShareSheet } from './ShareSheet'
import { postPath } from '@/lib/share'

const TYPE_TAG: Record<string, [string, 'warning' | 'info' | 'primary']> = {
  achievement: ['Thành tựu', 'warning'],
  recruitment: ['Tuyển dụng', 'info'],
  event: ['Sự kiện', 'primary'],
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

/** Nút hành động chỉ có icon (kiểu Instagram): số đếm nằm cạnh icon, chạm tối thiểu 44. */
function Act({ icon, count, label, onPress, active }: { icon: React.ReactNode; count?: number; label: string; onPress: () => void; active?: boolean }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={count ? `${label}, ${count}` : label}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({ minWidth: 44, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 8, opacity: pressed ? 0.6 : 1 })}
    >
      {icon}
      {count ? <Txt size={13} weight="600" color={t.text}>{count}</Txt> : null}
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

/** Ảnh bài viết kiểu Instagram: vuốt ngang nhiều ảnh, chạm đúp để thích (trái tim bung ra), chạm một lần mở bài. */
function PostMedia({ images, onOpen, onDoubleLike }: { images: string[]; onOpen: () => void; onDoubleLike: () => void }) {
  const t = useTheme()
  const { width } = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const [burst] = useState(() => new Animated.Value(0))
  const lastTap = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Khung theo tỉ lệ ảnh đầu tiên (giới hạn 4:5 → 1.91:1 như Instagram) để banner ngang không bị cắt thành ô vuông.
  const [ratio, setRatio] = useState(1)
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
    <View>
    <View style={{ width, height, backgroundColor: t.inputBg }}>
      <FlatList
        data={images}
        keyExtractor={(u, i) => u + i}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_d, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <Pressable onPress={onTap} accessibilityRole="imagebutton" accessibilityLabel="Ảnh bài viết, chạm hai lần để thích">
            <Image
              source={{ uri: item }}
              style={{ width, height }}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
              onLoad={item === images[0] ? (e) => setRatio(Math.min(1.91, Math.max(0.8, e.source.width / e.source.height))) : undefined}
            />
          </Pressable>
        )}
      />
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity, transform: [{ scale }] }}>
        <Heart size={96} color="#fff" weight="fill" />
      </Animated.View>
      {images.length > 1 ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <Txt size={12} weight="600" color="#fff">{index + 1}/{images.length}</Txt>
        </View>
      ) : null}
    </View>
    {images.length > 1 ? <View style={{ alignItems: 'center', paddingTop: 10 }}><Dots count={images.length} index={index} /></View> : null}
    </View>
  )
}

/** Chấm phân trang dưới ảnh (như Instagram), chỉ hiện khi có nhiều ảnh. */
function Dots({ count, index }: { count: number; index: number }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
        <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === index ? t.primary : t.controlBorder }} />
      ))}
    </View>
  )
}

function fmtCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '')}K` : String(n)
}

function PostCardImpl({ post, detail }: { post: Post; detail?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likes)
  const [saved, setSaved] = useState(post.saved)
  const [menu, setMenu] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('SPAM')
  const [reportDescription, setReportDescription] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
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
    likeM.mutate(next)
  }
  const toggleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = !saved
    setSaved(next)
    saveM.mutate(next)
  }

  const openPost = () => !detail && router.push({ pathname: '/post/[id]', params: { id: post.id } })
  const openAuthor = () => post.authorId && router.push({ pathname: '/profile/[id]', params: { id: post.authorId } })

  const typeTag = TYPE_TAG[post.type]
  const eventDate = post.event?.startTime ? new Date(post.event.startTime) : null

  const [expanded, setExpanded] = useState(false)
  const likeByDoubleTap = () => { if (!liked) toggleLike() }
  const longText = post.text.length > 110 || post.text.split('\n').length > 3

  return (
    <View style={{ backgroundColor: t.card, paddingTop: 4, paddingBottom: 14, borderBottomWidth: detail ? 0 : StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, paddingLeft: 12, paddingRight: 4 }}>
        <Pressable onPress={openAuthor} accessibilityRole="button" accessibilityLabel={`Trang cá nhân ${post.author}`}>
          <Avatar uri={post.avatar} name={post.author} size={36} />
        </Pressable>
        <Pressable onPress={openAuthor} style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Txt weight="700" size={14} numberOfLines={1} style={{ flexShrink: 1 }}>{post.author}</Txt>
            {post.verified ? <BadgeCheck size={14} color={t.info} weight="fill" /> : null}
            {typeTag ? <Tag label={typeTag[0]} tone={typeTag[1]} style={{ marginLeft: 4 }} /> : null}
          </View>
          <Txt muted size={12} numberOfLines={1}>{post.role}</Txt>
        </Pressable>
        <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="Tùy chọn bài viết" style={{ width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <MoreHorizontal size={24} color={t.text} weight="bold" />
        </Pressable>
      </View>

      {images.length ? <PostMedia images={images} onOpen={openPost} onDoubleLike={likeByDoubleTap} /> : null}

      {post.job ? (
        <View style={{ marginTop: 4, marginBottom: 8, marginHorizontal: 12, padding: 14, borderRadius: 12, backgroundColor: t.surface, gap: 6 }}>
          <Txt weight="800" size={15}>{post.job.title}</Txt>
          {post.job.company ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Building2 size={14} color={t.textMuted} /><Txt muted size={13} numberOfLines={1}>{post.job.company}</Txt></View>
          ) : null}
          {post.job.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><MapPin size={14} color={t.textMuted} /><Txt muted size={13} numberOfLines={1}>{post.job.location}</Txt></View>
          ) : null}
        </View>
      ) : null}

      {post.event ? (
        <Pressable
          onPress={() => post.event?.id && router.push({ pathname: '/events/[id]', params: { id: post.event.id, title: post.event.title ?? '', start: post.event.startTime ?? '', end: post.event.endTime ?? '', location: post.event.location ?? '', hostId: post.authorId ?? '' } })}
          style={{ marginTop: 4, marginBottom: 8, marginHorizontal: 12, padding: 12, borderRadius: 14, backgroundColor: t.surface, flexDirection: 'row', gap: 12, alignItems: 'center' }}
        >
          <View style={{ width: 52, borderRadius: 12, overflow: 'hidden', backgroundColor: t.card, alignItems: 'center' }}>
            <View style={{ alignSelf: 'stretch', backgroundColor: t.primary, paddingVertical: 2 }}>
              <Txt size={10} weight="800" color={t.onPrimary} style={{ textAlign: 'center' }}>{eventDate ? `TH${eventDate.getMonth() + 1}` : 'TH--'}</Txt>
            </View>
            <Txt size={20} weight="800" style={{ paddingVertical: 4 }}>{eventDate ? String(eventDate.getDate()).padStart(2, '0') : '--'}</Txt>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt weight="800" numberOfLines={2}>{post.event.title}</Txt>
            {eventDate ? <Txt muted size={12}>{eventDate.toLocaleString('vi-VN', { weekday: 'short', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</Txt> : null}
            {post.event.location ? <Txt muted size={12} numberOfLines={1}>{post.event.location}</Txt> : null}
          </View>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, paddingHorizontal: 4 }}>
        <Act
          onPress={toggleLike}
          label={liked ? 'Bỏ thích' : 'Thích'}
          active={liked}
          icon={<Heart size={26} color={liked ? t.danger : t.text} weight={liked ? 'fill' : 'regular'} />}
        />
        <Act onPress={openPost} label="Bình luận" icon={<MessageCircle size={26} color={t.text} />} />
        <Act onPress={() => setShareOpen(true)} label="Chia sẻ" icon={<Send size={25} color={t.text} />} />
        <View style={{ flex: 1 }} />
        <Act
          onPress={toggleSave}
          label={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
          active={saved}
          icon={<Bookmark size={26} color={t.text} weight={saved ? 'fill' : 'regular'} />}
        />
      </View>

      <View style={{ paddingHorizontal: 12, gap: 4 }}>
        {likes > 0 ? <Txt weight="700" size={14}>{fmtCount(likes)} lượt thích</Txt> : null}
        {post.text ? (
          <Pressable onPress={!detail && longText && !expanded ? () => setExpanded(true) : undefined}>
            <Txt size={14} style={{ lineHeight: 20 }} numberOfLines={detail || expanded ? undefined : 3}>
              {images.length ? <Txt weight="700" size={14} onPress={openAuthor}>{post.author}{'  '}</Txt> : null}
              {post.text}
            </Txt>
            {!detail && longText && !expanded ? <Txt muted size={14}>xem thêm</Txt> : null}
          </Pressable>
        ) : null}
        {!detail ? (
          <Pressable onPress={openPost} accessibilityRole="button" hitSlop={6}>
            <Txt muted size={14}>{post.comments > 0 ? `Xem tất cả ${post.comments} bình luận` : 'Thêm bình luận...'}</Txt>
          </Pressable>
        ) : null}
        {post.time ? <Txt size={11} color={t.textSubtle} style={{ textTransform: 'uppercase', letterSpacing: 0.3 }}>{post.time}</Txt> : null}
      </View>

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

export const PostCard = React.memo(PostCardImpl)
