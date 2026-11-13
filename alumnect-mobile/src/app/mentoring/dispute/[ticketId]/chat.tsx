import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { TextInput } from '@/components/AppText'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Paperclip, Send, ShieldAlert } from '@/components/icons'
import { Avatar, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { formatVnd } from '@/api/mentoring'
import { taskApi } from '@/api/mentoringTask'
import type { TicketMessage } from '@/api/mentoringTask'
import { subscribeTopic } from '@/lib/socket'
import { pickImage, uploadImage } from '@/lib/upload'
import { useAuthStore } from '@/store/authStore'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { toast, errMsg } from '@/lib/toast'

/** UC103, UC109: thảo luận ticket tranh chấp theo thời gian thực + nộp minh chứng (KakaoTalk Dispute Room 2026). */
export default function TicketChatScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const { ticketId, taskId } = useLocalSearchParams<{ ticketId: string; taskId?: string }>()
  const tid = Number(ticketId)
  const [text, setText] = useState('')

  const msgs = useQuery({ queryKey: ['ticket-messages', tid], queryFn: () => taskApi.ticketMessages(tid) })
  const evidences = useQuery({ queryKey: ['ticket-evidences', tid], queryFn: () => taskApi.evidences(tid) })

  useEffect(
    () =>
      subscribeTopic(`/topic/mentoring/tickets/${tid}/messages`, () =>
        qc.invalidateQueries({ queryKey: ['ticket-messages', tid] }),
      ),
    [tid, qc],
  )

  const send = useMutation({
    mutationFn: () => taskApi.sendTicketMessage(tid, { content: text.trim(), messageType: 'TEXT' }),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['ticket-messages', tid] })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const addEvidence = async () => {
    const [img] = await pickImage()
    if (!img) return
    try {
      const url = await uploadImage(img, 'evidence')
      await taskApi.addEvidence(tid, { title: img.name, fileUrl: url, fileName: img.name, fileType: 'image/jpeg' })
      toast.success('Đã nộp minh chứng thành công.')
      qc.invalidateQueries({ queryKey: ['ticket-evidences', tid] })
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  const list: TicketMessage[] = [...(msgs.data ?? [])].reverse()
  void taskId

  return (
    <Screen edges={['top', 'bottom']} bg={colors.bg}>
      <Header title="Phòng Phân xử & Khiếu nại" subtitle={`Phiếu #${tid} · Ban Quản Trị & các bên`} />

      {/* Evidence Strip (Instagram / Kakao Media Rail) */}
      <View style={[styles.evidenceBar, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.evidenceTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={15} color={viridian} weight="fill" />
            <Txt weight="800" size={12} style={{ color: colors.text }}>
              Hồ sơ Minh chứng ({evidences.data?.length ?? 0})
            </Txt>
          </View>
          <Pressable
            onPress={() => void addEvidence()}
            style={[styles.addEvidenceBtn, { backgroundColor: viridianSoft }]}
          >
            <ImagePlus size={13} color={viridian} weight="bold" />
            <Txt size={11} weight="800" style={{ color: viridian }}>
              + Nộp minh chứng
            </Txt>
          </Pressable>
        </View>

        {(evidences.data?.length ?? 0) > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
            {evidences.data!.map((e) => (
              <Image
                key={e.id}
                source={{ uri: e.fileUrl }}
                style={[styles.evidenceThumb, { borderColor: colors.border }]}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <Txt size={11} style={{ color: colors.textTertiary, marginTop: 4 }}>
            Đính kèm ảnh chụp màn hình hoặc tài liệu để Ban Quản Trị đối chiếu minh bạch.
          </Txt>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlashList
          data={list}
          inverted
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 14 }}
          renderItem={({ item }) => {
            const mine = String(item.senderId) === me?.id
            const isAdmin = item.senderRole === 'ADMIN'
            const roleLabel = isAdmin ? 'Ban Quản Trị' : item.senderRole === 'MENTOR' ? 'Mentor' : 'Sinh viên'

            return (
              <View style={{ flexDirection: mine ? 'row-reverse' : 'row', gap: 8, marginVertical: 5 }}>
                <Avatar uri={item.senderAvatar} name={item.senderName} size={32} ring={isAdmin} />
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: viridian, borderBottomRightRadius: 4 }
                      : isAdmin
                        ? {
                            backgroundColor: isDark ? '#24180E' : viridianSoft,
                            borderColor: viridian,
                            borderWidth: 1,
                            borderBottomLeftRadius: 4,
                          }
                        : {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderWidth: 1,
                            borderBottomLeftRadius: 4,
                          },
                  ]}
                >
                  <Txt
                    size={11}
                    weight="800"
                    style={{
                      color: mine ? 'rgba(255,255,255,0.9)' : viridian,
                      marginBottom: 2,
                    }}
                  >
                    {`${item.senderName} · ${roleLabel}`}
                  </Txt>
                  <Txt size={14} style={{ color: mine ? '#FFFFFF' : colors.text, lineHeight: 20 }}>
                    {item.content}
                  </Txt>
                  {item.proposedMentorAmount != null || item.proposedStudentRefund != null ? (
                    <View
                      style={[
                        styles.proposalPill,
                        { backgroundColor: mine ? 'rgba(0,0,0,0.18)' : colors.surface },
                      ]}
                    >
                      <Txt size={12} weight="700" style={{ color: mine ? '#FFFFFF' : viridian }}>
                        Đề xuất: Mentor {formatVnd(item.proposedMentorAmount)} · Hoàn SV {formatVnd(item.proposedStudentRefund)}
                      </Txt>
                    </View>
                  ) : null}
                  <Txt
                    size={10}
                    style={{
                      color: mine ? 'rgba(255,255,255,0.75)' : colors.textTertiary,
                      alignSelf: 'flex-end',
                      marginTop: 4,
                    }}
                  >
                    {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Txt>
                </View>
              </View>
            )
          }}
        />

        {/* Composer Bar */}
        <View style={[styles.composerBar, { backgroundColor: colors.card, borderTopColor: colors.borderSubtle }]}>
          <Pressable
            onPress={() => void addEvidence()}
            accessibilityRole="button"
            accessibilityLabel="Đính kèm minh chứng"
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          >
            <Paperclip size={20} color={colors.textSecondary} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nhập nội dung phản hồi hoặc giải trình..."
            accessibilityLabel="Nội dung trao đổi"
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[
              styles.composerInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable
            onPress={() => text.trim() && send.mutate()}
            disabled={send.isPending || !text.trim()}
            accessibilityRole="button"
            accessibilityLabel="Gửi nội dung trao đổi"
            style={[
              styles.sendBtn,
              {
                backgroundColor: text.trim() ? viridian : colors.surface,
              },
            ]}
          >
            <Send size={18} color={text.trim() ? '#FFFFFF' : colors.textTertiary} weight="fill" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  evidenceBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  evidenceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addEvidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  evidenceThumb: {
    width: 58,
    height: 58,
    borderRadius: 10,
    borderWidth: 1,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  proposalPill: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
