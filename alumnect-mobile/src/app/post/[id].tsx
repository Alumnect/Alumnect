import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle } from '@/components/icons'
import { Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { PostCard } from '@/components/PostCard'
import { ActionSheet } from '@/components/ActionSheet'
import { CommentBubble, CommentComposer } from '@/components/Comments'
import { feedApi } from '@/api/feed'
import type { Comment } from '@/api/feed'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** Sắp bình luận để phản hồi nằm ngay dưới bình luận gốc. */
function thread(items: Comment[]) {
  const roots = items.filter((c) => !c.parentId || !items.some((p) => p.id === c.parentId))
  return roots.flatMap((r) => [r, ...items.filter((c) => c.parentId === r.id)])
}

export default function PostDetailScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const me = useAuthStore((s) => s.user)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<Comment | null>(null)
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [selected, setSelected] = useState<Comment | null>(null)

  const post = useQuery({ queryKey: ['post', id], queryFn: () => feedApi.getPost(id!) })
  const comments = useInfiniteQuery({
    queryKey: ['post', id, 'comments'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getComments(id!, pageParam),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = thread(comments.data?.pages.flatMap((p) => p.items) ?? [])
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['post', id, 'comments'] })
    qc.invalidateQueries({ queryKey: ['post', id] })
  }
  const reset = () => {
    setText('')
    setEditing(null)
    setReplyTo(null)
  }

  const send = useMutation({
    mutationFn: () => {
      if (editing) return feedApi.updateComment(id!, editing.id, text.trim())
      const parent = replyTo ? replyTo.parentId ?? replyTo.id : undefined
      return feedApi.createComment(id!, text.trim(), parent ?? undefined)
    },
    onSuccess: () => {
      toast.success(editing ? 'Đã cập nhật bình luận.' : 'Đã gửi bình luận!')
      reset()
      refresh()
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const del = useMutation({
    mutationFn: (c: Comment) => feedApi.deleteComment(id!, c.id),
    onSuccess: () => {
      toast.success('Đã xóa bình luận.')
      refresh()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  if (post.isLoading) return <Screen><Header title="Bài viết" /><Loading /></Screen>
  if (!post.data) return <Screen><Header title="Bài viết" /><Empty text="Không tìm thấy bài viết hoặc bạn không có quyền xem." /></Screen>

  const context = editing ? 'Đang sửa bình luận' : replyTo ? `Đang trả lời ${replyTo.author}` : null

  return (
    <Screen bg={t.card}>
      <Header title={`Bài viết của ${post.data.author}`} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={Platform.OS === 'android' ? insets.top : 0}
      >
        <FlashList
          data={items}
          keyExtractor={(c) => c.id}
          style={{ backgroundColor: t.card }}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.bg, paddingTop: 10 }}>
                <View style={{ paddingHorizontal: 16 }}>
                  <PostCard post={post.data} detail />
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
                <Txt weight="800" size={16} style={{ flex: 1 }}>Bình luận</Txt>
                <Txt muted size={13}>{post.data.comments}</Txt>
              </View>
            </View>
          }
          ListEmptyComponent={
            comments.isLoading ? <Loading /> : <Empty icon={<MessageCircle size={26} color={t.primary} />} title="Chưa có bình luận" text="Hãy là người đầu tiên bình luận." />
          }
          contentContainerStyle={{ paddingBottom: 12 }}
          onEndReached={() => comments.hasNextPage && !comments.isFetchingNextPage && comments.fetchNextPage()}
          renderItem={({ item }) => (
            <CommentBubble
              author={item.author}
              authorId={item.authorId}
              avatar={item.avatar}
              text={item.text}
              time={item.time}
              reply={!!item.parentId}
              mine={item.authorId === me?.id}
              onReply={() => {
                setEditing(null)
                setReplyTo(item)
              }}
              onMore={item.authorId === me?.id ? () => setSelected(item) : undefined}
            />
          )}
        />
        <CommentComposer
          value={text}
          onChangeText={setText}
          onSend={() => send.mutate()}
          sending={send.isPending}
          placeholder={replyTo ? `Trả lời ${replyTo.author}...` : 'Viết bình luận...'}
          context={context}
          onCancelContext={reset}
          autoFocusKey={replyTo?.id ?? editing?.id ?? null}
        />
      </KeyboardAvoidingView>
      <ActionSheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        actions={
          selected
            ? [
                { label: 'Sửa bình luận', onPress: () => { setReplyTo(null); setEditing(selected); setText(selected.text) } },
                { label: 'Xóa bình luận', danger: true, onPress: () => del.mutate(selected) },
              ]
            : []
        }
      />
    </Screen>
  )
}
