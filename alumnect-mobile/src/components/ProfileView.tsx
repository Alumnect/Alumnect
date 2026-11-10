import React, { useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { BadgeCheck, GraduationCap, MapPin, MessageCircle, Link2 } from '@/components/icons'
import { Avatar, Button, Card, Tag, Txt } from './ui'
import { FollowButton } from './UserRow'
import type { UserProfile } from '@/api/users'
import { useTheme } from '@/theme'
import { BrandCover } from './DetailBits'
import { BrandIcon } from './BrandIcon'
import { MotionPressable } from './Motion'

function Stat({ value, label, onPress }: { value: number | string; label: string; onPress?: () => void }) {
  return (
    <MotionPressable onPress={onPress} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', minHeight: 48, justifyContent: 'center' }}>
      <Txt size={21} weight="700" style={{ fontVariant: ['tabular-nums'] }}>{value}</Txt>
      <Txt muted size={12} style={{ textAlign: 'center' }}>{label}</Txt>
    </MotionPressable>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card style={{ marginBottom: 14, borderRadius: 20, padding: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {icon}
        <Txt weight="600" size={16}>{title}</Txt>
      </View>
      {children}
    </Card>
  )
}

export function ProfileView({ profile, isMe, actions, children }: { profile: UserProfile; isMe?: boolean; actions?: React.ReactNode; children?: React.ReactNode }) {
  const t = useTheme()
  const router = useRouter()
  const exps = profile.experiences ?? []
  const skills = profile.skills ?? []
  const [expandedBio, setExpandedBio] = useState(false)
  const net = (tab: string) => router.push({ pathname: '/profile/network', params: { id: String(profile.userId), tab } })
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} style={{ backgroundColor: t.bg }}>
      <View style={{ backgroundColor: t.card, paddingBottom: 16, marginBottom: 16 }}>
        <View style={{ height: 156, marginHorizontal: 16, borderRadius: 24, overflow: 'hidden' }}>
          {profile.coverUrl ? (
            <Image source={{ uri: profile.coverUrl }} style={{ flex: 1 }} contentFit="cover" />
          ) : (
            <BrandCover height={156} />
          )}
        </View>
        <View style={{ paddingHorizontal: 24, marginTop: -30 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 18 }}>
            <View style={{ borderWidth: 4, borderColor: t.card, borderRadius: 60 }}>
              <Avatar uri={profile.avatarUrl} name={profile.fullName} size={88} />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', paddingBottom: 5 }}>
              <Stat value={profile.followersCount ?? 0} label="Người theo dõi" onPress={() => net('followers')} />
              <Stat value={profile.followingCount ?? 0} label="Đang theo dõi" onPress={() => net('following')} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Txt size={23} weight="700" style={{ flexShrink: 1 }}>{profile.fullName}</Txt>
            {profile.isAccountVerified ? <BadgeCheck size={20} color={t.info} /> : null}
          </View>
          {profile.headline ? <Txt size={14} style={{ marginTop: 4, lineHeight: 21 }}>{profile.headline}</Txt> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            <Tag label={profile.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'} tone={profile.role === 'ALUMNI' ? 'primary' : 'info'} />
            {profile.cohort ? <Tag label={`K${profile.cohort}`} tone="neutral" /> : null}
            {profile.city ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 2 }}><MapPin size={13} color={t.textMuted} /><Txt muted size={12}>{profile.city}</Txt></View> : null}
          </View>
          <View style={{ gap: 6, marginTop: 10 }}>
            {profile.major?.name || profile.campus ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={15} color={t.textMuted} />
                <Txt muted size={13} style={{ flex: 1 }}>{[profile.major?.name, profile.campus, profile.graduationYear ? `Tốt nghiệp ${profile.graduationYear}` : null].filter(Boolean).join(' · ')}</Txt>
              </View>
            ) : null}
          </View>

          {actions ? <View style={{ marginTop: 14 }}>{actions}</View> : null}
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
                style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/chat/direct/[userId]', params: { userId: String(profile.userId) } })}
              />
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {profile.biography ? (
          <Section title="Một chút về tôi" icon={<BrandIcon name="people2" size={30} />}>
            <Txt size={14} numberOfLines={expandedBio ? undefined : 3} style={{ lineHeight: 23 }}>{profile.biography}</Txt>
            {profile.biography.length > 120 ? <MotionPressable onPress={() => setExpandedBio(!expandedBio)} accessibilityRole="button" accessibilityState={{ expanded: expandedBio }} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}><Txt size={12} weight="600" color={t.primary}>{expandedBio ? 'Thu gọn' : 'Đọc thêm'}</Txt></MotionPressable> : null}
          </Section>
        ) : null}

        {exps.length > 0 ? (
          <Section title="Kinh nghiệm" icon={<BrandIcon name="suitcase" size={30} />}>
            {exps.map((e, i) => (
              <View key={e.id} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: e.isCurrent ? t.primaryTint : t.surface, alignItems: 'center', justifyContent: 'center' }}><Txt size={13} weight="700" color={e.isCurrent ? t.primary : t.textMuted}>{e.company?.charAt(0).toUpperCase() || 'A'}</Txt></View>
                  {i < exps.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: t.divider, marginVertical: 2 }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: i < exps.length - 1 ? 14 : 0 }}>
                  <Txt weight="600" size={14}>{e.title}</Txt>
                  <Txt size={13}>{e.company}{e.location ? ` · ${e.location}` : ''}</Txt>
                  <Txt size={12} color={e.isCurrent ? t.primary : t.textMuted} style={{ marginTop: 4 }}>{`${e.startDate.slice(0, 7).split('-').reverse().join('/')} — ${e.isCurrent ? 'Hiện tại' : e.endDate?.slice(0, 7).split('-').reverse().join('/') ?? ''}`}</Txt>
                </View>
              </View>
            ))}
          </Section>
        ) : null}

        {profile.socialLinks?.length ? (
          <Section title="Kết nối với tôi" icon={<BrandIcon name="world" size={30} />}>
            {profile.socialLinks.map((l) => (
              <Pressable key={l} onPress={() => Linking.openURL(l).catch(() => {})} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }} accessibilityRole="link">
                <Link2 size={14} color={t.info} />
                <Txt size={13} color={t.info} numberOfLines={1} style={{ flex: 1 }}>{l.replace(/^https?:\/\//, '')}</Txt>
              </Pressable>
            ))}
          </Section>
        ) : null}

        {skills.length > 0 ? (
          <Section title="Kỹ năng" icon={<BrandIcon name="task" size={30} />}>
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
