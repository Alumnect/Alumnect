import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MessageSquare, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { ButtonLink } from '@/components/ui/Button'
import { MentorResponseStatusBadge } from './RequestStatusBadge'
import { MentoringBadge } from './MentoringUi'
import type { MentorResponseItem } from '../model/mentoringRequestTypes'

interface MentorResponseCardProps {
  response: MentorResponseItem
}

const MAX_FIELDS = 3

function formatTimestamp(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * Phản hồi của một Mentor với yêu cầu (UC102).
 * Mentor đồng ý trao đổi chưa phải là thỏa thuận: Học viên nhắn tin để thống nhất, Task chỉ tạo sau khi chốt Deal và thanh toán.
 */
export function MentorResponseCard({ response }: MentorResponseCardProps) {
  const { t } = useTranslation()
  const profilePath = `/app/mentoring/mentors/${response.mentorProfileId}`
  const isAccepted = response.responseStatus === 'ACCEPTED'
  const fields = response.supportedFields ?? []

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={response.mentorAvatar || undefined} name={response.mentorName} size={44} />
          <div className="min-w-0">
            <Link
              to={profilePath}
              className="block truncate text-sm font-semibold text-text transition-colors hover:text-primary-solid"
            >
              {response.mentorName}
            </Link>
            {response.mentorHeadline && (
              <p className="truncate text-xs text-text-subtle">{response.mentorHeadline}</p>
            )}
          </div>
        </div>
        <MentorResponseStatusBadge status={response.responseStatus} />
      </div>

      {(response.selected || response.sameIndustry || fields.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {response.selected && <MentoringBadge tone="mint">{t('mentoring.selectedMentorBadge')}</MentoringBadge>}
          {response.sameIndustry && <MentoringBadge tone="navy">{t('mentoring.sameIndustryBadge')}</MentoringBadge>}
          {fields.slice(0, MAX_FIELDS).map((field) => (
            <MentoringBadge key={field}>{field}</MentoringBadge>
          ))}
          {fields.length > MAX_FIELDS && <MentoringBadge>+{fields.length - MAX_FIELDS}</MentoringBadge>}
        </div>
      )}

      {response.responseNote && (
        <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-sm text-text-muted dark:bg-white/[0.04]">
          <span className="font-semibold">{t('mentoring.messageLabelPrefix')}</span>
          {response.responseNote}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-xs text-text-subtle">
          {isAccepted
            ? t('mentoring.mentorAgreedChatHint')
            : response.respondedAt
              ? `Phản hồi lúc ${formatTimestamp(response.respondedAt)}`
              : `Đã gửi lúc ${formatTimestamp(response.distributedAt)}`}
        </span>
        <div className="flex items-center gap-2">
          <ButtonLink
            to={profilePath}
            variant="outline"
            size="sm"
            leftIcon={<UserRound className="h-3.5 w-3.5" />}
            className="h-8 rounded-lg px-3 text-xs"
          >
            Hồ sơ
          </ButtonLink>
          {isAccepted && response.conversationId && (
            <ButtonLink
              to={`/app/mentoring/chats/${response.conversationId}`}
              size="sm"
              leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
              className="h-8 rounded-lg px-3 text-xs"
            >
              Nhắn tin
            </ButtonLink>
          )}
        </div>
      </div>
    </article>
  )
}
