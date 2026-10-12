import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, UserX, AlertTriangle, Search, Trophy, Sparkles, UserCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Container } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import {
  MentoringTermsGate,
  useMentorDetail,
  SelectedMentorCard,
  CreateMentoringRequestForm,
  RequestSuccessModal,
  type CreateMentoringRequestData,
} from '@/features/mentorship'

/**
 * Skeleton Loader khi đang tải dữ liệu Mentor trong trang tạo Direct Request.
 */
function DirectRequestSkeleton() {
  return (
    <div className="space-y-6 animate-pulse text-left">
      <div className="h-10 w-48 rounded-xl bg-plum-900/[0.06] dark:bg-white/[0.06]" />
      <div className="h-44 rounded-3xl bg-plum-900/[0.06] dark:bg-white/[0.06]" />
      <div className="h-96 rounded-3xl bg-plum-900/[0.06] dark:bg-white/[0.06]" />
    </div>
  )
}

/**
 * Trạng thái Không tìm thấy Mentor (Not Found).
 */
function MentorNotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <Card hover={false} className="p-8 sm:p-12 text-center max-w-lg mx-auto space-y-5 border border-plum-900/10 dark:bg-[#242526] dark:border-[#393a3b]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-coral-50 text-coral-600 dark:bg-coral-950/40 dark:text-coral-400">
        <UserX className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-heading text-xl font-black text-plum-900 dark:text-[#e4e6eb]">
          Không tìm thấy hồ sơ Mentor
        </h3>
        <p className="text-xs text-plum-500 leading-relaxed dark:text-[#8f9399]">
          Mentor bạn đang tìm kiếm không tồn tại hoặc đã ngừng cung cấp dịch vụ cố vấn trên hệ thống AlumNect.
        </p>
      </div>
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={onBack}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="w-full sm:w-auto rounded-xl font-bold"
        >
          Quay lại
        </Button>
        <Link to="/app/mentoring/discover" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Search className="h-4 w-4" />}
            className="w-full rounded-xl font-bold bg-brand-600 hover:bg-brand-700"
          >
            Khám phá Mentor khác
          </Button>
        </Link>
      </div>
    </Card>
  )
}

/**
 * Trạng thái Người dùng tự gửi yêu cầu cho chính mình (Self Mentoring Request).
 */
function SelfRequestState({ mentorId }: { mentorId: number }) {
  const navigate = useNavigate()

  return (
    <Card hover={false} className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 border border-brand-200/80 bg-white dark:bg-[#242526] dark:border-brand-800/40">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
        <UserCheck className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="font-heading text-xl font-black text-plum-900 dark:text-[#e4e6eb]">
          Đây là hồ sơ Mentor của bạn
        </h3>
        <p className="text-sm font-semibold text-plum-700 dark:text-[#b0b3b8]">
          Bạn không thể tự gửi yêu cầu cố vấn cho chính tài khoản của mình.
        </p>
        <p className="text-xs text-plum-500 dark:text-[#8f9399] bg-plum-50 dark:bg-white/5 p-3 rounded-2xl">
          Để cấu hình thông tin cố vấn hoặc quản lý các yêu cầu nhận được từ sinh viên, vui lòng truy cập trang Quản lý Trạng thái Cố vấn.
        </p>
      </div>
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate(`/app/mentoring/mentors/${mentorId}`)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="w-full sm:w-auto rounded-xl font-bold"
        >
          Xem hồ sơ công khai
        </Button>
        <Link to="/app/mentoring/status" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            className="w-full rounded-xl font-bold bg-brand-600 hover:bg-brand-700"
          >
            Quản lý cố vấn của tôi
          </Button>
        </Link>
      </div>
    </Card>
  )
}

/**
 * Trạng thái Mentor chưa thiết lập lĩnh vực hỗ trợ (No Supported Fields).
 */
function EmptySupportedFieldsState({
  mentorName,
  mentorId,
}: {
  mentorName: string
  mentorId: number
}) {
  const navigate = useNavigate()

  return (
    <Card hover={false} className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 border border-amber-200/80 bg-white dark:bg-[#242526] dark:border-amber-800/40">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="font-heading text-xl font-black text-plum-900 dark:text-[#e4e6eb]">
          Mentor chưa thiết lập lĩnh vực hỗ trợ
        </h3>
        <p className="text-sm font-semibold text-plum-700 dark:text-[#b0b3b8]">
          Mentor <strong>{mentorName}</strong> hiện chưa đăng ký bất kỳ lĩnh vực chuyên môn hỗ trợ nào.
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
          Yêu cầu cố vấn trực tiếp cần ít nhất một lĩnh vực chuyên môn phù hợp để phân loại nhiệm vụ.
        </p>
      </div>
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate(`/app/mentoring/mentors/${mentorId}`)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="w-full sm:w-auto rounded-xl font-bold"
        >
          Quay lại hồ sơ
        </Button>
        <Link to="/app/mentoring/discover" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Search className="h-4 w-4" />}
            className="w-full rounded-xl font-bold bg-brand-600 hover:bg-brand-700"
          >
            Tìm Mentor khác
          </Button>
        </Link>
      </div>
    </Card>
  )
}

/**
 * Trạng thái Mentor không khả dụng (Unavailable / Inactive / Expired Subscription).
 */
function MentorUnavailableState({
  mentorName,
  reason,
  mentorId,
}: {
  mentorName: string
  reason?: string | null
  mentorId: number
}) {
  const navigate = useNavigate()

  return (
    <Card hover={false} className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 border border-coral-200/80 bg-white dark:bg-[#242526] dark:border-coral-800/40">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-coral-100 text-coral-600 dark:bg-coral-950/60 dark:text-coral-400">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="font-heading text-xl font-black text-plum-900 dark:text-[#e4e6eb]">
          Mentor hiện không thể tiếp nhận yêu cầu
        </h3>
        <p className="text-sm font-semibold text-plum-700 dark:text-[#b0b3b8]">
          Mentor <strong>{mentorName}</strong> hiện đang tạm ngưng nhận các yêu cầu cố vấn mới.
        </p>
        <p className="text-xs text-coral-600 dark:text-coral-400 bg-coral-50 dark:bg-coral-950/40 p-3 rounded-2xl border border-coral-200/60 dark:border-coral-800/40">
          Lý do: {reason || 'Gói cố vấn của Mentor đã hết hạn hoặc Mentor đang trong trạng thái tạm ngưng.'}
        </p>
      </div>
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate(`/app/mentoring/mentors/${mentorId}`)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="w-full sm:w-auto rounded-xl font-bold"
        >
          Xem hồ sơ Mentor
        </Button>
        <Link to="/app/mentoring/discover" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Search className="h-4 w-4" />}
            className="w-full rounded-xl font-bold bg-brand-600 hover:bg-brand-700"
          >
            Tìm Mentor khác
          </Button>
        </Link>
      </div>
    </Card>
  )
}

/**
 * Nội dung trang Gửi yêu cầu Mentoring trực tiếp (UC101 — Direct Mentoring Request).
 */
function CreateDirectMentoringRequestContent() {
  const { mentorId: paramMentorId, id: paramId } = useParams<{ mentorId?: string; id?: string }>()
  const mentorId = paramMentorId || paramId || ''
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)

  const [successData, setSuccessData] = useState<CreateMentoringRequestData | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Tải thông tin chi tiết Mentor được chọn
  const { data: mentor, isLoading, isError } = useMentorDetail(mentorId)

  const handleSuccess = (data: CreateMentoringRequestData) => {
    setSuccessData(data)
    setShowSuccessModal(true)
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    if (mentor) {
      navigate(`/app/mentoring/mentors/${mentor.mentorId}`)
    } else {
      navigate('/app/mentoring')
    }
  }

  if (isLoading) {
    return <DirectRequestSkeleton />
  }

  if (isError || !mentor) {
    return (
      <MentorNotFoundState
        onBack={() => {
          if (window.history.length > 2) {
            navigate(-1)
          } else {
            navigate('/app/mentoring/discover')
          }
        }}
      />
    )
  }

  // Kiểm tra self-mentoring (BR-02: Không thể gửi yêu cầu cho chính mình)
  if (currentUser && mentor.userId && String(currentUser.id) === String(mentor.userId)) {
    return <SelfRequestState mentorId={mentor.mentorId} />
  }

  // Kiểm tra điều kiện Mentor khả dụng (BR-02, BR-03, BR-05)
  if (!mentor.canReceiveRequest || mentor.mentorStatus !== 'ACTIVE') {
    return (
      <MentorUnavailableState
        mentorName={mentor.fullName}
        reason={mentor.availabilityReason}
        mentorId={mentor.mentorId}
      />
    )
  }

  // Kiểm tra Mentor có lĩnh vực hỗ trợ hợp lệ không
  if (!mentor.supportedFields || mentor.supportedFields.length === 0) {
    return (
      <EmptySupportedFieldsState
        mentorName={mentor.fullName}
        mentorId={mentor.mentorId}
      />
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="direct-request-content"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="space-y-6 text-left max-w-4xl mx-auto"
      >
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
                  navigate(`/app/mentoring/mentors/${mentor.mentorId}`)
                }
              }}
              className="rounded-xl font-bold text-plum-700 hover:text-brand-600 dark:text-[#e4e6eb] dark:hover:text-brand-400"
            >
              Quay lại hồ sơ
            </Button>
            <span className="text-plum-300 dark:text-plum-600">/</span>
            <span className="text-xs font-semibold text-plum-500 dark:text-[#8f9399]">
              Gửi yêu cầu trực tiếp tới{' '}
              <strong className="text-plum-800 dark:text-[#e4e6eb]">{mentor.fullName}</strong>
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
              Gửi yêu cầu cố vấn trực tiếp
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 border border-brand-200/60 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/40">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              <span>Yêu cầu trực tiếp</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-plum-600 dark:text-[#8f9399]">
            Yêu cầu này sẽ được gửi trực tiếp và duy nhất đến Mentor được chọn. Hệ thống không thực hiện cơ chế tự động phân phối sang các Mentor khác.
          </p>
        </div>

        {/* Selected Mentor Card Display */}
        <SelectedMentorCard mentor={mentor} />

        {/* Reusable Mentoring Request Form (Configured for Direct Mode) */}
        <CreateMentoringRequestForm
          targetMentor={mentor}
          isDirectRequest={true}
          onSuccess={handleSuccess}
          onCancel={() => navigate(`/app/mentoring/mentors/${mentor.mentorId}`)}
        />

        {/* Success Modal Feedback */}
        <RequestSuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseModal}
          data={successData}
          onExploreMentors={() => {
            setShowSuccessModal(false)
            navigate('/app/mentoring/discover')
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Trang Chọn Mentor & Gửi Yêu cầu Cố vấn Trực tiếp (UC101 — Direct Mentoring Request).
 * Được bảo vệ bởi MentoringTermsGate (source = MENTORING_HOME).
 */
export function CreateDirectMentoringRequestPage() {
  return (
    <Container className="py-4 sm:py-6">
      <MentoringTermsGate source="MENTORING_HOME">
        <CreateDirectMentoringRequestContent />
      </MentoringTermsGate>
    </Container>
  )
}
export default CreateDirectMentoringRequestPage
