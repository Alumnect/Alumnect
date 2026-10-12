import { useState } from 'react'
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
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldAlert,
  User,
} from 'lucide-react'
import { Container, Card, Skeleton } from '@/components/ui'
import {
  MentoringTermsGate,
  RequestTypeBadge,
  IncomingRequestResponseModal,
  useIncomingMentoringRequestDetail,
  useAcceptIncomingRequest,
  useDeclineIncomingRequest,
  TASK_TYPE_OPTIONS,
  WORKING_MODE_LABELS,
  PARTICIPATION_TYPE_LABELS,
} from '@/features/mentorship'
import { cn } from '@/lib/utils'

/**
 * Trang Chi tiết Yêu cầu Mentoring gửi đến cho Mentor (UC103).
 * Cho phép xem chi tiết nhu cầu sinh viên và ra quyết định ACCEPT / DECLINE.
 */
function IncomingMentoringRequestDetailContent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const requestId = id ? Number(id) : undefined

  // Modal phản hồi
  const [modalType, setModalType] = useState<'ACCEPT' | 'DECLINE' | null>(null)

  // API hooks
  const { data, isLoading, isError, error, refetch, isFetching } = useIncomingMentoringRequestDetail(requestId)
  const acceptMutation = useAcceptIncomingRequest()
  const declineMutation = useDeclineIncomingRequest()

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

  // 1. Trạng thái Đang tải
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

  // 2. Trạng thái Lỗi hoặc Không tìm thấy (403/404)
  if (isError || !data) {
    const errorMsg = (error as Error)?.message || 'Không tìm thấy thông tin yêu cầu Mentoring'
    const isForbidden = errorMsg.includes('không có quyền') || errorMsg.includes('Forbidden')

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/app/mentoring/incoming-requests')}
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
              ? 'Yêu cầu này không được phân phối hoặc gửi trực tiếp cho tài khoản Mentor của bạn.'
              : errorMsg}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/app/mentoring/incoming-requests')}
              className="rounded-2xl bg-plum-900 px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-plum-900"
            >
              Về danh sách yêu cầu
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-plum-900/[0.08] bg-white px-4 py-2.5 text-xs font-bold text-plum-700 transition-colors hover:bg-cream-100 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#b0b3b8]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử lại
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const { responseStatus, canRespond, canMessage, attachments } = data

  const handleModalSubmit = async (responseNote?: string) => {
    if (!requestId || !modalType) return

    if (modalType === 'ACCEPT') {
      await acceptMutation.mutateAsync({
        requestId,
        payload: { responseNote },
      })
    } else {
      await declineMutation.mutateAsync({
        requestId,
        payload: { responseNote },
      })
    }

    setModalType(null)
  }

  return (
    <div className="space-y-6">
      {/* Nút quay lại & Làm mới */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/app/mentoring/incoming-requests')}
          className="inline-flex items-center gap-2 rounded-xl text-xs font-bold text-plum-600 transition-colors hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Yêu cầu gửi đến</span>
        </button>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-xl border border-plum-900/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-plum-600 shadow-2xs transition-colors hover:bg-cream-100 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#b0b3b8]"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin text-brand-600')} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Header chi tiết yêu cầu */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <RequestTypeBadge type={data.requestType} />
          {data.industryName && (
            <span className="inline-flex items-center gap-1 rounded-full bg-plum-100/70 px-2.5 py-0.5 text-xs font-bold text-plum-700 dark:bg-white/[0.08] dark:text-[#b0b3b8]">
              <Briefcase className="h-3 w-3" />
              {data.industryName}
            </span>
          )}

          {/* Badge trạng thái phản hồi */}
          {responseStatus === 'WAITING' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-3 w-3" />
              Chờ phản hồi
            </span>
          )}
          {responseStatus === 'ACCEPTED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Đã đồng ý trao đổi
            </span>
          )}
          {responseStatus === 'DECLINED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
              <XCircle className="h-3 w-3" />
              Đã từ chối
            </span>
          )}
          {responseStatus === 'EXPIRED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-400">
              Hết hạn
            </span>
          )}
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-plum-900 sm:text-3xl dark:text-white">
          {data.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-plum-500 dark:text-[#8f9399]">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Nhận yêu cầu: {formatDateTime(data.distributedAt || data.createdAt)}
          </span>
          {data.expectedDeadline && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Hạn chót mong muốn: {formatDateTime(data.expectedDeadline)}
            </span>
          )}
        </div>
      </div>

      {/* Grid 2 Cột */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cột trái: Thông tin Student, Nội dung yêu cầu, File đính kèm, Quyết định */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card Sinh viên gửi yêu cầu */}
          <Card className="border border-plum-900/[0.08] p-5 shadow-2xs dark:border-[#393a3b]">
            <div className="flex items-center gap-2 border-b border-plum-900/[0.06] pb-3 text-xs font-bold uppercase tracking-wider text-plum-500 dark:border-[#393a3b] dark:text-[#8f9399]">
              <User className="h-4 w-4 text-brand-600" />
              <span>Thông tin sinh viên gửi yêu cầu</span>
            </div>

            <div className="mt-4 flex items-start gap-4">
              {data.studentAvatar ? (
                <img
                  src={data.studentAvatar}
                  alt={data.studentName}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-brand-500/20"
                />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 text-lg font-bold text-white shadow-xs">
                  {data.studentName ? data.studentName.charAt(0).toUpperCase() : 'S'}
                </div>
              )}

              <div className="flex-1 space-y-1">
                <h3 className="text-base font-extrabold text-plum-900 dark:text-white">
                  {data.studentName}
                </h3>
                {data.studentHeadline && (
                  <p className="text-xs text-plum-600 dark:text-[#b0b3b8]">{data.studentHeadline}</p>
                )}
                {data.studentEmail && (
                  <p className="text-2xs text-plum-400 dark:text-[#8f9399]">{data.studentEmail}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Card Nội dung chi tiết yêu cầu */}
          <Card className="border border-plum-900/[0.08] p-6 shadow-2xs dark:border-[#393a3b]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-plum-500 dark:text-[#8f9399]">
              Nội dung mô tả yêu cầu
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-plum-800 dark:text-[#e4e6eb]">
              {data.description}
            </p>

            {/* Chi tiết thông số */}
            <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-cream-50/70 p-4 sm:grid-cols-2 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5 text-xs">
                <Coins className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="text-plum-500 dark:text-[#8f9399]">Ngân sách:</span>
                <span className="font-bold text-plum-900 dark:text-white">
                  {data.budgetMin || data.budgetMax
                    ? `${formatCurrency(data.budgetMin)} - ${formatCurrency(data.budgetMax)}`
                    : 'Thỏa thuận'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <Laptop className="h-4 w-4 shrink-0 text-blue-500" />
                <span className="text-plum-500 dark:text-[#8f9399]">Hình thức làm việc:</span>
                <span className="font-bold text-plum-900 dark:text-white">
                  {data.workingMode ? WORKING_MODE_LABELS[data.workingMode] : 'Linh hoạt'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <Users className="h-4 w-4 shrink-0 text-purple-500" />
                <span className="text-plum-500 dark:text-[#8f9399]">Hình thức tham gia:</span>
                <span className="font-bold text-plum-900 dark:text-white">
                  {data.participationType ? PARTICIPATION_TYPE_LABELS[data.participationType] : '1-on-1'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <Briefcase className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-plum-500 dark:text-[#8f9399]">Loại công việc:</span>
                <span className="font-bold text-plum-900 dark:text-white">
                  {data.taskType
                    ? TASK_TYPE_OPTIONS.find((t) => t.value === data.taskType)?.label || data.taskType
                    : 'Không xác định'}
                </span>
              </div>
            </div>

            {/* Tệp đính kèm */}
            {attachments && attachments.length > 0 && (
              <div className="mt-6 border-t border-plum-900/[0.06] pt-4 dark:border-[#393a3b]">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-plum-500 dark:text-[#8f9399]">
                  <Paperclip className="h-3.5 w-3.5 text-brand-600" />
                  <span>Tài liệu đính kèm ({attachments.length})</span>
                </h4>
                <div className="mt-3 space-y-2">
                  {attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-plum-900/[0.08] bg-cream-50/50 p-3 transition-colors hover:bg-cream-100 dark:border-[#393a3b] dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Paperclip className="h-4 w-4 shrink-0 text-plum-400" />
                        <span className="truncate text-xs font-bold text-plum-900 dark:text-white">
                          {file.fileName || `Tài liệu ${idx + 1}`}
                        </span>
                        {file.fileSize && (
                          <span className="text-2xs text-plum-400">({formatFileSize(file.fileSize)})</span>
                        )}
                      </div>
                      <Download className="h-4 w-4 shrink-0 text-plum-500 hover:text-brand-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Section Quyết định & Phản hồi của Mentor */}
          <Card className="border border-plum-900/[0.08] p-6 shadow-2xs dark:border-[#393a3b]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-plum-500 dark:text-[#8f9399]">
              Quyết định phản hồi của bạn
            </h3>

            {/* Trường hợp 1: Chờ phản hồi và ĐƯỢC PHÉP phản hồi */}
            {responseStatus === 'WAITING' && canRespond && (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-plum-600 dark:text-[#b0b3b8]">
                  Bạn có thể đồng ý trao đổi với sinh viên để bắt đầu thảo luận yêu cầu này, hoặc từ chối nếu không phù hợp với thời gian hay chuyên môn của bạn.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType('DECLINE')}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Từ chối yêu cầu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType('ACCEPT')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 hover:shadow-md"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Đồng ý trao đổi (ACCEPT)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Trường hợp 2: ĐÃ ĐỒNG Ý TRAO ĐỔI (ACCEPTED) */}
            {responseStatus === 'ACCEPTED' && (
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold">Bạn đã đồng ý trao đổi yêu cầu này.</p>
                    <p>
                      Phản hồi lúc: <span className="font-semibold">{formatDateTime(data.respondedAt)}</span>
                    </p>
                    {data.responseNote && (
                      <p className="mt-2 rounded-xl bg-white/70 p-2.5 italic text-emerald-950 dark:bg-black/20 dark:text-emerald-200">
                        &ldquo;{data.responseNote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Entry point nhắn tin UC104 */}
                {canMessage && data.studentId && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/app/messages?userId=${data.studentId}`)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Nhắn tin trao đổi với sinh viên</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Trường hợp 3: ĐÃ TỪ CHỐI (DECLINED) */}
            {responseStatus === 'DECLINED' && (
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-rose-900 dark:border-rose-800/40 dark:bg-rose-950/20 dark:text-rose-300">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold">Bạn đã từ chối yêu cầu này.</p>
                    <p>
                      Thời gian từ chối: <span className="font-semibold">{formatDateTime(data.respondedAt)}</span>
                    </p>
                    {data.responseNote && (
                      <p className="mt-2 rounded-xl bg-white/70 p-2.5 italic text-rose-950 dark:bg-black/20 dark:text-rose-200">
                        Lý do / Ghi chú: &ldquo;{data.responseNote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Trường hợp 4: WAITING nhưng KHÔNG ĐƯỢC PHÉP phản hồi (do request đã closed hoặc hết hạn) */}
            {responseStatus === 'WAITING' && !canRespond && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-bold">Không thể gửi phản hồi tại thời điểm này.</p>
                  <p className="mt-0.5">
                    Yêu cầu này đã được đóng hoặc không còn chấp nhận phản hồi mới, hoặc tài khoản Mentor của bạn cần duy trì trạng thái ACTIVE và gói Subscription còn hạn.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Cột phải: Tóm tắt trạng thái và Hướng dẫn nghiệp vụ */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card Tóm tắt trạng thái */}
          <Card className="border border-plum-900/[0.08] p-5 shadow-2xs dark:border-[#393a3b]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-plum-500 dark:text-[#8f9399]">
              Thông tin phân phối
            </h3>

            <div className="mt-4 space-y-3 divide-y divide-plum-900/[0.06] text-xs dark:divide-[#393a3b]">
              <div className="flex items-center justify-between pb-2">
                <span className="text-plum-500 dark:text-[#8f9399]">Hình thức gửi:</span>
                <span className="font-bold text-plum-900 dark:text-white">
                  {data.requestType === 'DIRECT' ? 'Gửi trực tiếp (UC101)' : 'Hệ thống phân phối (UC100)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-plum-500 dark:text-[#8f9399]">Trạng thái yêu cầu:</span>
                <span className="font-bold text-plum-900 dark:text-white">
                  {data.requestStatus === 'OPEN' ? 'Đang mở (OPEN)' : data.requestStatus}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-plum-500 dark:text-[#8f9399]">Trạng thái của bạn:</span>
                <span className="font-bold text-plum-900 dark:text-white">
                  {responseStatus === 'WAITING' && 'Chờ phản hồi'}
                  {responseStatus === 'ACCEPTED' && 'Đã đồng ý trao đổi'}
                  {responseStatus === 'DECLINED' && 'Đã từ chối'}
                  {responseStatus === 'EXPIRED' && 'Hết hạn'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-plum-500 dark:text-[#8f9399]">Nhận vào lúc:</span>
                <span className="text-plum-700 dark:text-[#b0b3b8]">
                  {formatDateTime(data.distributedAt || data.createdAt)}
                </span>
              </div>
            </div>
          </Card>

          {/* Card Lưu ý nghiệp vụ AlumNect */}
          <Card className="border border-plum-900/[0.08] bg-gradient-to-br from-cream-50 to-cream-100 p-5 shadow-2xs dark:border-[#393a3b] dark:from-[#242526] dark:to-[#1e1f20]">
            <div className="flex items-center gap-2 text-xs font-bold text-plum-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span>Quy trình cố vấn AlumNect</span>
            </div>

            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-plum-600 dark:text-[#b0b3b8]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>
                  <strong>Bước 1:</strong> Bạn xem xét yêu cầu và chọn <em>Đồng ý trao đổi</em> nếu thấy phù hợp.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>
                  <strong>Bước 2:</strong> Hai bên nhắn tin trao đổi về mục tiêu, thời gian biểu và hình thức hướng dẫn.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>
                  <strong>Bước 3:</strong> Khi đã thống nhất, hai bên mới thiết lập thỏa thuận (Deal) chính thức.
                </span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Modal phản hồi Accept / Decline */}
      {modalType && (
        <IncomingRequestResponseModal
          isOpen={true}
          onClose={() => setModalType(null)}
          type={modalType}
          requestTitle={data.title}
          studentName={data.studentName}
          isLoading={acceptMutation.isPending || declineMutation.isPending}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  )
}

export default function IncomingMentoringRequestDetailPage() {
  return (
    <MentoringTermsGate>
      <Container className="py-6 sm:py-8">
        <IncomingMentoringRequestDetailContent />
      </Container>
    </MentoringTermsGate>
  )
}
