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

      <div className="rounded-3xl border border-border bg-surface p-4 shadow-xs sm:p-5">
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-cream-100/50 px-3.5 dark:bg-bg">
          <Search className="h-4 w-4 shrink-0 text-text-subtle" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm Mentor hoặc học viên..."
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
          />
        </label>

        <div className="mt-4 space-y-2">
          {isLoading ? (
            [1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-2xl bg-surface-2" />
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
                className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-colors hover:border-primary-soft-border hover:bg-primary-soft"
              >
                <Avatar
                  src={conversation.recipientAvatar || undefined}
                  name={conversation.recipientName}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-text">
                      {conversation.recipientName}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-solid px-1.5 text-xs font-bold text-on-primary">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-text-subtle">
                    {conversation.lastMessage || 'Bắt đầu trao đổi Mentoring'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-text-subtle">
                  {conversation.lastMessageAt && (
                    <span className="hidden text-xs sm:inline">
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
