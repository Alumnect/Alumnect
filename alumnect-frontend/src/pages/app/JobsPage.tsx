import { useState } from 'react'
import { Briefcase, MapPin, Search, Bookmark, Building2, Clock } from 'lucide-react'
import { PageHeader, Badge, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { JOBS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const TYPES = ['All roles', 'Full-time', 'Internship', 'Remote']

export function JobsPage() {
  const [type, setType] = useState('All roles')
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={<Briefcase size={20} />}
        title="Jobs & Recruitment"
        subtitle="Alumni-trusted opportunities with priority screening for the FPTU community."
        actions={<Button variant="gold" size="sm">Post a job</Button>}
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

      <Stagger className="space-y-4" gap={0.06}>
        {JOBS.map((job) => (
          <StaggerItem key={job.id}>
            <Card hover={false} className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-glow">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-plum-900/[0.04] text-3xl ring-1 ring-inset ring-plum-900/10">
                  {job.logo}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-plum-900">{job.title}</h3>
                    {job.featured && <Badge tone="gold">Featured</Badge>}
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-plum-500">
                    <span className="inline-flex items-center gap-1.5"><Building2 size={13} /> {job.company}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {job.location}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {job.type}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.tags.map((t) => (
                      <span key={t} className="rounded-md bg-plum-900/[0.04] px-2 py-1 text-[11px] font-medium text-plum-500">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  <span className="text-sm font-bold text-brand-600">{job.salary}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSaved((s) => ({ ...s, [job.id]: !s[job.id] }))}
                      className={cn('grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset ring-plum-900/10 transition-colors', saved[job.id] ? 'bg-brand-500/20 text-brand-600' : 'text-plum-400 hover:bg-plum-900/[0.04]')}
                      aria-label="Save job"
                    >
                      <Bookmark size={17} className={saved[job.id] ? 'fill-brand-300' : ''} />
                    </button>
                    <Button size="sm">Apply</Button>
                  </div>
                </div>
              </div>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}
