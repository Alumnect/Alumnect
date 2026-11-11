import React, { useMemo, useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Pressable, StyleSheet, View } from 'react-native'
import { Avatar, Empty, Loading, Screen, Txt, SearchBar } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { chatApi, convAvatar, convName } from '@/api/chat'
import { messagePreview } from '@/lib/share'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { ChevronRight } from '@/components/icons'

/** Tin nhắn Mentoring: danh sách hội thoại theo từng yêu cầu / task (KakaoTalk Chat List 2026 — Cam - Trắng - Đen). */
export default function MentoringMessagesScreen() {
  const { colors, viridian, isDark } = useMentoringTheme()
  const router = useRouter()
  const [kw, setKw] = useState('')
  const q = useQuery({
    queryKey: ['conversations', 'mentoring'],
    queryFn: () => chatApi.conversations('primary', 'MENTORING'),
  })
  const items = useMemo(() => {
    const all = q.data?.data ?? []
    const k = kw.trim().toLowerCase()
    return k ? all.filter((c) => convName(c).toLowerCase().includes(k)) : all
  }, [q.data, kw])

  return (
    <Screen bg={colors.bg}>
      <Header title="Tin nhắn Cố vấn" subtitle="Hội thoại trao đổi & thương lượng thỏa thuận" />
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm Mentor hoặc học viên..." />
      </View>

      {q.isLoading ? (
        <Loading />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ paddingVertical: 12 }}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={
            <Empty
              error={q.error}
              onRetry={() => { void q.refetch() }}
              icon={<BrandIcon name="chat" size={56} />}
              title={kw ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có hội thoại Cố vấn'}
              text={
                kw
                  ? 'Thử nhập từ khóa khác.'
                  : 'Phòng chat sẽ được mở tự động khi một yêu cầu Cố vấn được Mentor chấp nhận.'
              }
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => item.id != null && router.push({ pathname: '/chat/[id]', params: { id: String(item.id) } })}
              style={({ pressed }) => [
                styles.chatCard,
                {
                  backgroundColor: pressed ? (isDark ? '#222222' : '#FAFAFB') : colors.card,
                  borderColor: item.unreadCount > 0 ? viridian : colors.border,
                },
              ]}
            >
              <Avatar uri={convAvatar(item)} name={convName(item)} size={48} ring={item.unreadCount > 0} />
              <View style={{ flex: 1 }}>
                <Txt weight="800" size={15} style={{ color: colors.text }} numberOfLines={1}>
                  {convName(item)}
                </Txt>
                <Txt
                  size={13}
                  weight={item.unreadCount > 0 ? '700' : '400'}
                  style={{ color: item.unreadCount > 0 ? colors.text : colors.textSecondary, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {messagePreview(item.lastMessage) || 'Bắt đầu trao đổi Mentoring'}
                </Txt>
              </View>
              {item.unreadCount > 0 ? (
                <View style={[styles.unreadBadge, { backgroundColor: viridian }]}>
                  <Txt size={11} weight="800" color="#FFFFFF">
                    {item.unreadCount}
                  </Txt>
                </View>
              ) : (
                <ChevronRight size={16} color={colors.textTertiary} />
              )}
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
