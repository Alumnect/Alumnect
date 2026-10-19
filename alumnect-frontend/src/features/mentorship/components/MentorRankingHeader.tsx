import { Trophy } from 'lucide-react'
import { MentorPageHeader } from './MentorPageHeader'

interface MentorRankingHeaderProps {
  selectedFieldName?: string
  totalMentors?: number
}

export function MentorRankingHeader({ selectedFieldName, totalMentors }: MentorRankingHeaderProps) {
  const context = [
    selectedFieldName ? `Lĩnh vực ${selectedFieldName}` : null,
    typeof totalMentors === 'number' ? `${totalMentors} Mentor` : null,
  ].filter(Boolean).join(' · ')

  return (
    <MentorPageHeader
      icon={<Trophy className="h-4 w-4" />}
      eyebrow={context || 'Bảng vinh danh Mentor'}
      title="Bảng xếp hạng Mentor"
      description="Thứ hạng phản ánh uy tín, số nhiệm vụ hoàn thành và đánh giá từ người học trong từng lĩnh vực."
    />
  )
}
