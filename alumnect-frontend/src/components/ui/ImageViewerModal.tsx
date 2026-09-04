import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2,
  RefreshCw
} from 'lucide-react'

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt?: string
  fileName?: string
  senderName?: string
  senderAvatar?: string
  time?: string
}

export function ImageViewerModal({
  isOpen,
  onClose,
  src,
  alt = 'Hình ảnh',
  fileName,
  senderName,
  senderAvatar,
  time,
}: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  // Reset trạng thái hiển thị khi mở ảnh mới
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setPan({ x: 0, y: 0 })
    }
  }, [isOpen, src])

  // Phóng to / Thu nhỏ
  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setZoom((prev) => Math.min(prev + 0.3, 3.5))
  }

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setZoom((prev) => {
      const next = Math.max(prev - 0.3, 0.6)
      if (next <= 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  // Xoay ảnh 90 độ
  const handleRotate = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setRotation((prev) => (prev + 90) % 360)
  }

  // Khôi phục kích thước ban đầu
  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setZoom(1)
    setRotation(0)
    setPan({ x: 0, y: 0 })
  }

  // Double click để toggle zoom 1.8x
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (zoom > 1.1) {
      handleReset()
    } else {
      setZoom(1.8)
    }
  }

  // Lăn chuột để zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 0.15, 3.5))
    } else {
      setZoom((prev) => {
        const next = Math.max(prev - 0.15, 0.6)
        if (next <= 1) setPan({ x: 0, y: 0 })
        return next
      })
    }
  }

  // Kéo chuột để di chuyển ảnh khi đang phóng to
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Phím tắt bàn phím
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        setZoom((prev) => Math.min(prev + 0.25, 3.5))
      } else if (e.key === '-' || e.key === '_') {
        setZoom((prev) => {
          const next = Math.max(prev - 0.25, 0.6)
          if (next <= 1) setPan({ x: 0, y: 0 })
          return next
        })
      } else if (e.key === 'r' || e.key === 'R') {
        setRotation((prev) => (prev + 90) % 360)
      } else if (e.key === '0') {
        setZoom(1)
        setRotation(0)
        setPan({ x: 0, y: 0 })
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return

    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, handleKeyDown])

  // Tải ảnh về máy
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName || `image-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(src, '_blank')
    }
  }

  if (!isOpen || !src) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="fixed inset-0 z-[999999] flex select-none items-center justify-center bg-black/92 backdrop-blur-sm"
      >
        {/* --- HEADER CHUẨN FACEBOOK MESSENGER --- */}
        <div
          className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Thông tin người gửi / Tên ảnh bên trái */}
          <div className="flex items-center gap-3">
            {senderAvatar ? (
              <img
                src={senderAvatar}
                alt={senderName || ''}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : null}
            <div className="flex flex-col">
              {senderName ? (
                <span className="text-sm font-semibold text-white drop-shadow-sm">
                  {senderName}
                </span>
              ) : fileName ? (
                <span className="max-w-xs truncate text-sm font-semibold text-white/90 drop-shadow-sm">
                  {fileName}
                </span>
              ) : null}
              {time ? (
                <span className="text-xs text-white/60 drop-shadow-sm">{time}</span>
              ) : null}
            </div>
          </div>

          {/* Nút Đóng (X) tròn đặc trưng của Messenger ở góc trên bên phải */}
          <button
            type="button"
            onClick={onClose}
            title="Đóng (Esc)"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#242526] text-white/90 shadow-md border border-white/10 transition-all hover:bg-[#3a3b3c] hover:text-white hover:scale-105 active:scale-95"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* --- KHU VỰC HIỂN THỊ ẢNH CHÍNH --- */}
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="inline-block max-h-[86vh] max-w-[90vw] select-none"
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="max-h-[84vh] max-w-[88vw] rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
            />
          </motion.div>
        </div>

        {/* --- THANH ĐIỀU KHIỂN DOCK NỔI PHÍA DƯỚI (FLOATING TOOLBAR GIỐNG MESSENGER) --- */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full bg-[#242526]/95 border border-white/15 px-3 py-1.5 shadow-2xl backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Thu nhỏ */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.6}
            title="Thu nhỏ (-)"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ZoomOut size={17} />
          </button>

          {/* Hiển thị tỉ lệ Zoom & Reset */}
          <button
            type="button"
            onClick={handleReset}
            title="Khôi phục kích thước chuẩn"
            className="min-w-[50px] px-1.5 py-1 text-center text-xs font-semibold text-white/90 hover:bg-white/10 rounded-lg transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Phóng to */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 3.5}
            title="Phóng to (+)"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ZoomIn size={17} />
          </button>

          <div className="mx-1 h-4 w-px bg-white/20" />

          {/* Xoay ảnh 90 độ */}
          <button
            type="button"
            onClick={handleRotate}
            title="Xoay ảnh 90° (R)"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <RotateCw size={17} />
          </button>

          {/* Tải xuống */}
          <button
            type="button"
            onClick={handleDownload}
            title="Tải ảnh về máy"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <Download size={17} />
          </button>

          {/* Mở tab mới */}
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            title="Mở ảnh gốc trong tab mới"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <ExternalLink size={17} />
          </a>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
