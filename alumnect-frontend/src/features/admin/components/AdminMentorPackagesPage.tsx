import { useState, useMemo } from 'react'
import {
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  WifiOff,
  Package,
  Users,
  X,
  Loader2,
  Clock,
  Award,
} from 'lucide-react'
import { Skeleton, toast, DialogFrame, FadeSwitch } from '@/components/ui'
import { useAdminMentorPackages, useUpdateMentorPackage, useAdminMentors } from '../hooks/useAdmin'
import type { AdminMentorPackageDto } from '../api/adminApi'
import { AdminMentorListSection } from './AdminMentorListSection'
import { AdminPageBanner, StatTile } from './AdminVisuals'
import { cn } from '@/lib/utils'

/**
 * Trang quản lý hồ sơ Cố vấn & biểu giá các Gói dịch vụ Mentoring dành cho Quản trị viên.
 * Thiết kế phong cách shadcn-admin / square-ui với tone cam - đen - trắng hiện đại.
 */
export function AdminMentorPackagesPage() {
  const [activeTab, setActiveTab] = useState<'PACKAGES' | 'MENTORS'>('PACKAGES')
  
  // Lấy dữ liệu các gói dịch vụ
  const { data: rawPackages, isLoading, isError, refetch } = useAdminMentorPackages()
  const updateMutation = useUpdateMentorPackage()

  // Lấy dữ liệu thống kê Cố vấn
  const { data: mentorsData } = useAdminMentors({ page: 0, size: 100 })

  // Chỉ dùng dữ liệu thật từ backend
  const displayPackages = useMemo(() => rawPackages ?? [], [rawPackages])
  const mentorsList = useMemo(() => mentorsData?.content ?? [], [mentorsData])

  // Thống kê nhanh KPIs
  const totalMentors = mentorsData?.totalElements ?? mentorsList.length

  const activeMentors = useMemo(
    () => mentorsList.filter((m) => m.mentorStatus === 'ACTIVE').length,
    [mentorsList]
  )
  const subscribedMentors = useMemo(
    () =>
      mentorsList.filter(
        (m) => m.subscriptionStatus === 'ACTIVE' || m.subscriptionStatus === 'PAID'
      ).length,
    [mentorsList]
  )
  const totalCompletedTasks = useMemo(
    () =>
      mentorsList.reduce((acc, m) => acc + (m.completedTasks ?? 0), 0),
    [mentorsList]
  )

  const activePackages = displayPackages.filter((p) => p.status === 'ACTIVE').length
  const inactivePackages = displayPackages.filter((p) => p.status === 'INACTIVE').length

  // State quản lý Modal chỉnh sửa gói dịch vụ
  const [selectedPkg, setSelectedPkg] = useState<AdminMentorPackageDto | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form state
  const [priceInput, setPriceInput] = useState<string>('')
  const [statusInput, setStatusInput] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [nameInput, setNameInput] = useState<string>('')
  const [descInput, setDescInput] = useState<string>('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleOpenEdit = (pkg: AdminMentorPackageDto) => {
    setSelectedPkg(pkg)
    setPriceInput(pkg.price.toString())
    setStatusInput(pkg.status)
    setNameInput(pkg.name)
    setDescInput(pkg.description || '')
    setValidationError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (updateMutation.isPending) return
    if (selectedPkg) {
      const isChanged =
        priceInput !== selectedPkg.price.toString() ||
        statusInput !== selectedPkg.status ||
        nameInput !== selectedPkg.name ||
        descInput !== (selectedPkg.description || '')

      if (isChanged) {
        const confirmed = window.confirm(
          'Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng và hủy bỏ chỉnh sửa?'
        )
        if (!confirmed) return
      }
    }
    setIsModalOpen(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPkg) return

    if (!nameInput.trim()) {
      setValidationError('Vui lòng nhập tên gói dịch vụ')
      return
    }

    const priceNum = parseFloat(priceInput)
    if (isNaN(priceNum) || priceNum < 0) {
      setValidationError('Giá gói dịch vụ phải là số hợp lệ lớn hơn hoặc bằng 0')
      return
    }

    setValidationError(null)

    try {
      await updateMutation.mutateAsync({
        id: selectedPkg.id,
        payload: {
          price: priceNum,
          status: statusInput,
          name: nameInput.trim(),
          description: descInput.trim(),
        },
      })
      toast.success('Cập nhật gói dịch vụ thành công')
      setIsModalOpen(false)
    } catch (err) {
      // Lưu thất bại: giữ modal mở để Admin sửa lại, không báo thành công giả
      toast.error((err as Error)?.message || 'Không thể cập nhật gói dịch vụ. Vui lòng thử lại.')
    }
  }

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Dải đầu trang + chuyển khung xem */}
      <AdminPageBanner
        title="Cố vấn & gói dịch vụ"
        scene="packages"
        actions={
          <div role="tablist" aria-label="Khung xem" className="inline-flex rounded-2xl border border-[#F3D9C8] bg-white/80 p-1 backdrop-blur dark:border-border dark:bg-surface">
            {(
              [
                { key: 'PACKAGES', label: 'Gói dịch vụ', count: displayPackages.length, icon: <Package size={15} /> },
                { key: 'MENTORS', label: 'Danh sách cố vấn', count: totalMentors, icon: <Users size={15} /> },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                  activeTab === tab.key ? 'bg-[#1F2A44] text-white shadow-sm' : 'text-text-muted hover:text-text'
                )}
              >
                {tab.icon}
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-bold leading-none tabular-nums',
                    activeTab === tab.key ? 'bg-white/15 text-white' : 'bg-surface-2 text-text-subtle'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        }
      />

      {/* 2. Số liệu */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile icon={<Users />} tone="orange" label="Cố vấn" value={totalMentors} hint={`${activeMentors} đang hoạt động`} />
        <StatTile icon={<CheckCircle2 />} tone="green" label="Có gói hiệu lực" value={subscribedMentors} />
        <StatTile icon={<Package />} tone="blue" label="Gói đang mở bán" value={activePackages} hint={`${inactivePackages} gói tạm ngưng`} />
        <StatTile icon={<Award />} tone="violet" label="Nhiệm vụ hoàn thành" value={totalCompletedTasks} />
      </div>
      {/* 3. Main Views Switching */}
      <FadeSwitch id={activeTab}>
        {/* Tab 2: Danh sách Cố vấn */}
        {activeTab === 'MENTORS' && <AdminMentorListSection />}

        {/* Tab 1: Quản lý Gói dịch vụ */}
        {activeTab === 'PACKAGES' && (
          <div className="space-y-4">
            {/* Cảnh báo khi mất kết nối */}
            {isError && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-danger-border bg-danger-soft p-4 text-text shadow-2xs">
                <div className="flex items-start gap-3">
                  <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-semibold text-sm text-danger block">
                      Không thể tải dữ liệu gói dịch vụ từ máy chủ
                    </span>
                    <span className="text-text-muted">
                      Vui lòng kiểm tra kết nối rồi thử lại.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text hover:bg-surface-2 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Thử lại kết nối
                </button>
              </div>
            )}

            {/* BẢNG GÓI DỊCH VỤ DUY NHẤT (Single Unified Card Container) */}
            <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border p-5 bg-surface">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary-solid shadow-2xs">
                      <Package size={15} />
                    </span>
                    <h2 className="text-base font-bold text-text">
                      Danh mục Gói dịch vụ Cố vấn
                    </h2>
                  </div>
                </div>
              </div>

              {/* Loading Skeleton */}
              {isLoading && (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4 bg-primary-soft" />
                        <Skeleton className="h-3 w-1/2 bg-primary-soft" />
                      </div>
                      <Skeleton className="h-8 w-24 bg-primary-soft rounded-xl" />
                    </div>
                  ))}
                </div>
              )}

              {/* Table rendering - 100% width, No Horizontal Scrollbar */}
              {!isLoading && displayPackages.length > 0 && (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-border text-xs text-text-subtle bg-surface-2/60">
                        <th className="px-5 py-3.5 font-bold w-[40%]">Thông tin gói dịch vụ</th>
                        <th className="px-4 py-3.5 font-bold text-center w-[15%]">Thời lượng</th>
                        <th className="px-5 py-3.5 font-bold text-right w-[20%]">Giá niêm yết</th>
                        <th className="px-4 py-3.5 font-bold text-center w-[15%]">Trạng thái</th>
                        <th className="px-5 py-3.5 font-bold text-right w-[10%]">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {displayPackages.map((pkg) => {
                        const isActive = pkg.status === 'ACTIVE'
                        const isMultiMonth = pkg.durationMonths > 1
                        const monthlyPrice = Math.round(pkg.price / (pkg.durationMonths || 1))

                        return (
                          <tr key={pkg.id} className="transition-colors hover:bg-surface-2/50">
                            {/* Cột 1: Thông tin gói & Code & Mô tả */}
                            <td className="px-5 py-4">
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-text text-sm leading-tight">
                                      {pkg.name}
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-subtle mt-1 line-clamp-1 leading-relaxed" title={pkg.description}>
                                    {pkg.description || 'Chưa có mô tả chi tiết quyền lợi gói.'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Cột 2: Thời lượng */}
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface-2 px-2.5 py-1 text-xs font-bold text-text-muted shadow-2xs whitespace-nowrap">
                                <Clock size={12} className="text-primary-solid" />
                                <span>{pkg.durationMonths} Tháng</span>
                              </span>
                            </td>

                            {/* Cột 3: Giá niêm yết */}
                            <td className="px-5 py-4 text-right">
                              <span className="font-bold text-base text-text tracking-tight block">
                                {formatVND(pkg.price)}
                              </span>
                              {isMultiMonth && (
                                <span className="text-xs font-semibold text-text-subtle block mt-0.5">
                                  ~{formatVND(monthlyPrice)} / tháng
                                </span>
                              )}
                            </td>

                            {/* Cột 4: Trạng thái */}
                            <td className="px-4 py-4 text-center">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 shadow-2xs whitespace-nowrap">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                  Đang mở bán
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/60 shadow-2xs whitespace-nowrap">
                                  <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                                  Tạm ngưng
                                </span>
                              )}
                            </td>

                            {/* Cột 5: Thao tác */}
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(pkg)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-primary-soft-border bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-solid transition duration-150 hover:bg-primary-soft/80 shadow-2xs cursor-pointer whitespace-nowrap"
                                title="Chỉnh sửa thông tin gói"
                              >
                                <Edit3 size={13} />
                                <span>Chỉnh sửa</span>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!isLoading && !isError && displayPackages.length === 0 && (
                <p className="px-5 py-12 text-center text-sm text-text-subtle">
                  Chưa có gói dịch vụ nào trong hệ thống.
                </p>
              )}
            </div>

            {/* Modal Chỉnh sửa Gói dịch vụ */}
            {isModalOpen && selectedPkg && (
              <DialogFrame
                onClose={handleCloseModal}
                zIndexClassName="z-50"
                maxWidthClassName="max-w-xl"
                className="z-10 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary-solid shadow-2xs">
                      <Edit3 size={16} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-text leading-tight">
                        Chỉnh sửa gói dịch vụ
                      </h2>
                      <p className="text-xs text-text-subtle mt-0.5">
                        Cập nhật mức giá, mô tả và trạng thái mở bán của gói.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="p-1.5 text-text-subtle hover:text-text hover:bg-surface-2 rounded-xl transition-colors cursor-pointer"
                    aria-label="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form Body */}
                <form
                  id="edit-package-form"
                  onSubmit={handleSave}
                  className="flex-1 overflow-y-auto p-6 space-y-4.5"
                >
                  {/* Tên gói & Mã gói */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-text">
                        Tên gói dịch vụ <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-text focus:border-primary-solid focus:outline-none transition shadow-2xs"
                        placeholder="Nhập tên gói dịch vụ..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-text">
                        Mã gói & Thời lượng
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`${selectedPkg.code} (${selectedPkg.durationMonths} Tháng)`}
                        className="h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-xs tabular-nums text-text-subtle cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  {/* Giá niêm yết */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text">
                      Giá niêm yết (VNĐ) <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-subtle font-bold">
                        ₫
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        required
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        placeholder="Nhập số tiền..."
                        className="h-10 w-full rounded-xl border border-border bg-surface pl-8 pr-12 text-xs font-bold text-text focus:border-primary-solid focus:outline-none transition shadow-2xs"
                      />
                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-text-subtle font-bold">
                        VNĐ
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-subtle pt-0.5">
                      <span>
                        Hiển thị thực tế:{' '}
                        <strong className="text-primary-solid font-bold">
                          {formatVND(parseFloat(priceInput) || 0)}
                        </strong>
                      </span>
                      <span>{selectedPkg.durationMonths} tháng</span>
                    </div>
                  </div>

                  {/* Trạng thái hoạt động */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-text">
                      Trạng thái cung ứng <span className="text-danger">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setStatusInput('ACTIVE')}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left',
                          statusInput === 'ACTIVE'
                            ? 'border-primary-solid bg-primary-soft text-primary-solid shadow-xs'
                            : 'border-border bg-surface text-text-muted hover:bg-surface-2'
                        )}
                      >
                        <CheckCircle2
                          className={cn('h-4 w-4 shrink-0', statusInput === 'ACTIVE' ? 'text-primary-solid' : 'text-text-subtle')}
                        />
                        <span>Đang mở bán</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatusInput('INACTIVE')}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left',
                          statusInput === 'INACTIVE'
                            ? 'border-primary-solid bg-primary-soft text-primary-solid shadow-xs'
                            : 'border-border bg-surface text-text-muted hover:bg-surface-2'
                        )}
                      >
                        <XCircle
                          className={cn('h-4 w-4 shrink-0', statusInput === 'INACTIVE' ? 'text-primary-solid' : 'text-text-subtle')}
                        />
                        <span>Tạm ngưng áp dụng</span>
                      </button>
                    </div>
                  </div>

                  {/* Mô tả chi tiết */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text">
                      Mô tả chi tiết quyền lợi gói
                    </label>
                    <textarea
                      rows={3}
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      placeholder="Nhập mô tả quyền lợi dành cho cố vấn..."
                      className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text leading-relaxed focus:border-primary-solid focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  {/* Validation error box */}
                  {validationError && (
                    <div className="rounded-xl border border-danger-border bg-danger-soft p-3 text-xs text-danger font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
                      <span>{validationError}</span>
                    </div>
                  )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-surface shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={updateMutation.isPending}
                    className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text bg-surface border border-border hover:bg-surface-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    form="edit-package-form"
                    disabled={updateMutation.isPending}
                    className="px-5 py-2 text-xs font-bold text-on-primary bg-primary-solid hover:bg-primary-solid/90 rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-raised"
                  >
                    {updateMutation.isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </DialogFrame>
            )}
          </div>
        )}
      </FadeSwitch>
    </div>
  )
}
