import { Outlet } from 'react-router-dom'
import { MarketingNavbar } from './MarketingNavbar'
import { MarketingFooter } from './MarketingFooter'
import { ScrollProgress } from '@/components/motion'

export function MarketingLayout() {
  return (
    <div className="relative min-h-screen bg-ink-900 text-plum-700">
      <ScrollProgress />
      <MarketingNavbar />
      <main>
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  )
}
