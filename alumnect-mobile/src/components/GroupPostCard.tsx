import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, MoreHorizontal, Pin } from 'lucide-react-native'
import { Avatar, Card, Txt } from './ui'
import { ActionSheet } from './ActionSheet'
import { groupApi } from '@/api/groups'
import type { GroupPost } from '@/api/groups'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** Thẻ bài viết nhóm: like lạc quan (UC126), menu sửa/xóa/ghim (UC125). */
export function GroupPostCard({ post, detail }: { post: GroupPost; detail?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [liked, setLiked] = useState(post.likedByViewer)
  const [likes, setLikes] = useState(post.likeCount)
  const [menu, setMenu] = useState(false)
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

  return (
    <Card style={{ marginBottom: 12 }} onPress={detail ? undefined : open}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar uri={post.author.avatarUrl} name={post.author.fullName} size={40} />
        <View style={{ flex: 1 }}>
          <Txt weight="700">{post.author.fullName}</Txt>
          <Txt muted size={12}>{[post.author.roleLabel, new Date(post.createdAt).toLocaleDateString('vi-VN')].filter(Boolean).join(' · ')}</Txt>
        </View>
        {post.isPinned ? <Pin size={16} color={t.primary} /> : null}
        {actions.length ? <Pressable onPress={() => setMenu(true)} hitSlop={10}><MoreHorizontal size={20} color={t.textMuted} /></Pressable> : null}
      </View>
      {post.topic ? <Txt size={12} color={t.primary} weight="700" style={{ marginTop: 8 }}>#{post.topic}</Txt> : null}
      <Txt style={{ marginTop: 8, lineHeight: 21 }} numberOfLines={detail ? undefined : 8}>{post.content}</Txt>
      {post.imageUrls?.[0] ? <Image source={{ uri: post.imageUrls[0] }} style={{ marginTop: 10, width: '100%', aspectRatio: 1.6, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" /> : null}
      <View style={{ flexDirection: 'row', gap: 20, marginTop: 12 }}>
        <Pressable onPress={toggleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Heart size={20} color={liked ? t.danger : t.textMuted} fill={liked ? t.danger : 'transparent'} />
          <Txt muted size={13}>{likes}</Txt>
        </Pressable>
        <Pressable onPress={open} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MessageCircle size={20} color={t.textMuted} />
          <Txt muted size={13}>{post.commentCount}</Txt>
        </Pressable>
      </View>
      <ActionSheet visible={menu} onClose={() => setMenu(false)} actions={actions} />
    </Card>
  )
}
