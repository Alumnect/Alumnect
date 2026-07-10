import type { UserSkillResponse } from '@/features/user/model/userTypes'

/**
 * Gom nhóm kỹ năng theo tên nhóm (groupName)
 */
export function groupSkills(skills: UserSkillResponse[]): Record<string, UserSkillResponse[]> {
  return skills.reduce<Record<string, UserSkillResponse[]>>((acc, skill) => {
    ;(acc[skill.groupName] ??= []).push(skill)
    return acc
  }, {})
}
