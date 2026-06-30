import { Container } from '@/components/ui/primitives'
import { Marquee } from '@/components/motion'
import { LOGOS } from '@/lib/constants'

export function TrustBar() {
  return (
    <section className="relative border-y border-plum-900/8 bg-ink-950/50 py-10">
      <Container>
        <p className="mb-7 text-center text-xs font-bold uppercase tracking-[0.25em] text-plum-400">
          FPTU alumni build & lead at
        </p>
      </Container>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-900 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-900 to-transparent" />
        <Marquee speed={32}>
          {LOGOS.map((logo) => (
            <span
              key={logo}
              className="mx-2 whitespace-nowrap text-2xl font-extrabold tracking-tight text-plum-300 transition-colors hover:text-plum-600"
            >
              {logo}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
