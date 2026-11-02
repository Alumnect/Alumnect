import { lazy, Suspense, type ComponentType } from 'react'
import { Skeleton } from '@/components/ui/primitives'

/** Khung chờ khi tải mã của một trang (giữ nguyên khung ứng dụng, chỉ vùng nội dung hiển thị khung xương). */
function PageFallback() {
  return (
    <div className="mx-auto max-w-4xl space-y-4" role="status" aria-label="Đang tải trang">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  )
}

/** Bọc một component đã lazy bằng Suspense, giữ nguyên props. */
function withSuspense<P extends object>(Lazy: ComponentType<P>) {
  return function LazyPage(props: P) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Lazy {...props} />
      </Suspense>
    )
  }
}

/** Tải trang theo yêu cầu (tách chunk theo route) — trang export theo tên. */
export function lazyPage<K extends string, P extends object = object>(loader: () => Promise<Record<K, ComponentType<P>>>, name: K) {
  return withSuspense<P>(lazy<ComponentType<P>>(() => loader().then((m) => ({ default: m[name] as ComponentType<P> }))))
}

/** Tải trang theo yêu cầu — trang export mặc định. */
export function lazyDefaultPage<P extends object = object>(loader: () => Promise<{ default: ComponentType<P> }>) {
  return withSuspense<P>(lazy(loader))
}
