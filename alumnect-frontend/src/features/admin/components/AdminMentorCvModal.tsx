import { useState } from 'react'
import {
  FileText,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  Briefcase,
  X,
  User,
  ShieldAlert,
} from 'lucide-react'
import { Modal, Badge, Button, Skeleton } from '@/components/ui'
import { useAdminMentorCv } from '../hooks/useAdmin'

interface AdminMentorCvModalProps {
  isOpen: boolean
  onClose: () => void
  mentorProfileId: number | null
  mentorNameFallback?: string
}

/**
 * Modal Xem CV Mentor dành cho Quản trị viên (UC96).
 * Cho phép Admin xem, kiểm tra chi tiết CV của Mentor mà KHÔNG có các quy trình duyệt/từ chối (Approve/Reject).
 */
export function AdminMentorCvModal({
  isOpen,
  onClose,
  mentorProfileId,
  mentorNameFallback,
}: AdminMentorCvModalProps) {
  const { data: cvData, isLoading, isError, error } = useAdminMentorCv(mentorProfileId)
  const [previewError, setPreviewError] = useState(false)

  if (!isOpen) return null

  const cvUrl = cvData?.cvUrl || cvData?.cvFileKey

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hồ sơ & CV Chi tiết của Mentor"
    >
      <div className="space-y-5 pt-1">
        {/* Banner lưu ý Quy tắc UC96 */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-50/70 p-3 text-xs text-amber-900 backdrop-blur-sm">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <span>
            <b>Quy tắc quản lý:</b> Xem và kiểm tra CV đối chứng thông tin Mentor. Chức năng này không làm thay đổi trạng thái hoạt động của Mentor.
          </span>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/3 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        )}

        {/* Error Exception Flow: CV không tồn tại hoặc lỗi kết nối */}
        {(isError || (!isLoading && !cvUrl)) && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/60 rounded-2xl border border-rose-200 text-rose-900 space-y-3">
            <div className="p-3 bg-rose-100 rounded-full">
              <AlertCircle className="h-8 w-8 text-rose-600" />
            </div>
            <h4 className="font-bold text-base">Không thể tải tệp CV của Mentor</h4>
            <p className="text-xs text-rose-700 max-w-sm">
              {(error as any)?.message ||
                'Mentor này hiện chưa cập nhật hoặc tải lên tệp CV chuyên môn trong hệ thống.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="mt-2 rounded-xl font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300"
            >
              Đóng cửa sổ
            </Button>
          </div>
        )}

        {/* Main Content when CV Data is loaded */}
        {!isLoading && cvData && cvUrl && (
          <div className="space-y-5">
            {/* Header info card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  {cvData.avatarUrl ? (
                    <img
                      src={cvData.avatarUrl}
                      alt={cvData.mentorName}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-500/20 shadow-sm"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-lg">
                      <User className="h-7 w-7 text-brand-600" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-plum-900">
                      {cvData.mentorName || mentorNameFallback || 'Mentor AlumNect'}
                    </h3>
                    <Badge
                      tone={cvData.mentorStatus === 'ACTIVE' ? 'mint' : 'gold'}
                      size="sm"
                      className="font-bold"
                    >
                      {cvData.mentorStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-plum-500 font-medium">{cvData.mentorEmail}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] font-semibold text-plum-600">
                    {cvData.currentPosition && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5 text-brand-500" />
                        {cvData.currentPosition}
                      </span>
                    )}
                    {cvData.currentCompany && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-brand-500" />
                        {cvData.currentCompany}
                      </span>
                    )}
                    {cvData.yearsOfExperience != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gold-600" />
                        {cvData.yearsOfExperience} Năm KN
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#F27024] bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200/80 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Mở trong tab mới
                </a>
                <a
                  href={cvUrl}
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#F27024] to-[#ff8c38] hover:from-[#e05f13] hover:to-[#f27024] rounded-xl shadow-sm transition-all"
                >
                  <Download className="h-3.5 w-3.5" /> Tải về
                </a>
              </div>
            </div>

            {/* Supported fields tags */}
            {cvData.supportedFields && cvData.supportedFields.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-plum-700 mr-1">Lĩnh vực cố vấn:</span>
                {cvData.supportedFields.map((field, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-brand-50/80 text-brand-700 border border-brand-200/60 px-2.5 py-0.5 text-[11px] font-bold"
                  >
                    {field}
                  </span>
                ))}
              </div>
            )}

            {/* Embedded CV Document Viewer */}
            <div className="rounded-2xl border border-plum-900/10 overflow-hidden bg-slate-100 shadow-inner">
              <div className="bg-slate-200/80 px-4 py-2 flex items-center justify-between border-b border-slate-300/80 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-brand-600" /> Xem trực tiếp tệp CV
                </span>
                <span className="text-[11px] text-slate-500 font-normal">PDF / Document Preview</span>
              </div>

              {!previewError ? (
                <iframe
                  src={cvUrl}
                  title="Mentor CV Preview"
                  className="w-full h-[450px] border-none"
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    Trình duyệt không hỗ trợ xem trực tiếp định dạng tệp này.
                  </p>
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
                  >
                    Nhấn vào đây để xem trực tiếp tệp CV <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Close Footer */}
            <div className="flex justify-end pt-3 border-t border-plum-900/10">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="rounded-2xl font-bold bg-white text-slate-700 hover:bg-orange-50 hover:text-[#F27024] hover:border-[#F27024]/40 border border-slate-200 shadow-sm transition-all"
              >
                Đóng cửa sổ
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
