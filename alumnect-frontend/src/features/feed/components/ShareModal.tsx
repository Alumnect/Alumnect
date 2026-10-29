import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Copy,
  MessageSquare,
  Check,
  ArrowLeft,
  Search,
  Loader2,
  Send,
  Users,
  User,
  Share2,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { Modal, toast, Avatar } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { chatApi } from '@/features/message/api/chatApi'
import type { Conversation, ChatCandidateUser } from '@/features/message/model/types'
import { useAuthStore } from '@/store/authStore'
import type { Post } from '../model/post'

export interface ShareItem {
  title: string
  subtitle?: string
  thumbnail?: string | null
  avatarUrl?: string | null
  url?: string
  typeLabel?: string
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  post?: Post
  shareItem?: ShareItem
}

interface RecipientItem {
  id: string // unique key for state tracking
  type: 'conversation' | 'user'
  conversationId?: number
  userId?: number
  name: string
  avatarUrl?: string | null
  subtitle?: string | null
  isGroup?: boolean
}

export function ShareModal({ isOpen, onClose, post, shareItem }: ShareModalProps) {
  const { t } = useTranslation()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [viewMode, setViewMode] = useState<'options' | 'messenger'>('options')
  const [copied, setCopied] = useState(false)

  // Trạng thái cho chế độ Gửi trong Messenger
  const [customNote, setCustomNote] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
  const [searchUsers, setSearchUsers] = useState<ChatCandidateUser[]>([])
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false)
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [sendingKey, setSendingKey] = useState<string | null>(null)
  const [sentKeys, setSentKeys] = useState<Set<string>>(new Set())

  // Reset khi mở / đóng modal
  useEffect(() => {
    if (isOpen) {
      setViewMode('options')
      setCustomNote('')
      setSearchKeyword('')
      setSentKeys(new Set())
    }
  }, [isOpen])

  // Tải danh sách cuộc trò chuyện gần đây khi chuyển sang viewMode 'messenger'
  useEffect(() => {
    if (!isOpen || viewMode !== 'messenger') return

    let isMounted = true
    setIsLoadingRecipients(true)
    chatApi
      .getConversations('primary')
      .then((res) => {
        if (!isMounted) return
        setRecentConversations(res.data || [])
      })
      .catch((err) => {
        console.error('Không thể tải danh sách cuộc trò chuyện:', err)
      })
      .finally(() => {
        if (isMounted) setIsLoadingRecipients(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, viewMode])

  // Tìm kiếm bạn bè khi người dùng gõ từ khóa
  useEffect(() => {
    if (!isOpen || viewMode !== 'messenger') return
    const keyword = searchKeyword.trim()
    if (!keyword) {
      setSearchUsers([])
      return
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true)
      try {
        const res = await chatApi.searchUsersForChat(keyword)
        if (isMounted) {
          const filtered = (res.data || []).filter(
            (u) => String(u.userId) !== String(currentUserId)
          )
          setSearchUsers(filtered)
        }
      } catch (err) {
        console.error('Lỗi tìm kiếm người dùng:', err)
      } finally {
        if (isMounted) setIsSearchingUsers(false)
      }
    }, 300)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [isOpen, viewMode, searchKeyword, currentUserId])

  // Tổng hợp danh sách người nhận (gần đây + kết quả tìm kiếm)
  const recipientList: RecipientItem[] = useMemo(() => {
    const items: RecipientItem[] = []
    const seenUserIds = new Set<number>()

    // 1. Các cuộc trò chuyện gần đây
    const kw = searchKeyword.trim().toLowerCase()
    recentConversations.forEach((conv) => {
      const title = conv.title || conv.recipientName || t('chat.conversation', 'Hội thoại')
      if (kw && !title.toLowerCase().includes(kw)) {
        return
      }

      if (conv.recipientId) {
        seenUserIds.add(conv.recipientId)
      }

      items.push({
        id: `conv-${conv.id}`,
        type: 'conversation',
        conversationId: conv.id || undefined,
        name: title,
        avatarUrl: conv.avatarUrl || conv.recipientAvatar,
        subtitle: conv.isGroup
          ? t('chat.groupChatMembers', { count: conv.memberCount || 2, defaultValue: `Nhóm trò chuyện • ${conv.memberCount || 2} thành viên` })
          : conv.recipientMajor || t('chat.recentChat', 'Đoạn chat gần đây'),
        isGroup: conv.isGroup,
      })
    })

    // 2. Thêm người dùng từ kết quả tìm kiếm (nếu chưa có trong hội thoại gần đây)
    searchUsers.forEach((u) => {
      if (!seenUserIds.has(u.userId)) {
        items.push({
          id: `user-${u.userId}`,
          type: 'user',
          userId: u.userId,
          name: u.fullName,
          avatarUrl: u.avatarUrl,
          subtitle: u.headline || u.major || t('chat.alumnectMember', 'Thành viên Alumnect'),
          isGroup: false,
        })
      }
    })

    return items
  }, [recentConversations, searchUsers, searchKeyword])

  const defaultTypeLabel = t('feed.postTypeLabel')
  const resolvedUrl = shareItem?.url || (post ? `${window.location.origin}/app/posts/${post.id}` : (typeof window !== 'undefined' ? window.location.href : ''))
  const resolvedTitle = shareItem?.title || post?.author || 'Alumnect'
  const resolvedSubtitle = shareItem?.subtitle || post?.text || 'Alumnect'
  const resolvedTypeLabel = shareItem?.typeLabel || defaultTypeLabel
  const thumbnail = shareItem !== undefined ? shareItem.thumbnail : (post?.image || (post?.images && post.images.length > 0 ? post.images[0] : null))
  const resolvedAvatar = shareItem?.avatarUrl !== undefined ? shareItem.avatarUrl : (post?.avatar || null)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl)
      setCopied(true)
      toast.success(t('feed.copyLinkSuccess', { type: resolvedTypeLabel }))
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link: ', err)
      toast.error(t('feed.copyLinkError'))
    }
  }

  // Thực hiện gửi bài viết tới một người nhận / nhóm trò chuyện
  const handleSendToRecipient = async (item: RecipientItem) => {
    const finalContent = customNote.trim()
      ? `${customNote.trim()}\n\n${resolvedUrl}`
      : resolvedUrl

    setSendingKey(item.id)
    try {
      if (item.type === 'conversation' && item.conversationId) {
        await chatApi.sendMessage({
          conversationId: item.conversationId,
          content: finalContent,
        })
      } else if (item.userId) {
        await chatApi.sendMessage({
          recipientId: item.userId,
          content: finalContent,
        })
      }

      setSentKeys((prev) => new Set(prev).add(item.id))
      toast.success(t('feed.sendSuccess', { type: resolvedTypeLabel, name: item.name }))
    } catch (err) {
      console.error(`Lỗi khi gửi ${resolvedTypeLabel} qua tin nhắn:`, err)
      toast.error(t('feed.sendError', { name: item.name }))
    } finally {
      setSendingKey(null)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName="max-w-md"
      className={viewMode === 'messenger' ? 'h-[580px] max-h-[90vh]' : undefined}
      bodyClassName={viewMode === 'messenger' ? 'flex flex-col p-4 overflow-hidden min-h-0' : 'p-5'}
      title={
        viewMode === 'messenger' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('options')}
              className="grid h-8 w-8 place-items-center rounded-lg text-text-subtle hover:bg-surface-2 hover:text-text transition-colors"
              title={t('common.back')}
            >
              <ArrowLeft size={18} />
            </button>
            <span className="font-bold text-text text-base">{t('feed.sendViaMessage')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary-solid">
              <Share2 size={16} />
            </div>
            <span className="font-bold text-text text-base">{t('feed.shareType', { type: resolvedTypeLabel })}</span>
          </div>
        )
      }
      footer={
        viewMode === 'options' ? (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl px-4 text-xs font-semibold hover:bg-surface-2"
            >
              {t('common.close')}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('options')}
              className="rounded-xl px-3.5 text-xs font-semibold"
            >
              {t('common.back')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="rounded-xl px-4 text-xs font-semibold"
            >
              {sentKeys.size > 0 ? t('feed.doneBtn') : t('common.close')}
            </Button>
          </div>
        )
      }
    >
      {viewMode === 'options' ? (
        /* ================= GIAO DIỆN CHÍNH: TÙY CHỌN CHIA SẺ CAO CẤP ================= */
        <div className="flex flex-col gap-2.5">
          {/* Tóm tắt bài viết dạng mini-card */}
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-2.5 border border-border mb-0.5">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt="Post thumbnail"
                className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-2xs"
              />
            ) : resolvedAvatar ? (
              <Avatar
                src={resolvedAvatar}
                name={resolvedTitle}
                size={40}
                className="rounded-xl shrink-0 shadow-2xs"
              />
            ) : (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-text-muted">
                {shareItem?.type === 'group' || (resolvedTypeLabel.toLowerCase().includes('group') || resolvedTypeLabel.toLowerCase().includes('nhóm')) ? (
                  <Users size={18} />
                ) : (
                  <FileText size={18} />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-text">
                {resolvedTitle}
              </p>
              <p className="truncate text-xs text-text-subtle">
                {resolvedSubtitle}
              </p>
            </div>
          </div>

          {/* Tùy chọn 1: Gửi qua tin nhắn */}
          <button
            type="button"
            onClick={() => setViewMode('messenger')}
            className="group relative flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition duration-200 border border-border bg-surface hover:border-info-border hover:bg-info-soft hover:shadow-blue-500/5 cursor-pointer"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-info text-text-inverse shadow-md shadow-blue-500/25 transition-transform duration-200 group-hover:scale-105">
              <MessageSquare size={20} className="fill-white/20" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-text text-sm group-hover:text-info transition-colors">
                {t('feed.sendViaMessage')}
              </span>
              <p className="text-xs text-text-subtle mt-0.5">
                {t('feed.sendViaMessageDesc')}
              </p>
            </div>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-subtle group-hover:text-info group-hover:translate-x-0.5 group-hover:bg-info-soft transition">
              <ChevronRight size={18} />
            </div>
          </button>

          {/* Tùy chọn 2: Sao chép liên kết */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="group relative flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition duration-200 border border-border bg-surface hover:border-border-strong hover:bg-surface-2 cursor-pointer"
          >
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-md transition duration-200 group-hover:scale-105 ${
                copied
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/25'
                  : 'bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 shadow-slate-500/15 dark:from-slate-600 dark:to-slate-800'
              }`}
            >
              {copied ? <Check size={20} className="animate-in zoom-in-75 duration-200" /> : <Copy size={19} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text text-sm group-hover:text-text transition-colors">
                  {copied ? t('feed.linkCopied') : t('feed.copyLink')}
                </span>
                {copied && (
                  <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success">
                    {t('feed.copiedBadge')}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-subtle mt-0.5">
                {t('feed.copyLinkDesc', { type: resolvedTypeLabel })}
              </p>
            </div>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-subtle group-hover:text-text-muted group-hover:translate-x-0.5 group-hover:bg-slate-200/50 transition dark:group-hover:bg-white/10">
              {copied ? <Check size={18} className="text-success" /> : <ChevronRight size={18} />}
            </div>
          </button>
        </div>
      ) : (
        /* ================= GIAO DIỆN CHỌN NGƯỜI NHẬN MESSENGER ================= */
        <div className="flex flex-col flex-1 min-h-0 gap-2.5">
          {/* 1. Preview thu nhỏ bài viết đang chia sẻ (Cố định, không cuộn) */}
          <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border bg-surface-2 p-2">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt="Thumbnail"
                className="h-11 w-11 shrink-0 rounded-lg object-cover"
              />
            ) : resolvedAvatar ? (
              <Avatar
                src={resolvedAvatar}
                name={resolvedTitle}
                size={44}
                className="rounded-lg shrink-0 shadow-2xs"
              />
            ) : (
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-text-muted">
                {shareItem?.type === 'group' || (resolvedTypeLabel.toLowerCase().includes('group') || resolvedTypeLabel.toLowerCase().includes('nhóm')) ? (
                  <Users size={18} />
                ) : (
                  <FileText size={18} />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-text-subtle">
                {post?.avatar && <Avatar src={post.avatar || undefined} name={resolvedTitle} size={15} />}
                <span className="font-semibold text-text truncate">
                  {resolvedTitle}
                </span>
                {post?.time && <span>• {post.time}</span>}
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-text-muted leading-tight">
                {resolvedSubtitle}
              </p>
            </div>
          </div>

          {/* 2. Ô nhập lời nhắn gửi kèm (Cố định, không cuộn) */}
          <div className="shrink-0">
            <textarea
              aria-label={t('feed.writeMessageOptional')}
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={t('feed.writeMessageOptional')}
              className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:placeholder:text-text-subtle"
            />
          </div>

          {/* 3. Ô tìm kiếm người nhận hoặc nhóm (Cố định, không cuộn) */}
          <div className="relative shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              aria-label={t('feed.searchFriendsOrGroups')}
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={t('feed.searchFriendsOrGroups')}
              className="w-full rounded-xl border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:placeholder:text-text-subtle"
            />
            {isSearchingUsers && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary-solid" />
            )}
          </div>

          {/* 4. Nhãn danh sách (Cố định) */}
          <div className="shrink-0 text-xs font-semibold text-text-subtle">
            {searchKeyword.trim() ? t('feed.searchResults') : t('feed.recentChats')}
          </div>

          {/* 5. Danh sách người nhận (PHẦN DUY NHẤT ĐƯỢC CUỘN) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
            {isLoadingRecipients ? (
              <div className="flex h-36 flex-col items-center justify-center gap-2 text-xs text-text-subtle">
                <Loader2 size={20} className="animate-spin text-primary-solid" />
                <span>{t('feed.loadingContacts')}</span>
              </div>
            ) : recipientList.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center gap-1 text-center text-xs text-text-subtle dark:text-text-subtle">
                <User size={22} className="opacity-40" />
                <span>{t('feed.noRecipientsFound')}</span>
              </div>
            ) : (
              recipientList.map((item) => {
                const isSending = sendingKey === item.id
                const isSent = sentKeys.has(item.id)

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl p-1.5 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {item.isGroup ? (
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-solid">
                          <Users size={16} />
                        </div>
                      ) : (
                        <Avatar src={item.avatarUrl || undefined} name={item.name} size={36} />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-text">
                          {item.name}
                        </p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-text-subtle">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSending || isSent}
                      onClick={() => handleSendToRecipient(item)}
                      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        isSent
                          ? 'bg-success-soft text-success border border-success-border'
                          : isSending
                            ? 'bg-primary-soft text-primary-solid'
                            : 'bg-primary-solid text-on-primary shadow-2xs hover:bg-primary-hover'
                      }`}
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>{t('feed.sendingBtn')}</span>
                        </>
                      ) : isSent ? (
                        <>
                          <Check size={12} className="text-success" />
                          <span>{t('feed.sentBtn')}</span>
                        </>
                      ) : (
                        <>
                          <Send size={11} />
                          <span>{t('feed.sendBtn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
