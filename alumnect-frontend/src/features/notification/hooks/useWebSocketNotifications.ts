import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { NOTIFICATION_KEYS } from './useNotifications'
import type { NotificationItem } from '../model/types'
import { mentoringRequestApi } from '@/features/mentorship/api/mentoringRequestApi'
import { toast } from '@/components/ui'
import { notificationApi } from '../api/notificationApi'
import { syncQuestionVoteInCache } from '@/features/forum/hooks/useQuestions'
import { syncAnswerVoteInCache } from '@/features/forum/hooks/useAnswers'
import { syncPostLikeInCache } from '@/features/feed/hooks/useToggleLike'

/**
 * Hook lắng nghe WebSocket STOMP kênh `/user/queue/notifications` để nhận thông báo thời gian thực.
 * Cập nhật badge và danh sách trong Notification Center mà không tạo popup nổi.
 */
export function useWebSocketNotifications() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!accessToken) return

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    const wsUrl = apiBase.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '') + '/ws'

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Lắng nghe kênh thông báo cá nhân
        client.subscribe('/user/queue/notifications', (stompMessage) => {
          try {
            const notification = JSON.parse(stompMessage.body) as NotificationItem

            // Cập nhật số chưa đọc trên chuông.
            queryClient.setQueryData<number>(NOTIFICATION_KEYS.unreadCount, (old) => (old ? old + 1 : 1))

            // Nội dung mới chỉ hiển thị trong Notification Center.
            queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })

            // Mọi sự kiện mentoring đều làm mới các màn hình liên quan ngay khi bên kia thao tác.
            if (notification.type.startsWith('MENTORING_')) {
              queryClient.invalidateQueries({
                predicate: (query) => {
                  const rootKey = query.queryKey[0]
                  return typeof rootKey === 'string' && rootKey.startsWith('mentoring')
                },
              })
            }

            // Khi có kết quả xét duyệt nâng cấp Cựu sinh viên (UC08), tự động làm mới trạng thái xác minh và hồ sơ cá nhân
            if (notification.type === 'ALUMNI_VERIFICATION' || notification.targetType === 'ALUMNI_VERIFICATION') {
              queryClient.invalidateQueries({ queryKey: ['verification-request'] })
              queryClient.invalidateQueries({ queryKey: ['user-profile'] })
            }

            if (notification.targetType === 'MENTORING_INCOMING_REQUEST' && notification.targetId) {
              const requestId = Number(notification.targetId)
              if (Number.isInteger(requestId) && requestId > 0) {
                const respond = async (accepted: boolean) => {
                  try {
                    if (accepted) {
                      await mentoringRequestApi.acceptIncomingRequest(requestId)
                      toast.success('Đã nhận yêu cầu Mentoring. Kênh trao đổi đã được mở.')
                    } else {
                      await mentoringRequestApi.declineIncomingRequest(requestId)
                      toast.success('Đã bỏ qua yêu cầu Mentoring.')
                    }
                    await notificationApi.markAsRead(notification.id)
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Không thể xử lý yêu cầu Mentoring')
                  } finally {
                    queryClient.invalidateQueries({
                      predicate: (query) => {
                        const rootKey = query.queryKey[0]
                        return typeof rootKey === 'string' && rootKey.startsWith('mentoring')
                      },
                    })
                    queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
                  }
                }

                toast.notification(
                  notification.content || 'Bạn vừa nhận được một yêu cầu Mentoring mới.',
                  12_000,
                  [
                    { label: 'Nhận', onClick: () => respond(true) },
                    { label: 'Bỏ qua', variant: 'secondary', onClick: () => respond(false) },
                  ],
                )
              }
            }
          } catch (err) {
            console.error('Lỗi phân tích cú pháp thông báo WebSocket:', err)
          }
        })

        // Lắng nghe cập nhật bình chọn (Vote) diễn đàn real-time
        client.subscribe('/topic/forum/votes', (stompMessage) => {
          try {
            const ev = JSON.parse(stompMessage.body) as {
              targetType?: 'QUESTION' | 'ANSWER'
              targetId?: number | string
              questionId?: number | string
              voteCount?: number
              voterId?: number | string
              voted?: boolean
            }
            if (typeof ev.voteCount !== 'number' || ev.targetId == null) return
            const currentUserId = useAuthStore.getState().user?.id
            const isSelf = currentUserId != null && ev.voterId != null && String(currentUserId) === String(ev.voterId)

            if (ev.targetType === 'QUESTION') {
              syncQuestionVoteInCache(queryClient, String(ev.targetId), {
                votes: ev.voteCount,
                ...(isSelf && typeof ev.voted === 'boolean' ? { voted: ev.voted } : {}),
              })
            } else if (ev.targetType === 'ANSWER' && ev.questionId != null) {
              syncAnswerVoteInCache(queryClient, String(ev.questionId), String(ev.targetId), {
                votes: ev.voteCount,
                ...(isSelf && typeof ev.voted === 'boolean' ? { voted: ev.voted } : {}),
              })
            }
          } catch (err) {
            console.error('Lỗi phân tích sự kiện vote WebSocket:', err)
          }
        })

        // Lắng nghe cập nhật lượt thích bài viết bảng tin real-time
        client.subscribe('/topic/feed', (stompMessage) => {
          try {
            const ev = JSON.parse(stompMessage.body) as {
              type?: string
              postId?: number | string
              likeCount?: number
              userId?: number | string
              liked?: boolean
            }
            if (ev.type === 'POST_LIKE' && ev.postId != null && typeof ev.likeCount === 'number') {
              const currentUserId = useAuthStore.getState().user?.id
              const isSelf = currentUserId != null && ev.userId != null && String(currentUserId) === String(ev.userId)
              syncPostLikeInCache(queryClient, String(ev.postId), {
                likes: ev.likeCount,
                ...(isSelf && typeof ev.liked === 'boolean' ? { liked: ev.liked } : {}),
              })
            }
          } catch (err) {
            console.error('Lỗi phân tích sự kiện feed WebSocket:', err)
          }
        })
      },
      onStompError: (frame) => {
        console.error('Lỗi STOMP Notifications:', frame.headers['message'])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate()
      }
    }
  }, [accessToken, queryClient])
}
