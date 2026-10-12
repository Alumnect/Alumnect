import type { ReactNode } from 'react'
import { MentorshipSidebar } from './MentorshipSidebar'

export function MentorshipLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-7 2xl:grid-cols-[16.5rem_minmax(0,1fr)]">
      <div className="min-w-0">
        <MentorshipSidebar />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
