import { useState } from 'react'
import { Map as MapIcon, Filter } from 'lucide-react'
import { PageHeader, Badge, Card } from '@/components/ui'
import { Reveal } from '@/components/motion'
import { WorldMap } from '@/components/viz/WorldMap'
import { MAP_MARKERS } from '@/lib/constants'
import { compact, cn } from '@/lib/utils'

const COHORTS = ['All cohorts', 'K11–K13', 'K14–K16', 'K17+']

export function MapPage() {
  const [cohort, setCohort] = useState('All cohorts')
  const sorted = [...MAP_MARKERS].sort((a, b) => b.count - a.count)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={<MapIcon size={20} />}
        title="Alumni Map"
        subtitle="See where the FPTU network lives and works across the globe."
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter size={15} className="text-plum-400" />
        {COHORTS.map((c) => (
          <button
            key={c}
            onClick={() => setCohort(c)}
            className={cn('rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all', cohort === c ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]')}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Reveal>
          <div className="ring-gradient rounded-3xl p-2">
            <WorldMap />
          </div>
        </Reveal>

        <Reveal direction="left">
          <Card hover={false} className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-plum-900">Top hubs</h3>
              <Badge tone="aqua">Live</Badge>
            </div>
            <ul className="space-y-3">
              {sorted.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-plum-900/[0.04] text-xs font-bold text-plum-500">{i + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-plum-900">{m.city}</span>
                  <span className="text-sm font-bold text-brand-600">{compact(m.count)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>
    </div>
  )
}
