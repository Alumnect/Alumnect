import React from 'react'
import { Platform, View, type ViewStyle } from 'react-native'
import { WebView as RNWebView } from 'react-native-webview'

const WebView = RNWebView as unknown as React.ComponentType<any>

/** Phát video trong khung WebView (native) hoặc thẻ video (web), có điều khiển phát/tạm dừng/toàn màn hình. */
export function VideoPlayer({ url, height = 220, style }: { url: string; height?: number; style?: ViewStyle }) {
  if (Platform.OS === 'web') {
    return React.createElement('video', {
      src: url,
      controls: true,
      playsInline: true,
      preload: 'metadata',
      style: { width: '100%', height, borderRadius: 12, backgroundColor: '#000', objectFit: 'contain' },
    })
  }
  const safeUrl = url.replace(/"/g, '&quot;')
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>html,body{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden;display:flex;align-items:center;justify-content:center}video{width:100%;height:100%;object-fit:contain;background:#000}</style></head><body><video src="${safeUrl}#t=0.1" controls playsinline webkit-playsinline preload="metadata"></video></body></html>`
  return (
    <View style={[{ width: '100%', height, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }, style]}>
      <WebView
        source={{ html, baseUrl: 'https://alumnect.local' }}
        originWhitelist={['*']}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        style={{ flex: 1, backgroundColor: '#000' }}
      />
    </View>
  )
}
