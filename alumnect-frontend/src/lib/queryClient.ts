import { QueryClient } from '@tanstack/react-query'

/** Shared TanStack Query client (stale-while-revalidate defaults). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
})
