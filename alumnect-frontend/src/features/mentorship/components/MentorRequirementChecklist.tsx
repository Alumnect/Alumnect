import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, FileText, Building2, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Badge } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import type { MentorStatusResponse } from '../model/mentorStatusTypes'

interface MentorRequirementChecklistProps {
  status: MentorStatusResponse
}

/**
 * Component hiển thị danh sách checklist kiểm tra 4 điều kiện hồ sơ của Mentor (UC94).
 * Thiết kế tinh gọn, sạch sẽ, loại bỏ trùng lặp với thẻ Gói dịch vụ.
 */
export function MentorRequirementChecklist({ status }: MentorRequirementChecklistProps) {
  const { t, i18n } = useTranslation()
  const {
    profileComplete,
    missingProfileFields,
    hasCv,
    cvFileName,
    bankInformationComplete,
    bankName,
    maskedAccountNumber,
    bankAccountHolder,
    termsAccepted,
    currentTermsVersion,
    termsAcceptedAt,
  } = status

  // Lọc chỉ giữ lại các trường thuộc Hồ sơ năng lực & chuyên môn
  // (loại bỏ cvFileKey, payoutAccount, termsAccepted vì đã có các tiêu chí thẩm định riêng bên dưới)
  const professionalMissingFields = (missingProfileFields || []).filter(
    (field) => field !== 'cvFileKey' && field !== 'payoutAccount' && field !== 'termsAccepted'
  )
  const isProfileOnlyComplete = profileComplete || professionalMissingFields.length === 0

  const getMissingFieldLabel = (field: string) => {
    switch (field) {
      case 'currentPosition': return t('mentoring.fieldCurrentPosition')
      case 'workingMode': return t('mentoring.fieldWorkingMode')
      case 'mentoringType': return t('mentoring.fieldMentoringType')
      case 'supportedIndustries': return t('mentoring.fieldSupportedIndustries')
      default: return field
    }
  }

  // 4 tiêu chí thẩm định hồ sơ chuyên môn
  const items = [
    {
      id: 'profile',
      title: t('mentoring.reqProfileTitle'),
      isMet: isProfileOnlyComplete,
      icon: <UserCheck className="h-4.5 w-4.5 text-primary-solid" />,
      actionText: isProfileOnlyComplete ? t('mentoring.btnUpdate') : t('mentoring.btnAddMissing'),
      actionUrl: '/app/mentoring/become-mentor',
      content: isProfileOnlyComplete ? (
        <p className="text-xs font-medium text-success">
          {t('mentoring.reqProfileMet')}
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-medium text-danger">
            {t('mentoring.reqProfileMissingPrompt')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {professionalMissingFields && professionalMissingFields.length > 0 ? (
              professionalMissingFields.map((field, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-danger-soft border border-danger-border px-2 py-0.5 text-xs font-medium text-danger"
                >
                  {getMissingFieldLabel(field)}
                </span>
              ))
            ) : (
              <span className="text-xs text-text-subtle">{t('mentoring.notStartedProfile')}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'cv',
      title: t('mentoring.reqCvTitle'),
      isMet: hasCv,
      icon: <FileText className="h-4.5 w-4.5 text-warning" />,
      actionText: hasCv ? t('mentoring.btnUpdate') : t('mentoring.btnAddMissing'),
      actionUrl: '/app/mentoring/become-mentor',
      content: hasCv ? (
        <p className="text-xs font-medium text-success">
          {t('mentoring.reqCvMet', { filename: cvFileName || 'CV_Mentor.pdf' })}
        </p>
      ) : (
        <p className="text-xs font-medium text-danger">
          {t('mentoring.reqCvMissing')}
        </p>
      ),
    },
    {
      id: 'bank',
      title: t('mentoring.reqBankTitle'),
      isMet: bankInformationComplete,
      icon: <Building2 className="h-4.5 w-4.5 text-aqua-600 dark:text-aqua-400" />,
      actionText: bankInformationComplete ? t('mentoring.btnUpdate') : t('mentoring.btnAddMissing'),
      actionUrl: '/app/mentoring/become-mentor',
      content: bankInformationComplete ? (
        <p className="text-xs font-medium text-success">
          {t('mentoring.reqBankMet', {
            bank: bankName,
            maskedAccount: maskedAccountNumber,
            holder: bankAccountHolder,
          })}
        </p>
      ) : (
        <p className="text-xs font-medium text-danger">
          {t('mentoring.reqBankMissing')}
        </p>
      ),
    },
    {
      id: 'terms',
      title: t('mentoring.reqTermsTitle'),
      isMet: termsAccepted,
      icon: <ShieldCheck className="h-4.5 w-4.5 text-primary-solid" />,
      actionText: t('mentoring.btnReview'),
      actionUrl: '/app/mentoring/terms',
      content: termsAccepted ? (
        <p className="text-xs font-medium text-success">
          {t('mentoring.reqTermsMet', { version: currentTermsVersion })}
          {termsAcceptedAt && ` (${new Date(termsAcceptedAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN')})`}.
        </p>
      ) : (
        <p className="text-xs font-medium text-danger">
          {t('mentoring.reqTermsMissing')}
        </p>
      ),
    },
  ]

  const completedCount = items.filter((i) => i.isMet).length

  return (
    <Card hover={false} className="p-5 sm:p-7 border border-border bg-surface space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-text">
            {t('mentoring.requirementsTitle')}
          </h2>
          <p className="text-xs text-text-subtle dark:text-text-subtle mt-0.5">
            {t('mentoring.requirementsDesc')}
          </p>
        </div>
        <Badge tone={completedCount === 4 ? 'success' : 'brand'} className="self-start sm:self-auto text-xs">
          {t('mentoring.requirementsCompletedBadge', { completed: completedCount, total: 4 })}
        </Badge>
      </div>

      <div className="divide-y divide-plum-900/10 dark:divide-border">
        {items.map((item) => (
          <div key={item.id} className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 dark:bg-white/[0.05]">
                {item.icon}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-text">
                    {item.title}
                  </h3>
                  {item.isMet ? (
                    <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />} className="text-xs py-0 px-1.5">
                      {t('mentoring.criteriaMet')}
                    </Badge>
                  ) : (
                    <Badge tone="danger" icon={<XCircle className="h-3 w-3" />} className="text-xs py-0 px-1.5">
                      {t('mentoring.criteriaNotMet')}
                    </Badge>
                  )}
                </div>
                {item.content}
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <ButtonLink
                to={item.actionUrl}
                variant={item.isMet ? 'outline' : 'primary'}
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                className="text-xs h-8 px-3"
              >
                {item.actionText}
              </ButtonLink>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

