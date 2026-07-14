import { Quote } from 'lucide-react'
import { Container, SectionHeading, Avatar } from '@/components/ui/primitives'
import { Reveal, Marquee } from '@/components/motion'
import { TESTIMONIALS } from '@/lib/constants'

function Card({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <figure className="mx-2 w-[22rem] shrink-0 rounded-2xl card-surface p-6">
      <Quote className="text-brand-400/60" size={26} />
      <blockquote className="mt-3 text-sm leading-relaxed text-plum-700">“{t.quote}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-plum-900/8 pt-4">
        <Avatar src={t.avatar} name={t.name} size={40} />
        <div>
          <p className="text-sm font-bold text-plum-900">{t.name}</p>
          <p className="text-xs text-plum-400">{t.role}</p>
        </div>
      </figcaption>
    </figure>
  )
}

export function Testimonials() {
  const row1 = TESTIMONIALS
  const row2 = [...TESTIMONIALS].reverse()

  return (
    <section className="relative overflow-hidden py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Loved by alumni"
            title={<>The community <span className="text-gradient">keeps coming back</span></>}
            subtitle="Real stories from graduates who found jobs, mentors and lifelong connections."
          />
        </Reveal>
      </Container>

      <div className="relative mt-14 space-y-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#faf4ec] to-transparent sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#faf4ec] to-transparent sm:w-40" />
        <Marquee speed={44}>
          {row1.map((t, i) => (
            <Card key={`a-${i}`} t={t} />
          ))}
        </Marquee>
        <Marquee speed={44} reverse>
          {row2.map((t, i) => (
            <Card key={`b-${i}`} t={t} />
          ))}
        </Marquee>
      </div>
    </section>
  )
}
