import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { TextInput } from '@/components/AppText'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Paperclip, Send } from '@/components/icons'
import { Avatar, Card, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { formatVnd } from '@/api/mentoring'
import { taskApi } from '@/api/mentoringTask'
import type { TicketMessage } from '@/api/mentoringTask'
import { subscribeTopic } from '@/lib/socket'
import { pickImage, uploadImage } from '@/lib/upload'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC103, UC109: thảo luận ticket tranh chấp theo thời gian thực + nộp minh chứng. */
export default function TicketChatScreen() {
  const t = useTheme()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const { ticketId, taskId } = useLocalSearchParams<{ ticketId: string; taskId?: string }>()
  const tid = Number(ticketId)
  const [text, setText] = useState('')

  const msgs = useQuery({ queryKey: ['ticket-messages', tid], queryFn: () => taskApi.ticketMessages(tid) })
  const evidences = useQuery({ queryKey: ['ticket-evidences', tid], queryFn: () => taskApi.evidences(tid) })

  useEffect(() => subscribeTopic(`/topic/mentoring/tickets/${tid}/messages`, () => qc.invalidateQueries({ queryKey: ['ticket-messages', tid] })), [tid, qc])

  const send = useMutation({
    mutationFn: () => taskApi.sendTicketMessage(tid, { content: text.trim(), messageType: 'TEXT' }),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['ticket-messages', tid] }) },
    onError: (e) => toast.error(errMsg(e)),
  })
  const addEvidence = async () => {
    const [img] = await pickImage()
    if (!img) return
    try {
      const url = await uploadImage(img, 'evidence')
      await taskApi.addEvidence(tid, { title: img.name, fileUrl: url, fileName: img.name, fileType: 'image/jpeg' })
      toast.success('Đã nộp minh chứng.')
      qc.invalidateQueries({ queryKey: ['ticket-evidences', tid] })
    } catch (e) { toast.error(errMsg(e)) }
  }

  const list: TicketMessage[] = [...(msgs.data ?? [])].reverse()
  void taskId

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Thảo luận khiếu nại" />
      {(evidences.data?.length ?? 0) > 0 ? (
        <Card style={{ margin: 12, marginBottom: 0 }}>
          <Txt weight="700" size={13} style={{ marginBottom: 6 }}>Minh chứng ({evidences.data!.length})</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {evidences.data!.slice(0, 8).map((e) => <Image key={e.id} source={{ uri: e.fileUrl }} style={{ width: 56, height: 56, borderRadius: 8 }} contentFit="cover" />)}
          </View>
        </Card>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlashList
          data={list}
          inverted
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const mine = String(item.senderId) === me?.id
            return (
              <View style={{ flexDirection: mine ? 'row-reverse' : 'row', gap: 8, marginVertical: 4 }}>
                <Avatar uri={item.senderAvatar} name={item.senderName} size={30} />
                <View style={{ maxWidth: '78%', backgroundColor: mine ? t.primary : item.senderRole === 'ADMIN' ? t.primaryTint : t.inputBg, borderRadius: 14, padding: 10 }}>
                  <Txt size={11} weight="700" color={mine ? t.onPrimary : t.primary}>{item.senderName} · {item.senderRole === 'ADMIN' ? 'Quản trị viên' : item.senderRole === 'MENTOR' ? 'Mentor' : 'Sinh viên'}</Txt>
                  <Txt color={mine ? t.onPrimary : t.text}>{item.content}</Txt>
                  {item.proposedMentorAmount != null || item.proposedStudentRefund != null ? (
                    <Txt size={12} color={mine ? t.onPrimary : t.text}>Đề xuất: mentor {formatVnd(item.proposedMentorAmount)} · hoàn {formatVnd(item.proposedStudentRefund)}</Txt>
                  ) : null}
                  <Txt size={10} color={mine ? 'rgba(255,255,255,0.8)' : t.textMuted} style={{ alignSelf: 'flex-end' }}>{new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Txt>
                </View>
              </View>
            )
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg }}>
          <Pressable onPress={addEvidence} accessibilityRole="button" accessibilityLabel="Đính kèm minh chứng" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Paperclip size={22} color={t.textMuted} /></Pressable>
          <TextInput value={text} onChangeText={setText} placeholder="Nhập nội dung trao đổi..." accessibilityLabel="Nội dung trao đổi" placeholderTextColor={t.textMuted} multiline style={{ flex: 1, minHeight: 44, maxHeight: 130, backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }} />
          <Pressable onPress={() => text.trim() && send.mutate()} disabled={send.isPending || !text.trim()} accessibilityRole="button" accessibilityLabel="Gửi nội dung trao đổi" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Send size={22} color={text.trim() ? t.primary : t.textMuted} /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
