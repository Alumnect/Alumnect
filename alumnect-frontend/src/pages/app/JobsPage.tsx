import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, MapPin, Search, Bookmark, Building2, Clock, Loader2 } from 'lucide-react'
import { PageHeader, Badge, Card, EmptyState, Avatar } from '@/components/ui'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { useFeed } from '@/features/feed/hooks/useFeed'
import { cn } from '@/lib/utils'

const TYPES = ['All roles', 'Remote']

export function JobsPage() {
  const [type, setType] = useState('All roles')
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  // Fetch recruitment posts from backend
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useFeed('recruitment')
  const posts = data?.pages.flatMap((page) => page.items) || []

  // Filter jobs based on selected type
  const filteredJobs = posts.filter((post) => {
    const job = post.job
    if (!job) return false
    
    if (type === 'All roles') return true
    
    // Remote is usually indicated in location
    if (type === 'Remote') {
      return job.location?.toLowerCase().includes('remote')
    }
    
    return true
  })

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Negotiable'
    if (min && !max) return `From ${min.toLocaleString('vi-VN')}₫`
    if (!min && max) return `Up to ${max.toLocaleString('vi-VN')}₫`
    return `${min?.toLocaleString('vi-VN')} - ${max?.toLocaleString('vi-VN')}₫`
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={<Briefcase size={20} />}
        title="Jobs & Recruitment"
        subtitle="Alumni-trusted opportunities with priority screening for the FPTU community."
      />

      {/* search bar */}
      <Reveal>
        <Card hover={false} className="mb-6 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex flex-1 items-center">
              <Search size={17} className="pointer-events-none absolute left-3.5 text-plum-400" />
              <input placeholder="Job title or keyword" className="h-11 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-10 pr-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
            </label>
            <label className="relative flex flex-1 items-center">
              <MapPin size={17} className="pointer-events-none absolute left-3.5 text-plum-400" />
              <input placeholder="Location" className="h-11 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-10 pr-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
            </label>
            <Button size="md" className="lg:w-32">Search</Button>
          </div>
        </Card>
      </Reveal>

      <div className="mb-5 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-all',
              type === t ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Briefcase size={24} />}
          title="Failed to load jobs"
          description="There was an error connecting to the server."
          action={<Button size="sm" variant="secondary" onClick={() => window.location.reload()}>Try again</Button>}
        />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={24} />}
          title="No jobs match this filter"
          description="Try another role type or check back soon for new postings."
          action={<Button size="sm" variant="secondary" onClick={() => setType('All roles')}>Clear filter</Button>}
        />
      ) : (
      <Stagger className="space-y-4" gap={0.06}>
        {filteredJobs.map((post) => {
          const job = post.job!
          return (
            <StaggerItem key={post.id}>
              <Card hover={false} className="transition-all hover:-translate-y-0.5 hover:shadow-glow relative">
                <Link to={`/app/posts/${post.id}`} className="absolute inset-0 z-0" aria-label={`View job ${job.title}`} />
                <div className="relative z-10 p-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-plum-900/[0.04] ring-1 ring-inset ring-plum-900/10 overflow-hidden">
                    <Avatar src={post.avatar} name={post.author} size={56} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/app/posts/${post.id}`} className="hover:underline">
                        <h2 className="text-lg font-bold text-plum-900">{job.title || 'Untitled Job'}</h2>
                      </Link>
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-plum-500">
                      <span className="inline-flex items-center gap-1.5"><Building2 size={13} /> {job.company || 'Unknown Company'}</span>
                      {job.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {job.location}</span>}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-plum-900/[0.04] px-2 py-1 text-[11px] font-medium text-plum-500">
                        Posted by {post.author}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                    <span className="text-sm font-bold text-brand-600">
                      {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSaved((s) => ({ ...s, [post.id]: !s[post.id] }))
                        }}
                        className={cn('grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset ring-plum-900/10 transition-colors', saved[post.id] ? 'bg-brand-500/20 text-brand-600' : 'text-plum-400 hover:bg-plum-900/[0.04]')}
                        aria-label="Save job"
                      >
                        <Bookmark size={17} className={saved[post.id] ? 'fill-brand-300' : ''} />
                      </button>
                      {(job.applyUrl || job.contactEmail) && (
                        <ButtonLink
                          size="sm"
                          href={job.applyUrl || (job.contactEmail ? `mailto:${job.contactEmail}` : '#')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Apply
                        </ButtonLink>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
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
              {isFetchingNextPage ? 'Loading...' : 'Load more jobs'}
            </Button>
          </div>
        </Reveal>
      )}
    </div>
  )
}

