import { Card, Skeleton } from '@/components/ui/primitives'

type MentorshipLoadingSkeletonProps = {
  variant: 'home' | 'registration' | 'terms'
}

function HeroSkeleton() {
  return (
    <div className="space-y-4 rounded-3xl border border-brand-500/15 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-white/60 p-6 sm:p-8 dark:border-[#393a3b] dark:from-brand-950/30 dark:via-[#242526] dark:to-[#1e1f20]">
      <Skeleton className="h-6 w-40 rounded-full" />
      <Skeleton className="h-10 w-3/4 max-w-xl rounded-xl" />
      <Skeleton className="h-4 w-full max-w-2xl rounded-lg" />
      <Skeleton className="h-4 w-4/5 max-w-xl rounded-lg" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="space-y-6 py-4">
      <HeroSkeleton />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Card key={item} hover={false} className="space-y-3 p-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-60 rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} hover={false} className="space-y-3 p-4">
              <Skeleton className="h-5 w-2/3 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-7 w-full rounded-xl" />
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
        <Card key={item} hover={false} className="space-y-5 p-5 sm:p-6">
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
      <Card hover={false} className="space-y-5 p-5 sm:p-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-44 rounded-full" />
          <Skeleton className="h-8 w-4/5 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
        </div>
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)}
        <Skeleton className="h-11 w-full rounded-xl" />
      </Card>
      <Card hover={false} className="space-y-5 p-4 sm:p-5">
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
    <div aria-busy="true" aria-label="Đang tải nội dung Mentorship">
      {variant === 'home' && <HomeSkeleton />}
      {variant === 'registration' && <RegistrationSkeleton />}
      {variant === 'terms' && <TermsSkeleton />}
    </div>
  )
}
