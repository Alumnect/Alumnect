import { motion, useTransform } from 'framer-motion'
import { Sparkles, ArrowRight, PlayCircle, BadgeCheck, TrendingUp, MapPin, ChevronDown } from 'lucide-react'
import { Container, Badge, Avatar } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { AuroraBackground, Starfield, WordReveal, Magnetic, Counter, ParallaxLayer } from '@/components/motion'
import { useMousePosition } from '@/hooks/useMousePosition'

const HERO_IMG =
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1400&auto=format&fit=crop'

export function Hero() {
  const { x, y } = useMousePosition(50, 16)

  // depth-varied parallax offsets driven by the cursor
  const bannerX = useTransform(x, (v) => v * 22)
  const bannerY = useTransform(y, (v) => v * 22)
  const bannerRot = useTransform(x, (v) => v * 6)
  const card1X = useTransform(x, (v) => v * -55)
  const card1Y = useTransform(y, (v) => v * -40)
  const card2X = useTransform(x, (v) => v * 60)
  const card2Y = useTransform(y, (v) => v * -28)
  const card3X = useTransform(x, (v) => v * -36)
  const card3Y = useTransform(y, (v) => v * 48)

  return (
    <section className="relative overflow-hidden pb-24 pt-36 lg:pt-44">
      {/* backdrop */}
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
              <br className="hidden sm:block" />
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

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.15, duration: 0.6 }}
              className="mt-9 flex flex-wrap items-center gap-3"
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

            {/* social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.35, duration: 0.6 }}
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

          {/* ---- Visual (mouse-reactive) ---- */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              style={{ x: bannerX, y: bannerY, rotate: bannerRot }}
              className="relative mx-auto max-w-md [transform-style:preserve-3d]"
            >
              {/* main banner card */}
              <div className="ring-gradient relative overflow-hidden rounded-[2rem] shadow-[0_40px_120px_-44px_rgba(124,134,238,0.7)]">
                <img src={HERO_IMG} alt="FPTU alumni graduation" className="h-[30rem] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-plum-900/80 via-plum-900/10 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <Badge tone="gold" icon={<BadgeCheck size={13} />}>Class of 2026</Badge>
                  <p className="mt-3 text-lg font-bold text-white">FPTU Alumni Homecoming</p>
                  <p className="text-sm text-white/80">480 attending · Đà Nẵng campus</p>
                </div>
              </div>

              {/* floating glass: verified profile */}
              <motion.div style={{ x: card1X, y: card1Y }} className="absolute -left-10 top-12 hidden w-56 sm:block">
                <div className="animate-bob rounded-3xl glass-strong p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar src="https://i.pravatar.cc/100?img=33" name="Hải Long" verified size={42} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-plum-900">Nguyễn Hải Long</p>
                      <p className="truncate text-xs text-brand-600">PM @ Grab · IB K13</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* floating glass: hiring */}
              <motion.div style={{ x: card2X, y: card2Y }} className="absolute -right-8 top-40 hidden w-52 sm:block">
                <div className="animate-bob rounded-3xl glass-strong p-3.5" style={{ animationDelay: '1.2s' }}>
                  <div className="flex items-center gap-2 text-coral-500">
                    <TrendingUp size={16} />
                    <span className="text-xs font-bold uppercase tracking-wide">Now hiring</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-plum-900">Frontend Intern</p>
                  <p className="text-xs text-plum-500">VNG · 54 applicants</p>
                </div>
              </motion.div>

              {/* floating glass: map ping */}
              <motion.div style={{ x: card3X, y: card3Y }} className="absolute -bottom-6 left-6 hidden sm:block">
                <div className="flex animate-bob items-center gap-2 rounded-3xl glass-strong px-4 py-3" style={{ animationDelay: '0.7s' }}>
                  <span className="relative grid h-8 w-8 place-items-center rounded-full bg-aqua-400/20 text-aqua-500">
                    <MapPin size={16} />
                    <span className="absolute inset-0 animate-ping rounded-full bg-aqua-400/30" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-plum-900">9,800 alumni</p>
                    <p className="text-xs text-plum-500">in HCMC</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* scroll cue */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-16 flex justify-center">
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
