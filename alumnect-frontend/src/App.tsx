import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ProtectedRoute, RoleRoute } from '@/components/routing/guards'
import { AppShell, AdminShell, ScrollToTop } from '@/components/layout'
import { SectionTransition } from '@/components/layout/SectionTransition'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { FeedPage } from '@/pages/app/FeedPage'
import { ToastContainer } from '@/components/ui'
import { lazyPage, lazyDefaultPage } from '@/lib/lazyPage'

const LoginPage = lazyPage(() => import('@/pages/auth/LoginPage'), 'LoginPage')
const RegisterPage = lazyPage(() => import('@/pages/auth/RegisterPage'), 'RegisterPage')
const ForgotPasswordPage = lazyPage(() => import('@/pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage')
const PostDetailPage = lazyPage(() => import('@/pages/app/PostDetailPage'), 'PostDetailPage')
const AlumniDirectoryPage = lazyPage(() => import('@/pages/app/AlumniDirectoryPage'), 'AlumniDirectoryPage')
const JobsPage = lazyPage(() => import('@/pages/app/JobsPage'), 'JobsPage')
const EventsPage = lazyPage(() => import('@/pages/app/EventsPage'), 'EventsPage')
const GroupsPage = lazyPage(() => import('@/pages/app/GroupsPage'), 'GroupsPage')
const GroupDetailPage = lazyPage(() => import('@/pages/app/GroupDetailPage'), 'GroupDetailPage')
const GroupPostDetailPage = lazyPage(() => import('@/pages/app/GroupPostDetailPage'), 'GroupPostDetailPage')
const ForumPage = lazyPage(() => import('@/pages/app/ForumPage'), 'ForumPage')
const QuestionDetailPage = lazyPage(() => import('@/pages/app/QuestionDetailPage'), 'QuestionDetailPage')
const SalaryPage = lazyPage(() => import('@/pages/app/SalaryPage'), 'SalaryPage')
const MapPage = lazyPage(() => import('@/pages/app/MapPage'), 'MapPage')
const CareerPage = lazyPage(() => import('@/pages/app/CareerPage'), 'CareerPage')
const MessagesPage = lazyPage(() => import('@/pages/app/MessagesPage'), 'MessagesPage')
const NotificationsPage = lazyPage(() => import('@/pages/app/NotificationsPage'), 'NotificationsPage')
const ProfilePage = lazyPage(() => import('@/pages/app/ProfilePage'), 'ProfilePage')
const ChangePasswordPage = lazyPage(() => import('@/pages/app/ChangePasswordPage'), 'ChangePasswordPage')
const MentoringHomePage = lazyPage(() => import('@/pages/app/MentoringHomePage'), 'MentoringHomePage')
const MentorEarningsPage = lazyPage(() => import('@/pages/app/MentorEarningsPage'), 'MentorEarningsPage')
const MentoringRefundsPage = lazyPage(() => import('@/pages/app/MentoringRefundsPage'), 'MentoringRefundsPage')
const MentoringTermsPage = lazyPage(() => import('@/pages/app/MentoringTermsPage'), 'MentoringTermsPage')
const BecomeMentorPage = lazyPage(() => import('@/pages/app/BecomeMentorPage'), 'BecomeMentorPage')
const MentorSubscriptionPage = lazyPage(() => import('@/pages/app/MentorSubscriptionPage'), 'MentorSubscriptionPage')
const MentorStatusPage = lazyPage(() => import('@/pages/app/MentorStatusPage'), 'MentorStatusPage')
const MentorRankingPage = lazyPage(() => import('@/pages/app/MentorRankingPage'), 'MentorRankingPage')
const MentorDiscoverPage = lazyPage(() => import('@/pages/app/MentorDiscoverPage'), 'MentorDiscoverPage')
const MentorDetailPage = lazyPage(() => import('@/pages/app/MentorDetailPage'), 'MentorDetailPage')
const CreateMentoringRequestPage = lazyPage(() => import('@/pages/app/CreateMentoringRequestPage'), 'CreateMentoringRequestPage')
const CreateDirectMentoringRequestPage = lazyPage(() => import('@/pages/app/CreateDirectMentoringRequestPage'), 'CreateDirectMentoringRequestPage')
const MyMentoringRequestsPage = lazyPage(() => import('@/pages/app/MyMentoringRequestsPage'), 'MyMentoringRequestsPage')
const MentoringRequestDetailPage = lazyPage(() => import('@/pages/app/MentoringRequestDetailPage'), 'MentoringRequestDetailPage')
const IncomingMentoringRequestsPage = lazyDefaultPage(() => import('@/pages/app/IncomingMentoringRequestsPage'))
const IncomingMentoringRequestDetailPage = lazyDefaultPage(() => import('@/pages/app/IncomingMentoringRequestDetailPage'))
const MentoringDealsPage = lazyPage(() => import('@/pages/app/MentoringDealsPage'), 'MentoringDealsPage')
const MentoringChatPage = lazyPage(() => import('@/pages/app/MentoringChatPage'), 'MentoringChatPage')
const MentoringMessagesPage = lazyPage(() => import('@/pages/app/MentoringMessagesPage'), 'MentoringMessagesPage')
const MyMentoringTasksPage = lazyPage(() => import('@/pages/app/MyMentoringTasksPage'), 'MyMentoringTasksPage')
const MentoringTaskDetailPage = lazyPage(() => import('@/pages/app/MentoringTaskDetailPage'), 'MentoringTaskDetailPage')
const MentoringGroupsPage = lazyPage(() => import('@/pages/app/MentoringGroupsPage'), 'MentoringGroupsPage')
const MentoringGroupDetailPage = lazyPage(() => import('@/pages/app/MentoringGroupDetailPage'), 'MentoringGroupDetailPage')
const AdminOverviewPage = lazyPage(() => import('@/features/admin'), 'AdminOverviewPage')
const AdminUsersPage = lazyPage(() => import('@/features/admin'), 'AdminUsersPage')
const AdminSectionPage = lazyPage<'AdminSectionPage', { sectionKey: string }>(() => import('@/features/admin'), 'AdminSectionPage')
const AdminPostsPage = lazyPage(() => import('@/features/admin'), 'AdminPostsPage')
const AdminPostDetailPage = lazyPage(() => import('@/features/admin'), 'AdminPostDetailPage')
const AdminBroadcastPage = lazyPage(() => import('@/features/admin'), 'AdminBroadcastPage')
const AdminMentorPackagesPage = lazyPage(() => import('@/features/admin'), 'AdminMentorPackagesPage')
const AdminMentoringTicketsPage = lazyPage(() => import('@/features/admin'), 'AdminMentoringTicketsPage')
const AdminMentoringFinancesPage = lazyPage(() => import('@/features/admin'), 'AdminMentoringFinancesPage')
const AdminRevenuePage = lazyPage(() => import('@/features/admin'), 'AdminRevenuePage')

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer />
      <BrowserRouter>
        <ScrollToTop />
        <SectionTransition>
          {(location) => (
        <Routes location={location}>
          {/* Trang chủ mở thẳng vào app ở chế độ khách (đã bỏ landing page) */}
          <Route path="/" element={<Navigate to="/app" replace />} />

          {/* Auth (full-screen, own scaffold) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />


          <Route
            path="/app"
            element={<AppShell />}
          >
            {/* --- PUBLIC ROUTES (No login required) --- */}
            <Route index element={<FeedPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="posts/:id" element={<PostDetailPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="forum" element={<ForumPage />} />
            <Route path="forum/:id" element={<QuestionDetailPage />} />
            <Route path="alumni" element={<AlumniDirectoryPage />} />

            {/* --- PROTECTED ROUTES (Login required) --- */}
            <Route path="saved" element={<Navigate to="/app/profile?tab=saved" replace />} />
            <Route path="groups" element={<RoleRoute role="ALUMNI"><GroupsPage /></RoleRoute>} />
            <Route path="groups/:id" element={<RoleRoute role="ALUMNI"><GroupDetailPage /></RoleRoute>} />
            <Route path="groups/:groupId/posts/:postId" element={<RoleRoute role="ALUMNI"><GroupPostDetailPage /></RoleRoute>} />
            <Route path="salary" element={<ProtectedRoute><SalaryPage /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="career" element={<ProtectedRoute><CareerPage /></ProtectedRoute>} />
            <Route path="change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
            <Route path="mentoring" element={<ProtectedRoute><MentoringHomePage /></ProtectedRoute>} />
            <Route path="mentoring/terms" element={<ProtectedRoute><MentoringTermsPage /></ProtectedRoute>} />
            <Route path="mentoring/deals" element={<ProtectedRoute><MentoringDealsPage /></ProtectedRoute>} />
            <Route path="mentoring/tasks" element={<ProtectedRoute><MyMentoringTasksPage /></ProtectedRoute>} />
            <Route path="mentoring/tasks/:id" element={<ProtectedRoute><MentoringTaskDetailPage /></ProtectedRoute>} />
            <Route path="mentoring/chats/:conversationId" element={<ProtectedRoute><MentoringChatPage /></ProtectedRoute>} />
            <Route path="mentoring/messages" element={<ProtectedRoute><MentoringMessagesPage /></ProtectedRoute>} />
            <Route path="mentoring/groups" element={<ProtectedRoute><MentoringGroupsPage /></ProtectedRoute>} />
            <Route path="mentoring/groups/:id" element={<ProtectedRoute><MentoringGroupDetailPage /></ProtectedRoute>} />
            <Route path="mentoring/become-mentor" element={<ProtectedRoute><BecomeMentorPage /></ProtectedRoute>} />
            <Route path="mentoring/packages" element={<ProtectedRoute><MentorSubscriptionPage /></ProtectedRoute>} />
            <Route path="mentoring/subscription" element={<ProtectedRoute><MentorSubscriptionPage /></ProtectedRoute>} />
            <Route path="mentoring/status" element={<ProtectedRoute><MentorStatusPage /></ProtectedRoute>} />
            <Route path="mentoring/earnings" element={<ProtectedRoute><MentorEarningsPage /></ProtectedRoute>} />
            <Route path="mentoring/refunds" element={<ProtectedRoute><MentoringRefundsPage /></ProtectedRoute>} />
            <Route path="mentoring/my-status" element={<Navigate to="/app/mentoring/status" replace />} />
            <Route path="mentoring/ranking" element={<ProtectedRoute><MentorRankingPage /></ProtectedRoute>} />
            <Route path="mentoring/discover" element={<ProtectedRoute><MentorDiscoverPage /></ProtectedRoute>} />
            <Route path="mentoring/search" element={<Navigate to="/app/mentoring/discover" replace />} />
            <Route path="mentoring/mentors/:id" element={<ProtectedRoute><MentorDetailPage /></ProtectedRoute>} />
            <Route path="mentors/:id" element={<ProtectedRoute><MentorDetailPage /></ProtectedRoute>} />
            <Route path="mentors" element={<Navigate to="/app/mentoring/discover" replace />} />
            <Route path="mentoring/requests" element={<ProtectedRoute><MyMentoringRequestsPage /></ProtectedRoute>} />
            <Route path="mentoring/requests/:id" element={<ProtectedRoute><MentoringRequestDetailPage /></ProtectedRoute>} />
            <Route path="mentoring/requests/create" element={<ProtectedRoute><CreateMentoringRequestPage /></ProtectedRoute>} />
            <Route path="mentoring/mentors/:mentorId/request" element={<ProtectedRoute><CreateDirectMentoringRequestPage /></ProtectedRoute>} />
            <Route path="mentors/:mentorId/request" element={<ProtectedRoute><CreateDirectMentoringRequestPage /></ProtectedRoute>} />
            <Route path="mentoring/incoming-requests" element={<ProtectedRoute><IncomingMentoringRequestsPage /></ProtectedRoute>} />
            <Route path="mentoring/incoming-requests/:id" element={<ProtectedRoute><IncomingMentoringRequestDetailPage /></ProtectedRoute>} />
            <Route path="mentoring/requests/incoming" element={<Navigate to="/app/mentoring/incoming-requests" replace />} />
            <Route path="mentoring/requests/incoming/:id" element={<ProtectedRoute><IncomingMentoringRequestDetailPage /></ProtectedRoute>} />
            <Route path="mentoring/requests/manage" element={<Navigate to="/app/mentoring/incoming-requests" replace />} />
          </Route>

          {/* Direct redirect for /mentoring */}
          <Route path="/mentoring/*" element={<Navigate to="/app/mentoring" replace />} />

          {/* Admin console */}
          <Route
            path="/admin"
            element={
              <RoleRoute role="ADMIN">
                <AdminShell />
              </RoleRoute>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="mentor-packages" element={<AdminMentorPackagesPage />} />
            <Route path="mentoring-tickets" element={<AdminMentoringTicketsPage />} />
            <Route path="mentoring-finances" element={<AdminMentoringFinancesPage />} />
            <Route path="posts" element={<AdminPostsPage />} />
            <Route path="posts/:id" element={<AdminPostDetailPage />} />
            <Route path="verifications" element={<AdminSectionPage sectionKey="verifications" />} />
            <Route path="reports" element={<AdminSectionPage sectionKey="reports" />} />
            <Route path="revenue" element={<AdminRevenuePage />} />
            <Route path="broadcast" element={<AdminBroadcastPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
          )}
        </SectionTransition>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
