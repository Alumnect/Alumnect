import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MessagesSquare, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Conversation } from '../model/types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: number | null
  onSelect: (conv: Conversation) => void
  isLoading?: boolean
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  const [search, setSearch] = useState('')

  const filtered = conversations.filter((c) =>
    c.recipientName.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-plum-900/10 bg-white/70 backdrop-blur-md">
      {/* Header & Search */}
      <div className="shrink-0 border-b border-plum-900/8 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-plum-900">Hộp thư tin nhắn</h2>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600">
              {conversations.length}
            </span>
            <Link
              to="/app/alumni"
              title="Tìm người để nhắn tin"
              className="grid h-8 w-8 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-600 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <UserPlus size={15} />
            </Link>
          </div>
        </div>

        <label className="relative flex items-center">
          <Search size={16} className="pointer-events-none absolute left-3 text-plum-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm người liên hệ..."
            className="h-10 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.03] pl-9 pr-3 text-sm text-plum-900 placeholder:text-plum-400 transition-colors focus:border-brand-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/20"
          />
        </label>
      </div>

      {/* List */}
      <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-plum-900/5">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-plum-900/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-plum-900/10" />
                  <div className="h-3 w-1/2 rounded bg-plum-900/10" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center text-plum-400">
            <MessagesSquare size={36} className="mb-2 stroke-1 text-plum-300" />
            <p className="text-sm font-medium">
              {search ? 'Không tìm thấy cuộc trò chuyện phù hợp.' : 'Chưa có cuộc trò chuyện nào.'}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = activeId === conv.id
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all duration-150',
                  isActive
                    ? 'bg-brand-50/80 shadow-[inset_3px_0_0_0] shadow-brand-500'
                    : 'hover:bg-plum-900/[0.03]'
                )}
              >
                <Avatar
                  src={conv.recipientAvatar || undefined}
                  name={conv.recipientName}
                  size={46}
                  ring={isActive}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-bold text-plum-900">
                      {conv.recipientName}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  {conv.recipientMajor && (
                    <p className="truncate text-[11px] font-medium text-plum-500">
                      {conv.recipientMajor}
                    </p>
                  )}
                  <p
                    className={cn(
                      'mt-0.5 truncate text-xs',
                      conv.unreadCount > 0
                        ? 'font-bold text-plum-800'
                        : 'text-plum-500'
                    )}
                  >
                    {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
