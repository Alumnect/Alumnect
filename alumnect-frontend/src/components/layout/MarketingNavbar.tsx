import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MARKETING_NAV } from '@/lib/constants'
import { Logo } from '@/components/ui/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { Magnetic } from '@/components/motion'

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.nav
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'mx-auto mt-3 flex h-16 max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 transition-all duration-500 sm:px-6',
          scrolled
            ? 'glass-strong shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] mx-3 sm:mx-6 lg:mx-auto'
            : 'bg-transparent',
        )}
      >
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {MARKETING_NAV.map((item) => (
            <li key={item.label}>
              <a
                href={item.to}
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-plum-600 transition-colors hover:bg-plum-900/[0.04] hover:text-plum-900"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink to="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <Magnetic>
            <ButtonLink to="/register" variant="primary" size="sm" rightIcon={<ArrowRight size={16} />}>
              Join the network
            </ButtonLink>
          </Magnetic>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-xl text-plum-700 hover:bg-plum-900/[0.06] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mx-3 mt-2 overflow-hidden rounded-2xl glass-strong p-4 lg:hidden"
          >
            <ul className="grid gap-1">
              {MARKETING_NAV.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-plum-700 hover:bg-plum-900/[0.04]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ButtonLink to="/login" variant="outline" size="md">
                Sign in
              </ButtonLink>
              <ButtonLink to="/register" variant="primary" size="md">
                Join
              </ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
