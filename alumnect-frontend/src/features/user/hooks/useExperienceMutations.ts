import { useMutation, useQueryClient } from '@tanstack/react-query'
import { experienceApi } from '../api/experienceApi'
import type { ExperienceRequest, PromotionPayload } from '../model/userTypes'

export function useCreateExperience() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExperienceRequest) => experienceApi.createExperience(payload),
    onSuccess: () => {
      invalidateQueries(queryClient)
    },
  })
}

export function useUpdateExperience() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExperienceRequest }) =>
      experienceApi.updateExperience(id, payload),
    onSuccess: () => {
      invalidateQueries(queryClient)
    },
  })
}

export function useDeleteExperience() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => experienceApi.deleteExperience(id),
    onSuccess: () => {
      invalidateQueries(queryClient)
    },
  })
}

export function usePromoteExperience() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PromotionPayload }) =>
      experienceApi.promoteExperience(id, payload),
    onSuccess: () => {
      invalidateQueries(queryClient)
    },
  })
}

function invalidateQueries(queryClient: any) {
  queryClient.invalidateQueries({ queryKey: ['experiences'] })
  queryClient.invalidateQueries({ queryKey: ['user-profile'] })
  queryClient.invalidateQueries({ queryKey: ['alumni-map'] })
  queryClient.invalidateQueries({ queryKey: ['career-paths'] })
  queryClient.invalidateQueries({ queryKey: ['career-path-detail'] })
}
