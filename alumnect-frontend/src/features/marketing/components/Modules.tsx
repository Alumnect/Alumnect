import { Container, SectionHeading } from '@/components/ui/primitives'
import { Reveal, Stagger, StaggerItem, TiltCard } from '@/components/motion'
import { MODULES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const TONE_RING: Record<string, string> = {
  brand: 'from-brand-500/25 text-brand-600',
  gold: 'from-gold-400/25 text-gold-600',
  aqua: 'from-aqua-500/25 text-aqua-500',
  violet: 'from-violet-500/25 text-violet-600',
}

export function Modules() {
  return (
    <section id="platform" className="relative scroll-mt-24 py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="One platform"
            title={<>Everything the alumni community needs, <span className="text-gradient">in one home</span></>}
            subtitle="Eight tightly-integrated modules replace scattered Facebook groups, Zalo lists and emails with a single verified experience."
          />
        </Reveal>

        <Stagger className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
          {MODULES.map((m) => {
            const Icon = m.icon
            return (
              <StaggerItem key={m.key}>
                <TiltCard className="card-surface group h-full rounded-2xl p-6" max={8}>
                  <span
                    className={cn(
                      'grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br to-transparent ring-1 ring-inset ring-plum-900/10 transition-transform duration-300 group-hover:scale-110',
                      TONE_RING[m.tone],
                    )}
                  >
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-plum-900">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-plum-500">{m.desc}</p>
                </TiltCard>
              </StaggerItem>
            )
          })}
        </Stagger>
      </Container>
    </section>
  )
}
