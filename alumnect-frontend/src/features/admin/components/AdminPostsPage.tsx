import { useState } from 'react'
import { FileText, Search, User, Newspaper, Clock, Eye, EyeOff, ThumbsUp, MessageSquare, Repeat } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import { useAdminPosts } from '../hooks/useAdmin'

const STATUS_TABS = [
  { name: 'Tất cả', value: 'ALL' },
  { name: 'Đang hiển thị', value: 'VISIBLE' },
  { name: 'Đã ẩn', value: 'HIDDEN' },
]

const POST_TYPES = [
  { name: 'Tất cả loại', value: 'ALL' },
  { name: 'Bình thường', value: 'NORMAL' },
  { name: 'Thành tựu', value: 'ACHIEVEMENT' },
  { name: 'Tuyển dụng', value: 'RECRUITMENT' },
  { name: 'Sự kiện', value: 'EVENT' },
]

export function AdminPostsPage() {
  const [status, setStatus] = useState('ALL')
  const [type, setType] = useState('ALL')
  const [query, setQuery] = useState('')
  const [author, setAuthor] = useState('')
  const [page, setPage] = useState(0)

  // Fetch all posts via useAdminPosts hook
  const { data, isLoading, error } = useAdminPosts({
    query: query || undefined,
    author: author || undefined,
    status: status === 'ALL' ? undefined : status,
    type: type === 'ALL' ? undefined : type,
    page,
    size: 10,
  })

  const posts = data?.content || []
  const totalPages = data?.totalPages || 0

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Quản lý bài viết"
        subtitle="Duyệt tất cả bài viết trên bảng tin cộng đồng (Feed posts) trong toàn hệ thống."
      />

      {/* Tabs and search bar */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setStatus(t.value)
                setPage(0)
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all',
                status === t.value
                  ? 'bg-gradient-to-r from-gold-300 to-gold-400 text-plum-900'
                  : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]'
              )}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Post Type Selector */}
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setPage(0)
            }}
            className="h-10 rounded-xl border border-plum-900/10 bg-plum-900/[0.04] px-3.5 text-sm font-semibold text-plum-700 focus:border-gold-400/50 focus:outline-none cursor-pointer"
          >
            {POST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.name}
              </option>
            ))}
          </select>

          <div className="relative flex items-center sm:w-52">
            <Search size={16} className="pointer-events-none absolute left-3 text-plum-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
              placeholder="Tìm theo nội dung..."
              className="h-10 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-9 pr-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-gold-400/50 focus:outline-none"
            />
          </div>

          <div className="relative flex items-center sm:w-52">
            <User size={16} className="pointer-events-none absolute left-3 text-plum-400" />
            <input
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value)
                setPage(0)
              }}
              placeholder="Tìm theo tác giả, email..."
              className="h-10 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-9 pr-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-gold-400/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <Reveal>
        {isLoading ? (
          <Card hover={false} className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : error ? (
          <EmptyState
            icon={<Newspaper size={24} />}
            title="Lỗi tải danh sách bài viết"
            description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
          />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Newspaper size={24} />}
            title="Không tìm thấy bài viết"
            description="Hiện tại không có bài viết nào trên hệ thống."
          />
        ) : (
          <div className="space-y-4">
            <Card hover={false} className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-plum-900/8 text-left text-xs uppercase tracking-wide text-plum-400">
                    <th className="px-5 py-3 font-semibold">Tác giả</th>
                    <th className="px-5 py-3 font-semibold">Nội dung</th>
                    <th className="px-5 py-3 font-semibold">Phạm vi / Loại</th>
                    <th className="px-5 py-3 font-semibold">Tương tác</th>
                    <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-plum-900/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.authorName} size={38} />
                          <div>
                            <p className="font-semibold text-plum-900">{p.authorName}</p>
                            <p className="text-xs text-plum-400">{p.authorEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="line-clamp-2 text-plum-900 font-medium">{p.content}</p>
                        <p className="text-xs text-plum-400 mt-1 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(p.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <Badge tone={p.visibility === 'PUBLIC' ? 'success' : 'neutral'} className="w-max">
                            {p.visibility === 'PUBLIC' ? 'Công khai' : 'Thành viên'}
                          </Badge>
                          <span className="text-xs text-plum-500 font-semibold">{p.type}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-plum-600">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <ThumbsUp size={12} /> {p.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={12} /> {p.commentCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat size={12} /> {p.repostCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={p.hidden ? 'danger' : 'success'}>
                          {p.hidden ? 'Đã ẩn' : 'Hiển thị'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <p className="text-xs text-plum-400">
                  Trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Reveal>
    </div>
  )
}
