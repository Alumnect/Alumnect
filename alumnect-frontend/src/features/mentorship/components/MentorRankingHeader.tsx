import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MentorPageHeader } from './MentorPageHeader'

interface MentorRankingHeaderProps {
  selectedFieldName?: string
  totalMentors?: number
}

export function MentorRankingHeader({ selectedFieldName, totalMentors }: MentorRankingHeaderProps) {
  const { t } = useTranslation()
  const context = [
    selectedFieldName ? t('mentoring.fieldPrefix', { field: selectedFieldName }) : null,
    typeof totalMentors === 'number' ? t('mentoring.mentorCountFormat', { count: totalMentors }) : null,
  ].filter(Boolean).join(' · ')

  return (
    <MentorPageHeader
      icon={<Trophy className="h-4 w-4" />}
      eyebrow={context || t('mentoring.rankingEyebrow')}
      title={t('mentoring.ranking')}
      description={t('mentoring.rankingSubtitle')}
    />
  )
}
