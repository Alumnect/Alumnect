import { Users, ArrowRight } from 'lucide-react'
import { Container, SectionHeading, Badge } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal, Parallax } from '@/components/motion'
import { EVENTS } from '@/lib/constants'
import { compact } from '@/lib/utils'

export function Events() {
  const [feature, ...rest] = EVENTS

  return (
    <section id="events" className="relative scroll-mt-24 py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Events"
            title={<>Reunions, talks & meetups <span className="text-gradient">worth showing up for</span></>}
            subtitle="Create events, RSVP in a tap, and never miss a homecoming with smart reminders."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* feature event */}
          <Parallax speed={-30}>
            <Reveal>
              <div className="group relative h-full min-h-[22rem] overflow-hidden rounded-[2rem] ring-1 ring-inset ring-plum-900/10 shadow-soft">
                <img
                  src={feature.cover}
                  alt={feature.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-plum-900/90 via-plum-900/35 to-transparent" />
                <div className="absolute left-5 top-5 flex flex-col items-center rounded-2xl glass-strong px-4 py-2 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold-600">{feature.month}</span>
                  <span className="text-2xl font-extrabold text-plum-900">{feature.day}</span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge tone="gold">{feature.tag}</Badge>
                  <h3 className="mt-3 text-2xl font-extrabold text-white">{feature.title}</h3>
                  <p className="mt-1 text-sm text-white/80">{feature.location}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-white/90">
                    <Users size={16} /> {compact(feature.attendees)} attending
                  </div>
                </div>
              </div>
            </Reveal>
          </Parallax>

          {/* list */}
          <div className="flex flex-col gap-4">
            {rest.map((e, i) => (
              <Reveal key={e.id} delay={i * 0.1} direction="left">
                <div className="card-surface flex items-center gap-4 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow">
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-brand-100 py-2 text-center ring-1 ring-inset ring-brand-300/40">
                    <span className="text-[10px] font-bold uppercase text-brand-600">{e.month}</span>
                    <span className="text-xl font-extrabold text-plum-900">{e.day}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Badge tone="violet" className="mb-1.5 px-2 py-0.5 text-[10px]">{e.tag}</Badge>
                    <h4 className="truncate font-bold text-plum-900">{e.title}</h4>
                    <p className="truncate text-xs text-plum-500">{e.location} · {compact(e.attendees)} going</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.3}>
              <ButtonLink to="/app/events" variant="outline" size="md" className="mt-1 w-full" rightIcon={<ArrowRight size={16} />}>
                See all events
              </ButtonLink>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
