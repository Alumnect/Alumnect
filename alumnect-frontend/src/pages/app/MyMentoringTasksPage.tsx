import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Search,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { Container, Button, EmptyState } from '@/components/ui'
import {
  MentoringTermsGate,
  MentoringTaskCard,
  useMyTasks,
  type MentoringTaskUIStage,
} from '@/features/mentorship'

/**
 * Component hiển thị danh sách nhiệm vụ của User (UC106: Xem & quản lý Mentoring Task).
 * Dành cho cả Student và Mentor.
 */
function MyMentoringTasksContent() {
  const navigate = useNavigate()
  const [selectedStage, setSelectedStage] = useState<MentoringTaskUIStage | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)

  // Query tasks từ backend theo authenticated user (không truyền userId thủ công)
  const stageParam = selectedStage === 'ALL' ? undefined : selectedStage
  const { data: pageData, isLoading, isError, error, refetch, isFetching } = useMyTasks(
    stageParam,
    undefined,
    page,
    9
  )

  const tasks = pageData?.content || []
  const totalPages = pageData?.totalPages || 0
  const totalElements = pageData?.totalElements || 0

  // Filter client-side by keyword nếu có
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks
    const query = searchQuery.toLowerCase().trim()
    return tasks.filter(
      (t) =>
        t.taskTitle.toLowerCase().includes(query) ||
        (t.taskScope && t.taskScope.toLowerCase().includes(query)) ||
        (t.mentorName && t.mentorName.toLowerCase().includes(query)) ||
        (t.studentName && t.studentName.toLowerCase().includes(query))
    )
  }, [tasks, searchQuery])

  const stageTabs: { label: string; value: MentoringTaskUIStage | 'ALL'; countDesc?: string }[] = [
    { label: 'Tất cả nhiệm vụ', value: 'ALL' },
    { label: 'Chuẩn bị (Preparation)', value: 'PREPARATION' },
    { label: 'Đang thực hiện (In Progress)', value: 'IN_PROGRESS' },
    { label: 'Kết thúc (Ending)', value: 'ENDING' },
  ]

  const handleSelectTask = (taskId: number) => {
    navigate(`/app/mentoring/tasks/${taskId}`)
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-teal-50/80 via-white to-sky-50/60 p-6 sm:p-8 border border-teal-200/50 shadow-xs dark:from-teal-950/20 dark:via-[#242526] dark:to-sky-950/20 dark:border-white/10">
        <div className="space-y-1.5 max-w-xl text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-100/70 px-3 py-1 text-xs font-bold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
            <Briefcase className="h-3.5 w-3.5" />
            <span>Không gian làm việc Mentoring</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-plum-900 dark:text-[#f0f2f5]">
            Nhiệm vụ Mentoring của tôi
          </h1>
          <p className="text-xs sm:text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Theo dõi toàn bộ tiến độ các nhiệm vụ Mentoring đã kích hoạt sau khi thanh toán thành công.
            Mentor ghi nhận Work Log, Học viên theo dõi kết quả và xác nhận nghiệm thu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-2xl border-border bg-card/60 backdrop-blur-xs text-xs font-semibold gap-2 shadow-xs hover:bg-card"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/app/mentoring/deals')}
            className="rounded-2xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold gap-1.5 shadow-sm shadow-teal-600/20"
          >
            <span>Xem thỏa thuận Deal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Stage Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-plum-900/[0.08] pb-2 sm:border-b-0 sm:pb-0 dark:border-white/10">
          {stageTabs.map((tab) => {
            const isActive = selectedStage === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setSelectedStage(tab.value)
                  setPage(0)
                }}
                className={`relative rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                    : 'bg-plum-900/[0.04] text-plum-700 hover:bg-plum-900/[0.08] dark:bg-white/5 dark:text-[#e4e6eb] dark:hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, người tham gia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-border/80 bg-background/80 pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 transition-all"
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 rounded-3xl border border-border/60 bg-card p-6 animate-pulse space-y-4 shadow-xs"
            >
              <div className="h-5 w-24 rounded-full bg-muted" />
              <div className="h-6 w-3/4 rounded-lg bg-muted" />
              <div className="h-16 rounded-2xl bg-muted/50" />
              <div className="h-10 rounded-2xl bg-muted" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Không thể tải danh sách nhiệm vụ"
          description={error?.message || 'Đã có lỗi xảy ra khi tải dữ liệu từ máy chủ. Vui lòng thử lại.'}
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-2xl">
              Thử lại
            </Button>
          }
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title="Chưa có nhiệm vụ Mentoring nào"
          description={
            selectedStage !== 'ALL'
              ? 'Không tìm thấy nhiệm vụ nào ở giai đoạn này. Bạn có thể chuyển sang tab Tất cả để kiểm tra.'
              : 'Nhiệm vụ Mentoring chỉ được tự động kích hoạt sau khi thỏa thuận Mentoring Deal được xác nhận và thanh toán thành công.'
          }
          action={
            <Button
              onClick={() => navigate('/app/mentoring/deals')}
              className="rounded-2xl bg-teal-600 text-white hover:bg-teal-700"
            >
              Xem danh sách Deal
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium px-1">
            <span>
              Hiển thị {filteredTasks.length} nhiệm vụ {totalElements > 0 && `(tổng cộng ${totalElements})`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <MentoringTaskCard
                key={task.id}
                task={task}
                onSelect={handleSelectTask}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-xl text-xs font-semibold"
              >
                Trang trước
              </Button>
              <span className="text-xs font-medium text-muted-foreground px-3">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-xl text-xs font-semibold"
              >
                Trang sau
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Trang danh sách Mentoring Tasks của người dùng (UC106).
 */
export function MyMentoringTasksPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MyMentoringTasksContent />
      </MentoringTermsGate>
    </Container>
  )
}

export default MyMentoringTasksPage
