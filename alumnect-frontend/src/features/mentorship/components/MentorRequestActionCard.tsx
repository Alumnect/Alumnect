import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Send, AlertTriangle, CheckCircle, Clock, Laptop, HeartHandshake, Info } from 'lucide-react'
import { Card, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import type { MentorDetailData } from '../model/mentorDetailTypes'

interface MentorRequestActionCardProps {
  mentor: MentorDetailData
}

/**
 * Thẻ thông tin buổi hẹn & đặt yêu cầu cố vấn (UC99 -> UC101).
 * Thiết kế gọn gàng, hiển thị thông tin thực tế về buổi hướng dẫn và chuyển hướng đến trang tạo Direct Request.
 */
export function MentorRequestActionCard({ mentor }: MentorRequestActionCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isSelfMentor = Boolean(
    currentUser && mentor.userId && String(currentUser.id) === String(mentor.userId)
  )

  const handleOpenRequest = () => {
    if (!isAuthenticated) {
      toast.info(t('mentoring.loginToRequestMentoring'))
      navigate('/auth/login')
      return
    }

    if (isSelfMentor) {
      toast.warning(t('mentoring.cannotRequestSelf'))
      return
    }

    if (!mentor.canReceiveRequest) {
      toast.warning(mentor.availabilityReason || t('mentoring.mentorUnavailableDefault'))
      return
    }

    navigate(`/app/mentoring/mentors/${mentor.mentorId}/request`)
  }

  return (
    <>
      <Card
        hover={false}
        className="border border-border bg-surface p-6 text-left space-y-4 shadow-sm"
      >
        <div className="flex items-center gap-2.5 border-b border-border pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary-solid">
            <Send className="h-4 w-4" />
          </span>
          <h3 className="font-display text-base font-bold text-text">
            {t('mentoring.mentoringSessionInfo')}
          </h3>
        </div>

        {/* Thông số buổi hẹn mẫu */}
        <div className="space-y-2 text-xs text-text-muted">
          <div className="flex items-center justify-between py-1 border-b border-border dark:border-white/[0.05]">
            <span className="inline-flex items-center gap-1.5 text-text-subtle">
              <Clock className="h-3.5 w-3.5 text-primary-solid" />
              <span>{t('mentoring.suggestedDuration')}</span>
            </span>
            <strong className="text-text">{t('mentoring.suggestedDurationValue')}</strong>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border dark:border-white/[0.05]">
            <span className="inline-flex items-center gap-1.5 text-text-subtle">
              <Laptop className="h-3.5 w-3.5 text-primary-solid" />
              <span>{t('mentoring.meetingPlatform')}</span>
            </span>
            <strong className="text-text">Google Meet / Zoom</strong>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="inline-flex items-center gap-1.5 text-text-subtle">
              <HeartHandshake className="h-3.5 w-3.5 text-success" />
              <span>{t('mentoring.referenceFee')}</span>
            </span>
            <strong className="text-success font-bold">{t('mentoring.communitySupportFee')}</strong>
          </div>
        </div>

        {isSelfMentor ? (
          <div className="space-y-3 pt-1">
            <div className="rounded-xl bg-primary-soft p-3 border border-primary-soft-border flex items-center gap-2 text-primary-solid text-xs font-semibold">
              <Info className="h-4 w-4 text-primary-solid shrink-0" />
              <span>{t('mentoring.thisIsYourMentorProfile')}</span>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/app/mentoring/status')}
              className="w-full rounded-2xl font-bold py-3 border-primary-soft-border text-primary-solid hover:bg-primary-soft"
            >
              {t('mentoring.manageMentorProfile')}
            </Button>
          </div>
        ) : mentor.canReceiveRequest ? (
          <div className="space-y-3 pt-1">
            <div className="rounded-xl bg-success-soft p-3 border border-success-border flex items-center gap-2 text-success text-xs font-semibold">
              <CheckCircle className="h-4 w-4 text-success shrink-0" />
              <span>{t('mentoring.mentorReadyToReceive')}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={handleOpenRequest}
              className="w-full rounded-2xl font-bold py-3 bg-primary-solid hover:bg-primary-hover shadow-raised active:scale-[0.98]"
            >
              {t('mentoring.sendMentoringRequestBtn')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="rounded-xl bg-danger-soft p-3 border border-danger-border flex items-start gap-2 text-danger text-xs">
              <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
              <span>{mentor.availabilityReason || t('mentoring.mentorUnavailableDefault')}</span>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                toast.warning(
                  mentor.availabilityReason || t('mentoring.temporarilyPausedNotice')
                )
              }
              className="w-full rounded-2xl font-bold py-3 bg-surface-3 text-text-subtle hover:bg-surface-3"
            >
              {t('mentoring.temporarilyPausedReceiving')}
            </Button>
          </div>
        )}
      </Card>
    </>
  )
}
