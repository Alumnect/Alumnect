/**
 * ContributeSalaryModal — Modal đóng góp dữ liệu lương ẩn danh (UC50 - Contribute salary data) HOẶC
 * chỉnh sửa lượt đóng góp đã có (UC51 - Edit salary contribution).
 *
 * Trách nhiệm:
 *  - Form nhập chức danh + mức lương (bắt buộc), ngành nghề/công ty/địa điểm/kinh nghiệm (tùy chọn).
 *  - Validate bằng Zod (khớp Backend), gửi lên `POST /salary-contributions` (tạo) hoặc
 *    `PUT /salary-contributions/{id}` (sửa, truyền `editContribution`).
 *  - Chế độ SỬA: điền sẵn dữ liệu từ `editContribution` — chỉ mở được từ `MyContributionsModal`
 *    (đã đảm bảo chính chủ), Backend vẫn kiểm tra lại quyền sở hữu.
 *  - Nhấn mạnh cam kết ẩn danh — không hiển thị/thu thập tên, chỉ dùng để tổng hợp thống kê.
 */
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Loader2, ShieldCheck, LayoutGrid } from 'lucide-react'
import { Modal, Badge } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { createSalaryContributionSchema, MAX_GROSS_AMOUNT } from '../model/salary'
import type { CreateSalaryContributionInput, SalaryContribution } from '../model/salary'
import { useCreateSalaryContribution, useUpdateSalaryContribution, useIndustries } from '../hooks/useSalary'
import { EntitySelectField } from '@/features/forum/components/EntitySelectField'
import { PlaceAutocomplete } from '@/features/user/components/PlaceAutocomplete'

/** Class dùng chung cho các ô nhập liệu trong form. */
const FIELD_CLASS =
  'w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.03] px-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30'

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
  const isEdit = !!editContribution
  const { data: industries } = useIndustries()
  const createMut = useCreateSalaryContribution()
  const updateMut = useUpdateSalaryContribution(editContribution?.id ?? '')
  const { mutate, isPending, error } = isEdit ? updateMut : createMut

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateSalaryContributionInput>({
    resolver: zodResolver(createSalaryContributionSchema),
    defaultValues: {
      industryId: editContribution?.industryId ?? null,
      jobTitle: editContribution?.jobTitle ?? '',
      company: editContribution?.company ?? '',
      region: editContribution?.region ?? '',
      yearsExperience: editContribution?.yearsExperience ?? null,
      grossAmount: editContribution?.grossAmount ?? undefined,
    },
  })

  const industryId = watch('industryId')
  const grossAmount = watch('grossAmount')
  const formattedAmount = typeof grossAmount === 'number' && !Number.isNaN(grossAmount) ? grossAmount.toLocaleString('vi-VN') : ''

  const onSubmit = (values: CreateSalaryContributionInput) => {
    mutate(
      {
        ...values,
        company: values.company?.trim() || undefined,
        region: values.region?.trim() || undefined,
      },
      { onSuccess },
    )
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
        Hủy
      </Button>
      <Button
        type="submit"
        form="contribute-salary-form"
        variant="gold"
        disabled={isPending}
        leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
      >
        {isEdit ? (isPending ? 'Đang lưu…' : 'Lưu thay đổi') : isPending ? 'Đang gửi…' : 'Gửi đóng góp'}
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen
      onClose={isPending ? () => {} : onClose}
      title={isEdit ? 'Chỉnh sửa dữ liệu lương' : 'Đóng góp dữ liệu lương'}
      icon={<ShieldCheck size={18} className="text-brand-600" />}
      footer={footer}
    >
      <div className="mb-4 flex items-start gap-2">
        <Badge tone="success" icon={<ShieldCheck size={13} />}>
          Ẩn danh 100%
        </Badge>
        <p className="pt-0.5 text-xs text-plum-500">Hệ thống không lưu tên/thông tin định danh cùng dữ liệu lương bạn đóng góp.</p>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
          <AlertTriangle size={16} className="shrink-0" /> {(error as Error).message}
        </div>
      )}

      <form id="contribute-salary-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-plum-600">Chức danh công việc *</label>
          <input {...register('jobTitle')} placeholder="VD: Backend Developer" className={`${FIELD_CLASS} h-11`} />
          {errors.jobTitle && <p className="mt-1 text-xs text-rose-500">{errors.jobTitle.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-plum-600">Mức lương gộp / tháng (VNĐ) *</label>
          <input
            type="number"
            step="1"
            min={0}
            max={MAX_GROSS_AMOUNT}
            {...register('grossAmount', { valueAsNumber: true })}
            placeholder="VD: 20000000"
            className={`${FIELD_CLASS} h-11`}
          />
          {formattedAmount && <p className="mt-1 text-xs text-plum-400">≈ {formattedAmount} ₫</p>}
          {errors.grossAmount && <p className="mt-1 text-xs text-rose-500">{errors.grossAmount.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-plum-600">Ngành nghề</label>
          <EntitySelectField
            items={industries}
            value={industryId}
            onChange={(id) => setValue('industryId', id, { shouldDirty: true })}
            placeholder="Tất cả ngành nghề"
            buttonIcon={<LayoutGrid size={15} className="text-brand-600" />}
          />
        </div>

        {/* Địa điểm để riêng 1 hàng full-width — ô input này rộng bằng đúng khung gợi ý autocomplete
            (PlaceAutocomplete dùng w-full), nhét chung 2 cột với Công ty sẽ làm khung gợi ý bị bóp
            hẹp, dễ xuống dòng xấu. */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-plum-600">Địa điểm</label>
          <Controller
            control={control}
            name="region"
            render={({ field }) => (
              <PlaceAutocomplete
                value={field.value || ''}
                onChange={(val) => field.onChange(val)}
                onSelect={(place) => field.onChange(place?.location || '')}
                placeholder="VD: TP.HCM, Hà Nội..."
                inputClassName="!rounded-xl !py-0 h-11 text-sm"
              />
            )}
          />
          {errors.region && <p className="mt-1 text-xs text-rose-500">{errors.region.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-plum-600">Công ty</label>
            <input {...register('company')} placeholder="Tùy chọn" className={`${FIELD_CLASS} h-11`} />
            {errors.company && <p className="mt-1 text-xs text-rose-500">{errors.company.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-plum-600">Số năm kinh nghiệm</label>
            <input
              type="number"
              step="1"
              min={0}
              max={60}
              {...register('yearsExperience', { valueAsNumber: true })}
              placeholder="Tùy chọn"
              className={`${FIELD_CLASS} h-11`}
            />
            {errors.yearsExperience && <p className="mt-1 text-xs text-rose-500">{errors.yearsExperience.message}</p>}
          </div>
        </div>
      </form>
    </Modal>
  )
}
