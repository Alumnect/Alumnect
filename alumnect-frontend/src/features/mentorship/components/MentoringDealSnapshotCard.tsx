import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  Calendar,
  DollarSign,
  Laptop,
  Users,
  Target,
  FileText,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { MentoringDealBadge } from './MentoringDealBadge'
import type { MentoringDeal } from '../model/mentoringDealTypes'

interface MentoringDealSnapshotCardProps {
  deal: MentoringDeal
  className?: string
}

const WORKING_MODE_LABELS: Record<string, string> = {
  ONLINE: 'Trực tuyến (Online qua Google Meet/Zoom)',
  OFFLINE: 'Trực tiếp (Offline gặp mặt trao đổi)',
  BOTH: 'Linh hoạt (Cả trực tuyến và trực tiếp)',
}

const PARTICIPATION_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Cá nhân (Kèm cặp 1-1 chuyên sâu)',
  GROUP: 'Nhóm (Hướng dẫn theo nhóm học viên)',
}

const TASK_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: 'Tư vấn định hướng học tập & nghề nghiệp',
  ASSIGNMENT_GUIDANCE: 'Hướng dẫn bài tập / Đồ án tốt nghiệp',
  PROJECT_MENTORING: 'Cố vấn thực chiến dự án phần mềm',
  RESUME_REVIEW: 'Đánh giá & Chỉnh sửa hồ sơ CV',
  MOCK_INTERVIEW: 'Phỏng vấn thử việc (Mock Interview)',
  SKILL_TRAINING: 'Đào tạo kỹ năng chuyên sâu',
  OTHER: 'Nhiệm vụ theo thỏa thuận',
}

/**
 * Thẻ hiển thị Deal Snapshot mới nhất của Mentoring Deal (UC104).
 * Thiết kế giao diện Pastel Premium, bo góc lớn và hiển thị trực quan trạng thái 2 bên.
 */
export function MentoringDealSnapshotCard({
  deal,
  className = '',
}: MentoringDealSnapshotCardProps) {
  const formattedDeadline = deal.deadline
    ? format(new Date(deal.deadline), 'dd/MM/yyyy HH:mm', { locale: vi })
    : 'Chưa xác định'

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(deal.agreedPrice)

  return (
    <Card
      hover={false}
      className={`border border-border bg-surface p-6 shadow-sm space-y-6 ${className}`}
    >
      {/* Header Snapshot & Trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary-solid shadow-xs">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-bold text-text">
                Deal Snapshot #{deal.id}
              </h3>
              <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-bold text-text-muted">
                Phiên bản {deal.version}
              </span>
            </div>
            <p className="text-xs text-text-subtle">
              Cập nhật gần nhất:{' '}
              {format(new Date(deal.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </p>
          </div>
        </div>

        <MentoringDealBadge status={deal.status} isLocked={deal.isLocked} />
      </div>

      {/* Banner khóa bất biến khi cả hai cùng confirm */}
      {deal.isLocked && (
        <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-4 border border-success-border text-success">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success text-text-inverse shadow-xs">
            <Lock className="h-4 w-4" />
          </span>
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-success">
              Snapshot đã được cả hai bên xác nhận và khóa an toàn
            </p>
            <p className="text-success">
              Không bên nào được tự ý sửa điều khoản. Thỏa thuận đã sẵn sàng tiến hành thanh toán.
            </p>
          </div>
        </div>
      )}

      {/* Trạng thái xác nhận của 2 bên (Student & Mentor) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Xác nhận của Student */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            deal.studentConfirmed
              ? 'bg-success-soft border-success-border'
              : 'bg-cream-100/40 border-border dark:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={deal.studentAvatar || undefined}
              name={deal.studentName || 'Học viên'}
              size={36}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-text">
                {deal.studentName || 'Học viên'}
              </p>
              <p className="text-xs text-text-subtle">Sinh viên (Student)</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            {deal.studentConfirmed ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đã xác nhận</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-warning">
                <Clock className="h-3.5 w-3.5" />
                <span>Chưa xác nhận</span>
              </span>
            )}
            {deal.studentConfirmedAt && (
              <p className="text-xs text-text-subtle dark:text-text-subtle">
                {format(new Date(deal.studentConfirmedAt), 'HH:mm dd/MM', { locale: vi })}
              </p>
            )}
          </div>
        </div>

        {/* Xác nhận của Mentor */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            deal.mentorConfirmed
              ? 'bg-success-soft border-success-border'
              : 'bg-cream-100/40 border-border dark:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={deal.mentorAvatar || undefined}
              name={deal.mentorName || 'Cố vấn'}
              size={36}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-text">
                {deal.mentorName || 'Cố vấn'}
              </p>
              <p className="text-xs text-text-subtle">Cố vấn (Mentor)</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            {deal.mentorConfirmed ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đã xác nhận</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-warning">
                <Clock className="h-3.5 w-3.5" />
                <span>Chưa xác nhận</span>
              </span>
            )}
            {deal.mentorConfirmedAt && (
              <p className="text-xs text-text-subtle dark:text-text-subtle">
                {format(new Date(deal.mentorConfirmedAt), 'HH:mm dd/MM', { locale: vi })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chi tiết nội dung các điều khoản Snapshot */}
      <div className="space-y-4 text-xs">
        {/* Mức giá & Thời hạn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-success-soft p-3.5 border border-success-border space-y-1">
            <div className="flex items-center gap-1.5 text-success font-semibold">
              <DollarSign className="h-4 w-4 text-success" />
              <span>Mức giá thỏa thuận</span>
            </div>
            <p className="text-lg font-bold text-success">
              {formattedPrice}
            </p>
          </div>

          <div className="rounded-2xl bg-cream-100/50 p-3.5 border border-border dark:bg-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-text-muted font-semibold">
              <Calendar className="h-4 w-4 text-primary-solid" />
              <span>Hạn chót hoàn thành (Deadline)</span>
            </div>
            <p className="text-base font-bold text-text">
              {formattedDeadline}
            </p>
          </div>
        </div>

        {/* Phương thức & Hình thức tham gia */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-cream-100/40 p-3 border border-border dark:bg-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-text-subtle dark:text-text-subtle">
              <Laptop className="h-3.5 w-3.5 text-primary-solid" />
              <span className="font-semibold">Hình thức làm việc</span>
            </div>
            <p className="font-bold text-text">
              {WORKING_MODE_LABELS[deal.workingMode] || deal.workingMode}
            </p>
          </div>

          <div className="rounded-2xl bg-cream-100/40 p-3 border border-border dark:bg-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-text-subtle dark:text-text-subtle">
              <Users className="h-3.5 w-3.5 text-primary-solid" />
              <span className="font-semibold">Hình thức tham gia</span>
            </div>
            <p className="font-bold text-text">
              {PARTICIPATION_LABELS[deal.participationType] || deal.participationType}
            </p>
          </div>

          <div className="rounded-2xl bg-cream-100/40 p-3 border border-border dark:bg-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-text-subtle dark:text-text-subtle">
              <Target className="h-3.5 w-3.5 text-primary-solid" />
              <span className="font-semibold">Loại nhiệm vụ</span>
            </div>
            <p className="font-bold text-text">
              {TASK_TYPE_LABELS[deal.taskType] || deal.taskType}
            </p>
          </div>
        </div>

        {/* Phạm vi công việc (Task Scope) */}
        <div className="space-y-1.5 rounded-2xl bg-cream-100/50 p-4 border border-border dark:bg-white/5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text">
            <FileText className="h-4 w-4 text-primary-solid" />
            <span>Phạm vi công việc (Task Scope)</span>
          </div>
          <p className="whitespace-pre-wrap text-text-muted leading-relaxed">
            {deal.taskScope}
          </p>
        </div>

        {/* Kết quả kỳ vọng (Expected Result) */}
        <div className="space-y-1.5 rounded-2xl bg-brand-50/40 p-4 border border-brand-200/40 dark:bg-brand-700/20 dark:border-brand-700/30">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-solid">
            <Sparkles className="h-4 w-4 text-primary-solid" />
            <span>Kết quả kỳ vọng đầu ra (Expected Result)</span>
          </div>
          <p className="whitespace-pre-wrap text-brand-700/85 dark:text-brand-300/90 leading-relaxed">
            {deal.expectedResult}
          </p>
        </div>
      </div>
    </Card>
  )
}
