import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, ThumbsUp, MessageSquare, Repeat, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { useAdminPostDetail, useTogglePostHidden } from '../hooks/useAdmin'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

/**
 * Trang chi tiết bài viết cộng đồng dành cho Admin (UC67).
 * Thiết kế giao diện theo phong cách Pastel Premium (nền kem ấm, chữ mận chín, viền mềm mại).
 */
export default function AdminPostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const postId = id ? parseInt(id, 10) : null

  // Hook lấy chi tiết bài viết từ React Query
  const { data: post, isLoading, error } = useAdminPostDetail(postId)

  // Hook ẩn/hiện bài viết (UC68)
  const toggleMutation = useTogglePostHidden()

  /**
   * Xử lý ẩn hoặc hiển thị lại bài viết vi phạm.
   */
  const handleToggleHidden = async () => {
    if (!post) return
    const actionText = post.hidden ? 'hiển thị lại' : 'ẩn'
    const confirmMessage = `Bạn có chắc chắn muốn ${actionText} bài viết này không?\nBài viết sau khi ẩn sẽ không xuất hiện trên bảng tin cộng đồng của người dùng.`
    
    if (window.confirm(confirmMessage)) {
      try {
        await toggleMutation.mutateAsync({
          id: post.id,
          hidden: !post.hidden,
        })
      } catch (err) {
        console.error('Lỗi khi thay đổi trạng thái bài viết:', err)
      }
    }
  }

  // 1. Trạng thái đang tải dữ liệu (Loading)
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4">
          <Skeleton className="h-6 w-24 bg-plum-900/5" />
        </div>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-12 w-12 rounded-full bg-plum-900/5" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-plum-900/5" />
              <Skeleton className="h-3 w-48 bg-plum-900/5" />
            </div>
          </div>
          <Skeleton className="h-6 w-3/4 mb-4 bg-plum-900/5" />
          <Skeleton className="h-32 w-full mb-6 bg-plum-900/5" />
          <div className="flex gap-4">
            <Skeleton className="h-5 w-16 bg-plum-900/5" />
            <Skeleton className="h-5 w-16 bg-plum-900/5" />
          </div>
        </Card>
      </div>
    )
  }

  // 2. Trạng thái lỗi hoặc không tìm thấy bài viết (Error/Not Found)
  if (error || !post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          title="Không tìm thấy bài viết"
          description="Đường dẫn không hợp lệ hoặc bài viết này đã bị xoá hoàn toàn khỏi cơ sở dữ liệu."
          action={
            <Button onClick={() => navigate('/admin/posts')}>
              Quay lại danh sách
            </Button>
          }
        />
      </div>
    )
  }

  // Bản đồ dịch loại bài viết sang tiếng Việt
  const typeLabels: Record<string, { label: string; color: string }> = {
    GENERAL: { label: 'Bình thường', color: 'bg-teal-500/10 text-teal-700' },
    ACHIEVEMENT: { label: 'Thành tựu', color: 'bg-emerald-500/10 text-emerald-700' },
    RECRUITMENT: { label: 'Tuyển dụng', color: 'bg-blue-500/10 text-blue-700' },
    EVENT: { label: 'Sự kiện', color: 'bg-amber-500/10 text-amber-700' },
  }

  const postTypeInfo = typeLabels[post.type] || { label: post.type, color: 'bg-plum-900/5 text-plum-600' }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate('/admin/posts')}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-plum-500 transition-colors hover:text-gold-400"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách bài viết
      </button>

      <PageHeader
        title="Chi tiết bài viết"
        subtitle="Xem nội dung chi tiết và kiểm duyệt bài viết trên bảng tin cộng đồng."
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cột trái: Nội dung bài viết */}
        <div className="lg:col-span-2 space-y-6">
          <Reveal>
            <Card className="overflow-hidden border border-plum-900/5 bg-white p-6 shadow-sm">
              {/* Thông tin tác giả */}
              <div className="flex items-center justify-between border-b border-plum-900/5 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={undefined}
                    name={post.authorName || 'U'}
                    className="h-12 w-12 border border-gold-300 bg-gradient-to-tr from-gold-100 to-gold-200 text-plum-900 font-bold"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-plum-950">{post.authorName}</h3>
                    <p className="text-xs text-plum-500">{post.authorEmail}</p>
                  </div>
                </div>

                <Badge className={`rounded-full px-2.5 py-1 text-xs font-semibold ${postTypeInfo.color}`}>
                  {postTypeInfo.label}
                </Badge>
              </div>

              {/* Nội dung bài viết */}
              <div className="space-y-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-plum-800">
                  {post.content}
                </p>

                {/* Ảnh đính kèm (nếu có) */}
                {post.imageUrl && (
                  <div className="relative mt-4 overflow-hidden rounded-2xl border border-plum-900/5 bg-plum-900/[0.02]">
                    <img
                      src={post.imageUrl}
                      alt="Ảnh đính kèm bài viết"
                      className="w-full max-h-[400px] object-cover transition-transform duration-300 hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              {/* Các chỉ số tương tác */}
              <div className="mt-6 flex items-center gap-6 border-t border-plum-900/5 pt-4 text-plum-500">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <ThumbsUp size={16} className="text-plum-400" />
                  <span>{post.likeCount} lượt thích</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <MessageSquare size={16} className="text-plum-400" />
                  <span>{post.commentCount} bình luận</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Repeat size={16} className="text-plum-400" />
                  <span>{post.repostCount} đăng lại</span>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>

        {/* Cột phải: Thông tin kiểm duyệt và Thao tác của Admin */}
        <div className="space-y-6">
          <Reveal delay={0.1}>
            <Card className="border border-plum-900/5 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-plum-950 border-b border-plum-900/5 pb-2">
                Thông tin kiểm duyệt
              </h3>

              <div className="space-y-4">
                {/* Trạng thái hiện tại */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-plum-400 block mb-1">
                    Trạng thái hiển thị
                  </label>
                  <div className="flex items-center gap-2">
                    {post.hidden ? (
                      <>
                        <EyeOff size={16} className="text-red-500" />
                        <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          Đã ẩn (Vi phạm)
                        </span>
                      </>
                    ) : (
                      <>
                        <Eye size={16} className="text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Đang hiển thị công khai
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Thời gian tạo bài viết */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-plum-400 block mb-1">
                    Thời điểm đăng bài
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-plum-700">
                    <Clock size={14} className="text-plum-400" />
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </span>
                  </div>
                </div>

                {/* Mã ID bài viết */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-plum-400 block mb-1">
                    ID bài viết trên hệ thống
                  </label>
                  <span className="text-xs font-mono font-semibold text-plum-600 bg-plum-50 px-2 py-1 rounded">
                    #{post.id}
                  </span>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="mt-6 border-t border-plum-900/5 pt-4">
                <Button
                  onClick={handleToggleHidden}
                  disabled={toggleMutation.isPending}
                  className={`w-full justify-center gap-2 text-xs font-bold transition-all shadow-sm ${
                    post.hidden
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  {post.hidden ? (
                    <>
                      <Eye size={14} />
                      Mở ẩn bài viết
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} />
                      Ẩn bài viết vi phạm
                    </>
                  )}
                </Button>

                {/* Cảnh báo kiểm duyệt */}
                {!post.hidden && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800 border border-amber-100">
                    <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-600" />
                    <p className="leading-normal">
                      Nếu phát hiện bài viết này chứa nội dung vi phạm tiêu chuẩn cộng đồng, nhấp nút ẩn phía trên để gỡ bỏ bài viết khỏi bảng tin lập tức.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
