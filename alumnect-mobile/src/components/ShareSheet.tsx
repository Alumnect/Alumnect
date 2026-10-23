import React, { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import { TextInput } from '@/components/AppText'
import { Image } from 'expo-image'
import * as Clipboard from 'expo-clipboard'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Link2, Send } from '@/components/icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Txt } from './ui'
import { chatApi, convAvatar, convName, isGroup } from '@/api/chat'
import { hasPublicUrl, toUrl } from '@/lib/share'
import { useDebounced } from '@/lib/hooks'
import { toast, errMsg } from '@/lib/toast'
import { useTheme, radius } from '@/theme'

export interface ShareItem {
  title: string
  subtitle?: string
  thumbnail?: string | null
  avatarUrl?: string | null
  /** Đường dẫn Web, vd /app/posts/12 */
  path: string
  typeLabel?: string
}

type Recipient = { key: string; name: string; avatar?: string | null; sub?: string | null; conversationId?: number; userId?: number }
type SendState = 'sending' | 'sent'

/** Hộp thoại Chia sẻ (đồng bộ ShareModal Web): Gửi qua tin nhắn / Sao chép liên kết / . */
function Row({ icon, title, sub, onPress, dim }: { icon: React.ReactNode; title: string; sub?: string; onPress: () => void; dim?: boolean }) {
  const t = useTheme()
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: t.inputBg, marginBottom: 10, opacity: dim ? 0.55 : 1 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Txt weight="700">{title}</Txt>
        {sub ? <Txt muted size={12}>{sub}</Txt> : null}
      </View>
    </Pressable>
  )
}

export function ShareSheet({ visible, onClose, item }: { visible: boolean; onClose: () => void; item: ShareItem }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const [view, setView] = useState<'options' | 'send'>('options')
  const [note, setNote] = useState('')
  const [kw, setKw] = useState('')
  const [state, setState] = useState<Record<string, SendState>>({})
  const [copied, setCopied] = useState(false)
  const keyword = useDebounced(kw, 300).trim()
  const label = item.typeLabel ?? 'bài viết'
  const url = toUrl(item.path)

  const convs = useQuery({ queryKey: ['conversations', 'primary'], queryFn: () => chatApi.conversations('primary'), enabled: visible && view === 'send' })
  const users = useQuery({ queryKey: ['share-user-search', keyword], queryFn: () => chatApi.searchUsers(keyword), enabled: visible && view === 'send' && keyword.length >= 2 })

  const recipients = useMemo<Recipient[]>(() => {
    const k = keyword.toLowerCase()
    const list: Recipient[] = []
    const seenUsers = new Set<number>()
    for (const c of convs.data?.data ?? []) {
      if (c.id == null) continue
      const name = convName(c)
      if (k && !name.toLowerCase().includes(k)) continue
      if (!isGroup(c) && c.recipientId) seenUsers.add(c.recipientId)
      list.push({ key: `c${c.id}`, name, avatar: convAvatar(c), sub: isGroup(c) ? `${c.memberCount ?? ''} thành viên` : null, conversationId: c.id })
    }
    for (const u of users.data?.data ?? []) {
      if (seenUsers.has(u.userId)) continue
      list.push({ key: `u${u.userId}`, name: u.fullName, avatar: u.avatarUrl, sub: u.headline, userId: u.userId })
    }
    return list
  }, [convs.data, users.data, keyword])

  const close = () => {
    setView('options')
    setNote('')
    setKw('')
    setState({})
    onClose()
  }

  const send = async (r: Recipient) => {
    setState((s) => ({ ...s, [r.key]: 'sending' }))
    try {
      const content = note.trim() ? `${note.trim().slice(0, 1000)}\n\n${url}` : url
      await chatApi.send(r.conversationId ? { conversationId: r.conversationId, content } : { recipientId: r.userId, content })
      setState((s) => ({ ...s, [r.key]: 'sent' }))
      qc.invalidateQueries({ queryKey: ['conversations'] })
      toast.success(`Đã gửi ${label} cho ${r.name}.`)
    } catch (e) {
      setState((s) => {
        const next = { ...s }
        delete next[r.key]
        return next
      })
      toast.error(errMsg(e, 'Không thể gửi tin nhắn'))
    }
  }

  const copy = async () => {
    if (!hasPublicUrl()) return toast.info('Chưa cấu hình địa chỉ web (EXPO_PUBLIC_WEB_URL) nên chưa thể tạo liên kết công khai.')
    await Clipboard.setStringAsync(url)
    setCopied(true)
    toast.success(`Đã sao chép liên kết ${label}!`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={close} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: t.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 16, paddingBottom: insets.bottom + 16, maxHeight: '88%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            {view === 'send' ? <Pressable onPress={() => setView('options')} hitSlop={10} style={{ marginRight: 6 }}><ChevronLeft size={24} color={t.text} /></Pressable> : null}
            <Txt size={17} weight="800" style={{ flex: 1 }}>{view === 'send' ? 'Gửi qua tin nhắn' : `Chia sẻ ${label}`}</Txt>
            <Txt color={t.primary} weight="700" onPress={close}>{view === 'send' ? 'Xong' : 'Đóng'}</Txt>
          </View>

          {/* Bản xem trước */}
          <View style={{ flexDirection: 'row', gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: t.border, marginBottom: 12 }}>
            {item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={{ width: 56, height: 56, borderRadius: 10 }} contentFit="cover" /> : <Avatar uri={item.avatarUrl} name={item.title} size={44} />}
            <View style={{ flex: 1 }}>
              <Txt weight="700" numberOfLines={1}>{item.title}</Txt>
              {item.subtitle ? <Txt muted size={13} numberOfLines={2}>{item.subtitle}</Txt> : null}
            </View>
          </View>

          {view === 'options' ? (
            <View>
              <Row icon={<Send size={20} color={t.primary} />} title="Gửi qua tin nhắn" sub="Gửi cho bạn bè hoặc nhóm chat trong Alumnect" onPress={() => setView('send')} />
              <Row icon={<Link2 size={20} color={t.primary} />} title={copied ? 'Đã sao chép liên kết!' : 'Sao chép liên kết'} sub={hasPublicUrl() ? url : 'Chưa có địa chỉ web công khai'} onPress={() => void copy()} dim={!hasPublicUrl()} />
            </View>
          ) : (
            <View style={{ flexShrink: 1 }}>
              <TextInput value={note} onChangeText={setNote} maxLength={1000} placeholder="Thêm lời nhắn (tùy chọn)..." placeholderTextColor={t.textMuted} style={{ backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 }} />
              <TextInput value={kw} onChangeText={setKw} placeholder="Tìm bạn bè hoặc nhóm chat..." placeholderTextColor={t.textMuted} style={{ backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 }} />
              <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
                {recipients.length === 0 ? <Txt muted style={{ textAlign: 'center', padding: 16 }}>{convs.isLoading ? 'Đang tải...' : 'Không tìm thấy người nhận.'}</Txt> : null}
                {recipients.map((r) => {
                  const s = state[r.key]
                  return (
                    <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                      <Avatar uri={r.avatar} name={r.name} size={40} />
                      <View style={{ flex: 1 }}>
                        <Txt weight="600" numberOfLines={1}>{r.name}</Txt>
                        {r.sub ? <Txt muted size={12} numberOfLines={1}>{r.sub}</Txt> : null}
                      </View>
                      <Pressable
                        disabled={!!s}
                        onPress={() => void send(r)}
                        style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: s === 'sent' ? t.inputBg : t.primary, opacity: s === 'sending' ? 0.6 : 1 }}
                      >
                        <Txt size={13} weight="700" color={s === 'sent' ? t.textMuted : t.onPrimary}>{s === 'sent' ? 'Đã gửi' : s === 'sending' ? 'Đang gửi' : 'Gửi'}</Txt>
                      </Pressable>
                    </View>
                  )
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
