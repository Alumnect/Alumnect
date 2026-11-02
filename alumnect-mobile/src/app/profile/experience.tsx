import React, { useState } from 'react'
import { Switch, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { PlaceField } from '@/components/PlaceField'
import type { GeocodedPlace } from '@/lib/places'
import { experienceApi } from '@/api/explore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** UC07: thêm / sửa / xóa kinh nghiệm và thăng chức (promote). */
export default function ExperienceScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const list = useQuery({ queryKey: ['experiences'], queryFn: experienceApi.list })
  const existing = id ? list.data?.find((e) => e.id === Number(id)) : undefined

  const [f, setF] = useState({ title: '', company: '', location: '', startDate: '', endDate: '', description: '' })
  const [isCurrent, setIsCurrent] = useState(false)
  const [isPrimary, setIsPrimary] = useState(false)
  const [promo, setPromo] = useState({ newTitle: '', newStartDate: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [place, setPlace] = useState<GeocodedPlace | null>(null)
  const [resolvingPlace, setResolvingPlace] = useState(false)
  if (existing && !loaded) {
    setLoaded(true)
    setF({ title: existing.title, company: existing.company, location: existing.location ?? '', startDate: existing.startDate, endDate: existing.endDate ?? '', description: existing.description ?? '' })
    setIsCurrent(existing.isCurrent); setIsPrimary(existing.isPrimary)
  }
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }))
  const after = (msg: string) => { toast.success(msg); qc.invalidateQueries({ queryKey: ['experiences'] }); qc.invalidateQueries({ queryKey: ['profile'] }); router.back() }

  const save = useMutation({
    mutationFn: () => {
      const sameLocation = (existing?.location?.trim() ?? '') === f.location.trim()
      const geo = place ?? (sameLocation ? existing : null)
      const p = {
        title: f.title.trim(), company: f.company.trim(), location: f.location.trim() || null,
        startDate: f.startDate, endDate: isCurrent ? null : f.endDate || null, isCurrent, isPrimary,
        description: f.description.trim() || null,
        // Keep geocoding when editing other fields; changed text must not retain stale coordinates.
        latitude: geo?.latitude ?? null, longitude: geo?.longitude ?? null, placeId: geo?.placeId ?? null,
        locationCity: geo?.locationCity ?? null, locationCountry: geo?.locationCountry ?? null,
        locationCountryCode: geo?.locationCountryCode ?? null, geocodingProvider: geo?.geocodingProvider ?? null,
      }
      return id ? experienceApi.update(Number(id), p) : experienceApi.create(p)
    },
    onSuccess: () => after(id ? 'Đã cập nhật kinh nghiệm.' : 'Đã thêm kinh nghiệm.'),
    onError: (e) => toast.error(errMsg(e)),
  })
  const del = useMutation({ mutationFn: () => experienceApi.remove(Number(id)), onSuccess: () => after('Đã xóa kinh nghiệm.'), onError: (e) => toast.error(errMsg(e)) })
  const promote = useMutation({
    mutationFn: () => experienceApi.promote(Number(id), { newTitle: promo.newTitle.trim(), newStartDate: promo.newStartDate, reuseLocation: true }),
    onSuccess: () => after('Đã ghi nhận thăng chức.'),
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = 'Chức danh không được để trống'
    if (!f.company.trim()) e.company = 'Công ty không được để trống'
    if (!DATE_RE.test(f.startDate)) e.startDate = 'Ngày bắt đầu theo định dạng YYYY-MM-DD'
    if (!isCurrent && f.endDate && !DATE_RE.test(f.endDate)) e.endDate = 'Ngày kết thúc theo định dạng YYYY-MM-DD'
    if (!isCurrent && f.endDate && f.endDate < f.startDate) e.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
    setErrors(e)
    if (!Object.keys(e).length) save.mutate()
  }

  if (id && list.isLoading) return <Screen><Header title="Sửa kinh nghiệm" /><Loading /></Screen>
  if (id && !existing) return <Screen><Header title="Sửa kinh nghiệm" /><Empty text="Không tìm thấy kinh nghiệm." error={list.error} onRetry={() => { void list.refetch() }} /></Screen>

  return (
    <Screen keyboard>
      <Header title={id ? 'Sửa kinh nghiệm' : 'Thêm kinh nghiệm'} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Input label="Chức danh" value={f.title} onChangeText={set('title')} error={errors.title} />
        <Input label="Công ty" value={f.company} onChangeText={set('company')} error={errors.company} />
        <PlaceField value={f.location} hasCoordinates={place != null || (f.location.trim() === existing?.location?.trim() && existing?.latitude != null && existing.longitude != null)} onChange={(value) => { setPlace(null); set('location')(value) }} onSelect={(value) => { setPlace(value); set('location')(value.location) }} onResolving={setResolvingPlace} />
        <Input label="Bắt đầu (YYYY-MM-DD)" value={f.startDate} onChangeText={set('startDate')} autoCapitalize="none" placeholder="2022-07-01" error={errors.startDate} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Txt weight="600">Đang làm việc tại đây</Txt>
          <Switch value={isCurrent} onValueChange={setIsCurrent} trackColor={{ true: t.primary }} />
        </View>
        {!isCurrent ? <Input label="Kết thúc (YYYY-MM-DD)" value={f.endDate} onChangeText={set('endDate')} autoCapitalize="none" error={errors.endDate} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Txt weight="600">Đặt làm vị trí chính</Txt>
          <Switch value={isPrimary} onValueChange={setIsPrimary} trackColor={{ true: t.primary }} />
        </View>
        <Input label="Mô tả" value={f.description} onChangeText={set('description')} multiline />
        <Button title="Lưu" onPress={submit} loading={save.isPending} disabled={resolvingPlace} />
        {id ? (
          <>
            <Card style={{ marginTop: 24 }}>
              <Txt weight="700" style={{ marginBottom: 8 }}>Thăng chức tại công ty này</Txt>
              <Input label="Chức danh mới" value={promo.newTitle} onChangeText={(v) => setPromo((x) => ({ ...x, newTitle: v }))} />
              <Input label="Ngày bắt đầu (YYYY-MM-DD)" value={promo.newStartDate} onChangeText={(v) => setPromo((x) => ({ ...x, newStartDate: v }))} autoCapitalize="none" />
              <Button title="Ghi nhận thăng chức" variant="outline" disabled={!promo.newTitle.trim() || !DATE_RE.test(promo.newStartDate)} onPress={() => promote.mutate()} loading={promote.isPending} />
            </Card>
            <Button title="Xóa kinh nghiệm" variant="danger" style={{ marginTop: 16 }} onPress={() => setConfirmDelete(true)} loading={del.isPending} />
          </>
        ) : null}
      </ScrollView>
      <ConfirmSheet visible={confirmDelete} title="Xóa kinh nghiệm này?" message="Kinh nghiệm sẽ bị xóa khỏi hồ sơ và lộ trình sự nghiệp của bạn." loading={del.isPending} onClose={() => setConfirmDelete(false)} onConfirm={() => del.mutate()} />
    </Screen>
  )
}
