import React from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Star } from 'lucide-react-native'
import { Avatar, Card, Txt } from './ui'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import type { MentorCard } from '@/api/mentoring'
import { useTheme } from '@/theme'

export function MentorCardView({ m }: { m: MentorCard }) {
  const t = useTheme()
  const router = useRouter()
  const fields = m.supportedFields.map((f) => (typeof f === 'string' ? f : f.name)).slice(0, 3)
  return (
    <Card style={{ marginBottom: 12 }} onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(m.mentorId) } })}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Avatar uri={m.avatarUrl} name={m.fullName} size={56} />
        <View style={{ flex: 1 }}>
          <Txt weight="700" size={16} numberOfLines={1}>{m.fullName}</Txt>
          <Txt muted size={13} numberOfLines={1}>{[m.currentPosition, m.currentCompany].filter(Boolean).join(' · ') || m.headline || ''}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Txt size={13} weight="600">{m.rating?.toFixed?.(1) ?? m.rating}</Txt>
            <Txt muted size={12}>({m.reviewCount})</Txt>
          </View>
        </View>
      </View>
      {fields.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {fields.map((f) => (
            <View key={f} style={{ backgroundColor: t.primaryTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Txt size={12} color={t.primary} weight="600">{f}</Txt>
            </View>
          ))}
        </View>
      ) : null}
      <Txt muted size={12} style={{ marginTop: 8 }}>
        {WORKING_MODE_LABEL[m.workingMode] ?? ''} · {MENTORING_TYPE_LABEL[m.mentoringType] ?? ''}
        {m.minHourlyRate ? ` · từ ${formatVnd(m.minHourlyRate)}/giờ` : ''}
      </Txt>
    </Card>
  )
}
