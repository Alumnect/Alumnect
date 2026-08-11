import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { forumApi } from '../api/forumApi'
import type { CreateQuestionInput, SortOption } from '../model/question'

/**
 * Hook lấy danh sách câu hỏi diễn đàn theo phân trang vô hạn (infinite scroll).
 * Hỗ trợ NHIỀU tiêu chí sắp xếp ưu tiên: mảng `sorts` được ghép bằng dấu phẩy gửi lên backend
 * (VD ['votes','answers'] → "votes,answers"); mảng rỗng mặc định "recent".
 * @param sorts Danh sách tiêu chí sắp xếp theo thứ tự ưu tiên
 * @param topicIds Danh sách ID chủ đề để lọc (tick nhiều), rỗng = tất cả
 * @return Đối tượng query (pages, isLoading, isError, fetchNextPage, hasNextPage...)
 */
export function useQuestions(sorts: SortOption[] = ['recent'], topicIds: number[] = []) {
  const sortParam = sorts.length > 0 ? sorts.join(',') : 'recent'
  // Khóa cache ổn định theo tập chủ đề đã chọn (sắp xếp để thứ tự tick không tạo key khác nhau).
  const topicKey = [...topicIds].sort((a, b) => a - b).join(',')
  return useInfiniteQuery({
    queryKey: ['questions', sortParam, topicKey],
    queryFn: ({ pageParam }) => forumApi.getQuestions({ page: pageParam, sort: sortParam, topicIds }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    // Giữ danh sách cũ hiển thị trong lúc tải bộ lọc/sắp xếp mới -> đổi filter/sort mượt, không chớp skeleton.
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
