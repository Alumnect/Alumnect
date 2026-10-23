import React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Building, Sparkles, AlertCircle, ExternalLink } from 'lucide-react'
import type { ProfessionalInfo } from '../model/mentorRegistrationTypes'
import { useOwnProfile } from '@/features/user'
import { groupSkills } from '@/utils/profile'

interface Props {
  professionalInfo?: ProfessionalInfo
  bio: string
  onBioChange: (val: string) => void
}

/**
 * Section 2: Thông tin chuyên môn & Kinh nghiệm (UC91).
 * Vị trí hiện tại và Kỹ năng được hiển thị dạng Chỉ đọc (Read-only), đồng bộ từ Hồ sơ cá nhân.
 */
export const MentorProfessionalSection: React.FC<Props> = ({
  professionalInfo,
  bio,
  onBioChange,
}) => {
  const currentPos = professionalInfo?.reusedFromProfile?.currentPosition
  const currentComp = professionalInfo?.reusedFromProfile?.currentCompany
  const fallbackSkills = professionalInfo?.reusedFromProfile?.skills || []

  // Đồng bộ đầy đủ thông tin kỹ năng bao gồm cả mục lớn (groupName) từ hồ sơ cá nhân
  const { data: ownProfile } = useOwnProfile()

  const skillGroups = React.useMemo(() => {
    if (ownProfile?.skills && ownProfile.skills.length > 0) {
      return groupSkills(ownProfile.skills)
    }
    if (professionalInfo?.reusedFromProfile?.skillItems && professionalInfo.reusedFromProfile.skillItems.length > 0) {
      return professionalInfo.reusedFromProfile.skillItems.reduce<Record<string, { id?: number; skillName: string }[]>>((acc, item) => {
        ;(acc[item.groupName] ??= []).push(item)
        return acc
      }, {})
    }
    return null
  }, [ownProfile?.skills, professionalInfo?.reusedFromProfile?.skillItems])

  // Lấy toàn bộ danh sách các vị trí công việc đang làm hiện tại (isCurrent = true) từ hồ sơ cá nhân
  const currentExperiences = React.useMemo(() => {
    if (ownProfile?.experiences && ownProfile.experiences.length > 0) {
      const currents = ownProfile.experiences.filter((exp) => exp.isCurrent)
      if (currents.length > 0) {
        return currents
      }
      const primary = ownProfile.experiences.find((exp) => exp.isPrimary)
      if (primary) return [primary]
      return [ownProfile.experiences[0]]
    }
    if (professionalInfo?.reusedFromProfile?.currentExperiences && professionalInfo.reusedFromProfile.currentExperiences.length > 0) {
      return professionalInfo.reusedFromProfile.currentExperiences
    }
    if (currentPos) {
      return [{ id: 0, title: currentPos, company: currentComp || '' }]
    }
    return []
  }, [ownProfile?.experiences, professionalInfo?.reusedFromProfile?.currentExperiences, currentPos, currentComp])

  return (
    <div className="bg-surface rounded-2xl border border-cream-300/80 dark:border-border p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border dark:border-border mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-solid flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h3 className="font-semibold text-text text-lg">Chuyên môn</h3>
            <p className="text-xs text-text-subtle">
              Đồng bộ tự động từ hồ sơ cá nhân của bạn
            </p>
          </div>
        </div>

        <Link
          to="/app/profile"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-solid hover:text-primary-solid bg-primary-soft hover:bg-primary-soft px-3.5 py-2 rounded-xl border border-primary-soft-border transition-colors"
        >
          <span>Chỉnh sửa tại hồ sơ</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-6">
        {/* Khối Chỉ đọc (Read-only): Vị trí hiện tại & Kỹ năng từ Hồ sơ */}
        <div className="bg-cream-100/80 dark:bg-bg/60 rounded-2xl p-4.5 border border-cream-300/70 dark:border-border space-y-4">
          {/* Vị trí & Công ty hiện tại */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-text-subtle dark:text-text-subtle flex items-center gap-1.5 mb-2">
              <Briefcase className="w-3.5 h-3.5 text-primary-solid" />
              <span>Vị trí công việc hiện tại</span>
              <span className="text-danger">*</span>
            </span>

            {currentExperiences.length > 0 ? (
              <div className="flex flex-col gap-2 pt-0.5">
                {currentExperiences.map((exp, idx) => (
                  <div key={exp.id || idx} className="flex flex-wrap items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-xl bg-primary-soft text-primary-solid font-semibold text-xs border border-brand-200/70 dark:border-brand-700/60 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{exp.title}</span>
                    </span>
                    {exp.company && (
                      <span className="px-3.5 py-1.5 rounded-xl bg-surface text-text-muted font-medium text-xs border border-cream-300/80 dark:border-border flex items-center gap-1.5 shadow-2xs">
                        <Building className="w-3.5 h-3.5 text-text-subtle dark:text-text-subtle" />
                        <span>{exp.company}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-warning-soft border border-warning-border rounded-xl flex items-center justify-between gap-3 text-warning text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                  <span>Chưa có thông tin công việc hiện tại trong hồ sơ cá nhân.</span>
                </div>
                <Link
                  to="/app/profile"
                  target="_blank"
                  className="font-bold text-primary-solid hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Thêm tại hồ sơ</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Kỹ năng chuyên môn */}
          <div className="pt-3 border-t border-cream-300/60 dark:border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-text-subtle dark:text-text-subtle flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              <span>Kỹ năng chuyên môn</span>
            </span>

            {skillGroups && Object.keys(skillGroups).length > 0 ? (
              <div className="space-y-3 pt-0.5">
                {Object.entries(skillGroups).map(([groupName, groupSkillList]) => (
                  <div key={groupName} className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle dark:text-text-subtle">
                      {groupName}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {groupSkillList.map((skill, idx) => (
                        <span
                          key={('id' in skill && skill.id) ? skill.id : idx}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-surface text-text-muted border border-border dark:border-border shadow-2xs"
                        >
                          {skill.skillName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : fallbackSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {fallbackSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-surface text-text-muted border border-border dark:border-border shadow-2xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-subtle dark:text-text-subtle italic">
                Chưa có kỹ năng trong hồ sơ. Bạn có thể bổ sung tại trang hồ sơ cá nhân.
              </p>
            )}
          </div>
        </div>

        {/* Khối Nhập liệu: Bio Mentor */}
        <div className="pt-1">
          <div className="w-full">
            <label className="block text-sm font-semibold text-text-muted mb-1.5">
              Giới thiệu về bạn
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Chia sẻ ngắn gọn định hướng hoặc điều bạn muốn hỗ trợ..."
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-border-strong bg-surface text-text placeholder-plum-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-primary transition text-sm resize-none"
            />
            <div className="flex justify-end items-center text-xs text-text-subtle dark:text-text-subtle mt-1">
              <span>{bio.length}/2000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
