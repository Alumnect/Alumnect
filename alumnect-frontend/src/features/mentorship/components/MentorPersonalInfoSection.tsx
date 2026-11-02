import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Mail, Phone, GraduationCap, Building2, ExternalLink } from 'lucide-react'
import type { PersonalInfo } from '../model/mentorRegistrationTypes'

interface Props {
  personalInfo?: PersonalInfo
}

export const MentorPersonalInfoSection: React.FC<Props> = ({ personalInfo }) => {
  const { t } = useTranslation()

  return (
    <div className="bg-surface rounded-2xl border border-cream-300/80 dark:border-border p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border dark:border-border mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-solid flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h3 className="font-semibold text-text text-lg">{t('mentoring.personalInfoStepTitle')}</h3>
            <p className="text-xs text-text-subtle">
              {t('mentoring.syncFromProfileDesc')}
            </p>
          </div>
        </div>

        <Link
          to="/app/profile"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-solid hover:text-primary-solid bg-primary-soft hover:bg-primary-soft px-3.5 py-2 rounded-xl border border-primary-soft-border transition-colors"
        >
          <span>{t('mentoring.editInProfileBtn')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="relative shrink-0 self-center sm:self-start">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-3 dark:bg-bg border-2 border-primary-soft-border shadow-sm flex items-center justify-center">
            {personalInfo?.avatarUrl ? (
              <img
                src={personalInfo.avatarUrl}
                alt={personalInfo.fullName || 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-text-subtle" />
            )}
          </div>
        </div>

        {/* Read-Only Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 flex-1 w-full text-xs">
          {/* Họ và tên */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-bg/60 border border-cream-300/60 dark:border-border">
            <span className="text-xs font-semibold text-text-subtle dark:text-text-subtle flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-primary-solid" />
              <span>{t('mentoring.fullName')}</span>
            </span>
            <div className="text-sm font-bold text-text truncate">
              {personalInfo?.fullName || '—'}
            </div>
          </div>

          {/* Email */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-bg/60 border border-cream-300/60 dark:border-border">
            <span className="text-xs font-semibold text-text-subtle dark:text-text-subtle flex items-center gap-1.5 mb-1.5">
              <Mail className="w-3.5 h-3.5 text-text-subtle" />
              <span>{t('mentoring.contactEmail')}</span>
            </span>
            <div className="text-sm font-semibold text-text-muted truncate" title={personalInfo?.email}>
              {personalInfo?.email || '—'}
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-bg/60 border border-cream-300/60 dark:border-border">
            <span className="text-xs font-semibold text-text-subtle dark:text-text-subtle flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3.5 h-3.5 text-primary-solid" />
              <span>{t('mentoring.phoneNumber')}</span>
            </span>
            <div className="text-sm font-semibold text-text truncate">
              {personalInfo?.phone || <span className="text-text-subtle dark:text-text-subtle font-normal italic">{t('mentoring.notUpdated')}</span>}
            </div>
          </div>

          {/* Cơ sở đào tạo */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-bg/60 border border-cream-300/60 dark:border-border">
            <span className="text-xs font-semibold text-text-subtle dark:text-text-subtle flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary-solid" />
              <span>{t('mentoring.campus')}</span>
            </span>
            <div className="text-sm font-semibold text-text truncate">
              {personalInfo?.campus || <span className="text-text-subtle dark:text-text-subtle font-normal italic">{t('mentoring.notUpdated')}</span>}
            </div>
          </div>

          {/* Chuyên ngành & Mã SV */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-bg/60 border border-cream-300/60 dark:border-border">
            <span className="text-xs font-semibold text-text-subtle dark:text-text-subtle flex items-center gap-1.5 mb-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary-solid" />
              <span>{t('mentoring.majorAndStudentCode')}</span>
            </span>
            <div className="text-sm font-semibold text-text flex items-center justify-between gap-2">
              <span className="truncate">{personalInfo?.majorName || t('mentoring.notUpdated')}</span>
              {personalInfo?.studentCode && (
                <span className="px-1.5 py-0.5 rounded bg-cream-300/70 dark:bg-surface-2 text-text-muted font-mono text-xs shrink-0">
                  {personalInfo.studentCode}
                </span>
              )}
            </div>
          </div>

          {/* Năm tốt nghiệp */}
          <div className="p-3.5 rounded-xl bg-cream-100/80 dark:bg-bg/60 border border-cream-300/60 dark:border-border">
            <span className="text-xs font-semibold text-text-subtle dark:text-text-subtle flex items-center gap-1.5 mb-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-text-subtle" />
              <span>{t('mentoring.graduationYear')}</span>
            </span>
            <div className="text-sm font-semibold text-text truncate">
              {personalInfo?.graduationYear || <span className="text-text-subtle dark:text-text-subtle font-normal italic">{t('mentoring.notUpdated')}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
