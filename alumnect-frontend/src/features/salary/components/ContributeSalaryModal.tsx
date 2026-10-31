/**
 * ContributeSalaryModal — Modal đóng góp dữ liệu lương (UC50 - Contribute salary data) HOẶC
 * chỉnh sửa lượt đóng góp đã có (UC51 - Edit salary contribution).
 *
 * Chuẩn hóa trải nghiệm theo chuẩn các nền tảng tuyển dụng hàng đầu (Levels.fyi, ITviec, TopCV):
 *  - Ngành nghề: Chọn ngành nghề trước tiên để thu hẹp và gợi ý danh sách chức danh chính xác.
 *  - Chức danh công việc: Tự động hiển thị các chức danh tương ứng với ngành nghề đã chọn, hỗ trợ "Chức danh khác (tự nhập)...".
 *  - Địa điểm làm việc: Chọn từ danh mục 63 Tỉnh / Thành phố chuẩn hoặc Remote, tránh chuỗi địa chỉ phân mảnh.
 *  - Mức lương / tháng: Nhập số kèm badge quy đổi trực tiếp (triệu / tỷ VNĐ) chống nhầm số 0.
 *  - Thông tin bổ sung: Công ty, Số năm kinh nghiệm.
 */
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Loader2,
  Coins,
  Briefcase,
  Building2,
  Clock,
  Check,
  LayoutGrid,
  Info,
  MapPin,
} from 'lucide-react'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import {
  createSalaryContributionSchema,
  MAX_GROSS_AMOUNT,
  STANDARD_JOB_TITLES,
  JOB_TITLES_BY_INDUSTRY,
  VIETNAM_CITIES,
  OTHER_JOB_TITLE_ID,
  getIndustryIcon,
} from '../model/salary'
import type { CreateSalaryContributionInput, SalaryContribution } from '../model/salary'
import { useCreateSalaryContribution, useUpdateSalaryContribution, useIndustries } from '../hooks/useSalary'
import { EntitySelectField, type SelectOption } from '@/features/forum/components/EntitySelectField'

/** Class dùng chung cho các ô nhập liệu trong form. */
const FIELD_CLASS =
  'w-full rounded-xl border border-border bg-surface text-sm text-text placeholder:text-plum-400/80 transition focus:border-brand-400/70 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border-strong [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none dark:placeholder-[#b0b3b8]'

/** Hàm hỗ trợ hiển thị mức lương thành chữ dễ đọc (triệu/tỷ). */
function formatVndText(num: number, t: (key: string, opts?: any) => string): string {
  if (num >= 1_000_000_000) {
    const val = (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')
    return t('salary.billionVnd', { val })
  }
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return t('salary.millionVnd', { val })
  }
  if (num >= 1_000) {
    return t('salary.thousandVnd', { val: Math.round(num / 1_000) })
  }
  return `${num}`
}

export function ContributeSalaryModal({
  onClose,
  onSuccess,
  editContribution,
}: {
  onClose: () => void
  onSuccess: () => void
  /** Truyền vào để mở modal ở chế độ SỬA (UC51), điền sẵn dữ liệu; bỏ trống = chế độ TẠO mới (UC50). */
  editContribution?: SalaryContribution
}) {
  const { t } = useTranslation()
  const isEdit = !!editContribution
  const { data: rawIndustries } = useIndustries()
  // Ngành nghề chuẩn hệ thống: không có mục "Khác"
  const industries = useMemo(() => {
    return (rawIndustries ?? []).filter((ind) => ind.name.trim().toLowerCase() !== 'khác')
  }, [rawIndustries])

  const createMut = useCreateSalaryContribution()
  const updateMut = useUpdateSalaryContribution(editContribution?.id ?? '')
  const { mutate, isPending, error } = isEdit ? updateMut : createMut

  // Xử lý giá trị ban đầu cho Chức danh công việc
  const initialJobTitle = editContribution?.jobTitle?.trim() ?? ''
  const isStandardTitle = (STANDARD_JOB_TITLES as readonly string[]).includes(initialJobTitle)
  const initialTitleId = initialJobTitle
    ? (isStandardTitle ? initialJobTitle : OTHER_JOB_TITLE_ID)
    : null
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(initialTitleId)
  const [customJobTitle, setCustomJobTitle] = useState<string>(
    initialJobTitle && !isStandardTitle ? initialJobTitle : ''
  )

  // Xử lý giá trị ban đầu cho Địa điểm làm việc (chuẩn 63 tỉnh thành, không có tự nhập/khác)
  const initialCity = (editContribution?.locationCity || editContribution?.region || '').trim()
  const [selectedCityId, setSelectedCityId] = useState<string | null>(initialCity || null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSalaryContributionInput>({
    resolver: zodResolver(createSalaryContributionSchema),
    defaultValues: {
      industryId: editContribution?.industryId ?? null,
      jobTitle: initialJobTitle,
      company: editContribution?.company ?? '',
      region: initialCity,
      locationCity: editContribution?.locationCity || initialCity,
      yearsExperience: editContribution?.yearsExperience ?? null,
      grossAmount: editContribution?.grossAmount ?? undefined,
    },
  })

  const industryId = watch('industryId')
  const grossAmount = watch('grossAmount')

  // Tìm tên ngành nghề đang được chọn
  const selectedIndustryName = useMemo(() => {
    return industries?.find((ind) => ind.id === industryId)?.name ?? ''
  }, [industries, industryId])

  // Danh mục options chức danh: Tự động lọc theo ngành nghề đã chọn
  const jobTitleOptions: SelectOption<string>[] = useMemo(() => {
    const list = selectedIndustryName && JOB_TITLES_BY_INDUSTRY[selectedIndustryName]
      ? JOB_TITLES_BY_INDUSTRY[selectedIndustryName]
      : STANDARD_JOB_TITLES

    return [
      ...list.map((title) => ({ id: title, name: title })),
      { id: OTHER_JOB_TITLE_ID, name: t('salary.otherJobTitle') },
    ]
  }, [selectedIndustryName, t])

  // Danh mục options tỉnh thành (toàn bộ 63 tỉnh thành Việt Nam + Remote — không có tự nhập/khác)
  const cityOptions: SelectOption<string>[] = useMemo(
    () => [
      ...VIETNAM_CITIES.map((city) => ({ id: city, name: city })),
      { id: 'Remote', name: t('salary.remoteWork') },
    ],
    [t]
  )

  // Xử lý chọn Ngành nghề: Tự động cập nhật và kiểm tra chức danh tương ứng
  const handleIndustrySelect = (id: number | null) => {
    setValue('industryId', id, { shouldDirty: true, shouldValidate: true })

    if (!id) {
      setSelectedTitleId(null)
      setValue('jobTitle', '', { shouldDirty: true, shouldValidate: true })
      setCustomJobTitle('')
      return
    }

    const newIndustryName = industries?.find((ind) => ind.id === id)?.name ?? ''
    const allowedTitles = newIndustryName && JOB_TITLES_BY_INDUSTRY[newIndustryName]
      ? JOB_TITLES_BY_INDUSTRY[newIndustryName]
      : STANDARD_JOB_TITLES

    // Nếu chức danh hiện tại không thuộc ngành mới chọn, reset để người dùng chọn lại
    if (selectedTitleId && selectedTitleId !== OTHER_JOB_TITLE_ID) {
      if (!allowedTitles.includes(selectedTitleId as any)) {
        setSelectedTitleId(null)
        setValue('jobTitle', '', { shouldDirty: true, shouldValidate: true })
      }
    }
  }

  // Xử lý chọn chức danh từ Dropdown
  const handleJobTitleSelect = (id: string | null) => {
    setSelectedTitleId(id)
    if (id === OTHER_JOB_TITLE_ID) {
      setValue('jobTitle', customJobTitle, { shouldValidate: true, shouldDirty: true })
    } else {
      setValue('jobTitle', id ?? '', { shouldValidate: true, shouldDirty: true })
    }
  }

  // Xử lý gõ chức danh tự nhập
  const handleCustomJobTitleChange = (val: string) => {
    setCustomJobTitle(val)
    setValue('jobTitle', val, { shouldValidate: true, shouldDirty: true })
  }

  // Xử lý chọn địa điểm từ Dropdown chuẩn
  const handleCitySelect = (id: string | null) => {
    setSelectedCityId(id)
    const chosen = id ?? ''
    setValue('region', chosen, { shouldDirty: true, shouldValidate: true })
    setValue('locationCity', chosen, { shouldDirty: true })
  }

  const onSubmit = (values: CreateSalaryContributionInput) => {
    mutate(
      {
        ...values,
        company: values.company?.trim() || undefined,
        region: values.region?.trim() || undefined,
        locationCity: values.locationCity?.trim() || undefined,
      },
      { onSuccess },
    )
  }

  const footer = (
    <div className="flex items-center justify-end gap-2.5">
      <Button type="button" variant="secondary" onClick={onClose} disabled={isPending} size="md">
        {t('common.cancel')}
      </Button>
      <Button
        type="submit"
        form="contribute-salary-form"
        variant="gold"
        disabled={isPending}
        size="md"
        leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
      >
        {isEdit ? (isPending ? t('common.processing') : t('common.saveChanges')) : isPending ? t('common.processing') : t('salary.contributeData')}
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen
      onClose={isPending ? () => {} : onClose}
      title={isEdit ? t('salary.editSalaryData') : t('salary.contributeSalaryData')}
      icon={<Coins size={18} className="text-primary-solid" />}
      maxWidthClassName="max-w-lg"
      footer={footer}
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
          <AlertTriangle size={16} className="shrink-0" /> {(error as Error).message}
        </div>
      )}

      <form id="contribute-salary-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 1. Ngành nghề */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted">
            {t('salary.industry')} <span className="text-danger">*</span>
          </label>
          <EntitySelectField
            items={industries}
            value={industryId}
            onChange={handleIndustrySelect}
            placeholder={t('salary.selectIndustryFirst')}
            searchPlaceholder={t('salary.searchIndustry')}
            searchable
            itemIcon={(name) => {
              const Icon = getIndustryIcon(name)
              return <Icon size={15} className="text-primary-solid shrink-0" />
            }}
            buttonIcon={<LayoutGrid size={15} className="text-primary-solid" />}
          />
        </div>

        {/* 2. Chức danh công việc */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted">
            {t('salary.jobTitle')} <span className="text-danger">*</span>
          </label>
          <EntitySelectField<string>
            items={industryId ? jobTitleOptions : []}
            value={selectedTitleId}
            onChange={handleJobTitleSelect}
            disabled={!industryId}
            placeholder={industryId ? t('salary.selectJobTitle') : t('salary.selectIndustryFirst')}
            searchPlaceholder={t('salary.searchJobTitle')}
            searchable
            buttonIcon={<Briefcase size={15} className="text-primary-solid" />}
          />

          {/* Ô nhập tay khi chọn "Chức danh khác" */}
          {industryId && selectedTitleId === OTHER_JOB_TITLE_ID && (
            <div className="mt-2 relative">
              <Briefcase size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              <input
                value={customJobTitle}
                onChange={(e) => handleCustomJobTitleChange(e.target.value)}
                placeholder={t('salary.customJobTitlePlaceholder')}
                className={`${FIELD_CLASS} h-11 pl-10 pr-4`}
                autoFocus
              />
            </div>
          )}

          {errors.jobTitle && <p className="mt-1.5 text-xs text-danger">{errors.jobTitle.message}</p>}
        </div>

        {/* 3. Mức lương / tháng */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>
              {t('salary.monthlySalary')} <span className="text-danger">*</span>
            </span>
            <span className="text-xs font-normal text-text-subtle">{t('salary.salaryUnitPerMonth')}</span>
          </label>
          <div className="relative">
            <Coins size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              type="number"
              step="1"
              min={0}
              max={MAX_GROSS_AMOUNT}
              {...register('grossAmount', { valueAsNumber: true })}
              placeholder="VD: 25000000"
              className={`${FIELD_CLASS} h-11 pl-10 pr-20`}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-subtle">
              {t('salary.vndPerMonth')}
            </span>
          </div>

          {/* Badge xem trước mức lương quy đổi ra chữ */}
          {typeof grossAmount === 'number' && !Number.isNaN(grossAmount) && grossAmount > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-solid bg-brand-50/90 border border-brand-200/50 rounded-xl px-3 py-1.5 w-fit">
                <span>≈ {grossAmount.toLocaleString('vi-VN')} ₫</span>
                <span className="text-brand-300 font-normal">·</span>
                <span className="text-primary-solid font-medium">~{formatVndText(grossAmount, t)} {t('salary.perMonth')}</span>
              </div>
              {grossAmount > 150_000_000 && (
                <p className="flex items-center gap-1 text-xs text-warning font-medium">
                  <Info size={13} className="shrink-0 text-warning" />
                  {t('salary.monthlySalaryTip')}
                </p>
              )}
            </div>
          )}

          {errors.grossAmount && <p className="mt-1.5 text-xs text-danger">{errors.grossAmount.message}</p>}
        </div>

        {/* 4. Phân cách nhẹ cho nhóm thông tin bổ sung */}
        <div className="pt-2 border-t border-border">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-subtle">
              {t('salary.additionalInfo')}
            </span>
            <span className="text-xs text-text-subtle font-normal">{t('salary.optional')}</span>
          </div>

          <div className="space-y-3.5">
            {/* Địa điểm làm việc */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-muted">{t('salary.workLocation')}</label>
              <EntitySelectField<string>
                items={cityOptions}
                value={selectedCityId}
                onChange={handleCitySelect}
                placeholder={t('salary.selectCityPlaceholder')}
                searchPlaceholder={t('salary.searchCityPlaceholder')}
                searchable
                direction="top"
                buttonIcon={<MapPin size={15} className="text-primary-solid" />}
              />

              {errors.region && <p className="mt-1.5 text-xs text-danger">{errors.region.message}</p>}
            </div>

            {/* 2 Cột: Công ty & Kinh nghiệm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-muted">{t('salary.company')}</label>
                <div className="relative">
                  <Building2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
                  <input
                    {...register('company')}
                    placeholder="VD: FPT Software..."
                    className={`${FIELD_CLASS} h-11 pl-10 pr-3`}
                  />
                </div>
                {errors.company && <p className="mt-1.5 text-xs text-danger">{errors.company.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-muted">{t('salary.experience')}</label>
                <div className="relative">
                  <Clock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
                  <input
                    type="number"
                    step="1"
                    min={0}
                    max={60}
                    {...register('yearsExperience', { valueAsNumber: true })}
                    placeholder="VD: 2"
                    className={`${FIELD_CLASS} h-11 pl-10 pr-12`}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-text-subtle">
                    {t('salary.years')}
                  </span>
                </div>
                {errors.yearsExperience && <p className="mt-1.5 text-xs text-danger">{errors.yearsExperience.message}</p>}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
