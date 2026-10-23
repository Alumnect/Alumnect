import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, MoreHorizontal, Pin, Share2 } from '@/components/icons'
import { Avatar, Card, Tag, Txt } from './ui'
import { ActionBtn } from './PostCard'
import { ActionSheet } from './ActionSheet'
import { ShareSheet } from './ShareSheet'
import { groupPostPath } from '@/lib/share'
import { groupApi } from '@/api/groups'
import type { GroupPost } from '@/api/groups'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** Thẻ bài viết nhóm: like lạc quan (UC126), menu sửa/xóa/ghim (UC125). */
function GroupPostCardImpl({ post, detail }: { post: GroupPost; detail?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [liked, setLiked] = useState(post.likedByViewer)
  const [likes, setLikes] = useState(post.likeCount)
  const [menu, setMenu] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
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
    onSuccess: () => { toast.success('Đã xóa bài viết.'); refresh(); if (detail) router.back() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const pin = useMutation({
    mutationFn: () => groupApi.togglePin(post.groupId, post.id),
    onSuccess: () => { toast.success(post.isPinned ? 'Đã bỏ ghim bài viết.' : 'Đã ghim bài viết.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })

  const toggleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setLiked(!liked)
    setLikes((n) => n + (liked ? -1 : 1))
    like.mutate()
  }
  const open = () => !detail && router.push({ pathname: '/groups/post/[groupId]/[postId]', params: { groupId: String(post.groupId), postId: String(post.id) } })
  const actions = [
    ...(post.canPin ? [{ label: post.isPinned ? 'Bỏ ghim' : 'Ghim bài viết', onPress: () => pin.mutate() }] : []),
    ...(post.canEdit ? [{ label: 'Chỉnh sửa', onPress: () => router.push({ pathname: '/groups/[id]/create-post', params: { id: String(post.groupId), postId: String(post.id) } }) }] : []),
    ...(post.canDelete ? [{ label: 'Xóa bài viết', danger: true, onPress: () => del.mutate() }] : []),
  ]

  const images = post.imageUrls ?? []

  return (
    <Card style={{ marginBottom: 10, paddingHorizontal: 0, paddingBottom: 4 }} onPress={detail ? undefined : open}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }}>
        <Avatar uri={post.author.avatarUrl} name={post.author.fullName} size={42} />
        <View style={{ flex: 1 }}>
          <Txt weight="700" numberOfLines={1}>{post.author.fullName}</Txt>
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
      {images.length ? (
        <View style={{ marginTop: 12, flexDirection: 'row', gap: 2 }}>
          {images.slice(0, 2).map((uri, i) => (
            <View key={uri + i} style={{ flex: 1 }}>
              <Image source={{ uri }} style={{ width: '100%', aspectRatio: images.length > 1 ? 0.85 : 1.4, backgroundColor: t.inputBg }} contentFit="cover" cachePolicy="disk" />
              {i === 1 && images.length > 2 ? (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
                  <Txt size={24} weight="800" color="#fff">{`+${images.length - 2}`}</Txt>
                </View>
              ) : null}
            </View>
          ))}
        </View>
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
    </Card>
  )
}

export const GroupPostCard = React.memo(GroupPostCardImpl)
