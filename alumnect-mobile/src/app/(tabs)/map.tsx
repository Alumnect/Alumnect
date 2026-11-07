import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView as RNScrollView, StyleSheet, View } from 'react-native'
import { WebView as RNWebView } from 'react-native-webview'
import type { WebViewMessageEvent } from 'react-native-webview'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Button, Empty, PageHeader, Screen, Tag, Txt, SearchBar } from '@/components/ui'
import { ActionSheet } from '@/components/ActionSheet'
import { Briefcase, Check, ChevronDown, GraduationCap, MapPin, UserRound, X } from '@/components/icons'
import { exploreApi } from '@/api/explore'
import { authApi } from '@/api/auth'
import type { MapPoint } from '@/api/explore'
import { useDebounced } from '@/lib/hooks'
import { buildAlumniMapHtml, mapCommand, MAP_THEMES, type MapTheme } from '@/lib/alumniMapHtml'
import { useTheme } from '@/theme'

// Ép kiểu vì typing của react-native-webview chưa khớp React 19.
const WebView = RNWebView as unknown as React.ComponentType<any>

const UNDETERMINED = 'Chưa xác định'

/* ------------------------------------------------------------------ */
/* Top hubs – port từ MapPage.tsx của web                              */
/* ------------------------------------------------------------------ */

const HUB_CITY_ALIASES = [
  { label: 'Đà Nẵng, Việt Nam', patterns: ['da nang'] },
  { label: 'Hà Nội, Việt Nam', patterns: ['ha noi'] },
  { label: 'Hồ Chí Minh, Việt Nam', patterns: ['ho chi minh', 'sai gon'] },
  { label: 'Hải Phòng, Việt Nam', patterns: ['hai phong'] },
  { label: 'Cần Thơ, Việt Nam', patterns: ['can tho'] },
]

function normalizeLocation(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/đ/g, 'd')
}

/** Gom các địa chỉ chi tiết về cùng một thành phố để tính Top hubs. */
function getHubCity(location?: string | null, locationCity?: string | null, locationCountry?: string | null) {
  const rawLocation = location?.trim()
  const rawCity = locationCity?.trim()
  if (!rawLocation && !rawCity) return UNDETERMINED
  const normalized = normalizeLocation(rawCity ?? rawLocation ?? '')
  const alias = HUB_CITY_ALIASES.find((entry) => entry.patterns.some((pattern) => normalized.includes(pattern)))
  if (alias) return alias.label
  if (rawCity && locationCountry) return `${rawCity}, ${locationCountry}`
  return rawLocation ?? rawCity ?? UNDETERMINED
}

/* ------------------------------------------------------------------ */
/* Màn hình                                                            */
/* ------------------------------------------------------------------ */

/** UC53–55: bản đồ cựu sinh viên – cùng engine MapLibre GL, style, marker, cluster và logic lọc với bản Web. */
export default function MapScreen() {
  const t = useTheme()
  const router = useRouter()
  const web = useRef<{ injectJavaScript: (js: string) => void } | null>(null)
  const [ready, setReady] = useState(false)
  const [webFailed, setWebFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [switching, setSwitching] = useState(false)
  const [search, setSearch] = useState('')
  const [majorId, setMajorId] = useState<number | null>(null)
  const [mapTheme, setMapTheme] = useState<MapTheme>('DEFAULT')
  const [sheet, setSheet] = useState<'none' | 'list' | 'major'>('none')
  const [listTab, setListTab] = useState<'alumni' | 'hubs'>('alumni')
  const [selId, setSelId] = useState<string | null>(null)
  const keyword = useDebounced(search.trim(), 400)

  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors, staleTime: 30 * 60_000 })
  const q = useQuery({
    queryKey: ['alumni-map', keyword, majorId],
    queryFn: () => exploreApi.map({ search: keyword || undefined, majorId: majorId ?? undefined }),
  })
  // Kết quả chưa lọc ngành để đếm số người theo từng ngành (React Query dùng lại request khi chưa chọn ngành).
  const all = useQuery({
    queryKey: ['alumni-map', keyword, null],
    queryFn: () => exploreApi.map({ search: keyword || undefined }),
  })
  const points = useMemo(() => q.data ?? [], [q.data])
  const allPoints = useMemo(() => all.data ?? [], [all.data])

  const majorCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    allPoints.forEach((p) => {
      if (p.majorId == null) return
      counts[p.majorId] = (counts[p.majorId] ?? 0) + 1
    })
    if (!allPoints.some((p) => p.majorId != null) && majorId != null) counts[majorId] = points.length
    return counts
  }, [allPoints, points, majorId])

  const sortedMajors = useMemo(
    () => [...(majors.data?.data ?? [])].sort((a, b) => (majorCounts[b.id] ?? 0) - (majorCounts[a.id] ?? 0) || a.name.localeCompare(b.name, 'vi')),
    [majors.data, majorCounts],
  )
  const selectedMajor = sortedMajors.find((m) => m.id === majorId)

  const topHubs = useMemo(() => {
    const counts: Record<string, number> = {}
    points.forEach((p) => {
      const city = getHubCity(p.location, p.locationCity, p.locationCountry)
      counts[city] = (counts[city] || 0) + 1
    })
    return Object.entries(counts).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count)
  }, [points])

  const sel = useMemo(() => points.find((p) => String(p.userId) === selId) ?? null, [points, selId])

  const html = useMemo(() => buildAlumniMapHtml({ maptilerKey: process.env.EXPO_PUBLIC_MAPTILER_API_KEY }), [])
  const source = useMemo(() => ({ html, baseUrl: 'https://alumnect.local' }), [html])

  const send = useCallback((cmd: Record<string, unknown>) => web.current?.injectJavaScript(mapCommand(cmd)), [])

  // Đẩy dữ liệu + màu giao diện vào bản đồ mỗi khi đổi.
  useEffect(() => {
    if (!ready) return
    send({
      type: 'data',
      points: points.map((p) => ({ alumniId: String(p.userId), displayName: p.fullName, avatarUrl: p.avatarUrl, latitude: p.latitude, longitude: p.longitude })),
      center: points.length ? [points[0].longitude, points[0].latitude] : undefined,
      colors: { primary: t.primary, primarySoft: t.primaryTint, onPrimary: t.onPrimary, surface: t.card, border: t.border },
    })
  }, [ready, points, t, send])

  useEffect(() => {
    if (ready) send({ type: 'theme', theme: mapTheme })
  }, [ready, mapTheme, send])

  const onMessage = (e: WebViewMessageEvent) => {
    let m: { type?: string; id?: string | null; value?: boolean } | null = null
    try { m = JSON.parse(e.nativeEvent.data) } catch { return }
    if (m?.type === 'ready') { setReady(true); setWebFailed(false) }
    else if (m?.type === 'selected') setSelId(m.id ?? null)
    else if (m?.type === 'switching') setSwitching(!!m.value)
  }

  const choose = (id: string | null) => {
    setSelId(id)
    send({ type: 'select', id })
  }
  const changeMajor = (id: number | null) => {
    setMajorId(id)
    choose(null)
    setSheet('none')
  }
  const reload = () => {
    setReady(false)
    setWebFailed(false)
    setReloadKey((k) => k + 1)
  }

  const floating = { backgroundColor: t.card, shadowColor: '#000', shadowOpacity: t.isDark ? 0.5 : 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 } as const
  const city = (p: MapPoint) => p.location || UNDETERMINED

  return (
    <Screen>
      <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
        <PageHeader title="Bản đồ Alumni" subtitle="Khám phá mạng lưới cựu sinh viên FPTU trên toàn cầu" />
      </View>
      <View style={{ flex: 1 }}>
        <WebView
          key={reloadKey}
          ref={web}
          source={source}
          originWhitelist={['*']}
          onMessage={onMessage}
          onError={() => setWebFailed(true)}
          onHttpError={() => undefined}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          androidLayerType="hardware"
          overScrollMode="never"
          setSupportMultipleWindows={false}
          style={{ flex: 1, backgroundColor: t.surface }}
        />

        {/* Tìm kiếm + lọc ngành, nổi trên bản đồ (như bộ lọc nổi của web) */}
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 10, left: 12, right: 12, gap: 8 }}>
          <View style={[floating, { borderRadius: 16, padding: 4 }]}>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Tìm theo tên, công ty, vị trí..." />
          </View>
          <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={[floating, { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, padding: 5 }]}>
              <Pressable
                onPress={() => setSheet('major')}
                accessibilityRole="button"
                accessibilityLabel="Lọc theo ngành học"
                style={{ flexShrink: 1, minHeight: 36, maxWidth: 230, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: majorId ? t.action : t.inputBg }}
              >
                <GraduationCap size={16} color={majorId ? t.onAction : t.textMuted} />
                <Txt size={13} weight="700" numberOfLines={1} color={majorId ? t.onAction : t.textMuted} style={{ flexShrink: 1 }}>{selectedMajor ? selectedMajor.name : 'Tất cả chuyên ngành'}</Txt>
                <ChevronDown size={14} color={majorId ? t.onAction : t.textMuted} />
              </Pressable>
              <View style={{ minWidth: 30, paddingHorizontal: 7, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: t.inputBg }}>
                <Txt size={12} weight="800" color={t.textSubtle}>{points.length}</Txt>
              </View>
            </View>
            {switching ? (
              <View style={[floating, { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 }]}>
                <ActivityIndicator size="small" color={t.primary} />
                <Txt size={12} weight="600" muted>Đang tải bản đồ...</Txt>
              </View>
            ) : null}
          </View>
        </View>

        {(q.isLoading || !ready) && !q.isError && !webFailed ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
            <View style={[floating, { borderRadius: 14, padding: 14 }]}><ActivityIndicator color={t.primary} /></View>
          </View>
        ) : null}
        {q.isError || webFailed ? (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: t.card, justifyContent: 'center' }}>
            <Empty title="Lỗi tải dữ liệu" text="Không thể kết nối đến máy chủ." error={q.error} onRetry={() => { void q.refetch(); void all.refetch(); if (webFailed || !ready) reload() }} />
          </View>
        ) : null}
      </View>

      {/* Dải dưới: thẻ thông tin alumni được chọn, hoặc chủ đề bản đồ + danh sách */}
      <View style={{ backgroundColor: t.card, borderTopWidth: 1, borderTopColor: t.border, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, paddingTop: 12, paddingBottom: 12, gap: 10 }}>
        {sel ? (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Avatar uri={sel.avatarUrl} name={sel.fullName} size={60} />
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Txt weight="700" size={17} numberOfLines={1}>{sel.fullName}</Txt>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                  <Briefcase size={14} color={t.primary} style={{ marginTop: 3 }} />
                  <Txt muted size={13} style={{ flex: 1 }} numberOfLines={2}>
                    {sel.title || 'Chưa cập nhật vị trí'} tại <Txt weight="700" size={13}>{sel.company || 'Chưa cập nhật công ty'}</Txt>
                  </Txt>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} color={t.danger} />
                  <Txt muted size={12} style={{ flex: 1 }} numberOfLines={1}>{sel.location || 'Việt Nam'}{sel.cohort ? ` · K${sel.cohort}` : ''}</Txt>
                </View>
              </View>
              <Pressable onPress={() => choose(null)} accessibilityRole="button" accessibilityLabel="Đóng" hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.inputBg }}>
                <X size={16} color={t.textMuted} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Xem hồ sơ" size="sm" icon={<UserRound size={15} color={t.onAction} />} style={{ flex: 1 }} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(sel.userId) } })} />
              <Button title="Lộ trình sự nghiệp" size="sm" variant="outline" icon={<GraduationCap size={15} color={t.text} />} style={{ flex: 1 }} onPress={() => router.push({ pathname: '/career', params: { userId: String(sel.userId), name: sel.fullName } })} />
            </View>
          </View>
        ) : (
          <>
            <RNScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
              <Txt size={12} weight="800" color={t.textSubtle} style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Chủ đề:</Txt>
              {MAP_THEMES.map((entry) => {
                const active = mapTheme === entry.theme
                return (
                  <Pressable
                    key={entry.theme}
                    disabled={switching}
                    onPress={() => setMapTheme(entry.theme)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.action : t.inputBg, opacity: switching ? 0.6 : 1 }}
                  >
                    <Txt size={13} weight="700" color={active ? t.onAction : t.textMuted}>{entry.name}</Txt>
                  </Pressable>
                )
              })}
            </RNScrollView>
            <View style={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Txt size={13} weight="600" muted>{q.isLoading ? 'Đang tải...' : `${points.length} kết quả`}</Txt>
              <Button title="Danh sách & thành phố" size="sm" variant="outline" disabled={q.isLoading || q.isError} onPress={() => setSheet('list')} />
            </View>
          </>
        )}
      </View>

      {/* Chọn ngành (kèm số người, sắp theo số người giảm dần như web) */}
      <ActionSheet visible={sheet === 'major'} title="Lọc theo ngành học" onClose={() => setSheet('none')}>
        <View style={{ gap: 4 }}>
          {[{ id: null as number | null, name: 'Tất cả chuyên ngành', count: allPoints.length }, ...sortedMajors.map((m) => ({ id: m.id as number | null, name: m.name, count: majorCounts[m.id] ?? 0 }))].map((m) => {
            const active = majorId === m.id
            return (
              <Pressable key={String(m.id)} onPress={() => changeMajor(m.id)} accessibilityRole="radio" accessibilityState={{ checked: active }} style={({ pressed }) => ({ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, borderRadius: 12, backgroundColor: active ? t.primaryTint : pressed ? t.inputBg : 'transparent' })}>
                <View style={{ minWidth: 30, height: 28, paddingHorizontal: 7, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.card : t.inputBg }}>
                  <Txt size={12} weight="800" color={active ? t.primary : t.textSubtle}>{m.count}</Txt>
                </View>
                <Txt style={{ flex: 1 }} weight={active || m.id == null ? '700' : '500'} color={active ? t.primary : t.text}>{m.name}</Txt>
                {active ? <Check size={16} color={t.primary} /> : null}
              </Pressable>
            )
          })}
          {majors.isError ? <Button title="Thử tải lại ngành" variant="ghost" onPress={() => void majors.refetch()} /> : null}
        </View>
      </ActionSheet>

      {/* Danh sách alumni + thành phố tập trung */}
      <ActionSheet visible={sheet === 'list'} title="Danh sách Alumni" onClose={() => setSheet('none')}>
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([['alumni', `Danh sách · ${points.length}`], ['hubs', 'Thành phố tập trung']] as const).map(([k, label]) => (
              <Pressable key={k} onPress={() => setListTab(k)} accessibilityRole="tab" accessibilityState={{ selected: listTab === k }} style={{ flex: 1, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: listTab === k ? t.action : t.inputBg }}>
                <Txt size={13} weight="700" color={listTab === k ? t.onAction : t.textMuted}>{label}</Txt>
              </Pressable>
            ))}
          </View>
          {listTab === 'alumni' ? (
            points.length ? points.map((p) => {
              const active = String(p.userId) === selId
              return (
                <Pressable key={p.userId} onPress={() => { setSheet('none'); choose(String(p.userId)) }} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: active ? t.primary : 'transparent', backgroundColor: active ? t.primaryTint : pressed ? t.inputBg : 'transparent' })}>
                  <Avatar uri={p.avatarUrl} name={p.fullName} size={40} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt weight="700" size={14} numberOfLines={1}>{p.fullName}</Txt>
                    <Txt muted size={12} numberOfLines={1}>{p.title} @ {p.company}</Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <MapPin size={11} color={t.primary} />
                      <Txt size={12} weight="600" color={t.textSubtle} numberOfLines={1} style={{ flexShrink: 1 }}>{city(p)}</Txt>
                      {p.cohort ? <Txt size={12} weight="600" color={t.textSubtle}>• K{p.cohort}</Txt> : null}
                    </View>
                  </View>
                </Pressable>
              )
            }) : <Txt muted style={{ textAlign: 'center', paddingVertical: 24 }}>Không tìm thấy alumni nào khớp với từ khóa.</Txt>
          ) : (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Txt weight="700" size={14}>Thành phố tập trung</Txt>
                <Tag label="Trực tiếp" tone="info" />
              </View>
              {topHubs.length ? topHubs.map((h, i) => {
                const pct = points.length ? (h.count / points.length) * 100 : 0
                return (
                  <View key={h.city} style={{ gap: 5 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: t.inputBg }}>
                        <Txt size={12} weight="800" color={t.textSubtle}>{i + 1}</Txt>
                      </View>
                      <Txt size={13} weight="600" style={{ flex: 1 }} numberOfLines={1}>{h.city}</Txt>
                      <Txt size={13} weight="700" color={t.primary}>{h.count} người</Txt>
                    </View>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: t.inputBg, overflow: 'hidden' }}>
                      <View style={{ height: 6, borderRadius: 3, width: `${pct}%`, backgroundColor: t.primary }} />
                    </View>
                  </View>
                )
              }) : <Txt muted style={{ textAlign: 'center', paddingVertical: 24 }}>Chưa có dữ liệu</Txt>}
            </View>
          )}
        </View>
      </ActionSheet>
    </Screen>
  )
}

