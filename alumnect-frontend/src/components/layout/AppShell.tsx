import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TRANSITION } from '@/lib/motion'
import {
  MagnifyingGlass,
  Bell,
  Chats,
  SquaresFour,
  SignOut,
  X,
  CaretDown,
  ArrowUp,
  Sun,
  Moon,
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { APP_PRIMARY_NAV, APP_MORE_NAV, APP_ACCOUNT_NAV } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import { useSearchStore } from '@/store/searchStore'
import { useThemeStore } from '@/store/themeStore'
import { useLogout } from '@/features/auth'
import { useWebSocketChat } from '@/features/message'
import { useWebSocketNotifications, useUnreadNotificationCount } from '@/features/notification'
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
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: TRANSITION.exit }}
            transition={TRANSITION.pop}
            style={{ willChange: 'opacity, transform' }}
            onClick={onClose}
            className={cn(
              'absolute right-0 z-50 mt-2 origin-top-right rounded-2xl border border-plum-900/[0.07] bg-white p-2 shadow-soft dark:bg-[#242526] dark:border-[#393a3b]',
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
      className="group relative grid h-11 w-11 place-items-center rounded-2xl text-plum-500 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900 active:scale-95 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c] dark:hover:text-white"
    >
      <span className="transition-transform duration-200 group-hover:-translate-y-0.5">{icon}</span>
      {/* hover tooltip label */}
      <span className="pointer-events-none absolute top-[calc(100%-6px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-soft transition-all duration-200 group-hover:top-full group-hover:opacity-100 dark:bg-black dark:text-white">
        {label}
      </span>
      {badge ? (
        <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white ring-2 ring-cream-50 dark:ring-[#242526]">
          {badge}
        </span>
      ) : dot ? (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral-400 ring-2 ring-cream-50 dark:ring-[#242526]" />
      ) : null}
    </Link>
  )
}

/* --------------------------------- shell --------------------------------- */
export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activePopover, setActivePopover] = useState<'apps' | 'account' | null>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const keyword = useSearchStore((s) => s.keyword)
  const setKeyword = useSearchStore((s) => s.setKeyword)
  const { theme, setTheme } = useThemeStore()

  // Duy trì kết nối WebSocket thời gian thực toàn cục để nhận tin nhắn và thông báo
  useWebSocketChat()
  useWebSocketNotifications()

  // Số lượng thông báo chưa đọc
  const { data: unreadNotifCount } = useUnreadNotificationCount()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value)
    if (location.pathname !== '/app') {
      navigate('/app')
    }
  }

  // Trạng thái hiển thị nút "Cuộn lên đầu trang" (Back to top)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearSearch = () => {
    setKeyword('')
  }

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

  // Menu "Khám phá" (desktop): người đã đăng nhập thấy đủ mục; Khách chỉ thấy các mục công khai (Hội nhóm).
  const renderMoreApps = (items: typeof APP_MORE_NAV) => (
    <div className="hidden lg:block">
      <Popover
        isOpen={activePopover === 'apps'}
        onToggle={() => setActivePopover((prev) => (prev === 'apps' ? null : 'apps'))}
        onClose={() => setActivePopover(null)}
        panelClass="w-[184px] p-3"
        button={
          <span className="group relative grid h-11 w-11 place-items-center rounded-2xl text-plum-500 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900">
            <span className="transition-transform duration-200 group-hover:-translate-y-0.5">
              <SquaresFour size={21} weight={activePopover === 'apps' ? 'fill' : 'regular'} />
            </span>
            <span className="pointer-events-none absolute top-[calc(100%-6px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-soft transition-all duration-200 group-hover:top-full group-hover:opacity-100">
              Khám phá
            </span>
          </span>
        }
      >
        <p className="whitespace-nowrap px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-plum-400">Khám phá thêm</p>
        <div className="grid grid-cols-3 justify-items-center gap-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className="group relative grid h-12 w-12 place-items-center rounded-2xl text-brand-600 transition-all hover:bg-brand-50 active:scale-95"
              >
                {Icon && (
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100/80 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:bg-brand-100">
                    <Icon size={20} weight="regular" />
                  </span>
                )}
                {/* Tooltip khi hover giống hệt icon ở ngoài */}
                <span className="pointer-events-none absolute top-[calc(100%-4px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-soft transition-all duration-200 group-hover:top-[calc(100%+4px)] group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </Popover>
    </div>
  )

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-600 dark:!bg-[#18191a] dark:text-[#e4e6eb]">
      {/* ambient FPT brand wash (hidden in dark mode for pure Facebook look) */}
      <div className="pointer-events-none fixed inset-0 -z-10 dark:hidden">
        <div className="absolute left-0 top-0 h-[36rem] w-[36rem] bg-[radial-gradient(closest-side,rgba(242,112,36,0.10),transparent)]" />
        <div className="absolute bottom-0 right-0 h-[36rem] w-[36rem] bg-[radial-gradient(closest-side,rgba(0,79,158,0.10),transparent)]" />
      </div>

      {/* ===== top header ===== */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-xs dark:bg-[#242526] dark:border-[#393a3b]">
        {/* Top FPT Brand Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-[#F27024] via-[#004F9E] to-[#009A3E]" />
        <div className="mx-auto flex h-15 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <Logo />

          {/* desktop search */}
          <label className="relative ml-2 hidden items-center md:flex">
            <MagnifyingGlass size={17} className="pointer-events-none absolute left-3 text-slate-400 dark:text-[#b0b3b8]" />
            <input
              value={keyword}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm bài viết…"
              className="h-9.5 w-48 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:w-64 focus:border-[#F27024]/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F27024]/20 lg:w-56 dark:bg-[#3a3b3c] dark:border-[#393a3b] dark:text-[#f0f2f5] dark:placeholder:text-[#b0b3b8] dark:focus:bg-[#3a3b3c]"
            />
            {keyword && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors dark:text-[#b0b3b8] dark:hover:bg-[#4e4f50] dark:hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </label>

          {/* primary nav (centre) */}
          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex h-full">
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
                      'group relative flex h-full w-20 xl:w-24 items-center justify-center transition-colors',
                      isActive ? 'text-[#F27024]' : 'text-slate-500 hover:text-slate-900 dark:text-[#b0b3b8] dark:hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        'flex h-11 w-full items-center justify-center rounded-xl transition-all duration-200',
                        isActive ? 'bg-[#F27024]/10 text-[#F27024]' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900 dark:hover:bg-[#3a3b3c] dark:text-[#b0b3b8] dark:hover:text-white'
                      )}>
                        {Icon && (
                          <Icon
                            size={23}
                            weight={isActive ? 'fill' : 'regular'}
                            className={cn('transition-all duration-200 group-hover:scale-110', isActive && 'text-[#F27024]')}
                          />
                        )}
                      </div>

                      {/* hover tooltip label */}
                      <span className="pointer-events-none absolute top-[calc(100%+4px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0.5 dark:bg-black dark:text-white">
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="app-tab"
                          className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-[#F27024]"
                          transition={TRANSITION.indicator}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* right actions */}
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5 lg:ml-0">
            {/* mobile search toggle */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Tìm kiếm"
              className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl text-plum-500 hover:bg-plum-900/[0.05] md:hidden"
            >
              <MagnifyingGlass size={20} />
            </button>

            {isAuthenticated ? (
              <>
                <IconLink
                  to="/app/messages"
                  label="Tin nhắn"
                  icon={<Chats size={20} weight={location.pathname === '/app/messages' ? 'fill' : 'regular'} />}
                />
                <IconLink
                  to="/app/notifications"
                  label="Thông báo"
                  icon={<Bell size={20} weight={location.pathname === '/app/notifications' ? 'fill' : 'regular'} />}
                  badge={unreadNotifCount && unreadNotifCount > 0 ? unreadNotifCount : undefined}
                />

                {renderMoreApps(APP_MORE_NAV)}

                {/* account */}
                <Popover
                  isOpen={activePopover === 'account'}
                  onToggle={() => setActivePopover((prev) => (prev === 'account' ? null : 'account'))}
                  onClose={() => setActivePopover(null)}
                  panelClass="w-64"
                  button={
                    <span className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-plum-900/[0.05] dark:hover:bg-[#3a3b3c]">
                      <Avatar src={user?.avatarUrl} name={user?.name ?? ''} size={36} ring />
                      <CaretDown size={15} weight="bold" className="hidden text-plum-400 sm:block dark:text-[#b0b3b8]" />
                    </span>
                  }
                >
                  <Link to="/app/profile" className="mb-1 flex items-center gap-3 rounded-xl p-2.5 hover:bg-plum-900/[0.04] transition-colors dark:hover:bg-[#3a3b3c]">
                    <Avatar src={user?.avatarUrl} name={user?.name ?? ''} size={42} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-plum-900 dark:text-[#f0f2f5]">{user?.name}</p>
                      <p className="truncate text-xs text-plum-500 dark:text-[#b0b3b8]">{user?.verified ? 'Đã xác minh · ' : ''}{roleLabel}</p>
                    </div>
                  </Link>

                  <div className="my-1 h-px bg-plum-900/[0.07] dark:bg-[#393a3b]" />
                  {APP_ACCOUNT_NAV
                    .filter((item) => item.to !== '/admin' || user?.role === 'ADMIN')
                    .map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-plum-600 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900 dark:text-[#e4e6eb] dark:hover:bg-[#3a3b3c] dark:hover:text-white"
                        >
                          {Icon && <Icon size={18} weight="regular" className="text-plum-400 dark:text-[#b0b3b8]" />}
                          {item.label}
                        </Link>
                      )
                    })}
                  <div className="my-1 h-px bg-plum-900/[0.07] dark:bg-[#393a3b]" />
                  <button
                    type="button"
                    onClick={() => logoutM.mutate()}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-coral-600 transition-colors hover:bg-coral-300/25 dark:text-rose-400 dark:hover:bg-rose-500/15"
                  >
                    <SignOut size={18} weight="bold" /> Đăng xuất
                  </button>
                </Popover>
              </>
            ) : (
              <div className="flex items-center gap-1">
                {renderMoreApps(APP_MORE_NAV.filter((item) => item.to === '/app/groups'))}
                <Link to="/login" className="ml-1">
                  <Button size="sm" variant="primary" className="rounded-xl font-bold bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white shadow-sm">
                    Đăng nhập
                  </Button>
                </Link>
              </div>
            )}
            {/* Nút chuyển chế độ Sáng / Tối ở ngoài cùng bên phải */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="group relative grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl text-plum-500 hover:bg-plum-900/[0.05] hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c] dark:hover:text-[#f0f2f5] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun size={20} weight="fill" className="text-amber-400 transition-transform duration-200 group-hover:rotate-45" />
              ) : (
                <Moon size={20} weight="fill" className="text-slate-600 transition-transform duration-200 group-hover:-rotate-12" />
              )}
              {/* Tooltip khi hover */}
              <span className="pointer-events-none absolute top-[calc(100%-4px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-soft transition-all duration-200 group-hover:top-[calc(100%+4px)] group-hover:opacity-100 dark:bg-white dark:text-slate-900">
                {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
              </span>
            </button>
          </div>
        </div>

        {/* mobile expandable search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={TRANSITION.height}
              className="overflow-hidden border-t border-plum-900/[0.07] md:hidden"
            >
              <label className="relative flex items-center px-4 py-3">
                <MagnifyingGlass size={17} className="pointer-events-none absolute left-7 text-plum-400" />
                <input
                  autoFocus
                  value={keyword}
                  onChange={handleSearchChange}
                  placeholder="Tìm kiếm bài viết…"
                  className="h-11 w-full rounded-xl border border-plum-900/10 bg-white pl-10 pr-9 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Xóa tìm kiếm"
                    className="absolute right-7 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-plum-400 hover:bg-plum-100 hover:text-plum-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
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
          : location.pathname === '/app/messages'
          ? "max-w-7xl px-3 sm:px-6 lg:px-8 py-3 h-[calc(100vh-3.85rem)] overflow-y-auto no-scrollbar"
          : location.pathname === '/app/mentoring/terms'
          ? "max-w-[1560px] px-3 sm:px-6 lg:px-8 py-2 sm:py-3 h-[calc(100vh-3.85rem)] overflow-hidden"
          : "max-w-7xl px-4 sm:px-6 lg:px-8 pb-28 pt-6 lg:pb-10"
      )}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITION.page}
          className={location.pathname === '/app/messages' || location.pathname === '/app/mentoring/terms' ? "h-full" : undefined}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* ===== mobile bottom tab bar ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-plum-900/[0.07] bg-cream-50/95 lg:hidden">
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
                        transition={TRANSITION.indicator}
                      />
                    )}
                    {Icon && (
                      <Icon
                        size={22}
                        weight={isActive ? 'fill' : 'regular'}
                        className={isActive ? 'text-[#F27024]' : ''}
                      />
                    )}
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
            <SquaresFour size={22} weight={sheet ? 'fill' : 'regular'} />
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
              exit={{ opacity: 0, transition: TRANSITION.exit }}
              transition={TRANSITION.overlay}
              onClick={() => setSheet(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-plum-900/[0.07] bg-cream-50 p-5 pb-8 lg:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={TRANSITION.sheet}
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
                  ? [...APP_MORE_NAV, { label: 'Tin nhắn', to: '/app/messages', icon: Chats }, { label: 'Thông báo', to: '/app/notifications', icon: Bell }]
                  : [...APP_MORE_NAV.filter(item => item.to === '/app/groups' || item.to === '/app/map' || item.to === '/app/career' || item.to === '/app/profile')]
                ).map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.to} to={item.to} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center text-xs font-semibold text-plum-700 ring-1 ring-inset ring-plum-900/[0.06] dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10">
                      {Icon && (
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                          <Icon size={20} weight="regular" />
                        </span>
                      )}
                      {item.label}
                    </Link>
                  )
                })}
              </div>


              <div className="mt-3 grid grid-cols-2 gap-2" onClick={() => setSheet(false)}>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/app/profile"
                      className="col-span-2 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-plum-700 ring-1 ring-inset ring-plum-900/[0.06] dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10"
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

      {/* Nút Cuộn nhanh lên đầu trang (Back to top) */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.6, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 15, transition: TRANSITION.exit }}
            transition={TRANSITION.pop}
            aria-label="Cuộn lên đầu trang"
            title="Cuộn lên đầu trang"
            className="fixed bottom-20 right-6 z-30 lg:bottom-7 lg:right-7 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[#F27024] shadow-lg shadow-orange-500/10 backdrop-blur-md transition-all hover:bg-orange-50 hover:border-orange-300 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ArrowUp size={20} weight="bold" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
