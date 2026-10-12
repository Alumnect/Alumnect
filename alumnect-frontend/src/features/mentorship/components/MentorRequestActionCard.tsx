import { useNavigate } from 'react-router-dom'
import { Send, AlertTriangle, CheckCircle, Clock, Laptop, HeartHandshake, Info } from 'lucide-react'
import { Card, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import type { MentorDetailData } from '../model/mentorDetailTypes'

interface MentorRequestActionCardProps {
  mentor: MentorDetailData
}

/**
 * Thẻ thông tin buổi hẹn & đặt yêu cầu cố vấn (UC99 -> UC101).
 * Thiết kế gọn gàng, hiển thị thông tin thực tế về buổi hướng dẫn và chuyển hướng đến trang tạo Direct Request.
 */
export function MentorRequestActionCard({ mentor }: MentorRequestActionCardProps) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isSelfMentor = Boolean(
    currentUser && mentor.userId && String(currentUser.id) === String(mentor.userId)
  )

  const handleOpenRequest = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để gửi yêu cầu cố vấn')
      navigate('/auth/login')
      return
    }

    if (isSelfMentor) {
      toast.warning('Bạn không thể gửi yêu cầu cố vấn cho chính tài khoản của mình')
      return
    }

    if (!mentor.canReceiveRequest) {
      toast.warning(mentor.availabilityReason || 'Mentor hiện đang tạm ngưng tiếp nhận yêu cầu mới')
      return
    }

    navigate(`/app/mentoring/mentors/${mentor.mentorId}/request`)
  }

  return (
    <>
      <Card
        hover={false}
        className="border border-plum-900/[0.08] bg-white p-6 text-left space-y-4 shadow-sm dark:bg-[#242526] dark:border-[#393a3b]"
      >
        <div className="flex items-center gap-2.5 border-b border-plum-900/[0.06] pb-3 dark:border-[#393a3b]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            <Send className="h-4 w-4" />
          </span>
          <h3 className="font-heading text-base font-extrabold text-plum-900 dark:text-[#e4e6eb]">
            Thông tin phiên cố vấn
          </h3>
        </div>

        {/* Thông số buổi hẹn mẫu */}
        <div className="space-y-2 text-xs text-plum-700 dark:text-[#b0b3b8]">
          <div className="flex items-center justify-between py-1 border-b border-plum-900/[0.04] dark:border-white/[0.05]">
            <span className="inline-flex items-center gap-1.5 text-plum-500 dark:text-[#8f9399]">
              <Clock className="h-3.5 w-3.5 text-brand-500" />
              <span>Thời lượng gợi ý</span>
            </span>
            <strong className="text-plum-900 dark:text-[#e4e6eb]">45 – 60 phút</strong>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-plum-900/[0.04] dark:border-white/[0.05]">
            <span className="inline-flex items-center gap-1.5 text-plum-500 dark:text-[#8f9399]">
              <Laptop className="h-3.5 w-3.5 text-brand-500" />
              <span>Nền tảng gặp mặt</span>
            </span>
            <strong className="text-plum-900 dark:text-[#e4e6eb]">Google Meet / Zoom</strong>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="inline-flex items-center gap-1.5 text-plum-500 dark:text-[#8f9399]">
              <HeartHandshake className="h-3.5 w-3.5 text-mint-600" />
              <span>Mức phí tham khảo</span>
            </span>
            <strong className="text-mint-700 dark:text-mint-400 font-bold">Hỗ trợ cộng đồng</strong>
          </div>
        </div>

        {isSelfMentor ? (
          <div className="space-y-3 pt-1">
            <div className="rounded-xl bg-brand-50/80 p-3 border border-brand-200/60 dark:bg-brand-950/30 dark:border-brand-800/30 flex items-center gap-2 text-brand-900 dark:text-brand-200 text-xs font-semibold">
              <Info className="h-4 w-4 text-brand-600 shrink-0" />
              <span>Đây là hồ sơ cố vấn của bạn</span>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/app/mentoring/status')}
              className="w-full rounded-2xl font-bold py-3 border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-300"
            >
              Quản lý hồ sơ Mentor
            </Button>
          </div>
        ) : mentor.canReceiveRequest ? (
          <div className="space-y-3 pt-1">
            <div className="rounded-xl bg-mint-50/70 p-3 border border-mint-200/50 dark:bg-mint-950/30 dark:border-mint-800/30 flex items-center gap-2 text-mint-900 dark:text-mint-200 text-xs font-semibold">
              <CheckCircle className="h-4 w-4 text-mint-600 shrink-0" />
              <span>Mentor đang sẵn sàng nhận yêu cầu</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={handleOpenRequest}
              className="w-full rounded-2xl font-black py-3 bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 active:scale-[0.98]"
            >
              Đặt lịch hẹn cố vấn
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="rounded-xl bg-coral-50/70 p-3 border border-coral-200/60 dark:bg-coral-950/30 dark:border-coral-800/30 flex items-start gap-2 text-coral-900 dark:text-coral-200 text-xs">
              <AlertTriangle className="h-4 w-4 text-coral-600 shrink-0 mt-0.5" />
              <span>{mentor.availabilityReason || 'Mentor tạm ngưng tiếp nhận yêu cầu mới.'}</span>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                toast.warning(
                  mentor.availabilityReason || 'Mentor hiện đang tạm ngưng tiếp nhận yêu cầu cố vấn mới do gói dịch vụ đã hết hạn hoặc Mentor đang bận.'
                )
              }
              className="w-full rounded-2xl font-bold py-3 bg-plum-100 text-plum-500 hover:bg-plum-200 dark:bg-white/5 dark:text-plum-400"
            >
              Tạm ngưng nhận yêu cầu
            </Button>
          </div>
        )}
      </Card>
    </>
  )
}
