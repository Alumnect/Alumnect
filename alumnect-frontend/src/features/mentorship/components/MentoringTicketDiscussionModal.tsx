import { createPortal } from 'react-dom'
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-plum-900/60 backdrop-blur-xs dark:bg-black/70 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-cream-300 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-violet-500/10 via-violet-500/10 to-transparent border-b border-cream-300 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500 text-white shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-plum-900 dark:text-[#e4e6eb]">
                  Kênh Trao Đổi #{ticket.ticketCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    isDispute
                      ? 'bg-coral-50 text-coral-700 border-coral-200'
                      : 'bg-violet-500/5 text-violet-500 border-violet-500/20'
                  }`}
                >
                  {isDispute ? 'Tranh chấp' : 'Thỏa thuận dừng Task'}
                </span>
              </div>
              <p className="text-xs text-plum-500 dark:text-plum-400 mt-0.5">
                Nhiệm vụ: <strong className="text-plum-700 dark:text-[#b0b3b8]">{ticket.taskTitle || 'Chi tiết Task'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-200 dark:hover:bg-[#3a3b3c] text-plum-400 hover:text-plum-600 transition-colors"
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
      </div>
    </div>,
    document.body
  )
}
