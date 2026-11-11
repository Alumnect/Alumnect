import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Text, TextInput } from '@/components/AppText'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Users, X } from '@/components/icons'
import { BrandIcon } from '@/components/BrandIcon'
import { Avatar, Button, Empty, Input, Loading, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { groupApi } from '@/api/groups'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import { radius, useTheme } from '@/theme'

/** UC125: đăng / sửa bài viết trong nhóm (truyền `postId` để sửa). */
export default function GroupPostFormScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const theme = useTheme()
  const { user } = useAuthStore()

  const { id, postId } = useLocalSearchParams<{ id: string; postId?: string }>()
  const gid = Number(id)
  const existing = useQuery({
    queryKey: ['group-post', gid, Number(postId)],
    queryFn: () => groupApi.post(gid, Number(postId)),
    enabled: !!postId,
  })

  const [content, setContent] = useState('')
  const [topic, setTopic] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  if (existing.data && !loaded) {
    setLoaded(true)
    setContent(existing.data.content)
    setTopic(existing.data.topic ?? '')
    setImages(existing.data.imageUrls ?? [])
  }

  const m = useMutation({
    mutationFn: () => {
      const p = { content: content.trim(), topic: topic.trim() || null, imageUrls: images }
      return postId ? groupApi.updatePost(gid, Number(postId), p) : groupApi.createPost(gid, p)
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      toast.success(postId ? 'Đã cập nhật bài viết.' : 'Đăng bài viết thành công!')
      qc.invalidateQueries({ queryKey: ['group-posts', gid] })
      qc.invalidateQueries({ queryKey: ['group-post', gid] })
      router.back()
    },
    onError: (e) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      toast.error(errMsg(e))
    },
  })

  const add = async () => {
    const picked = await pickImage(true)
    if (!picked.length) return
    setUploading(true)
    try {
      const remaining = 10 - images.length
      const urls = await Promise.all(
        picked.slice(0, remaining).map((p) => uploadImage(p, 'posts'))
      )
      setImages((x) => [...x, ...urls])
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    setImages((x) => x.filter((i) => i !== url))
  }

  const submit = () => {
    if (!content.trim() && images.length === 0) {
      setError('Nội dung bài viết hoặc hình ảnh không được để trống')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
      return
    }
    setError('')
    m.mutate()
  }

  if (postId && existing.isLoading) {
    return (
      <Screen>
        <Header title="Sửa bài viết" />
        <Loading />
      </Screen>
    )
  }

  if (postId && !existing.data) {
    return (
      <Screen>
        <Header title="Sửa bài viết" />
        <Empty
          text="Không tìm thấy bài viết."
          error={existing.error}
          onRetry={() => {
            void existing.refetch()
          }}
        />
      </Screen>
    )
  }

  const isReadyToPost = (content.trim().length > 0 || images.length > 0) && !uploading && !m.isPending

  return (
    <Screen keyboard bg={theme.bg}>
      {/* 1. Header (Instagram & Kakao style): Nút đăng nổi bật ở góc phải */}
      <Header
        title={postId ? 'Sửa bài viết' : 'Đăng bài trong nhóm'}
        right={
          <Pressable
            onPress={submit}
            disabled={!isReadyToPost}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isReadyToPost ? theme.primary : theme.inputBg,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: radius.full,
              minHeight: 36,
              opacity: pressed ? 0.8 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel={postId ? 'Lưu thay đổi' : 'Đăng bài'}
          >
            {m.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={{
                  color: isReadyToPost ? '#fff' : theme.textSubtle,
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                {postId ? 'Lưu' : 'Đăng'}
              </Text>
            )}
          </Pressable>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Thông tin tác giả & Ngữ cảnh nhóm */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 10,
              backgroundColor: theme.card,
            }}
          >
            <Avatar uri={user?.avatarUrl} name={user?.name ?? 'Bạn'} size={44} ring />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                {user?.name ?? 'Bạn'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: theme.surface,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: radius.sm,
                  }}
                >
                  <Users size={12} color={theme.textMuted} />
                  <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '500' }}>
                    Bài viết nhóm #{gid}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3. Khung nhập nội dung bài viết không viền (Instagram style canvas) */}
          <View
            style={{
              backgroundColor: theme.card,
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 12,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.border,
            }}
          >
            <TextInput
              value={content}
              onChangeText={(text) => {
                setContent(text)
                if (error) setError('')
              }}
              multiline
              placeholder="Chia sẻ thảo luận, ý kiến hoặc kinh nghiệm với nhóm..."
              placeholderTextColor={theme.textSubtle}
              selectionColor={theme.primary}
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: theme.text,
                minHeight: 120,
                textAlignVertical: 'top',
                paddingTop: 4,
                paddingBottom: 12,
              }}
            />

            {error ? (
              <Text style={{ color: theme.danger, fontSize: 12, marginTop: 4 }}>{error}</Text>
            ) : null}
          </View>

          {/* 4. Bộ sưu tập hình ảnh đính kèm (Instagram carousel preview) */}
          <View
            style={{
              backgroundColor: theme.card,
              paddingVertical: 12,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.border,
            }}
          >
            {images.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              >
                {images.map((uri, idx) => (
                  <View
                    key={uri}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: radius.md,
                      overflow: 'hidden',
                      position: 'relative',
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: theme.border,
                    }}
                  >
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    <Pressable
                      onPress={() => removeImage(uri)}
                      style={({ pressed }) => ({
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      })}
                      accessibilityLabel="Xóa ảnh"
                    >
                      <X size={14} color="#fff" />
                    </Pressable>
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 4,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: radius.sm,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                        {idx + 1}
                      </Text>
                    </View>
                  </View>
                ))}

                {images.length < 10 && (
                  <Pressable
                    onPress={add}
                    disabled={uploading}
                    style={({ pressed }) => ({
                      width: 100,
                      height: 100,
                      borderRadius: radius.md,
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: theme.controlBorder,
                      backgroundColor: theme.inputBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <>
                        <ImagePlus size={24} color={theme.textMuted} />
                        <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textMuted }}>
                          Thêm ảnh
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.textSubtle }}>
                          {images.length}/10
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </ScrollView>
            ) : (
              <Pressable
                onPress={add}
                disabled={uploading}
                style={({ pressed }) => ({
                  marginHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: radius.md,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: theme.inputBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImagePlus size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    Đính kèm hình ảnh
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    Chia sẻ tài liệu, ảnh chụp hoạt động cùng nhóm
                  </Text>
                </View>
                {uploading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>
                    Chọn ảnh
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          {/* 5. Nhập chủ đề thảo luận (Meetup / Kakao card style) */}
          <View
            style={{
              margin: 16,
              padding: 16,
              borderRadius: radius.lg,
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <BrandIcon name="chat" size={24} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                  Chủ đề bài viết
                </Text>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  Giúp thành viên nhóm dễ dàng lọc và tìm kiếm
                </Text>
              </View>
            </View>
            <Input
              label="Chủ đề (tùy chọn)"
              value={topic}
              onChangeText={setTopic}
              placeholder="VD: Kinh nghiệm phỏng vấn, Tài liệu ôn thi..."
            />
          </View>

          {/* Nút gửi ở cuối trang */}
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <Button
              title={postId ? 'Lưu thay đổi' : 'Đăng bài viết'}
              loading={m.isPending}
              disabled={uploading || !isReadyToPost}
              onPress={submit}
              style={{ borderRadius: radius.full, minHeight: 48 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 6. Thanh công cụ phía dưới (Kakao & Instagram style sticky action bar) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: theme.card,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
        }}
      >
        <Pressable
          onPress={add}
          disabled={uploading || images.length >= 10}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: radius.full,
            backgroundColor: theme.inputBg,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ImagePlus size={18} color={theme.text} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
            {images.length > 0 ? `Ảnh (${images.length}/10)` : 'Thêm ảnh'}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <BrandIcon name="people" size={20} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted }}>
            Bài viết nhóm
          </Text>
        </View>
      </View>
    </Screen>
  )
}
