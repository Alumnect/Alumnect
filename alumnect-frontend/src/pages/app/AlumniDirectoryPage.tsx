import { useState } from 'react'
import { Search, Users, MapPin, SlidersHorizontal } from 'lucide-react'
import { PageHeader, Avatar, Badge, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Stagger, StaggerItem, TiltCard } from '@/components/motion'
import { ALUMNI } from '@/lib/constants'
import { compact, cn } from '@/lib/utils'

const FILTERS = ['All', 'Software', 'Product', 'Design', 'Data', 'Business']

export function AlumniDirectoryPage() {
  const [active, setActive] = useState('All')

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={<Users size={20} />}
        title="Alumni Directory"
        subtitle="Search and connect with verified FPTU graduates and students."
        actions={<Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal size={15} />}>Filters</Button>}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex flex-1 items-center">
          <Search size={17} className="pointer-events-none absolute left-3.5 text-plum-400" />
          <input
            placeholder="Search by name, skill, company or cohort…"
            className="h-12 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-10 pr-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-all',
                active === f ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
        {ALUMNI.map((a) => (
          <StaggerItem key={a.id}>
            <TiltCard className="group h-full" max={7}>
              <Card hover={false} className="h-full p-5 text-center">
                <Avatar src={a.avatar} name={a.name} size={76} verified={a.verified} ring className="mx-auto" />
                <h3 className="mt-4 font-bold text-plum-900">{a.name}</h3>
                <p className="text-sm text-plum-500">{a.role}</p>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-plum-400">
                  <MapPin size={12} /> {a.cohort}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {a.skills.map((s) => (
                    <span key={s} className="rounded-md bg-plum-900/[0.04] px-2 py-1 text-[11px] font-medium text-plum-500">{s}</span>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <Button size="sm" variant="primary" className="flex-1">Follow</Button>
                  <Button size="sm" variant="secondary" className="flex-1">Message</Button>
                </div>
                <p className="mt-3 text-xs text-plum-400">{compact(a.followers)} followers</p>
              </Card>
            </TiltCard>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-8 flex justify-center">
        <Button variant="outline" size="md">Load more alumni</Button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <Badge tone="brand">Tip</Badge>
        <span className="text-xs text-plum-400">Connection suggestions are based on your major and cohort.</span>
      </div>
    </div>
  )
}
