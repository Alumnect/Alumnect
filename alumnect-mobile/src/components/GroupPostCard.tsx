import React, { useState } from 'react'
import { Modal, Pressable, View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, MoreHorizontal, Pin, Share2, X } from '@/components/icons'
import { Avatar, Card, Tag, Txt } from './ui'
import { ActionBtn, PostMedia } from './PostCard'
import { ActionSheet } from './ActionSheet'
import { ConfirmSheet } from './ConfirmSheet'
import { ShareSheet } from './ShareSheet'
import { VideoPlayer } from './VideoPlayer'
import { groupPostPath } from '@/lib/share'
import { groupApi } from '@/api/groups'
import type { GroupPost } from '@/api/groups'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** Xem ảnh bài viết toàn màn hình, vuốt qua lại giữa các ảnh (giống lightbox trên web). */
function ImageLightbox({ uris, index, onClose }: { uris: string[]; index: number | null; onClose: () => void }) {
  const { width, height } = useWindowDimensions()
  const [current, setCurrent] = useState(0)
  const open = index !== null
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} onShow={() => setCurrent(index ?? 0)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center' }}>
        {open ? (
          <Image source={{ uri: uris[Math.min(current, uris.length - 1)] }} style={{ width, height: height * 0.8 }} contentFit="contain" />
        ) : null}
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng ảnh" style={{ position: 'absolute', top: 44, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <X size={22} color="#fff" />
        </Pressable>
        {uris.length > 1 ? (
          <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
            <Pressable disabled={current === 0} onPress={() => setCurrent((c) => Math.max(0, c - 1))} accessibilityRole="button" accessibilityLabel="Ảnh trước" style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', opacity: current === 0 ? 0.4 : 1 }}>
              <Txt color="#fff" weight="600">Trước</Txt>
            </Pressable>
            <Txt color="#fff">{`${current + 1} / ${uris.length}`}</Txt>
            <Pressable disabled={current >= uris.length - 1} onPress={() => setCurrent((c) => Math.min(uris.length - 1, c + 1))} accessibilityRole="button" accessibilityLabel="Ảnh sau" style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', opacity: current >= uris.length - 1 ? 0.4 : 1 }}>
              <Txt color="#fff" weight="600">Sau</Txt>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  )
}

/**
 * Thẻ bài viết nhóm: like lạc quan (UC126), menu sửa/xóa/ghim (UC125).
 * `canInteract`: chỉ thành viên ACTIVE của nhóm đang hoạt động mới được thích/bình luận (giống web).
 */
function GroupPostCardImpl({ post, detail, canInteract = true }: { post: GroupPost; detail?: boolean; canInteract?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [liked, setLiked] = useState(post.likedByViewer)
  const [likes, setLikes] = useState(post.likeCount)
  const [menu, setMenu] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [viewer, setViewer] = useState<number | null>(null)
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['group-posts', post.groupId] })
    qc.invalidateQueries({ queryKey: ['group-post', post.groupId, post.id] })
  }

  const like = useMutation({
    mutationFn: () => groupApi.toggleLike(post.groupId, post.id),
    onSuccess: (r) => { setLiked(r.liked); setLikes(r.likeCount) },
    onError: (e) => { setLiked(post.likedByViewer); setLikes(post.likeCount); toast.error(errMsg(e)) },
  })
  const del = useMutation({
    mutationFn: () => groupApi.deletePost(post.groupId, post.id),
    onSuccess: () => { toast.success('Đã xóa bài viết.'); setConfirmDelete(false); refresh(); if (detail) router.back() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const pin = useMutation({
    mutationFn: () => groupApi.togglePin(post.groupId, post.id),
    onSuccess: () => { toast.success(post.isPinned ? 'Đã bỏ ghim bài viết.' : 'Đã ghim bài viết.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })

  const toggleLike = () => {
    if (!canInteract) { toast.error('Vui lòng tham gia hội nhóm để thích bài viết!'); return }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setLiked(!liked)
    setLikes((n) => n + (liked ? -1 : 1))
    like.mutate()
  }
  const open = () => !detail && router.push({ pathname: '/groups/post/[groupId]/[postId]', params: { groupId: String(post.groupId), postId: String(post.id) } })
  const actions = [
    ...(post.canPin ? [{ label: post.isPinned ? 'Bỏ ghim' : 'Ghim bài viết', onPress: () => pin.mutate() }] : []),
    ...(post.canEdit ? [{ label: 'Chỉnh sửa', onPress: () => router.push({ pathname: '/groups/[id]/create-post', params: { id: String(post.groupId), postId: String(post.id) } }) }] : []),
    ...(post.canDelete ? [{ label: 'Xóa bài viết', danger: true, onPress: () => setConfirmDelete(true) }] : []),
  ]

  const images = post.imageUrls ?? []
  const videos = post.videoUrls ?? []
  const allMedia = React.useMemo(() => {
    const list = [...(post.imageUrls ?? [])]
    ;(post.videoUrls ?? []).forEach((v) => {
      if (!list.includes(v)) list.push(v)
    })
    return list
  }, [post.imageUrls, post.videoUrls])
  const roleBadge = post.author.groupRole === 'OWNER' ? 'Chủ sở hữu' : post.author.groupRole === 'ADMIN' ? 'Quản trị viên' : null

  return (
    <Card accessibilityRole="link" style={{ marginBottom: 16, paddingHorizontal: 0, paddingBottom: 4 }} onPress={detail ? undefined : open}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }}>
        <Avatar uri={post.author.avatarUrl} name={post.author.fullName} size={42} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Txt weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>{post.author.fullName}</Txt>
            {roleBadge ? <Tag label={roleBadge} tone={post.author.groupRole === 'OWNER' ? 'warning' : 'primary'} /> : null}
          </View>
          <Txt muted size={12} numberOfLines={1}>{[post.author.roleLabel, new Date(post.createdAt).toLocaleDateString('vi-VN')].filter(Boolean).join(' · ')}</Txt>
        </View>
        {post.isPinned ? <Tag label="Đã ghim" icon={<Pin size={11} color={t.primary} />} /> : null}
        {actions.length ? (
          <Pressable onPress={() => setMenu(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Tùy chọn bài viết" style={{ padding: 4 }}>
            <MoreHorizontal size={20} color={t.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {post.topic ? <Tag label={`#${post.topic}`} tone="neutral" style={{ marginTop: 10, marginLeft: 14 }} /> : null}
      {post.content ? <Txt style={{ marginTop: 10, lineHeight: 22, paddingHorizontal: 14 }} numberOfLines={detail ? undefined : 6}>{post.content}</Txt> : null}
      {allMedia.length ? (
        <PostMedia
          postId={`group-${post.groupId}-${post.id}`}
          images={allMedia}
          onOpen={detail ? () => setViewer(0) : open}
          onDoubleLike={toggleLike}
        />
      ) : null}
      {likes > 0 || post.commentCount > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginTop: 10 }}>
          <Txt muted size={12} style={{ flex: 1 }}>{likes > 0 ? `${likes} lượt thích` : ''}</Txt>
          {post.commentCount > 0 ? <Txt muted size={12}>{`${post.commentCount} bình luận`}</Txt> : null}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginHorizontal: 8, borderTopWidth: 1, borderTopColor: t.divider, paddingTop: 2 }}>
        <ActionBtn onPress={toggleLike} label={liked ? 'Bỏ thích' : 'Thích'} text="Thích" active={liked} activeColor={t.danger} icon={<Heart size={19} color={liked ? t.danger : t.textMuted} fill={liked ? t.danger : 'transparent'} />} />
        <ActionBtn onPress={open} label="Bình luận" text="Bình luận" icon={<MessageCircle size={19} color={t.textMuted} />} />
        <ActionBtn onPress={() => setShareOpen(true)} label="Chia sẻ" text="Chia sẻ" icon={<Share2 size={18} color={t.textMuted} />} />
      </View>
      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        item={{
          title: post.author.fullName,
          subtitle: post.content || 'Bài viết trong nhóm',
          thumbnail: post.imageUrls?.[0] ?? null,
          avatarUrl: post.author.avatarUrl,
          path: groupPostPath(post.groupId, post.id),
          typeLabel: 'bài viết nhóm',
        }}
      />
      <ActionSheet visible={menu} onClose={() => setMenu(false)} actions={actions} />
      <ConfirmSheet
        visible={confirmDelete}
        title="Xóa bài viết thảo luận"
        message="Bạn có chắc chắn muốn xóa bài viết này không? Toàn bộ hình ảnh và bình luận liên quan cũng sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa bài viết"
        loading={del.isPending}
        onConfirm={() => del.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
      <ImageLightbox uris={images} index={viewer} onClose={() => setViewer(null)} />
    </Card>
  )
}

export const GroupPostCard = React.memo(GroupPostCardImpl)
