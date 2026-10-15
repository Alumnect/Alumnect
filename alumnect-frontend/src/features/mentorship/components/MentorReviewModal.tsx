import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Star, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  mentorName: string
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (rating: number, comment: string) => void
}

/** Học viên đánh giá Mentor sau khi Task hoàn thành (mỗi Task một lần). */
export function MentorReviewModal({ mentorName, isSubmitting, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#242526]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-plum-900 dark:text-white">Đánh giá Mentor</h3>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">Chia sẻ trải nghiệm làm việc với {mentorName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-plum-400 hover:bg-cream-100 dark:hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-center gap-1.5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onMouseEnter={() => setHover(value)} onClick={() => setRating(value)} aria-label={`${value} sao`}>
              <Star className={`h-8 w-8 ${(hover || rating) >= value ? 'fill-amber-400 text-amber-400' : 'text-cream-300 dark:text-white/20'}`} />
            </button>
          ))}
        </div>
        <textarea
          rows={4}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhận xét (không bắt buộc)"
          className="w-full rounded-2xl border border-plum-900/10 bg-white p-3 text-sm text-plum-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-[#18191a] dark:text-white"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>Để sau</Button>
          <Button size="sm" onClick={() => onSubmit(rating, comment.trim())} disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
