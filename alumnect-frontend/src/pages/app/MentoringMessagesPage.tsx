import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ChevronRight, MessageCircle, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, EmptyState } from '@/components/ui'
import { useConversations } from '@/features/message'
import { MentorPageHeader, MentoringTermsGate } from '@/features/mentorship'

function MentoringMessagesContent() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: conversations = [], isLoading } = useConversations('primary', 'MENTORING')

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    if (!keyword) return conversations
    return conversations.filter((conversation) =>
      conversation.recipientName.toLocaleLowerCase('vi').includes(keyword)
    )
  }, [conversations, search])

  return (
    <div className="space-y-5">
      <MentorPageHeader
        icon={<MessageCircle className="h-4 w-4" />}
        eyebrow="Trao đổi riêng trong Mentoring"
        title="Tin nhắn Mentoring"
        description="Theo dõi trao đổi với Mentor hoặc học viên theo từng yêu cầu và Task."
      />

      <div className="rounded-3xl border border-plum-900/[0.08] bg-white p-4 shadow-xs dark:border-white/10 dark:bg-[#242526] sm:p-5">
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-plum-900/10 bg-cream-100/50 px-3.5 dark:border-white/10 dark:bg-[#18191a]">
          <Search className="h-4 w-4 shrink-0 text-plum-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm Mentor hoặc học viên..."
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-plum-900 outline-none placeholder:text-plum-400 dark:text-white"
          />
        </label>

        <div className="mt-4 space-y-2">
          {isLoading ? (
            [1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-2xl bg-cream-100 dark:bg-white/5" />
            ))
          ) : filteredConversations.length === 0 ? (
            <EmptyState
              title={search ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có tin nhắn Mentoring'}
              description={search ? 'Thử tìm bằng tên khác.' : 'Cuộc trò chuyện sẽ xuất hiện khi một yêu cầu Mentoring được kết nối.'}
            />
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => navigate(`/app/mentoring/chats/${conversation.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-colors hover:border-brand-100 hover:bg-brand-50/60 dark:hover:border-brand-500/20 dark:hover:bg-brand-500/10"
              >
                <Avatar
                  src={conversation.recipientAvatar || undefined}
                  name={conversation.recipientName}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-plum-900 dark:text-white">
                      {conversation.recipientName}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-plum-500 dark:text-[#b0b3b8]">
                    {conversation.lastMessage || 'Bắt đầu trao đổi Mentoring'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-plum-400">
                  {conversation.lastMessageAt && (
                    <span className="hidden text-[11px] sm:inline">
                      {format(new Date(conversation.lastMessageAt), 'dd/MM · HH:mm')}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function MentoringMessagesPage() {
  return (
    <MentoringTermsGate source="MENTORING_HOME">
      <MentoringMessagesContent />
    </MentoringTermsGate>
  )
}
