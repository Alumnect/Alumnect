import React, { useMemo, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { WebView as RNWebView } from 'react-native-webview'
import type { WebViewMessageEvent } from 'react-native-webview'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Button, Chip, Loading, Screen, Txt, SearchBar } from '@/components/ui'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { exploreApi } from '@/api/explore'
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
  const [sel, setSel] = useState<MapPoint | null>(null)
  const keyword = useDebounced(search, 500)

  const q = useQuery({ queryKey: ['alumni-map', keyword, cohort], queryFn: () => exploreApi.map({ search: keyword || undefined, cohort }) })
  const points = useMemo(() => q.data ?? [], [q.data])
  const cohorts = useMemo(() => Array.from(new Set(points.map((p) => p.cohort).filter((c): c is number => c != null))).sort((a, b) => b - a), [points])

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
      <View style={{ height: 44 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          <Chip label="Mọi khóa" active={cohort == null} onPress={() => setCohort(undefined)} />
          {cohorts.map((c) => <Chip key={c} label={`K${c}`} active={cohort === c} onPress={() => setCohort(cohort === c ? undefined : c)} />)}
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>
        <WebView ref={web} source={{ html: HTML, baseUrl: 'https://alumnect.local' }} originWhitelist={['*']} onMessage={onMessage} javaScriptEnabled style={{ flex: 1 }} />
        {q.isLoading ? <View style={{ position: 'absolute', top: 8, alignSelf: 'center' }}><Loading /></View> : null}
        <View style={{ position: 'absolute', left: 12, bottom: 12, backgroundColor: t.card, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
          <Txt size={12} weight="600">{points.length} cựu sinh viên</Txt>
        </View>
      </View>
      <ActionSheet visible={!!sel} onClose={() => setSel(null)}>
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
            <Button title="Xem hồ sơ" onPress={() => { const id = sel.userId; setSel(null); router.push({ pathname: '/profile/[id]', params: { id: String(id) } }) }} />
          </View>
        ) : null}
      </ActionSheet>
    </Screen>
  )
}
