import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, FileText, Building2, UserCheck, CreditCard } from 'lucide-react'
import { Card, Badge } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import type { MentorStatusResponse } from '../model/mentorStatusTypes'

interface MentorRequirementChecklistProps {
  status: MentorStatusResponse
}

/**
 * Component hiển thị danh sách checklist kiểm tra 5 điều kiện tiên quyết của Mentor (UC94).
 * Giúp người dùng dễ dàng nhận biết điều kiện nào đã đạt và điều kiện nào cần bổ sung.
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
    hasSubscription,
    subscriptionStatus,
    packageName,
    active,
    mentorStatus,
  } = status

  // Danh sách 5 tiêu chí thẩm định theo chuẩn kiến trúc
  const items = [
    {
      id: 'profile',
      title: '1. Hồ sơ năng lực & kinh nghiệm cố vấn',
      description: 'Cung cấp đầy đủ vị trí công việc hiện tại, số năm kinh nghiệm, hình thức và lĩnh vực hỗ trợ.',
      isMet: profileComplete,
      icon: <UserCheck className="h-5 w-5 text-brand-600" />,
      actionText: profileComplete ? 'Xem lại hồ sơ' : 'Bổ sung thông tin',
      actionUrl: '/app/mentoring/become-mentor',
      details: (
        <div className="mt-2 space-y-1.5 text-xs text-plum-600 dark:text-[#b0b3b8]">
          {profileComplete ? (
            <p className="text-mint-700 font-medium dark:text-mint-400">
              ✓ Hồ sơ cá nhân và kinh nghiệm chuyên môn đã được cung cấp đầy đủ.
            </p>
          ) : (
            <div>
              <p className="text-coral-700 font-medium dark:text-coral-400">
                Các phần dữ liệu cần bổ sung:
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {missingProfileFields && missingProfileFields.length > 0 ? (
                  missingProfileFields.map((field, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-coral-50 border border-coral-200/60 px-2 py-0.5 text-[11px] font-medium text-coral-700 dark:bg-coral-950/40 dark:border-coral-800/50 dark:text-coral-300"
                    >
                      {field === 'currentPosition'
                        ? 'Vị trí công việc'
                        : field === 'yearsOfExperience'
                        ? 'Số năm kinh nghiệm'
                        : field === 'workingMode'
                        ? 'Hình thức hướng dẫn'
                        : field === 'mentoringType'
                        ? 'Loại hình cố vấn'
                        : field === 'supportedIndustries'
                        ? 'Lĩnh vực hỗ trợ'
                        : field === 'cvFileKey'
                        ? 'Tệp CV'
                        : field === 'payoutAccount'
                        ? 'Tài khoản ngân hàng'
                        : field === 'termsAccepted'
                        ? 'Điều khoản Hướng dẫn & Hỗ trợ'
                        : field}
                    </span>
                  ))
                ) : (
                  <span className="text-plum-500">Chưa bắt đầu điền hồ sơ</span>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'cv',
      title: '2. Tệp hồ sơ CV ứng tuyển',
      description: 'Tải lên tệp CV chuyên môn để xác thực năng lực làm việc trong ngành.',
      isMet: hasCv,
      icon: <FileText className="h-5 w-5 text-gold-600" />,
      actionText: hasCv ? 'Cập nhật CV mới' : 'Tải lên CV ngay',
      actionUrl: '/app/mentoring/become-mentor',
      details: (
        <div className="mt-2 text-xs text-plum-600 dark:text-[#b0b3b8]">
          {hasCv ? (
            <p className="text-mint-700 font-medium dark:text-mint-400">
              ✓ Đã đính kèm tệp CV: <span className="font-semibold">{cvFileName || 'CV_Mentor.pdf'}</span>
            </p>
          ) : (
            <p className="text-coral-700 font-medium dark:text-coral-400">
              ✕ Chưa có tệp CV được tải lên. Vui lòng đính kèm CV định dạng PDF.
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'bank',
      title: '3. Tài khoản ngân hàng nhận thù lao (Payout Account)',
      description: 'Khai báo thông tin tài khoản ngân hàng chính chủ để hệ thống tự động giải ngân chi trả.',
      isMet: bankInformationComplete,
      icon: <Building2 className="h-5 w-5 text-aqua-600" />,
      actionText: bankInformationComplete ? 'Thay đổi thông tin' : 'Thiết lập tài khoản',
      actionUrl: '/app/mentoring/become-mentor',
      details: (
        <div className="mt-2 text-xs text-plum-600 dark:text-[#b0b3b8]">
          {bankInformationComplete ? (
            <div className="rounded-xl border border-plum-900/10 bg-plum-900/[0.02] p-2.5 dark:bg-[#18191a] dark:border-[#393a3b]">
              <p className="font-medium text-plum-900 dark:text-[#e4e6eb]">
                {bankName} • {maskedAccountNumber}
              </p>
              <p className="text-[11px] text-plum-500">Chủ tài khoản: {bankAccountHolder}</p>
            </div>
          ) : (
            <p className="text-coral-700 font-medium dark:text-coral-400">
              ✕ Chưa cập nhật đầy đủ tên ngân hàng, số tài khoản hoặc tên chủ tài khoản.
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'terms',
      title: '4. Điều khoản Hướng dẫn & Hỗ trợ',
      description: 'Chấp thuận các quy định bảo mật, cam kết đạo đức nghề nghiệp và quy tắc ứng xử Mentorship.',
      isMet: termsAccepted,
      icon: <ShieldCheck className="h-5 w-5 text-brand-600" />,
      actionText: termsAccepted ? 'Xem lại điều khoản' : 'Đọc & Chấp nhận',
      actionUrl: '/app/mentoring/terms',
      details: (
        <div className="mt-2 text-xs text-plum-600 dark:text-[#b0b3b8]">
          {termsAccepted ? (
            <p className="text-mint-700 font-medium dark:text-mint-400">
              ✓ Đã chấp nhận phiên bản {currentTermsVersion}
              {termsAcceptedAt && ` vào ngày ${new Date(termsAcceptedAt).toLocaleDateString('vi-VN')}`}.
            </p>
          ) : (
            <p className="text-coral-700 font-medium dark:text-coral-400">
              ✕ Bạn chưa xác nhận đồng ý với Điều khoản Hướng dẫn & Hỗ trợ hiện hành.
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'subscription',
      title: '5. Gói duy trì dịch vụ Mentor',
      description: 'Đăng ký và thanh toán gói duy trì hoạt động trên mạng lưới cố vấn Alumni.',
      isMet: active,
      icon: <CreditCard className="h-5 w-5 text-violet-600" />,
      actionText: active
        ? 'Quản lý gói'
        : mentorStatus === 'EXPIRED'
        ? 'Gia hạn gói ngay'
        : hasSubscription && subscriptionStatus === 'PENDING_PAYMENT'
        ? 'Thanh toán gói'
        : 'Chọn gói dịch vụ',
      actionUrl: active || mentorStatus === 'EXPIRED' ? '/app/mentoring/packages' : '/app/mentoring/subscription',
      details: (
        <div className="mt-2 text-xs text-plum-600 dark:text-[#b0b3b8]">
          {active ? (
            <p className="text-mint-700 font-medium dark:text-mint-400">
              ✓ Gói đang hoạt động: <span className="font-semibold">{packageName}</span> (Hiệu lực còn lại:{' '}
              {status.remainingDays ?? 0} ngày)
            </p>
          ) : mentorStatus === 'EXPIRED' ? (
            <p className="text-coral-700 font-medium dark:text-coral-400">
              ✕ Gói dịch vụ đã hết hạn vào ngày{' '}
              {status.endDate ? new Date(status.endDate).toLocaleDateString('vi-VN') : 'vừa qua'}. Vui lòng gia hạn.
            </p>
          ) : hasSubscription ? (
            <p className="text-gold-700 font-medium dark:text-gold-400">
              ⏳ Đã chọn gói {packageName}, đang chờ thanh toán chuyển khoản PayOS để kích hoạt.
            </p>
          ) : (
            <p className="text-plum-500">
              Chưa đăng ký gói dịch vụ. Hãy chọn gói (1 tháng, 3 tháng hoặc 6 tháng) để kích hoạt.
            </p>
          )}
        </div>
      ),
    },
  ]

  const completedCount = items.filter((i) => i.isMet).length

  return (
    <Card hover={false} className="p-6 sm:p-8 border border-plum-900/10 bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-plum-900/10 pb-5 dark:border-[#393a3b]">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
            Checklist Điều Kiện Hoạt Động Cố Vấn
          </h2>
          <p className="text-xs sm:text-sm text-plum-500 dark:text-[#8a8d91] mt-0.5">
            Mentor chỉ được kích hoạt hoạt động chính thức (ACTIVE) khi đồng thời đạt cả 5 tiêu chí dưới đây.
          </p>
        </div>
        <Badge tone={completedCount === 5 ? 'success' : 'brand'} className="self-start sm:self-auto text-xs">
          Hoàn thành {completedCount}/5 tiêu chí
        </Badge>
      </div>

      <div className="divide-y divide-plum-900/10 dark:divide-[#393a3b]">
        {items.map((item) => (
          <div key={item.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-plum-900/[0.04] dark:bg-white/[0.05]">
                {item.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm sm:text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
                    {item.title}
                  </h3>
                  {item.isMet ? (
                    <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />} className="text-[10px] py-0 px-2">
                      Đạt
                    </Badge>
                  ) : (
                    <Badge tone="danger" icon={<XCircle className="h-3 w-3" />} className="text-[10px] py-0 px-2">
                      Chưa đạt
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-plum-500 dark:text-[#8a8d91] leading-relaxed">
                  {item.description}
                </p>
                {item.details}
              </div>
            </div>

            <div className="sm:shrink-0 self-end sm:self-start">
              <ButtonLink
                to={item.actionUrl}
                variant={item.isMet ? 'outline' : 'primary'}
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
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
