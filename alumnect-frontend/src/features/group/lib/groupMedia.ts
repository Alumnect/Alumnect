const MAX_MEDIA = 10

/** Cùng giới hạn video 1 phút với bài viết ở bảng tin. */
function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Không thể đọc tệp video.'))
    }
    video.src = objectUrl
  })
}

export async function validateGroupMedia(files: File[], currentCount: number): Promise<void> {
  if (currentCount + files.length > MAX_MEDIA) {
    throw new Error('Mỗi bài viết chỉ được đính kèm tối đa 10 ảnh hoặc video.')
  }
  if (files.some((file) => !file.type.startsWith('image/') && !file.type.startsWith('video/'))) {
    throw new Error('Chỉ hỗ trợ tệp ảnh hoặc video.')
  }
  for (const file of files) {
    if (!file.type.startsWith('video/')) continue
    const duration = await readVideoDuration(file)
    if (!Number.isFinite(duration) || duration > 60) {
      throw new Error('Video không được vượt quá 1 phút.')
    }
  }
}
