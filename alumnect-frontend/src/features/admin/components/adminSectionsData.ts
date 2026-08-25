import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, Flag, CreditCard, Megaphone, ShieldCheck } from 'lucide-react'

export type Section = {
  title: string
  subtitle: string
  icon: LucideIcon
  stats: { label: string; value: string; tone: string }[]
  rows: { primary: string; secondary: string; status: string; tone: 'brand' | 'gold' | 'success' | 'danger' | 'neutral' }[]
  primaryAction: string
}

/**
 * Cấu hình các trang con của Admin Console (verifications, reports, revenue,
 * broadcast, moderation). `stats`/`rows` để rỗng — TODO(team): nối dữ liệu
 * thật từ backend khi API tương ứng sẵn sàng.
 */
export const ADMIN_SECTIONS: Record<string, Section> = {
  verifications: {
    title: 'Kiểm duyệt cựu sinh viên',
    subtitle: 'Xem xét minh chứng tốt nghiệp và phê duyệt tài khoản cựu sinh viên FPTU.',
    icon: BadgeCheck,
    stats: [],
    rows: [],
    primaryAction: 'Hàng đợi xác minh',
  },
  reports: {
    title: 'Báo cáo vi phạm',
    subtitle: 'Xử lý các bài viết, câu hỏi, câu trả lời bị người dùng báo cáo.',
    icon: Flag,
    stats: [],
    rows: [],
    primaryAction: 'Hàng đợi báo cáo',
  },
  revenue: {
    title: 'Thống kê & Doanh thu',
    subtitle: 'Theo dõi lịch sử giao dịch và doanh thu dịch vụ trên hệ thống.',
    icon: CreditCard,
    stats: [],
    rows: [],
    primaryAction: 'Xuất báo cáo',
  },
  broadcast: {
    title: 'Gửi thông báo hệ thống',
    subtitle: 'Gửi thông báo broadcast tới toàn bộ thành viên hoặc nhóm đối tượng.',
    icon: Megaphone,
    stats: [],
    rows: [],
    primaryAction: 'Tạo thông báo mới',
  },
  moderation: {
    title: 'Kiểm duyệt Diễn đàn',
    subtitle: 'Quản lý chủ đề và kiểm duyệt các câu hỏi & câu trả lời trên diễn đàn.',
    icon: ShieldCheck,
    stats: [],
    rows: [],
    primaryAction: 'Quản lý chủ đề',
  },
}
