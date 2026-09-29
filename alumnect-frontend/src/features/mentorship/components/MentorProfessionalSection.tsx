import React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Building, Sparkles, ExternalLink, AlertCircle } from 'lucide-react'
import type { ProfessionalInfo } from '../model/mentorRegistrationTypes'

interface Props {
  professionalInfo?: ProfessionalInfo
  yearsOfExperience: number | '' | null
  bio: string
  onYearsChange: (val: number | null) => void
  onBioChange: (val: string) => void
}

export const MentorProfessionalSection: React.FC<Props> = ({
  professionalInfo,
  yearsOfExperience,
  bio,
  onYearsChange,
  onBioChange,
}) => {
  const currentPos = professionalInfo?.reusedFromProfile?.currentPosition
  const currentComp = professionalInfo?.reusedFromProfile?.currentCompany
  const skills = professionalInfo?.reusedFromProfile?.skills || []

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          2
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Thông tin chuyên môn & Kinh nghiệm</h3>
          <p className="text-xs text-slate-500">Chức danh và kỹ năng được tái sử dụng trực tiếp từ hồ sơ kinh nghiệm</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Vị trí & Công ty hiện tại (Tái sử dụng trực tiếp từ Experience) */}
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-primary-500" /> Vị trí công tác hiện tại (Từ Hồ sơ)
            </span>
            <Link
              to="/app/profile"
              target="_blank"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              <span>Thêm kinh nghiệm</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {currentPos ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-lg bg-primary-50 text-primary-700 font-semibold text-sm border border-primary-200/60 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                {currentPos}
              </span>
              {currentComp && (
                <span className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-sm border border-slate-200/60 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {currentComp}
                </span>
              )}
            </div>
          ) : (
            <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-lg flex items-start gap-2.5 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Chưa có kinh nghiệm hiện tại:</span> Bạn chưa đánh dấu công việc hiện tại trong phần Kinh nghiệm làm việc. Để hoàn tất đăng ký Mentor, bạn cần có ít nhất 1 kinh nghiệm làm việc đang công tác.
              </div>
            </div>
          )}
        </div>

        {/* Danh sách kỹ năng chuyên môn */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Kỹ năng chuyên môn nổi bật
          </label>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Chưa cập nhật kỹ năng trên trang cá nhân.</p>
          )}
        </div>

        {/* Số năm kinh nghiệm & Bio Mentor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-500 transition-all text-sm"
            />
            <span className="text-xs text-slate-400 mt-1 block">Tổng số năm làm việc trong lĩnh vực</span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Thông điệp / Định hướng cố vấn (Bio)
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Chia sẻ lý do và định hướng bạn muốn hỗ trợ các bạn sinh viên..."
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-500 transition-all text-sm resize-none"
            />
            <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
              <span>Tùy chọn, tối đa 2000 ký tự</span>
              <span>{bio.length}/2000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
