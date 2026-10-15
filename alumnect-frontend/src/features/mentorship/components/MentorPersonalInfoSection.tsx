import React from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Phone, GraduationCap, Building2, ExternalLink } from 'lucide-react'
import type { PersonalInfo } from '../model/mentorRegistrationTypes'

interface Props {
  personalInfo?: PersonalInfo
}

export const MentorPersonalInfoSection: React.FC<Props> = ({ personalInfo }) => {
  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl border border-cream-300/80 dark:border-[#393a3b] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-200 dark:border-[#393a3b] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-700/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h3 className="font-semibold text-plum-800 dark:text-[#f0f2f5] text-lg">Thông tin cá nhân</h3>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
              Đồng bộ tự động từ hồ sơ cá nhân của bạn
            </p>
          </div>
        </div>

        <Link
          to="/app/profile"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-700/40 hover:bg-brand-100 dark:hover:bg-brand-700/50 px-3.5 py-2 rounded-xl border border-brand-200/60 dark:border-brand-700/60 transition-colors"
        >
          <span>Chỉnh sửa tại hồ sơ</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="relative shrink-0 self-center sm:self-start">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-cream-200 dark:bg-[#18191a] border-2 border-brand-200/60 dark:border-brand-700/40 shadow-sm flex items-center justify-center">
            {personalInfo?.avatarUrl ? (
              <img
                src={personalInfo.avatarUrl}
                alt={personalInfo.fullName || 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-plum-400" />
            )}
          </div>
        </div>

        {/* Read-Only Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 flex-1 w-full text-xs">
          {/* Họ và tên */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-[#18191a]/60 border border-cream-300/60 dark:border-[#393a3b]">
            <span className="text-[11px] font-semibold text-plum-500 dark:text-[#8a8d91] flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-brand-600" />
              <span>Họ và tên</span>
            </span>
            <div className="text-sm font-bold text-plum-800 dark:text-[#f0f2f5] truncate">
              {personalInfo?.fullName || '—'}
            </div>
          </div>

          {/* Email */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-[#18191a]/60 border border-cream-300/60 dark:border-[#393a3b]">
            <span className="text-[11px] font-semibold text-plum-500 dark:text-[#8a8d91] flex items-center gap-1.5 mb-1.5">
              <Mail className="w-3.5 h-3.5 text-plum-400" />
              <span>Email liên hệ</span>
            </span>
            <div className="text-sm font-semibold text-plum-700 dark:text-[#e4e6eb] truncate" title={personalInfo?.email}>
              {personalInfo?.email || '—'}
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-[#18191a]/60 border border-cream-300/60 dark:border-[#393a3b]">
            <span className="text-[11px] font-semibold text-plum-500 dark:text-[#8a8d91] flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-600" />
              <span>Số điện thoại</span>
            </span>
            <div className="text-sm font-semibold text-plum-800 dark:text-[#f0f2f5] truncate">
              {personalInfo?.phone || <span className="text-plum-400 dark:text-[#8a8d91] font-normal italic">Chưa cập nhật</span>}
            </div>
          </div>

          {/* Cơ sở đào tạo */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-[#18191a]/60 border border-cream-300/60 dark:border-[#393a3b]">
            <span className="text-[11px] font-semibold text-plum-500 dark:text-[#8a8d91] flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Cơ sở đào tạo</span>
            </span>
            <div className="text-sm font-semibold text-plum-800 dark:text-[#f0f2f5] truncate">
              {personalInfo?.campus || <span className="text-plum-400 dark:text-[#8a8d91] font-normal italic">Chưa cập nhật</span>}
            </div>
          </div>

          {/* Chuyên ngành & Mã SV */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-[#18191a]/60 border border-cream-300/60 dark:border-[#393a3b]">
            <span className="text-[11px] font-semibold text-plum-500 dark:text-[#8a8d91] flex items-center gap-1.5 mb-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
              <span>Chuyên ngành & Mã SV</span>
            </span>
            <div className="text-sm font-semibold text-plum-800 dark:text-[#f0f2f5] flex items-center justify-between gap-2">
              <span className="truncate">{personalInfo?.majorName || 'Chưa cập nhật'}</span>
              {personalInfo?.studentCode && (
                <span className="px-1.5 py-0.5 rounded bg-cream-300/70 dark:bg-[#3a3b3c] text-plum-700 dark:text-[#e4e6eb] font-mono text-[11px] shrink-0">
                  {personalInfo.studentCode}
                </span>
              )}
            </div>
          </div>

          {/* Năm tốt nghiệp */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-[#18191a]/60 border border-cream-300/60 dark:border-[#393a3b]">
            <span className="text-[11px] font-semibold text-plum-500 dark:text-[#8a8d91] flex items-center gap-1.5 mb-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-plum-400" />
              <span>Năm tốt nghiệp</span>
            </span>
            <div className="text-sm font-semibold text-plum-800 dark:text-[#f0f2f5] truncate">
              {personalInfo?.graduationYear || <span className="text-plum-400 dark:text-[#8a8d91] font-normal italic">Chưa cập nhật</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
