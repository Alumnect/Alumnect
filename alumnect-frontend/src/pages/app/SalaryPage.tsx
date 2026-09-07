import { useEffect, useMemo, useState } from 'react'
import { LineChart, ShieldCheck, Plus, Filter, AlertTriangle, RefreshCw, ListChecks, Search, X, LayoutGrid } from 'lucide-react'
import { PageHeader, Badge, Card, EmptyState, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem, Counter } from '@/components/motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { ContributeSalaryModal, MyContributionsModal, useSalaryStatistics, useIndustries, SALARY_LEVELS } from '@/features/salary'
import type { SalaryContribution, SalaryLevel } from '@/features/salary'
import { EntitySelectField } from '@/features/forum/components/EntitySelectField'

const ALL_REGIONS = 'Tất cả khu vực'
const JOB_TITLE_SEARCH_MAX_LENGTH = 150

/** Khung xương hiển thị trong lúc tải thống kê lần đầu (UC53). */
function SalarySkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div className="mb-2 flex items-center justify-between">
            <div className="h-3.5 w-40 animate-pulse rounded bg-plum-900/[0.06]" />
            <div className="h-3 w-20 animate-pulse rounded bg-plum-900/[0.05]" />
          </div>
          <div className="h-7 w-full animate-pulse rounded-full bg-plum-900/[0.04]" />
        </div>
      ))}
    </div>
  )
}

/** Trạng thái lỗi khi tải thống kê lương thất bại (UC53). */
function SalaryStatsError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
        <AlertTriangle size={24} />
      </span>
      <div>
        <p className="font-bold text-plum-900">Không tải được thống kê lương</p>
        <p className="mt-1 text-sm text-plum-500">{message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}</p>
      </div>
      <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={onRetry}>
        Thử lại
      </Button>
    </Card>
  )
}

export function SalaryPage() {
  const [contributeOpen, setContributeOpen] = useState(false)
  const [myContributionsOpen, setMyContributionsOpen] = useState(false)
  // Khác null = đang mở ContributeSalaryModal ở chế độ SỬA (UC51) cho đúng bản ghi này.
  const [editingContribution, setEditingContribution] = useState<SalaryContribution | null>(null)

  // Quyền đóng góp (UC50) + sửa (UC51): CHỈ Cựu sinh viên (ALUMNI) — khác quyền XEM/LỌC thống kê (UC53/UC54: Student + Alumni).
  const user = useAuthStore((s) => s.user)
  const canContribute = !!user && user.role === 'ALUMNI'

  // === Bộ lọc (UC54 - Filter salary data) ===
  const [region, setRegion] = useState(ALL_REGIONS)
  const [industryId, setIndustryId] = useState<number | null>(null)
  const [level, setLevel] = useState<SalaryLevel | null>(null)
  // Ô nhập cập nhật ngay để gõ mượt, debounce 400ms mới gọi API tránh spam request (cùng cách UC44).
  const [jobTitleInput, setJobTitleInput] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setJobTitle(jobTitleInput), 400)
    return () => clearTimeout(timer)
  }, [jobTitleInput])

  const isFiltering = region !== ALL_REGIONS || industryId !== null || level !== null || jobTitle.trim().length > 0
  const clearFilters = () => {
    setRegion(ALL_REGIONS)
    setIndustryId(null)
    setLevel(null)
    setJobTitleInput('')
  }

  const { data: industries } = useIndustries()
  // Danh sách khu vực/cấp bậc KHÔNG lọc gì — chỉ để đổ chip (region là text tự do ở UC50, không phải
  // danh mục cố định; level tuy cố định 3 giá trị nhưng chỉ nên gợi ý cấp bậc THỰC SỰ có dữ liệu, tránh
  // chip bấm vào luôn ra rỗng), tách riêng khỏi query hiển thị để đổi bộ lọc khác không làm mất option.
  const { data: baseStats } = useSalaryStatistics()
  const regions = useMemo(() => [ALL_REGIONS, ...Array.from(new Set((baseStats?.rows ?? []).map((r) => r.region))).sort()], [baseStats])
  const levels = useMemo(() => {
    const present = new Set((baseStats?.rows ?? []).map((r) => r.level))
    return SALARY_LEVELS.filter((lv) => present.has(lv))
  }, [baseStats])

  const { data, isLoading, isError, error, refetch } = useSalaryStatistics({
    industryId,
    region: region !== ALL_REGIONS ? region : undefined,
    jobTitle: jobTitle.trim() || undefined,
    level,
  })
  const rows = data?.rows ?? []
  // Fallback 1 khi chưa có dữ liệu để tránh Math.max() trả về -Infinity.
  const max = rows.length ? Math.max(...rows.map((s) => s.p75)) : 1

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={<LineChart size={20} />}
        title="Bảng Lương Ẩn Danh"
        subtitle="Dữ liệu mức lương thực tế và ẩn danh từ cộng đồng cựu sinh viên FPTU."
        actions={
          canContribute ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" leftIcon={<ListChecks size={15} />} onClick={() => setMyContributionsOpen(true)}>
                Đóng góp của tôi
              </Button>
              <Button variant="gold" size="sm" leftIcon={<Plus size={15} />} onClick={() => setContributeOpen(true)}>
                Đóng góp dữ liệu
              </Button>
            </div>
          ) : undefined
        }
      />

      <Reveal>
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { k: data?.totalContributions ?? 0, s: '+', v: 'Lượt khảo sát' },
            { k: data?.trackedPositions ?? 0, s: '', v: 'Vị trí theo dõi' },
            { k: data?.overallMedian ?? 0, s: 'Tr', v: 'Trung vị (VND)' },
            { k: 100, s: '%', v: 'Bảo mật ẩn danh' },
          ].map((x) => (
            <Card key={x.v} hover={false} className="p-4 text-center">
              <p className="text-2xl font-extrabold text-plum-900"><Counter value={x.k} suffix={x.s} /></p>
              <p className="mt-1 text-xs text-plum-400">{x.v}</p>
            </Card>
          ))}
        </div>
      </Reveal>

      {/* Bộ lọc (UC54): ngành nghề + chức danh + cấp bậc + khu vực. overflow-visible ghi đè
          overflow-hidden mặc định của Card — nếu không, dropdown ngành nghề (EntitySelectField,
          absolute + không portal) bị cắt cụt ở đúng viền dưới của Card khi sổ ra. */}
      <Card hover={false} className="mb-5 space-y-3 overflow-visible p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum-400" />
            <input
              value={jobTitleInput}
              onChange={(e) => setJobTitleInput(e.target.value)}
              placeholder="Tìm theo chức danh (VD: Backend Developer)…"
              maxLength={JOB_TITLE_SEARCH_MAX_LENGTH}
              className="h-10 w-full rounded-xl bg-plum-900/[0.04] pl-9 pr-9 text-sm text-plum-900 placeholder:text-plum-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {jobTitleInput && (
              <button
                onClick={() => setJobTitleInput('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-plum-400 transition-colors hover:bg-plum-900/[0.06] hover:text-plum-700"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <EntitySelectField
            items={industries}
            value={industryId}
            onChange={setIndustryId}
            placeholder="Tất cả ngành nghề"
            buttonIcon={<LayoutGrid size={15} className="text-brand-600" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter size={15} className="shrink-0 text-plum-400" />
          {levels.map((lv) => (
            <button
              key={lv}
              onClick={() => setLevel(level === lv ? null : lv)}
              className={cn('rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all', level === lv ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]')}
            >
              {lv}
            </button>
          ))}
          <span className="mx-1 h-4 w-px shrink-0 bg-plum-900/10" />
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={cn('rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all', region === r ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]')}
            >
              {r}
            </button>
          ))}
          {isFiltering && (
            <button onClick={clearFilters} className="ml-auto flex shrink-0 items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600">
              <X size={13} /> Xóa bộ lọc
            </button>
          )}
        </div>
      </Card>

      <Reveal>
        <Card hover={false} className="overflow-hidden p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-plum-900">Dải lương theo vị trí <span className="text-plum-400">(Triệu VNĐ / tháng)</span></h2>
            <Badge tone="success" icon={<ShieldCheck size={13} />}>Ẩn danh 100%</Badge>
          </div>

          {isLoading ? (
            <SalarySkeleton />
          ) : isError ? (
            <SalaryStatsError message={(error as Error)?.message} onRetry={() => refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<LineChart size={24} />}
              title={isFiltering ? 'Không có dữ liệu lương khớp bộ lọc này' : 'Chưa có dữ liệu lương'}
              description={isFiltering ? 'Hãy thử đổi hoặc xóa bớt bộ lọc.' : 'Hãy là người đầu tiên đóng góp dữ liệu.'}
              action={isFiltering ? <Button size="sm" variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button> : undefined}
            />
          ) : (
          <Stagger className="space-y-5" gap={0.07}>
            {rows.map((s) => (
              <StaggerItem key={`${s.role}-${s.level}-${s.region}`}>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-plum-900">
                      {s.role} <span className="text-plum-400">· {s.level} · {s.region}</span>
                    </span>
                    <span className="text-plum-400">{s.samples} mẫu khảo sát</span>
                  </div>
                  {/* range bar: p25 — median — p75 */}
                  <div className="relative h-7 rounded-full bg-plum-900/[0.04]">
                    <div
                      className="absolute top-0 h-full rounded-full bg-gradient-to-r from-brand-600/40 to-violet-600/40"
                      style={{ left: `${(s.p25 / max) * 100}%`, width: `${((s.p75 - s.p25) / max) * 100}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-7 w-1.5 -translate-y-1/2 rounded-full bg-gold-400 shadow-glow-gold"
                      style={{ left: `${(s.median / max) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-[11px] font-semibold">
                      <span className="text-plum-500">{s.p25}Tr</span>
                      <span className="text-gold-600">trung vị {s.median}Tr</span>
                      <span className="text-plum-500">{s.p75}Tr</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          )}
        </Card>
      </Reveal>

      <p className="mt-4 text-center text-xs text-plum-400">
        Thống kê chỉ hiển thị khi đạt đủ số lượng mẫu khảo sát tối thiểu. Danh tính của bạn luôn được bảo mật tuyệt đối.
      </p>

      {/* Modal danh sách đóng góp của chính mình (UC51) — bấm "Sửa" 1 dòng thì chuyển sang modal chỉnh sửa bên dưới */}
      {myContributionsOpen && (
        <MyContributionsModal
          onClose={() => setMyContributionsOpen(false)}
          onEdit={(contribution) => {
            setMyContributionsOpen(false)
            setEditingContribution(contribution)
          }}
        />
      )}

      {/* Modal đóng góp (UC50, contributeOpen) HOẶC chỉnh sửa (UC51, editingContribution) dữ liệu lương
          — chỉ mở được khi canContribute (nút đã ẩn với người khác) */}
      {(contributeOpen || editingContribution) && (
        <ContributeSalaryModal
          editContribution={editingContribution ?? undefined}
          onClose={() => {
            setContributeOpen(false)
            setEditingContribution(null)
          }}
          onSuccess={() => {
            const wasEdit = !!editingContribution
            setContributeOpen(false)
            setEditingContribution(null)
            toast.success(wasEdit ? 'Đã cập nhật dữ liệu lương thành công!' : 'Đã ghi nhận đóng góp dữ liệu lương của bạn. Cảm ơn bạn!')
          }}
        />
      )}
    </div>
  )
}
