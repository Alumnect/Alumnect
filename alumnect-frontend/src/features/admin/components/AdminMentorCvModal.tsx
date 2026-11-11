import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  FileText,
  ExternalLink,
  Download,
  AlertCircle,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  FileCode,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles,
  Printer,
  FileCheck,
} from 'lucide-react'
import { Badge, Skeleton, toast, DialogFrame } from '@/components/ui'
import { useAdminMentorCv } from '../hooks/useAdmin'
import { renderAsync } from 'docx-preview'
import { DEMO_MENTORS } from './AdminMentorListSection'
import { cn } from '@/lib/utils'

interface AdminMentorCvModalProps {
  isOpen: boolean
  onClose: () => void
  mentorProfileId: number | null
  mentorNameFallback?: string
}

type CvFormatType = 'PDF' | 'DOCX' | 'DOC' | 'DIGITAL'
type DocViewerMode = 'DIGITAL_CV' | 'ORIGINAL_FILE' | 'CLIENT_DOCX' | 'OFFICE_ONLINE' | 'GOOGLE_DOCS'

export function AdminMentorCvModal({
  isOpen,
  onClose,
  mentorProfileId,
  mentorNameFallback,
}: AdminMentorCvModalProps) {
  // Lấy dữ liệu CV từ API
  const { data: cvData, isLoading } = useAdminMentorCv(mentorProfileId)

  // Fallback lấy mentor từ bộ dữ liệu mẫu khi backend chưa có hoặc offline
  const fallbackMentor = useMemo(() => {
    return DEMO_MENTORS.find((m) => m.mentorProfileId === mentorProfileId) || null
  }, [mentorProfileId])

  const activeMentor = cvData || fallbackMentor

  // Document Viewer States
  const [zoom, setZoom] = useState<number>(100)
  const [previewLoading, setPreviewLoading] = useState<boolean>(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [docViewerMode, setDocViewerMode] = useState<DocViewerMode>('DIGITAL_CV')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)

  // Ref container cho docx-preview
  const docxContainerRef = useRef<HTMLDivElement>(null)

  // Đường dẫn tệp CV thực tế từ backend
  const rawCvUrl = cvData?.cvUrl || cvData?.cvFileKey
  const effectiveCvUrl = rawCvUrl && !rawCvUrl.includes('alumnect.edu.vn') ? rawCvUrl : null

  // Trích xuất định dạng và tên file
  const getFileExtension = (url?: string | null): string => {
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

  const fileExt = getFileExtension(rawCvUrl)

  const cvFormat: CvFormatType = (() => {
    if (fileExt === 'pdf' || effectiveCvUrl?.toLowerCase().includes('.pdf')) return 'PDF'
    if (fileExt === 'docx' || effectiveCvUrl?.toLowerCase().includes('.docx')) return 'DOCX'
    if (fileExt === 'doc' || effectiveCvUrl?.toLowerCase().includes('.doc')) return 'DOC'
    return 'PDF'
  })()

  const safeMentorName = activeMentor?.mentorName || mentorNameFallback || 'Mentor'
  const fileName = `CV_${safeMentorName.replace(/\s+/g, '_')}.${cvFormat === 'DOCX' ? 'docx' : 'pdf'}`

  // Reset zoom và preview state khi mở modal hoặc thay đổi mentor
  useEffect(() => {
    if (isOpen) {
      setZoom(100)
      setPreviewLoading(false)
      setPreviewError(null)
      setDocViewerMode('DIGITAL_CV')
    }
  }, [isOpen, mentorProfileId])

  // Khóa cuộn trang khi modal mở & xử lý phím Escape
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, onClose])

  // Render DOCX trực tiếp bằng docx-preview
  const renderDocxFile = useCallback(async () => {
    if (!effectiveCvUrl || !docxContainerRef.current) return
    setPreviewLoading(true)
    setPreviewError(null)

    try {
      docxContainerRef.current.innerHTML = ''
      const res = await fetch(effectiveCvUrl)
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
  }, [effectiveCvUrl])

  useEffect(() => {
    if (isOpen && cvFormat === 'DOCX' && docViewerMode === 'CLIENT_DOCX' && effectiveCvUrl) {
      renderDocxFile()
    }
  }, [isOpen, cvFormat, docViewerMode, effectiveCvUrl, renderDocxFile])

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 180))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60))
  const handleResetZoom = () => setZoom(100)

  // In hồ sơ CV
  const handlePrint = () => {
    window.print()
  }

  // Xử lý tải / lưu CV
  const handleDownloadCv = async () => {
    if (effectiveCvUrl) {
      try {
        setIsDownloading(true)
        const res = await fetch(effectiveCvUrl)
        if (res.ok) {
          const blob = await res.blob()
          const blobUrl = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(blobUrl)
          toast.success(`Đã tải xuống tệp: ${fileName}`)
        } else {
          const a = document.createElement('a')
          a.href = effectiveCvUrl
          a.download = fileName
          a.target = '_blank'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          toast.success(`Đã tải xuống tệp: ${fileName}`)
        }
      } catch {
        const a = document.createElement('a')
        a.href = effectiveCvUrl
        a.download = fileName
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast.success(`Đã tải xuống tệp: ${fileName}`)
      } finally {
        setIsDownloading(false)
      }
    } else {
      window.print()
      toast.info('Đã mở hộp thoại in / lưu PDF hồ sơ Cố vấn')
    }
  }

  if (!isOpen) return null

  return (
    <DialogFrame
      onClose={onClose}
      zIndexClassName="z-50"
      maxWidthClassName="max-w-[1100px]"
      className="z-10 w-[94vw] h-[92vh] flex flex-col overflow-hidden bg-surface"
    >
      {/* Header */}
      <header className="px-6 py-4 bg-surface border-b border-border flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary-solid shadow-2xs">
              <FileCheck size={18} />
            </span>
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white leading-tight">
              Hồ sơ CV Cố vấn (Curriculum Vitae)
            </h2>
            {activeMentor?.mentorStatus && (
              <Badge
                tone={activeMentor.mentorStatus === 'ACTIVE' ? 'success' : 'gold'}
                className="text-xs font-bold px-2 py-0.5"
              >
                {activeMentor.mentorStatus === 'ACTIVE' ? 'Đang hoạt động' : activeMentor.mentorStatus}
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-subtle mt-0.5 truncate">
            {safeMentorName}
            {activeMentor?.mentorEmail && ` · ${activeMentor.mentorEmail}`}
            {activeMentor?.currentPosition && ` · ${activeMentor.currentPosition}`}
            {activeMentor?.currentCompany && ` @ ${activeMentor.currentCompany}`}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-text-subtle hover:text-text hover:bg-surface-2 rounded-xl transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>
      </header>

      {/* Action Toolbar */}
      <div className="px-6 py-2.5 bg-surface-2/60 border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Switcher: Hồ sơ số vs Tệp PDF gốc */}
        {effectiveCvUrl ? (
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setDocViewerMode('DIGITAL_CV')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer select-none',
                docViewerMode === 'DIGITAL_CV'
                  ? 'bg-primary-solid text-on-primary shadow-2xs font-extrabold'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              <FileText size={13} />
              <span>Hồ sơ CV số (Digital CV)</span>
            </button>

            <button
              type="button"
              onClick={() => setDocViewerMode('ORIGINAL_FILE')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer select-none',
                docViewerMode === 'ORIGINAL_FILE'
                  ? 'bg-primary-solid text-on-primary shadow-2xs font-extrabold'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              <FileCode size={13} />
              <span>Tệp tài liệu gốc ({cvFormat})</span>
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text-muted shadow-2xs">
            <FileText size={13} className="text-primary-solid" />
            <span>Hồ sơ CV số (Digital CV)</span>
          </div>
        )}

        {/* Controls: Zoom, Print & Download */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-surface rounded-xl border border-border p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 60}
              className="p-1.5 text-text-subtle hover:text-text hover:bg-surface-2 rounded-lg disabled:opacity-30 transition cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            <span className="px-2 text-xs font-mono font-bold text-text-muted min-w-[42px] text-center select-none">
              {zoom}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 180}
              className="p-1.5 text-text-subtle hover:text-text hover:bg-surface-2 rounded-lg disabled:opacity-30 transition cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              disabled={zoom === 100}
              className="p-1.5 text-text-subtle hover:text-text hover:bg-surface-2 rounded-lg disabled:opacity-30 transition border-l border-border cursor-pointer"
              title="Đặt lại 100%"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>

          {/* In ấn */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 text-text-subtle hover:text-text hover:bg-surface rounded-xl border border-border bg-surface transition cursor-pointer shadow-2xs"
            title="In tài liệu"
          >
            <Printer size={14} />
          </button>

          {/* Mở tab mới */}
          {effectiveCvUrl && (
            <a
              href={effectiveCvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-text-subtle hover:text-text hover:bg-surface rounded-xl border border-border bg-surface transition cursor-pointer shadow-2xs inline-flex items-center"
              title="Mở tệp trong tab mới"
            >
              <ExternalLink size={14} />
            </a>
          )}

          {/* Nút Tải CV */}
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownloadCv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-on-primary bg-primary-solid hover:bg-primary-solid/90 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-raised"
          >
            {isDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>{isDownloading ? 'Đang tải...' : 'Tải CV'}</span>
          </button>
        </div>
      </div>

      {/* Document Viewer Canvas */}
      <div className="flex-1 overflow-auto bg-surface-2 p-6 flex flex-col items-center justify-start relative">
        {/* Loading State */}
        {isLoading && !activeMentor && (
          <div className="w-full max-w-md my-auto p-6 bg-surface rounded-2xl border border-border shadow-xs text-center space-y-3">
            <Loader2 className="h-7 w-7 text-primary-solid animate-spin mx-auto" />
            <h4 className="font-extrabold text-sm text-text">
              Đang tải hồ sơ CV Cố vấn...
            </h4>
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-3.5 w-3/4 mx-auto bg-primary-soft" />
              <Skeleton className="h-3.5 w-1/2 mx-auto bg-primary-soft" />
            </div>
          </div>
        )}

        {/* CHẾ ĐỘ 1: BẢN HỒ SƠ CV SỐ (A4 Styled Digital Resume Sheet) */}
        {docViewerMode === 'DIGITAL_CV' && activeMentor && (
          <div
            className="w-full max-w-[800px] transition-transform duration-150 origin-top pb-8"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Sheet Card giấy A4 */}
            <div className="rounded-2xl border border-border bg-surface p-8 sm:p-10 shadow-xl space-y-6 text-text">
              {/* Top Resume Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-border pb-6">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-extrabold bg-primary-soft text-primary-solid border border-primary-soft-border">
                    <GraduationCap size={13} />
                    <span>CỰU SINH VIÊN ĐẠI HỌC FPT</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                    {safeMentorName}
                  </h1>
                  <p className="text-sm font-bold text-primary-solid">
                    {activeMentor.currentPosition || 'Chuyên gia Cố vấn'} @ {activeMentor.currentCompany || 'AlumNect Network'}
                  </p>
                  <p className="text-xs text-text-subtle font-medium">
                    Email: <span className="text-text font-bold">{activeMentor.mentorEmail}</span>
                  </p>
                </div>

                {activeMentor.avatarUrl && (
                  <img
                    src={activeMentor.avatarUrl}
                    alt={safeMentorName}
                    className="h-24 w-24 rounded-2xl object-cover border-2 border-primary-soft-border shadow-md shrink-0 self-start"
                  />
                )}
              </div>

              {/* Tóm tắt chuyên môn */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary-solid flex items-center gap-1.5">
                  <Sparkles size={14} /> 1. Tóm tắt chuyên môn & Kinh nghiệm
                </h3>
                <p className="text-xs text-text-muted leading-relaxed font-medium bg-surface-2/60 p-4 rounded-xl border border-border/60">
                  {activeMentor.bio ||
                    'Chuyên gia cố vấn với nhiều năm kinh nghiệm thực chiến trong ngành công nghệ và phát triển sản phẩm. Nhiệt tình hướng dẫn, chia sẻ định hướng sự nghiệp, xây dựng đồ án tốt nghiệp và luyện phỏng vấn tuyển dụng cho sinh viên FPTU.'}
                </p>
              </div>

              {/* Kinh nghiệm làm việc & Dự án */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary-solid flex items-center gap-1.5">
                  <Briefcase size={14} /> 2. Kinh nghiệm công tác tiêu biểu
                </h3>
                <div className="space-y-3">
                  <div className="border-l-2 border-primary-solid pl-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs flex-wrap">
                      <span className="font-extrabold text-text">
                        {activeMentor.currentPosition || 'Senior Engineer / Specialist'}
                      </span>
                      <span className="text-[11px] font-bold text-text-subtle font-mono">
                        2022 — Hiện tại
                      </span>
                    </div>
                    <p className="text-xs font-bold text-primary-solid">
                      {activeMentor.currentCompany || 'Tập đoàn Công nghệ'}
                    </p>
                    <ul className="list-disc list-inside text-xs text-text-muted space-y-1 font-medium pt-1">
                      <li>Chịu trách nhiệm kiến trúc hệ thống, lãnh đạo đội ngũ kỹ thuật và tối ưu hóa giải pháp vận hành.</li>
                      <li>Trực tiếp kèm cặp sinh viên thực tập và thành viên mới, xây dựng văn hóa chia sẻ tri thức.</li>
                    </ul>
                  </div>

                  <div className="border-l-2 border-border pl-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs flex-wrap">
                      <span className="font-extrabold text-text">
                        Software Engineer / Project Lead
                      </span>
                      <span className="text-[11px] font-bold text-text-subtle font-mono">
                        2019 — 2022
                      </span>
                    </div>
                    <p className="text-xs font-bold text-text-muted">
                      FPT Software / Technology Partner
                    </p>
                    <ul className="list-disc list-inside text-xs text-text-muted space-y-1 font-medium pt-1">
                      <li>Tham gia phát triển các sản phẩm quy mô lớn cho khách hàng quốc tế.</li>
                      <li>Áp dụng quy trình Agile/Scrum và chuẩn chất lượng phần mềm hiện đại.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Học vấn & Nền tảng */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary-solid flex items-center gap-1.5">
                  <GraduationCap size={14} /> 3. Học vấn & Xuất thân
                </h3>
                <div className="p-3.5 rounded-xl border border-border bg-surface-2/40 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold text-text">Trường Đại học FPT (FPT University)</p>
                    <p className="text-xs text-text-subtle mt-0.5">Cử nhân Kỹ thuật Phần mềm / Công nghệ Thông tin</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-extrabold shadow-2xs shrink-0">
                    Tốt nghiệp loại Giỏi
                  </span>
                </div>
              </div>

              {/* Lĩnh vực chuyên môn & Chủ đề Mentoring */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text">Lĩnh vực hỗ trợ chuyên môn:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeMentor.supportedFields && activeMentor.supportedFields.length > 0
                      ? activeMentor.supportedFields
                      : ['Kỹ thuật phần mềm', 'Kiến trúc hệ thống', 'Cloud Computing', 'Phỏng vấn Tech']
                    ).map((field, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-surface-2 text-text font-bold border border-border text-xs shadow-2xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text">Chủ đề cố vấn chuyên sâu:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeMentor.topics && activeMentor.topics.length > 0
                      ? activeMentor.topics
                      : ['System Design chuẩn doanh nghiệp', 'Luyện thuật toán', 'Định hướng nghề nghiệp IT']
                    ).map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-primary-soft text-primary-solid border border-primary-soft-border text-xs font-bold shadow-2xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cam kết & Chỉ số uy tín */}
              <div className="pt-4 border-t border-border flex items-center justify-between text-xs flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-extrabold text-xs shadow-2xs">
                    <Award size={13} className="text-amber-500" /> Điểm uy tín: {activeMentor.reputationScore ?? 0} đ
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-extrabold text-xs shadow-2xs">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Hoàn thành: {activeMentor.completedTasks ?? 0} task
                  </span>
                </div>

                <div className="text-[11px] text-text-subtle font-medium">
                  Xác thực danh tính bởi <strong className="text-text">AlumNect FPTU Admin</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHẾ ĐỘ 2: TỆP TÀI LIỆU GỐC (PDF Embed / DOCX Viewer) */}
        {docViewerMode === 'ORIGINAL_FILE' && (
          <div
            className="w-full h-full flex justify-center transition-transform duration-150"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              src={`${effectiveCvUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${zoom}`}
              title="Xem trước CV PDF"
              className="w-full h-full min-h-[580px] rounded-2xl shadow-md border border-border bg-surface"
              onLoad={() => setPreviewLoading(false)}
              onError={() => {
                setPreviewLoading(false)
                setPreviewError('Trình duyệt không hỗ trợ xem trực tiếp PDF này.')
              }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-6 py-3 bg-surface border-t border-border flex items-center justify-between text-xs text-text-subtle shrink-0">
        <div>
          Bản xem trước tệp tài liệu phục vụ quản trị và kiểm duyệt hồ sơ Cố vấn AlumNect.
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text bg-surface border border-border hover:bg-surface-2 rounded-xl transition cursor-pointer"
        >
          Đóng
        </button>
      </footer>
    </DialogFrame>
  )
}
