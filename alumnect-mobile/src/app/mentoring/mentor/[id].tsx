import React from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, Briefcase, Laptop, MapPin, MessageCircle, Send, Sparkles, Star, Target, UserRound } from '@/components/icons'
import { Avatar, Button, Empty, Loading, Screen, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { BottomBar, BrandCover, InfoRow, SectionCard, StatBox, StatRow } from '@/components/DetailBits'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import { useAuthStore } from '@/store/authStore'
import { useTheme, palette } from '@/theme'

/** UC86, 89: hồ sơ mentor. Sinh viên gửi yêu cầu trực tiếp từ thanh dưới cùng. */
export default function MentorDetailScreen() {
  const t = useTheme()
  const router = useRouter()
  const role = useAuthStore((s) => s.user?.role)
  const { id } = useLocalSearchParams<{ id: string }>()
  const q = useQuery({ queryKey: ['mentor', id], queryFn: () => mentoringApi.mentor(id!) })
  const m = q.data
  if (q.isLoading) return <Screen><Header title="Mentor" /><Loading /></Screen>
  if (!m) return <Screen><Header title="Mentor" /><Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không tìm thấy mentor." /></Screen>
  const job = [m.currentPosition, m.currentCompany].filter(Boolean).join(' tại ')

  return (
    <Screen bg={t.card}>
      <Header title="Hồ sơ mentor" />
      <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ backgroundColor: t.card, marginBottom: 16, paddingBottom: 16 }}>
          <BrandCover height={110} />
          <View style={{ alignItems: 'flex-start', marginTop: -24, paddingHorizontal: 16 }}>
            <View style={{ borderWidth: 4, borderColor: t.card, borderRadius: 60 }}>
              <Avatar uri={m.avatarUrl} name={m.fullName} size={80} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Txt size={22} weight="600" style={{ flexShrink: 1 }}>{m.fullName}</Txt>
              {m.isVerifiedAlumni !== false ? <BadgeCheck size={20} color={t.info} /> : null}
            </View>
            {job || m.headline ? <Txt muted style={{ marginTop: 4 }}>{job || m.headline}</Txt> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              <Tag label={m.canReceiveRequest ? 'Đang nhận yêu cầu' : 'Tạm ngưng nhận'} tone={m.canReceiveRequest ? 'success' : 'neutral'} />
              {m.city ? <Tag label={m.city} tone="neutral" icon={<MapPin size={11} color={t.textMuted} />} /> : null}
            </View>
          </View>
          <StatRow style={{ marginHorizontal: 16, marginTop: 16 }}>
            <StatBox value={m.rating?.toFixed?.(1) ?? '—'} label={`${m.reviewCount} đánh giá`} color={palette.warning} />
            <StatBox value={m.completedTasks} label="Task hoàn thành" />
            <StatBox value={Math.round(m.reputationScore ?? 0)} label="Điểm uy tín" color={t.primary} />
          </StatRow>
          {!m.canReceiveRequest && m.availabilityReason ? <Txt muted size={12} style={{ marginTop: 10, textAlign: 'center', paddingHorizontal: 16 }}>{m.availabilityReason}</Txt> : null}
        </View>

        <SectionCard title="Giới thiệu" icon={<UserRound size={18} color={t.primary} />}>
          <Txt style={{ lineHeight: 22 }}>{m.bio || m.biography || 'Chưa có giới thiệu.'}</Txt>
        </SectionCard>

        <SectionCard title="Cách làm việc" icon={<Laptop size={18} color={t.primary} />}>
          {m.workingMode ? <InfoRow icon={<Laptop size={16} color={t.primary} />} label="Hình thức" value={WORKING_MODE_LABEL[m.workingMode] ?? m.workingMode} /> : null}
          {m.mentoringType ? <InfoRow icon={<Target size={16} color={t.primary} />} label="Loại hình hướng dẫn" value={MENTORING_TYPE_LABEL[m.mentoringType] ?? m.mentoringType} last /> : null}
        </SectionCard>

        {m.supportedFields.length || m.topics.length ? (
          <SectionCard title="Lĩnh vực hỗ trợ" icon={<Star size={18} color={t.primary} />}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {m.supportedFields.map((f) => <Tag key={f.id} label={f.name} />)}
            </View>
            {m.topics.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {m.topics.map((tp) => <Tag key={tp} label={tp} tone="info" />)}
              </View>
            ) : null}
          </SectionCard>
        ) : null}

        {m.skills.length ? (
          <SectionCard title="Kỹ năng" icon={<Sparkles size={18} color={t.primary} />}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {m.skills.map((s) => <Tag key={s.id} label={s.skillName} tone="neutral" />)}
            </View>
          </SectionCard>
        ) : null}

        {m.experiences.length ? (
          <SectionCard title="Kinh nghiệm" icon={<Briefcase size={18} color={t.primary} />}>
            {m.experiences.map((e, i) => (
              <View key={e.id} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: e.isCurrent ? t.primary : t.border }} />
                  {i < m.experiences.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: t.divider, marginVertical: 2 }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: i < m.experiences.length - 1 ? 14 : 0 }}>
                  <Txt weight="700">{e.title}</Txt>
                  <Txt size={13}>{e.company}</Txt>
                  <Txt muted size={12}>{`${e.startDate ?? ''} — ${e.isCurrent ? 'Hiện tại' : e.endDate ?? ''}`}</Txt>
                </View>
              </View>
            ))}
          </SectionCard>
        ) : null}
      </ScrollView>
      <BottomBar>
        <Button
          title="Nhắn tin"
          variant="secondary"
          icon={<MessageCircle size={17} color={t.primary} />}
          onPress={() => router.push({ pathname: '/chat/direct/[userId]', params: { userId: String(m.userId) } })}
          style={{ flex: 1 }}
        />
        {role === 'STUDENT' ? (
          <Button
            title="Gửi yêu cầu"
            icon={<Send size={16} color="#fff" />}
            disabled={!m.canReceiveRequest}
            onPress={() => router.push({ pathname: '/mentoring/mentor/request', params: { id: String(m.mentorId), name: m.fullName } })}
            style={{ flex: 1.4 }}
          />
        ) : null}
      </BottomBar>
    </Screen>
  )
}
