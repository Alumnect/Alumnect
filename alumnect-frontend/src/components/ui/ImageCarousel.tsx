/**
 * ImageCarousel — hiệu năng cao:
 *  - Drag thao tác DOM trực tiếp qua ref → KHÔNG re-render React trong khi kéo
 *  - Blur background tĩnh (chỉ đổi khi chuyển ảnh, không di chuyển cùng track)
 *  - GPU-accelerated: translate3d + will-change: transform
 *  - Kéo chuột / vuốt tay chuyển ảnh
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageCarouselProps {
  images: string[]
  height?: number
  className?: string
  altPrefix?: string
}

export function ImageCarousel({
  images,
  height = 460,
  className,
  altPrefix = 'Ảnh',
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number | null>(null)
  const currentRef = useRef(current)
  const imagesLen = useRef(images.length)
  const DRAG_THRESHOLD = 40

  // Giữ ref đồng bộ với state
  useEffect(() => {
    currentRef.current = current
    imagesLen.current = images.length
  })

  useEffect(() => {
    setCurrent(0)
  }, [images])

  if (!images || images.length === 0) return null

  // Áp transform trực tiếp lên DOM — không qua state
  const applyTransform = useCallback((idx: number, extraPx = 0, animate = true) => {
    if (!trackRef.current) return
    trackRef.current.style.transition = animate
      ? 'transform 0.28s cubic-bezier(0.4,0,0.2,1)'
      : 'none'
    const containerW = trackRef.current.parentElement?.offsetWidth ?? 560
    const base = -(idx * containerW)
    trackRef.current.style.transform = `translate3d(${base + extraPx}px, 0, 0)`
  }, [])

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(imagesLen.current - 1, idx))
      setCurrent(clamped)
      applyTransform(clamped, 0, true)
    },
    [applyTransform],
  )
  const prev = useCallback(() => goTo(currentRef.current - 1), [goTo])
  const next = useCallback(() => goTo(currentRef.current + 1), [goTo])

  // ── Mouse drag — KHÔNG gọi setState trong onMove ──────────
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragStartX.current = e.clientX

      const onMove = (me: MouseEvent) => {
        if (dragStartX.current === null) return
        const dx = me.clientX - dragStartX.current
        // Giới hạn: không kéo quá ảnh đầu/cuối
        const c = currentRef.current
        const isFirst = c === 0 && dx > 0
        const isLast  = c === imagesLen.current - 1 && dx < 0
        const resistDx = isFirst || isLast ? dx * 0.2 : dx
        // Thao tác DOM trực tiếp — không setState
        applyTransform(c, resistDx, false)
        if (trackRef.current) {
          trackRef.current.style.cursor = 'grabbing'
        }
      }

      const onUp = (me: MouseEvent) => {
        if (dragStartX.current !== null) {
          const dx = me.clientX - dragStartX.current
          const c = currentRef.current
          if (Math.abs(dx) > DRAG_THRESHOLD) {
            if (dx < 0) goTo(c + 1)
            else goTo(c - 1)
          } else {
            // Bounce back
            applyTransform(c, 0, true)
          }
        }
        if (trackRef.current) {
          trackRef.current.style.cursor = 'grab'
        }
        dragStartX.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [applyTransform, goTo],
  )

  // ── Touch swipe ─────────────────────────────────────────
  const touchStartX = useRef<number | null>(null)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return
      const dx = e.touches[0].clientX - touchStartX.current
      applyTransform(currentRef.current, dx, false)
    },
    [applyTransform],
  )
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      if (Math.abs(dx) > DRAG_THRESHOLD) {
        if (dx < 0) goTo(currentRef.current + 1)
        else goTo(currentRef.current - 1)
      } else {
        applyTransform(currentRef.current, 0, true)
      }
      touchStartX.current = null
    },
    [applyTransform, goTo],
  )

  return (
    <div
      className={cn('relative w-full overflow-hidden select-none group', className)}
      style={{ height }}
    >
      {/* Blur background tĩnh — chỉ đổi khi current thay đổi, KHÔNG chạy cùng track */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={images[current]}
          aria-hidden
          draggable={false}
          className="h-full w-full object-cover"
          style={{
            filter: 'blur(24px) brightness(0.72) saturate(1.2)',
            transform: 'scale(1.12)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
        <div className="absolute inset-0 bg-white/12" />
      </div>

      {/* Slide track — GPU layer */}
      <div
        ref={trackRef}
        className="relative z-10 flex h-full"
        style={{
          width: '100%',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
          cursor: 'grab',
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        draggable={false}
      >
        {images.map((url, idx) => (
          <div
            key={idx}
            className="shrink-0 h-full overflow-hidden"
            style={{ width: '100%' }}
          >
            <img
              src={url}
              alt={`${altPrefix} ${idx + 1}`}
              draggable={false}
              className="h-full w-full object-contain"
              style={{ userSelect: 'none', pointerEvents: 'none' }}
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Controls */}
      {images.length > 1 && (
        <>
          {current > 0 && (
            <button
              type="button"
              onClick={prev}
              aria-label="Ảnh trước"
              className="absolute left-2.5 top-1/2 z-20 -translate-y-1/2
                         grid h-8 w-8 place-items-center rounded-full
                         bg-white/90 text-gray-800 shadow-md
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         hover:bg-white active:scale-95"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
          )}
          {current < images.length - 1 && (
            <button
              type="button"
              onClick={next}
              aria-label="Ảnh tiếp theo"
              className="absolute right-2.5 top-1/2 z-20 -translate-y-1/2
                         grid h-8 w-8 place-items-center rounded-full
                         bg-white/90 text-gray-800 shadow-md
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         hover:bg-white active:scale-95"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          )}

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx)}
                aria-label={`Ảnh ${idx + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  idx === current
                    ? 'w-5 bg-white shadow-sm'
                    : 'w-1.5 bg-white/60 hover:bg-white/85',
                )}
              />
            ))}
          </div>

          <div className="absolute right-3 top-3 z-20 rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}
