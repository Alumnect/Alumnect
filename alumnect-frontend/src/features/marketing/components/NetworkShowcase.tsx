import { Users, MapPin, BadgeCheck, Sparkles } from 'lucide-react'
import { Container, SectionHeading, Badge } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal, Parallax } from '@/components/motion'
import { WorldMap } from '@/components/viz/WorldMap'

const POINTS = [
  { icon: BadgeCheck, title: 'Every member verified', desc: 'Admin-reviewed FPTU proof earns the verified badge — you always know who is real.' },
  { icon: MapPin, title: 'A network you can see', desc: 'An interactive map shows where alumni live and work, from Đà Nẵng to San Francisco.' },
  { icon: Sparkles, title: 'Smart suggestions', desc: 'Discover alumni from your major and cohort, and grow your circle naturally.' },
]

export function NetworkShowcase() {
  return (
    <section id="network" className="relative scroll-mt-24 overflow-hidden py-24">
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-aqua-500/10 blur-[120px]" />
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Reveal>
              <Badge tone="aqua" icon={<Users size={13} />}>The network</Badge>
              <SectionHeading
                align="left"
                className="mt-4"
                title={<>A global FPTU family, <span className="text-gradient-cool">verified & visible</span></>}
                subtitle="See the community come alive on a living map and connect with people you can trust."
              />
            </Reveal>

            <div className="mt-8 space-y-5">
              {POINTS.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.1} direction="left">
                  <div className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-plum-900/[0.04] text-aqua-500 ring-1 ring-inset ring-plum-900/10">
                      <p.icon size={20} />
                    </span>
                    <div>
                      <h4 className="font-bold text-plum-900">{p.title}</h4>
                      <p className="mt-1 text-sm text-plum-500">{p.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2}>
              <ButtonLink to="/app/map" variant="secondary" size="md" className="mt-8">
                Open the Alumni Map
              </ButtonLink>
            </Reveal>
          </div>

          <Parallax speed={-46}>
            <Reveal direction="right">
              <div className="ring-gradient rounded-3xl p-2">
                <WorldMap />
              </div>
            </Reveal>
          </Parallax>
        </div>
      </Container>
    </section>
  )
}
