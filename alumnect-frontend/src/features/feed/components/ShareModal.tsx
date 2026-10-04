import { useState, useEffect, useMemo } from 'react'
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
      const title = conv.title || conv.recipientName || 'Hội thoại'
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
          ? `Nhóm trò chuyện • ${conv.memberCount || 2} thành viên`
          : conv.recipientMajor || 'Đoạn chat gần đây',
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
          subtitle: u.headline || u.major || 'Thành viên Alumnect',
          isGroup: false,
        })
      }
    })

    return items
  }, [recentConversations, searchUsers, searchKeyword])

  const resolvedUrl = shareItem?.url || (post ? `${window.location.origin}/app/posts/${post.id}` : (typeof window !== 'undefined' ? window.location.href : ''))
  const resolvedTitle = shareItem?.title || post?.author || 'Alumnect'
  const resolvedSubtitle = shareItem?.subtitle || post?.text || 'Nội dung trên Alumnect'
  const resolvedTypeLabel = shareItem?.typeLabel || 'bài viết'
  const thumbnail = shareItem !== undefined ? shareItem.thumbnail : (post?.image || (post?.images && post.images.length > 0 ? post.images[0] : null))
  const resolvedAvatar = shareItem?.avatarUrl !== undefined ? shareItem.avatarUrl : (post?.avatar || null)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl)
      setCopied(true)
      toast.success(`Đã sao chép liên kết ${resolvedTypeLabel}!`)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link: ', err)
      toast.error('Không thể sao chép liên kết')
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
      toast.success(`Đã gửi ${resolvedTypeLabel} tới ${item.name}!`)
    } catch (err) {
      console.error(`Lỗi khi gửi ${resolvedTypeLabel} qua tin nhắn:`, err)
      toast.error(`Không thể gửi tới ${item.name}. Vui lòng thử lại.`)
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
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors dark:text-[#b0b3b8] dark:hover:bg-white/10 dark:hover:text-[#f0f2f5]"
              title="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="font-bold text-plum-900 dark:text-[#f0f2f5] text-base">Gửi qua tin nhắn</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Share2 size={16} />
            </div>
            <span className="font-bold text-plum-900 dark:text-[#f0f2f5] text-base">Chia sẻ {resolvedTypeLabel}</span>
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
              className="rounded-xl px-4 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10"
            >
              Đóng
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
              Quay lại
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="rounded-xl px-4 text-xs font-semibold"
            >
              {sentKeys.size > 0 ? 'Xong' : 'Đóng'}
            </Button>
          </div>
        )
      }
    >
      {viewMode === 'options' ? (
        /* ================= GIAO DIỆN CHÍNH: TÙY CHỌN CHIA SẺ CAO CẤP ================= */
        <div className="flex flex-col gap-2.5">
          {/* Tóm tắt bài viết dạng mini-card */}
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-slate-50 via-slate-50/80 to-blue-50/30 p-2.5 border border-slate-100 dark:from-white/5 dark:to-white/[0.02] dark:border-white/10 mb-0.5">
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
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-600 dark:bg-white/10 dark:text-[#f0f2f5]">
                {resolvedTypeLabel.includes('nhóm') && !resolvedTypeLabel.includes('bài viết') ? (
                  <Users size={18} />
                ) : (
                  <FileText size={18} />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-plum-900 dark:text-[#f0f2f5]">
                {resolvedTitle}
              </p>
              <p className="truncate text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                {resolvedSubtitle}
              </p>
            </div>
          </div>

          {/* Tùy chọn 1: Gửi qua tin nhắn */}
          <button
            type="button"
            onClick={() => setViewMode('messenger')}
            className="group relative flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all duration-200 border border-slate-200/70 bg-white hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-md hover:shadow-blue-500/5 dark:bg-[#242526] dark:border-white/10 dark:hover:border-blue-500/40 dark:hover:bg-blue-950/20 cursor-pointer"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0064e0] via-[#0084ff] to-[#00b2fe] text-white shadow-md shadow-blue-500/25 transition-transform duration-200 group-hover:scale-105">
              <MessageSquare size={20} className="fill-white/20" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-plum-900 dark:text-[#f0f2f5] text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Gửi qua tin nhắn
              </span>
              <p className="text-xs text-plum-500 dark:text-[#b0b3b8] mt-0.5">
                Gửi trực tiếp cho bạn bè hoặc các nhóm trò chuyện
              </p>
            </div>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:bg-blue-100/50 transition-all dark:group-hover:bg-white/10 dark:group-hover:text-blue-400">
              <ChevronRight size={18} />
            </div>
          </button>

          {/* Tùy chọn 2: Sao chép liên kết */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="group relative flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all duration-200 border border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-md hover:shadow-slate-500/5 dark:bg-[#242526] dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/5 cursor-pointer"
          >
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-md transition-all duration-200 group-hover:scale-105 ${
                copied
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/25'
                  : 'bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 shadow-slate-500/15 dark:from-slate-600 dark:to-slate-800'
              }`}
            >
              {copied ? <Check size={20} className="animate-in zoom-in-75 duration-200" /> : <Copy size={19} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-plum-900 dark:text-[#f0f2f5] text-sm group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {copied ? 'Đã sao chép liên kết!' : 'Sao chép liên kết'}
                </span>
                {copied && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Đã chép
                  </span>
                )}
              </div>
              <p className="text-xs text-plum-500 dark:text-[#b0b3b8] mt-0.5">
                Sao chép đường dẫn {resolvedTypeLabel} vào bộ nhớ tạm
              </p>
            </div>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 group-hover:bg-slate-200/50 transition-all dark:group-hover:bg-white/10 dark:group-hover:text-[#f0f2f5]">
              {copied ? <Check size={18} className="text-emerald-600" /> : <ChevronRight size={18} />}
            </div>
          </button>
        </div>
      ) : (
        /* ================= GIAO DIỆN CHỌN NGƯỜI NHẬN MESSENGER ================= */
        <div className="flex flex-col flex-1 min-h-0 gap-2.5">
          {/* 1. Preview thu nhỏ bài viết đang chia sẻ (Cố định, không cuộn) */}
          <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2 dark:border-white/10 dark:bg-white/5">
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
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-plum-900/[0.04] text-plum-600 dark:bg-white/10 dark:text-[#f0f2f5]">
                {resolvedTypeLabel.includes('nhóm') && !resolvedTypeLabel.includes('bài viết') ? (
                  <Users size={18} />
                ) : (
                  <FileText size={18} />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-plum-500 dark:text-[#b0b3b8]">
                {post?.avatar && <Avatar src={post.avatar || undefined} name={resolvedTitle} size={15} />}
                <span className="font-semibold text-plum-900 dark:text-[#f0f2f5] truncate">
                  {resolvedTitle}
                </span>
                {post?.time && <span>• {post.time}</span>}
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-plum-700 dark:text-[#e4e6eb] leading-tight">
                {resolvedSubtitle}
              </p>
            </div>
          </div>

          {/* 2. Ô nhập lời nhắn gửi kèm (Cố định, không cuộn) */}
          <div className="shrink-0">
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Viết lời nhắn gửi kèm (không bắt buộc)..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-plum-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-[#242526] dark:text-[#f0f2f5] dark:placeholder:text-[#8a8d91]"
            />
          </div>

          {/* 3. Ô tìm kiếm người nhận hoặc nhóm (Cố định, không cuộn) */}
          <div className="relative shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm bạn bè hoặc nhóm trò chuyện..."
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-plum-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-[#242526] dark:text-[#f0f2f5] dark:placeholder:text-[#8a8d91]"
            />
            {isSearchingUsers && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-600" />
            )}
          </div>

          {/* 4. Nhãn danh sách (Cố định) */}
          <div className="shrink-0 text-[11px] font-semibold text-plum-500 dark:text-[#b0b3b8]">
            {searchKeyword.trim() ? 'Kết quả tìm kiếm' : 'Gần đây'}
          </div>

          {/* 5. Danh sách người nhận (PHẦN DUY NHẤT ĐƯỢC CUỘN) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
            {isLoadingRecipients ? (
              <div className="flex h-36 flex-col items-center justify-center gap-2 text-xs text-plum-500 dark:text-[#b0b3b8]">
                <Loader2 size={20} className="animate-spin text-brand-600" />
                <span>Đang tải danh sách liên hệ...</span>
              </div>
            ) : recipientList.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center gap-1 text-center text-xs text-plum-400 dark:text-[#8a8d91]">
                <User size={22} className="opacity-40" />
                <span>Không tìm thấy người nhận hoặc nhóm phù hợp</span>
              </div>
            ) : (
              recipientList.map((item) => {
                const isSending = sendingKey === item.id
                const isSent = sentKeys.has(item.id)

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {item.isGroup ? (
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-950/70 dark:text-brand-300">
                          <Users size={16} />
                        </div>
                      ) : (
                        <Avatar src={item.avatarUrl || undefined} name={item.name} size={36} />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-plum-900 dark:text-[#f0f2f5]">
                          {item.name}
                        </p>
                        {item.subtitle && (
                          <p className="truncate text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSending || isSent}
                      onClick={() => handleSendToRecipient(item)}
                      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        isSent
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : isSending
                            ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                            : 'bg-brand-600 text-white shadow-2xs hover:bg-brand-700 hover:shadow-xs dark:bg-brand-600 dark:hover:bg-brand-500'
                      }`}
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Đang gửi...</span>
                        </>
                      ) : isSent ? (
                        <>
                          <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Đã gửi</span>
                        </>
                      ) : (
                        <>
                          <Send size={11} />
                          <span>Gửi</span>
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
