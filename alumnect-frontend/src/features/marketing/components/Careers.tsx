import { Briefcase, MapPin, ArrowRight } from 'lucide-react'
import { Container, SectionHeading, Badge } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { JOBS } from '@/lib/constants'

export function Careers() {
  return (
    <section id="careers" className="relative scroll-mt-24 py-24">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Careers"
              title={<>Get hired by people <span className="text-gradient">who get you</span></>}
              subtitle="Alumni-trusted recruitment with paid posting packages and priority screening for the FPTU community."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ButtonLink to="/app/jobs" variant="secondary" size="md" rightIcon={<ArrowRight size={16} />}>
              Browse all jobs
            </ButtonLink>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3" gap={0.07}>
          {JOBS.slice(0, 6).map((job) => (
            <StaggerItem key={job.id}>
              <div className="card-surface group h-full rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-plum-900/[0.04] text-2xl ring-1 ring-inset ring-plum-900/10">
                    {job.logo}
                  </span>
                  {job.featured && <Badge tone="gold">Featured</Badge>}
                </div>
                <h3 className="mt-4 text-lg font-bold text-plum-900">{job.title}</h3>
                <p className="text-sm text-plum-500">{job.company}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-plum-400">
                  <MapPin size={13} /> {job.location}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.tags.map((t) => (
                    <span key={t} className="rounded-md bg-plum-900/[0.04] px-2 py-1 text-[11px] font-medium text-plum-500">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-plum-900/8 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600">
                    <Briefcase size={14} /> {job.salary}
                  </span>
                  <span className="text-xs font-semibold text-plum-400">{job.type}</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  )
}
