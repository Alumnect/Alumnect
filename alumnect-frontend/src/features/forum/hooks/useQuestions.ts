import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { forumApi } from '../api/forumApi'
import type { VoteResult } from '../api/forumApi'
import type { CreateQuestionInput, SortOption, UpdateQuestionInput } from '../model/question'

/**
 * Hook lấy danh sách câu hỏi diễn đàn theo phân trang vô hạn (infinite scroll).
 * Hỗ trợ NHIỀU tiêu chí sắp xếp ưu tiên: mảng `sorts` được ghép bằng dấu phẩy gửi lên backend
 * (VD ['votes','answers'] → "votes,answers"); mảng rỗng mặc định "recent".
 * Hỗ trợ tìm kiếm theo từ khóa (UC44 - Search questions) — độc lập với sắp xếp/lọc chủ đề/ngành.
 * @param sorts Danh sách tiêu chí sắp xếp theo thứ tự ưu tiên
 * @param topicIds Danh sách ID thể loại để lọc (tick nhiều), rỗng = tất cả
 * @param majorIds Danh sách ID ngành để lọc (tick nhiều), rỗng = tất cả — độc lập với thể loại
 * @param keyword Từ khóa tìm kiếm (đã debounce phía Component), rỗng = không tìm kiếm
 * @return Đối tượng query (pages, isLoading, isError, fetchNextPage, hasNextPage...)
 */
export function useQuestions(sorts: SortOption[] = ['recent'], topicIds: number[] = [], majorIds: number[] = [], keyword: string = '') {
  const sortParam = sorts.length > 0 ? sorts.join(',') : 'recent'
  // Khóa cache ổn định theo tập đã chọn (sắp xếp để thứ tự tick không tạo key khác nhau).
  const topicKey = [...topicIds].sort((a, b) => a - b).join(',')
  const majorKey = [...majorIds].sort((a, b) => a - b).join(',')
  const keywordKey = keyword.trim().toLowerCase()
  return useInfiniteQuery({
    queryKey: ['questions', sortParam, topicKey, majorKey, keywordKey],
    queryFn: ({ pageParam }) => forumApi.getQuestions({ page: pageParam, sort: sortParam, keyword: keywordKey, topicIds, majorIds }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    // Giữ danh sách cũ hiển thị trong lúc tải bộ lọc/sắp xếp/từ khóa mới -> đổi mượt, không chớp skeleton.
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook lấy chi tiết một câu hỏi theo id (UC39 - View question detail).
 * Bọc `useQuery`: tự cache theo id, quản lý loading/error. Không tự động thử lại khi 404
 * (câu hỏi không tồn tại/bị ẩn) để hiển thị ngay trạng thái "không tìm thấy".
 * @param id ID câu hỏi (undefined/null khi chưa có → không gọi API)
 * @return Đối tượng query (data, isLoading, isError, error, refetch...)
 */
export function useQuestionDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['question', id],
    queryFn: () => forumApi.getQuestionById(id as string),
    enabled: !!id,
    retry: false,
  })
}

/**
 * Hook lấy danh mục chủ đề diễn đàn (cho bộ lọc). Dữ liệu ít thay đổi nên cache lâu.
 * @return Đối tượng query chứa danh sách chủ đề
 */
export function useTopics() {
  return useQuery({
    queryKey: ['forum-topics'],
    queryFn: () => forumApi.getTopics(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook đặt một câu hỏi mới (UC40 - Ask a question). Bọc `useMutation`; khi thành công
 * làm mới cache danh sách câu hỏi (['questions']) để câu vừa đăng xuất hiện.
 * @return Đối tượng mutation (mutate, isPending, error...)
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateQuestionInput) => forumApi.createQuestion(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

/**
 * Hook chỉnh sửa một câu hỏi (UC46 - Edit a question). Bọc `useMutation`; khi thành công làm mới
 * cả cache danh sách (['questions']) lẫn cache chi tiết câu hỏi vừa sửa (['question', id]).
 * @param id ID câu hỏi cần sửa
 * @return Đối tượng mutation (mutate, isPending, error...)
 */
export function useUpdateQuestion(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateQuestionInput) => forumApi.updateQuestion({ id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({ queryKey: ['question', id] })
    },
  })
}

/**
 * Hook xóa (mềm) một câu hỏi (UC47 - Delete a question). Bọc `useMutation`; khi thành công làm mới
 * cache danh sách (['questions']) và cache chi tiết câu hỏi vừa xóa (['question', id]).
 * @return Đối tượng mutation (mutate, isPending, error...)
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => forumApi.deleteQuestion(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({ queryKey: ['question', id] })
    },
  })
}

/**
 * Hook bình chọn/bỏ bình chọn một câu hỏi (UC42 - Vote on a question).
 *
 * Bọc `useMutation` của TanStack Query: chọn endpoint theo cờ `vote`
 * (POST /vote khi bình chọn, DELETE /vote khi bỏ bình chọn) và trả về trạng thái
 * bình chọn mới do backend xác nhận ({ voted, voteCount }).
 *
 * UI dùng cập nhật lạc quan (optimistic) cục bộ ở component — cùng pattern với
 * `useToggleLike` (UC17): đổi trạng thái ngay khi bấm, đồng bộ theo `onSuccess`,
 * hoàn tác (rollback) ở `onError`. Hook không tự invalidate cache danh sách/chi tiết.
 *
 * @return Đối tượng mutation (mutate, isPending, ...) nhận `{ questionId, vote }`
 */
export function useToggleVoteQuestion() {
  return useMutation<VoteResult, Error, { questionId: string; vote: boolean }>({
    mutationFn: ({ questionId, vote }) => (vote ? forumApi.voteQuestion(questionId) : forumApi.unvoteQuestion(questionId)),
  })
}
