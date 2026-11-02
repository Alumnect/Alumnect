import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { Bookmark, Building2, Heart, MapPin, MessageCircle, MoreHorizontal, Share2, BadgeCheck } from '@/components/icons'
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

  return (
    <Pressable onPress={detail ? undefined : openPost} style={{ backgroundColor: t.card, paddingTop: 16, paddingBottom: 4, borderBottomWidth: detail ? 0 : 1, borderBottomColor: t.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
        <Pressable onPress={openAuthor} accessibilityRole="button" accessibilityLabel={`Trang cá nhân ${post.author}`}>
          <Avatar uri={post.avatar} name={post.author} size={40} />
        </Pressable>
        <Pressable onPress={openAuthor} style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Txt weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>{post.author}</Txt>
            {post.verified ? <BadgeCheck size={16} color={t.info} weight="fill" /> : null}
          </View>
          <Txt muted size={12} numberOfLines={1}>{[post.role, post.time].filter(Boolean).join(' · ')}</Txt>
        </Pressable>
        <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="Tùy chọn bài viết" style={{ width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <MoreHorizontal size={24} color={t.textMuted} weight="bold" />
        </Pressable>
      </View>

      {typeTag ? <Tag label={typeTag[0]} tone={typeTag[1]} style={{ marginTop: 10, marginLeft: 16 }} /> : null}

      {post.text ? (
        <Txt style={{ marginTop: 10, lineHeight: 22, paddingHorizontal: 16 }} numberOfLines={detail ? undefined : 6}>{post.text}</Txt>
      ) : null}

      {post.job ? (
        <View style={{ marginTop: 12, marginHorizontal: 16, padding: 16, borderRadius: 12, backgroundColor: t.surface, gap: 6 }}>
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
          style={{ marginTop: 12, marginHorizontal: 16, padding: 12, borderRadius: 14, backgroundColor: t.surface, flexDirection: 'row', gap: 12, alignItems: 'center' }}
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

      {images.length === 1 ? (
        <Image source={{ uri: images[0] }} style={{ marginTop: 12, width: '100%', aspectRatio: 1.25, backgroundColor: t.inputBg }} contentFit="cover" cachePolicy="disk" transition={200} />
      ) : null}
      {images.length > 1 ? (
        <View style={{ marginTop: 12, flexDirection: 'row', gap: 2 }}>
          {images.slice(0, 2).map((uri, i) => (
            <View key={uri + i} style={{ flex: 1 }}>
              <Image source={{ uri }} style={{ width: '100%', aspectRatio: 0.85, backgroundColor: t.inputBg }} contentFit="cover" cachePolicy="disk" transition={200} />
              {i === 1 && images.length > 2 ? (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
                  <Txt size={24} weight="800" color="#fff">+{images.length - 2}</Txt>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingHorizontal: 8 }}>
        <Act
          onPress={toggleLike}
          label={liked ? 'Bỏ thích' : 'Thích'}
          count={likes}
          active={liked}
          icon={<Heart size={24} color={liked ? t.danger : t.text} weight={liked ? 'fill' : 'regular'} />}
        />
        <Act onPress={openPost} label="Bình luận" count={post.comments} icon={<MessageCircle size={24} color={t.text} />} />
        <Act onPress={() => setShareOpen(true)} label="Chia sẻ" icon={<Share2 size={24} color={t.text} />} />
        <View style={{ flex: 1 }} />
        <Act
          onPress={toggleSave}
          label={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
          active={saved}
          icon={<Bookmark size={24} color={t.text} weight={saved ? 'fill' : 'regular'} />}
        />
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
    </Pressable>
  )
}

export const PostCard = React.memo(PostCardImpl)
