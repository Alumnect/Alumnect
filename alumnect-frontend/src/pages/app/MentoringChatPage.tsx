import { useNavigate, useParams } from 'react-router-dom'
import { Container, EmptyState, Button, useBackNavigation } from '@/components/ui'
import { MentoringChatForTask, MentoringTermsGate } from '@/features/mentorship'

/**
 * Trang Chat for Task của một Mentoring Request (/app/mentoring/chats/:conversationId).
 * Mở từ "Mở Chat for Task" ở trang chi tiết Request (Học viên) hoặc chi tiết Incoming Request (Mentor).
 */
export function MentoringChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const id = Number(conversationId)
  const goBack = useBackNavigation('/app/mentoring/messages')

  return (
    <Container className="h-full min-h-0 px-0 py-0 sm:px-0">
      <MentoringTermsGate source="MENTORING_HOME">
        {Number.isFinite(id) && id > 0 ? (
          <div className="h-full min-h-0">
            <MentoringChatForTask conversationId={id} onBack={goBack} />
          </div>
        ) : (
          <EmptyState
            title="Không tìm thấy cuộc trò chuyện"
            description="Đường dẫn cuộc trò chuyện không hợp lệ."
            action={<Button onClick={() => navigate('/app/mentoring/requests')}>Về danh sách Request</Button>}
          />
        )}
      </MentoringTermsGate>
    </Container>
  )
}
