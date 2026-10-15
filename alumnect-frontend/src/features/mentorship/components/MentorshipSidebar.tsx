import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useMentorStatus } from '../hooks/useMentorStatus'
import { useMentoringTermsStatus } from '../hooks/useMentoringTerms'
import { MENTORSHIP_NAVIGATION, type MentorshipNavigationItem } from '../constants/mentorshipNavigation'
import { useConversations } from '@/features/message'

type MentorshipSidebarContentProps = {
  onNavigate?: () => void
}

function MentorshipSidebarContent({ onNavigate }: MentorshipSidebarContentProps) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const isAlumni = user?.role === 'ALUMNI'
  const { data: termsStatus } = useMentoringTermsStatus()
  const hasAcceptedTerms = termsStatus?.accepted === true
  const { data: mentorStatus } = useMentorStatus(isAlumni && hasAcceptedTerms)
  const hasMentorProfile = mentorStatus?.hasMentorProfile ?? false
  const { data: mentoringConversations = [] } = useConversations('primary', 'MENTORING')
  const mentoringUnreadCount = mentoringConversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  )

  const sections = useMemo(
    () =>
      MENTORSHIP_NAVIGATION.map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!hasAcceptedTerms) return item.to === '/app/mentoring/terms'
          if (item.planned || (item.audience === 'alumni' && !isAlumni)) return false
          if (item.visibility === 'without-profile') return !hasMentorProfile
          if (item.visibility === 'with-profile') return hasMentorProfile
          return true
        }),
      })).filter((section) => section.items.length > 0),
    [hasAcceptedTerms, hasMentorProfile, isAlumni],
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
          'group relative flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-medium transition-all duration-150',
          isActive
            ? 'font-semibold text-brand-700 dark:text-brand-300'
            : 'text-plum-600 hover:bg-plum-900/[0.04] hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:bg-white/[0.05] dark:hover:text-white',
        )}
      >
        {isActive && (
          <motion.span
            layoutId="mentorship-sidebar-active-indicator"
            className="absolute inset-0 rounded-xl bg-brand-50 shadow-[inset_2.5px_0_0_#f27024] dark:bg-brand-500/15"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex w-full items-center gap-2.5">
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105',
              isActive ? 'text-brand-600 dark:text-brand-400' : 'text-plum-400 dark:text-[#8f9399]',
            )}
          />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.to === '/app/mentoring/messages' && mentoringUnreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
              {mentoringUnreadCount > 99 ? '99+' : mentoringUnreadCount}
            </span>
          )}
        </span>
      </NavLink>
    )
  }

  return (
    <div>
      <nav aria-label="Điều hướng Mentorship" className="space-y-3">
        {sections.map((section) => (
          <section
            key={section.label}
            className="border-t border-plum-900/[0.06] pt-2.5 first:border-t-0 first:pt-0 dark:border-[#393a3b]"
          >
            <h3 className="mb-1 px-2.5 text-[11px] font-bold uppercase tracking-wider text-plum-400/80 dark:text-[#8f9399]">
              {section.label}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => renderItem(section.label, item))}
            </div>
          </section>
        ))}
      </nav>

      {hasAcceptedTerms && isAlumni && mentorStatus && (
        <div className="mt-3 border-t border-plum-900/[0.06] pt-2.5 dark:border-[#393a3b]">
          <div className="flex items-center gap-2 rounded-xl bg-brand-50/60 px-2.5 py-1.5 border border-brand-100/70 dark:bg-brand-500/10 dark:border-brand-500/20">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-plum-400 dark:text-[#8f9399]">Trạng thái Mentor</p>
              <p className="text-xs font-semibold leading-5 text-plum-800 dark:text-[#e4e6eb]">
                {mentorStatus.active ? 'Hồ sơ Mentor đã sẵn sàng.' : mentorStatus.statusMessage}
              </p>
            </div>
          </div>
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
          className="inline-flex min-h-11 w-auto items-center justify-center gap-2 rounded-xl border border-plum-900/[0.08] bg-white px-4 text-sm font-semibold text-plum-700 shadow-xs transition-colors hover:bg-brand-50 hover:text-brand-700 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb] dark:hover:bg-brand-500/15 dark:hover:text-brand-300"
          aria-expanded={isOpen}
          aria-controls="mentorship-mobile-drawer"
        >
          <Menu className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Menu Mentorship
        </button>
      </div>

      <aside
        className="hidden h-full min-h-0 w-full overflow-y-auto no-scrollbar xl:block"
        aria-label="Mentorship sidebar"
      >
        <div className="rounded-2xl border border-plum-900/[0.07] bg-white p-2.5 shadow-xs dark:border-[#393a3b] dark:bg-[#242526]">
          <MentorshipSidebarContent />
        </div>
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Đóng menu Mentorship"
              className="fixed inset-0 top-16 z-40 bg-plum-900/30 backdrop-blur-sm dark:bg-black/60 xl:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              id="mentorship-mobile-drawer"
              className="fixed inset-y-0 left-0 top-16 z-50 w-[min(88vw,300px)] overflow-y-auto no-scrollbar border-r border-plum-900/[0.08] bg-white p-4 shadow-2xl dark:border-[#393a3b] dark:bg-[#18191a] xl:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            >
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Đóng menu Mentorship"
                  className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c] dark:hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
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
