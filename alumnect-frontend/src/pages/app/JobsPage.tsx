import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, MapPin, Search, Bookmark, Building2, Loader2 } from 'lucide-react'
import { PageHeader, Card, EmptyState, Avatar } from '@/components/ui'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { useFeed } from '@/features/feed/hooks/useFeed'
import { cn } from '@/lib/utils'

export function JobsPage() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  // Fetch recruitment posts from backend
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useFeed('recruitment')
  const posts = data?.pages.flatMap((page) => page.items) || []

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

    const matchesLocation = !loc ||
      (job.location?.toLowerCase().includes(loc))

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

      {/* search bar */}
      <Reveal>
        <Card hover={false} className="mb-6 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex flex-1 items-center">
              <Search size={17} className="pointer-events-none absolute left-3.5 text-plum-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Chức danh công việc hoặc từ khóa..."
                className="h-11 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-10 pr-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
            <label className="relative flex flex-1 items-center">
              <MapPin size={17} className="pointer-events-none absolute left-3.5 text-plum-400" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Địa điểm (Hà Nội, TP.HCM, Đà Nẵng...)"
                className="h-11 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-10 pr-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
            {(keyword || location) && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setKeyword('')
                  setLocation('')
                }}
              >
                Xóa tìm kiếm
              </Button>
            )}
          </div>
        </Card>
      </Reveal>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
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
                <div className="group relative rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md">
                  <Link to={`/app/posts/${post.id}`} className="absolute inset-0 z-0" aria-label={`Xem chi tiết tin tuyển dụng ${job.title}`} />
                  
                  <div className="relative z-10 flex flex-col gap-3.5">
                    {/* Header Row: Company Icon, Job Title, Company Name & Action Buttons on Right */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Job Title & Company */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 text-[#F27024] ring-1 ring-orange-200/70 font-bold shadow-xs">
                          <Building2 size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#F27024] transition-colors leading-snug">
                            <span className="text-slate-500 font-semibold">Tuyển dụng: </span>
                            <span className="capitalize">{job.title || 'Chưa cập nhật'}</span>
                          </h2>
                          <p className="mt-0.5 text-sm font-semibold text-slate-600">
                            Công ty: <span className="text-[#004F9E] font-bold">{job.company || 'Chưa cập nhật'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Action buttons (Bookmark + Ứng tuyển) */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSaved((s) => ({ ...s, [post.id]: !s[post.id] }))
                          }}
                          className={cn(
                            'grid h-9.5 w-9.5 place-items-center rounded-xl border transition-colors',
                            saved[post.id] ? 'border-orange-200 bg-orange-50 text-[#F27024]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                          )}
                          aria-label="Lưu công việc"
                        >
                          <Bookmark size={16} className={saved[post.id] ? 'fill-[#F27024]' : ''} />
                        </button>
                        {(job.applyUrl || job.contactEmail) && (
                          <ButtonLink
                            size="md"
                            href={job.applyUrl || (job.contactEmail ? `mailto:${job.contactEmail}` : '#')}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold bg-[#F27024] hover:bg-[#d96010] text-white shadow-xs rounded-xl px-4"
                          >
                            Ứng tuyển
                          </ButtonLink>
                        )}
                      </div>
                    </div>

                    {/* Metadata Badges: Salary (Green Pill), Location & Author */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200/70">
                        <span>💰</span>
                        <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                      </span>

                      {job.location && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/90 px-3 py-1.5 text-xs font-medium text-slate-700">
                          <MapPin size={13} className="text-[#F27024] shrink-0" />
                          <span><strong className="text-slate-800">Địa điểm:</strong> {job.location}</span>
                        </span>
                      )}

                      <Link
                        to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/90 hover:bg-orange-50 hover:text-[#F27024] px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors relative z-10"
                      >
                        <Avatar src={post.avatar} name={post.author} size={18} />
                        <span>Đăng bởi: <strong className="text-slate-800 hover:text-[#F27024] hover:underline">{post.author}</strong></span>
                      </Link>
                    </div>

                    {/* Description Box */}
                    {post.text && (
                      <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        <span className="font-semibold text-slate-700">Mô tả: </span>
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

