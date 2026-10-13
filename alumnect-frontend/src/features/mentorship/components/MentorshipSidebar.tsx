import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useMentorStatus } from '../hooks/useMentorStatus'
import { MENTORSHIP_NAVIGATION, type MentorshipNavigationItem } from '../constants/mentorshipNavigation'

type MentorshipSidebarContentProps = {
  onNavigate?: () => void
}

function MentorshipSidebarContent({ onNavigate }: MentorshipSidebarContentProps) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const isAlumni = user?.role === 'ALUMNI'
  const { data: mentorStatus } = useMentorStatus(isAlumni)
  const hasMentorProfile = mentorStatus?.hasMentorProfile ?? false

  const sections = useMemo(
    () =>
      MENTORSHIP_NAVIGATION.map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.planned || (item.audience === 'alumni' && !isAlumni)) return false
          if (item.visibility === 'without-profile') return !hasMentorProfile
          if (item.visibility === 'with-profile') return hasMentorProfile
          return true
        }),
      })).filter((section) => section.items.length > 0),
    [hasMentorProfile, isAlumni],
  )

  const activeItemKey = useMemo(() => {
    const allItems = sections.flatMap((section) =>
      section.items.map((item) => ({
        key: `${section.label}-${item.to}-${item.label}`,
        item,
      })),
    )

    // 1. Kiểm tra khớp chính xác URL (Exact match)
    const exactMatch = allItems.find(({ item }) => {
      const paths = item.activePaths ?? [item.to]
      return paths.includes(location.pathname)
    })
    if (exactMatch) return exactMatch.key

    // 2. Kiểm tra khớp tiền tố (Prefix match) cho các trang con chi tiết (ngoại trừ item có end: true)
    const prefixMatches = allItems.filter(({ item }) => {
      if (item.end) return false
      const paths = item.activePaths ?? [item.to]
      return paths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))
    })

    if (prefixMatches.length === 0) return null
    if (prefixMatches.length === 1) return prefixMatches[0].key

    // 3. Nếu có nhiều mục cùng khớp tiền tố, ưu tiên mục có đường dẫn dài nhất (chi tiết nhất)
    prefixMatches.sort((a, b) => {
      const maxA = Math.max(...(a.item.activePaths ?? [a.item.to]).map((p) => p.length))
      const maxB = Math.max(...(b.item.activePaths ?? [b.item.to]).map((p) => p.length))
      return maxB - maxA
    })
    return prefixMatches[0].key
  }, [sections, location.pathname])

  const renderItem = (sectionLabel: string, item: MentorshipNavigationItem) => {
    const Icon = item.icon
    const itemKey = `${sectionLabel}-${item.to}-${item.label}`
    const isActive = itemKey === activeItemKey

    return (
      <NavLink
        key={itemKey}
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={cn(
          'group relative flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors duration-150',
          isActive
            ? 'text-brand-700 dark:text-brand-300'
            : 'text-plum-600 hover:bg-plum-900/[0.04] hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:bg-white/[0.05] dark:hover:text-white',
        )}
      >
        {isActive && (
          <motion.span
            layoutId="mentorship-sidebar-active-indicator"
            className="absolute inset-0 rounded-2xl bg-brand-100/90 shadow-[inset_3px_0_0_#f27024] dark:bg-brand-500/15"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex w-full items-center gap-3">
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105',
              isActive ? 'text-brand-600 dark:text-brand-400' : 'text-plum-400 dark:text-[#8f9399]',
            )}
          />
          <span className="min-w-0 truncate">{item.label}</span>
        </span>
      </NavLink>
    )
  }

  return (
    <div className="pr-1">
      <nav aria-label="Điều hướng Mentorship" className="space-y-5">
        {sections.map((section) => (
          <section
            key={section.label}
            className="border-t border-plum-900/[0.07] pt-4 first:border-t-0 first:pt-0 dark:border-[#393a3b]"
          >
            <h3 className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-plum-400 dark:text-[#8f9399]">
              {section.label}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => renderItem(section.label, item))}
            </div>
          </section>
        ))}
      </nav>

      {isAlumni && mentorStatus && (
        <div className="mt-6 border-t border-plum-900/[0.07] px-3 pt-4 dark:border-[#393a3b]">
          <p className="text-[11px] font-semibold text-plum-400 dark:text-[#8f9399]">Trạng thái hiện tại</p>
          <p className="mt-1 text-xs font-bold text-plum-700 dark:text-[#e4e6eb]">{mentorStatus.statusMessage}</p>
        </div>
      )}
    </div>
  )
}

export function MentorshipSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="mb-4 xl:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-plum-900/[0.08] bg-white px-4 text-sm font-bold text-plum-700 shadow-xs transition-colors hover:bg-brand-50 hover:text-brand-700 sm:w-auto dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb] dark:hover:bg-brand-500/15 dark:hover:text-brand-300"
          aria-expanded={isOpen}
          aria-controls="mentorship-mobile-drawer"
        >
          <Menu className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Menu Mentorship
        </button>
      </div>

      <aside className="sticky top-20 hidden max-h-[calc(100vh-5.5rem)] w-full overflow-y-auto pb-6 pt-2 xl:block scrollbar-thin" aria-label="Mentorship sidebar">
        <MentorshipSidebarContent />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Đóng menu Mentorship"
              className="fixed inset-0 top-16 z-40 bg-plum-900/30 backdrop-blur-sm xl:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              id="mentorship-mobile-drawer"
              className="fixed inset-y-0 left-0 top-16 z-50 w-[min(88vw,320px)] overflow-y-auto border-r border-plum-900/[0.08] bg-cream-50 px-4 py-5 shadow-2xl dark:border-[#393a3b] dark:bg-[#18191a] xl:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            >
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Đóng menu Mentorship"
                  className="grid h-9 w-9 place-items-center rounded-xl text-plum-400 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c] dark:hover:text-white"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <MentorshipSidebarContent onNavigate={() => setIsOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
