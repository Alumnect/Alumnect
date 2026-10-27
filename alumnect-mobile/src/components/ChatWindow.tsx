import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { TextInput } from '@/components/AppText'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageIcon, Info, Send } from '@/components/icons'
import { Avatar, Button, Screen, Txt } from './ui'
import { Header } from './Header'
import { chatApi } from '@/api/chat'
import { dealApi } from '@/api/mentoringFlow'
import type { Message } from '@/api/chat'
import { SharedCard } from '@/components/SharedCards'
import { parseSharedLink } from '@/lib/share'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'

/** Khung chat (UC30): FlashList inverted + KeyboardAvoidingView; hỗ trợ hội thoại nháp (chưa có id). */
const MessageBubble = React.memo(function MessageBubble({ item, mine, isGroupChat }: { item: Message; mine: boolean; isGroupChat: boolean }) {
  const t = useTheme()
    if (item.type === 'SYSTEM') {
      return <Txt muted size={12} style={{ textAlign: 'center', marginVertical: 6 }}>{item.content}</Txt>
    }
        const shared = item.isDeleted ? null : parseSharedLink(item.content)
    const cardOnly = !!shared && !shared.note && !(item.attachments?.length)
    return (
      <View style={{ flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginVertical: 3 }}>
        {!mine ? <Avatar uri={item.senderAvatar} name={item.senderName} size={28} /> : null}
        <View style={cardOnly ? { maxWidth: '88%' } : { maxWidth: '82%', backgroundColor: mine ? t.action : t.card, borderRadius: 16, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4, paddingHorizontal: 14, paddingVertical: 10 }}>
          {isGroupChat && !mine ? <Txt size={11} weight="700" color={t.primary}>{item.senderName}</Txt> : null}
          {item.isDeleted ? (
            <Txt muted size={13}>Tin nhắn đã bị thu hồi</Txt>
          ) : (
            <>
              {item.attachments?.map((a) =>
                a.mediaType === 'IMAGE' ? (
                  <Image key={a.id} source={{ uri: a.url }} style={{ width: 180, maxWidth: '100%', aspectRatio: 1, borderRadius: 10, marginBottom: item.content ? 6 : 0 }} contentFit="cover" />
                ) : (
                  <Txt key={a.id} size={13} color={mine ? t.onAction : t.info}>{a.fileName ?? 'Tệp đính kèm'}</Txt>
                ),
              )}
              {(shared ? shared.note : item.content) ? <Txt color={mine ? t.onAction : t.text}>{shared ? shared.note : item.content}</Txt> : null}
              {shared ? <View style={{ marginTop: shared.note ? 8 : 0 }}><SharedCard link={shared} mine={mine} /></View> : null}
            </>
          )}
          <Txt size={12} color={mine && !cardOnly ? t.onAction : t.textMuted} style={{ marginTop: 6, alignSelf: 'flex-end' }}>
            {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Txt>
        </View>
      </View>
    )
})

export function ChatWindow({
  conversationId,
  recipientId,
  title,
  isGroupChat,
  isMentoring,
}: {
  conversationId: number | null
  recipientId?: number | null
  title: string
  isGroupChat?: boolean
  isMentoring?: boolean
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const [convId, setConvId] = useState(conversationId)
  const [text, setText] = useState('')
  const dealQ = useQuery({ queryKey: ['mentoring-deal-conv', convId], enabled: !!isMentoring && convId != null, queryFn: () => dealApi.byConversation(convId!) })
  const deal = dealQ.data?.deal

  const q = useInfiniteQuery({
    queryKey: ['messages', convId],
    enabled: convId != null,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => chatApi.messages(convId!, pageParam),
    getNextPageParam: (l) => (l.data.last ? undefined : l.data.pageNumber + 1),
  })
  // API trả mới nhất trước → khớp với FlashList inverted.
  const messages: Message[] = q.data?.pages.flatMap((p) => p.data.content) ?? []

  useEffect(() => {
    if (convId != null) {
      chatApi.read(convId).then(() => qc.invalidateQueries({ queryKey: ['conversations'] })).catch(() => {})
    }
  }, [convId, messages.length, qc])

  const send = useMutation({
    mutationFn: (p: { content?: string; attachments?: { mediaType: 'IMAGE'; url: string }[] }) =>
      chatApi.send({ conversationId: convId, recipientId: convId == null ? recipientId : undefined, ...p }),
    onSuccess: (res) => {
      if (convId == null) setConvId(res.data.conversationId)
      qc.invalidateQueries({ queryKey: ['messages', res.data.conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const content = text.trim()
    if (!content) return
    setText('')
    send.mutate({ content })
  }
  const sendImage = async () => {
    const [img] = await pickImage()
    if (!img) return
    try {
      const url = await uploadImage(img, 'common')
      send.mutate({ attachments: [{ mediaType: 'IMAGE', url }] })
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        title={title}
        right={
          isGroupChat && convId != null ? (
            <Pressable onPress={() => router.push({ pathname: '/chat/group/[id]', params: { id: String(convId) } })} hitSlop={10}>
              <Info size={22} color={t.text} />
            </Pressable>
          ) : undefined
        }
      />
      {isMentoring && convId != null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, backgroundColor: t.primaryTint }}>
          <Txt size={13} weight="600" style={{ flex: 1 }}>{deal ? 'Deal #' + deal.id + ' · ' + deal.status : 'Chưa có deal cho cuộc trò chuyện này'}</Txt>
          {deal ? (
            <Button title="Xem deal" style={{ minHeight: 44, paddingHorizontal: 16 }} onPress={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } })} />
          ) : (
            <Button title="Đề xuất deal" style={{ minHeight: 44, paddingHorizontal: 16 }} onPress={() => router.push({ pathname: '/mentoring/deal/form', params: { conversationId: String(convId) } })} />
          )}
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined} keyboardVerticalOffset={Platform.OS === 'android' ? insets.top : 0}>
        <FlashList
          data={messages}
          inverted
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 12 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          ListEmptyComponent={convId == null ? <Txt muted style={{ textAlign: 'center', padding: 24 }}>Hãy gửi tin nhắn đầu tiên.</Txt> : null}
          renderItem={({ item }) => <MessageBubble item={item} mine={String(item.senderId) === me?.id} isGroupChat={!!isGroupChat} />}
        />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 8, gap: 8, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.card }}>
          <Pressable onPress={sendImage} accessibilityRole="button" accessibilityLabel="Gửi ảnh" style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.inputBg }}><ImageIcon size={20} color={t.textMuted} /></Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={t.textMuted}
            multiline
            accessibilityLabel="Nội dung tin nhắn"
            style={{ flex: 1, maxHeight: 130, minHeight: 44, backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 15 }}
          />
          <Pressable
            onPress={submit}
            disabled={send.isPending || !text.trim()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: text.trim() ? t.action : t.inputBg }}
          >
            <Send size={18} color={text.trim() ? t.onAction : t.textSubtle} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
