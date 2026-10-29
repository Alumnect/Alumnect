import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Chip, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { salaryApi } from '@/api/salary'
import { toast, errMsg } from '@/lib/toast'

/** UC47–48: đóng góp / sửa dữ liệu lương (truyền `id` để sửa). */
export default function ContributeScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const industries = useQuery({ queryKey: ['industries'], queryFn: salaryApi.industries })
  const mine = useQuery({ queryKey: ['salary-mine'], queryFn: salaryApi.mine, enabled: !!id })
  const existing = id ? mine.data?.find((c) => c.id === id) : undefined

  const [f, setF] = useState({ jobTitle: '', company: '', region: '', years: '', amount: '' })
  const [industryId, setIndustryId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  if (existing && !loaded) {
    setLoaded(true)
    setF({ jobTitle: existing.jobTitle, company: existing.company, region: existing.region, years: existing.yearsExperience != null ? String(existing.yearsExperience) : '', amount: String(existing.grossAmount) })
    setIndustryId(existing.industryId)
  }
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const m = useMutation({
    mutationFn: () => {
      const input = { industryId, jobTitle: f.jobTitle.trim(), company: f.company.trim() || undefined, region: f.region.trim() || undefined, yearsExperience: f.years ? Number(f.years) : null, grossAmount: Number(f.amount) }
      return id ? salaryApi.update(id, input) : salaryApi.create(input)
    },
    onSuccess: () => {
      toast.success(id ? 'Đã cập nhật đóng góp lương.' : 'Cảm ơn bạn đã đóng góp dữ liệu lương ẩn danh!')
      qc.invalidateQueries({ queryKey: ['salary-mine'] })
      qc.invalidateQueries({ queryKey: ['salary-feed'] })
      qc.invalidateQueries({ queryKey: ['salary-stats'] })
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.jobTitle.trim()) e.jobTitle = 'Chức danh công việc không được để trống'
    else if (f.jobTitle.trim().length > 150) e.jobTitle = 'Chức danh công việc không được vượt quá 150 ký tự'
    const amount = Number(f.amount)
    if (!f.amount) e.amount = 'Mức lương không được để trống'
    else if (!(amount > 0)) e.amount = 'Mức lương phải lớn hơn 0'
    else if (amount > 9_999_999_999.99) e.amount = 'Mức lương không hợp lệ'
    if (f.years && (Number(f.years) < 0 || Number(f.years) > 60)) e.years = 'Số năm kinh nghiệm không hợp lệ'
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  if (id && mine.isLoading) return <Screen><Header title="Sửa đóng góp lương" /><Loading /></Screen>
  if (id && !existing) return <Screen><Header title="Sửa đóng góp lương" /><Empty text="Không tìm thấy đóng góp lương." error={mine.error} onRetry={() => { void mine.refetch() }} /></Screen>

  return (
    <Screen keyboard>
      <Header title={id ? 'Sửa đóng góp lương' : 'Đóng góp lương'} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Ngành</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
          {(industries.data ?? []).map((i) => <Chip key={i.id} label={i.name} active={industryId === i.id} onPress={() => setIndustryId(industryId === i.id ? null : i.id)} />)}
        </View>
        <Input label="Chức danh" value={f.jobTitle} onChangeText={set('jobTitle')} error={errors.jobTitle} />
        <Input label="Công ty (tùy chọn)" value={f.company} onChangeText={set('company')} />
        <Input label="Khu vực (tùy chọn)" value={f.region} onChangeText={set('region')} />
        <Input label="Số năm kinh nghiệm" value={f.years} onChangeText={set('years')} keyboardType="decimal-pad" error={errors.years} />
        <Input label="Lương gộp / tháng (VND)" value={f.amount} onChangeText={(v) => set('amount')(v.replace(/[^\d.]/g, ''))} keyboardType="number-pad" error={errors.amount} />
        <Txt muted size={12} style={{ marginBottom: 16 }}>Dữ liệu được hiển thị ẩn danh, không gắn với tên của bạn.</Txt>
        <Button title={id ? 'Lưu thay đổi' : 'Gửi đóng góp'} onPress={submit} loading={m.isPending} />
      </ScrollView>
    </Screen>
  )
}
