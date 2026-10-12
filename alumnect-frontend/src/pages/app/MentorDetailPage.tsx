import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Search, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Container } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
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
  const params = useParams<{ id?: string; mentorId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Xác định định danh hợp lệ
  const effectiveId = params.id || params.mentorId || searchParams.get('mentorId') || searchParams.get('userId') || ''

  // Truy vấn dữ liệu chi tiết Mentor qua React Query
  const { data: mentor, isLoading, isError, error, refetch } = useMentorDetail(effectiveId)

  // Cuộn mượt đến thẻ yêu cầu cố vấn khi bấm nút CTA từ Header
  const handleScrollToRequest = () => {
    const el = document.getElementById('mentor-request-card')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
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
          {/* SECTION A — Thanh điều hướng quay lại & Breadcrumbs */}
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
                    navigate('/app/mentoring/discover')
                  }
                }}
                className="rounded-xl font-bold text-plum-700 hover:text-brand-600 dark:text-[#e4e6eb] dark:hover:text-brand-400"
              >
                Quay lại
              </Button>

              <span className="text-plum-300 dark:text-plum-600">/</span>

              <span className="text-xs font-semibold text-plum-500 dark:text-[#8f9399]">
                Hồ sơ Mentor : <strong className="text-plum-800 dark:text-[#e4e6eb]">{mentor.fullName}</strong>
              </span>
            </div>

            {/* Các liên kết chuyển nhanh */}
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

          {/* SECTION B — Mentor Hero Profile Header (Thanh thoát, không lặp stats) */}
          <MentorProfileHeader
            mentor={mentor}
            onRequestMentor={handleScrollToRequest}
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
