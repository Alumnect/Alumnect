import { useState } from 'react'
import { createPortal } from 'react-dom'
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
  Sparkles,
  ShieldAlert,
  Crown,
} from 'lucide-react'
import { Badge, Card, EmptyState, Pagination, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
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
  const { data, isLoading, isError, error } = useAdminMentors({
    keyword: keyword || undefined,
    page,
    size: 10,
  })

  // State quản lý Modal Xem CV & Drawer xem Chi tiết
  const [selectedCvMentorId, setSelectedCvMentorId] = useState<number | null>(null)
  const [isCvModalOpen, setIsCvModalOpen] = useState(false)
  const [selectedMentorDetail, setSelectedMentorDetail] = useState<AdminMentorCvDto | null>(null)

  const mentors = data?.content || []
  const totalPages = data?.totalPages || 0

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
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
        return { text: 'Bị từ chối', tone: 'rose' as const }
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
    if (!mode) return ''
    switch (mode.toUpperCase()) {
      case 'ONLINE': return 'Trực tuyến'
      case 'OFFLINE': return 'Gặp mặt trực tiếp'
      case 'HYBRID': return 'Linh hoạt (Trực tuyến & Trực tiếp)'
      default: return mode
    }
  }

  const formatMentoringType = (type?: string) => {
    if (!type) return ''
    switch (type.toUpperCase()) {
      case 'ONE_ON_ONE':
      case '1:1': return 'Cố vấn kèm 1:1'
      case 'GROUP': return 'Cố vấn nhóm'
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner giới thiệu danh sách */}
      <Reveal>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-brand-500/20 bg-brand-50/60 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3 text-xs leading-relaxed text-brand-900">
            <Sparkles className="h-5 w-5 flex-shrink-0 text-brand-500" />
            <div>
              <span className="font-bold text-sm block mb-0.5">Danh sách Cố vấn</span>
              <span>
                Tra cứu, đối chứng thông tin chuyên môn và xem tệp CV của các Cố vấn trên hệ thống AlumNect.
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Control Bar: Search Input */}
      <Card hover={false} className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-plum-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              placeholder="Tìm theo tên, email, vị trí..."
              className="w-full rounded-2xl border border-plum-900/15 bg-white pl-10 pr-4 py-2 text-xs font-semibold text-plum-900 placeholder:text-plum-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="text-xs font-semibold text-plum-500">
            Tổng số: <span className="font-bold text-brand-600">{data?.totalElements || 0}</span> Cố vấn
          </div>
        </div>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && (
        <Card hover={false} className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
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
        <EmptyState
          icon={<Users size={24} />}
          title="Lỗi tải danh sách Mentor"
          description={(error as any)?.message || 'Không thể kết nối CSDL.'}
        />
      )}

      {/* Empty State */}
      {!isLoading && !isError && mentors.length === 0 && (
        <EmptyState
          icon={<Users size={24} />}
          title="Không tìm thấy Mentor"
          description="Hãy thử thay đổi từ khóa tìm kiếm."
        />
      )}

      {/* Mentor Table */}
      {!isLoading && !isError && mentors.length > 0 && (
        <Reveal>
          <div className="space-y-4">
            <Card hover={false} className="overflow-hidden p-0 border border-plum-900/10 shadow-sm">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="border-b border-plum-900/8 text-left text-xs uppercase tracking-wider text-plum-400 bg-plum-900/[0.02]">
                    <th className="px-3.5 py-3 font-semibold whitespace-nowrap w-[22%]">Cố vấn</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap w-[20%]">Vị trí & Tổ chức</th>
                    <th className="px-2 py-3 font-semibold whitespace-nowrap text-center w-[12%]">Trạng thái</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap w-[18%]">Gói dịch vụ</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap w-[15%]">Thời hạn hiệu lực</th>
                    <th className="px-3.5 py-3 font-semibold whitespace-nowrap text-right w-[13%]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-plum-900/5">
                  {mentors.map((m: AdminMentorCvDto) => {
                    const statusInfo = getMentorStatusInfo(m.mentorStatus)
                    const subInfo = getSubStatusInfo(m.subscriptionStatus)
                    return (
                      <tr
                        key={m.mentorProfileId}
                        className="transition-colors hover:bg-white/[0.03]"
                      >
                        {/* Avatar & Name */}
                        <td className="px-3.5 py-3">
                          <div
                            className="flex items-center gap-2.5 cursor-pointer group/user"
                            onClick={() => setSelectedMentorDetail(m)}
                          >
                            {m.avatarUrl ? (
                              <img
                                src={m.avatarUrl}
                                alt={m.mentorName}
                                className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-500/20 shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0">
                                <User size={16} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-plum-900 group-hover/user:text-[#F27024] transition-colors truncate">
                                {m.mentorName}
                              </p>
                              <p className="text-[11px] text-plum-400 truncate">{m.mentorEmail}</p>
                            </div>
                          </div>
                        </td>

                        {/* Position & Company */}
                        <td className="px-3 py-3 text-xs">
                          <p className="font-bold text-plum-800 flex items-center gap-1.5 truncate">
                            <Briefcase size={12} className="text-brand-500 shrink-0" />
                            <span className="truncate">{m.currentPosition || 'Chưa cập nhật'}</span>
                          </p>
                          <p className="text-plum-500 flex items-center gap-1.5 mt-0.5 text-[11px] truncate">
                            <Building2 size={12} className="text-plum-400 shrink-0" />
                            <span className="truncate">{m.currentCompany || 'Chưa cập nhật'}</span>
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-2 py-3 text-center whitespace-nowrap">
                          <Badge
                            tone={statusInfo.tone}
                            className="px-2 py-0.5 font-bold text-[10px]"
                          >
                            {statusInfo.text}
                          </Badge>
                        </td>

                        {/* Package Name */}
                        <td className="px-3 py-3 text-xs">
                          {m.packageName ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-plum-900 flex items-center gap-1.5 whitespace-nowrap">
                                <Crown size={13} className="text-amber-500 shrink-0" />
                                <span className="truncate">{m.packageName}</span>
                              </div>
                              {m.subscriptionStatus && (
                                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${subInfo.className}`}>
                                  {subInfo.text}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-plum-400 italic text-xs">Chưa đăng ký</span>
                          )}
                        </td>

                        {/* Subscription Dates (Start - End) */}
                        <td className="px-3 py-3 text-xs whitespace-nowrap">
                          {m.subscriptionStartDate || m.subscriptionEndDate ? (
                            <div className="space-y-0.5 font-medium">
                              <div className="flex items-center gap-1 text-plum-600 text-[11px]">
                                <span className="text-[10px] text-plum-400 font-bold uppercase tracking-wider w-7">Từ:</span>
                                <span className="font-semibold text-plum-700">{formatDate(m.subscriptionStartDate)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider w-7">Đến:</span>
                                <span className="font-bold text-plum-900">{formatDate(m.subscriptionEndDate)}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-plum-400 italic text-xs">Chưa kích hoạt</span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {/* Nút Xem CV */}
                            <button
                              onClick={() => {
                                setSelectedCvMentorId(m.mentorProfileId)
                                setIsCvModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#F27024] to-[#ff8c38] px-2.5 py-1 text-xs font-bold text-white hover:from-[#e05f13] hover:to-[#f27024] shadow-sm transition-all cursor-pointer"
                              title="Xem tệp hồ sơ CV"
                            >
                              <FileText size={12} /> Xem CV
                            </button>

                            {/* Nút Chi tiết */}
                            <button
                              onClick={() => setSelectedMentorDetail(m)}
                              className="inline-flex items-center gap-1 rounded-lg bg-plum-900/[0.05] px-2 py-1 text-xs font-semibold text-plum-700 hover:bg-plum-900/[0.1] transition-all cursor-pointer"
                              title="Xem thông tin chi tiết"
                            >
                              <Eye size={12} /> Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>

            {/* Pagination Controls */}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </Reveal>
      )}

      {/* Modal Xem CV Cố vấn */}
      <AdminMentorCvModal
        isOpen={isCvModalOpen}
        onClose={() => setIsCvModalOpen(false)}
        mentorProfileId={selectedCvMentorId}
      />

      {/* Drawer xem Chi tiết toàn bộ thông tin Cố vấn */}
      {selectedMentorDetail !== null &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-hidden bg-plum-900/40 backdrop-blur-sm animate-fade-in flex justify-end">
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto p-6 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Header Drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-plum-900/10">
                  <h3 className="font-extrabold text-lg text-plum-900">Chi tiết hồ sơ Cố vấn</h3>
                  <button
                    onClick={() => setSelectedMentorDetail(null)}
                    className="p-1.5 rounded-full text-plum-400 hover:bg-slate-100 hover:text-plum-900 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mentor Card */}
                <div className="flex items-center gap-4">
                  {selectedMentorDetail.avatarUrl ? (
                    <img
                      src={selectedMentorDetail.avatarUrl}
                      alt={selectedMentorDetail.mentorName}
                      className="h-16 w-16 rounded-full object-cover ring-4 ring-brand-500/15"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-xl">
                      <User size={32} />
                    </div>
                  )}

                  <div>
                    <h4 className="font-extrabold text-lg text-plum-900">
                      {selectedMentorDetail.mentorName}
                    </h4>
                    <p className="text-xs text-plum-500 font-mono">{selectedMentorDetail.mentorEmail}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        tone={getMentorStatusInfo(selectedMentorDetail.mentorStatus).tone}
                        className="font-bold text-[10px]"
                      >
                        {getMentorStatusInfo(selectedMentorDetail.mentorStatus).text}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-plum-900/5 text-xs text-plum-700">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-brand-500 flex-shrink-0" />
                    <span>Vị trí hiện tại: <b>{selectedMentorDetail.currentPosition || 'Chưa cập nhật'}</b></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-brand-500 flex-shrink-0" />
                    <span>Công ty / Tổ chức: <b>{selectedMentorDetail.currentCompany || 'Chưa cập nhật'}</b></span>
                  </div>
                  {selectedMentorDetail.workingMode && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-brand-500 flex-shrink-0" />
                      <span>Hình thức cố vấn: <b>{formatWorkingMode(selectedMentorDetail.workingMode)}</b></span>
                    </div>
                  )}
                  {selectedMentorDetail.mentoringType && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-brand-500 flex-shrink-0" />
                      <span>Loại hình cố vấn: <b>{formatMentoringType(selectedMentorDetail.mentoringType)}</b></span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {selectedMentorDetail.bio && (
                  <div>
                    <h5 className="text-xs font-bold text-plum-800 uppercase tracking-wide mb-1">
                      Lời giới thiệu cố vấn
                    </h5>
                    <p className="text-xs leading-relaxed text-plum-600 bg-cream-50 p-3 rounded-2xl border border-plum-900/5">
                      {selectedMentorDetail.bio}
                    </p>
                  </div>
                )}

                {/* Supported fields */}
                {selectedMentorDetail.supportedFields && selectedMentorDetail.supportedFields.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-plum-800 uppercase tracking-wide mb-2">
                      Lĩnh vực hỗ trợ chuyên môn
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMentorDetail.supportedFields.map((field, idx) => (
                        <span
                          key={idx}
                          className="rounded-xl bg-brand-50 text-brand-700 border border-brand-200/60 px-3 py-1 text-xs font-bold"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topics */}
                {selectedMentorDetail.topics && selectedMentorDetail.topics.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-plum-800 uppercase tracking-wide mb-2">
                      Chủ đề cố vấn chuyên sâu
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMentorDetail.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="rounded-xl bg-slate-100 text-plum-800 border border-slate-200 px-3 py-1 text-xs font-bold"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subscription Package & Validity Details */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50/80 via-white to-amber-50/50 border border-brand-500/20 shadow-sm space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-plum-900">
                      <Crown className="h-4 w-4 text-amber-500" /> Gói dịch vụ & Thời hạn hiệu lực
                    </div>
                    {selectedMentorDetail.subscriptionStatus && (
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${getSubStatusInfo(selectedMentorDetail.subscriptionStatus).className}`}>
                        {getSubStatusInfo(selectedMentorDetail.subscriptionStatus).text}
                      </span>
                    )}

                  </div>

                  <div className="space-y-1.5 pt-1 text-plum-700">
                    <div className="flex items-center justify-between">
                      <span className="text-plum-500">Gói đăng ký:</span>
                      <span className="font-extrabold text-plum-900">
                        {selectedMentorDetail.packageName || 'Chưa đăng ký gói'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-plum-500">Ngày bắt đầu:</span>
                      <span className="font-semibold text-plum-800">
                        {selectedMentorDetail.subscriptionStartDate ? formatDate(selectedMentorDetail.subscriptionStartDate) : 'Chưa kích hoạt'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-plum-500">Ngày kết thúc:</span>
                      <span className="font-semibold text-brand-600">
                        {selectedMentorDetail.subscriptionEndDate ? formatDate(selectedMentorDetail.subscriptionEndDate) : 'Chưa kích hoạt'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank Payout Details */}
                {(selectedMentorDetail.bankName || selectedMentorDetail.bankAccountNumber) && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <CreditCard className="h-4 w-4 text-amber-600" /> Tài khoản ngân hàng nhận chi trả
                    </div>
                    <div className="text-amber-800 font-mono text-[11px] space-y-0.5">
                      <p>Ngân hàng: <b>{selectedMentorDetail.bankName}</b></p>
                      <p>Số tài khoản: <b>{selectedMentorDetail.bankAccountNumber}</b></p>
                      <p>Chủ tài khoản: <b>{selectedMentorDetail.bankAccountHolder}</b></p>
                    </div>
                  </div>
                )}

                {/* Action button to open CV */}
                <div className="pt-2">
                  <Button
                    variant="primary"
                    className="w-full justify-center gap-2 rounded-2xl font-bold bg-gradient-to-r from-[#F27024] via-[#f57c32] to-[#ff8c38] text-white hover:from-[#e05f13] hover:to-[#f27024] shadow-md shadow-[#F27024]/20 border-none cursor-pointer"
                    onClick={() => {
                      setSelectedCvMentorId(selectedMentorDetail.mentorProfileId)
                      setIsCvModalOpen(true)
                    }}
                  >
                    <FileText className="h-4 w-4" /> Xem tệp CV trực tiếp
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-plum-900/10">
                <Button
                  variant="secondary"
                  className="w-full justify-center rounded-xl font-bold cursor-pointer"
                  onClick={() => setSelectedMentorDetail(null)}
                >
                  Đóng cửa sổ
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
