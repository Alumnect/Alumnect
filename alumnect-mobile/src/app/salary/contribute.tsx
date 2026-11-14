import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { SelectField } from '@/components/SelectField'
import { BottomBar } from '@/components/DetailBits'
import { CommunityIntro, FormSection } from '@/components/SocialUI'
import { Header } from '@/components/Header'
import { salaryApi } from '@/api/salary'
import type { SalaryAiCheck, SalaryInput } from '@/api/salary'
import { SalaryAiCheckPanel } from '@/components/SalaryAiCheckPanel'
import { toast, errMsg } from '@/lib/toast'
import { VN_CITIES } from '@/constants/filters'
import {
  JOB_TITLES_BY_INDUSTRY,
  OTHER_JOB_TITLE_ID,
  STANDARD_JOB_TITLES,
} from '@/constants/jobTitles'
import { useTheme } from '@/theme'

function formatSalaryPreview(amt: string): string {
  const n = Number(amt)
  if (!n || !Number.isFinite(n) || n <= 0) return ''
  if (n >= 1_000_000_000) return `~${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} tỷ / tháng`
  if (n >= 1_000_000) return `~${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')} triệu / tháng`
  if (n >= 1_000) return `~${Math.round(n / 1_000)} nghìn / tháng`
  return `${n.toLocaleString('vi-VN')} VNĐ / tháng`
}

/** UC47–48: đóng góp / sửa dữ liệu lương (truyền `id` để sửa) + [A1] AI kiểm tra mức lương trước khi gửi. */
export default function ContributeScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id?: string }>()

  // Lấy dữ liệu ngành nghề và thống kê thực tế từ database
  const industries = useQuery({ queryKey: ['industries'], queryFn: salaryApi.industries })
  const baseStats = useQuery({ queryKey: ['salary-stats-base'], queryFn: () => salaryApi.statistics({}), staleTime: 5 * 60_000 })
  const mine = useQuery({ queryKey: ['salary-mine'], queryFn: salaryApi.mine, enabled: !!id })
  const existing = id ? mine.data?.find((c) => c.id === id) : undefined

  const [industryId, setIndustryId] = useState<number | null>(null)
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null)
  const [customJobTitle, setCustomJobTitle] = useState('')
  const [region, setRegion] = useState<string | null>(null)
  const [company, setCompany] = useState('')
  const [years, setYears] = useState('')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [aiCheck, setAiCheck] = useState<{ key: string; result: SalaryAiCheck } | null>(null)

  if (existing && !loaded) {
    setLoaded(true)
    setIndustryId(existing.industryId)
    const isStd = (STANDARD_JOB_TITLES as readonly string[]).includes(existing.jobTitle)
    if (isStd) {
      setSelectedTitleId(existing.jobTitle)
      setCustomJobTitle('')
    } else {
      setSelectedTitleId(existing.jobTitle ? OTHER_JOB_TITLE_ID : null)
      setCustomJobTitle(existing.jobTitle || '')
    }
    setRegion(existing.region || null)
    setCompany(existing.company || '')
    setYears(existing.yearsExperience != null ? String(existing.yearsExperience) : '')
    setAmount(String(existing.grossAmount || ''))
  }

  const selectedIndustryName = useMemo(() => {
    return industries.data?.find((i) => i.id === industryId)?.name ?? ''
  }, [industries.data, industryId])

  // Chức danh: Ưu tiên các chức danh thực tế có trong database + danh mục chuẩn theo ngành
  const jobTitleOptions = useMemo(() => {
    const dbRoles = Array.from(new Set((baseStats.data?.rows ?? []).map((r) => r.role).filter(Boolean)))
    const list = selectedIndustryName && JOB_TITLES_BY_INDUSTRY[selectedIndustryName]
      ? JOB_TITLES_BY_INDUSTRY[selectedIndustryName]
      : STANDARD_JOB_TITLES

    const merged = Array.from(new Set([...dbRoles, ...list])).sort((a, b) => a.localeCompare(b, 'vi'))

    return [
      ...merged.map((title) => ({ value: title, label: title })),
      { value: OTHER_JOB_TITLE_ID, label: 'Chức danh khác (tự nhập)...' },
    ]
  }, [baseStats.data?.rows, selectedIndustryName])

  // Khu vực: Ưu tiên các thành phố thực tế có trong database + danh mục toàn quốc + Remote
  const regionOptions = useMemo(() => {
    const dbCities = Array.from(new Set((baseStats.data?.rows ?? []).map((r) => r.region).filter(Boolean)))
    const remaining = VN_CITIES.filter((c) => !dbCities.includes(c))

    return [
      { value: 'Remote / Làm từ xa', label: 'Remote / Làm từ xa' },
      ...dbCities.map((c) => ({ value: c, label: c })),
      ...remaining.map((c) => ({ value: c, label: c })),
    ]
  }, [baseStats.data?.rows])

  const effectiveJobTitle = selectedTitleId === OTHER_JOB_TITLE_ID
    ? customJobTitle.trim()
    : (selectedTitleId ?? '')

  const buildInput = (gross = amount): SalaryInput => ({
    industryId,
    jobTitle: effectiveJobTitle,
    company: company.trim() || undefined,
    region: region || undefined,
    locationCity: region || undefined,
    yearsExperience: years ? Number(years) : null,
    grossAmount: Number(gross),
  })

  // Kết quả AI chỉ còn hiệu lực khi dữ liệu không đổi so với lúc kiểm tra.
  const keyOf = (i: SalaryInput) => JSON.stringify(i)
  const currentKey = keyOf(buildInput())
  const activeCheck = aiCheck && aiCheck.key === currentKey ? aiCheck.result : null

  const m = useMutation({
    mutationFn: (input: SalaryInput) => (id ? salaryApi.update(id, input) : salaryApi.create(input)),
    onSuccess: () => {
      toast.success(id ? 'Đã cập nhật đóng góp lương.' : 'Cảm ơn bạn đã đóng góp dữ liệu lương ẩn danh!')
      qc.invalidateQueries({ queryKey: ['salary-mine'] })
      qc.invalidateQueries({ queryKey: ['salary-feed'] })
      qc.invalidateQueries({ queryKey: ['salary-stats'] })
      qc.invalidateQueries({ queryKey: ['salary-stats-base'] })
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  /** autoSave: kết quả NORMAL thì lưu luôn; AI lỗi thì không chặn người dùng (lưu như cũ). */
  const ai = useMutation({
    mutationFn: ({ input }: { input: SalaryInput; autoSave: boolean }) => salaryApi.aiCheck(input),
    onSuccess: (result, { input, autoSave }) => {
      if (autoSave && result.status === 'NORMAL') m.mutate(input)
      else setAiCheck({ key: keyOf(input), result })
    },
    onError: (_e, { input, autoSave }) => { if (autoSave) m.mutate(input) },
  })

  const applySuggestion = (amountVnd: number) => {
    setAmount(String(amountVnd))
    ai.mutate({ input: buildInput(String(amountVnd)), autoSave: false })
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!effectiveJobTitle) e.jobTitle = 'Chức danh công việc không được để trống'
    else if (effectiveJobTitle.length > 150) e.jobTitle = 'Chức danh công việc không được vượt quá 150 ký tự'

    const amt = Number(amount)
    if (!amount) e.amount = 'Mức lương không được để trống'
    else if (!(amt > 0)) e.amount = 'Mức lương phải lớn hơn 0'
    else if (amt > 9_999_999_999.99) e.amount = 'Mức lương không hợp lệ'

    if (years && (!Number.isFinite(Number(years)) || Number(years) < 0 || Number(years) > 60)) {
      e.years = 'Số năm kinh nghiệm không hợp lệ'
    }

    setErrors(e)
    if (Object.keys(e).length) return

    const input = buildInput()
    // Đã kiểm tra đúng dữ liệu này và không bị chặn (người dùng bấm "Xác nhận gửi") → lưu.
    if (activeCheck && !activeCheck.isBlocked) return m.mutate(input)
    ai.mutate({ input, autoSave: true })
  }

  if (id && mine.isLoading) return <Screen><Header title="Sửa đóng góp lương" /><Loading /></Screen>
  if (id && !existing) return <Screen><Header title="Sửa đóng góp lương" /><Empty text="Không tìm thấy đóng góp lương." error={mine.error} onRetry={() => { void mine.refetch() }} /></Screen>

  const salaryPreview = formatSalaryPreview(amount)

  return (
    <Screen keyboard>
      <Header title={id ? 'Sửa đóng góp lương' : 'Đóng góp lương'} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <CommunityIntro
          icon="coin"
          eyebrow="CHIA SẺ ẨN DANH"
          title="Một chia sẻ, nhiều cơ hội"
          description="Giúp cộng đồng hiểu hơn về mức lương. Tên của bạn không hiển thị cùng đóng góp."
        />

        <FormSection icon="suitcase" title="Công việc của bạn" caption="01 · Vị trí và lĩnh vực đang làm việc">
          <SelectField
            label="Ngành nghề"
            placeholder={industries.isLoading ? 'Đang tải ngành nghề...' : 'Chọn lĩnh vực của bạn'}
            value={industryId == null ? null : String(industryId)}
            options={(industries.data ?? []).filter((i) => i.name.trim().toLowerCase() !== 'khác').map((i) => ({ value: String(i.id), label: i.name }))}
            onChange={(v) => {
              setIndustryId(v ? Number(v) : null)
              setSelectedTitleId(null)
              setCustomJobTitle('')
            }}
          />
          {industries.isError ? (
            <Button title="Tải lại ngành nghề" variant="ghost" onPress={() => void industries.refetch()} />
          ) : null}

          <SelectField
            label="Chức danh công việc *"
            placeholder="Chọn chức danh công việc..."
            value={selectedTitleId}
            options={jobTitleOptions}
            error={errors.jobTitle}
            onChange={(v) => {
              setSelectedTitleId(v)
              if (v !== OTHER_JOB_TITLE_ID) setCustomJobTitle('')
            }}
          />

          {selectedTitleId === OTHER_JOB_TITLE_ID ? (
            <Input
              label="Nhập chức danh của bạn *"
              placeholder="Ví dụ: Data Scientist, AI Researcher..."
              value={customJobTitle}
              onChangeText={setCustomJobTitle}
              error={errors.jobTitle}
            />
          ) : null}

          <SelectField
            label="Khu vực làm việc"
            placeholder="Chọn Tỉnh / Thành phố làm việc"
            value={region}
            options={regionOptions}
            onChange={setRegion}
          />

          <Input
            label="Công ty · Không bắt buộc"
            placeholder="Tên công ty bạn đang làm việc"
            value={company}
            onChangeText={setCompany}
          />
        </FormSection>

        <FormSection icon="coin" title="Thu nhập & kinh nghiệm" caption="02 · Mức lương trước thuế mỗi tháng">
          <Input
            label="Số năm kinh nghiệm"
            placeholder="Ví dụ: 3"
            value={years}
            onChangeText={setYears}
            keyboardType="decimal-pad"
            error={errors.years}
          />

          <View>
            <Input
              label="Mức lương gộp / tháng (VNĐ) *"
              placeholder="Ví dụ: 20000000"
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^\d]/g, ''))}
              keyboardType="number-pad"
              error={errors.amount}
            />
            {salaryPreview ? (
              <Txt size={12} weight="600" color={t.primary} style={{ marginTop: 2, marginBottom: 8, paddingHorizontal: 4 }}>
                {salaryPreview}
              </Txt>
            ) : null}
          </View>

          <Txt muted size={12} style={{ marginBottom: activeCheck ? 14 : 0 }}>
            Nhập mức thu nhập gộp của 1 tháng bằng đồng Việt Nam, chưa trừ thuế và bảo hiểm. AI sẽ đối chiếu với mặt bằng thị trường trước khi gửi.
          </Txt>

          {activeCheck ? (
            <SalaryAiCheckPanel
              result={activeCheck}
              enteredAmount={Number(amount) || undefined}
              jobTitle={effectiveJobTitle}
              onApplySuggestion={applySuggestion}
              disabled={ai.isPending || m.isPending}
            />
          ) : null}
        </FormSection>
      </ScrollView>

      <BottomBar>
        <Button
          variant="brand"
          title={
            ai.isPending
              ? 'AI đang kiểm tra…'
              : activeCheck?.isBlocked
                ? 'Không thể gửi'
                : activeCheck?.requiresConfirmation
                  ? (id ? 'Xác nhận lưu' : 'Xác nhận gửi')
                  : id ? 'Lưu thay đổi' : 'Gửi đóng góp ẩn danh'
          }
          onPress={submit}
          loading={m.isPending || ai.isPending}
          disabled={!!activeCheck?.isBlocked}
          style={{ flex: 1 }}
        />
      </BottomBar>
    </Screen>
  )
}
