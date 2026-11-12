import React, { useEffect, useState } from 'react'
import { Linking, Platform, Pressable, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { TextInput } from '@/components/AppText'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Handshake, ImageIcon, Info, Paperclip, Send, X } from '@/components/icons'
import { Avatar, Button, Empty, Loading, Screen, Txt } from './ui'
import { MotionPressable } from './Motion'
import { chatApi } from '@/api/chat'
import type { Message, OutgoingAttachment } from '@/api/chat'
import { SharedCard } from '@/components/SharedCards'
import { parseSharedLink } from '@/lib/share'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { DEAL_STATUS_LABEL } from '@/api/mentoringFlow'
import { pickImage, uploadFile, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'

async function openAttachment(url: string) {
  try {
    if (!/^https?:\/\//i.test(url)) throw new Error('Liên kết tệp không hợp lệ.')
    await Linking.openURL(url)
  } catch (e) { toast.error(errMsg(e, 'Không thể mở tệp. Vui lòng thử lại.')) }
}

/** Khung chat (UC30): FlashList inverted + KeyboardAvoidingView; hỗ trợ hội thoại nháp (chưa có id). */
const MessageBubble = React.memo(function MessageBubble({ item, mine, isGroupChat, showTime, onToggleTime, grouped }: { item: Message; mine: boolean; isGroupChat: boolean; showTime: boolean; onToggleTime: () => void; grouped: boolean }) {
  const t = useTheme()
    if (item.type === 'SYSTEM') {
      return <Txt muted size={12} style={{ textAlign: 'center', marginVertical: 6 }}>{item.content}</Txt>
    }
        const shared = item.isDeleted ? null : parseSharedLink(item.content)
    const cardOnly = !!shared && !shared.note && !(item.attachments?.length)
    return (
      <View style={{ flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginTop: 3, marginBottom: grouped ? 0 : 9 }}>
        {!mine ? <View style={{ width: 28 }}>{!grouped ? <Avatar uri={item.senderAvatar} name={item.senderName} size={28} /> : null}</View> : null}
        <Pressable onPress={onToggleTime} accessibilityRole="button" accessibilityLabel={`Tin nhắn của ${item.senderName}, ${new Date(item.createdAt).toLocaleString('vi-VN')}`} accessibilityHint="Chạm để hiện hoặc ẩn thời gian" style={cardOnly ? { maxWidth: '88%' } : { maxWidth: '80%', backgroundColor: mine ? t.primary : t.surface, borderRadius: 22, borderBottomRightRadius: mine ? 6 : 22, borderBottomLeftRadius: mine ? 22 : 6, paddingHorizontal: 14, paddingVertical: 10 }}>
          {isGroupChat && !mine && !grouped ? <Txt size={12} weight="600" color={t.textMuted} style={{ marginBottom: 3 }}>{item.senderName}</Txt> : null}
          {item.isDeleted ? (
            <Txt color={mine ? '#FFFFFF' : t.textMuted} size={13}>Tin nhắn đã bị thu hồi</Txt>
          ) : (
            <>
              {item.attachments?.map((a) =>
                a.mediaType === 'IMAGE' ? (
                  <Image key={a.id} source={{ uri: a.url }} style={{ width: 180, maxWidth: '100%', aspectRatio: 1, borderRadius: 10, marginBottom: item.content ? 6 : 0 }} contentFit="cover" />
                ) : (
                  <Pressable key={a.id} accessibilityRole="link" accessibilityLabel={`${a.mediaType === 'VIDEO' ? 'Xem video' : 'Mở tệp'} ${a.fileName ?? ''}`} onPress={() => void openAttachment(a.url)} style={{ minHeight: 44, justifyContent: 'center' }}>
                    <Txt size={13} color={mine ? '#FFFFFF' : t.primary}>{a.mediaType === 'VIDEO' ? 'Xem video · ' : ''}{a.fileName ?? 'Tệp đính kèm'}</Txt>
                  </Pressable>
                ),
              )}
              {(shared ? shared.note : item.content) ? <Txt size={14} color={mine ? '#FFFFFF' : t.text}>{shared ? shared.note : item.content}</Txt> : null}
              {shared ? <View style={{ marginTop: shared.note ? 8 : 0 }}><SharedCard link={shared} mine={mine} /></View> : null}
            </>
          )}
          {showTime ? <Txt size={12} color={mine && !cardOnly ? 'rgba(255,255,255,0.8)' : t.textMuted} style={{ marginTop: 6, alignSelf: 'flex-end' }}>
            {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Txt> : null}
        </Pressable>
      </View>
    )
})

export function ChatWindow({
  conversationId,
  recipientId,
  title,
  isGroupChat,
  isMentoring,
  avatarUrl,
}: {
  conversationId: number | null
  recipientId?: number | null
  title: string
  isGroupChat?: boolean
  isMentoring?: boolean
  avatarUrl?: string | null
}) {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const [convId, setConvId] = useState(conversationId)
  const [text, setText] = useState('')
  const [pending, setPending] = useState<OutgoingAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [timeId, setTimeId] = useState<number | null>(null)
  const context = useQuery({ queryKey: ['mentoring-chat-context', convId], enabled: !!isMentoring && convId != null, queryFn: () => chatApi.mentoringContext(convId!), refetchOnMount: 'always', refetchInterval: 15_000 })
  const deal = context.data?.deal?.deal
  const canSend = !isMentoring || (!!context.data?.canSendMessage && !context.data.readOnly && !context.isError)
  const { viridian, viridianSoft } = useMentoringTheme()
  const canPropose = canSend && (!!context.data?.canCreateDealTicket || !!context.data?.canAcceptDealByRequest)

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
    <Screen edges={['top', 'bottom']} bg={t.card} keyboard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: t.divider }}>
        <MotionPressable onPress={() => router.canGoBack() ? router.back() : router.replace('/chat')} accessibilityRole="button" accessibilityLabel="Quay lại" style={{ width: 36, height: 44, justifyContent: 'center', alignItems: 'center' }}><ChevronLeft size={28} color={t.text} /></MotionPressable>
        <Avatar uri={avatarUrl} name={title} size={38} />
        <MotionPressable disabled={!recipientId || isGroupChat || isMentoring} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(recipientId) } })} accessibilityRole={recipientId && !isGroupChat && !isMentoring ? 'link' : undefined} style={{ flex: 1, minWidth: 0, justifyContent: 'center', minHeight: 44 }}>
          <Txt size={14} weight="600" numberOfLines={1}>{title}</Txt>
          <Txt muted size={12}>{isMentoring ? 'Mentoring' : isGroupChat ? 'Trò chuyện nhóm' : recipientId ? 'Xem trang cá nhân' : 'Tin nhắn'}</Txt>
        </MotionPressable>
        {
          ((!isMentoring && isGroupChat) || context.data?.groupId) && convId != null ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Thông tin nhóm" onPress={() => context.data?.groupId ? router.push({ pathname: '/mentoring/groups/[id]', params: { id: String(context.data.groupId) } }) : !isMentoring && router.push({ pathname: '/chat/group/[id]', params: { id: String(convId) } })} hitSlop={10}>
              <Info size={22} color={t.text} />
            </Pressable>
          ) : undefined
        }
      </View>
      {isMentoring && convId != null ? (
        <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}>
          {context.isLoading ? (
            <View style={{ padding: 10, borderRadius: 14, backgroundColor: t.surface, alignItems: 'center' }}>
              <Txt muted size={12}>Đang kiểm tra quyền trò chuyện...</Txt>
            </View>
          ) : context.isError ? (
            <View style={{ padding: 10, borderRadius: 14, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt muted size={12}>Không thể kiểm tra quyền trò chuyện.</Txt>
              <Pressable onPress={() => void context.refetch()}>
                <Txt size={12} weight="700" style={{ color: viridian }}>Thử lại</Txt>
              </Pressable>
            </View>
          ) : (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: t.isDark ? '#333333' : '#EAECEF',
                backgroundColor: t.card,
                paddingVertical: 10,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              {/* Left: Icon + Status Text */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: t.isDark ? '#2E1C10' : viridianSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Handshake size={20} color={viridian} weight="bold" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={13} weight="800" numberOfLines={1} style={{ color: t.text }}>
                    {deal ? `Thỏa thuận #${deal.id}` : 'Chưa có thỏa thuận'}
                  </Txt>
                  <Txt size={11} weight="500" numberOfLines={1} style={{ color: t.textMuted, marginTop: 1 }}>
                    {deal
                      ? (DEAL_STATUS_LABEL[deal.status] ?? deal.status)
                      : canPropose
                        ? 'Đề xuất điều khoản để bắt đầu'
                        : 'Đang trao đổi với Mentor'}
                  </Txt>
                </View>
              </View>

              {/* Right: Action Button(s) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {deal ? (
                  <>
                    {context.data?.taskId ? (
                      <MotionPressable
                        onPress={() => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(context.data.taskId) } })}
                        accessibilityRole="button"
                        accessibilityLabel="Xem nhiệm vụ"
                        style={{
                          backgroundColor: t.isDark ? '#222222' : '#F4F5F7',
                          borderWidth: 1,
                          borderColor: t.isDark ? '#333333' : '#EAECEF',
                          paddingHorizontal: 11,
                          paddingVertical: 7,
                          borderRadius: 999,
                        }}
                      >
                        <Txt size={12} weight="700" style={{ color: t.text }}>
                          Nhiệm vụ
                        </Txt>
                      </MotionPressable>
                    ) : null}
                    <MotionPressable
                      onPress={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } })}
                      accessibilityRole="button"
                      accessibilityLabel="Xem chi tiết thỏa thuận"
                      style={{
                        backgroundColor: viridian,
                        paddingHorizontal: 13,
                        paddingVertical: 7,
                        borderRadius: 999,
                        shadowColor: viridian,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                    >
                      <Txt size={12} weight="800" style={{ color: '#FFFFFF' }}>
                        Xem thỏa thuận
                      </Txt>
                    </MotionPressable>
                  </>
                ) : canPropose ? (
                  <MotionPressable
                    onPress={() =>
                      router.push({
                        pathname: '/mentoring/deal/form',
                        params: {
                          conversationId: String(convId),
                        },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Đề xuất thỏa thuận"
                    style={{
                      backgroundColor: viridian,
                      paddingHorizontal: 13,
                      paddingVertical: 7,
                      borderRadius: 999,
                      shadowColor: viridian,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    <Txt size={12} weight="800" style={{ color: '#FFFFFF' }}>
                      Đề xuất thỏa thuận
                    </Txt>
                  </MotionPressable>
                ) : null}
              </View>
            </View>
          )}

          {/* Read-only banner if cannot send */}
          {context.data?.readOnly || !canSend ? (
            <Txt muted size={11} style={{ marginTop: 4, marginHorizontal: 4 }}>
              {context.data?.readOnlyReason || 'Cuộc trò chuyện hiện chỉ cho phép xem.'}
            </Txt>
          ) : null}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <FlashList
          data={messages}
          inverted
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 12 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          ListEmptyComponent={q.isLoading ? <Loading /> : q.isError ? <Empty text="Không thể tải tin nhắn." error={q.error} onRetry={() => void q.refetch()} /> : <Txt muted style={{ textAlign: 'center', padding: 24 }}>Hãy gửi tin nhắn đầu tiên.</Txt>}
          renderItem={({ item, index }) => {
            const older = messages[index + 1]
            const newer = messages[index - 1]
            const gap = !older || new Date(item.createdAt).getTime() - new Date(older.createdAt).getTime() > 15 * 60_000
            const grouped = !!newer && newer.type !== 'SYSTEM' && newer.senderId === item.senderId && new Date(newer.createdAt).getTime() - new Date(item.createdAt).getTime() < 5 * 60_000
            return <View>
              {gap ? <Txt muted size={12} style={{ textAlign: 'center', marginVertical: 18 }}>{new Date(item.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Txt> : null}
              <MessageBubble item={item} mine={String(item.senderId) === me?.id} isGroupChat={!!isGroupChat || context.data?.groupId != null} grouped={grouped} showTime={timeId === item.id} onToggleTime={() => setTimeId(timeId === item.id ? null : item.id)} />
            </View>
          }}
        />
        {pending.length ? <View style={{ paddingHorizontal: 12, paddingTop: 8, backgroundColor: t.card }}>
          {pending.map((file) => <View key={file.url} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Txt numberOfLines={1} style={{ flex: 1 }}>{file.fileName ?? 'Ảnh đính kèm'}</Txt><Pressable accessibilityRole="button" accessibilityLabel={`Bỏ tệp ${file.fileName ?? ''}`} disabled={send.isPending} onPress={() => setPending((files) => files.filter((f) => f.url !== file.url))} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><X size={18} color={t.textMuted} /></Pressable></View>)}
        </View> : null}
        {uploading ? <Txt muted size={12} style={{ padding: 8 }}>Đang tải tệp lên...</Txt> : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: 12, marginTop: 8, marginBottom: 10, padding: 5, borderRadius: 28, backgroundColor: t.surface }}>
          <MotionPressable onPress={() => void sendImage()} disabled={!canSend || uploading || send.isPending} accessibilityRole="button" accessibilityLabel="Chọn ảnh" style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: t.primary, opacity: canSend ? 1 : 0.4 }}><ImageIcon size={22} color="#FFFFFF" /></MotionPressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nhắn tin..."
            placeholderTextColor={t.textMuted}
            multiline
            editable={canSend}
            accessibilityLabel="Nội dung tin nhắn"
            style={{ flex: 1, maxHeight: 130, minHeight: 44, color: t.text, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, fontSize: 14 }}
          />
          <MotionPressable onPress={() => void sendFile()} disabled={!canSend || uploading || send.isPending} accessibilityRole="button" accessibilityLabel="Chọn tệp hoặc video" style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center', opacity: canSend ? 1 : 0.4 }}><Paperclip size={22} color={t.text} /></MotionPressable>
          <MotionPressable
            onPress={submit}
            disabled={!canSend || uploading || send.isPending || (!text.trim() && !pending.length)}
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: canSend && (text.trim() || pending.length) ? t.primary : 'transparent' }}
          >
            <Send size={20} color={canSend && (text.trim() || pending.length) ? '#FFFFFF' : t.textSubtle} />
          </MotionPressable>
        </View>
      </View>
    </Screen>
  )
}
