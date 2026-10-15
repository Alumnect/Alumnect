import type { ReactNode } from 'react'
import { AlertTriangle, Briefcase, Clock, Laptop, Wallet } from 'lucide-react'
import type { MentoringTaskOverview } from '../model/mentoringTaskTypes'
import {
  MENTORING_PARTICIPATION_LABELS,
  MENTORING_TASK_TYPE_LABELS,
  MENTORING_WORKING_MODE_LABELS,
  formatVnd,
} from '../model/mentoringFlowLabels'

interface MentoringTaskOverviewCardProps {
  overview?: MentoringTaskOverview | null
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return value
  }
}

function Fact({ icon, label, children, danger }: { icon: ReactNode; label: string; children: ReactNode; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-cream-300 bg-cream-100 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-plum-500 dark:text-plum-400 [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
        {label}
      </dt>
      <dd className={`mt-1 text-sm font-bold ${danger ? 'text-coral-600 dark:text-coral-300' : 'text-plum-900 dark:text-[#e4e6eb]'}`}>{children}</dd>
    </div>
  )
}

/** Thông tin công việc của Task: giá, deadline, hình thức, loại nhiệm vụ và phạm vi. */
export function MentoringTaskOverviewCard({ overview }: MentoringTaskOverviewCardProps) {
  if (!overview) return null
  const overdue = Boolean(overview.overdue ?? overview.isOverdue)

  return (
    <section className="rounded-3xl border border-plum-900/[0.08] bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#242526] sm:p-6">
      <h2 className="font-display text-base font-bold text-plum-900 dark:text-white">Thông tin công việc</h2>

      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Fact icon={<Wallet />} label="Giá thỏa thuận">{formatVnd(overview.agreedPrice)}</Fact>
        <Fact icon={<Clock />} label="Deadline" danger={overdue}>{formatDate(overview.deadline)}</Fact>
        <Fact icon={<Laptop />} label="Hình thức">
          {MENTORING_WORKING_MODE_LABELS[overview.workingMode] || overview.workingMode}
          {' · '}
          {MENTORING_PARTICIPATION_LABELS[overview.participationType] || overview.participationType}
        </Fact>
        <Fact icon={<Briefcase />} label="Loại nhiệm vụ">
          {MENTORING_TASK_TYPE_LABELS[overview.taskType] || overview.taskType}
        </Fact>
      </dl>

      {overview.taskScope && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-plum-500 dark:text-plum-400">Phạm vi công việc</p>
          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-plum-700 dark:text-[#e4e6eb]">{overview.taskScope}</p>
        </div>
      )}

      {overdue && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-coral-200 bg-coral-50 p-3 text-xs font-semibold text-coral-700 dark:border-coral-700/40 dark:bg-coral-900/20 dark:text-coral-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Task đã quá deadline{overview.daysRemaining < 0 ? ` ${Math.abs(overview.daysRemaining)} ngày` : ''}. Mentor nên nộp kết quả hoặc gửi đề xuất gia hạn.
          </span>
        </div>
      )}
    </section>
  )
}
