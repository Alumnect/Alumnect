import { useState } from 'react'
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
} from 'lucide-react'
import { Badge, Card, Skeleton, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAdminMentorPackages, useUpdateMentorPackage } from '../hooks/useAdmin'
import type { AdminMentorPackageDto } from '../api/adminApi'
import { AdminMentorListSection } from './AdminMentorListSection'

const DEFAULT_FALLBACK_PACKAGES: AdminMentorPackageDto[] = [
  {
    id: 1,
    code: '1 Tháng',
    name: 'Gói Tiêu Chuẩn 1 Tháng',
    description: 'Gói trải nghiệm kết nối cố vấn trong vòng 1 tháng dành cho cựu sinh viên mới gia nhập.',
    durationMonths: 1,
    price: 100000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    code: '3 Tháng',
    name: 'Gói Phổ Biến 3 Tháng',
    description: 'Gói cố vấn 3 tháng tối ưu chi phí, được khuyên dùng nhất cho các Cố vấn chính thức.',
    durationMonths: 3,
    price: 250000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    code: '6 Tháng',
    name: 'Gói Cao Cấp 6 Tháng',
    description: 'Gói đồng hành cố vấn dài hạn 6 tháng với mức tiết kiệm cao nhất.',
    durationMonths: 6,
    price: 500000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
]

/**
 * Trang quản lý giá và trạng thái các gói dịch vụ cố vấn dành cho Quản trị viên.
 */
export function AdminMentorPackagesPage() {
  const [activeTab, setActiveTab] = useState<'PACKAGES' | 'MENTORS'>('PACKAGES')
  const { data: rawPackages, isLoading, isError, error, refetch } = useAdminMentorPackages()
  const updateMutation = useUpdateMentorPackage()

  // Sử dụng dữ liệu thực tế từ hệ thống hoặc danh sách mặc định khi mất kết nối
  const displayPackages = rawPackages && rawPackages.length > 0 ? rawPackages : DEFAULT_FALLBACK_PACKAGES

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
      const errMsg = err?.message || 'Có lỗi xảy ra khi cập nhật gói dịch vụ'
      setValidationError(errMsg)
      toast.error(errMsg)
    }
  }

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-slate-900 leading-tight">
            Quản lý Cố vấn & Gói dịch vụ
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Quản lý hồ sơ cố vấn, thông tin gói dịch vụ và trạng thái cung cấp.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs">
            <Compass className="h-4 w-4 text-[#F27024]" />
            <span>Phân hệ Cố vấn</span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tab Bar */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('PACKAGES')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === 'PACKAGES'
              ? 'border-[#F27024] text-[#F27024] font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Gói dịch vụ Cố vấn</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MENTORS')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === 'MENTORS'
              ? 'border-[#F27024] text-[#F27024] font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Danh sách Cố vấn</span>
        </button>
      </div>

      {/* Tab 2: Danh sách Cố vấn */}
      {activeTab === 'MENTORS' && <AdminMentorListSection />}

      {/* Tab 1: Quản lý Gói dịch vụ */}
      {activeTab === 'PACKAGES' && (
        <div className="space-y-4">
          {/* Cảnh báo khi mất kết nối */}
          {isError && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50/60 p-4 text-slate-800">
              <div className="flex items-start gap-3">
                <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold text-sm text-red-900 block">
                    Không thể tải dữ liệu gói dịch vụ
                  </span>
                  <span className="text-slate-600">
                    {(error as any)?.message ||
                      'Hệ thống tạm thời không thể kết nối tới máy chủ. Vui lòng thử lại.'}
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => refetch()}
                className="gap-1.5 bg-white text-slate-700 border-slate-300 hover:bg-slate-50 text-xs shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Thử lại kết nối
              </Button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <Card hover={false} className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Bảng Quản trị Danh sách Gói dịch vụ */}
          {!isLoading && displayPackages && (
            <Card hover={false} className="p-0 border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                      <th className="px-5 py-3.5 w-[35%]">Thông tin gói dịch vụ</th>
                      <th className="px-4 py-3.5 w-[15%]">Thời lượng</th>
                      <th className="px-5 py-3.5 text-right w-[20%]">Giá niêm yết</th>
                      <th className="px-4 py-3.5 text-center w-[15%]">Trạng thái</th>
                      <th className="px-5 py-3.5 text-right w-[15%]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayPackages.map((pkg) => {
                      const isActive = pkg.status === 'ACTIVE'
                      return (
                        <tr key={pkg.id} className="transition-colors hover:bg-slate-50/70">
                          {/* Tên & Mô tả */}
                          <td className="px-5 py-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-sm">
                                  {pkg.name}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {pkg.code}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {pkg.description || 'Chưa có mô tả chi tiết.'}
                              </p>
                            </div>
                          </td>

                          {/* Thời lượng */}
                          <td className="px-4 py-4 text-xs font-medium text-slate-700">
                            <span>{pkg.durationMonths} Tháng</span>
                          </td>

                          {/* Giá niêm yết */}
                          <td className="px-5 py-4 text-right">
                            <span className="font-semibold text-slate-900 text-sm">
                              {formatVND(pkg.price)}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              / {pkg.durationMonths} tháng
                            </span>
                          </td>

                          {/* Trạng thái */}
                          <td className="px-4 py-4 text-center">
                            <Badge
                              tone={isActive ? 'success' : 'neutral'}
                              className="px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1"
                            >
                              {isActive ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" /> Đang mở bán
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" /> Tạm ngưng
                                </>
                              )}
                            </Badge>
                          </td>

                          {/* Thao tác */}
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(pkg)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                              <span>Chỉnh sửa</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Modal Chỉnh sửa Gói dịch vụ */}
          {isModalOpen && selectedPkg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-slate-900/50 transition-opacity"
                onClick={handleCloseModal}
              />

              {/* Modal Box */}
              <div className="relative z-10 w-full max-w-xl max-h-[90vh] bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                  <div>
                    <h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
                      Chỉnh sửa gói dịch vụ
                    </h2>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      Cập nhật thông tin giá, mô tả và trạng thái mở bán của gói.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    aria-label="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form Body */}
                <form
                  id="edit-package-form"
                  onSubmit={handleSave}
                  className="flex-1 overflow-y-auto p-6 space-y-4"
                >
                  {/* Tên gói & Mã gói */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-slate-700">
                        Tên gói dịch vụ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#F27024] focus:outline-none focus:ring-1 focus:ring-[#F27024]"
                        placeholder="Nhập tên gói dịch vụ..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-slate-700">
                        Mã gói & Thời lượng
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`${selectedPkg.code} (${selectedPkg.durationMonths} Tháng)`}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Giá niêm yết */}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-slate-700">
                      Giá niêm yết (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-medium">
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
                        className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-12 py-2 text-sm text-slate-800 font-medium focus:border-[#F27024] focus:outline-none focus:ring-1 focus:ring-[#F27024]"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                        VNĐ
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500">
                      Định dạng hiển thị:{' '}
                      <span className="font-semibold text-slate-800">
                        {formatVND(parseFloat(priceInput) || 0)}
                      </span>{' '}
                      / {selectedPkg.durationMonths} tháng
                    </p>
                  </div>

                  {/* Trạng thái hoạt động */}
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium text-slate-700">
                      Trạng thái hoạt động <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                          statusInput === 'ACTIVE'
                            ? 'border-[#F27024] bg-orange-50/50 text-[#F27024]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value="ACTIVE"
                          checked={statusInput === 'ACTIVE'}
                          onChange={() => setStatusInput('ACTIVE')}
                          className="text-[#F27024] focus:ring-[#F27024]"
                        />
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Đang mở bán</span>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                          statusInput === 'INACTIVE'
                            ? 'border-[#F27024] bg-orange-50/50 text-[#F27024]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value="INACTIVE"
                          checked={statusInput === 'INACTIVE'}
                          onChange={() => setStatusInput('INACTIVE')}
                          className="text-[#F27024] focus:ring-[#F27024]"
                        />
                        <XCircle className="h-4 w-4 text-slate-400" />
                        <span>Tạm ngưng áp dụng</span>
                      </label>
                    </div>
                  </div>

                  {/* Mô tả chi tiết */}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-slate-700">
                      Mô tả chi tiết quyền lợi gói
                    </label>
                    <textarea
                      rows={3}
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      placeholder="Nhập mô tả quyền lợi dành cho cố vấn..."
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 leading-relaxed focus:border-[#F27024] focus:outline-none focus:ring-1 focus:ring-[#F27024]"
                    />
                  </div>

                  {/* Validation error box */}
                  {validationError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                      <span>{validationError}</span>
                    </div>
                  )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={updateMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    form="edit-package-form"
                    disabled={updateMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#F27024] hover:bg-[#d95d16] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                  >
                    {updateMutation.isPending && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                    {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
