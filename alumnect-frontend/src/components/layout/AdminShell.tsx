import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TRANSITION } from '@/lib/motion'
import { ShieldCheck, SignOut } from '@/components/icons'
import { cn } from '@/lib/utils'
import { ADMIN_NAV } from '@/lib/constants'
import { Avatar, Badge } from '@/components/ui/primitives'
import { useLogout } from '@/features/auth'
import { useAuthStore } from '@/store/authStore'

export function AdminShell() {
  const location = useLocation()
  const logoutM = useLogout()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="relative min-h-screen bg-surface-2 text-text-muted">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-grid mask-fade-b opacity-50" />
      <div className="pointer-events-none fixed right-0 top-0 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(253,230,138,0.25),transparent)]" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-solid text-on-primary shadow-raised">
            <ShieldCheck size={20} weight="fill" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-text">Bảng Quản Trị</p>
            <p className="text-xs text-text-subtle">Vận hành AlumNect</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition',
                    isActive ? 'text-primary-solid' : 'text-text-subtle hover:bg-surface-2 hover:text-text',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="admin-active"
                        className="absolute inset-0 -z-10 rounded-2xl bg-primary-soft ring-1 ring-inset ring-primary-soft-border"
                        transition={TRANSITION.indicator}
                      />
                    )}
                    {Icon && (
                      <Icon
                        size={20}
                        weight={isActive ? 'fill' : 'regular'}
                        className={cn(isActive ? 'text-primary-solid' : 'text-text-subtle')}
                      />
                    )}
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => logoutM.mutate()}
          className="m-3 flex items-center justify-center gap-2 rounded-2xl bg-danger-soft px-3.5 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-border/60 cursor-pointer"
        >
          <SignOut size={18} weight="bold" /> Đăng xuất
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Badge tone="gold">Quản trị</Badge>
            <span className="hidden text-sm text-text-subtle sm:block">FPTU AlumNect · Bảng điều khiển quản trị</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-bold text-text">{user?.name || 'Admin FPTU'}</span>
              <span className="block text-xs text-text-subtle">Quản trị viên</span>
            </span>
            <Avatar src={user?.avatarUrl} name={user?.name || 'Admin'} size={38} />
            <button
              type="button"
              onClick={() => logoutM.mutate()}
              aria-label="Đăng xuất"
              className="grid h-11 w-11 place-items-center rounded-full text-danger transition-colors hover:bg-danger-soft lg:hidden"
            >
              <SignOut size={20} weight="bold" />
            </button>
          </div>
        </header>

        {/* Điều hướng admin trên mobile/tablet: cùng danh sách ADMIN_NAV với sidebar, cuộn ngang */}
        <nav aria-label="Điều hướng quản trị" className="no-scrollbar sticky top-16 z-20 flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-primary-soft text-primary-solid' : 'text-text-subtle hover:bg-surface-2 hover:text-text',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {Icon && <Icon size={18} weight={isActive ? 'fill' : 'regular'} />}
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <main className="px-4 py-6 sm:px-8 sm:py-7">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={TRANSITION.page}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
