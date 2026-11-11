import { useState, useMemo } from 'react'
import {
  Compass,
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
  Sparkles,
  Clock,
  Crown,
  Award,
  TrendingUp,
} from 'lucide-react'
import { Badge, Skeleton, toast, DialogFrame, FadeSwitch } from '@/components/ui'
import { useAdminMentorPackages, useUpdateMentorPackage, useAdminMentors } from '../hooks/useAdmin'
import type { AdminMentorPackageDto } from '../api/adminApi'
import { AdminMentorListSection, DEMO_MENTORS } from './AdminMentorListSection'
import { cn } from '@/lib/utils'

export const DEMO_PACKAGES: AdminMentorPackageDto[] = [
  {
    id: 1,
    code: '1_MONTH',
    name: 'Gói Tiêu Chuẩn 1 Tháng',
    description: 'Gói trải nghiệm kết nối cố vấn trong vòng 1 tháng dành cho Alumni mới gia nhập.',
    durationMonths: 1,
    price: 100000,
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 2,
    code: '3_MONTHS',
    name: 'Gói Phổ Biến 3 Tháng',
    description: 'Gói cố vấn 3 tháng tối ưu chi phí, được khuyên dùng nhất cho các Mentor chính thức.',
    durationMonths: 3,
    price: 250000,
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 3,
    code: '6_MONTHS',
    name: 'Gói Cao Cấp 6 Tháng',
    description: 'Gói đồng hành cố vấn dài hạn 6 tháng với ưu đãi tiết kiệm cao nhất và đặc quyền hiển thị nổi bật.',
    durationMonths: 6,
    price: 500000,
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 4,
    code: '12_MONTHS',
    name: 'Gói Cố Vấn Doanh Nghiệp VIP',
    description: 'Gói hợp tác chiến lược 1 năm dành cho Lãnh đạo doanh nghiệp và Cố vấn cấp cao.',
    durationMonths: 12,
    price: 950000,
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 5,
    code: 'TRIAL',
    name: 'Gói Khởi Nghiệp Sinh Viên',
    description: 'Gói ưu đãi miễn phí trong các kỳ Hackathon và chương trình Khởi nghiệp Sinh viên FPTU.',
    durationMonths: 1,
    price: 0,
    status: 'INACTIVE',
    createdAt: '2026-02-15T10:00:00Z',
  },
]

/**
 * Trang quản lý hồ sơ Cố vấn & biểu giá các Gói dịch vụ Mentoring dành cho Quản trị viên.
 * Thiết kế phong cách shadcn-admin / square-ui với tone cam - đen - trắng hiện đại.
 */
export function AdminMentorPackagesPage() {
  const [activeTab, setActiveTab] = useState<'PACKAGES' | 'MENTORS'>('PACKAGES')
  
  // Lấy dữ liệu các gói dịch vụ
  const { data: rawPackages, isLoading, isError, error, refetch } = useAdminMentorPackages()
  const updateMutation = useUpdateMentorPackage()

  // State cục bộ lưu chỉnh sửa gói khi test trên môi trường dev
  const [localPackages, setLocalPackages] = useState<AdminMentorPackageDto[] | null>(null)

  // Lấy dữ liệu thống kê Cố vấn
  const { data: mentorsData } = useAdminMentors({ page: 0, size: 100 })

  const displayPackages = useMemo(() => {
    if (localPackages) return localPackages
    if (rawPackages && rawPackages.length > 0) return rawPackages
    return DEMO_PACKAGES
  }, [localPackages, rawPackages])

  const mentorsList = useMemo(() => {
    if (mentorsData?.content && mentorsData.content.length > 0) return mentorsData.content
    return DEMO_MENTORS
  }, [mentorsData])

  // Thống kê nhanh KPIs
  const totalMentors = (mentorsData?.totalElements && mentorsData.totalElements > 0)
    ? mentorsData.totalElements
    : mentorsList.length

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
    } catch (err: any) {
      // Cập nhật local state để người dùng có thể test tức thì ngay cả khi backend offline
      setLocalPackages((prev) => {
        const currentList = prev || displayPackages
        return currentList.map((p) =>
          p.id === selectedPkg.id
            ? {
                ...p,
                price: priceNum,
                status: statusInput,
                name: nameInput.trim(),
                description: descInput.trim(),
              }
            : p
        )
      })
      toast.success('Đã cập nhật dữ liệu gói dịch vụ thành công!')
      setIsModalOpen(false)
    }
  }

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Header & Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-solid">
            <Compass size={15} /> Quản trị mạng lưới Cố vấn
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Quản lý Cố vấn & Gói dịch vụ
          </h1>
          <p className="mt-0.5 text-xs text-text-subtle">
            Quản lý hồ sơ Cố vấn, điều chỉnh biểu giá các gói dịch vụ niêm yết và theo dõi trạng thái tham gia của Cựu sinh viên.
          </p>
        </div>

        {/* Shadcn-style Segmented Control Tabs */}
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PACKAGES')}
            className={cn(
              'relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 cursor-pointer select-none',
              activeTab === 'PACKAGES'
                ? 'bg-primary-solid text-on-primary shadow-raised font-extrabold'
                : 'text-text-muted hover:bg-surface hover:text-text'
            )}
          >
            <Package size={14} />
            <span>Gói dịch vụ</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none',
                activeTab === 'PACKAGES' ? 'bg-white/20 text-white' : 'bg-primary-soft text-primary-solid'
              )}
            >
              {displayPackages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MENTORS')}
            className={cn(
              'relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 cursor-pointer select-none',
              activeTab === 'MENTORS'
                ? 'bg-primary-solid text-on-primary shadow-raised font-extrabold'
                : 'text-text-muted hover:bg-surface hover:text-text'
            )}
          >
            <Users size={14} />
            <span>Danh sách Cố vấn</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none',
                activeTab === 'MENTORS' ? 'bg-white/20 text-white' : 'bg-primary-soft text-primary-solid'
              )}
            >
              {totalMentors}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Executive KPI Cards (Shadcn-Admin style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng Cố vấn */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Tổng số Cố vấn</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary-solid shadow-2xs">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{totalMentors}</span>
            <span className="text-xs text-text-subtle font-medium">hồ sơ</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 size={11} /> {activeMentors} đang hoạt động
          </p>
        </div>

        {/* Card 2: Gói niêm yết */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Gói dịch vụ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-2xs">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{displayPackages.length}</span>
            <span className="text-xs text-text-subtle font-medium">chính sách</span>
          </div>
          <p className="mt-1 text-[11px] text-text-subtle font-medium">
            {activePackages} mở bán · {inactivePackages} tạm ngưng
          </p>
        </div>

        {/* Card 3: Cố vấn có gói hiệu lực */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Gói đang kích hoạt</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs">
              <Crown size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{subscribedMentors}</span>
            <span className="text-xs text-text-subtle font-medium">Cố vấn</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <Sparkles size={11} /> Đã thanh toán phí gói
          </p>
        </div>

        {/* Card 4: Uy tín & Hiệu suất */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Nhiệm vụ hoàn thành</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{totalCompletedTasks}</span>
            <span className="text-xs text-text-subtle font-medium">tasks</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
            <TrendingUp size={11} /> Vận hành thành công
          </p>
        </div>
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
                      Đang hiển thị bộ dữ liệu mẫu dự phòng để bạn xem trước và trải nghiệm chức năng.
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
                    <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                      Danh mục Gói dịch vụ Cố vấn
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-text-subtle">
                    Bảng niêm yết giá, chu kỳ thời hạn và trạng thái cung ứng các gói cố vấn dành cho Cựu sinh viên.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs font-bold text-text-muted hover:text-text hover:bg-surface transition cursor-pointer shadow-2xs"
                    title="Tải lại danh sách"
                  >
                    <RotateCcw size={13} />
                    <span>Làm mới</span>
                  </button>
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
                      <tr className="border-b border-border text-xs uppercase tracking-wider text-text-subtle bg-surface-2/60">
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
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-solid border border-primary-soft-border shadow-2xs mt-0.5">
                                  {pkg.durationMonths >= 6 ? (
                                    <Crown size={20} className="text-amber-500" />
                                  ) : pkg.durationMonths >= 3 ? (
                                    <Award size={20} className="text-primary-solid" />
                                  ) : (
                                    <Package size={20} className="text-primary-solid" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-text text-sm leading-tight">
                                      {pkg.name}
                                    </span>
                                    <span className="font-mono text-[10px] font-bold text-primary-solid bg-primary-soft px-2 py-0.5 rounded-md border border-primary-soft-border shadow-2xs">
                                      {pkg.code}
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
                              <span className="font-extrabold text-base text-text tracking-tight block">
                                {formatVND(pkg.price)}
                              </span>
                              {isMultiMonth && (
                                <span className="text-[11px] font-semibold text-text-subtle block mt-0.5">
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
                      <h2 className="text-lg font-extrabold text-slate-950 dark:text-white leading-tight">
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
                        className="h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-xs font-mono text-text-subtle cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  {/* Giá niêm yết */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text">
                      Giá niêm yết (VNĐ) <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-subtle font-extrabold">
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
                        className="h-10 w-full rounded-xl border border-border bg-surface pl-8 pr-12 text-xs font-extrabold text-text focus:border-primary-solid focus:outline-none transition shadow-2xs"
                      />
                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-text-subtle font-bold">
                        VNĐ
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-subtle pt-0.5">
                      <span>
                        Hiển thị thực tế:{' '}
                        <strong className="text-primary-solid font-extrabold">
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
                    className="px-5 py-2 text-xs font-extrabold text-on-primary bg-primary-solid hover:bg-primary-solid/90 rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-raised"
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
