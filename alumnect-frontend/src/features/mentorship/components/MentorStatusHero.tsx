import { CheckCircle2, Clock, AlertTriangle, ArrowRight, RefreshCw, Sparkles, ShieldCheck, CreditCard } from 'lucide-react'
import { Badge } from '@/components/ui/primitives'
import { Button, ButtonLink } from '@/components/ui/Button'
import type { MentorStatusResponse } from '../model/mentorStatusTypes'

interface MentorStatusHeroProps {
  status: MentorStatusResponse
  onRefresh?: () => void
  isRefreshing?: boolean
}

/**
 * Component Hero hiển thị tổng quan trạng thái Mentor & Subscription (UC94).
 * Thiết kế theo chuẩn Pastel Premium với các hiệu ứng pillowy card, gradient và badge ngữ nghĩa.
 */
export function MentorStatusHero({ status, onRefresh, isRefreshing }: MentorStatusHeroProps) {
  const { mentorStatus, statusMessage, nextAction, actionUrl, remainingDays, packageName, active } = status

  // Cấu hình hiển thị theo từng trạng thái chuẩn
  const getStatusBadge = () => {
    switch (mentorStatus) {
      case 'ACTIVE':
        return (
          <Badge tone="success" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
            Mentor Đang Hoạt Động (Active)
          </Badge>
        )
      case 'PAYMENT_PENDING':
        return (
          <Badge tone="gold" icon={<Clock className="h-3.5 w-3.5" />}>
            Hồ Sơ Đã Hoàn Tất — Chờ Thanh Toán
          </Badge>
        )
      case 'EXPIRED':
        return (
          <Badge tone="danger" icon={<Clock className="h-3.5 w-3.5" />}>
            Gói Dịch Vụ Đã Hết Hạn
          </Badge>
        )
      default: // INCOMPLETE
        return (
          <Badge tone="violet" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
            Hồ Sơ Chưa Hoàn Tất (Incomplete)
          </Badge>
        )
    }
  }

  // Tùy biến nhãn nút CTA chính
  const getActionLabel = () => {
    switch (nextAction) {
      case 'ACTIVE_DASHBOARD':
        return 'Truy Cập Mentoring Hub'
      case 'RESUME_PAYMENT':
        return 'Tiếp Tục Thanh Toán PayOS'
      case 'PAYMENT_CHECKOUT':
        return 'Kích Hoạt Gói Ngay'
      case 'SELECT_PACKAGE':
        return 'Chọn Gói Dịch Vụ Mentor'
      case 'RENEW_SUBSCRIPTION':
        return 'Gia Hạn Gói Dịch Vụ'
      case 'ACCEPT_TERMS':
        return 'Chấp Nhận Điều Khoản'
      default:
        return 'Hoàn Thiện Hồ Sơ Ngay'
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-white/40 p-6 sm:p-10 shadow-sm dark:bg-[#242526] dark:border-[#393a3b] dark:from-brand-950/20">
      {/* Vòng trang trí nền */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-500/5" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl dark:bg-gold-500/5" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {getStatusBadge()}
            {active && remainingDays !== null && remainingDays !== undefined && (
              <Badge tone="brand" icon={<Sparkles className="h-3.5 w-3.5" />}>
                Còn {remainingDays} ngày hiệu lực
              </Badge>
            )}
            {packageName && (
              <Badge tone="neutral" icon={<CreditCard className="h-3.5 w-3.5" />}>
                {packageName}
              </Badge>
            )}
          </div>

          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-plum-900 sm:text-3xl lg:text-4xl dark:text-[#e4e6eb]">
            Trạng Thái Mentor & Gói Dịch Vụ
          </h1>

          <p className="text-sm leading-relaxed text-plum-600 sm:text-base dark:text-[#b0b3b8]">
            {statusMessage}
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-plum-900/10 bg-white/70 p-3 shadow-xs dark:bg-[#18191a] dark:border-[#393a3b]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-plum-500">Hồ sơ cá nhân</span>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-plum-900 dark:text-[#e4e6eb]">
                {status.profileComplete ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-mint-600" /> Hoàn tất
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-coral-600" /> Chưa đủ
                  </>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-plum-900/10 bg-white/70 p-3 shadow-xs dark:bg-[#18191a] dark:border-[#393a3b]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-plum-500">Hồ sơ CV</span>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-plum-900 dark:text-[#e4e6eb]">
                {status.hasCv ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-mint-600" /> Đã tải lên
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-coral-600" /> Chưa có
                  </>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-plum-900/10 bg-white/70 p-3 shadow-xs dark:bg-[#18191a] dark:border-[#393a3b]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-plum-500">Điều khoản</span>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-plum-900 dark:text-[#e4e6eb]">
                {status.termsAccepted ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-mint-600" /> Đã chấp nhận
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-coral-600" /> Chưa duyệt
                  </>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-plum-900/10 bg-white/70 p-3 shadow-xs dark:bg-[#18191a] dark:border-[#393a3b]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-plum-500">Subscription</span>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-plum-900 dark:text-[#e4e6eb]">
                {active ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-mint-600" /> Đang hiệu lực
                  </>
                ) : status.mentorStatus === 'EXPIRED' ? (
                  <>
                    <Clock className="h-3.5 w-3.5 text-coral-600" /> Hết hạn
                  </>
                ) : status.hasSubscription ? (
                  <>
                    <Clock className="h-3.5 w-3.5 text-gold-600" /> Chờ thanh toán
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3.5 w-3.5 text-plum-400" /> Chưa đăng ký
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
          <ButtonLink
            to={actionUrl}
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="shadow-md hover:shadow-lg transition-all"
          >
            {getActionLabel()}
          </ButtonLink>

          {onRefresh && (
            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
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
