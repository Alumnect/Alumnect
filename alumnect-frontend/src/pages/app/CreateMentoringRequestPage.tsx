
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  MentoringTermsGate,
  MentorPageHeader,
  CreateMentoringRequestForm,
  RequestSuccessModal,
  type CreateMentoringRequestData,
} from '@/features/mentorship'
import { Container } from '@/components/ui/primitives'

function CreateMentoringRequestContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [successData, setSuccessData] = useState<CreateMentoringRequestData | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSuccess = (data: CreateMentoringRequestData) => {
    setSuccessData(data)
    setShowSuccessModal(true)
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    navigate('/app/mentoring')
  }

  return (
    <div className="w-full space-y-4 text-left">
      <MentorPageHeader
        scene="request"
        title={t('mentoring.createRequestTitle')}
      />

      <CreateMentoringRequestForm
        onSuccess={handleSuccess}
        onCancel={() => navigate('/app/mentoring')}
      />

      <RequestSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        data={successData}
        onViewRequests={() => {
          setShowSuccessModal(false)
          navigate('/app/mentoring/requests')
        }}
        onExploreMentors={() => {
          setShowSuccessModal(false)
          navigate('/app/mentoring/discover')
        }}
      />
    </div>
  )
}

/**
 * Trang Tạo yêu cầu Mentoring chung (UC100 - Create Mentoring Request).
 * Hỗ trợ Sinh viên, Cựu sinh viên và Mentor gửi yêu cầu hỗ trợ / kết nối với Mentor khác.
 * Được bảo vệ bởi MentoringTermsGate (source = MENTORING_HOME).
 * Người dùng chưa chấp nhận điều khoản cố vấn (UC90) sẽ được yêu cầu đồng ý trước khi tạo yêu cầu.
 */
export function CreateMentoringRequestPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <CreateMentoringRequestContent />
      </MentoringTermsGate>
    </Container>
  )
}
