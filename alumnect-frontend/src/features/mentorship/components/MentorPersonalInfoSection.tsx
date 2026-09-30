import React from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Phone, GraduationCap, Building2, ExternalLink, ShieldCheck, Lock } from 'lucide-react'
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
  'FPT University Hà Nội',
  'FPT University TP. Hồ Chí Minh',
  'FPT University Cần Thơ',
  'FPT University Quy Nhơn',
]

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
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f27024] flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Thông tin cá nhân cơ bản</h3>
            <p className="text-xs text-slate-500">Chỉnh sửa trực tiếp thông tin của bạn ngay tại đây</p>
          </div>
        </div>
        <Link
          to="/app/profile"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#f27024] bg-slate-50 hover:bg-orange-50 px-3 py-1.5 rounded-lg border border-slate-200/60 transition-colors"
        >
          <span>Xem Profile</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="relative group shrink-0 self-center sm:self-start">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-orange-100 shadow-inner flex items-center justify-center">
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

        {/* Editable Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1 w-full text-sm">
          {/* Họ và tên */}
          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 focus-within:border-[#f27024] focus-within:bg-white transition-all">
            <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-[#f27024]" /> Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder="Nhập họ và tên..."
              className="w-full bg-transparent font-medium text-slate-800 text-sm focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/50">
            <span className="text-xs font-medium text-slate-500 block mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" /> Email (Tài khoản)
              <Lock className="w-3 h-3 text-slate-400 ml-auto" />
            </span>
            <span className="font-medium text-slate-700 truncate block text-sm" title={personalInfo?.email}>
              {personalInfo?.email || '—'}
            </span>
          </div>

          {/* Số điện thoại */}
          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 focus-within:border-[#f27024] focus-within:bg-white transition-all">
            <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#f27024]" /> Số điện thoại
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="Nhập số điện thoại..."
              className="w-full bg-transparent font-medium text-slate-800 text-sm focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Cơ sở đào tạo (FPT Campus) */}
          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 focus-within:border-[#f27024] focus-within:bg-white transition-all">
            <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#f27024]" /> Cơ sở đào tạo
            </label>
            <select
              value={campus}
              onChange={(e) => onCampusChange(e.target.value)}
              className="w-full bg-transparent font-medium text-slate-800 text-sm focus:outline-none cursor-pointer"
            >
              <option value="">Chọn cơ sở...</option>
              {FPT_CAMPUSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {campus && !FPT_CAMPUSES.includes(campus) && (
                <option value={campus}>{campus}</option>
              )}
            </select>
          </div>

          {/* Năm tốt nghiệp */}
          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 focus-within:border-[#f27024] focus-within:bg-white transition-all">
            <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-[#f27024]" /> Năm tốt nghiệp
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
              className="w-full bg-transparent font-medium text-slate-800 text-sm focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Chuyên ngành & Mã SV */}
          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/50">
            <span className="text-xs font-medium text-slate-500 block mb-1 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-slate-400" /> Chuyên ngành & Mã SV
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 truncate">
                {personalInfo?.majorName || 'Chưa cập nhật'}
              </span>
              {personalInfo?.studentCode && (
                <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono text-[11px]">
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
