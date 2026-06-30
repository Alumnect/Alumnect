import { Route, ArrowRight, TrendingUp } from 'lucide-react'
import { PageHeader, Badge, Card } from '@/components/ui'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { CAREER_PATH } from '@/lib/constants'

export function CareerPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={<Route size={20} />}
        title="Career Paths"
        subtitle="Visualise the real journeys FPTU graduates took to reach their roles."
      />

      <Reveal>
        <Card hover={false} className="mb-6 p-6">
          <div className="flex items-center gap-2 text-sm text-plum-500">
            <TrendingUp size={16} className="text-brand-600" />
            Based on <span className="font-bold text-plum-900">12,400+</span> verified alumni timelines in
            <span className="font-bold text-plum-900"> Software Engineering</span>.
          </div>
        </Card>
      </Reveal>

      {/* funnel */}
      <Stagger className="space-y-4" gap={0.1}>
        {CAREER_PATH.map((s, i) => (
          <StaggerItem key={s.stage}>
            <div className="relative">
              <Card hover={false} className="overflow-hidden p-6">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-600/25 to-violet-600/10"
                  style={{ width: `${s.share}%` }}
                />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-plum-900/[0.06] text-sm font-extrabold text-plum-900">{i + 1}</span>
                      <div>
                        <h3 className="font-bold text-plum-900">{s.stage}</h3>
                        <p className="text-xs text-plum-400">{s.years}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.roles.map((r) => (
                        <span key={r} className="rounded-lg bg-plum-900/[0.05] px-3 py-1 text-sm font-medium text-plum-700">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-gradient">{s.share}%</p>
                    <p className="text-xs text-plum-400">reach this stage</p>
                  </div>
                </div>
              </Card>
              {i < CAREER_PATH.length - 1 && (
                <div className="flex justify-center py-1 text-plum-300">
                  <ArrowRight className="rotate-90" size={18} />
                </div>
              )}
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-6 flex items-center justify-center gap-2">
        <Badge tone="brand">Insight</Badge>
        <span className="text-xs text-plum-400">Filter by industry, position and timeline to explore other paths.</span>
      </div>
    </div>
  )
}
