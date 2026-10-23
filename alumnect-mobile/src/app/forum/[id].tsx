import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, MessageSquare, MoreHorizontal } from '@/components/icons'
import { Avatar, Card, Empty, IconButton, Loading, Screen, Tag, Txt } from '@/components/ui'
import { CommentComposer } from '@/components/Comments'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { VoteButton } from '@/components/VoteButton'
import { forumApi } from '@/api/forum'
import type { AnswerBase } from '@/api/forum'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

type Target = { answer: AnswerBase; mine: boolean } | null

/** Một câu trả lời (hoặc phản hồi): tác giả, nội dung, bình chọn, trả lời. */
const AnswerItem = React.memo(function AnswerItem({
  a,
  qid,
  meId,
  reply,
  onReply,
  onMore,
}: {
  a: AnswerBase
  qid: string
  meId?: string
  reply?: boolean
  onReply: (a: AnswerBase) => void
  onMore: (a: AnswerBase) => void
}) {
  const t = useTheme()
  const router = useRouter()
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
      <Pressable onPress={() => a.authorId && router.push({ pathname: '/profile/[id]', params: { id: a.authorId } })}>
        <Avatar uri={a.avatar} name={a.author} size={reply ? 28 : 36} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt weight="700" size={14} numberOfLines={1} style={{ flexShrink: 1 }}>{a.author}</Txt>
          {a.verified ? <BadgeCheck size={13} color={t.info} /> : null}
          <View style={{ flex: 1 }} />
          {a.authorId === meId ? (
            <Pressable onPress={() => onMore(a)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Tuỳ chọn câu trả lời">
              <MoreHorizontal size={18} color={t.textMuted} />
            </Pressable>
          ) : null}
        </View>
        {a.authorHeadline && !reply ? <Txt muted size={12} numberOfLines={1}>{a.authorHeadline}</Txt> : null}
        <Txt style={{ marginTop: 4, lineHeight: 21 }}>{a.body}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 }}>
          <VoteButton voted={a.voted} votes={a.votes} onVote={() => forumApi.voteAnswer(qid, a.id)} onUnvote={() => forumApi.unvoteAnswer(qid, a.id)} />
          <Txt muted size={12} weight="700" onPress={() => onReply(a)}>Trả lời</Txt>
          <Txt muted size={12}>{`${a.time}${a.edited ? ' · đã sửa' : ''}`}</Txt>
        </View>
      </View>
    </View>
  )
})

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

  const startReply = (a: AnswerBase) => {
    setReplyTo(a)
    setEditing(null)
  }

  return (
    <Screen bg={t.card}>
      <Header title="Câu hỏi" right={isMine ? <IconButton label="Tuỳ chọn câu hỏi" icon={<MoreHorizontal size={20} color={t.text} />} onPress={() => setQMenu(true)} /> : undefined} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlashList
          data={list}
          keyExtractor={(a) => a.id}
          style={{ backgroundColor: t.bg }}
          contentContainerStyle={{ paddingBottom: 16 }}
          onEndReached={() => answers.hasNextPage && answers.fetchNextPage()}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.card, padding: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {qd.topic ? <Tag label={qd.topic} /> : null}
                  {qd.major ? <Tag label={qd.major} tone="neutral" /> : null}
                </View>
                <Txt size={22} weight="800" style={{ lineHeight: 30 }}>{qd.title}</Txt>
                <Pressable
                  onPress={() => qd.authorId && router.push({ pathname: '/profile/[id]', params: { id: qd.authorId } })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}
                >
                  <Avatar uri={qd.avatar} name={qd.author} size={40} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Txt weight="700">{qd.author}</Txt>
                      {qd.verified ? <BadgeCheck size={14} color={t.info} /> : null}
                    </View>
                    <Txt muted size={12} numberOfLines={1}>{[qd.authorHeadline, qd.time].filter(Boolean).join(' · ')}</Txt>
                  </View>
                </Pressable>
                <Txt style={{ marginTop: 14, lineHeight: 23 }}>{qd.body}</Txt>
                {qd.images.map((u) => <Image key={u} source={{ uri: u }} style={{ width: '100%', aspectRatio: 1.5, borderRadius: 14, marginTop: 12, backgroundColor: t.inputBg }} contentFit="cover" />)}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.divider }}>
                  <VoteButton voted={qd.voted} votes={qd.votes} onVote={() => forumApi.vote(qd.id)} onUnvote={() => forumApi.unvote(qd.id)} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <MessageSquare size={17} color={t.textMuted} />
                    <Txt muted size={13}>{`${list.length} câu trả lời`}</Txt>
                  </View>
                </View>
              </View>
              <Txt weight="800" size={16} style={{ paddingHorizontal: 16, marginBottom: 8 }}>Câu trả lời</Txt>
            </View>
          }
          ListEmptyComponent={
            answers.isLoading ? <Loading /> : <Empty icon={<MessageSquare size={26} color={t.primary} />} title="Chưa có câu trả lời" text="Chia sẻ kinh nghiệm của bạn để giúp người hỏi." />
          }
          renderItem={({ item }) => (
            <Card style={{ marginHorizontal: 12, marginBottom: 10, paddingVertical: 8, paddingHorizontal: 0 }}>
              <AnswerItem a={item} qid={id!} meId={me?.id} onReply={startReply} onMore={(a) => setTarget({ answer: a, mine: true })} />
              {item.replies.length ? (
                <View style={{ marginLeft: 30, borderLeftWidth: 2, borderLeftColor: t.divider }}>
                  {item.replies.map((r) => (
                    <AnswerItem key={r.id} a={r} qid={id!} meId={me?.id} reply onReply={startReply} onMore={(a) => setTarget({ answer: a, mine: true })} />
                  ))}
                </View>
              ) : null}
            </Card>
          )}
        />
        <CommentComposer
          value={text}
          onChangeText={setText}
          onSend={() => send.mutate()}
          sending={send.isPending}
          placeholder={replyTo ? `Trả lời ${replyTo.author}...` : 'Viết câu trả lời...'}
          context={editing ? 'Đang sửa câu trả lời' : replyTo ? `Đang trả lời ${replyTo.author}` : null}
          onCancelContext={() => { setReplyTo(null); setEditing(null); setText('') }}
          autoFocusKey={replyTo?.id ?? editing?.id ?? null}
        />
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
