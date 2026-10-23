import React from 'react'
import { Linking, Pressable, ScrollView, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { BadgeCheck, Briefcase, GraduationCap, MapPin, MessageCircle, Link2, Sparkles, UserRound } from '@/components/icons'
import { Avatar, Button, Card, Tag, Txt } from './ui'
import { FollowButton } from './UserRow'
import type { UserProfile } from '@/api/users'
import { useTheme, palette } from '@/theme'

function Stat({ value, label, onPress }: { value: number | string; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
      <Txt size={18} weight="800">{value}</Txt>
      <Txt muted size={12}>{label}</Txt>
    </Pressable>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon}
        <Txt weight="800" size={16}>{title}</Txt>
      </View>
      {children}
    </Card>
  )
}

export function ProfileView({ profile, isMe, children }: { profile: UserProfile; isMe?: boolean; children?: React.ReactNode }) {
  const t = useTheme()
  const router = useRouter()
  const exps = profile.experiences ?? []
  const skills = profile.skills ?? []
  const net = (tab: string) => router.push({ pathname: '/profile/network', params: { id: String(profile.userId), tab } })
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} style={{ backgroundColor: t.bg }}>
      <View style={{ backgroundColor: t.card, paddingBottom: 16, marginBottom: 10 }}>
        <View style={{ height: 150 }}>
          {profile.coverUrl ? (
            <Image source={{ uri: profile.coverUrl }} style={{ flex: 1 }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: palette.primary, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: palette.primarySoft, opacity: 0.6, top: -90, right: -40 }} />
              <View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: palette.primaryDark, opacity: 0.5, bottom: -80, left: 30 }} />
            </View>
          )}
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: -48 }}>
          <View style={{ borderWidth: 4, borderColor: t.card, borderRadius: 60, alignSelf: 'flex-start' }}>
            <Avatar uri={profile.avatarUrl} name={profile.fullName} size={96} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Txt size={24} weight="800" style={{ flexShrink: 1 }}>{profile.fullName}</Txt>
            {profile.isAccountVerified ? <BadgeCheck size={20} color={t.info} /> : null}
          </View>
          {profile.headline ? <Txt style={{ marginTop: 2 }}>{profile.headline}</Txt> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            <Tag label={profile.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'} tone={profile.role === 'ALUMNI' ? 'primary' : 'info'} />
            {profile.cohort ? <Tag label={`K${profile.cohort}`} tone="neutral" /> : null}
          </View>
          <View style={{ gap: 6, marginTop: 10 }}>
            {profile.major?.name || profile.campus ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={15} color={t.textMuted} />
                <Txt muted size={13} style={{ flex: 1 }}>{[profile.major?.name, profile.campus, profile.graduationYear ? `Tốt nghiệp ${profile.graduationYear}` : null].filter(Boolean).join(' · ')}</Txt>
              </View>
            ) : null}
            {profile.primaryExperience ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Briefcase size={15} color={t.textMuted} /><Txt muted size={13}>{`${profile.primaryExperience.title} tại ${profile.primaryExperience.company}`}</Txt></View>
            ) : null}
            {profile.city ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MapPin size={15} color={t.textMuted} /><Txt muted size={13}>{profile.city}</Txt></View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', marginTop: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: t.surface }}>
            <Stat value={profile.followersCount ?? 0} label="Người theo dõi" onPress={() => net('followers')} />
            <View style={{ width: 1, backgroundColor: t.border, marginVertical: 6 }} />
            <Stat value={profile.followingCount ?? 0} label="Đang theo dõi" onPress={() => net('following')} />
            <View style={{ width: 1, backgroundColor: t.border, marginVertical: 6 }} />
            <Stat value={exps.length} label="Kinh nghiệm" />
          </View>

          {!isMe ? (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <FollowButton userId={profile.userId} initial={!!profile.isFollowing} block />
              </View>
              <Button
                title="Nhắn tin"
                variant="secondary"
                size="sm"
                icon={<MessageCircle size={16} color={t.primary} />}
                style={{ flex: 1, height: 38 }}
                onPress={() => router.push({ pathname: '/chat/direct/[userId]', params: { userId: String(profile.userId) } })}
              />
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 12 }}>
        {profile.biography ? (
          <Section title="Giới thiệu" icon={<UserRound size={18} color={t.primary} />}>
            <Txt style={{ lineHeight: 22 }}>{profile.biography}</Txt>
          </Section>
        ) : null}

        {exps.length > 0 ? (
          <Section title="Kinh nghiệm" icon={<Briefcase size={18} color={t.primary} />}>
            {exps.map((e, i) => (
              <View key={e.id} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: e.isCurrent ? t.primary : t.border }} />
                  {i < exps.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: t.divider, marginVertical: 2 }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: i < exps.length - 1 ? 14 : 0 }}>
                  <Txt weight="700">{e.title}</Txt>
                  <Txt size={13}>{e.company}{e.location ? ` · ${e.location}` : ''}</Txt>
                  <Txt muted size={12}>{`${e.startDate} — ${e.isCurrent ? 'Hiện tại' : e.endDate ?? ''}`}</Txt>
                </View>
              </View>
            ))}
          </Section>
        ) : null}

        {profile.socialLinks?.length ? (
          <Section title="Liên kết" icon={<Link2 size={18} color={t.primary} />}>
            {profile.socialLinks.map((l) => (
              <Pressable key={l} onPress={() => Linking.openURL(l).catch(() => {})} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }} accessibilityRole="link">
                <Link2 size={14} color={t.info} />
                <Txt size={13} color={t.info} numberOfLines={1} style={{ flex: 1 }}>{l.replace(/^https?:\/\//, '')}</Txt>
              </Pressable>
            ))}
          </Section>
        ) : null}

        {skills.length > 0 ? (
          <Section title="Kỹ năng" icon={<Sparkles size={18} color={t.primary} />}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {skills.map((s) => <Tag key={s.id} label={s.skillName} />)}
            </View>
          </Section>
        ) : null}
        {children}
      </View>
    </ScrollView>
  )
}
