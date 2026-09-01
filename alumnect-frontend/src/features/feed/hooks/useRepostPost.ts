import { useMutation, useQueryClient } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'

export function useRepostPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content?: string | null }) =>
      feedApi.repostPost(postId, content),
    onSuccess: () => {
      // Refresh feed to show the newly reposted item at the top
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
