import { ArrowRight, Sparkles } from 'lucide-react'
import { Container, Badge } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal, Magnetic, Starfield } from '@/components/motion'

export function FinalCTA() {
  return (
    <section className="relative py-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.4rem] px-6 py-20 text-center shadow-soft ring-1 ring-inset ring-plum-900/10">
            {/* animated gradient bg */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-500 via-violet-500 to-coral-500 bg-[length:200%_200%] animate-gradient" />
            <div className="absolute inset-0 -z-10 opacity-50">
              <Starfield count={18} />
            </div>
            <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-white/20 blur-[100px]" />

            <Badge tone="gold" icon={<Sparkles size={13} />} className="mx-auto">
              Free to join · Verified in minutes
            </Badge>
            <h2 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Your network is waiting. <br className="hidden sm:block" />
              Come home to AlumNect.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-white/85">
              Join 24,800+ verified FPTU graduates and students building the future together.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Magnetic>
                <ButtonLink to="/register" variant="gold" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Create your account
                </ButtonLink>
              </Magnetic>
              <ButtonLink to="/login" variant="glass" size="lg">
                I already have one
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
