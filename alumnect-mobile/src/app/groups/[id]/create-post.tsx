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
import { WebView as RNWebView } from 'react-native-webview'
import { ImagePlus, Play, Users, Video, X } from '@/components/icons'
import { BrandIcon } from '@/components/BrandIcon'
import { Avatar, Chip, Empty, Loading, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { withGroupsAlumniOnly } from '@/components/GroupsAlumniOnly'
import { GROUP_MEDIA_MAX, GROUP_POST_MAX, GROUP_VIDEO_MAX_SECONDS, groupApi } from '@/api/groups'
import { pickImage, pickVideo, runConcurrentPool, uploadFile, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import { radius, useTheme } from '@/theme'
import { MediaPreviewModal, type MediaPreviewItem } from '@/components/MediaPreviewModal'

const WebView = RNWebView as unknown as React.ComponentType<any>

function VideoPreviewTile({ uri }: { uri: string }) {
  const safe = uri.replace(/"/g, '&quot;')
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#090d16;overflow:hidden;display:flex;align-items:center;justify-content:center}video{width:100%;height:100%;object-fit:cover;background:#000}</style></head><body><video src="${safe}#t=0.01" muted playsinline webkit-playsinline autoplay loop></video></body></html>`
  return (
    <View style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#090d16' }}>
      <WebView
        source={{ html }}
        originWhitelist={['*']}
        pointerEvents="none"
        style={{ width: '100%', height: '100%', backgroundColor: '#090d16' }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        javaScriptEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Play size={14} color="#fff" weight="fill" style={{ marginLeft: 2 }} />
        </View>
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          backgroundColor: 'rgba(0,0,0,0.75)',
          paddingHorizontal: 5,
          paddingVertical: 1,
          borderRadius: 4,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>VIDEO</Text>
      </View>
    </View>
  )
}

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
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({})
  const [previewMedia, setPreviewMedia] = useState<MediaPreviewItem | null>(null)
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
    const toUpload = picked.slice(0, remaining)
    let addedCount = 0

    await runConcurrentPool(
      toUpload,
      async (p) => {
        const url = await uploadImage(p, 'posts')
        return { url, uri: p.uri, name: p.name }
      },
      {
        concurrency: 2,
        onSuccess: ({ url, uri }) => {
          setPreviewMap((prev) => ({ ...prev, [url]: uri }))
          setImages((x) => [...x, url])
          addedCount++
        },
        onError: (err, p) => {
          toast.error(`${p.name}: ${errMsg(err)}`)
        },
      }
    )

    setUploading(false)
    if (addedCount > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    }
  }

  const addVideos = async () => {
    const remaining = GROUP_MEDIA_MAX - mediaCount
    if (remaining <= 0) { toast.error('Mỗi bài viết chỉ được đính kèm tối đa 10 ảnh hoặc video.'); return }
    const picked = await pickVideo(true)
    if (!picked.length) return
    const tooLong = picked.find((v) => (v.duration ?? 0) / 1000 > GROUP_VIDEO_MAX_SECONDS)
    if (tooLong) { toast.error('Video không được vượt quá 1 phút.'); return }
    if (picked.length > remaining) toast.error(`Chỉ thêm được ${remaining} tệp nữa, các tệp còn lại đã bị bỏ qua.`)
    setUploading(true)
    const toUpload = picked.slice(0, remaining)
    let addedCount = 0

    await runConcurrentPool(
      toUpload,
      async (v) => {
        const uploaded = await uploadFile({ uri: v.uri, name: v.name, mimeType: v.mimeType, size: v.size }, 'group-posts')
        return { url: uploaded.url, uri: v.uri, name: v.name }
      },
      {
        concurrency: 2,
        onSuccess: ({ url, uri }) => {
          setPreviewMap((prev) => ({ ...prev, [url]: uri }))
          setVideos((x) => [...x, url])
          addedCount++
        },
        onError: (err, v) => {
          toast.error(`${v.name}: ${errMsg(err)}`)
        },
      }
    )

    setUploading(false)
    if (addedCount > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
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

  const tile = (kind: 'image' | 'video', url: string, idx: number) => {
    const displayUri = previewMap[url] || url
    return (
      <View
        key={`${kind}-${url}`}
        style={{
          width: 100,
          height: 100,
          borderRadius: radius.md,
          overflow: 'hidden',
          position: 'relative',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
          backgroundColor: kind === 'video' ? '#090d16' : theme.inputBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Pressable
          onPress={() =>
            setPreviewMedia({
              url: displayUri,
              mediaType: kind === 'video' ? 'VIDEO' : 'IMAGE',
              title: `Tệp ${idx + 1}`,
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Xem trước ${kind === 'image' ? 'ảnh' : 'video'} ${idx + 1}`}
          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          {kind === 'image' ? (
            <Image source={{ uri: displayUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <VideoPreviewTile uri={displayUri} />
          )}
        </Pressable>
        <Pressable
          onPress={() => removeMedia(kind, url)}
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
            zIndex: 2,
          })}
          accessibilityRole="button"
          accessibilityLabel={kind === 'image' ? 'Xóa ảnh' : 'Xóa video'}
        >
          <X size={14} color="#fff" />
        </Pressable>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: radius.sm,
            zIndex: 2,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{idx + 1}</Text>
        </View>
      </View>
    )
  }

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
                  <View style={{ width: 100, height: 100, borderRadius: radius.md, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '500' }}>Đang tải lên...</Text>
                  </View>
                ) : null}
              </ScrollView>
            ) : (
              <View style={{ marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center' }}>
                  {uploading ? <ActivityIndicator size="small" color={theme.primary} /> : <ImagePlus size={20} color={theme.primary} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    {uploading ? 'Đang tải lên...' : 'Đính kèm ảnh hoặc video'}
                  </Text>
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
      <MediaPreviewModal media={previewMedia} onClose={() => setPreviewMedia(null)} />
    </Screen>
  )
}

export default withGroupsAlumniOnly(GroupPostFormScreen)
