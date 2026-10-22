import React from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Star } from 'lucide-react-native'
import { Avatar, Button, Card, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'

/** UC86, 89: chi tiết / hồ sơ mentor. */
export default function MentorDetailScreen() {
  const t = useTheme()
  const router = useRouter()
  const role = useAuthStore((s) => s.user?.role)
  const { id } = useLocalSearchParams<{ id: string }>()
  const q = useQuery({ queryKey: ['mentor', id], queryFn: () => mentoringApi.mentor(id!) })
  const m = q.data
  if (q.isLoading) return <Screen><Header title="Mentor" /><Loading /></Screen>
  if (!m) return <Screen><Header title="Mentor" /><Empty text="Không tìm thấy mentor." /></Screen>
  return (
    <Screen>
      <Header title="Hồ sơ mentor" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center' }}>
          <Avatar uri={m.avatarUrl} name={m.fullName} size={92} />
          <Txt size={22} weight="800" style={{ marginTop: 10 }}>{m.fullName}</Txt>
          <Txt muted style={{ textAlign: 'center' }}>{[m.currentPosition, m.currentCompany].filter(Boolean).join(' · ') || m.headline || ''}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Txt weight="700">{m.rating?.toFixed?.(1)}</Txt>
            <Txt muted>({m.reviewCount} đánh giá) · {m.completedTasks} task hoàn thành</Txt>
          </View>
        </View>

        {role === 'STUDENT' ? (
          <View style={{ marginTop: 16 }}>
            <Button title={m.canReceiveRequest ? 'Gửi yêu cầu trực tiếp' : 'Mentor tạm thời không nhận yêu cầu'} disabled={!m.canReceiveRequest} onPress={() => router.push({ pathname: '/mentoring/mentor/request', params: { id: String(m.mentorId), name: m.fullName } })} />
            {!m.canReceiveRequest && m.availabilityReason ? <Txt muted size={12} style={{ marginTop: 6, textAlign: 'center' }}>{m.availabilityReason}</Txt> : null}
          </View>
        ) : null}

        <Card style={{ marginTop: 16 }}>
          <Txt weight="700" style={{ marginBottom: 4 }}>Giới thiệu</Txt>
          <Txt>{m.bio || m.biography || 'Chưa có giới thiệu.'}</Txt>
          <Txt muted size={13} style={{ marginTop: 8 }}>{[m.workingMode && WORKING_MODE_LABEL[m.workingMode], m.mentoringType && `Hướng dẫn ${MENTORING_TYPE_LABEL[m.mentoringType]}`, m.city].filter(Boolean).join(' · ')}</Txt>
        </Card>

        {m.supportedFields.length ? (
          <Card style={{ marginTop: 12 }}>
            <Txt weight="700" style={{ marginBottom: 8 }}>Lĩnh vực hỗ trợ</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {m.supportedFields.map((f) => <View key={f.id} style={{ backgroundColor: t.primaryTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}><Txt size={12} color={t.primary} weight="600">{f.name}</Txt></View>)}
            </View>
            {m.topics.length ? <Txt muted size={13} style={{ marginTop: 8 }}>Chủ đề: {m.topics.join(', ')}</Txt> : null}
          </Card>
        ) : null}

        {m.skills.length ? (
          <Card style={{ marginTop: 12 }}>
            <Txt weight="700" style={{ marginBottom: 8 }}>Kỹ năng</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {m.skills.map((s) => <View key={s.id} style={{ backgroundColor: t.inputBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}><Txt size={12}>{s.skillName}</Txt></View>)}
            </View>
          </Card>
        ) : null}

        {m.experiences.length ? (
          <Card style={{ marginTop: 12 }}>
            <Txt weight="700" style={{ marginBottom: 8 }}>Kinh nghiệm</Txt>
            {m.experiences.map((e) => (
              <View key={e.id} style={{ marginBottom: 8 }}>
                <Txt weight="600">{e.title}</Txt>
                <Txt muted size={13}>{e.company}</Txt>
                <Txt muted size={12}>{e.startDate} — {e.isCurrent ? 'Hiện tại' : e.endDate}</Txt>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
