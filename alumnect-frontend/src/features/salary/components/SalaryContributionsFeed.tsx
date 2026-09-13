/**
 * SalaryContributionsFeed — Khối hiển thị TỪNG lượt đóng góp lương ẩn danh trong toàn hệ thống
 * (không nhóm, không ngưỡng mẫu tối thiểu như thống kê UC53/UC54), phân trang vô hạn, mới nhất
 * trước. Mở cho mọi người dùng đã đăng nhập (Student + Alumni) — vẫn ẩn danh tuyệt đối: mỗi thẻ chỉ
 * hiển thị chức danh/ngành/công ty/khu vực/số năm kinh nghiệm/mức lương, KHÔNG có bất kỳ thông tin
 * nào cho biết đây là đóng góp của ai (kể cả người xem không phải chính chủ cũng không suy ra được).
 */
import { AlertTriangle, LineChart, MapPin, RefreshCw, Users } from 'lucide-react'
import { Card, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useSalaryFeed } from '../hooks/useSalary'

export function SalaryContributionsFeed() {
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useSalaryFeed()
  const items = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <Card hover={false} className="mb-5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-200/50 text-violet-600">
          <Users size={16} />
        </span>
        <div>
          <h2 className="font-bold text-plum-900">Các lượt đóng góp gần đây</h2>
          <p className="text-xs text-plum-500">Ẩn danh tuyệt đối — không ai biết đây là dữ liệu của người nào.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-plum-900/[0.04]" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertTriangle size={20} />
          </span>
          <p className="text-sm text-plum-500">{(error as Error)?.message ?? 'Không tải được danh sách đóng góp.'}</p>
          <Button size="sm" variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<LineChart size={22} />}
          title="Chưa có lượt đóng góp nào"
          description="Hãy là người đầu tiên đóng góp dữ liệu lương."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <div key={c.id} className="rounded-xl border border-plum-900/8 bg-white p-3.5">
                {/* Không truncate — bọc xuống dòng để luôn thấy trọn nội dung, không cần bấm vào xem thêm. */}
                <p className="break-words text-sm font-semibold leading-snug text-plum-900">{c.jobTitle}</p>

                {/* Ngành/công ty là chip ngắn — hợp lý khi để dạng pill. */}
                {(c.industry || c.company) && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {[c.industry, c.company].filter(Boolean).map((tag, i) => (
                      <span key={i} className="rounded-full bg-plum-900/[0.04] px-2 py-0.5 text-[11px] text-plum-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Khu vực để RIÊNG 1 dòng thường (không bọc chip pill) — vì địa chỉ đầy đủ từ gợi ý
                    autocomplete có thể rất dài, nhét chung kiểu chip với ngành/công ty (vốn ngắn) sẽ
                    phồng thành khối to bất cân đối, nhìn rối mắt. */}
                {c.region && (
                  <p className="mt-1.5 flex items-start gap-1 text-[11px] leading-snug text-plum-400">
                    <MapPin size={11} className="mt-0.5 shrink-0" />
                    <span className="break-words">{c.region}</span>
                  </p>
                )}

                {/* Mức lương + số năm kinh nghiệm gộp thành 1 hàng cuối, cân đối 2 bên. */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
                  <p className="text-sm font-semibold text-brand-600">
                    {c.grossAmount.toLocaleString('vi-VN')} {c.currency}
                  </p>
                  {c.yearsExperience != null && (
                    <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-600">
                      {c.yearsExperience} năm KN
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                leftIcon={isFetchingNextPage ? <RefreshCw size={14} className="animate-spin" /> : undefined}
              >
                {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm'}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
