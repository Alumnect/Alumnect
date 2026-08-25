import { CreditCard, Check, Sparkles } from 'lucide-react'
import { PageHeader, Badge, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { PACKAGES } from '@/lib/constants'
import { vnd, cn } from '@/lib/utils'

const HISTORY = [
  { id: 'TXN-10421', pkg: 'Nhà tuyển dụng (Recruiter)', amount: 990000, date: '12/06/2026', status: 'Thành công' },
  { id: 'TXN-10310', pkg: 'Nhà tuyển dụng (Recruiter)', amount: 990000, date: '12/05/2026', status: 'Thành công' },
  { id: 'TXN-10188', pkg: 'Cơ bản (Starter)', amount: 0, date: '02/04/2026', status: 'Miễn phí' },
]

export function SubscriptionPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={<CreditCard size={20} />}
        title="Gói Dịch Vụ & Thành Viên"
        subtitle="Chọn gói dịch vụ tuyển dụng và quảng bá thương hiệu phù hợp với nhu cầu của bạn."
      />

      <Stagger className="grid gap-5 sm:grid-cols-2 md:grid-cols-3" gap={0.1}>
        {PACKAGES.map((p) => (
          <StaggerItem key={p.name}>
            <Card
              hover={false}
              className={cn(
                'relative h-full p-6',
                p.highlight && 'ring-gradient shadow-glow',
              )}
            >
              {p.highlight && (
                <Badge tone="brand" icon={<Sparkles size={12} />} className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Phổ biến nhất
                </Badge>
              )}
              <h2 className="text-lg font-bold text-plum-900">{p.name}</h2>
              <p className="mt-3">
                <span className="text-3xl font-extrabold text-plum-900">{p.price === 0 ? 'Miễn phí' : vnd(p.price)}</span>
                {p.price !== 0 && <span className="text-sm text-plum-400"> {p.period}</span>}
              </p>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-plum-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={p.highlight ? 'primary' : 'secondary'}
                size="md"
                className="mt-7 w-full"
                disabled={p.name.includes('Starter') || p.name.includes('Cơ bản')}
              >
                {p.cta}
              </Button>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <Card hover={false} className="mt-8 overflow-hidden">
          <div className="border-b border-plum-900/8 p-5">
            <h2 className="font-bold text-plum-900">Lịch sử giao dịch</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-plum-900/8 text-left text-xs uppercase tracking-wide text-plum-400">
                  <th className="px-5 py-3 font-semibold">Mã GD</th>
                  <th className="px-5 py-3 font-semibold">Gói dịch vụ</th>
                  <th className="px-5 py-3 font-semibold">Số tiền</th>
                  <th className="px-5 py-3 font-semibold">Ngày thanh toán</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {HISTORY.map((h) => (
                  <tr key={h.id} className="border-b border-plum-900/5 last:border-0">
                    <td className="px-5 py-3.5 font-mono text-plum-600">{h.id}</td>
                    <td className="px-5 py-3.5 text-plum-700">{h.pkg}</td>
                    <td className="px-5 py-3.5 font-semibold text-plum-900">{h.amount === 0 ? '—' : vnd(h.amount)}</td>
                    <td className="px-5 py-3.5 text-plum-500">{h.date}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={h.status === 'Thành công' ? 'success' : 'neutral'} className="px-2.5 py-0.5">{h.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>
    </div>
  )
}
