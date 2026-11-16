import React, { useRef } from 'react'
import { Modal, Platform, Pressable, StatusBar, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { WebView as RNWebView } from 'react-native-webview'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import { CornersOut, X } from '@/components/icons'
import { Txt } from './ui'
import { isVideoUrl } from '@/lib/upload'

const WebView = RNWebView as unknown as React.ComponentType<any>

function videoPlayerHtml(url: string) {
  const safe = url.replace(/"/g, '&quot;')
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden;display:flex;align-items:center;justify-content:center}video{width:100%;height:100%;object-fit:contain;background:#000}</style></head><body><video id="v" src="${safe}" controls autoplay playsinline webkit-playsinline></video></body></html>`
}

export interface MediaPreviewItem {
  url: string
  title?: string
  mediaType?: 'IMAGE' | 'VIDEO' | string
}

export function MediaPreviewModal({
  media,
  onClose,
}: {
  media: MediaPreviewItem | string | null
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const item: MediaPreviewItem | null = media
    ? typeof media === 'string'
      ? { url: media }
      : media
    : null

  if (!item || !item.url) return null

  const isVideo =
    item.mediaType === 'VIDEO' ||
    item.mediaType?.toLowerCase()?.includes('video') ||
    isVideoUrl(item.url)

  const handleOpenOriginal = async () => {
    if (!item.url) return
    try {
      if (item.url.startsWith('http')) {
        await WebBrowser.openBrowserAsync(item.url)
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <Modal
      visible={!!item}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
    >
      <StatusBar hidden={false} barStyle="light-content" />
      <View style={styles.backdrop}>
        {/* Header bar */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng xem trước"
            onPress={onClose}
            hitSlop={12}
            style={styles.circleBtn}
          >
            <X size={20} color="#FFFFFF" weight="bold" />
          </Pressable>
          <View style={styles.titleWrap}>
            {item.title ? (
              <Txt size={13.5} weight="700" color="#FFFFFF" numberOfLines={1}>
                {item.title}
              </Txt>
            ) : (
              <Txt size={13.5} weight="700" color="#FFFFFF">
                {isVideo ? 'Xem trước video' : 'Xem trước hình ảnh'}
              </Txt>
            )}
          </View>
          {item.url.startsWith('http') ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mở trong trình duyệt"
              onPress={handleOpenOriginal}
              hitSlop={12}
              style={styles.circleBtn}
            >
              <CornersOut size={18} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Content viewer */}
        <View style={styles.body}>
          {isVideo ? (
            <WebView
              source={{ html: videoPlayerHtml(item.url) }}
              originWhitelist={['*']}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              scrollEnabled={false}
              javaScriptEnabled
              mixedContentMode="always"
              allowFileAccess
              allowUniversalAccessFromFileURLs
              style={styles.videoPlayer}
            />
          ) : (
            <Pressable style={styles.imagePressable} onPress={onClose}>
              <Image
                source={{ uri: item.url }}
                style={styles.fullImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={150}
              />
            </Pressable>
          )}
        </View>

        {/* Footer info */}
        <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          <Txt size={12} color="rgba(255,255,255,0.7)">
            Chạm để đóng hoặc sử dụng nút điều khiển
          </Txt>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  body: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  imagePressable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
})
