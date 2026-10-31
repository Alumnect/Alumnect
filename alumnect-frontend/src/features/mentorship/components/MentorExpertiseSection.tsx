import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { Sparkles, Briefcase, Hash, Layers } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import type { MentorDetailData, MentorSkillItem } from '../model/mentorDetailTypes'

interface MentorExpertiseSectionProps {
  mentor: MentorDetailData
}

/**
 * Hiển thị Chuyên môn, Lĩnh vực hỗ trợ, Chủ đề và Kỹ năng của Mentor (UC99).
 * Phân biệt rõ ràng giữa Supported Fields (danh mục chuẩn) và Skills (kỹ năng cá nhân).
 */
export function MentorExpertiseSection({ mentor }: MentorExpertiseSectionProps) {
  const { t } = useTranslation()
  // Gom nhóm các kỹ năng theo groupName
  const groupedSkills = useMemo(() => {
    if (!mentor.skills || mentor.skills.length === 0) return {}

    return mentor.skills.reduce<Record<string, MentorSkillItem[]>>((acc, skill) => {
      const group = skill.groupName || t('mentoring.generalSkillsDefault')
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push(skill)
      return acc
    }, {})
  }, [mentor.skills])

  const hasFields = mentor.supportedFields && mentor.supportedFields.length > 0
  const hasTopics = mentor.topics && mentor.topics.length > 0
  const hasSkills = Object.keys(groupedSkills).length > 0

  return (
    <Card
      hover={false}
      className="border border-border bg-surface p-6 sm:p-7 text-left space-y-6"
    >
      <div className="flex items-center gap-2.5 border-b border-border pb-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-info-soft text-info">
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-bold text-text">
          {t('mentoring.supportFieldsAndSkillsTitle')}
        </h2>
      </div>

      {/* 1. Lĩnh vực hỗ trợ chuẩn (Supported Fields) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary-solid" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            {t('mentoring.mentoringFieldSubheading')}
          </h3>
        </div>

        {hasFields ? (
          <div className="flex flex-wrap gap-2">
            {mentor.supportedFields.map((field) => (
              <Badge
                key={field.id}
                tone="brand"
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-2xs"
              >
                {field.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-subtle italic">
            {t('mentoring.noMentoringFieldSelected')}
          </p>
        )}
      </div>

      {/* 2. {t('mentoring.mentoringTopicsSubheading')} (Topics) */}
      {hasTopics && (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-danger" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-subtle">
              Chủ đề cố vấn chuyên sâu
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {mentor.topics.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-xl bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text border border-border"
              >
                <span>#{topic}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Kỹ năng chuyên môn phân theo nhóm (Skills Grouped) */}
      <div className="space-y-4 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-success" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Kỹ năng chuyên môn
          </h3>
        </div>

        {hasSkills ? (
          <div className="space-y-3.5">
            {Object.entries(groupedSkills).map(([groupName, skills]) => (
              <div key={groupName} className="space-y-2">
                <p className="text-xs font-bold text-text-subtle">
                  {groupName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center rounded-xl bg-surface px-3 py-1 text-xs font-semibold text-text-muted border border-border shadow-2xs hover:border-primary-soft-border transition-colors"
                    >
                      {skill.skillName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-subtle italic">
            {t('mentoring.noSkillsUpdated')}
          </p>
        )}
      </div>
    </Card>
  )
}
