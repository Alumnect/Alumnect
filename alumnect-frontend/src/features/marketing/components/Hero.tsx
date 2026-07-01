import { motion, useTransform } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  PlayCircle,
  BadgeCheck,
  TrendingUp,
  MapPin,
  ChevronDown,
  Heart,
  MessageCircle,
  Repeat2,
  Award,
  Briefcase,
  CalendarDays,
  HelpCircle,
  LineChart,
} from 'lucide-react'
import { Container, Badge, Avatar } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { AuroraBackground, Starfield, WordReveal, Magnetic, Counter, ParallaxLayer } from '@/components/motion'
import { useMousePosition } from '@/hooks/useMousePosition'

const CHIPS = [
  { icon: BadgeCheck, label: 'Verified profiles' },
  { icon: Briefcase, label: 'Alumni jobs' },
  { icon: CalendarDays, label: 'Events' },
  { icon: HelpCircle, label: 'Mentorship' },
  { icon: LineChart, label: 'Salary insights' },
]

export function Hero() {
  const { x, y } = useMousePosition(50, 16)

  const winX = useTransform(x, (v) => v * 20)
  const winY = useTransform(y, (v) => v * 20)
  const winRot = useTransform(x, (v) => v * 5)
  const c1x = useTransform(x, (v) => v * -52)
  const c1y = useTransform(y, (v) => v * -38)
  const c2x = useTransform(x, (v) => v * 58)
  const c2y = useTransform(y, (v) => v * -26)
  const c3x = useTransform(x, (v) => v * -34)
  const c3y = useTransform(y, (v) => v * 46)

  return (
    <section className="relative overflow-hidden pb-24 pt-36 lg:pt-44">
      <AuroraBackground />
      <Starfield count={16} />
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-[0.5]" />
      <ParallaxLayer depth={0.4} className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl" />
      <ParallaxLayer depth={0.7} className="pointer-events-none absolute right-10 top-40 h-60 w-60 rounded-full bg-coral-300/40 blur-3xl" />

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ---- Copy ---- */}
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge tone="brand" icon={<Sparkles size={13} />}>
                Verified · Official · FPTU Alumni
              </Badge>
            </motion.div>

            <h1 className="mt-6 text-balance text-5xl font-extrabold leading-[1.04] text-plum-900 sm:text-6xl lg:text-[4.4rem]">
              <WordReveal text="Where FPTU *graduates* truly" />
              <br className="hidden lg:block" />
              <WordReveal text="stay *connected* for life." delay={0.4} />
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-plum-600"
            >
              One warm, trustworthy home for the alumni community — verified profiles, a friendly feed,
              jobs, events, mentorship, a salary board and an interactive alumni map. No noise. No fakes.
            </motion.p>

            {/* feature chips */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="mt-6 flex flex-wrap gap-2"
            >
              {CHIPS.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-plum-900/[0.07] bg-white/70 px-3 py-1.5 text-xs font-semibold text-plum-600 backdrop-blur"
                >
                  <c.icon size={13} className="text-brand-500" /> {c.label}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.25, duration: 0.6 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Magnetic>
                <ButtonLink to="/register" variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Join the network
                </ButtonLink>
              </Magnetic>
              <ButtonLink to="/app" variant="glass" size="lg" leftIcon={<PlayCircle size={18} />}>
                Explore the feed
              </ButtonLink>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.45, duration: 0.6 }}
              className="mt-10 flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[12, 33, 45, 8, 20].map((n) => (
                  <img key={n} src={`https://i.pravatar.cc/80?img=${n}`} alt="" className="h-10 w-10 rounded-full ring-2 ring-cream-50" />
                ))}
              </div>
              <p className="text-sm text-plum-600">
                <span className="font-bold text-plum-900">
                  <Counter value={24800} suffix="+" compactFmt />
                </span>{' '}
                verified alumni already connected
              </p>
            </motion.div>
          </div>

          {/* ---- Visual: composed in-app preview (no external photo) ---- */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              style={{ x: winX, y: winY, rotate: winRot }}
              className="relative mx-auto max-w-md [transform-style:preserve-3d]"
            >
              {/* soft glow */}
              <div className="absolute -inset-6 -z-10 rounded-[2.6rem] bg-gradient-to-br from-brand-300/45 via-violet-300/35 to-coral-300/45 blur-2xl" />

              {/* app window */}
              <div className="ring-gradient overflow-hidden rounded-[2rem] bg-cream-50 shadow-[0_44px_120px_-44px_rgba(124,134,238,0.7)]">
                {/* window bar */}
                <div className="flex items-center gap-2 border-b border-plum-900/[0.06] bg-white/80 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gold-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-mint-400" />
                  <span className="ml-2 flex-1 rounded-full bg-plum-900/[0.05] px-3 py-1 text-[11px] font-medium text-plum-400">
                    alumnect.edu.vn / feed
                  </span>
                </div>

                {/* mock feed */}
                <div className="space-y-3 p-4">
                  {/* post */}
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-plum-900/[0.05]">
                    <div className="flex items-center gap-2.5">
                      <Avatar src="https://i.pravatar.cc/100?img=12" name="Minh Anh" size={38} verified />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-plum-900">
                          Trần Minh Anh
                          <span className="rounded-full bg-gold-300/50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gold-600">Achievement</span>
                        </p>
                        <p className="text-[11px] text-plum-400">Senior Engineer @ FPT Software · 2h</p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-plum-700">
                      Just got promoted to Senior Engineer! Forever grateful to the seniors who mentored me here. 🚀
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-plum-400">
                      <span className="inline-flex items-center gap-1 text-coral-500"><Heart size={13} className="fill-coral-500" /> 248</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle size={13} /> 36</span>
                      <span className="inline-flex items-center gap-1"><Repeat2 size={13} /> 12</span>
                    </div>
                  </div>

                  {/* job mini */}
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-inset ring-plum-900/[0.05]">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-lg">🟢</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-plum-900">Frontend Intern</p>
                      <p className="truncate text-[11px] text-plum-400">VNG · Đà Nẵng · 54 applicants</p>
                    </div>
                    <span className="rounded-lg bg-gradient-to-r from-brand-500 to-violet-500 px-3 py-1.5 text-[11px] font-bold text-white">Apply</span>
                  </div>
                </div>
              </div>

              {/* floating chip: verified profile */}
              <motion.div style={{ x: c1x, y: c1y }} className="absolute -left-12 top-10 hidden w-52 lg:block">
                <div className="animate-bob rounded-2xl glass-strong p-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar src="https://i.pravatar.cc/100?img=33" name="Hải Long" verified size={38} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-plum-900">Nguyễn Hải Long</p>
                      <p className="truncate text-[10px] text-brand-600">PM @ Grab · IB K13</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* floating chip: now hiring */}
              <motion.div style={{ x: c2x, y: c2y }} className="absolute -right-10 top-36 hidden w-44 lg:block">
                <div className="animate-bob rounded-2xl glass-strong p-3" style={{ animationDelay: '1.2s' }}>
                  <div className="flex items-center gap-1.5 text-coral-500">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Now hiring</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-plum-900">+1,260 jobs posted</p>
                </div>
              </motion.div>

              {/* floating chip: map ping */}
              <motion.div style={{ x: c3x, y: c3y }} className="absolute -bottom-6 left-4 hidden lg:block">
                <div className="flex animate-bob items-center gap-2 rounded-2xl glass-strong px-3.5 py-2.5" style={{ animationDelay: '0.7s' }}>
                  <span className="relative grid h-7 w-7 place-items-center rounded-full bg-aqua-400/20 text-aqua-500">
                    <MapPin size={14} />
                    <span className="absolute inset-0 animate-ping rounded-full bg-aqua-400/30" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-plum-900">9,800 alumni</p>
                    <p className="text-[10px] text-plum-500">in HCMC</p>
                  </div>
                </div>
              </motion.div>

              {/* floating chip: achievement badge */}
              <motion.div style={{ x: c2x, y: c3y }} className="absolute -right-6 -bottom-2 hidden lg:block">
                <div className="flex animate-bob items-center gap-2 rounded-2xl glass-strong px-3 py-2" style={{ animationDelay: '1.8s' }}>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-300/50 text-gold-600"><Award size={14} /></span>
                  <p className="text-xs font-bold text-plum-900">540+ events</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* scroll cue */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-20 flex justify-center">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="flex flex-col items-center gap-1 text-xs font-semibold uppercase tracking-widest text-plum-400"
          >
            Scroll to explore
            <ChevronDown size={18} />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
