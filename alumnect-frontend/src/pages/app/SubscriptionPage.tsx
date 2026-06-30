import { CreditCard, Check, Sparkles } from 'lucide-react'
import { PageHeader, Badge, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { PACKAGES } from '@/lib/constants'
import { vnd, cn } from '@/lib/utils'

const HISTORY = [
  { id: 'TXN-10421', pkg: 'Recruiter', amount: 990000, date: 'Jun 12, 2026', status: 'Paid' },
  { id: 'TXN-10310', pkg: 'Recruiter', amount: 990000, date: 'May 12, 2026', status: 'Paid' },
  { id: 'TXN-10188', pkg: 'Starter', amount: 0, date: 'Apr 02, 2026', status: 'Free' },
]

export function SubscriptionPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={<CreditCard size={20} />}
        title="Subscription & Packages"
        subtitle="Choose a posting package to recruit from the FPTU alumni network."
      />

      <Stagger className="grid gap-5 md:grid-cols-3" gap={0.1}>
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
                  Most popular
                </Badge>
              )}
              <h3 className="text-lg font-bold text-plum-900">{p.name}</h3>
              <p className="mt-3">
                <span className="text-3xl font-extrabold text-plum-900">{p.price === 0 ? 'Free' : vnd(p.price)}</span>
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
                disabled={p.name === 'Starter'}
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
            <h2 className="font-bold text-plum-900">Transaction history</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-plum-900/8 text-left text-xs uppercase tracking-wide text-plum-400">
                  <th className="px-5 py-3 font-semibold">Transaction</th>
                  <th className="px-5 py-3 font-semibold">Package</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
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
                      <Badge tone={h.status === 'Paid' ? 'success' : 'neutral'} className="px-2.5 py-0.5">{h.status}</Badge>
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
