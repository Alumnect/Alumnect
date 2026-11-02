/**
 * GroupsPage — Trang Hội nhóm: khám phá và kết nối các cộng đồng cựu sinh viên FPTU.
 *
 * Cải tiến UI/UX phong cách Threads/Instagram:
 *  - Banner định vị cộng đồng phong cách Warm Pastel cao cấp.
 *  - Bộ lọc danh mục dạng thẻ viên thuốc (Pill chips) lướt ngang mượt mà.
 *  - Chuyển tab "Khám phá" và "Nhóm của tôi" với hoạt họa Framer Motion.
 *  - Lưới thẻ hội nhóm 3 cột chuẩn chỉ, khoảng cách rộng rãi, hiệu ứng lướt nhẹ.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Compass, Inbox, Loader2, Plus, Search, Users2, X } from 'lucide-react'
import { Card, PageHeader } from '@/components/ui'
import { Stagger, StaggerItem } from '@/components/motion'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import {
  GROUP_SEARCH_MAX,
  GroupCard,
  GroupFormModal,
  useDebouncedValue,
  useGroups,
  useMyGroups,
} from '@/features/group'

type Tab = 'discover' | 'mine'

/** Khung xương thẻ hội nhóm trong lúc tải danh sách lần đầu. */
function GroupCardSkeleton() {
  return (
    <Card hover={false} className="overflow-hidden rounded-3xl border border-border p-0 shadow-card dark:bg-surface">
      <div className="aspect-[16/9] w-full animate-pulse bg-border" />
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 animate-pulse rounded-full bg-border" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-border" />
        </div>
        <div className="h-5 w-4/5 animate-pulse rounded-xl bg-surface-3" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-surface-2" />
        <div className="flex items-center justify-between pt-3">
          <div className="h-4 w-24 animate-pulse rounded-lg bg-border" />
          <div className="h-8 w-24 animate-pulse rounded-xl bg-border" />
        </div>
      </div>
    </Card>
  )
}

export function GroupsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const promptLogin = useLoginPrompt((s) => s.open)
  const canCreate = !!user && user.role === 'ALUMNI'

  const [tab, setTab] = useState<Tab>('discover')
  const [searchInput, setSearchInput] = useState('')
  const keyword = useDebouncedValue(searchInput, 400)
  const [createOpen, setCreateOpen] = useState(false)

  const discover = useGroups(keyword)
  const mine = useMyGroups(!!user && tab === 'mine')
  const query = tab === 'discover' ? discover : mine

  const groups = query.data?.pages.flatMap((p) => p.items) ?? []
  const filtering = keyword.trim().length > 0

  const resetFilter = () => {
    setSearchInput('')
  }

  const handleCreateClick = () => {
    if (!user) {
      promptLogin(t('groups.createGroup'))
      return
    }
    setCreateOpen(true)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Tiêu đề trang gọn gàng, tinh tế theo chuẩn PageHeader */}
      <PageHeader
        icon={<Users2 size={20} />}
        title={t('groups.title')}
        subtitle={t('groups.subtitle')}
        actions={
          canCreate ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={handleCreateClick}
              className="rounded-xl px-4 py-2 font-bold shadow-soft transition hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('groups.createGroup')}
            </Button>
          ) : undefined
        }
      />

      {/* Tabs chuyển đổi: Khám phá vs Nhóm của tôi */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex gap-2">
          {(
            [
              { key: 'discover', label: t('groups.discoverTab'), icon: Compass },
              { key: 'mine', label: t('groups.myGroupsTab'), icon: Users2 },
            ] as const
          ).map((tItem) => {
            const isActive = tab === tItem.key
            return (
              <button
                key={tItem.key}
                onClick={() => setTab(tItem.key)}
                className={cn(
                  'relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition',
                  isActive
                    ? 'bg-plum-900 text-white shadow-sm dark:bg-white dark:text-plum-900'
                    : 'bg-surface-2 text-text-muted hover:bg-border dark:hover:text-white',
                )}
              >
                <tItem.icon size={15} />
                <span>{tItem.label}</span>
              </button>
            )
          })}
        </div>

        {tab === 'mine' && !user && (
          <p className="text-xs text-text-subtle">{t('groups.loginToViewMyGroups')}</p>
        )}
      </div>

      {tab === 'discover' && (
        <Card hover={false} className="mb-4 p-4">
          {/* Ô tìm kiếm từ khóa với debounce */}
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              aria-label={t('groups.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('groups.searchPlaceholder')}
              maxLength={GROUP_SEARCH_MAX}
              className="h-11 w-full rounded-xl border border-border bg-surface-2 pl-11 pr-10 text-sm text-text placeholder:text-text-subtle focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                aria-label={t('common.clearSearch')}
                className="absolute right-3.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-text-subtle transition-colors hover:bg-border hover:text-text-muted"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Danh sách Hội nhóm / Trạng thái */}
      {query.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      ) : query.isError ? (
        <Card hover={false} className="flex flex-col items-center gap-3 rounded-3xl border border-danger p-10 text-center shadow-card dark:bg-surface">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-danger-soft text-danger">
            <AlertTriangle size={24} />
          </span>
          <div>
            <p className="font-bold text-text">{t('groups.loadError')}</p>
            <p className="mt-1 text-sm text-text-subtle">{(query.error as Error)?.message ?? t('common.error')}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
            {t('common.tryAgain')}
          </Button>
        </Card>
      ) : groups.length === 0 ? (
        <Card hover={false} className="flex flex-col items-center gap-3 rounded-3xl border border-border p-12 text-center shadow-card dark:bg-surface">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-text-subtle">
            <Inbox size={26} />
          </span>
          <div>
            <p className="text-base font-extrabold text-text">
              {t('groups.emptyTitle')}
            </p>
            <p className="mt-1 text-sm text-text-subtle">
              {t('groups.emptyDesc')}
            </p>
          </div>
          {tab === 'mine' ? (
            <Button variant="secondary" size="sm" onClick={() => setTab('discover')} className="rounded-xl">
              {t('groups.discoverTab')}
            </Button>
          ) : filtering ? (
            <Button variant="secondary" size="sm" onClick={resetFilter} className="rounded-xl">
              {t('common.clearFilter')}
            </Button>
          ) : null}
        </Card>
      ) : (
        <>
          <Stagger key={tab} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <StaggerItem key={g.id} className="h-full">
                <GroupCard group={g} />
              </StaggerItem>
            ))}
          </Stagger>

          {query.hasNextPage && (
            <div className="pt-6 text-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                leftIcon={query.isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : undefined}
                className="rounded-2xl px-6 py-2.5 font-bold"
              >
                {query.isFetchingNextPage ? t('common.loading') : t('common.viewMore')}
              </Button>
            </div>
          )}
        </>
      )}

      {createOpen && <GroupFormModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
