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
  // Gom nhóm các kỹ năng theo groupName
  const groupedSkills = useMemo(() => {
    if (!mentor.skills || mentor.skills.length === 0) return {}

    return mentor.skills.reduce<Record<string, MentorSkillItem[]>>((acc, skill) => {
      const group = skill.groupName || 'Kỹ năng chung'
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
      className="border border-plum-900/[0.08] bg-white p-6 sm:p-7 text-left space-y-6 dark:bg-[#242526] dark:border-[#393a3b]"
    >
      <div className="flex items-center gap-2.5 border-b border-plum-900/[0.06] pb-3.5 dark:border-[#393a3b]">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/5 text-violet-600 dark:bg-violet-600/40 dark:text-violet-400">
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-bold text-plum-900 dark:text-[#e4e6eb]">
          Lĩnh vực hỗ trợ & Kỹ năng chuyên môn
        </h2>
      </div>

      {/* 1. Lĩnh vực hỗ trợ chuẩn (Supported Fields) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
            Lĩnh vực cố vấn
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
          <p className="text-xs text-plum-400 italic">
            Mentor chưa chọn lĩnh vực cố vấn cụ thể.
          </p>
        )}
      </div>

      {/* 2. Chủ đề cố vấn chuyên sâu (Topics) */}
      {hasTopics && (
        <div className="space-y-3 border-t border-plum-900/[0.05] pt-4 dark:border-[#393a3b]">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-coral-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
              Chủ đề cố vấn chuyên sâu
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {mentor.topics.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-xl bg-cream-100 px-3 py-1.5 text-xs font-semibold text-plum-800 border border-plum-900/5 dark:bg-white/5 dark:text-[#e4e6eb]"
              >
                <span>#{topic}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Kỹ năng chuyên môn phân theo nhóm (Skills Grouped) */}
      <div className="space-y-4 border-t border-plum-900/[0.05] pt-4 dark:border-[#393a3b]">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-mint-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
            Kỹ năng chuyên môn
          </h3>
        </div>

        {hasSkills ? (
          <div className="space-y-3.5">
            {Object.entries(groupedSkills).map(([groupName, skills]) => (
              <div key={groupName} className="space-y-2">
                <p className="text-[11px] font-bold text-plum-500 dark:text-[#8f9399]">
                  {groupName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center rounded-xl bg-white px-3 py-1 text-xs font-semibold text-plum-700 border border-plum-900/10 shadow-2xs hover:border-brand-300 transition-colors dark:bg-[#18191a] dark:text-[#e4e6eb] dark:border-[#393a3b]"
                    >
                      {skill.skillName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-plum-400 italic">
            Mentor chưa cập nhật danh sách kỹ năng chuyên môn.
          </p>
        )}
      </div>
    </Card>
  )
}
