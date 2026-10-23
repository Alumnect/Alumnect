import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import http from './http'
import type { ApiResponse } from './http'

export type PickedImage = { uri: string; name: string; type: string; width?: number }

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
  const blob = await (await fetch(manip.uri)).blob()
  const put = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } })
  if (!put.ok) throw new Error('Tải ảnh lên thất bại. Vui lòng thử lại.')
  return publicUrl
}
