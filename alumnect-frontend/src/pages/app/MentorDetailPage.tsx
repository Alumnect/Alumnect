import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/primitives'
import { toast } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import {
  MentoringTermsGate,
  useMentorDetail,
  MentorProfileHeader,
  MentorAboutSection,
  MentorExpertiseSection,
  MentorExperienceTimeline,
  MentorAchievementsCard,
  MentorRequestActionCard,
  MentorDetailSkeleton,
  MentorDetailErrorState,
} from '@/features/mentorship'

/**
 * Nội dung trang Chi tiết Mentor (UC99 — View Mentor Detail).
 * Thiết kế gọn gàng, loại bỏ hoàn toàn các thành phần lặp lại gây nhiễu giao diện.
 */
function MentorDetailContent() {
  const { t } = useTranslation()
  const params = useParams<{ id?: string; mentorId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Xác định định danh hợp lệ
  const effectiveId = params.id || params.mentorId || searchParams.get('mentorId') || searchParams.get('userId') || ''

  // Truy vấn dữ liệu chi tiết Mentor qua React Query
  const { data: mentor, isLoading, isError, error, refetch } = useMentorDetail(effectiveId)

  // Chuyển hướng sang trang tạo yêu cầu cố vấn trực tiếp (UC101)
  const handleGoToDirectRequest = () => {
    if (!mentor) return
    if (!isAuthenticated) {
      toast.info(t('mentoring.loginToRequestMentoring'))
      navigate('/auth/login')
      return
    }
    if (currentUser && mentor.userId && String(currentUser.id) === String(mentor.userId)) {
      toast.warning(t('mentoring.cannotRequestSelf'))
      return
    }
    if (!mentor.canReceiveRequest) {
      toast.warning(mentor.availabilityReason || t('mentoring.mentorUnavailableDefault'))
      return
    }
    navigate(`/app/mentoring/mentors/${mentor.mentorId}/request`)
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full"
        >
          <MentorDetailSkeleton />
        </motion.div>
      ) : isError || !mentor ? (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full"
        >
          <MentorDetailErrorState error={error} onRetry={refetch} />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="space-y-6 text-left w-full"
        >
          {/* SECTION B — Mentor Hero Profile Header (Thanh thoát, không lặp stats) */}
          <MentorProfileHeader
            mentor={mentor}
            onRequestMentor={handleGoToDirectRequest}
          />

          {/* Bố cục nội dung 2 cột đáp ứng (Desktop: 2/3 - 1/3, Mobile: 1 cột) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* CỘT CHÍNH (BÊN TRÁI — 2 CỘT): About, Expertise, Career Experience */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* SECTION C — About Mentor (Trích dẫn & Định hướng) */}
              <MentorAboutSection mentor={mentor} />

              {/* SECTION D — Expertise & Supported Fields (Lĩnh vực & Kỹ năng) */}
              <MentorExpertiseSection mentor={mentor} />

              {/* SECTION E — Professional Experience / Career Timeline (Kinh nghiệm) */}
              <MentorExperienceTimeline experiences={mentor.experiences} />
            </div>

            {/* CỘT PHỤ (BÊN PHẢI — 1 CỘT): Achievements, Request Action */}
            <div className="space-y-6 min-w-0 lg:sticky lg:top-20">
              {/* SECTION F — Mentoring Achievements & Reputation (Chỉ số uy tín duy nhất) */}
              <MentorAchievementsCard mentor={mentor} />

              {/* SECTION G — Request Action Box (Thông tin buổi hẹn) */}
              <div id="mentor-request-card">
                <MentorRequestActionCard mentor={mentor} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Trang Xem chi tiết Mentor (UC99 — View Mentor Detail).
 * Đặt trong Container chuẩn, tương đồng 100% với MentorDiscoverPage và MentorRankingPage.
 */
export function MentorDetailPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentorDetailContent />
      </MentoringTermsGate>
    </Container>
  )
}
