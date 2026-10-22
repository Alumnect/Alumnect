import React from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Users } from 'lucide-react-native'
import { Button, Card, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { eventApi } from '@/api/events'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC25–27, 29: chi tiết sự kiện (thông tin lấy từ bài viết/lịch sử truyền qua params). */
export default function EventScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const p = useLocalSearchParams<{ id: string; title?: string; start?: string; end?: string; location?: string; hostId?: string; postId?: string }>()
  const id = p.id!

  const status = useQuery({ queryKey: ['event-rsvp', id], queryFn: () => eventApi.status(id) })
  const st = status.data?.data
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['event-rsvp', id] })
    qc.invalidateQueries({ queryKey: ['feed'] })
    qc.invalidateQueries({ queryKey: ['event-history'] })
  }

  const rsvp = useMutation({
    mutationFn: () => eventApi.rsvp(id),
    onSuccess: () => { toast.success('Đăng ký tham gia sự kiện thành công!'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const cancel = useMutation({
    mutationFn: () => eventApi.cancelRsvp(id),
    onSuccess: () => { toast.success('Đã hủy tham gia sự kiện.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const cancelEvent = useMutation({
    mutationFn: () => eventApi.cancelEvent(id),
    onSuccess: () => { toast.success('Đã hủy sự kiện.'); refresh(); router.back() },
    onError: (e) => toast.error(errMsg(e)),
  })

  const isHost = !!p.hostId && p.hostId === me?.id
  const fmt = (v?: string) => (v ? new Date(v).toLocaleString('vi-VN') : '')

  return (
    <Screen>
      <Header title="Sự kiện" />
      {status.isLoading ? <Loading /> : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Txt size={22} weight="800">{p.title ?? 'Sự kiện'}</Txt>
          <Card style={{ marginTop: 16, gap: 10 }}>
            {p.start ? <View style={{ flexDirection: 'row', gap: 8 }}><Calendar size={18} color={t.primary} /><Txt>{fmt(p.start)}{p.end ? ` – ${fmt(p.end)}` : ''}</Txt></View> : null}
            {p.location ? <View style={{ flexDirection: 'row', gap: 8 }}><MapPin size={18} color={t.primary} /><Txt>{p.location}</Txt></View> : null}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Users size={18} color={t.primary} />
              <Txt>{st?.attendeeCount ?? 0}{st?.capacity ? ` / ${st.capacity}` : ''} người tham gia</Txt>
            </View>
          </Card>
          <View style={{ gap: 10, marginTop: 20 }}>
            {st?.registered ? (
              <Button title="Hủy đăng ký" variant="outline" onPress={() => cancel.mutate()} loading={cancel.isPending} />
            ) : (
              <Button title="Đăng ký tham gia" onPress={() => rsvp.mutate()} loading={rsvp.isPending} />
            )}
            <Button title="Danh sách người tham gia" variant="outline" onPress={() => router.push({ pathname: '/events/attendees', params: { id } })} />
            {isHost ? <Button title="Hủy sự kiện" variant="danger" onPress={() => cancelEvent.mutate()} loading={cancelEvent.isPending} /> : null}
          </View>
        </ScrollView>
      )}
    </Screen>
  )
}
