import React, { useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Award, ClipboardList, FileText, ListChecks, Search, UserCheck } from 'lucide-react-native'
import { Chip, Empty, Loading, Screen, Txt } from '@/components/ui'
import { MentorCardView } from '@/components/MentorCardView'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import type { MentoringType, WorkingMode } from '@/api/mentoring'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

function Quick({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  const t = useTheme()
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', width: 76, gap: 6 }}>
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <Txt size={11} weight="600" style={{ textAlign: 'center' }}>{label}</Txt>
    </Pressable>
  )
}

/** UC87–89: khám phá mentor + lối tắt tới yêu cầu, task, BXH, đăng ký mentor. */
export default function MentoringTab() {
  const t = useTheme()
  const router = useRouter()
  const role = useAuthStore((s) => s.user?.role)
  const [kw, setKw] = useState('')
  const [fieldId, setFieldId] = useState<number | undefined>()
  const [mode, setMode] = useState<WorkingMode | undefined>()
  const [type, setType] = useState<MentoringType | undefined>()
  const keyword = useDebounced(kw, 400)

  const industries = useQuery({ queryKey: ['mentoring-industries'], queryFn: mentoringApi.industries })
  const q = useInfiniteQuery({
    queryKey: ['mentoring-search', keyword, fieldId, mode, type],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => mentoringApi.search({ keyword, fieldId, workingMode: mode, mentoringType: type, page: pageParam }),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []

  return (
    <Screen>
      <FlashList
        data={items}
        keyExtractor={(m) => String(m.mentorId)}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        onEndReached={() => q.hasNextPage && q.fetchNextPage()}
        refreshing={q.isRefetching}
        onRefresh={() => q.refetch()}
        ListHeaderComponent={
          <View>
            <Txt size={24} weight="800">Cố vấn</Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 14 }} contentContainerStyle={{ gap: 8 }}>
              <Quick icon={<Award size={22} color={t.primary} />} label="Xếp hạng" onPress={() => router.push('/mentoring/rankings')} />
              {role === 'STUDENT' ? <Quick icon={<FileText size={22} color={t.primary} />} label="Tạo yêu cầu" onPress={() => router.push('/mentoring/create-request')} /> : null}
              {role === 'STUDENT' ? <Quick icon={<ClipboardList size={22} color={t.primary} />} label="Yêu cầu của tôi" onPress={() => router.push('/mentoring/my-requests')} /> : null}
              {role === 'ALUMNI' ? <Quick icon={<ClipboardList size={22} color={t.primary} />} label="Yêu cầu đến" onPress={() => router.push('/mentoring/incoming-requests')} /> : null}
              <Quick icon={<ListChecks size={22} color={t.primary} />} label="Task" onPress={() => router.push('/mentoring/tasks')} />
              {role === 'ALUMNI' ? <Quick icon={<UserCheck size={22} color={t.primary} />} label="Làm mentor" onPress={() => router.push('/mentoring/status')} /> : null}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 }}>
              <Search size={18} color={t.textMuted} />
              <TextInput value={kw} onChangeText={setKw} placeholder="Tìm mentor, kỹ năng..." placeholderTextColor={t.textMuted} style={{ flex: 1, color: t.text, paddingVertical: 10, paddingHorizontal: 8 }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <Chip label="Mọi lĩnh vực" active={fieldId == null} onPress={() => setFieldId(undefined)} />
              {(industries.data ?? []).map((i) => <Chip key={i.id} label={i.name} active={fieldId === i.id} onPress={() => setFieldId(fieldId === i.id ? undefined : i.id)} />)}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {(Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((k) => <Chip key={k} label={WORKING_MODE_LABEL[k]} active={mode === k} onPress={() => setMode(mode === k ? undefined : k)} />)}
              {(Object.keys(MENTORING_TYPE_LABEL) as MentoringType[]).map((k) => <Chip key={k} label={MENTORING_TYPE_LABEL[k]} active={type === k} onPress={() => setType(type === k ? undefined : k)} />)}
            </ScrollView>
            {q.isLoading ? <Loading /> : null}
          </View>
        }
        ListEmptyComponent={q.isLoading ? null : <Empty text="Không tìm thấy mentor phù hợp." />}
        renderItem={({ item }) => <MentorCardView m={item} />}
      />
    </Screen>
  )
}
