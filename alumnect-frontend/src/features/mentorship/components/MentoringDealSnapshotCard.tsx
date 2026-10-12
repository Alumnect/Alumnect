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
      className={`border border-plum-900/[0.08] bg-white p-6 shadow-sm dark:bg-[#242526] dark:border-[#393a3b] space-y-6 ${className}`}
    >
      {/* Header Snapshot & Trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-plum-900/[0.06] pb-4 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs dark:bg-brand-950/40 dark:text-brand-400">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-black text-plum-900 dark:text-[#f0f2f5]">
                Deal Snapshot #{deal.id}
              </h3>
              <span className="rounded-full bg-plum-100 px-2.5 py-0.5 text-[11px] font-bold text-plum-700 dark:bg-white/10 dark:text-plum-300">
                Phiên bản {deal.version}
              </span>
            </div>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
              Cập nhật gần nhất:{' '}
              {format(new Date(deal.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </p>
          </div>
        </div>

        <MentoringDealBadge status={deal.status} isLocked={deal.isLocked} />
      </div>

      {/* Banner khóa bất biến khi cả hai cùng confirm */}
      {deal.isLocked && (
        <div className="flex items-center gap-3 rounded-2xl bg-mint-50/80 p-4 border border-mint-200/60 dark:bg-mint-950/30 dark:border-mint-800/40 text-mint-900 dark:text-mint-200">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-600 text-white shadow-xs">
            <Lock className="h-4 w-4" />
          </span>
          <div className="text-xs space-y-0.5">
            <p className="font-extrabold text-mint-950 dark:text-mint-100">
              Snapshot đã được cả hai bên xác nhận và khóa an toàn
            </p>
            <p className="text-mint-800/80 dark:text-mint-300/80">
              Không bên nào được tự ý sửa điều khoản. Thỏa thuận đã sẵn sàng tiến hành thanh toán (UC105).
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
              ? 'bg-mint-50/50 border-mint-200 dark:bg-mint-950/20 dark:border-mint-800/30'
              : 'bg-plum-50/40 border-plum-900/10 dark:bg-white/5 dark:border-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={deal.studentAvatar || undefined}
              name={deal.studentName || 'Học viên'}
              size={36}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-plum-900 dark:text-[#f0f2f5]">
                {deal.studentName || 'Học viên'}
              </p>
              <p className="text-[11px] text-plum-500 dark:text-[#b0b3b8]">Sinh viên (Student)</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            {deal.studentConfirmed ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-mint-700 dark:text-mint-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đã xác nhận</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Chưa xác nhận</span>
              </span>
            )}
            {deal.studentConfirmedAt && (
              <p className="text-[10px] text-plum-400 dark:text-[#8a8d91]">
                {format(new Date(deal.studentConfirmedAt), 'HH:mm dd/MM', { locale: vi })}
              </p>
            )}
          </div>
        </div>

        {/* Xác nhận của Mentor */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            deal.mentorConfirmed
              ? 'bg-mint-50/50 border-mint-200 dark:bg-mint-950/20 dark:border-mint-800/30'
              : 'bg-plum-50/40 border-plum-900/10 dark:bg-white/5 dark:border-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={deal.mentorAvatar || undefined}
              name={deal.mentorName || 'Cố vấn'}
              size={36}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-plum-900 dark:text-[#f0f2f5]">
                {deal.mentorName || 'Cố vấn'}
              </p>
              <p className="text-[11px] text-plum-500 dark:text-[#b0b3b8]">Cố vấn (Mentor)</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            {deal.mentorConfirmed ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-mint-700 dark:text-mint-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đã xác nhận</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Chưa xác nhận</span>
              </span>
            )}
            {deal.mentorConfirmedAt && (
              <p className="text-[10px] text-plum-400 dark:text-[#8a8d91]">
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
          <div className="rounded-2xl bg-mint-50/40 p-3.5 border border-mint-200/40 dark:bg-mint-950/15 dark:border-mint-800/20 space-y-1">
            <div className="flex items-center gap-1.5 text-mint-800 dark:text-mint-300 font-semibold">
              <DollarSign className="h-4 w-4 text-mint-600" />
              <span>Mức giá thỏa thuận</span>
            </div>
            <p className="text-lg font-black text-mint-700 dark:text-mint-400">
              {formattedPrice}
            </p>
          </div>

          <div className="rounded-2xl bg-plum-50/50 p-3.5 border border-plum-900/10 dark:bg-white/5 dark:border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-plum-600 dark:text-[#b0b3b8] font-semibold">
              <Calendar className="h-4 w-4 text-brand-500" />
              <span>Hạn chót hoàn thành (Deadline)</span>
            </div>
            <p className="text-base font-extrabold text-plum-900 dark:text-[#f0f2f5]">
              {formattedDeadline}
            </p>
          </div>
        </div>

        {/* Phương thức & Hình thức tham gia */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-plum-50/40 p-3 border border-plum-900/10 dark:bg-white/5 dark:border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-plum-500 dark:text-[#8a8d91]">
              <Laptop className="h-3.5 w-3.5 text-brand-500" />
              <span className="font-semibold">Hình thức làm việc</span>
            </div>
            <p className="font-bold text-plum-900 dark:text-[#f0f2f5]">
              {WORKING_MODE_LABELS[deal.workingMode] || deal.workingMode}
            </p>
          </div>

          <div className="rounded-2xl bg-plum-50/40 p-3 border border-plum-900/10 dark:bg-white/5 dark:border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-plum-500 dark:text-[#8a8d91]">
              <Users className="h-3.5 w-3.5 text-brand-500" />
              <span className="font-semibold">Hình thức tham gia</span>
            </div>
            <p className="font-bold text-plum-900 dark:text-[#f0f2f5]">
              {PARTICIPATION_LABELS[deal.participationType] || deal.participationType}
            </p>
          </div>

          <div className="rounded-2xl bg-plum-50/40 p-3 border border-plum-900/10 dark:bg-white/5 dark:border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-plum-500 dark:text-[#8a8d91]">
              <Target className="h-3.5 w-3.5 text-brand-500" />
              <span className="font-semibold">Loại nhiệm vụ</span>
            </div>
            <p className="font-bold text-plum-900 dark:text-[#f0f2f5]">
              {TASK_TYPE_LABELS[deal.taskType] || deal.taskType}
            </p>
          </div>
        </div>

        {/* Phạm vi công việc (Task Scope) */}
        <div className="space-y-1.5 rounded-2xl bg-plum-50/50 p-4 border border-plum-900/10 dark:bg-white/5 dark:border-white/10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-plum-900 dark:text-[#f0f2f5]">
            <FileText className="h-4 w-4 text-brand-500" />
            <span>Phạm vi công việc (Task Scope)</span>
          </div>
          <p className="whitespace-pre-wrap text-plum-700 dark:text-[#b0b3b8] leading-relaxed">
            {deal.taskScope}
          </p>
        </div>

        {/* Kết quả kỳ vọng (Expected Result) */}
        <div className="space-y-1.5 rounded-2xl bg-brand-50/40 p-4 border border-brand-200/40 dark:bg-brand-950/20 dark:border-brand-800/30">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 dark:text-brand-300">
            <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>Kết quả kỳ vọng đầu ra (Expected Result)</span>
          </div>
          <p className="whitespace-pre-wrap text-brand-950/85 dark:text-brand-200/90 leading-relaxed">
            {deal.expectedResult}
          </p>
        </div>
      </div>
    </Card>
  )
}
