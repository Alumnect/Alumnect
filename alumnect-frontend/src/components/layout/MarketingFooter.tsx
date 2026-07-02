import { Link } from 'react-router-dom'
import { Globe, MessageCircle, Send, Mail, ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/ui/primitives'
import { Logo } from '@/components/ui/Logo'
import { BRAND } from '@/lib/constants'

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Community Feed', to: '/app' },
      { label: 'Alumni Directory', to: '/app/alumni' },
      { label: 'Jobs & Recruitment', to: '/app/jobs' },
      { label: 'Events', to: '/app/events' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Q&A Forum', to: '/app/forum' },
      { label: 'Salary Board', to: '/app/salary' },
      { label: 'Alumni Map', to: '/app/map' },
      { label: 'Career Paths', to: '/app/career' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About FPTU', to: '/' },
      { label: 'Verification', to: '/register' },
      { label: 'For Recruiters', to: '/app/subscription' },
      { label: 'Admin', to: '/admin' },
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-plum-900/10 bg-ink-950">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
      <Container className="relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-plum-500">{BRAND.tagline}.</p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Globe, label: 'Website' },
                { Icon: MessageCircle, label: 'Chat cộng đồng' },
                { Icon: Send, label: 'Telegram' },
                { Icon: Mail, label: 'Email' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-600 ring-1 ring-inset ring-plum-900/10 transition-all hover:bg-plum-900/[0.06] hover:text-plum-900"
                  aria-label={label}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold uppercase tracking-wider text-plum-400">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="group inline-flex items-center gap-1 text-sm text-plum-600 transition-colors hover:text-plum-900"
                    >
                      {l.label}
                      <ArrowUpRight
                        size={13}
                        className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-plum-900/10 pt-6 text-sm text-plum-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND.name} · {BRAND.university} SEP490 Capstone.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-plum-900">Privacy</a>
            <a href="#" className="hover:text-plum-900">Terms</a>
            <a href="#" className="hover:text-plum-900">Community Standards</a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
