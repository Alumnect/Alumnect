import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { forumApi } from '../api/forumApi'
import type { CreateAnswerInput, UpdateAnswerInput } from '../model/answer'

/**
 * Hook lấy danh sách câu trả lời của một câu hỏi (UC41 - Answer a question) theo phân trang vô hạn.
 * Ai cũng xem được (Guest/Student/Alumni) vì câu trả lời dưới câu hỏi ACTIVE là công khai.
 * @param questionId ID câu hỏi (undefined khi chưa có → không gọi API)
 * @return Đối tượng query (pages, isLoading, isError, fetchNextPage, hasNextPage...)
 */
export function useAnswers(questionId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['answers', questionId],
    queryFn: ({ pageParam }) => forumApi.getAnswers({ questionId: questionId as string, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: !!questionId,
  })
}

/**
 * Hook gửi một câu trả lời mới (UC41). Khi thành công, làm mới cache danh sách câu trả lời
 * (['answers', id]) để câu vừa gửi xuất hiện, và làm mới chi tiết câu hỏi (['question', id])
 * để cập nhật số câu trả lời.
 * @param questionId ID câu hỏi được trả lời
 * @return Đối tượng mutation (mutate, isPending, error...)
 */
export function useCreateAnswer(questionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ input, parentId }: { input: CreateAnswerInput; parentId?: string | null }) =>
      forumApi.createAnswer({ questionId, input, parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', questionId] })
      queryClient.invalidateQueries({ queryKey: ['question', questionId] })
    },
  })
}

/**
 * Hook chỉnh sửa một câu trả lời (UC48 - Edit an answer). Khi thành công làm mới danh sách câu trả lời
 * (['answers', id]) để hiển thị nội dung mới.
 * @param questionId ID câu hỏi chứa câu trả lời
 * @return Đối tượng mutation (mutate, isPending, error...)
 */
export function useUpdateAnswer(questionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ answerId, input }: { answerId: string; input: UpdateAnswerInput }) =>
      forumApi.updateAnswer({ questionId, answerId, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', questionId] })
    },
  })
}
