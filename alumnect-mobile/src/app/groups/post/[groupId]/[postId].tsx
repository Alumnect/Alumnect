import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle } from '@/components/icons'
import { Empty, Loading, Screen, Txt } from '@/components/ui'
import { CommentBubble, CommentComposer } from '@/components/Comments'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { GroupPostCard } from '@/components/GroupPostCard'
import { groupApi } from '@/api/groups'
import type { GroupComment } from '@/api/groups'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC127–128: chi tiết bài viết nhóm + bình luận (thêm/sửa/xóa). */
export default function GroupPostDetailScreen() {
  const t = useTheme()
  const qc = useQueryClient()
  const p = useLocalSearchParams<{ groupId: string; postId: string }>()
  const gid = Number(p.groupId)
  const pid = Number(p.postId)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<GroupComment | null>(null)
  const [sel, setSel] = useState<GroupComment | null>(null)
  const [replyTo, setReplyTo] = useState<GroupComment | null>(null)

  const post = useQuery({ queryKey: ['group-post', gid, pid], queryFn: () => groupApi.post(gid, pid) })
  const comments = useInfiniteQuery({
    queryKey: ['group-post', gid, pid, 'comments'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => groupApi.comments(gid, pid, pageParam),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const raw = comments.data?.pages.flatMap((x) => x.items) ?? []
  const roots = raw.filter((c) => !c.parentId || !raw.some((r) => r.id === c.parentId))
  const items = roots.flatMap((r) => [r, ...raw.filter((c) => c.parentId === r.id)])
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['group-post', gid, pid] })
    qc.invalidateQueries({ queryKey: ['group-posts', gid] })
  }

  const send = useMutation({
    mutationFn: () => (editing ? groupApi.updateComment(gid, pid, editing.id, text.trim()) : groupApi.createComment(gid, pid, text.trim(), replyTo ? replyTo.parentId ?? replyTo.id : undefined)),
    onSuccess: () => { toast.success(editing ? 'Đã cập nhật bình luận.' : 'Đã gửi bình luận!'); setText(''); setEditing(null); setReplyTo(null); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const del = useMutation({
    mutationFn: (c: GroupComment) => groupApi.deleteComment(gid, pid, c.id),
    onSuccess: () => { toast.success('Đã xóa bình luận.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })

  if (post.isLoading) return <Screen><Header title="Bài viết" /><Loading /></Screen>
  if (!post.data) return <Screen><Header title="Bài viết" /><Empty text="Không tìm thấy bài viết." /></Screen>

  return (
    <Screen bg={t.card}>
      <Header title={`Bài viết của ${post.data.author.fullName}`} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlashList
          data={items}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ paddingBottom: 12 }}
          onEndReached={() => comments.hasNextPage && !comments.isFetchingNextPage && comments.fetchNextPage()}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.bg, paddingTop: 10, paddingHorizontal: 16 }}>
                <GroupPostCard post={post.data} detail />
              </View>
              <Txt weight="800" size={16} style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>Bình luận</Txt>
            </View>
          }
          ListEmptyComponent={comments.isLoading ? <Loading /> : <Empty icon={<MessageCircle size={26} color={t.primary} />} title="Chưa có bình luận" text="Hãy là người đầu tiên bình luận." />}
          renderItem={({ item }) => (
            <CommentBubble
              author={item.author.fullName}
              authorId={item.author.userId}
              avatar={item.author.avatarUrl}
              text={item.content}
              time={new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              reply={!!item.parentId}
              mine={item.canEdit || item.canDelete}
              onReply={() => { setEditing(null); setReplyTo(item) }}
              onMore={item.canEdit || item.canDelete ? () => setSel(item) : undefined}
            />
          )}
        />
        <CommentComposer
          value={text}
          onChangeText={setText}
          onSend={() => send.mutate()}
          sending={send.isPending}
          placeholder={replyTo ? `Trả lời ${replyTo.author.fullName}...` : 'Viết bình luận...'}
          context={editing ? 'Đang sửa bình luận' : replyTo ? `Đang trả lời ${replyTo.author.fullName}` : null}
          onCancelContext={() => { setEditing(null); setReplyTo(null); setText('') }}
          autoFocusKey={replyTo?.id ?? editing?.id ?? null}
        />
      </KeyboardAvoidingView>
      <ActionSheet
        visible={!!sel}
        onClose={() => setSel(null)}
        actions={sel ? [
          ...(sel.canEdit ? [{ label: 'Sửa bình luận', onPress: () => { setReplyTo(null); setEditing(sel); setText(sel.content) } }] : []),
          ...(sel.canDelete ? [{ label: 'Xóa bình luận', danger: true, onPress: () => del.mutate(sel) }] : []),
        ] : []}
      />
    </Screen>
  )
}
