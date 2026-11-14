import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AppState, Dimensions, Modal, Pressable, StatusBar, View } from 'react-native'
import { WebView as RNWebView } from 'react-native-webview'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { create } from 'zustand'
import { Play, SpeakerHigh, SpeakerSlash, X } from '@/components/icons'
import { Txt } from './ui'

const WebView = RNWebView as unknown as React.ComponentType<any>

/** Tỉ lệ & thời lượng video đã đo — dùng lại khi cuộn để khung không nhảy. */
export const videoMetaCache = new Map<string, { ratio: number; duration: number }>()

/** Khung video trên feed giống Facebook: dọc tối đa 4:5, ngang tối đa 1.91:1 (cắt vừa khung). */
export const clampFeedVideoRatio = (r: number) => Math.min(1.91, Math.max(0.8, r))

/**
 * Điều phối autoplay toàn feed: mỗi video báo % hiển thị, chỉ video hiện rõ nhất (≥ 60%) được phát.
 * Trạng thái tắt/bật tiếng dùng chung cho cả feed (bật tiếng một video thì video sau cũng có tiếng).
 */
const useFeedVideo = create<{
  muted: boolean
  visible: Record<string, number>
  active: string | null
  paused: boolean
  setMuted: (m: boolean) => void
  report: (key: string, fraction: number) => void
  remove: (key: string) => void
  setPaused: (p: boolean) => void
}>((set) => {
  const pick = (visible: Record<string, number>) => {
    let best: string | null = null
    let max = 0.6
    for (const [k, v] of Object.entries(visible)) {
      if (v >= max) {
        max = v
        best = k
      }
    }
    return best
  }
  return {
    muted: true,
    visible: {},
    active: null,
    paused: false,
    setMuted: (muted) => set({ muted }),
    report: (key, fraction) =>
      set((s) => {
        if ((s.visible[key] ?? 0) === fraction) return s
        const visible = { ...s.visible, [key]: fraction }
        return { visible, active: pick(visible) }
      }),
    remove: (key) =>
      set((s) => {
        const { [key]: _drop, ...visible } = s.visible
        return { visible, active: pick(visible) }
      }),
    setPaused: (paused) => set({ paused }),
  }
})

function fmt(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`
}

function feedHtml(url: string) {
  const safe = url.replace(/"/g, '&quot;')
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/><style>*{margin:0;padding:0}html,body{width:100%;height:100%;background:#000;overflow:hidden}video{width:100%;height:100%;object-fit:cover;background:#000}</style></head><body><video id="v" src="${safe}#t=0.1" muted loop playsinline webkit-playsinline preload="metadata"></video><script>
var v=document.getElementById('v'),last=0;
function post(o){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o))}
v.addEventListener('loadedmetadata',function(){post({type:'meta',w:v.videoWidth,h:v.videoHeight,d:v.duration||0})});
v.addEventListener('timeupdate',function(){var n=Date.now();if(n-last>400){last=n;post({type:'time',t:v.currentTime,d:v.duration||0})}});
v.addEventListener('playing',function(){post({type:'state',playing:true})});
v.addEventListener('pause',function(){post({type:'state',playing:false})});
window.cmd=function(c,arg){try{if(c==='play'){var p=v.play();p&&p.catch&&p.catch(function(){})}else if(c==='pause'){v.pause()}else if(c==='mute'){v.muted=!!arg}}catch(e){}};
</script></body></html>`
}

function fullHtml(url: string, start: number) {
  const safe = url.replace(/"/g, '&quot;')
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/><style>*{margin:0;padding:0}html,body{width:100%;height:100%;background:#000;overflow:hidden;display:flex;align-items:center;justify-content:center}video{width:100%;height:100%;object-fit:contain;background:#000}</style></head><body><video id="v" src="${safe}#t=${start.toFixed(2)}" controls autoplay playsinline webkit-playsinline></video><script>
var v=document.getElementById('v');v.addEventListener('timeupdate',function(){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({t:v.currentTime}))});
</script></body></html>`
}

/** Xem video toàn màn hình (có tiếng, đủ nút điều khiển), tiếp tục từ giây đang xem trên feed. */
function FullscreenVideo({ url, start, onClose }: { url: string | null; start: number; onClose: (t: number) => void }) {
  const insets = useSafeAreaInsets()
  const pos = useRef(start)
  useEffect(() => {
    pos.current = start
  }, [start, url])
  return (
    <Modal visible={!!url} animationType="fade" onRequestClose={() => onClose(pos.current)} statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      <StatusBar hidden />
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {url ? (
          <WebView
            source={{ html: fullHtml(url, start), baseUrl: 'https://alumnect.local' }}
            originWhitelist={['*']}
            onMessage={(e: { nativeEvent: { data: string } }) => {
              try {
                pos.current = (JSON.parse(e.nativeEvent.data) as { t: number }).t
              } catch {
                /* bỏ qua */
              }
            }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            scrollEnabled={false}
            javaScriptEnabled
            mixedContentMode="always"
            style={{ flex: 1, backgroundColor: '#000' }}
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng video"
          onPress={() => onClose(pos.current)}
          hitSlop={12}
          style={{ position: 'absolute', top: insets.top + 10, left: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={22} color="#fff" weight="bold" />
        </Pressable>
      </View>
    </Modal>
  )
}

/**
 * Video trên feed kiểu Facebook:
 * - Lướt tới (hiện ≥ 60%) thì tự phát, tắt tiếng; lướt qua thì tự dừng.
 * - Nút loa góc phải bật/tắt tiếng; góc trái hiện thời gian còn lại; thanh tiến trình mảnh ở đáy.
 * - Chạm 1 lần mở toàn màn hình có tiếng, chạm 2 lần để thích.
 */
export function FeedVideo({
  url,
  width,
  height,
  onDoubleLike,
  onRatio,
}: {
  url: string
  width: number
  height: number
  onDoubleLike: () => void
  onRatio?: (ratio: number) => void
}) {
  const key = useId()
  const ref = useRef<React.ElementRef<typeof View>>(null)
  const web = useRef<{ injectJavaScript: (js: string) => void } | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState({ t: 0, d: videoMetaCache.get(url)?.duration ?? 0 })
  const [full, setFull] = useState(false)
  const [focused, setFocused] = useState(true)
  const lastTap = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const muted = useFeedVideo((s) => s.muted)
  const setMuted = useFeedVideo((s) => s.setMuted)
  const report = useFeedVideo((s) => s.report)
  const remove = useFeedVideo((s) => s.remove)
  const isActive = useFeedVideo((s) => s.active === key && !s.paused)

  useEffect(() => {
    const cached = videoMetaCache.get(url)
    if (cached) onRatio?.(cached.ratio)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useFocusEffect(
    useCallback(() => {
      setFocused(true)
      return () => setFocused(false)
    }, []),
  )

  // Đo phần hiển thị trên màn hình (cả dọc lẫn ngang — video ở trang khác của carousel coi như ẩn).
  useEffect(() => {
    let appActive = AppState.currentState === 'active'
    const sub = AppState.addEventListener('change', (s) => {
      appActive = s === 'active'
    })
    const tick = () => {
      if (!focused || !appActive || full) return report(key, 0)
      ref.current?.measureInWindow((x, y, w, h) => {
        if (!w || !h) return report(key, 0)
        const win = Dimensions.get('window')
        const vis = Math.max(0, Math.min(y + h, win.height) - Math.max(y, 0)) * Math.max(0, Math.min(x + w, win.width) - Math.max(x, 0))
        report(key, Math.round((vis / (w * h)) * 100) / 100)
      })
    }
    tick()
    const id = setInterval(tick, 300)
    return () => {
      clearInterval(id)
      sub.remove()
    }
  }, [focused, full, key, report])

  useEffect(() => () => {
    remove(key)
    if (tapTimer.current) clearTimeout(tapTimer.current)
  }, [key, remove])

  useEffect(() => {
    if (ready) web.current?.injectJavaScript(`window.cmd&&window.cmd('${isActive ? 'play' : 'pause'}');true;`)
  }, [isActive, ready])

  useEffect(() => {
    if (ready) web.current?.injectJavaScript(`window.cmd&&window.cmd('mute',${muted});true;`)
  }, [muted, ready])

  const onMessage = (e: { nativeEvent: { data: string } }) => {
    try {
      const m = JSON.parse(e.nativeEvent.data) as { type: string; w?: number; h?: number; d?: number; t?: number; playing?: boolean }
      if (m.type === 'meta' && m.w && m.h) {
        const ratio = m.w / m.h
        videoMetaCache.set(url, { ratio, duration: m.d ?? 0 })
        onRatio?.(ratio)
        setTime((p) => ({ ...p, d: m.d ?? p.d }))
      } else if (m.type === 'time') {
        setTime({ t: m.t ?? 0, d: m.d ?? 0 })
      } else if (m.type === 'state') {
        setPlaying(!!m.playing)
      }
    } catch {
      /* bỏ qua */
    }
  }

  const onTap = () => {
    const now = Date.now()
    if (now - lastTap.current < 280) {
      if (tapTimer.current) clearTimeout(tapTimer.current)
      lastTap.current = 0
      onDoubleLike()
      return
    }
    lastTap.current = now
    tapTimer.current = setTimeout(() => {
      web.current?.injectJavaScript(`window.cmd&&window.cmd('pause');true;`)
      setFull(true)
    }, 280)
  }

  const remaining = time.d ? Math.max(0, time.d - time.t) : 0
  const progress = time.d ? Math.min(1, time.t / time.d) : 0

  return (
    <View ref={ref} collapsable={false} style={{ width, height, backgroundColor: '#000' }}>
      <WebView
        ref={web}
        source={{ html: feedHtml(url), baseUrl: 'https://alumnect.local' }}
        originWhitelist={['*']}
        onMessage={onMessage}
        onLoadEnd={() => setReady(true)}
        pointerEvents="none"
        style={{ width, height, backgroundColor: '#000' }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        javaScriptEnabled
        mixedContentMode="always"
      />
      <Pressable
        onPress={onTap}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
        accessibilityRole="button"
        accessibilityLabel="Video bài viết. Chạm để xem toàn màn hình, chạm hai lần để thích"
      >
        {!playing && !isActive ? (
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)' }}>
            <Play size={26} color="#fff" weight="fill" style={{ marginLeft: 3 }} />
          </View>
        ) : null}
      </Pressable>
      {time.d ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 10, bottom: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Txt size={11.5} weight="700" color="#fff">{fmt(playing || time.t > 0 ? remaining : time.d)}</Txt>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={muted ? 'Bật tiếng' : 'Tắt tiếng'}
        onPress={() => setMuted(!muted)}
        hitSlop={10}
        style={({ pressed }) => ({ position: 'absolute', right: 10, bottom: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
      >
        {muted ? <SpeakerSlash size={17} color="#fff" weight="fill" /> : <SpeakerHigh size={17} color="#fff" weight="fill" />}
      </Pressable>
      {progress > 0 ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.25)' }}>
          <View style={{ width: `${progress * 100}%`, height: 3, backgroundColor: '#fff' }} />
        </View>
      ) : null}
      <FullscreenVideo
        url={full ? url : null}
        start={time.t}
        onClose={(t) => {
          setFull(false)
          if (t > 0) web.current?.injectJavaScript(`try{document.getElementById('v').currentTime=${t.toFixed(2)}}catch(e){};true;`)
        }}
      />
    </View>
  )
}
