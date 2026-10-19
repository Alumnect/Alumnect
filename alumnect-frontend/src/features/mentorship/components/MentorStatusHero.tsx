import { Activity, ArrowRight, RefreshCw } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import type { MentorStatusResponse } from '../model/mentorStatusTypes'
import { MentorPageHeader } from './MentorPageHeader'

interface MentorStatusHeroProps {
  status: MentorStatusResponse
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function MentorStatusHero({ status, onRefresh, isRefreshing }: MentorStatusHeroProps) {
  const { statusMessage, nextAction, actionUrl } = status

  const getActionLabel = () => {
    switch (nextAction) {
      case 'ACTIVE_DASHBOARD': return 'Về tổng quan'
      case 'RESUME_PAYMENT': return 'Tiếp tục thanh toán'
      case 'PAYMENT_CHECKOUT': return 'Kích hoạt gói'
      case 'SELECT_PACKAGE': return 'Chọn gói dịch vụ'
      case 'RENEW_SUBSCRIPTION': return 'Gia hạn gói'
      case 'ACCEPT_TERMS': return 'Xem điều khoản'
      default: return 'Hoàn thiện hồ sơ'
    }
  }

  return (
    <MentorPageHeader
      icon={<Activity className="h-4 w-4" />}
      eyebrow="Quản lý Mentor"
      title="Trạng thái Mentor và gói dịch vụ"
      description={statusMessage}
      actions={
        <>
          <ButtonLink
            to={actionUrl}
            variant="primary"
            size="sm"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {getActionLabel()}
          </ButtonLink>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              Làm mới
            </Button>
          )}
        </>
      }
    />
  )
}
