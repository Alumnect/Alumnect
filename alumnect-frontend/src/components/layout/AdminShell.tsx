import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ADMIN_NAV } from '@/lib/constants'
import { Avatar, Badge } from '@/components/ui/primitives'
import { useLogout } from '@/features/auth'

export function AdminShell() {
  const location = useLocation()
  const logoutM = useLogout()
  return (
    <div className="relative min-h-screen bg-cream-100 text-plum-600">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-grid mask-fade-b opacity-50" />
      <div className="pointer-events-none fixed right-0 top-0 -z-10 h-96 w-96 rounded-full bg-gold-300/25 blur-[150px]" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-plum-900/[0.07] bg-white/70 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-400 text-plum-900 shadow-[0_8px_22px_-10px_rgba(239,175,62,0.8)]">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-plum-900">Admin Console</p>
            <p className="text-[11px] text-plum-400">AlumNect operations</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all',
                    isActive ? 'text-gold-600' : 'text-plum-500 hover:bg-plum-900/[0.04] hover:text-plum-900',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="admin-active"
                        className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-gold-300/40 to-gold-400/20 ring-1 ring-inset ring-gold-400/50"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    {Icon && <Icon size={18} className={cn(isActive ? 'text-gold-600' : 'text-plum-400')} />}
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => logoutM.mutate()}
          className="m-3 flex items-center justify-center gap-2 rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-500/20"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-plum-900/[0.07] bg-cream-50/80 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <Badge tone="gold">Admin</Badge>
            <span className="hidden text-sm text-plum-500 sm:block">FPTU AlumNect · Operations dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-bold text-plum-900">Admin FPTU</span>
              <span className="block text-xs text-plum-400">Super admin</span>
            </span>
            <Avatar src="https://i.pravatar.cc/120?img=64" name="Admin" size={38} />
          </div>
        </header>

        <main className="px-5 py-7 sm:px-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
