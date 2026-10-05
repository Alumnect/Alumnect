import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MentoringTermsContent } from './MentoringTermsContent'
import { useAcceptMentoringTerms, useMentoringTermsStatus } from '../hooks/useMentoringTerms'
import type { MentoringEntrySource } from '../model/mentoringTermsTypes'
import { Card } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  HeartHandshake,
  FileCheck2,
} from 'lucide-react'

interface MentoringTermsProps {
  /** Nguồn kích hoạt mở điều khoản để định tuyến sau khi chấp nhận */
  source?: MentoringEntrySource
  /** Callback tùy chọn được gọi sau khi chấp nhận thành công */
  onSuccess?: () => void
  /** Callback tùy chọn khi bấm nút Quay lại */
  onBack?: () => void
}

/**
 * Giao diện chính của Use Case UC90: Xem & Chấp nhận Điều khoản Hướng dẫn & Hỗ trợ.
 * Thiết kế theo chuẩn Split-Screen hiện đại:
 * - Cột trái (35%): Tiêu đề, tóm tắt 3 quy tắc cốt lõi, Checkbox cam kết và nút hành động.
 * - Cột phải (65%): Khung đọc văn bản điều khoản dạng khổ dọc toàn màn hình, cuộn mượt mà.
 * - Vừa vặn 1 màn hình duy nhất (Zero Window Scroll), khóa cuộn trang bên ngoài.
 */
export function MentoringTerms({
  source = 'MENTORING_HOME',
  onSuccess,
  onBack,
}: MentoringTermsProps) {
  const navigate = useNavigate()
  const [isChecked, setIsChecked] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: statusData, isLoading: isStatusLoading } = useMentoringTermsStatus()
  const acceptMutation = useAcceptMentoringTerms()

  const currentVersion = statusData?.currentVersion ?? '1.0'
  const isAlreadyAccepted = Boolean(statusData?.accepted)

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    // Quay lại trang trước đó hoặc về trang chủ mentoring
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/app/mentoring')
    }
  }

  const handleAccept = async () => {
    if (!isChecked || acceptMutation.isPending) return
    setErrorMessage(null)

    try {
      await acceptMutation.mutateAsync()

      if (onSuccess) {
        onSuccess()
        return
      }

      // Điều hướng dựa trên nguồn kích hoạt (Section 14)
      if (source === 'BECOME_MENTOR') {
        navigate('/app/mentoring/become-mentor', { replace: true })
      } else {
        navigate('/app/mentoring', { replace: true })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chấp nhận điều khoản thất bại. Vui lòng thử lại.'
      setErrorMessage(msg)
    }
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 sm:gap-5 min-h-0 overflow-y-auto lg:overflow-hidden">
      {/* CỘT TRÁI: Bảng thông tin, quy tắc tóm tắt & hộp cam kết */}
      <Card
        hover={false}
        className="w-full lg:w-[380px] xl:w-[410px] shrink-0 flex flex-col min-h-0 border border-plum-900/[0.08] bg-white p-4 sm:p-5 shadow-soft dark:bg-[#242526] dark:border-[#393a3b]"
      >
        {/* Phần nội dung phía trên: Tiêu đề + 3 Nguyên tắc (flex-1 min-h-0 overflow-y-auto chống tràn/lọt chữ) */}
        <div className="flex-1 min-h-0 flex flex-col space-y-3 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {/* Header tiêu đề */}
          <div className="space-y-1 border-b border-plum-900/[0.06] pb-2.5 dark:border-[#393a3b]">
            {isAlreadyAccepted && (
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Đã đồng ý điều khoản</span>
                </span>
              </div>
            )}
            <h1 className="font-heading text-lg sm:text-xl font-extrabold tracking-tight text-plum-900 dark:text-[#e4e6eb]">
              Điều khoản Hướng dẫn & Hỗ trợ
            </h1>
            <p className="text-xs text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
              {isAlreadyAccepted
                ? 'Bạn đã hoàn tất đồng ý các điều khoản hoạt động của mạng lưới Mentorship. Dưới đây là nội dung quy chế để bạn xem lại khi cần.'
                : 'Vui lòng đọc kỹ quy chế và đồng ý với các cam kết trước khi tham gia mạng lưới Mentorship.'}
            </p>
          </div>

          {/* 3 Nguyên tắc hoạt động cốt lõi */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-plum-400 dark:text-[#8a8d91]">
              Nguyên tắc hoạt động cốt lõi
            </span>

            <div className="flex items-start gap-2.5 rounded-xl border border-plum-900/[0.06] bg-cream-50/70 p-2.5 dark:bg-[#1e1f20] dark:border-[#393a3b]">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-plum-900 dark:text-[#e4e6eb]">Trung thực & Bảo mật</p>
                <p className="text-plum-600 dark:text-[#b0b3b8] mt-0.5 leading-relaxed text-[11px] sm:text-xs">Cam kết thông tin trung thực, bảo mật tài khoản và dữ liệu cá nhân.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-plum-900/[0.06] bg-cream-50/70 p-2.5 dark:bg-[#1e1f20] dark:border-[#393a3b]">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-mint-100 text-mint-700 dark:bg-mint-950/60 dark:text-mint-300">
                <HeartHandshake className="h-3.5 w-3.5" />
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-plum-900 dark:text-[#e4e6eb]">Tôn trọng & Văn hóa FPT</p>
                <p className="text-plum-600 dark:text-[#b0b3b8] mt-0.5 leading-relaxed text-[11px] sm:text-xs">Giao tiếp văn minh, tôn trọng lẫn nhau và giữ vững tinh thần học thuật.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-plum-900/[0.06] bg-cream-50/70 p-2.5 dark:bg-[#1e1f20] dark:border-[#393a3b]">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                <FileCheck2 className="h-3.5 w-3.5" />
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-plum-900 dark:text-[#e4e6eb]">Minh bạch Thỏa thuận (Deal)</p>
                <p className="text-plum-600 dark:text-[#b0b3b8] mt-0.5 leading-relaxed text-[11px] sm:text-xs">Thực hiện đúng cam kết đã thống nhất và ghi nhận nhật ký Work Log.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Khối Cam kết / Trạng thái đã duyệt + Nút bấm ghim ở dưới */}
        <div className="mt-3 pt-3 border-t border-plum-900/[0.06] dark:border-[#393a3b] space-y-2.5 shrink-0">
          {isStatusLoading ? (
            <div className="flex items-center justify-center py-4 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-brand-500" />
              <span>Đang kiểm tra trạng thái điều khoản...</span>
            </div>
          ) : isAlreadyAccepted ? (
            <>
              {/* Thông báo đã đồng ý điều khoản: Không hiện checkbox & nút acp nữa */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Điều khoản đã được chấp thuận</span>
                </div>
                <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed text-[11px]">
                  Tài khoản của bạn đã được ghi nhận cam kết tuân thủ Điều khoản Hướng dẫn & Hỗ trợ (Phiên bản {currentVersion})
                  {statusData?.acceptedAt && ` vào ngày ${new Date(statusData.acceptedAt).toLocaleDateString('vi-VN')}`}.
                </p>
              </div>

              {/* Chỉ hiện nút Quay lại, không hiện nút chấp nhận */}
              <div className="pt-0.5">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleBack}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  className="w-full"
                >
                  Quay lại
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Thông báo lỗi nếu API accept thất bại (BR-UC90-18) */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-coral-200 bg-coral-50/80 p-2.5 text-xs text-coral-800 dark:border-coral-900/50 dark:bg-coral-950/30 dark:text-coral-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral-600 dark:text-coral-400" />
                  <div>
                    <p className="font-semibold">Không thể hoàn tất thao tác</p>
                    <p className="text-coral-700 dark:text-coral-300 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Hộp chọn checkbox cam kết thỏa thuận */}
              <div
                className={cn(
                  'rounded-xl border p-3 transition-all select-none',
                  isChecked
                    ? 'border-brand-300 bg-brand-50/30 ring-1 ring-brand-200/50 dark:border-brand-700/60 dark:bg-brand-950/20'
                    : 'border-plum-900/[0.08] bg-cream-50/50 dark:border-[#393a3b] dark:bg-[#1e1f20]'
                )}
              >
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="mentoring-terms-checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setIsChecked(e.target.checked)
                      if (errorMessage) setErrorMessage(null)
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-plum-300 text-brand-500 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <span className="text-xs font-medium leading-relaxed text-plum-900 dark:text-[#e4e6eb]">
                    Tôi đã đọc, hiểu rõ và đồng ý với{' '}
                    <strong className="text-brand-600 dark:text-brand-400">
                      Điều khoản Hướng dẫn & Hỗ trợ (Phiên bản {currentVersion})
                    </strong>
                    . Tôi cam kết tuân thủ quy tắc ứng xử, trung thực trong trao đổi và tôn trọng Thỏa thuận (Deal).
                  </span>
                </label>
              </div>

              {/* Các nút bấm hành động khi chưa chấp thuận */}
              <div className="flex items-center gap-2.5 pt-0.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleBack}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  className="shrink-0"
                >
                  Quay lại
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={!isChecked || acceptMutation.isPending}
                  onClick={handleAccept}
                  leftIcon={
                    acceptMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )
                  }
                  className="flex-1"
                >
                  {acceptMutation.isPending ? 'Đang ghi nhận...' : 'Đồng ý & Tiếp tục'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* CỘT PHẢI: Khung đọc văn bản điều khoản (Document Reader) toàn màn hình */}
      <Card
        hover={false}
        className="flex-1 min-h-0 flex flex-col border border-plum-900/[0.08] bg-white p-3 sm:p-4 shadow-soft dark:bg-[#242526] dark:border-[#393a3b]"
      >
        <MentoringTermsContent version={currentVersion} />
      </Card>
    </div>
  )
}
