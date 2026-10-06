import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, FileText, Building2, UserCheck } from 'lucide-react'
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

  // 4 tiêu chí thẩm định hồ sơ chuyên môn
  const items = [
    {
      id: 'profile',
      title: 'Hồ sơ năng lực & chuyên môn',
      isMet: isProfileOnlyComplete,
      icon: <UserCheck className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />,
      actionText: isProfileOnlyComplete ? 'Cập nhật' : 'Bổ sung',
      actionUrl: '/app/mentoring/become-mentor',
      content: isProfileOnlyComplete ? (
        <p className="text-xs font-medium text-mint-700 dark:text-mint-400">
          ✓ Đã hoàn thiện thông tin chuyên môn, kinh nghiệm và lĩnh vực hỗ trợ.
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-medium text-coral-700 dark:text-coral-400">
            Cần bổ sung các thông tin:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {professionalMissingFields && professionalMissingFields.length > 0 ? (
              professionalMissingFields.map((field, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-coral-50 border border-coral-200/60 px-2 py-0.5 text-[11px] font-medium text-coral-700 dark:bg-coral-950/40 dark:border-coral-800/50 dark:text-coral-300"
                >
                  {field === 'currentPosition'
                    ? 'Vị trí công việc'
                    : field === 'workingMode'
                    ? 'Hình thức hướng dẫn'
                    : field === 'mentoringType'
                    ? 'Loại hình Mentor'
                    : field === 'supportedIndustries'
                    ? 'Lĩnh vực hỗ trợ'
                    : field}
                </span>
              ))
            ) : (
              <span className="text-xs text-plum-500">Chưa bắt đầu điền hồ sơ</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'cv',
      title: 'Tệp hồ sơ CV ứng tuyển',
      isMet: hasCv,
      icon: <FileText className="h-4.5 w-4.5 text-gold-600 dark:text-gold-400" />,
      actionText: hasCv ? 'Cập nhật' : 'Bổ sung',
      actionUrl: '/app/mentoring/become-mentor',
      content: hasCv ? (
        <p className="text-xs font-medium text-mint-700 dark:text-mint-400">
          ✓ Đã đính kèm tệp CV: <span className="font-semibold">{cvFileName || 'CV_Mentor.pdf'}</span>
        </p>
      ) : (
        <p className="text-xs font-medium text-coral-700 dark:text-coral-400">
          ✕ Chưa có tệp CV, vui lòng tải tệp lên.
        </p>
      ),
    },
    {
      id: 'bank',
      title: 'Tài khoản ngân hàng nhận thù lao',
      isMet: bankInformationComplete,
      icon: <Building2 className="h-4.5 w-4.5 text-aqua-600 dark:text-aqua-400" />,
      actionText: bankInformationComplete ? 'Cập nhật' : 'Bổ sung',
      actionUrl: '/app/mentoring/become-mentor',
      content: bankInformationComplete ? (
        <p className="text-xs font-medium text-mint-700 dark:text-mint-400">
          ✓ {bankName} • {maskedAccountNumber} <span className="text-plum-500 font-normal">({bankAccountHolder})</span>
        </p>
      ) : (
        <p className="text-xs font-medium text-coral-700 dark:text-coral-400">
          ✕ Chưa cập nhật thông tin ngân hàng để nhận thù lao khi hoàn thành thỏa thuận.
        </p>
      ),
    },
    {
      id: 'terms',
      title: 'Điều khoản Hướng dẫn & Hỗ trợ',
      isMet: termsAccepted,
      icon: <ShieldCheck className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />,
      actionText: 'Xem lại',
      actionUrl: '/app/mentoring/terms',
      content: termsAccepted ? (
        <p className="text-xs font-medium text-mint-700 dark:text-mint-400">
          ✓ Đã chấp thuận phiên bản {currentTermsVersion}
          {termsAcceptedAt && ` (${new Date(termsAcceptedAt).toLocaleDateString('vi-VN')})`}.
        </p>
      ) : (
        <p className="text-xs font-medium text-coral-700 dark:text-coral-400">
          ✕ Chưa xác nhận đồng ý với Quy tắc ứng xử và Điều khoản Mentor hiện hành.
        </p>
      ),
    },
  ]

  const completedCount = items.filter((i) => i.isMet).length

  return (
    <Card hover={false} className="p-5 sm:p-7 border border-plum-900/10 bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-plum-900/10 pb-4 dark:border-[#393a3b]">
        <div>
          <h2 className="font-heading text-base sm:text-lg font-bold text-plum-900 dark:text-[#e4e6eb]">
            Điều Kiện Hồ Sơ Mentor
          </h2>
          <p className="text-xs text-plum-500 dark:text-[#8a8d91] mt-0.5">
            Các tiêu chuẩn thẩm định chuyên môn và cam kết đạo đức nghề nghiệp
          </p>
        </div>
        <Badge tone={completedCount === 4 ? 'success' : 'brand'} className="self-start sm:self-auto text-xs">
          Hoàn thành {completedCount}/4 điều kiện
        </Badge>
      </div>

      <div className="divide-y divide-plum-900/10 dark:divide-[#393a3b]">
        {items.map((item) => (
          <div key={item.id} className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-plum-900/[0.04] dark:bg-white/[0.05]">
                {item.icon}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-bold text-plum-900 dark:text-[#e4e6eb]">
                    {item.title}
                  </h3>
                  {item.isMet ? (
                    <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />} className="text-[10px] py-0 px-1.5">
                      Đạt
                    </Badge>
                  ) : (
                    <Badge tone="danger" icon={<XCircle className="h-3 w-3" />} className="text-[10px] py-0 px-1.5">
                      Chưa đạt
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
