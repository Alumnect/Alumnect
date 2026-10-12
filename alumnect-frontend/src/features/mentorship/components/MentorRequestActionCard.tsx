import { useState } from 'react'
import { Send, AlertTriangle, CheckCircle, Sparkles, Clock, Laptop, HeartHandshake, X } from 'lucide-react'
import { Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import type { MentorDetailData } from '../model/mentorDetailTypes'

interface MentorRequestActionCardProps {
  mentor: MentorDetailData
}

/**
 * Thẻ thông tin buổi hẹn & đặt yêu cầu cố vấn (UC99).
 * Thiết kế gọn gàng, hiển thị thông tin thực tế về buổi hướng dẫn.
 */
export function MentorRequestActionCard({ mentor }: MentorRequestActionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenRequest = () => {
    if (mentor.canReceiveRequest) {
      setIsModalOpen(true)
    }
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

        {mentor.canReceiveRequest ? (
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
              disabled
              className="w-full rounded-2xl font-bold py-3 bg-plum-100 text-plum-400 cursor-not-allowed dark:bg-white/5 dark:text-plum-500"
            >
              Tạm ngưng nhận yêu cầu
            </Button>
          </div>
        )}
      </Card>

      {/* Modal Dialog Thông báo Tích hợp UC101 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-plum-900/10 shadow-2xl p-6 sm:p-7 text-left space-y-5 dark:bg-[#242526] dark:border-[#393a3b]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-plum-400 hover:text-plum-700 rounded-full hover:bg-plum-50 transition-colors dark:hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <h4 className="font-heading text-lg font-extrabold text-plum-900 dark:text-[#e4e6eb]">
                  Gửi yêu cầu cố vấn
                </h4>
                <p className="text-xs text-plum-500 dark:text-[#8f9399]">
                  Kết nối với Mentor <strong>{mentor.fullName}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-plum-50/60 p-4 text-xs text-plum-700 dark:bg-white/5 dark:text-[#e4e6eb]">
              <div className="flex justify-between border-b border-plum-900/[0.06] pb-2 dark:border-white/10">
                <span className="text-plum-400 dark:text-[#8f9399]">Đơn vị công tác</span>
                <strong>{mentor.currentCompany || 'Cố vấn chuyên môn'}</strong>
              </div>
              <div className="flex justify-between border-b border-plum-900/[0.06] pb-2 dark:border-white/10">
                <span className="text-plum-400 dark:text-[#8f9399]">Chuyên ngành</span>
                <strong>{mentor.academicInfo?.majorName || 'Đại học FPT'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-plum-400 dark:text-[#8f9399]">Tình trạng tiếp nhận</span>
                <strong className="text-mint-700 dark:text-mint-400">Sẵn sàng nhận học viên</strong>
              </div>
            </div>

            <div className="rounded-2xl bg-brand-50/50 p-4 border border-brand-200/40 dark:bg-brand-950/30 dark:border-brand-800/30 text-xs text-brand-900 dark:text-brand-200 space-y-1">
              <p className="font-bold">Tính năng Gửi Mentoring Request (UC101)</p>
              <p className="text-brand-800/80 dark:text-brand-300/80 leading-relaxed">
                Hệ thống đang chuẩn bị chuyển hướng bạn sang biểu mẫu gửi yêu cầu cố vấn chi tiết (UC101) để lựa chọn chủ đề và thời gian phù hợp.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl font-bold"
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl font-bold bg-brand-600 hover:bg-brand-700"
              >
                Xác nhận kết nối
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
