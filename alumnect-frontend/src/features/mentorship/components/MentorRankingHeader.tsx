
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
      scene="ranking"
      title={t('mentoring.ranking')}
      description={context || undefined}
    />
  )
}
