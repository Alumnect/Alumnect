import { useState } from 'react'
import { LineChart, ShieldCheck, Plus, Filter } from 'lucide-react'
import { PageHeader, Badge, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem, Counter } from '@/components/motion'
import { SALARY } from '@/lib/constants'
import { cn } from '@/lib/utils'

const REGIONS = ['All regions', 'HCMC', 'Hà Nội', 'Đà Nẵng', 'Remote']

export function SalaryPage() {
  const [region, setRegion] = useState('All regions')
  const max = Math.max(...SALARY.map((s) => s.p75))

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={<LineChart size={20} />}
        title="Salary Board"
        subtitle="Anonymous, aggregated salary insight from verified alumni."
        actions={<Button variant="gold" size="sm" leftIcon={<Plus size={15} />}>Contribute</Button>}
      />

      <Reveal>
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { k: 6400, s: '+', v: 'Data points' },
            { k: 40, s: '+', v: 'Roles tracked' },
            { k: 32, s: 'M', v: 'Median (VND)' },
            { k: 100, s: '%', v: 'Anonymous' },
          ].map((x) => (
            <Card key={x.v} hover={false} className="p-4 text-center">
              <p className="text-2xl font-extrabold text-plum-900"><Counter value={x.k} suffix={x.s} /></p>
              <p className="mt-1 text-xs text-plum-400">{x.v}</p>
            </Card>
          ))}
        </div>
      </Reveal>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter size={15} className="text-plum-400" />
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={cn('rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all', region === r ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]')}
          >
            {r}
          </button>
        ))}
      </div>

      <Reveal>
        <Card hover={false} className="overflow-hidden p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-plum-900">Salary ranges by role <span className="text-plum-400">(M VND / month)</span></h2>
            <Badge tone="success" icon={<ShieldCheck size={13} />}>Anonymous</Badge>
          </div>

          <Stagger className="space-y-5" gap={0.07}>
            {SALARY.map((s) => (
              <StaggerItem key={`${s.role}-${s.level}-${s.region}`}>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-plum-900">
                      {s.role} <span className="text-plum-400">· {s.level} · {s.region}</span>
                    </span>
                    <span className="text-plum-400">{s.samples} samples</span>
                  </div>
                  {/* range bar: p25 — median — p75 */}
                  <div className="relative h-7 rounded-full bg-plum-900/[0.04]">
                    <div
                      className="absolute top-0 h-full rounded-full bg-gradient-to-r from-brand-600/40 to-violet-600/40"
                      style={{ left: `${(s.p25 / max) * 100}%`, width: `${((s.p75 - s.p25) / max) * 100}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-7 w-1.5 -translate-y-1/2 rounded-full bg-gold-400 shadow-glow-gold"
                      style={{ left: `${(s.median / max) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-[11px] font-semibold">
                      <span className="text-plum-500">{s.p25}M</span>
                      <span className="text-gold-600">median {s.median}M</span>
                      <span className="text-plum-500">{s.p75}M</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Card>
      </Reveal>

      <p className="mt-4 text-center text-xs text-plum-400">
        Statistics are shown only once the minimum-contribution threshold is met. Your identity is never linked to any record.
      </p>
    </div>
  )
}
