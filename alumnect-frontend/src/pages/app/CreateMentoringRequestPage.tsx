import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Search, Trophy } from 'lucide-react'
import {
  MentoringTermsGate,
  CreateMentoringRequestForm,
  RequestSuccessModal,
  type CreateMentoringRequestData,
} from '@/features/mentorship'
import { Container } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'

function CreateMentoringRequestContent() {
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
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-plum-900/[0.06] pb-4 dark:border-[#393a3b]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1)
              } else {
                navigate('/app/mentoring')
              }
            }}
            className="rounded-xl font-bold text-plum-700 hover:text-brand-600 dark:text-[#e4e6eb] dark:hover:text-brand-400"
          >
            Quay lại Mentoring
          </Button>
          <span className="text-plum-300 dark:text-plum-600">/</span>
          <span className="text-xs font-semibold text-plum-500 dark:text-[#8f9399]">
            Tạo yêu cầu mới
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app/mentoring/discover"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-plum-600 hover:text-brand-600 hover:bg-brand-50 transition-colors dark:text-[#b0b3b8] dark:hover:bg-white/5"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Khám phá Mentor</span>
          </Link>
          <Link
            to="/app/mentoring/ranking"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-plum-600 hover:text-gold-600 hover:bg-gold-50 transition-colors dark:text-[#b0b3b8] dark:hover:bg-white/5"
          >
            <Trophy className="h-3.5 w-3.5 text-gold-500" />
            <span>Bảng xếp hạng</span>
          </Link>
        </div>
      </div>

      {/* Page Title & Context Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-plum-900 tracking-tight dark:text-[#e4e6eb]">
            Tạo yêu cầu Mentoring
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 border border-brand-200/60 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/40">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            <span>Tự động kết nối</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-plum-600 dark:text-[#8f9399]">
          Mô tả chi tiết mục tiêu, khó khăn và kỳ vọng của bạn. Hệ thống sẽ tự động đối sánh và phân phối yêu cầu tới các Mentor phù hợp nhất trong mạng lưới.
        </p>
      </div>

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
    <Container className="py-4 sm:py-6">
      <MentoringTermsGate source="MENTORING_HOME">
        <CreateMentoringRequestContent />
      </MentoringTermsGate>
    </Container>
  )
}
