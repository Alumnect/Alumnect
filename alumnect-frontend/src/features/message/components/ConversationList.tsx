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
    <div className="flex h-full min-h-0 flex-col border-r border-plum-900/10 bg-white/70 backdrop-blur-md dark:bg-[#242526] dark:border-[#393a3b]">
      {/* Header & Search */}
      <div className="shrink-0 border-b border-plum-900/8 dark:border-[#393a3b] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-plum-900 dark:text-[#f0f2f5]">Hộp thư tin nhắn</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(true)}
              title="Tạo nhóm trò chuyện mới"
              className="grid h-8 w-8 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-600 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:bg-[#3a3b3c] dark:text-[#b0b3b8] dark:hover:bg-[#4e4f50] dark:hover:text-white"
            >
              <Users size={16} />
            </button>
            <Link
              to="/app/alumni"
              title="Tìm người để nhắn tin"
              className="grid h-8 w-8 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-600 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:bg-[#3a3b3c] dark:text-[#b0b3b8] dark:hover:bg-[#4e4f50] dark:hover:text-white"
            >
              <UserPlus size={15} />
            </Link>
          </div>
        </div>

        {/* Tab switch: Hộp thư chính & Tin nhắn chờ */}
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-plum-900/[0.04] p-1 dark:bg-[#3a3b3c]">
          <button
            type="button"
            onClick={() => onTabChange('primary')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-all',
              currentTab === 'primary'
                ? 'bg-white text-plum-900 shadow-xs dark:bg-[#242526] dark:text-[#f0f2f5]'
                : 'text-plum-500 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white'
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
                ? 'bg-white text-plum-900 shadow-xs dark:bg-[#242526] dark:text-[#f0f2f5]'
                : 'text-plum-500 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white'
            )}
          >
            <MessageCircleMore size={14} />
            <span>Tin nhắn chờ</span>
            {requestsCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white shadow-xs">
                {requestsCount}
              </span>
            )}
          </button>
        </div>

        <label className="relative flex items-center">
          <Search size={16} className="pointer-events-none absolute left-3 text-plum-400 dark:text-[#b0b3b8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm người hoặc nhóm..."
            className="h-10 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.03] pl-9 pr-3 text-sm text-plum-900 placeholder:text-plum-400 transition-colors focus:border-brand-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-[#393a3b] dark:bg-[#3a3b3c] dark:text-[#f0f2f5] dark:placeholder-[#b0b3b8] dark:focus:bg-[#3a3b3c]"
          />
        </label>
      </div>

      {/* List */}
      <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-plum-900/5 dark:divide-[#393a3b]">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-plum-900/10 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-plum-900/10 dark:bg-slate-700" />
                  <div className="h-3 w-1/2 rounded bg-plum-900/10 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center text-plum-400 dark:text-[#b0b3b8]">
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
                    ? 'bg-brand-50/80 shadow-[inset_3px_0_0_0] shadow-brand-500 dark:bg-[#3a3b3c]'
                    : 'hover:bg-plum-900/[0.03] dark:hover:bg-[#3a3b3c]/50'
                )}
              >
                {isGroup ? (
                  <div className="relative shrink-0">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs ring-1 ring-brand-500/20 dark:bg-brand-500/20 dark:text-brand-400">
                      {conv.avatarUrl ? (
                        <img src={conv.avatarUrl} alt="Group" className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        <Users size={20} />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-white shadow-xs">
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
                    <p className="truncate text-sm font-bold text-plum-900 dark:text-[#f0f2f5]">
                      {displayName}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {!isGroup && conv.recipientMajor && (
                    <p className="truncate text-[11px] font-medium text-plum-500 dark:text-[#b0b3b8]">
                      {conv.recipientMajor}
                    </p>
                  )}
                  {isGroup && (
                    <p className="text-[11px] font-medium text-plum-500 dark:text-[#b0b3b8]">
                      {conv.memberCount ? `${conv.memberCount} thành viên` : 'Nhóm trò chuyện'}
                    </p>
                  )}

                  <p
                    className={cn(
                      'mt-0.5 truncate text-xs',
                      conv.unreadCount > 0
                        ? 'font-bold text-plum-800 dark:text-[#f0f2f5]'
                        : 'text-plum-500 dark:text-[#b0b3b8]'
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
