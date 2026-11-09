import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { WebView } from 'react-native-webview'
import * as Haptics from 'expo-haptics'
import {
  Check,
  CheckCircle2,
  ImagePlus,
  RotateCcw,
  Sparkles,
} from '@/components/icons'
import { Text } from '@/components/AppText'
import { Button } from './ui'
import { feedApi } from '@/api/feed'
import type { AiStudioResponse } from '@/api/feed'
import http, { type ApiResponse } from '@/lib/http'
import { toast, errMsg } from '@/lib/toast'
import { radius, useTheme } from '@/theme'
import {
  POSTER_HTML,
  POSTER_PALETTES,
  POSTER_SCENES,
  type PosterPaletteId,
  type PosterSceneId,
  type PosterSpec,
} from './PosterEngineHtml'

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const bin = atob(base64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return arr
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const lookup = new Uint8Array(256)
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i
  let bufferLength = base64.length * 0.75
  if (base64[base64.length - 1] === '=') {
    bufferLength--
    if (base64[base64.length - 2] === '=') bufferLength--
  }
  const bytes = new Uint8Array(bufferLength)
  let p = 0
  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)]
    const encoded2 = lookup[base64.charCodeAt(i + 1)]
    const encoded3 = lookup[base64.charCodeAt(i + 2)]
    const encoded4 = lookup[base64.charCodeAt(i + 3)]
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4)
    if (base64[i + 2] !== '=') bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2)
    if (base64[i + 3] !== '=') bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63)
  }
  return bytes
}

export interface PostAiStudioPanelProps {
  viewerName?: string
  currentType: 'recruitment' | 'event'
  title?: string
  company?: string
  location?: string
  salaryMin?: string | number
  salaryMax?: string | number
  startTime?: string
  endTime?: string
  capacity?: string | number
  content?: string
  currentMedia: string[]
  onAttachPoster: (publicUrl: string) => void
  onApplyPolishedContent?: (text: string) => void
}

/**
 * Bảng tạo Poster bằng AI dành cho Mobile:
 * Tự động tổng hợp thông tin form Tuyển dụng / Sự kiện, gọi AI sinh cấu hình
 * và kết xuất Canvas Poster HD 1200x675 ngay trên thiết bị.
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
  currentMedia,
  onAttachPoster,
  onApplyPolishedContent,
}: PostAiStudioPanelProps) {
  const theme = useTheme()
  const webViewRef = useRef<any>(null)
  const isEngineReady = useRef(false)
  const pendingSpec = useRef<{ spec: PosterSpec; options: { authorName?: string; kind?: string } } | null>(null)

  const [generating, setGenerating] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const [result, setResult] = useState<AiStudioResponse | null>(null)
  const [spec, setSpec] = useState<PosterSpec | null>(null)
  const [scene, setScene] = useState<PosterSceneId>('TECH_CODE_WORKSPACE')
  const [paletteId, setPaletteId] = useState<PosterPaletteId>('FPT_SIGNATURE')
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null)
  const [attachedDirty, setAttachedDirty] = useState(false)

  const isAttached = Boolean(attachedUrl && currentMedia.includes(attachedUrl))

  const sendRender = (targetSpec: PosterSpec) => {
    const opts = { authorName: viewerName || 'Alumnect Member', kind: currentType }
    if (!isEngineReady.current || !webViewRef.current) {
      pendingSpec.current = { spec: targetSpec, options: opts }
      return
    }
    webViewRef.current.postMessage(JSON.stringify({ action: 'RENDER', spec: targetSpec, options: opts }))
  }

  const handleGenerate = async () => {
    const parts: string[] = []
    if (currentType === 'recruitment') {
      if (!title?.trim() && !company?.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
        toast.error('Vui lòng nhập chức danh hoặc công ty trước khi tạo poster')
        return
      }
      if (title?.trim()) parts.push(`Tuyển dụng vị trí: ${title.trim()}`)
      if (company?.trim()) parts.push(`Công ty: ${company.trim()}`)
      if (location?.trim()) parts.push(`Địa điểm làm việc: ${location.trim()}`)
      if (salaryMin || salaryMax) {
        const minText = salaryMin ? `${(Number(salaryMin) / 1_000_000).toLocaleString('vi-VN')} triệu` : ''
        const maxText = salaryMax ? `${(Number(salaryMax) / 1_000_000).toLocaleString('vi-VN')} triệu` : ''
        parts.push(`Mức lương: ${minText}${minText && maxText ? ' - ' : ''}${maxText} VNĐ/tháng`)
      }
      if (content?.trim()) parts.push(`Yêu cầu & Quyền lợi: ${content.trim()}`)
    } else {
      if (!title?.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
        toast.error('Vui lòng nhập tên sự kiện trước khi tạo poster')
        return
      }
      parts.push(`Sự kiện: ${title.trim()}`)
      if (location?.trim()) parts.push(`Địa điểm tổ chức: ${location.trim()}`)
      if (startTime) {
        try {
          parts.push(`Thời gian bắt đầu: ${new Date(startTime).toLocaleString('vi-VN')}`)
        } catch {}
      }
      if (endTime) {
        try {
          parts.push(`Thời gian kết thúc: ${new Date(endTime).toLocaleString('vi-VN')}`)
        } catch {}
      }
      if (capacity) parts.push(`Quy mô tham gia: ${capacity} người`)
      if (content?.trim()) parts.push(`Mô tả sự kiện: ${content.trim()}`)
    }

    const promptText = parts.join('\n').slice(0, 1500)
    setGenerating(true)
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
      const data = await feedApi.aiStudio(promptText, currentType)
      setResult(data)

      const initialScene = (POSTER_SCENES.some((s) => s.id === data.posterSpec.illustrationScene)
        ? data.posterSpec.illustrationScene
        : currentType === 'recruitment'
        ? 'TECH_CODE_WORKSPACE'
        : 'EVENT_STAGE_SPOTLIGHT') as PosterSceneId

      const initialPalette = (data.posterSpec.colorPalette in POSTER_PALETTES
        ? data.posterSpec.colorPalette
        : 'FPT_SIGNATURE') as PosterPaletteId

      setScene(initialScene)
      setPaletteId(initialPalette)

      const fullSpec: PosterSpec = {
        ...data.posterSpec,
        illustrationScene: initialScene,
        colorPalette: initialPalette,
      }
      setSpec(fullSpec)
      sendRender(fullSpec)

      setAttachedDirty(attachedUrl !== null)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      toast.success('AI đã tạo mẫu Poster thành công!')
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      toast.error(errMsg(err))
    } finally {
      setGenerating(false)
    }
  }

  const changeScene = (newScene: PosterSceneId) => {
    if (!spec) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setScene(newScene)
    const updated = { ...spec, illustrationScene: newScene }
    setSpec(updated)
    sendRender(updated)
    if (attachedUrl) setAttachedDirty(true)
  }

  const changePalette = (newPalette: PosterPaletteId) => {
    if (!spec) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setPaletteId(newPalette)
    const updated = { ...spec, colorPalette: newPalette }
    setSpec(updated)
    sendRender(updated)
    if (attachedUrl) setAttachedDirty(true)
  }

  const handleAttach = async () => {
    if (!previewDataUrl) return
    setAttaching(true)
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
      const base64Data = previewDataUrl.includes(',') ? previewDataUrl.split(',')[1] : previewDataUrl
      const bytes = base64ToUint8Array(base64Data)

      const signed = await http.get<unknown, ApiResponse<{ uploadUrl: string; publicUrl: string }>>(
        '/files/presigned-url',
        {
          params: {
            fileName: `alumnect-poster-${Date.now()}.png`,
            contentType: 'image/png',
            folder: 'posts',
          },
        }
      )
      const uploadRes = await fetch(signed.data.uploadUrl, {
        method: 'PUT',
        body: bytes.buffer as unknown as BodyInit,
        headers: { 'Content-Type': 'image/png' },
      })
      if (!uploadRes.ok) {
        throw new Error('Tải ảnh Poster lên máy chủ thất bại.')
      }

      const publicUrl = signed.data.publicUrl
      onAttachPoster(publicUrl)
      setAttachedUrl(publicUrl)
      setAttachedDirty(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      toast.success('Đã đính kèm Poster vào bài viết!')
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      toast.error(errMsg(e))
    } finally {
      setAttaching(false)
    }
  }

  return (
    <View style={{ marginTop: 14 }}>
      {/* WebView chạy ngầm không hiển thị để render Canvas 1200x675 siêu nét */}
      <View style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}>
        {React.createElement(WebView as any, {
          ref: webViewRef,
          source: { html: POSTER_HTML },
          originWhitelist: ['*'],
          javaScriptEnabled: true,
          onMessage: (event: any) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data)
              if (msg.type === 'READY') {
                isEngineReady.current = true
                if (pendingSpec.current) {
                  sendRender(pendingSpec.current.spec)
                  pendingSpec.current = null
                }
              } else if (msg.type === 'RENDERED') {
                setPreviewDataUrl(msg.dataUrl)
              } else if (msg.type === 'ERROR') {
                toast.error('Lỗi kết xuất Poster: ' + msg.error)
              }
            } catch {}
          },
        })}
      </View>

      {/* Khung banner AI Studio */}
      <View
        style={{
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.isDark ? '#4A2C1C' : '#FED7AA',
          backgroundColor: theme.isDark ? '#261811' : '#FFF7ED',
          padding: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={18} color={theme.primary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.primary }}>
                {currentType === 'recruitment' ? 'AI Thiết kế Poster Tuyển dụng' : 'AI Thiết kế Poster Sự kiện'}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, lineHeight: 18 }}>
              Tự động tạo Poster đồ họa sắc nét dựa trên các thông tin bạn đã điền.
            </Text>
          </View>

          {!result && (
            <Button
              title="Tạo Poster bằng AI"
              size="sm"
              loading={generating}
              onPress={handleGenerate}
              style={{ borderRadius: radius.full, paddingHorizontal: 14, minHeight: 38 }}
            />
          )}
        </View>

        {/* Khi đã có kết quả Poster */}
        {result && spec && (
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>
                Mẫu Poster đã thiết kế
              </Text>
              <Pressable
                onPress={handleGenerate}
                disabled={generating}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <RotateCcw size={13} color={theme.primary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.primary }}>
                  Làm mới theo form
                </Text>
              </Pressable>
            </View>

            {/* Khung xem trước Poster */}
            <View
              style={{
                width: '100%',
                aspectRatio: 1200 / 675,
                borderRadius: radius.md,
                overflow: 'hidden',
                backgroundColor: '#0a1020',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.border,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {previewDataUrl ? (
                <Image source={{ uri: previewDataUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
              ) : (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={{ fontSize: 11, color: '#fff' }}>Đang vẽ Poster HD...</Text>
                </View>
              )}
            </View>

            {/* Tuỳ chỉnh Cảnh vật (Illustration Scene) */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                Đổi cảnh đồ họa 3D:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {POSTER_SCENES.map((s) => {
                  const isSelected = scene === s.id
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => changeScene(s.id)}
                      style={({ pressed }) => ({
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: radius.full,
                        borderWidth: 1,
                        borderColor: isSelected ? theme.primary : theme.controlBorder,
                        backgroundColor: isSelected ? theme.primary : theme.card,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#fff' : theme.text,
                        }}
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>

            {/* Tuỳ chỉnh Bảng màu (Color Palette) */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                Đổi bảng phối màu:
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {POSTER_PALETTES.map((p) => {
                  const isSelected = paletteId === p.id
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => changePalette(p.id)}
                      style={({ pressed }) => ({
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        borderWidth: isSelected ? 2.5 : 1,
                        borderColor: isSelected ? theme.primary : theme.border,
                        overflow: 'hidden',
                        flexDirection: 'row',
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <View style={{ flex: 1, backgroundColor: p.swatch[0] }} />
                      <View style={{ flex: 1, backgroundColor: p.swatch[1] }} />
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* Nút hành động đính kèm poster vào bài viết */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button
                title={
                  attaching
                    ? 'Đang đính kèm...'
                    : isAttached && !attachedDirty
                    ? 'Đã đính kèm Poster'
                    : isAttached && attachedDirty
                    ? 'Cập nhật lại Poster'
                    : 'Đính kèm vào bài viết'
                }
                variant={isAttached && !attachedDirty ? 'secondary' : 'primary'}
                loading={attaching}
                disabled={!previewDataUrl || (isAttached && !attachedDirty)}
                icon={isAttached && !attachedDirty ? <Check size={16} /> : <ImagePlus size={16} />}
                onPress={handleAttach}
                style={{ flex: 1, borderRadius: radius.full, minHeight: 40 }}
              />
            </View>

            {/* Gợi ý bài viết hay từ AI nếu có */}
            {result.polishedContent && onApplyPolishedContent && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                  onApplyPolishedContent(result.polishedContent)
                  toast.success('Đã điền nội dung tối ưu từ AI!')
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 10,
                  paddingVertical: 6,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Sparkles size={14} color={theme.primary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.primary }}>
                  Sử dụng nội dung bài viết do AI gợi ý
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
