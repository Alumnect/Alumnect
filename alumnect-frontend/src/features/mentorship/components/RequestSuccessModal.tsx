import React from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Users, ArrowRight, AlertCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DialogFrame } from '@/components/ui/DialogFrame'
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
 * Render qua createPortal để bảo đảm cách ly DOM và tránh lỗi chèn node khi hiển thị.
 */
export const RequestSuccessModal: React.FC<RequestSuccessModalProps> = ({
  isOpen,
  onClose,
  data,
  onExploreMentors,
}) => {
  const { t } = useTranslation()
  if (!isOpen || !data) return null

  const taskTypeOption = data ? TASK_TYPE_OPTIONS.find((t) => t.value === data.taskType) : undefined

  return (
    <DialogFrame onClose={onClose} zIndexClassName="z-50" maxWidthClassName="max-w-xl" className="overflow-y-auto p-6 text-left sm:p-8">
      {/* Header Icon */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-soft text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-text">
              {t('mentoring.requestSuccessTitle', 'Tạo yêu cầu Mentoring thành công!')}
            </h3>
          </div>
          <p className="text-xs text-text-subtle">
            {t('mentoring.requestCode', 'Mã yêu cầu')}: <span className="font-semibold text-text-muted">#{data.id}</span>
          </p>
        </div>
      </div>

      {/* Nội dung kết quả phân phối (Matching & Distribution hoặc Direct Request) */}
      <div className="my-5 space-y-4">
        {/* Box thông báo trạng thái phân phối */}
        {data.requestType === 'DIRECT' || data.targetMentorId ? (
          <div className="rounded-2xl border border-success-border bg-success-soft p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success text-text-inverse shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-success">
                    {t('mentoring.sentDirectToMentor', { name: data.targetMentorName || 'Mentor', defaultValue: `Đã gửi trực tiếp tới ${data.targetMentorName || 'Mentor'}` })}
                  </span>
                  <Badge tone="mint" className="text-xs">
                    {t('mentoring.directSendBadge', 'Gửi trực tiếp')}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-success">
                  {data.distributionNote || t('mentoring.directSendDesc', 'Yêu cầu đã được gửi trực tiếp tới Mentor được chọn và đang chờ phản hồi tiếp nhận.')}
                </p>
              </div>
            </div>
          </div>
        ) : data.matchedCount > 0 ? (
          <div className="rounded-2xl border border-brand-200/70 bg-brand-50/70 p-4 dark:border-brand-700/40 dark:bg-brand-700/30">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-solid text-on-primary shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-primary-solid">
                    {t('mentoring.autoDistributedToMentors', { count: data.matchedCount, defaultValue: `Đã tự động phân phối tới ${data.matchedCount} Mentor` })}
                  </span>
                  <Badge tone="brand" className="text-xs">
                    {t('mentoring.matchingSuccessBadge', 'Matching thành công')}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-brand-700/80 dark:text-brand-300/80">
                  {data.distributionNote}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-warning-border bg-warning-soft p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning text-text-inverse shadow-xs">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-warning">
                    {t('mentoring.requestSavedNotice', 'Yêu cầu đã được lưu vào hệ thống')}
                  </span>
                  <Badge tone="gold" className="text-xs">
                    {t('mentoring.waitingForConnection', 'Chờ kết nối')}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-warning dark:text-gold-300/80">
                  {data.distributionNote}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chi tiết tóm tắt yêu cầu */}
        <div className="rounded-2xl border border-border bg-cream-50/60 p-4 space-y-2.5 text-xs dark:bg-white/[0.03]">
          {data.targetMentorName && (
            <div className="flex justify-between items-center py-1 border-b border-border dark:border-white/[0.05]">
              <span className="text-text-subtle">{t('mentoring.recipientMentor', 'Mentor nhận yêu cầu:')}</span>
              <span className="font-bold text-primary-solid">{data.targetMentorName}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-1 border-b border-border dark:border-white/[0.05]">
            <span className="text-text-subtle">{t('mentoring.requestTitleLabel', 'Tiêu đề:')}</span>
            <span className="font-bold text-text max-w-[280px] truncate">{data.title}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border dark:border-white/[0.05]">
            <span className="text-text-subtle">{t('mentoring.fieldLabel', 'Lĩnh vực:')}</span>
            <span className="font-semibold text-primary-solid">{data.industryName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border dark:border-white/[0.05]">
            <span className="text-text-subtle">{t('mentoring.taskTypeLabel', 'Loại nhiệm vụ:')}</span>
            <span className="font-medium text-text">{taskTypeOption?.label || data.taskType}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border dark:border-white/[0.05]">
            <span className="text-text-subtle">{t('mentoring.modeAndParticipation', 'Hình thức & Tham gia:')}</span>
            <span className="font-medium text-text">
              {WORKING_MODE_LABELS[data.workingMode]} • {PARTICIPATION_TYPE_LABELS[data.participationType]}
            </span>
          </div>
          {data.expectedDeadline && (
            <div className="flex justify-between items-center py-1">
              <span className="text-text-subtle flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary-solid" />
                {t('mentoring.expectedDeadlineLabel', 'Thời hạn mong muốn:')}
              </span>
              <span className="font-semibold text-text">
                {new Date(data.expectedDeadline).toLocaleDateString()}
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
          {t('common.close', 'Đóng')}
        </Button>
        {onExploreMentors && (
          <Button
            variant="primary"
            size="md"
            onClick={onExploreMentors}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="w-full sm:w-auto rounded-xl font-bold shadow-xs"
          >
            {t('mentoring.exploreMoreMentors', 'Khám phá Mentor thêm')}
          </Button>
        )}
      </div>
    </DialogFrame>
  )
}
