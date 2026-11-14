import React from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Building2, CheckCircle2, Sparkles, Target, Zap } from '@/components/icons'
import { Avatar, Card, Empty, Screen, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ListSkeleton } from '@/components/Skeleton'
import { exploreApi } from '@/api/explore'
import type { LadderStep, PersonCard } from '@/api/explore'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { errMsg } from '@/lib/toast'

function PersonHeader({ person, isViewer }: { person: PersonCard; isViewer: boolean }) {
  const meta = [
    person.cohort != null ? `Khóa K${person.cohort}` : null,
    person.yearsSinceFirstJob != null ? `${person.yearsSinceFirstJob} năm kinh nghiệm` : null,
    person.companyCount > 0 ? `${person.companyCount} công ty` : null,
  ].filter(Boolean).join(' · ')
  return (
    <Card style={{ flex: 1, padding: 12, borderRadius: 18 }}>
      <Avatar uri={person.avatarUrl} name={person.name} size={44} />
      <Txt weight="700" size={14} style={{ marginTop: 8 }} numberOfLines={1}>{isViewer ? 'Bạn' : person.name}</Txt>
      <Txt muted size={12} numberOfLines={2}>
        {person.currentRole ? `${person.currentRole}${person.company ? ` · ${person.company}` : ''}` : person.majorName || 'Sinh viên'}
      </Txt>
      {meta ? <Txt muted size={11} style={{ marginTop: 4 }} numberOfLines={2}>{meta}</Txt> : null}
    </Card>
  )
}

function Ladder({ steps, accent }: { steps: LadderStep[]; accent: string }) {
  const t = useTheme()
  return (
    <View style={{ borderLeftWidth: 2, borderLeftColor: t.divider, marginLeft: 6, paddingLeft: 16, gap: 14 }}>
      {steps.map((s, i) => (
        <View key={`${s.period}-${s.company}-${i}`}>
          <View style={{ position: 'absolute', left: -23, top: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: accent, borderWidth: 2, borderColor: t.card }} />
          <Txt size={11} weight="700" muted style={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.period}</Txt>
          <Txt weight="700" size={14}>{s.title}</Txt>
          {s.company ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Building2 size={11} color={t.textMuted} />
              <Txt muted size={12}>{s.company}</Txt>
            </View>
          ) : null}
          {s.takeawayVi ? <Txt size={12} style={{ marginTop: 4, padding: 8, borderRadius: 10, backgroundColor: t.surface, lineHeight: 18 }}>{s.takeawayVi}</Txt> : null}
        </View>
      ))}
    </View>
  )
}

function ListCard({ title, items, icon, color }: { title: string; items: string[]; icon: React.ReactNode; color: string }) {
  if (!items.length) return null
  return (
    <Card style={{ padding: 14, borderRadius: 18, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {icon}
        <Txt weight="700" size={13} color={color}>{title}</Txt>
      </View>
      {items.map((it) => <Txt key={it} size={13} style={{ lineHeight: 20, marginBottom: 2 }}>{`• ${it}`}</Txt>)}
    </Card>
  )
}

/** [C2] So sánh lộ trình của tôi với một cựu sinh viên — đồng bộ CareerAiCompareModal của Web. */
export default function CareerCompareScreen() {
  const t = useTheme()
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  const viewerId = useAuthStore((s) => s.user?.id)
  const q = useQuery({
    queryKey: ['career-ai-compare', viewerId, id],
    queryFn: () => exploreApi.careerAiCompare(Number(id)),
    enabled: !!viewerId && !!id,
    staleTime: 2 * 60_000,
    retry: false,
  })
  const d = q.data
  return (
    <Screen>
      <Header title={`So sánh với ${name ?? d?.targetPerson.name ?? 'cựu sinh viên'}`} />
      {q.isLoading ? (
        <View style={{ paddingTop: 16 }}>
          <Txt muted style={{ textAlign: 'center', marginBottom: 8 }}>Đang đối chiếu lộ trình...</Txt>
          <ListSkeleton variant="post" />
        </View>
      ) : !d ? (
        <Empty
          title="Không thể so sánh lúc này"
          text={q.error ? errMsg(q.error) : 'Vui lòng thử lại.'}
          action="Thử lại"
          onAction={() => { void q.refetch() }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} style={{ backgroundColor: t.bg }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <PersonHeader person={d.viewerPerson} isViewer />
            <PersonHeader person={d.targetPerson} isViewer={false} />
          </View>

          {d.comparisonSummaryVi ? (
            <View style={{ padding: 14, borderRadius: 16, backgroundColor: t.primaryTint, marginBottom: 16 }}>
              <Txt size={13} style={{ lineHeight: 20 }}>{d.comparisonSummaryVi}</Txt>
            </View>
          ) : null}

          <Card style={{ padding: 16, borderRadius: 18, marginBottom: 12 }}>
            <Txt weight="700" style={{ marginBottom: 12 }}>Hành trình của bạn</Txt>
            {d.viewerLadder.length ? <Ladder steps={d.viewerLadder} accent="#FB923C" /> : (
              <View>
                <Txt muted size={13}>Bạn chưa có lịch sử công tác — AI dùng chuyên ngành và kỹ năng của bạn làm điểm tựa.</Txt>
                {d.viewerPerson.majorName || d.viewerPerson.skills.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {d.viewerPerson.majorName ? <Tag label={d.viewerPerson.majorName} tone="primary" /> : null}
                    {d.viewerPerson.skills.slice(0, 6).map((s) => <Tag key={s} label={s} />)}
                  </View>
                ) : null}
              </View>
            )}
          </Card>

          <Card style={{ padding: 16, borderRadius: 18, marginBottom: 12 }}>
            <Txt weight="700" style={{ marginBottom: 12 }}>{`Hành trình của ${d.targetPerson.name}`}</Txt>
            {d.historicalLadder.length ? <Ladder steps={d.historicalLadder} accent={t.primary} /> : <Txt muted size={13}>Người này chưa cập nhật lịch sử công tác chi tiết.</Txt>}
          </Card>

          <ListCard title="Điểm chung" items={d.sharedStrengths} icon={<CheckCircle2 size={14} color={t.success} />} color={t.success} />
          <ListCard title="Khoảng cách cần bù" items={d.keyGapsToBridge} icon={<Target size={14} color={t.warning} />} color={t.warning} />
          <ListCard title="Kỹ năng đòn bẩy của bạn" items={d.transferableSkills} icon={<Zap size={14} color={t.info} />} color={t.info} />

          {d.actionableAdviceVi ? (
            <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: t.warning, backgroundColor: t.warningTint }}>
              <Sparkles size={18} color={t.warning} />
              <View style={{ flex: 1 }}>
                <Txt size={11} weight="800" color={t.warning} style={{ textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Lời khuyên cho bạn</Txt>
                <Txt size={13} style={{ lineHeight: 20 }}>{d.actionableAdviceVi}</Txt>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  )
}
