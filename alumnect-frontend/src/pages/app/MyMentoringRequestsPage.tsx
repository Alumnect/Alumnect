import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw, Send, Sparkles, BookOpen, AlertCircle } from 'lucide-react'
import { Container, EmptyState, Skeleton } from '@/components/ui'
import {
  MentoringTermsGate,
  MyRequestCard,
  useMyMentoringRequests,
  type MentoringRequestType,
} from '@/features/mentorship'
import { cn } from '@/lib/utils'

/**
 * Trang danh sách Yêu cầu Mentoring của tôi (UC102 — View Mentoring Request Responses).
 * Tích hợp điều hướng Mentoring → My Requests trong hệ thống AlumNect.
 */
function MyMentoringRequestsContent() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'ALL' | MentoringRequestType>('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const { data, isLoading, isError, error, refetch, isFetching } = useMyMentoringRequests({
    page,
    size: pageSize,
  })

  const requests = data?.content ?? []

  // Lọc theo Tab (Tất cả, Yêu cầu chung UC100, Yêu cầu trực tiếp UC101)
  const filteredRequests = useMemo(() => {
    if (activeTab === 'ALL') return requests
    return requests.filter((r) => r.requestType === activeTab)
  }, [requests, activeTab])

  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-plum-500 dark:text-[#8f9399]">
            <span>Mentorship</span>
            <span>/</span>
            <span className="text-brand-600 dark:text-brand-400">Yêu cầu của tôi</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-plum-900 sm:text-3xl dark:text-white">
            Yêu cầu Mentoring của tôi
          </h1>
          <p className="mt-1 text-sm text-plum-600 dark:text-[#b0b3b8]">
            Theo dõi trạng thái tiếp nhận và phản hồi từ các Mentor đối với các yêu cầu hướng dẫn bạn đã gửi.
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

          <button
            type="button"
            onClick={() => navigate('/app/mentoring/requests/create')}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4.5 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:opacity-95 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo yêu cầu mới</span>
          </button>
        </div>
      </div>

      {/* Tabs lọc theo Loại yêu cầu */}
      <div className="flex flex-wrap items-center gap-2 border-b border-plum-900/[0.08] pb-3 dark:border-[#393a3b]">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            activeTab === 'ALL'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-cream-100/80 text-plum-600 hover:bg-cream-200 hover:text-plum-900 dark:bg-white/[0.05] dark:text-[#b0b3b8] dark:hover:bg-white/[0.1] dark:hover:text-white',
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Tất cả ({totalElements})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('GENERAL')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            activeTab === 'GENERAL'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-cream-100/80 text-plum-600 hover:bg-cream-200 hover:text-plum-900 dark:bg-white/[0.05] dark:text-[#b0b3b8] dark:hover:bg-white/[0.1] dark:hover:text-white',
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Yêu cầu chung</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DIRECT')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            activeTab === 'DIRECT'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'bg-cream-100/80 text-plum-600 hover:bg-cream-200 hover:text-plum-900 dark:bg-white/[0.05] dark:text-[#b0b3b8] dark:hover:bg-white/[0.1] dark:hover:text-white',
          )}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Gửi trực tiếp</span>
        </button>
      </div>

      {/* Xử lý Trạng thái: Lỗi mạng / API */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-sm text-rose-800 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <h4 className="font-bold">Không thể tải danh sách yêu cầu Mentoring</h4>
              <p className="mt-1 text-xs opacity-90">
                {(error as Error)?.message || 'Vui lòng kiểm tra lại kết nối mạng và thử lại sau ít phút.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xử lý Trạng thái: Đang tải dữ liệu (Loading Skeleton) */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-plum-900/[0.08] bg-white p-6 shadow-xs dark:border-[#393a3b] dark:bg-[#242526]">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-6 w-3/4 rounded-xl" />
              <Skeleton className="mt-2 h-4 w-full rounded-lg" />
              <Skeleton className="mt-4 h-12 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      )}

      {/* Xử lý Trạng thái: Danh sách trống (Empty State) */}
      {!isLoading && !isError && filteredRequests.length === 0 && (
        <div className="rounded-3xl border border-plum-900/[0.08] bg-white py-12 px-4 shadow-xs dark:border-[#393a3b] dark:bg-[#242526]">
          <EmptyState
            title="Chưa có yêu cầu Mentoring nào"
            description={
              activeTab === 'ALL'
                ? 'Bạn chưa tạo yêu cầu hướng dẫn nào. Hãy tạo yêu cầu để được kết nối với mạng lưới Mentor chất lượng cao của FPT University!'
                : `Không tìm thấy yêu cầu nào thuộc danh mục ${activeTab === 'GENERAL' ? 'Yêu cầu chung' : 'Gửi trực tiếp'}.`
            }
            action={
              <button
                type="button"
                onClick={() => navigate('/app/mentoring/requests/create')}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:opacity-95"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo yêu cầu Mentoring đầu tiên</span>
              </button>
            }
          />
        </div>
      )}

      {/* Danh sách yêu cầu đã tải thành công */}
      {!isLoading && !isError && filteredRequests.length > 0 && (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <MyRequestCard key={req.id} request={req} />
          ))}

          {/* Phân trang (Pagination) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-plum-900/[0.08] pt-4 dark:border-[#393a3b]">
              <p className="text-xs text-plum-500 dark:text-[#8f9399]">
                Trang <span className="font-bold text-plum-800 dark:text-white">{page + 1}</span> / {totalPages} (Tổng {totalElements} yêu cầu)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-xl border border-plum-900/[0.1] bg-white px-3.5 py-1.5 text-xs font-bold text-plum-700 shadow-2xs transition-colors hover:bg-cream-100 disabled:opacity-40 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb]"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-xl border border-plum-900/[0.1] bg-white px-3.5 py-1.5 text-xs font-bold text-plum-700 shadow-2xs transition-colors hover:bg-cream-100 disabled:opacity-40 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb]"
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

/**
 * Trang danh sách Yêu cầu Mentoring của tôi (UC102 — View Mentoring Request Responses).
 * Bao bọc bởi MentoringTermsGate để đảm bảo điều khoản UC90 trước khi tương tác.
 */
export function MyMentoringRequestsPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MyMentoringRequestsContent />
      </MentoringTermsGate>
    </Container>
  )
}
