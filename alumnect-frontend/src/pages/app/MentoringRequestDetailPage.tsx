import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Briefcase,
  Coins,
  Laptop,
  Users,
  Paperclip,
  Download,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Sparkles,
  Info,
  Clock,
  Search,
} from 'lucide-react'
import { Container, Card, Skeleton } from '@/components/ui'
import {
  MentoringTermsGate,
  RequestTypeBadge,
  RequestStatusBadge,
  MentorResponseCard,
  RequestResponseSummaryCard,
  useMentoringRequestDetail,
  TASK_TYPE_OPTIONS,
  WORKING_MODE_LABELS,
  PARTICIPATION_TYPE_LABELS,
} from '@/features/mentorship'
import { cn } from '@/lib/utils'

/**
 * Nội dung trang Chi tiết Yêu cầu Mentoring & Danh sách phản hồi (UC102).
 */
function MentoringRequestDetailContent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const requestId = id ? Number(id) : undefined

  const { data, isLoading, isError, error, refetch, isFetching } = useMentoringRequestDetail(requestId)

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return 'Thỏa thuận'
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Không có'
    try {
      const d = new Date(dateStr)
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${hours}:${minutes} • ${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // 1. Trạng thái Đang tải (Loading Skeleton)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
          <div className="space-y-6 lg:col-span-4">
            <Skeleton className="h-56 w-full rounded-3xl" />
            <Skeleton className="h-44 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  // 2. Trạng thái Lỗi / Không tìm thấy / Không có quyền (403/404)
  if (isError || !data) {
    const errorMsg = (error as Error)?.message || 'Không tìm thấy thông tin yêu cầu Mentoring'
    const isForbidden = errorMsg.includes('không có quyền') || errorMsg.includes('Forbidden')

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/app/mentoring/requests')}
          className="inline-flex items-center gap-2 rounded-xl text-xs font-bold text-plum-600 transition-colors hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách yêu cầu</span>
        </button>

        <Card className="border border-plum-900/[0.08] p-8 text-center shadow-xs dark:border-[#393a3b]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-plum-900 dark:text-white">
            {isForbidden ? 'Truy cập bị từ chối' : 'Không tìm thấy yêu cầu cố vấn'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-plum-600 dark:text-[#b0b3b8]">
            {isForbidden
              ? 'Yêu cầu cố vấn này thuộc về người dùng khác hoặc bạn không có quyền xem thông tin phản hồi của yêu cầu này.'
              : errorMsg}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/app/mentoring/requests')}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-700"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Về danh sách yêu cầu của tôi</span>
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-plum-900/[0.1] bg-white px-4 py-2.5 text-xs font-bold text-plum-700 shadow-2xs transition-colors hover:bg-cream-100 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const isDirect = data.requestType === 'DIRECT'
  const taskOption = TASK_TYPE_OPTIONS.find((t) => t.value === data.taskType)
  const taskLabel = taskOption ? taskOption.label : data.taskType
  const modeLabel = data.workingMode ? WORKING_MODE_LABELS[data.workingMode] : ''
  const participationLabel = data.participationType ? PARTICIPATION_TYPE_LABELS[data.participationType] : ''

  const mentorResponses = data.mentorResponses ?? []

  return (
    <div className="space-y-6">
      {/* Thanh điều hướng quay lại & Làm mới */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/app/mentoring/requests')}
          className="inline-flex items-center gap-2 rounded-xl text-xs font-bold text-plum-600 transition-colors hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách yêu cầu</span>
        </button>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-xl border border-plum-900/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-plum-700 shadow-2xs transition-colors hover:bg-cream-100 disabled:opacity-50 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb]"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin text-brand-600')} />
          <span>Làm mới phản hồi</span>
        </button>
      </div>

      {/* Header chi tiết yêu cầu */}
      <Card className="border border-plum-900/[0.08] p-6 shadow-xs dark:border-[#393a3b]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <RequestTypeBadge type={data.requestType} />
              <RequestStatusBadge status={data.status} />
              <span className="inline-flex items-center rounded-full bg-cream-100 px-3 py-1 text-xs font-bold text-plum-700 dark:bg-white/[0.06] dark:text-[#e4e6eb]">
                {data.industryName}
              </span>
            </div>

            <h1 className="text-xl font-extrabold text-plum-900 sm:text-2xl dark:text-white">
              {data.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-plum-500 dark:text-[#8f9399]">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-plum-400" />
                Ngày tạo: {formatDateTime(data.createdAt)}
              </span>
              {data.expectedDeadline && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-plum-400" />
                  Hạn chót mong muốn: {formatDateTime(data.expectedDeadline)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Bố cục 2 cột: Cột trái (Nội dung + Phản hồi), Cột phải (Tổng kết + Lưu ý) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CỘT TRÁI (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Thông tin chi tiết yêu cầu */}
          <Card className="border border-plum-900/[0.08] p-6 shadow-xs dark:border-[#393a3b]">
            <h2 className="text-base font-bold text-plum-900 dark:text-white">Nội dung yêu cầu hướng dẫn</h2>

            <div className="mt-3.5 rounded-2xl bg-cream-50/60 p-4 text-sm leading-relaxed text-plum-800 whitespace-pre-wrap dark:bg-white/[0.02] dark:text-[#e4e6eb]">
              {data.description}
            </div>

            {/* Lưới thông số yêu cầu */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-plum-900/[0.05] bg-cream-100/40 p-3.5 dark:border-white/[0.05] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 text-xs font-semibold text-plum-500 dark:text-[#8f9399]">
                  <Briefcase className="h-4 w-4 text-plum-600 dark:text-plum-400" />
                  <span>Nhu cầu hỗ trợ</span>
                </div>
                <p className="mt-1 text-sm font-bold text-plum-900 dark:text-white">{taskLabel}</p>
              </div>

              <div className="rounded-2xl border border-plum-900/[0.05] bg-cream-100/40 p-3.5 dark:border-white/[0.05] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 text-xs font-semibold text-plum-500 dark:text-[#8f9399]">
                  <Coins className="h-4 w-4 text-plum-600 dark:text-plum-400" />
                  <span>Ngân sách dự kiến</span>
                </div>
                <p className="mt-1 text-sm font-bold text-plum-900 dark:text-white">
                  {formatCurrency(data.budgetMin)} - {formatCurrency(data.budgetMax)}
                </p>
              </div>

              <div className="rounded-2xl border border-plum-900/[0.05] bg-cream-100/40 p-3.5 dark:border-white/[0.05] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 text-xs font-semibold text-plum-500 dark:text-[#8f9399]">
                  <Laptop className="h-4 w-4 text-plum-600 dark:text-plum-400" />
                  <span>Hình thức làm việc</span>
                </div>
                <p className="mt-1 text-sm font-bold text-plum-900 dark:text-white">{modeLabel || 'Linh hoạt'}</p>
              </div>

              <div className="rounded-2xl border border-plum-900/[0.05] bg-cream-100/40 p-3.5 dark:border-white/[0.05] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 text-xs font-semibold text-plum-500 dark:text-[#8f9399]">
                  <Users className="h-4 w-4 text-plum-600 dark:text-plum-400" />
                  <span>Hình thức tham gia</span>
                </div>
                <p className="mt-1 text-sm font-bold text-plum-900 dark:text-white">{participationLabel || 'Cá nhân 1-1'}</p>
              </div>
            </div>

            {/* Tài liệu đính kèm nếu có */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="mt-6 border-t border-plum-900/[0.06] pt-4 dark:border-[#393a3b]">
                <h3 className="flex items-center gap-2 text-xs font-bold text-plum-700 dark:text-[#e4e6eb]">
                  <Paperclip className="h-4 w-4 text-plum-500" />
                  <span>Tài liệu đính kèm ({data.attachments.length})</span>
                </h3>
                <div className="mt-3 space-y-2">
                  {data.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-plum-900/[0.06] bg-cream-50/80 px-3.5 py-2.5 text-xs transition-colors hover:bg-cream-100 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Paperclip className="h-4 w-4 shrink-0 text-brand-600" />
                        <span className="truncate font-semibold text-plum-800 group-hover:text-brand-600 dark:text-[#e4e6eb]">
                          {file.fileName}
                        </span>
                        <span className="text-plum-400 text-[11px] shrink-0">
                          ({formatFileSize(file.fileSize)})
                        </span>
                      </div>
                      <Download className="h-4 w-4 shrink-0 text-plum-400 transition-colors group-hover:text-brand-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Card 2: Danh sách phản hồi của Mentor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-plum-900 dark:text-white">
                  Phản hồi từ Mentor ({mentorResponses.length})
                </h2>
                <p className="text-xs text-plum-500 dark:text-[#8f9399]">
                  {isDirect
                    ? 'Yêu cầu được gửi riêng cho 1 Mentor đã chọn'
                    : 'Danh sách các Mentor thực sự được hệ thống phân phối yêu cầu này'}
                </p>
              </div>
            </div>

            {/* Khi không có Mentor nào (Ví dụ matchedCount = 0 của General Request) */}
            {mentorResponses.length === 0 ? (
              <Card className="border border-plum-900/[0.08] p-8 text-center shadow-xs dark:border-[#393a3b]">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-plum-900 dark:text-white">
                  Chưa có Mentor phù hợp được phân phối
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-plum-600 dark:text-[#b0b3b8]">
                  Yêu cầu của bạn đã được lưu vào hệ thống. Hệ thống sẽ tự động ghép nối và thông báo khi có Mentor
                  mới phù hợp với lĩnh vực này. Bạn cũng có thể chủ động tìm kiếm và gửi yêu cầu trực tiếp.
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => navigate('/app/mentoring/discover')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-700"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Khám phá danh bạ Mentor</span>
                  </button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {mentorResponses.map((response) => (
                  <MentorResponseCard
                    key={`${response.mentorProfileId}-${response.distributedAt}`}
                    response={response}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (4 cols): Tổng hợp & Lưu ý nghiệp vụ */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card Thống kê phản hồi */}
          <RequestResponseSummaryCard
            requestType={data.requestType}
            summary={data.responseSummary}
            targetMentorName={data.targetMentorName}
            directMentorStatus={data.directMentorResponseStatus}
          />

          {/* Card Ràng buộc nghiệp vụ ACCEPTED ≠ Deal */}
          <Card className="border border-plum-900/[0.08] bg-cream-50/60 p-5 shadow-xs dark:border-[#393a3b] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                <Info className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-plum-900 dark:text-white">Quy tắc trao đổi & Thỏa thuận</h3>
            </div>

            <ul className="mt-3.5 space-y-2.5 text-xs leading-relaxed text-plum-700 dark:text-[#b0b3b8]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>
                  Trạng thái <strong>Đã chấp nhận (ACCEPTED)</strong> chỉ có nghĩa Mentor đồng ý bắt đầu trao đổi hoặc thương lượng kế hoạch.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>
                  Hệ thống <strong>KHÔNG tự động tạo thỏa thuận (Deal)</strong>, không thu phí hoặc kích hoạt nhiệm vụ cho đến khi hai bên hoàn tất trao đổi.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>
                  Khi Mentor chấp nhận, bạn có thể bấm nút <strong>Nhắn tin trao đổi</strong> để thảo luận lịch hẹn chi tiết qua hệ thống tin nhắn.
                </span>
              </li>
            </ul>
          </Card>

          {/* Card Hỗ trợ & Hỏi đáp */}
          <Card className="border border-plum-900/[0.08] p-5 shadow-xs dark:border-[#393a3b]">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="h-5 w-5 text-plum-400" />
              <h3 className="text-sm font-bold text-plum-900 dark:text-white">Cần thêm hỗ trợ?</h3>
            </div>
            <p className="mt-2 text-xs text-plum-600 dark:text-[#b0b3b8]">
              Nếu không nhận được phản hồi từ các Mentor sau 48 giờ, bạn có thể tạo yêu cầu mới hoặc chủ động tìm kiếm các Mentor đang tích cực hoạt động trên Bảng xếp hạng.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate('/app/mentoring/discover')}
                className="w-full rounded-xl border border-plum-900/[0.1] bg-white py-2 text-xs font-bold text-plum-700 transition-colors hover:bg-cream-100 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb]"
              >
                Khám phá Mentor khác
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/mentoring/requests/create')}
                className="w-full rounded-xl bg-brand-50 py-2 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300"
              >
                Tạo yêu cầu mới
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

/**
 * Trang Chi tiết Yêu cầu Mentoring & Xem phản hồi từ Mentor (UC102 — View Mentoring Request Responses).
 * Tích hợp bảo vệ bởi MentoringTermsGate và AppShell.
 */
export function MentoringRequestDetailPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentoringRequestDetailContent />
      </MentoringTermsGate>
    </Container>
  )
}
