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
  if (!isOpen || !ticket) return null

  const isDispute = ticket.ticketType === 'DISPUTE'
  const studentName = ticket.student?.fullName || ticket.studentName || 'Học viên'
  const mentorName = ticket.mentor?.fullName || ticket.mentorName || 'Cố vấn'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Kênh Trao Đổi #{ticket.ticketCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    isDispute
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}
                >
                  {isDispute ? 'Tranh chấp' : 'Thỏa thuận dừng Task'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nhiệm vụ: <strong className="text-slate-700 dark:text-slate-300">{ticket.taskTitle || 'Chi tiết Task'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
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
    </div>
  )
}
