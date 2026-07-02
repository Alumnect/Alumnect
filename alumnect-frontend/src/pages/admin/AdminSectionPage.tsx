import { Inbox } from 'lucide-react'
import { PageHeader, Badge, Card, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'
import { ADMIN_SECTIONS } from './adminSectionsData'

export function AdminSectionPage({ sectionKey }: { sectionKey: keyof typeof ADMIN_SECTIONS }) {
  const s = ADMIN_SECTIONS[sectionKey]
  const Icon = s.icon

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={s.title}
        subtitle={s.subtitle}
        actions={<Button variant="gold" size="sm">{s.primaryAction}</Button>}
      />

      {s.stats.length > 0 && (
        <Stagger className="mb-6 grid grid-cols-3 gap-4" gap={0.07}>
          {s.stats.map((st) => (
            <StaggerItem key={st.label}>
              <Card hover={false} className="p-5">
                <p className={cn('text-3xl font-extrabold', st.tone)}>{st.value}</p>
                <p className="mt-1 text-xs text-plum-400">{st.label}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Reveal>
        <Card hover={false} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-plum-900/8 p-5">
            <h2 className="flex items-center gap-2 font-bold text-plum-900">
              <Icon size={18} className="text-gold-600" /> Queue
            </h2>
            <Badge tone="neutral">{s.rows.length} items</Badge>
          </div>
          {s.rows.length === 0 ? (
            <EmptyState icon={<Inbox size={22} />} title="Không có mục nào trong hàng đợi" className="rounded-none border-none" />
          ) : (
            <ul className="divide-y divide-plum-900/8">
              {s.rows.map((r, i) => (
                <li key={i} className="flex items-center gap-4 p-4 transition-colors hover:bg-white/[0.03]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-500 ring-1 ring-inset ring-plum-900/10">
                    <Inbox size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-plum-900">{r.primary}</p>
                    <p className="truncate text-xs text-plum-400">{r.secondary}</p>
                  </div>
                  <Badge tone={r.tone} className="px-2.5 py-0.5">{r.status}</Badge>
                  <Button size="sm" variant="secondary">Open</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Reveal>
    </div>
  )
}
