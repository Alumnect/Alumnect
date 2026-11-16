import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system/legacy'
import { Platform } from 'react-native'
import http from './http'
import type { ApiResponse } from './http'

export type PickedImage = {
  uri: string
  name: string
  type?: string
  mimeType?: string
  width?: number
  height?: number
}

export type PickedVideo = {
  uri: string
  name: string
  mimeType: string
  size?: number
  duration?: number | null
}

export type PickedChatMedia = {
  uri: string
  name: string
  mimeType: string
  kind: 'IMAGE' | 'VIDEO'
  size?: number
  duration?: number | null
  width?: number
  height?: number
}

/** Kiểm tra xem một đường dẫn URL có phải là video hay không dựa trên đuôi tệp. */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false
  return /\.(mp4|mov|avi|webm|mkv|m4v|3gp)(\?.*)?$/i.test(url)
}

/** Đoán MIME Type dựa theo tên tệp hoặc fallback */
export function inferMimeType(fileName: string, fallback?: string | null): string {
  if (fallback && fallback.trim()) return fallback.trim().toLowerCase()
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'mp4':
    case 'm4v':
      return 'video/mp4'
    case 'mov':
      return 'video/quicktime'
    case 'webm':
      return 'video/webm'
    case 'pdf':
      return 'application/pdf'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'txt':
    case 'md':
      return 'text/plain'
    default:
      return 'application/octet-stream'
  }
}

function isInsideExpoSandboxedDir(uri: string): boolean {
  if (FileSystem.cacheDirectory && uri.startsWith(FileSystem.cacheDirectory)) return true
  if (FileSystem.documentDirectory && uri.startsWith(FileSystem.documentDirectory)) return true
  return false
}

/** Đảm bảo URI có thể truy cập được bởi Native FileSystem (sao chép tạm content:// hoặc tệp ngoài sandbox sang cache file://) */
async function ensureLocalFileUri(uri: string, fileName?: string): Promise<{ localUri: string; isTemp: boolean }> {
  if (Platform.OS === 'web' || isInsideExpoSandboxedDir(uri)) {
    return { localUri: uri, isTemp: false }
  }

  let ext = fileName?.split('.').pop()?.toLowerCase()
  if (!ext || ext.length > 5 || ext === fileName?.toLowerCase()) {
    ext = uri.endsWith('.mov') ? 'mov' : 'tmp'
  }

  const baseDir = FileSystem.cacheDirectory || ''
  const dir = baseDir.endsWith('/') ? baseDir : `${baseDir}/`
  const target = `${dir}upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`

  try {
    await FileSystem.copyAsync({ from: uri, to: target })
    return { localUri: target, isTemp: true }
  } catch (err) {
    if (__DEV__) console.warn('[ensureLocalFileUri] copyAsync failed, trying blob-to-cache bridge:', err)
    try {
      const response = await fetch(uri)
      const blob = await response.blob()
      const base64 = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => {
          const res = (fr.result as string) || ''
          const b64 = res.includes(',') ? res.split(',')[1] : res
          resolve(b64)
        }
        fr.onerror = reject
        fr.readAsDataURL(blob)
      })
      await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 })
      return { localUri: target, isTemp: true }
    } catch (bridgeErr) {
      if (__DEV__) console.warn('[ensureLocalFileUri] blob-to-cache bridge failed:', bridgeErr)
      return { localUri: uri, isTemp: false }
    }
  }
}

/** Tải nhị phân (Binary) tệp trực tiếp lên Presigned URL (hỗ trợ cả mobile native stream và web blob). */
async function uploadBinaryToSignedUrl(uploadUrl: string, fileUri: string, contentType: string, fileName?: string) {
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

  const { localUri, isTemp } = await ensureLocalFileUri(fileUri, fileName)

  try {
    const res = await FileSystem.uploadAsync(uploadUrl, localUri, {
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
  } catch (nativeErr) {
    if (__DEV__) console.warn('[uploadBinaryToSignedUrl] uploadAsync failed, trying fetch fallback:', nativeErr)
    try {
      const read = await fetch(localUri)
      const blob = await read.blob()
      const put = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType } })
      if (!put.ok) {
        throw new Error(`Tải tệp lên thất bại (${put.status}). Vui lòng thử lại.`)
      }
    } catch {
      throw nativeErr instanceof Error ? nativeErr : new Error('Tải tệp lên thất bại. Vui lòng thử lại.')
    }
  } finally {
    if (isTemp) {
      FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {})
    }
  }
}

/** Upload an original document/video without converting its bytes to an image. */
export async function uploadFile(
  file: { uri: string; name: string; mimeType?: string | null; size?: number },
  folder = 'messages',
) {
  let name = file.name || `file-${Date.now()}`
  if (!name.includes('.')) {
    const rawExt = file.mimeType?.includes('/') ? file.mimeType.split('/').pop()?.replace('jpeg', 'jpg') : 'bin'
    const ext = rawExt && rawExt.length <= 5 ? rawExt : 'bin'
    name = `${name}.${ext}`
  }
  const contentType = inferMimeType(name, file.mimeType)
  const signed = await http.get<unknown, ApiResponse<{ uploadUrl: string; publicUrl: string }>>('/files/presigned-url', {
    params: { fileName: name, contentType, folder },
  })
  await uploadBinaryToSignedUrl(signed.data.uploadUrl, file.uri, contentType, name)
  return { url: signed.data.publicUrl, fileName: name, fileSize: file.size ?? 0 }
}

/** Chọn ảnh từ thư viện (đăng bài, avatar, bằng chứng...). */
export async function pickImage(multiple = false): Promise<PickedImage[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    quality: 1,
  })
  if (res.canceled) return []
  return res.assets.map((a, i) => {
    let ext = a.fileName?.split('.').pop()?.toLowerCase() || 'jpg'
    let baseName = a.fileName ?? `image-${Date.now()}-${i}.${ext}`
    if (!baseName.toLowerCase().endsWith(`.${ext}`)) {
      baseName = `${baseName}.${ext}`
    }
    return {
      uri: a.uri,
      name: baseName,
      type: 'image/jpeg',
      mimeType: a.mimeType || 'image/jpeg',
      width: a.width,
      height: a.height,
    }
  })
}

const MAX_WIDTH = 1440

/** Nén ảnh (rộng tối đa 1440px, JPEG 0.8) → xin presigned URL → PUT thẳng lên R2 → trả publicUrl. */
export async function uploadImage(
  img: PickedImage,
  folder: 'posts' | 'avatars' | 'evidence' | 'proofs' | 'common' | 'messages' = 'common',
): Promise<string> {
  const manip = await ImageManipulator.manipulateAsync(
    img.uri,
    img.width && img.width <= MAX_WIDTH ? [] : [{ resize: { width: MAX_WIDTH } }],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  )
  const name = img.name.replace(/\.[^.]+$/, '') + '.jpg'
  const res = await http.get<unknown, ApiResponse<{ uploadUrl: string; publicUrl: string }>>('/files/presigned-url', {
    params: { fileName: name, contentType: 'image/jpeg', folder },
  })
  const { uploadUrl, publicUrl } = res.data
  await uploadBinaryToSignedUrl(uploadUrl, manip.uri, 'image/jpeg', name)
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
    let ext = a.fileName?.split('.').pop()?.toLowerCase()
    if (!ext || ext.length > 5 || ext === a.fileName?.toLowerCase()) {
      ext = a.uri.endsWith('.mov') ? 'mov' : 'mp4'
    }
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
  video: PickedVideo | { uri: string; name: string; mimeType?: string | null; size?: number },
  folder: 'posts' | 'evidence' | 'proofs' | 'common' | 'messages' = 'posts',
): Promise<string> {
  const result = await uploadFile(video, folder)
  return result.url
}

/** Chọn ảnh hoặc video từ thư viện phục vụ chat/nhắn tin. */
export async function pickChatMedia(multiple = true): Promise<PickedChatMedia[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: multiple,
    quality: 1,
  })
  if (res.canceled) return []
  return res.assets.map((a, i) => {
    const isVideo = a.type === 'video'
    let ext = a.fileName?.split('.').pop()?.toLowerCase()
    if (!ext || ext.length > 5 || ext === a.fileName?.toLowerCase()) {
      ext = isVideo ? (a.uri.endsWith('.mov') ? 'mov' : 'mp4') : 'jpg'
    }
    let baseName = a.fileName ?? `${isVideo ? 'video' : 'image'}-${Date.now()}-${i}.${ext}`
    if (!baseName.toLowerCase().endsWith(`.${ext}`)) {
      baseName = `${baseName}.${ext}`
    }
    const defaultMime = isVideo
      ? ext === 'mov' ? 'video/quicktime' : 'video/mp4'
      : ext === 'png' ? 'image/png' : 'image/jpeg'
    const mimeType = a.mimeType || defaultMime
    return {
      uri: a.uri,
      name: baseName,
      mimeType,
      kind: isVideo ? 'VIDEO' : 'IMAGE',
      size: a.fileSize,
      duration: a.duration,
      width: a.width,
      height: a.height,
    }
  })
}
