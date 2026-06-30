import { Container } from '@/components/ui/primitives'
import { Counter, Reveal } from '@/components/motion'
import { STATS } from '@/lib/constants'

export function StatsBand() {
  return (
    <section className="relative py-10">
      <Container>
        <Reveal>
          <div className="ring-gradient relative overflow-hidden rounded-3xl card-surface px-6 py-12">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.25]" />
            <div className="pointer-events-none absolute -left-20 top-0 h-60 w-60 rounded-full bg-brand-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-violet-600/20 blur-3xl" />
            <dl className="relative grid grid-cols-2 gap-8 lg:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <dt className="text-4xl font-extrabold text-plum-900 sm:text-5xl">
                    <Counter value={s.value} suffix={s.suffix} compactFmt={s.value > 9999} />
                  </dt>
                  <dd className="mt-2 text-sm font-medium text-plum-500">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
