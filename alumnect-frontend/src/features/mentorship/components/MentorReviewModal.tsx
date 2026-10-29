import { DialogFrame } from '@/components/ui/DialogFrame'
import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

interface Props {
  mentorName: string
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (rating: number, comment: string) => void
}

/** Học viên đánh giá Mentor sau khi Task hoàn thành (mỗi Task một lần). */
export function MentorReviewModal({ mentorName, isSubmitting, onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')

  return <DialogFrame
      onClose={onClose}
      zIndexClassName="z-[100]"
      maxWidthClassName="max-w-md"
      className="space-y-4 p-6"
    >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-text">{t('mentoring.reviewMentorTitle')}</h3>
            <p className="text-xs text-text-subtle">{t('mentoring.reviewMentorSubtitle', { name: mentorName })}</p>
          </div>
          <button aria-label={t('common.close')} type="button" onClick={onClose} className="rounded-full p-1.5 text-text-subtle hover:bg-surface-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-center gap-1.5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onMouseEnter={() => setHover(value)} onClick={() => setRating(value)} aria-label={t('mentoring.starsAriaLabel', { count: value })}>
              <Star className={`h-8 w-8 ${(hover || rating) >= value ? 'fill-amber-400 text-amber-400' : 'text-cream-300 dark:text-white/20'}`} />
            </button>
          ))}
        </div>
        <textarea
          rows={4}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('mentoring.reviewCommentPlaceholder')}
          className="w-full rounded-2xl border border-border bg-surface p-3 text-sm text-text outline-none focus:border-primary"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>{t('mentoring.laterBtn')}</Button>
          <Button size="sm" onClick={() => onSubmit(rating, comment.trim())} disabled={isSubmitting}>
            {isSubmitting ? t('mentoring.sending') : t('mentoring.reviewSubmitBtn')}
          </Button>
        </div>
      </DialogFrame>
}
