import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MentorshipSidebar } from './MentorshipSidebar'

export function MentorshipLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isChatPage = location.pathname.startsWith('/app/mentoring/chats/')

  return (
    <div
      className={cn(
        'mentoring-shell grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:h-full xl:min-h-0 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-6 2xl:grid-cols-[16rem_minmax(0,1fr)]',
        isChatPage && 'h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] xl:grid-rows-1'
      )}
    >
      <div className="min-w-0 xl:h-full xl:min-h-0">
        <MentorshipSidebar />
      </div>
      <div
        className={cn(
          'min-w-0 xl:h-full xl:min-h-0 xl:pr-2 chat-scrollbar',
          isChatPage ? 'h-full min-h-0 overflow-hidden' : 'xl:overflow-y-auto xl:pb-12'
        )}
      >
        {children}
      </div>
    </div>
  )
}
