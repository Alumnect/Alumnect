import { LineChart, ShieldCheck, ArrowRight } from 'lucide-react'
import { Container, SectionHeading, Badge } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { SALARY } from '@/lib/constants'

export function Insights() {
  const max = Math.max(...SALARY.map((s) => s.p75))

  return (
    <section id="insights" className="relative scroll-mt-24 py-24">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* chart card */}
          <Reveal direction="right">
            <div className="ring-gradient relative overflow-hidden rounded-3xl card-surface p-7">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-600/20 blur-3xl" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-plum-500">Median salary by role</p>
                  <p className="text-xs text-plum-400">million VND / month · anonymous & aggregated</p>
                </div>
                <Badge tone="success" icon={<ShieldCheck size={13} />}>Anonymous</Badge>
              </div>

              <div className="mt-7 space-y-4">
                {SALARY.map((s, i) => (
                  <div key={`${s.role}-${s.level}`}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-plum-700">{s.role} <span className="text-plum-400">· {s.level}</span></span>
                      <span className="font-bold text-brand-600">{s.median}M</span>
                    </div>
                    <div className="relative h-2.5 overflow-hidden rounded-full bg-plum-900/[0.04]">
                      <Reveal direction="none" delay={i * 0.08} blur={false}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                          style={{ width: `${(s.median / max) * 100}%` }}
                        />
                      </Reveal>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* copy */}
          <div>
            <Reveal>
              <Badge tone="brand" icon={<LineChart size={13} />}>Insights</Badge>
              <SectionHeading
                align="left"
                className="mt-4"
                title={<>Know your worth with <span className="text-gradient">real data</span></>}
                subtitle="Anonymous, aggregated salary contributions from verified alumni — filter by role, industry and region to benchmark with confidence."
              />
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-7 grid grid-cols-3 gap-4">
                {[
                  { k: '6,400+', v: 'data points' },
                  { k: '40+', v: 'roles tracked' },
                  { k: '100%', v: 'anonymous' },
                ].map((x) => (
                  <div key={x.v} className="rounded-2xl bg-plum-900/[0.04] p-4 text-center ring-1 ring-inset ring-plum-900/10">
                    <p className="text-2xl font-extrabold text-plum-900">{x.k}</p>
                    <p className="mt-1 text-xs text-plum-400">{x.v}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.25}>
              <ButtonLink to="/app/salary" variant="secondary" size="md" className="mt-7" rightIcon={<ArrowRight size={16} />}>
                Open the Salary Board
              </ButtonLink>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
