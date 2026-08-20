import { useState } from 'react'
import { LineChart, ShieldCheck, Plus, Filter } from 'lucide-react'
import { PageHeader, Badge, Card, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem, Counter } from '@/components/motion'
import type { SalaryRow } from '@/lib/constants'
import { cn } from '@/lib/utils'

const REGIONS = ['Tất cả khu vực', 'TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Từ xa']

// TODO(team): chưa có API Salary Board — thay SALARY bằng dữ liệu thật khi backend sẵn sàng.
const SALARY: SalaryRow[] = []

export function SalaryPage() {
  const [region, setRegion] = useState('Tất cả khu vực')
  // Giữ `max` tính trên TOÀN BỘ dữ liệu (không phải tập đã lọc) để thang đo
  // biểu đồ không nhảy khi đổi vùng — giúp so sánh trực quan giữa các lần lọc.
  // Fallback 1 khi chưa có dữ liệu để tránh Math.max() trả về -Infinity.
  const max = SALARY.length ? Math.max(...SALARY.map((s) => s.p75)) : 1
  const rows = SALARY.filter((s) => region === 'Tất cả khu vực' || s.region === region)

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={<LineChart size={20} />}
        title="Bảng Lương Ẩn Danh"
        subtitle="Dữ liệu mức lương thực tế và ẩn danh từ cộng đồng cựu sinh viên FPTU."
        actions={<Button variant="gold" size="sm" leftIcon={<Plus size={15} />}>Đóng góp dữ liệu</Button>}
      />

      <Reveal>
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { k: 6400, s: '+', v: 'Lượt khảo sát' },
            { k: 40, s: '+', v: 'Vị trí theo dõi' },
            { k: 32, s: 'Tr', v: 'Trung vị (VND)' },
            { k: 100, s: '%', v: 'Bảo mật ẩn danh' },
          ].map((x) => (
            <Card key={x.v} hover={false} className="p-4 text-center">
              <p className="text-2xl font-extrabold text-plum-900"><Counter value={x.k} suffix={x.s} /></p>
              <p className="mt-1 text-xs text-plum-400">{x.v}</p>
            </Card>
          ))}
        </div>
      </Reveal>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter size={15} className="text-plum-400" />
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={cn('rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all', region === r ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]')}
          >
            {r}
          </button>
        ))}
      </div>

      <Reveal>
        <Card hover={false} className="overflow-hidden p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-plum-900">Dải lương theo vị trí <span className="text-plum-400">(Triệu VNĐ / tháng)</span></h2>
            <Badge tone="success" icon={<ShieldCheck size={13} />}>Ẩn danh 100%</Badge>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={<LineChart size={24} />}
              title="Chưa có dữ liệu lương cho khu vực này"
              description="Hãy thử chọn khu vực khác hoặc là người đầu tiên đóng góp dữ liệu."
              action={<Button size="sm" variant="secondary" onClick={() => setRegion('Tất cả khu vực')}>Xóa bộ lọc</Button>}
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
    </div>
  )
}
