import React from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { Image } from 'expo-image'
import { FileText, Play, Plus, X } from '@/components/icons'
import { Txt } from './ui'
import { useTheme } from '@/theme'
import type { OutgoingAttachment } from '@/api/chat'

/** Tệp đã tải lên, chờ gửi (giữ uri cục bộ để xem trước nhanh). */
export type PendingAttachment = OutgoingAttachment & { localUri?: string }
/** Tệp đang tải lên. */
export type UploadingAttachment = {
  key: string
  name: string
  kind: 'IMAGE' | 'VIDEO' | 'FILE'
  localUri?: string
  status?: 'uploading' | 'queued'
}

export const MAX_ATTACHMENTS = 10
const TILE = 78

function ext(name?: string, url?: string) {
  const m = (name || url || '').split('?')[0].match(/\.([a-z0-9]{1,5})$/i)
  return m ? m[1].toUpperCase() : 'FILE'
}

function prettySize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function TileFrame({ children, onRemove, removeLabel, disabled }: { children: React.ReactNode; onRemove?: () => void; removeLabel?: string; disabled?: boolean }) {
  const t = useTheme()
  return (
    <View style={{ width: TILE, height: TILE, paddingTop: 6, paddingRight: 6 }}>
      <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: t.isDark ? '#262626' : '#F1F3F5', borderWidth: 1, borderColor: t.border }}>
        {children}
      </View>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={removeLabel}
          disabled={disabled}
          onPress={onRemove}
          hitSlop={10}
          style={{ position: 'absolute', top: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.72)', borderWidth: 1.5, borderColor: t.card, alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={12} color="#FFFFFF" weight="bold" />
        </Pressable>
      ) : null}
    </View>
  )
}

function DocFace({ name, url, size }: { name?: string; url?: string; size?: number }) {
  const t = useTheme()
  return (
    <View style={{ flex: 1, padding: 6, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <FileText size={14} color={t.primary} />
        <Txt size={9.5} weight="800" color={t.primary}>{ext(name, url)}</Txt>
      </View>
      <Txt size={10} weight="600" numberOfLines={2} style={{ lineHeight: 12 }}>{name || 'Tệp'}</Txt>
      {size ? <Txt size={9} muted>{prettySize(size)}</Txt> : null}
    </View>
  )
}

/** Khay đính kèm trước khi gửi: xem trước từng tệp, xoá từng tệp / tất cả, thêm tiếp. */
export function AttachmentTray({
  pending,
  uploading,
  disabled,
  onRemove,
  onClear,
  onAdd,
  onPreview,
}: {
  pending: PendingAttachment[]
  uploading: UploadingAttachment[]
  disabled?: boolean
  onRemove: (url: string) => void
  onClear: () => void
  onAdd: () => void
  onPreview: (url: string) => void
}) {
  const t = useTheme()
  const total = pending.length + uploading.length
  if (!total) return null
  const counts = {
    img: pending.filter((p) => p.mediaType === 'IMAGE').length,
    vid: pending.filter((p) => p.mediaType === 'VIDEO').length,
    file: pending.filter((p) => p.mediaType === 'FILE').length,
  }
  const summary = [counts.img && `${counts.img} ảnh`, counts.vid && `${counts.vid} video`, counts.file && `${counts.file} tệp`].filter(Boolean).join(' · ')
  return (
    <View style={{ backgroundColor: t.card, borderTopWidth: 0.5, borderTopColor: t.divider, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 }}>
        <Txt size={12.5} weight="700" style={{ flex: 1 }} numberOfLines={1}>
          Đính kèm ({total}/{MAX_ATTACHMENTS}){summary ? <Txt size={12} muted weight="500">{`  ${summary}`}</Txt> : null}
          {uploading.length ? (
            <Txt size={12} muted weight="500">
              {`  · đang tải ${uploading.filter((u) => u.status !== 'queued').length || 1}/${uploading.length}…`}
            </Txt>
          ) : null}
        </Txt>
        <Pressable accessibilityRole="button" disabled={disabled} onPress={onClear} hitSlop={8} style={{ paddingVertical: 4, paddingHorizontal: 6 }}>
          <Txt size={12.5} weight="600" color={t.danger}>Xoá tất cả</Txt>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6, gap: 6 }}>
        {pending.map((p) => (
          <TileFrame key={p.url} onRemove={() => onRemove(p.url)} removeLabel={`Bỏ ${p.fileName ?? 'tệp'}`} disabled={disabled}>
            {p.mediaType === 'IMAGE' ? (
              <Pressable style={{ flex: 1 }} accessibilityLabel="Xem ảnh" onPress={() => onPreview(p.url)}>
                <Image source={{ uri: p.localUri || p.url }} style={{ flex: 1 }} contentFit="cover" />
              </Pressable>
            ) : p.mediaType === 'VIDEO' ? (
              <View style={{ flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={14} color="#FFFFFF" weight="fill" />
                </View>
                <Txt size={9} color="#FFFFFF" numberOfLines={1} style={{ marginTop: 4, maxWidth: TILE - 16 }}>{p.fileName || 'Video'}</Txt>
              </View>
            ) : (
              <DocFace name={p.fileName} url={p.url} size={p.fileSize} />
            )}
          </TileFrame>
        ))}
        {uploading.map((u) => {
          const isQueued = u.status === 'queued'
          return (
            <TileFrame key={u.key}>
              {u.kind === 'IMAGE' && u.localUri ? <Image source={{ uri: u.localUri }} style={{ position: 'absolute', inset: 0, opacity: 0.35 } as object} contentFit="cover" /> : null}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                {isQueued ? (
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: t.isDark ? '#333333' : '#E0E3E8', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                    <Txt size={9} weight="700" color={t.textMuted}>Chờ</Txt>
                  </View>
                ) : (
                  <ActivityIndicator size="small" color={t.primary} />
                )}
                <Txt size={9} muted numberOfLines={1} style={{ marginTop: 3, maxWidth: TILE - 16 }}>{u.name}</Txt>
              </View>
            </TileFrame>
          )
        })}
        {total < MAX_ATTACHMENTS ? (
          <View style={{ width: TILE, height: TILE, paddingTop: 6, paddingRight: 6 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thêm tệp đính kèm"
              disabled={disabled}
              onPress={onAdd}
              style={({ pressed }) => ({ flex: 1, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
            >
              <Plus size={20} color={t.textMuted} />
              <Txt size={10} muted style={{ marginTop: 2 }}>Thêm</Txt>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}
