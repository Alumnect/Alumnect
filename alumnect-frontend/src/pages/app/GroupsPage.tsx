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
    <Card hover={false} className="overflow-hidden rounded-3xl border border-plum-900/[0.08] p-0 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
      <div className="aspect-[16/9] w-full animate-pulse bg-plum-900/[0.06] dark:bg-white/5" />
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 animate-pulse rounded-full bg-plum-900/[0.06] dark:bg-white/5" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-plum-900/[0.06] dark:bg-white/5" />
        </div>
        <div className="h-5 w-4/5 animate-pulse rounded-xl bg-plum-900/[0.08] dark:bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-plum-900/[0.05] dark:bg-white/5" />
        <div className="flex items-center justify-between pt-3">
          <div className="h-4 w-24 animate-pulse rounded-lg bg-plum-900/[0.06] dark:bg-white/5" />
          <div className="h-8 w-24 animate-pulse rounded-xl bg-plum-900/[0.07] dark:bg-white/10" />
        </div>
      </div>
    </Card>
  )
}

export function GroupsPage() {
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
      promptLogin('Đăng nhập để tạo hội nhóm của riêng bạn.')
      return
    }
    setCreateOpen(true)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Tiêu đề trang gọn gàng, tinh tế theo chuẩn PageHeader */}
      <PageHeader
        icon={<Users2 size={20} />}
        title="Hội nhóm"
        subtitle="Không gian kết nối và trao đổi chuyên môn dành cho Cựu sinh viên."
        actions={
          canCreate ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={handleCreateClick}
              className="rounded-xl px-4 py-2 font-bold shadow-soft transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Tạo hội nhóm
            </Button>
          ) : undefined
        }
      />

      {/* Tabs chuyển đổi: Khám phá vs Nhóm của tôi */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-plum-900/[0.08] pb-3 dark:border-[#393a3b]">
        <div className="flex gap-2">
          {(
            [
              { key: 'discover', label: 'Khám phá cộng đồng', icon: Compass },
              { key: 'mine', label: 'Hội nhóm của tôi', icon: Users2 },
            ] as const
          ).map((t) => {
            const isActive = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all',
                  isActive
                    ? 'bg-plum-900 text-white shadow-sm dark:bg-white dark:text-plum-900'
                    : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.07] dark:bg-[#3a3b3c] dark:text-[#b0b3b8] dark:hover:text-white',
                )}
              >
                <t.icon size={15} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {tab === 'mine' && !user && (
          <p className="text-xs text-plum-500">Đăng nhập để xem danh sách các nhóm bạn đã tham gia.</p>
        )}
      </div>

      {tab === 'discover' && (
        <div className="space-y-4">
          {/* Ô tìm kiếm từ khóa với debounce */}
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-plum-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm hội nhóm theo tên, từ khóa hoặc chủ đề…"
              maxLength={GROUP_SEARCH_MAX}
              className="h-12 w-full rounded-2xl border border-plum-900/10 bg-plum-900/[0.03] pl-11 pr-10 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#393a3b] dark:bg-[#242526] dark:text-white"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-3.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-plum-400 transition-colors hover:bg-plum-900/[0.06] hover:text-plum-700"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Danh sách Hội nhóm / Trạng thái */}
      {query.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      ) : query.isError ? (
        <Card hover={false} className="flex flex-col items-center gap-3 rounded-3xl border border-rose-500/20 p-10 text-center shadow-card dark:border-rose-900/30 dark:bg-[#242526]">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertTriangle size={24} />
          </span>
          <div>
            <p className="font-bold text-plum-900 dark:text-white">Không tải được danh sách hội nhóm</p>
            <p className="mt-1 text-sm text-plum-500 dark:text-[#b0b3b8]">{(query.error as Error)?.message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
            Thử lại
          </Button>
        </Card>
      ) : groups.length === 0 ? (
        <Card hover={false} className="flex flex-col items-center gap-3 rounded-3xl border border-plum-900/[0.08] p-12 text-center shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-plum-900/[0.04] text-plum-400 dark:bg-white/5">
            <Inbox size={26} />
          </span>
          <div>
            <p className="text-base font-extrabold text-plum-900 dark:text-white">
              {tab === 'mine' ? 'Bạn chưa tham gia hội nhóm nào' : filtering ? 'Không tìm thấy hội nhóm phù hợp' : 'Chưa có hội nhóm nào'}
            </p>
            <p className="mt-1 text-sm text-plum-500 dark:text-[#b0b3b8]">
              {tab === 'mine'
                ? 'Khám phá và tham gia các hội nhóm để kết nối với cựu sinh viên FPTU.'
                : filtering
                ? 'Thử đổi từ khóa hoặc chọn danh mục khác.'
                : 'Hãy là người đầu tiên tạo dựng hội nhóm cộng đồng.'}
            </p>
          </div>
          {tab === 'mine' ? (
            <Button variant="secondary" size="sm" onClick={() => setTab('discover')} className="rounded-xl">
              Khám phá hội nhóm ngay
            </Button>
          ) : filtering ? (
            <Button variant="secondary" size="sm" onClick={resetFilter} className="rounded-xl">
              Xóa bộ lọc
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
                {query.isFetchingNextPage ? 'Đang tải thêm…' : 'Tải thêm hội nhóm'}
              </Button>
            </div>
          )}
        </>
      )}

      {createOpen && <GroupFormModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
