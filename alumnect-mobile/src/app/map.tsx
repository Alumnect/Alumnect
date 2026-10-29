import React, { useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { WebView as RNWebView } from 'react-native-webview'
import type { WebViewMessageEvent } from 'react-native-webview'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Button, Empty, Loading, Screen, Txt, SearchBar } from '@/components/ui'
import { SelectField } from '@/components/SelectField'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { exploreApi } from '@/api/explore'
import { authApi } from '@/api/auth'
import { userApi } from '@/api/users'
import type { MapPoint } from '@/api/explore'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

// Ép kiểu vì typing của react-native-webview chưa khớp React 19.
const WebView = RNWebView as unknown as React.ComponentType<any>

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_API_KEY ?? ''
const MAPTILER_STYLE = process.env.EXPO_PUBLIC_MAPTILER_STYLE_ID || 'streets-v4'
/** Cùng nguồn nền với bản Web: MapTiler nếu có khóa, nếu không thì CARTO voyager. */
const TILE_LAYER = MAPTILER_KEY
  ? `L.tileLayer('https://api.maptiler.com/maps/${MAPTILER_STYLE}/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}',{tileSize:256,maxZoom:19,attribution:'© MapTiler © OpenStreetMap'}).addTo(map);`
  : `L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abc',maxZoom:19,attribution:'© OpenStreetMap © CARTO'}).addTo(map);`

const HTML = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0}.pin{background:#CE4A09;border:3px solid #fff;border-radius:50%;width:18px;height:18px;box-shadow:0 1px 4px rgba(0,0,0,.4)}</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map=L.map('map',{zoomControl:true}).setView([16.05,108.2],5);
${TILE_LAYER}
var layer=L.layerGroup().addTo(map);
function render(points){
  layer.clearLayers();
  var b=[];
  points.forEach(function(p){
    var m=L.marker([p.latitude,p.longitude],{icon:L.divIcon({className:'',html:'<div class="pin"></div>',iconSize:[18,18]})});
    m.on('click',function(){window.ReactNativeWebView.postMessage(String(p.userId))});
    m.addTo(layer);b.push([p.latitude,p.longitude]);
  });
  if(b.length)map.fitBounds(b,{padding:[40,40],maxZoom:12});
}
function onMsg(e){try{render(JSON.parse(e.data))}catch(_){}}
document.addEventListener('message',onMsg);window.addEventListener('message',onMsg);
window.ReactNativeWebView.postMessage('ready');
</script></body></html>`

/** UC52–54: bản đồ cựu sinh viên bằng Leaflet, dùng cùng nền CARTO voyager với bản Web (không cần API key). */
export default function MapScreen() {
  const t = useTheme()
  const router = useRouter()
  const web = useRef<{ postMessage: (m: string) => void } | null>(null)
  const [ready, setReady] = useState(false)
  const [search, setSearch] = useState('')
  const [cohort, setCohort] = useState<number | undefined>()
  const [majorId, setMajorId] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [sel, setSel] = useState<MapPoint | null>(null)
  const keyword = useDebounced(search, 500)

  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors, staleTime: 30 * 60_000 })
  const options = useQuery({ queryKey: ['user-filter-options'], queryFn: userApi.filterOptions })
  const q = useQuery({ queryKey: ['alumni-map', keyword, cohort, majorId], queryFn: () => exploreApi.map({ search: keyword || undefined, cohort, majorId: majorId ? Number(majorId) : undefined }) })
  const points = useMemo(() => q.data ?? [], [q.data])
  const cohorts = useMemo(() => [...(options.data?.cohorts ?? [])].sort((a, b) => b - a), [options.data])

  React.useEffect(() => {
    if (ready) web.current?.postMessage(JSON.stringify(points))
  }, [ready, points])

  const onMessage = (e: WebViewMessageEvent) => {
    const d = e.nativeEvent.data
    if (d === 'ready') return setReady(true)
    const p = points.find((x) => String(x.userId) === d)
    if (p) setSel(p)
  }

  return (
    <Screen>
      <Header title="Bản đồ Alumni" />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Tìm theo tên, công ty, chức danh..." style={{ margin: 12, marginBottom: 6 }} />
      <View style={{ paddingHorizontal: 12, flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}><SelectField label="Ngành học" placeholder="Mọi ngành" value={majorId} options={(majors.data?.data ?? []).map((m) => ({ value: String(m.id), label: m.name }))} onChange={setMajorId} error={majors.isError ? 'Không tải được danh sách ngành.' : undefined} /></View>
        <View style={{ flex: 1, minWidth: 0 }}><SelectField label="Khóa" placeholder="Mọi khóa" value={cohort == null ? null : String(cohort)} options={cohorts.map((c) => ({ value: String(c), label: `K${c}` }))} onChange={(value) => setCohort(value == null ? undefined : Number(value))} /></View>
      </View>
      {majors.isError ? <Button title="Thử tải lại ngành" variant="ghost" onPress={() => void majors.refetch()} /> : null}
      <View style={{ flex: 1 }}>
        <WebView ref={web} source={{ html: HTML, baseUrl: 'https://alumnect.local' }} originWhitelist={['*']} onMessage={onMessage} javaScriptEnabled style={{ flex: 1 }} />
        {q.isLoading ? <View style={{ position: 'absolute', top: 8, alignSelf: 'center' }}><Loading /></View> : null}
        {q.isError ? <View style={{ position: 'absolute', inset: 12, backgroundColor: t.card, justifyContent: 'center' }}><Empty title="Không tải được dữ liệu bản đồ" text="Vui lòng thử lại." error={q.error} onRetry={() => void q.refetch()} /></View> : null}
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: t.card, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt size={12} weight="600">{q.isLoading ? 'Đang tải...' : q.isError ? 'Chưa có dữ liệu' : `${points.length} cựu sinh viên`}</Txt>
          <Button title="Xem danh sách" variant="ghost" disabled={q.isLoading || q.isError} onPress={() => setListOpen(true)} />
        </View>
      </View>
      <ActionSheet visible={!!sel || listOpen} title={sel?.fullName ?? 'Cựu sinh viên trên bản đồ'} onClose={() => { setSel(null); setListOpen(false) }}>
        {sel ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={sel.avatarUrl} name={sel.fullName} size={56} />
              <View style={{ flex: 1 }}>
                <Txt weight="800" size={16}>{sel.fullName}</Txt>
                <Txt muted size={13}>{[sel.title, sel.company].filter(Boolean).join(' · ')}</Txt>
                <Txt muted size={12}>{sel.location}{sel.cohort ? ` · K${sel.cohort}` : ''}</Txt>
              </View>
            </View>
            <Button title="Xem hồ sơ" onPress={() => { const id = sel.userId; setSel(null); setListOpen(false); router.push({ pathname: '/profile/[id]', params: { id: String(id) } }) }} />
            <Button title="Xem lộ trình sự nghiệp" variant="outline" onPress={() => { const point = sel; setSel(null); setListOpen(false); router.push({ pathname: '/career', params: { userId: String(point.userId), name: point.fullName } }) }} />
            {listOpen ? <Button title="Quay lại danh sách" variant="ghost" onPress={() => setSel(null)} /> : null}
          </View>
        ) : points.length ? points.map((point) => <Button key={point.userId} title={point.fullName} variant="ghost" onPress={() => setSel(point)} style={{ justifyContent: 'flex-start' }} />) : <Txt muted>Không có cựu sinh viên phù hợp với bộ lọc.</Txt>}
      </ActionSheet>
    </Screen>
  )
}
