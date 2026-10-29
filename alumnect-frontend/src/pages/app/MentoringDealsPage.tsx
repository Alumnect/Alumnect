import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Handshake, RefreshCw } from 'lucide-react'
import { Button, ButtonLink, Container, EmptyState, Pagination, FadeSwitch } from '@/components/ui'
import {
  MentoringTermsGate,
  MentorPageHeader,
  MentoringDealCard,
  MentoringDealActionModal,
  useMyDeals,
  type MentoringDeal,
  type MentoringDealStatus,
} from '@/features/mentorship'
import { MentoringFilterTabs, type MentoringFilterOption } from '@/features/mentorship/components/MentoringUi'

type DealFilter = 'ALL' | MentoringDealStatus

/**
 * Danh sách thỏa thuận Mentoring (UC104 & UC105).
 * Thỏa thuận luôn thuộc phần trao đổi của một Request: trang này chỉ liệt kê và dẫn tới đó, không tạo thỏa thuận độc lập.
 */
function MentoringDealsContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<DealFilter>('ALL')
  const [page, setPage] = useState(0)
  const [selectedDeal, setSelectedDeal] = useState<MentoringDeal | null>(null)

  const dealTabs: MentoringFilterOption<DealFilter>[] = [
    { value: 'ALL', label: t('mentoring.allFilter') },
    { value: 'DEAL_CONFIRMED', label: t('mentoring.dealConfirmedFilter') },
    { value: 'CANCELLED', label: t('mentoring.dealCancelledFilter') },
  ]

  const { data: pageData, isLoading, isError, error, refetch, isFetching } = useMyDeals(
    filter === 'ALL' ? undefined : filter,
    page,
    9,
  )
  const deals = pageData?.content || []
  const totalPages = pageData?.totalPages || 0

  const handleOpenChat = (deal: MentoringDeal) => {
    if (deal.conversationId) navigate(`/app/mentoring/chats/${deal.conversationId}`)
  }

  return (
    <div className="space-y-5">
      <MentorPageHeader
        icon={<Handshake className="h-4 w-4" />}
        eyebrow={t('mentoring.dealsEyebrow')}
        title={t('mentoring.dealsPageTitle')}
        description={t('mentoring.dealsPageDesc')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />}
          >
            {t('mentoring.refreshBtn')}
          </Button>
        }
      />

      <MentoringFilterTabs
        ariaLabel={t('mentoring.dealsFilterAria')}
        options={dealTabs}
        value={filter}
        onChange={(v) => {
          setFilter(v)
          setPage(0)
        }}
      />

      <FadeSwitch id={filter}>
{isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-surface-2 dark:bg-white/[0.04]" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Handshake className="h-6 w-6" />}
          title={t('mentoring.cannotLoadDealsTitle')}
          description={error?.message || t('mentoring.dealsDefaultError')}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={<Handshake className="h-6 w-6" />}
          title={t('mentoring.noDealsTitle')}
          description={
            filter !== 'ALL'
              ? t('mentoring.noDealsInStatus')
              : t('mentoring.noDealsGeneralDesc')
          }
          action={
            <ButtonLink to="/app/mentoring/requests" size="sm" variant="outline" leftIcon={<BookOpen className="h-4 w-4" />}>
              {t('mentoring.myRequestsNav')}
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {deals.map((deal) => (
              <MentoringDealCard key={deal.id} deal={deal} onViewDetail={setSelectedDeal} onOpenChat={handleOpenChat} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
</FadeSwitch>

      {selectedDeal && (
        <MentoringDealActionModal
          isOpen
          onClose={() => {
            setSelectedDeal(null)
            refetch()
          }}
          dealId={selectedDeal.id}
        />
      )}
    </div>
  )
}

/**
 * Trang quản lý Thỏa thuận Mentoring Deals (UC104).
 */
export function MentoringDealsPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentoringDealsContent />
      </MentoringTermsGate>
    </Container>
  )
}

