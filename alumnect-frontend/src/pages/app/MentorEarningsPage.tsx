import { useQuery } from '@tanstack/react-query'
import { Landmark, ShieldAlert } from 'lucide-react'
import { BackLink, ButtonLink, Container } from '@/components/ui'
import { MentorPageHeader, MentoringTermsGate } from '@/features/mentorship'
import { mentoringWalletApi } from '@/features/mentorship/api/mentoringWalletApi'
import { MentoringWalletTable } from '@/features/mentorship/components/MentoringWalletTable'
import { MentoringActionCard } from '@/features/mentorship/components/MentoringUi'

/** Thu nhập Mentoring: thù lao từ các Task đã nghiệm thu và trạng thái chuyển tiền về tài khoản Mentor. */
function MentorEarningsContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['mentoring-wallet', 'earnings'],
    queryFn: mentoringWalletApi.getEarnings,
  })

  return (
    <div className="space-y-5">
      <BackLink to="/app/mentoring">Tổng quan Mentoring</BackLink>
      <MentorPageHeader
        icon={<Landmark className="h-4 w-4" />}
        eyebrow="Dành cho Mentor"
        title="Thu nhập"
        description="Thù lao được chi tự động về tài khoản ngân hàng trong hồ sơ Mentor sau khi Học viên nghiệm thu Task."
      />

      {data?.bankAccountRequired && (
        <MentoringActionCard
          tone="coral"
          icon={<ShieldAlert />}
          title="Có khoản thù lao đang chờ tài khoản nhận tiền"
          actions={
            <ButtonLink to="/app/mentoring/become-mentor" size="sm" className="h-8 rounded-lg px-3 text-xs">
              Cập nhật tài khoản
            </ButtonLink>
          }
        >
          Tài khoản ngân hàng trong hồ sơ Mentor chưa hợp lệ. Hệ thống sẽ chuyển lại sau khi bạn cập nhật.
        </MentoringActionCard>
      )}

      <MentoringWalletTable
        wallet={data}
        isLoading={isLoading}
        counterpartLabel="Học viên"
        emptyTitle="Chưa có khoản thù lao nào"
        emptyDescription="Thù lao sẽ được chi tự động sau khi Học viên nghiệm thu Task."
      />
    </div>
  )
}

export function MentorEarningsPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentorEarningsContent />
      </MentoringTermsGate>
    </Container>
  )
}
