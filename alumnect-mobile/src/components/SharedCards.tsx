import React from 'react'
import { View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Award, Briefcase, Calendar, FileText, Lock, Users } from 'lucide-react-native'
import { Avatar, Card, Txt } from './ui'
import { feedApi } from '@/api/feed'
import { groupApi } from '@/api/groups'
import type { SharedLink } from '@/lib/share'
import { useTheme } from '@/theme'

const STALE = 5 * 60_000

function Shell({ onPress, children, mine }: { onPress?: () => void; children: React.ReactNode; mine?: boolean }) {
  const t = useTheme()
  return (
    <Card onPress={onPress} style={{ width: 250, padding: 10, borderColor: mine ? t.primary : t.border }}>
      {children}
    </Card>
  )
}

function Fallback({ text, onPress, mine }: { text: string; onPress?: () => void; mine?: boolean }) {
  return (
    <Shell onPress={onPress} mine={mine}>
      <Txt muted size={13}>{text}</Txt>
    </Shell>
  )
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: t.primaryTint, marginBottom: 4 }}>
      {icon}
      <Txt size={11} weight="700" color={t.primary}>{label}</Txt>
    </View>
  )
}

function PostCardShared({ postId, mine }: { postId: string; mine?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const open = () => router.push({ pathname: '/post/[id]', params: { id: postId } })
  const q = useQuery({ queryKey: ['shared', 'post', postId], queryFn: () => feedApi.getPost(postId), staleTime: STALE, retry: false })
  if (q.isLoading) return <Fallback text="Đang tải bài viết..." mine={mine} />
  const p = q.data
  if (q.isError || !p) return <Fallback text={`Xem bài viết #${postId}`} onPress={open} mine={mine} />
  const thumb = p.image || p.images?.[0]
  const badge = p.event || p.type === 'event'
    ? { icon: <Calendar size={11} color={t.primary} />, label: 'Sự kiện' }
    : p.job || p.type === 'recruitment'
      ? { icon: <Briefcase size={11} color={t.primary} />, label: 'Tuyển dụng' }
      : p.type === 'achievement'
        ? { icon: <Award size={11} color={t.primary} />, label: 'Thành tựu' }
        : { icon: <FileText size={11} color={t.primary} />, label: 'Bài viết' }
  return (
    <Shell onPress={open} mine={mine}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Avatar uri={p.avatar} name={p.author} size={28} />
        <Txt weight="700" size={13} numberOfLines={1} style={{ flex: 1 }}>{p.author}</Txt>
      </View>
      <Badge {...badge} />
      <Txt size={13} numberOfLines={3}>{p.job?.title || p.event?.title || p.text}</Txt>
      {thumb ? <Image source={{ uri: thumb }} style={{ marginTop: 8, width: '100%', height: 110, borderRadius: 10 }} contentFit="cover" cachePolicy="disk" /> : null}
      <Txt size={12} weight="700" color={t.primary} style={{ marginTop: 8 }}>Xem bài viết</Txt>
    </Shell>
  )
}

function GroupCardShared({ groupId, mine }: { groupId: string; mine?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const open = () => router.push({ pathname: '/groups/[id]', params: { id: groupId } })
  const q = useQuery({ queryKey: ['shared', 'group', groupId], queryFn: () => groupApi.get(groupId), staleTime: STALE, retry: false })
  if (q.isLoading) return <Fallback text="Đang tải hội nhóm..." mine={mine} />
  const g = q.data
  if (q.isError || !g) return <Fallback text={`Xem hội nhóm #${groupId}`} onPress={open} mine={mine} />
  return (
    <Shell onPress={open} mine={mine}>
      {g.coverImageUrl ? <Image source={{ uri: g.coverImageUrl }} style={{ width: '100%', height: 90, borderRadius: 10, marginBottom: 8 }} contentFit="cover" cachePolicy="disk" /> : null}
      <Badge icon={<Users size={11} color={t.primary} />} label="Hội nhóm" />
      <Txt weight="700" numberOfLines={2}>{g.name}</Txt>
      <Txt muted size={12} style={{ marginTop: 2 }}>{g.memberCount} thành viên{g.privacy === 'PRIVATE' ? ' · Riêng tư' : ''}</Txt>
      {g.description ? <Txt muted size={12} numberOfLines={2} style={{ marginTop: 2 }}>{g.description}</Txt> : null}
      <Txt size={12} weight="700" color={t.primary} style={{ marginTop: 8 }}>Xem nhóm</Txt>
    </Shell>
  )
}

function GroupPostCardShared({ groupId, postId, mine }: { groupId: string; postId: string; mine?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const open = () => router.push({ pathname: '/groups/post/[groupId]/[postId]', params: { groupId, postId } })
  const q = useQuery({
    queryKey: ['shared', 'group-post', groupId, postId],
    queryFn: () => groupApi.post(Number(groupId), Number(postId)),
    staleTime: STALE,
    retry: false,
  })
  if (q.isLoading) return <Fallback text="Đang tải bài viết nhóm..." mine={mine} />
  const status = (q.error as { status?: number } | null)?.status
  if (status === 401 || status === 403) {
    return (
      <Shell mine={mine}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Lock size={14} color={t.textMuted} />
          <Txt muted size={13} style={{ flex: 1 }}>Bài viết trong nhóm riêng tư. Tham gia nhóm để xem.</Txt>
        </View>
        <Txt size={12} weight="700" color={t.primary} style={{ marginTop: 8 }} onPress={() => router.push({ pathname: '/groups/[id]', params: { id: groupId } })}>Xem nhóm</Txt>
      </Shell>
    )
  }
  const p = q.data
  if (q.isError || !p) return <Fallback text="Bài viết nhóm không còn khả dụng." onPress={open} mine={mine} />
  return (
    <Shell onPress={open} mine={mine}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Avatar uri={p.author.avatarUrl} name={p.author.fullName} size={28} />
        <Txt weight="700" size={13} numberOfLines={1} style={{ flex: 1 }}>{p.author.fullName}</Txt>
      </View>
      <Badge icon={<Users size={11} color={t.primary} />} label="Bài viết nhóm" />
      <Txt size={13} numberOfLines={3}>{p.content}</Txt>
      {p.imageUrls?.[0] ? <Image source={{ uri: p.imageUrls[0] }} style={{ marginTop: 8, width: '100%', height: 110, borderRadius: 10 }} contentFit="cover" cachePolicy="disk" /> : null}
      <Txt size={12} weight="700" color={t.primary} style={{ marginTop: 8 }}>Xem bài viết</Txt>
    </Shell>
  )
}

/** Thẻ tương tác bên dưới tin nhắn chia sẻ (bài viết / hội nhóm / bài viết nhóm). */
function SharedCardImpl({ link, mine }: { link: SharedLink; mine?: boolean }) {
  if (link.kind === 'post') return <PostCardShared postId={link.postId} mine={mine} />
  if (link.kind === 'group') return <GroupCardShared groupId={link.groupId} mine={mine} />
  return <GroupPostCardShared groupId={link.groupId} postId={link.postId} mine={mine} />
}

export const SharedCard = React.memo(SharedCardImpl)
