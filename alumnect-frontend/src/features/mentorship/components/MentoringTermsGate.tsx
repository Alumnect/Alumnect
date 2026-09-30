import type { ReactNode } from 'react'
import { useMentoringTermsStatus } from '../hooks/useMentoringTerms'
import { MentoringTerms } from './MentoringTerms'
import type { MentoringEntrySource } from '../model/mentoringTermsTypes'
import { Card, Skeleton, Container } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface MentoringTermsGateProps {
  children: ReactNode
  source?: MentoringEntrySource
}

/**
 * Route Guard / Gate kiểm soát quyền truy cập module Mentoring (UC90).
 * Nhiệm vụ:
 * 1. Gọi GET /mentoring/terms/status để kiểm tra trạng thái điều khoản từ Backend.
 * 2. Hiển thị Shimmer Skeleton trong khi đang tải (tránh flash UI).
 * 3. Nếu accepted = true: cho phép kết xuất nội dung bên trong ({children}).
 * 4. Nếu accepted = false: hiển thị giao diện Điều khoản MentoringTerms (UC90).
 * 5. Nếu xảy ra lỗi: hiển thị thông báo lỗi và nút Thử lại, không tự động cho vào.
 */
export function MentoringTermsGate({
  children,
  source = 'MENTORING_HOME',
}: MentoringTermsGateProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useMentoringTermsStatus()

  // 1. Trạng thái Loading: Hiển thị Shimmer Skeleton chuẩn Pastel
  if (isLoading) {
    return (
      <Container className="py-10">
        <Card hover={false} className="mx-auto max-w-4xl space-y-6 border border-plum-900/[0.08] bg-white p-8 dark:bg-[#242526] dark:border-[#393a3b]">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="h-9 w-80 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <div className="space-y-4 rounded-2xl border border-plum-900/[0.05] p-6">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-4/6 rounded-md" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <div className="flex justify-between pt-4">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>
        </Card>
      </Container>
    )
  }

  // 2. Trạng thái Lỗi kết nối / Server Error: Không tự ý mở gate
  if (isError) {
    return (
      <Container className="py-12">
        <Card hover={false} className="mx-auto max-w-md border border-coral-200 bg-white p-8 text-center shadow-soft dark:bg-[#242526] dark:border-coral-900/50">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-100 text-coral-600 dark:bg-coral-950/50 dark:text-coral-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-lg font-bold text-plum-900 dark:text-[#e4e6eb]">
            Không thể kiểm tra trạng thái điều khoản
          </h2>
          <p className="mt-2 text-sm text-plum-600 dark:text-[#b0b3b8]">
            {error?.message || 'Đã có lỗi xảy ra khi xác thực trạng thái điều khoản. Vui lòng thử lại.'}
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={<RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />}
            >
              {isFetching ? 'Đang thử lại...' : 'Thử lại ngay'}
            </Button>
          </div>
        </Card>
      </Container>
    )
  }

  // 3. Nếu người dùng ĐÃ chấp nhận phiên bản điều khoản hiện tại: Cho phép truy cập
  if (data?.accepted) {
    return <>{children}</>
  }

  // 4. Nếu người dùng CHƯA chấp nhận phiên bản điều khoản hiện tại: Hiển thị UC90
  return (
    <div className="w-full h-[calc(100vh-8rem)] min-h-[500px] flex flex-col min-h-0">
      <MentoringTerms source={source} />
    </div>
  )
}
