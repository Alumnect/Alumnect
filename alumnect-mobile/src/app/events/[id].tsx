import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CalendarX2, CheckCircle2, ChevronRight, Clock, MapPin, Users } from '@/components/icons'
import { Button, Card, Empty, Loading, Screen, Tag, Txt } from '@/components/ui'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { Header } from '@/components/Header'
import { BottomBar, BrandCover, InfoRow } from '@/components/DetailBits'
import { eventApi } from '@/api/events'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC25–27, 29: load current event details and permissions by ID, including deep links. */
export default function EventScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const p = useLocalSearchParams<{ id: string; title?: string; start?: string; end?: string; location?: string; hostId?: string; postId?: string }>()
  const id = p.id!

  const [confirm, setConfirm] = useState<'event' | 'registration' | null>(null)
  const status = useQuery({ queryKey: ['event-detail', id], queryFn: () => eventApi.detail(id), refetchInterval: 30_000 })
  const st = status.data?.data
  const refresh = () => {
    setConfirm(null)
    qc.invalidateQueries({ queryKey: ['event-detail', id] })
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
    onSuccess: () => { toast.success('Đã hủy sự kiện.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })

  const isHost = st?.organizerId != null && String(st.organizerId) === me?.id
  const start = st?.startTime ? new Date(st.startTime) : null
  const end = st?.endTime ? new Date(st.endTime) : null
  const count = st?.attendeeCount ?? 0
  const cap = st?.capacity ?? null
  const full = !!cap && count >= cap
  const pct = cap ? Math.min(1, count / cap) : 0
  const closed = st?.status === 'CANCELLED' || st?.started

  return (
    <Screen bg={t.card}>
      <Header title="Sự kiện" />
      {status.isError ? <Empty title="Không thể tải sự kiện" text="Sự kiện không còn khả dụng hoặc kết nối bị gián đoạn." error={status.error} onRetry={() => void status.refetch()} /> : status.isLoading || !st ? <Loading /> : (
        <>
          <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={{ backgroundColor: t.card, marginBottom: 16 }}>
              <BrandCover height={130} />
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View style={{ width: 72, marginTop: -40, borderRadius: 16, overflow: 'hidden', backgroundColor: t.card, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
                  <View style={{ alignSelf: 'stretch', backgroundColor: t.danger, paddingVertical: 4 }}>
                    <Txt size={11} weight="800" color="#fff" style={{ textAlign: 'center' }}>{start ? `THÁNG ${start.getMonth() + 1}` : '--'}</Txt>
                  </View>
                  <Txt size={28} weight="800" style={{ paddingVertical: 4 }}>{start ? String(start.getDate()).padStart(2, '0') : '--'}</Txt>
                </View>
                <Txt size={22} weight="800" style={{ marginTop: 12, lineHeight: 30 }}>{st.title}</Txt>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  {st?.registered ? <Tag label="Bạn đã đăng ký" tone="success" icon={<CheckCircle2 size={12} color={t.success} />} /> : null}
                  {full ? <Tag label="Đã đủ chỗ" tone="warning" /> : null}
                  {isHost ? <Tag label="Bạn là người tổ chức" /> : null}
                  {st.status === 'CANCELLED' ? <Tag label="Sự kiện đã hủy" tone="warning" /> : null}
                </View>
              </View>
            </View>

            <Card style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 4 }}>
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
              {st.location ? <InfoRow icon={<MapPin size={16} color={t.primary} />} label="Địa điểm" value={st.location} last /> : null}
            </Card>

            <View style={{ marginHorizontal: 16, marginBottom: 16, gap: 8 }}>
              <Txt muted size={13}>Tổ chức bởi {st.organizerName}</Txt>
              <Button title="Xem bài viết sự kiện" variant="outline" onPress={() => router.push({ pathname: '/post/[id]', params: { id: String(st.postId) } })} />
            </View>

            <Card style={{ marginHorizontal: 16, marginBottom: 16 }} onPress={() => router.push({ pathname: '/events/attendees', params: { id } })}>
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

            {st.canCancel ? (
              <Button
                title="Huỷ sự kiện"
                variant="ghost"
                icon={<CalendarX2 size={16} color={t.danger} />}
                onPress={() => setConfirm('event')}
                loading={cancelEvent.isPending}
                style={{ marginHorizontal: 16 }}
              />
            ) : null}
          </ScrollView>
          <BottomBar>
            {st?.registered ? (
              <Button title={closed ? (st.status === 'CANCELLED' ? 'Sự kiện đã hủy' : 'Sự kiện đã bắt đầu') : 'Huỷ đăng ký'} disabled={!st.canCancelRegistration || closed} variant="outline" onPress={() => setConfirm('registration')} loading={cancel.isPending} style={{ flex: 1 }} />
            ) : (
              <Button
                title={st.status === 'CANCELLED' ? 'Sự kiện đã hủy' : closed ? 'Sự kiện đã bắt đầu' : full ? 'Đã hết chỗ' : 'Đăng ký tham gia'}
                disabled={!st.canRegister || closed}
                icon={full ? undefined : <CheckCircle2 size={17} color="#fff" />}
                onPress={() => rsvp.mutate()}
                loading={rsvp.isPending}
                style={{ flex: 1 }}
              />
            )}
          </BottomBar>
        </>
      )}
      <ConfirmSheet visible={confirm != null} title={confirm === 'event' ? 'Hủy sự kiện này?' : 'Hủy đăng ký tham gia?'} message={confirm === 'event' ? 'Người đã đăng ký sẽ không thể tiếp tục tham gia sự kiện này.' : 'Chỗ tham gia của bạn sẽ được nhường cho người khác.'} confirmLabel="Xác nhận hủy" loading={cancel.isPending || cancelEvent.isPending} onClose={() => setConfirm(null)} onConfirm={() => confirm === 'event' ? cancelEvent.mutate() : cancel.mutate()} />
    </Screen>
  )
}
