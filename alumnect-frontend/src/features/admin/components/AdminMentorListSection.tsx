import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  FileText,
  Eye,
  X,
  Briefcase,
  Building2,
  User,
  CreditCard,
  Crown,
  RotateCcw,
  Star,
  Award,
  CheckCircle2,
} from 'lucide-react'
import { Badge, EmptyState, Pagination, Skeleton, SelectDropdown, DialogFrame } from '@/components/ui'
import { useAdminMentors } from '../hooks/useAdmin'
import { AdminMentorCvModal } from './AdminMentorCvModal'
import type { AdminMentorCvDto } from '../api/adminApi'
import { cn } from '@/lib/utils'

export const DEMO_MENTORS: AdminMentorCvDto[] = [
  {
    mentorProfileId: 101,
    mentorName: 'Lê Trần Nhật Huy',
    mentorEmail: 'letrannh2004@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    currentPosition: 'Senior Software Engineer',
    currentCompany: 'Google APAC (Singapore)',
    bio: 'Cựu sinh viên K14 FPTU chuyên ngành Kỹ thuật Phần mềm. Hơn 6 năm kinh nghiệm trong lĩnh vực Distributed Systems, Cloud Architecture (GCP) và thiết kế hệ thống quy mô lớn. Sẵn sàng hỗ trợ các bạn sinh viên định hướng nghề nghiệp, phỏng vấn Big Tech và làm đồ án tốt nghiệp.',
    workingMode: 'HYBRID',
    mentoringType: 'ONE_ON_ONE',
    supportedFields: ['Kỹ thuật phần mềm', 'Hệ thống phân tán', 'Cloud Computing', 'Chuẩn bị phỏng vấn'],
    topics: ['System Design cơ bản & nâng cao', 'Luyện thuật toán LeetCode', 'Định hướng du học & làm việc tại Big Tech'],
    reputationScore: 125,
    completedTasks: 18,
    rating: 4.9,
    reviewCount: 24,
    mentorStatus: 'ACTIVE',
    packageName: 'Gói Cao Cấp 6 Tháng',
    subscriptionStatus: 'ACTIVE',
    subscriptionStartDate: '2026-01-01T00:00:00Z',
    subscriptionEndDate: '2026-07-01T00:00:00Z',
    bankName: 'Vietcombank - CN TP.HCM',
    bankAccountNumber: '0071001234567',
    bankAccountHolder: 'LE TRAN NHAT HUY',
    cvUrl: 'https://alumnect.edu.vn/cv/le_tran_nhat_huy.pdf',
  },
  {
    mentorProfileId: 102,
    mentorName: 'Bình Minh Vũ',
    mentorEmail: 'vubinhminh04@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    currentPosition: 'Tech Lead & Solutions Architect',
    currentCompany: 'FPT Software Global',
    bio: 'K15 FPTU, phụ trách tư vấn giải pháp chuyển đổi số cho các tập đoàn tại Nhật Bản và Châu Âu. Nhiều năm dẫn dắt các dự án quy mô hàng triệu USD. Hỗ trợ kèm cặp 1:1 và cố vấn nhóm sinh viên làm đề tài nghiên cứu.',
    workingMode: 'ONLINE',
    mentoringType: 'GROUP',
    supportedFields: ['Software Architecture', 'Java Spring Boot', 'Microservices', 'DevOps'],
    topics: ['Kiến trúc Microservices chuẩn doanh nghiệp', 'Quy trình phát triển phần mềm Agile/Scrum', 'Review CV ứng tuyển'],
    reputationScore: 98,
    completedTasks: 14,
    rating: 4.8,
    reviewCount: 19,
    mentorStatus: 'ACTIVE',
    packageName: 'Gói Phổ Biến 3 Tháng',
    subscriptionStatus: 'ACTIVE',
    subscriptionStartDate: '2026-02-01T00:00:00Z',
    subscriptionEndDate: '2026-05-01T00:00:00Z',
    bankName: 'Techcombank - Hội sở Hà Nội',
    bankAccountNumber: '19034567891011',
    bankAccountHolder: 'VU BINH MINH',
    cvUrl: 'https://alumnect.edu.vn/cv/vu_binh_minh.pdf',
  },
  {
    mentorProfileId: 103,
    mentorName: 'FierZone (Nguyễn Hải Nam)',
    mentorEmail: 'fierzone0310@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    currentPosition: 'Senior AI Research Scientist',
    currentCompany: 'VinAI Research',
    bio: 'Chuyên gia nghiên cứu Trí tuệ Nhân tạo và Thị giác máy tính (Computer Vision), tác giả của nhiều bài báo tại các hội nghị top-tier CVPR, ICCV. Rất nhiệt tình giúp đỡ sinh viên tiếp cận nghiên cứu khoa học và chuẩn bị hồ sơ xin học bổng Thạc sĩ/Tiến sĩ.',
    workingMode: 'ONLINE',
    mentoringType: 'ONE_ON_ONE',
    supportedFields: ['Trí tuệ nhân tạo', 'Computer Vision', 'Deep Learning', 'Nghiên cứu khoa học'],
    topics: ['Học sâu với PyTorch', 'Viết bài báo khoa học chuẩn quốc tế', 'Xin học bổng nghiên cứu AI'],
    reputationScore: 110,
    completedTasks: 16,
    rating: 5.0,
    reviewCount: 15,
    mentorStatus: 'ACTIVE',
    packageName: 'Gói Cao Cấp 6 Tháng',
    subscriptionStatus: 'ACTIVE',
    subscriptionStartDate: '2026-01-15T00:00:00Z',
    subscriptionEndDate: '2026-07-15T00:00:00Z',
    bankName: 'MB Bank (Ngân hàng Quân Đội)',
    bankAccountNumber: '0987654321001',
    bankAccountHolder: 'NGUYEN HAI NAM',
    cvUrl: 'https://alumnect.edu.vn/cv/nguyen_hai_nam.pdf',
  },
  {
    mentorProfileId: 104,
    mentorName: 'Nguyễn Thanh An',
    mentorEmail: 'minhvbde180352@fpt.edu.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    currentPosition: 'Product Manager (Fintech)',
    currentCompany: 'VNG Corporation',
    bio: 'K13 FPTU, quản lý các sản phẩm ví điện tử và thanh toán số. Có kinh nghiệm thực chiến từ lập trình viên chuyển hướng sang Product Management. Tư vấn phát triển kỹ năng phân tích nghiệp vụ, quản lý backlog và tư duy sản phẩm.',
    workingMode: 'HYBRID',
    mentoringType: 'ONE_ON_ONE',
    supportedFields: ['Product Management', 'Phân tích dữ liệu sản phẩm', 'Fintech', 'UI/UX'],
    topics: ['Lộ trình trở thành Product Manager', 'Phân tích hành vi người dùng A/B Testing', 'Quản trị dự án phần mềm'],
    reputationScore: 85,
    completedTasks: 11,
    rating: 4.7,
    reviewCount: 12,
    mentorStatus: 'ACTIVE',
    packageName: 'Gói Tiêu Chuẩn 1 Tháng',
    subscriptionStatus: 'PAID',
    subscriptionStartDate: '2026-02-10T00:00:00Z',
    subscriptionEndDate: '2026-03-10T00:00:00Z',
    bankName: 'ACB (Ngân hàng Á Châu)',
    bankAccountNumber: '23456789012',
    bankAccountHolder: 'NGUYEN THANH AN',
    cvUrl: 'https://alumnect.edu.vn/cv/nguyen_thanh_an.pdf',
  },
  {
    mentorProfileId: 105,
    mentorName: 'Trần Thị Thu Hà',
    mentorEmail: 'ha.tran@shopee.com',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    currentPosition: 'Lead Product Designer (UI/UX)',
    currentCompany: 'Shopee Vietnam',
    bio: 'Tốt nghiệp Thiết kế Mỹ thuật số FPTU K12. Đã thiết kế giao diện cho nhiều tính năng thương mại điện tử lớn với hàng triệu người dùng hằng ngày. Sẵn sàng review portfolio và hướng dẫn xây dựng case study UX chuẩn quốc tế.',
    workingMode: 'ONLINE',
    mentoringType: 'GROUP',
    supportedFields: ['UI/UX Design', 'Design System', 'User Research', 'Figma'],
    topics: ['Xây dựng Design System từ đầu', 'Tối ưu trải nghiệm thanh toán Checkout', 'Hoàn thiện Portfolio xin việc'],
    reputationScore: 92,
    completedTasks: 13,
    rating: 4.9,
    reviewCount: 18,
    mentorStatus: 'ACTIVE',
    packageName: 'Gói Phổ Biến 3 Tháng',
    subscriptionStatus: 'ACTIVE',
    subscriptionStartDate: '2026-01-20T00:00:00Z',
    subscriptionEndDate: '2026-04-20T00:00:00Z',
    bankName: 'TPBank (Ngân hàng Tiên Phong)',
    bankAccountNumber: '01234567899',
    bankAccountHolder: 'TRAN THI THU HA',
    cvUrl: 'https://alumnect.edu.vn/cv/tran_thi_thu_ha.pdf',
  },
  {
    mentorProfileId: 106,
    mentorName: 'Đặng Hoàng Nam',
    mentorEmail: 'nam.dang@microsoft.com',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    currentPosition: 'Principal Solutions Architect',
    currentCompany: 'Microsoft Vietnam',
    bio: 'K11 FPTU. Hơn 10 năm kinh nghiệm tư vấn kiến trúc đám mây Azure, Kubernetes, bảo mật thông tin và DevOps. Mentor kỳ cựu đã giúp hơn 40 sinh viên FPTU đạt chứng chỉ quốc tế và tìm được việc làm tại các tập đoàn đa quốc gia.',
    workingMode: 'HYBRID',
    mentoringType: 'ONE_ON_ONE',
    supportedFields: ['Cloud Architecture', 'Azure DevOps', 'Cybersecurity', 'Enterprise Architecture'],
    topics: ['Luyện thi chứng chỉ Azure Solution Architect', 'Bảo mật hệ thống thông tin', 'Chiến lược thăng tiến sự nghiệp IT'],
    reputationScore: 140,
    completedTasks: 22,
    rating: 5.0,
    reviewCount: 30,
    mentorStatus: 'ACTIVE',
    packageName: 'Gói Cố Vấn Doanh Nghiệp VIP',
    subscriptionStatus: 'ACTIVE',
    subscriptionStartDate: '2026-01-01T00:00:00Z',
    subscriptionEndDate: '2027-01-01T00:00:00Z',
    bankName: 'VietinBank - CN Đống Đa Hà Nội',
    bankAccountNumber: '108876543210',
    bankAccountHolder: 'DANG HOANG NAM',
    cvUrl: 'https://alumnect.edu.vn/cv/dang_hoang_nam.pdf',
  },
  {
    mentorProfileId: 107,
    mentorName: 'Phạm Quang Minh',
    mentorEmail: 'minh.pham@momo.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    currentPosition: 'Data Engineering Lead',
    currentCompany: 'MoMo E-Wallet',
    bio: 'K13 FPTU. Xây dựng Data Lakehouse, Kafka pipeline xử lý hàng triệu giao dịch thời gian thực. Hướng dẫn các kỹ sư dữ liệu tương lai làm chủ Big Data, Spark, dbt, SQL nâng cao.',
    workingMode: 'ONLINE',
    mentoringType: 'GROUP',
    supportedFields: ['Data Engineering', 'Big Data', 'Apache Spark', 'Data Warehouse'],
    topics: ['Thiết kế Pipeline dữ liệu thời gian thực', 'Tối ưu hóa truy vấn SQL trên Big Data', 'Kinh nghiệm phỏng vấn vị trí DE'],
    reputationScore: 76,
    completedTasks: 9,
    rating: 4.6,
    reviewCount: 10,
    mentorStatus: 'EXPIRED',
    packageName: 'Gói Phổ Biến 3 Tháng',
    subscriptionStatus: 'EXPIRED',
    subscriptionStartDate: '2025-10-01T00:00:00Z',
    subscriptionEndDate: '2026-01-01T00:00:00Z',
    bankName: 'VPBank',
    bankAccountNumber: '1987654321',
    bankAccountHolder: 'PHAM QUANG MINH',
    cvUrl: 'https://alumnect.edu.vn/cv/pham_quang_minh.pdf',
  },
  {
    mentorProfileId: 108,
    mentorName: 'Võ Mai Linh',
    mentorEmail: 'linh.vo@alumni.fptu.edu.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    currentPosition: 'Growth Marketing Manager',
    currentCompany: 'Golden Gate Group',
    bio: 'K14 FPTU ngành Quản trị Kinh doanh. Chuyên gia Performance Marketing, Branding và tăng trưởng người dùng chuỗi F&B hàng đầu Việt Nam.',
    workingMode: 'OFFLINE',
    mentoringType: 'ONE_ON_ONE',
    supportedFields: ['Digital Marketing', 'Growth Hacking', 'Brand Strategy', 'F&B Business'],
    topics: ['Lập kế hoạch Marketing tổng thể', 'Tối ưu chiến dịch Performance Ad', 'Kỹ năng thuyết trình trước nhà đầu tư'],
    reputationScore: 64,
    completedTasks: 7,
    rating: 4.8,
    reviewCount: 8,
    mentorStatus: 'PAYMENT_PENDING',
    packageName: 'Gói Tiêu Chuẩn 1 Tháng',
    subscriptionStatus: 'PENDING_PAYMENT',
    subscriptionStartDate: '2026-03-01T00:00:00Z',
    subscriptionEndDate: '2026-04-01T00:00:00Z',
    bankName: 'Techcombank',
    bankAccountNumber: '19028374659182',
    bankAccountHolder: 'VO MAI LINH',
    cvUrl: 'https://alumnect.edu.vn/cv/vo_mai_linh.pdf',
  },
]

/**
 * Component hiển thị Mục 2: Danh sách Mentor (UC96) tích hợp trong Quản lý Cố vấn & Gói dịch vụ.
 * Phong cách thiết kế shadcn-admin / square-ui với bảng 4 cột tích hợp (không cuộn ngang)
 * và thẻ Card thống nhất bao trọn Toolbar, Table, Pagination.
 */
export function AdminMentorListSection() {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [subStatusFilter, setSubStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(0)

  // Custom hook lấy danh sách Mentor phân trang & bộ lọc
  const { data, isLoading, isError, refetch } = useAdminMentors({
    keyword: keyword || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    subscriptionStatus: subStatusFilter !== 'ALL' ? subStatusFilter : undefined,
    page,
    size: 10,
  })

  const rawMentors = useMemo(() => {
    if (data?.content && data.content.length > 0) return data.content
    return DEMO_MENTORS
  }, [data])

  const filteredMentors = useMemo(() => {
    return rawMentors.filter((m) => {
      // Keyword search
      if (keyword.trim()) {
        const kw = keyword.toLowerCase()
        const matchName = m.mentorName?.toLowerCase().includes(kw)
        const matchEmail = m.mentorEmail?.toLowerCase().includes(kw)
        const matchPos = m.currentPosition?.toLowerCase().includes(kw)
        const matchComp = m.currentCompany?.toLowerCase().includes(kw)
        if (!matchName && !matchEmail && !matchPos && !matchComp) return false
      }
      // Status filter
      if (statusFilter !== 'ALL' && m.mentorStatus !== statusFilter) {
        return false
      }
      // Subscription status filter
      if (subStatusFilter !== 'ALL' && m.subscriptionStatus !== subStatusFilter) {
        return false
      }
      return true
    })
  }, [rawMentors, keyword, statusFilter, subStatusFilter])

  const isFiltered = !!keyword || statusFilter !== 'ALL' || subStatusFilter !== 'ALL'

  const handleResetFilters = () => {
    setKeyword('')
    setStatusFilter('ALL')
    setSubStatusFilter('ALL')
    setPage(0)
  }

  // State quản lý Modal Xem CV & Modal xem Chi tiết
  const [selectedCvMentorId, setSelectedCvMentorId] = useState<number | null>(null)
  const [isCvModalOpen, setIsCvModalOpen] = useState(false)
  const [selectedMentorDetail, setSelectedMentorDetail] = useState<AdminMentorCvDto | null>(null)

  const totalElements = (data?.content && data.content.length > 0) ? data.totalElements : filteredMentors.length
  const totalPages = Math.ceil(filteredMentors.length / 10) || 1
  const mentors = filteredMentors.slice(page * 10, (page + 1) * 10)

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getMentorStatusInfo = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Đang hoạt động', tone: 'success' as const }
      case 'PAYMENT_PENDING':
      case 'PENDING_PAYMENT':
        return { text: 'Chờ thanh toán', tone: 'gold' as const }
      case 'INCOMPLETE':
        return { text: 'Chưa hoàn thiện', tone: 'neutral' as const }
      case 'EXPIRED':
        return { text: 'Đã hết hạn', tone: 'danger' as const }
      case 'PENDING':
        return { text: 'Chờ duyệt', tone: 'gold' as const }
      case 'INACTIVE':
        return { text: 'Ngừng hoạt động', tone: 'neutral' as const }
      case 'REJECTED':
        return { text: 'Bị từ chối', tone: 'danger' as const }
      default:
        return { text: status || 'Chưa kích hoạt', tone: 'neutral' as const }
    }
  }

  const getSubStatusInfo = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Đang hiệu lực', className: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60' }
      case 'PAID':
        return { text: 'Đã thanh toán', className: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60' }
      case 'EXPIRED':
        return { text: 'Đã hết hạn', className: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60' }
      case 'PENDING_PAYMENT':
      case 'PENDING':
        return { text: 'Chờ thanh toán', className: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60' }
      case 'CANCELLED':
        return { text: 'Đã hủy', className: 'text-text-muted bg-surface-2 border-border' }
      default:
        return { text: status || 'Chưa đăng ký', className: 'text-text-subtle bg-surface-2 border-border/60' }
    }
  }

  const formatWorkingMode = (mode?: string) => {
    if (!mode) return 'Chưa cập nhật'
    switch (mode.toUpperCase()) {
      case 'ONLINE':
        return 'Trực tuyến (Online)'
      case 'OFFLINE':
        return 'Gặp mặt trực tiếp (Offline)'
      case 'HYBRID':
        return 'Linh hoạt (Hybrid)'
      default:
        return mode
    }
  }

  const formatMentoringType = (type?: string) => {
    if (!type) return 'Chưa cập nhật'
    switch (type.toUpperCase()) {
      case 'ONE_ON_ONE':
      case '1:1':
        return 'Cố vấn kèm 1:1'
      case 'GROUP':
        return 'Cố vấn nhóm'
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      {/* 1 BẢNG DUY NHẤT (Single Unified Card Container) */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Card Header & Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border p-5 bg-surface">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary-solid shadow-2xs">
                <Users size={15} />
              </span>
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                Danh sách hồ sơ Cố vấn (Mentors)
              </h2>
            </div>
            <p className="mt-1 text-xs text-text-subtle">
              Quản lý chi tiết danh sách Cố vấn, chuyên môn hỗ trợ, tình trạng gói đăng ký và tài khoản nhận chi trả.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-text-subtle self-start sm:self-center">
            Hiển thị <strong className="text-text font-bold">{filteredMentors.length}</strong> / <strong>{totalElements}</strong> Cố vấn
          </div>
        </div>

        {/* Toolbar: Tìm kiếm & Bộ lọc Dropdowns */}
        <div className="border-b border-border bg-surface-2/40 p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-subtle" />
              <input
                aria-label="Tìm theo tên, email, vị trí, công ty..."
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(0)
                }}
                placeholder="Tìm theo tên, email, vị trí, công ty..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-xs text-text placeholder:text-text-subtle focus:border-primary-solid focus:outline-none transition shadow-2xs"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter by Mentor Status */}
            <SelectDropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(String(val))
                setPage(0)
              }}
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái Mentor' },
                { value: 'ACTIVE', label: 'Đang hoạt động' },
                { value: 'PAYMENT_PENDING', label: 'Chờ thanh toán' },
                { value: 'INCOMPLETE', label: 'Chưa hoàn thiện' },
                { value: 'EXPIRED', label: 'Đã hết hạn' },
              ]}
              placeholder="Tất cả trạng thái Mentor"
              className="w-full sm:w-52"
              buttonClassName="h-10 text-xs rounded-xl shadow-2xs"
            />

            {/* Filter by Subscription Status */}
            <SelectDropdown
              value={subStatusFilter}
              onChange={(val) => {
                setSubStatusFilter(String(val))
                setPage(0)
              }}
              options={[
                { value: 'ALL', label: 'Tất cả gói dịch vụ' },
                { value: 'ACTIVE', label: 'Đang hiệu lực' },
                { value: 'PAID', label: 'Đã thanh toán' },
                { value: 'EXPIRED', label: 'Đã hết hạn' },
                { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
                { value: 'CANCELLED', label: 'Đã hủy' },
              ]}
              placeholder="Tất cả gói dịch vụ"
              className="w-full sm:w-48"
              buttonClassName="h-10 text-xs rounded-xl shadow-2xs"
            />

            {/* Reset Filters Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-xs font-bold text-text-muted hover:border-danger hover:bg-danger-soft hover:text-danger transition cursor-pointer shrink-0"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw size={13} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-primary-soft" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4 bg-primary-soft" />
                  <Skeleton className="h-3 w-1/3 bg-primary-soft" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="p-4 text-center bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200 font-semibold flex items-center justify-between">
            <span>Máy chủ đang bảo trì, hiển thị dữ liệu mẫu để bạn thử nghiệm chức năng.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-surface text-xs font-bold text-amber-900 dark:text-amber-100 hover:bg-surface-2 transition cursor-pointer"
            >
              Thử kết nối lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredMentors.length === 0 && (
          <div className="p-8">
            <EmptyState
              icon={<Users size={28} className="text-text-subtle" />}
              title="Không tìm thấy Cố vấn nào"
              description={
                keyword
                  ? `Không có kết quả nào phù hợp với từ khóa "${keyword}".`
                  : 'Hiện chưa có hồ sơ Cố vấn nào phù hợp với bộ lọc đã chọn.'
              }
            />
          </div>
        )}

        {/* Bảng Cố vấn 4 Cột Compound - Không thanh cuộn ngang */}
        {!isLoading && filteredMentors.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-text-subtle bg-surface-2/60">
                  <th className="px-4 py-3 sm:px-5 font-bold w-[34%]">Cố vấn & Đơn vị</th>
                  <th className="px-4 py-3 sm:px-5 font-bold w-[28%]">Gói dịch vụ & Thời hạn</th>
                  <th className="px-4 py-3 sm:px-5 font-bold text-center w-[20%]">Trạng thái & Uy tín</th>
                  <th className="px-4 py-3 sm:px-5 font-bold text-right w-[18%]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mentors.map((m: AdminMentorCvDto) => {
                  const statusInfo = getMentorStatusInfo(m.mentorStatus)
                  const subInfo = getSubStatusInfo(m.subscriptionStatus)

                  return (
                    <tr key={m.mentorProfileId} className="transition-colors hover:bg-surface-2/50">
                      {/* Cột 1: Cố vấn & Công tác */}
                      <td className="px-4 py-3.5 sm:px-5">
                        <div
                          className="flex items-start gap-3 cursor-pointer group/user"
                          onClick={() => setSelectedMentorDetail(m)}
                        >
                          {m.avatarUrl ? (
                            <img
                              src={m.avatarUrl}
                              alt={m.mentorName}
                              className="h-10 w-10 rounded-full object-cover border border-border shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-soft text-primary-solid border border-primary-soft-border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                              {m.mentorName ? m.mentorName.charAt(0).toUpperCase() : <User size={16} />}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="font-extrabold text-xs text-text group-hover/user:text-primary-solid transition-colors truncate">
                              {m.mentorName}
                            </p>
                            <p className="text-[11px] text-text-subtle truncate">{m.mentorEmail}</p>
                            
                            {/* Chức vụ & Công ty */}
                            <div className="flex flex-col gap-0.5 pt-1 text-[11px] text-text-muted">
                              <div className="flex items-center gap-1.5 truncate">
                                <Briefcase size={11} className="text-primary-solid shrink-0" />
                                <span className="truncate font-medium">{m.currentPosition || 'Chưa cập nhật'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate text-text-subtle">
                                <Building2 size={11} className="text-text-subtle shrink-0" />
                                <span className="truncate">{m.currentCompany || 'Chưa cập nhật'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Gói dịch vụ & Thời hạn */}
                      <td className="px-4 py-3.5 sm:px-5">
                        {m.packageName ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="flex items-center gap-1 font-bold text-xs text-text">
                                <Crown size={13} className="text-amber-500 shrink-0" />
                                <span>{m.packageName}</span>
                              </span>
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold border shadow-2xs whitespace-nowrap',
                                  subInfo.className
                                )}
                              >
                                {subInfo.text}
                              </span>
                            </div>
                            <div className="text-[11px] text-text-subtle font-mono flex items-center gap-1">
                              <span>Từ: {formatDate(m.subscriptionStartDate)}</span>
                              <span>·</span>
                              <span>Đến: {formatDate(m.subscriptionEndDate)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-xs text-text-subtle italic block">Chưa đăng ký gói</span>
                            <span className="inline-block text-[10px] text-text-subtle font-medium bg-surface-2 px-1.5 py-0.5 rounded border border-border/50">
                              Chưa kích hoạt
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Cột 3: Trạng thái & Uy tín */}
                      <td className="px-4 py-3.5 sm:px-5 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          {/* Trạng thái Mentor */}
                          <Badge tone={statusInfo.tone} className="text-[10px] px-2 py-0.5 font-bold">
                            {statusInfo.text}
                          </Badge>

                          {/* Điểm uy tín & Số task hoàn thành */}
                          <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 shadow-2xs whitespace-nowrap">
                              <Award size={10} className="text-amber-500" />
                              {m.reputationScore ?? 0} đ
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 shadow-2xs whitespace-nowrap">
                              <CheckCircle2 size={10} className="text-emerald-600" />
                              {m.completedTasks ?? 0} task
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 4: Thao tác */}
                      <td className="px-4 py-3.5 sm:px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Nút Xem CV */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCvMentorId(m.mentorProfileId)
                              setIsCvModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-bold text-text hover:bg-surface-2 transition cursor-pointer shadow-2xs"
                            title="Xem tệp CV gốc"
                          >
                            <FileText size={12} className="text-primary-solid" />
                            <span>CV</span>
                          </button>

                          {/* Nút Chi tiết */}
                          <button
                            type="button"
                            onClick={() => setSelectedMentorDetail(m)}
                            className="inline-flex items-center gap-1 rounded-xl border border-primary-soft-border bg-primary-soft px-2.5 py-1.5 text-xs font-bold text-primary-solid hover:bg-primary-soft/80 transition cursor-pointer shadow-2xs"
                            title="Xem hồ sơ chi tiết"
                          >
                            <Eye size={12} />
                            <span>Chi tiết</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang tích hợp dưới đáy bảng */}
        {totalPages > 1 && (
          <div className="border-t border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs font-semibold text-text-subtle">
              Trang <strong className="text-text">{page + 1}</strong> / <strong>{totalPages}</strong>
            </span>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal Xem CV Cố vấn */}
      <AdminMentorCvModal
        isOpen={isCvModalOpen}
        onClose={() => setIsCvModalOpen(false)}
        mentorProfileId={selectedCvMentorId}
      />

      {/* Modal Chi tiết Hồ sơ Cố vấn (Popup chuẩn Shadcn) */}
      {selectedMentorDetail !== null && (
        <DialogFrame
          onClose={() => setSelectedMentorDetail(null)}
          zIndexClassName="z-50"
          maxWidthClassName="max-w-2xl"
          className="z-10 flex flex-col overflow-hidden"
        >
          {/* Header Modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary-solid shadow-2xs">
                <Users size={16} />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white leading-tight">
                  Chi tiết hồ sơ Mentor
                </h2>
                <p className="text-xs text-text-subtle mt-0.5">
                  Thông tin chuyên môn, gói dịch vụ và tài khoản nhận chi trả.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMentorDetail(null)}
              className="p-1.5 text-text-subtle hover:text-text hover:bg-surface-2 rounded-xl transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4.5">
            {/* Profile Card Summary */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-2/60 border border-border shadow-2xs">
              {selectedMentorDetail.avatarUrl ? (
                <img
                  src={selectedMentorDetail.avatarUrl}
                  alt={selectedMentorDetail.mentorName}
                  className="h-14 w-14 rounded-full object-cover border-2 border-primary-soft-border shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary-soft text-primary-solid border border-primary-soft-border flex items-center justify-center font-extrabold text-xl shrink-0 shadow-2xs">
                  {selectedMentorDetail.mentorName ? selectedMentorDetail.mentorName.charAt(0).toUpperCase() : <User size={24} />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                    {selectedMentorDetail.mentorName}
                  </h3>
                  <Badge
                    tone={getMentorStatusInfo(selectedMentorDetail.mentorStatus).tone}
                    className="text-xs font-bold px-2 py-0.5"
                  >
                    {getMentorStatusInfo(selectedMentorDetail.mentorStatus).text}
                  </Badge>
                </div>
                <p className="text-xs text-text-subtle mt-0.5">{selectedMentorDetail.mentorEmail}</p>

                {/* Badges metrics */}
                <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-xs shadow-2xs">
                    <Award size={12} className="text-amber-500" /> Uy tín: {selectedMentorDetail.reputationScore ?? 0} đ
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs shadow-2xs">
                    <CheckCircle2 size={12} className="text-emerald-600" /> Đã xong: {selectedMentorDetail.completedTasks ?? 0} task
                  </span>
                  {selectedMentorDetail.rating !== undefined && Number(selectedMentorDetail.rating) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-primary-soft text-primary-solid border border-primary-soft-border font-bold text-xs shadow-2xs">
                      <Star size={12} className="text-amber-500 fill-amber-500" /> {selectedMentorDetail.rating} ({selectedMentorDetail.reviewCount ?? 0} đánh giá)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Nhóm 1: Thông tin chuyên môn */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                <Briefcase size={13} className="text-primary-solid" /> Thông tin chuyên môn & Công tác
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl border border-border bg-surface">
                  <span className="text-text-subtle block mb-1">Vị trí hiện tại:</span>
                  <span className="font-bold text-text">
                    {selectedMentorDetail.currentPosition || 'Chưa cập nhật'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface">
                  <span className="text-text-subtle block mb-1">Công ty / Tổ chức:</span>
                  <span className="font-bold text-text">
                    {selectedMentorDetail.currentCompany || 'Chưa cập nhật'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface">
                  <span className="text-text-subtle block mb-1">Hình thức cố vấn:</span>
                  <span className="font-bold text-text">
                    {formatWorkingMode(selectedMentorDetail.workingMode)}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface">
                  <span className="text-text-subtle block mb-1">Loại hình cố vấn:</span>
                  <span className="font-bold text-text">
                    {formatMentoringType(selectedMentorDetail.mentoringType)}
                  </span>
                </div>
              </div>

              {/* Bio */}
              {selectedMentorDetail.bio && (
                <div className="p-3 rounded-xl border border-border bg-surface text-xs space-y-1">
                  <span className="text-text-subtle block font-semibold">Lời giới thiệu (Bio):</span>
                  <p className="text-text-muted leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedMentorDetail.bio}
                  </p>
                </div>
              )}

              {/* Supported Fields */}
              {selectedMentorDetail.supportedFields && selectedMentorDetail.supportedFields.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-text-subtle font-bold block">
                    Lĩnh vực hỗ trợ chuyên môn:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMentorDetail.supportedFields.map((field, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-surface-2 text-text font-bold border border-border text-xs shadow-2xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {selectedMentorDetail.topics && selectedMentorDetail.topics.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-text-subtle font-bold block">
                    Chủ đề cố vấn chuyên sâu:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMentorDetail.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-primary-soft text-primary-solid border border-primary-soft-border text-xs font-bold shadow-2xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Nhóm 2: Gói dịch vụ & Thời hạn */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                <Crown size={13} className="text-amber-500" /> Gói dịch vụ & Thời hạn
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl border border-border bg-surface">
                  <span className="text-text-subtle block mb-1">Gói đăng ký:</span>
                  <span className="font-extrabold text-text">
                    {selectedMentorDetail.packageName || 'Chưa đăng ký gói'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface">
                  <span className="text-text-subtle block mb-1">Trạng thái hiệu lực:</span>
                  <span className="font-bold text-text">
                    {getSubStatusInfo(selectedMentorDetail.subscriptionStatus).text}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface">
                  <span className="text-text-subtle block mb-1">Ngày kích hoạt:</span>
                  <span className="font-mono font-bold text-text-muted">
                    {formatDate(selectedMentorDetail.subscriptionStartDate)}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface">
                  <span className="text-text-subtle block mb-1">Ngày hết hạn:</span>
                  <span className="font-mono font-bold text-text-muted">
                    {formatDate(selectedMentorDetail.subscriptionEndDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Nhóm 3: Tài khoản thanh toán (nếu có) */}
            {(selectedMentorDetail.bankName || selectedMentorDetail.bankAccountNumber) && (
              <div className="space-y-2.5 pt-2 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                  <CreditCard size={13} className="text-primary-solid" /> Tài khoản ngân hàng nhận chi trả
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Ngân hàng:</span>
                    <span className="font-bold text-text">
                      {selectedMentorDetail.bankName || '—'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Số tài khoản:</span>
                    <span className="font-mono font-extrabold text-text">
                      {selectedMentorDetail.bankAccountNumber || '—'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-surface">
                    <span className="text-text-subtle block mb-1">Chủ tài khoản:</span>
                    <span className="font-bold text-text uppercase">
                      {selectedMentorDetail.bankAccountHolder || '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Modal */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedCvMentorId(selectedMentorDetail.mentorProfileId)
                setIsCvModalOpen(true)
              }}
              className="px-3.5 py-2 text-xs font-bold text-primary-solid bg-primary-soft border border-primary-soft-border hover:bg-primary-soft/80 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <FileText size={14} />
              <span>Xem tệp CV gốc</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMentorDetail(null)}
              className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text bg-surface border border-border hover:bg-surface-2 rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </DialogFrame>
      )}
    </div>
  )
}
