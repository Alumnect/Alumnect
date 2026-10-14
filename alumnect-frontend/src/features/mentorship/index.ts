/**
 * Barrel file xuất khẩu các thành phần chính của Feature Mentorship (Hướng dẫn & Hỗ trợ).
 */
export * from './model/mentoringTermsTypes'
export * from './constants/mentoringTerms'
export * from './api/mentoringTermsApi'
export * from './hooks/useMentoringTerms'
export * from './components/MentoringTerms'
export * from './components/MentoringTermsContent'
export * from './components/MentoringTermsGate'
export * from './components/MentorshipLoadingSkeleton'

// UC91 exports
export * from './model/mentorRegistrationTypes'
export * from './api/mentorRegistrationApi'
export * from './hooks/useMentorRegistration'
export * from './components/MentorRegistrationForm'
export * from './components/MentorPersonalInfoSection'
export * from './components/MentorProfessionalSection'
export * from './components/MentorMentoringSection'
export * from './components/MentorCvSection'
export * from './components/MentorPayoutBankSection'
export * from './components/MentorCvAndBankSection'

// UC92 exports (Xem & chọn gói Mentor)
export * from './model/mentorSubscriptionTypes'
export * from './api/mentorSubscriptionApi'
export * from './hooks/useMentorSubscription'
export * from './components/MentorSubscriptionCard'
export * from './components/MentorSubscriptionList'

// UC93 exports (Thanh toán gói Mentor qua PayOS)
export * from './model/mentorPaymentTypes'
export * from './api/mentorPaymentApi'
export * from './hooks/useMentorPayment'
export * from './components/MentorPaymentQrCard'
export * from './components/MentorPaymentSuccessCard'
export * from './components/MentorPaymentFailedCard'
export * from './components/MentorPaymentCheckout'

// UC94 exports (Xem trạng thái Mentor & Subscription)
export * from './model/mentorStatusTypes'
export * from './api/mentorStatusApi'
export * from './components/MentorshipLayout'
export * from './components/MentorshipSidebar'
export * from './hooks/useMentorStatus'
export * from './components/MentorStatusHero'
export * from './components/MentorRequirementChecklist'
export * from './components/MentorSubscriptionSummaryCard'
export * from './components/MentorStatusDashboard'

// UC97 exports (Xem bảng xếp hạng Mentor)
export * from './model/mentorRankingTypes'
export * from './api/mentorRankingApi'
export * from './hooks/useMentorRanking'
export * from './components/MentorRankingHeader'
export * from './components/MentorFieldSelector'
export * from './components/MentorRankingCard'
export * from './components/MentorRankingPodium'
export * from './components/MentorRankingList'

// UC98 exports (Tìm kiếm & lọc Mentor)
export * from './model/mentorSearchTypes'
export * from './api/mentorSearchApi'
export * from './hooks/useMentorSearch'
export * from './components/MentorCard'
export * from './components/MentorSearchHeader'
export * from './components/MentorFilterBar'
export * from './components/MentorDirectoryList'

// UC99 exports (Xem chi tiết Mentor)
export * from './model/mentorDetailTypes'
export * from './api/mentorDetailApi'
export * from './hooks/useMentorDetail'
export * from './components/MentorProfileHeader'
export * from './components/MentorAboutSection'
export * from './components/MentorExpertiseSection'
export * from './components/MentorExperienceTimeline'
export * from './components/MentorAchievementsCard'
export * from './components/MentorRequestActionCard'
export * from './components/MentorDetailSkeleton'
export * from './components/MentorDetailErrorState'

// UC100 exports (Tạo yêu cầu Mentoring chung)
export * from './model/mentoringRequestTypes'
export * from './model/mentoringRequestSchema'
export * from './api/mentoringRequestApi'
export * from './hooks/useCreateMentoringRequest'
export * from './components/CreateMentoringRequestForm'
export * from './components/RequestSuccessModal'

// UC101 exports (Chọn Mentor & Gửi yêu cầu cố vấn trực tiếp)
export * from './components/SelectedMentorCard'

// UC102 exports (Xem phản hồi yêu cầu Mentoring)
export * from './hooks/useMyMentoringRequests'
export * from './hooks/useMentoringRequestDetail'
export * from './components/RequestStatusBadge'
export * from './components/RequestResponseSummaryCard'
export * from './components/MentorResponseCard'
export * from './components/MyRequestCard'

// UC103 exports (Xem & Phản hồi yêu cầu Mentoring cho Mentor)
export * from './hooks/useIncomingMentoringRequests'
export * from './hooks/useIncomingMentoringRequestDetail'
export * from './hooks/useRespondIncomingRequest'
export * from './components/IncomingRequestCard'
export * from './components/IncomingRequestResponseModal'

// UC104 exports (Thỏa thuận & xác nhận Mentoring Deal)
export * from './model/mentoringDealTypes'
export * from './api/mentoringDealApi'
export * from './hooks/useMentoringDeals'
export * from './components/MentoringDealBadge'
export * from './components/MentoringDealSnapshotCard'
export * from './components/MentoringDealHistoryTimeline'
export * from './components/MentoringDealFormModal'
export * from './components/MentoringDealActionModal'
export * from './components/MentoringDealCard'
export * from './components/MentoringChatForTask'
export * from './components/MentoringTaskDetailModal'
export * from './model/mentoringConversationTypes'
export * from './model/mentoringFlowLabels'
export * from './api/mentoringConversationApi'
export * from './hooks/useMentoringConversation'
export * from './components/MentoringTicketDetailModal'
export * from './components/MentoringDiscordTicketEmbed'
export * from './components/MentoringAdjustmentTicketEmbed'
export * from './model/mentoringAdjustmentTypes'

// UC105 exports (Thanh toán Mentoring Task)
export * from './model/mentoringTaskTypes'
export * from './api/mentoringTaskApi'
export * from './hooks/useMentoringTasks'
export * from './components/MentoringTaskPaymentModal'
export * from './components/MentoringTaskBadge'

// UC106 & UC107 exports (Xem, quản lý Mentoring Task & Work Log)
export * from './components/MentoringTaskStageProgressBar'
export * from './components/MentoringTaskCard'
export * from './components/MentoringTaskOverviewCard'
export * from './components/MentoringTaskParticipantsCard'
export * from './components/MentoringTaskDealSection'
export * from './components/MentoringTaskPaymentCard'
export * from './components/MentoringWorkLogList'
export * from './components/MentoringWorkLogModal'
export * from './components/MentoringTaskHistoryTimeline'

// Cả UC100 và UC104 đều khai báo type MentoringTaskType với tập giá trị khác nhau -> chỉ định rõ để tránh xung đột
export type { MentoringTaskType } from './model/mentoringDealTypes'
export type { MentoringTaskType as MentoringRequestTaskType } from './model/mentoringRequestTypes'

// UC109 exports (Thỏa thuận gia hạn hoặc xử lý Task chưa hoàn thành)
export * from './hooks/useMentoringTaskResolutions'
export * from './components/MentoringDeadlineExtensionModal'
export * from './components/MentoringTaskAmendmentModal'
export * from './components/MentoringSettlementProposalModal'
export * from './components/MentoringTaskResolutionBanner'

// UC110 exports (Gửi & xác nhận hoàn thành Task)
export * from './hooks/useMentoringTaskCompletion'
export * from './components/MentoringTaskCompletionModal'
export * from './components/MentoringTaskReviewModal'

// UC111 exports (Gửi Settlement Ticket đã thỏa thuận lên Admin)
export * from './hooks/useMentoringTickets'
export * from './components/MentoringSubmitSettlementTicketModal'

// UC112 exports (Mở Dispute Ticket khiếu nại tranh chấp)
export * from './components/MentoringCreateDisputeModal'

// UC113 exports (Gửi bằng chứng tranh chấp)
export * from './components/MentoringAddEvidenceModal'

// UC114 exports (Xem báo cáo kết quả Task & trạng thái thanh toán)
export * from './components/MentoringTaskReportModal'


