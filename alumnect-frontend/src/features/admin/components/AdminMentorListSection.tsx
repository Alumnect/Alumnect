import { useState } from 'react'
import {
  Users,
  Search,
  FileText,
  Eye,
  X,
  Briefcase,
  Building2,
  User,
  CreditCard,
  Crown,
  RotateCcw,
  Star,
  Award,
  CheckCircle2,
} from 'lucide-react'
import { Badge, Card, EmptyState, Pagination, Skeleton, SelectDropdown, DialogFrame } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAdminMentors } from '../hooks/useAdmin'
import { AdminMentorCvModal } from './AdminMentorCvModal'
import type { AdminMentorCvDto } from '../api/adminApi'

/**
 * Component hiển thị Mục 2: Danh sách Mentor (UC96) tích hợp trong Quản lý Mentor.
 * Hỗ trợ lọc tìm kiếm, xem CV trực tiếp, xem chi tiết toàn bộ hồ sơ Mentor & phân trang chuẩn.
 */
export function AdminMentorListSection() {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [subStatusFilter, setSubStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(0)

  // UC115 Custom hook lấy danh sách Mentor phân trang & bộ lọc
  const { data, isLoading, isError, error, refetch } = useAdminMentors({
    keyword: keyword || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    subscriptionStatus: subStatusFilter !== 'ALL' ? subStatusFilter : undefined,
    page,
    size: 10,
  })

  const isFiltered = !!keyword || statusFilter !== 'ALL' || subStatusFilter !== 'ALL'

  const handleResetFilters = () => {
    setKeyword('')
    setStatusFilter('ALL')
    setSubStatusFilter('ALL')
    setPage(0)
  }

  // State quản lý Modal Xem CV & Modal xem Chi tiết
  const [selectedCvMentorId, setSelectedCvMentorId] = useState<number | null>(null)
  const [isCvModalOpen, setIsCvModalOpen] = useState(false)
  const [selectedMentorDetail, setSelectedMentorDetail] = useState<AdminMentorCvDto | null>(null)

  const mentors = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getMentorStatusInfo = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Đang hoạt động', tone: 'success' as const }
      case 'PAYMENT_PENDING':
      case 'PENDING_PAYMENT':
        return { text: 'Chờ thanh toán', tone: 'gold' as const }
      case 'INCOMPLETE':
        return { text: 'Chưa hoàn thiện', tone: 'neutral' as const }
      case 'EXPIRED':
        return { text: 'Đã hết hạn', tone: 'danger' as const }
      case 'PENDING':
        return { text: 'Chờ duyệt', tone: 'gold' as const }
      case 'INACTIVE':
        return { text: 'Ngừng hoạt động', tone: 'neutral' as const }
      case 'REJECTED':
        return { text: 'Bị từ chối', tone: 'danger' as const }
      default:
        return { text: status || 'Chưa kích hoạt', tone: 'neutral' as const }
    }
  }

  const getSubStatusInfo = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Đang hiệu lực', className: 'text-success bg-success-soft border-success-border' }
      case 'PAID':
        return { text: 'Đã thanh toán', className: 'text-success bg-success-soft border-success-border' }
      case 'EXPIRED':
        return { text: 'Đã hết hạn', className: 'text-danger bg-danger-soft border-danger-border' }
      case 'PENDING_PAYMENT':
      case 'PENDING':
        return { text: 'Chờ thanh toán', className: 'text-warning bg-warning-soft border-warning-border' }
      case 'CANCELLED':
        return { text: 'Đã hủy', className: 'text-text-muted bg-surface-2 border-border' }
      default:
        return { text: status || 'Chưa đăng ký', className: 'text-text-muted bg-surface-2 border-border' }
    }
  }

  const formatWorkingMode = (mode?: string) => {
    if (!mode) return 'Chưa cập nhật'
    switch (mode.toUpperCase()) {
      case 'ONLINE':
        return 'Trực tuyến'
      case 'OFFLINE':
        return 'Gặp mặt trực tiếp'
      case 'HYBRID':
        return 'Linh hoạt (Trực tuyến & Trực tiếp)'
      default:
        return mode
    }
  }

  const formatMentoringType = (type?: string) => {
    if (!type) return 'Chưa cập nhật'
    switch (type.toUpperCase()) {
      case 'ONE_ON_ONE':
      case '1:1':
        return 'Cố vấn kèm 1:1'
      case 'GROUP':
        return 'Cố vấn nhóm'
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      {/* Control Bar: Search Input & Multi-Criteria Filter (UC115) */}
      <div className="flex flex-col gap-3 bg-surface p-3.5 rounded-xl border border-border shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-subtle" />
              <input
                aria-label="Tìm theo tên, email, vị trí, công ty..."
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(0)
                }}
                placeholder="Tìm theo tên, email, vị trí, công ty..."
                className="w-full h-9 rounded-lg border border-border-strong bg-surface pl-9 pr-8 text-xs text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-2.5 text-text-subtle hover:text-text-muted p-0.5 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter by Mentor Status */}
            <div className="flex items-center gap-1.5">
              <SelectDropdown
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(String(val))
                  setPage(0)
                }}
                options={[{ value: 'ALL', label: 'Tất cả trạng thái Mentor' }, { value: 'ACTIVE', label: 'Đang hoạt động' }, { value: 'PAYMENT_PENDING', label: 'Chờ thanh toán' }, { value: 'INCOMPLETE', label: 'Chưa hoàn thiện' }, { value: 'EXPIRED', label: 'Đã hết hạn' }]}
                placeholder="Tất cả trạng thái Mentor"
                className="w-52"
                buttonClassName="h-9 text-xs"
              />
            </div>

            {/* Filter by Subscription Status */}
            <div className="flex items-center gap-1.5">
              <SelectDropdown
                value={subStatusFilter}
                onChange={(val) => {
                  setSubStatusFilter(String(val))
                  setPage(0)
                }}
                options={[{ value: 'ALL', label: 'Tất cả gói dịch vụ' }, { value: 'ACTIVE', label: 'Đang hiệu lực' }, { value: 'PAID', label: 'Đã thanh toán' }, { value: 'EXPIRED', label: 'Đã hết hạn' }, { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' }, { value: 'CANCELLED', label: 'Đã hủy' }]}
                placeholder="Tất cả gói dịch vụ"
                className="w-48"
                buttonClassName="h-9 text-xs"
              />
            </div>

            {/* Reset Filters Button */}
            {isFiltered && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetFilters}
                className="gap-1.5 text-xs text-text-muted hover:text-text border-border-strong h-9 shrink-0"
              >
                <RotateCcw size={12} /> Đặt lại
              </Button>
            )}
          </div>

          <div className="text-xs text-text-subtle self-end lg:self-center shrink-0">
            Tổng cộng: <strong className="text-text font-semibold">{totalElements}</strong> Cố vấn
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <Card hover={false} className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Error state */}
      {isError && (
        <Card hover={false} className="p-8 text-center border-danger-border bg-danger-soft">
          <div className="space-y-3">
            <Users className="mx-auto h-8 w-8 text-danger" />
            <h3 className="text-sm font-semibold text-text">Lỗi tải danh sách Cố vấn</h3>
            <p className="text-xs text-text-subtle max-w-sm mx-auto">
              {(error as any)?.message || 'Không thể kết nối máy chủ cơ sở dữ liệu.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs font-medium"
            >
              <RotateCcw size={13} /> Thử lại
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && mentors.length === 0 && (
        <EmptyState
          icon={<Users size={28} className="text-text-subtle" />}
          title="Không tìm thấy Cố vấn nào"
          description={
            keyword
              ? `Không có kết quả nào phù hợp với từ khóa "${keyword}".`
              : 'Hiện chưa có hồ sơ Cố vấn nào trên hệ thống.'
          }
        />
      )}

      {/* Mentor Table */}
      {!isLoading && !isError && mentors.length > 0 && (
        <div className="space-y-4">
          <Card hover={false} className="p-0 border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-text-subtle bg-surface-2">
                    <th className="px-4 py-3.5 w-[22%]">Cố vấn</th>
                    <th className="px-4 py-3.5 w-[20%]">Vị trí & Tổ chức</th>
                    <th className="px-3 py-3.5 text-center w-[12%]">Trạng thái</th>
                    <th className="px-4 py-3.5 w-[20%]">Gói dịch vụ & Hiệu lực</th>
                    <th className="px-3 py-3.5 text-center w-[12%]">Hiệu suất</th>
                    <th className="px-4 py-3.5 text-right w-[14%]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mentors.map((m: AdminMentorCvDto) => {
                    const statusInfo = getMentorStatusInfo(m.mentorStatus)
                    const subInfo = getSubStatusInfo(m.subscriptionStatus)
                    return (
                      <tr key={m.mentorProfileId} className="transition-colors hover:bg-surface-2">
                        {/* Avatar & Name */}
                        <td className="px-4 py-3.5">
                          <div
                            className="flex items-center gap-3 cursor-pointer group/user"
                            onClick={() => setSelectedMentorDetail(m)}
                          >
                            {m.avatarUrl ? (
                              <img
                                src={m.avatarUrl}
                                alt={m.mentorName}
                                className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-surface-2 text-text-muted flex items-center justify-center font-medium text-xs shrink-0">
                                <User size={15} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-text group-hover/user:text-[#F27024] transition-colors truncate">
                                {m.mentorName}
                              </p>
                              <p className="text-xs text-text-subtle truncate">{m.mentorEmail}</p>
                            </div>
                          </div>
                        </td>

                        {/* Position & Company */}
                        <td className="px-4 py-3.5 text-xs">
                          <p className="font-medium text-text flex items-center gap-1.5 truncate">
                            <Briefcase size={13} className="text-text-subtle shrink-0" />
                            <span className="truncate">{m.currentPosition || 'Chưa cập nhật'}</span>
                          </p>
                          <p className="text-text-subtle flex items-center gap-1.5 mt-0.5 text-xs truncate">
                            <Building2 size={13} className="text-text-subtle shrink-0" />
                            <span className="truncate">{m.currentCompany || 'Chưa cập nhật'}</span>
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          <Badge tone={statusInfo.tone} className="px-2 py-0.5 font-medium text-xs">
                            {statusInfo.text}
                          </Badge>
                        </td>

                        {/* Package Name & Dates */}
                        <td className="px-4 py-3.5 text-xs">
                          {m.packageName ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-medium text-text">
                                <Crown size={13} className="text-warning shrink-0" />
                                <span className="truncate">{m.packageName}</span>
                                {m.subscriptionStatus && (
                                  <span
                                    className={`inline-block whitespace-nowrap text-xs font-medium px-1.5 py-0.2 rounded border ${subInfo.className}`}
                                  >
                                    {subInfo.text}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-text-subtle flex items-center gap-2 font-mono">
                                <span>Từ: {formatDate(m.subscriptionStartDate)}</span>
                                <span>-</span>
                                <span>Đến: {formatDate(m.subscriptionEndDate)}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-subtle italic text-xs">Chưa đăng ký gói</span>
                          )}
                        </td>

                        {/* Performance Metrics */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap text-xs">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 font-semibold text-warning bg-warning-soft px-2 py-0.5 rounded border border-warning-border text-xs">
                              <Award size={11} className="text-warning" />
                              {m.reputationScore ?? 0} đ
                            </span>
                            <span className="text-xs text-text-subtle flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-success" />
                              {m.completedTasks ?? 0} task
                            </span>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {/* Nút Xem CV */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCvMentorId(m.mentorProfileId)
                                setIsCvModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-muted hover:bg-surface-2 hover:border-border-strong transition-colors cursor-pointer"
                              title="Xem tệp CV"
                            >
                              <FileText size={13} className="text-text-subtle" />
                              <span>Xem CV</span>
                            </button>

                            {/* Nút Chi tiết */}
                            <button
                              type="button"
                              onClick={() => setSelectedMentorDetail(m)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-muted hover:bg-surface-2 hover:border-border-strong transition-colors cursor-pointer"
                              title="Xem thông tin chi tiết"
                            >
                              <Eye size={13} className="text-text-subtle" />
                              <span>Chi tiết</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Phân trang chuẩn */}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Modal Xem CV Cố vấn (Popup xem tài liệu lớn) */}
      <AdminMentorCvModal
        isOpen={isCvModalOpen}
        onClose={() => setIsCvModalOpen(false)}
        mentorProfileId={selectedCvMentorId}
      />

      {/* Modal Chi tiết Hồ sơ Cố vấn (Popup chuẩn 640px) */}
      {selectedMentorDetail !== null && (
        <DialogFrame
          onClose={() => setSelectedMentorDetail(null)}
          zIndexClassName="z-50"
          maxWidthClassName="max-w-2xl"
          className="z-10 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
              <div>
                <h2 className="text-[20px] font-semibold text-text leading-tight">
                  Chi tiết hồ sơ Mentor
                </h2>
                <p className="text-[13px] text-text-subtle mt-0.5">
                  Thông tin chuyên môn, gói dịch vụ và tài khoản nhận chi trả.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMentorDetail(null)}
                className="p-1.5 text-text-subtle hover:text-text-muted hover:bg-surface-2 rounded-lg transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-2 border border-border">
                {selectedMentorDetail.avatarUrl ? (
                  <img
                    src={selectedMentorDetail.avatarUrl}
                    alt={selectedMentorDetail.mentorName}
                    className="h-14 w-14 rounded-full object-cover border border-border-strong shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-surface-3 text-text-muted flex items-center justify-center font-semibold text-xl shrink-0">
                    <User size={24} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-text">
                      {selectedMentorDetail.mentorName}
                    </h3>
                    <Badge
                      tone={getMentorStatusInfo(selectedMentorDetail.mentorStatus).tone}
                      className="text-xs font-medium px-2 py-0.5"
                    >
                      {getMentorStatusInfo(selectedMentorDetail.mentorStatus).text}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-subtle mt-0.5">{selectedMentorDetail.mentorEmail}</p>

                  {/* Badges metrics */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-warning-soft text-warning border border-warning-border font-medium text-xs">
                      <Award size={12} className="text-warning" /> Uy tín: {selectedMentorDetail.reputationScore ?? 0} điểm
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success-soft text-success border border-success-border font-medium text-xs">
                      <CheckCircle2 size={12} className="text-success" /> Đã hoàn thành: {selectedMentorDetail.completedTasks ?? 0} task
                    </span>
                    {selectedMentorDetail.rating !== undefined && Number(selectedMentorDetail.rating) > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-info-soft text-info border border-info-border font-medium text-xs">
                        <Star size={12} className="text-warning fill-warning" /> {selectedMentorDetail.rating} ({selectedMentorDetail.reviewCount ?? 0} đánh giá)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Nhóm 1: Thông tin chuyên môn */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-text-subtle">
                  Thông tin chuyên môn
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Vị trí hiện tại:</span>
                    <span className="font-medium text-text">
                      {selectedMentorDetail.currentPosition || 'Chưa cập nhật'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Công ty / Tổ chức:</span>
                    <span className="font-medium text-text">
                      {selectedMentorDetail.currentCompany || 'Chưa cập nhật'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Hình thức cố vấn:</span>
                    <span className="font-medium text-text">
                      {formatWorkingMode(selectedMentorDetail.workingMode)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Loại hình cố vấn:</span>
                    <span className="font-medium text-text">
                      {formatMentoringType(selectedMentorDetail.mentoringType)}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {selectedMentorDetail.bio && (
                  <div className="p-3 rounded-lg border border-border bg-surface text-xs">
                    <span className="text-text-subtle block mb-1">Lời giới thiệu (Bio):</span>
                    <p className="text-text-muted leading-relaxed whitespace-pre-wrap">
                      {selectedMentorDetail.bio}
                    </p>
                  </div>
                )}

                {/* Supported Fields */}
                {selectedMentorDetail.supportedFields && selectedMentorDetail.supportedFields.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs text-text-subtle font-medium block">
                      Lĩnh vực hỗ trợ chuyên môn:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMentorDetail.supportedFields.map((field, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-surface-2 text-text-muted border border-border text-xs font-medium"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topics */}
                {selectedMentorDetail.topics && selectedMentorDetail.topics.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs text-text-subtle font-medium block">
                      Chủ đề cố vấn chuyên sâu:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMentorDetail.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-surface-2 text-text-muted border border-border text-xs font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Nhóm 2: Gói dịch vụ & Thời hạn */}
              <div className="space-y-3 pt-2 border-t border-border">
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-text-subtle">
                  Gói dịch vụ & Thời hạn
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Gói đăng ký:</span>
                    <span className="font-semibold text-text">
                      {selectedMentorDetail.packageName || 'Chưa đăng ký gói'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Trạng thái hiệu lực:</span>
                    <span className="font-medium text-text">
                      {getSubStatusInfo(selectedMentorDetail.subscriptionStatus).text}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Ngày kích hoạt:</span>
                    <span className="font-mono text-text-muted">
                      {formatDate(selectedMentorDetail.subscriptionStartDate)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Ngày hết hạn:</span>
                    <span className="font-mono text-text-muted">
                      {formatDate(selectedMentorDetail.subscriptionEndDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nhóm 3: Tài khoản thanh toán (nếu có) */}
              {(selectedMentorDetail.bankName || selectedMentorDetail.bankAccountNumber) && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <h4 className="text-[13px] font-semibold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                    <CreditCard size={14} /> Tài khoản ngân hàng nhận chi trả
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-border bg-surface">
                      <span className="text-text-subtle block mb-1">Ngân hàng:</span>
                      <span className="font-medium text-text">
                        {selectedMentorDetail.bankName || '—'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-surface">
                      <span className="text-text-subtle block mb-1">Số tài khoản:</span>
                      <span className="font-mono font-medium text-text">
                        {selectedMentorDetail.bankAccountNumber || '—'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-surface">
                      <span className="text-text-subtle block mb-1">Chủ tài khoản:</span>
                      <span className="font-medium text-text uppercase">
                        {selectedMentorDetail.bankAccountHolder || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedCvMentorId(selectedMentorDetail.mentorProfileId)
                  setIsCvModalOpen(true)
                }}
                className="px-3.5 py-2 text-xs font-medium text-primary-solid bg-primary-soft border border-orange-200 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>Xem tệp CV gốc</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMentorDetail(null)}
                className="px-4 py-2 text-sm font-medium text-text-muted bg-surface border border-border-strong hover:bg-surface-2 rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </DialogFrame>
      )}
    </div>
  )
}
