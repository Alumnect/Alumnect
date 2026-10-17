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
      icon: <UserCheck className="h-4.5 w-4.5 text-primary-solid" />,
      actionText: isProfileOnlyComplete ? 'Cập nhật' : 'Bổ sung',
      actionUrl: '/app/mentoring/become-mentor',
      content: isProfileOnlyComplete ? (
        <p className="text-xs font-medium text-success">
          ✓ Đã hoàn thiện thông tin chuyên môn, kinh nghiệm và lĩnh vực hỗ trợ.
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-medium text-danger">
            Cần bổ sung các thông tin:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {professionalMissingFields && professionalMissingFields.length > 0 ? (
              professionalMissingFields.map((field, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-danger-soft border border-danger-border px-2 py-0.5 text-xs font-medium text-danger"
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
              <span className="text-xs text-text-subtle">Chưa bắt đầu điền hồ sơ</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'cv',
      title: 'Tệp hồ sơ CV ứng tuyển',
      isMet: hasCv,
      icon: <FileText className="h-4.5 w-4.5 text-warning" />,
      actionText: hasCv ? 'Cập nhật' : 'Bổ sung',
      actionUrl: '/app/mentoring/become-mentor',
      content: hasCv ? (
        <p className="text-xs font-medium text-success">
          ✓ Đã đính kèm tệp CV: <span className="font-semibold">{cvFileName || 'CV_Mentor.pdf'}</span>
        </p>
      ) : (
        <p className="text-xs font-medium text-danger">
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
        <p className="text-xs font-medium text-success">
          ✓ {bankName} • {maskedAccountNumber} <span className="text-text-subtle font-normal">({bankAccountHolder})</span>
        </p>
      ) : (
        <p className="text-xs font-medium text-danger">
          ✕ Chưa cập nhật thông tin ngân hàng để nhận thù lao khi hoàn thành thỏa thuận.
        </p>
      ),
    },
    {
      id: 'terms',
      title: 'Điều khoản Hướng dẫn & Hỗ trợ',
      isMet: termsAccepted,
      icon: <ShieldCheck className="h-4.5 w-4.5 text-primary-solid" />,
      actionText: 'Xem lại',
      actionUrl: '/app/mentoring/terms',
      content: termsAccepted ? (
        <p className="text-xs font-medium text-success">
          ✓ Đã chấp thuận phiên bản {currentTermsVersion}
          {termsAcceptedAt && ` (${new Date(termsAcceptedAt).toLocaleDateString('vi-VN')})`}.
        </p>
      ) : (
        <p className="text-xs font-medium text-danger">
          ✕ Chưa xác nhận đồng ý với Quy tắc ứng xử và Điều khoản Mentor hiện hành.
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
            Điều kiện hồ sơ Mentor
          </h2>
          <p className="text-xs text-text-subtle dark:text-text-subtle mt-0.5">
            Các tiêu chuẩn thẩm định chuyên môn và cam kết đạo đức nghề nghiệp
          </p>
        </div>
        <Badge tone={completedCount === 4 ? 'success' : 'brand'} className="self-start sm:self-auto text-xs">
          Hoàn thành {completedCount}/4 điều kiện
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
                      Đạt
                    </Badge>
                  ) : (
                    <Badge tone="danger" icon={<XCircle className="h-3 w-3" />} className="text-xs py-0 px-1.5">
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
