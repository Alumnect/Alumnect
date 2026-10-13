import { useState } from 'react'
import { ShieldCheck, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useDealByConversation } from '../hooks/useMentoringDeals'
import { MentoringDealActionModal } from './MentoringDealActionModal'
import { MentoringDealFormModal } from './MentoringDealFormModal'
import { useAuthStore } from '@/store/authStore'

interface MentoringDealChatHeaderActionProps {
  conversationId: number
  recipientId: number | string
}

/**
 * Nút hành động tương tác Thỏa thuận Mentoring Deal nhúng trên Header của ChatWindow (UC104).
 * Tự động nhận diện Deal hiện có hoặc mở form đề xuất thỏa thuận mới giữa Student và Mentor.
 */
export function MentoringDealChatHeaderAction({
  conversationId,
  recipientId,
}: MentoringDealChatHeaderActionProps) {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const currentUserRole = useAuthStore((state) => state.user?.role)

  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: detailData, isLoading, refetch } = useDealByConversation(conversationId)

  const deal = detailData?.deal

  // Xác định ai là Mentor, ai là Student
  const currentNumId = Number(currentUserId) || 0
  const recipientNumId = Number(recipientId) || 0
  const isCurrentMentor = currentUserRole === 'ALUMNI'
  const mentorId = isCurrentMentor ? currentNumId : recipientNumId
  const studentId = isCurrentMentor ? recipientNumId : currentNumId

  return (
    <>
      {isLoading ? (
        <span className="flex h-8 w-8 items-center justify-center text-plum-400">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      ) : deal ? (
        <button
          type="button"
          onClick={() => setIsActionModalOpen(true)}
          title={`Xem thỏa thuận Deal #${deal.id} (Phiên bản ${deal.version})`}
          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all shadow-2xs active:scale-95 ${
            deal.status === 'DEAL_CONFIRMED'
              ? 'bg-mint-50 text-mint-700 border border-mint-200/80 hover:bg-mint-100 dark:bg-mint-950/40 dark:text-mint-300 dark:border-mint-800/40'
              : 'bg-brand-50 text-brand-700 border border-brand-200/80 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/40'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">
            Deal #{deal.id} {deal.status === 'DEAL_CONFIRMED' ? '(Đã chốt)' : `(v${deal.version})`}
          </span>
          <span className="sm:hidden">Deal</span>
        </button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl px-2.5 py-1 text-xs font-bold border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-800/50 dark:text-brand-300 dark:hover:bg-brand-950/30"
          title="Đề xuất Thỏa thuận cố vấn (Deal)"
        >
          <Plus className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Tạo Deal</span>
        </Button>
      )}

      {/* Modal xem chi tiết và xác nhận Deal */}
      {isActionModalOpen && deal && (
        <MentoringDealActionModal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          dealId={deal.id}
        />
      )}

      {/* Modal khởi tạo đề xuất Deal mới */}
      {isCreateModalOpen && (
        <MentoringDealFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          conversationId={conversationId}
          mentorId={mentorId}
          studentId={studentId}
          onSuccess={() => {
            refetch()
            setIsActionModalOpen(true)
          }}
        />
      )}
    </>
  )
}
