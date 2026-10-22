import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react-native'
import { Avatar, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { PostCard } from '@/components/PostCard'
import { ActionSheet } from '@/components/ActionSheet'
import { feedApi } from '@/api/feed'
import type { Comment } from '@/api/feed'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

export default function PostDetailScreen() {
  const t = useTheme()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const me = useAuthStore((s) => s.user)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<Comment | null>(null)
  const [selected, setSelected] = useState<Comment | null>(null)

  const post = useQuery({ queryKey: ['post', id], queryFn: () => feedApi.getPost(id!) })
  const comments = useInfiniteQuery({
    queryKey: ['post', id, 'comments'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getComments(id!, pageParam),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const items = comments.data?.pages.flatMap((p) => p.items) ?? []
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['post', id, 'comments'] })
    qc.invalidateQueries({ queryKey: ['post', id] })
  }

  const send = useMutation({
    mutationFn: () => (editing ? feedApi.updateComment(id!, editing.id, text.trim()) : feedApi.createComment(id!, text.trim())),
    onSuccess: () => {
      toast.success(editing ? 'Đã cập nhật bình luận.' : 'Đã gửi bình luận!')
      setText('')
      setEditing(null)
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

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Bài viết" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlashList
          data={items}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={
            <View style={{ padding: 16, paddingBottom: 4 }}>
              <PostCard post={post.data} detail />
              <Txt weight="700" style={{ marginTop: 4 }}>Bình luận</Txt>
            </View>
          }
          ListEmptyComponent={<Txt muted style={{ textAlign: 'center', padding: 24 }}>Chưa có bình luận nào.</Txt>}
          onEndReached={() => comments.hasNextPage && comments.fetchNextPage()}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => item.authorId === me?.id && setSelected(item)}
              style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 8, paddingLeft: item.parentId ? 56 : 16 }}
            >
              <Avatar uri={item.avatar} name={item.author} size={34} />
              <View style={{ flex: 1, backgroundColor: t.inputBg, borderRadius: 12, padding: 10 }}>
                <Txt weight="700" size={13}>{item.author}</Txt>
                <Txt size={14}>{item.text}</Txt>
                <Txt muted size={11} style={{ marginTop: 2 }}>{item.time}</Txt>
              </View>
            </Pressable>
          )}
        />
        {editing ? (
          <Txt muted size={12} style={{ paddingHorizontal: 16 }} onPress={() => { setEditing(null); setText('') }}>
            Đang sửa bình luận — chạm để hủy
          </Txt>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Viết bình luận..."
            placeholderTextColor={t.textMuted}
            style={{ flex: 1, backgroundColor: t.inputBg, color: t.text, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}
          />
          <Pressable onPress={() => text.trim() && send.mutate()} disabled={send.isPending} hitSlop={8}>
            <Send size={22} color={text.trim() ? t.primary : t.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <ActionSheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        actions={
          selected
            ? [
                { label: 'Sửa bình luận', onPress: () => { setEditing(selected); setText(selected.text) } },
                { label: 'Xóa bình luận', danger: true, onPress: () => del.mutate(selected) },
              ]
            : []
        }
      />
    </Screen>
  )
}
