import { motion } from 'framer-motion'
import { Card, Skeleton } from '@/components/ui/primitives'

type MentorshipLoadingSkeletonProps = {
  variant: 'home' | 'registration' | 'terms'
}

function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-white/40 p-6 sm:p-8 shadow-xs dark:bg-[#242526] dark:border-[#393a3b] dark:from-brand-950/20">
      {/* Hiệu ứng hào quang nền mờ */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-500/5" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl dark:bg-gold-500/5" />

      <div className="relative z-10 max-w-2xl space-y-3">
        {/* Hàng nhãn Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="h-6 w-44 rounded-full" />
        </div>

        {/* Tiêu đề chính */}
        <Skeleton className="h-8 w-3/4 max-w-lg rounded-xl" />

        {/* Mô tả phụ */}
        <div className="space-y-1.5 pt-0.5">
          <Skeleton className="h-4 w-full max-w-2xl rounded-lg" />
          <Skeleton className="h-4 w-4/5 max-w-xl rounded-lg" />
        </div>

        {/* Hàng nút bấm hành động */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-8 w-36 rounded-xl" />
          <Skeleton className="h-8 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="space-y-6 py-4">
      <HeroSkeleton />

      {/* 3 Thẻ Lợi ích cốt lõi */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Card key={item} hover={false} className="space-y-3 p-5 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-44 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-5/6 rounded-md" />
            </div>
          </Card>
        ))}
      </div>

      {/* Danh sách Mentor Tiêu biểu */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-56 rounded-lg" />
          <Skeleton className="h-3 w-40 rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} hover={false} className="space-y-2.5 p-4 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-52 rounded-md" />
                </div>
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <Skeleton className="h-3 w-40 rounded-md" />
              <div className="flex gap-1.5 pt-0.5">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function RegistrationSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <HeroSkeleton />
      {[1, 2, 3].map((item) => (
        <Card key={item} hover={false} className="space-y-5 p-5 sm:p-6 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
          <div className="flex items-center gap-3 border-b border-plum-900/[0.07] pb-4 dark:border-[#393a3b]">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-44 rounded-lg" />
              <Skeleton className="h-3 w-64 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((field) => <Skeleton key={field} className="h-16 rounded-2xl" />)}
          </div>
        </Card>
      ))}
    </div>
  )
}

function TermsSkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(18rem,25.625rem)_minmax(0,1fr)]">
      <Card hover={false} className="space-y-5 p-5 sm:p-6 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
        <div className="space-y-3">
          <Skeleton className="h-6 w-44 rounded-full" />
          <Skeleton className="h-8 w-4/5 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
        </div>
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)}
        <Skeleton className="h-11 w-full rounded-xl" />
      </Card>
      <Card hover={false} className="space-y-5 p-4 sm:p-5 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
        <Skeleton className="h-12 w-full rounded-2xl" />
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="space-y-3">
            <Skeleton className="h-5 w-2/5 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-11/12 rounded-lg" />
          </div>
        ))}
      </Card>
    </div>
  )
}

export function MentorshipLoadingSkeleton({ variant }: MentorshipLoadingSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      aria-busy="true"
      aria-label="Đang tải nội dung Mentorship"
    >
      {variant === 'home' && <HomeSkeleton />}
      {variant === 'registration' && <RegistrationSkeleton />}
      {variant === 'terms' && <TermsSkeleton />}
    </motion.div>
  )
}
