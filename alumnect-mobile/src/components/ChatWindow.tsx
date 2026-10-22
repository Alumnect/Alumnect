import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageIcon, Info, Send } from 'lucide-react-native'
import { Avatar, Screen, Txt } from './ui'
import { Header } from './Header'
import { chatApi } from '@/api/chat'
import { dealApi } from '@/api/mentoringFlow'
import { Button } from './ui'
import type { Message } from '@/api/chat'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'

/** Khung chat (UC30): FlashList inverted + KeyboardAvoidingView; hỗ trợ hội thoại nháp (chưa có id). */
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
            <Button title="Xem deal" style={{ height: 34, paddingHorizontal: 12 }} onPress={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } })} />
          ) : (
            <Button title="Đề xuất deal" style={{ height: 34, paddingHorizontal: 12 }} onPress={() => router.push({ pathname: '/mentoring/deal/form', params: { conversationId: String(convId) } })} />
          )}
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlashList
          data={messages}
          inverted
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 12 }}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          ListEmptyComponent={convId == null ? <Txt muted style={{ textAlign: 'center', padding: 24 }}>Hãy gửi tin nhắn đầu tiên.</Txt> : null}
          renderItem={({ item }) => {
            if (item.type === 'SYSTEM') {
              return <Txt muted size={12} style={{ textAlign: 'center', marginVertical: 6 }}>{item.content}</Txt>
            }
            const mine = String(item.senderId) === me?.id
            return (
              <View style={{ flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginVertical: 3 }}>
                {!mine ? <Avatar uri={item.senderAvatar} name={item.senderName} size={28} /> : null}
                <View style={{ maxWidth: '78%', backgroundColor: mine ? t.primary : t.inputBg, borderRadius: 16, padding: 10 }}>
                  {isGroupChat && !mine ? <Txt size={11} weight="700" color={t.primary}>{item.senderName}</Txt> : null}
                  {item.isDeleted ? (
                    <Txt muted size={13}>Tin nhắn đã bị thu hồi</Txt>
                  ) : (
                    <>
                      {item.attachments?.map((a) =>
                        a.mediaType === 'IMAGE' ? (
                          <Image key={a.id} source={{ uri: a.url }} style={{ width: 200, height: 200, borderRadius: 10, marginBottom: item.content ? 6 : 0 }} contentFit="cover" />
                        ) : (
                          <Txt key={a.id} size={13} color={mine ? '#fff' : t.info}>{a.fileName ?? 'Tệp đính kèm'}</Txt>
                        ),
                      )}
                      {item.content ? <Txt color={mine ? '#fff' : t.text}>{item.content}</Txt> : null}
                    </>
                  )}
                  <Txt size={10} color={mine ? 'rgba(255,255,255,0.8)' : t.textMuted} style={{ marginTop: 2, alignSelf: 'flex-end' }}>
                    {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Txt>
                </View>
              </View>
            )
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg }}>
          <Pressable onPress={sendImage} hitSlop={8}><ImageIcon size={24} color={t.textMuted} /></Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={t.textMuted}
            multiline
            style={{ flex: 1, maxHeight: 100, backgroundColor: t.inputBg, color: t.text, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}
          />
          <Pressable onPress={submit} disabled={send.isPending} hitSlop={8}>
            <Send size={24} color={text.trim() ? t.primary : t.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
