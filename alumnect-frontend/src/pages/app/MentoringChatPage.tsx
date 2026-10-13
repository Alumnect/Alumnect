import { useNavigate, useParams } from 'react-router-dom'
import { Container, EmptyState, Button } from '@/components/ui'
import { MentoringChatForTask, MentoringTermsGate } from '@/features/mentorship'

/**
 * Trang Chat for Task của một Mentoring Request (/app/mentoring/chats/:conversationId).
 * Mở từ "Mở Chat for Task" ở trang chi tiết Request (Học viên) hoặc chi tiết Incoming Request (Mentor).
 */
export function MentoringChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const id = Number(conversationId)

  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        {Number.isFinite(id) && id > 0 ? (
          <MentoringChatForTask conversationId={id} onBack={() => navigate(-1)} />
        ) : (
          <EmptyState
            title="Không tìm thấy Chat for Task"
            description="Đường dẫn cuộc trò chuyện không hợp lệ."
            action={<Button onClick={() => navigate('/app/mentoring/requests')}>Về danh sách Request</Button>}
          />
        )}
      </MentoringTermsGate>
    </Container>
  )
}
