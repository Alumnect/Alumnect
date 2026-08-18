import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, BadgeCheck, UserPlus, Activity, Inbox, Loader2 } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem, Counter } from '@/components/motion'
import { cn } from '@/lib/utils'
import { useAdminOverview, useAdminVerifications, useReviewVerification } from '../hooks/useAdmin'

export function AdminOverviewPage() {
  const { data: summary, isLoading: isLoadingKpis, error: kpisError } = useAdminOverview()
  const { data: verificationsData, isLoading: isLoadingVerifications } = useAdminVerifications({
    status: 'PENDING',
    page: 0,
    size: 5,
  })

  const reviewMutation = useReviewVerification()

  // Modal Review Verification State
  const [selectedReq, setSelectedReq] = useState<{ id: number; fullName: string } | null>(null)
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  useEffect(() => {
    if (selectedReq && reviewAction) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedReq, reviewAction])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq || !reviewAction) return

    try {
      await reviewMutation.mutateAsync({
        id: selectedReq.id,
        status: reviewAction,
        reviewNote: reviewNote || (reviewAction === 'APPROVED' ? 'Minh chứng tốt nghiệp hợp lệ.' : 'Minh chứng không hợp lệ.'),
      })
      // Reset state
      setSelectedReq(null)
      setReviewAction(null)
      setReviewNote('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    }
  }

  // Fallback KPIs
  const kpis = summary
    ? [
        { label: 'Tổng số người dùng', value: summary.totalUsers, delta: '+12.4%', up: true },
        { label: 'Sinh viên', value: summary.totalStudents, delta: '+8.1%', up: true },
        { label: 'Cựu sinh viên (Đã xác minh)', value: summary.totalAlumni, delta: '+15.3%', up: true },
        {
          label: 'Hồ sơ chờ duyệt',
          value: summary.pendingAlumniVerifications,
          delta: 'Cần xử lý',
          up: summary.pendingAlumniVerifications > 0,
          isWarning: summary.pendingAlumniVerifications > 0,
        },
      ]
    : []

  const dailyRegs = summary?.dailyRegistrations || []
  const maxRegCount = dailyRegs.length ? Math.max(...dailyRegs.map((d) => d.count)) : 1

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Overview" subtitle="Chỉ số vận hành hệ thống, biểu đồ đăng ký và hàng đợi phê duyệt." />

      {/* KPI Section */}
      {isLoadingKpis ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} hover={false} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </Card>
          ))}
        </div>
      ) : kpisError ? (
        <EmptyState
          icon={<Inbox size={24} />}
          title="Không thể tải dữ liệu"
          description={kpisError instanceof Error ? kpisError.message : 'Lỗi kết nối máy chủ.'}
        />
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
          {kpis.map((k) => (
            <StaggerItem key={k.label}>
              <Card hover={false} className="p-5">
                <p className="text-sm text-plum-500">{k.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-plum-900">
                  <Counter value={k.value} compactFmt={k.value > 9999} />
                </p>
                <p
                  className={cn(
                    'mt-2 inline-flex items-center gap-1 text-xs font-bold',
                    k.isWarning ? 'text-gold-600' : k.up ? 'text-emerald-600' : 'text-rose-500'
                  )}
                >
                  <ArrowUpRight size={14} /> {k.delta}
                  <span className="font-medium text-plum-400"> so với tháng trước</span>
                </p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* Charts & Activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Registrations Chart */}
        <Reveal>
          <Card hover={false} className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-plum-900">Số lượng đăng ký mới</h2>
                <p className="text-xs text-plum-400">Thống kê 7 ngày gần nhất (tài khoản đăng ký mới)</p>
              </div>
              {dailyRegs.length > 0 && (
                <Badge tone="success" icon={<Activity size={13} />}>
                  Live
                </Badge>
              )}
            </div>
            {isLoadingKpis ? (
              <div className="flex h-52 items-end justify-between gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <Skeleton key={i} className="h-full w-full rounded-t-lg" />
                ))}
              </div>
            ) : dailyRegs.length === 0 ? (
              <EmptyState icon={<Activity size={22} />} title="Không có dữ liệu đăng ký" />
            ) : (
              <div className="flex h-52 items-end gap-2">
                {dailyRegs.map((d, i) => (
                  <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-brand-600/40 to-violet-500 transition-all duration-500 group-hover:from-brand-500 group-hover:to-violet-400"
                        style={{ height: `${(d.count / (maxRegCount || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-plum-400">
                      {d.date.substring(5)}
                    </span>
                    <span className="absolute -top-6 hidden rounded bg-plum-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Reveal>

        {/* Dynamic Tips & System info */}
        <Reveal direction="left">
          <Card hover={false} className="p-6">
            <h2 className="mb-5 font-bold text-plum-900">Trạng thái hệ thống</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-inset ring-emerald-300">
                  <UserPlus size={16} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-plum-700">Máy chủ API</p>
                  <p className="text-xs text-plum-400">Đang hoạt động ổn định (Cổng 8080)</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600 ring-1 ring-inset ring-violet-300">
                  <BadgeCheck size={16} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-plum-700">Phê duyệt cựu sinh viên</p>
                  <p className="text-xs text-plum-400">Quy trình tự động hóa dựa trên minh chứng</p>
                </div>
              </li>
            </ul>
          </Card>
        </Reveal>
      </div>

      {/* Pending Verifications Queue */}
      <Reveal>
        <Card hover={false} className="mt-6 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-plum-900">Đợi kiểm duyệt hồ sơ tốt nghiệp</h2>
            {verificationsData && verificationsData.totalElements > 0 && (
              <Badge tone="gold">{verificationsData.totalElements} trong hàng đợi</Badge>
            )}
          </div>
          {isLoadingVerifications ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : !verificationsData || verificationsData.content.length === 0 ? (
            <EmptyState icon={<BadgeCheck size={22} />} title="Không có hồ sơ chờ duyệt" />
          ) : (
            <ul className="divide-y divide-plum-900/8">
              {verificationsData.content.map((p) => (
                <li key={p.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex flex-1 items-start gap-3 min-w-0">
                    <Avatar name={p.fullName} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-plum-900">{p.fullName}</p>
                      <p className="text-xs text-plum-400">
                        Năm tốt nghiệp: {p.graduationYear} · Ngành: {p.majorCode}
                      </p>
                      {p.note && <p className="mt-1 text-xs italic text-plum-500">"{p.note}"</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    <a
                      href={p.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-plum-900/[0.04] px-3.5 py-1.5 text-xs font-bold text-plum-600 ring-1 ring-inset ring-plum-900/10 hover:bg-plum-900/[0.08]"
                    >
                      Xem minh chứng
                    </a>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedReq({ id: p.id, fullName: p.fullName })
                        setReviewAction('APPROVED')
                        setReviewNote('Minh chứng hợp lệ. Chấp nhận tài khoản cựu sinh viên FPTU.')
                      }}
                    >
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedReq({ id: p.id, fullName: p.fullName })
                        setReviewAction('REJECTED')
                        setReviewNote('')
                      }}
                    >
                      Từ chối
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Reveal>

      {/* Review Confirmation Modal */}
      {selectedReq && reviewAction &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/40 p-4 backdrop-blur-sm">
            <Card hover={false} className="w-full max-w-md bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-plum-900">
                {reviewAction === 'APPROVED' ? 'Duyệt hồ sơ cựu sinh viên' : 'Từ chối hồ sơ cựu sinh viên'}
              </h3>
              <p className="mt-2 text-sm text-plum-500">
                {reviewAction === 'APPROVED'
                  ? `Bạn có chắc muốn phê duyệt tài khoản cựu sinh viên cho `
                  : `Vui lòng nhập lý do từ chối tài khoản của cựu sinh viên `}
                <strong>{selectedReq.fullName}</strong>.
              </p>

              <form onSubmit={handleReviewSubmit} className="mt-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-plum-400">
                    Ghi chú phê duyệt / Lý do từ chối
                  </span>
                  <textarea
                    required={reviewAction === 'REJECTED'}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder={
                      reviewAction === 'APPROVED'
                        ? 'Ví dụ: Minh chứng tốt nghiệp hợp lệ.'
                        : 'Lý do cụ thể (Bắt buộc)...'
                    }
                    className="mt-2 h-24 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.02] p-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-gold-400/50 focus:outline-none"
                  />
                </label>

                <div className="mt-5 flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => setSelectedReq(null)}>
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className={cn(
                      reviewAction === 'APPROVED'
                        ? 'from-gold-300 to-gold-400 text-plum-900 shadow-[0_12px_28px_-12px_rgba(239,175,62,0.8)]'
                        : 'from-rose-600 to-rose-500 text-white shadow-[0_12px_28px_-12px_rgba(220,38,38,0.5)]'
                    )}
                    disabled={reviewMutation.isPending}
                  >
                    {reviewMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Xác nhận
                  </Button>
                </div>
              </form>
            </Card>
          </div>,
          document.body
        )}
    </div>
  )
}
