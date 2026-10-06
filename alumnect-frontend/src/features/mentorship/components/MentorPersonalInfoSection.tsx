import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Phone, GraduationCap, Building2, ExternalLink, ShieldCheck, Lock, ChevronDown, Check } from 'lucide-react'
import type { PersonalInfo } from '../model/mentorRegistrationTypes'

interface Props {
  personalInfo?: PersonalInfo
  fullName: string
  phone: string
  campus: string
  graduationYear: number | null
  onFullNameChange: (val: string) => void
  onPhoneChange: (val: string) => void
  onCampusChange: (val: string) => void
  onGraduationYearChange: (val: number | null) => void
}

const FPT_CAMPUSES = [
  'FPT University Đà Nẵng',
  'FPT University Hà Nội (Hòa Lạc)',
  'FPT University TP. Hồ Chí Minh',
  'FPT University Cần Thơ',
  'FPT University Quy Nhơn',
].map((name) => ({ value: name, label: name }))

export const MentorPersonalInfoSection: React.FC<Props> = ({
  personalInfo,
  fullName,
  phone,
  campus,
  graduationYear,
  onFullNameChange,
  onPhoneChange,
  onCampusChange,
  onGraduationYearChange,
}) => {
  const [isCampusOpen, setIsCampusOpen] = useState(false)
  const campusRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (campusRef.current && !campusRef.current.contains(event.target as Node)) {
        setIsCampusOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const campusOptions =
    campus && !FPT_CAMPUSES.some((c) => c.value === campus)
      ? [...FPT_CAMPUSES, { value: campus, label: campus }]
      : FPT_CAMPUSES
  const selectedCampus = campusOptions.find((c) => c.value === campus)

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#393a3b] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#f27024] dark:text-orange-400 flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-[#f0f2f5] text-lg">Thông tin cá nhân</h3>
            <p className="text-xs text-slate-500 dark:text-[#b0b3b8]">Chỉnh sửa trực tiếp thông tin của bạn ngay tại đây</p>
          </div>
        </div>
        <Link
          to="/app/profile"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-[#b0b3b8] hover:text-[#f27024] dark:hover:text-[#f27024] bg-slate-50 dark:bg-[#3a3b3c] hover:bg-orange-50 dark:hover:bg-orange-950/40 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-[#4e4f50] transition-colors"
        >
          <span>Xem Profile</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="relative group shrink-0 self-center sm:self-start">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#18191a] border-2 border-orange-100 dark:border-orange-900/40 shadow-inner flex items-center justify-center">
            {personalInfo?.avatarUrl ? (
              <img
                src={personalInfo.avatarUrl}
                alt={fullName || 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-slate-400" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-sm" title="Hồ sơ sinh viên/cựu sinh viên FPT">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1 w-full text-sm">
          {/* Họ và tên */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#f27024]" />
              <span>Họ và tên</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder="Nhập họ và tên..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#4e4f50] bg-white dark:bg-[#18191a] text-slate-800 dark:text-[#f0f2f5] text-sm focus:outline-none focus:ring-2 focus:ring-[#f27024]/20 focus:border-[#f27024] transition-all placeholder:text-slate-400 dark:placeholder:text-[#8a8d91] h-[42px]"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email</span>
              <Lock className="w-3 h-3 text-slate-400 ml-auto" />
            </span>
            <div
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a]/60 text-slate-600 dark:text-[#b0b3b8] text-sm truncate font-medium flex items-center h-[42px]"
              title={personalInfo?.email}
            >
              {personalInfo?.email || '—'}
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#f27024]" />
              <span>Số điện thoại</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="Nhập số điện thoại..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#4e4f50] bg-white dark:bg-[#18191a] text-slate-800 dark:text-[#f0f2f5] text-sm focus:outline-none focus:ring-2 focus:ring-[#f27024]/20 focus:border-[#f27024] transition-all placeholder:text-slate-400 dark:placeholder:text-[#8a8d91] h-[42px]"
            />
          </div>

          {/* Cơ sở đào tạo (dropdown tùy biến) */}
          <div ref={campusRef} className="relative flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#f27024]" />
              <span>Cơ sở đào tạo</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCampusOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all cursor-pointer h-[42px] dark:bg-[#18191a] ${
                isCampusOpen
                  ? 'border-[#f27024] bg-white ring-2 ring-[#f27024]/15 dark:border-[#f27024]'
                  : 'border-slate-200 dark:border-[#4e4f50] bg-white hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <span className={`font-medium truncate ${selectedCampus ? 'text-slate-800 dark:text-[#f0f2f5]' : 'text-slate-400 dark:text-[#8a8d91]'}`}>
                {selectedCampus ? selectedCampus.label : 'Chọn cơ sở...'}
              </span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                  isCampusOpen ? 'rotate-180 text-[#f27024]' : ''
                }`}
              />
            </button>

            {isCampusOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#393a3b] shadow-xl overflow-hidden p-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                {campusOptions.map((c) => {
                  const isSelected = c.value === campus
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        onCampusChange(c.value)
                        setIsCampusOpen(false)
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#fff4ec] dark:bg-orange-950/40 text-[#d45105] dark:text-orange-300 font-semibold'
                          : 'text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-50 dark:hover:bg-[#3a3b3c]'
                      }`}
                    >
                      <span className="truncate">{c.label}</span>
                      {isSelected && <Check className="w-4 h-4 shrink-0 text-[#f27024]" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Năm tốt nghiệp */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#f27024]" />
              <span>Năm tốt nghiệp</span>
            </label>
            <input
              type="number"
              min={2006}
              max={2035}
              value={graduationYear ?? ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null
                onGraduationYearChange(val)
              }}
              placeholder="VD: 2024"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#4e4f50] bg-white dark:bg-[#18191a] text-slate-800 dark:text-[#f0f2f5] text-sm focus:outline-none focus:ring-2 focus:ring-[#f27024]/20 focus:border-[#f27024] transition-all placeholder:text-slate-400 dark:placeholder:text-[#8a8d91] h-[42px]"
            />
          </div>

          {/* Chuyên ngành & Mã SV */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Chuyên ngành & Mã SV</span>
            </span>
            <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a]/60 text-slate-700 dark:text-[#f0f2f5] text-xs font-medium flex items-center justify-between h-[42px]">
              <span className="font-semibold truncate">
                {personalInfo?.majorName || 'Chưa cập nhật'}
              </span>
              {personalInfo?.studentCode && (
                <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb] font-mono text-[11px]">
                  {personalInfo.studentCode}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
