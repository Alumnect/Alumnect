import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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

const PRINCIPLE_CONFIGS = [
  {
    titleKey: 'mentoring.principleHonestyTitle',
    descKey: 'mentoring.principleHonestyDesc',
    icon: ShieldCheck,
    iconClassName: 'bg-primary-soft text-primary-solid',
  },
  {
    titleKey: 'mentoring.principleRespectTitle',
    descKey: 'mentoring.principleRespectDesc',
    icon: HeartHandshake,
    iconClassName: 'bg-success-soft text-success',
  },
  {
    titleKey: 'mentoring.principleTransparencyTitle',
    descKey: 'mentoring.principleTransparencyDesc',
    icon: FileCheck2,
    iconClassName: 'bg-info-soft text-info',
  },
] as const

/** Trang đọc và xác nhận điều khoản Mentoring. */
export function MentoringTerms({
  source = 'MENTORING_HOME',
  onSuccess,
}: MentoringTermsProps) {
  const { t } = useTranslation()
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
          : t('mentoring.termsConfirmError'),
      )
    }
  }

  return (
    <div className="grid w-full grid-cols-1 items-start gap-4 pb-8 xl:grid-cols-[minmax(19rem,22rem)_minmax(0,1fr)] xl:gap-5">
      <Card
        hover={false}
        className="border border-border bg-surface p-5 shadow-soft xl:sticky xl:top-0"
      >
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-solid">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary-solid">
                {t('mentoring.mentoringSpace')}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-text">
                {t('mentoring.termsOfUse')}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-text-muted dark:text-text-muted">
                {t('mentoring.termsReadAndConfirmPrompt')}
              </p>
            </div>
          </div>

        </div>

        <div className="flex flex-col">
          <div className="order-2 mt-5 grid gap-2.5 border-t border-border pt-5 xl:order-1 xl:border-0 xl:pt-0">
            {PRINCIPLES.map((principle) => {
              const Icon = principle.icon

              return (
                <div
                  key={principle.title}
                  className="flex items-start gap-2.5 rounded-xl border border-border bg-cream-50/60 p-3 dark:bg-white/[0.04]"
                >
                  <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', principle.iconClassName)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">
                      {t(principle.titleKey)}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-text-muted">
                      {t(principle.descKey)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

        <div className="order-1 mt-5 border-t border-border pt-5 xl:order-2">
          {isAlreadyAccepted ? (
            <div className="flex items-start gap-3 rounded-xl border border-success-border bg-success-soft p-4 text-success">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-semibold">{t('mentoring.termsAlreadyAccepted')}</p>
                <p className="mt-0.5 text-xs leading-5 text-success">
                  {statusData?.acceptedAt
                    ? t('mentoring.confirmedOnDate', { date: new Date(statusData.acceptedAt).toLocaleDateString() })
                    : t('mentoring.canContinueUsingMentoring')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {errorMessage && (
                <div
                  className="flex items-start gap-2.5 rounded-xl border border-danger-border bg-danger-soft p-3 text-sm text-danger"
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
                      ? 'border-primary-soft-border bg-primary-soft'
                      : 'border-border',
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
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong text-primary-solid focus:ring-primary"
                  />
                  <span className="text-sm font-medium leading-5 text-text">
                    {t('mentoring.termsConsentCheckbox')}
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
                  {acceptMutation.isPending ? t('mentoring.recordingConsent') : t('mentoring.agreeAndContinue')}
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>
      </Card>

      <Card
        hover={false}
        className="border border-border bg-surface p-3 shadow-soft sm:p-5"
      >
        <MentoringTermsContent />
      </Card>
    </div>
  )
}
