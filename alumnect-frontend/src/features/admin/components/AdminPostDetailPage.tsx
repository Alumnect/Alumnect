import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, ThumbsUp, MessageSquare, Eye, EyeOff, ShieldAlert, Briefcase, CalendarPlus, MapPin, Users, ExternalLink, Inbox, Trash2, Building2, Coins, Mail } from 'lucide-react'
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
                  <div className="mb-4 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm ring-1 ring-orange-50 transition-all dark:bg-[#242526] dark:border-[#393a3b] dark:ring-0">
                    {/* Header Tuyển dụng */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50/90 via-amber-50/40 to-white px-6 py-4 dark:border-[#393a3b] dark:from-[#3a3b3c] dark:to-[#242526]">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-[#F27024] shadow-2xs dark:bg-orange-500/20 dark:text-orange-400">
                          <Briefcase size={20} />
                        </span>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#F27024] dark:text-orange-400">
                            Cơ hội việc làm
                          </span>
                          <h3 className="text-base font-bold text-plum-900 dark:text-[#f0f2f5] leading-snug">
                            {post.job.title}
                          </h3>
                        </div>
                      </div>

                      {post.job.company && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 border border-orange-200/80 text-xs font-bold text-slate-800 shadow-2xs dark:border-[#4e4f50] dark:bg-[#242526] dark:text-[#f0f2f5]">
                          <Building2 size={15} className="text-[#F27024]" />
                          <span>{post.job.company}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Box Kêu gọi Ứng tuyển */}
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/30 p-3.5 shadow-xs dark:border-[#393a3b] dark:bg-none dark:bg-[#3a3b3c]">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-plum-900 dark:text-[#f0f2f5]">Hồ sơ & Ứng tuyển</p>
                          <p className="text-[11px] text-slate-500 dark:text-[#b0b3b8] mt-0.5">
                            {post.job.applyUrl
                              ? 'Ứng tuyển qua liên kết chính thức của nhà tuyển dụng'
                              : post.job.contactEmail
                              ? `Email: ${post.job.contactEmail}`
                              : 'Liên hệ người đăng bài để biết thêm chi tiết'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {post.job.contactEmail && (
                            <a
                              href={`mailto:${post.job.contactEmail}?subject=${encodeURIComponent(`Ứng tuyển vị trí ${post.job.title} - ${post.job.company}`)}`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs dark:border-[#4e4f50] dark:bg-[#242526] dark:text-slate-200"
                            >
                              <Mail size={13} className="text-slate-500 dark:text-slate-400" />
                              <span>Email</span>
                            </a>
                          )}
                          {post.job.applyUrl && (
                            <a
                              href={post.job.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F27024] to-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:from-[#d96010] hover:to-amber-700 transition-all cursor-pointer"
                            >
                              <span>Ứng tuyển</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Chi tiết Mức lương, Email, Địa điểm */}
                      <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2 dark:border-[#393a3b] dark:bg-[#3a3b3c]">
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#b0b3b8]">Mức lương</p>
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <Coins size={14} className="text-emerald-500 shrink-0" />
                            {(post.job.salaryMin || post.job.salaryMax) ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                {post.job.salaryMin && post.job.salaryMax
                                  ? `${post.job.salaryMin.toLocaleString('vi-VN')} - ${post.job.salaryMax.toLocaleString('vi-VN')} VNĐ`
                                  : post.job.salaryMin
                                  ? `Từ ${post.job.salaryMin.toLocaleString('vi-VN')} VNĐ`
                                  : `Lên đến ${post.job.salaryMax?.toLocaleString('vi-VN')} VNĐ`}
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-[#b0b3b8] font-medium">Thỏa thuận</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#b0b3b8]">Liên hệ tuyển dụng</p>
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <Mail size={14} className="text-sky-500 shrink-0" />
                            {post.job.contactEmail ? (
                              <a
                                href={`mailto:${post.job.contactEmail}`}
                                className="text-sky-600 hover:underline dark:text-sky-400 truncate"
                              >
                                {post.job.contactEmail}
                              </a>
                            ) : (
                              <span className="text-slate-400 dark:text-[#b0b3b8] font-normal">—</span>
                            )}
                          </div>
                        </div>

                        {post.job.location && (
                          <div className="col-span-1 sm:col-span-2 mt-1 border-t border-slate-200/60 dark:border-[#4e4f50] pt-3">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#b0b3b8]">Địa điểm làm việc</p>
                            <p className="flex items-start gap-1.5 text-xs font-medium text-plum-800 dark:text-[#f0f2f5]">
                              <MapPin size={14} className="text-[#F27024] shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{post.job.location}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {post.content && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#F27024] dark:text-orange-400">Mô tả công việc</p>
                          <p className="whitespace-pre-line text-xs leading-relaxed text-plum-800 dark:text-[#e4e6eb]">{post.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- Thẻ thông tin Sự kiện (nếu là bài EVENT) --- */}
                {post.type === 'EVENT' && post.event && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm ring-1 ring-violet-50 transition-all dark:bg-[#242526] dark:border-[#393a3b] dark:ring-0">
                    <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/80 to-violet-100/30 px-6 py-4 dark:border-[#393a3b] dark:from-[#3a3b3c] dark:to-[#242526]">
                      <h3 className="flex items-center gap-2 font-bold text-violet-900 text-base dark:text-[#f0f2f5]">
                        <CalendarPlus size={18} className="text-violet-600 dark:text-violet-400" />
                        <span>Sự kiện: <span className="text-plum-900 dark:text-[#f0f2f5]">{post.event.title}</span></span>
                      </h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2 text-xs dark:border-[#393a3b] dark:bg-[#3a3b3c]">
                        {post.event.startTime && (
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#b0b3b8]">Bắt đầu</p>
                            <p className="flex items-center gap-1.5 font-semibold text-plum-900 dark:text-[#f0f2f5]">
                              <Clock size={14} className="text-violet-500" />
                              {new Date(post.event.startTime).toLocaleDateString('vi-VN', { dateStyle: 'medium' })} {' '}
                              {new Date(post.event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                        {post.event.endTime ? (
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#b0b3b8]">Kết thúc</p>
                            <p className="flex items-center gap-1.5 font-semibold text-plum-900 dark:text-[#f0f2f5]">
                              <Clock size={14} className="text-coral-500" />
                              {new Date(post.event.endTime).toLocaleDateString('vi-VN', { dateStyle: 'medium' })} {' '}
                              {new Date(post.event.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#b0b3b8]">Kết thúc</p>
                            <p className="font-semibold text-slate-400 dark:text-[#b0b3b8]">—</p>
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
                    {post.deleted ? (
                      <>
                        <Trash2 size={16} className="text-rose-500" />
                        <span className="text-sm font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          Đã xóa
                        </span>
                      </>
                    ) : post.hidden ? (
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
              {!post.deleted ? (
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
                </div>
              ) : (
                <div className="mt-6 border-t border-plum-900/5 pt-4">
                  <div className="rounded-xl bg-rose-50 border border-rose-200/60 p-3 text-center text-xs font-semibold text-rose-700">
                    Bài viết này đã bị xóa khỏi hệ thống
                  </div>
                </div>
              )}
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
