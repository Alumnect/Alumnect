import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useMentorStatus } from '../hooks/useMentorStatus'
import { useMentoringTermsStatus } from '../hooks/useMentoringTerms'
import {
  MENTORSHIP_NAVIGATION,
  MENTORSHIP_TERMS_ITEM,
  type MentorshipNavigationItem,
} from '../constants/mentorshipNavigation'
import { mentoringGroupApi } from '../api/mentoringGroupApi'
import { useConversations } from '@/features/message'
import { useIncomingMentoringRequests } from '../hooks/useIncomingMentoringRequests'

type MentorshipSidebarContentProps = { onNavigate?: () => void }

function MentorshipSidebarContent({ onNavigate }: MentorshipSidebarContentProps) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const isAlumni = user?.role === 'ALUMNI'
  const { data: termsStatus } = useMentoringTermsStatus()
  const hasAcceptedTerms = termsStatus?.accepted === true
  const { data: mentorStatus } = useMentorStatus(isAlumni && hasAcceptedTerms)
  const hasMentorProfile = mentorStatus?.hasMentorProfile ?? false
  const { data: pendingIncomingRequests } = useIncomingMentoringRequests({
    status: 'PENDING',
    page: 0,
    size: 1,
    enabled: hasMentorProfile && mentorStatus?.active === true,
  })
  const { data: mentoringConversations = [] } = useConversations('primary', 'MENTORING')
  const { data: groupInvitations = [] } = useQuery({
    queryKey: ['mentoring-groups', 'invitations'],
    queryFn: () => mentoringGroupApi.getInvitations(),
    enabled: hasAcceptedTerms,
    staleTime: 30_000,
  })

  const mentoringUnreadCount = mentoringConversations.reduce((sum, item) => sum + item.unreadCount, 0)

  const isVisible = (item: MentorshipNavigationItem) => {
    if (item.planned || (item.audience === 'alumni' && !isAlumni)) return false
    if (item.visibility === 'without-profile') return !hasMentorProfile
    if (item.visibility === 'with-profile') return hasMentorProfile
    return true
  }

  const sections = useMemo(() => {
    if (!hasAcceptedTerms) return []
    return MENTORSHIP_NAVIGATION.map((section) => ({
      ...section,
      items: section.items
        .filter(isVisible)
        .map((item) => ({ ...item, children: item.children?.filter(isVisible) }))
        .filter((item) => !item.children || item.children.length > 0),
    })).filter((section) => section.items.length > 0)
  }, [hasAcceptedTerms, hasMentorProfile, isAlumni])

  const allLeafItems = useMemo(() => sections.flatMap((section) =>
    section.items.flatMap((item) => item.children ?? [item])), [sections])

  const activeItem = useMemo(() => {
    if (location.pathname.endsWith('/request')) {
      const createItem = allLeafItems.find((item) => item.to === '/app/mentoring/requests/create')
      if (createItem) return createItem
    }
    const exact = allLeafItems.find((item) => {
      const paths = item.activePaths ?? (item.to ? [item.to] : [])
      return paths.includes(location.pathname)
    })
    if (exact) return exact
    return allLeafItems
      .filter((item) => !item.end && (item.activePaths ?? (item.to ? [item.to] : []))
        .some((path) => location.pathname.startsWith(`${path}/`)))
      .sort((a, b) => Math.max(...(b.activePaths ?? [b.to ?? '']).map((path) => path.length)) - Math.max(...(a.activePaths ?? [a.to ?? '']).map((path) => path.length)))[0]
  }, [allLeafItems, location.pathname])

  const activeParentLabels = useMemo(() => new Set(sections.flatMap((section) =>
    section.items.filter((item) => item.children?.includes(activeItem as MentorshipNavigationItem)).map((item) => item.label))), [activeItem, sections])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!activeParentLabels.size) return
    setExpanded((current) => new Set([...current, ...activeParentLabels]))
  }, [activeParentLabels])

  const badgeFor = (item: MentorshipNavigationItem) => {
    if (item.to === '/app/mentoring/messages') return mentoringUnreadCount
    if (item.to === '/app/mentoring/groups') return groupInvitations.length
    if (item.to === '/app/mentoring/incoming-requests') return pendingIncomingRequests?.totalElements ?? 0
    return 0
  }

  const renderBadge = (count: number) => count > 0 ? (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-solid px-1.5 text-xs font-extrabold text-on-primary shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  ) : null

  const renderLink = (item: MentorshipNavigationItem, nested = false) => {
    if (!item.to) return null
    const Icon = item.icon
    const isActive = activeItem === item || item.to === location.pathname
    return (
      <NavLink
        key={`${item.label}-${item.to}`}
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={cn(
          'group relative flex items-center rounded-xl font-medium transition-all duration-150',
          nested ? 'h-8 gap-2 pl-8 pr-2.5 text-[12px]' : 'h-10 gap-2.5 px-3 text-[13px]',
          isActive
            ? 'bg-primary-soft font-semibold text-primary-solid shadow-[inset_3px_0_0_#f27024]'
            : 'text-text-muted hover:bg-surface-2 hover:text-text dark:hover:bg-white/[0.05]',
        )}
      >
        <Icon className={cn('shrink-0 transition-colors', nested ? 'h-3.5 w-3.5' : 'h-4 w-4', isActive ? 'text-primary-solid' : 'text-text-subtle')} />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {renderBadge(badgeFor(item))}
      </NavLink>
    )
  }

  const renderParent = (item: MentorshipNavigationItem) => {
    const Icon = item.icon
    const isOpen = expanded.has(item.label)
    const isActive = item.children?.includes(activeItem as MentorshipNavigationItem) ?? false
    return (
      <div key={item.label}>
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setExpanded((current) => {
            const next = new Set(current)
            next.has(item.label) ? next.delete(item.label) : next.add(item.label)
            return next
          })}
          className={cn(
            'group flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] font-medium transition-colors',
            isActive ? 'font-semibold text-primary-solid' : 'text-text-muted hover:bg-surface-2 hover:text-text dark:hover:bg-white/[0.05]',
          )}
        >
          <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-solid' : 'text-text-subtle')} />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-text-subtle transition-transform duration-200', isOpen && 'rotate-180')} />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="relative ml-4 space-y-0.5 py-1 before:absolute before:bottom-2 before:left-1 before:top-1 before:w-px before:bg-plum-900/[0.08] dark:before:bg-white/10">
                {item.children?.map((child) => renderLink(child, true))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-3 flex items-center gap-2.5 px-2 pt-1">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm"><Sparkles className="h-4 w-4" /></span>
        <div className="min-w-0"><p className="text-sm font-extrabold text-text">Mentoring</p><p className="truncate text-xs text-text-subtle">Kết nối · Hợp tác · Đồng hành</p></div>
      </div>

      {hasAcceptedTerms ? (
        <nav aria-label="Điều hướng Mentoring" className="space-y-3">
          {sections.map((section) => (
            <section key={section.label} className="border-t border-border pt-2.5 first:border-t-0 first:pt-0">
              <h3 className="mb-1 px-3 text-xs font-bold uppercase tracking-[0.12em] text-plum-400/80 dark:text-text-subtle">{section.label}</h3>
              <div className="space-y-0.5">{section.items.map((item) => item.children ? renderParent(item) : renderLink(item))}</div>
            </section>
          ))}
        </nav>
      ) : (
        <div className="rounded-xl border border-primary-soft-border bg-brand-50/70 p-3 dark:bg-brand-500/10">
          <p className="text-xs font-bold text-text">Hoàn tất bước xác nhận</p>
          <p className="mt-1 text-xs leading-4 text-text-subtle">Đọc và chấp nhận điều khoản để sử dụng các chức năng Mentoring.</p>
        </div>
      )}

      <div className="mt-3 border-t border-border pt-2.5">
        {renderLink(MENTORSHIP_TERMS_ITEM)}
        {hasAcceptedTerms && isAlumni && mentorStatus && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-brand-100/70 bg-primary-soft px-3 py-2 dark:border-brand-500/20">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', mentorStatus.active ? 'bg-success' : 'bg-warning')} />
            <div className="min-w-0 flex-1"><p className="text-xs text-text-subtle">Trạng thái Mentor</p><p className="truncate text-xs font-semibold text-text">{mentorStatus.active ? 'Mentor đang hoạt động' : mentorStatus.statusMessage}</p></div>
          </div>
        )}
      </div>
    </div>
  )
}

export function MentorshipSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <div className="mb-4 xl:hidden">
        <button type="button" onClick={() => setIsOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text-muted shadow-xs transition-colors hover:bg-primary-soft hover:text-primary-solid" aria-expanded={isOpen} aria-controls="mentorship-mobile-drawer"><Menu className="h-4 w-4 text-primary-solid" /> Menu Mentoring</button>
      </div>
      <aside className="hidden h-full min-h-0 w-full overflow-y-auto no-scrollbar xl:block" aria-label="Mentoring sidebar">
        <div className="min-h-full rounded-2xl border border-border bg-surface p-2.5 shadow-xs"><MentorshipSidebarContent /></div>
      </aside>
      <AnimatePresence>
        {isOpen && <><motion.button type="button" aria-label="Đóng menu Mentoring" className="fixed inset-0 top-16 z-40 bg-plum-900/30 backdrop-blur-sm dark:bg-black/60 xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} /><motion.aside id="mentorship-mobile-drawer" className="fixed inset-y-0 left-0 top-16 z-50 w-[min(88vw,310px)] overflow-y-auto no-scrollbar border-r border-border bg-surface p-4 shadow-2xl xl:hidden" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 340, damping: 32 }}><div className="mb-2 flex justify-end"><button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng menu Mentoring" className="grid h-8 w-8 place-items-center rounded-lg text-text-subtle hover:bg-surface-2 hover:text-text"><X className="h-4 w-4" /></button></div><MentorshipSidebarContent onNavigate={() => setIsOpen(false)} /></motion.aside></>}
      </AnimatePresence>
    </>
  )
}
