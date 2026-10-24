import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, MapPin, Search, Bookmark, Building2, Loader2, X, Coins } from 'lucide-react'
import { PageHeader, Card, EmptyState, Avatar } from '@/components/ui'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { useFeed, useToggleSavePost } from '@/features/feed'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { cn } from '@/lib/utils'
import { EntitySelectField, type SelectOption } from '@/features/forum/components/EntitySelectField'

/** Bóc tách tên tỉnh/thành phố chuẩn từ chuỗi địa chỉ để gom nhóm lọc thông minh */
function extractCity(address?: string | null): string {
  if (!address) return ''
  const lower = address.toLowerCase()
  if (lower.includes('hồ chí minh') || lower.includes('hcm') || lower.includes('sài gòn') || lower.includes('saigon')) {
    return 'Thành phố Hồ Chí Minh'
  }
  if (lower.includes('hà nội') || lower.includes('ha noi')) {
    return 'Hà Nội'
  }
  if (lower.includes('đà nẵng') || lower.includes('da nang')) {
    return 'Đà Nẵng'
  }
  if (lower.includes('cần thơ') || lower.includes('can tho')) {
    return 'Cần Thơ'
  }
  if (lower.includes('hải phòng') || lower.includes('hai phong')) {
    return 'Hải Phòng'
  }
  if (lower.includes('bình dương') || lower.includes('binh duong')) {
    return 'Bình Dương'
  }
  if (lower.includes('bình định') || lower.includes('quy nhơn') || lower.includes('binh dinh') || lower.includes('quy nhon')) {
    return 'Bình Định'
  }
  if (lower.includes('huế') || lower.includes('thừa thiên')) {
    return 'Thừa Thiên Huế'
  }
  if (lower.includes('đồng nai') || lower.includes('dong nai')) {
    return 'Đồng Nai'
  }
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length > 0) {
    const last = parts[parts.length - 1]
    return last.replace(/^(thành phố|tỉnh|tp\.?)\s+/i, '').trim() || address
  }
  return address.trim()
}

export function JobsPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const promptLogin = useLoginPrompt((s) => s.open)
  const toggleSave = useToggleSavePost()

  // Fetch recruitment posts from backend
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useFeed('recruitment')
  const posts = data?.pages.flatMap((page) => page.items) || []

  // Danh sách các địa điểm / tỉnh thành tự động bóc tách từ các tin tuyển dụng thực tế
  const locationOptions: SelectOption<string>[] = useMemo(() => {
    const citiesSet = new Set<string>()
    for (const post of posts) {
      if (post.job?.location) {
        const city = extractCity(post.job.location)
        if (city) citiesSet.add(city)
      }
    }
    return Array.from(citiesSet).sort().map((c) => ({ id: c, name: c }))
  }, [posts])

  // Filter jobs based on search inputs
  const kw = keyword.trim().toLowerCase()
  const loc = location.trim().toLowerCase()
  const filteredJobs = posts.filter((post) => {
    const job = post.job
    if (!job) return false

    const matchesKeyword = !kw ||
      (job.title?.toLowerCase().includes(kw)) ||
      (job.company?.toLowerCase().includes(kw)) ||
      (post.author?.toLowerCase().includes(kw)) ||
      (post.text?.toLowerCase().includes(kw))

    const matchesLocation = !loc || (() => {
      const city = extractCity(job.location).toLowerCase()
      return city === loc || (job.location?.toLowerCase().includes(loc) ?? false)
    })()

    return matchesKeyword && matchesLocation
  })

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Thỏa thuận'
    if (min && !max) return `Từ ${min.toLocaleString('vi-VN')} VND`
    if (!min && max) return `Lên đến ${max.toLocaleString('vi-VN')} VND`
    return `Từ ${min?.toLocaleString('vi-VN')} VND đến ${max?.toLocaleString('vi-VN')} VND`
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={<Briefcase size={20} />}
        title="Tuyển dụng việc làm"
        subtitle="Khám phá cơ hội nghề nghiệp dành riêng cho cộng đồng FPTU."
      />

      {/* Search bar đồng bộ dạng dropdown */}
      <Reveal className="overflow-visible relative z-20">
        <Card hover={false} className="mb-6 p-4 overflow-visible relative z-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Chức danh công việc / từ khóa */}
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Chức danh công việc hoặc từ khóa..."
                className="h-11 w-full rounded-xl border border-border bg-surface-2 pl-10 pr-9 text-sm text-text placeholder:text-text-subtle focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
              />
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  aria-label="Xóa từ khóa"
                  className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-text-subtle transition-colors hover:bg-border hover:text-text-muted"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Dropdown chọn Tỉnh / Thành phố */}
            <div className="w-full sm:w-72">
              <EntitySelectField<string>
                items={locationOptions}
                value={location || null}
                onChange={(val) => setLocation(val || '')}
                placeholder="Tất cả địa điểm"
                searchPlaceholder="Tìm tỉnh / thành phố…"
                searchable
                buttonIcon={<MapPin size={15} className="text-primary-solid" />}
              />
            </div>

            {(keyword || location) && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setKeyword('')
                  setLocation('')
                }}
                className="shrink-0"
              >
                Xóa lọc
              </Button>
            )}
          </div>
        </Card>
      </Reveal>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-solid" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Briefcase size={24} />}
          title="Không tải được danh sách việc làm"
          description="Đã xảy ra lỗi khi kết nối tới máy chủ."
          action={<Button size="sm" variant="secondary" onClick={() => window.location.reload()}>Thử lại</Button>}
        />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={24} />}
          title="Không tìm thấy việc làm phù hợp"
          description="Hãy thử đổi từ khóa tìm kiếm hoặc quay lại sau để cập nhật tin tuyển dụng mới."
          action={
            (keyword || location) ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setKeyword('')
                  setLocation('')
                }}
              >
                Xóa tìm kiếm
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Stagger className="space-y-4" gap={0.06}>
          {filteredJobs.map((post) => {
            const job = post.job!
            return (
              <StaggerItem key={post.id}>
                <div
                  onClick={(e) => {
                    // Nếu click vào button hoặc link con (Bookmark, Ứng tuyển, Link profile) thì không chuyển trang
                    if ((e.target as HTMLElement).closest('button, a')) return
                    navigate(`/app/posts/${post.id}`)
                  }}
                  className="group relative rounded-2xl border border-border bg-surface p-5 sm:p-6 transition duration-200 hover:border-orange-300 cursor-pointer dark:hover:border-border-strong"
                >
                  <div className="flex flex-col gap-3.5">
                    {/* Header Row: Company Icon, Job Title, Company Name & Action Buttons on Right */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Job Title & Company */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="bg-surface-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-primary-solid ring-1 ring-orange-200/70 font-bold shadow-xs dark:text-primary-solid dark:ring-border-strong">
                          <Building2 size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base sm:text-lg font-bold text-text group-hover:text-primary-solid transition-colors leading-snug dark:group-hover:text-primary-solid">
                            <span className="text-text-subtle font-semibold">Tuyển dụng: </span>
                            <span className="capitalize">{job.title || 'Chưa cập nhật'}</span>
                          </h2>
                          <p className="mt-0.5 text-sm font-semibold text-text-muted">
                            Công ty: <span className="text-info font-bold">{job.company || 'Chưa cập nhật'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Action buttons (Bookmark + Ứng tuyển) */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!isAuthenticated) {
                              promptLogin('Đăng nhập để lưu tin tuyển dụng.')
                              return
                            }
                            const isSaved = saved[post.id] ?? post.saved
                            const next = !isSaved
                            setSaved((s) => ({ ...s, [post.id]: next }))
                            toggleSave.mutate(
                              { postId: post.id, save: next },
                              {
                                onSuccess: (res) => {
                                  setSaved((s) => ({ ...s, [post.id]: res.saved }))
                                },
                                onError: () => {
                                  setSaved((s) => ({ ...s, [post.id]: !next }))
                                },
                              }
                            )
                          }}
                          className={cn(
                            'grid h-9.5 w-9.5 place-items-center rounded-xl border transition-colors',
                            (saved[post.id] ?? post.saved)
                              ? 'border-orange-200 bg-primary-soft text-primary-solid dark:border-orange-500/40 dark:bg-orange-500/10'
                              : 'border-border text-text-subtle hover:bg-surface-2'
                          )}
                          aria-label="Lưu công việc"
                          title={(saved[post.id] ?? post.saved) ? 'Bỏ lưu tin tuyển dụng' : 'Lưu tin tuyển dụng'}
                        >
                          <Bookmark size={16} className={(saved[post.id] ?? post.saved) ? 'fill-[#F27024]' : ''} />
                        </button>
                        {(job.applyUrl || job.contactEmail) && (
                          <ButtonLink
                            size="md"
                            href={job.applyUrl || (job.contactEmail ? `mailto:${job.contactEmail}` : '#')}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold bg-primary-solid hover:bg-[#d96010] text-on-primary shadow-xs rounded-xl px-4"
                          >
                            Ứng tuyển
                          </ButtonLink>
                        )}
                      </div>
                    </div>

                    {/* Metadata Badges: Salary (Green Pill), Location & Author */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-soft px-3 py-1.5 text-xs font-bold text-success border border-success-border">
                        <Coins size={14} className="text-success shrink-0" />
                        <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                      </span>

                      {job.location && (
                        <span
                          className="inline-flex max-w-full sm:max-w-md items-center gap-1.5 rounded-lg bg-slate-100/90 px-3 py-1.5 text-xs font-medium text-text-muted dark:bg-surface-2 dark:border dark:border-border"
                          title={job.location}
                        >
                          <MapPin size={13} className="text-primary-solid shrink-0" />
                          <span className="truncate">
                            <strong className="text-text">Địa điểm:</strong>{' '}
                            {extractCity(job.location) || job.location}
                          </span>
                        </span>
                      )}

                      <Link
                        to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/90 hover:bg-primary-soft hover:text-primary-solid px-3 py-1.5 text-xs font-medium text-text-muted transition-colors relative z-10 dark:bg-surface-2 dark:border dark:border-border"
                      >
                        <Avatar src={post.avatar} name={post.author} size={18} />
                        <span>Đăng bởi: <strong className="text-text hover:text-primary-solid hover:underline">{post.author}</strong></span>
                      </Link>
                    </div>

                    {/* Description Box */}
                    {post.text && (
                      <div className="rounded-xl bg-surface-2 p-3 border border-border text-xs sm:text-sm text-text-muted line-clamp-2 leading-relaxed">
                        <span className="font-semibold text-text-muted">Mô tả: </span>
                        {post.text}
                      </div>
                    )}
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}

      {hasNextPage && (
        <Reveal>
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm việc làm'}
            </Button>
          </div>
        </Reveal>
      )}
    </div>
  )
}

