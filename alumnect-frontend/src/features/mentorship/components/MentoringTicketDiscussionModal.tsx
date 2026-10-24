import { DialogFrame } from '@/components/ui/DialogFrame'
import {
  MessageSquare,
  X,
} from 'lucide-react'
import { MentoringTicketDiscussionThread } from './MentoringTicketDiscussionThread'
import type { MentoringDisputeTicket } from '../model/mentoringTaskTypes'

interface MentoringTicketDiscussionModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: MentoringDisputeTicket | null
  currentRole: 'STUDENT' | 'MENTOR'
}

export function MentoringTicketDiscussionModal({
  isOpen,
  onClose,
  ticket,
  currentRole,
}: MentoringTicketDiscussionModalProps) {
  if (!isOpen || !ticket || typeof document === 'undefined') return null

  const isDispute = ticket.ticketType === 'DISPUTE'
  const studentName = ticket.student?.fullName || ticket.studentName || 'Học viên'
  const mentorName = ticket.mentor?.fullName || ticket.mentorName || 'Cố vấn'

  return <DialogFrame
      onClose={onClose}
      zIndexClassName="z-[100]"
      maxWidthClassName="max-w-3xl"
      className="overflow-hidden flex flex-col"
    >
        {/* Header Modal */}
        <div className="bg-surface-2 px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-info text-text-inverse shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-text">
                  Kênh Trao Đổi #{ticket.ticketCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    isDispute
                      ? 'bg-danger-soft text-danger border-danger-border'
                      : 'bg-info-soft text-info border-info'
                  }`}
                >
                  {isDispute ? 'Tranh chấp' : 'Thỏa thuận dừng Task'}
                </span>
              </div>
              <p className="text-xs text-text-subtle mt-0.5">
                Nhiệm vụ: <strong className="text-text-muted">{ticket.taskTitle || 'Chi tiết Task'}</strong>
              </p>
            </div>
          </div>

          <button aria-label="Đóng"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-3 dark:hover:bg-surface-2 text-text-subtle hover:text-text-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Thread */}
        <div className="p-4 flex-1 overflow-hidden">
          <MentoringTicketDiscussionThread
            ticketId={ticket.id}
            ticketStatus={ticket.status}
            currentRole={currentRole}
            studentName={studentName}
            mentorName={mentorName}
            totalAmount={ticket.totalAmount}
          />
        </div>
      </DialogFrame>
}
