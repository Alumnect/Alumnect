import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Send } from 'lucide-react-native'
import { Avatar, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { VoteButton } from '@/components/VoteButton'
import { forumApi } from '@/api/forum'
import type { AnswerBase } from '@/api/forum'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

type Target = { answer: AnswerBase; mine: boolean } | null

export default function QuestionDetailScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const me = useAuthStore((s) => s.user)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<AnswerBase | null>(null)
  const [editing, setEditing] = useState<AnswerBase | null>(null)
  const [target, setTarget] = useState<Target>(null)
  const [qMenu, setQMenu] = useState(false)

  const question = useQuery({ queryKey: ['question', id], queryFn: () => forumApi.get(id!) })
  const answers = useInfiniteQuery({
    queryKey: ['question', id, 'answers'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => forumApi.answers(id!, pageParam),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
  })
  const list = answers.data?.pages.flatMap((p) => p.items) ?? []
  const refresh = () => qc.invalidateQueries({ queryKey: ['question', id] })

  const send = useMutation({
    mutationFn: () => {
      const body = text.trim()
      return editing ? forumApi.updateAnswer(id!, editing.id, body) : forumApi.answer(id!, body, replyTo?.parentId ?? replyTo?.id)
    },
    onSuccess: () => {
      toast.success(editing ? 'Đã cập nhật câu trả lời.' : 'Đã gửi câu trả lời!')
      setText(''); setEditing(null); setReplyTo(null)
      refresh()
      qc.invalidateQueries({ queryKey: ['forum'] })
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const delAnswer = useMutation({
    mutationFn: (a: AnswerBase) => forumApi.deleteAnswer(id!, a.id),
    onSuccess: () => { toast.success('Đã xóa câu trả lời.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const delQuestion = useMutation({
    mutationFn: () => forumApi.remove(id!),
    onSuccess: () => { toast.success('Đã xóa câu hỏi.'); qc.invalidateQueries({ queryKey: ['forum'] }); router.back() },
    onError: (e) => toast.error(errMsg(e)),
  })

  if (question.isLoading) return <Screen><Header title="Câu hỏi" /><Loading /></Screen>
  const qd = question.data
  if (!qd) return <Screen><Header title="Câu hỏi" /><Empty text="Không tìm thấy câu hỏi." /></Screen>
  const isMine = qd.authorId === me?.id

  const renderAnswer = (a: AnswerBase, indent: boolean) => (
    <View key={a.id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, paddingLeft: indent ? 40 : 0 }}>
      <Avatar uri={a.avatar} name={a.author} size={indent ? 28 : 34} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Txt weight="700" size={13} style={{ flex: 1 }}>{a.author}{a.edited ? ' · đã sửa' : ''}</Txt>
          {a.authorId === me?.id ? (
            <Pressable onPress={() => setTarget({ answer: a, mine: true })} hitSlop={8}><MoreHorizontal size={18} color={t.textMuted} /></Pressable>
          ) : null}
        </View>
        <Txt style={{ marginTop: 2 }}>{a.body}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 }}>
          <VoteButton voted={a.voted} votes={a.votes} onVote={() => forumApi.voteAnswer(id!, a.id)} onUnvote={() => forumApi.unvoteAnswer(id!, a.id)} />
          <Txt muted size={12} onPress={() => { setReplyTo(a); setEditing(null) }}>Trả lời</Txt>
          <Txt muted size={12}>{a.time}</Txt>
        </View>
      </View>
    </View>
  )

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Câu hỏi" right={isMine ? <Pressable onPress={() => setQMenu(true)} hitSlop={10}><MoreHorizontal size={22} color={t.text} /></Pressable> : undefined} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlashList
          data={list}
          keyExtractor={(a) => a.id}
          onEndReached={() => answers.hasNextPage && answers.fetchNextPage()}
          ListHeaderComponent={
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar uri={qd.avatar} name={qd.author} size={40} />
                <View style={{ flex: 1 }}>
                  <Txt weight="700">{qd.author}</Txt>
                  <Txt muted size={12} numberOfLines={1}>{qd.authorHeadline}</Txt>
                </View>
              </View>
              <Txt size={20} weight="800" style={{ marginTop: 12 }}>{qd.title}</Txt>
              <Txt style={{ marginTop: 8, lineHeight: 22 }}>{qd.body}</Txt>
              {qd.images.map((u) => <Image key={u} source={{ uri: u }} style={{ width: '100%', aspectRatio: 1.6, borderRadius: 12, marginTop: 10 }} contentFit="cover" />)}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 }}>
                <VoteButton voted={qd.voted} votes={qd.votes} onVote={() => forumApi.vote(qd.id)} onUnvote={() => forumApi.unvote(qd.id)} />
                {qd.topic ? <Txt size={12} color={t.primary} weight="600">{qd.topic}</Txt> : null}
                {qd.major ? <Txt size={12} muted>{qd.major}</Txt> : null}
              </View>
              <Txt weight="700" size={16} style={{ marginTop: 20 }}>Câu trả lời</Txt>
            </View>
          }
          ListEmptyComponent={<Txt muted style={{ textAlign: 'center', padding: 24 }}>Chưa có câu trả lời nào.</Txt>}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              {renderAnswer(item, false)}
              {item.replies.map((r) => renderAnswer(r, true))}
            </View>
          )}
        />
        {replyTo || editing ? (
          <Txt muted size={12} style={{ paddingHorizontal: 16 }} onPress={() => { setReplyTo(null); setEditing(null); setText('') }}>
            {editing ? 'Đang sửa câu trả lời' : `Đang trả lời ${replyTo?.author}`} — chạm để hủy
          </Txt>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg }}>
          <TextInput value={text} onChangeText={setText} placeholder="Viết câu trả lời..." placeholderTextColor={t.textMuted} multiline style={{ flex: 1, maxHeight: 100, backgroundColor: t.inputBg, color: t.text, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }} />
          <Pressable onPress={() => text.trim() && send.mutate()} disabled={send.isPending} hitSlop={8}>
            <Send size={22} color={text.trim() ? t.primary : t.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ActionSheet
        visible={!!target}
        onClose={() => setTarget(null)}
        actions={target ? [
          { label: 'Sửa câu trả lời', onPress: () => { setEditing(target.answer); setReplyTo(null); setText(target.answer.body) } },
          { label: 'Xóa câu trả lời', danger: true, onPress: () => delAnswer.mutate(target.answer) },
        ] : []}
      />
      <ActionSheet
        visible={qMenu}
        onClose={() => setQMenu(false)}
        actions={[
          { label: 'Sửa câu hỏi', onPress: () => router.push({ pathname: '/forum/edit/[id]', params: { id: qd.id } }) },
          { label: 'Xóa câu hỏi', danger: true, onPress: () => delQuestion.mutate() },
        ]}
      />
    </Screen>
  )
}
