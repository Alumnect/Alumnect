import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react-native'
import { Avatar, Empty, Loading, Screen, Txt } from '@/components/ui'
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

  const post = useQuery({ queryKey: ['group-post', gid, pid], queryFn: () => groupApi.post(gid, pid) })
  const comments = useInfiniteQuery({
    queryKey: ['group-post', gid, pid, 'comments'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => groupApi.comments(gid, pid, pageParam),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = comments.data?.pages.flatMap((x) => x.items) ?? []
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['group-post', gid, pid] })
    qc.invalidateQueries({ queryKey: ['group-posts', gid] })
  }

  const send = useMutation({
    mutationFn: () => (editing ? groupApi.updateComment(gid, pid, editing.id, text.trim()) : groupApi.createComment(gid, pid, text.trim())),
    onSuccess: () => { toast.success(editing ? 'Đã cập nhật bình luận.' : 'Đã gửi bình luận!'); setText(''); setEditing(null); refresh() },
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
    <Screen edges={['top', 'bottom']}>
      <Header title="Bài viết nhóm" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlashList
          data={items}
          keyExtractor={(c) => String(c.id)}
          onEndReached={() => comments.hasNextPage && comments.fetchNextPage()}
          ListHeaderComponent={<View style={{ padding: 16, paddingBottom: 4 }}><GroupPostCard post={post.data} detail /><Txt weight="700">Bình luận</Txt></View>}
          ListEmptyComponent={<Txt muted style={{ textAlign: 'center', padding: 24 }}>Chưa có bình luận nào.</Txt>}
          renderItem={({ item }) => (
            <Pressable onLongPress={() => (item.canEdit || item.canDelete) && setSel(item)} style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
              <Avatar uri={item.author.avatarUrl} name={item.author.fullName} size={34} />
              <View style={{ flex: 1, backgroundColor: t.inputBg, borderRadius: 12, padding: 10 }}>
                <Txt weight="700" size={13}>{item.author.fullName}</Txt>
                <Txt>{item.content}</Txt>
                <Txt muted size={11} style={{ marginTop: 2 }}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Txt>
              </View>
            </Pressable>
          )}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg }}>
          <TextInput value={text} onChangeText={setText} placeholder={editing ? 'Sửa bình luận...' : 'Viết bình luận...'} placeholderTextColor={t.textMuted} style={{ flex: 1, backgroundColor: t.inputBg, color: t.text, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }} />
          <Pressable onPress={() => text.trim() && send.mutate()} disabled={send.isPending} hitSlop={8}><Send size={22} color={text.trim() ? t.primary : t.textMuted} /></Pressable>
        </View>
      </KeyboardAvoidingView>
      <ActionSheet
        visible={!!sel}
        onClose={() => setSel(null)}
        actions={sel ? [
          ...(sel.canEdit ? [{ label: 'Sửa bình luận', onPress: () => { setEditing(sel); setText(sel.content) } }] : []),
          ...(sel.canDelete ? [{ label: 'Xóa bình luận', danger: true, onPress: () => del.mutate(sel) }] : []),
        ] : []}
      />
    </Screen>
  )
}
