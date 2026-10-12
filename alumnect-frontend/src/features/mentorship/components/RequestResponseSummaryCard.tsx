import { Users, CheckCircle2, Clock, XCircle, Send, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { MentoringRequestType, MentoringResponseSummary } from '../model/mentoringRequestTypes'

interface RequestResponseSummaryCardProps {
  requestType?: MentoringRequestType
  summary?: MentoringResponseSummary
  targetMentorName?: string | null
  directMentorStatus?: string | null
  className?: string
}

/**
 * Component hiển thị tổng quan số liệu phản hồi từ Mentor (UC102).
 * Thiết kế tối ưu theo chuẩn Pastel Premium Design System của AlumNect:
 * - Bố cục 2x2 thoáng đãng, số liệu nổi bật, không bị ngắt chữ.
 * - Thanh tiến độ tỉ lệ trực quan.
 * - Hộp trạng thái ngữ cảnh thông minh.
 */
export function RequestResponseSummaryCard({
  requestType = 'GENERAL',
  summary,
  targetMentorName,
  directMentorStatus = 'WAITING',
  className,
}: RequestResponseSummaryCardProps) {
  const isDirect = requestType === 'DIRECT'

  const total = summary?.totalDistributed ?? (isDirect ? 1 : 0)
  const accepted = summary?.acceptedCount ?? 0
  const waiting = summary?.waitingCount ?? (isDirect ? (directMentorStatus === 'WAITING' ? 1 : 0) : 0)
  const declined = summary?.declinedCount ?? (isDirect ? (directMentorStatus === 'DECLINED' ? 1 : 0) : 0)

  if (isDirect) {
    return (
      <Card className={cn('overflow-hidden border border-plum-900/[0.08] p-5 shadow-xs dark:border-[#393a3b]', className)}>
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            <Send className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-plum-900 dark:text-white">Yêu cầu cố vấn trực tiếp</h4>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-extrabold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                1-1
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-plum-500 dark:text-[#8f9399]">
              Gửi riêng cho Mentor <span className="font-bold text-plum-800 dark:text-plum-200">{targetMentorName || 'được chọn'}</span>
            </p>
          </div>
        </div>

        {/* Khối trạng thái phản hồi của Mentor đích */}
        <div className="mt-4 rounded-2xl border border-plum-900/[0.06] bg-cream-50/80 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-plum-600 dark:text-[#b0b3b8]">Trạng thái phản hồi:</span>
            {directMentorStatus === 'ACCEPTED' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Đã chấp nhận
              </span>
            ) : directMentorStatus === 'DECLINED' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 shadow-2xs dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-300">
                <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                Đã từ chối
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 shadow-2xs dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Đang chờ phản hồi
              </span>
            )}
          </div>

          <p className="mt-2 text-xs leading-relaxed text-plum-500 dark:text-[#8f9399]">
            {directMentorStatus === 'ACCEPTED'
              ? 'Mentor đã đồng ý tiếp nhận! Hãy mở mục tin nhắn để bắt đầu trao đổi chi tiết.'
              : directMentorStatus === 'DECLINED'
                ? 'Mentor chưa sắp xếp được lịch phù hợp cho yêu cầu này.'
                : 'Yêu cầu đang được Mentor xem xét, hệ thống sẽ gửi thông báo ngay khi có kết quả.'}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden border border-plum-900/[0.08] p-5 shadow-xs dark:border-[#393a3b]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-plum-900/[0.06] dark:border-white/[0.06]">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-plum-900 dark:text-white">Tổng hợp phản hồi từ Mentor</h4>
          <p className="text-xs text-plum-500 dark:text-[#8f9399]">Trạng thái phân phối & tiếp nhận thực tế</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black shadow-2xs',
            total > 0
              ? 'border border-brand-200/80 bg-brand-50 text-brand-700 dark:border-brand-800/40 dark:bg-brand-950/40 dark:text-brand-300'
              : 'border border-plum-900/[0.08] bg-cream-100 text-plum-500 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-[#8f9399]',
          )}
        >
          <Users className="h-3 w-3" />
          <span>{total} Mentor</span>
        </span>
      </div>

      {/* Thanh tỉ lệ phản hồi trực quan (chỉ hiển thị khi có phân phối) */}
      {total > 0 && (
        <div className="my-3.5 space-y-1">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-cream-200/70 dark:bg-white/[0.08]">
            {accepted > 0 && (
              <div
                style={{ width: `${(accepted / total) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Đã đồng ý: ${accepted}`}
              />
            )}
            {waiting > 0 && (
              <div
                style={{ width: `${(waiting / total) * 100}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`Đang chờ: ${waiting}`}
              />
            )}
            {declined > 0 && (
              <div
                style={{ width: `${(declined / total) * 100}%` }}
                className="bg-rose-400 transition-all duration-500"
                title={`Từ chối: ${declined}`}
              />
            )}
          </div>
        </div>
      )}

      {/* Lưới 4 trạng thái phản hồi bố cục 2x2 cực kỳ thoáng, chuẩn mắt */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        {/* Ô 1: Tổng phân phối */}
        <div className="rounded-2xl border border-plum-900/[0.06] bg-cream-50/80 p-3 transition-all hover:border-plum-900/[0.12] dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-plum-600 dark:text-[#8f9399]">Đã phân phối</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-plum-100 text-plum-600 dark:bg-white/[0.08] dark:text-plum-300">
              <Users className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-plum-900 dark:text-white">{total}</span>
            <span className="text-[10px] font-medium text-plum-400">Mentor</span>
          </div>
        </div>

        {/* Ô 2: Đã đồng ý */}
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-3 transition-all hover:border-emerald-300 dark:border-emerald-800/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Đã đồng ý</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{accepted}</span>
            <span className="text-[10px] font-medium text-emerald-600/80">phản hồi</span>
          </div>
        </div>

        {/* Ô 3: Đang chờ */}
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-3 transition-all hover:border-amber-300 dark:border-amber-800/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Đang chờ</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <Clock className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-amber-700 dark:text-amber-300">{waiting}</span>
            <span className="text-[10px] font-medium text-amber-600/80">chờ xử lý</span>
          </div>
        </div>

        {/* Ô 4: Từ chối */}
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/50 p-3 transition-all hover:border-rose-300 dark:border-rose-800/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">Đã từ chối</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
              <XCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-rose-700 dark:text-rose-300">{declined}</span>
            <span className="text-[10px] font-medium text-rose-600/80">từ chối</span>
          </div>
        </div>
      </div>

      {/* Thông điệp trạng thái ngữ cảnh thông minh */}
      {accepted > 0 ? (
        <div className="mt-3.5 flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="leading-relaxed">
            Đã có <strong>{accepted} Mentor</strong> đồng ý tiếp nhận! Hãy mở mục tin nhắn để trao đổi chi tiết.
          </span>
        </div>
      ) : total === 0 ? (
        <div className="mt-3.5 flex items-center gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200">
          <Sparkles className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="leading-relaxed">
            Hệ thống đang tiếp tục tìm kiếm Mentor phù hợp với yêu cầu này.
          </span>
        </div>
      ) : (
        <div className="mt-3.5 flex items-center gap-2.5 rounded-2xl border border-plum-900/[0.06] bg-cream-50/80 p-3 text-xs text-plum-700 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-[#b0b3b8]">
          <Clock className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="leading-relaxed">
            Đang chờ phản hồi từ <strong>{waiting} Mentor</strong> được phân phối.
          </span>
        </div>
      )}
    </Card>
  )
}

