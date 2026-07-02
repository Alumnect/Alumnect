import {
  MapPin,
  Briefcase,
  GraduationCap,
  Link2,
  Settings,
  UserPlus,
  MessageCircle,
  BadgeCheck,
  Calendar,
} from 'lucide-react'
import { Avatar, Badge, Card, SmartImage } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Counter } from '@/components/motion'
import { compact } from '@/lib/utils'

const TIMELINE = [
  { role: 'Senior Software Engineer', org: 'FPT Software', period: '2024 — Present', current: true },
  { role: 'Software Engineer', org: 'KMS Technology', period: '2021 — 2024', current: false },
  { role: 'Frontend Intern', org: 'Axon Active', period: '2020 — 2021', current: false },
  { role: 'B.Sc. Software Engineering', org: 'FPT University', period: '2016 — 2020', current: false },
]

const SKILLS = ['React', 'TypeScript', 'Node.js', 'AWS', 'System Design', 'GraphQL', 'Tailwind', 'Leadership']

export function ProfilePage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* cover */}
      <Reveal>
        <div className="relative h-48 overflow-hidden rounded-3xl sm:h-60">
          <SmartImage
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1600&auto=format&fit=crop"
            alt="Profile cover"
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-plum-900/40 to-transparent" />
          <Button size="sm" variant="glass" className="absolute right-4 top-4" leftIcon={<Settings size={15} />}>
            Edit profile
          </Button>
        </div>
      </Reveal>

      {/* header */}
      <div className="relative -mt-16 px-4 sm:px-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar src="https://i.pravatar.cc/200?img=12" name="Trần Minh Anh" size={120} verified ring />
            <div className="pb-2">
              {/*
                Tên hiển thị: dùng leading-[1.35] + pt-1 để chừa khoảng trên cho
                dấu tiếng Việt xếp tầng (vd chữ "ầ" = mũ + huyền). Nếu để line-height
                mặc định chật của text-3xl, phần dấu phía trên sẽ bị cắt.
              */}
              <h1 className="flex items-center gap-2 pt-1 text-2xl font-extrabold leading-[1.35] text-plum-900 sm:text-3xl">
                Trần Minh Anh <BadgeCheck className="shrink-0 text-brand-400" size={22} />
              </h1>
              <p className="text-plum-500">Senior Software Engineer @ FPT Software</p>
            </div>
          </div>
          <div className="flex gap-2 pb-2">
            <Button variant="primary" size="md" leftIcon={<UserPlus size={16} />}>Follow</Button>
            <Button variant="secondary" size="md" leftIcon={<MessageCircle size={16} />}>Message</Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-plum-500">
          <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> Đà Nẵng, Vietnam</span>
          <span className="inline-flex items-center gap-1.5"><GraduationCap size={14} /> SE · K15</span>
          <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> Joined Mar 2024</span>
          <a href="#" className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-600"><Link2 size={14} /> minhanh.dev</a>
        </div>

        <div className="mt-5 flex gap-8">
          {[
            { label: 'Followers', value: 1240 },
            { label: 'Following', value: 312 },
            { label: 'Posts', value: 86 },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-extrabold text-plum-900"><Counter value={s.value} compactFmt /></p>
              <p className="text-xs text-plum-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="mt-8 grid gap-6 px-4 sm:px-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Reveal>
            <Card hover={false} className="p-6">
              <h2 className="text-lg font-bold text-plum-900">About</h2>
              <p className="mt-3 text-sm leading-relaxed text-plum-600">
                Senior engineer passionate about scalable frontend systems and developer experience.
                FPTU alumnus mentoring the next generation through AlumNect. Previously building fintech
                at KMS. I love clean architecture, design systems, and a good cup of cà phê sữa đá.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card hover={false} className="p-6">
              <h2 className="text-lg font-bold text-plum-900">Career Timeline</h2>
              <ol className="mt-5 space-y-0">
                {TIMELINE.map((t, i) => (
                  <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className={`grid h-9 w-9 place-items-center rounded-full ${t.current ? 'bg-gradient-to-br from-brand-500 to-violet-600 text-white' : 'bg-plum-900/[0.05] text-plum-400'}`}>
                        <Briefcase size={15} />
                      </span>
                      {i < TIMELINE.length - 1 && <span className="mt-1 w-px flex-1 bg-plum-900/[0.07]" />}
                    </div>
                    <div className="pb-1">
                      <p className="font-bold text-plum-900">{t.role}</p>
                      <p className="text-sm text-plum-500">{t.org}</p>
                      <p className="text-xs text-plum-400">{t.period}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </Reveal>
        </div>

        <aside className="space-y-6">
          <Reveal direction="left">
            <Card hover={false} className="p-6">
              <h2 className="text-lg font-bold text-plum-900">Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <span key={s} className="rounded-lg bg-plum-900/[0.04] px-3 py-1.5 text-sm font-medium text-plum-600 ring-1 ring-inset ring-plum-900/10">
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          </Reveal>

          <Reveal direction="left" delay={0.1}>
            <Card hover={false} className="p-6">
              <div className="flex items-center gap-2">
                <Badge tone="gold" icon={<BadgeCheck size={13} />}>Verified Alumni</Badge>
              </div>
              <p className="mt-3 text-sm text-plum-500">
                Identity confirmed by AlumNect admin on {compact(1240)}+ member network.
              </p>
            </Card>
          </Reveal>
        </aside>
      </div>
    </div>
  )
}
