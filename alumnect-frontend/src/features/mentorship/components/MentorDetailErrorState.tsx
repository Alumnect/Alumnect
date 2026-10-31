import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertCircle, RefreshCw, Trophy, Search } from 'lucide-react'
import { Card } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'

interface MentorDetailErrorStateProps {
  error?: Error | null
  onRetry?: () => void
}

/**
 * Hiển thị giao diện báo lỗi hoặc không tìm thấy Mentor (UC99).
 * Hiển thị thông điệp lỗi nghiệp vụ thực tế từ Backend và cung cấp các lựa chọn điều hướng an toàn.
 */
export function MentorDetailErrorState({ error, onRetry }: MentorDetailErrorStateProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const errorMessage = error?.message || t('mentoring.errorLoadingMentorDetail', 'Không thể tải thông tin chi tiết Mentor. Vui lòng thử lại sau.')

  const isNotFound = errorMessage.toLowerCase().includes('không tìm thấy') ||
    errorMessage.toLowerCase().includes('not found') ||
    errorMessage.toLowerCase().includes('404')

  return (
    <div className="py-8 sm:py-12 flex justify-center">
      <Card hover={false} className="max-w-lg w-full border border-border bg-surface p-8 text-center shadow-soft space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-danger-soft text-danger">
          <AlertCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-display font-bold text-text">
            {isNotFound ? t('mentoring.mentorNotFound', 'Không tìm thấy Mentor') : t('mentoring.connectionError', 'Đã xảy ra lỗi kết nối')}
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            {errorMessage}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onRetry && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={onRetry}
              className="w-full sm:w-auto rounded-xl font-bold"
            >
              {t('common.retry', 'Thử lại')}
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            leftIcon={<Search className="h-4 w-4" />}
            onClick={() => navigate('/app/mentoring/discover')}
            className="w-full sm:w-auto rounded-xl font-bold bg-primary-solid hover:bg-primary-hover"
          >
            {t('mentoring.discoverMentors', 'Khám phá Mentor')}
          </Button>

          <Button
            variant="ghost"
            size="md"
            leftIcon={<Trophy className="h-4 w-4 text-warning" />}
            onClick={() => navigate('/app/mentoring/ranking')}
            className="w-full sm:w-auto rounded-xl font-bold text-text-muted"
          >
            {t('mentoring.leaderboard', 'Bảng xếp hạng')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
