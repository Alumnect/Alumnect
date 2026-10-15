import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  HeartHandshake,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { useAcceptMentoringTerms, useMentoringTermsStatus } from '../hooks/useMentoringTerms'
import type { MentoringEntrySource } from '../model/mentoringTermsTypes'
import { MentoringTermsContent } from './MentoringTermsContent'
import { MentorshipLoadingSkeleton } from './MentorshipLoadingSkeleton'

interface MentoringTermsProps {
  source?: MentoringEntrySource
  onSuccess?: () => void
}

const PRINCIPLES = [
  {
    title: 'Trung thực & bảo mật',
    description: 'Thông tin chính xác, dữ liệu cá nhân được bảo vệ.',
    icon: ShieldCheck,
    iconClassName: 'bg-brand-50 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300',
  },
  {
    title: 'Tôn trọng lẫn nhau',
    description: 'Giao tiếp văn minh, chuyên nghiệp và đúng mực.',
    icon: HeartHandshake,
    iconClassName: 'bg-mint-100 text-mint-700 dark:bg-mint-400/15 dark:text-mint-300',
  },
  {
    title: 'Minh bạch cam kết',
    description: 'Thực hiện đúng thỏa thuận trong quá trình Mentoring.',
    icon: FileCheck2,
    iconClassName: 'bg-violet-500/10 text-violet-500 dark:bg-violet-400/15 dark:text-violet-300',
  },
] as const

/** Trang đọc và xác nhận điều khoản Mentoring. */
export function MentoringTerms({
  source = 'MENTORING_HOME',
  onSuccess,
}: MentoringTermsProps) {
  const navigate = useNavigate()
  const [isChecked, setIsChecked] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { data: statusData, isLoading: isStatusLoading } = useMentoringTermsStatus()
  const acceptMutation = useAcceptMentoringTerms()

  const isAlreadyAccepted = statusData?.accepted === true

  if (isStatusLoading) {
    return <MentorshipLoadingSkeleton variant="terms" />
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

      navigate(
        source === 'BECOME_MENTOR'
          ? '/app/mentoring/become-mentor'
          : '/app/mentoring',
        { replace: true },
      )
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể ghi nhận xác nhận. Vui lòng thử lại.',
      )
    }
  }

  return (
    <div className="grid w-full grid-cols-1 items-start gap-4 pb-8 xl:grid-cols-[minmax(19rem,22rem)_minmax(0,1fr)] xl:gap-5">
      <Card
        hover={false}
        className="border border-plum-900/[0.08] bg-white p-5 shadow-soft xl:sticky xl:top-0 dark:border-white/10 dark:bg-[#242526]"
      >
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                Không gian Mentoring
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-plum-900 dark:text-white">
                Điều khoản sử dụng
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-plum-600 dark:text-[#c7c9cc]">
                Đọc quy định và xác nhận trước khi sử dụng các chức năng Mentor của AlumNect.
              </p>
            </div>
          </div>

        </div>

        <div className="flex flex-col">
          <div className="order-2 mt-5 grid gap-2.5 border-t border-plum-900/[0.07] pt-5 xl:order-1 xl:border-0 xl:pt-0 dark:border-white/10">
            {PRINCIPLES.map((principle) => {
              const Icon = principle.icon

              return (
                <div
                  key={principle.title}
                  className="flex items-start gap-2.5 rounded-xl border border-plum-900/[0.07] bg-cream-50/60 p-3 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', principle.iconClassName)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-plum-900 dark:text-white">
                      {principle.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-plum-600 dark:text-[#b0b3b8]">
                      {principle.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

        <div className="order-1 mt-5 border-t border-plum-900/[0.07] pt-5 xl:order-2 dark:border-white/10">
          {isAlreadyAccepted ? (
            <div className="flex items-start gap-3 rounded-xl border border-mint-200 bg-mint-50/70 p-4 text-mint-900 dark:border-mint-800/50 dark:bg-mint-950/30 dark:text-mint-200">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint-600 dark:text-mint-300" />
              <div>
                <p className="text-sm font-semibold">Bạn đã đồng ý điều khoản</p>
                <p className="mt-0.5 text-xs leading-5 text-mint-800 dark:text-mint-300">
                  {statusData?.acceptedAt
                    ? `Xác nhận ngày ${new Date(statusData.acceptedAt).toLocaleDateString('vi-VN')}`
                    : 'Bạn có thể tiếp tục sử dụng các chức năng Mentor.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {errorMessage && (
                <div
                  className="flex items-start gap-2.5 rounded-xl border border-coral-200 bg-coral-50 p-3 text-sm text-coral-800 dark:border-coral-900/50 dark:bg-coral-950/30 dark:text-coral-200"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <label
                  className={cn(
                    'flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                    isChecked
                      ? 'border-brand-300 bg-brand-50/50 dark:border-brand-300/30 dark:bg-brand-400/10'
                      : 'border-plum-900/[0.09] dark:border-white/10',
                  )}
                >
                  <input
                    id="mentoring-terms-checkbox"
                    type="checkbox"
                    checked={isChecked}
                    onChange={(event) => {
                      setIsChecked(event.target.checked)
                      setErrorMessage(null)
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-plum-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium leading-5 text-plum-800 dark:text-[#e4e6eb]">
                    Tôi đã đọc, hiểu và đồng ý với Điều khoản Mentoring.
                  </span>
                </label>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={!isChecked || acceptMutation.isPending}
                  onClick={handleAccept}
                  leftIcon={acceptMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <CheckCircle2 className="h-4 w-4" />}
                  className="w-full"
                >
                  {acceptMutation.isPending ? 'Đang ghi nhận...' : 'Đồng ý và tiếp tục'}
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>
      </Card>

      <Card
        hover={false}
        className="border border-plum-900/[0.08] bg-white p-3 shadow-soft sm:p-5 dark:border-white/10 dark:bg-[#242526]"
      >
        <MentoringTermsContent />
      </Card>
    </div>
  )
}
