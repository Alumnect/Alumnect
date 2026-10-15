import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAcceptMentoringTerms } from '../hooks/useMentoringTerms'
import type { MentoringEntrySource } from '../model/mentoringTermsTypes'

interface MentoringTermsConsentModalProps {
  source: MentoringEntrySource
}

/** Bước xác nhận bắt buộc trước khi mở các chức năng Mentoring. */
export function MentoringTermsConsentModal({
  source,
}: MentoringTermsConsentModalProps) {
  const navigate = useNavigate()
  const acceptMutation = useAcceptMentoringTerms()
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-plum-900/55 p-4 dark:bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentoring-consent-title"
      aria-describedby="mentoring-consent-description"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/70 bg-white p-5 shadow-2xl sm:p-6 dark:border-white/10 dark:bg-[#242526]">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2
              id="mentoring-consent-title"
              className="font-display text-xl font-bold text-plum-900 sm:text-2xl dark:text-white"
            >
              Chấp nhận điều khoản Mentoring
            </h2>
          </div>
        </div>

        <p
          id="mentoring-consent-description"
          className="mt-4 text-sm leading-6 text-plum-600 dark:text-[#c7c9cc]"
        >
          Các chức năng Mentor chỉ được mở sau khi bạn xác nhận quy tắc tham gia và bảo vệ quyền lợi của các bên.
        </p>

        <div className="mt-4 space-y-2 rounded-xl border border-plum-900/[0.07] bg-cream-50/70 p-3.5 text-sm text-plum-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-[#e4e6eb]">
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" />
            Cung cấp thông tin trung thực và bảo mật dữ liệu trao đổi.
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" />
            Giao tiếp tôn trọng, minh bạch về phạm vi và chi phí.
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" />
            Tuân thủ thỏa thuận và quy trình xử lý của AlumNect.
          </p>
        </div>

        <Link
          to={`/app/mentoring/terms?source=${source}`}
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          <FileText className="h-4 w-4" />
          Đọc toàn bộ điều khoản
        </Link>

        <label
          className={cn(
            'mt-3 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
            isChecked
              ? 'border-brand-300 bg-brand-50/50 dark:border-brand-300/30 dark:bg-brand-400/10'
              : 'border-plum-900/[0.09] dark:border-white/10',
          )}
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(event) => setIsChecked(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-plum-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium leading-5 text-plum-800 dark:text-[#e4e6eb]">
            Tôi đã đọc, hiểu và đồng ý với Điều khoản Mentoring.
          </span>
        </label>

        {acceptMutation.isError && (
          <p className="mt-3 text-sm font-medium text-coral-700 dark:text-coral-300" role="alert">
            {acceptMutation.error?.message || 'Không thể ghi nhận xác nhận. Vui lòng thử lại.'}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate('/app')}
          >
            Để sau
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!isChecked || acceptMutation.isPending}
            onClick={() => acceptMutation.mutate()}
            leftIcon={acceptMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <CheckCircle2 className="h-4 w-4" />}
          >
            {acceptMutation.isPending ? 'Đang ghi nhận...' : 'Đồng ý và tiếp tục'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
