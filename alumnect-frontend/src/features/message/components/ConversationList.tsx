import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MessageCircleMore, MessagesSquare, UserPlus, Users, UserCheck } from 'lucide-react'
import { Avatar } from '@/components/ui'
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
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-surface/70 backdrop-blur-md">
      {/* Header & Search */}
      <div className="shrink-0 border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-text">Hộp thư tin nhắn</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(true)}
              title="Tạo nhóm trò chuyện mới"
              className="grid h-8 w-8 place-items-center rounded-xl bg-surface-2 text-text-muted transition-colors hover:bg-primary-soft hover:text-primary-solid"
            >
              <Users size={16} />
            </button>
            <Link
              to="/app/alumni"
              title="Tìm người để nhắn tin"
              className="grid h-8 w-8 place-items-center rounded-xl bg-surface-2 text-text-muted transition-colors hover:bg-primary-soft hover:text-primary-solid"
            >
              <UserPlus size={15} />
            </Link>
          </div>
        </div>

        {/* Tab switch: Hộp thư chính & Tin nhắn chờ */}
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => onTabChange('primary')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-all',
              currentTab === 'primary'
                ? 'bg-surface text-text shadow-xs'
                : 'text-text-subtle hover:text-text'
            )}
          >
            <UserCheck size={13} />
            <span>Hộp thư</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('requests')}
            className={cn(
              'relative flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-all',
              currentTab === 'requests'
                ? 'bg-surface text-text shadow-xs'
                : 'text-text-subtle hover:text-text'
            )}
          >
            <MessageCircleMore size={14} />
            <span>Tin nhắn chờ</span>
            {requestsCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-solid px-1 text-xs font-bold text-on-primary shadow-xs">
                {requestsCount}
              </span>
            )}
          </button>
        </div>

        <label className="relative flex items-center">
          <Search size={16} className="pointer-events-none absolute left-3 text-text-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm người hoặc nhóm..."
            className="h-10 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 text-sm text-text placeholder:text-text-subtle transition-colors focus:border-brand-400/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:placeholder-[#b0b3b8]"
          />
        </label>
      </div>

      {/* List */}
      <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-border">
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

            return (
              <button
                key={conv.id ?? `draft-${conv.recipientId}`}
                onClick={() => onSelect(conv)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all duration-150',
                  isActive
                    ? 'bg-primary-soft shadow-[inset_3px_0_0_0] shadow-brand-500'
                    : 'hover:bg-surface-2'
                )}
              >
                {isGroup ? (
                  <div className="relative shrink-0">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary-solid shadow-xs ring-1 ring-primary/20">
                      {conv.avatarUrl ? (
                        <img src={conv.avatarUrl} alt="Group" className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        <Users size={20} />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-primary-solid text-on-primary shadow-xs">
                      <Users size={9} />
                    </div>
                  </div>
                ) : (
                  <Avatar
                    src={conv.recipientAvatar || undefined}
                    name={conv.recipientName}
                    size={46}
                    ring={isActive}
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="truncate text-sm font-bold text-text">
                      {displayName}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-solid px-1.5 text-xs font-bold text-on-primary shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {!isGroup && conv.recipientMajor && (
                    <p className="truncate text-xs font-medium text-text-subtle">
                      {conv.recipientMajor}
                    </p>
                  )}
                  {isGroup && (
                    <p className="text-xs font-medium text-text-subtle">
                      {conv.memberCount ? `${conv.memberCount} thành viên` : 'Nhóm trò chuyện'}
                    </p>
                  )}

                  <p
                    className={cn(
                      'mt-0.5 truncate text-xs',
                      conv.unreadCount > 0
                        ? 'font-bold text-text'
                        : 'text-text-subtle'
                    )}
                  >
                    {formatLastMessage(conv.lastMessage)}
                  </p>
                </div>
              </button>
            )
          })
        )}
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
