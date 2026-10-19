import { ArrowRight, Briefcase, CalendarClock, CreditCard, MessagesSquare, Wallet } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { MentoringDealBadge } from './MentoringDealBadge'
import { MentoringActionButton } from './MentoringUi'
import { formatVnd } from '../model/mentoringFlowLabels'
import type { MentoringDeal } from '../model/mentoringDealTypes'

interface MentoringDealCardProps {
  deal: MentoringDeal
  onViewDetail: (deal: MentoringDeal) => void
  onOpenChat?: (deal: MentoringDeal) => void
  isActive?: boolean
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Chưa có'
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Tóm tắt một thỏa thuận (UC104): trạng thái, người cùng thỏa thuận, giá, hạn chót và thao tác tiếp theo. */
export function MentoringDealCard({ deal, onViewDetail, onOpenChat, isActive = false }: MentoringDealCardProps) {
  const currentUserId = Number(useAuthStore((s) => s.user?.id)) || 0
  const iAmMentor = currentUserId === deal.mentorId
  const counterpart = iAmMentor
    ? { role: 'Học viên', name: deal.studentName || 'Học viên', avatar: deal.studentAvatar }
    : { role: 'Mentor', name: deal.mentorName || 'Mentor', avatar: deal.mentorAvatar }
  const openChat = onOpenChat && deal.conversationId ? () => onOpenChat(deal) : undefined

  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl border bg-surface p-5 shadow-xs transition hover:shadow-sm',
        isActive
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-brand-500/40 dark:hover:border-brand-500/40',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <MentoringDealBadge status={deal.status} isLocked={deal.isLocked} isPaid={deal.isPaid} />
        <span className="shrink-0 text-xs text-text-subtle">
          Deal #{deal.id} · v{deal.version}
        </span>
      </div>

      <h3 className="mt-3 line-clamp-2 font-display text-base font-bold text-text">
        {deal.requestTitle || `Thỏa thuận #${deal.id}`}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-muted">{deal.taskScope}</p>

      <div className="mt-4 flex items-center gap-2.5">
        <Avatar src={counterpart.avatar || undefined} name={counterpart.name} size={32} />
        <div className="min-w-0">
          <p className="text-xs text-text-subtle">{counterpart.role}</p>
          <p className="truncate text-sm font-semibold text-text">{counterpart.name}</p>
        </div>
      </div>

      <dl className="my-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-surface-2 px-3 py-2 dark:bg-white/[0.04]">
          <dt className="flex items-center gap-1 text-text-subtle">
            <Wallet className="h-3.5 w-3.5" />
            Giá
          </dt>
          <dd className="mt-0.5 font-semibold text-text">{formatVnd(deal.agreedPrice)}</dd>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-2 dark:bg-white/[0.04]">
          <dt className="flex items-center gap-1 text-text-subtle">
            <CalendarClock className="h-3.5 w-3.5" />
            Hạn chót
          </dt>
          <dd className="mt-0.5 font-semibold text-text">{formatDateTime(deal.deadline)}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        {openChat && !deal.canPay && (
          <MentoringActionButton icon={<MessagesSquare className="h-3.5 w-3.5" />} onClick={openChat}>
            Trao đổi
          </MentoringActionButton>
        )}
        {deal.taskId ? (
          <ButtonLink
            to={`/app/mentoring/tasks/${deal.taskId}`}
            size="sm"
            leftIcon={<Briefcase className="h-3.5 w-3.5" />}
            className="h-8 rounded-lg px-3 text-xs"
          >
            Mở Task
          </ButtonLink>
        ) : deal.canPay ? (
          <>
            <MentoringActionButton onClick={() => onViewDetail(deal)}>Chi tiết</MentoringActionButton>
            {/* Thanh toán diễn ra trong phần trao đổi của Request */}
            <MentoringActionButton
              intent="primary"
              icon={<CreditCard className="h-3.5 w-3.5" />}
              onClick={openChat ?? (() => onViewDetail(deal))}
            >
              Thanh toán
            </MentoringActionButton>
          </>
        ) : (
          <MentoringActionButton icon={<ArrowRight className="h-3.5 w-3.5" />} onClick={() => onViewDetail(deal)}>
            Chi tiết
          </MentoringActionButton>
        )}
      </div>
    </article>
  )
}
