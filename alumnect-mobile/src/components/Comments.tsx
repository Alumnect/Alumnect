import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { TextInput } from '@/components/AppText'
import { useRouter } from 'expo-router'
import { CornerDownRight, Send, X } from '@/components/icons'
import { Avatar, Txt } from './ui'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'

/** Một bình luận kiểu bong bóng (Facebook): tên + nội dung, bên dưới là thời gian và nút Phản hồi. */
export const CommentBubble = React.memo(function CommentBubble({
  author,
  authorId,
  avatar,
  text,
  time,
  reply,
  mine,
  edited,
  onReply,
  onMore,
}: {
  author: string
  authorId?: string | number | null
  avatar?: string | null
  text: string
  time?: string
  reply?: boolean
  mine?: boolean
  edited?: boolean
  onReply?: () => void
  onMore?: () => void
}) {
  const t = useTheme()
  const router = useRouter()
  const openAuthor = () => authorId && router.push({ pathname: '/profile/[id]', params: { id: String(authorId) } })
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 6, paddingLeft: reply ? 56 : 12 }}>
      <Pressable onPress={openAuthor} accessibilityRole="button" accessibilityLabel={`Trang cá nhân ${author}`}>
        <Avatar uri={avatar} name={author} size={reply ? 28 : 36} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        <Pressable onLongPress={onMore} delayLongPress={300} style={{ backgroundColor: t.inputBg, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8, maxWidth: '100%' }}>
          <Txt weight="700" size={13} onPress={openAuthor}>{author}</Txt>
          <Txt size={14} style={{ lineHeight: 20 }}>{text}</Txt>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, marginTop: 3 }}>
          {time ? <Txt muted size={12}>{time}</Txt> : null}
          {edited ? <Txt muted size={12}>Đã chỉnh sửa</Txt> : null}
          {onReply ? <Txt muted size={12} weight="700" onPress={onReply}>Phản hồi</Txt> : null}
          {mine && onMore ? <Txt muted size={12} weight="700" onPress={onMore}>Tuỳ chọn</Txt> : null}
        </View>
      </View>
    </View>
  )
})

/** Thanh soạn bình luận cố định ở đáy màn hình, có dải "Đang trả lời / Đang sửa". */
export function CommentComposer({
  value,
  onChangeText,
  onSend,
  sending,
  placeholder = 'Viết bình luận...',
  context,
  onCancelContext,
  autoFocusKey,
}: {
  value: string
  onChangeText: (v: string) => void
  onSend: () => void
  sending?: boolean
  placeholder?: string
  context?: string | null
  onCancelContext?: () => void
  autoFocusKey?: string | number | null
}) {
  const t = useTheme()
  const user = useAuthStore((s) => s.user)
  const [focus, setFocus] = useState(false)
  const canSend = !!value.trim() && !sending
  return (
    <View style={{ backgroundColor: t.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, paddingBottom: 12 }}>
      {context ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 8 }}>
          <CornerDownRight size={14} color={t.primary} />
          <Txt size={12} color={t.primary} weight="600" style={{ flex: 1 }} numberOfLines={1}>{context}</Txt>
          <Pressable onPress={onCancelContext} hitSlop={8} accessibilityRole="button" accessibilityLabel="Huỷ">
            <X size={16} color={t.textMuted} />
          </Pressable>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingTop: 8 }}>
        <Avatar uri={user?.avatarUrl} name={user?.name} size={34} />
        <TextInput
          key={autoFocusKey ?? 'composer'}
          autoFocus={!!autoFocusKey}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.textSubtle}
          multiline
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          accessibilityLabel={placeholder}
          style={{ flex: 1, maxHeight: 130, minHeight: 44, backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 15, borderWidth: 1, borderColor: focus ? t.primary : 'transparent' }}
        />
        <Pressable
          onPress={() => canSend && onSend()}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Gửi"
          style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: canSend ? t.action : t.inputBg }}
        >
          <Send size={18} color={canSend ? t.onAction : t.textSubtle} />
        </Pressable>
      </View>
    </View>
  )
}
