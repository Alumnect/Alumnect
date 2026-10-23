import React from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CalendarX2, CheckCircle2, ChevronRight, Clock, MapPin, Users } from '@/components/icons'
import { Button, Card, Loading, Screen, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { BottomBar, BrandCover, InfoRow } from '@/components/DetailBits'
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
    qc.invalidateQueries({ queryKey: ['events-list'] })
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
  const start = p.start ? new Date(p.start) : null
  const end = p.end ? new Date(p.end) : null
  const count = st?.attendeeCount ?? 0
  const cap = st?.capacity ?? null
  const full = !!cap && count >= cap
  const pct = cap ? Math.min(1, count / cap) : 0

  return (
    <Screen bg={t.card}>
      <Header title="Sự kiện" />
      {status.isLoading ? <Loading /> : (
        <>
          <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={{ backgroundColor: t.card, marginBottom: 10 }}>
              <BrandCover height={130} />
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View style={{ width: 72, marginTop: -40, borderRadius: 16, overflow: 'hidden', backgroundColor: t.card, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
                  <View style={{ alignSelf: 'stretch', backgroundColor: t.danger, paddingVertical: 4 }}>
                    <Txt size={11} weight="800" color="#fff" style={{ textAlign: 'center' }}>{start ? `THÁNG ${start.getMonth() + 1}` : '--'}</Txt>
                  </View>
                  <Txt size={28} weight="800" style={{ paddingVertical: 4 }}>{start ? String(start.getDate()).padStart(2, '0') : '--'}</Txt>
                </View>
                <Txt size={22} weight="800" style={{ marginTop: 12, lineHeight: 30 }}>{p.title ?? 'Sự kiện'}</Txt>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  {st?.registered ? <Tag label="Bạn đã đăng ký" tone="success" icon={<CheckCircle2 size={12} color={t.success} />} /> : null}
                  {full ? <Tag label="Đã đủ chỗ" tone="warning" /> : null}
                  {isHost ? <Tag label="Bạn là người tổ chức" /> : null}
                </View>
              </View>
            </View>

            <Card style={{ marginHorizontal: 12, marginBottom: 10, paddingVertical: 4 }}>
              {start ? (
                <InfoRow
                  icon={<CalendarDays size={16} color={t.primary} />}
                  label="Ngày"
                  value={start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                />
              ) : null}
              {start ? (
                <InfoRow
                  icon={<Clock size={16} color={t.primary} />}
                  label="Thời gian"
                  value={`${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}${end ? ` – ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
                />
              ) : null}
              {p.location ? <InfoRow icon={<MapPin size={16} color={t.primary} />} label="Địa điểm" value={p.location} last /> : null}
            </Card>

            <Card style={{ marginHorizontal: 12, marginBottom: 10 }} onPress={() => router.push({ pathname: '/events/attendees', params: { id } })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} color={t.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt weight="700">{`${count}${cap ? ` / ${cap}` : ''} người tham gia`}</Txt>
                  <Txt muted size={12}>Xem danh sách người tham gia</Txt>
                </View>
                <ChevronRight size={18} color={t.textSubtle} />
              </View>
              {cap ? (
                <View style={{ height: 8, borderRadius: 4, backgroundColor: t.inputBg, overflow: 'hidden', marginTop: 12 }}>
                  <View style={{ width: `${pct * 100}%`, height: 8, borderRadius: 4, backgroundColor: full ? t.warning : t.primary }} />
                </View>
              ) : null}
            </Card>

            {isHost ? (
              <Button
                title="Huỷ sự kiện"
                variant="ghost"
                icon={<CalendarX2 size={16} color={t.danger} />}
                onPress={() => cancelEvent.mutate()}
                loading={cancelEvent.isPending}
                style={{ marginHorizontal: 12 }}
              />
            ) : null}
          </ScrollView>
          <BottomBar>
            {st?.registered ? (
              <Button title="Huỷ đăng ký" variant="outline" onPress={() => cancel.mutate()} loading={cancel.isPending} style={{ flex: 1 }} />
            ) : (
              <Button
                title={full ? 'Đã hết chỗ' : 'Đăng ký tham gia'}
                disabled={full}
                icon={full ? undefined : <CheckCircle2 size={17} color="#fff" />}
                onPress={() => rsvp.mutate()}
                loading={rsvp.isPending}
                style={{ flex: 1 }}
              />
            )}
          </BottomBar>
        </>
      )}
    </Screen>
  )
}
