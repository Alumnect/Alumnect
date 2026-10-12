import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Sparkles, Users, ArrowRight, AlertCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/primitives'
import type { CreateMentoringRequestData } from '../model/mentoringRequestTypes'
import { WORKING_MODE_LABELS, PARTICIPATION_TYPE_LABELS, TASK_TYPE_OPTIONS } from '../model/mentoringRequestTypes'

interface RequestSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  data: CreateMentoringRequestData | null
  onViewRequests?: () => void
  onExploreMentors?: () => void
}

/**
 * Modal hiển thị kết quả tạo yêu cầu Mentoring thành công (UC100).
 * Thể hiện số lượng Mentor được matching & phân phối, hoặc giải thích khi chưa có Mentor matching.
 */
export const RequestSuccessModal: React.FC<RequestSuccessModalProps> = ({
  isOpen,
  onClose,
  data,
  onExploreMentors,
}) => {
  if (!isOpen || !data) return null

  const taskTypeOption = TASK_TYPE_OPTIONS.find((t) => t.value === data.taskType)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-plum-900/10 text-left dark:bg-[#242526] dark:border-[#393a3b]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Icon */}
          <div className="flex items-center gap-3 pb-3 border-b border-plum-900/[0.08] dark:border-[#393a3b]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-100 text-mint-700 dark:bg-mint-950/60 dark:text-mint-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-lg font-extrabold text-plum-900 dark:text-[#e4e6eb]">
                  Tạo yêu cầu Mentoring thành công!
                </h3>
                <Sparkles className="h-4 w-4 text-brand-500 animate-pulse" />
              </div>
              <p className="text-xs text-plum-500 dark:text-[#8f9399]">
                Mã yêu cầu: <span className="font-semibold text-plum-700 dark:text-[#e4e6eb]">#{data.id}</span>
              </p>
            </div>
          </div>

          {/* Nội dung kết quả phân phối (Matching & Distribution hoặc Direct Request) */}
          <div className="my-5 space-y-4">
            {/* Box thông báo trạng thái phân phối */}
            {data.requestType === 'DIRECT' || data.targetMentorId ? (
              <div className="rounded-2xl border border-mint-200/80 bg-mint-50/70 p-4 dark:border-mint-800/40 dark:bg-mint-950/30">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-600 text-white shadow-xs">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-mint-900 dark:text-mint-200">
                        Đã gửi trực tiếp tới {data.targetMentorName || 'Mentor'}
                      </span>
                      <Badge tone="mint" className="text-[10px]">
                        Gửi trực tiếp
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-mint-800/90 dark:text-mint-300/80">
                      {data.distributionNote || 'Yêu cầu đã được gửi trực tiếp tới Mentor được chọn và đang chờ phản hồi tiếp nhận.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : data.matchedCount > 0 ? (
              <div className="rounded-2xl border border-brand-200/70 bg-brand-50/70 p-4 dark:border-brand-800/40 dark:bg-brand-950/30">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-brand-900 dark:text-brand-200">
                        Đã tự động phân phối tới {data.matchedCount} Mentor
                      </span>
                      <Badge tone="brand" className="text-[10px]">
                        Matching thành công
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-brand-800/80 dark:text-brand-300/80">
                      {data.distributionNote}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gold-200/80 bg-gold-50/70 p-4 dark:border-gold-800/40 dark:bg-gold-950/30">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-white shadow-xs">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gold-900 dark:text-gold-200">
                        Yêu cầu đã được lưu vào hệ thống
                      </span>
                      <Badge tone="gold" className="text-[10px]">
                        Chờ kết nối
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-gold-800/90 dark:text-gold-300/80">
                      {data.distributionNote}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chi tiết tóm tắt yêu cầu */}
            <div className="rounded-2xl border border-plum-900/[0.08] bg-cream-50/60 p-4 space-y-2.5 text-xs dark:bg-white/[0.03] dark:border-[#393a3b]">
              {data.targetMentorName && (
                <div className="flex justify-between items-center py-1 border-b border-plum-900/[0.04] dark:border-white/[0.05]">
                  <span className="text-plum-500 dark:text-[#8f9399]">Mentor nhận yêu cầu:</span>
                  <span className="font-bold text-brand-700 dark:text-brand-300">{data.targetMentorName}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-plum-900/[0.04] dark:border-white/[0.05]">
                <span className="text-plum-500 dark:text-[#8f9399]">Tiêu đề:</span>
                <span className="font-bold text-plum-900 max-w-[280px] truncate dark:text-[#e4e6eb]">{data.title}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-plum-900/[0.04] dark:border-white/[0.05]">
                <span className="text-plum-500 dark:text-[#8f9399]">Lĩnh vực:</span>
                <span className="font-semibold text-brand-700 dark:text-brand-300">{data.industryName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-plum-900/[0.04] dark:border-white/[0.05]">
                <span className="text-plum-500 dark:text-[#8f9399]">Loại nhiệm vụ:</span>
                <span className="font-medium text-plum-800 dark:text-[#e4e6eb]">{taskTypeOption?.label || data.taskType}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-plum-900/[0.04] dark:border-white/[0.05]">
                <span className="text-plum-500 dark:text-[#8f9399]">Hình thức & Tham gia:</span>
                <span className="font-medium text-plum-800 dark:text-[#e4e6eb]">
                  {WORKING_MODE_LABELS[data.workingMode]} • {PARTICIPATION_TYPE_LABELS[data.participationType]}
                </span>
              </div>
              {data.expectedDeadline && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-plum-500 flex items-center gap-1 dark:text-[#8f9399]">
                    <Calendar className="h-3 w-3 text-brand-500" />
                    Thời hạn mong muốn:
                  </span>
                  <span className="font-semibold text-plum-800 dark:text-[#e4e6eb]">
                    {new Date(data.expectedDeadline).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl font-bold"
            >
              Đóng
            </Button>
            {onExploreMentors && (
              <Button
                variant="primary"
                size="md"
                onClick={onExploreMentors}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="w-full sm:w-auto rounded-xl font-bold shadow-xs"
              >
                Khám phá Mentor thêm
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
