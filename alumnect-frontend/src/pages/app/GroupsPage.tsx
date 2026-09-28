/**
 * GroupsPage — Trang Hội nhóm: khám phá các cộng đồng cựu sinh viên.
 *
 * Trách nhiệm:
 *  - Xem danh sách hội nhóm dạng thẻ (Guest xem được), phân trang bằng nút "Tải thêm".
 *  - Tìm kiếm theo tên/từ khóa (debounce 400ms, không phân biệt dấu) và lọc theo danh mục.
 *  - Tab "Nhóm của tôi" (khi đã đăng nhập) liệt kê các nhóm đang tham gia.
 *  - Nút "Tạo hội nhóm" (Student/Alumni) mở form tạo; Guest bấm sẽ được mời đăng nhập.
 *  - Đủ trạng thái: loading (skeleton) / rỗng / lỗi (thử lại) / thành công; responsive 1-2-3 cột.
 */
import { useState } from 'react'
import { AlertTriangle, Inbox, Loader2, Plus, Search, Users2, X } from 'lucide-react'
import { Card, PageHeader } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { GROUP_CATEGORIES, GROUP_SEARCH_MAX, GroupCard, GroupFormModal, useDebouncedValue, useGroups, useMyGroups } from '@/features/group'

type Tab = 'discover' | 'mine'

/** Khung xương thẻ hội nhóm trong lúc tải danh sách lần đầu. */
function GroupCardSkeleton() {
  return (
    <Card hover={false} className="p-0">
      <div className="aspect-[16/9] w-full animate-pulse bg-plum-900/[0.07]" />
      <div className="space-y-2.5 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-plum-900/[0.06]" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-plum-900/[0.07]" />
        <div className="h-3.5 w-full animate-pulse rounded bg-plum-900/[0.05]" />
        <div className="h-9 w-32 animate-pulse rounded-xl bg-plum-900/[0.06]" />
      </div>
    </Card>
  )
}

export function GroupsPage() {
  const user = useAuthStore((s) => s.user)
  const promptLogin = useLoginPrompt((s) => s.open)
  const canCreate = !!user && (user.role === 'STUDENT' || user.role === 'ALUMNI')

  const [tab, setTab] = useState<Tab>('discover')
  const [searchInput, setSearchInput] = useState('')
  const keyword = useDebouncedValue(searchInput, 400)
  const [category, setCategory] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const discover = useGroups(keyword, category)
  const mine = useMyGroups(!!user && tab === 'mine')
  const query = tab === 'discover' ? discover : mine

  const groups = query.data?.pages.flatMap((p) => p.items) ?? []
  const filtering = keyword.trim().length > 0 || category !== ''

  const resetFilter = () => {
    setSearchInput('')
    setCategory('')
  }

  const handleCreateClick = () => {
    if (!user) {
      promptLogin('Đăng nhập để tạo hội nhóm của riêng bạn.')
      return
    }
    setCreateOpen(true)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={<Users2 size={20} />}
        title="Hội nhóm"
        subtitle="Kết nối cùng cộng đồng có chung sở thích, chuyên môn và định hướng phát triển."
        actions={
          canCreate || !user ? (
            <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={handleCreateClick}>
              Tạo hội nhóm
            </Button>
          ) : undefined
        }
      />

      {user && (
        <div className="mb-4 inline-flex gap-1 rounded-xl bg-plum-900/[0.04] p-1">
          {(
            [
              { key: 'discover', label: 'Khám phá' },
              { key: 'mine', label: 'Nhóm của tôi' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn('rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors', tab === t.key ? 'bg-white text-plum-900 shadow-sm' : 'text-plum-500 hover:text-plum-900')}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'discover' && (
        <>
          {/* Tìm kiếm theo tên/từ khóa, debounce trước khi gọi API */}
          <div className="relative mb-4">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-plum-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm hội nhóm theo tên hoặc từ khóa…"
              maxLength={GROUP_SEARCH_MAX}
              className="h-11 w-full rounded-xl bg-plum-900/[0.04] pl-11 pr-10 text-sm text-plum-900 placeholder:text-plum-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-plum-400 transition-colors hover:bg-plum-900/[0.06] hover:text-plum-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Lọc theo danh mục */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {[{ value: '', label: 'Tất cả' }, ...GROUP_CATEGORIES].map((c) => (
              <button
                key={c.value || 'all'}
                onClick={() => setCategory(c.value)}
                aria-pressed={category === c.value}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors',
                  category === c.value ? 'bg-brand-500/10 text-brand-700 ring-brand-500/40' : 'bg-plum-900/[0.03] text-plum-500 ring-plum-900/10 hover:text-plum-900',
                )}
              >
                {c.label}
              </button>
            ))}
            {filtering && (
              <button onClick={resetFilter} className="text-xs font-semibold text-plum-400 underline-offset-2 transition-colors hover:text-plum-700 hover:underline">
                Xóa lọc
              </button>
            )}
          </div>
        </>
      )}

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      ) : query.isError ? (
        <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertTriangle size={24} />
          </span>
          <div>
            <p className="font-bold text-plum-900">Không tải được danh sách hội nhóm</p>
            <p className="mt-1 text-sm text-plum-500">{(query.error as Error)?.message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
            Thử lại
          </Button>
        </Card>
      ) : groups.length === 0 ? (
        <Card hover={false} className="flex flex-col items-center gap-3 p-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-plum-900/[0.05] text-plum-400">
            <Inbox size={24} />
          </span>
          <div>
            <p className="font-bold text-plum-900">
              {tab === 'mine' ? 'Bạn chưa tham gia hội nhóm nào' : filtering ? 'Không tìm thấy hội nhóm phù hợp' : 'Chưa có hội nhóm nào'}
            </p>
            <p className="mt-1 text-sm text-plum-500">
              {tab === 'mine' ? 'Khám phá và tham gia các hội nhóm để kết nối với cộng đồng.' : filtering ? 'Thử đổi từ khóa hoặc bộ lọc danh mục khác.' : 'Hãy là người đầu tiên tạo hội nhóm.'}
            </p>
          </div>
          {tab === 'mine' ? (
            <Button variant="secondary" size="sm" onClick={() => setTab('discover')}>
              Khám phá hội nhóm
            </Button>
          ) : filtering ? (
            <Button variant="secondary" size="sm" onClick={resetFilter}>
              Xóa bộ lọc
            </Button>
          ) : null}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>

          {query.hasNextPage && (
            <div className="pt-6 text-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                leftIcon={query.isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : undefined}
              >
                {query.isFetchingNextPage ? 'Đang tải…' : 'Tải thêm hội nhóm'}
              </Button>
            </div>
          )}
        </>
      )}

      {createOpen && <GroupFormModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
