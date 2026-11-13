import React, { useState } from 'react'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { SelectField } from '@/components/SelectField'
import { BottomBar } from '@/components/DetailBits'
import { CommunityIntro, FormSection } from '@/components/SocialUI'
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
    if (f.years && (!Number.isFinite(Number(f.years)) || Number(f.years) < 0 || Number(f.years) > 60)) e.years = 'Số năm kinh nghiệm không hợp lệ'
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  if (id && mine.isLoading) return <Screen><Header title="Sửa đóng góp lương" /><Loading /></Screen>
  if (id && !existing) return <Screen><Header title="Sửa đóng góp lương" /><Empty text="Không tìm thấy đóng góp lương." error={mine.error} onRetry={() => { void mine.refetch() }} /></Screen>

  return (
    <Screen keyboard>
      <Header title={id ? 'Sửa đóng góp lương' : 'Đóng góp lương'} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <CommunityIntro icon="coin" eyebrow="CHIA SẺ ẨN DANH" title="Một chia sẻ, nhiều cơ hội" description="Giúp cộng đồng hiểu hơn về mức lương. Tên của bạn không hiển thị cùng đóng góp." />
        <FormSection icon="suitcase" title="Công việc của bạn" caption="01 · Vị trí và lĩnh vực đang làm việc">
          <SelectField label="Ngành nghề" placeholder={industries.isLoading ? 'Đang tải ngành nghề...' : 'Chọn lĩnh vực của bạn'} value={industryId == null ? null : String(industryId)} options={(industries.data ?? []).map((i) => ({ value: String(i.id), label: i.name }))} onChange={(v) => setIndustryId(v ? Number(v) : null)} />
          {industries.isError ? <Button title="Tải lại ngành nghề" variant="ghost" onPress={() => void industries.refetch()} /> : null}
          <Input label="Chức danh *" placeholder="Ví dụ: Product Designer" value={f.jobTitle} onChangeText={set('jobTitle')} error={errors.jobTitle} />
          <Input label="Công ty · Không bắt buộc" placeholder="Tên công ty bạn đang làm việc" value={f.company} onChangeText={set('company')} />
          <Input label="Khu vực · Không bắt buộc" placeholder="Ví dụ: Thành phố Hồ Chí Minh" value={f.region} onChangeText={set('region')} />
        </FormSection>
        <FormSection icon="coin" title="Thu nhập & kinh nghiệm" caption="02 · Mức lương trước thuế mỗi tháng">
          <Input label="Số năm kinh nghiệm" placeholder="Ví dụ: 3" value={f.years} onChangeText={set('years')} keyboardType="decimal-pad" error={errors.years} />
          <Input label="Lương gộp / tháng (VND) *" placeholder="Ví dụ: 20000000" value={f.amount} onChangeText={(v) => set('amount')(v.replace(/[^\d.]/g, ''))} keyboardType="number-pad" error={errors.amount} />
          <Txt muted size={12}>Nhập đầy đủ số tiền bằng đồng Việt Nam, chưa trừ thuế và bảo hiểm.</Txt>
        </FormSection>
      </ScrollView>
      <BottomBar><Button variant="brand" title={id ? 'Lưu thay đổi' : 'Gửi đóng góp ẩn danh'} onPress={submit} loading={m.isPending} style={{ flex: 1 }} /></BottomBar>
    </Screen>
  )
}
