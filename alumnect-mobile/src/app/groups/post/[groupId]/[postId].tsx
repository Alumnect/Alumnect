import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Lock } from '@/components/icons'
import { Empty, Loading, Screen, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { CommentBubble, CommentComposer } from '@/components/Comments'
import { Header } from '@/components/Header'
import { withGroupsAlumniOnly } from '@/components/GroupsAlumniOnly'
import { ActionSheet } from '@/components/ActionSheet'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { GroupPostCard } from '@/components/GroupPostCard'
import { groupApi } from '@/api/groups'
import type { GroupComment } from '@/api/groups'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC127–128: chi tiết bài viết nhóm + bình luận (thêm/sửa/xóa); chỉ thành viên nhóm đang hoạt động mới bình luận được. */
function GroupPostDetailScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const p = useLocalSearchParams<{ groupId: string; postId: string }>()
  const gid = Number(p.groupId)
  const pid = Number(p.postId)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<GroupComment | null>(null)
  const [sel, setSel] = useState<GroupComment | null>(null)
  const [replyTo, setReplyTo] = useState<GroupComment | null>(null)
  const [deleting, setDeleting] = useState<GroupComment | null>(null)
  const validIds = Number.isFinite(gid) && gid > 0 && Number.isFinite(pid) && pid > 0

  const group = useQuery({ queryKey: ['group', p.groupId], queryFn: () => groupApi.get(p.groupId), enabled: validIds })
  const post = useQuery({ queryKey: ['group-post', gid, pid], queryFn: () => groupApi.post(gid, pid), enabled: validIds })
  const canComment = group.data?.viewerMembershipStatus === 'ACTIVE' && group.data?.status === 'ACTIVE'
  const comments = useInfiniteQuery({
    queryKey: ['group-post', gid, pid, 'comments'],
    enabled: validIds && !!post.data,
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
    onSuccess: () => { toast.success('Đã xóa bình luận.'); setDeleting(null); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })

  const backToGroup = () => router.replace({ pathname: '/groups/[id]', params: { id: String(gid) } })
  if (!validIds) return <Screen><Header title="Bài viết" /><Empty title="Không tìm thấy bài viết" text="Đường dẫn bài viết không hợp lệ." action="Về danh sách hội nhóm" onAction={() => router.replace('/groups')} /></Screen>
  if (post.isLoading || group.isLoading) return <Screen><Header title="Bài viết" /><Loading /></Screen>
  if (!post.data) {
    const status = (post.error as { status?: number } | null)?.status
    if (status === 403) {
      return (
        <Screen>
          <Header title="Bài viết" />
          <Empty icon={<Lock size={26} color={t.primary} />} title="Hội nhóm riêng tư" text="Chỉ thành viên của hội nhóm mới xem được bài viết này. Hãy tham gia hội nhóm để xem nội dung và thảo luận cùng mọi người." action="Xem hội nhóm" onAction={backToGroup} />
        </Screen>
      )
    }
    if (status === 404) {
      return (
        <Screen>
          <Header title="Bài viết" />
          <Empty title="Không tìm thấy bài viết" text="Bài viết này không tồn tại, đã bị xóa hoặc hội nhóm không còn khả dụng." action="Về hội nhóm" onAction={backToGroup} />
        </Screen>
      )
    }
    return <Screen><Header title="Bài viết" /><Empty title="Không tải được bài viết" text="Không tải được bài viết." error={post.error} onRetry={() => { void post.refetch() }} /></Screen>
  }

  return (
    <Screen bg={t.card}>
      <Header title={group.data ? group.data.name : `Bài viết của ${post.data.author.fullName}`} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlashList
          data={items}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ paddingBottom: 12 }}
          onEndReached={() => comments.hasNextPage && !comments.isFetchingNextPage && comments.fetchNextPage()}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.bg, paddingTop: 10, paddingHorizontal: 16 }}>
                <GroupPostCard post={post.data} detail canInteract={canComment} />
              </View>
              <Txt weight="800" size={16} style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>Bình luận</Txt>
            </View>
          }
          ListEmptyComponent={comments.isLoading ? <Loading /> : <Empty error={comments.error} onRetry={() => { void comments.refetch() }} icon={<BrandIcon name="chat" size={56} />} title="Chưa có bình luận" text={canComment ? 'Hãy là người đầu tiên bình luận.' : 'Bài viết chưa có bình luận nào.'} />}
          renderItem={({ item }) => (
            <CommentBubble
              author={item.author.fullName}
              authorId={item.author.userId}
              avatar={item.author.avatarUrl}
              text={item.content}
              time={new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              reply={!!item.parentId}
              mine={item.canEdit || item.canDelete}
              onReply={canComment ? () => { setEditing(null); setReplyTo(item) } : undefined}
              onMore={item.canEdit || item.canDelete ? () => setSel(item) : undefined}
            />
          )}
        />
        {canComment ? (
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
        ) : (
          <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: t.divider, backgroundColor: t.card }}>
            <Txt muted size={13} style={{ textAlign: 'center' }}>
              {group.data?.status === 'INACTIVE' ? 'Hội nhóm đang tạm ngừng tương tác.' : 'Vui lòng tham gia hội nhóm để tham gia bình luận.'}
            </Txt>
          </View>
        )}
      </KeyboardAvoidingView>
      <ActionSheet
        visible={!!sel}
        onClose={() => setSel(null)}
        actions={sel ? [
          ...(sel.canEdit && canComment ? [{ label: 'Sửa bình luận', onPress: () => { setReplyTo(null); setEditing(sel); setText(sel.content) } }] : []),
          ...(sel.canDelete ? [{ label: 'Xóa bình luận', danger: true, onPress: () => setDeleting(sel) }] : []),
        ] : []}
      />
      <ConfirmSheet
        visible={!!deleting}
        title="Xóa bình luận"
        message="Bạn có chắc chắn muốn xóa bình luận này không?"
        confirmLabel="Xóa bình luận"
        loading={del.isPending}
        onConfirm={() => { if (deleting) del.mutate(deleting) }}
        onClose={() => setDeleting(null)}
      />
    </Screen>
  )
}

export default withGroupsAlumniOnly(GroupPostDetailScreen)
