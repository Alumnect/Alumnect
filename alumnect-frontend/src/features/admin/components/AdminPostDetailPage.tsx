import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, ThumbsUp, MessageSquare, Repeat, Eye, EyeOff, ShieldAlert, Briefcase, CalendarPlus, MapPin, Users, ExternalLink, Inbox } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton, ImageCarousel, Modal, toast } from '@/components/ui'
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
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Hook lấy chi tiết bài viết từ React Query
  const { data: post, isLoading, error } = useAdminPostDetail(postId)

  // Hook ẩn/hiện bài viết (UC68)
  const toggleMutation = useTogglePostHidden()

  /**
   * Xử lý ẩn hoặc hiển thị lại bài viết vi phạm.
   */
  const handleConfirmToggle = async () => {
    if (!post) return
    try {
      await toggleMutation.mutateAsync({
        id: post.id,
        hidden: !post.hidden,
      })
      toast.success(post.hidden ? 'Đã hiển thị lại bài viết!' : 'Đã ẩn bài viết thành công!')
      setShowConfirmModal(false)
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi thay đổi trạng thái bài viết.')
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

  type BadgeTone = 'brand' | 'gold' | 'aqua' | 'violet' | 'neutral' | 'success' | 'danger'
  const typeLabels: Record<string, { label: string; tone: BadgeTone }> = {
    GENERAL: { label: 'Bình thường', tone: 'neutral' },
    ACHIEVEMENT: { label: 'Thành tựu', tone: 'gold' },
    RECRUITMENT: { label: 'Tuyển dụng', tone: 'aqua' },
    EVENT: { label: 'Sự kiện', tone: 'violet' },
  }

  const postTypeInfo = typeLabels[post.type] || { label: post.type, tone: 'neutral' as BadgeTone }

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
                    src={post.authorAvatarUrl}
                    name={post.authorName || 'U'}
                    className="h-12 w-12 border border-gold-300 bg-gradient-to-tr from-gold-100 to-gold-200 text-plum-900 font-bold"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-plum-950">{post.authorName}</h3>
                    <p className="text-xs text-plum-500">{post.authorEmail}</p>
                  </div>
                </div>

                <Badge tone={postTypeInfo.tone} className="rounded-full px-2.5 py-1">
                  {postTypeInfo.label}
                </Badge>
              </div>

              {/* Nội dung bài viết */}
              <div className="space-y-4">
                {/* --- Thẻ thông tin Tuyển dụng (nếu là bài RECRUITMENT) --- */}
                {post.type === 'RECRUITMENT' && post.job && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm ring-1 ring-brand-50 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-brand-100/30 px-6 py-4">
                      <h3 className="flex items-center gap-2 font-bold text-brand-900 text-base">
                        <Briefcase size={18} className="text-brand-600 animate-pulse" />
                        <span>Tuyển dụng: <span className="text-plum-900">{post.job.title}</span></span>
                      </h3>
                      {post.job.applyUrl && (
                        <a
                          href={post.job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#F27024] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#d96010] transition-colors"
                        >
                          Ứng tuyển <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-sm font-bold text-plum-900 mb-2">Công ty: {post.job.company}</p>
                        <div className="grid gap-3 sm:grid-cols-2 text-xs font-medium text-plum-800">
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Địa điểm</p>
                            {post.job.location ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={14} className="text-brand-500" /> {post.job.location}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">Chưa cập nhật</span>
                            )}
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Mức lương & Liên hệ</p>
                            <div className="flex flex-col gap-1">
                              {(post.job.salaryMin || post.job.salaryMax) ? (
                                <span className="font-semibold text-emerald-600">
                                  {post.job.salaryMin && post.job.salaryMax
                                    ? `Từ ${post.job.salaryMin.toLocaleString('vi-VN')} VND đến ${post.job.salaryMax.toLocaleString('vi-VN')} VND`
                                    : post.job.salaryMin
                                    ? `Từ ${post.job.salaryMin.toLocaleString('vi-VN')} VND`
                                    : `Lên đến ${post.job.salaryMax?.toLocaleString('vi-VN')} VND`}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">Thỏa thuận</span>
                              )}
                              {post.job.contactEmail && (
                                <span className="inline-flex items-center gap-1 text-slate-600">
                                  <Inbox size={14} className="text-plum-400" /> {post.job.contactEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {post.content && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">Mô tả công việc</p>
                          <p className="whitespace-pre-line text-sm leading-relaxed text-plum-800">{post.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- Thẻ thông tin Sự kiện (nếu là bài EVENT) --- */}
                {post.type === 'EVENT' && post.event && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm ring-1 ring-violet-50 transition-all">
                    <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/80 to-violet-100/30 px-6 py-4">
                      <h3 className="flex items-center gap-2 font-bold text-violet-900 text-base">
                        <CalendarPlus size={18} className="text-violet-600" />
                        <span>Sự kiện: <span className="text-plum-900">{post.event.title}</span></span>
                      </h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2 text-xs">
                        {post.event.startTime && (
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Bắt đầu</p>
                            <p className="flex items-center gap-1.5 font-semibold text-plum-900">
                              <Clock size={14} className="text-violet-500" />
                              {new Date(post.event.startTime).toLocaleDateString('vi-VN', { dateStyle: 'medium' })} {' '}
                              {new Date(post.event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                        {post.event.endTime ? (
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Kết thúc</p>
                            <p className="flex items-center gap-1.5 font-semibold text-plum-900">
                              <Clock size={14} className="text-coral-500" />
                              {new Date(post.event.endTime).toLocaleDateString('vi-VN', { dateStyle: 'medium' })} {' '}
                              {new Date(post.event.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Kết thúc</p>
                            <p className="font-semibold text-slate-400">—</p>
                          </div>
                        )}
                        {(post.event.location || post.event.capacity) && (
                          <div className="col-span-1 sm:col-span-2 mt-2 border-t border-slate-200/60 pt-3">
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Địa điểm & Sức chứa</p>
                            <div className="flex flex-wrap items-center gap-4 font-medium text-plum-800">
                              {post.event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={14} className="text-brand-500" /> {post.event.location}
                                </span>
                              )}
                              {post.event.capacity && (
                                <span className="flex items-center gap-1">
                                  <Users size={14} className="text-aqua-600" /> Tối đa {post.event.capacity} người
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {post.content && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-600">Mô tả sự kiện</p>
                          <p className="whitespace-pre-line text-sm leading-relaxed text-plum-800">{post.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- Nội dung text cho các loại bài thường & thành tựu --- */}
                {post.type !== 'EVENT' && post.type !== 'RECRUITMENT' && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-plum-800">
                    {post.content}
                  </p>
                )}

                {/* --- Carousel ảnh đính kèm --- */}
                {(() => {
                  const imgs = post.images && post.images.length > 0 ? post.images : post.imageUrl ? [post.imageUrl] : []
                  if (imgs.length === 0) return null
                  return (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-plum-900/5 bg-plum-900/[0.02]">
                      <ImageCarousel images={imgs} height={360} altPrefix="Ảnh đính kèm" />
                    </div>
                  )
                })()}
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
                  onClick={() => setShowConfirmModal(true)}
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

      {/* Modal xác nhận ẩn / hiện bài viết */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={post.hidden ? 'Mở ẩn bài viết' : 'Ẩn bài viết'}
        icon={post.hidden ? <Eye size={18} className="text-emerald-500" /> : <ShieldAlert size={18} className="text-rose-500" />}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)} disabled={toggleMutation.isPending}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmToggle}
              disabled={toggleMutation.isPending}
              className={post.hidden ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}
            >
              {toggleMutation.isPending ? 'Đang xử lý...' : post.hidden ? 'Mở ẩn' : 'Ẩn bài viết'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-plum-600">
          Bạn có chắc muốn {post.hidden ? 'mở ẩn lại' : 'ẩn'} bài viết này không?
        </p>
      </Modal>
    </div>
  )
}
