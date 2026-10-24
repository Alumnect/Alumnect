import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isToday } from 'date-fns'
import { Search, MessageCircleMore, MessagesSquare, UserPlus, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar, FadeSwitch } from '@/components/ui'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { CreateGroupModal } from './CreateGroupModal'
import { type Conversation, isGroupConversation } from '../model/types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: number | null
  activeRecipientId?: number | null
  onSelect: (conv: Conversation) => void
  isLoading?: boolean
  currentTab: 'primary' | 'requests'
  onTabChange: (tab: 'primary' | 'requests') => void
  requestsCount?: number
  onGroupCreated?: (group: Conversation) => void
}

function formatLastMessage(msg?: string): string {
  if (!msg) return 'Bắt đầu cuộc trò chuyện'
  if (/(?:https?:\/\/[^\s]+)?\/app\/groups\/\d+\?(?:[^\s]*&)?postId=\d+/.test(msg)) {
    const note = msg.replace(/(?:https?:\/\/[^\s]+)?\/app\/groups\/\d+\?(?:[^\s]*&)?postId=\d+/, '').trim()
    return note ? `${note} • [Đã chia sẻ bài viết nhóm]` : '[Đã chia sẻ một bài viết]'
  }
  if (/(?:https?:\/\/[^\s]+)?\/app\/groups\/\d+/.test(msg)) {
    const note = msg.replace(/(?:https?:\/\/[^\s]+)?\/app\/groups\/\d+(?:\?[^\s]*)?/, '').trim()
    return note ? `${note} • [Đã chia sẻ hội nhóm]` : '[Đã chia sẻ một hội nhóm]'
  }
  if (/(?:https?:\/\/[^\s]+)?\/app\/posts\/\d+/.test(msg)) {
    const note = msg.replace(/(?:https?:\/\/[^\s]+)?\/app\/posts\/\d+/, '').trim()
    return note ? `${note} • [Đã chia sẻ bài viết]` : '[Đã chia sẻ một bài viết]'
  }
  return msg
}

export function ConversationList({
  conversations,
  activeId,
  activeRecipientId,
  onSelect,
  isLoading,
  currentTab,
  onTabChange,
  requestsCount = 0,
  onGroupCreated,
}: ConversationListProps) {
  const [search, setSearch] = useState('')
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)

  const filtered = conversations.filter((c) => {
    const isGrp = isGroupConversation(c)
    const displayName = isGrp ? c.title || 'Nhóm trò chuyện' : c.recipientName
    return displayName.toLowerCase().includes(search.trim().toLowerCase())
  })

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-surface">
      {/* Header & Search */}
      <div className="shrink-0 p-4 pb-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-text">Tin nhắn</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(true)}
              title="Tạo nhóm trò chuyện mới"
              aria-label="Tạo nhóm trò chuyện mới"
              className="grid h-9 w-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <Users size={18} />
            </button>
            <Link
              to="/app/alumni"
              title="Tìm người để nhắn tin"
              aria-label="Tìm người để nhắn tin"
              className="grid h-9 w-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <UserPlus size={18} />
            </Link>
          </div>
        </div>

        {/* Hộp thư chính & Tin nhắn chờ */}
        <div role="tablist" aria-label="Loại hộp thư" className="mb-3 flex border-b border-border">
          {([
            ['primary', 'Hộp thư'],
            ['requests', 'Tin nhắn chờ'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={currentTab === key}
              onClick={() => onTabChange(key)}
              className={cn(
                'relative flex h-10 flex-1 items-center justify-center gap-1.5 text-sm font-semibold transition-colors',
                currentTab === key ? 'text-text' : 'text-text-subtle hover:text-text-muted',
              )}
            >
              {label}
              {key === 'requests' && requestsCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-solid px-1.5 text-xs font-bold text-on-primary">{requestsCount}</span>
              )}
              {currentTab === key && <motion.span layoutId="msg-tab-underline" transition={TRANSITION.indicator} className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary-solid" />}
            </button>
          ))}
        </div>

        <label className="relative flex items-center">
          <Search size={16} className="pointer-events-none absolute left-3.5 text-text-subtle" />
          <input
            aria-label="Tìm kiếm người hoặc nhóm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm người hoặc nhóm..."
            className="h-10 w-full rounded-full bg-surface-2 pl-10 pr-4 text-sm text-text placeholder:text-text-subtle transition-colors focus:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </label>
      </div>

      {/* List */}
      <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <FadeSwitch id={currentTab}>
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-surface-3" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-surface-3" />
                  <div className="h-3 w-1/2 rounded bg-surface-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center text-text-subtle">
            {currentTab === 'requests' ? (
              <MessageCircleMore size={36} className="mb-2 stroke-1 text-plum-300 dark:text-slate-600" />
            ) : (
              <MessagesSquare size={36} className="mb-2 stroke-1 text-plum-300 dark:text-slate-600" />
            )}
            <p className="text-sm font-medium">
              {search
                ? 'Không tìm thấy cuộc trò chuyện phù hợp.'
                : currentTab === 'requests'
                ? 'Không có tin nhắn chờ nào từ người lạ.'
                : 'Chưa có cuộc trò chuyện nào.'}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive =
              (conv.id != null && activeId === conv.id) ||
              (!conv.id && activeRecipientId != null && conv.recipientId === activeRecipientId)
            const isGroup = isGroupConversation(conv)
            const displayName = isGroup ? conv.title || 'Nhóm trò chuyện' : conv.recipientName
            const lastDate = conv.lastMessageAt ? new Date(conv.lastMessageAt) : null
            const lastTime = lastDate && !isNaN(lastDate.getTime()) ? (isToday(lastDate) ? format(lastDate, 'HH:mm') : format(lastDate, 'dd/MM')) : ''

            return (
              <button
                key={conv.id ?? `draft-${conv.recipientId}`}
                onClick={() => onSelect(conv)}
                aria-current={isActive ? 'true' : undefined}
                className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors', isActive ? 'bg-surface-2' : 'hover:bg-surface-2/60')}
              >
                {isGroup ? (
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-primary-solid">
                    {conv.avatarUrl ? <img src={conv.avatarUrl} alt="" className="h-full w-full object-cover" /> : <Users size={20} />}
                  </div>
                ) : (
                  <Avatar src={conv.recipientAvatar || undefined} name={conv.recipientName} size={48} />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn('truncate text-[15px] text-text', conv.unreadCount > 0 ? 'font-bold' : 'font-semibold')}>{displayName}</p>
                    {lastTime && <span className="shrink-0 text-xs text-text-subtle">{lastTime}</span>}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className={cn('truncate text-sm', conv.unreadCount > 0 ? 'font-semibold text-text' : 'text-text-subtle')}>
                      {formatLastMessage(conv.lastMessage)}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-solid px-1.5 text-xs font-bold text-on-primary">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
        </FadeSwitch>
      </div>

      {/* Modal tạo nhóm */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreated={(group) => {
          if (onGroupCreated) onGroupCreated(group)
          onSelect(group)
        }}
      />
    </div>
  )
}
