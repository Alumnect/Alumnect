import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  RefreshCw,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react'
import { Badge, Skeleton, toast } from '@/components/ui'
import { useAdminMentorCv } from '../hooks/useAdmin'
import { renderAsync } from 'docx-preview'

interface AdminMentorCvModalProps {
  isOpen: boolean
  onClose: () => void
  mentorProfileId: number | null
  mentorNameFallback?: string
}

type CvFormatType = 'PDF' | 'DOCX' | 'DOC' | 'UNKNOWN'
type DocViewerMode = 'CLIENT_DOCX' | 'OFFICE_ONLINE' | 'GOOGLE_DOCS'

export function AdminMentorCvModal({
  isOpen,
  onClose,
  mentorProfileId,
  mentorNameFallback,
}: AdminMentorCvModalProps) {
  // Lấy dữ liệu CV từ API
  const { data: cvData, isLoading, isError, error, refetch } = useAdminMentorCv(mentorProfileId)

  // Document Viewer States
  const [zoom, setZoom] = useState<number>(100)
  const [previewLoading, setPreviewLoading] = useState<boolean>(true)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [docViewerMode, setDocViewerMode] = useState<DocViewerMode>('CLIENT_DOCX')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)

  // Ref container cho docx-preview
  const docxContainerRef = useRef<HTMLDivElement>(null)

  const cvUrl = cvData?.cvUrl || cvData?.cvFileKey

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

  const fileExt = getFileExtension(cvUrl)

  const cvFormat: CvFormatType = (() => {
    if (fileExt === 'pdf') return 'PDF'
    if (fileExt === 'docx') return 'DOCX'
    if (fileExt === 'doc') return 'DOC'
    if (cvUrl?.toLowerCase().includes('.pdf')) return 'PDF'
    if (cvUrl?.toLowerCase().includes('.docx')) return 'DOCX'
    if (cvUrl?.toLowerCase().includes('.doc')) return 'DOC'
    return 'PDF'
  })()

  const fileName = (() => {
    if (!cvUrl) return 'CV_Mentor.pdf'
    try {
      const cleanUrl = cvUrl.split('?')[0]
      const rawName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1)
      if (rawName && rawName.trim().length > 0) {
        return decodeURIComponent(rawName)
      }
    } catch {
      // fallback
    }
    const ext = fileExt || (cvFormat === 'DOCX' ? 'docx' : cvFormat === 'DOC' ? 'doc' : 'pdf')
    const safeName = (cvData?.mentorName || mentorNameFallback || 'Mentor').replace(/\s+/g, '_')
    return `CV_${safeName}.${ext}`
  })()

  // Reset zoom và preview state khi mở modal hoặc thay đổi mentor
  useEffect(() => {
    if (isOpen) {
      setZoom(100)
      setPreviewLoading(true)
      setPreviewError(null)
      setDocViewerMode(cvFormat === 'DOCX' ? 'CLIENT_DOCX' : 'OFFICE_ONLINE')
    }
  }, [isOpen, mentorProfileId, cvUrl, cvFormat])

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
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Render DOCX trực tiếp bằng docx-preview
  const renderDocxFile = useCallback(async () => {
    if (!cvUrl || !docxContainerRef.current) return
    setPreviewLoading(true)
    setPreviewError(null)

    try {
      docxContainerRef.current.innerHTML = ''
      const res = await fetch(cvUrl)
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
  }, [cvUrl])

  useEffect(() => {
    if (isOpen && cvFormat === 'DOCX' && docViewerMode === 'CLIENT_DOCX' && cvUrl) {
      renderDocxFile()
    }
  }, [isOpen, cvFormat, docViewerMode, cvUrl, renderDocxFile])

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60))
  const handleResetZoom = () => setZoom(100)

  // Xử lý tải file gốc
  const handleDownloadCv = async () => {
    if (!cvUrl) {
      toast.error('Không tìm thấy đường dẫn tệp CV hợp lệ')
      return
    }

    try {
      setIsDownloading(true)
      const res = await fetch(cvUrl)
      if (!res.ok) {
        throw new Error('Lỗi khi tải tệp từ máy chủ lưu trữ')
      }
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
      a.href = cvUrl
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

  if (!isOpen) return null

  // URL nhúng cho trình xem ngoài
  const officeOnlineUrl = cvUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(cvUrl)}`
    : ''
  const googleDocsUrl = cvUrl
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(cvUrl)}&embedded=true`
    : ''

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 transition-opacity"
        onClick={onClose}
      />

      {/* Main Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[1200px] w-[92vw] h-[90vh] max-h-[90vh] bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
                CV Cố vấn
              </h2>
              {cvData?.mentorStatus && (
                <Badge
                  tone={cvData.mentorStatus === 'ACTIVE' ? 'success' : 'gold'}
                  className="text-[11px] font-medium px-2 py-0.5"
                >
                  {cvData.mentorStatus === 'ACTIVE' ? 'Đang hoạt động' : cvData.mentorStatus}
                </Badge>
              )}
            </div>
            <p className="text-[13px] text-slate-500 mt-0.5 truncate">
              {cvData?.mentorName || mentorNameFallback || 'Cố vấn'}
              {cvData?.mentorEmail && ` · ${cvData.mentorEmail}`}
              {cvData?.currentPosition && ` · ${cvData.currentPosition}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </header>

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* File format indicator & name */}
          <div className="flex items-center gap-2 min-w-0">
            {cvFormat === 'PDF' ? (
              <FileText className="h-4 w-4 text-red-500 shrink-0" />
            ) : cvFormat === 'DOCX' ? (
              <FileCode className="h-4 w-4 text-blue-500 shrink-0" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-indigo-500 shrink-0" />
            )}
            <span className="font-medium text-xs text-slate-800 truncate max-w-[240px] sm:max-w-md">
              {fileName}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase bg-slate-200 text-slate-700">
              {cvFormat}
            </span>
          </div>

          {/* Controls: Zoom, View Switcher & Actions */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 60 || !cvUrl}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <span className="px-2 text-[11px] font-mono font-medium text-slate-700 min-w-[42px] text-center select-none">
                {zoom}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 200 || !cvUrl}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                title="Phóng to"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                disabled={zoom === 100 || !cvUrl}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors border-l border-slate-100"
                title="Đặt lại 100%"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            {/* Switcher cho DOCX */}
            {(cvFormat === 'DOCX' || cvFormat === 'DOC') && (
              <div className="hidden sm:flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5 text-[11px]">
                {cvFormat === 'DOCX' && (
                  <button
                    type="button"
                    onClick={() => setDocViewerMode('CLIENT_DOCX')}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                      docViewerMode === 'CLIENT_DOCX'
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Xem trực tiếp
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDocViewerMode('OFFICE_ONLINE')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    docViewerMode === 'OFFICE_ONLINE'
                      ? 'bg-slate-900 text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Office Online
                </button>
                <button
                  type="button"
                  onClick={() => setDocViewerMode('GOOGLE_DOCS')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    docViewerMode === 'GOOGLE_DOCS'
                      ? 'bg-slate-900 text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Google Viewer
                </button>
              </div>
            )}

            {/* Mở tab mới */}
            {cvUrl && (
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors inline-flex items-center"
                title="Mở tab mới"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            {/* Nút Tải CV */}
            <button
              type="button"
              disabled={!cvUrl || isLoading || isDownloading}
              onClick={handleDownloadCv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#F27024] hover:bg-[#d95d16] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
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
        <div className="flex-1 overflow-auto bg-slate-100 p-4 relative flex flex-col items-center">
          {/* Loading State */}
          {isLoading && (
            <div className="w-full max-w-md my-auto p-6 bg-white rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
              <Loader2 className="h-7 w-7 text-[#F27024] animate-spin mx-auto" />
              <h4 className="font-semibold text-sm text-slate-800">
                Đang tải hồ sơ CV Cố vấn...
              </h4>
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-3/4 mx-auto" />
                <Skeleton className="h-3.5 w-1/2 mx-auto" />
              </div>
            </div>
          )}

          {/* Error State */}
          {(isError || (!isLoading && !cvUrl)) && (
            <div className="w-full max-w-md my-auto p-6 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
              <h4 className="font-semibold text-sm text-slate-900">
                Không thể tải tệp CV của Cố vấn
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {(error as any)?.message ||
                  'Cố vấn này hiện chưa cập nhật hoặc chưa có tệp CV trong hệ thống.'}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Thử lại
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          {/* Viewer Canvas when CV URL is loaded */}
          {!isLoading && cvUrl && (
            <div className="w-full h-full flex flex-col items-center">
              {/* PDF Viewer */}
              {cvFormat === 'PDF' && (
                <div
                  className="w-full h-full flex justify-center transition-transform duration-150"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <iframe
                    src={`${cvUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${zoom}`}
                    title="Xem trước CV PDF"
                    className="w-full h-full min-h-[560px] rounded-lg shadow-sm border border-slate-300 bg-white"
                    onLoad={() => setPreviewLoading(false)}
                    onError={() => {
                      setPreviewLoading(false)
                      setPreviewError('Trình duyệt không hỗ trợ xem trực tiếp PDF này.')
                    }}
                  />
                </div>
              )}

              {/* DOCX Viewer */}
              {cvFormat === 'DOCX' && (
                <>
                  {docViewerMode === 'CLIENT_DOCX' ? (
                    <div className="w-full h-full overflow-auto flex flex-col items-center">
                      {previewLoading && (
                        <div className="my-12 flex flex-col items-center gap-2">
                          <Loader2 className="h-7 w-7 text-[#F27024] animate-spin" />
                          <span className="text-xs font-medium text-slate-600">
                            Đang xử lý nội dung Word (.DOCX)...
                          </span>
                        </div>
                      )}
                      <div
                        ref={docxContainerRef}
                        className="docx-viewer-wrapper w-full max-w-[850px] transition-transform duration-150 py-2"
                        style={{
                          transform: `scale(${zoom / 100})`,
                          transformOrigin: 'top center',
                        }}
                      />
                    </div>
                  ) : docViewerMode === 'OFFICE_ONLINE' ? (
                    <div
                      className="w-full h-full flex justify-center transition-transform duration-150"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                      }}
                    >
                      <iframe
                        src={officeOnlineUrl}
                        title="Office Online Viewer DOCX"
                        className="w-full h-full min-h-[560px] rounded-lg shadow-sm border border-slate-300 bg-white"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex justify-center transition-transform duration-150"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                      }}
                    >
                      <iframe
                        src={googleDocsUrl}
                        title="Google Docs Viewer DOCX"
                        className="w-full h-full min-h-[560px] rounded-lg shadow-sm border border-slate-300 bg-white"
                      />
                    </div>
                  )}
                </>
              )}

              {/* DOC Viewer */}
              {cvFormat === 'DOC' && (
                <div
                  className="w-full h-full flex justify-center transition-transform duration-150"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <iframe
                    src={docViewerMode === 'GOOGLE_DOCS' ? googleDocsUrl : officeOnlineUrl}
                    title="Xem trước tài liệu Word DOC"
                    className="w-full h-full min-h-[560px] rounded-lg shadow-sm border border-slate-300 bg-white"
                  />
                </div>
              )}

              {/* Preview error fallback notice */}
              {previewError && (
                <div className="absolute inset-x-4 top-4 mx-auto max-w-lg p-3 bg-amber-50 border border-amber-200 rounded-lg shadow-sm text-xs text-amber-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{previewError} Hãy nhấn nút "Tải CV" để xem tệp gốc.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewError(null)
                      if (cvFormat === 'DOCX') renderDocxFile()
                    }}
                    className="px-2 py-1 rounded bg-white border border-amber-300 text-xs font-medium cursor-pointer"
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Bản xem trước tệp tài liệu phục vụ quản trị và kiểm duyệt hồ sơ.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>,
    document.body
  )
}
