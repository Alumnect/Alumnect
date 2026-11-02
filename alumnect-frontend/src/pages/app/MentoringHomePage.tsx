import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  MentoringTermsGate,
  MentorshipLoadingSkeleton,
  useMentoringTermsStatus,
  MentorCard,
  useMentorSearch,
  useIncomingMentoringRequests,
  useMyMentoringRequests,
  useMyTasks,
} from '@/features/mentorship'
import type { MentorStatusResponse } from '@/features/mentorship/model/mentorStatusTypes'
import { mentoringWalletApi } from '@/features/mentorship/api/mentoringWalletApi'
import { MentoringActionCard, MentoringStatTile } from '@/features/mentorship/components/MentoringUi'
import { Container, Card } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useMentorStatus } from '@/features/mentorship/hooks/useMentorStatus'
import { vnd } from '@/lib/utils'
import {
  Sparkles,
  ArrowRight,
  UserCheck,
  Search,
  Inbox,
  BriefcaseBusiness,
  Landmark,
  RotateCcw,
  BookOpen,
  ShieldAlert,
} from 'lucide-react'

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: 'easeOut',
    },
  },
}

type MentoringHomeContentProps = {
  status?: MentorStatusResponse
}

/**
 * "Việc của bạn": số liệu thật dẫn thẳng tới việc cần làm tiếp theo.
 * Mentor đang hoạt động: yêu cầu chờ phản hồi, Task đang chạy, thu nhập.
 * Người thuê Mentor: yêu cầu đã gửi, Task đang chạy, hoàn tiền + nhắc khai báo tài khoản nhận hoàn tiền.
 */
function MentoringWorkSummary({ isMentorActive }: { isMentorActive: boolean }) {
  const { t } = useTranslation()
  const isRequester = !isMentorActive
  const incoming = useIncomingMentoringRequests({ status: 'WAITING', size: 1, enabled: isMentorActive })
  const myRequests = useMyMentoringRequests({ page: 0, size: 1, enabled: isRequester })
  const activeTasks = useMyTasks('ACTIVE', undefined, 0, 1)
  const earnings = useQuery({
    queryKey: ['mentoring-wallet', 'earnings'],
    queryFn: mentoringWalletApi.getEarnings,
    enabled: isMentorActive,
  })
  const refunds = useQuery({
    queryKey: ['mentoring-wallet', 'refunds'],
    queryFn: mentoringWalletApi.getRefunds,
    enabled: isRequester,
  })
  const refundAccount = useQuery({
    queryKey: ['mentoring-wallet', 'refund-account'],
    queryFn: mentoringWalletApi.getRefundAccount,
    enabled: isRequester,
  })

  const taskTile = (
    <MentoringStatTile
      to="/app/mentoring/tasks"
      tone="navy"
      icon={<BriefcaseBusiness />}
      label={t('mentoring.activeTasks')}
      value={activeTasks.data?.totalElements ?? 0}
      hint={t('mentoring.taskHint')}
      loading={activeTasks.isLoading}
    />
  )

  const account = refundAccount.data
  const missingRefundAccount = isRequester && refundAccount.isSuccess && !account
  const payoutAccountInvalid = isMentorActive && Boolean(earnings.data?.bankAccountRequired)

  return (
    <motion.section variants={itemVariants} className="space-y-3">
      <h2 className="font-display text-lg font-bold text-text">{t('mentoring.yourWork')}</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {isMentorActive ? (
          <>
            <MentoringStatTile
              to="/app/mentoring/incoming-requests"
              tone="brand"
              icon={<Inbox />}
              label={t('mentoring.incomingRequests')}
              value={incoming.data?.totalElements ?? 0}
              hint={t('mentoring.respondEarlyHint')}
              loading={incoming.isLoading}
            />
            {taskTile}
            <MentoringStatTile
              to="/app/mentoring/earnings"
              tone="mint"
              icon={<Landmark />}
              label={t('mentoring.processingEarnings')}
              value={vnd(earnings.data?.totalProcessing ?? 0)}
              hint={t('mentoring.receivedAmount', { amount: vnd(earnings.data?.totalReceived ?? 0) })}
              loading={earnings.isLoading}
            />
          </>
        ) : (
          <>
            <MentoringStatTile
              to="/app/mentoring/requests"
              tone="brand"
              icon={<BookOpen />}
              label={t('mentoring.sentRequests')}
              value={myRequests.data?.totalElements ?? 0}
              hint={t('mentoring.trackMentorResponse')}
              loading={myRequests.isLoading}
            />
            {taskTile}
            <MentoringStatTile
              to="/app/mentoring/refunds"
              tone="gold"
              icon={<RotateCcw />}
              label={t('mentoring.pendingRefunds')}
              value={vnd(refunds.data?.totalProcessing ?? 0)}
              hint={
                account
                  ? t('mentoring.refundAccountReceiving', { bank: account.bankName, last4: account.bankAccountNumber.slice(-4) })
                  : t('mentoring.noBankDeclared')
              }
              loading={refunds.isLoading}
            />
          </>
        )}
      </div>

      {missingRefundAccount && (
        <MentoringActionCard
          tone="gold"
          icon={<ShieldAlert />}
          title={t('mentoring.declareBankTitle')}
          actions={
            <ButtonLink to="/app/mentoring/refunds" size="sm" className="h-8 rounded-lg px-3 text-xs">
              {t('mentoring.declareNow')}
            </ButtonLink>
          }
        >
          {t('mentoring.declareBankDesc')}
        </MentoringActionCard>
      )}

      {payoutAccountInvalid && (
        <MentoringActionCard
          tone="coral"
          icon={<ShieldAlert />}
          title={t('mentoring.payoutAccountPendingTitle')}
          actions={
            <ButtonLink to="/app/mentoring/become-mentor" size="sm" className="h-8 rounded-lg px-3 text-xs">
              {t('mentoring.updateAccount')}
            </ButtonLink>
          }
        >
          {t('mentoring.payoutAccountPendingDesc')}
        </MentoringActionCard>
      )}
    </motion.section>
  )
}

function MentoringHomeContent({ status }: MentoringHomeContentProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'
  const mentorStatus = status?.mentorStatus
  const isMentorActive = mentorStatus === 'ACTIVE'
  const isPaymentPending = mentorStatus === 'PAYMENT_PENDING'
  const isExpired = mentorStatus === 'EXPIRED'

  // Lấy danh sách Mentor thật tiêu biểu từ hệ thống (sắp xếp theo điểm uy tín cao nhất)
  const { data: mentorsData, isLoading: isLoadingMentors } = useMentorSearch({
    page: 0,
    size: 6,
    sortBy: 'reputationScore',
    sortDir: 'desc',
  })
  const topMentors = mentorsData?.content ?? []

  return (
    <div
      className="space-y-6"
    >
      {/* 1. Hero Banner: Tối giản, thanh lịch, gọn gàng */}
      <motion.div
        variants={itemVariants}
        className="mentor-page-header relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-500/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl dark:bg-gold-500/5" />

        <div className="relative z-10 max-w-2xl space-y-2.5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
            {t('mentoring.connectHeroTitle')}
          </h1>

          <p className="text-sm leading-relaxed text-text-muted">
            {isExpired
              ? t('mentoring.expiredPackageDesc')
              : t('mentoring.connectHeroSubtitle')}
          </p>

          {/* Cụm hành động chính tinh gọn, không lặp lại các nút trong sidebar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <ButtonLink
              to="/app/mentoring/discover"
              variant="primary"
              size="sm"
              leftIcon={<Search className="h-4 w-4" />}
              className="shadow-xs font-semibold"
            >
              {t('mentoring.exploreMentors')}
            </ButtonLink>

            {isAlumni ? (
              isMentorActive ? (
                <ButtonLink
                  to="/app/mentoring/become-mentor"
                  variant="outline"
                  size="sm"
                  leftIcon={<UserCheck className="h-4 w-4" />}
                >
                  {t('mentoring.mentorProfile')}
                </ButtonLink>
              ) : isExpired ? (
                <ButtonLink
                  to="/app/mentoring/packages"
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {t('mentoring.renewPackage')}
                </ButtonLink>
              ) : isPaymentPending ? (
                <ButtonLink
                  to="/app/mentoring/subscription?step=checkout"
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {t('mentoring.activatePackage')}
                </ButtonLink>
              ) : !status?.hasMentorProfile ? (
                <ButtonLink
                  to="/app/mentoring/become-mentor"
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {t('mentoring.becomeMentor')}
                </ButtonLink>
              ) : null
            ) : (
              <ButtonLink
                to="/app/mentoring/requests/create"
                variant="outline"
                size="sm"
                leftIcon={<Sparkles className="h-4 w-4 text-primary-solid" />}
              >
                {t('mentoring.createRequest')}
              </ButtonLink>
            )}
          </div>
        </div>
      </motion.div>

      {/* 2. Việc cần làm tiếp theo */}
      <MentoringWorkSummary isMentorActive={isMentorActive} />

      {/* 3. Danh sách Mentor tiêu biểu */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-text">
              {t('mentoring.featuredMentors')}
            </h2>
            <p className="text-xs text-text-subtle">{t('mentoring.featuredMentorsDesc')}</p>
          </div>
          <Link
            to="/app/mentoring/discover"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-solid hover:text-primary-solid transition-colors"
          >
            <span>{t('common.viewAll')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoadingMentors ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-border bg-surface p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full shimmer" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 rounded-md shimmer" />
                    <div className="h-3 w-1/2 rounded-md shimmer" />
                  </div>
                </div>
                <div className="h-10 w-full rounded-md shimmer" />
              </div>
            ))}
          </div>
        ) : topMentors.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {topMentors.map((mentor) => (
              <MentorCard key={mentor.mentorId} mentor={mentor} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border border-border bg-surface/60">
            <p className="text-xs text-text-subtle">{t('mentoring.noFeaturedMentors')}</p>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

/**
 * Trang chủ module Hướng dẫn & Hỗ trợ (Mentorship).
 * Được bảo vệ bởi MentoringTermsGate (source = MENTORING_HOME).
 * Người dùng chỉ có thể vào trang này khi đã chấp nhận phiên bản điều khoản hiện tại.
 */
export function MentoringHomePage() {
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'
  const { data: termsStatus, isLoading: isLoadingTerms } = useMentoringTermsStatus()
  const { data: status, isLoading: isLoadingStatus } = useMentorStatus(isAlumni)

  // Gom chung trạng thái loading ban đầu: Tránh tình trạng flash giật skeleton 2 lần
  const isInitialLoading = isLoadingTerms || (isAlumni && isLoadingStatus)

  return (
    <Container className="py-2 sm:py-4">
      <AnimatePresence mode="wait">
        {isInitialLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <MentorshipLoadingSkeleton variant="home" />
          </motion.div>
        ) : !termsStatus?.accepted ? (
          <motion.div
            key="terms-gate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MentoringTermsGate source="MENTORING_HOME">
              <MentoringHomeContent status={status} />
            </MentoringTermsGate>
          </motion.div>
        ) : (
          <MentoringHomeContent key="home-content" status={status} />
        )}
      </AnimatePresence>
    </Container>
  )
}
