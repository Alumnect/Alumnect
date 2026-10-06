import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Compass,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  Check,
  WifiOff,
  Package,
  Users,
} from 'lucide-react'
import { PageHeader, Badge, Card, Skeleton, Modal, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
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
  const displayPackages = (rawPackages && rawPackages.length > 0) ? rawPackages : DEFAULT_FALLBACK_PACKAGES

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPkg) return

    const priceNum = parseFloat(priceInput)
    if (isNaN(priceNum) || priceNum < 0) {
      setValidationError('Giá gói dịch vụ phải là số hợp lệ lớn hơn hoặc bằng 0')
      toast.error('Giá gói dịch vụ không hợp lệ')
      return
    }

    setValidationError(null)

    try {
      await updateMutation.mutateAsync({
        id: selectedPkg.id,
        payload: {
          price: priceNum,
          status: statusInput,
          name: nameInput,
          description: descInput,
        },
      })
      toast.success('Cập nhật gói dịch vụ thành công!')
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
      <PageHeader
        title="Quản lý Cố vấn & Gói dịch vụ"
        description="Cấu hình biểu phí các gói dịch vụ và quản lý, tra cứu hồ sơ của các Cố vấn trên hệ thống."
        action={
          <Badge tone="neutral" size="md" className="gap-1.5 font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs">
            <Compass className="h-4 w-4 text-[#F27024]" /> Quản trị Cố vấn
          </Badge>
        }
      />

      {/* Navigation Tab Bar chia 2 mục */}
      <div className="flex items-center gap-3 border-b border-plum-900/10 pb-3">
        <button
          onClick={() => setActiveTab('PACKAGES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${activeTab === 'PACKAGES'
            ? 'bg-gradient-to-r from-[#F27024] via-[#f57c32] to-[#ff8c38] text-white shadow-md shadow-[#F27024]/25 scale-[1.02]'
            : 'bg-white text-slate-700 hover:bg-orange-50 hover:text-[#F27024] border border-slate-200/80 shadow-sm'
            }`}
        >
          <Package className="h-4 w-4" /> Gói dịch vụ Cố vấn
        </button>

        <button
          onClick={() => setActiveTab('MENTORS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${activeTab === 'MENTORS'
            ? 'bg-gradient-to-r from-[#F27024] via-[#f57c32] to-[#ff8c38] text-white shadow-md shadow-[#F27024]/25 scale-[1.02]'
            : 'bg-white text-slate-700 hover:bg-orange-50 hover:text-[#F27024] border border-slate-200/80 shadow-sm'
            }`}
        >
          <Users className="h-4 w-4" /> Danh sách Cố vấn
        </button>
      </div>

      {/* Tab 2: Danh sách Cố vấn */}
      {activeTab === 'MENTORS' && <AdminMentorListSection />}

      {/* Tab 1: Quản lý Gói dịch vụ */}
      {activeTab === 'PACKAGES' && (
        <div className="space-y-6">

          {/* Cảnh báo khi mất kết nối CSDL hoặc lỗi Token */}
          {/* Error Banner */}
          {isError && (
            <Reveal>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-rose-50/70 p-4 text-rose-900 shadow-sm">
                <div className="flex items-start gap-3">
                  <WifiOff className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-bold text-sm block mb-0.5">Không thể tải dữ liệu gói dịch vụ</span>
                    <span>{(error as any)?.message || 'Hệ thống tạm thời không thể kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền và thử lại.'}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="gap-1.5 border-rose-300 bg-white font-bold text-rose-700 hover:bg-rose-100 flex-shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Thử lại kết nối
                </Button>
              </div>
            </Reveal>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/2 rounded-xl" />
                  <Skeleton className="h-10 w-3/4 rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </Card>
              ))}
            </div>
          )}

          {/* Main package cards grid */}
          {!isLoading && displayPackages && (
            <div className="grid gap-6 md:grid-cols-3">
              {displayPackages.map((pkg) => {
                const isActive = pkg.status === 'ACTIVE'
                return (
                  <motion.div
                    key={pkg.id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`relative flex flex-col justify-between overflow-hidden p-6 transition-all ${isActive
                        ? 'border-brand-500/30 bg-white shadow-xl shadow-plum-900/5 ring-1 ring-brand-500/20'
                        : 'border-plum-900/10 bg-slate-50/70 opacity-80'
                        }`}
                    >
                      {/* Top Badge & Duration */}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600">
                            <Clock className="h-3.5 w-3.5" />
                            {pkg.durationMonths} Tháng
                          </span>
                          <Badge tone={isActive ? 'mint' : 'rose'} size="md">
                            {isActive ? (
                              <span className="flex items-center gap-1 font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Đang mở bán
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-bold">
                                <XCircle className="h-3.5 w-3.5" /> Tạm ngưng
                              </span>
                            )}
                          </Badge>
                        </div>

                        <h3 className="mt-4 text-lg font-extrabold text-plum-900">{pkg.name}</h3>
                        <p className="text-xs text-plum-400 font-mono">Mã gói: {pkg.code}</p>

                        {/* Price display */}
                        <div className="my-5 rounded-2xl bg-cream-100/80 p-4 border border-plum-900/5">
                          <span className="text-xs font-semibold text-plum-500 block">Giá niêm yết</span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-black text-plum-900 text-gradient">
                              {formatVND(pkg.price)}
                            </span>
                            <span className="text-xs text-plum-400">/ {pkg.durationMonths} tháng</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs leading-relaxed text-plum-600 mb-6">
                          {pkg.description || 'Chưa có mô tả quyền lợi.'}
                        </p>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant={isActive ? 'primary' : 'secondary'}
                        className={`w-full justify-center gap-2 rounded-2xl font-bold shadow-md transition-all duration-200 cursor-pointer ${isActive
                          ? 'bg-gradient-to-r from-[#F27024] via-[#f57c32] to-[#ff8c38] text-white hover:from-[#e05f13] hover:to-[#f27024] shadow-[#F27024]/25 border-none hover:scale-[1.01] active:scale-[0.99]'
                          : 'bg-white text-slate-700 hover:bg-orange-50 hover:text-[#F27024] border border-slate-300/80 shadow-sm'
                          }`}
                        onClick={() => handleOpenEdit(pkg)}
                      >
                        <Edit3 className="h-4 w-4" /> Chỉnh sửa gói dịch vụ
                      </Button>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Edit Modal */}
          {isModalOpen && selectedPkg && (
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title={`Chỉnh sửa gói dịch vụ: ${selectedPkg.name}`}
            >
              <form onSubmit={handleSave} className="space-y-4 pt-2">
                {/* Price Input */}
                <div>
                  <label className="block text-xs font-bold text-plum-800 mb-1">
                    Giá niêm yết (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-plum-400 text-sm font-bold">₫</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-full rounded-2xl border border-plum-900/15 bg-white pl-8 pr-4 py-2.5 text-sm font-bold text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      placeholder="Nhập giá gói..."
                      required
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-plum-400">
                    Giá xem trước: <span className="font-bold text-brand-600">{formatVND(parseFloat(priceInput) || 0)}</span>
                  </p>
                </div>

                {/* Status Radio */}
                <div>
                  <label className="block text-xs font-bold text-plum-800 mb-2">
                    Trạng thái hoạt động <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center justify-center gap-2 rounded-2xl border p-3 cursor-pointer text-xs font-bold transition-all ${statusInput === 'ACTIVE'
                        ? 'border-mint-500 bg-mint-500/10 text-mint-700 shadow-sm'
                        : 'border-plum-900/10 bg-cream-50 text-plum-600 hover:bg-cream-100'
                        }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="ACTIVE"
                        checked={statusInput === 'ACTIVE'}
                        onChange={() => setStatusInput('ACTIVE')}
                        className="sr-only"
                      />
                      <CheckCircle2 className="h-4 w-4" /> Đang mở bán
                    </label>

                    <label
                      className={`flex items-center justify-center gap-2 rounded-2xl border p-3 cursor-pointer text-xs font-bold transition-all ${statusInput === 'INACTIVE'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-700 shadow-sm'
                        : 'border-plum-900/10 bg-cream-50 text-plum-600 hover:bg-cream-100'
                        }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="INACTIVE"
                        checked={statusInput === 'INACTIVE'}
                        onChange={() => setStatusInput('INACTIVE')}
                        className="sr-only"
                      />
                      <XCircle className="h-4 w-4" /> Tạm ngưng áp dụng
                    </label>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-xs font-bold text-plum-800 mb-1">
                    Tên gói dịch vụ
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full rounded-2xl border border-plum-900/15 bg-white px-4 py-2 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-xs font-bold text-plum-800 mb-1">
                    Mô tả chi tiết quyền lợi gói
                  </label>
                  <textarea
                    rows={3}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    className="w-full rounded-2xl border border-plum-900/15 bg-white px-4 py-2 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Validation error box */}
                {validationError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-3 text-xs text-rose-600 font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {validationError}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-plum-900/10">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={updateMutation.isPending}
                    className="rounded-2xl font-bold bg-white text-slate-700 hover:bg-orange-50 hover:text-[#F27024] hover:border-[#F27024]/40 border border-slate-200 shadow-sm transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={updateMutation.isPending}
                    className="gap-2 font-extrabold rounded-2xl bg-gradient-to-r from-[#F27024] via-[#f57c32] to-[#ff8c38] text-white hover:from-[#e05f13] hover:to-[#f27024] shadow-lg shadow-[#F27024]/30 hover:shadow-[#F27024]/45 border-none transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </div>
      )}
    </div>
  )
}
