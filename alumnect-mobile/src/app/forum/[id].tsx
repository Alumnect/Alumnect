import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, MessageSquare, MoreHorizontal } from '@/components/icons'
import { Avatar, Empty, IconButton, Loading, Screen, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { CommentBubble, CommentComposer } from '@/components/Comments'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { VoteButton } from '@/components/VoteButton'
import { forumApi } from '@/api/forum'
import type { AnswerBase } from '@/api/forum'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

type Target = { answer: AnswerBase; mine: boolean } | null

type Row = { a: AnswerBase; reply: boolean }

/** Ảnh trong câu hỏi: giữ đúng tỉ lệ gốc (4:5 đến banner ngang) để ảnh chụp màn hình không bị cắt mất chữ. */
function QuestionImage({ uri }: { uri: string }) {
  const t = useTheme()
  const [ratio, setRatio] = useState(1.5)
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', aspectRatio: ratio, borderRadius: 12, marginTop: 12, backgroundColor: t.inputBg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border }}
      contentFit="cover"
      cachePolicy="disk"
      transition={180}
      onLoad={(e) => {
        if (e.source.width > 0 && e.source.height > 0) setRatio(Math.min(2.2, Math.max(0.8, e.source.width / e.source.height)))
      }}
    />
  )
}

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
  // Câu trả lời gốc, ngay dưới là các phản hồi của nó (giống bình luận ở bài viết).
  const rows: Row[] = list.flatMap((a) => [{ a, reply: false }, ...a.replies.map((r) => ({ a: r, reply: true }))])
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
          data={rows}
          keyExtractor={(r) => r.a.id}
          getItemType={(r) => (r.reply ? 'reply' : 'answer')}
          style={{ backgroundColor: t.card }}
          contentContainerStyle={{ paddingBottom: 12 }}
          onEndReached={() => answers.hasNextPage && !answers.isFetchingNextPage && answers.fetchNextPage()}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.card, paddingTop: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
                <View style={{ paddingHorizontal: 14 }}>
                  {qd.topic || qd.major ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {qd.topic ? <Tag label={qd.topic} tone="primary" /> : null}
                      {qd.major ? <Tag label={qd.major} tone="neutral" /> : null}
                    </View>
                  ) : null}
                  <Txt size={21} weight="700" style={{ lineHeight: 29 }}>{qd.title}</Txt>
                  <Pressable
                    onPress={() => qd.authorId && router.push({ pathname: '/profile/[id]', params: { id: qd.authorId } })}
                    accessibilityRole="button"
                    accessibilityLabel={`Trang cá nhân ${qd.author}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}
                  >
                    <Avatar uri={qd.avatar} name={qd.author} size={40} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Txt weight="700" size={15} numberOfLines={1} style={{ flexShrink: 1 }}>{qd.author}</Txt>
                        {qd.verified ? <BadgeCheck size={15} color={t.info} weight="fill" /> : null}
                      </View>
                      <Txt muted size={12} numberOfLines={1}>{[qd.authorHeadline, qd.time].filter(Boolean).join(' · ')}</Txt>
                    </View>
                  </Pressable>
                  <Txt size={15} style={{ marginTop: 14, lineHeight: 23 }}>{qd.body}</Txt>
                  {qd.images.map((u) => <QuestionImage key={u} uri={u} />)}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginHorizontal: 6, paddingTop: 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.divider }}>
                  <View style={{ paddingHorizontal: 8 }}>
                    <VoteButton voted={qd.voted} votes={qd.votes} onVote={() => forumApi.vote(qd.id)} onUnvote={() => forumApi.unvote(qd.id)} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 8 }}>
                    <MessageSquare size={20} color={t.textMuted} />
                    <Txt size={13} weight="600" color={t.textMuted}>{`${qd.answers ?? list.length} trả lời`}</Txt>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
                <Txt weight="800" size={16} style={{ flex: 1 }}>Câu trả lời</Txt>
                <Txt muted size={13}>{qd.answers ?? list.length}</Txt>
              </View>
            </View>
          }
          ListEmptyComponent={
            answers.isLoading ? <Loading /> : <Empty icon={<BrandIcon name="chat" size={56} />} title="Chưa có câu trả lời" text="Chia sẻ kinh nghiệm của bạn để giúp người hỏi." />
          }
          renderItem={({ item: { a, reply } }) => {
            const mine = a.authorId === me?.id
            return (
              <CommentBubble
                author={a.author}
                authorId={a.authorId}
                avatar={a.avatar}
                verified={a.verified}
                headline={reply ? null : a.authorHeadline}
                text={a.body}
                time={a.time}
                edited={a.edited}
                reply={reply}
                mine={mine}
                replyLabel="Trả lời"
                extra={<VoteButton compact voted={a.voted} votes={a.votes} onVote={() => forumApi.voteAnswer(id!, a.id)} onUnvote={() => forumApi.unvoteAnswer(id!, a.id)} />}
                onReply={() => startReply(a)}
                onMore={mine ? () => setTarget({ answer: a, mine: true }) : undefined}
              />
            )
          }}
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
