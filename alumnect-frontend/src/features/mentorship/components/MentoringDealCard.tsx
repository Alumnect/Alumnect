import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar, DollarSign, ArrowRight } from 'lucide-react'
import { Card, Avatar, Button } from '@/components/ui'
import { MentoringDealBadge } from './MentoringDealBadge'
import type { MentoringDeal } from '../model/mentoringDealTypes'

interface MentoringDealCardProps {
  deal: MentoringDeal
  onViewDetail: (deal: MentoringDeal) => void
}

/**
 * Thẻ hiển thị tóm tắt một Deal trong danh sách các thỏa thuận (UC104).
 */
export function MentoringDealCard({ deal, onViewDetail }: MentoringDealCardProps) {
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(deal.agreedPrice)

  const formattedDeadline = deal.deadline
    ? format(new Date(deal.deadline), 'dd/MM/yyyy HH:mm', { locale: vi })
    : 'Chưa có'

  return (
    <Card
      hover={true}
      className="border border-plum-900/[0.08] bg-white p-5 shadow-xs transition-all hover:shadow-md dark:bg-[#242526] dark:border-[#393a3b] space-y-4"
    >
      {/* Header: ID, Version, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-plum-900/[0.05] pb-3 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span className="font-heading font-black text-sm text-plum-900 dark:text-[#f0f2f5]">
            Deal #{deal.id}
          </span>
          <span className="rounded-full bg-plum-100 px-2 py-0.5 text-[10px] font-bold text-plum-700 dark:bg-white/10 dark:text-plum-300">
            v{deal.version}
          </span>
        </div>
        <MentoringDealBadge status={deal.status} isLocked={deal.isLocked} />
      </div>

      {/* Thông tin 2 bên tham gia (Student & Mentor) */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            src={deal.studentAvatar || undefined}
            name={deal.studentName || 'Học viên'}
            size={32}
          />
          <div className="min-w-0">
            <p className="truncate font-bold text-plum-900 dark:text-[#f0f2f5]">
              {deal.studentName || 'Học viên'}
            </p>
            <p className="text-[10px] text-plum-400">Sinh viên</p>
          </div>
        </div>

        <span className="text-plum-300 font-bold dark:text-white/20">↔</span>

        <div className="flex items-center gap-2 min-w-0 text-right justify-end">
          <div className="min-w-0">
            <p className="truncate font-bold text-plum-900 dark:text-[#f0f2f5]">
              {deal.mentorName || 'Cố vấn'}
            </p>
            <p className="text-[10px] text-plum-400">Mentor</p>
          </div>
          <Avatar
            src={deal.mentorAvatar || undefined}
            name={deal.mentorName || 'Cố vấn'}
            size={32}
          />
        </div>
      </div>

      {/* Nội dung tóm tắt phạm vi */}
      <div className="space-y-1">
        <p className="line-clamp-2 text-xs text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
          {deal.taskScope}
        </p>
      </div>

      {/* Giá, Deadline & Nút chi tiết */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-plum-900/[0.05] dark:border-white/5 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 font-bold text-mint-700 dark:text-mint-400">
            <DollarSign className="h-3.5 w-3.5" />
            <span>{formattedPrice}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-plum-400">
            <Calendar className="h-3 w-3" />
            <span>{formattedDeadline}</span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onViewDetail(deal)}
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          className="rounded-xl font-bold text-xs"
        >
          Xem & Xác nhận
        </Button>
      </div>
    </Card>
  )
}
