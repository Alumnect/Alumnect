import { ArrowRight, RefreshCw } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import type { MentorStatusResponse } from '../model/mentorStatusTypes'

interface MentorStatusHeroProps {
  status: MentorStatusResponse
  onRefresh?: () => void
  isRefreshing?: boolean
}

/**
 * Component Hero hiển thị tổng quan trạng thái Mentor & Subscription (UC94).
 * Thiết kế tinh gọn, sang trọng, tập trung vào thông điệp và hành động chính.
 */
export function MentorStatusHero({ status, onRefresh, isRefreshing }: MentorStatusHeroProps) {
  const { statusMessage, nextAction, actionUrl } = status

  // Tùy biến nhãn nút CTA chính
  const getActionLabel = () => {
    switch (nextAction) {
      case 'ACTIVE_DASHBOARD':
        return 'Vào bảng tin Mentor'
      case 'RESUME_PAYMENT':
        return 'Tiếp tục thanh toán'
      case 'PAYMENT_CHECKOUT':
        return 'Kích hoạt gói ngay'
      case 'SELECT_PACKAGE':
        return 'Chọn gói dịch vụ'
      case 'RENEW_SUBSCRIPTION':
        return 'Gia hạn gói dịch vụ'
      case 'ACCEPT_TERMS':
        return 'Chấp nhận điều khoản'
      default:
        return 'Hoàn thiện hồ sơ ngay'
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-white/40 p-6 sm:p-8 shadow-sm dark:bg-[#242526] dark:border-[#393a3b] dark:from-brand-950/20">
      {/* Vòng trang trí nền */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-500/5" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl dark:bg-gold-500/5" />

      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-plum-900 sm:text-3xl dark:text-[#e4e6eb]">
            Trạng Thái Mentor & Gói Dịch Vụ
          </h1>

          <p className="text-sm leading-relaxed text-plum-600 sm:text-base dark:text-[#b0b3b8]">
            {statusMessage}
          </p>
        </div>

        {/* CTA Button Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
          <ButtonLink
            to={actionUrl}
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="shadow-sm hover:shadow transition-all"
          >
            {getActionLabel()}
          </ButtonLink>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              Làm mới trạng thái
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
