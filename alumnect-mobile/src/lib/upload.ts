import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system/legacy'
import { Platform } from 'react-native'
import http from './http'
import type { ApiResponse } from './http'

export type PickedImage = { uri: string; name: string; type: string; width?: number }

export type PickedVideo = {
  uri: string
  name: string
  mimeType: string
  size?: number
  duration?: number | null
}

/** Kiểm tra xem một đường dẫn URL có phải là video hay không dựa trên đuôi tệp. */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false
  return /\.(mp4|mov|avi|webm|mkv|m4v|3gp)(\?.*)?$/i.test(url)
}

/** Tải nhị phân (Binary) tệp trực tiếp lên Presigned URL (hỗ trợ cả mobile native stream và web blob). */
async function uploadBinaryToSignedUrl(uploadUrl: string, fileUri: string, contentType: string) {
  if (Platform.OS === 'web') {
    const read = await fetch(fileUri)
    const blob = await read.blob()
    const put = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType } })
    if (!put.ok) {
      if (__DEV__) console.warn('[uploadBinaryToSignedUrl:web] PUT failed', put.status, await put.text().catch(() => ''))
      throw new Error(`Tải tệp lên thất bại (${put.status}). Vui lòng thử lại.`)
    }
    return
  }

  // Trên Android / iOS: Dùng Native FileSystem Upload binary stream trực tiếp từ content:// hoặc file://
  // Tránh lỗi fetch() đọc ra text "File not found" (14 bytes) và tránh ngốn RAM khi chuyển qua base64.
  const res = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'Content-Type': contentType,
    },
  })
  if (res.status < 200 || res.status >= 300) {
    if (__DEV__) console.warn('[uploadBinaryToSignedUrl:native] PUT failed', res.status, res.body)
    throw new Error(`Tải tệp lên thất bại (${res.status}). Vui lòng thử lại.`)
  }
}

/** Upload an original document/video without converting its bytes to an image. */
export async function uploadFile(file: { uri: string; name: string; mimeType?: string | null; size?: number }, folder = 'messages') {
  const contentType = file.mimeType?.trim().toLowerCase() || 'application/octet-stream'
  const signed = await http.get<unknown, ApiResponse<{ uploadUrl: string; publicUrl: string }>>('/files/presigned-url', { params: { fileName: file.name, contentType, folder } })
  await uploadBinaryToSignedUrl(signed.data.uploadUrl, file.uri, contentType)
  return { url: signed.data.publicUrl, fileName: file.name, fileSize: file.size ?? 0 }
}

/** Chọn ảnh từ thư viện (đăng bài, avatar, bằng chứng...). */
export async function pickImage(multiple = false): Promise<PickedImage[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    quality: 1,
  })
  if (res.canceled) return []
  return res.assets.map((a, i) => ({
    uri: a.uri,
    name: a.fileName ?? `image-${Date.now()}-${i}.jpg`,
    type: 'image/jpeg',
    width: a.width,
  }))
}

const MAX_WIDTH = 1440

/** Nén ảnh (rộng tối đa 1440px, không phóng to ảnh nhỏ, JPEG 0.8) → xin presigned URL → PUT thẳng lên R2 → trả publicUrl. */
export async function uploadImage(
  img: PickedImage,
  folder: 'posts' | 'avatars' | 'evidence' | 'proofs' | 'common' = 'common',
): Promise<string> {
  const manip = await ImageManipulator.manipulateAsync(img.uri, img.width && img.width <= MAX_WIDTH ? [] : [{ resize: { width: MAX_WIDTH } }], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  })
  const name = img.name.replace(/\.[^.]+$/, '') + '.jpg'
  const res = await http.get<unknown, ApiResponse<{ uploadUrl: string; publicUrl: string }>>('/files/presigned-url', {
    params: { fileName: name, contentType: 'image/jpeg', folder },
  })
  const { uploadUrl, publicUrl } = res.data
  await uploadBinaryToSignedUrl(uploadUrl, manip.uri, 'image/jpeg')
  return publicUrl
}

/** Chọn video từ thư viện (đăng bài, bằng chứng...). */
export async function pickVideo(multiple = false): Promise<PickedVideo[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsMultipleSelection: multiple,
    quality: 1,
  })
  if (res.canceled) return []
  return res.assets.map((a, i) => {
    const ext = a.fileName?.split('.').pop()?.toLowerCase() || (a.uri.endsWith('.mov') ? 'mov' : 'mp4')
    const mimeType = a.mimeType || (ext === 'mov' ? 'video/quicktime' : 'video/mp4')
    let baseName = a.fileName ?? `video-${Date.now()}-${i}.${ext}`
    if (!baseName.toLowerCase().endsWith(`.${ext}`)) {
      baseName = `${baseName}.${ext}`
    }
    return {
      uri: a.uri,
      name: baseName,
      mimeType,
      size: a.fileSize,
      duration: a.duration,
    }
  })
}

/** Tải video lên Cloudflare R2 bucket. */
export async function uploadVideo(
  video: PickedVideo,
  folder: 'posts' | 'evidence' | 'proofs' | 'common' = 'posts',
): Promise<string> {
  const result = await uploadFile(video, folder)
  return result.url
}
