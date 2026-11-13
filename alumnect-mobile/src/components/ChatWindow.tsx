import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Keyboard, Linking, Platform, Pressable, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as Haptics from 'expo-haptics'
import { TextInput } from '@/components/AppText'
import { FlashList } from '@shopify/flash-list'
import type { FlashListRef } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronLeft, ChevronRight, FileText, Handshake, History, ImageIcon, Info, ListChecks, MoreHorizontal, Paperclip, Send, X } from '@/components/icons'
import { Avatar, Button, Empty, Loading, Screen, Txt } from './ui'
import { MotionPressable } from './Motion'
import { SheetModal } from './SheetModal'
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
    return (
      <View style={{ alignItems: 'center', marginVertical: 8, paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: t.isDark ? '#222222' : '#F0F2F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, maxWidth: '90%' }}>
          <Txt size={11.5} weight="500" style={{ color: t.textMuted, textAlign: 'center', lineHeight: 16 }}>
            {item.content}
          </Txt>
        </View>
      </View>
    )
  }
  const shared = item.isDeleted ? null : parseSharedLink(item.content)
  const cardOnly = !!shared && !shared.note && !(item.attachments?.length)
  return (
    <View style={{ flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginTop: 2, marginBottom: grouped ? 1 : 8 }}>
      {!mine ? <View style={{ width: 28 }}>{!grouped ? <Avatar uri={item.senderAvatar} name={item.senderName} size={28} /> : null}</View> : null}
      <Pressable
        onPress={onToggleTime}
        accessibilityRole="button"
        accessibilityLabel={`Tin nhắn của ${item.senderName}, ${new Date(item.createdAt).toLocaleString('vi-VN')}`}
        accessibilityHint="Chạm để hiện hoặc ẩn thời gian"
        style={
          cardOnly
            ? { maxWidth: '88%' }
            : {
                maxWidth: '80%',
                backgroundColor: mine ? t.primary : (t.isDark ? '#262626' : '#F1F3F5'),
                borderRadius: 18,
                borderBottomRightRadius: mine ? (grouped ? 18 : 4) : 18,
                borderBottomLeftRadius: !mine ? (grouped ? 18 : 4) : 18,
                paddingHorizontal: 13,
                paddingVertical: 9,
              }
        }
      >
        {isGroupChat && !mine && !grouped ? <Txt size={11.5} weight="700" color={t.textMuted} style={{ marginBottom: 3 }}>{item.senderName}</Txt> : null}
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
            {(shared ? shared.note : item.content) ? (
              <Txt size={14.5} color={mine ? '#FFFFFF' : t.text} style={{ lineHeight: 20 }}>
                {shared ? shared.note : item.content}
              </Txt>
            ) : null}
            {shared ? <View style={{ marginTop: shared.note ? 8 : 0 }}><SharedCard link={shared} mine={mine} /></View> : null}
          </>
        )}
        {showTime ? (
          <Txt size={11} color={mine && !cardOnly ? 'rgba(255,255,255,0.75)' : t.textMuted} style={{ marginTop: 4, alignSelf: mine ? 'flex-end' : 'flex-start' }}>
            {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Txt>
        ) : null}
      </Pressable>
    </View>
  )
})

function ActionRow({
  icon,
  title,
  desc,
  onPress,
  danger,
}: {
  icon: React.ReactNode
  title: string
  desc?: string
  onPress: () => void
  danger?: boolean
}) {
  const t = useTheme()
  return (
    <MotionPressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.isDark ? '#333333' : '#EAECEF',
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: danger ? (t.isDark ? '#331111' : '#FEE2E2') : (t.isDark ? '#262626' : '#FFFFFF'),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={14} weight="700" style={{ color: danger ? t.danger : t.text }} numberOfLines={1}>
          {title}
        </Txt>
        {desc ? (
          <Txt size={12} weight="500" style={{ color: t.textMuted, marginTop: 2 }} numberOfLines={1}>
            {desc}
          </Txt>
        ) : null}
      </View>
      <ChevronRight size={16} color={t.textMuted} />
    </MotionPressable>
  )
}

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
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [actionMenuVisible, setActionMenuVisible] = useState(false)
  const listRef = useRef<FlashListRef<Message>>(null)
  const isAtBottomRef = useRef(true)
  const prevLatestMsgIdRef = useRef<number | null>(null)

  const context = useQuery({ queryKey: ['mentoring-chat-context', convId], enabled: !!isMentoring && convId != null, queryFn: () => chatApi.mentoringContext(convId!), refetchOnMount: 'always', refetchInterval: 15_000 })
  const deal = context.data?.deal?.deal
  const isMentor = context.data?.myRole === 'MENTOR' || me?.role === 'ALUMNI'
  const isStudent = context.data?.myRole === 'STUDENT' || me?.role === 'STUDENT'
  const canSend = !isMentoring || (!!context.data?.canSendMessage && !context.data.readOnly && !context.isError)
  const { viridian, viridianSoft } = useMentoringTheme()
  const canPropose = canSend && isMentor && (!!context.data?.canCreateDealTicket || !!context.data?.canAcceptDealByRequest)

  const scrollToBottom = useCallback((animated = true) => {
    try {
      listRef.current?.scrollToOffset({ offset: 0, animated })
    } catch {}
  }, [])

  const q = useInfiniteQuery({
    queryKey: ['messages', convId],
    enabled: convId != null,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => chatApi.messages(convId!, pageParam),
    getNextPageParam: (l) => (l.data.last ? undefined : l.data.pageNumber + 1),
    refetchInterval: 3000,
  })
  // API trả mới nhất trước → khớp với FlashList inverted.
  const messages: Message[] = q.data?.pages.flatMap((p) => p.data.content) ?? []

  // Tự động cuộn xuống đáy khi có tin nhắn mới nhất
  const latestMessageId = messages[0]?.id
  useEffect(() => {
    if (latestMessageId != null) {
      if (prevLatestMsgIdRef.current == null) {
        scrollToBottom(false)
      } else if (prevLatestMsgIdRef.current !== latestMessageId) {
        if (isAtBottomRef.current || String(messages[0]?.senderId) === me?.id) {
          requestAnimationFrame(() => scrollToBottom(true))
        }
      }
      prevLatestMsgIdRef.current = latestMessageId
    }
  }, [latestMessageId, me?.id, messages, scrollToBottom])

  // Tự động cuộn xuống đáy khi bàn phím mở hoặc tắt
  useEffect(() => {
    const onShow = () => {
      setKeyboardOpen(true)
      setTimeout(() => scrollToBottom(true), 80)
    }
    const onHide = () => {
      setKeyboardOpen(false)
      setTimeout(() => scrollToBottom(false), 80)
    }

    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', onShow)
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', onHide)
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [scrollToBottom])

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
      requestAnimationFrame(() => scrollToBottom(true))
    },
    onError: (e) => { toast.error(errMsg(e)); if (isMentoring) void context.refetch() },
  })

  const submit = () => {
    const content = text.trim()
    if (!canSend || send.isPending || uploading || (!content && !pending.length)) return
    if (content.length > 5000) return toast.error('Nội dung tin nhắn không vượt quá 5000 ký tự.')
    scrollToBottom(true)
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
          <Txt muted size={12} numberOfLines={1}>
            {isMentoring
              ? context.data?.requestTitle
                ? `Yêu cầu #${context.data.requestId ?? ''} · ${context.data.requestTitle}`
                : 'Mentoring'
              : isGroupChat
                ? 'Trò chuyện nhóm'
                : recipientId
                  ? 'Xem trang cá nhân'
                  : 'Tin nhắn'}
          </Txt>
        </MotionPressable>

        {isMentoring && convId != null ? (
          <MotionPressable
            onPress={() => setActionMenuVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Thao tác"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 11,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: viridian,
              backgroundColor: t.isDark ? '#2E1C10' : viridianSoft,
            }}
          >
            <MoreHorizontal size={17} color={viridian} weight="bold" />
            <Txt size={12} weight="800" style={{ color: viridian }}>
              Thao tác
            </Txt>
          </MotionPressable>
        ) : ((!isMentoring && isGroupChat) || context.data?.groupId) && convId != null ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Thông tin nhóm" onPress={() => context.data?.groupId ? router.push({ pathname: '/mentoring/groups/[id]', params: { id: String(context.data.groupId) } }) : !isMentoring && router.push({ pathname: '/chat/group/[id]', params: { id: String(convId) } })} hitSlop={10}>
            <Info size={22} color={t.text} />
          </Pressable>
        ) : undefined}
      </View>
      {isMentoring && convId != null ? (
        <View style={{ paddingHorizontal: 12, paddingTop: keyboardOpen ? 4 : 8, paddingBottom: keyboardOpen ? 4 : 6 }}>
          {context.isLoading ? (
            <View style={{ padding: 8, borderRadius: 12, backgroundColor: t.surface, alignItems: 'center' }}>
              <Txt muted size={11.5}>Đang kiểm tra quyền trò chuyện...</Txt>
            </View>
          ) : context.isError ? (
            <View style={{ padding: 8, borderRadius: 12, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt muted size={11.5}>Không thể kiểm tra quyền trò chuyện.</Txt>
              <Pressable onPress={() => void context.refetch()}>
                <Txt size={11.5} weight="700" style={{ color: viridian }}>Thử lại</Txt>
              </Pressable>
            </View>
          ) : (
            <View
              style={{
                borderRadius: keyboardOpen ? 12 : 16,
                borderWidth: 1,
                borderColor: t.isDark ? '#333333' : '#EAECEF',
                backgroundColor: t.card,
                paddingVertical: keyboardOpen ? 6 : 9,
                paddingHorizontal: 11,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              {/* Left: Icon + Status Text */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <View
                  style={{
                    width: keyboardOpen ? 28 : 34,
                    height: keyboardOpen ? 28 : 34,
                    borderRadius: keyboardOpen ? 9 : 11,
                    backgroundColor: t.isDark ? '#2E1C10' : viridianSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Handshake size={keyboardOpen ? 16 : 18} color={viridian} weight="bold" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={keyboardOpen ? 12 : 13} weight="800" numberOfLines={1} style={{ color: t.text }}>
                    {deal ? `Thỏa thuận #${deal.id}` : 'Chưa có thỏa thuận'}
                  </Txt>
                  {!keyboardOpen ? (
                    <Txt size={11} weight="500" numberOfLines={1} style={{ color: t.textMuted, marginTop: 1 }}>
                      {deal
                        ? (DEAL_STATUS_LABEL[deal.status] ?? deal.status)
                        : canPropose
                          ? 'Đề xuất điều khoản để bắt đầu'
                          : 'Đang trao đổi với Mentor'}
                    </Txt>
                  ) : null}
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
                          paddingHorizontal: keyboardOpen ? 9 : 11,
                          paddingVertical: keyboardOpen ? 5 : 6,
                          borderRadius: 999,
                        }}
                      >
                        <Txt size={keyboardOpen ? 11 : 12} weight="700" style={{ color: t.text }}>
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
                        paddingHorizontal: keyboardOpen ? 11 : 13,
                        paddingVertical: keyboardOpen ? 5 : 6.5,
                        borderRadius: 999,
                        shadowColor: viridian,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                    >
                      <Txt size={keyboardOpen ? 11 : 12} weight="800" style={{ color: '#FFFFFF' }}>
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
                      paddingHorizontal: keyboardOpen ? 11 : 13,
                      paddingVertical: keyboardOpen ? 5 : 6.5,
                      borderRadius: 999,
                      shadowColor: viridian,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    <Txt size={keyboardOpen ? 11 : 12} weight="800" style={{ color: '#FFFFFF' }}>
                      Đề xuất thỏa thuận
                    </Txt>
                  </MotionPressable>
                ) : null}
              </View>
            </View>
          )}

          {/* Read-only banner if cannot send */}
          {context.data?.readOnly || !canSend ? (
            <Txt muted size={11} style={{ marginTop: 3, marginHorizontal: 4 }}>
              {context.data?.readOnlyReason || 'Cuộc trò chuyện hiện chỉ cho phép xem.'}
            </Txt>
          ) : null}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <FlashList
          ref={listRef}
          data={messages}
          inverted
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 }}
          onScroll={(e) => {
            const offsetY = e.nativeEvent.contentOffset.y
            const atBottom = offsetY <= 60
            isAtBottomRef.current = atBottom
            setShowScrollBottom(!atBottom)
          }}
          scrollEventThrottle={16}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          ListEmptyComponent={q.isLoading ? <Loading /> : q.isError ? <Empty text="Không thể tải tin nhắn." error={q.error} onRetry={() => void q.refetch()} /> : <Txt muted style={{ textAlign: 'center', padding: 24 }}>Hãy gửi tin nhắn đầu tiên.</Txt>}
          renderItem={({ item, index }) => {
            const older = messages[index + 1]
            const newer = messages[index - 1]
            const gap = !older || new Date(item.createdAt).getTime() - new Date(older.createdAt).getTime() > 15 * 60_000
            const grouped = !!newer && newer.type !== 'SYSTEM' && newer.senderId === item.senderId && new Date(newer.createdAt).getTime() - new Date(item.createdAt).getTime() < 5 * 60_000
            return (
              <View>
                {gap ? (
                  <View style={{ alignItems: 'center', marginVertical: 12 }}>
                    <View style={{ backgroundColor: t.isDark ? '#222222' : '#F2F4F7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 }}>
                      <Txt size={11} weight="600" style={{ color: t.textMuted }}>
                        {new Date(item.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </Txt>
                    </View>
                  </View>
                ) : null}
                <MessageBubble
                  item={item}
                  mine={String(item.senderId) === me?.id}
                  isGroupChat={!!isGroupChat || context.data?.groupId != null}
                  grouped={grouped}
                  showTime={timeId === item.id}
                  onToggleTime={() => setTimeId(timeId === item.id ? null : item.id)}
                />
              </View>
            )
          }}
        />
        {showScrollBottom ? (
          <MotionPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
              scrollToBottom(true)
            }}
            accessibilityRole="button"
            accessibilityLabel="Cuộn xuống tin nhắn mới nhất"
            style={{
              position: 'absolute',
              right: 16,
              bottom: 66,
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: t.card,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
              borderWidth: 1,
              borderColor: t.divider,
              zIndex: 10,
            }}
          >
            <ChevronDown size={20} color={viridian} weight="bold" />
          </MotionPressable>
        ) : null}
        {pending.length ? <View style={{ paddingHorizontal: 12, paddingTop: 8, backgroundColor: t.card }}>
          {pending.map((file) => <View key={file.url} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Txt numberOfLines={1} style={{ flex: 1 }}>{file.fileName ?? 'Ảnh đính kèm'}</Txt><Pressable accessibilityRole="button" accessibilityLabel={`Bỏ tệp ${file.fileName ?? ''}`} disabled={send.isPending} onPress={() => setPending((files) => files.filter((f) => f.url !== file.url))} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><X size={18} color={t.textMuted} /></Pressable></View>)}
        </View> : null}
        {uploading ? <Txt muted size={12} style={{ padding: 8 }}>Đang tải tệp lên...</Txt> : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            marginHorizontal: 12,
            marginTop: 6,
            marginBottom: keyboardOpen ? 6 : 10,
            padding: 4,
            borderRadius: 26,
            backgroundColor: t.isDark ? '#1F1F1F' : '#F6F7F9',
            borderWidth: 1,
            borderColor: t.isDark ? '#333333' : '#E8EAED',
          }}
        >
          <MotionPressable
            onPress={() => void sendImage()}
            disabled={!canSend || uploading || send.isPending}
            accessibilityRole="button"
            accessibilityLabel="Chọn ảnh"
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: t.primary,
              opacity: canSend ? 1 : 0.4,
            }}
          >
            <ImageIcon size={20} color="#FFFFFF" />
          </MotionPressable>

          <TextInput
            value={text}
            onChangeText={setText}
            onFocus={() => {
              setTimeout(() => scrollToBottom(true), 80)
            }}
            placeholder="Nhắn tin..."
            placeholderTextColor={t.textMuted}
            multiline
            editable={canSend}
            accessibilityLabel="Nội dung tin nhắn"
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 38,
              color: t.text,
              paddingHorizontal: 10,
              paddingTop: Platform.OS === 'ios' ? 9 : 7,
              paddingBottom: Platform.OS === 'ios' ? 9 : 7,
              fontSize: 14.5,
              lineHeight: 20,
            }}
          />

          <MotionPressable
            onPress={() => void sendFile()}
            disabled={!canSend || uploading || send.isPending}
            accessibilityRole="button"
            accessibilityLabel="Chọn tệp hoặc video"
            style={{
              width: 36,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canSend ? 1 : 0.4,
            }}
          >
            <Paperclip size={20} color={t.textMuted} />
          </MotionPressable>

          <MotionPressable
            onPress={submit}
            disabled={!canSend || uploading || send.isPending || (!text.trim() && !pending.length)}
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSend && (text.trim() || pending.length) ? t.primary : 'transparent',
            }}
          >
            <Send
              size={18}
              color={canSend && (text.trim() || pending.length) ? '#FFFFFF' : t.textSubtle}
              weight={canSend && (text.trim() || pending.length) ? 'fill' : 'regular'}
            />
          </MotionPressable>
        </View>
      </View>

      {/* Menu Thao tác (Tương đương Menu Thao tác trên Web) */}
      <SheetModal visible={actionMenuVisible} onClose={() => setActionMenuVisible(false)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: t.divider }}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
            <Txt size={17} weight="800" style={{ color: t.text }}>
              Thao tác
            </Txt>
            <Txt size={12} weight="500" style={{ color: t.textMuted, marginTop: 2 }} numberOfLines={1}>
              {context.data?.requestTitle ? `Yêu cầu #${context.data.requestId}: ${context.data.requestTitle}` : 'Tác vụ hội thoại cố vấn'}
            </Txt>
          </View>
          <Pressable
            onPress={() => setActionMenuVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Đóng menu thao tác"
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color={t.textMuted} />
          </Pressable>
        </View>

        <View style={{ padding: 16 }}>
          <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginLeft: 2 }}>
            Xem & Tra cứu
          </Txt>

          {deal ? (
            <ActionRow
              icon={<History size={20} color={viridian} />}
              title="Lịch sử phiên bản Deal"
              desc={`Thỏa thuận #${deal.id} · Phiên bản v${deal.version} (${DEAL_STATUS_LABEL[deal.status] ?? deal.status})`}
              onPress={() => {
                setActionMenuVisible(false)
                router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } })
              }}
            />
          ) : null}

          {context.data?.requestId ? (
            <ActionRow
              icon={<FileText size={20} color={viridian} />}
              title="Chi tiết yêu cầu"
              desc={`Mã #${context.data.requestId}: ${context.data.requestTitle ?? 'Xem bài toán cần hỗ trợ'}`}
              onPress={() => {
                setActionMenuVisible(false)
                const isMentor = context.data?.myRole === 'MENTOR' || me?.role === 'ALUMNI'
                router.push({
                  pathname: isMentor ? '/mentoring/incoming/[id]' : '/mentoring/request/[id]',
                  params: { id: String(context.data?.requestId) },
                })
              }}
            />
          ) : null}

          {context.data?.taskId ? (
            <ActionRow
              icon={<ListChecks size={20} color={viridian} />}
              title="Không gian nhiệm vụ (Task)"
              desc="Xem tiến độ thực hiện và trao đổi công việc"
              onPress={() => {
                setActionMenuVisible(false)
                router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(context.data?.taskId) } })
              }}
            />
          ) : null}

          {context.data?.groupId ? (
            <ActionRow
              icon={<Info size={20} color={viridian} />}
              title="Thông tin nhóm cố vấn"
              desc="Danh sách thành viên và hoạt động của nhóm"
              onPress={() => {
                setActionMenuVisible(false)
                router.push({ pathname: '/mentoring/groups/[id]', params: { id: String(context.data?.groupId) } })
              }}
            />
          ) : null}

          {/* Section: Thỏa thuận cố vấn (Phân quyền rõ ràng giữa Mentor và Học viên) */}
          {deal ? (
            <>
              <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 10, marginBottom: 8, marginLeft: 2 }}>
                Thỏa thuận
              </Txt>

              {isMentor && deal.canEdit !== false ? (
                <ActionRow
                  icon={<Handshake size={20} color={viridian} weight="bold" />}
                  title="Chỉnh sửa điều khoản thỏa thuận"
                  desc="Cập nhật phạm vi, mức phí và thời hạn hướng dẫn"
                  onPress={() => {
                    setActionMenuVisible(false)
                    router.push({ pathname: '/mentoring/deal/form', params: { dealId: String(deal.id), conversationId: String(convId) } })
                  }}
                />
              ) : isStudent ? (
                <ActionRow
                  icon={<Handshake size={20} color={viridian} weight="bold" />}
                  title={deal.canConfirm ? 'Phản hồi thỏa thuận (Đồng ý / Từ chối)' : (deal.canPay ? 'Thanh toán thỏa thuận' : 'Xem chi tiết thỏa thuận')}
                  desc={
                    deal.canConfirm
                      ? 'Mentor đã gửi thỏa thuận · Chạm để xem và đồng ý hoặc từ chối'
                      : (deal.canPay ? 'Thỏa thuận đã chốt xong · Chạm để tiến hành thanh toán' : 'Xem điều khoản hướng dẫn hai bên đã thống nhất')
                  }
                  onPress={() => {
                    setActionMenuVisible(false)
                    router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } })
                  }}
                />
              ) : (
                <ActionRow
                  icon={<Handshake size={20} color={viridian} weight="bold" />}
                  title="Xem chi tiết thỏa thuận"
                  desc="Xem điều khoản hướng dẫn hai bên đã thống nhất"
                  onPress={() => {
                    setActionMenuVisible(false)
                    router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } })
                  }}
                />
              )}
            </>
          ) : isMentor && canPropose ? (
            <>
              <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 10, marginBottom: 8, marginLeft: 2 }}>
                Thỏa thuận
              </Txt>
              <ActionRow
                icon={<Handshake size={20} color={viridian} weight="bold" />}
                title="Đề xuất thỏa thuận mới"
                desc="Khởi tạo điều khoản hướng dẫn cho học viên"
                onPress={() => {
                  setActionMenuVisible(false)
                  router.push({ pathname: '/mentoring/deal/form', params: { conversationId: String(convId) } })
                }}
              />
            </>
          ) : null}
        </View>
      </SheetModal>
    </Screen>
  )
}
