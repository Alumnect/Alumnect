import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  FileImage,
  FileCode,
  FileSpreadsheet,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Loader2,
  RefreshCw,
  User,
  GraduationCap,
  Calendar,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Mail,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { Badge, Button, Avatar, toast } from '@/components/ui'
import { cn } from '@/lib/utils'
import { renderAsync } from 'docx-preview'
import type { AdminVerificationRequestDto } from '../api/adminApi'

const REJECT_REASON_TEMPLATES = [
  'Ảnh minh chứng mờ, không nhìn rõ thông tin văn bằng.',
  'Thông tin chuyên ngành không khớp với hồ sơ đăng ký.',
  'Tài liệu không phải là bằng tốt nghiệp hoặc chứng nhận tốt nghiệp hợp lệ.',
  'Mã số sinh viên không tìm thấy trên hệ thống đào tạo FPTU.',
]

interface AdminVerificationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  request: AdminVerificationRequestDto | null
  onReviewSubmit: (id: number, status: 'APPROVED' | 'REJECTED', reviewNote: string) => Promise<void>
  isSubmitting?: boolean
}

type ProofFormat = 'IMAGE' | 'PDF' | 'DOCX' | 'DOC' | 'UNKNOWN'
type DocViewerMode = 'CLIENT_DOCX' | 'OFFICE_ONLINE' | 'GOOGLE_DOCS'

export function AdminVerificationDetailModal({
  isOpen,
  onClose,
  request,
  onReviewSubmit,
  isSubmitting = false,
}: AdminVerificationDetailModalProps) {
  // Document Viewer States
  const [zoom, setZoom] = useState<number>(100)
  const [rotation, setRotation] = useState<number>(0)
  const [previewLoading, setPreviewLoading] = useState<boolean>(true)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [docViewerMode, setDocViewerMode] = useState<DocViewerMode>('CLIENT_DOCX')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)

  // Multiple files support
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0)

  // Inline Review Action States ('NONE' | 'APPROVING' | 'REJECTING')
  const [inlineAction, setInlineAction] = useState<'NONE' | 'APPROVING' | 'REJECTING'>('NONE')
  const [reviewNote, setReviewNote] = useState<string>('')
  const [actionError, setActionError] = useState<string | null>(null)

  // Ref container cho docx-preview
  const docxContainerRef = useRef<HTMLDivElement>(null)

  // Tách danh sách tài liệu nếu có nhiều URL (phân tách bởi dấu phẩy)
  const proofUrls: string[] = React.useMemo(() => {
    if (!request?.proofUrl) return []
    return request.proofUrl
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean)
  }, [request?.proofUrl])

  const currentProofUrl = proofUrls[selectedFileIndex] || request?.proofUrl || ''

  // Xác định định dạng tệp
  const getFileExtension = (url?: string): string => {
    if (!url) return ''
    try {
      const cleanUrl = url.split('?')[0]
      const lastDot = cleanUrl.lastIndexOf('.')
      if (lastDot !== -1) {
        return cleanUrl.substring(lastDot + 1).toLowerCase()
      }
    } catch {
      // fallback
    }
    return ''
  }

  const fileExt = getFileExtension(currentProofUrl)

  const proofFormat: ProofFormat = (() => {
    if (!currentProofUrl) return 'UNKNOWN'
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(fileExt)) return 'IMAGE'
    if (fileExt === 'pdf') return 'PDF'
    if (fileExt === 'docx') return 'DOCX'
    if (fileExt === 'doc') return 'DOC'

    const lower = currentProofUrl.toLowerCase()
    if (lower.includes('.pdf')) return 'PDF'
    if (lower.includes('.docx')) return 'DOCX'
    if (lower.includes('.doc')) return 'DOC'
    // Mặc định ảnh nếu không rõ extension
    return 'IMAGE'
  })()

  const fileName = (() => {
    if (!currentProofUrl) return 'Minh_chung_tot_nghiep'
    try {
      const cleanUrl = currentProofUrl.split('?')[0]
      const rawName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1)
      if (rawName && rawName.trim().length > 0) {
        return decodeURIComponent(rawName)
      }
    } catch {
      // fallback
    }
    const ext = fileExt || (proofFormat === 'IMAGE' ? 'jpg' : proofFormat === 'PDF' ? 'pdf' : 'docx')
    const safeName = (request?.fullName || 'CuuSinhVien').replace(/\s+/g, '_')
    return `Minh_chung_${safeName}_${selectedFileIndex + 1}.${ext}`
  })()

  // Reset state khi mở modal hoặc đổi request
  useEffect(() => {
    if (isOpen) {
      setZoom(100)
      setRotation(0)
      setPreviewLoading(true)
      setPreviewError(null)
      setSelectedFileIndex(0)
      setInlineAction('NONE')
      setReviewNote('')
      setActionError(null)
      setDocViewerMode(proofFormat === 'DOCX' ? 'CLIENT_DOCX' : 'OFFICE_ONLINE')
    }
  }, [isOpen, request?.id])

  // Khóa cuộn trang khi modal mở & Lắng nghe phím Esc
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (inlineAction !== 'NONE') {
            setInlineAction('NONE')
          } else {
            onClose()
          }
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, inlineAction])

  // Render DOCX trực tiếp bằng docx-preview
  const renderDocxFile = useCallback(async () => {
    if (!currentProofUrl || !docxContainerRef.current) return
    setPreviewLoading(true)
    setPreviewError(null)

    try {
      docxContainerRef.current.innerHTML = ''
      const res = await fetch(currentProofUrl)
      if (!res.ok) {
        throw new Error(`Không thể tải tệp (HTTP ${res.status})`)
      }
      const blob = await res.blob()

      await renderAsync(blob, docxContainerRef.current, undefined, {
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        renderHeaders: true,
        renderFooters: true,
      })

      setPreviewLoading(false)
    } catch (err: any) {
      console.warn('DOCX render error:', err)
      setDocViewerMode('OFFICE_ONLINE')
      setPreviewLoading(false)
    }
  }, [currentProofUrl])

  useEffect(() => {
    if (isOpen && proofFormat === 'DOCX' && docViewerMode === 'CLIENT_DOCX' && currentProofUrl) {
      renderDocxFile()
    }
  }, [isOpen, proofFormat, docViewerMode, currentProofUrl, renderDocxFile])

  // Điều khiển Zoom & Xoay
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 250))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 50))
  const handleResetZoom = () => {
    setZoom(100)
    setRotation(0)
  }
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  // Xử lý Tải tệp gốc
  const handleDownloadProof = async () => {
    if (!currentProofUrl) {
      toast.error('Không tìm thấy đường dẫn tệp minh chứng.')
      return
    }

    try {
      setIsDownloading(true)
      const res = await fetch(currentProofUrl)
      if (!res.ok) throw new Error('Không thể tải tệp từ máy chủ lưu trữ.')
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)

      toast.success(`Đã tải xuống: ${fileName}`)
    } catch {
      const a = document.createElement('a')
      a.href = currentProofUrl
      a.download = fileName
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } finally {
      setIsDownloading(false)
    }
  }

  // Xử lý Phê duyệt / Từ chối
  const handleConfirmAction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!request) return
    setActionError(null)

    if (inlineAction === 'REJECTING') {
      const trimmedNote = reviewNote.trim()
      if (!trimmedNote) {
        setActionError('Vui lòng nhập lý do từ chối hồ sơ xác thực.')
        return
      }
      try {
        await onReviewSubmit(request.id, 'REJECTED', trimmedNote)
        setInlineAction('NONE')
      } catch (err: any) {
        setActionError(err?.message || 'Có lỗi xảy ra khi từ chối hồ sơ.')
      }
    } else if (inlineAction === 'APPROVING') {
      const defaultApprovalNote =
        reviewNote.trim() || 'Minh chứng tốt nghiệp hợp lệ. Đã phê duyệt quyền Cựu sinh viên FPTU.'
      try {
        await onReviewSubmit(request.id, 'APPROVED', defaultApprovalNote)
        setInlineAction('NONE')
      } catch (err: any) {
        setActionError(err?.message || 'Có lỗi xảy ra khi phê duyệt hồ sơ.')
      }
    }
  }

  if (!isOpen || !request) return null

  // URLs cho Office Online / Google Docs Viewer
  const officeOnlineUrl = currentProofUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentProofUrl)}`
    : ''
  const googleDocsUrl = currentProofUrl
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(currentProofUrl)}&embedded=true`
    : ''

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-plum-950/70 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Backdrop (Chặn đóng khi đang nhập lý do từ chối để tránh mất nội dung) */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (inlineAction === 'NONE') {
            onClose()
          }
        }}
      />

      {/* Main Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[1200px] w-[95vw] sm:w-[92vw] h-[92vh] sm:h-[90vh] max-h-[92vh] bg-white dark:bg-[#1c1d1f] rounded-3xl shadow-2xl border border-plum-900/10 dark:border-[#393a3b] flex flex-col overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= 1. HEADER (CỐ ĐỊNH) ================= */}
        <header className="px-5 py-3.5 sm:px-6 sm:py-4 bg-white dark:bg-[#1c1d1f] border-b border-slate-200/80 dark:border-[#333537] flex items-center justify-between gap-3 shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-plum-900 dark:text-[#f0f2f5] truncate">
                  Chi tiết xác minh
                </h2>
                <Badge
                  tone={
                    request.status === 'APPROVED'
                      ? 'success'
                      : request.status === 'REJECTED'
                      ? 'danger'
                      : 'gold'
                  }
                  className="text-[11px] font-bold px-2.5 py-0.5"
                >
                  {request.status === 'APPROVED'
                    ? 'Đã phê duyệt'
                    : request.status === 'REJECTED'
                    ? 'Đã từ chối'
                    : 'Chờ xác minh'}
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-[#a0a3a7] truncate mt-0.5 flex items-center gap-2">
                <span>Mã yêu cầu: <b className="text-slate-700 dark:text-[#d0d3d7]">#REQ-{request.id}</b></span>
                <span>•</span>
                <span>Gửi lúc: {new Date(request.createdAt).toLocaleString('vi-VN')}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-[#a0a3a7] dark:hover:text-[#f0f2f5] dark:hover:bg-[#2e3033] transition-all cursor-pointer"
            aria-label="Đóng cửa sổ"
            title="Đóng cửa sổ (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* ================= 2. BODY CHIA 2 CỘT (35% - 65%) ================= */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* ----- CỘT TRÁI: THÔNG TIN HỒ SƠ (35%) ----- */}
          <div className="w-full md:w-[35%] border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-[#333537] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-[#1c1d1f] space-y-5 flex-shrink-0">
            {/* Thẻ Avatar & Họ tên */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/80 dark:bg-[#242628] border border-slate-200/60 dark:border-[#333537]">
              <Avatar
                src={request.avatarUrl}
                name={request.fullName}
                size={52}
                className="ring-2 ring-brand-500/20 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-sm text-plum-900 dark:text-[#f0f2f5] truncate">
                  {request.fullName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#a0a3a7] truncate font-mono mt-0.5">
                  {request.email || 'Chưa cung cấp email'}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                  <User className="h-3 w-3 shrink-0" />
                  <span>Cựu sinh viên FPTU</span>
                </div>
              </div>
            </div>

            {/* Nhóm 1: Người gửi & Học vấn */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-brand-500" />
                <span>Người gửi & Học vấn</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 dark:text-[#a0a3a7]">Họ và tên:</span>
                  <span className="font-bold text-plum-900 dark:text-[#f0f2f5] text-right">
                    {request.fullName}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 dark:text-[#a0a3a7]">Email tài khoản:</span>
                  <span className="font-semibold text-slate-800 dark:text-[#e0e2e5] text-right break-all">
                    {request.email || 'Chưa cung cấp'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 dark:text-[#a0a3a7]">Chuyên ngành:</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400 text-right">
                    {request.majorName
                      ? `${request.majorCode} - ${request.majorName}`
                      : request.majorCode || 'Chưa cung cấp'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 dark:text-[#a0a3a7]">Mã người dùng:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-[#c0c3c7]">
                    #USER-{request.userId}
                  </span>
                </div>
              </div>
            </div>

            {/* Nhóm 2: Thông tin xác minh */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#333537]">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
                <span>Thông tin xác minh</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 dark:text-[#a0a3a7]">Mã yêu cầu:</span>
                  <span className="font-mono font-bold text-plum-900 dark:text-[#f0f2f5]">
                    #REQ-{request.id}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 dark:text-[#a0a3a7]">Ngày gửi:</span>
                  <span className="font-semibold text-slate-800 dark:text-[#e0e2e5]">
                    {new Date(request.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 dark:text-[#a0a3a7]">Số tài liệu đính kèm:</span>
                  <span className="font-bold text-plum-900 dark:text-[#f0f2f5]">
                    {proofUrls.length || 1} tệp
                  </span>
                </div>
              </div>
            </div>

            {/* Nhóm 3: Lịch sử xử lý */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#333537]">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-brand-500" />
                <span>Lịch sử xử lý</span>
              </h4>

              {request.status === 'PENDING' ? (
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    Đang chờ thẩm định
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                    Hồ sơ đang trong hàng đợi xử lý. Quản trị viên đối chiếu minh chứng và bấm Phê duyệt hoặc Từ chối bên dưới.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#242628] border border-slate-200/60 dark:border-[#333537]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-500 dark:text-[#a0a3a7]">Người xử lý:</span>
                    <span className="font-bold text-plum-900 dark:text-[#f0f2f5]">
                      {request.reviewedBy || 'Admin hệ thống'}
                    </span>
                  </div>

                  {request.reviewedAt && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 dark:text-[#a0a3a7]">Thời gian:</span>
                      <span className="font-semibold text-slate-800 dark:text-[#e0e2e5]">
                        {new Date(request.reviewedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-[#333537]">
                    <span className="text-slate-500 dark:text-[#a0a3a7] block">Ghi chú / Nhận xét:</span>
                    <p className="font-medium text-slate-800 dark:text-[#e0e2e5] italic bg-white dark:bg-[#1c1d1f] p-2 rounded-lg border border-slate-200/60 dark:border-[#333537] leading-relaxed">
                      "{request.reviewNote || 'Không có ghi chú'}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ----- CỘT PHẢI: XEM TÀI LIỆU MINH CHỨNG (65%) ----- */}
          <div className="w-full md:w-[65%] flex flex-col overflow-hidden bg-slate-100 dark:bg-[#121314]">
            {/* Toolbar tài liệu */}
            <div className="px-4 py-2.5 sm:px-6 bg-slate-50 dark:bg-[#222426] border-b border-slate-200/80 dark:border-[#333537] flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Left: Tên tệp & Định dạng */}
              <div className="flex items-center gap-2.5 min-w-0">
                {proofFormat === 'IMAGE' ? (
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileImage className="h-4 w-4" />
                  </div>
                ) : proofFormat === 'PDF' ? (
                  <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                ) : proofFormat === 'DOCX' ? (
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FileCode className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold text-xs text-slate-800 dark:text-[#f0f2f5] truncate max-w-[180px] sm:max-w-[280px]"
                      title={fileName}
                    >
                      {fileName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black tracking-wider uppercase border bg-slate-200/80 dark:bg-[#323436] text-slate-700 dark:text-slate-300 border-slate-300/70 dark:border-slate-600">
                      {proofFormat}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs chọn tệp nếu có nhiều tệp */}
              {proofUrls.length > 1 && (
                <div className="flex items-center gap-1 bg-white dark:bg-[#1c1d1f] rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 text-xs">
                  {proofUrls.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedFileIndex(idx)
                        setZoom(100)
                        setRotation(0)
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer',
                        selectedFileIndex === idx
                          ? 'bg-brand-500 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2e3033]'
                      )}
                    >
                      Tệp {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Center/Right: Công cụ Zoom, Rotate, Mở tab mới & Tải */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Zoom Box */}
                <div className="flex items-center bg-white dark:bg-[#1c1d1f] rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50 || !currentProofUrl}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-[#2e3033] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Thu nhỏ (-)"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>

                  <span className="px-2 text-[11px] font-bold font-mono text-slate-700 dark:text-slate-200 min-w-[42px] text-center select-none">
                    {zoom}%
                  </span>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 250 || !currentProofUrl}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-[#2e3033] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Phóng to (+)"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>

                  {proofFormat === 'IMAGE' && (
                    <button
                      type="button"
                      onClick={handleRotate}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-[#2e3033] rounded-lg transition-colors border-l border-slate-100 dark:border-slate-800"
                      title="Xoay ảnh 90 độ"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetZoom}
                    disabled={zoom === 100 && rotation === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2e3033] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-l border-slate-100 dark:border-slate-800"
                    title="Đặt lại kích thước chuẩn"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>

                {/* Mở tab mới */}
                {currentProofUrl && (
                  <a
                    href={currentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-[#2e3033] rounded-xl border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center justify-center"
                    title="Mở trong tab mới"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                {/* Nút Tải tài liệu riêng biệt */}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!currentProofUrl || isDownloading}
                  onClick={handleDownloadProof}
                  className="rounded-xl font-bold bg-white dark:bg-[#1c1d1f] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2e3033] border border-slate-200 dark:border-slate-700 cursor-pointer text-xs px-3 py-1.5 transition-all flex items-center gap-1.5"
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5 text-brand-500" />
                  )}
                  <span>{isDownloading ? 'Đang tải...' : 'Tải tài liệu'}</span>
                </Button>
              </div>
            </div>

            {/* Vùng Canvas hiển thị tài liệu */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center relative">
              {/* Trường hợp không có URL tài liệu */}
              {!currentProofUrl ? (
                <div className="text-center p-8 space-y-2 bg-white dark:bg-[#1c1d1f] rounded-2xl border border-slate-200 dark:border-[#333537] shadow-sm max-w-sm">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-[#f0f2f5]">
                    Không tìm thấy tệp tài liệu
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-[#a0a3a7]">
                    Hồ sơ này chưa có đường dẫn tài liệu minh chứng hợp lệ.
                  </p>
                </div>
              ) : proofFormat === 'IMAGE' ? (
                /* === 1. IMAGE VIEWER === */
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                  <img
                    src={currentProofUrl}
                    alt="Minh chứng tốt nghiệp"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                    }}
                    className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-xl border border-slate-300/80 dark:border-slate-800 transition-transform duration-150 select-none bg-white"
                    onLoad={() => setPreviewLoading(false)}
                    onError={() => {
                      setPreviewLoading(false)
                      setPreviewError('Không thể tải hình ảnh minh chứng.')
                    }}
                  />
                </div>
              ) : proofFormat === 'PDF' ? (
                /* === 2. PDF VIEWER === */
                <div
                  className="w-full h-full flex justify-center transition-transform duration-150"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <iframe
                    src={`${currentProofUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    title="Xem trước PDF minh chứng"
                    className="w-full h-full min-h-[550px] rounded-2xl shadow-xl border border-slate-300/80 dark:border-slate-800 bg-white"
                    onLoad={() => setPreviewLoading(false)}
                    onError={() => {
                      setPreviewLoading(false)
                      setPreviewError('Trình duyệt không hỗ trợ xem trực tiếp PDF này.')
                    }}
                  />
                </div>
              ) : proofFormat === 'DOCX' ? (
                /* === 3. DOCX VIEWER === */
                <div className="w-full h-full overflow-auto flex flex-col items-center">
                  {previewLoading && (
                    <div className="my-12 flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Đang xử lý tài liệu Word (.DOCX)...
                      </span>
                    </div>
                  )}
                  {docViewerMode === 'CLIENT_DOCX' ? (
                    <div
                      ref={docxContainerRef}
                      className="docx-viewer-wrapper w-full max-w-[850px] transition-transform duration-150 py-2"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                      }}
                    />
                  ) : (
                    <iframe
                      src={docViewerMode === 'OFFICE_ONLINE' ? officeOnlineUrl : googleDocsUrl}
                      title="Office Online Viewer DOCX"
                      className="w-full h-full min-h-[550px] rounded-2xl shadow-xl border border-slate-300/80 dark:border-slate-800 bg-white"
                    />
                  )}
                </div>
              ) : (
                /* === 4. DOC VIEWER === */
                <div
                  className="w-full h-full flex justify-center transition-transform duration-150"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <iframe
                    src={officeOnlineUrl || googleDocsUrl}
                    title="Xem trước tài liệu Word DOC"
                    className="w-full h-full min-h-[550px] rounded-2xl shadow-xl border border-slate-300/80 dark:border-slate-800 bg-white"
                  />
                </div>
              )}

              {/* Error fallback alert bên trong viewer */}
              {previewError && (
                <div className="absolute inset-x-4 top-4 mx-auto max-w-lg p-4 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 rounded-2xl shadow-lg text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <span>{previewError} Bạn có thể nhấn nút <b>"Tải tài liệu"</b> để xem tệp gốc.</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setPreviewError(null)
                      if (proofFormat === 'DOCX') renderDocxFile()
                    }}
                    className="shrink-0 text-xs rounded-lg"
                  >
                    Thử lại
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= 3. INLINE ACTION FORM (KHI BẤM PHÊ DUYỆT HOẶC TỪ CHỐI) ================= */}
        {inlineAction !== 'NONE' && (
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#242628] border-t border-slate-200/80 dark:border-[#333537] animate-fade-in shrink-0">
            <form onSubmit={handleConfirmAction} className="max-w-3xl mx-auto space-y-3">
              {/* Header của Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {inlineAction === 'APPROVING' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <h4 className="font-extrabold text-sm text-plum-900 dark:text-[#f0f2f5]">
                    {inlineAction === 'APPROVING'
                      ? `Xác nhận Phê duyệt hồ sơ cựu sinh viên (${request.fullName})`
                      : `Từ chối hồ sơ xác thực của (${request.fullName})`}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInlineAction('NONE')
                    setActionError(null)
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-[#f0f2f5] cursor-pointer"
                >
                  Hủy thao tác
                </button>
              </div>

              {/* Template gợi ý lý do nhanh khi Từ chối */}
              {inlineAction === 'REJECTING' && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Gợi ý lý do từ chối nhanh:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {REJECT_REASON_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setReviewNote(tmpl)
                          setActionError(null)
                        }}
                        className="rounded-lg bg-white dark:bg-[#1c1d1f] border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 transition-colors text-left cursor-pointer"
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Textarea nhập lý do / ghi chú */}
              <div>
                <textarea
                  value={reviewNote}
                  onChange={(e) => {
                    setReviewNote(e.target.value)
                    if (actionError) setActionError(null)
                  }}
                  rows={inlineAction === 'REJECTING' ? 2 : 1}
                  placeholder={
                    inlineAction === 'REJECTING'
                      ? 'Nhập lý do chi tiết từ chối hồ sơ (Bắt buộc sau khi loại bỏ khoảng trắng)...'
                      : 'Ghi chú phê duyệt (Tùy chọn, vd: Minh chứng tốt nghiệp hợp lệ)...'
                  }
                  className={cn(
                    'w-full rounded-xl border bg-white dark:bg-[#1c1d1f] p-2.5 text-xs text-slate-800 dark:text-[#f0f2f5] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
                    actionError
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500/20'
                  )}
                />
                {actionError && (
                  <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{actionError}</span>
                  </p>
                )}
              </div>

              {/* Nút xác nhận trong form */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => {
                    setInlineAction('NONE')
                    setActionError(null)
                  }}
                  className="rounded-xl text-xs font-bold px-3.5 py-1.5"
                >
                  Hủy
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className={cn(
                    'rounded-xl text-xs font-bold px-4 py-1.5 text-white transition-all shadow-sm flex items-center gap-1.5',
                    inlineAction === 'APPROVING'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600'
                      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'
                  )}
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>
                    {inlineAction === 'APPROVING' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ================= 4. FOOTER (CỐ ĐỊNH) ================= */}
        <footer className="px-5 py-3 sm:px-6 bg-white dark:bg-[#1c1d1f] border-t border-slate-200/80 dark:border-[#333537] flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2e3033] border border-slate-200 dark:border-slate-700 px-4 py-1.5 cursor-pointer text-xs transition-all"
          >
            Đóng
          </Button>

          {/* Nhóm nút Duyệt / Từ chối (chỉ hiện khi hồ sơ đang PENDING và chưa mở form inline) */}
          {request.status === 'PENDING' && inlineAction === 'NONE' && (
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setInlineAction('REJECTING')
                  setReviewNote('')
                  setActionError(null)
                }}
                className="rounded-xl font-bold border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 px-4 py-1.5 cursor-pointer text-xs transition-all"
              >
                Từ chối
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setInlineAction('APPROVING')
                  setReviewNote('Minh chứng tốt nghiệp hợp lệ. Đã phê duyệt quyền Cựu sinh viên FPTU.')
                  setActionError(null)
                }}
                className="rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-600/20 border-none px-4 py-1.5 cursor-pointer text-xs transition-all"
              >
                Phê duyệt
              </Button>
            </div>
          )}
        </footer>
      </div>
    </div>,
    document.body
  )
}
