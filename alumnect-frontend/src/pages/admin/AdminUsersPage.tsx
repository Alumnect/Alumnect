import { useState } from 'react'
import { Search, MoreVertical, Lock, Unlock, BadgeCheck, Users } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState } from '@/components/ui'
import { Reveal } from '@/components/motion'
import type { AlumniProfile } from '@/lib/constants'
import { cn } from '@/lib/utils'

type UserRow = AlumniProfile & { email: string; role: string; status: string }

// TODO(team): chưa có API User Management — thay ROWS bằng dữ liệu thật khi backend sẵn sàng.
const ROWS: UserRow[] = []

const TABS = ['All', 'Alumni', 'Student', 'Pending', 'Locked']

export function AdminUsersPage() {
  const [tab, setTab] = useState('All')

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="User Management" subtitle="Search accounts, review profiles, lock/unlock and approve verification." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn('rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all', tab === t ? 'bg-gradient-to-r from-gold-300 to-gold-400 text-plum-900' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]')}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="relative flex items-center sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 text-plum-400" />
          <input placeholder="Search users…" className="h-10 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-9 pr-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-gold-400/50 focus:outline-none" />
        </label>
      </div>

      <Reveal>
        {ROWS.length === 0 ? (
          <EmptyState icon={<Users size={24} />} title="Chưa có người dùng" description="Danh sách sẽ hiển thị khi có dữ liệu thật từ backend." />
        ) : (
        <Card hover={false} className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-plum-900/8 text-left text-xs uppercase tracking-wide text-plum-400">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Followers</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((u) => (
                <tr key={u.id} className="border-b border-plum-900/5 transition-colors last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} size={38} verified={u.verified} />
                      <div>
                        <p className="flex items-center gap-1 font-semibold text-plum-900">{u.name}</p>
                        <p className="text-xs text-plum-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={u.role === 'Alumni' ? 'brand' : 'neutral'} className="px-2.5 py-0.5">{u.role}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      tone={u.status === 'Active' ? 'success' : u.status === 'Locked' ? 'danger' : 'gold'}
                      className="px-2.5 py-0.5"
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-plum-600">{u.followers.toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.status === 'Pending' && (
                        <button className="inline-flex items-center gap-1 rounded-lg bg-brand-500/15 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-500/25">
                          <BadgeCheck size={13} /> Verify
                        </button>
                      )}
                      <button className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.05] hover:text-plum-900" aria-label="Lock/unlock">
                        {u.status === 'Locked' ? <Unlock size={15} /> : <Lock size={15} />}
                      </button>
                      <button className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.05] hover:text-plum-900" aria-label="More">
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        )}
      </Reveal>
    </div>
  )
}
