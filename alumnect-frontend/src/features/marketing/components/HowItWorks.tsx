import { Container, SectionHeading } from '@/components/ui/primitives'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { STEPS } from '@/lib/constants'

export function HowItWorks() {
  return (
    <section className="relative py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Get started"
            title={<>Verified in <span className="text-gradient">three steps</span></>}
            subtitle="Identity verification keeps the community authentic — and it only takes a few minutes."
          />
        </Reveal>

        <Stagger className="relative mt-16 grid gap-8 md:grid-cols-3" gap={0.12}>
          {/* connecting line */}
          <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent md:block" />
          {STEPS.map((s) => (
            <StaggerItem key={s.n}>
              <div className="relative text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl card-surface text-2xl font-extrabold text-gradient ring-1 ring-inset ring-plum-900/10">
                  {s.n}
                </div>
                <h3 className="mt-6 text-xl font-bold text-plum-900">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-plum-500">{s.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  )
}
