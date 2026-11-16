import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Keyboard, Linking, Modal, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView as RNWebView } from 'react-native-webview'
import * as DocumentPicker from 'expo-document-picker'
import * as Haptics from 'expo-haptics'
import { TextInput } from '@/components/AppText'
import { FlashList } from '@shopify/flash-list'
import type { FlashListRef } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, BarChart3, CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, FilePen, FileCheck2, FileText, PackageCheck, Scale, Handshake, History, ImageIcon, Info, ListChecks, MoreHorizontal, Paperclip, Send, Users, X } from '@/components/icons'
import { Avatar, Button, Empty, Loading, Screen, Txt } from './ui'
import { MotionPressable } from './Motion'
import { SheetModal } from './SheetModal'
import { ScrollView } from '@/components/ScrollView'
import { chatApi } from '@/api/chat'
import type { DealSnapshot, Message, OutgoingAttachment } from '@/api/chat'
import { SharedCard } from '@/components/SharedCards'
import { parseSharedLink } from '@/lib/share'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { DEAL_STATUS_LABEL, dealApi } from '@/api/mentoringFlow'
import { taskApi } from '@/api/mentoringTask'
import type { TaskCheckout } from '@/api/mentoringTask'
import { DealHistorySheet, DealTicketCard, ReasonSheet, TaskActionPanel } from './MentoringChatCards'
import { PaymentSheet } from './PaymentSheet'
import { AttachmentTray, MAX_ATTACHMENTS } from './AttachmentTray'
import type { PendingAttachment, UploadingAttachment } from './AttachmentTray'
import { MediaPreviewModal, type MediaPreviewItem } from './MediaPreviewModal'
import { pickChatMedia, pickImage, runConcurrentPool, uploadFile, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'

const WebView = RNWebView as unknown as React.ComponentType<any>

function isVideoAttachment(a: { mediaType?: string; url?: string; fileName?: string }) {
  if (a.mediaType?.toUpperCase() === 'VIDEO') return true
  const raw = `${a.url ?? ''} ${a.fileName ?? ''}`.split('?')[0]
  return /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(raw)
}

/** Cache tỉ lệ (rộng/cao) đã đo của ảnh/video để khung không nhảy khi cuộn lại. */
const mediaRatioCache = new Map<string, number>()
const MEDIA_MAX_W = 230
const MEDIA_MAX_H = 300
const MEDIA_MIN_SIDE = 110

/** Tính kích thước khung theo tỉ lệ thật, giới hạn trong vùng tối đa (giống Messenger/Zalo). */
function fitMediaBox(ratio: number | undefined, fallbackRatio: number) {
  const r = ratio && Number.isFinite(ratio) && ratio > 0 ? ratio : fallbackRatio
  let w = MEDIA_MAX_W
  let h = w / r
  if (h > MEDIA_MAX_H) {
    h = MEDIA_MAX_H
    w = h * r
  }
  return { width: Math.max(MEDIA_MIN_SIDE, Math.round(w)), height: Math.max(MEDIA_MIN_SIDE * 0.6, Math.round(h)) }
}

function fileExt(name?: string, url?: string) {
  const raw = (name || url || '').split('?')[0]
  const m = raw.match(/\.([a-z0-9]{1,5})$/i)
  return m ? m[1].toUpperCase() : 'FILE'
}

const EXT_COLOR: Record<string, string> = {
  PDF: '#E5484D',
  DOC: '#2B6CEF', DOCX: '#2B6CEF',
  XLS: '#1F9D55', XLSX: '#1F9D55', CSV: '#1F9D55',
  PPT: '#E8590C', PPTX: '#E8590C',
  ZIP: '#8E6CEF', RAR: '#8E6CEF',
}

function ChatImage({ url, mine, onOpen, style }: { url: string; mine: boolean; onOpen: () => void; style?: object }) {
  const [ratio, setRatio] = useState(() => mediaRatioCache.get(url))
  const box = fitMediaBox(ratio, 1)
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel="Xem ảnh"
      onPress={onOpen}
      style={[{ alignSelf: mine ? 'flex-end' : 'flex-start' }, style]}
    >
      <Image
        source={{ uri: url }}
        style={{ width: box.width, height: box.height, borderRadius: 16, backgroundColor: 'rgba(127,127,127,0.12)' }}
        contentFit="cover"
        transition={150}
        onLoad={(e) => {
          const { width, height } = e.source
          if (!width || !height) return
          const r = width / height
          mediaRatioCache.set(url, r)
          if (r !== ratio) setRatio(r)
        }}
      />
    </Pressable>
  )
}

function ChatFileCard({ name, url, mine }: { name?: string; url: string; mine: boolean }) {
  const t = useTheme()
  const ext = fileExt(name, url)
  const color = EXT_COLOR[ext] ?? t.primary
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Mở tệp ${name ?? ''}`}
      onPress={() => void openAttachment(url)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minWidth: 200,
        maxWidth: 260,
        padding: 10,
        borderRadius: 14,
        backgroundColor: mine ? 'rgba(255,255,255,0.16)' : t.isDark ? '#1C1C1C' : '#FFFFFF',
        borderWidth: mine ? 0 : 1,
        borderColor: t.border,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View style={{ width: 40, height: 44, borderRadius: 8, backgroundColor: mine ? '#FFFFFF' : `${color}1A`, alignItems: 'center', justifyContent: 'center' }}>
        <FileText size={18} color={color} />
        <Txt size={8.5} weight="800" color={color} style={{ marginTop: 1 }}>{ext}</Txt>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={13.5} weight="600" numberOfLines={2} color={mine ? '#FFFFFF' : t.text}>
          {name || 'Tệp đính kèm'}
        </Txt>
        <Txt size={11.5} color={mine ? 'rgba(255,255,255,0.8)' : t.textMuted} style={{ marginTop: 2 }}>
          Chạm để mở
        </Txt>
      </View>
    </Pressable>
  )
}

function ImageViewerModal({ url, onClose }: { url: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Đóng ảnh">
          {url ? <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="contain" /> : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          onPress={onClose}
          hitSlop={12}
          style={{ position: 'absolute', top: insets.top + 10, right: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={22} color="#FFFFFF" />
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => url && void openAttachment(url)}
          style={{ position: 'absolute', bottom: insets.bottom + 20, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <Txt size={13} weight="600" color="#FFFFFF">Mở ảnh gốc</Txt>
        </Pressable>
      </View>
    </Modal>
  )
}

function ChatVideoPlayer({ url, style }: { url: string; style?: object }) {
  const [ratio, setRatio] = useState(() => mediaRatioCache.get(url))
  const box = fitMediaBox(ratio, 3 / 4)
  if (Platform.OS === 'web') {
    return React.createElement('video', {
      src: url,
      controls: true,
      playsInline: true,
      preload: 'metadata',
      onLoadedMetadata: (e: { currentTarget: { videoWidth: number; videoHeight: number } }) => {
        const { videoWidth: w, videoHeight: h } = e.currentTarget
        if (w && h) {
          mediaRatioCache.set(url, w / h)
          setRatio(w / h)
        }
      },
      style: { ...box, borderRadius: 16, backgroundColor: '#000', objectFit: 'contain', ...(style as object) },
    })
  }
  const safeUrl = url.replace(/"/g, '&quot;')
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>html,body{margin:0;padding:0;width:100%;height:100%;background:#090d16;overflow:hidden;display:flex;align-items:center;justify-content:center}video{width:100%;height:100%;object-fit:contain;background:#000}</style></head><body><video id="v" src="${safeUrl}#t=0.01" controls playsinline webkit-playsinline preload="auto"></video><script>var v=document.getElementById('v');v.addEventListener('loadedmetadata',function(){if(window.ReactNativeWebView&&v.videoWidth&&v.videoHeight){window.ReactNativeWebView.postMessage(JSON.stringify({w:v.videoWidth,h:v.videoHeight}))}});v.addEventListener('loadeddata',function(){try{if(v.paused&&v.currentTime<0.05){v.currentTime=0.05;}}catch(e){}});</script></body></html>`
  return (
    <View style={[{ ...box, borderRadius: 16, overflow: 'hidden', backgroundColor: '#090d16' }, style]}>
      <WebView
        onMessage={(e: { nativeEvent: { data: string } }) => {
          try {
            const { w, h } = JSON.parse(e.nativeEvent.data) as { w: number; h: number }
            if (w > 0 && h > 0) {
              mediaRatioCache.set(url, w / h)
              setRatio(w / h)
            }
          } catch {
            /* bỏ qua */
          }
        }}
        source={{ html }}
        originWhitelist={['*']}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        style={{ flex: 1, backgroundColor: '#090d16' }}
      />
    </View>
  )
}

function isImageAttachment(a: { mediaType?: string; url?: string; fileName?: string }) {
  if (a.mediaType?.toUpperCase() === 'IMAGE') return true
  const raw = `${a.fileName || a.url || ''}`.split('?')[0]
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(raw)
}

async function openAttachment(url: string) {
  try {
    if (!/^https?:\/\//i.test(url)) throw new Error('Liên kết tệp không hợp lệ.')
    await Linking.openURL(url)
  } catch (e) { toast.error(errMsg(e, 'Không thể mở tệp. Vui lòng thử lại.')) }
}

/** Khung chat (UC30): FlashList inverted + KeyboardAvoidingView; hỗ trợ hội thoại nháp (chưa có id). */
const MessageBubble = React.memo(function MessageBubble({ item, mine, isGroupChat, showTime, onToggleTime, grouped, onOpenImage }: { item: Message; mine: boolean; isGroupChat: boolean; showTime: boolean; onToggleTime: () => void; grouped: boolean; onOpenImage: (url: string) => void }) {
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
  const textBody = shared ? shared.note : item.content
  const cardOnly = !!shared && !shared.note && !(item.attachments?.length)
  const hasOnlyMedia =
    !item.isDeleted &&
    !textBody &&
    !shared &&
    !!item.attachments?.length &&
    item.attachments.every((a) => isImageAttachment(a) || isVideoAttachment(a))
  const unboxed = cardOnly || hasOnlyMedia
  const hasVideo = !item.isDeleted && !!item.attachments?.some((a) => isVideoAttachment(a))
  const BubbleContainer: React.ElementType = hasVideo ? View : Pressable
  const containerProps = hasVideo
    ? {}
    : {
        onPress: onToggleTime,
        accessibilityRole: 'button' as const,
        accessibilityLabel: `Tin nhắn của ${item.senderName}, ${new Date(item.createdAt).toLocaleString('vi-VN')}`,
        accessibilityHint: 'Chạm để hiện hoặc ẩn thời gian',
      }
  return (
    <View style={{ flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginTop: 2, marginBottom: grouped ? 1 : 8 }}>
      {!mine ? <View style={{ width: 28 }}>{!grouped ? <Avatar uri={item.senderAvatar} name={item.senderName} size={28} /> : null}</View> : null}
      <BubbleContainer
        {...containerProps}
        style={
          unboxed
            ? { maxWidth: '88%', alignItems: mine ? 'flex-end' : 'flex-start' }
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
            {item.attachments?.map((a, i) => {
              const gap = { marginBottom: textBody || i < (item.attachments?.length ?? 0) - 1 ? 6 : 0 }
              const attachKey = a.id ? `att-${a.id}` : `att-${i}-${a.url}`
              return isVideoAttachment(a) ? (
                <ChatVideoPlayer key={attachKey} url={a.url} style={gap} />
              ) : isImageAttachment(a) ? (
                <ChatImage key={attachKey} url={a.url} mine={mine} onOpen={() => onOpenImage(a.url)} style={gap} />
              ) : (
                <View key={attachKey} style={gap}>
                  <ChatFileCard name={a.fileName} url={a.url} mine={mine} />
                </View>
              )
            })}
            {textBody ? (
              <Txt onPress={hasVideo ? onToggleTime : undefined} size={14.5} color={mine ? '#FFFFFF' : t.text} style={{ lineHeight: 20 }}>
                {textBody}
              </Txt>
            ) : null}
            {shared ? <View style={{ marginTop: shared.note ? 8 : 0 }}><SharedCard link={shared} mine={mine} /></View> : null}
          </>
        )}
        {showTime ? (
          <Txt size={11} color={mine && !unboxed ? 'rgba(255,255,255,0.75)' : t.textMuted} style={{ marginTop: 4, alignSelf: mine ? 'flex-end' : 'flex-start' }}>
            {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Txt>
        ) : null}
      </BubbleContainer>
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

/** Một dòng trong đoạn chat: tin nhắn thường hoặc thẻ Deal Ticket (giống web). */
type ChatItem = { kind: 'msg'; at: number; m: Message } | { kind: 'deal'; at: number; s: DealSnapshot }

export function ChatWindow({
  conversationId,
  recipientId,
  title,
  isGroupChat,
  communityGroupId,
  communityGroupName,
  isMentoring,
  avatarUrl,
}: {
  conversationId: number | null
  recipientId?: number | null
  title: string
  isGroupChat?: boolean
  communityGroupId?: number | null
  communityGroupName?: string | null
  isMentoring?: boolean
  avatarUrl?: string | null
}) {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const [convId, setConvId] = useState(conversationId)
  const [text, setText] = useState('')
  const [pending, setPending] = useState<PendingAttachment[]>([])
  const [uploadingItems, setUploadingItems] = useState<UploadingAttachment[]>([])
  const uploading = uploadingItems.length > 0
  const [timeId, setTimeId] = useState<number | null>(null)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [actionMenuVisible, setActionMenuVisible] = useState(false)
  const [historyVisible, setHistoryVisible] = useState(false)
  const [viewerMedia, setViewerMedia] = useState<MediaPreviewItem | null>(null)
  const listRef = useRef<FlashListRef<ChatItem>>(null)
  const isAtBottomRef = useRef(true)
  const prevLatestMsgIdRef = useRef<number | null>(null)

  const context = useQuery({ queryKey: ['mentoring-chat-context', convId], enabled: !!isMentoring && convId != null, queryFn: () => chatApi.mentoringContext(convId!), refetchOnMount: 'always', refetchInterval: 15_000 })
  const deal = context.data?.deal?.deal
  // Vai trò trong cuộc hội thoại mentoring do BE quyết định (MENTOR / STUDENT / GROUP_MEMBER) — không suy từ role tài khoản,
  // vì Cựu sinh viên cũng có thể là người gửi yêu cầu (học viên).
  const isMentor = context.data?.myRole === 'MENTOR'
  const isStudent = context.data?.myRole === 'STUDENT'
  const canSend = !isMentoring || (!!context.data?.canSendMessage && !context.data.readOnly && !context.isError)
  const { viridian, viridianSoft } = useMentoringTheme()
  const canPropose = canSend && isMentor && (!!context.data?.canCreateDealTicket || !!context.data?.canAcceptDealByRequest)
  const snapshots = context.data?.deal?.snapshots ?? []

  // ---- Hành động trên thẻ Deal trong chat ----
  const [dealBusy, setDealBusy] = useState<'confirm' | 'reject' | 'adjust' | 'pay' | null>(null)
  const [dealDialog, setDealDialog] = useState<'REJECT' | 'ADJUST' | null>(null)
  const [checkout, setCheckout] = useState<TaskCheckout | null>(null)
  const refreshDeal = () => {
    void context.refetch()
    qc.invalidateQueries({ queryKey: ['mentoring-deals'] })
    qc.invalidateQueries({ queryKey: ['mentoring-tasks'] })
    if (convId != null) qc.invalidateQueries({ queryKey: ['messages', convId] })
  }
  const startPayment = async () => {
    if (!deal) return
    setDealBusy('pay')
    try {
      setCheckout(await taskApi.checkout(deal.id))
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setDealBusy(null)
    }
  }
  const confirmAndPay = async () => {
    if (!deal) return
    setDealBusy('confirm')
    try {
      const confirmed = await dealApi.confirm(deal.id, deal.version)
      toast.success('Đã xác nhận thỏa thuận.')
      refreshDeal()
      if (confirmed?.canPay !== false) setCheckout(await taskApi.checkout(deal.id))
    } catch (e) {
      toast.error(errMsg(e))
      refreshDeal()
    } finally {
      setDealBusy(null)
    }
  }
  const submitDealDialog = async (note?: string) => {
    if (!deal || !dealDialog) return
    const kind = dealDialog
    setDealBusy(kind === 'REJECT' ? 'reject' : 'adjust')
    try {
      if (kind === 'REJECT') await dealApi.reject(deal.id, note, deal.version)
      else await dealApi.requestAdjustment(deal.id, note, deal.version)
      toast.success(kind === 'REJECT' ? 'Đã từ chối thỏa thuận.' : 'Đã gửi yêu cầu điều chỉnh.')
      setDealDialog(null)
      refreshDeal()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setDealBusy(null)
    }
  }

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
  const taskIdForMenu = context.data?.taskId ?? null
  const taskDetail = useQuery({
    queryKey: ['mentoring-task', taskIdForMenu],
    queryFn: () => taskApi.detail(taskIdForMenu as number),
    enabled: taskIdForMenu != null,
    staleTime: 10_000,
  })
  // API trả mới nhất trước → khớp với FlashList inverted.
  const messages: Message[] = q.data?.pages.flatMap((p) => p.data.content) ?? []
  // Gộp thẻ Deal Ticket vào dòng tin nhắn theo thời gian (mới nhất trước, khớp inverted list)
  const oldestLoaded = messages.length ? new Date(messages[messages.length - 1].createdAt).getTime() : 0
  const items: ChatItem[] = [
    ...messages.map((m) => ({ kind: 'msg' as const, at: new Date(m.createdAt).getTime(), m })),
    ...snapshots
      .map((sn) => ({ kind: 'deal' as const, at: new Date(sn.createdAt).getTime(), s: sn }))
      .filter((it) => !q.hasNextPage || it.at >= oldestLoaded),
  ].sort((a, b) => b.at - a.at || (a.kind === 'msg' ? -1 : 1))

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
    send.mutate({ content: content || undefined, attachments: pending.map(({ localUri: _l, ...a }) => a) })
  }
  const slotsLeft = () => MAX_ATTACHMENTS - pending.length - uploadingItems.length
  /** Tải nhiều tệp theo hàng đợi song song có kiểm soát (Concurrency = 2); mỗi tệp có ô "đang tải" riêng, lỗi tệp nào báo tệp đó và không làm gián đoạn các tệp khác. */
  const uploadMany = async <T,>(
    items: T[],
    describe: (it: T) => UploadingAttachment,
    run: (it: T) => Promise<PendingAttachment>,
  ) => {
    const left = slotsLeft()
    if (items.length > left) toast.error(`Chỉ gửi tối đa ${MAX_ATTACHMENTS} tệp mỗi tin nhắn.`)
    const batch = items.slice(0, Math.max(0, left)).map((it, i) => ({
      it,
      meta: {
        ...describe(it),
        key: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        status: (i < 2 ? 'uploading' : 'queued') as 'uploading' | 'queued',
      },
    }))
    if (!batch.length) return
    setUploadingItems((cur) => [...cur, ...batch.map((b) => b.meta)])

    await runConcurrentPool(
      batch,
      async ({ it, meta }) => {
        setUploadingItems((cur) =>
          cur.map((u) => (u.key === meta.key ? { ...u, status: 'uploading' } : u)),
        )
        const done = await run(it)
        return { done, meta }
      },
      {
        concurrency: 2,
        onSuccess: ({ done, meta }) => {
          setPending((files) => [...files, done])
          setUploadingItems((cur) => cur.filter((u) => u.key !== meta.key))
        },
        onError: (e, { meta }) => {
          toast.error(`${meta.name}: ${errMsg(e)}`)
          setUploadingItems((cur) => cur.filter((u) => u.key !== meta.key))
        },
      }
    )
  }
  const sendMedia = async () => {
    if (!canSend || send.isPending || slotsLeft() <= 0) return
    try {
      const mediaList = await pickChatMedia(true)
      await uploadMany(
        mediaList,
        (m) => ({ key: '', name: m.name, kind: m.kind, localUri: m.uri }),
        async (m) => {
          if (m.kind === 'VIDEO') {
            const uploaded = await uploadFile(m, 'messages')
            return { mediaType: 'VIDEO', url: uploaded.url, fileName: m.name, fileSize: m.size, localUri: m.uri }
          }
          const url = await uploadImage(m, 'messages')
          return { mediaType: 'IMAGE', url, fileName: m.name, localUri: m.uri }
        },
      )
    } catch (e) {
      toast.error(errMsg(e))
    }
  }
  const sendFile = async () => {
    if (!canSend || send.isPending || slotsLeft() <= 0) return
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: false,
        multiple: true,
        type: [
          'image/*',
          'video/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/zip',
          'text/*',
        ],
      })
      if (result.canceled) return
      const kindOf = (f: DocumentPicker.DocumentPickerAsset): UploadingAttachment['kind'] =>
        f.mimeType?.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic)$/i.test(f.name) ? 'IMAGE'
        : f.mimeType?.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(f.name) ? 'VIDEO' : 'FILE'
      await uploadMany(
        result.assets,
        (f) => ({ key: '', name: f.name, kind: kindOf(f), localUri: f.uri }),
        async (f) => {
          const kind = kindOf(f)
          if (kind === 'IMAGE') {
            const url = await uploadImage({ uri: f.uri, name: f.name, mimeType: f.mimeType }, 'messages')
            return { mediaType: 'IMAGE', url, fileName: f.name, fileSize: f.size, localUri: f.uri }
          }
          const uploaded = await uploadFile(f, 'messages')
          return { ...uploaded, mediaType: kind, localUri: f.uri }
        },
      )
    } catch (e) { toast.error(errMsg(e)) }
  }

  const taskPerm = taskDetail.data?.permissions
  const goTask = (type?: string) => {
    setActionMenuVisible(false)
    const id = String(context.data?.taskId)
    if (type) router.push({ pathname: '/mentoring/tasks/[id]/action', params: { id, type } })
    else router.push({ pathname: '/mentoring/tasks/[id]', params: { id } })
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
                ? communityGroupId != null
                  ? 'Nhóm cộng đồng'
                  : 'Trò chuyện nhóm'
                : recipientId
                  ? 'Xem trang cá nhân'
                  : 'Tin nhắn'}
          </Txt>
        </MotionPressable>

        {isMentoring && convId != null ? (
          <MotionPressable
            onPress={() => { void context.refetch(); if (taskIdForMenu != null) void taskDetail.refetch(); setActionMenuVisible(true) }}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!isMentoring && isGroupChat && communityGroupId != null ? (
              <MotionPressable
                onPress={() => router.push({ pathname: '/groups/[id]', params: { id: String(communityGroupId) } })}
                accessibilityRole="button"
                accessibilityLabel={`Đến trang hội nhóm: ${communityGroupName || title}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: t.isDark ? '#4A382B' : '#FEC7A8',
                  backgroundColor: t.isDark ? '#2D2621' : '#FFF4EC',
                  maxWidth: 132,
                }}
              >
                <Users size={13} color={t.primary} weight="bold" />
                <Txt size={11.5} weight="700" color={t.primary} numberOfLines={1} style={{ flexShrink: 1 }}>
                  {communityGroupName || 'Hội nhóm'}
                </Txt>
                <ChevronRight size={12} color={t.primary} />
              </MotionPressable>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Thông tin nhóm" onPress={() => context.data?.groupId ? router.push({ pathname: '/mentoring/groups/[id]', params: { id: String(context.data.groupId) } }) : !isMentoring && router.push({ pathname: '/chat/group/[id]', params: { id: String(convId) } })} hitSlop={10}>
              <Info size={22} color={t.text} />
            </Pressable>
          </View>
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

          {context.data?.taskId ? <TaskActionPanel taskId={context.data.taskId} compact={keyboardOpen} onChanged={() => void context.refetch()} /> : null}

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
          data={items}
          inverted
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyExtractor={(it) => (it.kind === 'msg' ? `m-${it.m.id}` : `d-${it.s.id}`)}
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
          renderItem={({ item: row, index }) => {
            if (row.kind === 'deal') {
              const sn = row.s
              const isLatest = !!deal && sn.version === deal.version
              return (
                <DealTicketCard
                  snapshot={sn}
                  deal={deal}
                  mine={sn.modifiedByUserId != null && String(sn.modifiedByUserId) === me?.id}
                  isStudent={isStudent}
                  isMentor={isMentor}
                  canReissue={isLatest && !!context.data?.canCreateDealTicket && canSend}
                  busy={isLatest ? dealBusy : null}
                  onConfirm={() => void confirmAndPay()}
                  onReject={() => setDealDialog('REJECT')}
                  onAdjust={() => setDealDialog('ADJUST')}
                  onPay={() => void startPayment()}
                  onReissue={() => router.push({ pathname: '/mentoring/deal/form', params: { dealId: String(sn.dealId), conversationId: String(convId) } })}
                  onViewDetail={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(sn.dealId) } })}
                />
              )
            }
            const item = row.m
            const olderRow = items[index + 1]
            const newerRow = items[index - 1]
            const older = olderRow?.kind === 'msg' ? olderRow.m : undefined
            const newer = newerRow?.kind === 'msg' ? newerRow.m : undefined
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
                  onOpenImage={(url) => setViewerMedia({ url, mediaType: 'IMAGE' })}
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
        <AttachmentTray
          pending={pending}
          uploading={uploadingItems}
          disabled={send.isPending}
          onRemove={(url) => setPending((files) => files.filter((f) => f.url !== url))}
          onClear={() => setPending([])}
          onAdd={() => void sendFile()}
          onPreview={(item) => setViewerMedia(item)}
        />
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
            onPress={() => void sendMedia()}
            disabled={!canSend || uploading || send.isPending}
            accessibilityRole="button"
            accessibilityLabel="Chọn ảnh hoặc video"
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

        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
          <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginLeft: 2 }}>
            Xem & Tra cứu
          </Txt>

          {deal ? (
            <ActionRow
              icon={<History size={20} color={viridian} />}
              title="Lịch sử phiên bản Deal"
              desc={`Thỏa thuận #${deal.id} · ${snapshots.length || deal.version} phiên bản · Hiện tại v${deal.version} (${DEAL_STATUS_LABEL[deal.status] ?? deal.status})`}
              onPress={() => {
                setActionMenuVisible(false)
                void context.refetch()
                setHistoryVisible(true)
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
                router.push({
                  pathname: isMentor ? '/mentoring/incoming/[id]' : '/mentoring/request/[id]',
                  params: { id: String(context.data?.requestId) },
                })
              }}
            />
          ) : null}

          {context.data?.taskId ? (
            <>
              <ActionRow
                icon={<ListChecks size={20} color={viridian} />}
                title="Xem Task"
                desc="Tiến độ, Work Log, thông tin thỏa thuận"
                onPress={() => goTask()}
              />
              <ActionRow
                icon={<BarChart3 size={20} color={viridian} />}
                title="Báo cáo Task & tài chính"
                desc="Dòng tiền, thanh toán và hoàn tiền của Task"
                onPress={() => {
                  setActionMenuVisible(false)
                  router.push({ pathname: '/mentoring/tasks/[id]/report', params: { id: String(context.data?.taskId) } })
                }}
              />
            </>
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

          {taskPerm && (taskPerm.canSubmitCompletion || taskPerm.canRequestExtension || taskPerm.canRequestAmendment || taskPerm.canProposeSettlement || taskPerm.canSubmitSettlementTicket) ? (
            <>
              <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 10, marginBottom: 8, marginLeft: 2 }}>
                Đề xuất
              </Txt>
              {taskPerm.canSubmitCompletion ? (
                <ActionRow icon={<PackageCheck size={20} color={viridian} />} title="Nộp kết quả hoàn thành" desc="Gửi kết quả để học viên nghiệm thu" onPress={() => goTask('completion')} />
              ) : null}
              {taskPerm.canRequestExtension ? (
                <ActionRow icon={<CalendarPlus size={20} color={viridian} />} title="Gia hạn deadline" desc="Gửi đề xuất hạn chót mới" onPress={() => goTask('extension')} />
              ) : null}
              {taskPerm.canRequestAmendment ? (
                <ActionRow icon={<FilePen size={20} color={viridian} />} title="Điều chỉnh & tăng tiền" desc="Thay đổi phạm vi, deadline hoặc thêm tiền" onPress={() => goTask('amendment')} />
              ) : null}
              {taskPerm.canProposeSettlement ? (
                <ActionRow icon={<Scale size={20} color={viridian} />} title="Dừng Task & chia quỹ" desc="Thỏa thuận hòa giải (Tự động chi tiền khi đồng ý)" onPress={() => goTask('settlement')} />
              ) : null}
              {taskPerm.canSubmitSettlementTicket ? (
                <ActionRow icon={<FileCheck2 size={20} color={viridian} />} title="Biên bản hòa giải" desc="Gửi biên bản dừng Task cho Ban Quản Trị" onPress={() => goTask('settlement-ticket')} />
              ) : null}
            </>
          ) : null}

          {taskPerm?.canCreateDisputeTicket ? (
            <>
              <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 10, marginBottom: 8, marginLeft: 2 }}>
                Hỗ trợ
              </Txt>
              <ActionRow icon={<AlertTriangle size={20} color="#DC2626" />} title="Mở khiếu nại / Ping Admin" desc="Nhờ Ban Quản Trị can thiệp & phân xử" danger onPress={() => goTask('dispute')} />
            </>
          ) : null}
        </ScrollView>
      </SheetModal>
      {deal ? (
        <DealHistorySheet
          visible={historyVisible}
          onClose={() => setHistoryVisible(false)}
          dealId={deal.id}
          snapshots={snapshots}
          currentVersion={deal.version}
          statusLabel={DEAL_STATUS_LABEL[deal.status] ?? deal.status}
          onOpenDeal={() => {
            setHistoryVisible(false)
            router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } })
          }}
        />
      ) : null}
      <ReasonSheet
        visible={dealDialog != null}
        title={dealDialog === 'REJECT' ? 'Từ chối thỏa thuận?' : 'Yêu cầu Mentor điều chỉnh?'}
        message={dealDialog === 'REJECT' ? 'Mentor sẽ nhận được thông báo kèm lý do của bạn.' : 'Mentor sẽ gửi phiên bản Deal mới theo góp ý của bạn.'}
        confirmLabel={dealDialog === 'REJECT' ? 'Từ chối' : 'Gửi yêu cầu'}
        loading={dealBusy === 'reject' || dealBusy === 'adjust'}
        onConfirm={(note) => void submitDealDialog(note)}
        onClose={() => setDealDialog(null)}
      />
      <MediaPreviewModal media={viewerMedia} onClose={() => setViewerMedia(null)} />
      <PaymentSheet
        checkout={checkout}
        poll={taskApi.paymentStatus}
        onPaid={() => {
          setCheckout(null)
          refreshDeal()
          toast.success('Thanh toán thành công! Task của bạn đã được kích hoạt.')
        }}
        onClose={() => setCheckout(null)}
        onCancel={async () => {
          if (checkout) await taskApi.cancelPayment(checkout.orderCode).catch(() => {})
          setCheckout(null)
        }}
      />
    </Screen>
  )
}
