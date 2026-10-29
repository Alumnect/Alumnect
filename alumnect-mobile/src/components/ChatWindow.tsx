import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Linking, Platform, Pressable, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { TextInput } from '@/components/AppText'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageIcon, Info, Paperclip, Send, X } from '@/components/icons'
import { Avatar, Button, Empty, Loading, Screen, Txt } from './ui'
import { Header } from './Header'
import { chatApi } from '@/api/chat'
import type { Message, OutgoingAttachment } from '@/api/chat'
import { SharedCard } from '@/components/SharedCards'
import { parseSharedLink } from '@/lib/share'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { pickImage, uploadFile, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'

async function openAttachment(url: string) {
  try {
    if (!/^https?:\/\//i.test(url)) throw new Error('Liên kết tệp không hợp lệ.')
    await Linking.openURL(url)
  } catch (e) { toast.error(errMsg(e, 'Không thể mở tệp. Vui lòng thử lại.')) }
}

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
                  <Pressable key={a.id} accessibilityRole="link" accessibilityLabel={`${a.mediaType === 'VIDEO' ? 'Xem video' : 'Mở tệp'} ${a.fileName ?? ''}`} onPress={() => void openAttachment(a.url)} style={{ minHeight: 44, justifyContent: 'center' }}>
                    <Txt size={13} color={mine ? t.onAction : t.info}>{a.mediaType === 'VIDEO' ? 'Xem video · ' : ''}{a.fileName ?? 'Tệp đính kèm'}</Txt>
                  </Pressable>
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
  const [pending, setPending] = useState<OutgoingAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const context = useQuery({ queryKey: ['mentoring-chat-context', convId], enabled: !!isMentoring && convId != null, queryFn: () => chatApi.mentoringContext(convId!), refetchOnMount: 'always', refetchInterval: 15_000 })
  const deal = context.data?.deal?.deal
  const canSend = !isMentoring || (!!context.data?.canSendMessage && !context.data.readOnly && !context.isError)

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
    mutationFn: (p: { content?: string; attachments?: OutgoingAttachment[] }) =>
      chatApi.send({ conversationId: convId, recipientId: convId == null ? recipientId : undefined, ...p }),
    onSuccess: (res, sent) => {
      if (sent.content) setText((current) => current.trim() === sent.content ? '' : current)
      setPending((files) => files.filter((f) => !sent.attachments?.some((a) => a.url === f.url)))
      if (convId == null) setConvId(res.data.conversationId)
      qc.invalidateQueries({ queryKey: ['messages', res.data.conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (e) => { toast.error(errMsg(e)); if (isMentoring) void context.refetch() },
  })

  const submit = () => {
    const content = text.trim()
    if (!canSend || send.isPending || uploading || (!content && !pending.length)) return
    if (content.length > 5000) return toast.error('Nội dung tin nhắn không vượt quá 5000 ký tự.')
    send.mutate({ content: content || undefined, attachments: pending })
  }
  const sendImage = async () => {
    if (!canSend || uploading || send.isPending) return
    setUploading(true)
    try {
      const [img] = await pickImage()
      if (!img) return
      const url = await uploadImage(img, 'common')
      setPending((files) => [...files, { mediaType: 'IMAGE', url, fileName: img.name }])
    } catch (e) {
      toast.error(errMsg(e))
    } finally { setUploading(false) }
  }
  const sendFile = async () => {
    if (!canSend || uploading || send.isPending) return
    setUploading(true)
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ['video/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/*'] })
      if (result.canceled) return
      const file = result.assets[0]
      const uploaded = await uploadFile(file)
      const mediaType = file.mimeType?.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name) ? 'VIDEO' : 'FILE'
      setPending((files) => [...files, { ...uploaded, mediaType }])
    } catch (e) { toast.error(errMsg(e)) } finally { setUploading(false) }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        title={title}
        right={
          ((!isMentoring && isGroupChat) || context.data?.groupId) && convId != null ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Thông tin nhóm" onPress={() => context.data?.groupId ? router.push({ pathname: '/mentoring/groups/[id]', params: { id: String(context.data.groupId) } }) : !isMentoring && router.push({ pathname: '/chat/group/[id]', params: { id: String(convId) } })} hitSlop={10}>
              <Info size={22} color={t.text} />
            </Pressable>
          ) : undefined
        }
      />
      {isMentoring && convId != null ? (
        <View style={{ gap: 8, padding: 12, backgroundColor: t.surface }}>
          {context.isLoading ? <Txt muted size={13}>Đang kiểm tra quyền trò chuyện...</Txt> : context.isError ? <><Txt muted size={13}>Không thể kiểm tra quyền trò chuyện.</Txt><Button title="Thử lại quyền chat" variant="outline" onPress={() => void context.refetch()} /></> : context.data?.readOnly || !canSend ? <Txt muted size={13}>{context.data?.readOnlyReason || 'Cuộc trò chuyện hiện chỉ cho phép xem.'}</Txt> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Txt size={13} weight="600" style={{ flexGrow: 1 }}>{deal ? 'Deal #' + deal.id + ' · ' + deal.status : 'Chưa có thỏa thuận'}</Txt>
          {deal ? (
            <Button title="Xem deal" style={{ minHeight: 44, paddingHorizontal: 16 }} onPress={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } })} />
          ) : null}
          {context.data?.canAcceptDealByRequest && canSend ? <Button title="Deal theo yêu cầu" onPress={() => router.push({ pathname: '/mentoring/deal/form', params: { conversationId: String(convId) } })} /> : null}
          {context.data?.canCreateDealTicket && canSend ? <Button title="Đề xuất điều khoản" variant="outline" onPress={() => router.push({ pathname: '/mentoring/deal/form', params: { conversationId: String(convId), renegotiate: '1' } })} /> : null}
          {context.data?.taskId ? <Button title="Xem nhiệm vụ" variant="outline" onPress={() => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(context.data.taskId) } })} /> : null}
          </View>
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined} keyboardVerticalOffset={Platform.OS === 'android' ? insets.top : 0}>
        <FlashList
          data={messages}
          inverted
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 12 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          ListEmptyComponent={q.isLoading ? <Loading /> : q.isError ? <Empty text="Không thể tải tin nhắn." error={q.error} onRetry={() => void q.refetch()} /> : <Txt muted style={{ textAlign: 'center', padding: 24 }}>Hãy gửi tin nhắn đầu tiên.</Txt>}
          renderItem={({ item }) => <MessageBubble item={item} mine={String(item.senderId) === me?.id} isGroupChat={!!isGroupChat || context.data?.groupId != null} />}
        />
        {pending.length ? <View style={{ paddingHorizontal: 12, paddingTop: 8, backgroundColor: t.card }}>
          {pending.map((file) => <View key={file.url} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Txt numberOfLines={1} style={{ flex: 1 }}>{file.fileName ?? 'Ảnh đính kèm'}</Txt><Pressable accessibilityRole="button" accessibilityLabel={`Bỏ tệp ${file.fileName ?? ''}`} disabled={send.isPending} onPress={() => setPending((files) => files.filter((f) => f.url !== file.url))} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><X size={18} color={t.textMuted} /></Pressable></View>)}
        </View> : null}
        {uploading ? <Txt muted size={12} style={{ padding: 8 }}>Đang tải tệp lên...</Txt> : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 8, gap: 8, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.card }}>
          <Pressable onPress={() => void sendImage()} disabled={!canSend || uploading || send.isPending} accessibilityRole="button" accessibilityLabel="Chọn ảnh" style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.inputBg, opacity: canSend ? 1 : 0.4 }}><ImageIcon size={20} color={t.textMuted} /></Pressable>
          <Pressable onPress={() => void sendFile()} disabled={!canSend || uploading || send.isPending} accessibilityRole="button" accessibilityLabel="Chọn tệp hoặc video" style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.inputBg, opacity: canSend ? 1 : 0.4 }}><Paperclip size={20} color={t.textMuted} /></Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={t.textMuted}
            multiline
            editable={canSend}
            accessibilityLabel="Nội dung tin nhắn"
            style={{ flex: 1, maxHeight: 130, minHeight: 44, backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 15 }}
          />
          <Pressable
            onPress={submit}
            disabled={!canSend || uploading || send.isPending || (!text.trim() && !pending.length)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: canSend && (text.trim() || pending.length) ? t.action : t.inputBg }}
          >
            <Send size={18} color={canSend && (text.trim() || pending.length) ? t.onAction : t.textSubtle} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
