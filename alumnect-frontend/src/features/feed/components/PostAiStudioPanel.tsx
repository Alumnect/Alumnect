import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ImagePlus, Loader2, Palette, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAiStudio } from '../hooks/useAiStudio'
import type { AiStudioResult } from '../model/aiStudio'
import {
  POSTER_PALETTES,
  POSTER_SCENES,
  posterCanvasToFile,
  renderPoster,
  resolvePalette,
  resolveScene,
} from '../utils/posterCanvasRenderer'
import type { PosterPaletteId, PosterSceneId, PosterSpec } from '../utils/posterCanvasRenderer'

const IDEA_MAX = 1500

export interface PostAiStudioPanelProps {
  viewerName: string
  currentType: 'recruitment' | 'event'
  title?: string
  company?: string
  location?: string
  salaryMin?: number
  salaryMax?: number
  startTime?: string
  endTime?: string
  capacity?: number
  content?: string
  currentMediaUrls?: string[]
  onAttachPoster: (file: File, previousUrl: string | null, reuseUrl?: string | null) => Promise<string>
  onGenerated?: (result: AiStudioResult) => void
}

/**
 * Bảng tạo Poster bằng AI [B1] trong `CreatePostModal`:
 * Tự động tổng hợp thông tin đã điền trong form Tuyển dụng / Sự kiện (tiêu đề, công ty, lương, địa điểm, mô tả...)
 * để sinh Poster HD 1200x675 Canvas, không bắt người dùng tự gõ prompt ảnh.
 */
export function PostAiStudioPanel({
  viewerName,
  currentType,
  title,
  company,
  location,
  salaryMin,
  salaryMax,
  startTime,
  endTime,
  capacity,
  content,
  currentMediaUrls = [],
  onAttachPoster,
  onGenerated,
}: PostAiStudioPanelProps) {
  const { t } = useTranslation()
  const aiMutation = useAiStudio()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [result, setResult] = useState<AiStudioResult | null>(null)
  const [scene, setScene] = useState<PosterSceneId>('COMMUNITY_NETWORK_GLOBE')
  const [paletteId, setPaletteId] = useState<PosterPaletteId>('FPT_SIGNATURE')
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null)
  const [attachedDirty, setAttachedDirty] = useState(false)
  const [attaching, setAttaching] = useState(false)

  // Xác định Poster hiện tại có đang nằm trong danh sách ảnh của bài viết hay không.
  const isCurrentlyAttached = Boolean(attachedUrl && currentMediaUrls.includes(attachedUrl))

  const spec: PosterSpec | null = result
    ? { ...result.posterSpec, illustrationScene: scene, colorPalette: paletteId }
    : null

  // Vẽ lại Poster mỗi khi kết quả AI / cảnh vật / bảng màu thay đổi (0ms gọi AI).
  useEffect(() => {
    if (!result || !canvasRef.current) return
    let cancelled = false
    const canvas = canvasRef.current
    const drawSpec: PosterSpec = { ...result.posterSpec, illustrationScene: scene, colorPalette: paletteId }
    renderPoster(canvas, drawSpec, { authorName: viewerName, kind: result.detectedType }).catch(() => {
      if (!cancelled) toast.error(t('feed.aiGenerateFailed'))
    })
    return () => {
      cancelled = true
    }
  }, [result, scene, paletteId, viewerName, t])

  const handleGenerate = async () => {
    const parts: string[] = []
    if (currentType === 'recruitment') {
      if (title?.trim()) parts.push(`Tuyển dụng vị trí: ${title.trim()}`)
      if (company?.trim()) parts.push(`Công ty: ${company.trim()}`)
      if (location?.trim()) parts.push(`Địa điểm làm việc: ${location.trim()}`)
      if (salaryMin || salaryMax) {
        const minText = salaryMin ? `${(salaryMin / 1_000_000).toLocaleString('vi-VN')} triệu` : ''
        const maxText = salaryMax ? `${(salaryMax / 1_000_000).toLocaleString('vi-VN')} triệu` : ''
        parts.push(`Mức lương: ${minText}${minText && maxText ? ' - ' : ''}${maxText} VNĐ/tháng`)
      }
      if (content?.trim()) parts.push(`Yêu cầu & Quyền lợi: ${content.trim()}`)
    } else {
      if (title?.trim()) parts.push(`Sự kiện: ${title.trim()}`)
      if (location?.trim()) parts.push(`Địa điểm tổ chức: ${location.trim()}`)
      if (startTime) {
        try {
          parts.push(`Thời gian bắt đầu: ${new Date(startTime).toLocaleString('vi-VN')}`)
        } catch {
          // ignore date parse error
        }
      }
      if (endTime) {
        try {
          parts.push(`Thời gian kết thúc: ${new Date(endTime).toLocaleString('vi-VN')}`)
        } catch {
          // ignore date parse error
        }
      }
      if (capacity) parts.push(`Quy mô tham gia: ${capacity} người`)
      if (content?.trim()) parts.push(`Mô tả sự kiện: ${content.trim()}`)
    }

    const promptText = parts.join('\n').slice(0, IDEA_MAX)
    if (!promptText.trim()) {
      toast.error(
        currentType === 'recruitment'
          ? t('feed.aiJobInfoRequired')
          : t('feed.aiEventInfoRequired')
      )
      return
    }

    try {
      const data = await aiMutation.mutateAsync({ prompt: promptText, preferredType: currentType })
      setResult(data)
      setScene(resolveScene(data.posterSpec.illustrationScene))
      setPaletteId(resolvePalette(data.posterSpec.colorPalette).id)
      setAttachedDirty(attachedUrl !== null)
      if (onGenerated) onGenerated(data)
      toast.success(t('feed.aiGenerateSuccess'))
    } catch (err) {
      toast.error((err as Error)?.message || t('feed.aiGenerateFailed'))
    }
  }

  const changeScene = (id: PosterSceneId) => {
    setScene(id)
    if (attachedUrl) setAttachedDirty(true)
  }

  const changePalette = (id: PosterPaletteId) => {
    setPaletteId(id)
    if (attachedUrl) setAttachedDirty(true)
  }

  const handleAttach = async () => {
    const canvas = canvasRef.current
    if (!canvas || !result) return
    setAttaching(true)
    try {
      // Nếu poster đã từng được upload lên R2 và chưa hề bị sửa đổi cảnh/màu sắc,
      // tái sử dụng luôn URL cũ (0ms) thay vì phải upload lại file mới.
      const reuse = attachedUrl && !attachedDirty ? attachedUrl : null
      let file: File | null = null
      if (!reuse) {
        file = await posterCanvasToFile(canvas, `alumnect-poster-${Date.now()}.png`)
      }
      const dummyFile = file || new File([], 'reuse.png')
      const url = await onAttachPoster(dummyFile, attachedUrl, reuse)
      setAttachedUrl(url)
      setAttachedDirty(false)
      toast.success(t('feed.aiAttached'))
    } catch {
      toast.error(t('feed.aiAttachFailed'))
    } finally {
      setAttaching(false)
    }
  }

  const busy = aiMutation.isPending

  return (
    <div className="space-y-3.5 rounded-2xl border border-primary-soft-border bg-primary-soft/30 p-4 dark:border-border-strong dark:bg-surface-2 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-primary-solid">
            <Palette size={16} />
            {currentType === 'recruitment' ? t('feed.aiStudioTitleJob') : t('feed.aiStudioTitleEvent')}
          </h4>
          <p className="mt-0.5 text-xs text-text-subtle dark:text-text-muted">
            {t('feed.aiStudioAutoHint')}
          </p>
        </div>

        {!result && (
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={busy}
            leftIcon={busy ? <Loader2 size={16} className="animate-spin" /> : undefined}
            className="shrink-0"
          >
            {busy ? t('feed.aiGenerating') : t('feed.aiGeneratePoster')}
          </Button>
        )}
      </div>

      {result && spec && (
        <div className="space-y-3 pt-1 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text">{t('feed.aiPosterTitle')}</p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-solid hover:underline disabled:opacity-50"
            >
              <RefreshCw size={12} className={busy ? 'animate-spin' : ''} />
              {t('feed.aiUpdateByForm')}
            </button>
          </div>

          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t('feed.aiPosterAlt')}
            className="block w-full rounded-xl border border-border shadow-sm dark:border-border-strong"
            style={{ aspectRatio: '1200 / 675' }}
          />

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-text">
              <Palette size={13} /> {t('feed.aiChangeLook')}
            </p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('feed.aiScene')}>
              {POSTER_SCENES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => changeScene(s.id)}
                  aria-pressed={scene === s.id}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                    scene === s.id
                      ? 'bg-primary-solid text-on-primary shadow-sm'
                      : 'border border-border bg-surface text-text-muted hover:border-brand-300 hover:text-brand-600 dark:border-border-strong',
                  )}
                >
                  {t(`feed.scene_${s.id.toLowerCase()}`, s.label)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2" role="group" aria-label={t('feed.aiPalette')}>
              {Object.values(POSTER_PALETTES).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => changePalette(p.id)}
                  aria-pressed={paletteId === p.id}
                  aria-label={p.label}
                  title={p.label}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition',
                    paletteId === p.id ? 'scale-110 border-primary' : 'border-transparent opacity-80 hover:opacity-100',
                  )}
                  style={{ background: `linear-gradient(135deg, ${p.swatch[0]} 50%, ${p.swatch[1]} 50%)` }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={handleAttach}
              disabled={attaching || (isCurrentlyAttached && !attachedDirty)}
              leftIcon={
                attaching ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isCurrentlyAttached && !attachedDirty ? (
                  <Check size={16} />
                ) : (
                  <ImagePlus size={16} />
                )
              }
            >
              {attaching
                ? t('feed.aiAttaching')
                : isCurrentlyAttached && !attachedDirty
                  ? t('feed.aiAttached')
                  : isCurrentlyAttached && attachedDirty
                    ? t('feed.aiReattach')
                    : t('feed.aiAttach')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
