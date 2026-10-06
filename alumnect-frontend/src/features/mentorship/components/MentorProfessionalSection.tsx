import React, { useState } from 'react'
import { Briefcase, Building, Sparkles, AlertCircle, Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { ExperienceFormModal } from '@/features/user'
import { MENTOR_REGISTRATION_QUERY_KEY } from '../hooks/useMentorRegistration'
import type { ProfessionalInfo } from '../model/mentorRegistrationTypes'

interface Props {
  professionalInfo?: ProfessionalInfo
  yearsOfExperience: number | '' | null
  bio: string
  onYearsChange: (val: number | null) => void
  onBioChange: (val: string) => void
}

/**
 * Section 2: Thông tin chuyên môn & Kinh nghiệm (UC91).
 * Hỗ trợ mở trực tiếp Modal Thêm Kinh Nghiệm của User ngay tại màn hình đăng ký,
 * không bắt buộc người dùng phải chuyển qua trang Profile.
 */
export const MentorProfessionalSection: React.FC<Props> = ({
  professionalInfo,
  yearsOfExperience,
  bio,
  onYearsChange,
  onBioChange,
}) => {
  const queryClient = useQueryClient()
  const [isExpModalOpen, setIsExpModalOpen] = useState(false)

  const currentPos = professionalInfo?.reusedFromProfile?.currentPosition
  const currentComp = professionalInfo?.reusedFromProfile?.currentCompany
  const skills = professionalInfo?.reusedFromProfile?.skills || []

  const handleOpenAddExperience = () => {
    setIsExpModalOpen(true)
  }

  const handleExperienceSuccess = () => {
    // Tự động làm mới dữ liệu đăng ký Mentor và dữ liệu User sau khi thêm kinh nghiệm thành công
    queryClient.invalidateQueries({ queryKey: MENTOR_REGISTRATION_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['experiences'] })
    queryClient.invalidateQueries({ queryKey: ['user-profile'] })
  }

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-6 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#393a3b] mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
          2
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-[#e4e6eb] text-lg">Chuyên môn</h3>
        </div>
      </div>

      <div className="space-y-6">
        {/* Vị trí & Công ty hiện tại (Tái sử dụng trực tiếp từ Experience) */}
        <div className="bg-slate-50/70 dark:bg-[#1f2022] rounded-xl p-4 border border-slate-100 dark:border-[#393a3b]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-primary-500" /> Vị trí hiện tại
            </span>
            <button
              type="button"
              onClick={handleOpenAddExperience}
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm kinh nghiệm</span>
            </button>
          </div>

          {currentPos ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold text-sm border border-primary-200/60 dark:border-primary-800/60 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                {currentPos}
              </span>
              {currentComp && (
                <span className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-medium text-sm border border-slate-200/60 dark:border-zinc-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                  {currentComp}
                </span>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Chưa có công việc hiện tại.</span> Cần thêm ít nhất 1 kinh nghiệm đang làm việc.
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAddExperience}
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm ngay</span>
              </button>
            </div>
          )}
        </div>

        {/* Danh sách kỹ năng chuyên môn */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Kỹ năng
          </label>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Chưa có kỹ năng.</p>
          )}
        </div>

        {/* Số năm kinh nghiệm & Bio Mentor */}
        <div className="grid grid-cols-1 gap-5 pt-2">
          <div className="w-full sm:max-w-xs">
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              Số năm kinh nghiệm <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="60"
              placeholder="VD: 3"
              value={yearsOfExperience === null || yearsOfExperience === undefined ? '' : yearsOfExperience}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseInt(e.target.value, 10)
                onYearsChange(val)
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1f2022] text-slate-800 dark:text-[#e4e6eb] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-500 transition-all text-sm"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              Giới thiệu bản thân
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Chia sẻ ngắn gọn về kinh nghiệm và điều bạn muốn hỗ trợ mọi người"
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1f2022] text-slate-800 dark:text-[#e4e6eb] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-500 transition-all text-sm resize-none"
            />
            <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
              <span>Tùy chọn</span>
              <span>{bio.length}/2000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thêm Kinh Nghiệm trực tiếp của User */}
      <ExperienceFormModal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        mode="create"
        experience={null}
        defaultPrimary={true}
        onSuccess={handleExperienceSuccess}
      />
    </div>
  )
}
