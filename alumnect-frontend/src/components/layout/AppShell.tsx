import { useState, useEffect, useRef, useMemo } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Link, useLocation, Navigate, useNavigate } from 'react-router-dom'
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
  GlobeSimple,
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { APP_PRIMARY_NAV, APP_MORE_NAV, APP_ACCOUNT_NAV } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import { useSearchStore } from '@/store/searchStore'
import { useThemeStore } from '@/store/themeStore'
import { useTranslation } from 'react-i18next'
import { useLogout } from '@/features/auth/hooks/useAuthMutations'
import { useWebSocketChat } from '@/features/message/hooks/useWebSocketChat'
import { useWebSocketNotifications } from '@/features/notification/hooks/useWebSocketNotifications'
import { useUnreadNotificationCount } from '@/features/notification/hooks/useNotifications'
import { PageHeadingGuard } from './PageHeadingGuard'
import { RouteTransition } from './RouteTransition'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { LoginPromptModal } from '@/components/ui/LoginPromptModal'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { MentorshipLayout } from '@/features/mentorship/components/MentorshipLayout'
import { useClickOutside } from '@/hooks/useClickOutside'

/* ----------------------------- small popover ----------------------------- */
function Popover({
  isOpen,
  onToggle,
  onClose,
  button,
  ariaLabel,
  alignClass = 'right-0 origin-top-right',
  panelClass,
  children,
}: {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  button: ReactNode
  ariaLabel?: string
  alignClass?: string
  panelClass?: string
  children: ReactNode
}) {
  const popoverRef = useRef<HTMLDivElement>(null)
  useClickOutside(popoverRef, onClose, isOpen)

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex items-center cursor-pointer"
      >
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
              'absolute z-50 mt-2 rounded-2xl border border-border bg-surface p-2 shadow-soft',
              alignClass,
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
      className="group relative grid h-11 w-11 place-items-center rounded-2xl text-text-subtle transition-colors hover:bg-surface-2 hover:text-text active:scale-95"
    >
      <span className="transition-transform duration-200 group-hover:-translate-y-0.5">{icon}</span>
      {/* hover tooltip label */}
      <span className="pointer-events-none absolute top-[calc(100%-6px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-soft transition duration-200 group-hover:top-full group-hover:opacity-100 dark:bg-black dark:text-white">
        {label}
      </span>
      {badge ? (
        <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-xs font-bold text-text-inverse ring-2 ring-surface">
          {badge}
        </span>
      ) : dot ? (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral-400 ring-2 ring-surface" />
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

  // Kiểm tra điều khoản Mentoring khi đang ở các trang thuộc /app/mentoring
  const isMentoringRoute = location.pathname.startsWith('/app/mentoring')
  const isMentoringChatRoute = location.pathname.startsWith('/app/mentoring/chats/')

  // Ô tìm kiếm trên thanh đầu tìm bài viết ở Bảng tin: gõ chỉ cập nhật từ khóa, nhấn Enter mới chuyển về Bảng tin
  // (không tự nhảy trang giữa lúc đang gõ).
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value)
  }
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && location.pathname !== '/app') navigate('/app')
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

  const { t, i18n } = useTranslation()

  // Trạng thái ngôn ngữ (thiết kế kết nối i18n chuẩn hóa)
  const [currentLang, setCurrentLang] = useState<'vi' | 'en'>(() => {
    const saved = localStorage.getItem('alumnect_lang') as 'vi' | 'en'
    return (saved === 'en' || saved === 'vi') ? saved : (i18n.language?.startsWith('en') ? 'en' : 'vi')
  })
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)
  useClickOutside(langMenuRef, () => setLangMenuOpen(false), langMenuOpen)

  const handleSelectLang = (lang: 'vi' | 'en') => {
    setCurrentLang(lang)
    localStorage.setItem('alumnect_lang', lang)
    i18n.changeLanguage(lang)
    setLangMenuOpen(false)
  }

  const handleClearSearch = () => {
    setKeyword('')
  }

  // Đóng popover khi đổi trang hoặc nhấn phím Escape
  useEffect(() => {
    setActivePopover(null)
  }, [location.pathname])

  useEffect(() => {
    if (!activePopover && !sheet && !langMenuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null)
        setSheet(false)
        setLangMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activePopover, sheet, langMenuOpen])

  const logoutM = useLogout()
  // ADMIN đã được điều hướng về /admin ở trên, nên tại đây role chỉ còn STUDENT/ALUMNI.
  const roleLabel = user ? (user.role === 'STUDENT' ? t('common.student') : t('common.alumni')) : ''

  // Ánh xạ đường dẫn sang khóa đa ngôn ngữ
  const NAV_KEY_MAP: Record<string, { label: string; short?: string; tab?: string }> = {
    '/app': { label: 'nav.feed' },
    '/app/alumni': { label: 'nav.alumni' },
    '/app/jobs': { label: 'nav.jobs', tab: 'nav.jobsShort' },
    '/app/events': { label: 'nav.events' },
    '/app/forum': { label: 'nav.forum', short: 'nav.forumShort', tab: 'nav.forumShort' },
    '/app/groups': { label: 'nav.groups', short: 'nav.groups' },
    '/app/mentoring': { label: 'nav.mentoring', short: 'nav.mentoringShort' },
    '/app/salary': { label: 'nav.salary', short: 'nav.salaryShort' },
    '/app/map': { label: 'nav.map', short: 'nav.mapShort' },
    '/app/career': { label: 'nav.career', short: 'nav.careerShort' },
    '/app/profile': { label: 'nav.profile' },
    '/app/change-password': { label: 'nav.changePassword' },
    '/admin': { label: 'nav.adminPanel' },
    '/app/messages': { label: 'nav.messages' },
    '/app/notifications': { label: 'nav.notifications' },
  }

  // Bảng sắc thái pastel riêng cho từng tiện ích trong menu "Khám phá thêm" (hỗ trợ cả Light & Dark mode)
  const MORE_ITEM_TONE: Record<string, string> = {
    '/app/groups': 'bg-primary-soft text-primary-solid',
    '/app/mentoring': 'bg-info-soft text-info',
    '/app/salary': 'bg-success-soft text-success',
    '/app/map': 'bg-sky-500/12 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300',
    '/app/career': 'bg-warning-soft text-warning',
  }

  const isRouteActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`)

  const getNavLabel = (item: { to: string; label: string }) =>
    NAV_KEY_MAP[item.to]?.label ? t(NAV_KEY_MAP[item.to].label) : item.label

  const getNavShortLabel = (item: { to: string; label: string; shortLabel?: string }) =>
    NAV_KEY_MAP[item.to]?.short ? t(NAV_KEY_MAP[item.to].short!) : (item.shortLabel ?? getNavLabel(item))

  const getNavTabLabel = (item: { to: string; label: string; shortLabel?: string; tabLabel?: string }) =>
    NAV_KEY_MAP[item.to]?.tab ? t(NAV_KEY_MAP[item.to].tab!) : (item.tabLabel ?? getNavShortLabel(item))

  // Hội nhóm chỉ hiển thị cho Cựu sinh viên (ALUMNI), ẩn với Khách và Sinh viên (STUDENT).
  // Bản đồ cựu sinh viên (/app/map) và Lộ trình nghề nghiệp (/app/career) chỉ hiển thị cho STUDENT và ALUMNI.
  const visibleMoreNav = useMemo(
    () =>
      APP_MORE_NAV.filter((item) => {
        if (item.to === '/app/groups') return user?.role === 'ALUMNI'
        if (item.to === '/app/map' || item.to === '/app/career') {
          return user?.role === 'STUDENT' || user?.role === 'ALUMNI'
        }
        return true
      }),
    [user?.role]
  )

  const isMoreRouteActive = useMemo(
    () => visibleMoreNav.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)),
    [visibleMoreNav, location.pathname]
  )

  // Admin dùng khung riêng (đặt SAU mọi Hook để thứ tự Hook luôn cố định giữa các lần render)
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  // Menu "Khám phá" (desktop) — dạng thanh Capsule bo tròn thả dọc ở lề phải
  const renderMoreApps = (items: typeof APP_MORE_NAV) => {
    const isOpen = activePopover === 'apps'
    return (
      <div className="hidden lg:block">
        <Popover
          isOpen={isOpen}
          ariaLabel={t('nav.more')}
          onToggle={() => setActivePopover((prev) => (prev === 'apps' ? null : 'apps'))}
          onClose={() => setActivePopover(null)}
          alignClass="left-1/2 -translate-x-1/2 origin-top"
          panelClass="w-[96px] rounded-[28px] border-border/85 bg-surface/95 p-1.5 shadow-raised backdrop-blur-md"
          button={
            <span
              className={cn(
                'group relative grid h-11 w-11 place-items-center rounded-2xl transition-all active:scale-95',
                isOpen
                  ? 'bg-surface-2 text-primary-solid'
                  : isMoreRouteActive
                    ? 'text-primary-solid hover:bg-surface-2'
                    : 'text-text-subtle hover:bg-surface-2 hover:text-text',
              )}
            >
              <span
                className={cn(
                  'transition-transform duration-200',
                  isOpen ? 'scale-105' : 'group-hover:-translate-y-0.5',
                )}
              >
                <SquaresFour size={21} weight={isOpen || isMoreRouteActive ? 'fill' : 'regular'} />
              </span>
              {!isOpen && (
                <span className="pointer-events-none absolute top-[calc(100%-6px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-soft transition duration-200 group-hover:top-full group-hover:opacity-100 dark:bg-black dark:text-white">
                  {t('nav.more')}
                </span>
              )}
              {isMoreRouteActive && (
                <span className="absolute bottom-1.5 h-[3px] w-4 rounded-full bg-primary-solid" />
              )}
            </span>
          }
        >
          <div className="flex flex-col items-center gap-1">
            {items.map((item) => {
              const Icon = item.icon
              const itemActive = isRouteActive(item.to)
              const fullLabel = getNavLabel(item)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={fullLabel}
                  title={fullLabel}
                  className={cn(
                    'group relative flex w-full flex-col items-center gap-1 rounded-[20px] px-1.5 py-1.5 text-center transition-all duration-200 active:scale-95',
                    itemActive
                      ? 'bg-primary-soft ring-1 ring-inset ring-primary-soft-border'
                      : 'hover:bg-surface-2/85',
                  )}
                >
                  {Icon && (
                    <span
                      className={cn(
                        'grid h-9 w-9 place-items-center rounded-full transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105',
                        itemActive
                          ? 'bg-primary text-on-primary shadow-xs'
                          : (MORE_ITEM_TONE[item.to] ?? 'bg-primary-soft text-primary-solid'),
                      )}
                    >
                      <Icon size={18} weight={itemActive ? 'fill' : 'regular'} />
                    </span>
                  )}
                  <span
                    className={cn(
                      'w-full truncate text-2xs font-semibold leading-tight transition-colors',
                      itemActive ? 'font-bold text-primary-solid' : 'text-text-muted group-hover:text-text',
                    )}
                  >
                    {getNavShortLabel(item)}
                  </span>
                </Link>
              )
            })}
          </div>
        </Popover>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-surface-2 text-text-muted dark:!bg-bg">
      {/* ambient FPT brand wash (hidden in dark mode for pure Facebook look) */}
      <div className="pointer-events-none fixed inset-0 -z-10 dark:hidden">
        <div className="absolute left-0 top-0 h-[36rem] w-[36rem] bg-[radial-gradient(closest-side,rgba(242,112,36,0.10),transparent)]" />
        <div className="absolute bottom-0 right-0 h-[36rem] w-[36rem] bg-[radial-gradient(closest-side,rgba(0,79,158,0.10),transparent)]" />
      </div>

      {/* ===== top header ===== */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface shadow-xs">
        {/* Top FPT Brand Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-[#F27024] via-[#004F9E] to-[#009A3E]" />
        <div className="mx-auto flex h-15 w-full max-w-[1536px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Logo />

            {/* desktop search */}
            <label className="relative ml-1 hidden items-center md:flex lg:ml-2">
              <MagnifyingGlass size={17} className="pointer-events-none absolute left-3 text-text-subtle" />
              <input
                aria-label={t('common.searchPlaceholder')}
                value={keyword}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder={t('common.searchPlaceholder')}
                className="h-9.5 w-40 rounded-full border border-border bg-surface-2 pl-9 pr-8 text-sm text-text placeholder:text-text-subtle transition focus:border-[#F27024]/80 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 lg:w-48 xl:w-56"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label={t('common.search')}
                  className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-text-subtle hover:bg-surface-3 hover:text-text-muted transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </label>
          </div>

          {/* primary nav (centre) */}
          <nav className="hidden h-full min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:gap-2">
            {APP_PRIMARY_NAV.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  aria-label={getNavLabel(item)}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex h-full w-20 xl:w-24 items-center justify-center transition-colors',
                      isActive ? 'text-primary-solid' : 'text-text-subtle hover:text-text',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        'flex h-11 w-full items-center justify-center rounded-xl transition-colors duration-200',
                        isActive ? 'bg-primary-soft text-primary-solid' : 'hover:bg-surface-2 text-text-subtle hover:text-text'
                      )}>
                        {Icon && (
                          <Icon
                            size={23}
                            weight={isActive ? 'fill' : 'regular'}
                            className={cn('transition duration-200 group-hover:scale-110', isActive && 'text-primary-solid')}
                          />
                        )}
                      </div>

                      {/* hover tooltip label */}
                      <span className="pointer-events-none absolute top-[calc(100%+4px)] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 group-hover:translate-y-0.5 dark:bg-black dark:text-white">
                        {getNavLabel(item)}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="app-tab"
                          className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-primary-solid"
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
          <div className="ml-auto flex items-center justify-end gap-1 sm:gap-2 lg:ml-0">
            {/* mobile search toggle */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={t('common.search')}
              className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl text-text-subtle hover:bg-surface-2 md:hidden"
            >
              <MagnifyingGlass size={20} />
            </button>

            {isAuthenticated ? (
              <>
                <IconLink
                  to="/app/messages"
                  label={t('nav.messages')}
                  icon={<Chats size={20} weight={location.pathname === '/app/messages' ? 'fill' : 'regular'} />}
                />
                <IconLink
                  to="/app/notifications"
                  label={t('nav.notifications')}
                  icon={<Bell size={20} weight={location.pathname === '/app/notifications' ? 'fill' : 'regular'} />}
                  badge={unreadNotifCount && unreadNotifCount > 0 ? unreadNotifCount : undefined}
                />

                {renderMoreApps(visibleMoreNav)}

                {/* account */}
                <Popover
                  isOpen={activePopover === 'account'}
                  onToggle={() => setActivePopover((prev) => (prev === 'account' ? null : 'account'))}
                  onClose={() => setActivePopover(null)}
                  panelClass="w-64"
                  button={
                    <span className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-surface-2">
                      <Avatar src={user?.avatarUrl} name={user?.name ?? ''} size={36} ring />
                      <CaretDown size={15} weight="bold" className="hidden text-text-subtle sm:block" />
                    </span>
                  }
                >
                  <Link to="/app/profile" className="mb-1 flex items-center gap-3 rounded-xl p-2.5 hover:bg-surface-2 transition-colors">
                    <Avatar src={user?.avatarUrl} name={user?.name ?? ''} size={42} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-text">{user?.name}</p>
                      <p className="truncate text-xs text-text-subtle">{user?.verified ? `${t('common.verified')} · ` : ''}{roleLabel}</p>
                    </div>
                  </Link>

                  <div className="my-1 h-px bg-border" />
                  {APP_ACCOUNT_NAV
                    .filter((item) => item.to !== '/admin' || user?.role === 'ADMIN')
                    .map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                        >
                          {Icon && <Icon size={18} weight="regular" className="text-text-subtle" />}
                          {getNavLabel(item)}
                        </Link>
                      )
                    })}
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => logoutM.mutate()}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger transition-colors hover:bg-coral-300/25 dark:hover:bg-rose-500/15"
                  >
                    <SignOut size={18} weight="bold" /> {t('common.logout')}
                  </button>
                </Popover>
              </>
            ) : (
              <Link to="/login" className="ml-1">
                <Button size="sm" variant="primary" className="rounded-xl font-bold shadow-sm">
                  {t('common.login')}
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
              transition={TRANSITION.height}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <label className="relative flex items-center px-4 py-3">
                <MagnifyingGlass size={17} className="pointer-events-none absolute left-7 text-text-subtle" />
                <input
                  aria-label={t('common.searchPlaceholder')}
                  autoFocus
                  value={keyword}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t('common.searchPlaceholder')}
                  className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-9 text-sm text-text placeholder:text-text-subtle focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label={t('common.clearSearch')}
                    className="absolute right-7 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-text-subtle hover:bg-surface-2 hover:text-text-muted transition-colors"
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
            ? "max-w-7xl px-3 sm:px-6 lg:px-8 py-3 h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] overflow-y-auto no-scrollbar lg:h-[calc(100vh-3.85rem)]"
            : isMentoringChatRoute
              ? "h-[calc(100dvh-7.65rem)] max-w-[1560px] overflow-hidden px-3 py-3 sm:px-6 lg:h-[calc(100dvh-4.1rem)] lg:px-8"
              : isMentoringRoute
                ? "h-[calc(100vh-7.65rem)] max-w-[1560px] overflow-y-auto overscroll-contain px-3 pb-8 pt-3 scroll-pb-8 sm:px-6 lg:h-auto lg:overflow-visible lg:px-8 lg:pb-10 xl:h-[calc(100vh-4.1rem)] xl:overflow-hidden xl:pb-3"
                : "max-w-7xl px-4 sm:px-6 lg:px-8 pb-28 pt-6 lg:pb-10"
      )}>
        <PageHeadingGuard />
        <ErrorBoundary>
          {isMentoringRoute ? (
            <MentorshipLayout>
              <RouteTransition className={isMentoringChatRoute ? 'h-full min-h-0 overflow-hidden' : 'xl:min-h-full'} />
            </MentorshipLayout>
          ) : (
            <RouteTransition className={location.pathname === '/app/messages' ? 'h-full min-h-0' : undefined} />
          )}
        </ErrorBoundary>
      </main>

      {/* ===== mobile bottom tab bar ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
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
                    'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-1.5 pt-2 text-xs font-semibold tracking-tight transition-colors',
                    isActive ? 'text-primary-solid' : 'text-text-subtle hover:text-text',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="app-tab-mobile"
                        className="absolute left-1/2 top-1.5 h-8 w-14 -translate-x-1/2 rounded-full bg-primary-soft"
                        transition={TRANSITION.indicator}
                      />
                    )}
                    {Icon && (
                      <Icon
                        size={22}
                        weight={isActive ? 'fill' : 'regular'}
                        className={cn('relative', isActive && 'text-primary-solid')}
                      />
                    )}
                    <span className="relative w-full truncate text-center">{getNavTabLabel(item)}</span>
                  </>
                )}
              </NavLink>
            )
          })}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setSheet(true)}
              className={cn(
                'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-1.5 pt-2 text-xs font-semibold tracking-tight transition-colors',
                sheet || isMoreRouteActive ? 'text-primary-solid' : 'text-text-subtle hover:text-text',
              )}
            >
              {isMoreRouteActive && !sheet && (
                <motion.span
                  layoutId="app-tab-mobile"
                  className="absolute left-1/2 top-1.5 h-8 w-14 -translate-x-1/2 rounded-full bg-primary-soft"
                  transition={TRANSITION.indicator}
                />
              )}
              <SquaresFour size={22} weight={sheet || isMoreRouteActive ? 'fill' : 'regular'} className="relative" />
              <span className="relative">{t('nav.more')}</span>
            </button>
          )}
        </div>
      </nav>

      {/* ===== mobile "more" sheet ===== */}
      <AnimatePresence>
        {sheet && isAuthenticated && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-overlay lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: TRANSITION.exit }}
              transition={TRANSITION.overlay}
              onClick={() => setSheet(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-bg p-5 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-overlay lg:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={TRANSITION.sheet}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-3" />
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-text">{t('nav.moreSheet')}</h3>
                <button onClick={() => setSheet(false)} aria-label={t('common.close')} className="grid h-11 w-11 place-items-center rounded-full text-text-subtle hover:bg-surface-2">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3" onClick={() => setSheet(false)}>
                {visibleMoreNav.map((item) => {
                  const Icon = item.icon
                  const itemActive = isRouteActive(item.to)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-2xl bg-surface p-4 text-center text-xs font-semibold transition-colors ring-1 ring-inset',
                        itemActive
                          ? 'bg-primary-soft text-primary-solid ring-primary-soft-border'
                          : 'text-text-muted ring-border hover:bg-surface-2',
                      )}
                    >
                      {Icon && (
                        <span
                          className={cn(
                            'grid h-11 w-11 place-items-center rounded-full',
                            itemActive
                              ? 'bg-primary text-on-primary shadow-xs'
                              : (MORE_ITEM_TONE[item.to] ?? 'bg-primary-soft text-primary-solid'),
                          )}
                        >
                          <Icon size={20} weight={itemActive ? 'fill' : 'regular'} />
                        </span>
                      )}
                      {getNavLabel(item)}
                    </Link>
                  )
                })}
              </div>



              <div className="mt-3 grid grid-cols-2 gap-2" onClick={() => setSheet(false)}>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/app/profile"
                      className="col-span-2 rounded-xl bg-surface px-4 py-3 text-center text-sm font-semibold text-text-muted ring-1 ring-inset ring-border"
                    >
                      {t('nav.profile')}
                    </Link>
                    <button onClick={() => logoutM.mutate()} className="col-span-2 rounded-xl bg-danger-soft px-4 py-3 text-center text-sm font-semibold text-danger">{t('common.logout')}</button>
                  </>
                ) : (
                  <Link to="/login" className="col-span-2 rounded-xl bg-primary-solid px-4 py-3 text-center text-sm font-semibold text-on-primary shadow-raised hover:bg-primary-hover">{t('common.login')}</Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Preferences Dock (Theme & Language Switcher) - Góc dưới bên trái (Mini Compact) */}
      <div className={cn(
        'fixed z-30 items-center rounded-full border border-border bg-surface p-1 shadow-raised transition-all hover:shadow-overlay lg:bottom-6 lg:left-6 lg:right-auto lg:top-auto lg:flex',
        isMentoringRoute ? 'right-3 top-[4.55rem] flex' : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 flex',
      )}>
        {/* Nút chuyển chế độ Sáng / Tối */}
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
          title={theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
          className="group relative grid h-9 w-9 place-items-center rounded-full text-text-subtle hover:bg-surface-2 hover:text-text transition-all cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun size={15} weight="fill" className="text-warning transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon size={15} weight="fill" className="text-text-muted transition-transform duration-300 group-hover:-rotate-12" />
          )}
          {/* Tooltip khi hover */}
          <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-50 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-xs font-medium text-white opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 dark:bg-white dark:text-slate-900">
            {theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
          </span>
        </button>

        {/* Divider chia tách Theme và Language */}
        <div className="mx-0.5 h-3.5 w-px bg-surface-3" />

        {/* Nút Ngôn ngữ (Language Switcher) */}
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen((prev) => !prev)}
            aria-label={t('common.language')}
            title={t('common.language')}
            className="group relative flex h-9 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-text-muted hover:bg-surface-2 hover:text-text transition-all cursor-pointer"
          >
            <GlobeSimple size={14} weight="bold" className="text-text-subtle group-hover:text-primary-solid transition-colors" />
            <span className="tracking-wider">{currentLang.toUpperCase()}</span>
          </button>

          {/* Menu chọn ngôn ngữ khi click */}
          <AnimatePresence>
            {langMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={TRANSITION.pop}
                className="absolute bottom-full left-0 mb-1.5 w-32 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg backdrop-blur-md"
              >
                <div className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-text-subtle">
                  {t('common.language')}
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectLang('vi')}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    currentLang === 'vi'
                      ? 'bg-primary-soft text-primary-solid'
                      : 'text-text-muted hover:bg-surface-2'
                  )}
                >
                  <span className="flex items-center gap-1.5">🇻🇳 {t('common.vietnamese')}</span>
                  {currentLang === 'vi' && <span className="h-1.5 w-1.5 rounded-full bg-primary-solid" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectLang('en')}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    currentLang === 'en'
                      ? 'bg-primary-soft text-primary-solid'
                      : 'text-text-muted hover:bg-surface-2'
                  )}
                >
                  <span className="flex items-center gap-1.5">🇬🇧 {t('common.english')}</span>
                  {currentLang === 'en' && <span className="h-1.5 w-1.5 rounded-full bg-primary-solid" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
            aria-label={t('common.scrollToTop')}
            title={t('common.scrollToTop')}
            className="fixed bottom-20 right-6 z-30 lg:bottom-7 lg:right-7 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-primary-solid transition hover:bg-primary-soft hover:border-orange-300 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ArrowUp size={20} weight="bold" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
