import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Bell, MessagesSquare, LayoutGrid, LogOut, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_PRIMARY_NAV, APP_MORE_NAV, APP_ACCOUNT_NAV } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/features/auth'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { LoginPromptModal } from '@/components/ui/LoginPromptModal'
import { useClickOutside } from '@/hooks/useClickOutside'

/* ----------------------------- small popover ----------------------------- */
function Popover({
  isOpen,
  onToggle,
  onClose,
  button,
  panelClass,
  children,
}: {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  button: ReactNode
  panelClass?: string
  children: ReactNode
}) {
  const popoverRef = useRef<HTMLDivElement>(null)
  useClickOutside(popoverRef, onClose, isOpen)

  return (
    <div ref={popoverRef} className="relative">
      <button onClick={onToggle} className="flex items-center">
        {button}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            className={cn(
              'absolute right-0 z-50 mt-2 origin-top-right rounded-2xl border border-plum-900/[0.07] bg-white p-2 shadow-soft',
              panelClass,
            )}
          >
            {children}
          </motion.div>
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
      className="group relative grid h-11 w-11 place-items-center rounded-2xl text-plum-500 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900 active:scale-95"
    >
      <span className="transition-transform duration-200 group-hover:-translate-y-0.5">{icon}</span>
      {/* hover tooltip label */}
      <span className="pointer-events-none absolute top-[calc(100%-6px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-soft transition-all duration-200 group-hover:top-full group-hover:opacity-100">
        {label}
      </span>
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
  const [activePopover, setActivePopover] = useState<'apps' | 'account' | null>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  // Đóng popover khi đổi trang
  useEffect(() => {
    setActivePopover(null)
  }, [location.pathname])

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }
  const logoutM = useLogout()
  // ADMIN đã được điều hướng về /admin ở trên, nên tại đây role chỉ còn STUDENT/ALUMNI.
  const roleLabel = user ? (user.role === 'STUDENT' ? 'Sinh viên' : 'Cựu sinh viên') : ''

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-600">
      {/* ambient FPT brand wash */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[#F27024]/10 blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-[#004F9E]/10 blur-[160px]" />
      </div>

      {/* ===== top header ===== */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs">
        {/* Top FPT Brand Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-[#F27024] via-[#004F9E] to-[#009A3E]" />
        <div className="mx-auto flex h-15 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <Logo />

          {/* desktop search */}
          <label className="relative ml-2 hidden items-center md:flex">
            <Search size={16} className="pointer-events-none absolute left-3 text-slate-400" />
            <input
              placeholder="Tìm kiếm…"
              className="h-9.5 w-48 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:w-64 focus:border-[#F27024]/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F27024]/20 lg:w-56"
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
                      'group relative flex h-15 items-center justify-center px-5 transition-colors',
                      isActive ? 'text-[#F27024] font-bold' : 'text-slate-500 hover:text-slate-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {Icon && <Icon size={22} className={cn('transition-transform duration-200 group-hover:-translate-y-0.5', isActive && 'text-[#F27024]')} />}
                      {/* hover tooltip label */}
                      <span className="pointer-events-none absolute top-[calc(100%-6px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-soft transition-all duration-200 group-hover:top-full group-hover:opacity-100">
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="app-tab"
                          className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-[#F27024] to-[#FF8C38]"
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
            {/* mobile search toggle */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Tìm kiếm"
              className="grid h-11 w-11 place-items-center rounded-2xl text-plum-500 hover:bg-plum-900/[0.05] md:hidden"
            >
              <Search size={19} />
            </button>

            {isAuthenticated ? (
              <>
                <IconLink to="/app/messages" label="Tin nhắn" icon={<MessagesSquare size={19} />} badge={3} />
                <IconLink to="/app/notifications" label="Thông báo" icon={<Bell size={19} />} dot />

                {/* More apps (desktop) */}
                <div className="hidden lg:block">
                  <Popover
                    isOpen={activePopover === 'apps'}
                    onToggle={() => setActivePopover((prev) => (prev === 'apps' ? null : 'apps'))}
                    onClose={() => setActivePopover(null)}
                    panelClass="w-72"
                    button={
                      <span className="group relative grid h-11 w-11 place-items-center rounded-2xl text-plum-500 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900">
                        <span className="transition-transform duration-200 group-hover:-translate-y-0.5"><LayoutGrid size={19} /></span>
                        <span className="pointer-events-none absolute top-[calc(100%-6px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-soft transition-all duration-200 group-hover:top-full group-hover:opacity-100">
                          Khám phá
                        </span>
                      </span>
                    }
                  >
                    <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-plum-400">Khám phá thêm</p>
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
                <Popover
                  isOpen={activePopover === 'account'}
                  onToggle={() => setActivePopover((prev) => (prev === 'account' ? null : 'account'))}
                  onClose={() => setActivePopover(null)}
                  panelClass="w-64"
                  button={
                    <span className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-plum-900/[0.05]">
                      <Avatar src={user?.avatarUrl} name={user?.name ?? ''} size={36} ring />
                      <ChevronDown size={15} className="hidden text-plum-400 sm:block" />
                    </span>
                  }
                >
                  <Link to="/app/profile" className="mb-1 flex items-center gap-3 rounded-xl p-2.5 hover:bg-brand-50">
                    <Avatar src={user?.avatarUrl} name={user?.name ?? ''} size={42} verified={user?.verified} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-plum-900">{user?.name}</p>
                      <p className="truncate text-xs text-brand-600">{user?.verified ? 'Đã xác minh · ' : ''}{roleLabel}</p>
                    </div>
                  </Link>
                  <div className="my-1 h-px bg-plum-900/[0.07]" />
                  {APP_ACCOUNT_NAV
                    .filter((item) => item.to !== '/admin' || user?.role === 'ADMIN')
                    .map((item) => {
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
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </Popover>
              </>
            ) : (
              <Link to="/login" className="ml-2">
                <Button size="sm" variant="primary" className="rounded-xl font-bold bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white shadow-sm">
                  Đăng nhập
                </Button>
              </Link>
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
                  placeholder="Tìm cựu sinh viên, việc làm, bài viết…"
                  className="h-11 w-full rounded-xl border border-plum-900/10 bg-white pl-10 pr-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ===== main ===== */}
      <main className={cn(
        "mx-auto w-full",
        location.pathname === '/app/map'
          ? "max-w-full px-2 sm:px-4 lg:px-5 pb-3 pt-3 lg:pb-3"
          : "max-w-7xl px-4 sm:px-6 lg:px-8 pb-28 pt-6 lg:pb-10"
      )}>
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
                    <span className="truncate">{item.label}</span>
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
            Thêm
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
                <h3 className="text-lg font-extrabold text-plum-900">Khám phá thêm</h3>
                <button onClick={() => setSheet(false)} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.05]">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3" onClick={() => setSheet(false)}>
                {(isAuthenticated 
                  ? [...APP_MORE_NAV, { label: 'Tin nhắn', to: '/app/messages', icon: MessagesSquare }, { label: 'Gói thành viên', to: '/app/subscription', icon: APP_ACCOUNT_NAV[2].icon }]
                  : APP_MORE_NAV.filter(item => item.to === '/app/map' || item.to === '/app/career' || item.to === '/app/profile')
                ).map((item) => {
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
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/app/profile"
                      className="col-span-2 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-plum-700 ring-1 ring-inset ring-plum-900/[0.06]"
                    >
                      Trang cá nhân
                    </Link>
                    <button onClick={() => logoutM.mutate()} className="col-span-2 rounded-xl bg-rose-500/10 px-4 py-3 text-center text-sm font-semibold text-rose-500">Đăng xuất</button>
                  </>
                ) : (
                  <Link to="/login" className="col-span-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm">Đăng nhập</Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Popup mời đăng nhập (kiểu Facebook) — hiện khi Guest cố tương tác */}
      <LoginPromptModal />
    </div>
  )
}
