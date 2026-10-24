import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DialogFrame } from '@/components/ui/DialogFrame'
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

  return (
    <DialogFrame onClose={() => navigate('/app')} dismissible={false} zIndexClassName="z-[80]" maxWidthClassName="sm:max-w-lg" className="overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
                <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-solid">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2
              id="mentoring-consent-title"
              className="text-lg font-semibold leading-snug text-text sm:text-xl"
            >
              Chấp nhận điều khoản Mentoring
            </h2>
          </div>
        </div>

        <p
          id="mentoring-consent-description"
          className="mt-4 text-sm leading-6 text-text-muted"
        >
          Các chức năng Mentor chỉ được mở sau khi bạn xác nhận quy tắc tham gia và bảo vệ quyền lợi của các bên.
        </p>

        <div className="mt-4 space-y-2 rounded-xl border border-border bg-surface-2 p-3.5 text-sm text-text-muted">
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Cung cấp thông tin trung thực và bảo mật dữ liệu trao đổi.
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Giao tiếp tôn trọng, minh bạch về phạm vi và chi phí.
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Tuân thủ thỏa thuận và quy trình xử lý của AlumNect.
          </p>
        </div>

        <Link
          to={`/app/mentoring/terms?source=${source}`}
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary-solid hover:underline"
        >
          <FileText className="h-4 w-4" />
          Đọc toàn bộ điều khoản
        </Link>

        <label
          className={cn(
            'mt-3 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
            isChecked
              ? 'border-primary-soft-border bg-primary-soft'
              : 'border-border',
          )}
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(event) => setIsChecked(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border-strong accent-primary-solid focus:ring-primary"
          />
          <span className="text-sm font-medium leading-5 text-text">
            Tôi đã đọc, hiểu và đồng ý với Điều khoản Mentoring.
          </span>
        </label>

        {acceptMutation.isError && (
          <p className="mt-3 rounded-xl border border-danger-border bg-danger-soft p-3 text-sm font-medium text-danger" role="alert">
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
    </DialogFrame>
  )
}
