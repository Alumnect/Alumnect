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
import { ImagePlus, Users, Video, X } from '@/components/icons'
import { BrandIcon } from '@/components/BrandIcon'
import { Avatar, Chip, Empty, Loading, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { withGroupsAlumniOnly } from '@/components/GroupsAlumniOnly'
import { GROUP_MEDIA_MAX, GROUP_POST_MAX, GROUP_VIDEO_MAX_SECONDS, groupApi } from '@/api/groups'
import { pickImage, pickVideo, uploadFile, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import { radius, useTheme } from '@/theme'

/** UC125: đăng / sửa bài viết trong nhóm (truyền `postId` để sửa). Nội dung bắt buộc; chủ đề chọn từ danh sách chủ đề của nhóm. */
function GroupPostFormScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const theme = useTheme()
  const { user } = useAuthStore()

  const { id, postId } = useLocalSearchParams<{ id: string; postId?: string }>()
  const gid = Number(id)
  const group = useQuery({ queryKey: ['group', id], queryFn: () => groupApi.get(id!) })
  const topics = group.data?.topics ?? []
  const existing = useQuery({
    queryKey: ['group-post', gid, Number(postId)],
    queryFn: () => groupApi.post(gid, Number(postId)),
    enabled: !!postId,
  })

  const [content, setContent] = useState('')
  const [topic, setTopic] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  if (existing.data && !loaded) {
    setLoaded(true)
    setContent(existing.data.content)
    setTopic(existing.data.topic ?? null)
    setImages(existing.data.imageUrls ?? [])
    setVideos(existing.data.videoUrls ?? [])
  }

  const mediaCount = images.length + videos.length

  const m = useMutation({
    mutationFn: () => {
      const p = { content: content.trim(), topic, imageUrls: images, videoUrls: videos }
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

  const addImages = async () => {
    const remaining = GROUP_MEDIA_MAX - mediaCount
    if (remaining <= 0) { toast.error('Mỗi bài viết chỉ được đính kèm tối đa 10 ảnh hoặc video.'); return }
    const picked = await pickImage(true)
    if (!picked.length) return
    if (picked.length > remaining) toast.error(`Chỉ thêm được ${remaining} tệp nữa, các tệp còn lại đã bị bỏ qua.`)
    setUploading(true)
    try {
      const urls = await Promise.all(picked.slice(0, remaining).map((p) => uploadImage(p, 'posts')))
      setImages((x) => [...x, ...urls])
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const addVideos = async () => {
    const remaining = GROUP_MEDIA_MAX - mediaCount
    if (remaining <= 0) { toast.error('Mỗi bài viết chỉ được đính kèm tối đa 10 ảnh hoặc video.'); return }
    const picked = await pickVideo(true)
    if (!picked.length) return
    // expo-image-picker trả thời lượng theo mili giây
    const tooLong = picked.find((v) => (v.duration ?? 0) / 1000 > GROUP_VIDEO_MAX_SECONDS)
    if (tooLong) { toast.error('Video không được vượt quá 1 phút.'); return }
    if (picked.length > remaining) toast.error(`Chỉ thêm được ${remaining} tệp nữa, các tệp còn lại đã bị bỏ qua.`)
    setUploading(true)
    try {
      const urls = await Promise.all(
        picked.slice(0, remaining).map(async (v) => (await uploadFile({ uri: v.uri, name: v.name, mimeType: v.mimeType, size: v.size }, 'group-posts')).url),
      )
      setVideos((x) => [...x, ...urls])
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const removeMedia = (kind: 'image' | 'video', url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    if (kind === 'image') setImages((x) => x.filter((i) => i !== url))
    else setVideos((x) => x.filter((i) => i !== url))
  }

  const submit = () => {
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung bài viết')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
      return
    }
    if (content.trim().length > GROUP_POST_MAX) {
      setError(`Nội dung thảo luận không được vượt quá ${GROUP_POST_MAX} ký tự`)
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
        <Empty text="Không tìm thấy bài viết." error={existing.error} onRetry={() => { void existing.refetch() }} />
      </Screen>
    )
  }

  const isReadyToPost = content.trim().length > 0 && !uploading && !m.isPending

  const tile = (kind: 'image' | 'video', url: string, idx: number) => (
    <View
      key={`${kind}-${url}`}
      style={{ width: 100, height: 100, borderRadius: radius.md, overflow: 'hidden', position: 'relative', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center' }}
    >
      {kind === 'image' ? (
        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Video size={28} color={theme.primary} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textMuted }}>Video</Text>
        </View>
      )}
      <Pressable
        onPress={() => removeMedia(kind, url)}
        style={({ pressed }) => ({ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
        accessibilityRole="button"
        accessibilityLabel={kind === 'image' ? 'Xóa ảnh' : 'Xóa video'}
      >
        <X size={14} color="#fff" />
      </Pressable>
      <View style={{ position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm }}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{idx + 1}</Text>
      </View>
    </View>
  )

  return (
    <Screen keyboard bg={theme.bg}>
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
              minHeight: 44,
              opacity: pressed ? 0.8 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel={postId ? 'Lưu thay đổi' : 'Đăng bài'}
          >
            {m.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: isReadyToPost ? '#fff' : theme.textSubtle, fontSize: 14, fontWeight: '700' }}>
                {postId ? 'Lưu' : 'Đăng'}
              </Text>
            )}
          </Pressable>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Tác giả và nhóm đang đăng */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: theme.card }}>
            <Avatar uri={user?.avatarUrl} name={user?.name ?? 'Bạn'} size={44} ring />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{user?.name ?? 'Bạn'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm, maxWidth: '100%' }}>
                  <Users size={12} color={theme.textMuted} />
                  <Text numberOfLines={1} style={{ fontSize: 11, color: theme.textMuted, fontWeight: '500', flexShrink: 1 }}>
                    {group.data?.name ?? 'Hội nhóm'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Nội dung bài viết */}
          <View style={{ backgroundColor: theme.card, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }}>
            <TextInput
              value={content}
              onChangeText={(text) => { setContent(text); if (error) setError('') }}
              multiline
              maxLength={GROUP_POST_MAX}
              placeholder={`Bạn muốn chia sẻ điều gì với cộng đồng ${group.data?.name ?? 'nhóm'} hôm nay?`}
              placeholderTextColor={theme.textSubtle}
              selectionColor={theme.primary}
              accessibilityLabel="Nội dung bài viết"
              style={{ fontSize: 16, lineHeight: 24, color: theme.text, minHeight: 120, textAlignVertical: 'top', paddingTop: 4, paddingBottom: 12 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              {error ? <Text style={{ color: theme.danger, fontSize: 12, flex: 1 }}>{error}</Text> : <View style={{ flex: 1 }} />}
              <Text style={{ color: theme.textSubtle, fontSize: 12 }}>{`${content.length}/${GROUP_POST_MAX}`}</Text>
            </View>
          </View>

          {/* Ảnh và video đính kèm */}
          <View style={{ backgroundColor: theme.card, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }}>
            {mediaCount > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                {images.map((u, i) => tile('image', u, i))}
                {videos.map((u, i) => tile('video', u, images.length + i))}
                {uploading ? (
                  <View style={{ width: 100, height: 100, borderRadius: radius.md, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color={theme.primary} />
                  </View>
                ) : null}
              </ScrollView>
            ) : (
              <View style={{ marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center' }}>
                  {uploading ? <ActivityIndicator size="small" color={theme.primary} /> : <ImagePlus size={20} color={theme.primary} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Đính kèm ảnh hoặc video</Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Tối đa 10 tệp, mỗi video không quá 1 phút</Text>
                </View>
              </View>
            )}
          </View>

          {/* Chủ đề: chỉ chọn trong các chủ đề của nhóm */}
          {topics.length > 0 ? (
            <View style={{ margin: 16, padding: 16, borderRadius: radius.lg, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <BrandIcon name="chat" size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Chủ đề bài viết</Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Giúp thành viên nhóm dễ dàng lọc và tìm kiếm</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
                <Chip label="Không chọn" active={topic === null} onPress={() => setTopic(null)} />
                {topics.map((tp) => <Chip key={tp} label={`#${tp}`} active={topic === tp} onPress={() => setTopic(topic === tp ? null : tp)} />)}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Thanh công cụ phía dưới */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }}>
        <Pressable
          onPress={addImages}
          disabled={uploading || mediaCount >= GROUP_MEDIA_MAX}
          accessibilityRole="button"
          accessibilityLabel="Thêm ảnh"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 44, borderRadius: radius.full, backgroundColor: theme.inputBg, opacity: uploading || mediaCount >= GROUP_MEDIA_MAX ? 0.5 : pressed ? 0.7 : 1 })}
        >
          <ImagePlus size={18} color={theme.text} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>Ảnh</Text>
        </Pressable>
        <Pressable
          onPress={addVideos}
          disabled={uploading || mediaCount >= GROUP_MEDIA_MAX}
          accessibilityRole="button"
          accessibilityLabel="Thêm video"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 44, borderRadius: radius.full, backgroundColor: theme.inputBg, opacity: uploading || mediaCount >= GROUP_MEDIA_MAX ? 0.5 : pressed ? 0.7 : 1 })}
        >
          <Video size={18} color={theme.text} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>Video</Text>
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '600', color: theme.textMuted }}>{`${mediaCount}/${GROUP_MEDIA_MAX}`}</Text>
      </View>
    </Screen>
  )
}

export default withGroupsAlumniOnly(GroupPostFormScreen)
