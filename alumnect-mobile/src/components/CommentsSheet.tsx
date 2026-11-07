import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Easing, FlatList, Keyboard, Modal, PanResponder, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, Txt } from './ui'
import { TextInput } from './AppText'
import { ActionSheet } from './ActionSheet'
import { BrandIcon } from './BrandIcon'
import { CornerDownRight, X } from './icons'
import { feedApi } from '@/api/feed'
import type { Comment } from '@/api/feed'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

const EMOJIS = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂']
const OPEN_MS = 300
const CLOSE_MS = 220

/** Gom phản hồi ngay dưới bình luận gốc. */
function group(items: Comment[]) {
  const roots = items.filter((c) => !c.parentId || !items.some((p) => p.id === c.parentId))
  return roots.map((r) => ({ root: r, replies: items.filter((c) => c.parentId === r.id) }))
}

function Row({ c, reply, mine, onReply, onMore }: { c: Comment; reply?: boolean; mine: boolean; onReply: () => void; onMore: () => void }) {
  const t = useTheme()
  const router = useRouter()
  const openAuthor = () => c.authorId && router.push({ pathname: '/profile/[id]', params: { id: c.authorId } })
  return (
    <Pressable onLongPress={mine ? onMore : undefined} delayLongPress={300} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, paddingLeft: reply ? 60 : 16, paddingRight: 16 }}>
      <Pressable onPress={openAuthor} accessibilityRole="button" accessibilityLabel={`Trang cá nhân ${c.author}`}>
        <Avatar uri={c.avatar} name={c.author} size={reply ? 28 : 36} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt size={13} weight="700" onPress={openAuthor} numberOfLines={1} style={{ flexShrink: 1 }}>{c.author}</Txt>
          {c.time ? <Txt size={12} color={t.textSubtle}>{c.time}</Txt> : null}
        </View>
        <Txt size={14} style={{ lineHeight: 20, marginTop: 1 }}>{c.text}</Txt>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
          <Pressable onPress={onReply} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Trả lời ${c.author}`}>
            <Txt size={12} weight="600" color={t.textSubtle}>Trả lời</Txt>
          </Pressable>
          {mine ? (
            <Pressable onPress={onMore} hitSlop={8} accessibilityRole="button" accessibilityLabel="Tuỳ chọn bình luận">
              <Txt size={12} weight="600" color={t.textSubtle}>Tuỳ chọn</Txt>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}

/**
 * Bảng bình luận trượt từ dưới lên như Instagram: nền mờ, kéo thanh nắm để đóng,
 * dải emoji nhanh, ô nhập bo tròn với nút "Đăng". Dùng chung dữ liệu bình luận với màn bài viết.
 */
export function CommentsSheet({ postId, visible, onClose }: { postId: string; visible: boolean; onClose: () => void }) {
  const t = useTheme()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const { height: screenH } = useWindowDimensions()
  const sheetH = Math.round(screenH * 0.78)
  const me = useAuthStore((s) => s.user)
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null)

  const [closing, setClosing] = useState(false)
  const mounted = visible || closing
  const [slide] = useState(() => new Animated.Value(sheetH))
  const closeRef = useRef<() => void>(() => {})
  const [kb, setKb] = useState(0)
  const [rootH, setRootH] = useState(0)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<Comment | null>(null)
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [selected, setSelected] = useState<Comment | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const close = useCallback(() => {
    Keyboard.dismiss()
    setClosing(true)
    Animated.timing(slide, { toValue: sheetH, duration: CLOSE_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setClosing(false)
      onClose()
    })
  }, [slide, sheetH, onClose])
  useEffect(() => { closeRef.current = close }, [close])

  useEffect(() => {
    if (visible) {
      slide.setValue(sheetH)
      Animated.timing(slide, { toValue: 0, duration: OPEN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    }
  }, [visible, slide, sheetH])

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKb(e.endCoordinates.height))
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(0))
    return () => { show.remove(); hide.remove() }
  }, [])

  // Kéo thanh nắm/tiêu đề xuống để đóng; thả sớm thì bật về vị trí cũ.
  // eslint-disable-next-line react-hooks/refs -- closeRef chỉ được đọc trong callback cử chỉ, không đọc lúc render.
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_e, g) => slide.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 110 || g.vy > 0.9) closeRef.current()
        else Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start()
      },
    }),
  )

  const q = useInfiniteQuery({
    queryKey: ['post', postId, 'comments'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getComments(postId, pageParam),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
    enabled: mounted,
  })
  const groups = group(q.data?.pages.flatMap((p) => p.items) ?? [])

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['post', postId, 'comments'] })
    qc.invalidateQueries({ queryKey: ['post', postId] })
    qc.invalidateQueries({ queryKey: ['feed'] })
  }
  const reset = () => { setText(''); setEditing(null); setReplyTo(null) }

  const send = useMutation({
    mutationFn: () => {
      if (editing) return feedApi.updateComment(postId, editing.id, text.trim())
      const parent = replyTo ? replyTo.parentId ?? replyTo.id : undefined
      return feedApi.createComment(postId, text.trim(), parent ?? undefined)
    },
    onSuccess: () => {
      if (replyTo) setOpen((o) => ({ ...o, [replyTo.parentId ?? replyTo.id]: true }))
      reset()
      refresh()
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const del = useMutation({
    mutationFn: (c: Comment) => feedApi.deleteComment(postId, c.id),
    onSuccess: () => { toast.success('Đã xóa bình luận.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })

  const startReply = (c: Comment) => { setEditing(null); setReplyTo(c); setText(''); setTimeout(() => inputRef.current?.focus(), 50) }
  const canSend = !!text.trim() && !send.isPending
  const context = editing ? 'Đang sửa bình luận' : replyTo ? `Đang trả lời ${replyTo.author}` : null
  // Nếu cửa sổ tự co lại khi bật bàn phím (adjustResize) thì không cộng thêm chiều cao bàn phím lần nữa.
  const lift = kb > 0 && (rootH === 0 || rootH >= screenH - 60) ? kb : 0
  const height = lift > 0 ? Math.min(sheetH, screenH - lift - insets.top - 8) : sheetH
  const bottomPad = kb > 0 ? 6 : insets.bottom

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }} onLayout={(e) => setRootH(e.nativeEvent.layout.height)}>
        <Animated.View style={{ ...(StyleSheet.absoluteFill as object), backgroundColor: t.overlay, opacity: slide.interpolate({ inputRange: [0, sheetH], outputRange: [1, 0], extrapolate: 'clamp' }) }}>
          <Pressable style={{ flex: 1 }} onPress={close} accessibilityRole="button" accessibilityLabel="Đóng bình luận" />
        </Animated.View>

        <Animated.View style={{ height, backgroundColor: t.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, transform: [{ translateY: slide }], marginBottom: lift }}>
          <View {...pan.panHandlers} style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.controlBorder, marginBottom: 12 }} />
            <Txt weight="700" size={15} heading>Bình luận</Txt>
          </View>

          <FlatList
            data={groups}
            keyExtractor={(g) => g.root.id}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 8, flexGrow: 1 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              q.isLoading ? (
                <View style={{ paddingTop: 48 }}><ActivityIndicator color={t.primary} /></View>
              ) : (
                <View style={{ alignItems: 'center', paddingTop: 48, gap: 6 }}>
                  <BrandIcon name="chat" size={56} />
                  <Txt weight="700" size={18}>Chưa có bình luận</Txt>
                  <Txt muted size={14}>Bắt đầu cuộc trò chuyện.</Txt>
                </View>
              )
            }
            ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator style={{ padding: 12 }} color={t.primary} /> : undefined}
            renderItem={({ item: g }) => {
              const expanded = !!open[g.root.id]
              return (
                <View>
                  <Row c={g.root} mine={g.root.authorId === me?.id} onReply={() => startReply(g.root)} onMore={() => setSelected(g.root)} />
                  {g.replies.length ? (
                    <Pressable onPress={() => setOpen((o) => ({ ...o, [g.root.id]: !expanded }))} hitSlop={6} style={{ paddingLeft: 64, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 24, height: StyleSheet.hairlineWidth, backgroundColor: t.controlBorder }} />
                      <Txt size={12} weight="600" color={t.textSubtle}>{expanded ? 'Ẩn câu trả lời' : `Xem ${g.replies.length} câu trả lời`}</Txt>
                    </Pressable>
                  ) : null}
                  {expanded ? g.replies.map((r) => (
                    <Row key={r.id} c={r} reply mine={r.authorId === me?.id} onReply={() => startReply(r)} onMore={() => setSelected(r)} />
                  )) : null}
                </View>
              )
            }}
          />

          <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, backgroundColor: t.card, paddingBottom: bottomPad }}>
            {context ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 8 }}>
                <CornerDownRight size={14} color={t.primary} />
                <Txt size={12} weight="600" color={t.primary} style={{ flex: 1 }} numberOfLines={1}>{context}</Txt>
                <Pressable onPress={reset} hitSlop={8} accessibilityRole="button" accessibilityLabel="Huỷ"><X size={16} color={t.textMuted} /></Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8 }}>
                {EMOJIS.map((e) => (
                  <Pressable key={e} onPress={() => setText((v) => v + e)} hitSlop={4} accessibilityRole="button" accessibilityLabel={`Thêm ${e}`}>
                    <Txt size={26}>{e}</Txt>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 }}>
              <Avatar uri={me?.avatarUrl} name={me?.name} size={36} />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44, borderRadius: 22, borderWidth: 1, borderColor: t.controlBorder, paddingLeft: 14, paddingRight: 6 }}>
                <TextInput
                  ref={inputRef}
                  value={text}
                  onChangeText={setText}
                  placeholder={replyTo ? `Trả lời ${replyTo.author}...` : 'Thêm bình luận...'}
                  placeholderTextColor={t.textSubtle}
                  multiline
                  accessibilityLabel="Thêm bình luận"
                  style={{ flex: 1, maxHeight: 96, color: t.text, fontSize: 14, paddingVertical: 10 }}
                />
                <Pressable onPress={() => canSend && send.mutate()} disabled={!canSend} accessibilityRole="button" accessibilityLabel="Đăng bình luận" style={{ paddingHorizontal: 10, height: 36, justifyContent: 'center' }}>
                  {send.isPending ? <ActivityIndicator size="small" color={t.primary} /> : <Txt size={14} weight="700" color={canSend ? t.primary : t.textSubtle}>{editing ? 'Lưu' : 'Đăng'}</Txt>}
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <ActionSheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        actions={
          selected
            ? [
                { label: 'Sửa bình luận', onPress: () => { setReplyTo(null); setEditing(selected); setText(selected.text); setTimeout(() => inputRef.current?.focus(), 50) } },
                { label: 'Xóa bình luận', danger: true, onPress: () => del.mutate(selected) },
              ]
            : []
        }
      />
    </Modal>
  )
}
