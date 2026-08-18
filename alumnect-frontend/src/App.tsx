import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ProtectedRoute, RoleRoute } from '@/components/routing/guards'
import { AppShell, AdminShell, ScrollToTop } from '@/components/layout'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { FeedPage } from '@/pages/app/FeedPage'
import { PostDetailPage } from '@/pages/app/PostDetailPage'
import { AlumniDirectoryPage } from '@/pages/app/AlumniDirectoryPage'
import { JobsPage } from '@/pages/app/JobsPage'
import { EventsPage } from '@/pages/app/EventsPage'
import { ForumPage } from '@/pages/app/ForumPage'
import { QuestionDetailPage } from '@/pages/app/QuestionDetailPage'
import { SalaryPage } from '@/pages/app/SalaryPage'
import { MapPage } from '@/pages/app/MapPage'
import { CareerPage } from '@/pages/app/CareerPage'
import { MessagesPage } from '@/pages/app/MessagesPage'
import { NotificationsPage } from '@/pages/app/NotificationsPage'
import { SubscriptionPage } from '@/pages/app/SubscriptionPage'
import { ProfilePage } from '@/pages/app/ProfilePage'
import { ChangePasswordPage } from '@/pages/app/ChangePasswordPage'
import { AdminOverviewPage, AdminUsersPage, AdminSectionPage, AdminPostsPage, AdminPostDetailPage } from '@/features/admin'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
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
            <Route path="salary" element={<ProtectedRoute><SalaryPage /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
            <Route path="map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="career" element={<ProtectedRoute><CareerPage /></ProtectedRoute>} />
            <Route path="change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          </Route>

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
            <Route path="posts" element={<AdminPostsPage />} />
            <Route path="posts/:id" element={<AdminPostDetailPage />} />
            <Route path="verifications" element={<AdminSectionPage sectionKey="verifications" />} />
            <Route path="reports" element={<AdminSectionPage sectionKey="reports" />} />
            <Route path="revenue" element={<AdminSectionPage sectionKey="revenue" />} />
            <Route path="broadcast" element={<AdminSectionPage sectionKey="broadcast" />} />
            <Route path="moderation" element={<AdminSectionPage sectionKey="moderation" />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
