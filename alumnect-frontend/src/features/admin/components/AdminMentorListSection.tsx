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
  Target,
  Crown,
  RotateCcw,
} from 'lucide-react'
import { Badge, Card, EmptyState, Pagination, Skeleton } from '@/components/ui'
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
  const [page, setPage] = useState(0)

  // UC96 Custom hook lấy danh sách Mentor phân trang
  const { data, isLoading, isError, error, refetch } = useAdminMentors({
    keyword: keyword || undefined,
    page,
    size: 10,
  })

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
        return { text: 'Đang hiệu lực', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      case 'PAID':
        return { text: 'Đã thanh toán', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      case 'EXPIRED':
        return { text: 'Đã hết hạn', className: 'text-rose-700 bg-rose-50 border-rose-200' }
      case 'PENDING_PAYMENT':
      case 'PENDING':
        return { text: 'Chờ thanh toán', className: 'text-amber-700 bg-amber-50 border-amber-200' }
      case 'CANCELLED':
        return { text: 'Đã hủy', className: 'text-slate-600 bg-slate-50 border-slate-200' }
      default:
        return { text: status || 'Chưa đăng ký', className: 'text-slate-600 bg-slate-50 border-slate-200' }
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
      {/* Control Bar: Search Input & Metrics */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            placeholder="Tìm theo tên cố vấn, email, vị trí..."
            className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#F27024] focus:outline-none focus:ring-1 focus:ring-[#F27024]"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => {
                setKeyword('')
                setPage(0)
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              title="Xóa tìm kiếm"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 self-end sm:self-center">
          Tổng cộng: <strong className="text-slate-900 font-semibold">{totalElements}</strong> Cố vấn
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
        <Card hover={false} className="p-8 text-center border-red-200 bg-red-50/30">
          <div className="space-y-3">
            <Users className="mx-auto h-8 w-8 text-red-500" />
            <h3 className="text-sm font-semibold text-slate-900">Lỗi tải danh sách Cố vấn</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
          icon={<Users size={28} className="text-slate-400" />}
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
          <Card hover={false} className="p-0 border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                    <th className="px-4 py-3.5 w-[25%]">Cố vấn</th>
                    <th className="px-4 py-3.5 w-[22%]">Vị trí & Tổ chức</th>
                    <th className="px-3 py-3.5 text-center w-[12%]">Trạng thái</th>
                    <th className="px-4 py-3.5 w-[23%]">Gói dịch vụ & Hiệu lực</th>
                    <th className="px-4 py-3.5 text-right w-[18%]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mentors.map((m: AdminMentorCvDto) => {
                    const statusInfo = getMentorStatusInfo(m.mentorStatus)
                    const subInfo = getSubStatusInfo(m.subscriptionStatus)
                    return (
                      <tr key={m.mentorProfileId} className="transition-colors hover:bg-slate-50/70">
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
                                className="h-9 w-9 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-medium text-xs shrink-0">
                                <User size={15} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-900 group-hover/user:text-[#F27024] transition-colors truncate">
                                {m.mentorName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{m.mentorEmail}</p>
                            </div>
                          </div>
                        </td>

                        {/* Position & Company */}
                        <td className="px-4 py-3.5 text-xs">
                          <p className="font-medium text-slate-800 flex items-center gap-1.5 truncate">
                            <Briefcase size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{m.currentPosition || 'Chưa cập nhật'}</span>
                          </p>
                          <p className="text-slate-500 flex items-center gap-1.5 mt-0.5 text-[11px] truncate">
                            <Building2 size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{m.currentCompany || 'Chưa cập nhật'}</span>
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          <Badge tone={statusInfo.tone} className="px-2 py-0.5 font-medium text-[11px]">
                            {statusInfo.text}
                          </Badge>
                        </td>

                        {/* Package Name & Dates */}
                        <td className="px-4 py-3.5 text-xs">
                          {m.packageName ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                <Crown size={13} className="text-amber-500 shrink-0" />
                                <span className="truncate">{m.packageName}</span>
                                {m.subscriptionStatus && (
                                  <span
                                    className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded border ${subInfo.className}`}
                                  >
                                    {subInfo.text}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                                <span>Từ: {formatDate(m.subscriptionStartDate)}</span>
                                <span>-</span>
                                <span>Đến: {formatDate(m.subscriptionEndDate)}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Chưa đăng ký gói</span>
                          )}
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
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                              title="Xem tệp CV"
                            >
                              <FileText size={13} className="text-slate-500" />
                              <span>Xem CV</span>
                            </button>

                            {/* Nút Chi tiết */}
                            <button
                              type="button"
                              onClick={() => setSelectedMentorDetail(m)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                              title="Xem thông tin chi tiết"
                            >
                              <Eye size={13} className="text-slate-500" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 transition-opacity"
            onClick={() => setSelectedMentorDetail(null)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <div>
                <h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
                  Chi tiết hồ sơ Cố vấn
                </h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Thông tin chuyên môn, gói dịch vụ và tài khoản nhận chi trả.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMentorDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                {selectedMentorDetail.avatarUrl ? (
                  <img
                    src={selectedMentorDetail.avatarUrl}
                    alt={selectedMentorDetail.mentorName}
                    className="h-14 w-14 rounded-full object-cover border border-slate-300 shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-semibold text-xl shrink-0">
                    <User size={24} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-slate-900">
                      {selectedMentorDetail.mentorName}
                    </h3>
                    <Badge
                      tone={getMentorStatusInfo(selectedMentorDetail.mentorStatus).tone}
                      className="text-[11px] font-medium px-2 py-0.5"
                    >
                      {getMentorStatusInfo(selectedMentorDetail.mentorStatus).text}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedMentorDetail.mentorEmail}</p>
                </div>
              </div>

              {/* Nhóm 1: Thông tin chuyên môn */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                  Thông tin chuyên môn
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">Vị trí hiện tại:</span>
                    <span className="font-medium text-slate-800">
                      {selectedMentorDetail.currentPosition || 'Chưa cập nhật'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">Công ty / Tổ chức:</span>
                    <span className="font-medium text-slate-800">
                      {selectedMentorDetail.currentCompany || 'Chưa cập nhật'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">Hình thức cố vấn:</span>
                    <span className="font-medium text-slate-800">
                      {formatWorkingMode(selectedMentorDetail.workingMode)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">Loại hình cố vấn:</span>
                    <span className="font-medium text-slate-800">
                      {formatMentoringType(selectedMentorDetail.mentoringType)}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {selectedMentorDetail.bio && (
                  <div className="p-3 rounded-lg border border-slate-200 bg-white text-xs">
                    <span className="text-slate-400 block mb-1">Lời giới thiệu (Bio):</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedMentorDetail.bio}
                    </p>
                  </div>
                )}

                {/* Supported Fields */}
                {selectedMentorDetail.supportedFields && selectedMentorDetail.supportedFields.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 font-medium block">
                      Lĩnh vực hỗ trợ chuyên môn:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMentorDetail.supportedFields.map((field, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium"
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
                    <span className="text-xs text-slate-500 font-medium block">
                      Chủ đề cố vấn chuyên sâu:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMentorDetail.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Nhóm 2: Gói dịch vụ & Thời hạn */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                  Gói dịch vụ & Thời hạn
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">Gói đăng ký:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedMentorDetail.packageName || 'Chưa đăng ký gói'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">Trạng thái hiệu lực:</span>
                    <span className="font-medium text-slate-800">
                      {getSubStatusInfo(selectedMentorDetail.subscriptionStatus).text}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">Ngày kích hoạt:</span>
                    <span className="font-mono text-slate-700">
                      {formatDate(selectedMentorDetail.subscriptionStartDate)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">Ngày hết hạn:</span>
                    <span className="font-mono text-slate-700">
                      {formatDate(selectedMentorDetail.subscriptionEndDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nhóm 3: Tài khoản thanh toán (nếu có) */}
              {(selectedMentorDetail.bankName || selectedMentorDetail.bankAccountNumber) && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <h4 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CreditCard size={14} /> Tài khoản ngân hàng nhận chi trả
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="text-slate-400 block mb-1">Ngân hàng:</span>
                      <span className="font-medium text-slate-800">
                        {selectedMentorDetail.bankName || '—'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="text-slate-400 block mb-1">Số tài khoản:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {selectedMentorDetail.bankAccountNumber || '—'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="text-slate-400 block mb-1">Chủ tài khoản:</span>
                      <span className="font-medium text-slate-800 uppercase">
                        {selectedMentorDetail.bankAccountHolder || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedCvMentorId(selectedMentorDetail.mentorProfileId)
                  setIsCvModalOpen(true)
                }}
                className="px-3.5 py-2 text-xs font-medium text-[#F27024] bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>Xem tệp CV gốc</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMentorDetail(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
