import React from 'react'
import { Text, View } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function OfflineBanner() {
  const [offline, setOffline] = React.useState(false)
  const insets = useSafeAreaInsets()
  React.useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setOffline(s.isConnected === false || s.isInternetReachable === false))
    return unsub
  }, [])
  if (!offline) return null
  return (
    <View style={{ backgroundColor: '#DC2626', paddingTop: insets.top + 4, paddingBottom: 6, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Mất kết nối mạng. Đang hiển thị dữ liệu đã lưu.</Text>
    </View>
  )
}
