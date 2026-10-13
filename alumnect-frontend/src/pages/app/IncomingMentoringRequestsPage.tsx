import { useState } from 'react'
import {
  Inbox,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { Container, EmptyState, Skeleton } from '@/components/ui'
import {
  MentoringTermsGate,
  IncomingRequestCard,
  useIncomingMentoringRequests,
  type MentoringResponseStatus,
  type IncomingRequestScope,
} from '@/features/mentorship'
import { cn } from '@/lib/utils'

/**
 * Trang danh sách Yêu cầu Mentoring gửi đến (UC103 — View & Respond to Mentoring Requests).
 * Dành cho Mentor xem danh sách Direct Requests và General Requests được phân phối đến mình.
 */
function IncomingMentoringRequestsContent() {
  const [responseStatusFilter, setResponseStatusFilter] = useState<'ALL' | MentoringResponseStatus>('ALL')
  const [scopeFilter, setScopeFilter] = useState<IncomingRequestScope>('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Ánh xạ trạng thái hiển thị (WAITING, ACCEPTED, DECLINED) sang status của backend (PENDING, ACCEPTED, REJECTED)
  const backendStatus =
    responseStatusFilter === 'ALL'
      ? undefined
      : responseStatusFilter === 'WAITING'
        ? 'PENDING'
        : responseStatusFilter === 'DECLINED'
          ? 'REJECTED'
          : responseStatusFilter

  // Gọi API lấy danh sách yêu cầu gửi đến
  const { data, isLoading, isError, error, refetch, isFetching } = useIncomingMentoringRequests({
    status: backendStatus,
    scope: scopeFilter,
    page,
    size: pageSize,
  })

  const requests = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  const handleStatusChange = (status: 'ALL' | MentoringResponseStatus) => {
    setResponseStatusFilter(status)
    setPage(0)
  }

  const handleScopeChange = (scope: IncomingRequestScope) => {
    setScopeFilter(scope)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-plum-500 dark:text-[#8f9399]">
            <span>Mentorship</span>
            <span>/</span>
            <span className="text-brand-600 dark:text-brand-400">Yêu cầu gửi đến</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-plum-900 sm:text-3xl dark:text-white">
            Yêu cầu Mentoring gửi đến
          </h1>
          <p className="mt-1 text-sm text-plum-600 dark:text-[#b0b3b8]">
            Xem và phản hồi các yêu cầu hướng dẫn từ sinh viên được phân phối hoặc gửi trực tiếp cho bạn.
          </p>
        </div>

        {/* Nút hành động đầu trang */}
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Làm mới danh sách"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-plum-900/[0.08] bg-white text-plum-600 shadow-2xs transition-colors hover:bg-cream-100 hover:text-plum-900 disabled:opacity-50 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#b0b3b8] dark:hover:bg-white/[0.05] dark:hover:text-white"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin text-brand-600')} />
          </button>
        </div>
      </div>

      {/* Thông tin lưu ý nghiệp vụ: Đồng ý trao đổi ≠ Chốt Deal */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <span className="font-bold">Lưu ý nghiệp vụ AlumNect:</span> Khi bấm{' '}
          <span className="font-bold underline">Đồng ý trao đổi (ACCEPT)</span>, bạn xác nhận mở kênh thảo
          luận chi tiết với sinh viên qua tin nhắn. Hành động này{' '}
          <span className="font-bold">KHÔNG tự động tạo thỏa thuận (Deal)</span> hay cam kết thanh toán nào cho
          đến khi hai bên thống nhất mục tiêu và phạm vi hướng dẫn.
        </div>
      </div>

      {/* Thanh bộ lọc kép: Trạng thái phản hồi & Loại yêu cầu */}
      <div className="flex flex-col gap-3 rounded-2xl border border-plum-900/[0.08] bg-white/70 p-4 shadow-2xs backdrop-blur-xs sm:flex-row sm:items-center sm:justify-between dark:border-[#393a3b] dark:bg-[#242526]/70">
        {/* Bộ lọc trạng thái phản hồi */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 hidden items-center gap-1 text-xs font-semibold text-plum-500 sm:inline-flex dark:text-[#8f9399]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Trạng thái:
          </span>

          <button
            type="button"
            onClick={() => handleStatusChange('ALL')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
              responseStatusFilter === 'ALL'
                ? 'bg-plum-900 text-white shadow-2xs dark:bg-white dark:text-plum-900'
                : 'text-plum-600 hover:bg-cream-100 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:bg-white/[0.06] dark:hover:text-white',
            )}
          >
            Tất cả
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('WAITING')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
              responseStatusFilter === 'WAITING'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30',
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Chờ phản hồi</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('ACCEPTED')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
              responseStatusFilter === 'ACCEPTED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30',
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Đã đồng ý</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('DECLINED')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
              responseStatusFilter === 'DECLINED'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30',
            )}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Đã từ chối</span>
          </button>
        </div>

        {/* Bộ lọc mức độ phù hợp */}
        <div className="flex items-center gap-1 border-t border-plum-900/[0.06] pt-2 sm:border-t-0 sm:pt-0 dark:border-[#393a3b]">
          <span className="text-xs text-plum-400 dark:text-[#8f9399]">Lọc:</span>
          <button
            type="button"
            onClick={() => handleScopeChange('ALL')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
              scopeFilter === 'ALL'
                ? 'bg-brand-50 font-bold text-brand-600 dark:bg-brand-950/40 dark:text-brand-300'
                : 'text-plum-600 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white',
            )}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange('SAME_INDUSTRY')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
              scopeFilter === 'SAME_INDUSTRY'
                ? 'bg-brand-50 font-bold text-brand-600 dark:bg-brand-950/40 dark:text-brand-300'
                : 'text-plum-600 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white',
            )}
          >
            Cùng ngành
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange('SAME_FORMAT')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
              scopeFilter === 'SAME_FORMAT'
                ? 'bg-brand-50 font-bold text-brand-600 dark:bg-brand-950/40 dark:text-brand-300'
                : 'text-plum-600 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white',
            )}
          >
            Cùng hình thức
          </button>
        </div>
      </div>

      {/* Trạng thái tải dữ liệu */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-plum-900/[0.08] bg-white p-5 shadow-2xs dark:border-[#393a3b] dark:bg-[#242526]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-md" />
                </div>
                <Skeleton className="h-10 w-28 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trạng thái lỗi */}
      {isError && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-center text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
          <h3 className="mt-2 text-base font-bold">Không thể tải danh sách yêu cầu</h3>
          <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
            {error instanceof Error ? error.message : 'Đã có lỗi xảy ra từ máy chủ, vui lòng thử lại sau.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại
          </button>
        </div>
      )}

      {/* Trạng thái danh sách rỗng */}
      {!isLoading && !isError && requests.length === 0 && (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="Chưa có yêu cầu hướng dẫn nào"
          description={
            responseStatusFilter === 'ALL' && scopeFilter === 'ALL'
              ? 'Hiện tại chưa có yêu cầu mở hoặc yêu cầu trực tiếp nào dành cho bạn. Hãy đảm bảo hồ sơ Mentor đang ACTIVE và gói Subscription còn hiệu lực.'
              : 'Không tìm thấy yêu cầu hướng dẫn nào phù hợp với bộ lọc hiện tại. Hãy thử thay đổi tiêu chí lọc.'
          }
        />
      )}

      {/* Danh sách yêu cầu */}
      {!isLoading && !isError && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((item) => (
            <IncomingRequestCard key={item.distributionId ?? `request-${item.id}`} request={item} />
          ))}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-plum-900/[0.08] pt-4 dark:border-[#393a3b]">
              <span className="text-xs text-plum-500 dark:text-[#8f9399]">
                Trang {page + 1} / {totalPages} (Tổng số: {totalElements} yêu cầu)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-xl border border-plum-900/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-plum-700 transition-colors hover:bg-cream-100 disabled:opacity-40 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#b0b3b8] dark:hover:bg-white/[0.05]"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-xl border border-plum-900/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-plum-700 transition-colors hover:bg-cream-100 disabled:opacity-40 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#b0b3b8] dark:hover:bg-white/[0.05]"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function IncomingMentoringRequestsPage() {
  return (
    <MentoringTermsGate>
      <Container className="py-6 sm:py-8">
        <IncomingMentoringRequestsContent />
      </Container>
    </MentoringTermsGate>
  )
}
