import { useQuery } from '@tanstack/react-query'
import { Landmark, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ButtonLink, Container } from '@/components/ui'
import { MentorPageHeader, MentoringTermsGate } from '@/features/mentorship'
import { mentoringWalletApi } from '@/features/mentorship/api/mentoringWalletApi'
import { MentoringWalletTable } from '@/features/mentorship/components/MentoringWalletTable'
import { MentoringActionCard } from '@/features/mentorship/components/MentoringUi'

/** Thu nhập Mentoring: thù lao từ các Task đã nghiệm thu và trạng thái chuyển tiền về tài khoản Mentor. */
function MentorEarningsContent() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['mentoring-wallet', 'earnings'],
    queryFn: mentoringWalletApi.getEarnings,
  })

  return (
    <div className="space-y-5">
      <MentorPageHeader
        icon={<Landmark className="h-4 w-4" />}
        eyebrow={t('mentoring.earningsEyebrow')}
        title={t('mentoring.earningsTitle')}
        description={t('mentoring.earningsSubtitle')}
      />

      {data?.bankAccountRequired && (
        <MentoringActionCard
          tone="coral"
          icon={<ShieldAlert />}
          title={t('mentoring.payoutPendingAccountTitle')}
          actions={
            <ButtonLink to="/app/mentoring/become-mentor" size="sm" className="h-8 rounded-lg px-3 text-xs">
              {t('mentoring.updateAccountBtn')}
            </ButtonLink>
          }
        >
          {t('mentoring.payoutPendingAccountDesc')}
        </MentoringActionCard>
      )}

      <MentoringWalletTable
        wallet={data}
        isLoading={isLoading}
        counterpartLabel={t('mentoring.studentCounterpart')}
        emptyTitle={t('mentoring.noEarningsTitle')}
        emptyDescription={t('mentoring.noEarningsDesc')}
      />
    </div>
  )
}

export function MentorEarningsPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentorEarningsContent />
      </MentoringTermsGate>
    </Container>
  )
}
