import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, UserX, AlertTriangle, Search, Sparkles, UserCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import {
  MentorPageHeader,
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
      <div className="h-10 w-48 rounded-xl bg-border dark:bg-white/[0.06]" />
      <div className="h-44 rounded-3xl bg-border dark:bg-white/[0.06]" />
      <div className="h-96 rounded-3xl bg-border dark:bg-white/[0.06]" />
    </div>
  )
}

/**
 * Trạng thái Không tìm thấy Mentor (Not Found).
 */
function MentorNotFoundState({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()

  return (
    <Card hover={false} className="p-8 sm:p-12 text-center max-w-lg mx-auto space-y-5 border border-border dark:bg-surface">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-danger-soft text-danger">
        <UserX className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-display text-xl font-bold text-text">
          {t('mentoring.mentorNotFoundTitle')}
        </h3>
        <p className="text-xs text-text-subtle leading-relaxed">
          {t('mentoring.mentorNotFoundDesc')}
        </p>
      </div>
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={onBack}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="w-full sm:w-auto rounded-xl font-bold cursor-pointer"
        >
          {t('common.back')}
        </Button>
        <Link to="/app/mentoring/discover" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Search className="h-4 w-4" />}
            className="w-full rounded-xl font-bold bg-primary-solid hover:bg-primary-hover"
          >
            {t('mentoring.exploreOtherMentors')}
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
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Card hover={false} className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 border border-brand-200/80 bg-surface dark:border-brand-700/40">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft text-primary-solid">
        <UserCheck className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-xl font-bold text-text">
          {t('mentoring.selfRequestTitle')}
        </h3>
        <p className="text-sm font-semibold text-text-muted">
          {t('mentoring.selfRequestDesc')}
        </p>
      </div>
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate(`/app/mentoring/mentors/${mentorId}`)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="w-full sm:w-auto rounded-xl font-bold cursor-pointer"
        >
          {t('mentoring.viewPublicProfile')}
        </Button>
        <Link to="/app/mentoring/status" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            className="w-full rounded-xl font-bold bg-primary-solid hover:bg-primary-hover"
          >
            {t('mentoring.manageMyMentoring')}
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
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Card hover={false} className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 border border-warning-border bg-surface">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-warning-soft text-warning">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-xl font-bold text-text">
          {t('mentoring.mentorNoExpertise', 'Mentor chưa thiết lập lĩnh vực hỗ trợ')}
        </h3>
        <p className="text-sm font-semibold text-text-muted">
          {t('mentoring.mentorNoIndustryTitle')}: <strong>{mentorName}</strong>
        </p>
        <p className="text-xs text-warning bg-warning-soft p-3 rounded-2xl border border-warning-border">
          {t('mentoring.mentorNoIndustryHint')}
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
          {t('common.back', 'Quay lại')}
        </Button>
        <Link to="/app/mentoring/discover" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Search className="h-4 w-4" />}
            className="w-full rounded-xl font-bold bg-primary-solid hover:bg-primary-hover"
          >
            {t('mentoring.findAnotherMentor', 'Tìm Mentor khác')}
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
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Card hover={false} className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 border border-danger-border bg-surface">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-danger-soft text-danger">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-xl font-bold text-text">
          {t('mentoring.mentorUnavailable', 'Mentor hiện không thể tiếp nhận yêu cầu')}
        </h3>
        <p className="text-sm font-semibold text-text-muted">
          {t('mentoring.mentorUnavailableTitle')}: <strong>{mentorName}</strong>
        </p>
        <p className="text-xs text-danger bg-danger-soft p-3 rounded-2xl border border-danger-border">
          {t('mentoring.reasonPrefix')}{reason || t('mentoring.defaultUnavailableReason')}
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
          {t('mentoring.viewMentorProfile', 'Xem hồ sơ Mentor')}
        </Button>
        <Link to="/app/mentoring/discover" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Search className="h-4 w-4" />}
            className="w-full rounded-xl font-bold bg-primary-solid hover:bg-primary-hover"
          >
            {t('mentoring.findAnotherMentor', 'Tìm Mentor khác')}
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
  const { t } = useTranslation()
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
        className="w-full space-y-4 text-left"
      >
        <MentorPageHeader
          icon={<Sparkles className="h-4 w-4" />}
          eyebrow={t('mentoring.directRequestEyebrow')}
          title={t('mentoring.directRequestTitle')}
          description={t('mentoring.createRequestSubtitle')}
        />

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
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <CreateDirectMentoringRequestContent />
      </MentoringTermsGate>
    </Container>
  )
}
export default CreateDirectMentoringRequestPage
