import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Share2, BadgeCheck } from 'lucide-react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, Card, Txt } from './ui'
import { ActionSheet } from './ActionSheet'
import { feedApi } from '@/api/feed'
import type { Post } from '@/api/feed'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'
import { ShareSheet } from './ShareSheet'
import { postPath } from '@/lib/share'

const TYPE_LABEL: Record<string, string> = { achievement: 'Thành tựu', recruitment: 'Tuyển dụng', event: 'Sự kiện' }

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
    mutationFn: (reason: string) => feedApi.report(post.id, { reason }),
    onSuccess: () => toast.success('Đã gửi báo cáo vi phạm, cảm ơn bạn đã đóng góp!'),
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

  return (
    <Card style={{ marginBottom: 12 }} onPress={detail ? undefined : openPost}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={openAuthor}>
          <Avatar uri={post.avatar} name={post.author} size={42} />
        </Pressable>
        <Pressable onPress={openAuthor} style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Txt weight="700" numberOfLines={1}>{post.author}</Txt>
            {post.verified ? <BadgeCheck size={14} color={t.info} /> : null}
          </View>
          <Txt muted size={12} numberOfLines={1}>{[post.role, post.time].filter(Boolean).join(' · ')}</Txt>
        </Pressable>
        <Pressable onPress={() => setMenu(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Tùy chọn bài viết">
          <MoreHorizontal size={20} color={t.textMuted} />
        </Pressable>
      </View>

      {TYPE_LABEL[post.type] ? (
        <View style={{ alignSelf: 'flex-start', backgroundColor: t.primaryTint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 10 }}>
          <Txt size={11} weight="700" color={t.primary}>{TYPE_LABEL[post.type]}</Txt>
        </View>
      ) : null}

      {post.text ? <Txt style={{ marginTop: 10, lineHeight: 21 }} numberOfLines={detail ? undefined : 8}>{post.text}</Txt> : null}

      {post.job ? (
        <View style={{ marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: t.inputBg }}>
          <Txt weight="700">{post.job.title}</Txt>
          <Txt muted size={13}>{[post.job.company, post.job.location].filter(Boolean).join(' · ')}</Txt>
        </View>
      ) : null}
      {post.event ? (
        <Pressable
          onPress={() => post.event?.id && router.push({ pathname: '/events/[id]', params: { id: post.event.id, title: post.event.title ?? '', start: post.event.startTime ?? '', end: post.event.endTime ?? '', location: post.event.location ?? '', hostId: post.authorId ?? '' } })}
          style={{ marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: t.inputBg }}
        >
          <Txt weight="700">{post.event.title}</Txt>
          <Txt muted size={13}>{[post.event.startTime && new Date(post.event.startTime).toLocaleString('vi-VN'), post.event.location].filter(Boolean).join(' · ')}</Txt>
        </Pressable>
      ) : null}

      {images.length > 0 ? (
        <Image source={{ uri: images[0] }} style={{ marginTop: 10, width: '100%', aspectRatio: 1.6, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" transition={200} />
      ) : null}
      {images.length > 1 ? <Txt muted size={12} style={{ marginTop: 4 }}>+{images.length - 1} ảnh khác</Txt> : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 20 }}>
        <Pressable onPress={toggleLike} accessibilityRole="button" accessibilityLabel={liked ? 'Bỏ thích' : 'Thích'} accessibilityState={{ selected: liked }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Heart size={20} color={liked ? t.danger : t.textMuted} fill={liked ? t.danger : 'transparent'} />
          <Txt muted size={13}>{likes}</Txt>
        </Pressable>
        <Pressable onPress={openPost} accessibilityRole="button" accessibilityLabel="Bình luận" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MessageCircle size={20} color={t.textMuted} />
          <Txt muted size={13}>{post.comments}</Txt>
        </Pressable>
        <Pressable
          onPress={() => setShareOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Chia sẻ"
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Share2 size={19} color={t.textMuted} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={toggleSave} hitSlop={8} accessibilityRole="button" accessibilityLabel={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}>
          <Bookmark size={20} color={saved ? t.primary : t.textMuted} fill={saved ? t.primary : 'transparent'} />
        </Pressable>
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
                { label: 'Xóa bài viết', danger: true, onPress: () => delM.mutate() },
              ]
            : [{ label: 'Báo cáo vi phạm', danger: true, onPress: () => setReportOpen(true) }]
        }
      />
      <ActionSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Báo cáo vi phạm"
        actions={REPORT_REASONS.map(([k, label]) => ({ label, onPress: () => reportM.mutate(k) }))}
      />
    </Card>
  )
}

export const PostCard = React.memo(PostCardImpl)
