import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { postApi, COMMENTS_PAGE_SIZE } from '../api/postApi'
import type { CommentsPageResult } from '../model/comment'
import type { Post } from '@/features/feed'

/**
 * Hook đăng bình luận trên một bài viết (UC18 - Comment on a post).
 *
 * Sau khi đăng thành công, cập nhật cache TanStack Query ngay (không refetch từ đầu):
 *  - Luồng bình luận sắp xếp cũ→mới, nên bình luận vừa tạo thuộc trang CUỐI — chèn thẳng
 *    vào cuối danh sách đang hiển thị để người dùng thấy ngay (nếu đã tải hết các trang).
 *  - Tăng bộ đếm bình luận trong cache chi tiết bài viết để tiêu đề "Bình luận · N" đồng bộ.
 *
 * @param postId ID bài viết được bình luận
 * @return Đối tượng mutation nhận `{ content, parentId? }`
 */
export function useCreateComment(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      postApi.createComment(postId, content, parentId),
    onSuccess: (newComment) => {
      // 1) Chèn bình luận mới vào cuối luồng — CHỈ khi trang cuối đã tải chính là trang cuối thật.
      //    Nếu còn trang chưa tải (last.hasMore), bình luận mới (mới nhất, thứ tự cũ→mới) thuộc
      //    trang cuối chưa tải: không chèn để tránh sai thứ tự và tránh trùng khi người dùng "Xem thêm"
      //    (server đã có bình luận đó). Số đếm vẫn tăng ở bước (2) nên tiêu đề luôn đúng.
      qc.setQueryData<InfiniteData<CommentsPageResult>>(['post-comments', postId], (old) => {
        if (!old || old.pages.length === 0) return old
        const lastIdx = old.pages.length - 1
        const last = old.pages[lastIdx]
        if (last.hasMore) return old
        // Tránh trùng trên toàn bộ trang đã tải.
        if (old.pages.some((pg) => pg.items.some((c) => c.id === newComment.id))) return old

        const pages = old.pages.slice()
        if (last.items.length >= COMMENTS_PAGE_SIZE) {
          // Trang cuối đã đầy → thêm TRANG MỚI (giữ mỗi trang đúng ≤ size, khớp ranh giới server).
          // Nếu phình trang cuối thành >size, refetch sau này sẽ đẩy bình luận mới ra trang chưa tải.
          pages.push({ items: [newComment], page: last.page + 1, hasMore: false })
          return { ...old, pages, pageParams: [...old.pageParams, last.page + 1] }
        }
        pages[lastIdx] = { ...last, items: [...last.items, newComment] }
        return { ...old, pages }
      })

      // 2) Tăng số đếm bình luận trong cache chi tiết bài viết (tiêu đề & thanh số liệu).
      qc.setQueryData<Post>(['post', postId], (old) =>
        old ? { ...old, comments: old.comments + 1 } : old,
      )
    },
  })
}
