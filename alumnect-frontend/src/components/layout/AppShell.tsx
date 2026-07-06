import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Bell, Plus, MessagesSquare, LayoutGrid, LogOut, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_PRIMARY_NAV, APP_MORE_NAV, APP_ACCOUNT_NAV } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/features/auth'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'

/* ----------------------------- small popover ----------------------------- */
function Popover({ button, panelClass, children }: { button: ReactNode; panelClass?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center">
        {button}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button aria-hidden className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setOpen(false)}
              className={cn(
                'absolute right-0 z-50 mt-2 origin-top-right rounded-2xl border border-plum-900/[0.07] bg-cream-50 p-2 shadow-soft',
                panelClass,
              )}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------ icon button ------------------------------ */
function IconLink({ to, label, icon, badge, dot }: { to: string; label: string; icon: ReactNode; badge?: number; dot?: boolean }) {
  return (
    <Link
      to={to}
      aria-label={badge ? `${label} (${badge} unread)` : label}
      className="relative grid h-11 w-11 place-items-center rounded-2xl text-plum-500 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900 active:scale-95"
    >
      {icon}
      {badge ? (
        <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white ring-2 ring-cream-50">
          {badge}
        </span>
      ) : dot ? (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral-400 ring-2 ring-cream-50" />
      ) : null}
    </Link>
  )
}

/* --------------------------------- shell --------------------------------- */
export function AppShell() {
  const location = useLocation()
  const [sheet, setSheet] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logoutM = useLogout()
  const roleLabel = user ? (user.role === 'ADMIN' ? 'Admin' : user.role === 'STUDENT' ? 'Student' : 'Alumni') : ''

  return (
    <div className="relative min-h-screen bg-cream-100 text-plum-600">
      {/* ambient pastel wash */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-brand-300/25 blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-coral-300/20 blur-[150px]" />
      </div>

      {/* ===== top header ===== */}
      <header className="sticky top-0 z-30 border-b border-plum-900/[0.07] bg-cream-50/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <Logo />

          {/* desktop search */}
          <label className="relative ml-1 hidden items-center md:flex">
            <Search size={16} className="pointer-events-none absolute left-3 text-plum-400" />
            <input
              placeholder="Search…"
              className="h-10 w-48 rounded-full border border-plum-900/10 bg-white pl-9 pr-3 text-sm text-plum-900 placeholder:text-plum-400 transition-all focus:w-64 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/25 lg:w-56"
            />
          </label>

          {/* primary nav (centre) */}
          <nav className="hidden flex-1 items-center justify-center lg:flex">
            {APP_PRIMARY_NAV.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex h-16 items-center justify-center px-5 transition-colors',
                      isActive ? 'text-brand-700' : 'text-plum-400 hover:text-plum-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {Icon && <Icon size={23} className={cn('transition-transform duration-200 group-hover:-translate-y-0.5', isActive && 'text-brand-600')} />}
                      {/* hover tooltip label */}
                      <span className="pointer-events-none absolute top-[calc(100%-6px)] z-50 whitespace-nowrap rounded-lg bg-plum-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-soft transition-all duration-200 group-hover:top-full group-hover:opacity-100">
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="app-tab"
                          className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* right actions */}
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <Button size="sm" variant="primary" leftIcon={<Plus size={16} />} className="hidden sm:inline-flex">
              Create
            </Button>

            {/* mobile search toggle */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              className="grid h-11 w-11 place-items-center rounded-2xl text-plum-500 hover:bg-plum-900/[0.05] md:hidden"
            >
              <Search size={19} />
            </button>

            <IconLink to="/app/messages" label="Messages" icon={<MessagesSquare size={19} />} badge={3} />
            <IconLink to="/app/notifications" label="Notifications" icon={<Bell size={19} />} dot />

            {/* More apps (desktop) */}
            <div className="hidden lg:block">
              <Popover
                panelClass="w-72"
                button={
                  <span className="grid h-11 w-11 place-items-center rounded-2xl text-plum-500 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900">
                    <LayoutGrid size={19} />
                  </span>
                }
              >
                <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-plum-400">Explore more</p>
                <div className="grid grid-cols-3 gap-1">
                  {APP_MORE_NAV.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center text-xs font-semibold text-plum-600 transition-colors hover:bg-brand-50"
                      >
                        {Icon && (
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-600">
                            <Icon size={18} />
                          </span>
                        )}
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </Popover>
            </div>

            {/* account */}
            {user && (
              <Popover
                panelClass="w-64"
                button={
                  <span className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-plum-900/[0.05]">
                    <Avatar src={user.avatarUrl} name={user.name} size={36} ring />
                    <ChevronDown size={15} className="hidden text-plum-400 sm:block" />
                  </span>
                }
              >
                <Link to="/app/profile" className="mb-1 flex items-center gap-3 rounded-xl p-2.5 hover:bg-brand-50">
                  <Avatar src={user.avatarUrl} name={user.name} size={42} verified={user.verified} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-plum-900">{user.name}</p>
                    <p className="truncate text-xs text-brand-600">{user.verified ? 'Verified ' : ''}{roleLabel}</p>
                  </div>
                </Link>
                <div className="my-1 h-px bg-plum-900/[0.07]" />
                {APP_ACCOUNT_NAV.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-plum-600 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900"
                    >
                      {Icon && <Icon size={16} className="text-plum-400" />}
                      {item.label}
                    </Link>
                  )
                })}
                <div className="my-1 h-px bg-plum-900/[0.07]" />
                <button
                  type="button"
                  onClick={() => logoutM.mutate()}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-coral-600 transition-colors hover:bg-coral-300/25"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </Popover>
            )}
          </div>
        </div>

        {/* mobile expandable search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-plum-900/[0.07] md:hidden"
            >
              <label className="relative flex items-center px-4 py-3">
                <Search size={16} className="pointer-events-none absolute left-7 text-plum-400" />
                <input
                  autoFocus
                  placeholder="Search alumni, jobs, posts…"
                  className="h-11 w-full rounded-xl border border-plum-900/10 bg-white pl-10 pr-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ===== main ===== */}
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* ===== mobile bottom tab bar ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-plum-900/[0.07] bg-cream-50/90 backdrop-blur-xl lg:hidden">
        <div className="flex items-stretch justify-around">
          {APP_PRIMARY_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors',
                    isActive ? 'text-brand-700' : 'text-plum-400',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="app-tab-mobile"
                        className="absolute inset-x-5 top-0 h-[3px] rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    {Icon && <Icon size={21} className={isActive ? 'text-brand-600' : ''} />}
                    <span className="truncate">{item.label.replace('Q&A ', '')}</span>
                  </>
                )}
              </NavLink>
            )
          })}
          <button
            onClick={() => setSheet(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold text-plum-400"
          >
            <LayoutGrid size={21} />
            More
          </button>
        </div>
      </nav>

      {/* ===== mobile "more" sheet ===== */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-plum-900/30 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheet(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-plum-900/[0.07] bg-cream-50 p-5 pb-8 lg:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-plum-900/15" />
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-plum-900">Explore more</h3>
                <button onClick={() => setSheet(false)} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.05]">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3" onClick={() => setSheet(false)}>
                {[...APP_MORE_NAV, { label: 'Messages', to: '/app/messages', icon: MessagesSquare }, { label: 'Subscription', to: '/app/subscription', icon: APP_ACCOUNT_NAV[1].icon }].map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.to} to={item.to} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center text-xs font-semibold text-plum-700 ring-1 ring-inset ring-plum-900/[0.06]">
                      {Icon && (
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-600">
                          <Icon size={20} />
                        </span>
                      )}
                      {item.label}
                    </Link>
                  )
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2" onClick={() => setSheet(false)}>
                <Link to="/app/profile" className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-plum-700 ring-1 ring-inset ring-plum-900/[0.06]">My Profile</Link>
                <Link to="/admin" className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-plum-700 ring-1 ring-inset ring-plum-900/[0.06]">Admin</Link>
                <button
                  type="button"
                  onClick={() => logoutM.mutate()}
                  className="col-span-2 rounded-xl bg-rose-500/10 px-4 py-3 text-center text-sm font-semibold text-rose-500"
                >
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
