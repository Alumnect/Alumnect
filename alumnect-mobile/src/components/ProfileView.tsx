import React from 'react'
import { ScrollView, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { BadgeCheck } from 'lucide-react-native'
import { Avatar, Button, Card, Txt } from './ui'
import { FollowButton } from './UserRow'
import type { UserProfile } from '@/api/users'
import { useTheme } from '@/theme'

export function ProfileView({ profile, isMe, children }: { profile: UserProfile; isMe?: boolean; children?: React.ReactNode }) {
  const t = useTheme()
  const router = useRouter()
  const exps = profile.experiences ?? []
  const skills = profile.skills ?? []
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={{ height: 120, backgroundColor: t.primaryTint }}>
        {profile.coverUrl ? <Image source={{ uri: profile.coverUrl }} style={{ flex: 1 }} contentFit="cover" /> : null}
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: -40 }}>
        <View style={{ borderWidth: 3, borderColor: t.bg, borderRadius: 50, alignSelf: 'flex-start' }}>
          <Avatar uri={profile.avatarUrl} name={profile.fullName} size={84} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Txt size={22} weight="800">{profile.fullName}</Txt>
          {profile.isAccountVerified ? <BadgeCheck size={18} color={t.info} /> : null}
        </View>
        {profile.headline ? <Txt muted style={{ marginTop: 2 }}>{profile.headline}</Txt> : null}
        <Txt muted size={13} style={{ marginTop: 2 }}>
          {[profile.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên', profile.major?.name, profile.cohort ? `K${profile.cohort}` : null, profile.city].filter(Boolean).join(' · ')}
        </Txt>

        <View style={{ flexDirection: 'row', gap: 24, marginTop: 12, marginBottom: 12 }}>
          <Txt onPress={() => router.push({ pathname: '/profile/network', params: { id: String(profile.userId), tab: 'followers' } })}>
            <Txt weight="800">{profile.followersCount ?? 0}</Txt> <Txt muted>người theo dõi</Txt>
          </Txt>
          <Txt onPress={() => router.push({ pathname: '/profile/network', params: { id: String(profile.userId), tab: 'following' } })}>
            <Txt weight="800">{profile.followingCount ?? 0}</Txt> <Txt muted>đang theo dõi</Txt>
          </Txt>
        </View>

        {!isMe ? (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <FollowButton userId={profile.userId} initial={!!profile.isFollowing} />
            <Button title="Nhắn tin" variant="outline" style={{ height: 36, paddingHorizontal: 18 }} onPress={() => router.push({ pathname: '/chat/direct/[userId]', params: { userId: String(profile.userId) } })} />
          </View>
        ) : null}

        {profile.biography ? (
          <Card style={{ marginBottom: 12 }}>
            <Txt weight="700" style={{ marginBottom: 4 }}>Giới thiệu</Txt>
            <Txt>{profile.biography}</Txt>
          </Card>
        ) : null}

        {exps.length > 0 ? (
          <Card style={{ marginBottom: 12 }}>
            <Txt weight="700" style={{ marginBottom: 8 }}>Kinh nghiệm</Txt>
            {exps.map((e) => (
              <View key={e.id} style={{ marginBottom: 10 }}>
                <Txt weight="600">{e.title}</Txt>
                <Txt muted size={13}>{e.company}{e.location ? ` · ${e.location}` : ''}</Txt>
                <Txt muted size={12}>{e.startDate} — {e.isCurrent ? 'Hiện tại' : e.endDate}</Txt>
              </View>
            ))}
          </Card>
        ) : null}

        {skills.length > 0 ? (
          <Card style={{ marginBottom: 12 }}>
            <Txt weight="700" style={{ marginBottom: 8 }}>Kỹ năng</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {skills.map((s) => (
                <View key={s.id} style={{ backgroundColor: t.primaryTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Txt size={12} color={t.primary} weight="600">{s.skillName}</Txt>
                </View>
              ))}
            </View>
          </Card>
        ) : null}
        {children}
      </View>
    </ScrollView>
  )
}
